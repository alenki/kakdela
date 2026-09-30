// The logo's lettering, as far as the about page's question needs it (src/components/about/Opening.tsx).
// The wordmark is «КАК ДЕЛА?» in a deco hand: hairline uprights, heavy bands along the top and the foot, heavy
// «/» strokes and hairline «\» ones, and legs that curl into a ball. Its К, А, Д, Е and Л are redrawn here
// from the trace's measurements (src/components/brand/wordmark-data.ts; the trace's stair-stepped edges would
// show at headline size), and the letters the questions need that the logo doesn't have (У, В, С, and for the
// English build N, D, H, O, W, R, Y, U) are drawn from the same parts. The «?» stays the logo's own: the
// stylesheet hangs the sign from its dot.
//
// Units are the wordmark's: the caps are CAP tall, y runs down from the cap line (0) to the baseline (CAP),
// and Д's legs hang below it. Every outer contour winds one way and every counter the other, so the letters
// fill with the nonzero rule and their overlapping parts simply join. Pure, and only ever run on the server:
// the page gets the paths.

import { WORDMARK } from "@/components/brand/wordmark-data";

export const CAP = 143.25;

/** A hairline upright (Е's spine), a hairline across (Е's middle bar), a hairline slanting, measured across
 *  the stroke. */
const HV = 4.3;
const HH = 5.3;
const HD = 5;
/** The bands along the top and the foot. */
const BT = 34.3;
const BB = 35.25;
/** A quarter circle's handle, as a share of its radius. */
const KAPPA = 0.5523;

type Pt = readonly [number, number];
type Seg = { to: Pt; c1?: Pt; c2?: Pt };
type Contour = { start: Pt; segs: Seg[] };
/** A letter: its width, its solid parts and its counters (any winding: `glyph` winds them). */
type Glyph = { w: number; parts: Contour[]; holes?: Contour[] };

// ── Contours ───────────────────────────────────────────────────────────────────────────────────────

const end = (c: Contour): Pt => (c.segs.length ? c.segs[c.segs.length - 1].to : c.start);
const at = (x: number, y: number): Contour => ({ start: [x, y], segs: [] });
function line(c: Contour, x: number, y: number) {
  c.segs.push({ to: [x, y] });
  return c;
}
function curve(c: Contour, c1: Pt, c2: Pt, to: Pt) {
  c.segs.push({ c1, c2, to });
  return c;
}
/** A quarter ellipse to (x, y), leaving the last point level (h) or upright (v). */
function quarter(c: Contour, x: number, y: number, leave: "h" | "v") {
  const [x0, y0] = end(c);
  return leave === "h"
    ? curve(c, [x0 + (x - x0) * KAPPA, y0], [x, y - (y - y0) * KAPPA], [x, y])
    : curve(c, [x0, y0 + (y - y0) * KAPPA], [x - (x - x0) * KAPPA, y], [x, y]);
}
function poly(pts: Pt[]) {
  const c = at(...pts[0]);
  for (const p of pts.slice(1)) line(c, ...p);
  return c;
}
const rect = (x0: number, y0: number, x1: number, y1: number) => poly([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
function circle(cx: number, cy: number, r: number) {
  const k = r * KAPPA;
  const c = at(cx, cy - r);
  curve(c, [cx + k, cy - r], [cx + r, cy - k], [cx + r, cy]);
  curve(c, [cx + r, cy + k], [cx + k, cy + r], [cx, cy + r]);
  curve(c, [cx - k, cy + r], [cx - r, cy + k], [cx - r, cy]);
  curve(c, [cx - r, cy - k], [cx - k, cy - r], [cx, cy - r]);
  return c;
}

function bezier(p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}
/** The contour as points, each curve in `n` steps. */
export function outline(c: Contour, n = 24): Pt[] {
  const out: Pt[] = [c.start];
  let p = c.start;
  for (const s of c.segs) {
    if (s.c1 && s.c2) for (let i = 1; i <= n; i++) out.push(bezier(p, s.c1, s.c2, s.to, i / n));
    else out.push(s.to);
    p = s.to;
  }
  return out;
}
/** The signed area: positive for a contour that winds as a solid does here (clockwise on the screen). */
export function area(c: Contour) {
  const p = outline(c);
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const [x0, y0] = p[i];
    const [x1, y1] = p[(i + 1) % p.length];
    a += x0 * y1 - x1 * y0;
  }
  return a / 2;
}
function reverse(c: Contour): Contour {
  const pts = [c.start, ...c.segs.map((s) => s.to)];
  const out = at(...pts[pts.length - 1]);
  for (let i = c.segs.length - 1; i >= 0; i--) {
    const s = c.segs[i];
    if (s.c1 && s.c2) curve(out, s.c2, s.c1, pts[i]);
    else line(out, ...pts[i]);
  }
  return out;
}
/** Winds a contour as a solid, or as a counter. */
const wind = (c: Contour, hole = false) => (area(c) > 0 === !hole ? c : reverse(c));

/** A hairline `w` wide along a centreline (points close enough to be smooth), cut square at both ends. */
function stroke(pts: Pt[], w: number) {
  const left: Pt[] = [];
  const right: Pt[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = (b[1] - a[1]) / l;
    const ny = -(b[0] - a[0]) / l;
    left.push([p[0] + (nx * w) / 2, p[1] + (ny * w) / 2]);
    right.push([p[0] - (nx * w) / 2, p[1] - (ny * w) / 2]);
  });
  return poly([...left, ...right.reverse()]);
}

/**
 * A leg that curls into a ball (К's, Л's, R's): a hairline running straight along x(y) from `from` down to
 * `bend`, then turning along a cubic into the foot of its ball at `to`. The cubic leaves the line with a
 * handle `a` long and arrives level with a handle `b` long.
 */
function curl(o: { x: (y: number) => number; from: number; bend: number; a: number; b: number; to: Pt; w: number }) {
  const s = o.x(o.bend + 1) - o.x(o.bend);
  const l = Math.hypot(s, 1);
  const p0: Pt = [o.x(o.bend), o.bend];
  const dir = Math.sign(o.to[0] - p0[0]);
  const c1: Pt = [p0[0] + (o.a * s) / l, p0[1] + o.a / l];
  const c2: Pt = [o.to[0] - dir * o.b, o.to[1]];
  const pts: Pt[] = [[o.x(o.from), o.from]];
  for (let i = 0; i <= 20; i++) pts.push(bezier(p0, c1, c2, o.to, i / 20));
  return stroke(pts, o.w);
}

// ── The logo's letters, redrawn ────────────────────────────────────────────────────────────────────

/** Е: the spine, the two bands and the middle bar. */
function E(): Glyph {
  const w = 121.1;
  return { w, parts: [rect(0, 0, w, BT), rect(0, 0, HV, CAP), rect(0, 69, 104.1, 69 + HH), rect(0, CAP - BB, w, CAP)] };
}

/** А: the heavy «/», the hairline «\» out of its top, the hairline bar. */
function A(): Glyph {
  const s = 0.4841; // the heavy stroke's run for each unit of drop
  const t = 36.8; // its width, along the line
  const sh = 0.4685; // the hairline's run
  const th = 5.75; // its width, along the line
  const top = s * CAP; // the heavy stroke's left edge at the cap line
  const w = 174.2; // the hairline's foot, outside
  const heavyR = (y: number) => top + t - s * y;
  const thinL = (y: number) => w - th - sh * (CAP - y);
  const bar = [86.8, 91.4];
  return {
    w,
    parts: [
      poly([[top, 0], [top + t, 0], [t, CAP], [0, CAP]]),
      poly([[w - th - sh * CAP, 0], [w - sh * CAP, 0], [w, CAP], [w - th, CAP]]),
      poly([[top + t - 1, 0], [w - sh * CAP, 0], [thinL(8) + 1, 8], [heavyR(8) - 1, 8]]),
      poly([[heavyR(bar[0]) - 1, bar[0]], [thinL(bar[0]) + 1, bar[0]], [thinL(bar[1]) + 1, bar[1]], [heavyR(bar[1]) - 1, bar[1]]]),
    ],
  };
}

/** К: the hairline stem, the heavy «/» from its foot, and the leg that curls into a ball. */
function K(): Glyph {
  const s = 0.7285;
  const top = 99.14; // the heavy stroke's left edge at the cap line
  const t = 40.5;
  const ball = { x: 136.75, y: 131.5, r: 14.7 };
  return {
    w: ball.x + ball.r,
    parts: [
      rect(0, 0, HV, CAP),
      poly([[top, 0], [top + t, 0], [top + t - s * CAP, CAP], [0, CAP], [0, top / s]]),
      curl({ x: (y) => 85.45 + 0.4795 * (y - 80.9), from: 70, bend: 114, a: 26, b: 16, to: [135.75, 144.1], w: HD }),
      circle(ball.x, ball.y, ball.r),
    ],
  };
}

/** Д: the two bands, the hairline «/» and upright between them, the legs under the baseline. */
function De(): Glyph {
  const w = 160;
  const right = [136.75, 141.05];
  const left = (y: number) => 46.1 - 0.2647 * y; // the band's end and the hairline, their left edge
  const base = CAP - BB;
  const legs = 174.2;
  return {
    w,
    parts: [
      poly([[left(0), 0], [right[1], 0], [right[1], BT], [left(BT), BT]]),
      poly([[left(0), 0], [left(0) + HD, 0], [left(base + 1) + HD, base + 1], [left(base + 1), base + 1]]),
      rect(right[0], 0, right[1], base + 1),
      rect(0, base, w, CAP),
      rect(0, CAP - 1, 4.15, legs),
      rect(w - 4.05, CAP - 1, w, legs),
    ],
  };
}

/** Л: the band, the hairline upright on the right, the leg on the left curling into a ball. */
function El(): Glyph {
  const w = 167.15;
  const left = (y: number) => 63.4 - 0.2106 * y; // the band's end and the leg, their left edge
  const t = 4.8;
  const ball = { x: 14.75, y: 131.75, r: 14.65 };
  return {
    w,
    parts: [
      poly([[left(0), 0], [w, 0], [w, BT + 1], [left(BT + 1), BT + 1]]),
      rect(w - 4.15, 0, w, CAP),
      curl({ x: (y) => left(y) + t / 2, from: 20, bend: 122, a: 2, b: 21, to: [15.75, 144.2], w: t }),
      circle(ball.x, ball.y, ball.r),
    ],
  };
}

// ── The letters the logo doesn't have ─────────────────────────────────────────────────────────────

/** У: К's heavy «/» from the baseline to the cap line, and А's hairline «\» into it. */
function U(): Glyph {
  const s = 0.7285;
  const t = 40.9;
  const sa = 0.4685;
  const ta = 5.75;
  const w = s * CAP + t;
  const heavyL = (y: number) => w - t - s * y;
  const d1 = (w - t - ta) / (sa + s); // the hairline's right edge meets the heavy stroke
  const d2 = (w - t) / (sa + s); // and its left edge
  return {
    w,
    parts: [poly([[0, 0], [ta, 0], [ta + sa * d1, d1], [heavyL(0), 0], [w, 0], [t, CAP], [0, CAP], [sa * d2, d2]])],
  };
}

/** С: Е's bands, rounded on the left into a hairline, as the «?»'s hook is rounded. */
function Es(): Glyph {
  const w = 122;
  const ro = CAP / 2;
  const top = BT;
  const foot = CAP - BB;
  const ri = (foot - top) / 2;
  const c = at(w, 0);
  line(c, ro, 0);
  quarter(c, 0, CAP / 2, "h");
  quarter(c, ro, CAP, "v");
  line(c, w, CAP);
  line(c, w, foot);
  line(c, HV + ri, foot);
  quarter(c, HV, (top + foot) / 2, "h");
  quarter(c, HV + ri, top, "v");
  line(c, w, top);
  return { w, parts: [c] };
}

/**
 * A bowl on the spine, from the band at `top` round to the waist at `waist` (or the other way up when the
 * band is at the foot): its outside a half ellipse reaching `reach`, its counter flat along the band and
 * rounding into a hairline on the right, like the «?»'s hook.
 */
function bowl(o: { reach: number; round: number; y0: number; y1: number; band: "top" | "foot"; hr?: number }) {
  const hr = o.hr ?? 5.4;
  const k = 0.45; // where the counter reaches furthest out, from the middle of the round
  const cx = o.reach - o.round;
  const ry = (o.y1 - o.y0) / 2;
  const mid = o.y0 + ry;
  const x = cx + o.round * Math.sqrt(1 - k * k) - hr;
  if (o.band === "top") {
    const top = o.y0 + BT;
    const bottom = o.y1 - HH / 2;
    const y = mid + k * ry;
    const counter = at(HV, top);
    line(counter, cx, top);
    quarter(counter, x, y, "h");
    quarter(counter, cx - 2, bottom, "v");
    line(counter, HV, bottom);
    return { cx, counter };
  }
  const top = o.y0 + HH / 2;
  const bottom = o.y1 - BB;
  const y = mid - k * ry;
  const counter = at(HV, top);
  line(counter, cx - 2, top);
  quarter(counter, x, y, "h");
  quarter(counter, cx, bottom, "v");
  line(counter, HV, bottom);
  return { cx, counter };
}

/** В: Е's spine and bands, with two bowls that round into hairlines on the right. */
function Ve(): Glyph {
  const up = { reach: 110, round: 44 };
  const low = { reach: 121, round: 48 };
  const waist = CAP / 2;
  const u = bowl({ ...up, y0: 0, y1: waist, band: "top" });
  const l = bowl({ ...low, y0: waist, y1: CAP, band: "foot" });
  const outer = at(0, 0);
  line(outer, u.cx, 0);
  quarter(outer, up.reach, waist / 2, "h");
  quarter(outer, u.cx, waist, "v");
  line(outer, l.cx, waist);
  quarter(outer, low.reach, (waist + CAP) / 2, "h");
  quarter(outer, l.cx, CAP, "v");
  line(outer, 0, CAP);
  return { w: low.reach, parts: [outer], holes: [u.counter, l.counter] };
}

// ── Latin, for the English build ─────────────────────────────────────────────────────────────────

/** N: hairline stems, and a heavy diagonal from the top of one to the foot of the other. */
function N(): Glyph {
  const w = 142;
  const t = 40.9;
  return { w, parts: [rect(0, 0, HV, CAP), rect(w - HV, 0, w, CAP), poly([[0, 0], [t, 0], [w, CAP], [w - t, CAP]])] };
}

/** H: hairline stems, and a band across the middle. */
function Ha(): Glyph {
  const w = 128;
  const y = (CAP - BT) / 2 - 2;
  return { w, parts: [rect(0, 0, HV, CAP), rect(w - HV, 0, w, CAP), rect(0, y, w, y + BT)] };
}

/** O: С closed: the bands at the top and the foot, hairlines round the sides. */
function O(): Glyph {
  const w = 150;
  const ro = CAP / 2;
  const top = BT;
  const foot = CAP - BB;
  const ri = (foot - top) / 2;
  const mid = (top + foot) / 2;
  const outer = at(ro, 0);
  line(outer, w - ro, 0);
  quarter(outer, w, CAP / 2, "h");
  quarter(outer, w - ro, CAP, "v");
  line(outer, ro, CAP);
  quarter(outer, 0, CAP / 2, "h");
  quarter(outer, ro, 0, "v");
  const counter = at(HV + ri, top);
  line(counter, w - HV - ri, top);
  quarter(counter, w - HV, mid, "h");
  quarter(counter, w - HV - ri, foot, "v");
  line(counter, HV + ri, foot);
  quarter(counter, HV, mid, "h");
  quarter(counter, HV + ri, top, "v");
  return { w, parts: [outer], holes: [counter] };
}

/** U: O's heavy foot on two hairline stems. */
function Yu(): Glyph {
  const w = 140;
  const ro = CAP / 2;
  const foot = CAP - BB;
  const ri = (foot - BT) / 2;
  const c = at(0, 0);
  line(c, HV, 0);
  line(c, HV, foot - ri);
  quarter(c, HV + ri, foot, "v");
  line(c, w - HV - ri, foot);
  quarter(c, w - HV, foot - ri, "h");
  line(c, w - HV, 0);
  line(c, w, 0);
  line(c, w, CAP - ro);
  quarter(c, w - ro, CAP, "v");
  line(c, ro, CAP);
  quarter(c, 0, CAP - ro, "h");
  return { w, parts: [c] };
}

/** D: Е's spine and bands, closed by O's right side. */
function Di(): Glyph {
  const w = 138;
  const ro = CAP / 2;
  const top = BT;
  const foot = CAP - BB;
  const ri = (foot - top) / 2;
  const outer = at(0, 0);
  line(outer, w - ro, 0);
  quarter(outer, w, CAP / 2, "h");
  quarter(outer, w - ro, CAP, "v");
  line(outer, 0, CAP);
  const counter = at(HV, top);
  line(counter, w - HV - ri, top);
  quarter(counter, w - HV, (top + foot) / 2, "h");
  quarter(counter, w - HV - ri, foot, "v");
  line(counter, HV, foot);
  return { w, parts: [outer], holes: [counter] };
}

/** W: two V's, each А turned half round (a hairline «\» into a heavy «/»), the second rising out of the first. */
function Dubl(): Glyph {
  const s = 0.3;
  const t = 36;
  const th = 5.6;
  const run = s * CAP;
  const vee = (x: number) => [
    poly([[x, 0], [x + th, 0], [x + run + th, CAP], [x + run, CAP]]),
    poly([[x + 2 * run, 0], [x + 2 * run + t, 0], [x + run + t, CAP], [x + run, CAP]]),
  ];
  const x2 = 2 * run + t - th + 1;
  return { w: x2 + 2 * run + t, parts: [...vee(0), ...vee(x2)] };
}

/** R: В's upper bowl on the spine, and К's leg curling into a ball from its waist. */
function Ar(): Glyph {
  const reach = 112;
  const round = 44;
  const waist = CAP / 2 + 4;
  const u = bowl({ reach, round, y0: 0, y1: waist, band: "top" });
  const outer = at(0, 0);
  line(outer, u.cx, 0);
  quarter(outer, reach, waist / 2, "h");
  quarter(outer, u.cx, waist, "v");
  line(outer, 0, waist);
  const ball = { x: 118, y: 131.5, r: 14.7 };
  const x0 = u.cx - 6;
  return {
    w: ball.x + ball.r,
    holes: [u.counter],
    parts: [
      outer,
      rect(0, 0, HV, CAP),
      curl({ x: (y) => x0 + 0.4795 * (y - waist), from: waist - 3, bend: 116, a: 22, b: 15, to: [ball.x - 1, 144.1], w: HD }),
      circle(ball.x, ball.y, ball.r),
    ],
  };
}

/** Y: А's hairline «\» and К's heavy «/» meeting over a hairline stem, the heavy one cut level as К's foot is. */
function Wai(): Glyph {
  const join = 80;
  const sa = 0.4685;
  const ta = 5.75;
  const s = 0.7285;
  const t = 40.9;
  const stem = sa * join;
  const top = stem + s * join;
  return {
    w: top + t,
    parts: [
      poly([[0, 0], [ta, 0], [stem + HV, join], [stem, join]]),
      poly([[top, 0], [top + t, 0], [stem + t, join], [stem, join]]),
      rect(stem, join - 1, stem + HV, CAP),
    ],
  };
}

const GLYPHS: Record<string, () => Glyph> = {
  А: A,
  В: Ve,
  Д: De,
  Е: E,
  К: K,
  Л: El,
  С: Es,
  У: U,
  A,
  D: Di,
  E,
  H: Ha,
  N,
  O,
  R: Ar,
  U: Yu,
  W: Dubl,
  Y: Wai,
};

/** The letters this lettering has. */
export const LETTERS = Object.keys(GLYPHS).join("");

/** Each letter's glyph, wound for the nonzero rule: its solids one way, its counters the other. */
export function glyph(ch: string): { w: number; parts: Contour[] } {
  const make = GLYPHS[ch];
  if (!make) throw new Error(`The lettering has no «${ch}» (src/lib/lettering.ts)`);
  const g = make();
  return { w: g.w, parts: [...g.parts.map((c) => wind(c)), ...(g.holes ?? []).map((c) => wind(c, true))] };
}

// ── Setting ─────────────────────────────────────────────────────────────────────────────────────────

/** Room either side of a letter, as the logo sets them (about 11 between two uprights). */
const SIDES: Record<string, readonly [number, number]> = {
  Л: [2.4, 5.5],
  В: [5.5, 4.5],
  С: [4, 5.5],
  O: [4, 4],
  D: [5.5, 4],
  R: [5.5, 8],
  W: [4, 4],
  Y: [4, 5.5],
};
const side = (ch: string, i: 0 | 1) => SIDES[ch]?.[i] ?? 5.5;
/** Pairs set closer than their sides say: the logo's К and А, and А's open foot before С. */
const KERN: Record<string, number> = { КА: -6.5, АС: -6 };
/** Between two words. */
export const SPACE = 64;
/** Word spaces that need more, where two flat sides face each other across them (С's ends and К's stem, D's
 *  bowl and H's stem) and would read closer than the diagonals' spaces. */
const SPACE_KERN: Record<string, number> = { СК: 32, DH: 24 };
/** The space between two words, the last letter of one and the first of the next. */
export const space = (a: string, b: string) => SPACE + (SPACE_KERN[a.toUpperCase() + b.toUpperCase()] ?? 0);
/** Between the last letter and the logo's «?», beyond the letter's own side: the wordmark's А to its «?». */
export const Q_SIDE = 1.4;

const r1 = (v: number) => Math.round(v * 10) / 10;
function path(parts: Contour[], dx: number) {
  const f = (p: Pt) => `${r1(p[0] + dx)} ${r1(p[1])}`;
  return parts
    .map((c) => `M${f(c.start)}${c.segs.map((s) => (s.c1 && s.c2 ? `C${f(s.c1)} ${f(s.c2)} ${f(s.to)}` : `L${f(s.to)}`)).join("")}Z`)
    .join("");
}

/** One line of capitals: its path (in the units above), where each letter starts, and its width from its
 *  first ink to its last. */
export function setLine(text: string) {
  let x = 0;
  let prev: string | null = null;
  const d: string[] = [];
  const starts: number[] = [];
  let before: string | null = null;
  for (const ch of text.toUpperCase()) {
    if (ch === " ") {
      before = prev ?? before;
      prev = null;
      continue;
    }
    const g = glyph(ch);
    if (prev) x += side(prev, 1) + side(ch, 0) + (KERN[prev + ch] ?? 0);
    else if (before) x += space(before, ch);
    before = null;
    starts.push(x);
    d.push(path(g.parts, x));
    x += g.w;
    prev = ch;
  }
  return { d: d.join(""), w: x, starts, first: text.trim().charAt(0).toUpperCase(), last: prev ?? "" };
}

export type Line = { text: string; d: string; w: number };
export type Lettering = {
  lines: [Line, Line];
  /** Between the two lines when they are set on one (the wide line), in units: the word space between them. */
  join: number;
  /** Between the last letter's ink and the «?»'s box, in units. */
  qGap: number;
};

/**
 * The question in two lines, broken at the space that keeps the longer line shortest (the second carries the
 * «?», so it counts its room): «А у вас» over «как дела», «And how» over «are you». Its own «?» is dropped:
 * the logo's stands in its place.
 */
export function letterAsk(ask: string, qWidth = WORDMARK.dela[4].box.w): Lettering {
  const words = ask.replace(/[?\s]+$/u, "").trim().split(/\s+/u);
  let best: Lettering | null = null;
  let longest = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    const l1 = setLine(a);
    const l2 = setLine(b);
    const qGap = side(l2.last, 1) + Q_SIDE;
    const m = Math.max(l1.w, l2.w + qGap + qWidth);
    if (m < longest) {
      longest = m;
      best = { lines: [{ text: a, d: l1.d, w: l1.w }, { text: b, d: l2.d, w: l2.w }], join: space(l1.last, l2.first), qGap };
    }
  }
  if (!best) throw new Error(`The question «${ask}» needs two words to set on two lines`);
  return best;
}
