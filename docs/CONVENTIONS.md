# «Как дела?»: frontend conventions

The site reads like a well-set printed café menu: warm paper, black ink, one red. The character comes from four things only: the real logo with its red clover, heavy condensed display type, real food photography, and one interaction (the hero's tear-off notice). Everything else stays quiet, aligned and the same from section to section. A section has at most one signature moment. When in doubt, remove it.

## Stack
- Next.js 16 App Router, React 19.3, TypeScript, Tailwind v4 (CSS-first), GSAP 3.15 with `@gsap/react`, Motion 13, Lenis.
- Read `node_modules/next/dist/docs/` before using a Next API. In Next 16:
  - `next/image` uses `preload`, not `priority`;
  - `images.qualities` is `[75, 85]`.

## Files and ownership
- `src/app/page.tsx` composes the page: hero, team, breakfasts, coffee, locations, reviews, evening inside `<main>`, then the footer (the contentinfo landmark).
- Each section:
  - is `src/components/sections/<Name>.tsx`, a **server component** that renders all copy;
  - may add client islands next to it as `src/components/sections/<name>/<Island>.tsx` (motion, measurement, state);
  - owns its own stylesheet, `src/styles/sections/<name>.css`. It is already imported by `globals.css`.
- Shared styles: `src/app/globals.css` (tokens, themes, type, heading, buttons, links, rules, leader), `src/styles/brand.css` (Photo), `src/styles/chrome.css` (header, dialog, action bar, city switch, status), `src/styles/hero.css`.
- Content is typed data in `src/content/*`: `answers`, `menu`, `cafes`, `people`, `photos` and `routes`. UI strings are in `src/i18n/ru.ts` as `t.*`. Don't hard-code data that exists there, and never invent prices, hours, phones, addresses or ratings. Only add a string to `ru.ts` if there is no suitable one.
- Brand components live in `src/components/brand/*`: `Wordmark` (full | compact | badge; the only place the octagon and the clover appear) and `Photo`.
- Chrome components live in `src/components/chrome/*`: `RouteLink` (**always** use it for internal links, never raw hrefs; `hash` adds an anchor: `<RouteLink to="menu" hash="shakshuka">`), `CitySwitch`, `CafeStatus`.
- `DialogueHeading` is in `src/components/type/DialogueHeading.tsx`. Every section heading uses it.

## Design tokens (globals.css)
- **Colours:** `cream` (page), `milk` (the rare raised surface: the hero notice), `ink` (text, and the dark sections' background), `graphite` (secondary text on cream), `tomato` / `tomato-ink` (the one accent). Tomato is for the logo clover, focus and at most one small highlight per viewport. It is never a section background and never body text. No other colours.
- **Themes:** `data-theme="cream"` or `data-theme="ink"` on `section.field`. Hero through reviews are cream; evening and footer are ink (the page is one café day and ends at night). Each theme sets `--bg`, `--fg`, `--fg-soft`, `--accent`, `--accent-ink` (red for small text, lifted on ink), `--focus` and `--grain`. `.field` paints them; `.field::before` is the grain, `::after` is free. Two cream sections in a row get a gutter-to-gutter hairline automatically, so don't add a top border. The header, the action bar and the menu dialog take the theme of the section beneath them.
- **Type sizes:** `--fs-body`, `--fs-small` (.875rem), `--fs-label` (.8125rem), `--lead`, `--h2` (the one section-title size), `--h3` (item titles). No per-section poster sizes.
- **Spacing:** `.section-pad` (`--section-pad`, bottom 1.15× the top), `--head-gap` (heading block → content), `--foot-gap` (a list or grid → the closing line under it: links, a note, the pie; the same step in every section), `--gutter`, `--grid-gap`, `--header-h`.
- **Lines:** `--line` (16% of the text colour), `--line-strong` (28%), `--rule` (1px). Use `.rule-t` / `.rule-b`. No heavier rules.
- **Radius:** 2px for photos and panels, 999px for buttons and toggles only.
- **Shadows:** none, except the soft one under the hero notice.
- **Layout:** every section is full viewport width. `.wrap` has no max width; it only adds `--gutter` (16px on phones, `clamp(24px, 3.4vw, 104px)` from 640px). Desktop is a 12-column grid from 1024px, gutter to gutter, with `--grid-gap` column gaps. Compose for 390, 1440, 1920 and 2560 alike: no centred column, no dead halves, never horizontal scroll. Running text keeps a measure (≤ 60ch; `.lead` 44ch). `.bleed`, `.bleed-l` and `.bleed-r` break imagery out to the screen edge; text always keeps the gutter. Past 1600px the root font size grows (16px → 20px at 2560px), so anything in rem scales with the canvas.

## Type
Three families, no more:
- **Display** (Sofia Sans Extra Condensed): `.display`, heavy (860) uppercase, line-height .9. Section titles, dish names, big numbers. Pair `.item-title` (`--h3`) with it for dish and item names.
- **Sans** (Onest): body, UI, buttons, labels, prices, hours, phones.
  - `.mono` is Onest with tabular figures, for prices, hours and phones. **₽ is never set in the display face.**
  - `.label` is small Onest 500 in `--fg-soft`, sentence case, no uppercase, no tracking.
  - `.lead` is the section lead: sans at `--lead`, `--fg-soft`, 44ch, `text-wrap: balance` (two to four even lines, usually broken at the dash).
- **Serif** (Cormorant Garamond, italic only): `.reply`, only for the team statement, the review quotes and the hero's reply line. At most one serif moment per section; never for captions, labels, buttons or notes.

Headings get `text-wrap: balance`, paragraphs `pretty`. Keep «ёлочки».

## Section heading
```tsx
<header className="section-head">
  <DialogueHeading id="kofe-title" q="Кофе" a="А с кофе мы не шутим." />
  <p className="lead">…</p>
</header>
```
- `q` is the section's plain name, shown as the small label; `a` is the title in display type at `--h2`. With no `a` and no children, `q` becomes the title. Other props: `as` (`h2` | `h3`), `id`, `className`, `answerClassName` (on the title), `children` (after the title, inside the heading).
- It renders `h2.dlg > span.dlg-label.label + span.dlg-title.display`. `data-dlg-q` / `data-dlg-a` are motion hooks.
- The label is `--fs-small` up to a laptop and then grows with the title (about 1:6.6 from 1440 to 2560), so it doesn't get lost under a 150px title.
- From 1024px the title spans columns 1–8 and the lead sits in 9–12 on the title's last baseline; phones stack. `--head-gap` below is included.
- **No em dashes, anywhere**: not in copy, alt text, titles, screen reader text, comments or docs, and not as dialogue marks (the hero's exchange is «Как дела?» / «Сонно.» with no dash). Use a comma, a colon, a full stop or «·» instead, or rephrase.

## Components
- **Photo:** `<Photo photo={p} sizes="(min-width: 1024px) 33vw, 100vw" aspect="4/5" />`, also `className`, `preload` (the one LCP image only) and `loading`.
  - Rectangular, 2px radius, `object-fit: cover`, blur placeholder. No frames, no octagons.
  - `aspect` is `"w/h"` (default `"4/5"`) and sets `--photo-aspect`. Keep it true to the rendered shape; a section may override `aspect-ratio` in CSS or set it to `auto` with a height.
  - `sizes` describes the frame's width; `coverSizes` scales it when the source is wider than the frame.
  - Stock stand-ins (`placeholder: true` in `photos.ts`) get a quiet «Фото временное» badge, hidden from screen readers (the alt text already says so). Add `photo--sm` on thumbnails about 96–128px wide for a smaller badge.
- **Buttons:** `<a className="btn btn-primary">` and `<a className="btn">`. Pill, 48px tall, Onest 500. The primary is filled with the text colour and inverts on ink; the secondary has a `--line-strong` border. At most two in a group; prefer one button plus text links.
- **Text links:** `<a className="dlink">Все кофейни</a>`. Onest 500 at the surrounding size, a 1px underline at 35% that turns solid on hover (fine pointers) or press, and a 44px hit area on touch.
  - A group of links (a section's closing pair) goes in `<p className="dlinks">`: one line when they fit, otherwise stacked; on touch the rows are 44px apart, so the hit areas never overlap.
- **External links:**
  ```tsx
  <a className="dlink" href={…} target="_blank" rel="noreferrer">
    Telegram<span className="dlink__ext" aria-hidden="true">↗</span>
    <span className="sr-only"> {t.a11y.newTab}</span>
  </a>
  ```
- **Tags and features:** plain text joined by « · » in `.label`. No pill chips.
- **Menu rows:** name, dotted leader, price. `.leader` appears only inside these rows.
  - Primary rows (breakfasts, coffee, desserts): the name in `.display.item-title`, `<span className="leader" aria-hidden="true" />`, the price in `.mono`, an optional description line below. Stacked lists separate rows with 1px `--line` rules.
  - Secondary rows in sans (the hero dish, the breakfasts extras, the evening pie) use `.menu-row` from globals.css, so the leader stays on the name's last line, never on a line of its own:
    ```tsx
    <p className="menu-row">
      <span className="menu-row__name">
        {name}
        <span className="menu-row__lead" aria-hidden="true">{WJ}<span className="leader menu-row__dots" /></span>
      </span>
      <span className="menu-row__price mono">{rub(350)}</span>
    </p>
    ```
    The name clips with `overflow-x: clip`; the word joiner (`WJ` from typograf.ts) glues the leader to the last word, and the leader is `100vw` wide with a `-100vw` right margin, so it fills whatever the line leaves.
  - A city without a price shows `t.hero.askLater` («уточняйте в кофейне») instead.
- **Status:** `<CafeStatus cafe={c} />` renders `.status` with `.status__dot[data-state=open|closed|idle]`: a filled dot in the text colour when open, a ring when closed. No green, no pulse.
- **City switch:** `<CitySwitch compact? labelledBy? />` is the segmented pill toggle. It is named «Город» unless `labelledBy` points at a visible label.
- **Clover:** only inside the logo (`Wordmark`). No clover bullets or decorations.

## Formatting and content
- Prices go through `rub()` from `src/lib/format.ts` (a no-break space and ₽). Counts go through `plural()` (via a `t.*` function in `ru.ts`), digit groups through `groupDigits()`.
- Keep copy plain and pass it through `typograf()` from `src/lib/typograf.ts` where it renders (no-break spaces after short words, before «·», in numbers and units, in addresses, and inside the brand's «как дела?»). `bindLastWord()` keeps a paragraph from ending on a lone word; `keepWhole()` keeps names whole (no break at a hyphen, none inside a short «…» name) for dish names, answers and quotes. Take `NBSP` / `WJ` from there; don't write a local helper.
- Digit groups use a plain no-break space («2 709», «5 000 ₽»). Onest's narrow no-break space (U+202F) is too thin to see at label size, so don't use it.
- **City-specific content:** render **both cities on the server** and wrap each in `data-city-only="nalchik|vladikavkaz"`. CSS hides the inactive one (from `html[data-city]`, set before paint), so switching city never re-renders. `useKd((s) => s.city)` is only for things that must compute.
- Copy is plain, specific and warm, in the «вы» register. Keep the brand's dish names. No meta-instructions, asides, sign-offs or cute microcopy.

## Motion rules
- Client code imports GSAP from `@/lib/gsap`: `gsap`, `ScrollTrigger` and `useGSAP`, with the eases `kd.out`, `kd.inOut`, `kd.peel` and `kd.settle` registered.
- Allowed: one quiet entrance per block (opacity plus y 16–24px, `kd.out`, 0.6–0.8s, stagger ≤ 0.06, once), the hero's tear-off and its answer change, the breakfasts photo crossfade, and small state transitions (disclosures, the city pill, row reorder). Nothing else: no split-text reveals, no scrubbed parallax, no typing, no idle loops, no counters, no rotation.
- **The loading screen is the one exception** (`src/components/chrome/Loader.tsx`, choreography in `src/lib/loader-script.ts`, styles in `src/styles/loader.css`). It runs on every full page load, before React, from an inline script that uses the Web Animations API only (no attributes written, so hydration is untouched):
  - the ink sheet: the wordmark prints (the badge draws, the letters step out, the arcs swing in), the clover grows a leaf per quarter of the real load (HTML, eager images, fonts, hydration, `load`) and the answer line rolls to the hero's answer;
  - then it tears along its perforation, the logo lands on the notice's and the answer on the panel's, pixel for pixel, and it dispatches `kd:loaded` (`onLoaderDone` in `src/lib/loader.ts`). The hero then sways the tabs and brings in the dish.
  - It never shows without JS or with reduced motion, is capped at 8 s, plays quicker on a second load in the session, and is skipped with `sessionStorage kd-loader=off` (the screenshot helper does this unless `--loader`).
  - Anything that should wait for it (an entrance that would otherwise play under the sheet) uses `loaderPending()` / `onLoaderDone()`. Don't add other loaders or page transitions.
- **Text must be visible without JS and at first paint.** Entrances use `gsap.from` inside `useGSAP` after mount, with `clearProps`. Never hide content with CSS waiting for JS.
- Respect motion mode with `useMotionMode()` from `@/lib/motion` (`"full" | "reduced"`): return early unless it is `"full"`, and pass it as a `useGSAP` dependency with `revertOnUpdate: true`. `html[data-motion="reduced"]` also cuts CSS transitions to 1ms.
- No ScrollTrigger pins: use CSS `position: sticky` and let ScrollTrigger only read progress, with triggers on non-sticky parents.
- Motion (framer) uses `m.*` from `motion/react`, never `motion.*` (the app runs `<LazyMotion strict>`). It is only for React-state layout (the city pill, presence). Never let GSAP and Motion animate the same element.
- Hover styles only under `@media (hover: hover) and (pointer: fine)`.
- react-hooks v7 lint: no `Math.random()` or `Date.now()` in render (use `mulberry32` from `@/lib/seed`); never read or write `ref.current` during render.

## Accessibility
- One `h1` (the hero), an `h2` per section via `DialogueHeading`, real lists and landmarks. Alt text comes from `photos.ts`.
- Visible focus is global: a 2px `--focus` ring with a 3px offset. Never remove it; inside anything that clips, or on the screen edge, use a negative `outline-offset`.
- Touch targets are at least 44px. Decorative SVG and leaders are `aria-hidden`.
- External links get `target="_blank" rel="noreferrer"` and the sr-only «(откроется в новой вкладке)».
- The page works without JS: every block renders on the server, the city prices fall back to Нальчик and the hero's checked radio picks the panel.

## Verification (run before finishing)
- `npx tsc --noEmit`, `npx eslint src` and `npx vitest run` must be clean.
- The dev server runs at http://localhost:3000; don't start another. For visual QA **don't use the Playwright MCP browser, because it is shared**. Use the headless helper instead:
  - `node scripts/shot.mjs "#yoursectionid" out-name.png 1440 900 --reduced`
  - `node scripts/shot.mjs "#yoursectionid" out-name-m.png 390 844 --reduced`
  - also 1920 1080 and 2560 1440, and without `--reduced`; `--nojs` renders without JS; `full` instead of a selector shoots the whole page; `--loader` keeps the loading screen (skipped by default).
  - The helper prints `horizontalOverflow` and console `errors`. Open the PNG with the Read tool and look at it. Without `--reduced`, a tall element shot can show blocks that haven't risen in yet, and element shots taller than the viewport stitch in the fixed header; both are capture artifacts.
