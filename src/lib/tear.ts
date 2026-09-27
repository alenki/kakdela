import { mulberry32, hashString } from "./seed";

/**
 * A seeded torn edge across the width of a tab, as two clip-path polygons (percent units):
 * `stub` keeps the top `stubPct` of the tab (what stays on the notice), `piece` keeps the rest
 * (what falls). Deterministic, so server and client produce the same string.
 */
export function tornEdge(id: string, stubPct = 12, points = 9, amp = 3) {
  const rnd = mulberry32(hashString(id));
  const edge: [number, number][] = [];
  for (let i = 0; i <= points; i++) {
    const x = (i / points) * 100;
    const y = stubPct + (rnd() - 0.5) * 2 * amp;
    edge.push([Math.round(x * 10) / 10, Math.round(y * 10) / 10]);
  }
  const e = edge.map(([x, y]) => `${x}% ${y}%`).join(", ");
  const eRev = [...edge].reverse().map(([x, y]) => `${x}% ${y}%`).join(", ");
  return {
    stub: `polygon(0% 0%, 100% 0%, ${eRev})`,
    piece: `polygon(${e}, 100% 100%, 0% 100%)`,
  };
}

/**
 * A seeded tear right across a full-screen sheet, along a perforation at `var(--tear-y)`: `top` and
 * `bottom` clip-path polygons for the two halves. The edge wanders a few px around the line (a
 * perforated tear is nearly straight) with a slower sway on top. The halves overlap by `overlap` px,
 * so while they are whole no seam shows. Deterministic, so server and client produce the same string.
 */
export function sheetTear(id: string, points = 64, amp = 2.5, sway = 3, overlap = 1) {
  const rnd = mulberry32(hashString(id));
  const phase = rnd() * Math.PI * 2;
  const edge: [number, number][] = [];
  for (let i = 0; i <= points; i++) {
    const x = (i / points) * 100;
    const y = Math.sin(phase + (i / points) * Math.PI * 3) * sway + (rnd() - 0.5) * 2 * amp;
    edge.push([Math.round(x * 100) / 100, Math.round(y * 10) / 10]);
  }
  const at = (x: number, y: number) => `${x}% calc(var(--tear-y) + ${y}px)`;
  const down = edge.map(([x, y]) => at(x, Math.round((y + overlap) * 10) / 10));
  const up = edge.map(([x, y]) => at(x, Math.round((y - overlap) * 10) / 10));
  return {
    top: `polygon(0% 0%, 100% 0%, ${down.reverse().join(", ")})`,
    bottom: `polygon(${up.join(", ")}, 100% 100%, 0% 100%)`,
  };
}
