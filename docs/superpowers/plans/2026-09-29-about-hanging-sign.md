# «Всё держится на этом вопросе»: About hero implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the About page's door hero with the café's answer hanging on a paper sign from the dot of the logo's own «?» (spec: `docs/superpowers/specs/2026-09-29-about-hanging-sign-design.md`).

**Architecture:** One pure module, `src/lib/sign.ts`, holds the geometry (written on the section as `--sign-*` custom properties), the physics (a rigid card on two slack-able cords, position-based, 1 kHz, deterministic) and the arrival (simulated at build time and baked into CSS `linear()` animations). `Opening.tsx` renders the rig and the baked CSS; `HangingSign.tsx` is the one client island (hands, scroll, takeover); `about.css` lays it out with CSS alone.

**Tech Stack:** Next.js 16 App Router (server components, React 19 `<style precedence>`), TypeScript, vitest, plain CSS (individual transform properties, `linear()` easing, container query units).

**House rules:** no em dashes anywhere (copy, comments, docs); several sessions share the repo (announce edits via SendMessage); nobody commits for the user, so there are no commit steps; never restart the shared dev server on :3000; screenshots with `node scripts/shot.mjs`.

## File structure

| File | Responsibility |
|---|---|
| `src/lib/sign.ts` (new) | Geometry, physics, arrival series and CSS, `signVars`, `SAID_WEIGHT`, `LINE_MQ` |
| `src/lib/sign.test.ts` (new) | Physics, arrival curves, CSS agreement, layout mirror at 22 sizes |
| `src/components/about/Opening.tsx` (rewrite) | The section's markup, the baked arrival CSS, `HANG_SCRIPT`, the island |
| `src/components/about/opening/HangingSign.tsx` (new) | The island: physics loop, hands, scroll, takeover, reduced-motion flip |
| `src/lib/about-script.ts` (edit) | `HANG_SCRIPT` replaces `DOOR_SCRIPT` |
| `src/styles/about.css` (edit) | The opening block: layout, faces, cords, entrances, stills |
| `src/i18n/ru.ts`, `src/i18n/en.ts` (edit) | `t.about.sign` |
| `src/content/about.ts`, `src/content/photos.ts`, `src/content/en/index.ts` (edit) | Drop `doorway` and `lermontova59Room` |
| `src/lib/door.ts`, `src/lib/door.test.ts`, `src/components/about/opening/OpeningDoor.tsx` (delete) | The door |
| `docs/CONVENTIONS.md`, `README.md` (edit) | The rules and the page's description |

Measured in Chromium with the site's fonts (em of Sofia Sans Extra Condensed): «СПАСИБО, ЧТО» 4.7316 at 860 tracked -0.012em, «THANKS FOR» 3.9112, «ЗАКРЫТО» 3.1262, «CLOSED» 2.4434; the ask «А У ВАС КАК ДЕЛА?» 6.0228 at 200 tracked 0.06em (English 6.2344), the longest torn answer before it «КАК В СКАЗКЕ. » 5.0649 at 460 (English «NEVER BETTER. » 5.1953), its «?» 0.341; a line-height:1 box has its baseline 0.8em down and caps 0.66em tall.

### Task 1: The physics and geometry, test first

**Files:** Create `src/lib/sign.test.ts`, then `src/lib/sign.ts`.

- [ ] **Step 1: Write the failing tests** (`src/lib/sign.test.ts`, full content as in the repository after this task: rig geometry against `WORDMARK`, rest, arrival catch and settle with no strand past its length, energy only falling, a spin winding and unwinding, the back showing to a hard push, page acceleration under and over 1 g, determinism, the baked `linear()` curves replaying the simulation, about.css agreement, torn answer weights, the layout mirror at 22 sizes.)
- [ ] **Step 2: Run to see them fail:** `npx vitest run src/lib/sign.test.ts`. Expected: FAIL, cannot resolve `./sign`.
- [ ] **Step 3: Implement `src/lib/sign.ts`** with these exports (full code in the repository after this task):
  - `LINE_MQ = "(min-width: 1024px) and (min-aspect-ratio: 6/5)"`
  - `SIGN` (ratio 0.56, glyph 0.62, holeX 0.4, holeY 0.0315, drop 0.23, pad 0.075, lineEm 4.76 / 3.94, backEm 3.14 / 2.46, askLongEm 11.09 / 11.43, askEm 11.6 / 12, qEm 0.341, capTopEm 0.14)
  - `GLYPH` (the union of `WORDMARK.dela[4]` and `[5]` boxes, and their paths), `NAIL` (x, y, r in the sign's width), `RIG_HEIGHT`
  - `PHYS` (width 0.4 m, g 9.81, mass 0.15, drag 0.9, tiltDrag 1.2, twist 1.45, twistDrag 0.8, twistDrag2 0.035, step 0.001)
  - `rig()`, `hanging()`, `step(s, r, dt, { hand, accel })`, `push()`, `shove()`, `energy()`, `twistEnergy()`, `atRest()`, `pose()`
  - `ARRIVAL` (lift 0.42, shift 0.05, tilt -0.05, twist 0.15, delay 350, until 4.2, settle 0.8, handoff 3.3, rate 120, tolDeg 0.06, tolW 4e-4, tolStretch 1.2e-3), `arrivalStart()`, `arrivalAt(t)`, `arrivalSeries()`, `keep()`, `linear()`, `arrivalCss()`
  - `signVars`, `SAID_WEIGHT`
- [ ] **Step 4: Run to see them pass:** `npx vitest run src/lib/sign.test.ts`. Expected: all pass. The about.css agreement and layout tests stay red until Task 5.

### Task 2: The arrival's flag

**Files:** Modify `src/lib/about-script.ts` (replace `DOOR_SCRIPT` and its comment).

- [ ] **Step 1:** Replace `DOOR_SCRIPT` with `HANG_SCRIPT`: the same conditions (full motion, no hash, at the top, a navigation or a reload at the top by `kd-scroll`, no Save-Data, no forced colours), and it only sets `html[data-hang]`. It does not end on input: the island takes over from the exact state instead.

```ts
export const HANG_SCRIPT = `(function(){try{var d=document.documentElement,ds=d.dataset;if(!document.getElementById('o-nas'))return;
if(ds.motion!=='full'||location.hash||window.scrollY>2)return;
var sd=false,fc=false,nav='',sc=0;try{sd=!!navigator.connection.saveData}catch(e){}try{fc=matchMedia('(forced-colors: active)').matches}catch(e){}
try{nav=performance.getEntriesByType('navigation')[0].type}catch(e){}try{sc=+sessionStorage.getItem('kd-scroll')||0}catch(e){}
if(sd||fc||!(nav==='navigate'||nav==='prerender'||nav===''||(nav==='reload'&&sc<=2)))return;ds.hang='1'}catch(e){}})();`;
```

### Task 3: Strings and content

**Files:** `src/i18n/ru.ts`, `src/i18n/en.ts`, `src/content/about.ts`, `src/content/photos.ts`, `src/content/en/index.ts`.

- [ ] **Step 1:** Add to `t.about` (ru): `sign: { open: "Открыто", closed: "Закрыто", openNote: "каждый день с 07:30", closedNote: "откроемся в 07:30" }`; (en): `sign: { open: "Open", closed: "Closed", openNote: "every day from 07:30", closedNote: "we open at 07:30" }`. Update en.ts's comment over `ask` («Thanks for» / «asking.» are the sign's two lines, sign.ts).
- [ ] **Step 2:** Delete `doorway` (and its now unused `Photo` import) from `src/content/about.ts`, `lermontova59Room` from `src/content/photos.ts` and from `src/content/en/index.ts`.
- [ ] **Step 3:** `npx vitest run src/i18n/en.test.ts`. Expected: PASS.

### Task 4: The markup and the island

**Files:** Rewrite `src/components/about/Opening.tsx`; create `src/components/about/opening/HangingSign.tsx`.

- [ ] **Step 1:** `Opening.tsx`: the section (`#o-nas`, `.field.ab-sign`, `style={signVars}`), `<style href="ab-sign-arrival" precedence="default">{arrivalCss()}</style>`, `.ab-sign__frame > .wrap.ab-sign__stage`, the h1: `.dlg-ask.ab-sign__ask` holding `.ab-sign__words` (the ask without its «?», with the `data-said-*` attributes) and `.ab-sign__q` (the unseen `?`, a space, and `.ab-sign__rig`: the glyph svg, and `.ab-sign__nail[data-sign-nail]` holding `.ab-sign__swing > .ab-sign__fall > .ab-sign__card > .ab-sign__turn` with the two faces, then the two `.ab-sign__cord`); then `.ab-sign__story > p.ab-sign__founding.reply`; `InlineScript(HANG_SCRIPT)`; `<HangingSign />`.
- [ ] **Step 2:** `HangingSign.tsx`: reduced motion: a click toggles `data-turned`. Full motion: `data-live`; the loop (`step` at 1 kHz, `render` from `pose`, sleeps at `atRest`, snaps to rest and clears inline styles); the scroll sampler (the page's acceleration, smoothed over 50 ms, `accel = -a / pxPerMetre`); `IntersectionObserver` pause; pointer (mouse and pen drag with `hand`, click `push` by side; touch tap `push`, sideways swipe `shove`); the takeover (`arrivalAt(currentTime - delay)`, drop `data-hang`, render in the same frame) on the first touch, on a scroll jolt, or at `ARRIVAL.handoff`; `ResizeObserver` for the scale.

### Task 5: The styles

**Files:** `src/styles/about.css`: replace the opening block (from «The opening: the door in the answer» to just before `.framed__img`) and the file's header line for `#o-nas`.

- [ ] **Step 1:** The stack by default; `@media (min-width: 1024px) and (min-aspect-ratio: 6/5)` for the line. `--ask-f`, `--sw`, `--pad-t` on `.ab-sign__frame` (a container, so `cqi` is the page's width without its scrollbar); the rig, the glyph, the nail, swing, fall, card (perspective), turn, faces (paper, edge, shadow, `--sign-shade`), holes, cords (rotated from the nail), the answer and the back (open or shut by `html[data-daypart="0"]`), torn answer rules on `.ab-sign__words::before`, the story (line: absolute, left at the larger of column 8 and past the longest sign, bottom on the sign's foot), entrances (`ab-ask`, `ab-up`), cursors, forced colours, print.
- [ ] **Step 2:** `npx vitest run src/lib/sign.test.ts`. Expected: PASS, including the CSS agreement and the layout mirror.

### Task 6: The door goes

- [ ] **Step 1:** Delete `src/lib/door.ts`, `src/lib/door.test.ts`, `src/components/about/opening/OpeningDoor.tsx`.
- [ ] **Step 2:** `grep -rn "door\|DOOR" src --include=*.ts --include=*.tsx` shows only the Street's doors (the cafés).

### Task 7: Docs

- [ ] **Step 1:** `docs/CONVENTIONS.md`: the intro's and the motion rules' lists of declared exceptions (the about page's hanging sign in place of its door), the paper and shadow lists (the sign), and the «О нас» Opening bullet rewritten for the sign.
- [ ] **Step 2:** `README.md`: the «О нас» paragraph.

### Task 8: Verification

- [ ] `npm run typecheck`, `npm run lint`, `npm test`: all clean.
- [ ] `node scripts/shot.mjs viewport <out> <w> <h> --url=http://localhost:3000/about` at 390×844, 1024×768, 1440×900, 1920×1080, 2560×1440, with `--reduced` and `--nojs` too; look at every one.
- [ ] Frames of the arrival (0 to 4.5 s) and of a takeover mid-arrival (a click at 1.2 s) with a probe script; no jump at the takeover.
- [ ] Hands: drag and release, click to turn (the back reads «Открыто» by day), a hard scroll fling.
- [ ] axe on `/about`.
- [ ] Scan every changed file for code point 0x2014.
