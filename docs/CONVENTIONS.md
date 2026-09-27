# «Как дела?»: frontend conventions

The site is one conversation. «Как дела?» asks, and every section answers in Russian dialogue style: a **tomato em-dash** opens each line. Keep it professional and refined. Use brand-owned devices only: the octagon badge, the crayon clover, lace, chess, the Caucasus skylines and the cobalt cup. Never use generic effects.

## Stack
- Next.js 16 App Router, React 19.3, TypeScript, Tailwind v4 (CSS-first), GSAP 3.15 with `@gsap/react`, Motion 13, Lenis.
- Read `node_modules/next/dist/docs/` before using a Next API. In Next 16:
  - `next/image` uses `preload`, not `priority`;
  - `images.qualities` is `[75, 85]`.

## Files and ownership
- `src/app/page.tsx` composes the sections.
- Each section:
  - is `src/components/sections/<Name>.tsx`, a **server component** that renders all copy;
  - may add client islands next to it as `src/components/sections/<name>/<Island>.tsx`;
  - owns its own stylesheet, `src/styles/sections/<name>.css`. It is already imported by `globals.css`, so don't touch `globals.css`.
- Content is typed data in `src/content/*`: `answers`, `menu`, `cafes`, `people`, `photos` and `routes`. UI strings are in `src/i18n/ru.ts` as `t.*`. Don't hard-code data that exists there. Only add a new string to `ru.ts` if there is no suitable one, and keep «вы» register.
- Brand components live in `src/components/brand/*`:
  - `Wordmark` (full | compact | badge);
  - `Clover`, `HatchedClover`, `hatchLines`;
  - `OctPhoto` (the only frame for food and drink);
  - `Lace`;
  - `Skyline` (nalchik | vladikavkaz, with pins);
  - `FlatCup`.
- Chrome components live in `src/components/chrome/*`: `RouteLink` (**always** use it for internal links, never raw hrefs), `CitySwitch`, `CafeStatus`.
- `DialogueHeading` is in `src/components/type/DialogueHeading.tsx`. Every section heading uses it: `q` is the thin question voice, `a` is the heavy answer voice.

## Design tokens (globals.css)
- **Colours:** `sky`, `sky-deep`, `cream`, `milk`, `ink`, `graphite`, `tomato` (large text or graphics only), `tomato-ink` (small red text), `cobalt`, `cobalt-deep`, `oxblood`, `oxblood-2`, `butter` (rare, never text on light). Tailwind utilities exist, e.g. `bg-cobalt` and `text-tomato-ink`.
- **Sections:** `<section id="…" className="field section-pad" data-theme="sky|cream|tomato|oxblood|cobalt">`. `.field` sets `--bg`, `--fg`, `--fg-soft`, `--accent`, grain, and colours for dark themes.
- **Layout:** every section is **full viewport width**. `.wrap` has no max width; it only adds `--gutter` side padding (16px on mobile, `clamp(24px, 3.4vw, 104px)` from 640px). Desktop is a 12-column grid, gutter to gutter, with `--grid-gap` column gaps. Compose for 1440, 1920 and 2560 alike: no centred columns and no dead halves. Running text still keeps a `ch` measure. `.bleed`, `.bleed-l` and `.bleed-r` break imagery out to the viewport edges; text always keeps the gutter. Past 1600px the root font size grows (16px → 20px at 2560px), so anything sized in rem scales with the canvas. There must never be horizontal scroll.
- **Type classes:**
  - `.q-voice`: thin tracked caps.
  - `.a-voice`: heavy condensed caps.
  - `.reply`: Cormorant italic, the café's voice.
  - `.mono`: prices, hours and phones. **₽ must be set in mono or body text, never in the display font.**
  - `.label`: small mono uppercase.
  - `.kicker`.
- **Rules:** 1.5px currentColor (`.rule-t`, `.rule-b`). `.leader` is a dotted receipt leader. Radius is 2px, except pills (999px), which are used for buttons and chips only.
- **Buttons and links:** `.btn`, `.btn-primary` (cobalt), and `.btn-dash` inside `.btn`. `.dlink` is a text link, as `<span className="dash">—</span>Label`.
- **Formatting:** use `rub()` from `src/lib/format.ts` for prices (it adds a no-break space and ₽), and `priceLabel` for city prices. Counts go through `plural()` (via a `t.*` function in `ru.ts`).
- **Typesetting:** keep copy plain and pass it through `typograf()` from `src/lib/typograf.ts` where it renders (no-break spaces after short words, before «—», in numbers and units). Don't write a local NBSP helper; take `NBSP`/`NNBSP` from there too.
- **City-specific content:** render **both cities on the server** and wrap each in `data-city-only="nalchik|vladikavkaz"`. CSS hides the inactive one, so switching city never re-renders. `useKd(s => s.city)` is only for things that must compute.
- **Hover:** only under `@media (hover: hover) and (pointer: fine)`.

## Motion rules
- Client code imports GSAP from `@/lib/gsap`: `gsap`, `ScrollTrigger`, `SplitText` and `useGSAP`, with the eases `kd.out`, `kd.inOut`, `kd.peel` and `kd.settle` registered.
- Motion (framer) must use `m.*` components from `motion/react`, not `motion.*`, because the app uses `<LazyMotion strict>`. Motion is only for React-state layout (disclosures, list reorder, presence).
- Never let GSAP and Motion animate the same element. Outer wrappers take entrances; inner elements take hover.
- Respect motion mode with `useMotionMode()` from `@/lib/motion` (`"full" | "reduced"`), and pass it as a `useGSAP` dependency with `revertOnUpdate: true`. In reduced mode show the final state with no scrubs or loops.
- **Text must be visible without JS and at first paint.** Entrance animations use `gsap.from` inside `useGSAP` after mount. Never hide content with CSS waiting for JS.
- There are no ScrollTrigger pins; use CSS `position: sticky` and let ScrollTrigger read progress only. Put triggers on non-sticky parents.
- SplitText must be created inside `useGSAP`, with `aria: "none"` or on text that stays readable, and reverted on completion when possible.
- Eases: `kd.out` for reveals (0.7–0.9s), stagger 0.03–0.08. No bounce or elastic; `back.out(1.4)` only for tiny pin pops.
- Budget: at most one idle loop per viewport. Refined, not manic.
- react-hooks v7 lint:
  - no `Math.random()` or `Date.now()` in render (use `mulberry32` from `@/lib/seed`);
  - never read or write `ref.current` during render.

## Accessibility
- Real headings (h2 per section via `DialogueHeading`), meaningful alt text (it comes from `photos.ts`), and ≥44px touch targets.
- Visible focus is set globally.
- `aria-hidden` on decorative SVG.
- External links get `target="_blank" rel="noreferrer"`.

## Verification (run before finishing)
- `npx tsc --noEmit` and `npx eslint src` must be clean.
- The dev server runs at http://localhost:3000; don't start another. For visual QA, **do not use the Playwright MCP browser, because it is shared**. Use the headless helper instead:
  - `node scripts/shot.mjs "#yoursectionid" out-name.png 1440 900`
  - `node scripts/shot.mjs "#yoursectionid" out-name-m.png 390 844`
  - add `--reduced` for reduced motion and `--nojs` for no JS.
  - The helper prints `horizontalOverflow` and console `errors`. Open the PNG with the Read tool to look at it. Iterate until it looks award-level.
