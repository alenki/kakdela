import { describe, expect, it } from "vitest";
import { LOADER_SCRIPT, aimAt, follow, frameFor, holesAlong, type Box } from "./loader-script";

const B = (l: number, t: number, w: number, h: number): Box => ({ l, t, w, h });

// The hero's boxes as measured at each canvas (notice, logo, tear line, first tab), from the running page,
// and whether the whole logo fits the close-up (wide) or it is cropped round the guessed tab.
const CANVASES: { vw: number; vh: number; n: Box; logo: Box; perf: Box; tab: Box; wide: boolean }[] = [
  { vw: 390, vh: 844, n: B(16, 76, 358, 309), logo: B(35, 100, 320, 103), perf: B(16, 245, 358, 10), tab: B(16, 255, 45, 131), wide: false },
  { vw: 360, vh: 740, n: B(16, 74, 328, 360), logo: B(33, 95, 293, 94), perf: B(16, 232, 328, 10), tab: B(16, 242, 82, 96), wide: false },
  { vw: 430, vh: 932, n: B(16, 78, 398, 337), logo: B(37, 104, 356, 114), perf: B(16, 261, 398, 10), tab: B(16, 271, 50, 144), wide: false },
  { vw: 844, vh: 390, n: B(29, 72, 787, 485), logo: B(69, 122, 706, 227), perf: B(29, 413, 787, 10), tab: B(29, 423, 98, 134), wide: true },
  { vw: 768, vh: 1024, n: B(26, 81, 716, 478), logo: B(63, 126, 642, 206), perf: B(26, 392, 716, 10), tab: B(26, 402, 89, 156), wide: false },
  { vw: 1024, vh: 768, n: B(35, 99, 467, 559), logo: B(59, 196, 418, 134), perf: B(35, 442, 467, 10), tab: B(35, 452, 58, 206), wide: true },
  // The stacked hero on square and portrait screens from 1024px.
  { vw: 1024, vh: 1366, n: B(35, 97, 954, 582), logo: B(84, 157, 857, 275), perf: B(35, 506, 954, 10), tab: B(35, 516, 119, 162), wide: false },
  { vw: 1100, vh: 1100, n: B(37, 90, 1025, 623), logo: B(90, 155, 921, 296), perf: B(37, 529, 1025, 10), tab: B(37, 539, 128, 174), wide: false },
  { vw: 1030, vh: 1160, n: B(35, 92, 960, 585), logo: B(84, 153, 862, 277), perf: B(35, 504, 960, 10), tab: B(35, 514, 120, 163), wide: false },
  { vw: 1280, vh: 800, n: B(44, 104, 687, 579), logo: B(79, 148, 617, 198), perf: B(44, 404, 687, 10), tab: B(44, 414, 86, 269), wide: true },
  { vw: 1440, vh: 900, n: B(49, 109, 773, 666), logo: B(89, 158, 694, 223), perf: B(49, 445, 773, 10), tab: B(49, 455, 97, 320), wide: true },
  { vw: 1920, vh: 1080, n: B(65, 126, 1031, 813), logo: B(118, 192, 926, 298), perf: B(65, 566, 1031, 10), tab: B(65, 576, 129, 363), wide: true },
  { vw: 2560, vh: 1440, n: B(87, 152, 1375, 1116), logo: B(157, 239, 1235, 397), perf: B(87, 735, 1375, 10), tab: B(87, 745, 172, 523), wide: true },
  { vw: 2560, vh: 1080, n: B(87, 134, 1375, 805), logo: B(288, 221, 972, 312), perf: B(87, 621, 1375, 10), tab: B(87, 631, 172, 308), wide: true },
];

describe("frameFor (the close-up)", () => {
  for (const c of CANVASES) {
    const f = frameFor(c.vw, c.vh, c.n, c.logo, c.perf, c.tab);
    const at = (x: number, y: number) => [f.x + f.s * (x - c.n.l), f.y + f.s * (y - c.n.t)];
    const wide = c.wide;

    it(`${c.vw}×${c.vh}: ${wide ? "the whole logo fits" : "the logo is cropped round the guess"}`, () => {
      expect(f.wide).toBe(wide);
    });

    it(`${c.vw}×${c.vh}: the paper covers the screen, its edge 4px out of frame`, () => {
      const [l, t] = at(c.n.l, c.n.t);
      const [r, b] = at(c.n.l + c.n.w, c.n.t + c.n.h);
      expect(l).toBeLessThanOrEqual(-4 + 1e-9);
      expect(t).toBeLessThanOrEqual(-4 + 1e-9);
      expect(r).toBeGreaterThanOrEqual(c.vw + 4 - 1e-9);
      expect(b).toBeGreaterThanOrEqual(c.vh + 4 - 1e-9);
    });

    it(`${c.vw}×${c.vh}: it is a close-up, and the trace is never magnified past 1.6px a unit unless covering needs it`, () => {
      expect(f.s).toBeGreaterThanOrEqual(wide ? 1 : 1.6);
      const cover = Math.max((c.vw + 8) / c.n.w, (c.vh + 8) / c.n.h);
      expect((f.s * c.logo.w) / 1671 <= 1.6 + 1e-9 || f.s <= Math.max(cover * 1.02, 1.6) + 1e-9).toBe(true);
    });

    it(`${c.vw}×${c.vh}: the tear line is on screen`, () => {
      const [, y] = at(0, c.perf.t + c.perf.h / 2);
      expect(y).toBeGreaterThan(0);
      expect(y).toBeLessThan(c.vh);
    });

    if (wide) {
      it(`${c.vw}×${c.vh}: the whole logo is in frame, the tear line below it`, () => {
        const [l, t] = at(c.logo.l, c.logo.t);
        const [r, b] = at(c.logo.l + c.logo.w, c.logo.t + c.logo.h);
        expect(l).toBeGreaterThanOrEqual(-1);
        expect(r).toBeLessThanOrEqual(c.vw + 1);
        expect(t).toBeGreaterThanOrEqual(0);
        const [, line] = at(0, c.perf.t + c.perf.h / 2);
        expect(line).toBeGreaterThan(b);
      });
    } else {
      it(`${c.vw}×${c.vh}: the guessed tab is in frame`, () => {
        const [x] = at(c.tab.l + c.tab.w / 2, 0);
        expect(x).toBeGreaterThan(0);
        expect(x).toBeLessThan(c.vw);
      });
    }
  }
});

describe("holesAlong (hero.css's tear line)", () => {
  it("tiles 10px holes edge to edge, as background-repeat: space does", () => {
    const h = holesAlong(356);
    expect(h.n).toBe(35);
    expect(h.at(0)).toBe(5);
    expect(h.at(34)).toBeCloseTo(351, 9);
    expect(h.pitch).toBeCloseTo(346 / 34, 9);
  });
  it("centres a lone hole", () => {
    const h = holesAlong(14);
    expect(h.n).toBe(1);
    expect(h.at(0)).toBe(7);
  });
});

describe("the needle", () => {
  const W = [0.1, 0.15, 0.2, 0.2, 0.15, 0.2];

  it("never claims a milestone that hasn't happened", () => {
    const done = [true, true, false, false, false, false];
    for (const t of [0, 1, 5, 60]) expect(aimAt(W, done, t)).toBeLessThan(0.25 + 0.2 * 0.6 + 1e-9);
    expect(aimAt(W, done.map(() => true), 0)).toBeCloseTo(1, 9);
  });

  it("never goes back, never overshoots, and never crosses faster than its sweep", () => {
    let v = 0;
    const aims = [0.2, 0.9, 0.4, 1, 1, 1];
    for (let frame = 0; frame < 600; frame++) {
      const next = follow(v, aims[Math.min(aims.length - 1, Math.floor(frame / 40))], 1 / 60, 1.15);
      expect(next).toBeGreaterThanOrEqual(v);
      expect(next).toBeLessThanOrEqual(1);
      expect(next - v).toBeLessThanOrEqual(1 / 60 / 1.15 + 1e-12);
      v = next;
    }
    expect(v).toBeGreaterThan(0.99);
  });

  it("lands on a steady aim exactly, without a crawl at the end", () => {
    let v = 0;
    let frames = 0;
    while (v < 1 && frames < 1000) {
      v = follow(v, 1, 1 / 60, 1.15);
      frames++;
    }
    expect(v).toBe(1);
    // Never under the sweep, and not long past it.
    expect(frames / 60).toBeGreaterThanOrEqual(1.15 - 1e-9);
    expect(frames / 60).toBeLessThan(1.6);
  });
});

describe("LOADER_SCRIPT", () => {
  it("is a self-contained script (its maths travels as arguments)", () => {
    expect(() => new Function(LOADER_SCRIPT)).not.toThrow();
    expect(LOADER_SCRIPT).not.toMatch(/__turbopack|__webpack|require\(|import\(/);
  });
  it("has no em dash", () => {
    expect(LOADER_SCRIPT).not.toContain(String.fromCharCode(0x2014));
  });
});
