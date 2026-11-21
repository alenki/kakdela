import { describe, expect, it } from "vitest";
import { cutFlake, fallStep, flakeMask, flakeSvg, pieces, rasterize, release, type Fall } from "./flake";
import { FLAKES } from "@/content/season";

// The cutter's own grid; the site's flakes are checked again at twice it.
const N = 140;

describe("the snowflake cutter", () => {
  it("cuts the same flake from the same seed, and different ones from others", () => {
    expect(flakeSvg(cutFlake("a"))).toBe(flakeSvg(cutFlake("a")));
    const svgs = new Set(Array.from({ length: 40 }, (_, k) => flakeSvg(cutFlake(`s${k}`))));
    expect(svgs.size).toBe(40);
  });

  it("unfolds into one piece of paper with six-fold symmetry", { timeout: 60_000 }, () => {
    for (let k = 0; k < 90; k++) {
      const seed = `seed-${k}`;
      const grid = rasterize(cutFlake(seed), N);
      const paper = grid.filter(Boolean).length;
      // Lacy: some paper, a lot of air.
      expect([seed, paper / (N * N) > 0.04 && paper / (N * N) < 0.6]).toEqual([seed, true]);
      expect([seed, pieces(grid, N)]).toEqual([seed, 1]);
      // Mirrored across the arm through the middle row: the grid is its own reflection.
      let off = 0;
      for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) if (grid[j * N + i] !== grid[(N - 1 - j) * N + i]) off++;
      expect([seed, off / paper < 0.02]).toEqual([seed, true]);
    }
  });

  it("cuts the site's own flakes clean at twice the cutter's grid", { timeout: 60_000 }, () => {
    const fine = 280;
    for (const seed of Object.values(FLAKES)) {
      expect([seed, pieces(rasterize(cutFlake(seed), fine), fine, 8)]).toEqual([seed, 1]);
    }
  });

  it("is a small, self-contained image", () => {
    const mask = flakeMask("hero-a");
    expect(mask.startsWith('url("data:image/svg+xml,')).toBe(true);
    expect(mask.length).toBeLessThan(5200);
    expect(flakeSvg(cutFlake("x"))).not.toMatch(/https?:\/\/(?!www\.w3\.org)/);
  });
});

describe("a peeled snowflake's fall", () => {
  const drop = (seed: number, seconds = 4) => {
    const s: Fall = release(0, 0, seed);
    const path: Fall[] = [];
    for (let t = 0; t < seconds; t += 0.0005) {
      fallStep(s, 0.0005);
      if (Math.round(t / 0.0005) % 40 === 0) path.push({ ...s });
    }
    return { s, path };
  };

  it("falls at a paper's pace and never runs away", () => {
    for (let seed = 1; seed <= 12; seed++) {
      const { s, path } = drop(seed);
      for (const p of path) expect(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.th)).toBe(true);
      // Some metres in four seconds, as paper drops: not a stone (that would be 78 m).
      expect(s.y).toBeGreaterThan(0.6);
      expect(s.y).toBeLessThan(6);
      // A paper's terminal speeds: well under a few metres a second.
      expect(Math.max(...path.map((p) => Math.hypot(p.vx, p.vy)))).toBeLessThan(4);
    }
  });

  it("flutters: it glides one way, then the other", () => {
    let fluttered = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const { path } = drop(seed);
      // Count the turns of its sideways glide after the first half second.
      let turns = 0;
      for (let k = 2; k < path.length; k++) {
        if (path[k].y < 0.15) continue;
        if (Math.sign(path[k].vx) !== Math.sign(path[k - 1].vx) && Math.abs(path[k].vx) > 0.02) turns++;
      }
      if (turns >= 2) fluttered++;
    }
    expect(fluttered).toBeGreaterThanOrEqual(8);
  });
});
