// Which language this build speaks. The site is built twice from the same code: Russian at the root and
// English with NEXT_PUBLIC_LOCALE=en under /en (NEXT_PUBLIC_BASE_PATH ends in /en there: next.config.ts
// sets it as the base path, scripts/build-lumako.mjs nests that export at out/en). `t` (src/i18n) and the
// content modules' words follow it, so nothing else needs to know the language.
export type Locale = "ru" | "en";

export const LOCALE: Locale = process.env.NEXT_PUBLIC_LOCALE === "en" ? "en" : "ru";
export const EN = LOCALE === "en";

/** This build's base path: "", "/en", "/kakdela" or "/kakdela/en". */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
/** The site's base, without the English build's /en. */
export const SITE_BASE = EN ? BASE.replace(/\/en$/, "") : BASE;

/**
 * The same page in the other language, as a plain href (it leaves this build, so never a next/link):
 * `/about` ↔ `/en/about`. `path` is the page's path without the base path, as usePathname() gives it.
 */
export function otherLocaleHref(path: string) {
  const page = path === "/" ? "" : path;
  return EN ? `${SITE_BASE}${page}` || "/" : `${SITE_BASE}/en${page}`;
}
