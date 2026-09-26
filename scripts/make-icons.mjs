// Generates app icons and the Open Graph image from the traced wordmark (no text rendering needed).
//   src/app/icon.svg            favicon: tomato clover on sky
//   src/app/apple-icon.png      180×180
//   src/app/opengraph-image.png 1200×630: wordmark on sky, lace-free and calm
import sharp from "sharp";
import { readFileSync, writeFileSync } from "node:fs";

const src = readFileSync("src/components/brand/wordmark-data.ts", "utf8");
const json = (re) => JSON.parse(src.match(re)[1]);
const VB = json(/WORDMARK_VIEWBOX = (\{.*?\}) as const/);
const OCT = json(/WORDMARK_OCTAGON = (\{.*?\}) as const/);
const WM = JSON.parse(src.slice(src.indexOf("WORDMARK: Record")).replace(/^[^{]*/, "").replace(/;\s*$/, ""));

const SKY = "#dce8f4", INK = "#141210", TOMATO = "#d0392b", CREAM = "#f3ebdc";
const clover = WM.clover[0];
const cloverPath = WM.clover.map((s) => s.d).join(" ");
const pad = 18;
const cvb = [clover.box.x - pad, clover.box.y - pad, clover.box.w + pad * 2, clover.box.h + pad * 2];
const side = Math.max(cvb[2], cvb[3]);
const cx = cvb[0] + cvb[2] / 2 - side / 2, cy = cvb[1] + cvb[3] / 2 - side / 2;

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${cx} ${cy} ${side} ${side}"><rect x="${cx}" y="${cy}" width="${side}" height="${side}" rx="${side * 0.22}" fill="${SKY}"/><path d="${cloverPath}" fill="${TOMATO}" fill-rule="evenodd"/></svg>`;
writeFileSync("src/app/icon.svg", iconSvg);
await sharp(Buffer.from(iconSvg)).resize(180, 180).png().toFile("src/app/apple-icon.png");

const paths = (part, fill) => WM[part].map((s) => `<path d="${s.d}" fill="${fill}" fill-rule="evenodd"/>`).join("");
const W = 1200, H = 630;
const scale = 980 / VB.w;
const tx = (W - VB.w * scale) / 2 - VB.x * scale, ty = (H - VB.h * scale) / 2 - VB.y * scale - 10;
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${SKY}"/>
<rect x="80" y="70" width="${W - 160}" height="${H - 140}" fill="${CREAM}" transform="rotate(-0.6 600 315)"/>
<g transform="translate(${tx.toFixed(1)} ${ty.toFixed(1)}) scale(${scale.toFixed(4)})">
${paths("kak", INK)}${paths("kofe", INK)}${paths("zavtraki", INK)}${paths("dela", INK)}
<path d="${OCT.d}" fill="none" stroke="${INK}" stroke-width="${OCT.stroke}"/>
<path d="${cloverPath}" fill="${TOMATO}" fill-rule="evenodd"/>
</g>
<rect x="80" y="${H - 70 - 6}" width="${W - 160}" height="6" fill="${TOMATO}" transform="rotate(-0.6 600 315)"/>
</svg>`;
await sharp(Buffer.from(og)).png().toFile("src/app/opengraph-image.png");
// Header letters (К.А.К. + ДЕЛА?) as a static mask image; the header paints it with currentColor.
// ViewBox matches Wordmark's "compact" variant so the inline octagon + clover overlay lines up.
const compactVB = "124 325 1671 342";
const letters = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${compactVB}">${paths("kak", "#000")}${paths("dela", "#000")}</svg>`;
writeFileSync("public/brand/wordmark-letters.svg", letters);
console.log("icons ok");
