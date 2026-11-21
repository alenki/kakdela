import { describe, expect, it } from "vitest";
import { airAt, fall, flakesFor, land, makeDrift, snowedOn, spawn, SNOW, type Flake } from "./snow";
import { mulberry32 } from "./seed";

describe("the air", () => {
  it("swirls without bunching the snow: its eddies are divergence-free", () => {
    const e = 0.5;
    for (let k = 0; k < 200; k++) {
      const x = (k * 137) % 1900, y = (k * 311) % 1100, t = k * 0.7;
      const div = (airAt(x + e, y, t)[0] - airAt(x - e, y, t)[0]) / (2 * e) + (airAt(x, y + e, t)[1] - airAt(x, y - e, t)[1]) / (2 * e);
      // Zero but for the finite difference's own error (speeds here are tens of px/s).
      expect(Math.abs(div)).toBeLessThan(1e-4);
    }
  });

  it("blows gently: a breeze, never a gale", () => {
    let top = 0;
    for (let k = 0; k < 2000; k++) {
      const [u, v] = airAt((k * 53) % 2560, (k * 97) % 1440, k * 0.13);
      top = Math.max(top, Math.hypot(u, v));
    }
    expect(top).toBeLessThan(90);
    expect(top).toBeGreaterThan(15);
  });
});

describe("the snowfall", () => {
  const run = (seconds: number, air: { scroll?: number; hand?: { x: number; y: number; vx: number; vy: number } | null } = {}) => {
    const rnd = mulberry32(3);
    const w = 1440, h = 900;
    const flakes: Flake[] = Array.from({ length: flakesFor(w, h) }, () => spawn(rnd, w, h));
    for (let t = 0; t < seconds; t += 1 / 60) fall(flakes, 1 / 60, w, h, { t, scroll: air.scroll ?? 0, hand: air.hand ?? null }, rnd);
    return flakes;
  };

  it("keeps as many flakes on the screen as it should, falling at snow's pace", () => {
    expect(flakesFor(1440, 900)).toBe(Math.round((1440 * 900) / 7600));
    expect(flakesFor(4000, 3000)).toBe(SNOW.max);
    const flakes = run(30);
    for (const f of flakes) {
      expect(Number.isFinite(f.x) && Number.isFinite(f.y)).toBe(true);
      expect(f.y).toBeGreaterThan(-170);
      expect(f.y).toBeLessThan(900 + 13);
      expect(f.vy).toBeGreaterThan(-60);
      expect(f.vy).toBeLessThan(220);
    }
  });

  it("is carried by a scrolling page, the far flakes most", () => {
    const rnd = mulberry32(5);
    const far = { ...spawn(rnd, 1440, 900), z: 0, x: 500, y: 450 };
    const near = { ...spawn(rnd, 1440, 900), z: 1, x: 500, y: 450 };
    for (let t = 0; t < 0.6; t += 1 / 60) fall([far, near], 1 / 60, 1440, 900, { t, scroll: 1200, hand: null }, rnd);
    // Going down the page, the page moves up and drags the air beside it up.
    expect(far.vy).toBeLessThan(0);
    expect(near.vy).toBeGreaterThan(far.vy + 150);
  });

  it("swirls round a moving hand", () => {
    const rnd = mulberry32(9);
    const f = { ...spawn(rnd, 1440, 900), x: 700, y: 400, z: 0.5 };
    const g = { ...f };
    for (let t = 0; t < 0.3; t += 1 / 60) {
      fall([f], 1 / 60, 1440, 900, { t, scroll: 0, hand: { x: 690, y: 400, vx: 900, vy: 0 } }, rnd);
      fall([g], 1 / 60, 1440, 900, { t, scroll: 0, hand: null }, rnd);
    }
    expect(f.x - g.x).toBeGreaterThan(40);
  });
});

describe("snow that settles", () => {
  /** A bar three cells high with a narrow post on it: a letter's flat top and a thin upright. */
  const sign = () => {
    const cols = 60, rows = 30;
    const mask = new Uint8Array(cols * rows);
    for (let r = 20; r < 23; r++) for (let c = 10; c < 50; c++) mask[r * cols + c] = 1;
    for (let r = 8; r < 20; r++) for (let c = 29; c < 31; c++) mask[r * cols + c] = 1;
    return { cols, rows, mask };
  };

  it("rests on what it lands on, and falls past what isn't there", () => {
    const { cols, rows, mask } = sign();
    const d = makeDrift(mask, cols, rows);
    const rnd = mulberry32(1);
    // Onto the bar's top, left of the post.
    expect(land(d, 15, 19, rnd)).toEqual({ c: 15, r: 19 });
    // In the air, far above anything: no landing yet.
    expect(land(d, 15, 5, rnd)).toBeNull();
    // Past the bar's end: nothing under it.
    expect(land(d, 55, 19, rnd)).toBeNull();
  });

  it("never clings to a slanting stroke", () => {
    // A stroke at sixty degrees, as in К and А: a staircase of one-cell steps on the grid.
    const cols = 60, rows = 40;
    const mask = new Uint8Array(cols * rows);
    for (let r = 5; r < 38; r++) {
      const x = 10 + Math.round((r - 5) * Math.tan((30 * Math.PI) / 180));
      for (let c = x; c < x + 4; c++) mask[r * cols + c] = 1;
    }
    const d = makeDrift(mask, cols, rows, 6);
    snowedOn(d, 4000, 2);
    // No snow on its slope (below the stroke's top few rows, where it could round off a cap).
    let onSlope = 0;
    for (let r = 10; r < rows; r++) for (let c = 0; c < cols; c++) if (d.grid[r * cols + c] === 2) onSlope++;
    expect(onSlope).toBe(0);
  });

  it("never rests on a hairline", () => {
    // A thin upright, as in the wordmark's К: a column one cell wide.
    const cols = 30, rows = 30;
    const mask = new Uint8Array(cols * rows);
    for (let r = 6; r < 28; r++) mask[r * cols + 14] = 1;
    const d = makeDrift(mask, cols, rows, 6);
    snowedOn(d, 2000, 3);
    expect(d.grid.filter((v) => v === 2).length).toBe(0);
  });

  it("piles up at snow's angle of repose and stops at its depth", () => {
    const { cols, rows, mask } = sign();
    const d = makeDrift(mask, cols, rows, 6);
    const placed = snowedOn(d, 3000, 4);
    expect(placed.length).toBeGreaterThan(100);
    // Every column's surface is within one cell of its neighbours' (no towers, no cliffs: 45° at most).
    const surface = (c: number) => {
      for (let r = 0; r < rows; r++) if (d.grid[r * cols + c] !== 0) return r;
      return rows;
    };
    for (let c = 12; c < 48; c++) {
      if (c >= 27 && c <= 32) continue;
      expect(Math.abs(surface(c) - surface(c + 1))).toBeLessThanOrEqual(1);
    }
    for (let c = 0; c < cols; c++) expect(d.depth[c]).toBeLessThanOrEqual(6);
    // The narrow post's top holds hardly any: snow slides off a two-cell edge.
    expect(d.depth[29] + d.depth[30]).toBeLessThanOrEqual(4);
  });
});
