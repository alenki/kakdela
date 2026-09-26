// Lab performance probe against a running production server (npm run build && npm start).
// Usage: node scripts/perf.mjs [url=http://localhost:3100/] [--mobile]
// Reports transferred bytes by type, LCP (element + time), CLS, long tasks; mobile = 390×844,
// 4× CPU slowdown and a "fast 4G" network profile.
import { chromium } from "playwright";

const url = process.argv.find((a) => a.startsWith("http")) ?? "http://localhost:3100/";
const mobile = process.argv.includes("--mobile");
const EXE = process.env.KD_CHROME ?? "C:/Users/omarh/AppData/Local/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-win64/chrome-headless-shell.exe";

const browser = await chromium.launch({ executablePath: EXE });
const ctx = await browser.newContext({
  viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
  deviceScaleFactor: mobile ? 3 : 1,
  isMobile: mobile,
  hasTouch: mobile,
  locale: "ru-RU",
  timezoneId: "Europe/Moscow",
});
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
if (mobile) {
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (9 * 1024 * 1024) / 8, uploadThroughput: (1.5 * 1024 * 1024) / 8 });
}
await page.addInitScript(() => {
  window.__lcp = null;
  window.__cls = 0;
  window.__long = 0;
  new PerformanceObserver((l) => {
    for (const e of l.getEntries()) window.__lcp = { t: Math.round(e.startTime), el: e.element ? `${e.element.tagName.toLowerCase()}.${String(e.element.className).slice(0, 40)}` : null, size: e.size };
  }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long += e.duration - 50; }).observe({ type: "longtask", buffered: true });
});
const bytes = {};
page.on("response", async (r) => {
  try {
    const len = Number(r.headers()["content-length"] ?? (await r.body()).length);
    const type = r.request().resourceType();
    bytes[type] = (bytes[type] ?? 0) + len;
  } catch {}
});
const t0 = Date.now();
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const m = await page.evaluate(() => ({ lcp: window.__lcp, cls: Number(window.__cls.toFixed(4)), longTaskOverMs: Math.round(window.__long) }));
const fontBytes = await page.evaluate(() => performance.getEntriesByType("resource").filter((e) => e.initiatorType === "css" || /\.woff2/.test(e.name)).filter((e) => /\.woff2/.test(e.name)).reduce((s, e) => s + (e.transferSize || e.encodedBodySize || 0), 0));
const jsEntries = await page.evaluate(() => performance.getEntriesByType("resource").filter((e) => /\.js/.test(e.name)).map((e) => ({ n: e.name.split("/").pop(), kb: Math.round((e.encodedBodySize || 0) / 1024) })));
console.log(JSON.stringify({ mode: mobile ? "mobile(4xCPU, fast4G)" : "desktop", loadMs: Date.now() - t0, ...m, fontKB: Math.round(fontBytes / 1024), transferKB: Object.fromEntries(Object.entries(bytes).map(([k, v]) => [k, Math.round(v / 1024)])), jsFiles: jsEntries.length, jsKB: jsEntries.reduce((s, e) => s + e.kb, 0) }, null, 1));
await browser.close();
