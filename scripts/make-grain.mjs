// Writes two pre-tinted 128px grain tiles: dark specks for light grounds, light specks for dark grounds.
import sharp from "sharp";
import { mkdirSync } from "node:fs";
mkdirSync("public/tex", { recursive: true });
let seed = 20260926;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
async function tile(file, rgb, maxAlpha) {
  const S = 128, px = Buffer.alloc(S * S * 4);
  for (let i = 0; i < S * S; i++) {
    const n = rnd();
    const a = n > 0.5 ? Math.round(((n - 0.5) / 0.5) ** 2.2 * maxAlpha) : 0;
    px[i * 4] = rgb[0]; px[i * 4 + 1] = rgb[1]; px[i * 4 + 2] = rgb[2]; px[i * 4 + 3] = a;
  }
  await sharp(px, { raw: { width: S, height: S, channels: 4 } }).png({ compressionLevel: 9, palette: false }).toFile(file);
}
await tile("public/tex/grain-light.png", [20, 18, 16], 38);
await tile("public/tex/grain-dark.png", [255, 248, 238], 30);
console.log("grain ok");
