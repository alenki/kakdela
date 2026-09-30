// The about page's opening (src/components/about/Opening.tsx): the café's answer on a paper sign, hung on a
// cord from the dot of the logo's own «?». Its geometry (for the stylesheet, as the section's --sign-*
// properties), its physics (for the island, HangingSign) and its arrival (simulated here and baked into CSS
// by Opening.tsx) live here, and sign.test.ts holds all three to account. Pure: no DOM. Its one import is the
// wordmark's data, so a new logo vector moves the nail with it.
import { WORDMARK } from "@/components/brand/wordmark-data";

/** The build's language (NEXT_PUBLIC_LOCALE, inlined at build time). */
const EN = process.env.NEXT_PUBLIC_LOCALE === "en";

/** The line: the question as the headline, in the logo's lettering on two lines, the sign hanging from its
 *  «?» (the logo's, at the size of its letters). Anything narrower or taller is the stack: the question, then
 *  the logo's «?» set huge, the sign under it. about.css repeats it verbatim. */
export const LINE_MQ = "(min-width: 1024px) and (min-aspect-ratio: 6/5)";
/** The wide line: on a screen twice as wide as it is tall or wider, the question on one line, so its «?» is
 *  far enough along for the sign to reach the right gutter. about.css repeats it verbatim. */
export const WIDE_MQ = "(min-width: 1024px) and (min-aspect-ratio: 2/1)";

/** The sign, in its own width: every length here is a share of it (CSS: of --sw). */
export const SIGN = {
  /** Its height. */
  ratio: 0.56,
  /** The stack's «?», set huge: its height. */
  glyph: 0.62,
  /** The punched holes: either side of the middle, and under the top edge. */
  holeX: 0.4,
  holeY: 0.0315,
  /** The cord: the holes hang this far under the nail's centre. */
  drop: 0.26,
  /** The paper's margin either side of the answer. */
  pad: 0.075,
  // Widths in em of the display face, uppercase, measured in Chromium. Re-measure when the copy, the weight or
  // the face changes.
  /** The ink of the answer's longer line at 860, tracked -0.012em: «Спасибо, что» 4.701 (English «Thanks for»
   *  3.910), with a hair to spare. */
  lineEm: EN ? 3.94 : 4.76,
  /** The back's longer word, the same way: «Закрыто» 3.105 (English «Closed» 2.414). */
  backEm: EN ? 2.46 : 3.14,
} as const;

/**
 * The question, in the logo's lettering (src/lib/lettering.ts, letterAsk) on two lines, in em of its caps (the
 * stylesheet sets --ask-f to their height): each line's width, the second's up to its last letter, the room
 * between the lines, the word space that joins them when they are set on one (the wide line), and the room
 * between the last letter and the «?». lettering.test.ts holds these to the lettering: run it again when the
 * copy or a letter changes.
 */
export const ASKS = {
  ru: { lines: [6.1302, 8.4394], lead: 0.3, join: 0.67, qGap: 0.0482 },
  en: { lines: [7.6719, 6.7166], lead: 0.3, join: 0.4468, qGap: 0.0482 },
} as const;
export const ASK = EN ? ASKS.en : ASKS.ru;
/** The logo's caps in its own units: where they start, and how tall they are (the lettering's CAP). */
export const CAPS = { top: 419.1, height: 143.25 } as const;

const HOOK = WORDMARK.dela[4];
const DOT = WORDMARK.dela[5];
/** The logo's «?», its hook and its dot, in the wordmark's units. */
export const GLYPH = {
  x: HOOK.box.x,
  y: HOOK.box.y,
  w: Math.max(HOOK.box.x + HOOK.box.w, DOT.box.x + DOT.box.w) - HOOK.box.x,
  h: DOT.box.y + DOT.box.h - HOOK.box.y,
  hook: HOOK.d,
  dot: DOT.d,
} as const;
/** One of the wordmark's units, in the sign's width. */
const UNIT = SIGN.glyph / GLYPH.h;
/** The nail: the «?»'s dot, from the glyph's top left, in the sign's width. */
export const NAIL = {
  x: (DOT.box.x + DOT.box.w / 2 - GLYPH.x) * UNIT,
  y: (DOT.box.y + DOT.box.h / 2 - GLYPH.y) * UNIT,
  r: ((DOT.box.w + DOT.box.h) / 4) * UNIT,
} as const;

// The sign at rest, in its width, from the nail's centre (y down).
const HEIGHT = SIGN.ratio;
/** The holes, from the sign's middle. */
const HOLE = { x: SIGN.holeX, y: -HEIGHT / 2 + SIGN.holeY };
/** The holes hang this far under the nail's centre. */
const DROP = SIGN.drop;
/** One strand of the cord, from the nail's centre to a hole. */
const CORD = Math.hypot(HOLE.x, DROP);
/** The sign's middle, under the nail's centre. */
const REST = DROP - HOLE.y;
/** The sign's foot, under the nail's centre. */
const BELOW = REST + HEIGHT / 2;
/** The stack: the rig from the «?»'s top to the sign's foot. */
export const RIG_HEIGHT = NAIL.y + BELOW;

/**
 * The line's «?»: the logo's, at the size of the question's caps, standing after the question's last word
 * where the wordmark's stands after its А. In em of the caps, from the question's top left: the glyph's box and
 * its dot (the nail). On two lines (HEAD) the question is as wide as its longer line, the second counted with
 * its «?» (with a hair to spare), and as tall as the two and the room between them; on one (WIDE) it is its
 * two lines and a space. Д's legs hang below.
 */
const TEXT = 1 / CAPS.height;
const DOT_X = (DOT.box.x + DOT.box.w / 2 - GLYPH.x) * TEXT;
const DOT_Y = (DOT.box.y + DOT.box.h / 2 - GLYPH.y) * TEXT;
/** Either build's question, on two lines or one. */
export function headOf(ask: (typeof ASKS)[keyof typeof ASKS], rows: 1 | 2) {
  const first = rows === 1 ? ask.lines[0] + ask.join : 0;
  const qLeft = first + ask.lines[1] + ask.qGap;
  const qTop = (rows === 1 ? 0 : 1 + ask.lead) + (GLYPH.y - CAPS.top) * TEXT;
  return {
    qLeft,
    qTop,
    qW: GLYPH.w * TEXT,
    qH: GLYPH.h * TEXT,
    headEm: Math.max(rows === 1 ? 0 : ask.lines[0], qLeft + GLYPH.w * TEXT) + 0.02,
    heightEm: rows === 1 ? 1 : 2 + ask.lead,
    /** The nail, from the question's top left. */
    nailEm: qLeft + DOT_X,
    hangEm: qTop + DOT_Y,
    /** The sign's foot under the nail, in the sign's width. */
    below: BELOW,
    /** The paper's top edge under the nail, in the sign's width. */
    paper: REST - HEIGHT / 2,
    /** The stack's question: its longer line (no «?» in it there: the rig's stands under it). */
    stackEm: Math.max(...ask.lines),
  } as const;
}
export const HEAD = headOf(ASK, 2);
export const WIDE = headOf(ASK, 1);

/** The sign as a thing in the room, in SI units. It is 40 cm across on every screen, so it moves the same
 *  everywhere: its swing takes about 1.1 s, its twist about 5 s. */
export const PHYS = {
  width: 0.4,
  g: 9.81,
  mass: 0.15,
  /** The card's air drag on its way (1/s) and on its tilt (1/s). */
  drag: 0.9,
  tiltDrag: 1.2,
  /** The cord's torsion per radian over the card's moment about it (1/s²), and the air on a turning card:
   *  linear (1/s) and quadratic (1/rad). */
  twist: 1.45,
  twistDrag: 0.8,
  twistDrag2: 0.035,
  /** One step (s), the same wherever it runs, so a run replays exactly. */
  step: 1 / 1000,
} as const;

/** The sign's rest geometry in metres, and its moment of inertia about its middle. */
export type Rig = { W: number; H: number; hx: number; hy: number; cord: number; rest: number; I: number };
export function rig(): Rig {
  const W = PHYS.width;
  const H = HEIGHT * W;
  return { W, H, hx: HOLE.x * W, hy: HOLE.y * W, cord: CORD * W, rest: REST * W, I: (PHYS.mass * (W * W + H * H)) / 12 };
}

/** The sign's middle from the nail's centre (m, y down) and its tilt (rad, clockwise), their speeds, and its
 *  twist about the cord (rad, counted: a full turn is 2π) and its speed. */
export type SignState = { x: number; y: number; a: number; vx: number; vy: number; va: number; turn: number; vturn: number };
/** A point of the sign (its own frame, m) held toward a target (the nail's frame, m). */
export type Hand = { rx: number; ry: number; tx: number; ty: number };
/** What moves it: a hand, and the page's own acceleration (m/s², y down on the screen): the nail moves with
 *  the page. */
export type Input = { hand?: Hand | null; accel?: number };

/** Hanging still. */
export const hanging = (r: Rig): SignState => ({ x: 0, y: r.rest, a: 0, vx: 0, vy: 0, va: 0, turn: 0, vturn: 0 });

const SIDES = [-1, 1] as const;
const SIDES_BACK = [1, -1] as const;

/**
 * One step. The card falls with gravity (less the page's own acceleration: past 1 g the page drops from under
 * it) and its air drag; then each strand pulls its hole back to its length from the nail when it is further
 * (a strand goes slack, never stretches), and a hand pulls its point softly toward its target: position based,
 * six passes, the strands taken in turn from either side so neither is favoured. The twist about the cord is a
 * torsion spring with the air's drag.
 */
export function step(s: SignState, r: Rig, dt: number = PHYS.step, input: Input = {}): void {
  const m = PHYS.mass;
  s.vy += (PHYS.g - (input.accel ?? 0)) * dt;
  const k = Math.exp(-PHYS.drag * dt);
  s.vx *= k;
  s.vy *= k;
  s.va *= Math.exp(-PHYS.tiltDrag * dt);
  const px = s.x;
  const py = s.y;
  const pa = s.a;
  s.x += s.vx * dt;
  s.y += s.vy * dt;
  s.a += s.va * dt;
  const hand = input.hand;
  for (let it = 0; it < 6; it++) {
    for (const side of it % 2 ? SIDES_BACK : SIDES) {
      const c = Math.cos(s.a);
      const sn = Math.sin(s.a);
      const rx = side * r.hx * c - r.hy * sn;
      const ry = side * r.hx * sn + r.hy * c;
      const hx = s.x + rx;
      const hy = s.y + ry;
      const d = Math.hypot(hx, hy);
      if (d <= r.cord) continue;
      const nx = hx / d;
      const ny = hy / d;
      const cr = rx * ny - ry * nx;
      const lam = (d - r.cord) / (1 / m + (cr * cr) / r.I);
      s.x -= (lam / m) * nx;
      s.y -= (lam / m) * ny;
      s.a -= (lam / r.I) * cr;
    }
    if (hand) {
      const c = Math.cos(s.a);
      const sn = Math.sin(s.a);
      const rx = hand.rx * c - hand.ry * sn;
      const ry = hand.rx * sn + hand.ry * c;
      const dx = s.x + rx - hand.tx;
      const dy = s.y + ry - hand.ty;
      const d = Math.hypot(dx, dy);
      if (d > 1e-9) {
        const nx = dx / d;
        const ny = dy / d;
        const cr = rx * ny - ry * nx;
        const lam = (0.25 * d) / (1 / m + (cr * cr) / r.I);
        s.x -= (lam / m) * nx;
        s.y -= (lam / m) * ny;
        s.a -= (lam / r.I) * cr;
      }
    }
  }
  s.vx = (s.x - px) / dt;
  s.vy = (s.y - py) / dt;
  s.va = (s.a - pa) / dt;
  s.vturn += (-PHYS.twist * s.turn - PHYS.twistDrag * s.vturn - PHYS.twistDrag2 * s.vturn * Math.abs(s.vturn)) * dt;
  s.turn += s.vturn * dt;
}

/** A push on its face at `side` (-1 its left edge … 1 its right), away from the guest: it turns on its cord,
 *  harder the further out. */
export function push(s: SignState, side: number): void {
  const k = Math.sign(side) || 1;
  s.vturn += k * (4.6 + 3.2 * Math.min(1, Math.abs(side)));
}

/** A sideways shove (a swipe) at a point of the sign (its own frame, m): it goes `jx` m/s, and turns about
 *  its middle as far as the point is above or below it. */
export function shove(s: SignState, r: Rig, rx: number, ry: number, jx: number): void {
  const wy = rx * Math.sin(s.a) + ry * Math.cos(s.a);
  s.vx += jx;
  s.va += (-wy * PHYS.mass * jx) / r.I;
}

/** The card's energy (J), from the nail's height. In a free swing it only falls. */
export const energy = (s: SignState, r: Rig) =>
  0.5 * PHYS.mass * (s.vx * s.vx + s.vy * s.vy) + 0.5 * r.I * s.va * s.va - PHYS.mass * PHYS.g * s.y;

/** The twist's own energy, per unit of the card's moment about the cord. */
export const twistEnergy = (s: SignState) => 0.5 * s.vturn * s.vturn + 0.5 * PHYS.twist * s.turn * s.turn;

/** Near enough to rest that the island may stop and put it back exactly: under a pixel, a third of a degree. */
export const atRest = (s: SignState, r: Rig) =>
  Math.abs(s.x) < 5e-4 &&
  Math.abs(s.y - r.rest) < 5e-4 &&
  Math.abs(s.a) < 5e-3 &&
  Math.hypot(s.vx, s.vy) < 4e-3 &&
  Math.abs(s.va) < 2e-2 &&
  Math.abs(s.turn) < 5e-3 &&
  Math.abs(s.vturn) < 2e-2;

const deg = (rad: number) => (rad * 180) / Math.PI;
const round = (v: number, n: number) => Math.round(v * 10 ** n) / 10 ** n;

/** What the page shows (CSS `rotate` turns clockwise): the swing of the sign's middle about the nail from
 *  straight down (deg), how much further from the nail than at rest (in its width), its own tilt beyond the
 *  swing (deg), its turn (deg), and each strand's angle from straight down (deg) and length (in strands). */
export type Pose = { swing: number; fall: number; tilt: number; turn: number; cords: { angle: number; stretch: number }[] };
export function pose(s: SignState, r: Rig): Pose {
  const swing = Math.atan2(-s.x, s.y);
  const c = Math.cos(s.a);
  const sn = Math.sin(s.a);
  const ct = Math.cos(s.turn);
  const cords = [-1, 1].map((side) => {
    // Turned about the cord, the holes close in.
    const lx = side * r.hx * ct;
    const x = s.x + lx * c - r.hy * sn;
    const y = s.y + lx * sn + r.hy * c;
    return { angle: deg(Math.atan2(-x, y)), stretch: Math.hypot(x, y) / r.cord };
  });
  return { swing: deg(swing), fall: (Math.hypot(s.x, s.y) - r.rest) / r.W, tilt: deg(s.a - swing), turn: deg(s.turn), cords };
}

/**
 * The arrival: the café hangs its answer. Held `lift` of its height up with the cord slack, `shift` of its
 * width to the right, tilted `tilt` rad and twisting at `twist` rad/s, it is let go `delay` ms after the ask
 * begins; the cord catches on the nail and it swings. The baked curves run `until` s, eased to rest over the
 * last `settle` s so that a page without its script ends still; the island takes over at `handoff` s, before
 * the easing. Samples: `rate` a second; the curves' tolerances in degrees, sign widths and strand lengths.
 */
export const ARRIVAL = {
  lift: 0.42,
  shift: 0.05,
  tilt: -0.05,
  twist: 0.15,
  delay: 350,
  until: 4.2,
  settle: 0.8,
  handoff: 3.3,
  rate: 120,
  tolDeg: 0.06,
  tolW: 4e-4,
  tolStretch: 1.2e-3,
} as const;

export function arrivalStart(r: Rig = rig()): SignState {
  const s = hanging(r);
  s.y -= ARRIVAL.lift * r.H;
  s.x += ARRIVAL.shift * r.W;
  s.a = ARRIVAL.tilt;
  s.vturn = ARRIVAL.twist;
  return s;
}

/** The arrival `t` s after the sign is let go, exactly as it ran: the island takes over from here. */
export function arrivalAt(t: number, r: Rig = rig()): SignState {
  const s = arrivalStart(r);
  for (let i = 0, n = Math.round(Math.max(0, t) / PHYS.step); i < n; i++) step(s, r);
  return s;
}

/** The moving parts, in the order arrivalCss writes them. */
export const CURVES = ["swing", "fall", "tilt", "turn", "cordA", "stretchA", "cordB", "stretchB"] as const;
export type Curve = (typeof CURVES)[number];
export type Series = { t: number[]; v: number[] };

const flat = (p: Pose): Record<Curve, number> => ({
  swing: p.swing,
  fall: p.fall,
  tilt: p.tilt,
  turn: p.turn,
  cordA: p.cords[0].angle,
  stretchA: p.cords[0].stretch - 1,
  cordB: p.cords[1].angle,
  stretchB: p.cords[1].stretch - 1,
});
const smooth = (x: number) => x * x * (3 - 2 * x);

/** The arrival, sampled `rate` times a second, each value eased to its rest over the last `settle` s. */
export function arrivalSeries(r: Rig = rig()): Record<Curve, Series> {
  const rest = flat(pose(hanging(r), r));
  const out = Object.fromEntries(CURVES.map((k) => [k, { t: [] as number[], v: [] as number[] }])) as Record<Curve, Series>;
  const s = arrivalStart(r);
  const every = Math.round(1 / (ARRIVAL.rate * PHYS.step));
  const n = Math.round(ARRIVAL.until / PHYS.step);
  for (let i = 0; i <= n; i++) {
    if (i % every === 0 || i === n) {
      const t = i * PHYS.step;
      const e = t <= ARRIVAL.until - ARRIVAL.settle ? 1 : smooth((ARRIVAL.until - t) / ARRIVAL.settle);
      const v = flat(pose(s, r));
      for (const k of CURVES) {
        out[k].t.push(t);
        out[k].v.push(rest[k] + (v[k] - rest[k]) * e);
      }
    }
    step(s, r);
  }
  return out;
}

/** The samples of a series worth keeping: none of the dropped ones is further than `tol` from the line
 *  between its kept neighbours (Ramer-Douglas-Peucker, by value). */
export function keep(sr: Series, tol: number): number[] {
  const { t, v } = sr;
  const on = new Uint8Array(t.length);
  on[0] = 1;
  on[t.length - 1] = 1;
  const todo: [number, number][] = [[0, t.length - 1]];
  while (todo.length) {
    const [a, b] = todo.pop()!;
    let worst = -1;
    let err = tol;
    for (let i = a + 1; i < b; i++) {
      const d = Math.abs(v[i] - (v[a] + ((v[b] - v[a]) * (t[i] - t[a])) / (t[b] - t[a])));
      if (d > err) {
        err = d;
        worst = i;
      }
    }
    if (worst > 0) {
      on[worst] = 1;
      todo.push([a, worst], [worst, b]);
    }
  }
  const idx: number[] = [];
  on.forEach((k, i) => {
    if (k) idx.push(i);
  });
  return idx;
}

/** A series as a CSS linear() easing: its values at their times through the animation. */
export function linear(sr: Series, tol: number, digits: number): string {
  const T = sr.t[sr.t.length - 1];
  const pts = keep(sr, tol).map((i) => `${round(sr.v[i], digits)} ${round((sr.t[i] / T) * 100, 3)}%`);
  return `linear(${pts.join(", ")})`;
}

/**
 * The arrival as CSS, for Opening.tsx: each moving part runs from nothing to one unit of its property, and
 * its curve (linear()) carries the simulated values, so the compositor plays exactly what sign.ts computed.
 * Only with html[data-hang] (HANG_SCRIPT), full motion and linear() support; loader.css holds it while the
 * loader covers the page.
 */
export function arrivalCss(r: Rig = rig()): string {
  const sr = arrivalSeries(r);
  const time = `${Math.round(ARRIVAL.until * 1000)}ms`;
  const run = (name: string, curve: Curve, tol: number, digits: number) =>
    `${name} ${time} ${linear(sr[curve], tol, digits)} ${ARRIVAL.delay}ms backwards`;
  const turned = (curve: Curve) => run("ab-hang-rotate", curve, ARRIVAL.tolDeg, 3);
  const stretched = (curve: Curve) => run("ab-hang-stretch", curve, ARRIVAL.tolStretch, 4);
  const on = 'html[data-hang]:not([data-motion="reduced"])';
  return [
    "@keyframes ab-hang-rotate { from { rotate: 0deg; } to { rotate: 1deg; } }",
    "@keyframes ab-hang-turn { from { rotate: y 0deg; } to { rotate: y 1deg; } }",
    "@keyframes ab-hang-fall { from { translate: 0 0; } to { translate: 0 var(--sw); } }",
    "@keyframes ab-hang-stretch { from { scale: 1 1; } to { scale: 1 2; } }",
    "@supports (animation-timing-function: linear(0, 1)) { @media (prefers-reduced-motion: no-preference) {",
    `${on} .ab-sign__swing { animation: ${turned("swing")}; }`,
    `${on} .ab-sign__fall { animation: ${run("ab-hang-fall", "fall", ARRIVAL.tolW, 5)}; }`,
    `${on} .ab-sign__card { animation: ${turned("tilt")}; }`,
    `${on} .ab-sign__turn { animation: ${run("ab-hang-turn", "turn", ARRIVAL.tolDeg, 3)}; }`,
    `${on} .ab-sign__cord--a { animation: ${turned("cordA")}, ${stretched("stretchA")}; }`,
    `${on} .ab-sign__cord--b { animation: ${turned("cordB")}, ${stretched("stretchB")}; }`,
    "} }",
  ].join("\n");
}

const fix = (v: number, n = 5) => String(round(v, n));

/** The custom properties Opening.tsx writes on the section, for about.css. */
export const signVars: Record<`--${string}`, string> = {
  "--sign-ratio": fix(SIGN.ratio),
  "--sign-glyph-w": fix(GLYPH.w * UNIT),
  "--sign-glyph-h": fix(SIGN.glyph),
  "--sign-nail-x": fix(NAIL.x),
  "--sign-nail-y": fix(NAIL.y),
  "--sign-rest": fix(REST),
  "--sign-cord": fix(CORD),
  "--sign-cord-a": `${fix(deg(Math.atan2(HOLE.x, DROP)), 3)}deg`,
  "--sign-cord-b": `${fix(deg(Math.atan2(-HOLE.x, DROP)), 3)}deg`,
  "--sign-hole-x": fix(SIGN.holeX),
  "--sign-hole-y": fix(SIGN.holeY),
  "--sign-pad": fix(SIGN.pad),
  "--sign-line-em": fix(SIGN.lineEm),
  "--sign-back-em": fix(SIGN.backEm),
  "--sign-stack-em": fix(HEAD.stackEm),
  "--sign-lead": fix(ASK.lead),
  "--sign-head-h": fix(HEAD.heightEm),
  "--sign-paper": fix(HEAD.paper),
  "--sign-height": fix(RIG_HEIGHT),
  "--sign-below": fix(HEAD.below),
  "--sign-nail-em": fix(HEAD.nailEm),
  "--sign-hang-em": fix(HEAD.hangEm),
  "--sign-hq-left": fix(HEAD.qLeft),
  "--sign-hq-top": fix(HEAD.qTop),
  "--sign-hq-w": fix(HEAD.qW),
  "--sign-hq-h": fix(HEAD.qH),
  "--sign-join": fix(ASK.join),
  "--sign-wide-nail-em": fix(WIDE.nailEm),
  "--sign-wide-hang-em": fix(WIDE.hangEm),
  "--sign-wide-hq-left": fix(WIDE.qLeft),
  "--sign-wide-hq-top": fix(WIDE.qTop),
};
