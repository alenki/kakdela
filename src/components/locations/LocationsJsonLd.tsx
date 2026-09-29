import { cafes } from "@/content/cafes";
import { routes, SITE_URL } from "@/content/routes";
import { t } from "@/i18n";

/**
 * The page itself for search: a collection of the nine cafés (their full entries are the chain's graph in JsonLd,
 * by the same @ids) and its place under the homepage. No aggregateRating: the ratings are Yandex's, linked.
 */
export function LocationsJsonLd() {
  const url = `${SITE_URL}${routes.locations.href}`;
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${url}#page`,
        url,
        name: t.locationsPage.meta.title,
        description: t.locationsPage.meta.description,
        inLanguage: "ru-RU",
        about: { "@id": `${SITE_URL}/#org` },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: cafes.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: `${url}#${c.id}`, item: { "@id": `${SITE_URL}/#cafe-${c.id}` } })),
        },
        breadcrumb: {
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: t.meta.brand, item: `${SITE_URL}/` },
            { "@type": "ListItem", position: 2, name: t.locations.q, item: url },
          ],
        },
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
