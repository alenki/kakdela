# Deploying to lumako.ru/kakdela (reg.ru shared hosting)

The site ships there as a static export: plain files served by Apache, no Node server.

## Build
```bash
npm run build:lumako
```
It runs `next build` with `STATIC_EXPORT=1` and `NEXT_PUBLIC_BASE_PATH=/kakdela` (see `next.config.ts`), then `scripts/postexport.mjs`, twice: Russian at `out/`, then English (`NEXT_PUBLIC_LOCALE=en`, `NEXT_PUBLIC_BASE_PATH=/kakdela/en`) nested at `out/en/`. It leaves the site in `out/` and the same files in `kakdela-lumako.zip`. `npm run build` is unchanged.

## Upload
1. In the reg.ru panel (ISPmanager, «Менеджер файлов»), open the site root of lumako.ru (usually `www/lumako.ru/`).
2. Create the folder `kakdela` there, upload `kakdela-lumako.zip` into it and unpack it («Извлечь»), so that `kakdela/index.html` sits directly in `kakdela/` (and `kakdela/en/index.html` in `kakdela/en/`). Delete the zip.
3. Open https://lumako.ru/kakdela and https://lumako.ru/kakdela/en. To update, delete the folder's contents and repeat.

**No `.htaccess`.** The build ships none, and none should be added under `kakdela/`. On 2026-09-29, while the build still wrote one (rewrites, `DirectorySlash Off`, cache headers, the café's 404), lumako.ru answered the whole site with reg.ru's own 403 page («Доступ к странице запрещен»); deleting it brought the site back. So Apache runs as it does out of the box: `/kakdela/about` gets a 301 to `/kakdela/about/`, and `postexport.mjs` copies every page into its own folder (`about/index.html`) where that redirect lands, and puts a small first script in each page's `<head>` that keeps the slash out of the address and out of the router. An unknown address shows the host's 404 page, not the café's.

## What differs from a server deployment
- **The feedback form does not send.** A static host can't run the server action; the form shows the café's «не получилось отправить» reply. It has to stay that way until the 152-ФЗ items in the README are done anyway.
- **Images are not resized.** Photos ship as the original JPEGs (up to ~0.5 MB each) instead of AVIF/WebP per screen width.
- **SEO URLs still name www.kakdelacoffee.ru** (canonical links, sitemap, JSON-LD, Open Graph). That is right for a preview; for a real launch on lumako.ru change `SITE_URL` in `src/content/routes.ts` and `metadataBase` in `src/app/layout.tsx`.

## English version
The same code, built a second time with `NEXT_PUBLIC_LOCALE=en` (`src/i18n/locale.ts`): `t` from `@/i18n` reads `src/i18n/en.ts` over `ru.ts`, and the content modules lay `src/content/en/*` over their own words as they load. So https://lumako.ru/kakdela/en is English, and every page links to its twin («EN» / «RU» in the header, the language's name in the footer).
- In development `npm run dev` serves both languages at http://localhost:3000: Russian at the root, English at `/en`. English is a second dev server on :3001 (`scripts/dev.mjs` starts it, `scripts/dev-en.mjs` alone is `npm run dev:en`), and `next.config.ts` has :3000 pass `/en` on to it and :3001 pass the rest back, so the switch works on either port. If :3000 is already running from an older `next dev`, start `npm run dev:en` beside it.
- A string added to `ru.ts` needs its twin in `en.ts`, and a new content id its English words (the /menu's in `src/content/en/full-menu.ts`): `src/i18n/en.test.ts` fails until they are there (meanwhile the English page shows the Russian words).
- Link previews: each build names its own card in `public/og/` (`src/lib/og.ts`), `menu.jpg` or `menu.en.jpg` and so on, with its alt in its language. Redraw the English ones with `node scripts/make-menu-card.mjs http://localhost:3000 --lang en` (from the running site) and `node --no-warnings scripts/make-plan-card.mjs --lang en`.
- The mail from an English note stays in Russian for the staff, with the line «Язык записки: английский».
- Still Russian on the English site: the logo lockup, which is the brand (and the menu's provenance notes, which are never shown).
