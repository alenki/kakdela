import { describe, expect, it } from "vitest";
import { area, brimVol, chord, levelOf, pour, pourClip, pourTo, resizePour, sampleSurface, settlePour, stepPour, surfaceBuffer, type Pour } from "./pour";
import { mulberry32 } from "./seed";

/** The hero's «Где ближайшая»: 206 × 48. */
const W = 206;
const H = 48;

/** Play `seconds` at `fps`; returns the level every frame. */
function play(p: Pour, seconds: number, fps = 60) {
  const levels: number[] = [];
  for (let f = 0; f < Math.round(seconds * fps); f++) {
    stepPour(p, 1 / fps);
    levels.push(levelOf(p, p.vol));
  }
  return levels;
}

/** Play exactly `seconds` at `fps`, the last frame cut short to land on it. */
function playTo(p: Pour, seconds: number, fps: number) {
  const whole = Math.floor(seconds * fps + 1e-9);
  for (let f = 0; f < whole; f++) stepPour(p, 1 / fps);
  const rest = seconds - whole / fps;
  if (rest > 1e-9) stepPour(p, rest);
}

/** Seconds until the pour rests (Infinity if it doesn't within `max`). */
function untilStill(p: Pour, max = 3) {
  for (let f = 1; f <= max * 60; f++) {
    stepPour(p, 1 / 60);
    if (p.still) return f / 60;
  }
  return Infinity;
}

/** Seconds until the pill reads brim-full (Infinity if it doesn't within `max`). */
function untilCovered(p: Pour, max = 1.5) {
  for (let f = 1; f <= max * 60; f++) {
    stepPour(p, 1 / 60);
    if (pourClip(p) === "full") return f / 60;
  }
  return Infinity;
}

/** The surface's highest and lowest point off its mean level, px (meniscus included). */
function spread(p: Pour) {
  const s = sampleSurface(p, surfaceBuffer());
  const level = p.h - levelOf(p, p.vol);
  let lo = Infinity;
  let hi = -Infinity;
  for (let i = 0; i <= s.count; i++) {
    lo = Math.min(lo, s.ys[i] - level);
    hi = Math.max(hi, s.ys[i] - level);
  }
  return { lo, hi };
}

/** The pill's inside at x, y down: its top and its bottom. */
function outline(p: Pour, x: number) {
  const r = Math.min(p.w, p.h) / 2;
  const cx = Math.min(p.w - r, Math.max(r, x));
  const half = Math.sqrt(Math.max(0, r * r - (x - cx) ** 2));
  return [p.h / 2 - half, p.h / 2 + half];
}

/** What shows of the surface: the most it stands off its level, and its steepest face, where it is
    inside the pill (the rest is cut away by the pill's outline). */
function visible(p: Pour) {
  const s = sampleSurface(p, surfaceBuffer());
  const level = p.h - levelOf(p, p.vol);
  const seen = (i: number) => {
    const [top, bottom] = outline(p, Math.min(p.w, Math.max(0, s.xs[i])));
    return s.ys[i] > top + 0.5 && s.ys[i] < bottom - 0.5;
  };
  let swing = 0;
  let slope = 0;
  for (let i = 0; i <= s.count; i++) {
    if (!seen(i)) continue;
    swing = Math.max(swing, Math.abs(s.ys[i] - level));
    if (i > 0 && seen(i - 1)) slope = Math.max(slope, Math.abs(s.ys[i] - s.ys[i - 1]) / (s.xs[i] - s.xs[i - 1]));
  }
  return { swing, slope };
}

/** The surface off its own mean, sampled: for comparing two pours' shapes. */
function shape(p: Pour) {
  const s = sampleSurface(p, surfaceBuffer());
  const ys = Array.from(s.ys.subarray(0, s.count + 1));
  const mean = ys.reduce((a, b) => a + b, 0) / ys.length;
  return ys.map((y) => y - mean);
}
const apart = (a: number[], b: number[]) => Math.sqrt(a.reduce((sum, y, i) => sum + (y - b[i]) ** 2, 0) / a.length);

describe("pour: the pill's cross-section", () => {
  const p = pour(W, H);
  it("is as wide as the straight middle at the floor and the rim, and the whole pill across the middle", () => {
    expect(chord(p, 0)).toBeCloseTo(W - H, 6);
    expect(chord(p, H)).toBeCloseTo(W - H, 6);
    expect(chord(p, H / 2)).toBeCloseTo(W, 6);
  });
  it("holds a rectangle plus a circle when brim-full", () => {
    expect(brimVol(p)).toBeCloseTo((W - H) * H + Math.PI * (H / 2) ** 2, 6);
  });
  it("turns a volume into a level and back", () => {
    for (const share of [0.01, 0.1, 0.33, 0.5, 0.77, 0.99]) {
      const v = share * brimVol(p);
      expect(area(p, levelOf(p, v))).toBeCloseTo(v, 2);
    }
    expect(levelOf(p, brimVol(p) / 2)).toBeCloseTo(H / 2, 3);
  });
  it("climbs quicker through the round ends than across the middle at a steady flow", () => {
    const step = brimVol(p) * 0.05;
    const low = levelOf(p, step);
    const mid = levelOf(p, brimVol(p) / 2 + step) - levelOf(p, brimVol(p) / 2);
    expect(low).toBeGreaterThan(mid);
  });
});

describe("pour: filling and draining", () => {
  it("shows liquid within a few frames of a hover", () => {
    const p = pour(W, H);
    pourTo(p, true, 8);
    play(p, 0.1);
    expect(pourClip(p)).toMatch(/^path\("M/);
  });

  it("fills in about half a second and rests the frame it reads brim-full, drawing nothing", () => {
    const p = pour(W, H);
    pourTo(p, true, 8);
    const covered = untilCovered(p);
    expect(covered).toBeGreaterThan(0.45);
    expect(covered).toBeLessThan(0.6);
    expect(p.still).toBe(true);
    expect(pourClip(p)).toBe("full");
  });

  it("never lets the air back in once it reads brim-full, nor liquid once it reads empty", () => {
    for (const [w, h] of [[48, 48], [60, 48], [85, 48], [120, 48], [W, 48], [85, 56], [150, 64]]) {
      for (let seed = 1; seed <= 12; seed++) {
        for (const full of [true, false]) {
          const p = pour(w, h, seed);
          if (!full) settlePour(p, true);
          pourTo(p, full, seed % 2 ? 0 : w);
          let done = false;
          for (let f = 0; f < 90; f++) {
            stepPour(p, 1 / 60);
            const clip = pourClip(p);
            if (done) expect(clip).toBe(full ? "full" : "empty");
            if (clip === (full ? "full" : "empty")) done = true;
          }
          expect(done).toBe(true);
        }
      }
    }
  });

  it("fills within 0.6s on every pill, wherever the pointer comes in", () => {
    for (const w of [85, 150, W, 300]) {
      for (let seed = 1; seed <= 8; seed++) {
        for (const x of [4, w / 4, w / 2, (3 * w) / 4, w - 4]) {
          const p = pour(w, H, seed);
          pourTo(p, true, x);
          expect(untilCovered(p)).toBeLessThan(0.6);
        }
      }
    }
  });

  it("drains quicker than it fills and rests empty", () => {
    const p = pour(W, H);
    settlePour(p, true);
    pourTo(p, false, W - 6);
    expect(untilStill(p)).toBeLessThan(0.52);
    expect(pourClip(p)).toBe("empty");
  });

  it("turns over smoothly when the pointer leaves halfway", () => {
    const p = pour(W, H);
    pourTo(p, true, 120);
    const before = play(p, 0.2);
    pourTo(p, false, W);
    const after = play(p, 0.8);
    const all = [...before, ...after];
    // Frame to frame, while any of it is in sight (past the floor it rests at once, unseen).
    for (let i = 1; i < all.length; i++) if (all[i] > 0) expect(Math.abs(all[i] - all[i - 1])).toBeLessThan(3);
    // It keeps rising for a moment (the valve), then falls.
    expect(Math.max(...after.slice(0, 8))).toBeGreaterThanOrEqual(before[before.length - 1]);
    expect(after[after.length - 1]).toBeLessThanOrEqual(0);
    expect(p.still).toBe(true);
  });

  it("rests as soon as the surface is out of sight, and shows the drain at once after", () => {
    const p = pour(W, H);
    pourTo(p, true, 20);
    let f = 0;
    while (!p.still && f++ < 120) stepPour(p, 1 / 60);
    expect(f / 60).toBeLessThan(0.7);
    pourTo(p, false, 180);
    play(p, 3 / 60);
    expect(pourClip(p)).toMatch(/^path/);
  });

  it("turns back from past the rim without waiting out the stretch no one sees", () => {
    const p = pour(W, H);
    pourTo(p, true, 20);
    while (pourClip(p) !== "full") stepPour(p, 1 / 60);
    pourTo(p, false, 180);
    let f = 0;
    while (pourClip(p) === "full" && f++ < 60) stepPour(p, 1 / 60);
    expect(f).toBeLessThanOrEqual(6);
  });

  it("reads the same at any frame rate, steady or ragged", () => {
    const rnd = mulberry32(3);
    for (const seed of [1, 2, 3]) {
      for (const t of [0.25, 0.4]) {
        // 60fps runs the reference's own 1/240s substeps; these rates don't.
        const ref = pour(W, H, seed);
        pourTo(ref, true, 30);
        playTo(ref, t, 240);
        const want = sampleSurface(ref, surfaceBuffer());
        const check = (p: Pour) => {
          expect(levelOf(p, p.vol)).toBeCloseTo(levelOf(ref, ref.vol), 0);
          const got = sampleSurface(p, surfaceBuffer());
          for (let i = 0; i <= got.count; i++) expect(Math.abs(got.ys[i] - want.ys[i])).toBeLessThan(1);
        };
        for (const fps of [75, 144, 165]) {
          const p = pour(W, H, seed);
          pourTo(p, true, 30);
          playTo(p, t, fps);
          check(p);
        }
        // Frames anywhere from 1/165 to 1/40 of a second apart.
        const p = pour(W, H, seed);
        pourTo(p, true, 30);
        let left = t;
        while (left > 1e-9) {
          const dt = Math.min(left, 1 / 165 + rnd() * (1 / 40 - 1 / 165));
          stepPour(p, dt);
          left -= dt;
        }
        check(p);
      }
    }
  });

  it("pours near the end wall on the pointer's side: the liquid stands higher there", () => {
    for (const [x, side] of [[20, 0.15], [W - 20, 0.85], [W / 2 + 10, 0.85]] as const) {
      const p = pour(W, H);
      pourTo(p, true, x);
      play(p, 0.15);
      const s = sampleSurface(p, surfaceBuffer());
      const near = s.ys[Math.round(s.count * side)];
      const far = s.ys[Math.round(s.count * (1 - side))];
      expect(near).toBeLessThan(far);
    }
  });

  it("reaches the label (the middle) within a fifth of a second", () => {
    const p = pour(W, H);
    pourTo(p, true, 8);
    play(p, 0.2);
    expect(levelOf(p, p.vol)).toBeGreaterThan(H / 2 - 6);
  });

  it("runs a sheet across the bare floor: early on, the far half has liquid before the level could", () => {
    const p = pour(W, H);
    pourTo(p, true, 8);
    play(p, 0.1);
    const s = sampleSurface(p, surfaceBuffer());
    const level = levelOf(p, p.vol);
    // Well out from the stream, the sheet's head stands over the mean level.
    let most = 0;
    for (let i = 0; i <= s.count; i++) if (s.xs[i] > W * 0.3 && s.xs[i] < W * 0.7) most = Math.max(most, H - s.ys[i]);
    expect(most).toBeGreaterThan(level + 3);
  });

  it("is livelier than a gentle pour, and no stormier on a wide pill than a narrow one", () => {
    const peak = (w: number) => {
      const p = pour(w, H);
      pourTo(p, true, 6);
      let most = 0;
      for (let f = 0; f < 45 && !p.still; f++) {
        stepPour(p, 1 / 60);
        const { lo, hi } = spread(p);
        most = Math.max(most, -lo, hi);
      }
      return most;
    };
    const narrow = peak(150);
    const wide = peak(300);
    expect(narrow).toBeGreaterThan(12);
    expect(wide).toBeLessThan(narrow * 1.5);
    expect(wide).toBeLessThan(22);
  });

  it("keeps what shows in bounds and always comes to rest, however the pointer darts about", () => {
    const rnd = mulberry32(7);
    for (let run = 0; run < 12; run++) {
      const p = pour(W, H, run + 1);
      for (let f = 0; f < 240; f++) {
        if (rnd() < 0.05) pourTo(p, rnd() < 0.5, rnd() * W);
        stepPour(p, 1 / 60);
        for (let n = 1; n < p.amp.length; n++) expect(Number.isFinite(p.amp[n])).toBe(true);
        const level = levelOf(p, p.vol);
        if (level > 4 && level < H - 4) {
          const { swing, slope } = visible(p);
          expect(swing).toBeLessThan(H / 2);
          expect(slope).toBeLessThan(1.3);
        }
      }
      expect(untilStill(p)).toBeLessThan(2);
    }
  });

  it("never jumps or stands a face too steep, on any size of pill", () => {
    for (const [w, h] of [[48, 48], [85, 48], [150, 48], [W, 48], [300, 48], [600, 48], [W, 36]]) {
      for (let seed = 1; seed <= 6; seed++) {
        const p = pour(w, h, seed);
        pourTo(p, true, seed % 2 ? 0 : w);
        let last = levelOf(p, p.vol);
        for (let f = 0; f < 60 && !p.still; f++) {
          stepPour(p, 1 / 60);
          const level = levelOf(p, p.vol);
          if (level > 0 && level < h) expect(Math.abs(level - last)).toBeLessThan(3.2);
          last = level;
          if (p.still) break;
          expect(visible(p).slope).toBeLessThan(1.3);
        }
      }
    }
  });

  it("follows the surface into the round ends, climbing the wall there but never falling away from it", () => {
    // A narrow pill (the runner's «Пауза») near the rim, where the waterline is shortest.
    const p = pour(85, H);
    pourTo(p, true, 0);
    let checked = 0;
    for (let f = 0; f < 60 && !p.still; f++) {
      stepPour(p, 1 / 60);
      const level = levelOf(p, p.vol);
      if (level < 2 || level > H - 2) continue;
      const half = chord(p, level) / 2;
      const s = sampleSurface(p, surfaceBuffer());
      // Outward from each end of the waterline the surface holds its height or climbs the wall (y down):
      // falling away there would stand liquid next to air.
      const x = (i: number) => -1 + (i / s.count) * (p.w + 2);
      for (let i = 0; i < s.count; i++) {
        if (x(i + 1) < p.w / 2 - half - 0.5) {
          expect(s.ys[i]).toBeLessThanOrEqual(s.ys[i + 1] + 0.01);
          checked++;
        }
      }
      for (let i = 1; i <= s.count; i++) {
        if (x(i - 1) > p.w / 2 + half + 0.5) expect(s.ys[i]).toBeLessThanOrEqual(s.ys[i - 1] + 0.01);
      }
    }
    expect(checked).toBeGreaterThan(5);
  });

  it("keeps how full it is when the pill changes size", () => {
    const p = pour(W, H);
    pourTo(p, true, 20);
    play(p, 0.3);
    const share = p.vol / brimVol(p);
    resizePour(p, 240, H);
    expect(p.vol / brimVol(p)).toBeCloseTo(share, 6);
  });

  it("draws a closed path in the pill's box", () => {
    const p = pour(W, H);
    pourTo(p, true, 100);
    play(p, 0.3);
    const clip = pourClip(p);
    expect(clip).toMatch(/^path\("M-8 56L-8 [-\d. QL]+Z"\)$/);
  });
});

describe("pour: no two alike", () => {
  it("replays the same pour from the same seed", () => {
    const a = pour(W, H, 42);
    const b = pour(W, H, 42);
    for (const p of [a, b]) {
      pourTo(p, true, 10);
      play(p, 0.3);
      pourTo(p, false, W);
      play(p, 0.1);
    }
    expect(pourClip(a)).toBe(pourClip(b));
  });

  it("pours differently for every seed, neighbouring seeds too", () => {
    const shapes = [1, 2, 3, 4, 5, 6].map((seed) => {
      const p = pour(W, H, seed);
      pourTo(p, true, 8);
      play(p, 0.3);
      return shape(p);
    });
    for (let a = 0; a < shapes.length; a++) for (let b = a + 1; b < shapes.length; b++) expect(apart(shapes[a], shapes[b])).toBeGreaterThan(1);
  });

  it("drains differently every time too", () => {
    // Its first tenth of a second: after that the outlet's pull has its way with every drain alike.
    const shapes = [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => {
      const p = pour(W, H, seed);
      settlePour(p, true);
      pourTo(p, false, W - 6);
      play(p, 0.1);
      return shape(p);
    });
    let total = 0;
    let pairs = 0;
    for (let a = 0; a < shapes.length; a++) {
      for (let b = a + 1; b < shapes.length; b++) {
        expect(apart(shapes[a], shapes[b])).toBeGreaterThan(0.1);
        total += apart(shapes[a], shapes[b]);
        pairs++;
      }
    }
    expect(total / pairs).toBeGreaterThan(1);
  });

  it("pours differently on the next hover of the same pill", () => {
    const p = pour(W, H);
    const hovers: number[][] = [];
    for (let visit = 0; visit < 3; visit++) {
      pourTo(p, true, 8);
      play(p, 0.3);
      hovers.push(shape(p));
      pourTo(p, false, 8);
      untilStill(p);
    }
    expect(apart(hovers[0], hovers[1])).toBeGreaterThan(1);
    expect(apart(hovers[1], hovers[2])).toBeGreaterThan(1);
  });

  it("sets a fresh sheet off from the other wall when the stream moves there mid-pour", () => {
    const p = pour(W, H);
    pourTo(p, true, 10);
    play(p, 0.2);
    expect(p.sheet).toBeGreaterThan(0.15);
    pourTo(p, true, W - 10);
    expect(p.sheet).toBe(0);
    expect(p.inlet).toBeGreaterThan(W / 2);
  });

  it("lands the stream further in, the further in the pointer came", () => {
    const edge = pour(W, H, 3);
    const inner = pour(W, H, 3);
    pourTo(edge, true, 0);
    pourTo(inner, true, 60);
    expect(inner.inlet).toBeGreaterThan(edge.inlet);
    expect(inner.inlet).toBeLessThan(W / 2);
  });
});
