import type { Config } from "tailwindcss";

// The detective-mockup grain: a tiny fractal-noise SVG, inlined so it costs no
// request. Percent signs are escaped (%25) because this lives inside a url().
const GRAIN =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='140' height='140'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix type='matrix' values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.05 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        surface: "var(--surface)",
        border: "var(--border)",
        text: "var(--text)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        "accent-fg": "var(--accent-fg)",

        // ─── Detective classroom palette (from the mockup's :root) ───
        // Fixed hex, not theme vars: these surfaces are a painted set piece
        // (chalkboard, cork, walnut, brass) and must not flip with the theme.
        chalkboard: {
          DEFAULT: "#17342a",
          mid: "#204a3a",
          deep: "#0d2118",
        },
        walnut: {
          DEFAULT: "#3b2a1c",
          light: "#5a4029",
          deep: "#1c1209",
        },
        brass: {
          DEFAULT: "#c9a24b",
          bright: "#f0cf8a",
          deep: "#8a6b28",
        },
        chalk: "#f7f2e7",
        amber: "#e8a545",
        note: "#f6efdc",
        cork: {
          // --cm-cork was never defined; the token is --cm-cork-base. An
          // undefined var() made bg-cork invalid, so the corkboard rendered
          // with no background and the chalkboard showed through it.
          DEFAULT: "var(--cm-cork-base)",
          dark: "var(--cm-cork-dark)",
          deep: "#8b5c30",
        },
        paper: {
          DEFAULT: "#ecdfc0",
          locked: "var(--cm-paper-locked)",
          clear: "var(--cm-paper-clear)",
          active: "var(--cm-paper-active)",
        },
        ink: {
          DEFAULT: "var(--cm-ink)",
          soft: "var(--cm-ink-soft)",
        },
        thread: {
          live: "var(--cm-thread-live)",
          dead: "var(--cm-thread-dead)",
        },
        nav: {
          wood: "var(--cm-nav-wood)",
          rule: "var(--cm-nav-rule)",
        },
        "ink-red": {
          DEFAULT: "#7a2e28",
          bright: "#a5453a",
        },
        moss: {
          DEFAULT: "#46664a",
          bright: "#6d8f6f",
        },
        slate: {
          DEFAULT: "#3d4a6b",
          bright: "#6b7a9e",
        },
        cleared: "#2f7a3d",
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        // Backed by next/font vars from lib/detective-fonts.ts — apply the
        // font variables to an ancestor (detectiveFontVariables) to use these.
        chalk: ["var(--font-kalam)", "cursive"],
        type: ["var(--font-special-elite)", "cursive"],
        courier: ["var(--font-courier)", "monospace"],
      },
      backgroundImage: {
        grain: GRAIN,
      },
      keyframes: {
        // ─── Landing hero ───
        codeFloat: {
          "0%, 100%": { transform: "translateY(0) rotate(var(--r, 0deg))", opacity: "0.7" },
          "50%": { transform: "translateY(-16px) rotate(var(--r, 0deg))", opacity: "1" },
        },
        blink: {
          "50%": { opacity: "0" },
        },

        // ─── Clearance boards (skill page) ───
        boardIn: {
          from: { opacity: "0", transform: "rotate(0deg) translateY(-18px) scale(.97)" },
          to: { opacity: "1", transform: "rotate(var(--tilt, 0deg))" },
        },
        frameThud: {
          "0%": { transform: "translateY(0)" },
          "28%": { transform: "translateY(4px)" },
          "60%": { transform: "translateY(-2px)" },
          "82%": { transform: "translateY(1px)" },
          "100%": { transform: "translateY(0)" },
        },
        pinDrop: {
          "0%": { opacity: "0", transform: "translateY(-200px) scale(.86)" },
          "10%": { opacity: "1" },
          "46%": {
            transform: "translateY(0) scale(1.12)",
            boxShadow:
              "0 0 16px rgba(217,115,106,0.75), 0 4px 6px rgba(0,0,0,0.55), inset 0 -2px 3px rgba(0,0,0,0.35)",
          },
          "58%": { transform: "translateY(-14px) scale(.96)" },
          "72%": { transform: "translateY(0) scale(1.07)" },
          "84%": { transform: "translateY(-5px) scale(.99)" },
          "94%": { transform: "translateY(0) scale(1.03)" },
          "100%": { transform: "translateY(0) scale(1)" },
        },
        stringPull: {
          from: { transform: "rotate(-.5deg) scaleX(0)", opacity: "0" },
          to: { transform: "rotate(-.5deg) scaleX(1)", opacity: ".5" },
        },

        // ─── Mission board (level select) ───
        // --place is the centring translate; it collapses to none in the
        // mobile flow fallback, so it stays a variable rather than a literal.
        dropIn: {
          from: {
            opacity: "0",
            transform: "var(--place) rotate(var(--tilt, 0deg)) translateY(-14px) scale(.92)",
          },
          to: { opacity: "1", transform: "var(--place) rotate(var(--tilt, 0deg))" },
        },
        pinPulse: {
          "0%, 100%": { boxShadow: "0 4px 6px rgba(0,0,0,0.6)" },
          "50%": { boxShadow: "0 0 13px rgba(232,131,122,0.9), 0 4px 6px rgba(0,0,0,0.6)" },
        },
        shake: {
          "0%, 100%": { transform: "var(--place) rotate(var(--tilt, 0deg)) translateX(0)" },
          "25%": { transform: "var(--place) rotate(var(--tilt, 0deg)) translateX(-5px)" },
          "75%": { transform: "var(--place) rotate(var(--tilt, 0deg)) translateX(5px)" },
        },
      },
      animation: {
        codeFloat: "codeFloat 8s ease-in-out infinite",
        blink: "blink 1.1s step-end infinite",
        boardIn: "boardIn .5s cubic-bezier(.2,.9,.3,1) backwards",
        frameThud: "frameThud .5s cubic-bezier(.25,.9,.3,1) backwards",
        pinDrop: "pinDrop .8s cubic-bezier(.3,.05,.3,1) backwards",
        stringPull: "stringPull .6s ease-out backwards",
        dropIn: "dropIn .5s cubic-bezier(.2,.9,.3,1) backwards",
        pinPulse: "pinPulse 1.9s ease-in-out infinite",
        shake: "shake .34s ease",
      },
    },
  },
  plugins: [],
};
export default config;
