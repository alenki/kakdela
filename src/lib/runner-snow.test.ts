import { describe, expect, it } from "vitest";
import { capOf, dusting, floorDepth, flyPuffs, GSNOW, kickUp, makeGameSnow, stepGameSnow, topAt, type SnowCup, type SnowObstacle } from "./runner-snow";

const W = 640, H = 217;
const still: SnowCup = { x: 60, y: 0, grounded: true, ducking: false, crashed: false, speed: 0 };

/** Runs the snow `seconds` at 60 fps, the floor travelling at `speed` u/s. Returns the final offset. */
function run(s: ReturnType<typeof makeGameSnow>, seconds: number, speed: number, cup: (t: number) => SnowCup, obstacles: (t: number) => SnowObstacle[] = () => [], from = 0) {
  let off = from;
  for (let t = 0; t < seconds; t += 1 / 60) {
    off += speed / 60;
    stepGameSnow(s, 1 / 60, off, W, H, cup(t), obstacles(t));
  }
  return off;
}

describe("snow in the runner's world", () => {
  it("lies on the floor in smooth drifts, the same wherever the floor comes round", () => {
    for (let x = 0; x < 3000; x += 7) {
      expect(dusting(x)).toBeGreaterThan(1.6);
      expect(dusting(x)).toBeLessThan(3.6);
      expect(Math.abs(dusting(x + 1) - dusting(x))).toBeLessThan(0.2);
    }
    const s = makeGameSnow(1, W, H);
    expect(floorDepth(s, 123.4)).toBeCloseTo(dusting(123.4), 9);
  });

  it("builds up where it lands", () => {
    const s = makeGameSnow(2, W, H);
    // The cup far off to the left, so its feet don't pack the floor under test.
    const away: SnowCup = { ...still, grounded: false, y: 50 };
    run(s, 40, 0, () => away);
    let more = 0;
    for (let x = 100; x < 600; x += 2) if (floorDepth(s, x) > dusting(x) + 0.01) more++;
    expect(more).toBeGreaterThan(30);
    for (let x = 0; x < W; x += 1) expect(floorDepth(s, x)).toBeLessThanOrEqual(GSNOW.deep);
  });

  it("takes the cup's track behind it, and none where it was in the air", () => {
    // The cup runs at x 60 of the window: its track is the floor between its feet and the window's left edge.
    // (A little of the snow its feet kick up lands back on it.)
    const packed = (s: ReturnType<typeof makeGameSnow>, x: number) => floorDepth(s, x) <= GSNOW.packed * dusting(x) + 0.1;
    const ran = makeGameSnow(3, W, H);
    const off = run(ran, 1, 330, () => ({ ...still, speed: 330 }));
    for (const wx of [20, 40, 70]) expect([wx, packed(ran, off + wx)]).toEqual([wx, true]);
    // Ahead of the cup the floor is as it fell.
    for (const wx of [150, 300, 500]) expect([wx, packed(ran, off + wx)]).toEqual([wx, false]);
    const flew = makeGameSnow(3, W, H);
    const off2 = run(flew, 1, 330, () => ({ ...still, speed: 330, grounded: false, y: 30 }));
    for (const wx of [20, 40, 70]) expect([wx, packed(flew, off2 + wx)]).toEqual([wx, false]);
  });

  it("streams back past the cup as fast as the floor at the play's depth, slower behind it", () => {
    const s = makeGameSnow(4, W, H);
    const near = { x: 400, y: 150, z: 1, r: 1, ph: 0, w: 0 };
    const far = { x: 400, y: 150, z: 0.3, r: 1, ph: 0, w: 0 };
    s.flakes = [near, far];
    stepGameSnow(s, 1 / 60, 10, W, H, { ...still, grounded: false, y: 40 }, []);
    // The floor moved 10 u: the near flake 10 back (give or take its sway), the far one a good deal less.
    expect(400 - near.x).toBeGreaterThan(9);
    expect(400 - near.x).toBeLessThan(11);
    expect(400 - far.x).toBeLessThan(6);
  });

  it("caps the stools and the stacks, and lets the caps grow to their depth", () => {
    const s = makeGameSnow(5, W, H);
    const stool: SnowObstacle = { id: 7, kind: "stool", x: 300, y: 0, h: 40 };
    const tab: SnowObstacle = { id: 8, kind: "tab", x: 200, y: 28, h: 14 };
    const c0 = capOf(s, stool);
    expect(c0).toBeGreaterThanOrEqual(GSNOW.capFrom);
    expect(c0).toBeLessThanOrEqual(GSNOW.capTo);
    expect(capOf(s, tab)).toBe(0);
    expect(topAt(stool, 310)).toBe(39);
    expect(topAt(stool, 280)).toBeNull();
    // Flakes at the play's depth right over the seat come down on it.
    for (let k = 0; k < 400; k++) {
      s.flakes = [{ x: 305 + (k % 18), y: 39.4 + (s.caps.get(7) ?? c0), z: 1, r: 1, ph: 0, w: 0 }];
      stepGameSnow(s, 1 / 60, 0, W, H, { ...still, grounded: false, y: 50 }, [stool]);
    }
    expect(s.caps.get(7)!).toBeGreaterThan(c0);
    expect(s.caps.get(7)!).toBeLessThanOrEqual(GSNOW.capMax);
  });

  it("throws snow up that falls back and settles", () => {
    const s = makeGameSnow(6, W, H);
    kickUp(s, 75, 1, 30, 150, 0.2);
    expect(s.puffs).toHaveLength(30);
    flyPuffs(s, 0.1, 0);
    for (const p of s.puffs) expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
    for (let k = 0; k < 120 && s.puffs.length; k++) flyPuffs(s, 1 / 60, 0);
    expect(s.puffs).toHaveLength(0);
  });

  it("forgets the floor it has left behind", () => {
    const s = makeGameSnow(7, W, H);
    run(s, 30, 600, () => ({ ...still, speed: 600 }));
    // Some thirty screens of floor run past: only the floor near the window is still kept.
    expect(s.floor.size).toBeLessThan(((W + 160) / GSNOW.cell) * 1.2);
  });
});
