// Headless screenshot helper for visual QA (independent of the shared Playwright MCP browser).
// Usage: node scripts/shot.mjs <selector|full|viewport> <out.png> [width=1440] [height=900] [--reduced] [--nojs] [--wait=ms] [--scroll=selector] [--loader]
//   --loader  keep the loading screen (skipped by default, so a shot shows the page, not the loader)
//   selector  e.g. "#kofe" → screenshot of that element (scrolled into view, animations settled)
// Output goes under .playwright-mcp/shots/ unless an absolute path is given.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";

const [target = "viewport", outArg = "shot.png", w = "1440", h = "900", ...flags] = process.argv.slice(2);
const flag = (n) => flags.find((f) => f.startsWith(`--${n}`));
const wait = Number(flag("wait")?.split("=")[1] ?? 1600);
const url = flag("url")?.split("=").slice(1).join("=") ?? "http://localhost:3000/";

const EXE = process.env.KD_CHROME ?? "C:/Users/omarh/AppData/Local/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-win64/chrome-headless-shell.exe";
const outDir = ".playwright-mcp/shots";
mkdirSync(outDir, { recursive: true });
const out = path.isAbsolute(outArg) ? outArg : path.join(outDir, outArg);

const browser = await chromium.launch({ executablePath: EXE });
const ctx = await browser.newContext({
  viewport: { width: Number(w), height: Number(h) },
  deviceScaleFactor: 1,
  reducedMotion: flag("reduced") ? "reduce" : "no-preference",
  javaScriptEnabled: !flag("nojs"),
  locale: "ru-RU",
  timezoneId: "Europe/Moscow",
});
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
page.on("console", (m) => { if (m.type() === "error" && !/WebSocket|favicon/.test(m.text())) errors.push(`console: ${m.text().slice(0, 300)}`); });
await page.addInitScript((loader) => {
  try {
    sessionStorage.setItem("kd-intro", "1");
    if (!loader) sessionStorage.setItem("kd-loader", "off");
  } catch {}
}, Boolean(flag("loader")));
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(400);

if (target === "full") {
  // Scroll through so scroll-triggered reveals fire, then back to top.
  const H = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += Number(h) * 0.6) { await page.evaluate((yy) => window.scrollTo(0, yy), y); await page.waitForTimeout(250); }
  await page.waitForTimeout(wait);
  await page.screenshot({ path: out, fullPage: true });
} else if (target === "viewport") {
  await page.waitForTimeout(wait);
  await page.screenshot({ path: out });
} else {
  const el = page.locator(target).first();
  await el.scrollIntoViewIfNeeded();
  await page.evaluate((sel) => { const e = document.querySelector(sel); if (e) window.scrollTo(0, e.getBoundingClientRect().top + window.scrollY - 40); }, target);
  await page.waitForTimeout(wait);
  await el.screenshot({ path: out });
}
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
console.log(JSON.stringify({ out, horizontalOverflow: overflow, errors }));
await browser.close();
