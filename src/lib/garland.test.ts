import { describe, expect, it } from "vitest";
import { advance, atRest, buildGarland, depth, knock, layoutGarland, PHYS, PITCH_M, settle, type Sim } from "./garland";
import { NOTES } from "./melody";

const hung = (width: number, gutter: number, target = 38.4) => {
  const s = buildGarland(layoutGarland(width, gutter, target));
  settle(s);
  return s;
};

/** No particle anywhere strange, and the cord no longer than it is. */
function sane(s: Sim) {
  for (let i = 0; i < s.n; i++) {
    expect(Number.isFinite(s.x[i]) && Number.isFinite(s.y[i])).toBe(true);
  }
  for (let i = 0; i < s.cord - 1; i++) {
    const d = Math.hypot(s.x[i + 1] - s.x[i], s.y[i + 1] - s.y[i]);
    expect(d).toBeLessThan(s.seg[i] * 1.03);
  }
}

describe("the garland's layout", () => {
  it("hangs as much of the song as suits the width", () => {
    const at = (w: number, g: number, rem = 16) => layoutGarland(w, g, 2.8 * rem);
    expect(at(320, 16).halves).toBe(1);
    expect(at(390, 16).halves).toBe(1);
    expect(at(768, 26).halves).toBe(1);
    expect(at(1440, 49).halves).toBe(2);
    expect(at(1920, 65, 17.33).halves).toBe(3);
    expect(at(2560, 87, 20).halves).toBe(3);
  });

  it("hangs a bulb for every note, in the song's order, evenly", () => {
    const l = layoutGarland(1440, 49, 44.8);
    expect(l.bulbs).toHaveLength(28);
    expect(l.length).toBe(28);
    expect(l.bulbs.map((b) => b.midi)).toEqual(NOTES.map((n) => n.midi));
    expect(l.bulbs.map((b) => b.t)).toEqual(NOTES.map((_, i) => i));
    expect(l.pitch * l.length).toBeCloseTo(1440 - 98, 6);
    expect(l.pxPerM).toBeCloseTo(l.pitch / PITCH_M, 9);
  });

  it("puts a nail on every bar, never where a bulb hangs", () => {
    for (const [w, g] of [[390, 16], [1024, 35], [1440, 49], [2560, 87]]) {
      const l = layoutGarland(w, g, 38.4);
      expect(l.nails[0]).toBe(0);
      expect(l.nails.at(-1)).toBe(l.length);
      for (let k = 1; k < l.nails.length; k++) {
        const swag = l.nails[k] - l.nails[k - 1];
        expect(swag).toBeGreaterThanOrEqual(3);
        expect(swag).toBeLessThanOrEqual(5);
      }
      // Nails stand on whole eighths and bulbs half an eighth in: they never meet.
      for (const b of l.bulbs) expect(l.nails).not.toContain(b.t + 0.5);
    }
  });
});

describe("the garland's physics", () => {
  it("hangs still, the swags about a tenth deep", () => {
    const s = hung(1440, 49);
    sane(s);
    expect(atRest(s)).toBe(true);
    // Four eighths of 12 cm a swag: some 4 to 6 cm of sag, and the bulbs under it.
    expect(depth(s)).toBeGreaterThan(0.05);
    expect(depth(s)).toBeLessThan(0.09);
    // The nails hold.
    for (const e of s.layout.nails) expect(s.y[e * 2]).toBe(0);
  });

  it("swings when knocked and comes back to rest", () => {
    const s = hung(1440, 49);
    for (let b = 0; b < s.attach.length; b++) knock(s, b, b % 2 ? 1.5 : -1.5);
    advance(s, 1 / 60);
    expect(atRest(s)).toBe(false);
    for (let t = 0; t < 14 && !atRest(s); t += 1 / 60) advance(s, 1 / 60);
    sane(s);
    expect(atRest(s)).toBe(true);
  });

  it("rides out a flung page and a hard stop", () => {
    const s = hung(390, 16, 38.4);
    for (let t = 0; t < 0.12; t += 1 / 60) advance(s, 1 / 60, { accel: 40 });
    for (let t = 0; t < 0.12; t += 1 / 60) advance(s, 1 / 60, { accel: -40 });
    sane(s);
    for (let t = 0; t < 14 && !atRest(s); t += 1 / 60) advance(s, 1 / 60);
    expect(atRest(s)).toBe(true);
  });

  it("plays the song to a hand run along it", () => {
    const s = hung(1440, 49);
    const l = s.layout;
    const rang: number[] = [];
    // A finger drawn across through the bulbs, a little faster than a metre a second.
    let y = 0;
    for (let b = 0; b < s.attach.length; b++) y += s.y[s.cord + b] / s.attach.length;
    const from = -0.05, to = l.length * PITCH_M + 0.05;
    let hx = from;
    while (hx < to) {
      const nx = hx + 1.3 / 60;
      for (const r of advance(s, 1 / 60, { hand: { x0: hx, y0: y, x: nx, y, r: 0.02 } })) rang.push(r.bulb);
      hx = nx;
    }
    // Every bulb rang, in the order they hang: the notes of the song.
    expect(rang.length).toBeGreaterThanOrEqual(26);
    const order = rang.filter((b, i) => rang.indexOf(b) === i);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("lets a bulb be carried and swings it when let go", () => {
    const s = hung(1440, 49);
    const b = 5;
    const i = s.cord + b;
    const gx = s.x[i] + 0.03, gy = s.y[i] + 0.02;
    for (let t = 0; t < 0.4; t += 1 / 60) advance(s, 1 / 60, { grab: { bulb: b, x: gx, y: gy } });
    expect(s.x[i]).toBeCloseTo(gx, 4);
    advance(s, 1 / 60);
    expect(atRest(s)).toBe(false);
    for (let t = 0; t < 14 && !atRest(s); t += 1 / 60) advance(s, 1 / 60);
    sane(s);
    expect(atRest(s)).toBe(true);
  });

  it("keeps its step whatever the frame rate", () => {
    const a = hung(1440, 49), b = hung(1440, 49);
    knock(a, 3, 1);
    knock(b, 3, 1);
    for (let t = 0; t < 1; t += 1 / 60) advance(a, 1 / 60);
    for (let t = 0; t < 1; t += 1 / 144) advance(b, 1 / 144);
    expect(Math.abs(a.x[a.cord + 3] - b.x[b.cord + 3])).toBeLessThan(0.002);
    expect(PHYS.step).toBeLessThan(1 / 600);
  });
});
