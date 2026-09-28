import { describe, expect, it } from "vitest";
import { CUP_ROCK, holdRock, placeRock, rock, rockPose, stepRock } from "./rock";

const D = Math.PI / 180;

/** Let the cup go from `deg` and play it at 60 frames a second: the peak of every rock, and when it sat. */
function release(deg: number, seconds = 3) {
  const s = rock();
  holdRock(s, deg * D);
  placeRock(s, deg * D);
  holdRock(s, null);
  const peaks: number[] = [];
  let prev = s.angle;
  let rising = false;
  let sat = -1;
  for (let f = 1; f <= seconds * 60; f++) {
    stepRock(s, 1 / 60);
    const a = Math.abs(s.angle);
    if (Math.sign(s.angle) !== Math.sign(prev)) rising = true;
    else if (rising && a < Math.abs(prev)) {
      peaks.push(prev / D);
      rising = false;
    }
    prev = s.angle;
    if (s.still && sat < 0) sat = f / 60;
  }
  return { peaks, sat, s };
}

describe("coffee: the cup rocks on its base", () => {
  it("falls back from a tilt and rocks rim to rim, each rock smaller, until it sits", () => {
    const { peaks, sat, s } = release(3.2);
    expect(peaks.length).toBeGreaterThanOrEqual(2);
    // Rim to rim: the rocks alternate sides, and each is smaller than the one before.
    for (let i = 1; i < peaks.length; i++) {
      expect(Math.sign(peaks[i])).toBe(-Math.sign(peaks[i - 1]));
      expect(Math.abs(peaks[i])).toBeLessThan(Math.abs(peaks[i - 1]));
    }
    expect(Math.abs(peaks[0])).toBeLessThan(3.2);
    // It sits, upright and still, in well under a second and a half.
    expect(sat).toBeGreaterThan(0.2);
    expect(sat).toBeLessThan(1.5);
    expect(s.angle).toBe(0);
    expect(s.speed).toBe(0);
  });

  it("rocks quicker as it settles, as a real cup does", () => {
    const s = rock();
    holdRock(s, 3 * D);
    placeRock(s, 3 * D);
    holdRock(s, null);
    const clacks: number[] = [];
    let prev = s.angle;
    for (let f = 1; f <= 240 && !s.still; f++) {
      stepRock(s, 1 / 240);
      if (prev !== 0 && Math.sign(s.angle) !== Math.sign(prev)) clacks.push(f / 240);
      prev = s.angle;
    }
    expect(clacks.length).toBeGreaterThanOrEqual(3);
    const gaps = clacks.slice(1).map((t, i) => t - clacks[i]);
    for (let i = 1; i < gaps.length; i++) expect(gaps[i]).toBeLessThan(gaps[i - 1]);
  });

  it("stays where a hand holds it, and a cup at rest stays at rest", () => {
    const s = rock();
    holdRock(s, 1.5 * D);
    for (let f = 0; f < 90; f++) stepRock(s, 1 / 60);
    expect(s.angle / D).toBeCloseTo(1.5, 3);
    expect(s.still).toBe(true);

    const idle = rock();
    stepRock(idle, 1);
    expect(idle).toEqual(rock());
  });

  it("never tips over, however hard it is held", () => {
    const s = rock();
    holdRock(s, 60 * D);
    for (let f = 0; f < 120; f++) stepRock(s, 1 / 60);
    expect(s.angle).toBeLessThan(CUP_ROCK.alpha);
  });

  it("turns about the rim it stands on, so that rim never moves", () => {
    const b = 90;
    for (const deg of [2.5, -2.5, 0.4, -7]) {
      const a = deg * D;
      const p = rockPose(a, b);
      // The rim under the tilt, relative to the base's centre: (±b, 0), turned by `a` and moved by (x, y).
      const rim = Math.sign(a) * b;
      const x = p.x + rim * Math.cos(a);
      const y = p.y + rim * Math.sin(a);
      expect(x).toBeCloseTo(rim, 6);
      expect(y).toBeCloseTo(0, 6);
      // The other rim lifts off the counter.
      expect(p.y - rim * Math.sin(a)).toBeLessThan(0);
    }
    expect(rockPose(0, b)).toEqual({ x: 0, y: 0, rotate: 0 });
  });
});
