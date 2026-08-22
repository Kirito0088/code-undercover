"use client";

// Red string, drawn in measured pixel space.
//
// The endpoints are read off the live pin heads (folder pin -> one of the seven
// pins around the centre photo) rather than computed from a percentage model of
// where the polaroid is assumed to be, so a thread always stops dead centre of
// a pin instead of in open cork. Ported from the mockup's level-select-*.js.

export interface Pt { x: number; y: number }

export interface ThreadEdge {
  id: number;
  from: Pt;
  to: Pt;
  /** unlocked missions get the bright string; locked ones a dim dashed one */
  live: boolean;
}

interface Props {
  edges: ThreadEdge[];
  /** one slack line running through the cleared cases along the top */
  rail: Pt[];
  width: number;
  height: number;
}

/** Threads sag; they don't run straight. Same falloff as the mockup. */
function curve(a: Pt, b: Pt) {
  const sag = Math.min(Math.hypot(b.x - a.x, b.y - a.y) * 0.06, 16);
  return `M ${a.x} ${a.y} Q ${(a.x + b.x) / 2} ${(a.y + b.y) / 2 + sag} ${b.x} ${b.y}`;
}

function railPath(pts: Pt[]) {
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1];
    const q = pts[i];
    d += ` Q ${(p.x + q.x) / 2} ${(p.y + q.y) / 2 + 14} ${q.x} ${q.y}`;
  }
  return d;
}

export function ThreadLayer({ edges, rail, width, height }: Props) {
  if (!width || !height) return null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      viewBox={`0 0 ${width} ${height}`}
      style={{ zIndex: "var(--z-threads)" }}
      aria-hidden
    >
      {rail.length > 1 && (
        <path
          d={railPath(rail)}
          fill="none"
          stroke="#8d322a"
          strokeWidth={2}
          strokeLinecap="round"
          opacity={0.7}
        />
      )}

      {edges.map((e) => (
        <path
          key={e.id}
          d={curve(e.from, e.to)}
          fill="none"
          stroke={e.live ? "#a5453a" : "#6b241e"}
          strokeWidth={e.live ? 2.4 : 2}
          strokeDasharray={e.live ? undefined : "5 6"}
          strokeLinecap="round"
          opacity={e.live ? 0.95 : 0.85}
        />
      ))}
    </svg>
  );
}
