export interface Pt { x: number; y: number }
export interface Node { id: number; x: number; y: number }

export const POLAROID = { cx: 50, cy: 54, w: 21, h: 44 };

export function buildAnchors(): Pt[] {
  const { cx, cy, w, h } = POLAROID;
  const l = cx - w / 2, r = cx + w / 2, t = cy - h / 2, b = cy + h / 2;
  return [
    { x: cx, y: t },
    { x: l,  y: t + h * 0.15 },
    { x: l,  y: cy },
    { x: l,  y: b - h * 0.15 },
    { x: r,  y: t + h * 0.15 },
    { x: r,  y: cy },
    { x: r,  y: b - h * 0.15 },
  ];
}

const angle = (from: Pt, to: Pt) => Math.atan2(to.y - from.y, to.x - from.x);
const diff  = (a: number, b: number) => {
  const d = Math.abs(a - b) % (Math.PI * 2);
  return d > Math.PI ? Math.PI * 2 - d : d;
};

export function assignAnchors(nodes: Node[], anchors: Pt[], maxPerAnchor = 3) {
  const centre: Pt = { x: POLAROID.cx, y: POLAROID.cy };
  const anchorAngles = anchors.map(a => angle(centre, a));
  const load = new Array(anchors.length).fill(0);

  return nodes
    .map(n => ({ n, a: angle(centre, n) }))
    .sort((p, q) => p.a - q.a)
    .map(({ n, a }) => {
      const ranked = anchorAngles
        .map((aa, i) => ({ i, d: diff(a, aa) }))
        .sort((p, q) => p.d - q.d);
      const pick = ranked.find(r => load[r.i] < maxPerAnchor) ?? ranked[0];
      load[pick.i] += 1;
      return { nodeId: n.id, from: { x: n.x, y: n.y }, to: anchors[pick.i] };
    });
}
