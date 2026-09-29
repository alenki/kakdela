# English version: design

Date: 2026-09-29. Status: draft for the user's review.
Built from a read-only map of every file with Russian copy (212 files, 10 agents) and a check of Next 16.3.6 against its bundled docs and source.

## 1. Goals

- Every page exists in English under `/en`: home, about, locations, feedback, privacy, consent, the 404 and, once it ships, the menu.
- Russian URLs do not change. `/about` stays Russian; English is `/en/about`.
- Both languages are prerendered as static pages, as today.
- The site's play on «Как дела?» ("How are you?") carries over into English. It is not glossed over.
- English stays complete: when a Russian string or content word is added without its English twin, the type check fails.

Out of scope: detecting the browser language, English mail to the café, translating internal notes (`verify`, `draftNote`, `oldName`, nutrition notes), and any third language (the design allows one later).

## 2. Decisions taken with the user

| Question | Decision |
|---|---|
| Scope | Everything. The legal pages are translated, with a notice that the Russian text prevails. |
| URLs | `/en` prefix; Russian at `/`. A manual RU/EN switch. No redirect based on the browser. |
| Voice | Translate the play. The logo stays «Как дела?». English copy says "Kak dela? means How are you?" once, then runs the exchange in English: tabs such as "Never better", dishes named to match. |
| Architecture | An `app/[lang]` root segment. A proxy rewrites unprefixed paths to `/ru` internally, and components read strings through `next/root-params`. |

## 3. Routing and rendering

### Files

- `src/app/[lang]/` gets `layout.tsx`, `page.tsx`, `not-found.tsx`, `about/`, `feedback/` (with `actions.ts`), `locations/`, `privacy/` (with `consent/`) and, when its owner is done, `menu/`. The old `src/app/layout.tsx` and `src/app/not-found.tsx` are deleted: if `app/layout.tsx` stays, `[lang]` is not a root param and `next/root-params` exports nothing.
- `src/app/[lang]/[...rest]/page.tsx` calls `notFound()` synchronously (no awaits, no `loading.tsx` above it), so unknown URLs and planned pages get the voiced 404 inside the right language's layout, with HTTP 404.
- These stay at the app root: `icon.svg`, `apple-icon.png`, `robots.ts`, `sitemap.ts`, `fonts.ts` and `globals.css`.
- OG images move to `public/og/` (`kakdela.png`, `locations.ru.jpg`, `locations.en.jpg`) and are referenced from metadata with a localized `alt`. File-based images under a dynamic segment get a `/-/…` URL and are dropped by any deeper `openGraph` export, so explicit references are simpler. `scripts/make-icons.mjs` and `scripts/make-plan-card.mjs` write there; the plan card gains a `--lang en` run.

### Root layout (`app/[lang]/layout.tsx`)

- `generateStaticParams()` returns `ru` and `en`; `export const dynamicParams = false`.
- Validates the param with `hasLocale()` and falls back to `ru`. Requests that bypass the proxy can reach the catch-all with any value, and there is no not-found boundary above the root layout.
- `<html lang={locale}>`, `metadataBase` and the viewport move here. It wraps the tree in `<LocaleProvider locale={locale}>`: the locale string, not the dictionary, because dictionaries hold functions.
- Metadata comes from `generateMetadata`. Nothing in the app keeps a static `metadata` built from `t`.

### Proxy (`src/proxy.ts`)

The routing decision is a pure function, `routeFor(pathname)` in `src/i18n/locales.ts`, unit-tested. The proxy only applies it.

- `/en` and `/en/…`: pass through.
- `/ru` and `/ru/…`: 308 to the unprefixed path (`/ru/about` → `/about`). The matcher already skips metadata and files.
- Any other page path: rewritten to `/ru…` (`/` → `/ru`, not `/ru/`), with `request.nextUrl.clone()` so the query survives (`?vstrecha` on /locations).
- The matcher skips `_next/`, `api/` and every path whose last segment has a dot (icons, robots, sitemap, `/og/*`, `/tex/*`, fonts). It never skips prefetch or RSC requests: an unrewritten `/about` prefetch would match `[lang]=about`.

Verified in 16.3.6 (docs and source): a rewrite serves the prerendered `/ru/about` without a dynamic render; `<Link>` prefetches and client navigations pass through the proxy and are rewritten; the proxy runs on Node only; the file must be `src/proxy.ts`.

### Pathnames on the client

`usePathname()` returns `/about` in the browser but `/ru/about` during the prerender, which would break hydration wherever it is compared. A client hook `usePagePath()` returns the path with any locale prefix stripped (`/about` on both sides and on `/en/about`), and `useLocale()` returns the locale. `CurrentLink`, `MobileActionBar`, `HeaderBehavior` and `Providers` use these; nothing compares raw `usePathname()` values any more.

### Links

- `routes.ts` keeps one unprefixed `href` per page. `localeHref(key, locale, hash?)` adds `/en` for English.
- `RouteLink` takes the locale from `useLocale()`. It is used in server and client trees alike, so it becomes a small client component; a `Link` in a client component costs nothing extra, since `next/link` is already client.
- Hard-coded `href="/"` in `Header` and the 404 go through `RouteLink to="home"`.
- In-page anchors (`#gde`, `#kofejni`, `#voprosy-…`, clause ids) stay identical in both languages, so shared links keep working.
- `inviteUrl(id, locale)` builds `SITE_URL + /en/locations?vstrecha#id` for English, so a friend gets the page in the language they were invited in.

### The language switch

- It is a plain `<a href>`, not `<Link>`. A ru↔en client navigation remounts the whole root-layout tree and resets `<html>` attributes that `HEAD_SCRIPT` set (city, motion), while the inline scripts don't run again. A document navigation avoids all of that and costs one page load, once per visit.
- It points at the same page in the other language and keeps the hash (`/about#seychas` ↔ `/en/about#seychas`), built by a small client component from `usePagePath()` and `location.hash`.
- Labels: "EN" on Russian pages (`lang="en"`, `hreflang="en"`, accessible name "English version"); «RU» on English pages (`lang="ru"`, `hreflang="ru"`, accessible name «Русская версия»).
- Placement: the header's right cluster, before «Разделы» (desktop); the «Разделы» dialog (every width); the footer's legal line. The exact look follows chrome's `hdr-link` style and is settled in the visual pass.

### Metadata, sitemap, JSON-LD

- One helper, `pageMeta({ key, title, description, image? }, locale)`, returns `title`, `description`, `alternates` (`canonical` plus `languages: { ru, en, 'x-default': ru }`, always as strings, never `URL` objects) and a full `openGraph` (`locale` `ru_RU`/`en_US`, `alternateLocale`, `url`, `siteName`, `images` with a localized `alt`). Metadata merges shallowly, so every page builds its whole object through this helper instead of relying on the layout.
- `sitemap.ts` lists every live route twice, as absolute URLs, each entry carrying the full `alternates.languages` map. Priority 1 goes to `/` and `/en`.
- JSON-LD keeps the same `@id`s in both languages (`/#org`, `/#cafe-<id>`), so search engines merge them. It gets `inLanguage`, the locale's `url`, English names and addresses, and `alternateName: "Как дела?"` beside `name: "Kak dela?"`.

### Inline scripts

`HEAD_SCRIPT`'s loader gate becomes "pathname is `/` or `/en`". The loader session (kakdela-37) is about to rewrite that script. It gets `pageKeyFor(pathname) → { locale, key }` and one dictionary key per page for its per-page line, and I tell it before `layout.tsx` moves. `NOW_SCRIPT` keeps its day ranges (the same numbers in both languages). Scripts that print words take them from the locale's dictionary when their string is built on the server.

### Build details

- `npm run typecheck` becomes `next typegen && tsc --noEmit`, so `PageProps`, `LayoutProps` and the `next/root-params` types exist after the move.
- `experimental.optimisticRouting` (on by default in 16.3) may mispredict an unprefixed URL as `[lang]=menu` and retry. This is verified by testing (see §10); `optimisticRouting: false` is the fallback.

## 4. Strings: the dictionaries

### Files in `src/i18n/`

| File | What it holds | Who imports it |
|---|---|---|
| `locales.ts` | `locales`, `Locale`, `defaultLocale`, `hasLocale`, `localeHref`, `stripLocale`, `routeFor`, `pageKeyFor` | everyone: proxy, client, server, scripts, tests |
| `types.ts` | `Dictionary = Widen<typeof ru>`: string literals widen to `string`, while array lengths, keys, function parameters and the `RouteKey` unions are kept | `en.ts`, helpers |
| `ru.ts` | unchanged: still the source, still edited by every session | `dictionaries.ts` |
| `en.ts` | `export const en = {…} satisfies Dictionary` | `dictionaries.ts` |
| `dictionaries.ts` | `dictionaries = { ru, en }`, `dictionary(locale)`; no Next imports, so tests can use it | client hook, server getter, tests |
| `server.ts` | `getLocale()` (`lang()` from `next/root-params`, validated), `getT()`, `getContent()` | server components, `generateMetadata` |
| `client.tsx` | `LocaleProvider`, `useLocale()`, `useT()`, `useContent()`, `usePagePath()` | client components |
| `index.ts` | re-exports the pure parts. The bare `t` export is removed once the last importer is converted | |

`next/root-params` throws outside the Next compiler, so only `server.ts` imports it and tests never import `server.ts`.

### How each kind of module gets its words

| Kind | Rule |
|---|---|
| Server component, page, `generateMetadata` | `const t = await getT()`; content from `await getContent()` |
| Client component (`"use client"`) | `const t = useT()`; content from `useContent()` |
| Shared component (no directive, rendered in both trees) | receives strings or `t` as props from its parent; no hooks, no `await` |
| Plain module (`lib/*`, controllers, reducers) | takes the dictionary, a slice of it, or the locale as a parameter (`initGame(puzzle, t.chess)`, `mountRunner(el, t.game)`, `inviteUrl(id, locale)`, `nearestMessage(t, …)`, `san(move, t.chess.letters)`) |
| Anything at module scope | may not read `t` or content words. Those constants become functions of `t` or move inside the component. The map lists 18 such freezes (Header and MenuDialog nav lists, Team's statement, Opening's split, RunnerIsland's labels, the chess model's `S`, pen's `DEFAULT_NOTE`, about.ts `own`/`house`, every static `metadata`, and more) |

The client bundle then carries both dictionaries (about 8 KB more gzipped). `npm run perf` measures it; if it matters, islands take their few strings as props instead.

### Formatting belongs to the locale

Number and text formatting moves into the dictionaries as `t.fmt`, so any code that has `t` formats correctly:

| `t.fmt.` | ru | en |
|---|---|---|
| `rub(n)` | `2 709 ₽` (NBSP groups) | `2,709 ₽` |
| `rubSpoken(n)` | `670 рублей` | `670 rubles` |
| `num(x, digits)` | `5,0` | `5.0` |
| `km(v)` / `metres(n)` | `1,4 км` / `500 м` | `1.4 km` / `500 m` |
| `count(n, forms)` | three-form plural | singular or plural |
| `quote(s)` | «…» with „…“ inside | “…” with ‘…’ inside |

`lib/format.ts` keeps its Russian helpers, and `ru.fmt` is built from them, so nothing changes for Russian. `typograf()` stays at its call sites: its rules only match Cyrillic, so on English it does nothing and harms nothing. `keepWhole()` learns “…” for English names.

### Hard-coded Russian moves into the dictionaries first

The metadata strings in `layout.tsx` (`applicationName`, the OG title and site name), the 404's title, the footer's owner line (`ИНН`/`ОГРН` labels), `about.css`'s «сейчас » (printed from the existing `data-label` instead), and the handful of `aria-label`s and `alt`s the map found. This is one serial step (§9, stage 2a) so the parallel area conversions never touch `ru.ts` or `en.ts`.

## 5. Content: English overlays

Data (prices, coordinates, phones, hours, ids, slugs, ratings) stays single-sourced in `src/content/*`. English words live in `src/content/en/<module>.ts`, keyed by the module's ids, and each overlay is typed so a missing id fails the type check (`satisfies Record<AnswerId, …>` and similar).

`src/content/localize.ts` exports `contentFor(locale)`, memoized per locale. For `ru` it returns the original modules untouched, so the Russian site cannot regress through this path. For `en` it returns deep copies with the words swapped in. Photos have no key of their own, so a reference map (`photo object → record key`) finds each photo's English `alt`. Every `answers[].item.photo`, `menu.*.photo` and `cafes[].photo` reference is swapped the same way.

| Module | Keyed by | English fields | Notes |
|---|---|---|---|
| `answers.ts` | `AnswerId` (8) | `label`, `reply` | `item.name` comes from the menu overlay through `item.anchor`, so each dish has one English name |
| `menu.ts` | item id; new keys `extras`, `cherryPie`, `season` | `name`, `desc`, `cupNote.ask/say`, `extras` | the brand's own names get English names (the style guide below) |
| `full-menu.ts` | item, category and chapter ids (a test keeps them unique) | titles, `name`, `desc`, `descByCity.vladikavkaz` | the 19 curated items take their words from the `menu.ts` overlay; `draftNote`, `verify`, `oldName` and `seenAt` stay Russian and are not copied |
| `cafes.ts` | `Cafe.id` | `address` ("Lermontova St, 59"), `short` ("Lermontova, 59"), `alias`, `tags` (same length and order as the Russian tags, checked by a test) | the four Russian address parsers (`locations/address.ts`, `menu/model.ts`, `lib/feedback.ts`, `Reviews.tsx`) read the overlay's `short` for English instead of parsing |
| `people.ts` | review ids, team ids; new key `chessEvent` | quotes, captions, event words | reviews are translated faithfully, marked as translated, and keep `sourceUrl` to the original |
| `photos.ts` | record key (61) | `alt` | alts that name dishes or addresses follow those translations |
| `feedback.ts` | tone ids, FAQ ids | tone labels, questions, replies; FAQ `q`, `short`, `a`, `link.label` | `link.label` must be a substring of `a` (Asked.tsx sets the link on those words); `short` is at most 3 words |
| `privacy.ts` | document, clause id, block index | every clause, list, table, brief line, blank caption | `{tokens}` and the paragraph structure are kept exactly; see §6 on legal text |
| `about.ts` | new ids for `house` entries | none of its own | `own` and `house` become functions `(t, content)`; cafés are matched by their Russian tags (data), labels come from `t` |

`plans.ts`, `puzzles.ts` and `types.ts` carry no words. `Drink.lang` / `MenuItem.lang` ("this name is foreign on this page") becomes relative to the page: on an English page a Latin name needs no mark, and a Cyrillic one would need `lang="ru"`.

## 6. English copy: the style guide

This becomes a section of `docs/CONVENTIONS.md` when the rollout lands. Until then it is the brief for the translation pass.

- **The exchange.** The site is a conversation that opens with "How are you?". Headings stay an exchange: the guest's question in the thin voice, the café's answer in heavy display. Keep them as short and warm as the Russian ones, never longer.
- **The name.** The logo stays «Как дела?». In running English text the café is "Kak dela?". The homepage and /about each say once, early, that it means "How are you?". Titles read "Kak dela? · Coffee and breakfast in Nalchik and Vladikavkaz".
- **Answers are dishes.** Each tab answers "How are you?" and names what is on the menu. Translate the label, the dish name and the reply together, so the pun survives. A draft (final wording comes from the translation pass):

  | id | ru | en tab | dish |
  |---|---|---|---|
  | luchshe-vseh | Лучше всех | Never better | Breakfast "Never Better" |
  | kak-v-skazke | Как в сказке | Like a dream | Breakfast "Like a Dream" |
  | vsyo-shik | Всё шик | All peachy | Breakfast "Peachy" |
  | 10-iz-10 | 10 из 10 | 10 out of 10 | Breakfast "10 out of 10" |
  | est-hochu | Есть хочу | Starving | Breakfast "Hearty" |
  | normalno | Нормально | Fine | Shakshuka |
  | sonno | Сонно | Sleepy | Espresso tonic |
  | tak-sebe | Так себе | So-so | as today's drink |

- **Hard limits.** A tab label has at most 12 characters (the tabs, slips and team cards are sized to «Как в сказке», and a test enforces it). A FAQ `short` has at most 3 words. Button and action-bar labels are one or two short words. The 404 title stays two sentences. Tone labels fit one line of the pad.
- **Russian dishes** with no English word are transliterated, with a gloss in the description: "Syrniki", "Draniki (potato pancakes)", "Medovik (honey cake)". The café's own playful names get English names ("Further, Sweeter" for «Дальше слаще», "Mir Station" for «Станция Мир»); trademarks stay as they are.
- **Punctuation.** No em dashes, in copy, alt text or anything else (the site-wide rule). Quotes are “…” with ‘…’ inside. American spelling; "café" keeps its accent.
- **Numbers.** The time is the 24-hour clock, as on the cafés' doors ("07:30", "until 23:00"). Prices are "670 ₽". Decimals take a point: "5.0", "1.4 km".
- **Addresses** follow what a guest sees in English map apps: "Lermontova St, 59", "Shogentsukova Ave, 19", "Generala Plieva St, 10V". The short form ("Lermontova, 59") goes on plans, invites and café lists.
- **Reviews** are real guests' words. Translate them faithfully (not polished), mark them once as "Translated from Russian", and keep the link to the original on Yandex Maps.
- **Legal pages** are a translation for convenience. Each opens with: "This is an English translation. The Russian version is the one that applies," linking to it. 152-FZ is "Federal Law No. 152-FZ “On Personal Data”". Operator identifiers keep their Russian names with the English in brackets ("INN (taxpayer number)"). The owner should confirm this wording (§11).
- **Cyrillic on English pages.** Any Cyrillic run that is left (the sign in a photo caption, a Russian name quoted in text) is wrapped in `lang="ru"`, because the display face only draws the Russian Д and Л under `lang="ru"`.

## 7. Layouts measured on Russian copy

Where a size was measured on the Russian words, English gets its own measure next to the Russian one: a `:lang(en)` rule directly after the base rule in the same stylesheet, or a per-locale entry where the numbers live in TypeScript. There is no separate English stylesheet, so whoever re-measures one language sees the other.

| Where | What was measured | English work |
|---|---|---|
| `coffee.css` (flagged) | «А с кофе мы не шутим.» at 8.40em, `/ 8.69` | measure the English answer, set `:lang(en)` divisor; phones' two-line break |
| `lib/door.ts` + `about.css` (flagged) | wall, word, line, stack and ask widths of «Спасибо, что спросили.» and the longest ask; the ask's cap height matched to the photo's «КАК ДЕЛА?» sign | `DOOR[locale]`; `doorVars(locale)`; the sign stays (it is the brand), the English ask aligns to it the same way |
| `hero.css` | tab floor from «Как в сказке» (4.9em); `.panel__ask` 6.5em for «уточняйте в кофейне»; one-line `.stage__line` | English labels within 12 characters; measure the longest; re-check the ask's two lines |
| `team.css`, `brand.css`, `chess.css` | slips sized to «Как в сказке» (4.6em); the founding statement's four balanced lines; «как у вас» nowrap | measure the longest English slip and the English statement |
| `menu.css` | tab floor from the espresso tonic (6.4em); `.mn-ask` 9.5em | after the menu owner is done |
| `breakfasts.css`, `evening.css`, `coffee.css` | breakpoints where the longest name and its price stop sharing a line («Сан-Себастьян», «Дальше слаще») | re-find each breakpoint with the English names |
| `chrome.css` | header nav breakpoints (five labels need about 414px); `.status` nowrap; action bar thirds | check the English labels at 390, 1024 and 1280, and adjust the breakpoints if needed |
| `feedback.css` | four tones on one line from 1024; FAQ `short` in the price column; the widest answer «Спрашивайте.» | fit the English tones and shorts |
| `locations-page.css`, `lib/plan.ts` | `labelUnits` (0.46em per character) sets the label side on the plan; two message lines reserved | run `plan.test.ts` on English short addresses; check the messages |
| `about.css` ruler | the 8em «сейчас 14:32» box | print `data-label`, measure "now 14:32" |
| `not-found.tsx` | one line per sentence | two English sentences |
| `make-plan-card.mjs` | «Где встретимся?» on two lines at 118px | fit the English card |
| `note.ts` (Neucha) | the sleeve's 164-unit line; `DEFAULT_NOTE` «как дела?» drawn without fitting on the server | English notes lower case; check "how are you?" fits at 26 |

Each row is done when screenshots of the English page at 390, 1440, 1920 and 2560 show no overflow, no wrap that the Russian page doesn't have, and no dead gaps.

## 8. Feedback: the server action and the mail

- `sendNote` takes the locale as a bound argument: the page renders `sendNote.bind(null, locale)` (root params are not available inside actions). The action validates it (`hasLocale`) and returns its errors in the guest's language.
- The mail to the café stays Russian (the staff read it). It gains one line: «Язык записки: английский» when the note came from `/en`.
- `privacy.test.ts` reads `src/app/feedback/actions.ts` by path, and `feedback.test.ts` and `privacy.test.ts` pin unprefixed routes; both are updated with the move.

## 9. Coordination and rollout

Five other sessions are editing this repo. Each owns an area, and they are finishing at different times:

| Session | Area | Status when this was written |
|---|---|---|
| kakdela-9d | /locations | done, files free |
| kakdela-4b | /feedback FAQ «Уже спрашивали.» | about an hour of fixes |
| kakdela-3b | /about opening (door, `door.ts`) | a few hours |
| kakdela-5a | the new /menu (`src/app/menu`, `src/components/menu/**`) | several hours |
| kakdela-37 | the loader (`layout.tsx`, `head-script.ts`, `loader/*`) | starts tomorrow |

So the rollout is staged, and each stage waits only for the files it needs:

1. **Stage 0: additive, no one else's files.** `src/i18n/{locales,types,en,dictionaries,server,client}`, `src/content/en/*`, `src/content/localize.ts`, and their tests. The English translation of `ru.ts` and the content happens here (§10 has how it is checked). Nothing imports the new modules yet, so the site is unchanged.
2. **Stage 1: the move, all at once.** Every page folder moves into `app/[lang]` in one step, with the proxy, the catch-all, the new layout and `pageMeta`. A page left at the app root would have no root layout and break the build, so this waits until the menu owner is done (or moves `menu/` with us by agreement), and until the loader session has heard where the layout went. After this step /en renders, with English chrome and Russian bodies until stage 2.
3. **Stage 2a: serial.** The hard-coded strings go into both dictionaries, `t.fmt` lands, and `RouteLink`, `CurrentLink`, `usePagePath` and the switch are wired in.
4. **Stage 2b: area by area, each once its owner is done.** Chrome and the 404; the home sections; hero and runner; about; locations; feedback and legal; menu. Each area swaps `t` for `getT()`/`useT()`, removes its module-scope freezes, takes content from `getContent()`/`useContent()`, and does its §7 measures. The areas touch disjoint files, so they can run in parallel.
5. **Stage 3: finish.** Sitemap, JSON-LD, OG images, the perf check, full visual QA in both languages, and the docs: an «English» section in `docs/CONVENTIONS.md` and the README.

From stage 0 on, `en satisfies Dictionary` makes `tsc` fail when a key is added to `ru.ts` without its English twin. Every session is told once: add the English line in `en.ts` when you add a Russian one (or message me for the wording). The same applies to content ids and their overlays.

Before each stage I message the sessions whose files it touches, and I message again when it is done. Nothing is committed: the user commits.

## 10. Testing and verification

**Unit (vitest), new:**
- `routeFor`: `/` → rewrite `/ru`; `/about?x#y` keeps the query; `/ru/about` → 308 `/about`; `/en`, `/en/about` pass; dotted paths are never routed.
- `localeHref`, `stripLocale`, `pageKeyFor`.
- The dictionaries: `en` has exactly `ru`'s key tree and function arities; English leaves contain no Cyrillic (except an allowlist: the Cyrillic brand name, the «RU» label); no em dashes; no «»; every function returns a string for sample arguments.
- The overlays: every id covered; tag arrays match in length; answer labels at most 12 characters; FAQ shorts at most 3 words and link labels inside answers; cupNotes fit `NOTE.maxWidth` (the existing fit check, run in English).
- `t.fmt` in both locales.
- English twins of the Russian-string tests: chess notation (`Qxf7#`, `O-O`), the spoken moves, the runner result, the feedback errors, `inviteUrl` for `en`.

**Static:** `next typegen && tsc --noEmit`, `eslint`, `vitest run`, and `next build`. The prerender manifest must list `/ru/*` and `/en/*` for every live page. The build uses its own `distDir` and port, never the shared dev server on :3000.

**HTTP matrix** (against `next start` on a spare port):

| Request | Expect |
|---|---|
| `/`, `/about`, `/locations`, `/feedback`, `/privacy`, `/privacy/consent` | 200, `<html lang="ru">`, canonical unprefixed, hreflang ru/en/x-default |
| the same under `/en` | 200, `lang="en"`, English title, canonical `/en/…` |
| `/ru/about` | 308 → `/about` |
| `/nonsense`, `/delivery` | 404, Russian 404 page, noindex |
| `/en/nonsense`, `/en/delivery` | 404, English 404 page |
| `/icon.svg`, `/apple-icon.png`, `/robots.txt`, `/sitemap.xml`, `/og/kakdela.png`, `/tex/paper.png` | 200, never rewritten |
| `POST` the feedback form on `/en/feedback` without JS | English error or success page; the mail carries «Язык записки: английский» |

**In the browser** (`node scripts/shot.mjs`, not the shared Playwright MCP browser):
- no hydration warnings or console errors on any page in either language;
- a Russian-only session that visits `/en` then goes back behaves; so do en→en client navigations (the `optimisticRouting` check);
- the switch lands on the same page and hash;
- screenshots of every page in both languages at 390, 1440, 1920 and 2560, compared side by side for §7;
- axe (`@axe-core/playwright`) finds nothing new on the English pages;
- `npm run perf` on `/` and `/en`: the English homepage is within 5% of the Russian one on the existing metrics.

## 11. Risks and open items

- **Legal wording.** A translated policy and consent, with the Russian text prevailing, is common practice, but the café's owner (or their lawyer) should confirm it before the English feedback form collects anything. Until then the English form can link to the Russian consent. This is decided at the user's review.
- **Translated reviews** are presented as translations of real guests' words, never as English originals.
- **The shared working tree.** The move in stage 1 touches every page folder. It happens only after the owners confirm, in one step, with a message before and after.
- **Client bundle.** Both dictionaries reach the client; measured in stage 3.
- **`optimisticRouting`.** Verified in stage 3; the fallback is one config line.
- **Menu timing.** The English /menu follows whenever the menu owner finishes; the rest of the site does not wait for it except for the stage 1 move.
