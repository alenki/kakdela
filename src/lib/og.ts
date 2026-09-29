import { EN } from "@/i18n/locale";

/**
 * A link preview from public/og/ (1200 × 630), for a page's `openGraph.images`: `menu.jpg` on the Russian site,
 * `menu.en.jpg` on the English one when the card carries words (`localized`). The URL is relative, so it
 * resolves against the layout's metadataBase (…/en/ in the English build, whose public/ is served under /en
 * too). Not the file-based opengraph-image: that is one card for both builds, and in the English one its URL
 * gets the /en twice (the base path and the metadataBase).
 */
export function ogImage(file: string, alt: string, { localized = true } = {}) {
  const url = `og/${EN && localized ? file.replace(/(?=\.\w+$)/, ".en") : file}`;
  return { url, alt, width: 1200, height: 630, type: file.endsWith(".png") ? "image/png" : "image/jpeg" };
}
