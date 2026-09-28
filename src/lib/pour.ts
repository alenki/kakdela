// The buttons' pour as a liquid, not a drawing of one. The pill is a small tank seen from the front,
// about 4 cm tall, and one liquid is poured into it down the end wall on the pointer's side, the way a
// barista pours down the side of a cup: a gush that eases off as the level nears the brim, the level
// following the pill's real cross-section. The poured share lands at that wall as a wedge that runs
// across the floor, meets the far wall and comes back, and the pill tops up unevenly, as it would. The
// surface is the tank's own standing waves (the sloshing modes), each at the tempo water at that depth
// and wavelength would have: long waves slow and gentle, short ones quick and soon gone, everything
// slower and more damped in the shallows. A drain runs out at the exit-side wall with a falling head
// (quick, then slower), and deep liquid leaves calmly with a gentle lean. Crests are a little sharper
// than troughs and the liquid climbs the walls a little. Plain TS on purpose: no DOM, so the tests can
// drive it; pour-controller.ts puts it on the page.

/** The modes simulated: the pour excites nothing finer on a 48px pill. */
const MODES = 12;
/** Substeps at most this long, so the pour reads the same at 60 and 144 frames a second. */
const STEP = 1 / 240;

/** The tank: a pill 48px tall is 4 cm, so the physics below is water at that size. */
const REF_H = 48;
const METRES = 0.04;
const GRAVITY = 9.81;
/** Water's surface tension over its density, m³/s² (a fraction of a pixel here, but honest). */
const TENSION = 7.28e-5;

/** The pour: at first this many brim-fulls a second, easing off by EASE share at the brim. */
const GUSH = 2.26;
const EASE = 0.55;
/** The drain: brim-fulls a second at full head, falling with the square root of the level, never under
    FLOOR of that. */
const DRAIN = 1 / 0.3;
const FLOOR = 0.35;
/** The valve's lag, seconds, opening and closing. */
const VALVE_IN = 0.05;
const VALVE_OUT = 0.04;

/** The share of the flow that arrives (or leaves) at the wall rather than evenly, on a 170px pill; a
    wider pill gets less, so it doesn't look stormier. */
const POUR_SHARE = 0.34;
const DRAIN_SHARE = 0.3;
const REF_W = 170;
/** How far in from its wall the stream lands, as a share of the width, and how wide it lands (px). */
const WALL = 0.12;
const STREAM = 12;

/** Damping, per second: a floor, a viscous term that eats short waves (px²/s), and friction with the
    floor that grows as the liquid thins (px²/s over the depth squared, capped). */
const DAMP = 1.2;
const DAMP_SHORT = 250;
const BED = 120;
const BED_MAX = 30;
/** The shallowest depth the waves feel, px. */
const SHALLOW = 1.5;
/** The meniscus: how high the liquid climbs a wall (px), how far out, and the depth over which it forms
    (and, under the rim, fades). */
const MENISCUS = 1.5;
const MENISCUS_REACH = 3.5;
const MENISCUS_FADE = 6;
/** Crest sharpening: the sideways drift of the first few modes, capped so the line never folds. */
const DRIFT = 0.4;
const DRIFT_MODES = 6;
const DRIFT_LIFT = 1.5;
const DRIFT_MAX = 8;
/** A pour that hasn't settled after this many seconds is put at its end (a guard, never reached). */
const TIMEOUT = 3;
/** The clip runs this far past the pill on every side, so no rounding of its size can show an edge. */
const PAD = 8;

export type Pour = {
  /** The pill, px. */
  w: number;
  h: number;
  /** Liquid in the pill, px² (the tank is seen from the front). Under 0 or past the brim it is out of sight. */
  vol: number;
  /** px²/s, in (+) or out (−). */
  flow: number;
  /** Where it is heading: brim-full (hover, focus, press) or empty. */
  full: boolean;
  /** Where the stream lands (or the outlet sits): px from the pill's left, near one end wall. */
  inlet: number;
  /** The surface's standing modes: amplitudes (px) and velocity potentials. Index 0 is unused. */
  amp: Float64Array;
  pot: Float64Array;
  /** Seconds since the pour last changed direction. */
  age: number;
  /** Settled, brim-full or empty: nothing to step or draw. */
  still: boolean;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/* ───── The pill's cross-section ───── */

/** The round ends' radius (a pill wider than tall). */
const radius = (p: Pour) => Math.min(p.w, p.h) / 2;

/** The liquid's width at height y from the bottom. */
export function chord(p: Pour, y: number) {
  const r = radius(p);
  const d = clamp(y, 0, 2 * r) - r;
  return p.w - 2 * r + 2 * Math.sqrt(Math.max(0, r * r - d * d));
}

/** The liquid under height y (0 ≤ y ≤ h): the straight middle plus a circle's segment for the two ends. */
export function area(p: Pour, y: number) {
  const r = radius(p);
  const yy = clamp(y, 0, 2 * r);
  const seg = r * r * Math.acos(clamp((r - yy) / r, -1, 1)) - (r - yy) * Math.sqrt(Math.max(0, 2 * r * yy - yy * yy));
  return (p.w - 2 * r) * yy + seg;
}

export const brimVol = (p: Pour) => area(p, p.h);

/** The mean level for a volume; past the brim or under the floor it carries on as if the walls did. */
export function levelOf(p: Pour, vol: number) {
  const max = brimVol(p);
  if (vol <= 0) return vol / p.w;
  if (vol >= max) return p.h + (vol - max) / p.w;
  let lo = 0;
  let hi = p.h;
  for (let i = 0; i < 26; i++) {
    const mid = (lo + hi) / 2;
    if (area(p, mid) < vol) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/** The volume for a mean level: levelOf's inverse. */
function volOf(p: Pour, level: number) {
  if (level <= 0) return level * p.w;
  if (level >= p.h) return brimVol(p) + (level - p.h) * p.w;
  return area(p, level);
}

/** The depth the waves feel at a level: the liquid's area over its width (hydraulic depth). */
function depthAt(p: Pour, level: number) {
  if (level <= 0) return SHALLOW;
  const y = Math.min(level, p.h);
  return Math.max(SHALLOW, area(p, y) / Math.max(chord(p, y), 1) + Math.max(0, level - p.h));
}

/** Where the surface meets the walls at a level: its left end and its width. */
function spanAt(p: Pour, level: number) {
  const c = Math.max(chord(p, level), 1);
  return { left: (p.w - c) / 2, width: c };
}

/** How far the surface can stand off its mean level, px: a bound, every mode at its crest at once. */
function reach(p: Pour) {
  let r = MENISCUS + 0.5;
  for (let n = 1; n <= MODES; n++) r += Math.abs(p.amp[n]);
  return r;
}

/* ───── State ───── */

export function pour(w: number, h: number): Pour {
  const W = Math.max(w, h, 1);
  return {
    w: W,
    h: Math.max(h, 1),
    vol: 0,
    flow: 0,
    full: false,
    inlet: W * WALL,
    amp: new Float64Array(MODES + 1),
    pot: new Float64Array(MODES + 1),
    age: 0,
    still: true,
  };
}

/** The pill changed size (a font arrived, the label changed): keep how full it is. */
export function resizePour(p: Pour, w: number, h: number) {
  w = Math.max(w, h, 1);
  h = Math.max(h, 1);
  if (w === p.w && h === p.h) return;
  const before = brimVol(p);
  const share = p.vol / before;
  const flowShare = p.flow / before;
  p.inlet *= w / p.w;
  p.w = w;
  p.h = h;
  const after = brimVol(p);
  p.vol = share * after;
  p.flow = flowShare * after;
}

/**
 * Head for brim-full or empty. The stream lands (or the outlet sits) by the end wall nearer x, px from
 * the pill's left: where the pointer came in or left, the side the keyboard focus came from. Without x
 * it stays where it was.
 */
export function pourTo(p: Pour, full: boolean, x?: number) {
  if (x !== undefined) p.inlet = (x < p.w / 2 ? WALL : 1 - WALL) * p.w;
  if (!p.still) {
    if (p.full !== full) {
      // Turning back from past the brim (or under the floor): the stretch out of sight is skipped, so
      // the surface shows at once. Nothing visible moves.
      const level = levelOf(p, p.vol);
      const off = reach(p);
      if (!full && level - off > p.h) {
        p.vol = volOf(p, p.h + off);
        p.flow = Math.min(p.flow, 0);
      } else if (full && level + off < 0) {
        p.vol = volOf(p, -off);
        p.flow = Math.max(p.flow, 0);
      }
      p.age = 0;
    }
    p.full = full;
    return;
  }
  if (p.full === full) return;
  // From rest the level sits right at the rim or the floor, so the first frame already moves.
  p.vol = p.full ? brimVol(p) : 0;
  p.full = full;
  p.age = 0;
  p.still = false;
}

/** Put the pour at its end at once: brim-full or empty, a calm surface, the valve shut. */
export function settlePour(p: Pour, full: boolean) {
  p.full = full;
  p.vol = full ? brimVol(p) : 0;
  p.flow = 0;
  p.amp.fill(0);
  p.pot.fill(0);
  p.age = 0;
  p.still = true;
}

function substep(p: Pour, dt: number) {
  const max = brimVol(p);
  const unit = p.h / REF_H;

  // The valve: a gush that eases off toward the brim, or a drain whose head falls with the level.
  const want = p.full
    ? GUSH * max * Math.max(0, 1 - EASE * Math.pow(Math.max(0, p.vol / max), 1.2))
    : -DRAIN * max * Math.max(FLOOR, Math.sqrt(clamp(levelOf(p, p.vol) / p.h, 0, 1)));
  p.flow += (want - p.flow) * (1 - Math.exp(-dt / (p.full ? VALVE_IN : VALVE_OUT)));
  p.vol += p.flow * dt;
  p.age += dt;

  const level = levelOf(p, p.vol);
  const { left, width } = spanAt(p, level);
  const depth = depthAt(p, level);
  const m = METRES / p.h;
  const g = GRAVITY / m;
  const tension = TENSION / (m * m * m);

  // The share of the flow that lands at the wall (a wedge; the rest only raises the level), fading out
  // in a thin film, where there is nothing yet for it to push. Past the brim or under the floor there
  // is no surface to push at all.
  const inside = p.vol > 0 && p.vol < max;
  const out = p.flow < 0;
  const share = inside ? ((out ? DRAIN_SHARE : POUR_SHARE) * ((REF_W * unit) / p.w) * depth) / (depth + 3 * unit) : 0;
  const at = p.inlet - left;
  const sigma = STREAM * unit;
  // In the last shallows the drain takes the liquid from wherever it is, in proportion to the depth
  // there, so the waves sink with the level; under the floor there is no surface left to wave.
  const squeeze = p.vol <= 0 ? 40 : out && p.vol < 0.25 * max ? -p.flow / p.vol : 0;

  for (let n = 1; n <= MODES; n++) {
    const k = (n * Math.PI) / width;
    const kd = k * depth;
    // The stream's bell on this mode (its mirror images in the walls included), and for a drain the
    // depth's filter: deep liquid only feels the outlet's long waves.
    const source = (2 / width) * Math.cos(k * at) * Math.exp(-0.5 * (k * sigma) ** 2) * (out ? 1 / Math.cosh(Math.min(kd, 30)) : 1);
    // Semi-implicit Euler: the potential feels the surface's pull, the surface follows the potential and
    // takes the stream's share; then both decay at exactly the mode's rate.
    p.pot[n] -= (g + tension * k * k) * p.amp[n] * dt;
    p.amp[n] += (k * Math.tanh(kd) * p.pot[n] + share * p.flow * source) * dt;
    const decay = DAMP + DAMP_SHORT * unit * unit * k * k + Math.min(BED_MAX, (BED * unit * unit) / (depth * depth)) + squeeze;
    const e = Math.exp(-decay * dt);
    p.amp[n] *= e;
    p.pot[n] *= e;
  }
}

/** Advance `dt` seconds (capped: a tab that slept must not fling the liquid). */
export function stepPour(p: Pour, dt: number) {
  if (p.still) return;
  const t = Math.min(Math.max(dt, 0), 1 / 30);
  const n = Math.max(1, Math.ceil(t / STEP - 1e-9));
  for (let i = 0; i < n; i++) substep(p, t / n);
  if (!Number.isFinite(p.vol) || !Number.isFinite(p.flow) || !Number.isFinite(p.amp[1]) || p.age > TIMEOUT) {
    settlePour(p, p.full);
    return;
  }
  // Once the whole surface is out of sight past the rim (or under the floor), heading on out, the rest
  // of the way is invisible: the pour rests now, and a turn back starts right at the rim or the floor
  // with a calm surface, as it would be by then.
  const level = levelOf(p, p.vol);
  const off = reach(p);
  if (p.full ? level - off > p.h : level + off < 0) settlePour(p, p.full);
}

/* ───── The surface ───── */

export type Surface = {
  /** Points along the surface, left to right, in the pill's box (px, y down from its top). */
  xs: Float64Array;
  ys: Float64Array;
  count: number;
};

export const surfaceBuffer = (): Surface => ({ xs: new Float64Array(129), ys: new Float64Array(129), count: 0 });

const mK = new Float64Array(MODES + 1);
const mLift = new Float64Array(MODES + 1);

/** Sample the surface into `out`: roughly every 3px across the pill, a pixel past both sides. */
export function sampleSurface(p: Pour, out: Surface) {
  const level = levelOf(p, p.vol);
  const { left, width } = spanAt(p, level);
  const depth = depthAt(p, level);
  const unit = p.h / REF_H;
  for (let n = 1; n <= MODES; n++) {
    mK[n] = (n * Math.PI) / width;
    mLift[n] = Math.min(DRIFT_LIFT, 1 / Math.tanh(mK[n] * depth));
  }
  const men = MENISCUS * unit * smooth(0, MENISCUS_FADE * unit, level) * smooth(0, MENISCUS_FADE * unit, p.h - level);
  const reachPx = MENISCUS_REACH * unit;
  const drift = DRIFT * smooth(4 * unit, 14 * unit, depth);
  const count = clamp(Math.ceil(p.w / 3), 24, out.xs.length - 1);

  for (let i = 0; i <= count; i++) {
    const x = -1 + (i / count) * (p.w + 2);
    const s = x - left;
    // Past the waterline's ends (in the round ends, near the floor and the rim) the surface carries on
    // flat from where it meets the wall: a mirror image there would stand liquid next to air.
    const th1 = (Math.PI * clamp(s, 0, width)) / width;
    const c1 = Math.cos(th1);
    // cos(nθ) and sin(nθ) by recurrence.
    let cPrev = 1;
    let cN = c1;
    let sPrev = 0;
    let sN = Math.sin(th1);
    let eta = 0;
    let xi = 0;
    for (let n = 1; n <= MODES; n++) {
      eta += p.amp[n] * cN;
      if (n <= DRIFT_MODES) xi -= p.amp[n] * sN * mLift[n];
      const cNext = 2 * c1 * cN - cPrev;
      const sNext = 2 * c1 * sN - sPrev;
      cPrev = cN;
      cN = cNext;
      sPrev = sN;
      sN = sNext;
    }
    const inside = s > 0 && s < width;
    const climb = men * (Math.exp(-Math.max(0, s) / reachPx) + Math.exp(-Math.max(0, width - s) / reachPx));
    let X = inside ? x + drift * clamp(xi, -DRIFT_MAX, DRIFT_MAX) : x;
    // The drift never lets a point pass the one before it: the line can sharpen, never fold.
    if (i > 0 && X < out.xs[i - 1] + 0.05) X = out.xs[i - 1] + 0.05;
    out.xs[i] = X;
    out.ys[i] = p.h - (level + eta + climb);
  }
  out.count = count;
  return out;
}

const r2 = (v: number) => Math.round(v * 100) / 100;

/**
 * The liquid as a CSS clip-path for the pill's box, or "full" / "empty" when none of the surface is in
 * sight (nothing to clip, nothing to draw).
 */
export function pourClip(p: Pour, buf: Surface = surfaceBuffer()): string {
  if (p.still) return p.full ? "full" : "empty";
  const { xs, ys, count } = sampleSurface(p, buf);
  let top = Infinity;
  let bottom = -Infinity;
  for (let i = 0; i <= count; i++) {
    top = Math.min(top, ys[i]);
    bottom = Math.max(bottom, ys[i]);
  }
  // Under a pixel from the rim or the floor reads as the pill's own edge: nothing to draw.
  if (bottom < 0.6) return "full";
  if (top > p.h - 0.6) return "empty";
  // A smooth curve through the samples (quadratic Béziers between their midpoints), carried flat out
  // past both sides and closed well below: border-radius rounds the pill, the clip only cuts the top.
  const floor = r2(p.h + PAD);
  let d = `M${-PAD} ${floor}L${-PAD} ${r2(ys[0])}L${r2(xs[0])} ${r2(ys[0])}`;
  for (let i = 1; i < count; i++) {
    d += `Q${r2(xs[i])} ${r2(ys[i])} ${r2((xs[i] + xs[i + 1]) / 2)} ${r2((ys[i] + ys[i + 1]) / 2)}`;
  }
  d += `L${r2(xs[count])} ${r2(ys[count])}L${r2(p.w + PAD)} ${r2(ys[count])}L${r2(p.w + PAD)} ${floor}Z`;
  return `path("${d}")`;
}
