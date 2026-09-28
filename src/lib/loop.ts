import { hashString, mulberry32 } from "./seed";

/** The loop's box: a word is circled in a 100 × 40 viewBox, stretched over it (feedback.css). */
export const LOOP_BOX = { w: 100, h: 40 } as const;

const round = (n: number) => Math.round(n * 100) / 100;

/**
 * A pen loop round a printed word, the way a guest circles one option on a paper form (the feedback
 * page's note). It starts at the upper right, goes once round anticlockwise and runs a little past where
 * it started, a touch wider on the second pass, so the ends never meet; the line wobbles as a hand does.
 * Seeded, so the server and the client draw the same loop. Returns an SVG path in LOOP_BOX, smoothed
 * through its points (Catmull-Rom as cubic Béziers); it may reach a little past the box.
 */
export function penLoop(seed: string): string {
  const rnd = mulberry32(hashString(`${seed}:loop`));
  const cx = LOOP_BOX.w / 2;
  const cy = LOOP_BOX.h / 2;
  const rx = 46 + rnd() * 2.5;
  const ry = 16 + rnd() * 2.5;
  const tilt = ((rnd() - 0.5) * 6 * Math.PI) / 180;
  const start = ((35 + rnd() * 30) * Math.PI) / 180;
  const sweep = ((385 + rnd() * 30) * Math.PI) / 180;
  const drift = 0.05 + rnd() * 0.05;
  const w1 = rnd() * Math.PI * 2;
  const w2 = rnd() * Math.PI * 2;

  const n = 30;
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const a = start + sweep * u;
    const r = (1 + 0.03 * Math.sin(2 * a + w1) + 0.018 * Math.sin(3 * a + w2)) * (1 - drift / 2 + drift * u);
    const x = rx * r * Math.cos(a);
    const y = -ry * r * Math.sin(a);
    pts.push([cx + x * Math.cos(tilt) - y * Math.sin(tilt), cy + x * Math.sin(tilt) + y * Math.cos(tilt)]);
  }

  let d = `M${round(pts[0][0])} ${round(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${round(c1[0])} ${round(c1[1])} ${round(c2[0])} ${round(c2[1])} ${round(p2[0])} ${round(p2[1])}`;
  }
  return d;
}
