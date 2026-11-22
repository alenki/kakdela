# kakdela

The website for **«Как дела?»**, a chain of specialty-coffee and breakfast cafés in Nalchik and Vladikavkaz.
Phase 1 is the homepage, the menu (`/menu`), the cafés (`/locations`), «О нас» (`/about`) and «Обратная связь» (`/feedback`), with the policy on personal data (`/privacy`) and the consent (`/privacy/consent`). The other routes (`/events`, `/delivery`, `/catering`, `/careers`, `/bonus`) are linked through `src/content/routes.ts`. They land on the voiced 404, with the runner, until their phase ships.

## Concept: «Разговор»
The brand name is a question, and the menu already answers it: the breakfasts are called «Лучше всех», «Как в сказке», «Шик» and «10 из 10». The homepage is one conversation:

- **Hero.** A paper notice whose headline is the real logo asks «Как дела?». The guest tears off an answer tab.
- **The answer is the order.** The torn tab lands on its side across a photo of the dish with that name, and the café replies with the dish and its price.
- **The page remembers.** The answer comes back the next day as «Вчера было «…». А сегодня?».
- **The evening ends with a game of chess.** Every Monday a new mate in two from a real game; the café answers every move, and when it's solved it asks «Как дела?» and the grade lands as one of the hero's answers, with its dish. Then the invitation to the blitz.
- **The menu turns the notice over.** `/menu` is the waiter's side: «Что будете?». Its first screen is the hero's notice seen from the back: on the back of each tab is the dish that answer stands for, today's torn tab is missing there too, and the sheet under the tabs carries the contents. Beside it, the table serves the dish being read, every photo laid so its plate never moves, the answer's slip across its dish.
- **The guest answers back.** «Обратная связь» is the café's pad: the guest circles a tone in the notice's own words («Всё шик», «Есть идея», «Так себе», «Есть вопрос») and a café, writes and signs; the café's side answers every move. Sent, the sheet is torn off the pad and laid on the café's photo, and the café replies.

«О нас» carries the conversation on: the guest asks back in the logo's own lettering, «А у вас как дела?», and the café hangs its answer («Спасибо, что спросили.») on a paper sign from the logo's own question mark, then answers chapter by chapter. It remembers the tab torn today, answers with the part of the day it is in Moscow, walks a street of its nine doors with every «Как дела?» sign on one line, and ends by asking «А у вас?».

## The New Year season («С наступающим!»)
From 20 November to 14 January, by the Moscow date, the site wears the New Year on its own: a garland of lights under the header that swings and lights up to «Jingle Bells», paper snowflakes cut from the notice's paper (peel one off), snow in the air at night that settles on the footer's wordmark (and snow of its own in the game, with the cup's track in it), the season's line in the hero's reply, and music on by default: «Jingle Bells» over a beat, on repeat, from the visitor's first click or tap (no browser lets a page sound before one), which the bell in the header turns off for good (the Kremlin chimes strike at midnight on 1 January). It turns itself off on 15 January and on again next November. Preview a phase on any date with `?season=eve`, `ny`, `xmas` or `old`, or see the site without it with `?season=off`. The dates are `SEASON` in `src/lib/season.ts`; the rest is in `docs/CONVENTIONS.md`, «С наступающим!: the season».

## Stack
Next.js 16 (App Router, Turbopack), React 19.3, TypeScript, Tailwind CSS v4, GSAP 3.15 with @gsap/react (ScrollTrigger, CustomEase; DrawSVG and CustomWiggle for the coffee poster), Motion 13 (`m.*` under `LazyMotion`), Lenis.

## Commands
```bash
npm run dev          # http://localhost:3000, English at /en (docs/DEPLOY.md, «English version»)
npm run build && npm start
npm run typecheck    # tsc --noEmit
npm run lint         # eslint
npm test             # vitest (time/geo/format/typograf/i18n/determinism/content/runner/feedback/privacy)
npm run shot -- "#kofe" kofe.png 390 844 [--reduced] [--nojs]   # headless screenshot helper
npm run perf -- http://localhost:3100/ [--mobile]              # LCP/CLS/bytes probe against `npm start`
```

Asset pipelines, which you only need to re-run when the source assets change:
```bash
npm run assets:logo    # trace assets-src/logo-index.png → src/components/brand/wordmark-data.ts
npm run assets:photos  # the café's own photos (old site, Instagram, Yandex Maps) → src/assets/photos
npm run assets:icons   # favicon, apple icon, Open Graph image (public/og/kakdela.png) from the traced logo
npm run assets:paper   # paper texture for the hero notice in public/tex
npm run assets:grain   # grain textures in public/tex
npm run assets:puzzles # a year of weekly mates in two from the Lichess puzzle database (CC0) → src/content/puzzles.ts
npm run assets:plans   # the cafés' city plans from OpenStreetMap (ODbL) → src/assets/plans, src/content/plans.ts
npm run assets:plan-card # the /locations link preview from the Nalchik plan → public/og/locations.jpg (-- --lang en: locations.en.jpg)
```

## Where things live
| Path | What |
|---|---|
| `src/content/*` | Typed data: answers, menu, the full menu (`full-menu.ts`, from the client's site), cafés (real coordinates, phones and Yandex ids), reviews, team, routes, photos and the weekly puzzles |
| `src/i18n/ru.ts` | Every UI string (Russian-first; EN will mirror its shape) |
| `src/components/hero/*` | The notice, the tear-off tabs and the answer stage |
| `src/components/about/*` | «О нас»: one server component per chapter, its islands, and `FramedPhoto` (a photo laid by a crop, `src/lib/crop.ts`) |
| `src/components/sections/*` | One server component per section, with client islands in subfolders |
| `src/components/menu/*` | The `/menu` page («Что будете?»): the title, the notice turned over (the contents), the table and the three chapters, with client islands in `islands/`; `scripts/make-menu-card.mjs` draws its link preview |
| `src/components/locations/*` | The `/locations` page («Где встретимся?»): the title, each city's printed plan and its legend (the cafés), with client islands in `islands/` |
| `src/components/brand/*` | The Wordmark (the traced logo, as SVG) and Photo |
| `src/components/privacy/*` | The policy and the consent: `LegalDoc` sets the text from `src/content/privacy.ts` |
| `src/components/feedback/*` | «Обратная связь»: the pad and the café's side, the note's rows, the pen loop and the tear; the server action is `src/app/feedback/actions.ts` |
| `src/components/game/*` | The runner «Игра со стаканчиком»: the poster, the island, the lazy controller and canvas drawing (homepage section and 404) |
| `src/lib/*` | Store (hydration-safe), time (Europe/Moscow), geo, format, typograf (Russian no-break rules), seed and GSAP setup; the runner's engine and record; the New Year season (dates, the garland, the snowflakes, the snow, the sound) |
| `src/components/season/*` | The New Year season: the garland, the snow, the paper snowflakes and their peeling, the bell, the season's clock |
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
- Personal data (152-ФЗ; the policy is `/privacy`, the consent `/privacy/consent`). These block the launch of the feedback form:
  - the operator's details in `src/content/privacy.ts` (`operator`): full name, ИНН, ОГРН, address, the mailbox for requests, the person responsible, and the hosting and mail providers with their addresses (each shows as a blank until filled in);
  - the notification to Roskomnadzor (art. 22) before the form goes live, and its register number;
  - hosting in Russia, and the notes' mailbox at a mail provider in Russia (art. 18 part 5): set `FEEDBACK_SMTP_URL`, `FEEDBACK_MAIL_TO` and, if needed, `FEEDBACK_MAIL_FROM` (until then a production build tells the guest it could not send);
  - processing agreements («поручение», art. 6 part 3) with both providers; the local acts, the responsible person's appointment and staff briefing (art. 18.1); deleting notes after a year;
  - any CDN, proxy or firewall in front of the site sees the form's data: it must be in Russia too, named in both texts and under a «поручение»; the hosting provider should be in Roskomnadzor's register of hosting providers (149-ФЗ art. 10.2-1);
  - the protection level set against Resolution No. 1119 (with health details possible in a complaint, likely УЗ-3), and a written ban on forwarding notes to personal or foreign mail and messengers;
  - `next dev` never exposed publicly: without the mail settings it prints whole notes to its log;
  - until the above is true, the policy's statements about Russia and about no transfer abroad are not yet facts: don't open the form to guests before then;
  - a lawyer's sign-off on both texts and on the café's replies in `src/content/feedback.ts`.
