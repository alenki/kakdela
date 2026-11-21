// Snow («С наступающим!», docs/CONVENTIONS.md): the falling flakes and the snow that settles on the footer's
// wordmark. No DOM here (snow.test.ts drives it); src/components/season/snow-controller.ts draws it.
//
// The snow is in the air in front of the page, in the screen's pixels. A flake is light: it takes the air's
// velocity within a quarter of a second, plus its own fall and its own zigzag (a flake rocks and slides as it
// falls). The air is a mean wind that gusts, slow eddies (a stream function, so the field is divergence-free
// and the flakes swirl instead of bunching), the drag of a scrolling page (the air next to the page goes with
// it, so the small, far flakes near it are carried most) and the wake of a moving pointer. Depth sets a
// flake's size, speed and parallax: the near ones are big, soft and quick.

import { mulberry32 } from "./seed";

export type Flake = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  /** 0: far, by the page; 1: near the guest. */
  z: number;
  /** Radius, px. */
  r: number;
  /** Its own zigzag: phase, rate (rad/s) and reach (px/s). */
  ph: number;
  w: number;
  sway: number;
};

export const SNOW = {
  /** Flakes per px² of screen, and at most. */
  density: 1 / 7600,
  max: 240,
  /** How long a flake takes to follow the air, s. */
  tau: 0.3,
  /** Fall, px/s: far flakes and near. */
  fallFar: 30,
  fallNear: 112,
  /** The mean wind and its gusts, px/s. */
  wind: 11,
  gust: 16,
  /** The eddies' strength, px/s. */
  eddy: 22,
  /** How much of a scrolling page's speed the air beside it takes. */
  drag: 0.34,
  /** A pointer's wake: its reach (px) and the share of its speed it gives the air. */
  wakeReach: 80,
  wake: 0.5,
};

export type Air = {
  t: number;
  /** The page's scroll speed (px/s, positive going down the page). */
  scroll: number;
  /** A moving pointer, px and px/s, or null. */
  hand: { x: number; y: number; vx: number; vy: number } | null;
};

/** A new flake somewhere in a w × h screen (or along its top edge, `top`). */
export function spawn(rnd: () => number, w: number, h: number, top = false): Flake {
  const z = Math.pow(rnd(), 1.7);
  return {
    x: rnd() * w,
    y: top ? -4 - rnd() * 30 : rnd() * h,
    vx: 0,
    vy: SNOW.fallFar + (SNOW.fallNear - SNOW.fallFar) * z,
    z,
    r: 0.75 + 2.7 * z * z,
    ph: rnd() * Math.PI * 2,
    w: 2.2 + rnd() * 5,
    sway: 5 + 16 * z,
  };
}

/** How many flakes a screen of w × h holds. */
export const flakesFor = (w: number, h: number) => Math.min(SNOW.max, Math.round(w * h * SNOW.density));

/**
 * The air's velocity at (x, y), px/s: the gusting mean wind plus three slow eddies from a stream function
 * ψ = Σ a sin(kx + ωt + φ) sin(ly + χ), u = ∂ψ/∂y, v = −∂ψ/∂x (divergence-free by construction).
 */
export function airAt(x: number, y: number, t: number): [number, number] {
  const mean = SNOW.wind + SNOW.gust * (0.6 * Math.sin(t * 0.27) + 0.4 * Math.sin(t * 0.83 + 1.3));
  let u = mean, v = 0;
  for (const [a, k, l, om, ph, ch] of EDDIES) {
    const sx = Math.sin(k * x + om * t + ph), cx = Math.cos(k * x + om * t + ph);
    const sy = Math.sin(l * y + ch), cy = Math.cos(l * y + ch);
    u += a * l * sx * cy;
    v -= a * k * cx * sy;
  }
  return [u, v];
}

/** The eddies: [amplitude (px²/s), k, l (1/px), ω (1/s), phases]. Each gives speeds of about SNOW.eddy. */
const EDDIES: [number, number, number, number, number, number][] = [
  [SNOW.eddy / (2 * Math.PI / 900), (2 * Math.PI) / 1300, (2 * Math.PI) / 900, 0.11, 0.4, 1.1],
  [(SNOW.eddy * 0.6) / (2 * Math.PI / 520), (2 * Math.PI) / 700, (2 * Math.PI) / 520, -0.17, 2.1, 0.3],
  [(SNOW.eddy * 0.35) / (2 * Math.PI / 260), (2 * Math.PI) / 340, (2 * Math.PI) / 260, 0.29, 4.0, 2.6],
];

/** One step of `dt` seconds for every flake in a w × h screen; flakes that leave come back from the top. */
export function fall(flakes: Flake[], dt: number, w: number, h: number, air: Air, rnd: () => number) {
  const k = 1 - Math.exp(-dt / SNOW.tau);
  const drag = Math.max(-500, Math.min(500, -air.scroll * SNOW.drag));
  const hand = air.hand;
  const reach2 = 2 * SNOW.wakeReach * SNOW.wakeReach;
  for (const f of flakes) {
    const par = 0.55 + 0.75 * f.z;
    const [ax, ay] = airAt(f.x, f.y, air.t);
    f.ph += f.w * dt;
    let tx = ax * par + Math.cos(f.ph) * f.sway;
    let ty = SNOW.fallFar + (SNOW.fallNear - SNOW.fallFar) * f.z + ay * par * 0.6 + Math.sin(f.ph * 2) * f.sway * 0.15;
    // The page drags the air beside it: the far flakes, near the page, go with it most.
    ty += drag * (1 - f.z) * (1 - f.z);
    if (hand) {
      const dx = f.x - hand.x, dy = f.y - hand.y;
      const near = Math.exp(-(dx * dx + dy * dy) / reach2);
      if (near > 0.01) {
        tx += hand.vx * SNOW.wake * near;
        ty += hand.vy * SNOW.wake * near;
      }
    }
    f.vx += (tx - f.vx) * k;
    f.vy += (ty - f.vy) * k;
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    if (f.y > h + 12 || f.y < -160) Object.assign(f, spawn(rnd, w, h, true));
    else if (f.x < -24) f.x += w + 48;
    else if (f.x > w + 24) f.x -= w + 48;
  }
}

// ── Snow that settles ──
// A grid of cells over the wordmark: 1 where a letter is, 2 where snow lies. A flake that comes down onto
// either rests on top, then slides while a lower neighbour is free; and where the surface round it is steeper
// than snow's angle of repose (about 45°, looked at four cells across) it slides off altogether: so caps grow
// round on every flat top, stop short of its corners and never cling to a letter's slanting strokes, as on a
// real sign. A cap stops growing at `deep` cells: heavier snow falls off a narrow edge.

export type Drift = { cols: number; rows: number; grid: Uint8Array; /** Snow cells per column. */ depth: Uint8Array; deep: number };

export function makeDrift(mask: Uint8Array, cols: number, rows: number, deep = 7): Drift {
  return { cols, rows, grid: Uint8Array.from(mask), depth: new Uint8Array(cols), deep };
}

/**
 * A flake coming down at column `c`, from row `r0` (the cell it is in now). If it lands (the cell under it
 * is a letter or snow), it rests and slides; returns where it settled, or null if it falls on through.
 */
export function land(d: Drift, c: number, r0: number, rnd: () => number): { c: number; r: number } | null {
  const { cols, rows, grid } = d;
  if (c < 0 || c >= cols || r0 < 0 || r0 >= rows - 1) return null;
  // Past the grid's sides and foot there is nothing to rest on.
  const at = (cc: number, rr: number) => (cc < 0 || cc >= cols || rr < 0 || rr >= rows ? 0 : grid[rr * cols + cc]);
  if (at(c, r0) !== 0 || at(c, r0 + 1) === 0) return null;
  let cc = c, rr = r0;
  for (let n = 0; n < 12; n++) {
    if (rr + 1 >= rows) return null;
    if (at(cc, rr + 1) === 0) {
      rr++;
      continue;
    }
    const l = at(cc - 1, rr + 1) === 0 && at(cc - 1, rr) === 0;
    const r = at(cc + 1, rr + 1) === 0 && at(cc + 1, rr) === 0;
    if (!l && !r) break;
    cc += l && r ? (rnd() < 0.5 ? -1 : 1) : l ? -1 : 1;
    rr++;
  }
  // Slid off the edge of the letters, with nothing under it: it falls on.
  if (cc < 0 || cc >= cols || at(cc, rr + 1) === 0) return null;
  // Too steep round here to hold snow: it slides off. The surface two cells either side, looked for from a
  // few cells above (an uphill side rises above the flake) to a few below.
  const surface = (c2: number) => {
    for (let k = -6; k <= 6; k++) if (at(c2, rr + k) !== 0) return k;
    return 14;
  };
  if (Math.abs(surface(cc - 2) - surface(cc + 2)) > 4) return null;
  // A hairline's end is too narrow to hold a flake: it wants something under two cells side by side.
  if ((at(cc - 1, rr + 1) !== 0 ? 1 : 0) + (at(cc + 1, rr + 1) !== 0 ? 1 : 0) === 0) return null;
  if (d.depth[cc] >= d.deep) return null;
  grid[rr * cols + cc] = 2;
  d.depth[cc]++;
  return { c: cc, r: rr };
}

/** The snow that fell before the guest got here: `n` flakes dropped straight down at random columns. */
export function snowedOn(d: Drift, n: number, seed = 7): { c: number; r: number }[] {
  const rnd = mulberry32(seed);
  const out: { c: number; r: number }[] = [];
  for (let k = 0; k < n; k++) {
    const c = Math.floor(rnd() * d.cols);
    // Down the column to the first cell with something under it.
    let r = 0;
    while (r < d.rows - 1 && d.grid[(r + 1) * d.cols + c] === 0) r++;
    if (r >= d.rows - 1) continue;
    const p = land(d, c, r, rnd);
    if (p) out.push(p);
  }
  return out;
}
