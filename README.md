# kakdela

The website for **«Как дела?»**, a chain of specialty-coffee and breakfast cafés in Nalchik and Vladikavkaz.
Phase 1 is the homepage, the menu (`/menu`) and «О нас» (`/about`). The other routes (`/locations`, `/events`, `/delivery`, `/catering`, `/careers`, `/bonus`) are linked through `src/content/routes.ts`. They land on the voiced 404, with the runner, until their phase ships.

## Concept: «Разговор»
The brand name is a question, and the menu already answers it: the breakfasts are called «Лучше всех», «Как в сказке», «Шик» and «10 из 10». The homepage is one conversation:

- **Hero.** A paper notice whose headline is the real logo asks «Как дела?». The guest tears off an answer tab.
- **The answer is the order.** The torn tab lands on its side across a photo of the dish with that name, and the café replies with the dish and its price.
- **The page remembers.** The answer comes back the next day as «Вчера было «…». А сегодня?».
- **The evening ends with a game of chess.** Every Monday a new mate in two from a real game; the café answers every move, and when it's solved it asks «Как дела?» and the grade lands as one of the hero's answers, with its dish. Then the invitation to the blitz.
- **The menu answers back.** `/menu` is the waiter's side: «Что будете?». Its cover lists the eight answers, each beside its dish; the dish carries the hero's dialogue («Как дела? Сонно.»), and the answer word turns red where the guest lands or what they tore today.

«О нас» carries the conversation on: the guest asks back, «А у вас как дела?», and the café answers chapter by chapter («Спасибо, что спросили.»). It remembers the tab torn today, answers with the part of the day it is in Moscow, walks a street of its nine doors with every «Как дела?» sign on one line, and ends by asking «А у вас?».

## Stack
Next.js 16 (App Router, Turbopack), React 19.3, TypeScript, Tailwind CSS v4, GSAP 3.15 with @gsap/react (ScrollTrigger, CustomEase; DrawSVG and CustomWiggle for the coffee poster), Motion 13 (`m.*` under `LazyMotion`), Lenis.

## Commands
```bash
npm run dev          # http://localhost:3000
npm run build && npm start
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm test             # vitest (time/geo/format/typograf/i18n/determinism/content/runner)
npm run shot -- "#kofe" kofe.png 390 844 [--reduced] [--nojs]   # headless screenshot helper
npm run perf -- http://localhost:3100/ [--mobile]              # LCP/CLS/bytes probe against `npm start`
```

Asset pipelines, which you only need to re-run when the source assets change:
```bash
npm run assets:logo    # trace assets-src/logo-index.png → src/components/brand/wordmark-data.ts
npm run assets:photos  # the café's own photos (old site, Instagram, Yandex Maps) → src/assets/photos
npm run assets:icons   # favicon, apple icon, Open Graph image from the traced logo
npm run assets:paper   # paper texture for the hero notice in public/tex
npm run assets:grain   # grain textures in public/tex
npm run assets:puzzles # a year of weekly mates in two from the Lichess puzzle database (CC0) → src/content/puzzles.ts
```

## Where things live
| Path | What |
|---|---|
| `src/content/*` | Typed data: answers, menu, the full menu (`full-menu.ts`, from the client's site), cafés (real coordinates, phones and Yandex ids), reviews, team, routes, photos and the weekly puzzles |
| `src/i18n/ru.ts` | Every UI string (Russian-first; EN will mirror its shape) |
| `src/components/hero/*` | The notice, the tear-off tabs and the answer stage |
| `src/components/about/*` | «О нас»: one server component per chapter, its islands, and `FramedPhoto` (a photo laid by a crop, `src/lib/crop.ts`) |
| `src/components/sections/*` | One server component per section, with client islands in subfolders |
| `src/components/menu/*` | The `/menu` page: cover, running head, chapters and rows, with client islands in `islands/` |
| `src/components/brand/*` | The Wordmark (the traced logo, as SVG) and Photo |
| `src/components/game/*` | The runner «Игра со стаканчиком»: the poster, the island, the lazy controller and canvas drawing (homepage section and 404) |
| `src/lib/*` | Store (hydration-safe), time (Europe/Moscow), geo, format, typograf (Russian no-break rules), seed and GSAP setup; the runner's engine and record |
| `src/styles/*` | Chrome, brand and hero styles, plus one CSS file per section |
| `docs/CONVENTIONS.md` | Design and motion rules for contributors |

## Before production (client sign-off)
Some content is still a placeholder or unverified. It is flagged in code with `verify` or `placeholder`, and a stand-in photo shows a «Фото временное» badge.
- The logo vector and the brand's poster font (the logo is currently a trace of the PNG).
- The «Как в сказке» recipe (the 2026 photo shows the shrimp scramble; the old site's text still has the chicken version).
- Closing times for Байсултанова 1, Лермонтова 4 and Шогенцукова 19 (23:00 or 00:00).
- Vladikavkaz prices, and permission to quote the reviews.
- Team portraits and their own answers (the cards show the café's own at-work shots, hands only, for now).
- The about page's copy (`t.about` in `src/i18n/ru.ts`).
- Delivery, loyalty, certificate and careers URLs.
- Hosting that is reachable from Russian mobile networks.
- The runner's copy (the title «Игра со стаканчиком.», the lead, the hints) and its place after the evening.
