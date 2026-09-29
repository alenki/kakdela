// Builds the printed city plans of /locations («Где встретимся?»): the real streets of Nalchik and Vladikavkaz
// from OpenStreetMap, engraved in ink as a pocket plan. The cafés, the guest and the labels are the page's own.
// Data © OpenStreetMap contributors, ODbL: the page prints the credit under each plan, linked to
// openstreetmap.org/copyright.
// Usage: npm run assets:plans [-- --cached]   (--cached redraws from the last download, no network)
//
// Out:
//   src/assets/plans/<city>.svg   the print (a static import, shown with next/image: hashed, cached for good)
//   src/content/plans.ts          each sheet's frame, its cartouche corner and the cafés it was fitted to
//
// The sheet is 1000 × 1250 units (4:5, the site's photo shape), fitted around the city's cafés (read from
// src/content/cafes.ts) with room for labels. The projection is src/lib/plan-projection.ts, the page's own.
// The print is one ink (#141210 at set opacities: an <img> can't read the page's tokens) and carries its own
// weights for three sizes in a <style> whose media queries read the image's width, so an avenue is two ~1px
// engraved lines whether the sheet is 330px wide on a phone or 1000px on a 2560 screen. No text, no scripts.
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { M_LAT, M_LON, projectOn } from "../src/lib/plan-projection.ts";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SVG_DIR = path.join(ROOT, "src/assets/plans");
const TS_OUT = path.join(ROOT, "src/content/plans.ts");
const CACHE = path.join(ROOT, "node_modules/.cache/kd-plans");
const CACHED = process.argv.includes("--cached");

const MIRRORS = [
  "https://z.overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
  "https://overpass-api.de/api/interpreter",
];

const VB = { w: 1000, h: 1250 };

/**
 * Per city: the least ground the sheet shows (a city of two cafés still needs streets round them), how much of
 * the sheet the cafés may span (the rest is room for labels and the cartouche), and a nudge of the centre
 * (metres east, north) toward the side with more city to show.
 */
const CITIES = {
  nalchik: { minWidthM: 4200, fillX: 0.66, fillY: 0.62, nudge: [250, 380] },
  vladikavkaz: { minWidthM: 2600, fillX: 0.6, fillY: 0.6, nudge: [0, 0] },
};

// ── The cafés, from the site's own data ──
function readCafes() {
  const src = readFileSync(path.join(ROOT, "src/content/cafes.ts"), "utf8");
  const re = /id: "([^"]+)", city: "(nalchik|vladikavkaz)"[\s\S]*?coords: \{ lat: ([\d.]+), lon: ([\d.]+) \}/g;
  const out = [];
  for (let m; (m = re.exec(src)); ) out.push({ id: m[1], city: m[2], lat: Number(m[3]), lon: Number(m[4]) });
  const ids = (src.match(/\bid: "/g) ?? []).length;
  if (out.length !== ids) throw new Error(`Read ${out.length} cafés of ${ids} in src/content/cafes.ts: the pattern needs updating`);
  return out;
}

// ── The frame ──
function fitFrame(city, cafes) {
  const cfg = CITIES[city];
  const pts = cafes.filter((c) => c.city === city);
  const lat0 = (Math.min(...pts.map((p) => p.lat)) + Math.max(...pts.map((p) => p.lat))) / 2;
  const lon0 = (Math.min(...pts.map((p) => p.lon)) + Math.max(...pts.map((p) => p.lon))) / 2;
  const k = Math.cos((lat0 * Math.PI) / 180);
  const dx = Math.max(...pts.map((p) => Math.abs((p.lon - lon0) * M_LON * k)));
  const dy = Math.max(...pts.map((p) => Math.abs((p.lat - lat0) * M_LAT)));
  const aspect = VB.w / VB.h;
  let widthM = Math.max(cfg.minWidthM, (2 * dx) / cfg.fillX, ((2 * dy) / cfg.fillY) * aspect);
  widthM = Math.ceil(widthM / 50) * 50;
  const center = { lat: lat0 + cfg.nudge[1] / M_LAT, lon: lon0 + cfg.nudge[0] / (M_LON * k) };
  return { center, widthM, heightM: widthM / aspect, fittedTo: pts.map(({ id, lat, lon }) => ({ id, lat, lon })) };
}

function bboxOf(frame, grow = 1.08) {
  const k = Math.cos((frame.center.lat * Math.PI) / 180);
  const hw = ((frame.widthM / 2) * grow) / (M_LON * k);
  const hh = ((frame.heightM / 2) * grow) / M_LAT;
  return [frame.center.lat - hh, frame.center.lon - hw, frame.center.lat + hh, frame.center.lon + hw];
}

// ── OpenStreetMap ──
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function overpass(bbox) {
  const q = `[out:json][timeout:120][maxsize:268435456][bbox:${bbox.map((v) => v.toFixed(5)).join(",")}];
(
  way[highway];
  way[waterway~"^(river|canal|riverbank)$"];
  way[natural=water]; relation[natural=water];
  way[leisure~"^(park|garden)$"]; relation[leisure=park];
  way[landuse~"^(forest|recreation_ground)$"]; relation[landuse=forest];
  way[natural=wood]; relation[natural=wood];
  way[railway=rail];
);
out geom;`;
  let last;
  for (const url of MIRRORS) {
    for (const wait of [0, 2000, 5000]) {
      if (wait) await sleep(wait);
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "kakdela-site-build/1.0" },
          body: new URLSearchParams({ data: q }),
          // A mirror that holds the line open is a mirror that failed: on to the next.
          signal: AbortSignal.timeout(180_000),
        });
        const text = await res.text();
        if (res.status === 429 || res.status === 504) throw Object.assign(new Error(`${url}: HTTP ${res.status}`), { retry: true });
        if (!res.ok || !text.trimStart().startsWith("{")) throw new Error(`${url}: HTTP ${res.status}`);
        const json = JSON.parse(text);
        // Overpass reports a query that ran out of time or memory as a 200 with a remark, and whatever it had
        // printed by then: a partial city. Never draw (or cache) that.
        if (typeof json.remark === "string" && /runtime error/i.test(json.remark)) throw Object.assign(new Error(`${url}: ${json.remark}`), { retry: true });
        if (!json.elements?.length) throw new Error(`${url}: no elements`);
        return json;
      } catch (e) {
        last = e;
        console.warn(`  ${e.message}`);
        if (!e.retry) break;
      }
    }
  }
  throw last;
}

// ── Geometry ──
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  const t2 = tol * tol;
  while (stack.length) {
    const [a, b] = stack.pop();
    const [ax, ay] = pts[a];
    const [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let max = -1, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i];
      const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len2));
      const d2 = (px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2;
      if (d2 > max) { max = d2; idx = i; }
    }
    if (max > t2) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

const M = 30; // units drawn past the sheet's edge, so lines run cleanly off it
const lerpAt = (a, b, axis, v) => {
  const t = (v - a[axis]) / (b[axis] - a[axis]);
  return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
};

/** A line cut to the sheet and its overdraw, exactly at the edge (Liang-Barsky, segment by segment). */
function clipLine(pts) {
  const runs = [];
  let run = [];
  const lo = [-M, -M], hi = [VB.w + M, VB.h + M];
  for (let i = 1; i < pts.length; i++) {
    let [a, b] = [pts[i - 1], pts[i]];
    let t0 = 0, t1 = 1;
    const d = [b[0] - a[0], b[1] - a[1]];
    let out = false;
    for (let ax = 0; ax < 2 && !out; ax++) {
      for (const [p, q] of [[-d[ax], a[ax] - lo[ax]], [d[ax], hi[ax] - a[ax]]]) {
        if (p === 0) { if (q < 0) { out = true; break; } continue; }
        const t = q / p;
        if (p < 0) { if (t > t1) { out = true; break; } if (t > t0) t0 = t; }
        else { if (t < t0) { out = true; break; } if (t < t1) t1 = t; }
      }
    }
    if (out) { if (run.length) { runs.push(run); run = []; } continue; }
    const s = [a[0] + t0 * d[0], a[1] + t0 * d[1]];
    const e = [a[0] + t1 * d[0], a[1] + t1 * d[1]];
    if (!run.length) run.push(s);
    run.push(e);
    if (t1 < 1) { runs.push(run); run = []; }
  }
  if (run.length > 1) runs.push(run);
  return runs.filter((r) => r.length > 1);
}

/** A ring cut to the sheet and its overdraw (Sutherland-Hodgman): the cut runs outside the viewBox. */
function clipRing(pts) {
  const edges = [
    [(p) => p[0] >= -M, (a, b) => lerpAt(a, b, 0, -M)],
    [(p) => p[0] <= VB.w + M, (a, b) => lerpAt(a, b, 0, VB.w + M)],
    [(p) => p[1] >= -M, (a, b) => lerpAt(a, b, 1, -M)],
    [(p) => p[1] <= VB.h + M, (a, b) => lerpAt(a, b, 1, VB.h + M)],
  ];
  let out = pts;
  for (const [isIn, cut] of edges) {
    const input = out;
    out = [];
    for (let i = 0; i < input.length; i++) {
      const cur = input[i];
      const prev = input[(i + input.length - 1) % input.length];
      if (isIn(cur)) {
        if (!isIn(prev)) out.push(cut(prev, cur));
        out.push(cur);
      } else if (isIn(prev)) out.push(cut(prev, cur));
    }
    if (!out.length) return out;
  }
  return out;
}

/** Shoelace area of a ring in sheet units². */
const area = (pts) => Math.abs(pts.reduce((s, p, i) => { const q = pts[(i + 1) % pts.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
const length = (pts) => pts.reduce((s, p, i) => (i ? s + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0);

// Half-unit precision: at most 0.25px off on the widest sheet (1000px on a 2560 screen).
const r2 = (v) => Math.round(v * 2) / 2;
const num = (v) => {
  const s = String(v);
  return s.startsWith("0.") ? s.slice(1) : s.startsWith("-0.") ? `-${s.slice(2)}` : s;
};
/** «M12.5 45l1.5-3 5 6»: relative, half units, no redundant separators. */
function pathData(pts, close = false) {
  let px = r2(pts[0][0]), py = r2(pts[0][1]);
  let d = `M${num(px)} ${num(py)}`;
  let body = "";
  for (let i = 1; i < pts.length; i++) {
    const x = r2(pts[i][0]), y = r2(pts[i][1]);
    const dx = x - px, dy = y - py;
    if (dx === 0 && dy === 0) continue;
    const sx = num(dx), sy = num(dy);
    body += (body === "" || sx.startsWith("-") ? "" : " ") + sx + (sy.startsWith("-") ? "" : " ") + sy;
    px = x;
    py = y;
  }
  if (!body) return "";
  return `${d}l${body}${close ? "z" : ""}`;
}

/** Join a multipolygon's member ways into closed rings. */
function rings(members) {
  const segs = members.filter((m) => m.geometry?.length > 1).map((m) => m.geometry.map((g) => [g.lat, g.lon]));
  const key = (p) => `${p[0].toFixed(7)},${p[1].toFixed(7)}`;
  const out = [];
  while (segs.length) {
    let ring = segs.shift();
    let grown = true;
    while (key(ring[0]) !== key(ring[ring.length - 1]) && grown) {
      grown = false;
      for (let i = 0; i < segs.length; i++) {
        const s = segs[i];
        const end = key(ring[ring.length - 1]);
        if (key(s[0]) === end) ring = ring.concat(s.slice(1));
        else if (key(s[s.length - 1]) === end) ring = ring.concat(s.slice(0, -1).reverse());
        else continue;
        segs.splice(i, 1);
        grown = true;
        break;
      }
    }
    if (ring.length > 3) out.push(ring);
  }
  return out;
}

// ── What the plan shows ──
// Footpaths, service roads and streams are left out: at plan scale they are grey scribble.
const ROADS = {
  pedestrian: "st", living_street: "st", residential: "st", unclassified: "st", road: "st",
  tertiary: "t3", tertiary_link: "t3",
  secondary: "mj", secondary_link: "mj", primary: "mj", primary_link: "mj", trunk: "mj", trunk_link: "mj",
};
function classify(tags) {
  if (tags.tunnel && tags.tunnel !== "no") return null;
  if (tags.highway) return tags.area === "yes" ? null : (ROADS[tags.highway] ?? null);
  if (tags.railway === "rail" && !tags.service) return "rl";
  if (tags.waterway === "river" || tags.waterway === "canal") return "rv";
  if (tags.natural === "water" || tags.waterway === "riverbank") return "wa";
  if (tags.leisure === "park" || tags.leisure === "garden" || tags.landuse === "recreation_ground") return "pk";
  if (tags.landuse === "forest" || tags.natural === "wood") return "fo";
  return null;
}

// Stroke widths in sheet units for a sheet 700px wide or more (1 unit ≈ 0.7 to 1px); the <style> scales them
// up for smaller sheets. Majors are engraved: a wide ink stroke whose middle the mask knocks out, so the paper
// shows through between two lines, and every street, the river and the railway stop at an avenue's edge.
const W = { mj: 7.2, knock: 4.2, t3: 2, st: 1.1, rl: 1.5, rv: 1.6, wa: 0.9 };
const SIZES = [
  // The sheet's width in px → how much heavier the lines are drawn.
  [699, 1.3],
  [459, 1.8],
];
const INK = "#141210";

function style() {
  const rules = (k) =>
    `.mj{stroke-width:${W.mj * k}}.k{stroke-width:${W.knock * k}}.t3{stroke-width:${W.t3 * k}}.st{stroke-width:${W.st * k}}` +
    `.rl{stroke-width:${W.rl * k}}.rv{stroke-width:${W.rv * k}}.wa{stroke-width:${W.wa * k}}`;
  const base = `.mj,.t3,.st,.rl,.rv,.k{fill:none;stroke-linecap:round;stroke-linejoin:round}.mj{stroke-opacity:.95}.t3{stroke-opacity:.88}.st{stroke-opacity:.6}` +
    `.rl{stroke-opacity:.55;stroke-dasharray:8 5;stroke-linecap:butt}.rv{stroke-opacity:.4}.wa{fill-opacity:.09;stroke-opacity:.4}` +
    `.pk{fill:url(#d1);fill-opacity:.6}.fo{fill:url(#f1);fill-opacity:.45}.k{stroke:#000}` + rules(1);
  const small = SIZES.map(([px, k], i) => `@media (max-width:${px}px){${rules(k)}${i === SIZES.length - 1 ? ".pk{fill:url(#d2)}.fo{fill:url(#f2)}.rl{stroke-dasharray:12 7}" : ""}}`).join("");
  return base + small;
}

/** A hex screen of dots: tone without a direction (a hatch is the coffee poster's). */
const dots = (id, w, r) => {
  const h = +(w * Math.sqrt(3)).toFixed(3);
  const c = (x, y) => `<circle cx="${x}" cy="${y}" r="${r}"/>`;
  return `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse" fill="${INK}">${c(0, 0)}${c(w, 0)}${c(w / 2, +(h / 2).toFixed(3))}${c(0, h)}${c(w, h)}</pattern>`;
};

function draw(frame, osm) {
  const P = (lat, lon) => {
    const p = projectOn(frame, VB, { lat, lon });
    return [p.x, p.y];
  };
  const u = VB.w / frame.widthM; // units per metre
  const lines = { mj: [], t3: [], st: [], rl: [], rv: [] };
  const areas = { wa: [], pk: [], fo: [] };
  for (const el of osm.elements) {
    const cls = classify(el.tags ?? {});
    if (!cls) continue;
    if (cls in areas) {
      const rs = el.type === "relation" ? rings(el.members ?? []) : el.geometry ? [el.geometry.map((g) => [g.lat, g.lon])] : [];
      for (const r of rs) {
        const proj = r.map(([la, lo]) => P(la, lo));
        // Woods under two hectares are specks at this scale.
        if (cls === "fo" && area(proj) / (u * u) < 20_000) continue;
        const pts = clipRing(simplify(proj, 0.8));
        if (pts.length < 3) continue;
        const d = pathData(pts, true);
        if (d) areas[cls].push(d);
      }
      continue;
    }
    if (!el.geometry) continue;
    for (const run of clipLine(el.geometry.map((g) => P(g.lat, g.lon)))) {
      // A street stub under 40 m is a driveway in all but name.
      if (cls === "st" && length(run) / u < 40) continue;
      const d = pathData(simplify(run, 0.5));
      if (d) lines[cls].push(d);
    }
  }
  const p = (cls, extra = "") => (lines[cls].length ? `<path class="${cls}"${extra} d="${lines[cls].join("")}"/>` : "");
  const a = (cls) => (areas[cls].length ? `<path class="${cls}" fill-rule="evenodd" d="${areas[cls].join("")}"/>` : "");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VB.w} ${VB.h}" width="${VB.w}" height="${VB.h}">
<style>${style()}</style>
<defs>${dots("d1", 6, 0.85)}${dots("d2", 9, 1.3)}${dots("f1", 9, 0.75)}${dots("f2", 13, 1.1)}
<mask id="m" maskUnits="userSpaceOnUse" x="-${M}" y="-${M}" width="${VB.w + 2 * M}" height="${VB.h + 2 * M}"><rect x="-${M}" y="-${M}" width="${VB.w + 2 * M}" height="${VB.h + 2 * M}" fill="#fff"/>${p("mj").replace('class="mj"', 'class="k"')}</mask></defs>
<g stroke="${INK}" fill="${INK}">
${a("fo")}
${a("pk")}
<g mask="url(#m)">
${a("wa")}
${p("rv")}
${p("rl")}
${p("st")}
${p("t3")}
${p("mj")}
</g>
</g>
</svg>
`.replace(/\n{2,}/g, "\n");
}

/**
 * The corner for the cartouche (the city's name and the scale bar): one with no café under it or near it, and
 * of those the one with the least ink, so it covers hills and river rather than streets.
 */
function cartoucheCorner(frame, svg, cafes) {
  const box = { w: 360, h: 190 };
  const corners = { bl: [0, VB.h - box.h], br: [VB.w - box.w, VB.h - box.h], tl: [0, 0], tr: [VB.w - box.w, 0] };
  const pts = cafes.map((c) => projectOn(frame, VB, c));
  let best = null;
  for (const [name, [x0, y0]] of Object.entries(corners)) {
    const clear = pts.every((p) => p.x < x0 - 60 || p.x > x0 + box.w + 60 || p.y < y0 - 60 || p.y > y0 + box.h + 60);
    if (!clear) continue;
    // Ink: the absolute points of the path data that fall in the box, a fair proxy for line length there.
    let ink = 0;
    for (const m of svg.matchAll(/M(-?[\d.]+) (-?[\d.]+)/g)) {
      const x = Number(m[1]), y = Number(m[2]);
      if (x >= x0 && x <= x0 + box.w && y >= y0 && y <= y0 + box.h) ink++;
    }
    if (!best || ink < best.ink) best = { name, ink };
  }
  if (!best) throw new Error("No corner of the sheet is clear of cafés for the cartouche");
  return best.name;
}

/** A round length for the scale bar, about a sixth of the sheet. */
function scaleBar(frame) {
  const target = frame.widthM / 6;
  const nice = [100, 200, 250, 300, 500, 1000, 2000];
  return nice.reduce((best, m) => (Math.abs(m - target) < Math.abs(best - target) ? m : best), nice[0]);
}

// ── Run ──
const cafes = readCafes();
mkdirSync(SVG_DIR, { recursive: true });
mkdirSync(CACHE, { recursive: true });
const frames = {};
let osmBase = "";
for (const city of Object.keys(CITIES)) {
  const frame = fitFrame(city, cafes);
  const cacheFile = path.join(CACHE, `${city}.json`);
  let osm;
  if (CACHED) {
    // --cached never touches the network: without a download to redraw from, it says so.
    if (!existsSync(cacheFile)) throw new Error(`${city}: no cached download; run without --cached`);
    osm = JSON.parse(readFileSync(cacheFile, "utf8"));
    // A re-fitted frame must not reach past the ground that was downloaded.
    const [s, w, n, e] = bboxOf(frame, 1.0);
    const got = osm.bbox;
    if (!got || s < got[0] || w < got[1] || n > got[2] || e > got[3]) throw new Error(`${city}: the frame outgrew the cached download; run without --cached`);
  } else {
    console.log(`${city}: downloading…`);
    osm = await overpass(bboxOf(frame));
    osm.bbox = bboxOf(frame, 1.08);
    writeFileSync(cacheFile, JSON.stringify(osm));
  }
  const read = osm.osm3s?.timestamp_osm_base?.slice(0, 10);
  if (!read) throw new Error(`${city}: the download carries no OpenStreetMap date (osm3s.timestamp_osm_base)`);
  osmBase = read;
  const svg = draw(frame, osm);
  writeFileSync(path.join(SVG_DIR, `${city}.svg`), svg);
  const cityCafes = cafes.filter((c) => c.city === city);
  frames[city] = { ...frame, scaleM: scaleBar(frame), cartouche: cartoucheCorner(frame, svg, cityCafes) };
  const gz = gzipSync(svg).length;
  console.log(`${city}: ${Math.round(frame.widthM)} × ${Math.round(frame.heightM)} m, cartouche ${frames[city].cartouche}, ${(svg.length / 1024).toFixed(0)} KB (${(gz / 1024).toFixed(0)} KB gzip)`);
}

const f6 = (v) => Number(v.toFixed(6));
const entries = Object.entries(frames).map(
  ([city, f]) =>
    `  ${city}: {\n    center: { lat: ${f6(f.center.lat)}, lon: ${f6(f.center.lon)} },\n    widthM: ${f.widthM},\n    heightM: ${f.heightM},\n    scaleM: ${f.scaleM},\n    cartouche: "${f.cartouche}",\n    fittedTo: [\n${f.fittedTo.map((c) => `      { id: ${JSON.stringify(c.id)}, lat: ${c.lat}, lon: ${c.lon} },`).join("\n")}\n    ],\n  },`,
);
writeFileSync(
  TS_OUT,
  `// Generated by scripts/fetch-plans.mjs (npm run assets:plans). Don't edit by hand: run the script again.
// Streets from OpenStreetMap (© OpenStreetMap contributors, ODbL), read ${osmBase}. The print of each plan is
// src/assets/plans/<city>.svg; src/lib/plan.ts puts the cafés and the guest on the same sheet.
import type { City } from "./types";

export type PlanFrame = {
  /** The sheet's centre. */
  center: { lat: number; lon: number };
  /** The ground the sheet covers, in metres (4:5). */
  widthM: number;
  heightM: number;
  /** The scale bar's length, in metres. */
  scaleM: number;
  /** The corner the cartouche sits in: clear of every café, over the least ink. */
  cartouche: "bl" | "br" | "tl" | "tr";
  /** The cafés the frame was fitted around, where they stood (src/lib/plan.test.ts fails when one moves). */
  fittedTo: readonly { id: string; lat: number; lon: number }[];
};

/** The sheet in SVG units. */
export const PLAN_VB = { w: ${VB.w}, h: ${VB.h} } as const;

export const planFrames: Record<City, PlanFrame> = {
${entries.join("\n")}
};
`,
);
console.log(`wrote ${path.relative(ROOT, TS_OUT)} and src/assets/plans/*.svg`);
