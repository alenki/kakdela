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
