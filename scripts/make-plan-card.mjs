// Draws the /locations link preview (src/app/locations/opengraph-image.jpg, 1200 × 630): the page's first screen
// in small, «Где встретимся?» beside the Nalchik plan on its paper. What a friend sees in the chat under
// «Встретимся в «Как дела?» на …?». No mark is red: one card goes with every invitation, to any of the nine. Rendered in headless Chromium so the type is the
// site's own (Sofia Sans Extra Condensed, Montserrat, from Google Fonts).
// Usage: node scripts/make-plan-card.mjs   (after npm run assets:plans; KD_CHROME overrides the browser path)
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { projectOn } from "../src/lib/plan-projection.ts";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "src/app/locations/opengraph-image.jpg");
const EXE = process.env.KD_CHROME ?? "C:/Users/omarh/AppData/Local/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-win64/chrome-headless-shell.exe";
const file = (rel) => pathToFileURL(path.join(ROOT, rel)).href;

// The Nalchik sheet's frame and its cafés, from the generated data and the site's own.
const plans = readFileSync(path.join(ROOT, "src/content/plans.ts"), "utf8");
const block = plans.slice(plans.indexOf("  nalchik: {"));
const frame = {
  center: { lat: Number(/lat: ([\d.]+)/.exec(block)[1]), lon: Number(/lon: ([\d.]+)/.exec(block)[1]) },
  widthM: Number(/widthM: ([\d.]+)/.exec(block)[1]),
};
const all = [...readFileSync(path.join(ROOT, "src/content/cafes.ts"), "utf8").matchAll(/id: "([^"]+)", city: "(\w+)"[\s\S]*?coords: \{ lat: ([\d.]+), lon: ([\d.]+) \}/g)];
// The card says «Девять кофеен»: a tenth café must change its words before it can be drawn.
if (all.length !== 9) throw new Error(`The card says nine cafés, cafes.ts has ${all.length}: update its line first`);
const cafes = all
  .filter((m) => m[2] === "nalchik")
  .map((m) => projectOn(frame, { w: 1000, h: 1250 }, { lat: Number(m[3]), lon: Number(m[4]) }));

const marks = cafes
  .map((p, i) => `<span class="mk" style="left:${(p.x / 10).toFixed(2)}%;top:${(p.y / 12.5).toFixed(2)}%">${i + 1}</span>`)
  .join("");

const html = `<!doctype html><html lang="ru"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Montserrat:wght@500&family=Sofia+Sans+Extra+Condensed:wght@860&display=block&subset=cyrillic">
<style>
html,body{margin:0}
body{width:1200px;height:630px;overflow:hidden;position:relative;background:#f3ebdc;color:#141210;font-family:Montserrat,sans-serif}
body::before{content:"";position:absolute;inset:0;background:url("${file("public/tex/grain-light.png")}") 0 0/128px 128px;opacity:.3}
.words{position:absolute;left:64px;top:118px;width:560px}
h1{margin:0;font:860 118px/.9 "Sofia Sans Extra Condensed",sans-serif;text-transform:uppercase;letter-spacing:-.01em}
p{margin:34px 0 0;font:500 27px/1.4 Montserrat,sans-serif;color:#4a4540;max-width:520px}
.sheet{position:absolute;left:660px;top:46px;width:480px;padding:14px 14px 0;background:url("${file("public/tex/paper.png")}") 0 0/256px 256px,#fff8ee;border:1px solid rgb(20 18 16/.14);box-shadow:5px 6px 1px rgb(92 62 30/.16)}
.map{position:relative;aspect-ratio:4/5}
.map::after{content:"";position:absolute;inset:0;border:1px solid #141210}
.map img{position:absolute;inset:0;width:100%;height:100%}
.mk{position:absolute;width:26px;height:26px;translate:-50% -50%;border-radius:50%;background:#141210;color:#fff8ee;box-shadow:0 0 0 2px #fff8ee;display:grid;place-items:center;font:860 17px/1 "Sofia Sans Extra Condensed",sans-serif;padding-top:2px;box-sizing:border-box}
.foot{height:34px}
</style></head><body>
<div class="words"><h1>Где встретимся?</h1><p>Девять кофеен «Как&nbsp;дела?» в&nbsp;Нальчике и&nbsp;Владикавказе</p></div>
<div class="sheet"><div class="map"><img src="${file("src/assets/plans/nalchik.svg")}" alt="">${marks}</div><div class="foot"></div></div>
</body></html>`;

const dir = mkdtempSync(path.join(tmpdir(), "kd-card-"));
const page0 = path.join(dir, "card.html");
writeFileSync(page0, html);
const browser = await chromium.launch({ executablePath: EXE });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(pathToFileURL(page0).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);
// JPEG: the paper and the grain are noise a PNG pays dearly for.
await page.screenshot({ path: OUT, type: "jpeg", quality: 86 });
await browser.close();
console.log(`wrote ${path.relative(ROOT, OUT)}`);
