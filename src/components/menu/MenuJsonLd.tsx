import { fullMenu } from "@/content/full-menu";
import type { MenuItem } from "@/content/types";
import { routes, SITE_URL } from "@/content/routes";
import { t } from "@/i18n";

/** A dish's offer at the flagship city's price (Нальчик); none where the price isn't known yet. */
function offers(item: MenuItem) {
  const p = item.price;
  const v = "sizes" in p ? p.sizes[0] : p.nalchik;
  return v == null ? undefined : { "@type": "Offer", price: v, priceCurrency: "RUB" };
}

/**
 * The menu for search: schema.org Menu, its chapters and categories as sections, every dish with its anchor and
 * its Нальчик price. The chain itself is the homepage's graph (JsonLd), referenced by its @id.
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
