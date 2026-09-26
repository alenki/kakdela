// Traces the client's raster logo (assets-src/logo-index.png) into grouped SVG path data.
// Output: src/components/brand/wordmark-data.ts: logo parts (kak, oct, clover, kofe,
// zavtraki, dela) that the intro and footer animate independently.
// The octagon badge is rebuilt as exact geometry (it is a regular octagon) and the clover is
// traced from a masked copy, because in the raster its stem touches the octagon ring.
// Interim until the client supplies the original vector.
import sharp from "sharp";
import potrace from "potrace";
import { writeFileSync } from "node:fs";
import { optimize } from "svgo";

const SRC = "assets-src/logo-index.png";
const OUT = "src/components/brand/wordmark-data.ts";
const SCALE = 2; // trace at 2x for smoother curves

// Measured from the raster: regular octagon, vertices at k·45° (pointy top), ≈5px stroke.
const OCTAGON = { cx: 838.5, cy: 495.5, rOuter: 165.5, stroke: 5 };
const APOTHEM_COS = Math.cos(Math.PI / 8);

function insideOctagon(x, y, r) {
  const a = r * APOTHEM_COS;
  for (let k = 0; k < 8; k++) {
    const t = Math.PI / 8 + (k * Math.PI) / 4;
    if ((x - OCTAGON.cx) * Math.cos(t) + (y - OCTAGON.cy) * Math.sin(t) > a) return false;
  }
  return true;
}

const { data: base, info } = await sharp(SRC)
  .flatten({ background: "#ffffff" })
  .greyscale()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width: W, height: H } = info;

function masked(keep) {
  const out = Buffer.from(base);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (!keep(x, y)) out[y * W + x] = 255;
  return out;
}

async function trace(raw) {
  const png = await sharp(raw, { raw: { width: W, height: H, channels: 1 } })
    .resize({ width: W * SCALE, kernel: "lanczos3" })
    .png()
    .toBuffer();
  const svg = await new Promise((resolve, reject) =>
    potrace.trace(
      png,
      { threshold: 140, turdSize: 8, optCurve: true, optTolerance: 0.15, alphaMax: 1 },
      (err, out) => (err ? reject(err) : resolve(out)),
    ),
  );
  const d = svg.match(/ d="([^"]+)"/)?.[1] ?? "";
  return d.split(/(?=M)/).map((s) => s.trim()).filter(Boolean);
}

function bboxOf(path) {
  const nums = path.match(/-?\d+(\.\d+)?/g).map(Number);
  let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
  for (let i = 0; i + 1 < nums.length; i += 2) {
    const x = nums[i], y = nums[i + 1];
    if (x < minx) minx = x;
    if (y < miny) miny = y;
    if (x > maxx) maxx = x;
    if (y > maxy) maxy = y;
  }
  return { minx, miny, maxx, maxy, area: (maxx - minx) * (maxy - miny) };
}

// Groups subpaths into components: even nesting depth = filled shape, odd = hole of its parent.
function components(subs) {
  const items = subs.map((p) => ({ p, b: bboxOf(p) }));
  const contains = (a, b) =>
    a.b.minx <= b.b.minx && a.b.miny <= b.b.miny && a.b.maxx >= b.b.maxx && a.b.maxy >= b.b.maxy && a.b.area > b.b.area;
  for (const it of items) {
    const parents = items.filter((o) => o !== it && contains(o, it));
    it.depth = parents.length;
    it.parent = parents.sort((a, b) => a.b.area - b.b.area)[0] ?? null;
  }
  const roots = items.filter((it) => it.depth % 2 === 0);
  for (const r of roots) r.members = [r];
  for (const it of items.filter((x) => x.depth % 2 === 1)) {
    const root = it.parent && it.parent.depth % 2 === 0 ? it.parent : roots.find((r) => contains(r, it));
    if (root) root.members.push(it);
  }
  return roots;
}

const S = SCALE;
const round = (path) => path.replace(/-?\d+(\.\d+)?/g, (n) => String(Math.round((Number(n) / S) * 10) / 10));
const box = (b) => ({
  x: Math.round(b.minx / S), y: Math.round(b.miny / S),
  w: Math.round((b.maxx - b.minx) / S), h: Math.round((b.maxy - b.miny) / S),
});
// SVGO path compaction (relative commands, 1-decimal precision): about 64% smaller, visually identical.
const compact = (d) =>
  optimize(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${d}"/></svg>`, {
    multipass: true,
    floatPrecision: 1,
    plugins: [{ name: "preset-default" }],
  }).data.match(/ d="([^"]+)"/)[1];
const shape = (r) => ({ d: compact(r.members.map((m) => round(m.p)).join(" ")), box: box(r.b) });

// 1) Everything outside the badge.
const outer = components(await trace(masked((x, y) => !insideOctagon(x, y, OCTAGON.rOuter + 2))));
const parts = { kak: [], kofe: [], zavtraki: [], dela: [] };
for (const r of outer) {
  const cx = (r.b.minx + r.b.maxx) / 2 / S, cy = (r.b.miny + r.b.maxy) / 2 / S;
  const small = r.b.maxx - r.b.minx < 25 * S && r.b.maxy - r.b.miny < 25 * S;
  let part;
  if (small && cy > 600) part = "zavtraki";
  else if (small && cy < 320) part = "kofe";
  else if (cx < 660) part = "kak";
  else if (cx > 1020) part = "dela";
  else if (cy < 400) part = "kofe";
  else part = "zavtraki";
  parts[part].push(r);
}
for (const list of Object.values(parts)) list.sort((a, b) => a.b.minx - b.b.minx);

// 2) The clover, from inside the ring only.
const innerR = OCTAGON.rOuter - OCTAGON.stroke / APOTHEM_COS - 1.5;
const clover = components(await trace(masked((x, y) => insideOctagon(x, y, innerR))))
  .sort((a, b) => b.b.area - a.b.area);

// 3) The octagon as exact geometry: stroke centre line.
const rMid = OCTAGON.rOuter - OCTAGON.stroke / 2 / APOTHEM_COS;
const pts = Array.from({ length: 8 }, (_, k) => {
  const t = -Math.PI / 2 + (k * Math.PI) / 4; // start at the top vertex
  return [OCTAGON.cx + rMid * Math.cos(t), OCTAGON.cy + rMid * Math.sin(t)].map((n) => Math.round(n * 10) / 10);
});
const octD = `M${pts.map((p) => p.join(" ")).join("L")}Z`;

const PAD = 4;
const vb = { x: 128 - PAD, y: 238 - PAD, w: 1791 - 128 + PAD * 2, h: 767 - 238 + PAD * 2 };

const out = {
  kak: parts.kak.map(shape),
  kofe: parts.kofe.map(shape),
  zavtraki: parts.zavtraki.map(shape),
  dela: parts.dela.map(shape),
  clover: clover.map(shape),
};

const ts = `// AUTO-GENERATED by scripts/trace-logo.mjs from assets-src/logo-index.png. Do not edit by hand.
// Interim trace of the «Как дела?» wordmark until the client supplies the original vector.
export type WordmarkShape = { d: string; box: { x: number; y: number; w: number; h: number } };
export type WordmarkPart = "kak" | "kofe" | "zavtraki" | "dela" | "clover";

export const WORDMARK_VIEWBOX = ${JSON.stringify(vb)} as const;

/** Badge octagon as a stroked centre line (regular octagon, pointy top). */
export const WORDMARK_OCTAGON = ${JSON.stringify({ d: octD, stroke: OCTAGON.stroke, cx: OCTAGON.cx, cy: OCTAGON.cy, r: Math.round(rMid * 10) / 10 })} as const;

export const WORDMARK: Record<WordmarkPart, WordmarkShape[]> = ${JSON.stringify(out, null, 2)};
`;
writeFileSync(OUT, ts);
console.log(Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.length])), "octR", rMid.toFixed(1));
