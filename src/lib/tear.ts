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
 * The same tab once it has landed in the answer, lying on its side: its tear becomes the strip's right
 * end. Drawn from the tab's own seed, so the rip has the shape of the one left on the notice. Two
 * clip-path polygons whose right edges sit `depth` ± `amp` em in from the end (em of the strip's type,
 * so they keep their shape at any size):
 * `clip` is the paper; `fibres` runs a finer, ragged fringe just past it (three nicks per jag, 0.015 to
 * 0.05em proud), for the lighter rim of a real rip. `tilt` is how far the strip lies askew, in degrees
 * (1.2 to 2.8, unsigned: the caller picks the side). Deterministic, like `tornEdge`.
 */
export function tornStrip(id: string, { points = 9, depth = 0.3, amp = 0.09 }: { points?: number; depth?: number; amp?: number } = {}) {
  const rnd = mulberry32(hashString(id));
  const jags: number[] = [];
  for (let i = 0; i <= points; i++) jags.push(depth + (rnd() - 0.5) * 2 * amp);
  const tilt = Math.round((1.2 + rnd() * 1.6) * 100) / 100;
  const nicks: [number, number][] = [];
  const n = points * 3;
  for (let j = 0; j <= n; j++) {
    const at = (j / n) * points;
    const i = Math.min(points - 1, Math.floor(at));
    const under = jags[i] + (jags[i + 1] - jags[i]) * (at - i);
    nicks.push([(j / n) * 100, under - (0.015 + rnd() * 0.035)]);
  }
  const polygon = (edge: [number, number][]) =>
    `polygon(0% 0%, ${edge.map(([y, x]) => `calc(100% - ${Math.round(x * 1000) / 1000}em) ${Math.round(y * 10) / 10}%`).join(", ")}, 0% 100%)`;
  return {
    clip: polygon(jags.map((x, i) => [(i / points) * 100, x])),
    fibres: polygon(nicks),
    tilt,
  };
}

/**
 * A sheet torn off a pad: the reviews' notes. The rip runs across the top edge, `depth` ± `amp` em down
 * from the box's top (em of the note's type, so it keeps its shape at any size), with the same lighter
 * fringe as `tornStrip` just above it (three nicks per jag, 0.02 to 0.07em proud). `lean` is the note's
 * own small tilt in degrees (-0.8 to 0.8), added to its place in the pile. `stub` is what the rip leaves
 * on the pad: the strip above it, down to the same jags (the feedback page's pad keeps it under its
 * perforation). Seeded by the review's id and deterministic, like `tornEdge`.
 */
export function tornSheet(id: string, { points = 26, depth = 0.36, amp = 0.1 }: { points?: number; depth?: number; amp?: number } = {}) {
  const rnd = mulberry32(hashString(`${id}:sheet`));
  const jags: number[] = [];
  for (let i = 0; i <= points; i++) jags.push(depth + (rnd() - 0.5) * 2 * amp);
  const nicks: [number, number][] = [];
  const n = points * 3;
  for (let j = 0; j <= n; j++) {
    const at = (j / n) * points;
    const i = Math.min(points - 1, Math.floor(at));
    const under = jags[i] + (jags[i + 1] - jags[i]) * (at - i);
    nicks.push([(j / n) * 100, under - (0.02 + rnd() * 0.05)]);
  }
  const lean = Math.round((rnd() - 0.5) * 1.6 * 100) / 100;
  const at = (edge: [number, number][]) => edge.map(([x, y]) => `${Math.round(x * 10) / 10}% ${Math.round(y * 1000) / 1000}em`).join(", ");
  const polygon = (edge: [number, number][]) => `polygon(${at(edge)}, 100% 100%, 0% 100%)`;
  const rip = jags.map((y, i): [number, number] => [(i / points) * 100, y]);
  return {
    clip: polygon(rip),
    fibres: polygon(nicks),
    stub: `polygon(0% 0%, 100% 0%, ${at([...rip].reverse())})`,
    lean,
  };
}
