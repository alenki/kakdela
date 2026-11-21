// Throwaway: the midnight chimes with a fake clock, and reduced motion.
import { chromium } from "playwright";
const EXE = "C:/Users/omarh/AppData/Local/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-win64/chrome-headless-shell.exe";
const b = await chromium.launch({ executablePath: EXE });

{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: "ru-RU", timezoneId: "Europe/Moscow" });
  const p = await ctx.newPage();
  const errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  // 23:59:30 Moscow time on 31 December.
  await p.clock.install({ time: new Date(Date.UTC(2026, 11, 31, 20, 59, 30)) });
  await p.addInitScript(() => {
    window.__strokes = [];
    window.addEventListener("kd:chimes", (e) => window.__strokes.push(e.detail.stroke));
  });
  await p.goto("http://localhost:3000/", { waitUntil: "domcontentloaded" });
  await p.clock.runFor(4000);
  console.log("before:", await p.evaluate(() => document.documentElement.dataset.season), "greeting:", await p.evaluate(() => [...document.querySelectorAll("#hero .xm-greet")].find((e) => getComputedStyle(e).display !== "none")?.textContent));
  await p.clock.runFor(30_000);
  console.log("strokes at 00:00:04:", JSON.stringify(await p.evaluate(() => window.__strokes)));
  await p.clock.runFor(40_000);
  console.log("strokes after:", JSON.stringify(await p.evaluate(() => window.__strokes)));
  console.log("after:", await p.evaluate(() => document.documentElement.dataset.season), "greeting:", await p.evaluate(() => [...document.querySelectorAll("#hero .xm-greet")].find((e) => getComputedStyle(e).display !== "none")?.textContent));
  console.log("errors", JSON.stringify(errors));
  await ctx.close();
}
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, locale: "ru-RU", timezoneId: "Europe/Moscow", reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.goto("http://localhost:3000/", { waitUntil: "networkidle" });
  await p.waitForTimeout(2500);
  const s = await p.evaluate(() => ({
    motion: document.documentElement.dataset.motion,
    garland: document.querySelectorAll(".xm-bulb").length,
    on: document.querySelector(".xm-garland")?.hasAttribute("data-lit") || document.querySelector(".xm-garland")?.hasAttribute("data-on"),
    glassFill: getComputedStyle(document.querySelector(".xm-bulb__glass")).fill,
    snowFalling: document.querySelector(".xm-snow")?.hasAttribute("data-on"),
    flakeTakesHand: getComputedStyle(document.querySelector(".xm-flake")).pointerEvents,
  }));
  console.log("reduced:", JSON.stringify(s));
  await p.evaluate(() => document.getElementById("footer").scrollIntoView());
  await p.waitForTimeout(1500);
  console.log("reduced drift:", await p.evaluate(() => !!document.querySelector(".xm-drift")));
  await p.screenshot({ path: ".playwright-mcp/shots/xm-reduced-footer.png" });
  await ctx.close();
}
await b.close();
