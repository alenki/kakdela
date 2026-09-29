// Draws the /menu link preview (public/og/menu.jpg, 1200 × 630, see src/lib/og.ts): the page's own first screen, «Что
// будете?» over the homepage's notice turned over, beside the table with the first answer's dish under its slip.
// Rendered from the running site without JS, so it is exactly the server's page (no answer of the day, no red):
// only the header, the lead and the price switch are left out, and the small print under the dish.
// `--lang en` draws the English site's card from /en/menu, public/og/menu.en.jpg (`npm run dev` serves both).
// Usage: node scripts/make-menu-card.mjs [http://localhost:3000] [--lang en]   (a dev or production server must be
// running; KD_CHROME overrides the browser path)
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import sharp from "sharp";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const EN = process.argv.includes("--lang") && process.argv[process.argv.indexOf("--lang") + 1] === "en";
const OUT = path.join(ROOT, EN ? "public/og/menu.en.jpg" : "public/og/menu.jpg");
const BASE = process.argv.slice(2).find((a) => /^https?:/.test(a)) ?? "http://localhost:3000";
const PAGE = `${BASE}${EN ? "/en" : ""}/menu`;
const EXE = process.env.KD_CHROME ?? "C:/Users/omarh/AppData/Local/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-win64/chrome-headless-shell.exe";

const CSS = [
  ".site-header,.skip-link{display:none!important}",
  ".mn-day{padding-top:44px!important}",
  ".mn-mast .lead,.mn-prices,.mn-cap__facts{display:none!important}",
  ".mn-back{margin-top:28px!important}",
].join("");

const browser = await chromium.launch({ executablePath: EXE });
try {
  const page = await (
    await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, javaScriptEnabled: false, locale: EN ? "en-US" : "ru-RU" })
  ).newPage();
  // Without JS nothing can inject a stylesheet into the page: it goes into the HTML on its way in.
  await page.route("**/menu", async (route) => {
    const res = await route.fetch();
    const body = (await res.text()).replace("</head>", `<style>${CSS}</style></head>`);
    await route.fulfill({ response: res, body, headers: { ...res.headers(), "content-type": "text/html; charset=utf-8" } });
  });
  await page.goto(PAGE, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(1200);
  const png = await page.screenshot();
  await sharp(png).jpeg({ quality: 85, mozjpeg: true }).toFile(OUT);
  console.log(`wrote ${path.relative(ROOT, OUT)}`);
} finally {
  await browser.close();
}
