"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { MissionStatus } from "@/types";
import type { LevelNode } from "@/app/levels/curriculum";
import { detectiveFontVariables } from "@/lib/detective-fonts";
import { MissionCard, type MissionState } from "@/components/case-map/MissionCard";
import styles from "./MissionBoard.module.css";

type HubKey = "left" | "right" | "midLeft" | "midRight" | "top" | "lowLeft" | "lowRight";

const LAYOUT: { x: number; y: number; tilt: number; hub: HubKey }[] = [
  { x: 17, y: 13, tilt: -2.4, hub: "left" },
  { x: 30, y: 17, tilt: 1.8, hub: "left" },
  { x: 43, y: 11, tilt: -1.2, hub: "top" },
  { x: 57, y: 16, tilt: 2.6, hub: "top" },
  { x: 69, y: 11, tilt: -2.0, hub: "top" },
  { x: 80, y: 16, tilt: 1.6, hub: "right" },
  { x: 89, y: 28, tilt: -2.8, hub: "right" },
  { x: 79, y: 37, tilt: 2.2, hub: "right" },
  { x: 90, y: 50, tilt: -1.6, hub: "midRight" },
  { x: 80, y: 62, tilt: 2.8, hub: "midRight" },
  { x: 89, y: 75, tilt: -2.2, hub: "lowRight" },
  { x: 74, y: 85, tilt: 1.4, hub: "lowRight" },
  { x: 58, y: 89, tilt: -2.6, hub: "lowRight" },
  { x: 42, y: 86, tilt: 2.0, hub: "lowLeft" },
  { x: 27, y: 88, tilt: -1.8, hub: "lowLeft" },
  { x: 12, y: 78, tilt: 2.4, hub: "lowLeft" },
  { x: 22, y: 66, tilt: -2.2, hub: "midLeft" },
  { x: 10, y: 55, tilt: 1.8, hub: "midLeft" },
  { x: 20, y: 41, tilt: -2.6, hub: "midLeft" },
  { x: 10, y: 30, tilt: 2.2, hub: "left" },
];

const RAIL = [0, 1, 2, 3, 4, 5];

const HUB_BY_PATH: Record<"Beginner" | "Intermediate" | "Expert", { photo: string; alt: string; label: string }> = {
  Beginner: { photo: "/characters/dossier/panda.jpeg", alt: "Agent Panda, mission control for Code Undercover", label: "AGENT PANDA" },
  Intermediate: { photo: "/characters/dossier/fox.jpeg", alt: "Agent Fox, mission control for Code Undercover", label: "AGENT FOX" },
  Expert: { photo: "/characters/dossier/platypus.jpeg", alt: "Agent Platypus, mission control for Code Undercover", label: "AGENT PLATYPUS" },
};

interface CorkboardLevel {
  lvl: LevelNode;
  status: MissionStatus;
  isLocked: boolean;
  realMissionId?: string;
}

interface MissionCorkboardProps {
  levels: CorkboardLevel[];
  activePath: "Beginner" | "Intermediate" | "Expert";
}

export function MissionCorkboard({ levels, activePath }: MissionCorkboardProps) {
  const mainRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const cardRef = useRef<HTMLElement | null>(null);
  const hubPinRefs = useRef<Partial<Record<HubKey, HTMLSpanElement | null>>>({});
  const folderRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const folderPinRefs = useRef<(HTMLSpanElement | null)[]>([]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [shakingId, setShakingId] = useState<number | null>(null);

  const hub = HUB_BY_PATH[activePath];

  // lamp glow follows cursor — exact port of lampGlow() in level-select-*.js
  useEffect(() => {
    const main = mainRef.current;
    const glow = glowRef.current;
    if (!main || !glow) return;
    const onMove = (e: MouseEvent) => {
      const rect = main.getBoundingClientRect();
      glow.style.setProperty("--mx", `${((e.clientX - rect.left) / rect.width) * 100}%`);
      glow.style.setProperty("--my", `${((e.clientY - rect.top) / rect.height) * 100}%`);
    };
    main.addEventListener("mousemove", onMove);
    return () => main.removeEventListener("mousemove", onMove);
  }, []);

  // helper: centre of element in stage coordinates
  const centreOf = useCallback((el: Element | null | undefined, base: DOMRect | null) => {
    if (!el || !base) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2 - base.left, y: r.top + r.height / 2 - base.top } as { x: number; y: number };
  }, []);

  const curve = (a: { x: number; y: number }, h: { x: number; y: number }) => {
    const sag = Math.min(Math.hypot(h.x - a.x, h.y - a.y) * 0.06, 16);
    return `M ${a.x} ${a.y} Q ${(a.x + h.x) / 2} ${(a.y + h.y) / 2 + sag} ${h.x} ${h.y}`;
  };

  const animatePath = useCallback((path: SVGPathElement) => {
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (still) return;
    const len = path.getTotalLength();
    if (!len) return;
    path.style.strokeDasharray = `${len}`;
    path.style.strokeDashoffset = `${len}`;
    requestAnimationFrame(() => {
      path.style.transition = "stroke-dashoffset .42s cubic-bezier(.3,.8,.35,1)";
      path.style.strokeDashoffset = "0";
    });
    const clean = () => {
      path.style.transition = "";
      path.style.strokeDasharray = "";
      path.style.strokeDashoffset = "";
    };
    path.addEventListener("transitionend", clean, { once: true });
    setTimeout(clean, 900);
  }, []);

  const drawThread = useCallback(
    (i: number, pull: boolean, base: DOMRect | null, hubs: Partial<Record<HubKey, { x: number; y: number }>>) => {
      if (!base || !svgRef.current) return;
      const flow = window.matchMedia("(max-width: 900px), (max-height: 620px)").matches;
      if (flow) return;
      const btn = folderRefs.current[i];
      if (!btn) return;
      const a = centreOf(folderPinRefs.current[i], base);
      const hubKey = LAYOUT[i]?.hub;
      const h = hubKey ? hubs[hubKey] : null;
      if (!a || !h) return;
      const svg = svgRef.current;
      let path = svg.querySelector(`[data-index="${i}"]`) as SVGPathElement | null;
      const lvl = levels[i];
      const isLive = lvl ? !lvl.isLocked || lvl.status === "COMPLETED" : false;
      const fresh = !path;
      if (fresh) {
        path = document.createElementNS("http://www.w3.org/2000/svg", "path") as SVGPathElement;
        path.dataset.index = String(i);
        path.setAttribute("class", `${styles.thread} ${!isLive ? styles.threadPending : ""}`);
        svg.appendChild(path);
      }
      if (!path) return;
      // update live/pending class dynamically (lock may change after completion)
      path.setAttribute("class", `${styles.thread} ${!isLive ? styles.threadPending : ""}`);
      path.setAttribute("d", curve(a, h));
      if (fresh && pull) animatePath(path);
    },
    [levels, centreOf, animatePath]
  );

  const drawRail = useCallback(
    (pull: boolean, base: DOMRect | null) => {
      if (!base || !svgRef.current) return;
      const flow = window.matchMedia("(max-width: 900px), (max-height: 620px)").matches;
      if (flow) return;
      const svg = svgRef.current;
      const pts = RAIL.map((i) => centreOf(folderPinRefs.current[i], base)).filter((p): p is { x: number; y: number } => p !== null);
      if (pts.length < 2) return;
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let k = 1; k < pts.length; k++) {
        const p = pts[k - 1];
        const q = pts[k];
        d += ` Q ${(p.x + q.x) / 2} ${(p.y + q.y) / 2 + 14} ${q.x} ${q.y}`;
      }
      let line = svg.querySelector(`.${styles.threadRail}`) as SVGPathElement | null;
      const fresh = !line;
      if (fresh) {
        line = document.createElementNS("http://www.w3.org/2000/svg", "path") as SVGPathElement;
        line.setAttribute("class", `${styles.thread} ${styles.threadRail}`);
        svg.insertBefore(line, svg.firstChild);
      }
      if (!line) return;
      line.setAttribute("d", d);
      if (fresh && pull) animatePath(line);
    },
    [centreOf, animatePath]
  );

  const drawThreads = useCallback(
    (pull: boolean) => {
      const stage = stageRef.current;
      const svg = svgRef.current;
      if (!stage || !svg) return;
      const base = stage.getBoundingClientRect();
      if (!base.width || !base.height) return;
      svg.setAttribute("viewBox", `0 0 ${base.width} ${base.height}`);
      // measure hubs
      const hubs: Partial<Record<HubKey, { x: number; y: number }>> = {};
      (["left", "right", "midLeft", "midRight", "top", "lowLeft", "lowRight"] as HubKey[]).forEach((key) => {
        const el = hubPinRefs.current[key];
        const c = centreOf(el, base);
        if (c) hubs[key] = c;
      });
      if (Object.keys(hubs).length === 0) return;
      if (!pull) svg.innerHTML = "";
      // when not pulling, clear and redraw all
      if (!pull) {
        svg.innerHTML = "";
        levels.forEach((_, i) => drawThread(i, false, base, hubs));
        drawRail(false, base);
      } else {
        levels.forEach((_, i) => drawThread(i, true, base, hubs));
        drawRail(true, base);
      }
    },
    [levels, centreOf, drawThread, drawRail]
  );

  const light = useCallback(
    (i: number, on: boolean) => {
      const p = svgRef.current?.querySelector(`[data-index="${i}"]`);
      if (p) p.classList.toggle(styles.threadHot, on);
    },
    []
  );

  const follow = useCallback(
    (i: number) => {
      const stage = stageRef.current;
      if (!stage) return;
      const flow = window.matchMedia("(max-width: 900px), (max-height: 620px)").matches;
      if (flow) return;
      const base = stage.getBoundingClientRect();
      if (!base.width) return;
      const svg = svgRef.current;
      if (!svg) return;
      const hubs: Partial<Record<HubKey, { x: number; y: number }>> = {};
      (["left", "right", "midLeft", "midRight", "top", "lowLeft", "lowRight"] as HubKey[]).forEach((key) => {
        const el = hubPinRefs.current[key];
        const c = centreOf(el, base);
        if (c) hubs[key] = c;
      });
      const until = performance.now() + 320;
      const step = () => {
        drawThread(i, false, base, hubs);
        if (RAIL.includes(i)) drawRail(false, base);
        if (performance.now() < until) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
    [centreOf, drawThread, drawRail]
  );

  // stringOnArrival — wait for dropIn animations, then pull strings
  useEffect(() => {
    const stage = stageRef.current;
    const svg = svgRef.current;
    if (!stage || !svg) return;
    const flow = window.matchMedia("(max-width: 900px), (max-height: 620px)").matches;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (flow || still) {
      // still measure once for initial view
      const id = setTimeout(() => drawThreads(false), 100);
      return () => clearTimeout(id);
    }

    let strung = false;
    let landed = 0;
    const total = folderRefs.current.filter(Boolean).length;

    const stringUp = () => {
      if (strung) return;
      strung = true;
      svg.innerHTML = "";
      drawThreads(true);
    };

    const btns = folderRefs.current.filter(Boolean) as HTMLButtonElement[];
    btns.forEach((btn) => {
      let counted = false;
      const land = () => {
        if (counted) return;
        counted = true;
        if (++landed === total) stringUp();
      };
      btn.addEventListener(
        "animationend",
        (e: AnimationEvent) => {
          if ((e as AnimationEvent).animationName === "dropIn") land();
        },
        { once: true }
      );
      setTimeout(land, 1600);
    });
    const fallback = setTimeout(stringUp, 2400);
    return () => clearTimeout(fallback);
  }, [drawThreads, levels.length]);

  // resize + fonts
  useEffect(() => {
    const onResize = () => drawThreads(false);
    let timer: number | null = null;
    const handler = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(onResize, 120) as unknown as number;
    };
    window.addEventListener("resize", handler);
    const mql = window.matchMedia("(max-width: 900px), (max-height: 620px)");
    const mqlHandler = () => drawThreads(false);
    if (mql.addEventListener) mql.addEventListener("change", mqlHandler);
    else mql.addListener(mqlHandler);
    if (document.fonts?.ready) document.fonts.ready.then(() => drawThreads(false));
    return () => {
      window.removeEventListener("resize", handler);
      if (mql.removeEventListener) mql.removeEventListener("change", mqlHandler);
      else mql.removeListener(mqlHandler);
      if (timer) window.clearTimeout(timer);
    };
  }, [drawThreads]);

  // initial draw after mount
  useEffect(() => {
    const id = setTimeout(() => drawThreads(false), 50);
    return () => clearTimeout(id);
  }, [drawThreads]);

  const handleSelect = (i: number, isLocked: boolean) => {
    if (isLocked) {
      setShakingId(i);
      setTimeout(() => setShakingId(null), 340);
      return;
    }
    setSelectedId(i);
  };

  return (
    <div ref={mainRef} className={`${detectiveFontVariables} ${styles.boardMain}`}>
      <div className={styles.chalkNoise} aria-hidden="true" />
      <div ref={glowRef} className={styles.lampGlow} aria-hidden="true" />

      <div className={styles.missionBoard}>
        <div className={styles.missionBoardGrain} aria-hidden="true" />
        <div className={styles.missionBoardShade} aria-hidden="true" />

        <div ref={stageRef} className={styles.stage}>
          {/* props */}
          <div className={styles.props} aria-hidden="true">
            <span className={styles.prop} style={{ ["--x" as string]: "30.5%", ["--y" as string]: "34%", ["--tilt" as string]: "-4deg" }}>
              <span className={styles.propPhoto} />
            </span>
            <span className={styles.prop} style={{ ["--x" as string]: "69.5%", ["--y" as string]: "30%", ["--tilt" as string]: "3.4deg" }}>
              <span className={styles.propPhoto} />
            </span>
            <span className={styles.prop} style={{ ["--x" as string]: "69%", ["--y" as string]: "72.5%", ["--tilt" as string]: "-2.6deg" }}>
              <span className={styles.propPhoto} />
            </span>
            <span className={styles.prop} style={{ ["--x" as string]: "31%", ["--y" as string]: "71.5%", ["--tilt" as string]: "4deg" }}>
              <span className={styles.propPhoto} />
            </span>
            <span className={styles.prop} style={{ ["--x" as string]: "31%", ["--y" as string]: "44%", ["--tilt" as string]: "-6deg" }}>
              <span className={styles.propSlip}>Connection Point</span>
            </span>
            <span className={styles.prop} style={{ ["--x" as string]: "30.5%", ["--y" as string]: "57.5%", ["--tilt" as string]: "4deg" }}>
              <span className={styles.propSlip}>Timeline</span>
            </span>
            <span className={styles.prop} style={{ ["--x" as string]: "69%", ["--y" as string]: "44%", ["--tilt" as string]: "5deg" }}>
              <span className={styles.propSlip}>Alibi?</span>
            </span>
            <span className={styles.prop} style={{ ["--x" as string]: "69.5%", ["--y" as string]: "57.5%", ["--tilt" as string]: "-4deg" }}>
              <span className={styles.propSlip}>Key Link</span>
            </span>
          </div>

          <svg ref={svgRef} className={styles.threads} aria-hidden="true" />

          {/* folders — exact port, data comes from LevelsClient MERN logic */}
          {levels.map(({ lvl, status, isLocked, realMissionId }, i) => {
            const spot = LAYOUT[i];
            if (!spot) return null;
            const cardState: MissionState = status === "COMPLETED" ? "cleared" : isLocked ? "locked" : "active";
            const delay = `${(i * 0.03).toFixed(2)}s`;
            return (
              <MissionCard
                key={lvl.id}
                index={lvl.order}
                title={lvl.title}
                state={cardState}
                x={spot.x}
                y={spot.y}
                tilt={spot.tilt}
                delay={delay}
                isSelected={selectedId === i}
                isShaking={shakingId === i}
                pinRef={(el) => {
                  folderPinRefs.current[i] = el;
                }}
                folderRef={(el) => {
                  folderRefs.current[i] = el;
                }}
                onHover={(on) => {
                  light(i, on);
                  follow(i);
                }}
                onSelect={() => handleSelect(i, isLocked)}
                onOpen={() => {
                  if (!isLocked && realMissionId) window.location.href = `/mission/${realMissionId}`;
                }}
              />
            );
          })}

          {/* centre polaroid */}
          <article ref={cardRef} className={styles.card} id="hqCard">
            <span ref={(el) => { hubPinRefs.current["left"] = el; }} className={`${styles.cardPin} ${styles.cardPinLeft}`} aria-hidden="true" />
            <span ref={(el) => { hubPinRefs.current["right"] = el; }} className={`${styles.cardPin} ${styles.cardPinRight}`} aria-hidden="true" />
            <span ref={(el) => { hubPinRefs.current["lowLeft"] = el; }} className={`${styles.cardPin} ${styles.cardPinLowLeft}`} aria-hidden="true" />
            <span ref={(el) => { hubPinRefs.current["lowRight"] = el; }} className={`${styles.cardPin} ${styles.cardPinLowRight}`} aria-hidden="true" />
            <span ref={(el) => { hubPinRefs.current["top"] = el; }} className={`${styles.cardPin} ${styles.cardPinTop}`} aria-hidden="true" />
            <span ref={(el) => { hubPinRefs.current["midLeft"] = el; }} className={`${styles.cardPin} ${styles.cardPinMidLeft}`} aria-hidden="true" />
            <span ref={(el) => { hubPinRefs.current["midRight"] = el; }} className={`${styles.cardPin} ${styles.cardPinMidRight}`} aria-hidden="true" />
            <span className={styles.cardTab}>MISSIONS</span>
            <div className={styles.cardFrame}>
              <div className={styles.polaroid}>
                <div className={styles.polaroidCrop} style={{ backgroundImage: `url("${hub.photo}")`, backgroundSize: "contain" }} role="img" aria-label={hub.label}>
                  <span className={styles.polaroidEmpty} aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="26" height="26">
                      <rect x="3" y="6" width="18" height="14" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="12" cy="13" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M8.6 6l1.3-2h4.2l1.3 2" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                    <em>No photo on file</em>
                  </span>
                </div>
                <div className={styles.polaroidTint} aria-hidden="true" />
                <div className={styles.polaroidGrain} aria-hidden="true" />
                <span className={styles.polaroidCaption}>{hub.label}</span>
              </div>
            </div>
          </article>
        </div>

        <Link href="/skill" aria-label="Go back to sector selection" className={styles.backBtn}>
          <ChevronLeft size={14} /> Back
        </Link>
      </div>

      <p className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={`${styles.legendChip} ${styles.legendChipDone}`} /> Cleared
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendChip} ${styles.legendChipCurrent}`} /> In progress
        </span>
        <span className={styles.legendItem}>
          <span className={`${styles.legendChip} ${styles.legendChipLocked}`} /> Locked
        </span>
      </p>
    </div>
  );
}
