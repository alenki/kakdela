// Which language this build speaks. The site is built twice from the same code: Russian at the root and
// English with NEXT_PUBLIC_LOCALE=en under /en (NEXT_PUBLIC_BASE_PATH ends in /en there: next.config.ts
// sets it as the base path, scripts/build-lumako.mjs nests that export at out/en). `t` (src/i18n) and the
// content modules' words follow it, so nothing else needs to know the language.
export type Locale = "ru" | "en";

export const LOCALE: Locale = process.env.NEXT_PUBLIC_LOCALE === "en" ? "en" : "ru";
export const EN = LOCALE === "en";

/**
 * Which language sits at the site's root. Russian by default, English under /en; NEXT_PUBLIC_ROOT_LOCALE=en
 * turns it around: English at the root, Russian under /ru (scripts/build-okaraf.mjs).
 */
const ROOT_LOCALE: Locale = process.env.NEXT_PUBLIC_ROOT_LOCALE === "en" ? "en" : "ru";
/** The language that lives in a sub-folder, and that folder. */
const SUB_LOCALE: Locale = ROOT_LOCALE === "en" ? "ru" : "en";
const SUB = `/${SUB_LOCALE}`;

/** This build's base path: "", "/en", "/kakdela", "/kakdela/en" or "/kakdela/ru". */
const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
/** The site's base, without the sub-folder language's /en or /ru. */
export const SITE_BASE = LOCALE === SUB_LOCALE && BASE.endsWith(SUB) ? BASE.slice(0, -SUB.length) : BASE;

/**
 * The same page in the other language, as a plain href (it leaves this build, so never a next/link):
 * `/about` ↔ `/en/about` (or `/ru/about` with English at the root). `path` is the page's path without the
 * base path, as usePathname() gives it.
 */
export function otherLocaleHref(path: string) {
  const page = path === "/" ? "" : path;
  return LOCALE === SUB_LOCALE ? `${SITE_BASE}${page}` || "/" : `${SITE_BASE}${SUB}${page}`;
}
