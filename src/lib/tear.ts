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

/** A point on a rip across a sheet: x in % of its width, y in px off the rip's line (down is +). */
export type RipPoint = [x: number, y: number];

/**
 * The «Разделы» roll's rip (menu-roll.ts): the torn bottom edge of the menu's sheet, across its whole
 * width, one jag every 22px or so (18 to 80 of them), wandering up to 10px off its line, a long sway
 * under the jags. `edge` is the paper's outline; `rim` is the lighter rim of the rip just under it
 * (three nicks per jag, 0.8 to 2.6px proud of the edge). Seeded, and deterministic like `tornEdge`.
 */
export function rollRip(seed: number, width: number) {
  const rnd = mulberry32(seed);
  const n = Math.max(18, Math.min(80, Math.round(width / 22)));
  const phase1 = rnd() * Math.PI * 2, phase2 = rnd() * Math.PI * 2;
  const waves1 = 0.6 + rnd() * 1.1, waves2 = 2.5 + rnd() * 3;
  const edge: RipPoint[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    // The jags aren't evenly spaced; the ends stay on the sheet's sides.
    const x = i === 0 || i === n ? t : t + (rnd() - 0.5) * (0.7 / n);
    const y = 4.6 * Math.sin(2 * Math.PI * waves1 * t + phase1) + 2.2 * Math.sin(2 * Math.PI * waves2 * t + phase2) + (rnd() - 0.5) * 2 * 3.1;
    edge.push([x * 100, y]);
  }
  const rim: RipPoint[] = [];
  for (let i = 0; i < n; i++) {
    const [x0, y0] = edge[i], [x1, y1] = edge[i + 1];
    for (let k = 0; k < 3; k++) rim.push([x0 + ((x1 - x0) * k) / 3, y0 + ((y1 - y0) * k) / 3 + 0.8 + rnd() * 1.8]);
  }
  rim.push([100, edge[n][1] + 1.2]);
  return { edge, rim };
}

/**
 * A clip-path polygon for a box whose bottom edge is a rip, running `at` px up from the box's bottom:
 * measured from the bottom, it stays on the box's edge when the box changes height (the menu's sheet
 * follows the window).
 */
export function ripClip(edge: RipPoint[], at: number) {
  const x = (v: number) => `${Math.round(v * 100) / 100}%`;
  const up = (v: number) => {
    const d = Math.round(v * 10) / 10;
    return d >= 0 ? `calc(100% - ${d}px)` : `calc(100% + ${-d}px)`;
  };
  return `polygon(0% 0px, 100% 0px, ${[...edge].reverse().map(([ex, ey]) => `${x(ex)} ${up(at - ey)}`).join(", ")})`;
}
