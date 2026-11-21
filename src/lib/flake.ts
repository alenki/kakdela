// Paper snowflakes («С наступающим!», docs/CONVENTIONS.md): cut from the notice's own paper as children cut them
// for a window, a sheet folded in twelve (six arms, each mirrored) and cut with scissors, so one seed is one
// snowflake and no two are alike. This file is the cutting (an SVG mask the page lays over the paper; server
// and client alike) and the fall of a peeled one (a fluttering plate). flake.test.ts holds both.
//
// What the scissors leave in the fold is what a snowflake is made of: a spine down each arm, branches off it
// at the crystal's sixty degrees, a plate at the heart (sometimes holed), now and then a ring that ties the
// arms, a jewel at a tip. Everything left joins the spine or the heart, so the flake is one piece; holes are
// only cut inside a plate or a broad arm, with paper all round them.

import { hashString, mulberry32 } from "./seed";

type Pt = [number, number];
type Poly = Pt[];

/** The paper left in the fold's own wedge (0° along an arm, the wedge mirrored across it), and the holes cut
 *  through it. The fold opens into twelve copies: six arms, each mirrored. Unit radius: a tip reaches 1. */
export type Flake = { paper: Poly[]; holes: Poly[] };

const DEG = Math.PI / 180;
const polar = (r: number, a: number): Pt => [r * Math.cos(a * DEG), r * Math.sin(a * DEG)];

/** A strip from a to b, `w0` wide at a and `w1` at b, ending in a point `tip` long past b (0: square). */
function strip(a: Pt, b: Pt, w0: number, w1: number, tip = 0): Poly {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  const ux = dx / l, uy = dy / l;
  const nx = -uy, ny = ux;
  const poly: Poly = [
    [a[0] + (nx * w0) / 2, a[1] + (ny * w0) / 2],
    [b[0] + (nx * w1) / 2, b[1] + (ny * w1) / 2],
  ];
  if (tip > 0) poly.push([b[0] + ux * tip, b[1] + uy * tip]);
  poly.push([b[0] - (nx * w1) / 2, b[1] - (ny * w1) / 2], [a[0] - (nx * w0) / 2, a[1] - (ny * w0) / 2]);
  return poly;
}

/** A regular polygon: `n` corners at radius r round c, the first at angle `rot`. */
function ngon(c: Pt, r: number, n: number, rot = 0): Poly {
  return Array.from({ length: n }, (_, k) => {
    const a = (rot + (360 * k) / n) * DEG;
    return [c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)];
  });
}

/** A diamond on the arm's line at radius r, `len` along it and `wid` across. */
const diamond = (r: number, len: number, wid: number): Poly => [
  [r - len / 2, 0],
  [r, wid / 2],
  [r + len / 2, 0],
  [r, -wid / 2],
];

const cache = new Map<string, Flake>();

/**
 * Folds and cuts one snowflake (memoised: the same seed is the same flake, on the server and in the page).
 * Then it is unfolded and looked at: a hole that let paper loose is sewn back (the last one cut first), so the
 * flake is always one piece (flake.test.ts unfolds a hundred and checks).
 */
export function cutFlake(seed: string): Flake {
  const hit = cache.get(seed);
  if (hit) return hit;
  const flake = cut(seed);
  while (flake.holes.length && !whole(flake)) flake.holes.pop();
  while (flake.paper.length > 2 && !whole(flake)) flake.paper.pop();
  cache.set(seed, flake);
  return flake;
}

/** The grid the cutter checks its work on (a cell is about a pixel of the largest flake on the site). */
const CHECK = 140;

/** One piece of paper. */
const whole = (flake: Flake) => pieces(rasterize(flake, CHECK), CHECK) === 1;

type Style = "dendrite" | "fern" | "plate" | "star";

function cut(seed: string): Flake {
  const rnd = mulberry32(hashString(`flake:${seed}`));
  const between = (a: number, b: number) => a + (b - a) * rnd();
  const chance = (p: number) => rnd() < p;
  const style: Style = (["dendrite", "dendrite", "dendrite", "fern", "fern", "plate", "plate", "star"] as const)[Math.floor(rnd() * 8)];
  const paper: Poly[] = [];
  const holes: Poly[] = [];

  // The spine: from the heart to the tip, tapering, pointed.
  const tip = between(0.9, 0.99);
  const spine = style === "star" ? between(0.07, 0.1) : style === "fern" ? between(0.026, 0.036) : between(0.032, 0.048);
  const point = between(0.04, 0.09);
  paper.push(strip([0, 0], [tip - point, 0], spine * 2, spine * (style === "star" ? 1.1 : 0.9), point));
  /** The spine's half width at radius r. */
  const halfAt = (r: number) => spine * (1 - (1 - (style === "star" ? 0.55 : 0.45)) * Math.min(1, r / (tip - point)));

  // The heart: a hexagon, its corners on the arms or between them.
  const heart = style === "plate" ? between(0.32, 0.46) : style === "star" ? between(0.16, 0.28) : between(0.1, 0.2);
  const onArms = chance(0.5);
  paper.push(ngon([0, 0], heart, 6, onArms ? 0 : 30));
  // Its hole: a smaller hexagon, a round, or a star of six.
  if (chance(style === "plate" ? 0.85 : 0.55)) {
    const r = heart * between(0.3, 0.55);
    const shape = Math.floor(rnd() * 3);
    if (shape === 0) holes.push(ngon([0, 0], r, 6, onArms ? 30 : 0));
    else if (shape === 1) holes.push(ngon([0, 0], r * 0.85, 18));
    else {
      // A six-pointed star: six thin diamonds from the middle, one per arm (the fold makes the rest).
      holes.push([[0, 0], polar(r * 0.45, -14), [r * 1.05, 0], polar(r * 0.45, 14)]);
    }
  }
  // A plate gets windows round its heart: one per wedge, mirrored into twelve.
  if (style === "plate") {
    const at = heart * between(0.62, 0.74);
    const a = between(12, 18);
    const size = Math.min(heart * 0.17, at * Math.sin(Math.min(a, 30 - a) * DEG) * 0.75);
    if (chance(0.5)) holes.push(ngon(polar(at, a), size, 3, a + 180));
    else holes.push(ngon(polar(at, a), size * 0.9, 12));
  }

  // A ring that ties the arms, now and then: the hexagon's side from the arm to the valley (a hair past it, so
  // it meets its mirror).
  if (style !== "plate" && chance(style === "fern" ? 0.25 : 0.4)) {
    const rr = between(heart + 0.16, Math.min(0.62, tip - 0.25));
    const w = between(0.022, 0.034);
    const mid = polar(rr * Math.cos(30 * DEG), 30);
    const past: Pt = [mid[0] + (mid[0] - rr) * 0.06, mid[1] * 1.06];
    paper.push(strip([rr, 0], past, w, w));
  }

  // The branches: off the spine toward the tip at the crystal's sixty degrees (a fern's lie lower), shorter
  // toward the tip, like a tree's.
  const count = style === "fern" ? Math.floor(between(4, 7)) : style === "star" ? Math.floor(between(0, 3)) : Math.floor(between(1, 4));
  const angle = style === "fern" ? between(42, 56) : between(55, 64);
  const from = heart + (style === "plate" ? 0.04 : 0.08);
  const to = tip - point - 0.12;
  for (let k = 0; k < count && to > from; k++) {
    const r = count === 1 ? from + (to - from) * between(0.3, 0.6) : from + ((to - from) * k) / (count - 1);
    const room = tip - r;
    const len = Math.min(room * (style === "fern" ? between(0.32, 0.5) : between(0.45, 0.78)), 0.42);
    const w = style === "fern" ? between(0.02, 0.028) : between(0.024, 0.036);
    const end: Pt = [r + len * Math.cos(angle * DEG), len * Math.sin(angle * DEG)];
    // Keep a branch inside the paper's reach.
    if (Math.hypot(end[0], end[1]) > tip) continue;
    paper.push(strip([r, 0], end, w * 1.15, w * 0.7, w * 1.2));
    // A twig off a long branch, back toward the tip at sixty again.
    if (len > 0.24 && chance(0.45)) {
      const at = 0.55;
      const base: Pt = [r + len * at * Math.cos(angle * DEG), len * at * Math.sin(angle * DEG)];
      const tl = len * between(0.28, 0.4);
      const tEnd: Pt = [base[0] + tl, base[1] + tl * 0.08];
      if (Math.hypot(tEnd[0], tEnd[1]) < tip) paper.push(strip(base, tEnd, w * 0.85, w * 0.55, w));
    }
    // A jewel at its end.
    if (chance(0.22)) paper.push(ngon(end, w * between(1.3, 1.9), 6, angle));
  }

  // A broad arm has windows down its spine.
  if (style === "star") {
    const n = Math.floor(between(1, 4));
    for (let k = 0; k < n; k++) {
      const r = heart + 0.1 + ((tip - point - 0.12 - heart - 0.1) * (k + 0.5)) / n;
      const half = halfAt(r) - 0.026;
      if (half > 0.01) holes.push(diamond(r, between(0.06, 0.11), half * 2));
    }
  }
  // The tip: a jewel, or a fork.
  if (chance(0.3)) paper.push(ngon([tip - point * 0.8, 0], between(0.045, 0.075), 6, 30));
  else if (chance(0.3)) {
    const base: Pt = [tip - point - 0.1, 0];
    const l = between(0.09, 0.14);
    paper.push(strip(base, [base[0] + l * Math.cos(32 * DEG), l * Math.sin(32 * DEG)], spine * 1.1, spine * 0.6, spine));
  }
  return { paper, holes };
}

function rotate([x, y]: Pt, deg: number): Pt {
  const c = Math.cos(deg * DEG), s = Math.sin(deg * DEG);
  return [x * c - y * s, x * s + y * c];
}

const f = (n: number) => (Math.round(n * 1000) / 1000).toString();
const pts = (p: Poly) => p.map(([x, y]) => `${f(x)},${f(y)}`).join(" ");

/** The snowflake as an SVG image: the paper white, the holes through it (a mask: the page lays its own paper
 *  under it). The fold opens with twelve <use>s of the wedge. */
export function flakeSvg(flake: Flake): string {
  const open = (id: string) => {
    const uses: string[] = [];
    for (let k = 0; k < 6; k++) {
      uses.push(`<use href="#${id}" transform="rotate(${k * 60})"/>`);
      uses.push(`<use href="#${id}" transform="rotate(${k * 60}) scale(1 -1)"/>`);
    }
    return uses.join("");
  };
  const group = (id: string, polys: Poly[]) => `<g id="${id}">${polys.map((p) => `<polygon points="${pts(p)}"/>`).join("")}</g>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1.02 -1.02 2.04 2.04">` +
    `<defs>${group("p", flake.paper)}${flake.holes.length ? group("h", flake.holes) : ""}` +
    `<mask id="m" maskUnits="userSpaceOnUse" x="-1.02" y="-1.02" width="2.04" height="2.04">` +
    `<g fill="#fff">${open("p")}</g>${flake.holes.length ? `<g fill="#000">${open("h")}</g>` : ""}</mask></defs>` +
    `<rect x="-1.02" y="-1.02" width="2.04" height="2.04" mask="url(#m)"/></svg>`
  );
}

/** The same, as a CSS url() for a mask. */
export const flakeMask = (seed: string) => `url("data:image/svg+xml,${encodeURIComponent(flakeSvg(cutFlake(seed)))}")`;

function inside(p: Pt, poly: Poly): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if (yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

type Placed = { poly: Poly; x0: number; x1: number; y0: number; y1: number };
function unfold(polys: Poly[]): Placed[] {
  const out: Placed[] = [];
  const add = (poly: Poly) => {
    const xs = poly.map((q) => q[0]), ys = poly.map((q) => q[1]);
    out.push({ poly, x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) });
  };
  for (let k = 0; k < 6; k++) {
    for (const c of polys) {
      add(c.map((q) => rotate(q, k * 60)));
      add(c.map(([x, y]) => rotate([x, -y], k * 60)));
    }
  }
  return out;
}
const within = (p: Pt, set: Placed[]) => {
  for (const c of set) {
    if (p[0] < c.x0 || p[0] > c.x1 || p[1] < c.y0 || p[1] > c.y1) continue;
    if (inside(p, c.poly)) return true;
  }
  return false;
};

/** The unfolded paper on an n × n grid over [-1, 1]² (true: paper). */
export function rasterize(flake: Flake, n = 120): boolean[] {
  const paper = unfold(flake.paper);
  const holes = unfold(flake.holes);
  const out: boolean[] = [];
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      const p: Pt = [-1 + (2 * (i + 0.5)) / n, -1 + (2 * (j + 0.5)) / n];
      out.push(within(p, paper) && !within(p, holes));
    }
  }
  return out;
}

/** How many separate pieces of paper a grid from rasterize() holds. Cells that touch, even corner to corner,
 *  are joined (a thin stroke at sixty degrees only meets itself at the corners of a square grid), and a speck
 *  of a few cells is the grid sampling a sharp point, not paper. */
export function pieces(grid: boolean[], n: number, speck = 3): number {
  const seen = new Uint8Array(grid.length);
  let count = 0;
  const stack: number[] = [];
  for (let s = 0; s < grid.length; s++) {
    if (!grid[s] || seen[s]) continue;
    let size = 0;
    stack.push(s);
    seen[s] = 1;
    while (stack.length) {
      const k = stack.pop()!;
      size++;
      const i = k % n, j = (k - i) / n;
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          const a = i + di, b = j + dj;
          if (a < 0 || b < 0 || a >= n || b >= n) continue;
          const q = b * n + a;
          if (grid[q] && !seen[q]) {
            seen[q] = 1;
            stack.push(q);
          }
        }
      }
    }
    if (size > speck) count++;
  }
  return count;
}


// ── The fall of a peeled snowflake ──
// A light plate falling through air, after Andersen, Pesavento and Wang (J. Fluid Mech. 541, 2005): in its own
// frame (u along the plate, v across it), with the added mass of the air it carries, the lift of the
// circulation round it (from its glide and from its spin), a drag that is small edge on and large broadside,
// and the damping of its spin. Released upright from the glass, it falls edge first, turns broadside and
// flutters: it glides off to one side, pitches up, stalls, and glides back, its face flashing as it rocks.
// The plane it flutters in is set at an angle to the screen, so the page sees the glide partly as sideways
// travel and partly as the flake coming nearer and going back.

export type Fall = {
  /** Position in the flutter plane, m (y down), angle of the plate to the horizontal (rad), and velocities. */
  x: number;
  y: number;
  th: number;
  vx: number;
  vy: number;
  w: number;
  /** Turn about its own normal (rad) and its rate: a cut snowflake is never quite balanced. */
  spin: number;
  spinRate: number;
};

export const FALL = {
  /** The paper's width (chord), m, its thickness and density, and the air's. */
  chord: 0.08,
  thickness: 0.00012,
  paper: 700,
  air: 1.2,
  /** Quasi-steady coefficients (Andersen et al.): drag A − B cos 2α, translational and rotational lift. */
  A: 1.4,
  B: 1.0,
  CT: 1.2,
  CR: Math.PI,
  mu1: 0.2,
  mu2: 0.2,
  /** A snowflake is lacy: an effective area for its weight. */
  fill: 0.55,
  g: 9.81,
};

/** A flake let go from the glass: upright (th = 90°), with the hand's velocity. */
export function release(vx = 0, vy = 0, seed = 1): Fall {
  const rnd = mulberry32(seed);
  return { x: 0, y: 0, th: (Math.PI / 2) * (rnd() < 0.5 ? 1 : -1) * 0.96, vx, vy, w: (rnd() - 0.5) * 2, spin: 0, spinRate: (rnd() - 0.5) * 3 };
}

/** One step of the fall, dt seconds (keep it at a millisecond or less). */
export function fallStep(s: Fall, dt: number) {
  const { chord: l, thickness: d, paper, air, A, B, CT, CR, mu1, mu2, fill, g } = FALL;
  // Per unit depth: the plate's mass (lacy: less paper than its outline), its buoyancy-corrected weight, the
  // air it drags along (added mass) and its moment of inertia.
  const m = paper * l * d * fill;
  const mw = (paper - air) * l * d * fill;
  const m11 = 0;
  const m22 = (Math.PI * air * l * l) / 4;
  const I = (m * (l * l + d * d)) / 12;
  const Ia = (Math.PI * air * Math.pow(l / 2, 4)) / 8;
  // Into the plate's frame.
  const c = Math.cos(s.th), sn = Math.sin(s.th);
  const u = s.vx * c + s.vy * sn;
  const v = -s.vx * sn + s.vy * c;
  const V = Math.hypot(u, v) || 1e-9;
  // Circulation: from the angle of attack (translational) and from the spin (rotational).
  const gamma = (-CT * (l / 2) * u * v) / V + (CR * (l * l) / 2) * s.w;
  // Drag, small edge on (α = 0) and large broadside (α = 90°): cos 2α = (u² − v²)/V².
  const cd = A - (B * (u * u - v * v)) / (V * V);
  const Fu = 0.5 * air * l * cd * V * u;
  const Fv = 0.5 * air * l * cd * V * v;
  const tau = Math.PI * air * Math.pow(l / 2, 4) * (mu1 + mu2 * Math.abs(s.w)) * s.w;
  // Gravity, in the plate's frame (y down: g along +y).
  const gu = mw * g * sn;
  const gv = mw * g * c;
  const du = ((m + m22) * v * s.w - air * gamma * v - Fu + gu) / (m + m11);
  const dv = (-(m + m11) * u * s.w + air * gamma * u - Fv + gv) / (m + m22);
  const dw = ((m11 - m22) * u * v - tau) / (I + Ia);
  const nu = u + du * dt, nv = v + dv * dt;
  s.w += dw * dt;
  s.th += s.w * dt;
  const c2 = Math.cos(s.th), s2 = Math.sin(s.th);
  s.vx = nu * c2 - nv * s2;
  s.vy = nu * s2 + nv * c2;
  s.x += s.vx * dt;
  s.y += s.vy * dt;
  s.spin += s.spinRate * dt;
}
