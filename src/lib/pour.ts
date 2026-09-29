// The buttons' pour as a liquid, not a drawing of one. The pill is a small tank seen from the front,
// about 4 cm tall, and one liquid is poured into it near the end wall on the pointer's side, the way
// a barista pours down the side of a cup. The pour arrives with a run: a first rush, then a gush that
// eases off as the level nears the brim, coming in gulps as air gets past the stream, the level
// following the pill's real cross-section. The stream hits the bare floor moving sideways and shoots
// across it as a sheet; the wave it drives slams into the far wall, climbs it and falls back, and the
// pill tops up unevenly behind it. Where the stream lands it churns the surface into short ripples
// that run out from it, and so does the sheet's head as it runs. The surface is the tank's own
// standing waves (the sloshing modes), each at the tempo water at that depth and wavelength would
// have: long waves slow and lingering, short ones quick and soon gone, everything slower and more
// damped in the shallows, where a front steepens as it runs; a face too steep for water spills, and a
// slosh that stands too tall breaks. A drain runs out at the exit-side wall with a falling head and a
// lurch toward it. No two pours are alike: each start or turn deals its own strength, landing, slant,
// run, gulps, chop and lurch from the pour's seed, so the same seed replays the same pours. Crests
// are a little sharper than troughs and the liquid climbs the walls a little. Plain TS on purpose: no
// DOM, so the tests can drive it; pour-controller.ts puts it on the page.

/** The modes simulated: the chop excites nothing finer on a 48px pill. */
const MODES = 20;
/** Substeps at most this long, so the pour reads the same at 60 and 144 frames a second. */
const STEP = 1 / 240;
/** Waves shorter than this (px) are left out: the samples couldn't draw them on a small pill. */
const SHORTEST = 12;

/** The tank: a pill 48px tall is 4 cm, so the physics below is water at that size. */
const REF_H = 48;
const METRES = 0.04;
const GRAVITY = 9.81;
/** Water's surface tension over its density, m³/s² (a fraction of a pixel here, but honest). */
const TENSION = 7.28e-5;

/** The pour: at first this many brim-fulls a second, easing off by EASE share at the brim. */
const GUSH = 3.3;
const EASE = 0.7;
/** The first rush: the stream arrives with a run, about this share over the gush (each pour is dealt
    0.4 to 1.3 of it), dying away over about RUSH_FOR seconds. */
const RUSH = 0.4;
const RUSH_FOR = 0.1;
/** The gulps: the flow comes in pulses GLUG_BEAT_MIN to GLUG_BEAT_MAX seconds apart (each pour rolls its
    own), each a little early or late by up to GLUG_SLIP of a beat and a bell GLUG_WIDTH seconds wide;
    between them it falls to 1 − GLUG of its mean. A drain gulps too, by GURGLE. */
const GLUG = 0.2;
const GLUG_BEAT_MIN = 0.1;
const GLUG_BEAT_MAX = 0.15;
const GLUG_SLIP = 0.35;
const GLUG_WIDTH = 0.045;
const GURGLE = 0.08;
/** Each gulp digs the stream's crater and throws it up again: SPLASH share of the flow over SPLASH_WIDE
    px, growing in over the first CRATER px of depth (a crater can't be deeper than the pool). */
const SPLASH = 0.15;
const SPLASH_WIDE = 8;
const CRATER = 8;
/** The chop: where the stream lands its pressure rises and falls at random, by a head of up to about
    CHOP px of water over CHOP_WIDE px, changing every CHOP_BEAT seconds (quick enough to ring the
    shortest waves); the sheet's head churns at FRONT_CHOP of that as it runs, an outlet burbles at
    DRAIN_CHOP. A pour's chop is dealt between CHOP_LEAST and all of it. */
const CHOP = 14;
const CHOP_WIDE = 4;
const CHOP_BEAT = 0.035;
const FRONT_CHOP = 0.5;
const DRAIN_CHOP = 0.3;
const CHOP_LEAST = 0.6;
/** The drain: brim-fulls a second at full head, falling with the square root of the level, never under
    FLOOR of that. */
const DRAIN = 3.7;
const FLOOR = 0.45;
/** The valve's lag, seconds, opening and closing. */
const VALVE_IN = 0.05;
const VALVE_OUT = 0.04;

/** The share of the flow that arrives (or leaves) at the wall rather than evenly, on a 170px pill; a
    wider pill gets less, so it doesn't look stormier. */
const POUR_SHARE = 0.4;
const DRAIN_SHARE = 0.34;
const REF_W = 170;
/** Where the stream lands: WALL of the width in from its wall, and up to WALL_SPREAD more (each pour
    rolls it), then FOLLOW of the pointer's own distance from that wall further in. How wide it lands
    (px). */
const WALL = 0.07;
const WALL_SPREAD = 0.09;
const FOLLOW = 0.15;
const STREAM = 12;
/** The stream's wander as it lands: a sway of SWAY px a few times a second, and a quicker tremble. */
const SWAY = 4;
const SWAY_BEATS = 4;
const TREMBLE = 1.5;
const TREMBLE_BEATS = 15;
/** The sheet: a stream hitting a bare floor doesn't pile up, it shoots across it as a thin sheet, far
    quicker than a wave could run in liquid that shallow. This share of what lands goes with it, laid
    along its trail and heaped at its head (LIP of it), while the pool is under SHEET_DEEP px deep; and
    while it runs it takes TAKES of what would have piled at the stream. */
const SHEET = 0.75;
const SHEET_DEEP = 24;
const LIP = 0.7;
const TAKES = 0.7;
/** The sheet's head: px/s as it leaves the stream (about 0.6 m/s at this size), slowing over
    SHEET_FOR seconds, and how wide its heap is (px). */
const SHEET_SPEED = 760;
const SHEET_FOR = 0.8;
const SHEET_LIP = 10;
/** The sheet's run: the momentum its head carries into the liquid it meets (px/s of it). */
const PUSH = 70;
/** The stream's slant: each pour's stream comes in at its own angle, and for as long as it runs it
    shoves the whole pill's liquid toward the far wall or back against its own, by up to this head (px)
    at full flow. */
const SLANT = 5;

/** Damping, per second: a floor, a viscous term that eats short waves (px²/s), and friction with the
    floor that grows as the liquid thins (px²/s over the depth squared, capped). */
const DAMP = 1.0;
const DAMP_SHORT = 215;
const BED = 90;
const BED_MAX = 22;
/** Past the brim the unseen liquid calms quickly, per second for every px over, so the last trough
    fills in and the pour rests soon after it covers; and in the last LID_DEEP px under the rim the
    surface calms by up to LID per second, so the last trough closes rather than sloshing on. */
const BRIM_CALM = 6;
const LID = 8;
const LID_DEEP = 8;
/** Breaking: a slosh standing more than BREAK_AT px off its level (its modes' root mean square) spills
    over itself and loses its energy, this much faster per second for every px beyond. */
const BREAK_AT = 6.5;
const BREAK = 2.5;
/** Spilling: water can't hold a face steeper than SPILL (rise over run). Past it the face spills, and
    the modes that build it lose energy at SPILL_RATE per second for each unit of steepness over,
    shared out by their part in it. */
const SPILL = 0.6;
const SPILL_RATE = 200;
/** The surface is searched at this many points across for its steepest face. */
const PROBES = 64;
/** Under this far (px) from the rim or the floor, the surface reads as the pill's own edge. */
const EDGE = 0.6;
/** The shallowest depth the waves feel, px, and the share of the waves' own height they feel on top
    (a heap runs on the liquid in it, so big waves travel faster). */
const SHALLOW = 1.5;
const HEAP = 0.6;
/** The meniscus: how high the liquid climbs a wall (px), how far out, and the depth over which it forms
    (and, under the rim, fades). */
const MENISCUS = 1.5;
const MENISCUS_REACH = 3.5;
const MENISCUS_FADE = 6;
/** The climb: liquid rising fast at a wall runs on up it as a thin tongue. How much of that rise it
    keeps (seconds of it), how quickly it falls back (rad/s) and how damped, how wide it is and how
    high it can get (px). */
const CLIMB = 0.035;
const CLIMB_PACE = 24;
const CLIMB_DAMP = 0.55;
const CLIMB_REACH = 7;
const CLIMB_MAX = 6;
/** Crest sharpening: the sideways drift of the first few modes, capped so the line never folds. */
const DRIFT = 0.45;
const DRIFT_MODES = 6;
const DRIFT_LIFT = 1.5;
const DRIFT_MAX = 8;
/** The bore: in the shallows the surface rides on the liquid under it for this long (s), so a crest
    runs ahead of its trough and a front steepens as it goes; gone by BORE_DEEP px of depth. */
const BORE = 0.035;
const BORE_DEEP = 22;
const BORE_MAX = 9;
/** How far off the level (px) the surface counts as crest or trough for that ride. */
const TROUGH = 3;
/** However the surface is carried sideways, it is never steeper than this, nor any stretch of it
    squeezed under CROWD of its width. */
const SLOPE_MAX = 1.1;
const CROWD = 0.4;
/** A turn's jolt: the long waves' random knock and the lurch toward the outlet (or away from the
    stream), px of swing, and how far the lurch can sag or bulge in the middle (a share of it). */
const KNOCK = 5;
const LURCH = 7;
const BOWL = 0.6;
const JOLT_MODES = 5;
/** How long a flow runs before it has its full way on, s. */
const JOLT_AFTER = 0.3;
/** A pour that hasn't settled after this many seconds is put at its end (a guard, never reached). */
const TIMEOUT = 3;
/** The clip runs this far past the pill on every side, so no rounding of its size can show an edge. */
const PAD = 8;

/** One pour's temper, drawn afresh each time it starts or turns: shares of the constants above. */
export type Mood = {
  /** The gush's strength and the first rush's, and how long the rush lasts (a share of RUSH_FOR). */
  gush: number;
  rush: number;
  rushFor: number;
  /** The sheet's share, speed and push. */
  sheet: number;
  speed: number;
  push: number;
  /** How far in from its wall the stream lands (a share of the width), and how wide it lands. */
  land: number;
  stream: number;
  /** How high the liquid piles under the stream (a share of POUR_SHARE, and of DRAIN_SHARE for the
      outlet's pull), and the stream's slant (−1 back toward its own wall to 1 toward the far one). */
  pile: number;
  slant: number;
  /** The walls' climb; the turn's lurch, how sharply it bends (its third mode) and whether it sags or
      bulges in the middle (its second, −1 to 1); and the chop's strength. */
  climb: number;
  lurch: number;
  bend: number;
  bowl: number;
  chop: number;
  /** The gulps: seconds apart, and when the first comes. */
  beat: number;
  lead: number;
  /** The key everything that wanders is drawn from: the gulps, the sway, the chop. */
  key: number;
};

export type Pour = {
  /** The pill, px. */
  w: number;
  h: number;
  /** Liquid in the pill, px² (the tank is seen from the front). Under 0 or past the brim it is out of sight. */
  vol: number;
  /** px²/s, in (+) or out (−), before the gulps. */
  flow: number;
  /** Where it is heading: brim-full (hover, focus, press) or empty. */
  full: boolean;
  /** Where the stream lands (or the outlet sits): px from the pill's left, near one end wall. */
  inlet: number;
  /** The surface's standing modes: amplitudes (px) and velocity potentials. Index 0 is unused. */
  amp: Float64Array;
  pot: Float64Array;
  /** The tongues up the end walls, left then right: each a height (px) and its rate. */
  run: Float64Array;
  /** Seconds since the pour last changed direction, and since its sheet set off. */
  age: number;
  sheet: number;
  /** Settled, brim-full or empty: nothing to step or draw. */
  still: boolean;
  /** The pour's dice (a mulberry32 state): the same seed deals the same pours. */
  luck: number;
  mood: Mood;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/* ───── Chance ───── */

/** mulberry32's mix (as in seed.ts): a whole number to a number from 0 to 1. */
function mix(a: number) {
  let t = a >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** The next roll of the pour's dice, 0 to 1 (mulberry32, with its state kept in the pour). */
function roll(p: Pour) {
  p.luck = (p.luck + 0x6d2b79f5) >>> 0;
  return mix(p.luck);
}
const between = (p: Pour, lo: number, hi: number) => lo + (hi - lo) * roll(p);

/** A number from 0 to 1 for point i of noise `key`: the same every time it is asked. */
const lattice = (key: number, i: number) => mix(key + Math.imul(i, 0x9e3779b9));

/** Strand `salt` of a key: noise of its own, unrelated to the key's other strands. */
const strand = (key: number, salt: number) => (key ^ Math.imul(salt, 0x85ebca6b)) >>> 0;

/** Smooth noise from −1 to 1 at time t, s, wandering about `beats` times a second. A function of the
    pour's clock alone, so it plays the same at any frame rate. */
function noise(key: number, t: number, beats: number) {
  const x = t * beats;
  const i = Math.floor(x);
  const f = x - i;
  const a = lattice(key, i);
  return 2 * (a + (lattice(key, i + 1) - a) * f * f * (3 - 2 * f)) - 1;
}

/** The gulps: the flow over its mean at pour time t, dipping by `dip` between gulps. Each gulp is a
    bell, a little early or late and a little bigger or smaller than the last; together they average 1. */
function glug(m: Mood, t: number, dip: number) {
  const u = (t - m.lead) / m.beat;
  const near = Math.round(u);
  let sum = 0;
  for (let k = near - 1; k <= near + 1; k++) {
    // Gulp k's timing and size, from two draws of its own.
    const at = k + GLUG_SLIP * (2 * lattice(m.key, k) - 1);
    const size = 0.7 + 0.6 * lattice(m.key, k + 7919);
    const x = ((u - at) * m.beat) / GLUG_WIDTH;
    sum += size * Math.exp(-x * x);
  }
  // A bell's area is its width times √π: over a beat, one gulp's worth.
  return 1 - dip + (dip * sum * m.beat) / (GLUG_WIDTH * Math.sqrt(Math.PI));
}

const calm = (): Mood => ({
  gush: 1, rush: 1, rushFor: 1, sheet: 1, speed: 1, push: 1, land: WALL, stream: 1, pile: 1,
  slant: 0, climb: 1, lurch: 1, bend: 1, bowl: 0, chop: 1, beat: GLUG_BEAT_MIN, lead: 0, key: 0,
});

/** A fresh temper for the pour that is starting (or turning) now; its sheet sets off afresh. */
function deal(p: Pour) {
  const m = p.mood;
  m.gush = between(p, 0.95, 1.06);
  m.rush = between(p, 0.4, 1.3);
  m.rushFor = between(p, 0.7, 1.4);
  m.sheet = between(p, 0.55, 1.2);
  m.speed = between(p, 0.75, 1.2);
  m.push = between(p, 0.6, 1.4);
  m.land = WALL + WALL_SPREAD * roll(p);
  m.stream = between(p, 0.75, 1.3);
  m.pile = between(p, 0.5, 1.7);
  m.slant = between(p, -1, 1);
  m.climb = between(p, 0.6, 1.4);
  // Held under the break (BREAK_AT), where every lurch would end up the same size.
  m.lurch = between(p, 0.35, 0.9);
  m.bend = between(p, 0, 1.6);
  m.bowl = between(p, -1, 1);
  m.chop = between(p, CHOP_LEAST, 1);
  m.beat = between(p, GLUG_BEAT_MIN, GLUG_BEAT_MAX);
  // The first gulp comes about a tenth to half a beat in, give or take its slip.
  m.lead = between(p, 0.1, 0.5) * m.beat;
  m.key = (roll(p) * 4294967296) >>> 0;
  p.sheet = 0;
}

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

/** A tongue's height as drawn: soft-capped, so a hard slam climbs high but never spikes. */
const tongue = (run: number, unit: number) => CLIMB_MAX * unit * Math.tanh(Math.max(0, run) / (CLIMB_MAX * unit));

/* ───── State ───── */

export function pour(w: number, h: number, seed = 1): Pour {
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
    run: new Float64Array(4),
    age: 0,
    sheet: 0,
    still: true,
    // Stirred, so seeds next to each other deal pours nothing alike.
    luck: (mix(seed ^ 0x9e3779b9) * 4294967296) >>> 0,
    mood: calm(),
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

/** Where the stream lands (or the outlet sits) for a pointer at x: in from the nearer end wall by this
    pour's own landing, and a little further toward the pointer. */
function aim(p: Pour, x: number) {
  const left = x < p.w / 2;
  const d = p.mood.land * p.w + FOLLOW * clamp(left ? x : p.w - x, 0, p.w / 2);
  p.inlet = left ? d : p.w - d;
}

/**
 * A turn jolts the liquid: a drain lurches toward its outlet, a pour turned back in heaves away from
 * its stream, and the long waves take a random knock. It sets them moving rather than moving them,
 * so the surface barely shifts that frame. `momentum` (0 to 1) is how much way the flow it turns had on: a flow only just
 * started has little to lurch with.
 */
function jolt(p: Pour, momentum: number) {
  // Under the floor there is nothing to jolt yet.
  const level = levelOf(p, p.vol);
  if (level <= 0) return;
  const { width } = spanAt(p, level);
  const depth = depthAt(p, level);
  const unit = p.h / REF_H;
  const m = METRES / p.h;
  const g = GRAVITY / m;
  const tension = TENSION / (m * m * m);
  // Both lean the same way: down at the outlet, or up away from the stream.
  const side = p.inlet > p.w / 2 ? 1 : -1;
  for (let n = 1; n <= JOLT_MODES; n++) {
    const k = (n * Math.PI) / width;
    const kt = k * Math.tanh(k * depth);
    let swing = (KNOCK * unit * (2 * roll(p) - 1)) / n;
    // A tilt, end to end, is the odd modes in this measure: each turn bends it its own way (more or less
    // of the third) and sags or bulges its middle (the second).
    const lean = LURCH * p.mood.lurch * unit;
    if (n % 2) swing += (side * lean * 8 * (n === 3 ? p.mood.bend : 1)) / (n * n * Math.PI * Math.PI);
    else if (n === 2) swing += lean * BOWL * p.mood.bowl;
    p.pot[n] += momentum * swing * Math.sqrt((g + tension * k * k) / kt);
  }
}

/**
 * Head for brim-full or empty. The stream lands (or the outlet sits) near the end wall nearer x, px
 * from the pill's left: where the pointer came in or left, the side the keyboard focus came from.
 * Without x it stays by the wall it was at. Every start and every turn deals the pour a fresh temper.
 */
export function pourTo(p: Pour, full: boolean, x?: number) {
  const at = x !== undefined && Number.isFinite(x) ? x : undefined;
  const wasLeft = p.inlet < p.w / 2;
  if (p.full === full) {
    if (at === undefined) return;
    aim(p, at);
    // The stream moved to the other wall (a press from the far end): its sheet sets off again from there.
    if (p.inlet < p.w / 2 !== wasLeft) p.sheet = 0;
    return;
  }
  let momentum = 0;
  if (p.still) {
    // From rest the level sits right at the rim or the floor, so the first frame already moves. A drain
    // from brim-full lurches; a pour into an empty pill has nothing yet to jolt.
    p.vol = p.full ? brimVol(p) : 0;
    p.still = false;
    momentum = full ? 0 : 1;
  } else {
    // A pour still moving is in sight (stepPour rests it the moment it isn't), so it turns from where it is.
    momentum = smooth(0, JOLT_AFTER, p.age);
  }
  p.full = full;
  p.age = 0;
  deal(p);
  aim(p, at ?? (wasLeft ? 0 : p.w));
  if (momentum > 0) jolt(p, momentum);
}

/** Put the pour at its end at once: brim-full or empty, a calm surface, the valve shut. */
export function settlePour(p: Pour, full: boolean) {
  p.full = full;
  p.vol = full ? brimVol(p) : 0;
  p.flow = 0;
  p.amp.fill(0);
  p.pot.fill(0);
  p.run.fill(0);
  p.age = 0;
  p.sheet = 0;
  p.still = true;
}

function substep(p: Pour, dt: number) {
  const max = brimVol(p);
  const unit = p.h / REF_H;
  const mood = p.mood;
  // The pour's clock (and the sheet's) halfway through this step: everything that wanders below is a
  // function of it.
  const t = p.age + dt / 2;
  const ts = p.sheet + dt / 2;

  // The valve: a rush, then a gush that eases off toward the brim, or a drain whose head falls with the
  // level. Both come in gulps.
  const rush = Math.exp(-t / (RUSH_FOR * mood.rushFor));
  const want = p.full
    ? GUSH * mood.gush * (1 + RUSH * mood.rush * rush) * max * Math.max(0, 1 - EASE * Math.pow(Math.max(0, p.vol / max), 1.2))
    : -DRAIN * (1 + (mood.gush - 1) / 2) * max * Math.max(FLOOR, Math.sqrt(clamp(levelOf(p, p.vol) / p.h, 0, 1)));
  p.flow += (want - p.flow) * (1 - Math.exp(-dt / (p.full ? VALVE_IN : VALVE_OUT)));
  const gulp = glug(mood, t, p.full ? GLUG : GURGLE);
  const flow = p.flow * gulp;
  p.vol += flow * dt;
  p.age += dt;
  p.sheet += dt;

  const level = levelOf(p, p.vol);
  const { left, width } = spanAt(p, level);
  const pool = depthAt(p, level);
  // The waves feel the liquid in their own crests too: a heap runs on itself.
  let heap = 0;
  for (let n = 1; n <= MODES; n++) heap += p.amp[n] * p.amp[n];
  const depth = pool + HEAP * Math.sqrt(heap / 2);
  const m = METRES / p.h;
  const g = GRAVITY / m;
  const tension = TENSION / (m * m * m);

  // The share of the flow that lands at the wall (a wedge; the rest only raises the level), fading out
  // in a thin film, where there is nothing yet for it to push, heavier in the first rush (the drain's
  // first gulp) and lighter while the sheet runs off with it. Past the brim or under the floor there
  // is no surface to push at all.
  const inside = p.vol > 0 && p.vol < max;
  const out = flow < 0;
  const scale = (REF_W * unit) / p.w;
  const running = out ? 0 : 1 - smooth(2 * unit, SHEET_DEEP * unit, pool);
  const share = inside
    ? ((out ? DRAIN_SHARE : POUR_SHARE) * mood.pile * (1 + 0.8 * mood.rush * rush) * (1 - TAKES * running) * scale * depth) / (depth + 3 * unit)
    : 0;
  // Each gulp digs the crater, and between gulps it fills back in.
  const splash = inside && !out ? (-SPLASH * Math.min(1, scale) * clamp((gulp - 1) / GLUG, -1, 1.5) * pool) / (pool + CRATER * unit) : 0;
  const splashWide = SPLASH_WIDE * unit;
  // The stream wanders a little as it lands; the outlet stays put.
  const away = p.inlet < p.w / 2 ? 1 : -1;
  const wander = out ? 0 : SWAY * unit * noise(strand(mood.key, 1), t, SWAY_BEATS) + TREMBLE * unit * noise(strand(mood.key, 2), t, TREMBLE_BEATS);
  const at = clamp(p.inlet + wander - left, 0, width);
  const sigma = STREAM * unit * (out ? 1.3 : mood.stream);
  // The sheet (a pour's alone): its share while the pool is shallow, and where its head has got to.
  const sheet = inside ? SHEET * mood.sheet * Math.min(1, scale) * running : 0;
  const head = clamp(at + away * SHEET_SPEED * unit * mood.speed * SHEET_FOR * (1 - Math.exp(-ts / SHEET_FOR)), 0, width);
  const mid = (at + head) / 2;
  const half = (head - at) / 2;
  const lipSigma = SHEET_LIP * unit;
  // The stream's slant, as hard as it runs: a tilt of the whole pill, away from the stream's wall or back
  // toward it.
  const slant = inside && !out ? (away * SLANT * unit * mood.slant * flow) / (GUSH * max) : 0;
  // The momentum the head brings.
  const push = (away * PUSH * unit * mood.push * sheet * LIP * flow) / (pool + 3 * unit);
  // The chop: pressure at the stream (or the outlet) and at the sheet's head, as hard as the flow runs,
  // most in the shallows and gone before the brim (deep liquid swallows it).
  const stir = inside
    ? mood.chop * (out ? DRAIN_CHOP : 1) * Math.min(1, Math.abs(flow) / (GUSH * max)) * (pool / (pool + 3 * unit)) * (1 - smooth(0.3 * p.h, p.h, level))
    : 0;
  const chopWide = CHOP_WIDE * unit;
  const impact = stir > 0 ? g * CHOP * unit * stir * noise(strand(mood.key, 3), t, 1 / CHOP_BEAT) : 0;
  const churn = stir > 0 && sheet > 0 ? g * FRONT_CHOP * CHOP * unit * stir * noise(strand(mood.key, 4), t, 1 / CHOP_BEAT) : 0;
  // The extra calm past the rim and under it, or in a slosh that breaks.
  const calmed =
    (BRIM_CALM * Math.max(0, level - p.h) + BREAK * Math.max(0, Math.sqrt(heap / 2) - BREAK_AT * unit)) / unit +
    LID * smooth(p.h - LID_DEEP * unit, p.h, level);
  // In the last shallows the drain takes the liquid from wherever it is, in proportion to the depth
  // there, so the waves sink with the level; under the floor there is no surface left to wave.
  const squeeze = p.vol <= 0 ? 40 : out && p.vol < 0.25 * max ? -p.flow / p.vol : 0;

  let riseL = 0;
  let riseR = 0;
  for (let n = 1; n <= MODES; n++) {
    const k = (n * Math.PI) / width;
    if (2 * width < n * SHORTEST * unit) {
      p.amp[n] = 0;
      p.pot[n] = 0;
      continue;
    }
    const kd = k * depth;
    const kt = k * Math.tanh(kd);
    // For a drain, the depth's filter: deep liquid only feels the outlet's long waves.
    const deep = out ? 1 / Math.cosh(Math.min(kd, 30)) : 1;
    // The stream's bell on this mode (its mirror images in the walls included), the sheet's trail from
    // the stream to its head and the heap at the head.
    const bell = Math.exp(-0.5 * (k * sigma) ** 2);
    const lip = Math.exp(-0.5 * (k * lipSigma) ** 2);
    const x = k * half;
    const trail = Math.cos(k * mid) * (Math.abs(x) < 1e-6 ? 1 : Math.sin(x) / x) * bell;
    const front = (2 / width) * sheet * LIP * Math.cos(k * head) * lip;
    const runs = (2 / width) * sheet * (1 - LIP) * trail + front;
    const lands = (share * bell + splash * Math.exp(-0.5 * (k * splashWide) ** 2)) * Math.cos(k * at);
    const source = ((2 / width) * lands + runs) * deep;
    // The pushes on the potential: the head's momentum, and the chop's pressures (each a bell CHOP_WIDE
    // px wide).
    const ring = Math.exp(-0.5 * (k * chopWide) ** 2);
    const shove = (push * (2 / width) * lip * Math.sin(k * head)) / k + ((2 * chopWide) / width) * ring * deep * (impact * Math.cos(k * at) + churn * Math.cos(k * head));
    // Semi-implicit Euler: the potential feels the surface's pull and the pushes, the surface follows the
    // potential and takes what lands; then both decay at exactly the mode's rate, and the flow (not the
    // surface) drags on the floor too: a thin film holds the shape it is laid in.
    // A tilt, end to end, is the odd modes in this measure.
    const tilt = n % 2 ? (g * slant * 8) / (n * n * Math.PI * Math.PI) : 0;
    p.pot[n] -= ((g + tension * k * k) * p.amp[n] + shove - tilt) * dt;
    const wave = kt * p.pot[n];
    p.amp[n] += (wave + flow * source) * dt;
    const decay = DAMP + DAMP_SHORT * unit * unit * k * k + calmed + squeeze;
    const e = Math.exp(-decay * dt);
    p.amp[n] *= e;
    p.pot[n] *= e * Math.exp(-Math.min(BED_MAX, (BED * unit * unit) / (depth * depth)) * dt);
    // How fast the liquid is being thrown up each wall: by the waves, and by the sheet's head arriving
    // (on a narrow pill, where it gets there before it gives out; not by what the stream and the
    // sheet's trail lay down).
    const rate = wave + flow * front;
    riseL += rate;
    riseR += n % 2 ? -rate : rate;
  }
  spill(p, width, dt);

  // The tongues: liquid slamming into a wall runs on up it, then falls back (a damped spring, held to
  // what the slam gives it). Nothing climbs the wall an outlet is drawing the liquid down.
  climb(p, 0, inside && !(out && away > 0) ? CLIMB * mood.climb * Math.max(0, riseL) : 0, dt);
  climb(p, 2, inside && !(out && away < 0) ? CLIMB * mood.climb * Math.max(0, riseR) : 0, dt);
}

/** One wall's tongue, `i` into p.run, reaching for `to` px. */
function climb(p: Pour, i: number, to: number, dt: number) {
  p.run[i + 1] += (CLIMB_PACE * CLIMB_PACE * (to - p.run[i]) - 2 * CLIMB_DAMP * CLIMB_PACE * p.run[i + 1]) * dt;
  p.run[i] += p.run[i + 1] * dt;
}

/** A face too steep for water spills: find the steepest point of the surface, and the modes that build
    the face there lose energy in proportion to their part in it. */
function spill(p: Pour, width: number, dt: number) {
  let worst = 0;
  let where = 0;
  for (let i = 1; i < PROBES; i++) {
    const th = (Math.PI * i) / PROBES;
    const c1 = Math.cos(th);
    let sPrev = 0;
    let sN = Math.sin(th);
    let slope = 0;
    for (let n = 1; n <= MODES; n++) {
      slope -= n * p.amp[n] * sN;
      const sNext = 2 * c1 * sN - sPrev;
      sPrev = sN;
      sN = sNext;
    }
    if (Math.abs(slope) > Math.abs(worst)) {
      worst = slope;
      where = th;
    }
  }
  worst *= Math.PI / width;
  const over = Math.abs(worst) / SPILL - 1;
  if (over <= 0) return;
  for (let n = 1; n <= MODES; n++) {
    const part = (-((n * Math.PI) / width) * p.amp[n] * Math.sin(n * where)) / worst;
    if (part <= 0) continue;
    const e = Math.exp(-SPILL_RATE * over * part * dt);
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
  if (!Number.isFinite(p.vol) || !Number.isFinite(p.flow) || !Number.isFinite(p.amp[1]) || !Number.isFinite(p.run[0]) || p.age > TIMEOUT) {
    settlePour(p, p.full);
    return;
  }
  // Once the whole surface is out of sight past the rim (or under the floor), heading on out, the rest
  // of the way is invisible: the pour rests on the very frame pourClip would draw nothing (so no trough
  // can come back into sight after it), and a turn back starts right at the rim or the floor with a
  // calm surface, as it would be by then.
  if (outOfSight(p)) settlePour(p, p.full);
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
const mFlow = new Float64Array(MODES + 1);
const carry = new Float64Array(129);

/** Sample the surface into `out`: roughly every 3px across the pill, a pixel past both sides. */
export function sampleSurface(p: Pour, out: Surface) {
  const level = levelOf(p, p.vol);
  const { left, width } = spanAt(p, level);
  const depth = depthAt(p, level);
  const unit = p.h / REF_H;
  let endL = 0;
  let endR = 0;
  for (let n = 1; n <= MODES; n++) {
    mK[n] = (n * Math.PI) / width;
    mLift[n] = Math.min(DRIFT_LIFT, 1 / Math.tanh(mK[n] * depth));
    mFlow[n] = mK[n] * p.pot[n];
    endL += p.amp[n];
    endR += n % 2 ? -p.amp[n] : p.amp[n];
  }
  // Where the surface really meets each end wall: the point on the pill's outline at the height the
  // waves stand at that wall. The meniscus and the tongue climb from there, so in a round end the line
  // curls up into the wall instead of turning a corner where the mean level alone would meet it.
  const touchL = (p.w - chord(p, clamp(level + endL, 0, p.h))) / 2;
  const touchR = (p.w + chord(p, clamp(level + endR, 0, p.h))) / 2;
  const fade = smooth(0, MENISCUS_FADE * unit, level) * smooth(0, MENISCUS_FADE * unit, p.h - level);
  const men = MENISCUS * unit * fade;
  const reachPx = MENISCUS_REACH * unit;
  const tongueL = tongue(p.run[0], unit) * fade;
  const tongueR = tongue(p.run[2], unit) * fade;
  const tongueReach = CLIMB_REACH * unit;
  const drift = DRIFT * smooth(4 * unit, 14 * unit, depth);
  const bore = BORE * (1 - smooth(6 * unit, BORE_DEEP * unit, depth));
  const count = clamp(Math.ceil(p.w / 3), 24, out.xs.length - 1);
  const { xs, ys } = out;

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
    let u = 0;
    for (let n = 1; n <= MODES; n++) {
      eta += p.amp[n] * cN;
      if (n <= DRIFT_MODES) xi -= p.amp[n] * sN * mLift[n];
      u -= mFlow[n] * sN;
      const cNext = 2 * c1 * cN - cPrev;
      const sNext = 2 * c1 * sN - sPrev;
      cPrev = cN;
      cN = cNext;
      sPrev = sN;
      sN = sNext;
    }
    const inside = s > 0 && s < width;
    const offL = Math.max(0, x - touchL);
    const offR = Math.max(0, touchR - x);
    const climb =
      men * (Math.exp(-offL / reachPx) + Math.exp(-offR / reachPx)) + tongueL * Math.exp(-offL / tongueReach) + tongueR * Math.exp(-offR / tongueReach);
    xs[i] = x;
    // Crests drift toward their tops, and in the shallows the surface rides on the flow under it: all
    // the way on a crest (so a front runs ahead of itself), less in a trough (which is filling, not
    // running).
    const ride = 0.3 + 0.7 * smooth(-TROUGH * unit, TROUGH * unit, eta);
    carry[i] = inside ? drift * clamp(xi, -DRIFT_MAX, DRIFT_MAX) + ride * clamp(bore * u, -BORE_MAX, BORE_MAX) : 0;
    ys[i] = p.h - (level + eta + climb);
  }

  // How much of that carry the line can take: all of it, unless some stretch would crowd up or stand
  // steeper than SLOPE_MAX, when the whole of it is eased back together (so nothing jumps).
  let take = 1;
  for (let i = 0; i < count; i++) {
    const close = carry[i] - carry[i + 1];
    if (close <= 0) continue;
    const dx = xs[i + 1] - xs[i];
    const room = Math.min((1 - CROWD) * dx, dx - Math.abs(ys[i + 1] - ys[i]) / SLOPE_MAX);
    take = Math.min(take, (Math.max(0, room) + 0.05) / close);
  }
  for (let i = 0; i <= count; i++) {
    let X = xs[i] + take * carry[i];
    // The drift never lets a point pass the one before it: the line can sharpen, never fold.
    if (i > 0 && X < xs[i - 1] + 0.05) X = xs[i - 1] + 0.05;
    xs[i] = X;
  }
  out.count = count;
  return out;
}

const sight = surfaceBuffer();

/** Whether all of the surface, as drawn, is within EDGE of the rim (filling) or the floor (draining):
    where pourClip draws nothing. */
function outOfSight(p: Pour) {
  const { ys, count } = sampleSurface(p, sight);
  for (let i = 0; i <= count; i++) if (p.full ? ys[i] >= EDGE : ys[i] <= p.h - EDGE) return false;
  return true;
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
  // Under EDGE from the rim or the floor reads as the pill's own edge: nothing to draw.
  if (bottom < EDGE) return "full";
  if (top > p.h - EDGE) return "empty";
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
