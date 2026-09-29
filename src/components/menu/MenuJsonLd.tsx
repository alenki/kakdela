import { fullMenu } from "@/content/full-menu";
import type { MenuItem } from "@/content/types";
import { routes, SITE_URL } from "@/content/routes";
import { t } from "@/i18n";
import { CITIES, citiesById } from "./model";

/**
 * A dish's offers: one per city where it is served and priced (areaServed), a cup-size drink as a price range; none
 * where no price is known yet.
 */
function offers(item: MenuItem) {
  const p = item.price;
  if ("sizes" in p) return { "@type": "AggregateOffer", lowPrice: p.sizes[0], highPrice: p.sizes[1], priceCurrency: "RUB" };
  const list = (citiesById[item.id] ?? CITIES)
    .filter((c) => p[c] != null)
    .map((c) => ({ "@type": "Offer", price: p[c], priceCurrency: "RUB", areaServed: { "@type": "City", name: t.city[c] } }));
  return list.length ? list : undefined;
}

/**
 * The menu for search: schema.org Menu, its chapters and categories as sections, every dish with its anchor and
 * its prices in each city. The chain itself is the homepage's graph (JsonLd), referenced by its @id.
 */
export function MenuJsonLd() {
  const url = `${SITE_URL}${routes.menu.href}`;
  const data = {
    "@context": "https://schema.org",
    "@type": "Menu",
    "@id": `${url}#menu`,
    url,
    name: t.menu.meta.title,
    description: t.menu.meta.description,
    inLanguage: "ru-RU",
    provider: { "@id": `${SITE_URL}/#org` },
    hasMenuSection: fullMenu.map((ch) => ({
      "@type": "MenuSection",
      name: ch.title,
      url: `${url}#${ch.id}`,
      hasMenuSection: ch.categories.map((c) => ({
        "@type": "MenuSection",
        name: c.title,
        url: `${url}#${c.id}`,
        hasMenuItem: c.items.map((i) => ({
          "@type": "MenuItem",
          name: i.name,
          url: `${url}#${i.id}`,
          ...(i.desc ? { description: i.desc } : {}),
          ...(offers(i) ? { offers: offers(i) } : {}),
        })),
      })),
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
