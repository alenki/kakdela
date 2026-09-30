# Runner Touch Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the runner playable on a phone: two thumb pads under the field, the note and the buttons above it, and no pause from a stray press.

**Architecture:** The island (`RunnerIsland.tsx`) renders the pads (hidden by CSS unless `pointer: coarse`); the controller (`runner-controller.ts`) routes pad presses into the same input sets as the field, lights the pads from the input state, and replaces the button-only focus exemption with a press classifier (in the game / a near miss / away). CSS reorders the block on touch screens and shrinks the field's room so everything fits. The engine only loses `touchZone`.

**Tech Stack:** Next 16 (React 19 client island), plain DOM controller, CSS in `src/styles/sections/game.css`, Vitest (node) for the engine, Playwright (headless shell) for a scripted browser check.

**House rules:** several sessions share this tree: no commits (the user commits), announce shared files (done: `kakdela-07` confirmed it isn't in them). No em dashes anywhere. Don't restart the dev server on :3000.

Spec: `docs/superpowers/specs/2026-09-30-runner-touch-controls-design.md`.

---

## File map

| File | Change |
|---|---|
| `<scratchpad>/runner-touch-check.mjs` | New: the browser check (touch phone, phone on its side, desktop, the 404). Not in the repo. |
| `src/lib/runner.ts` | Remove `touchZone`. |
| `src/lib/runner.test.ts` | Remove `touchZone`'s import and two tests; `jitterBot` loses `via`. |
| `src/i18n/ru.ts`, `src/i18n/en.ts` | `hintTouch` out; `jump`, `duck` in (game block only). |
| `src/components/game/RunnerIsland.tsx` | Pads markup, note without the hint, early start from «Прыжок». |
| `src/components/game/runner-controller.ts` | Pads input and feedback, the field jumps anywhere, press classifier, block-fitting start scroll. |
| `src/styles/sections/game.css` | `--runner-w`, the touch layout, the pads. |
| `docs/CONVENTIONS.md` | «The runner»: touch and pausing bullets. |

---

### Task 1: The browser check (red first)

**Files:**
- Create: `C:/Users/omarh/AppData/Local/Temp/claude/E--Desktop-PC-WORK-Web-Development-kakdela/5881cfe3-27bf-491e-a054-f0c1d0ba89fb/scratchpad/runner-touch-check.mjs`

- [x] **Step 1: Write the check**

```js
// Runner touch-controls check (2026-09-30): the pads, the row above the field, and presses that must not
// pause, on an emulated phone (upright and on its side), on a desktop and on the 404, against :3000.
// Run: node runner-touch-check.mjs   (SHOTS=<dir> also saves screenshots). Exits 1 on any FAIL.
import { createRequire } from "node:module";
const { chromium } = createRequire("E:/Desktop/PC/WORK/Web Development/kakdela/package.json")("playwright");

const EXE = "C:/Users/omarh/AppData/Local/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-win64/chrome-headless-shell.exe";
const BASE = process.env.BASE ?? "http://localhost:3000";
const SHOTS = process.env.SHOTS ?? "";
const G = "#igra .runner";
const S = {
  frame: `${G} .runner__frame`,
  stage: `${G} .runner__stage`,
  foot: `${G} .runner__foot`,
  note: `${G} .runner__note`,
  main: `${G} .runner__actions .btn:last-child`,
  pads: `${G} .runner__pads`,
  duck: `${G} [data-pad="duck"]`,
  jump: `${G} [data-pad="jump"]`,
};

let failed = 0;
const check = (name, ok, extra = "") => {
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${extra === "" ? "" : `  [${extra}]`}`);
  if (!ok) failed++;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ executablePath: EXE });

async function open(viewport, touch, path = "/", scope = G) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2, isMobile: touch, hasTouch: touch, locale: "ru-RU", timezoneId: "Europe/Moscow" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("kd-intro", "1");
      localStorage.removeItem("kd-runner");
    } catch {}
  });
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.evaluate((s) => document.querySelector(s).scrollIntoView({ block: "center" }), scope);
  await page.waitForFunction((s) => document.querySelector(s)?.hasAttribute("data-ready"), scope);
  await sleep(800); // the controller's chunk
  const cdp = touch ? await ctx.newCDPSession(page) : null;
  return { ctx, page, cdp, errors };
}

const state = (page) => page.evaluate((s) => document.querySelector(s).dataset.state, G);
const box = (page, sel) =>
  page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el || getComputedStyle(el).display === "none") return null;
    const r = el.getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height, top: r.top, bottom: r.bottom, left: r.left, right: r.right };
  }, sel);
const tap = (page, x, y) => page.touchscreen.tap(x, y);
const tapIn = async (page, sel) => {
  const b = await box(page, sel);
  await page.touchscreen.tap(b.x + b.w / 2, b.y + b.h / 2);
};
const waitState = (page, want, timeout = 2500) =>
  page.waitForFunction(([s, w]) => document.querySelector(s).dataset.state === w, [G, want], { timeout }).then(() => true, () => false);
const isDown = (page, sel) => page.evaluate((s) => document.querySelector(s).hasAttribute("data-down"), sel);
/** Opaque canvas pixels in the cup's column (world x 68 to 82), between two heights above the floor. */
const cupInk = (page, y0, y1) =>
  page.evaluate(([s, y0, y1]) => {
    const c = document.querySelector(s);
    const w = c.clientWidth, h = c.clientHeight, k = c.width / w;
    const scale = Math.max(w / 640, h / 217), ground = h - 18 * scale;
    const x0 = Math.round(68 * scale * k), x1 = Math.round(82 * scale * k);
    const top = Math.round((ground - y1 * scale) * k), bottom = Math.round((ground - y0 * scale) * k);
    const d = c.getContext("2d").getImageData(x0, top, Math.max(1, x1 - x0), Math.max(1, bottom - top)).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
    return n;
  }, [`${G} .runner__canvas`, y0, y1]);
const shot = async (page, name) => {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png` });
};

/* ───── A phone held upright ───── */
{
  const { ctx, page, cdp, errors } = await open({ width: 390, height: 844 }, true);
  const frame = await box(page, S.frame), foot = await box(page, S.foot), pads = await box(page, S.pads);
  check("phone: the note and the buttons sit above the field", foot.bottom <= frame.top + 0.5, `${foot.bottom} vs ${frame.top}`);
  check("phone: the pads sit under the field", !!pads && pads.top >= frame.bottom, pads ? `${pads.top} vs ${frame.bottom}` : "no pads");
  if (!pads) {
    // The old layout: show the stray-press bug, then stop.
    await tapIn(page, S.main);
    await waitState(page, "running");
    await sleep(900);
    const m = await box(page, S.main);
    await tap(page, m.x - 24, m.y + m.h / 2);
    await sleep(250);
    check("phone: a tap beside «Пауза» doesn't pause", (await state(page)) === "running", await state(page));
    await browser.close();
    console.log(`\n${failed} FAILED`);
    process.exit(1);
  }
  const duck = await box(page, S.duck), jump = await box(page, S.jump);
  check("phone: «Пригнуться» on the left, «Прыжок» on the right", duck.right <= jump.left);
  check("phone: the row above the field is 48px", Math.abs(foot.h - 48) < 1, foot.h);
  check("phone: the pads are 56 to 96px tall", pads.h >= 56 && pads.h <= 96, pads.h);
  await shot(page, "phone-idle");

  await tapIn(page, S.jump);
  check("phone: «Прыжок» starts a run", await waitState(page, "running", 1500));
  await sleep(900);
  const f1 = await box(page, S.frame), p1 = await box(page, S.pads);
  check("phone: the cup stands", (await cupInk(page, 14, 32)) > 0);

  // Stray presses in and around the game, before the first stool arrives (about 2 s in).
  const m = await box(page, S.main), n = await box(page, S.note), pd = await box(page, S.pads);
  for (const [name, x, y] of [
    ["beside «Пауза»", m.x - 24, m.y + m.h / 2],
    ["at the left of the row", n.x + 8, m.y + m.h / 2],
    ["between the pads", pd.x + pd.w / 2, pd.y + pd.h / 2],
    ["just under the pads", pd.x + pd.w * 0.75, pd.bottom + 10],
  ]) {
    await tap(page, x, y);
    await sleep(120);
    const s = await state(page);
    check(`phone: a tap ${name} doesn't pause`, s === "running", s);
  }
  await shot(page, "phone-running");

  await tapIn(page, S.jump);
  await sleep(90);
  check("phone: «Прыжок» jumps", (await cupInk(page, 14, 32)) === 0);

  // The first stool ends the run: the layout holds, and so does the restart lock.
  check("phone: the run ends at the first stool", await waitState(page, "over", 4000));
  await sleep(50);
  await tapIn(page, S.jump);
  await sleep(150);
  check("phone: «Прыжок» pressed at the crash doesn't restart", (await state(page)) === "over");
  const f2 = await box(page, S.frame), p2 = await box(page, S.pads), foot2 = await box(page, S.foot);
  check("phone: nothing moves when the run ends", f2.top === f1.top && p2.top === p1.top && Math.abs(foot2.h - 48) < 1, `${f1.top}->${f2.top} ${p1.top}->${p2.top} row ${foot2.h}`);
  check("phone: the note says so", /опрокинулся|рекорд/i.test(await page.textContent(S.note)), await page.textContent(S.note));
  await shot(page, "phone-over");
  await sleep(600);
  await tapIn(page, S.jump);
  check("phone: «Прыжок» plays again after the lock", await waitState(page, "running", 1500));
  await sleep(900);

  const d = await box(page, S.duck);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: d.x + d.w / 2, y: d.y + d.h / 2, id: 7 }] });
  await sleep(200);
  const held = await isDown(page, S.duck);
  const ducked = (await cupInk(page, 24, 36)) === 0 && (await cupInk(page, 3, 14)) > 0;
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await sleep(150);
  check("phone: «Пригнуться» shows held", held);
  check("phone: «Пригнуться» ducks while held", ducked);
  check("phone: the cup stands up on release", (await cupInk(page, 24, 36)) > 0);
  check("phone: the pad lets go on release", !(await isDown(page, S.duck)));

  await tapIn(page, S.main);
  check("phone: «Пауза» pauses", await waitState(page, "paused", 1000));
  const f3 = await box(page, S.frame), p3 = await box(page, S.pads);
  check("phone: nothing moves on pause", f3.top === f1.top && p3.top === p1.top, `${f3.top} ${p3.top}`);
  await shot(page, "phone-paused");
  await tapIn(page, S.duck);
  await sleep(200);
  check("phone: «Пригнуться» doesn't continue a paused run", (await state(page)) === "paused");
  await tapIn(page, S.jump);
  check("phone: «Прыжок» continues", await waitState(page, "running", 1500));
  await sleep(300);

  await page.evaluate(() => {
    const b = document.createElement("button");
    b.id = "probe-out";
    b.textContent = "probe";
    b.style.cssText = "position:fixed;left:8px;top:120px;z-index:9999;min-height:48px";
    document.body.append(b);
  });
  await tapIn(page, "#probe-out");
  check("phone: a button off the game pauses", await waitState(page, "paused", 1000), await state(page));
  await page.evaluate(() => document.querySelector("#probe-out").remove());

  await tapIn(page, S.jump);
  await waitState(page, "running", 1500);
  await sleep(300);
  for (let i = 0; i < 6 && (await page.evaluate((s) => document.querySelector(s).contains(document.activeElement), G)); i++) await page.keyboard.press("Tab");
  check("phone: Tab away pauses", await waitState(page, "paused", 1000), await state(page));
  check("phone: no page errors", errors.length === 0, errors.join(" | "));
  await ctx.close();
}

/* ───── A phone on its side ───── */
{
  const { ctx, page } = await open({ width: 844, height: 390 }, true);
  await tapIn(page, S.jump);
  await waitState(page, "running", 1500);
  await sleep(900);
  const root = await box(page, G), stage = await box(page, S.stage);
  const header = await page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")));
  check("phone on its side: the whole game fits under the header", root.top >= header - 1 && root.bottom <= 391, `${root.top}..${root.bottom}`);
  check("phone on its side: the field keeps 3:1", Math.abs(stage.w / stage.h - 3) < 0.02, (stage.w / stage.h).toFixed(3));
  await shot(page, "phone-side-running");
  await ctx.close();
}

/* ───── A desktop with a mouse ───── */
{
  const { ctx, page, errors } = await open({ width: 1440, height: 900 }, false);
  const frame = await box(page, S.frame), foot = await box(page, S.foot);
  check("desktop: no pads", (await box(page, S.pads)) === null);
  check("desktop: the note and the buttons stay under the field", foot.top >= frame.bottom);
  await shot(page, "desktop-idle");
  await page.click(S.main);
  await waitState(page, "running", 1500);
  await sleep(900);
  const m = await box(page, S.main);
  await page.mouse.click(m.x - 40, m.y + m.h / 2);
  await sleep(150);
  check("desktop: a click beside «Пауза» doesn't pause", (await state(page)) === "running", await state(page));
  await page.keyboard.press("ArrowUp");
  await sleep(90);
  check("desktop: the keys still jump after it", (await cupInk(page, 14, 32)) === 0);
  await sleep(700);
  const stage = await box(page, S.stage);
  await page.mouse.click(4, stage.y + stage.h / 2);
  check("desktop: a click off the game pauses", await waitState(page, "paused", 1000), await state(page));
  check("desktop: no page errors", errors.length === 0, errors.join(" | "));
  await ctx.close();
}

/* ───── The 404 on a phone ───── */
{
  const scope = ".not-found__game .runner";
  const { ctx, page } = await open({ width: 390, height: 844 }, true, "/delivery", scope);
  check("404 phone: the pads show", !!(await box(page, `${scope} .runner__pads`)));
  await shot(page, "phone-404");
  await ctx.close();
}

await browser.close();
console.log(failed ? `\n${failed} FAILED` : "\nALL PASS");
process.exit(failed ? 1 : 0);
```

- [x] **Step 2: Run it against the current code and watch it fail**

Run: `node <scratchpad>/runner-touch-check.mjs`
Expected: `FAIL phone: the note and the buttons sit above the field`, `FAIL phone: the pads sit under the field [no pads]`, `FAIL phone: a tap beside «Пауза» doesn't pause [paused]`, exit 1.

### Task 2: The engine loses `touchZone`

**Files:**
- Modify: `src/lib/runner.ts:438-441`
- Modify: `src/lib/runner.test.ts` (import at line 15, `jitterBot` at 100-129, tests at 471-472 and 621-626)

- [x] **Step 1: Remove the function** (the last lines of `runner.ts`):

```ts
/** Touch: a press in the lower third of the stage (the floor) ducks; anywhere above it jumps. */
export function touchZone(yInStage: number, stageH: number): "jump" | "duck" {
  return yInStage >= (stageH * 2) / 3 ? "duck" : "jump";
}
```

- [x] **Step 2: Update the tests.** Drop `touchZone,` from the import list. `jitterBot` becomes:

```ts
function jitterBot(seed: number): Bot {
  const rnd = mulberry32(seed ^ 0x9e3779b9);
  const frac = new Map<number, number>();
  const duckAt = new Map<number, number>();
  const pressed = new Set<number>();
  return (run, input) => {
    input.duck = false;
    const tab = ahead(run, (o) => o.kind === "tab");
    if (tab) {
      if (!duckAt.has(tab.id)) duckAt.set(tab.id, 0.08 + rnd() * 0.22);
      const toArrive = (extent(tab).x0 - WORLD.standFront) / (run.v * tab.k);
      if (toArrive <= duckAt.get(tab.id)!) input.duck = true;
    }
    const o = ahead(run, (o) => o.kind !== "tab" && o.kind !== "plane");
    if (!o || pressed.has(o.id) || run.v <= 0) return;
    if (!frac.has(o.id)) frac.set(o.id, 0.2 + rnd() * 0.6);
    const e = extent(o), u = run.v * o.k, a = rise(e.top);
    const arrive = (e.x0 - WORLD.standFront) / u, leave = (e.x1 - CUP_BACK) / u;
    const lo = leave - AIRTIME + a, hi = arrive - a;
    if (lo + frac.get(o.id)! * (hi - lo) <= 0) {
      input.jumpPress = true;
      pressed.add(o.id);
    }
  };
}
```

Delete `it("is cleared through the touch zones", ...)` and `it("ducks from the lower third, jumps above it", ...)`.

- [x] **Step 3: Run the engine tests**

Run: `npx vitest run src/lib/runner.test.ts`
Expected: all pass (two fewer tests than before).

### Task 3: The words

**Files:** `src/i18n/ru.ts` (game block), `src/i18n/en.ts` (game block). Re-read each file right before editing (another session edits other blocks).

- [x] **Step 1: ru.ts.** Replace the `hintTouch` line with:

```ts
    // The two pads under the field on a touch screen (hidden from screen readers: the keys are the controls there).
    jump: "Прыжок",
    duck: "Пригнуться",
```

- [x] **Step 2: en.ts.** Replace the `hintTouch` line with:

```ts
    jump: "Jump",
    duck: "Duck",
```

### Task 4: The island's markup

**Files:** Modify `src/components/game/RunnerIsland.tsx`.

- [x] **Step 1:** Imports: `import { NBSP } from "@/lib/typograf";` (typograf itself is no longer used). Add, above `RunnerIsland`:

```tsx
/** A pad's arrow, drawn in the text colour. */
function PadArrow({ down = false }: { down?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <path d={down ? "M8 2.5v11M3.5 9L8 13.5L12.5 9" : "M8 13.5v-11M3.5 7L8 2.5L12.5 7"} />
    </svg>
  );
}
```

- [x] **Step 2:** `const padsRef = useRef<HTMLDivElement>(null);`; in the effect `const root = rootRef.current!, stage = stageRef.current!, pads = padsRef.current!;`; pass `pads` to `mountRunner`; add the early start from «Прыжок»:

```tsx
    // Before the controller arrives, a click on the stage or on «Прыжок», or Space/Enter released on the
    // stage, queues a start.
    const early = (e: Event) => {
      if (handle) return;
      if (e.type === "click" || ((e as KeyboardEvent).code === "Space" || (e as KeyboardEvent).code === "Enter")) ctlRef.current?.start();
    };
    const earlyPad = (e: MouseEvent) => {
      if (!handle && (e.target as Element | null)?.closest('[data-pad="jump"]')) ctlRef.current?.start();
    };
```

with `pads.addEventListener("click", earlyPad);` and its removal in the cleanup.

- [x] **Step 3:** Between the frame and the foot:

```tsx
      {/* On a touch screen (CSS) the thumbs play here, under the field, so nothing covers the game. The
          pads double the stage's keys, which stay the accessible controls. */}
      <div ref={padsRef} className="runner__pads" aria-hidden="true">
        <div className="runner__pad" data-pad="duck">
          <PadArrow down />
          {t.game.duck}
        </div>
        <div className="runner__pad" data-pad="jump">
          <PadArrow />
          {t.game.jump}
        </div>
      </div>

      {/* On a touch screen (CSS) the note and the buttons move above the field, out of the thumbs' way. */}
```

and the note becomes:

```tsx
        <p id={noteId} className="runner__note label">
          {phase === "paused" ? t.game.paused : phase === "over" ? (isNew ? t.game.newBest : t.game.over) : null}
        </p>
```

### Task 5: The controller

**Files:** Modify `src/components/game/runner-controller.ts`.

- [x] **Step 1: Imports and constants.** Drop `touchZone` from the engine import. Add under `DUCK_KEYS`:

```ts
/** What a guest can use on the page: a press on one of these, off the game, leaves it. */
const USABLE =
  'a[href], button, input, select, textarea, summary, label, iframe, [contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex^="-"])';
```

`mountRunner` takes `pads: HTMLElement` (after `canvas`), destructured with the others.

- [x] **Step 2: Input state and pad feedback.** After `const input = ...`:

```ts
  const duckPad = pads.querySelector<HTMLElement>('[data-pad="duck"]');
  const jumpPad = pads.querySelector<HTMLElement>('[data-pad="jump"]');
```

and the input helpers become:

```ts
  let keyDuck = false;
  const duckPointers = new Set<number>();
  /** Jump keys and fingers still down: holding one keeps the cup jumping. */
  const jumpKeys = new Set<string>();
  const jumpPointers = new Set<number>();
  /** A pad shows held while its input is on, whatever holds it: the pad, the field (a jump) or a key. */
  const syncPads = () => {
    duckPad?.toggleAttribute("data-down", input.duck);
    jumpPad?.toggleAttribute("data-down", !!input.jumpHeld);
  };
  const syncJumpHeld = () => {
    input.jumpHeld = jumpKeys.size > 0 || jumpPointers.size > 0;
    syncPads();
  };
  const syncDuck = () => {
    input.duck = keyDuck || duckPointers.size > 0;
    syncPads();
  };
  let down: { code: string; epoch: number; at: number } | null = null;
  let pointerDownAt = -Infinity;
```

(`pointerInside` goes.) `clearInputs` calls `syncPads()` before `releaseAll`. In `onKeyDown` the duck branch is `if (begun) { keyDuck = true; syncDuck(); }`; in `onKeyUp` it is `keyDuck = false; syncDuck();`.

- [x] **Step 3: The start scroll fits the whole block.**

```ts
    // Fit the whole game (the field, the note and the buttons, and on a touch screen the pads) between
    // the header and the bottom of the screen; if it can't all fit, the field's top goes just under the
    // header.
    const top = headerHeight() + 12, bottom = window.innerHeight - 12;
    const block = root.getBoundingClientRect();
    const field = (stage.parentElement ?? stage).getBoundingClientRect().top;
    const a = block.top, b = block.bottom;
    const d = b - a > bottom - top ? field - top : a < top ? a - top : b > bottom ? b - bottom : 0;
```

- [x] **Step 4: Presses.** Replace `onPointerDown`, `onPointerEnd` and `onClick` with:

```ts
  /* ───── Presses: the field and the pads ───── */

  /**
   * A press during a run: a jump (held, the cup jumps again on each landing) or a duck while held. The
   * pressed element takes the pointer, so a thumb that slides off keeps its press.
   */
  const hold = (e: PointerEvent, el: HTMLElement, action: "jump" | "duck") => {
    e.preventDefault();
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* the pointer may already be gone */
    }
    if (action === "duck") {
      duckPointers.add(e.pointerId);
      syncDuck();
    } else {
      input.jumpPress = true;
      jumpPointers.add(e.pointerId);
      syncJumpHeld();
    }
  };

  // The field jumps wherever it is pressed: ducking is the pad's job (or the keys').
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointerDownAt = performance.now();
    if (document.activeElement !== stage) stage.focus({ preventScroll: true });
    if (phase === "running" && begun) hold(e, stage, "jump");
  };

  const padOf = (e: Event) => (e.target as Element | null)?.closest<HTMLElement>("[data-pad]") ?? null;
  const onPadDown = (e: PointerEvent) => {
    const pad = padOf(e);
    if (!pad || (e.pointerType === "mouse" && e.button !== 0)) return;
    pointerDownAt = performance.now();
    if (phase !== "running" || !begun) return;
    if (document.activeElement !== stage) stage.focus({ preventScroll: true }); // the keys stay with the game
    hold(e, pad, pad.dataset.pad === "duck" ? "duck" : "jump");
  };

  const onPointerEnd = (e: PointerEvent) => {
    if (jumpPointers.delete(e.pointerId)) syncJumpHeld();
    if (!duckPointers.delete(e.pointerId)) return;
    syncDuck();
    if (e.type !== "pointerup" && duckPointers.size === 0 && run) releaseAll(run);
  };

  // Idle, paused or over: only a click starts, so a scroll that begins on the stage never does.
  const onClick = () => {
    if (phase === "running") return;
    if (phase === "over" && pointerDownAt - crashAt < RESTART_LOCK * 1000) return;
    if (phase === "paused") resume();
    else start();
  };
  // Outside a run «Прыжок» is the field's twin; «Пригнуться» only ducks.
  const onPadClick = (e: MouseEvent) => {
    if (padOf(e)?.dataset.pad === "jump") onClick();
  };
  // A field or a pad held mid-run never opens the long-press menu.
  const onContextMenu = (e: Event) => {
    if (phase === "running") e.preventDefault();
  };
```

- [x] **Step 5: Auto-pause.** Replace `onRootFocusOut`, `onRootPointerDown`, `onWindowPointerDown`, `clearPointerInside` and `onWindowClick` with:

```ts
  /**
   * Where the press in progress began: in the game; off it on nothing a guest can use (a finger's or a
   * pen's near miss); or on something else, and any mouse press off the game. Null while no press is on
   * (the keyboard or a script moves the focus). Kept until the press's click, since on iOS the focus
   * moves after the pointerup; forgotten on a cancelled press and on any key.
   */
  let press: "game" | "near" | "away" | null = null;
  const onWindowPointerDown = (e: PointerEvent) => {
    const el = e.target instanceof Element ? e.target : null;
    press = el && root.contains(el) ? "game" : e.pointerType !== "mouse" && !el?.closest(USABLE) ? "near" : "away";
  };
  const forgetPress = () => {
    press = null;
  };
  let clickTimer = 0;
  const onWindowClick = () => {
    window.clearTimeout(clickTimer);
    clickTimer = window.setTimeout(forgetPress, 0);
  };

  // Focus leaving the game (the stage and its buttons) pauses it, unless a press that isn't leaving took
  // it: one in the game (its note, its gaps, the pads; Safari drops the focus to nothing on a button it
  // clicks) or a near miss off it. Then the stage takes the keys back, so they still play.
  let refocusTimer = 0;
  const onRootFocusOut = (e: FocusEvent) => {
    const to = e.relatedTarget as Node | null;
    if (to && root.contains(to)) return;
    if (press !== "game" && press !== "near") return pause(false);
    window.clearTimeout(refocusTimer);
    refocusTimer = window.setTimeout(() => {
      const el = document.activeElement;
      if (phase === "running" && !(el && (root.contains(el) || el.closest(USABLE)))) stage.focus({ preventScroll: true });
    }, 0);
  };
```

- [x] **Step 6: Listeners.** Add, and remove in `destroy()` (plus `window.clearTimeout(refocusTimer)`):

```ts
  stage.addEventListener("contextmenu", onContextMenu);
  pads.addEventListener("pointerdown", onPadDown);
  pads.addEventListener("pointerup", onPointerEnd);
  pads.addEventListener("pointercancel", onPointerEnd);
  pads.addEventListener("lostpointercapture", onPointerEnd);
  pads.addEventListener("click", onPadClick);
  pads.addEventListener("contextmenu", onContextMenu);
  window.addEventListener("pointercancel", forgetPress);
  window.addEventListener("keydown", forgetPress, { capture: true });
```

The root's capture `pointerdown` listener goes; the window's capture `pointerdown` and `click` stay (new handlers).

### Task 6: The styles

**Files:** Modify `src/styles/sections/game.css`.

- [x] **Step 1:** `--runner-w` carries the frame's widest (12/5, 3, 4 × the room); `.runner__frame { max-width: var(--runner-w) }`. Remove `.runner__hint-touch` and its media query. `.runner:not([data-ready])` hides `.runner__pads` too. Add at the end:

```css
/* ───── Touch: the thumbs play on two pads under the field, and the note and the buttons go above it, out
   of their way: one row, a button's 48px in every state, so nothing under it moves when a run pauses or
   ends. The field keeps its ratio and shares the screen with the row, the pads and the two 12px gaps. ───── */
.runner__pads { display: none; }
@media (pointer: coarse) {
  .runner {
    --runner-pad-h: clamp(56px, 11svh, 96px);
    --runner-room: calc(100svh - var(--header-h) - 1.5rem - 48px - var(--runner-pad-h) - 24px);
    display: flex;
    flex-direction: column;
  }
  .runner__foot {
    order: -1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    min-height: 48px;
    max-width: var(--runner-w);
    margin: 0 0 12px;
  }
  /* At most two lines beside the buttons (a 320px phone, paused). */
  .runner__note {
    flex: 1 1 0;
    min-width: 0;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
  }
  .runner__actions { flex: none; flex-wrap: nowrap; }
  .runner__pads {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    max-width: var(--runner-w);
    height: var(--runner-pad-h);
    margin-top: 12px;
  }
}
.runner__pad {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5em;
  min-width: 0;
  border: 1px solid var(--line-strong);
  border-radius: 999px;
  font-family: var(--font-sans);
  font-size: 0.9375rem;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}
.runner__pad svg { flex: none; width: 1em; height: 1em; }
/* During a run the pads take every touch, and a held pad fills at once: a game control can't wait for
   the pour. */
.runner[data-state="running"] .runner__pad { touch-action: none; }
.runner__pad[data-down] { border-color: var(--fg); background: var(--fg); color: var(--bg); }
@media (forced-colors: active) {
  .runner__pad[data-down] { forced-color-adjust: none; border-color: Highlight; background: Highlight; color: HighlightText; }
}
```

### Task 7: Verify

- [x] **Step 1:** `npx vitest run` (expected: all pass), `npm run typecheck` (no errors), `npx eslint src/components/game src/lib/runner.ts src/lib/runner.test.ts` (clean).
- [x] **Step 2:** `SHOTS=<scratchpad> node <scratchpad>/runner-touch-check.mjs`: expected `ALL PASS`.
- [x] **Step 3:** Look at every screenshot (phone idle, running, paused, over; on its side; desktop; the 404).
- [x] **Step 4:** Scan every touched file for U+2014.

### Task 8: Conventions

**Files:** Modify `docs/CONVENTIONS.md` («The runner»), re-read first.

- [x] **Step 1:** After the «Reduced motion» bullet add:

```md
- **Touch:** on a touch screen (`pointer: coarse`) the thumbs play on two pads under the field, «Пригнуться» (held) on the left and «Прыжок» on the right, and the note and the buttons sit above the field in one 48px row that never changes height, out of the thumbs' way. The field itself jumps wherever it is pressed (no duck zone). Outside a run «Прыжок» starts, continues or plays again, like the field. The pads are `aria-hidden`: they double the stage's keys.
- **Pausing by itself:** a press never pauses the game unless it lands on something else to use. Presses in the game (its note, its gaps, the pads) and a finger's near miss off it don't; a link, a button or a field elsewhere does, and so does any mouse click off the game. The keyboard leaving the game, a blur, a hidden tab and the stage going mostly off screen pause it too.
```

## Changes during execution

- **The action bar over the pads** (found by the check on a phone on its side: the tap meant for «Прыжок» followed the bar's «Кофейни» link). The controller now keeps `html[data-game]` while a run is in play (`inPlay`) or while the pads are on screen (`padsSeen`, an `IntersectionObserver` on the pads), through one `syncGame()`; `claimGame`/`releaseGame` only set `inPlay`. Checked: hidden while the pads show, back once the game is off screen.
- **`--svh`:** at another session's request (Telegram's in-app browser resizes the page as its bars fold), the three `svh` in game.css read `var(--svh)` (with a `1svh` fallback until globals.css defined it, then dropped).
- **The check:** the jump is polled (at 90 ms and a phone's 0.8 pace the cup is only about 33 u up, on the edge of the sampled band), the first begin is awaited (`data-live`), the desktop click off the game comes before the first stool, and the bar is checked mid-page (it isn't mounted above the hero).
- **Result:** 44 checks pass three runs in a row; vitest 452/452; typecheck and lint clean.
