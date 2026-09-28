// Writes public/tex/paper.png: a seamless 512px paper tile (shown at 256 CSS px) laid over the notice's
// milk. Soft mottling, fine grain and short fibres; dark specks are ink, light ones white, all translucent.
import sharp from "sharp";
import { mkdirSync } from "node:fs";
mkdirSync("public/tex", { recursive: true });
let seed = 20260927;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const S = 512;

// Tileable value noise: a random lattice that wraps, smoothly interpolated.
function octave(period) {
  const n = S / period, g = Array.from({ length: n * n }, () => rnd() * 2 - 1);
  const at = (x, y) => g[((y + n) % n) * n + ((x + n) % n)];
  const sm = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const fx = x / period, fy = y / period, x0 = Math.floor(fx), y0 = Math.floor(fy);
    const tx = sm(fx - x0), ty = sm(fy - y0);
    const a = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * tx;
    const b = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * tx;
    return a + (b - a) * ty;
  };
}
const oct = [[128, 0.5], [64, 0.3], [16, 0.35], [4, 0.45]].map(([p, w]) => [octave(p), w]);

const v = new Float32Array(S * S);
for (let y = 0; y < S; y++)
  for (let x = 0; x < S; x++) {
    let m = 0;
    for (const [f, w] of oct) m += f(x, y) * w;
    // Grain: mostly quiet, with the odd strong speck.
    const r = rnd() * 2 - 1;
    v[y * S + x] = m * 0.35 + Math.sign(r) * Math.abs(r) ** 2.4 * 0.9;
  }

// Fibres: short wandering strokes, wrapped at the edges so the tile stays seamless.
for (let i = 0; i < 900; i++) {
  let x = rnd() * S, y = rnd() * S, a = rnd() * Math.PI * 2;
  const len = 4 + rnd() * 14, tone = (rnd() < 0.6 ? 1 : -1) * (0.25 + rnd() * 0.35);
  for (let s = 0; s < len; s++) {
    const px = ((Math.round(x) % S) + S) % S, py = ((Math.round(y) % S) + S) % S;
    v[py * S + px] += tone;
    a += (rnd() - 0.5) * 0.5; x += Math.cos(a); y += Math.sin(a);
  }
}

const px = Buffer.alloc(S * S * 4);
for (let i = 0; i < S * S; i++) {
  const d = v[i], dark = d > 0;
  const c = dark ? [20, 18, 16] : [255, 255, 255];
  px[i * 4] = c[0]; px[i * 4 + 1] = c[1]; px[i * 4 + 2] = c[2];
  px[i * 4 + 3] = Math.round(Math.min(1, Math.abs(d)) * (dark ? 64 : 110));
}
await sharp(px, { raw: { width: S, height: S, channels: 4 } }).png({ compressionLevel: 9, palette: true, colours: 16, dither: 0 }).toFile("public/tex/paper.png");
console.log("paper ok");
