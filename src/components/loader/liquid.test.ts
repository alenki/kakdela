// The loader's pour (assets-src/loader/liquid-sim.js), driven without a worker or a canvas: it must start 38%
// full, never run ahead of the runtime's needle, pour on unmoved while the page's main thread is held up,
// reach the brim and drain within the exit's budget, and stay bounded, finite and the same for the same seed.
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { describe, expect, it } from "vitest";

type Show = { W: number; H: number };
// surf: the surface's screen y at each of SX columns; stream: x and half width at each of SY rows;
// drops: x, y, radius and a spare float for each droplet in the air; covered: the whole screen is ink.
type View = {
  W: number;
  H: number;
  t: number;
  level: number;
  SX: number;
  surf: Float32Array;
  SY: number;
  stream: Float32Array;
  top: number;
  bottom: number;
  nDrops: number;
  drops: Float32Array;
  covered: boolean;
};
type Liquid = {
  PREFILL: number;
  MAX_DROPS: number;
  create(o: { W: number; H: number; seed: number; mode: "full" | "brisk"; W8: number[]; got: boolean[] }): Show;
  start(s: Show, at?: { p: number; t: number }): void;
  milestone(s: Show, m: { got: boolean[]; hurried: boolean }): void;
  exit(s: Show): void;
  go(s: Show): void;
  resize(s: Show, W: number, H: number): void;
  advance(s: Show, dt: number): string[];
  level(s: Show): number;
  ceil(s: Show): number;
  view(s: Show): View;
};

const SRC = readFileSync(new URL("../../../assets-src/loader/liquid-sim.js", import.meta.url), "utf8");
function load(): Liquid {
  const box: { KDLiquid?: Liquid } = {};
  vm.runInNewContext(SRC, box);
  if (!box.KDLiquid) throw new Error("liquid-sim.js defines no KDLiquid");
  return box.KDLiquid;
}
const C = load();

// A load's milestones, as the runtime counts them (runtime.js, PLANS.load).
const W8 = [0.1, 0.15, 0.2, 0.2, 0.15, 0.2];
const fresh = () => [true, false, false, false, false, false];
// When each arrives in a typical first load (s): the DOM, the faces, the first screen's images, hydration, load.
const SCHEDULE: [number, number][] = [
  [0.3, 1],
  [0.6, 2],
  [1.0, 3],
  [1.6, 4],
  [2.0, 5],
];

// The runtime's own needle (runtime.js, aim and follow), to hold the level to.
function aim(got: boolean[], t: number) {
  let sum = 0;
  let next = 0;
  for (let i = 0; i < W8.length; i++) {
    if (got[i]) sum += W8[i];
    else next = Math.max(next, W8[i]);
  }
  return Math.min(1, sum + 0.6 * next * (1 - Math.exp(-t / 1.4)));
}
function follow(cur: number, to: number, dt: number, sweep: number) {
  const gap = Math.max(0, Math.min(to, 1) - cur);
  const step = Math.max(gap * (1 - Math.exp(-dt / 0.16)), Math.min(gap, dt / (3 * sweep)));
  return cur + Math.min(step, dt / sweep);
}

type Run = { s: Show; got: boolean[]; v: number; t: number };
function show(mode: "full" | "brisk", seed = 7, W = 1440, H = 900): Run {
  const s = C.create({ W, H, seed, mode, W8, got: fresh() });
  C.start(s);
  return { s, got: fresh(), v: 0, t: 0 };
}
// One frame of the runtime: `dt` of its visible time, the milestones due by `now` (the page's own events,
// on the wall clock; told to the pour as the page tells it), and its needle.
function tick(r: Run, dt: number, sweep: number, now?: number) {
  r.t += dt;
  for (const [at, i] of SCHEDULE) {
    if (!r.got[i] && (now ?? r.t) >= at - 1e-9) {
      r.got[i] = true;
      C.milestone(r.s, { got: r.got.slice(), hurried: false });
    }
  }
  r.v = follow(r.v, aim(r.got, r.t), dt, sweep);
  if (r.v > 0.999 && r.got.every(Boolean)) r.v = 1;
}
// Frames at 60 fps until `until` (s), milestones as scheduled; `each` sees every frame.
function play(r: Run, until: number, each?: (r: Run, events: string[]) => void, sweep = 1.1) {
  const dt = 1 / 60;
  while (r.t < until - 1e-9) {
    tick(r, dt, sweep);
    const events = C.advance(r.s, dt);
    each?.(r, events);
  }
}
// The surface's highest and lowest points (screen y, down).
function extent(v: View) {
  let top = Infinity;
  let bottom = -Infinity;
  for (let i = 0; i < v.SX; i++) {
    top = Math.min(top, v.surf[i]);
    bottom = Math.max(bottom, v.surf[i]);
  }
  return { top, bottom };
}
function finite(a: Float32Array, n: number) {
  for (let i = 0; i < n; i++) if (!Number.isFinite(a[i])) return false;
  return true;
}
// The exit, answered as the host answers it (`go` as soon as the brim is reported); the events with their times.
function exitOf(r: Run, answer = true, limit = 4) {
  C.exit(r.s);
  const at: Record<string, number> = {};
  const t0 = r.t;
  const dt = 1 / 60;
  while (r.t - t0 < limit && at.done === undefined) {
    r.t += dt;
    for (const e of C.advance(r.s, dt)) {
      if (at[e] === undefined) at[e] = r.t - t0;
      if (e === "brim" && answer) C.go(r.s);
    }
  }
  return at;
}

describe("the pour's first frame", () => {
  it("starts 38% full", () => {
    const s = C.create({ W: 1440, H: 900, seed: 7, mode: "full", W8, got: fresh() });
    expect(C.PREFILL).toBe(0.38);
    expect(C.level(s)).toBeCloseTo(0.38 * 900, 1);
  });

  it("starts still: a flat surface and nothing in the air", () => {
    const s = C.create({ W: 1440, H: 900, seed: 7, mode: "full", W8, got: fresh() });
    C.start(s);
    const v = C.view(s);
    const { top, bottom } = extent(v);
    // The meniscus lifts the edges a few px; the rest lies at the level.
    expect(bottom).toBeCloseTo(900 - 0.38 * 900, 0);
    expect(bottom - top).toBeLessThan(6);
    expect(v.nDrops).toBe(0);
  });

  it("works at a phone's size too", () => {
    const s = C.create({ W: 390, H: 844, seed: 3, mode: "full", W8, got: fresh() });
    expect(C.level(s)).toBeCloseTo(0.38 * 844, 1);
  });
});

describe("the stream", () => {
  it("on a first load, falls in from the top edge and lands in a splash", () => {
    const r = show("full");
    play(r, 1 / 60);
    let v = C.view(r.s);
    // Its head has only just come in over the top edge.
    expect(v.top).toBeLessThanOrEqual(1);
    expect(v.bottom).toBeGreaterThan(0);
    expect(v.bottom).toBeLessThan(900 - 0.38 * 900 - 40);
    // Droplets are up for a tenth of a second or so: count the most in the air at once.
    let flying = 0;
    play(r, 0.35, (rr) => {
      flying = Math.max(flying, C.view(rr.s).nDrops);
    });
    v = C.view(r.s);
    const { top } = extent(v);
    expect(v.bottom).toBeGreaterThan(top - 2);
    expect(flying).toBeGreaterThan(3);
  });

  it("on a brisk load, falls in from the top edge too", () => {
    const r = show("brisk");
    play(r, 1 / 60, undefined, 0.45);
    const v = C.view(r.s);
    expect(v.top).toBeLessThanOrEqual(1);
    expect(v.bottom).toBeGreaterThan(0);
    expect(v.bottom).toBeLessThan(900 - 0.38 * 900 - 40);
  });

  it("can start late: onto the still pool the page first painted, then catches up with the needle", () => {
    // The shaders took most of a second: the needle is at 0.4 by then, the pool on the page still at 38%.
    const got = [true, true, true, false, false, false];
    const s = C.create({ W: 1440, H: 900, seed: 7, mode: "full", W8, got });
    C.start(s, { p: 0.4, t: 0.9 });
    const L0 = 0.38 * 900;
    expect(C.level(s)).toBeCloseTo(L0, 1);
    const v = C.view(s);
    const { top, bottom } = extent(v);
    expect(bottom).toBeCloseTo(900 - L0, 0);
    expect(bottom - top).toBeLessThan(6);
    // The stream's head is at the top edge, not yet in the pool.
    expect(v.bottom).toBeLessThan(900 - L0 - 40);
    // It lands, and the level rises to where the needle is (0.4, and creeping) within a second.
    for (let i = 0; i < 60; i++) C.advance(s, 1 / 60);
    expect(C.level(s)).toBeGreaterThan(L0 + 0.4 * (900 - C.ceil(s) - L0) - 12);
  });

  it("runs unbroken from the top edge down into the pool, on the screen, with a positive width", () => {
    const r = show("full");
    play(r, 0.6);
    const v = C.view(r.s);
    let first = -1;
    let last = -1;
    let gaps = 0;
    for (let j = 0; j < v.SY; j++) {
      const w = v.stream[j * 2 + 1];
      if (w > 0) {
        if (first < 0) first = j;
        else if (j !== last + 1) gaps++;
        last = j;
        const x = v.stream[j * 2];
        expect(x).toBeGreaterThan(0);
        expect(x).toBeLessThan(1440);
        expect(w).toBeLessThan(20);
      }
    }
    expect(first).toBe(0);
    expect(gaps).toBe(0);
    // It reaches the pool: its last row is at or under the surface.
    const { top } = extent(v);
    expect((last * 900) / (v.SY - 1)).toBeGreaterThan(top - 4);
  });
});

describe("the level is the progress", () => {
  it("never runs ahead of the runtime's needle", () => {
    const r = show("full");
    const L0 = 0.38 * 900;
    let worst = -Infinity;
    play(r, 6, (rr) => {
      const allowed = L0 + rr.v * (900 - C.ceil(rr.s) - L0);
      worst = Math.max(worst, C.level(rr.s) - allowed);
    });
    expect(worst).toBeLessThan(0.004 * 900 + 2);
  });

  it("pours on, unmoved, while the page's main thread is held up, and never above what has arrived", () => {
    // Hydration can hold the main thread for most of a second: the runtime's clock stands still (no
    // frames, no reports) and then takes one step of at most 0.1 s. The pour steps the needle on its own
    // clock from the milestones it is told, so the same pour held up or not is the same pour.
    const free = show("full");
    const held = show("full");
    const L0 = 0.38 * 900;
    const dt = 1 / 60;
    let apart = 0;
    let worst = -Infinity;
    let own = 0;
    let wait = 0;
    while (own < 6 - 1e-9) {
      own += dt;
      tick(free, dt, 1.1);
      C.advance(free.s, dt);
      // Held from 1.05 s to 1.55 s: no milestone falls due in it, none can be told.
      if (own > 1.05 && own < 1.55) wait += dt;
      else {
        tick(held, wait > 0 ? Math.min(0.1, wait + dt) : dt, 1.1, own);
        wait = 0;
      }
      C.advance(held.s, dt);
      apart = Math.max(apart, Math.abs(C.level(held.s) - C.level(free.s)));
      // What has arrived (and the runtime's creep into what hasn't) bounds it, on the pour's own clock.
      worst = Math.max(worst, C.level(held.s) - (L0 + aim(held.got, own) * (900 - C.ceil(held.s) - L0)));
    }
    expect(apart).toBeLessThan(0.5);
    expect(worst).toBeLessThan(2);
    expect(C.level(held.s)).toBeGreaterThan(900 - C.ceil(held.s) - 0.02 * 900);
  });

  it("with everything in, fills to just under the top edge and waits there, still pouring", () => {
    const r = show("full");
    play(r, 6);
    const top = 900 - C.ceil(r.s);
    expect(C.level(r.s)).toBeGreaterThan(top - 0.02 * 900);
    expect(C.level(r.s)).toBeLessThan(top + 2);
    const v = C.view(r.s);
    expect(v.top).toBeLessThanOrEqual(1);
    expect(v.stream[1]).toBeGreaterThan(0);
  });

  it("never dips under where it started until the brim, so the page's pool under the canvas never shows", () => {
    // The page's pool (loader.css) stays under the canvas, 2px under the 38% line, until the cover goes.
    for (const [W, H, mode, seed] of [
      [1440, 900, "full", 3],
      [1440, 900, "brisk", 8],
      [390, 844, "brisk", 5],
      [1920, 1080, "full", 8],
    ] as const) {
      const r = show(mode, seed, W, H);
      const line = H - 0.38 * H;
      let deepest = -Infinity;
      const under = () => deepest = Math.max(deepest, extent(C.view(r.s)).bottom - line);
      play(r, mode === "brisk" ? 2 : 4, under, mode === "brisk" ? 0.45 : 1.1);
      C.exit(r.s);
      for (let i = 0; i < 120 && !C.advance(r.s, 1 / 60).includes("brim"); i++) under();
      expect(deepest).toBeLessThan(2);
    }
  });

  it("follows the needle up: halfway through a load it is well above where it started", () => {
    const r = show("full");
    play(r, 1.2);
    expect(C.level(r.s)).toBeGreaterThan(0.38 * 900 + 0.2 * (900 - 0.38 * 900));
  });
});

describe("the exit", () => {
  it("reaches the brim, drains once the cover is down, and is done within its budget", () => {
    const r = show("full");
    play(r, 5);
    const at = exitOf(r);
    expect(at.brim).toBeLessThan(0.6);
    expect(at.drain).toBeGreaterThan(at.brim);
    expect(at.done).toBeGreaterThan(at.drain);
    expect(at.done).toBeLessThan(1.6);
    expect(C.level(r.s)).toBeLessThan(0.5);
    const { top } = extent(C.view(r.s));
    expect(top).toBeGreaterThan(900 - 1);
  });

  it("at the brim covers the whole screen", () => {
    const r = show("full");
    play(r, 5);
    C.exit(r.s);
    let covered = false;
    for (let i = 0; i < 60 && !covered; i++) {
      if (C.advance(r.s, 1 / 60).includes("brim")) {
        const { bottom } = extent(C.view(r.s));
        expect(bottom).toBeLessThan(0);
        expect(C.view(r.s).covered).toBe(true);
        covered = true;
      }
    }
    expect(covered).toBe(true);
  });

  it("waits for the cover to go, but not for long", () => {
    const r = show("full");
    play(r, 5);
    const at = exitOf(r, false);
    expect(at.drain - at.brim).toBeGreaterThan(0.5);
    expect(at.drain - at.brim).toBeLessThan(0.75);
    expect(at.done).toBeLessThan(2.3);
  });

  it("is quicker on a brisk load", () => {
    const r = show("brisk");
    play(r, 3, undefined, 0.45);
    const at = exitOf(r);
    expect(at.done).toBeLessThan(1.15);
  });

  it("brims and drains when the window changes size during the last gush", () => {
    const r = show("full");
    play(r, 3);
    C.exit(r.s);
    const at: Record<string, number> = {};
    for (let i = 1; i <= 240 && at.done === undefined; i++) {
      if (i === 6) C.resize(r.s, 800, 1100);
      for (const e of C.advance(r.s, 1 / 60)) {
        if (at[e] === undefined) at[e] = i / 60;
        if (e === "brim") C.go(r.s);
      }
    }
    expect(at.brim).toBeLessThan(0.9);
    expect(at.done).toBeLessThan(2.2);
    expect(C.level(r.s)).toBeLessThan(0.5);
  });

  it("from low down (a hurried load), still brims and drains", () => {
    const r = show("full");
    play(r, 0.1);
    const at = exitOf(r);
    expect(at.brim).toBeLessThan(0.9);
    expect(at.done).toBeLessThan(2.2);
  });
});

describe("bounded, finite, repeatable", () => {
  it("keeps its droplets within bounds and every number finite", () => {
    const r = show("full", 11);
    play(r, 12, (rr) => {
      const v = C.view(rr.s);
      expect(v.nDrops).toBeLessThanOrEqual(C.MAX_DROPS);
      if (Math.round(rr.t * 60) % 30 === 0) {
        expect(finite(v.surf, v.SX)).toBe(true);
        expect(finite(v.stream, v.SY * 2)).toBe(true);
        expect(finite(v.drops, v.nDrops * 4)).toBe(true);
      }
    });
  });

  it("pours the same for the same seed, and otherwise for another", () => {
    const a = show("full", 5);
    const b = show("full", 5);
    const c = show("full", 6);
    play(a, 2);
    play(b, 2);
    play(c, 2);
    const va = Array.from(C.view(a.s).surf);
    expect(Array.from(C.view(b.s).surf)).toEqual(va);
    expect(Array.from(C.view(c.s).surf)).not.toEqual(va);
  });

  it("pours and empties on the smallest and the largest screens", () => {
    for (const [W, H] of [
      [320, 480],
      [3840, 2160],
    ]) {
      const r = show("full", 9, W, H);
      play(r, 3);
      const v = C.view(r.s);
      expect(finite(v.surf, v.SX)).toBe(true);
      expect(finite(v.stream, v.SY * 2)).toBe(true);
      const at = exitOf(r);
      expect(at.done).toBeLessThan(2.2);
      expect(C.level(r.s)).toBeLessThan(0.5);
    }
  });

  it("keeps how full it is when the window changes size", () => {
    const r = show("full");
    play(r, 1.5);
    const share = C.level(r.s) / 900;
    C.resize(r.s, 390, 844);
    expect(C.level(r.s) / 844).toBeCloseTo(share, 2);
    play(r, 3);
    const v = C.view(r.s);
    expect(v.W).toBe(390);
    expect(finite(v.surf, v.SX)).toBe(true);
  });
});
