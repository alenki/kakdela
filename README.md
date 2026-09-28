# kakdela

The website for **«Как дела?»**, a chain of specialty-coffee and breakfast cafés in Nalchik and Vladikavkaz.
Phase 1 is the homepage, and «Обратная связь» (`/feedback`) is live beside it, with the policy on personal data (`/privacy`) and the consent (`/privacy/consent`). The other routes (`/menu`, `/locations`, `/events`, `/about`, `/delivery`, `/catering`, `/careers`, `/bonus`) are linked through `src/content/routes.ts`. They land on the voiced 404, with the runner, until their phase ships.

## Concept: «Разговор»
The brand name is a question, and the menu already answers it: the breakfasts are called «Лучше всех», «Как в сказке», «Шик» and «10 из 10». The homepage is one conversation:

- **Hero.** A paper notice whose headline is the real logo asks «Как дела?». The guest tears off an answer tab.
- **The answer is the order.** The torn tab lands on its side across a photo of the dish with that name, and the café replies with the dish and its price.
- **The page remembers.** The answer comes back the next day as «Вчера было «…». А сегодня?».
- **The evening ends with a game of chess.** Every Monday a new mate in two from a real game; the café answers every move, and when it's solved it asks «Как дела?» and the grade lands as one of the hero's answers, with its dish. Then the invitation to the blitz.
- **The guest answers back.** «Обратная связь» is the café's pad: the guest circles a tone in the notice's own words («Всё шик», «Есть идея», «Так себе», «Есть вопрос») and a café, writes and signs; the café's side answers every move. Sent, the sheet is torn off the pad and laid on the café's photo, and the café replies.

## Stack
Next.js 16 (App Router, Turbopack), React 19.3, TypeScript, Tailwind CSS v4, GSAP 3.15 with @gsap/react (ScrollTrigger, CustomEase; DrawSVG and CustomWiggle for the coffee poster), Motion 13 (`m.*` under `LazyMotion`), Lenis.

## Commands
```bash
npm run dev          # http://localhost:3000
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
npm run assets:photos  # client photos (kakdelacoffee.ru) + CC0 placeholders → src/assets/photos
npm run assets:icons   # favicon, apple icon, Open Graph image from the traced logo
npm run assets:paper   # paper texture for the hero notice in public/tex
npm run assets:grain   # grain textures in public/tex
npm run assets:puzzles # a year of weekly mates in two from the Lichess puzzle database (CC0) → src/content/puzzles.ts
```

## Where things live
| Path | What |
|---|---|
| `src/content/*` | Typed data: answers, menu, cafés (real coordinates, phones and Yandex ids), reviews, team, routes, photos and the weekly puzzles |
| `src/i18n/ru.ts` | Every UI string (Russian-first; EN will mirror its shape) |
| `src/components/hero/*` | The notice, the tear-off tabs and the answer stage |
| `src/components/sections/*` | One server component per section, with client islands in subfolders |
| `src/components/brand/*` | The Wordmark (the traced logo, as SVG) and Photo |
| `src/components/privacy/*` | The policy and the consent: `LegalDoc` sets the text from `src/content/privacy.ts` |
| `src/components/feedback/*` | «Обратная связь»: the pad and the café's side, the note's rows, the pen loop and the tear; the server action is `src/app/feedback/actions.ts` |
| `src/components/game/*` | The runner «Игра со стаканчиком»: the poster, the island, the lazy controller and canvas drawing (homepage section and 404) |
| `src/lib/*` | Store (hydration-safe), time (Europe/Moscow), geo, format, typograf (Russian no-break rules), seed and GSAP setup; the runner's engine and record |
| `src/styles/*` | Chrome, brand and hero styles, plus one CSS file per section |
| `docs/CONVENTIONS.md` | Design and motion rules for contributors |

## Before production (client sign-off)
Some content is still a placeholder or unverified. It is flagged in code with `verify` or `placeholder`, and photos show a «Фото временное» badge.
- The logo vector and the brand's poster font (the logo is currently a trace of the PNG).
- The «Как в сказке» recipe, plus photos of «10 из 10», «Шик» and шакшука.
- Closing times for Байсултанова 1, Лермонтова 4 and Шогенцукова 19 (23:00 or 00:00).
- Vladikavkaz prices, and permission to quote the reviews.
- Team portraits and their own answers.
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
