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

/** Seconds until the pour rests (Infinity if it doesn't within `max`). */
function untilStill(p: Pour, max = 3) {
  for (let f = 1; f <= max * 60; f++) {
    stepPour(p, 1 / 60);
    if (p.still) return f / 60;
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

  it("fills in about 0.7s and then rests brim-full, drawing nothing", () => {
    const p = pour(W, H);
    pourTo(p, true, 8);
    let covered = Infinity;
    for (let f = 1; f <= 90; f++) {
      stepPour(p, 1 / 60);
      if (pourClip(p) === "full") {
        covered = f / 60;
        break;
      }
    }
    expect(covered).toBeGreaterThan(0.5);
    expect(covered).toBeLessThan(0.9);
    expect(untilStill(p)).toBeLessThan(0.3);
    expect(pourClip(p)).toBe("full");
  });

  it("drains quicker than it fills and rests empty", () => {
    const p = pour(W, H);
    settlePour(p, true);
    pourTo(p, false, W - 6);
    expect(untilStill(p)).toBeLessThan(0.6);
    expect(pourClip(p)).toBe("empty");
  });

  it("turns over smoothly when the pointer leaves halfway", () => {
    const p = pour(W, H);
    pourTo(p, true, 120);
    const before = play(p, 0.3);
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
    expect(f / 60).toBeLessThan(0.9);
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

  it("reads the same at 60 and 144 frames a second", () => {
    const a = pour(W, H);
    const b = pour(W, H);
    pourTo(a, true, 30);
    pourTo(b, true, 30);
    play(a, 0.4, 60);
    play(b, 0.4, 144);
    expect(levelOf(a, a.vol)).toBeCloseTo(levelOf(b, b.vol), 0);
    expect(Math.abs(spread(a).lo - spread(b).lo)).toBeLessThan(0.5);
  });

  it("pours down the end wall on the pointer's side: the liquid stands higher there", () => {
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

  it("reaches the label (the middle) within a quarter second", () => {
    const p = pour(W, H);
    pourTo(p, true, 8);
    play(p, 0.25);
    expect(levelOf(p, p.vol)).toBeGreaterThan(H / 2 - 6);
  });

  it("keeps the same gentle surface on a wide pill", () => {
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
    expect(wide).toBeLessThan(narrow * 1.5);
    expect(wide).toBeLessThan(12);
  });

  it("keeps a gentle surface and always comes to rest, however the pointer darts about", () => {
    const rnd = mulberry32(7);
    for (let run = 0; run < 12; run++) {
      const p = pour(W, H);
      for (let f = 0; f < 240; f++) {
        if (rnd() < 0.05) pourTo(p, rnd() < 0.5, rnd() * W);
        stepPour(p, 1 / 60);
        for (let n = 1; n < p.amp.length; n++) expect(Number.isFinite(p.amp[n])).toBe(true);
        const level = levelOf(p, p.vol);
        if (level > 4 && level < H - 4) {
          const { lo, hi } = spread(p);
          expect(Math.max(-lo, hi)).toBeLessThan(H / 3);
        }
      }
      expect(untilStill(p)).toBeLessThan(2);
    }
  });

  it("carries the surface on flat into the round ends, never standing liquid next to air there", () => {
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
      const ends: [number[], number[]] = [[], []];
      for (let i = 0; i <= s.count; i++) {
        const x = -1 + (i / s.count) * (p.w + 2);
        if (Math.abs(x - p.w / 2) > half + 0.5) ends[x < p.w / 2 ? 0 : 1].push(s.ys[i]);
      }
      for (const end of ends) {
        if (end.length < 2) continue;
        checked++;
        expect(Math.max(...end) - Math.min(...end)).toBeLessThan(0.01);
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
