"use client"

import { useRef, useEffect, useCallback } from 'react';

const LetterGlitch = ({
  glitchColors = ['#2b4539', '#61dca3', '#61b3dc'],
  glitchSpeed = 50,
  centerVignette = false,
  outerVignette = true,
  smooth = true,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789'
}: {
  glitchColors?: string[];
  glitchSpeed?: number;
  centerVignette?: boolean;
  outerVignette?: boolean;
  smooth?: boolean;
  characters?: string;
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const dropsRef = useRef<number[]>([]);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  const fontSize = 16;

  const initDrops = (columns: number) => {
    // Start each column at a random row so they don't all start at the top at once
    dropsRef.current = Array.from({ length: columns }, () =>
      Math.floor(Math.random() * -50)
    );
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    if (contextRef.current) {
      contextRef.current.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const columns = Math.ceil(rect.width / fontSize);
    initDrops(columns);
  };

  // getRandomChar is defined inside useCallback so it never appears in the
  // dependency array — it closes over `characters` which IS a dep of the callback.
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    // Inlined so this closure is the only consumer; avoids an unstable dep warning.
    const lettersAndSymbols = Array.from(characters);
    const getRandomChar = () =>
      lettersAndSymbols[Math.floor(Math.random() * lettersAndSymbols.length)];

    const { width, height } = canvas.getBoundingClientRect();

    // Semi-transparent overlay creates the fading trail effect
    ctx.fillStyle = smooth ? 'rgba(0, 0, 0, 0.05)' : 'rgba(0, 0, 0, 0.1)';
    ctx.fillRect(0, 0, width, height);

    ctx.font = `${fontSize}px monospace`;

    const columns = Math.ceil(width / fontSize);

    for (let i = 0; i < columns; i++) {
      const char = getRandomChar();
      const x = i * fontSize;
      const y = dropsRef.current[i] * fontSize;

      // Leading character is bright white/green
      if (y > 0 && y < height) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText(char, x, y);

        // Characters just behind the leading one get the primary glitch color
        if (y - fontSize > 0) {
          const trailChar = getRandomChar();
          ctx.fillStyle = glitchColors[0] || '#61dca3';
          ctx.globalAlpha = 0.8;
          ctx.fillText(trailChar, x, y - fontSize);
          ctx.globalAlpha = 1;
        }
      }

      // Trail characters in the column's color
      const trailLength = 8 + Math.floor(Math.random() * 12);
      for (let j = 2; j < trailLength; j++) {
        const trailY = y - j * fontSize;
        if (trailY > 0 && trailY < height) {
          const trailChar = getRandomChar();
          const colorIndex = j % glitchColors.length;
          const alpha = Math.max(0.1, 1 - (j / trailLength));
          ctx.globalAlpha = alpha;
          ctx.fillStyle = glitchColors[colorIndex];
          ctx.fillText(trailChar, x, trailY);
        }
      }
      ctx.globalAlpha = 1;

      // Move drop down
      dropsRef.current[i]++;

      // Reset drop to top with some randomness when it goes off screen
      if (dropsRef.current[i] * fontSize > height && Math.random() > 0.975) {
        dropsRef.current[i] = Math.floor(Math.random() * -20);
      }
    }
  }, [smooth, glitchColors, fontSize, characters]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    contextRef.current = canvas.getContext('2d');
    resizeCanvas();

    // Fill initial background
    const ctx = contextRef.current;
    if (ctx) {
      const { width, height } = canvas.getBoundingClientRect();
      ctx.fillStyle = '#030712'; // gray-950 equivalent
      ctx.fillRect(0, 0, width, height);
    }

    let lastTime = 0;
    const interval = glitchSpeed;

    const animate = (time: number) => {
      if (time - lastTime >= interval) {
        draw();
        lastTime = time;
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        resizeCanvas();
      }, 100);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [glitchSpeed, smooth, draw]);

  return (
    <div className="relative w-full h-full bg-gray-950 overflow-hidden">
      <canvas ref={canvasRef} className="block w-full h-full" />
      {outerVignette && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-[radial-gradient(circle,_rgba(0,0,0,0)_60%,_rgba(0,0,0,1)_100%)]"></div>
      )}
      {centerVignette && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none bg-[radial-gradient(circle,_rgba(0,0,0,0.8)_0%,_rgba(0,0,0,0)_60%)]"></div>
      )}
    </div>
  );
};

export default LetterGlitch;
