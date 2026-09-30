import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { WORDMARK } from "@/components/brand/wordmark-data";
import {
  ARRIVAL,
  ASK,
  ASKS,
  CAPS,
  CURVES,
  GLYPH,
  HEAD,
  LINE_MQ,
  NAIL,
  PHYS,
  RIG_HEIGHT,
  SIGN,
  WIDE,
  WIDE_MQ,
  arrivalAt,
  arrivalCss,
  arrivalSeries,
  arrivalStart,
  atRest,
  headOf,
  energy,
  hanging,
  pose,
  push,
  rig,
  signVars,
  step,
  twistEnergy,
  type Curve,
  type Input,
  type Pose,
  type SignState,
} from "./sign";

const CSS = readFileSync(path.resolve(__dirname, "../styles/about.css"), "utf8");
const r = rig();

/** Each strand's reach: from the nail's centre to its hole. */
const strands = (s: SignState) =>
  [-1, 1].map((side) => {
    const c = Math.cos(s.a);
    const sn = Math.sin(s.a);
    return Math.hypot(s.x + side * r.hx * c - r.hy * sn, s.y + side * r.hx * sn + r.hy * c);
  });

/** Runs `seconds` of physics, calling `each` after every step. */
function run(s: SignState, seconds: number, each?: (s: SignState, t: number) => void, input: Input = {}) {
  for (let i = 0, n = Math.round(seconds / PHYS.step); i < n; i++) {
    step(s, r, PHYS.step, input);
    each?.(s, (i + 1) * PHYS.step);
  }
  return s;
}

/** The sign hanging at rest, turned `deg` about the nail as one piece: both strands exactly taut. */
function swung(deg: number): SignState {
  const b = (deg * Math.PI) / 180;
  return { ...hanging(r), x: -r.rest * Math.sin(b), y: r.rest * Math.cos(b), a: b };
}

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

describe("the rig", () => {
  it("hangs from the dot of the logo's own «?»", () => {
    const [hook, dot] = [WORDMARK.dela[4], WORDMARK.dela[5]];
    expect(dot.box.y).toBeGreaterThan(hook.box.y + hook.box.h);
    expect(Math.abs(dot.box.w - dot.box.h)).toBeLessThanOrEqual(2);
    expect(GLYPH.h).toBe(dot.box.y + dot.box.h - hook.box.y);
    expect(GLYPH.hook).toBe(hook.d);
    expect(NAIL.y).toBeGreaterThan(SIGN.glyph * 0.85);
    expect(NAIL.y).toBeLessThan(SIGN.glyph);
    expect(NAIL.r).toBeGreaterThan(0.04);
    expect(NAIL.r).toBeLessThan(0.08);
  });

  // The solver's own settling: a hundredth of a millimetre, for good (a minute of it changes nothing).
  it("sets the line's «?» to the question's caps after its second line, its dot on that line's baseline", () => {
    // The «?» is a little taller than the caps (its hook rises over them, its dot sits on the baseline).
    expect(HEAD.qH).toBeGreaterThan(1);
    expect(HEAD.qH).toBeLessThan(1.1);
    const baseline = 2 + ASK.lead;
    expect(HEAD.hangEm).toBeLessThan(baseline);
    expect(HEAD.hangEm).toBeGreaterThan(baseline - 0.1);
    expect(HEAD.qTop + HEAD.qH).toBeGreaterThan(baseline);
    expect(HEAD.qLeft).toBeCloseTo(ASK.lines[1] + ASK.qGap, 9);
    expect(HEAD.nailEm).toBeGreaterThan(HEAD.qLeft);
    expect(HEAD.nailEm).toBeLessThan(HEAD.qLeft + HEAD.qW);
    expect(HEAD.headEm).toBeGreaterThanOrEqual(Math.max(ASK.lines[0], HEAD.qLeft + HEAD.qW));
    expect(Math.abs(WORDMARK.dela[1].box.y - CAPS.top)).toBeLessThan(0.5);
    expect(Math.abs(WORDMARK.dela[1].box.h - CAPS.height)).toBeLessThan(0.5);
    // On one line the «?» stands after both lines and a space, on the first line's baseline.
    expect(WIDE.qLeft).toBeCloseTo(ASK.lines[0] + ASK.join + HEAD.qLeft, 9);
    expect(WIDE.hangEm).toBeCloseTo(HEAD.hangEm - 1 - ASK.lead, 9);
    expect(WIDE.headEm).toBeCloseTo(WIDE.qLeft + WIDE.qW + 0.02, 9);
  });

  it("hangs level at rest, both strands taut", () => {
    const s = run(hanging(r), 3);
    expect(Math.abs(s.x)).toBeLessThan(1e-5);
    expect(Math.abs(s.y - r.rest)).toBeLessThan(1e-5);
    expect(Math.abs(s.a)).toBeLessThan(1e-4);
    for (const d of strands(s)) expect(Math.abs(d - r.cord)).toBeLessThan(1e-5);
    expect(atRest(s, r)).toBe(true);
  });

  it("rests exactly where the stylesheet draws it", () => {
    const p = pose(hanging(r), r);
    expect(Math.abs(p.swing)).toBeLessThan(1e-9);
    expect(Math.abs(p.fall)).toBeLessThan(1e-9);
    expect(Math.abs(p.tilt)).toBeLessThan(1e-9);
    expect(p.cords[0].stretch).toBeCloseTo(1, 9);
    expect(p.cords[1].stretch).toBeCloseTo(1, 9);
    expect(p.cords[0].angle).toBeCloseTo(parseFloat(signVars["--sign-cord-a"]), 3);
    expect(p.cords[1].angle).toBeCloseTo(parseFloat(signVars["--sign-cord-b"]), 3);
    expect(RIG_HEIGHT).toBeCloseTo(NAIL.y + r.rest / r.W + SIGN.ratio / 2, 9);
    expect(parseFloat(signVars["--sign-rest"])).toBeCloseTo(r.rest / r.W, 4);
    expect(parseFloat(signVars["--sign-cord"])).toBeCloseTo(r.cord / r.W, 4);
  });
});

describe("the physics", () => {
  // A cord gives a hair on the jolt (under a quarter of a percent: a third of a pixel, for an instant).
  it("catches the arrival on the nail and settles; no strand ever runs past its length", () => {
    const s = arrivalStart(r);
    let slack = false;
    let most = 0;
    run(s, 14, (s) => {
      for (const d of strands(s)) {
        most = Math.max(most, d / r.cord);
        if (d < r.cord - 1e-3) slack = true;
      }
    });
    expect(slack).toBe(true);
    expect(most).toBeLessThan(1 + 2.5e-3);
    expect(atRest(s, r)).toBe(true);
  });

  it("only loses energy in a free swing", () => {
    const s = swung(12);
    let prev = energy(s, r);
    run(s, 6, (s, t) => {
      if (Math.round(t * 1000) % 10 !== 0) return;
      const e = energy(s, r);
      expect(e).toBeLessThanOrEqual(prev + 1e-6);
      prev = e;
    });
    expect(energy(s, r)).toBeLessThan(energy(swung(12), r));
  });

  it("winds its cord when spun, and unwinds back to its front", () => {
    const s = hanging(r);
    for (let i = 0; i < 4; i++) push(s, 1);
    let most = 0;
    let prev = twistEnergy(s);
    run(s, 40, (s) => {
      most = Math.max(most, Math.abs(s.turn));
      const e = twistEnergy(s);
      expect(e).toBeLessThanOrEqual(prev + 1e-9);
      prev = e;
    });
    expect(most).toBeGreaterThan(2 * Math.PI);
    expect(Math.abs(s.turn)).toBeLessThan(5e-3);
  });

  it("shows its back to one hard push, then its front again", () => {
    const s = hanging(r);
    push(s, 1);
    let back = false;
    run(s, 30, (s) => {
      if (Math.cos(s.turn) < 0) back = true;
    });
    expect(back).toBe(true);
    expect(Math.cos(s.turn)).toBeGreaterThan(0.9999);
  });

  it("turns toward the side it is pushed on", () => {
    const right = hanging(r);
    const left = hanging(r);
    push(right, 0.8);
    push(left, -0.8);
    expect(right.vturn).toBeGreaterThan(0);
    expect(left.vturn).toBeLessThan(0);
    const soft = hanging(r);
    push(soft, 0.1);
    expect(Math.abs(soft.vturn)).toBeLessThan(right.vturn);
  });

  it("feels the page: under 1 g the cord stays taut, a jolt past 1 g slackens it, and it lands again", () => {
    run(hanging(r), 0.4, (s) => {
      for (const d of strands(s)) expect(d).toBeGreaterThan(r.cord - 1e-6);
    }, { accel: 0.8 * PHYS.g });
    const hard = hanging(r);
    let slack = false;
    run(hard, 0.08, (s) => {
      if (strands(s).some((d) => d < r.cord - 1e-4)) slack = true;
    }, { accel: 2 * PHYS.g });
    expect(slack).toBe(true);
    run(hard, 14);
    expect(atRest(hard, r)).toBe(true);
  });

  it("follows a hand, and swings when let go", () => {
    const s = hanging(r);
    const hand = { rx: r.W / 2, ry: 0, tx: r.W / 2 + 0.06, ty: r.rest - 0.03 };
    run(s, 1, undefined, { hand });
    expect(s.x).toBeGreaterThan(0.02);
    run(s, 0.3);
    expect(Math.hypot(s.vx, s.vy) + Math.abs(s.va)).toBeGreaterThan(0.01);
    run(s, 16);
    expect(atRest(s, r)).toBe(true);
  });

  it("replays exactly", () => {
    expect(arrivalAt(1.234, r)).toEqual(arrivalAt(1.234, r));
  });
});

describe("the arrival, baked into CSS", () => {
  const sr = arrivalSeries(r);
  const css = arrivalCss(r);
  const baked = [...css.matchAll(/linear\(([^)]*)\) \d+ms backwards/g)].map((m) =>
    m[1].split(", ").map((pt) => {
      const [v, t] = pt.trim().split(" ");
      return { t: parseFloat(t) / 100, v: parseFloat(v) };
    }),
  );
  const at = (pts: { t: number; v: number }[], x: number) => {
    let i = 1;
    while (i < pts.length - 1 && pts[i].t < x) i++;
    const a = pts[i - 1];
    const b = pts[i];
    return a.v + ((b.v - a.v) * (x - a.t)) / (b.t - a.t || 1);
  };
  const deg = ARRIVAL.tolDeg + 1e-3;
  const TOL: Record<Curve, number> = {
    swing: deg,
    fall: ARRIVAL.tolW + 1e-5,
    tilt: deg,
    turn: deg,
    cordA: deg,
    stretchA: ARRIVAL.tolStretch + 1e-4,
    cordB: deg,
    stretchB: ARRIVAL.tolStretch + 1e-4,
  };

  it("has one curve per moving part, in order", () => {
    expect(baked).toHaveLength(CURVES.length);
  });

  it("replays the simulation within its tolerances", () => {
    CURVES.forEach((k, j) => {
      const T = sr[k].t[sr[k].t.length - 1];
      sr[k].t.forEach((t, i) => {
        expect(Math.abs(at(baked[j], t / T) - sr[k].v[i]), `${k} at ${t.toFixed(3)} s`).toBeLessThanOrEqual(TOL[k]);
      });
    });
  });

  it("starts where the sign is let go and ends at rest", () => {
    const first = flat(pose(arrivalStart(r), r));
    const last = flat(pose(hanging(r), r));
    CURVES.forEach((k, j) => {
      expect(baked[j][0].v, k).toBeCloseTo(first[k], 2);
      expect(baked[j][baked[j].length - 1].v, k).toBeCloseTo(last[k], 2);
    });
  });

  it("is the island's physics until the hand-off, which comes before it eases to rest", () => {
    expect(ARRIVAL.handoff).toBeLessThan(ARRIVAL.until - ARRIVAL.settle);
    const p = flat(pose(arrivalAt(3, r), r));
    const i = sr.swing.t.findIndex((t) => Math.abs(t - 3) < 1e-9);
    expect(i).toBeGreaterThan(0);
    for (const k of CURVES) expect(sr[k].v[i], k).toBeCloseTo(p[k], 9);
  });

  it("drops, catches and swings: visibly, and never wildly", () => {
    const swing = Math.max(...sr.swing.v.map(Math.abs));
    expect(swing).toBeGreaterThan(2);
    expect(swing).toBeLessThan(20);
    expect(Math.min(...sr.stretchA.v)).toBeLessThan(-0.05);
    expect(Math.max(...sr.stretchA.v, ...sr.stretchB.v)).toBeLessThan(1e-3);
  });
});

describe("about.css and sign.ts agree", () => {
  it("repeats LINE_MQ and WIDE_MQ verbatim", () => {
    expect(CSS).toContain(`@media ${LINE_MQ}`);
    expect(CSS).toContain(`@media ${WIDE_MQ}`);
  });

  it("defines every --sign-* it reads", () => {
    const used = new Set([...CSS.matchAll(/var\((--sign-[a-z-]+)/g)].map((m) => m[1]));
    // Written by the island, not by the section.
    used.delete("--sign-shade");
    expect(used.size).toBeGreaterThan(12);
    for (const v of used) expect(signVars, v).toHaveProperty([v]);
  });

});

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

/** Д's legs, under the baseline, in the caps' height (src/lib/lettering.ts). */
const LEGS = (174.2 - 143.25) / 143.25;

/** Each build's question, on two lines and on one (this run's build is HEAD and WIDE). */
const QUESTIONS = { ru: [headOf(ASKS.ru, 2), headOf(ASKS.ru, 1)], en: [headOf(ASKS.en, 2), headOf(ASKS.en, 1)] } as const;

/**
 * A mirror of about.css's opening and the tokens it reads (globals.css) at a viewport of `vw` × `vh`, for
 * either build's question: its size, the sign's width and place, where its foot lands, and the founding line's
 * room and top. A change to either must come with a change to the other.
 */
function layout(vw: number, vh: number, locale: keyof typeof QUESTIONS = "ru") {
  const [HEAD, WIDE] = QUESTIONS[locale];
  const rem = clamp(9.333 + 0.004167 * vw, 16, 20);
  const header = vw >= 2400 ? 80 : vw >= 1920 ? 72 : vw >= 1024 ? 64 : 56;
  const gutter = vw < 640 ? 16 : clamp(0.034 * vw, 24, 104);
  const gap = vw < 640 ? 16 : clamp(0.016 * vw, 20, 48);
  const content = vw - 2 * gutter;
  const line = vw >= 1024 && vw / vh >= 1.2;
  const wide = line && vw / vh >= 2;
  if (line) {
    const Q = wide ? WIDE : HEAD;
    const room = vh - header - 0.1 * vh;
    const k = Q.hangEm / Q.nailEm;
    const flush = Math.max(18 * rem, Math.min(0.52 * vw, (room - k * content) / (Q.below - k / 2)));
    const askF = Math.min(0.17 * vh, (content - flush / 2) / Q.nailEm);
    const nailX = gutter + Q.nailEm * askF;
    const sw = Math.max(18 * rem, Math.min(0.52 * vw, 2 * (vw - gutter - nailX), (room - Q.hangEm * askF) / Q.below));
    const padT = Math.max(0.05 * vh, (vh - header - Q.hangEm * askF - Q.below * sw) * 0.45);
    const foot = padT + Q.hangEm * askF + Q.below * sw;
    const story = nailX - sw / 2 - 2 * gap - gutter;
    // The founding line's top: level with the paper's, under the question.
    const storyTop = padT + Q.hangEm * askF + Q.paper * sw;
    const legs = padT + (Q.heightEm + LEGS) * askF;
    return { line, wide, Q, rem, gutter, content, askF, capped: askF >= 0.17 * vh - 0.01, sw, foot, stage: vh - header, signRight: nailX + sw / 2, story, storyTop, legs };
  }
  const askF = Math.min(0.16 * vh, content / HEAD.stackEm);
  const sw = Math.min(content, Math.max(16 * rem, (vh - header - HEAD.heightEm * askF - 8 * rem) / RIG_HEIGHT));
  return { line, wide, Q: HEAD, rem, gutter, content, askF, capped: false, sw, foot: 0, stage: vh - header, signRight: 0, story: 0, storyTop: 0, legs: 0 };
}

const SIZES: [number, number][] = [
  [360, 780], [390, 667], [390, 844], [430, 932], [768, 1024], [820, 1180], [1024, 1366], [1280, 1024],
  [667, 375], [844, 390], [932, 430], [900, 600], [1024, 768], [1280, 720], [1280, 800], [1280, 960],
  [1366, 768], [1440, 900], [1536, 864], [1920, 1080], [2560, 1440], [3440, 1440], [1366, 600], [3840, 1080],
  [2048, 1080], [2160, 1080], [2560, 1080],
];

describe.each(SIZES.flatMap(([vw, vh]) => (["ru", "en"] as const).map((l) => [vw, vh, l] as const)))("the opening at %i×%i (%s)", (vw, vh, locale) => {
  const L = layout(vw, vh, locale);

  if (L.line) {
    it(`sets the question within the content, on ${L.wide ? "one line" : "two lines"}`, () => {
      expect(L.Q.headEm * L.askF).toBeLessThanOrEqual(L.content + 0.01);
    });

    it("hangs the sign with its right edge on the right gutter and leaves the founding line room beside it", () => {
      if (L.capped) expect(L.signRight).toBeLessThanOrEqual(vw - L.gutter + 0.5);
      else expect(L.signRight).toBeCloseTo(vw - L.gutter, 1);
      expect(L.story).toBeGreaterThanOrEqual(15 * L.rem);
    });

    it("starts the founding line level with the paper, clear of Д's legs", () => {
      expect(L.storyTop - L.legs).toBeGreaterThanOrEqual(0.25 * L.askF);
      expect(L.storyTop).toBeLessThan(L.foot - 0.3 * SIGN.ratio * L.sw);
    });

    if (L.sw > 18 * L.rem + 0.5) {
      it("stands the sign's foot on the first screen", () => {
        expect(L.foot).toBeLessThanOrEqual(L.stage);
      });
    }
  } else {
    it("sets the question across the content and the sign within it", () => {
      expect(L.Q.stackEm * L.askF).toBeLessThanOrEqual(L.content + 0.01);
      expect(L.sw).toBeLessThanOrEqual(L.content + 0.01);
      expect(L.sw).toBeGreaterThanOrEqual(Math.min(L.content, 15 * L.rem));
    });
  }
});
