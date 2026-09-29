import { cafes } from "@/content/cafes";
import { external, routes, SITE_URL, yandexOrg } from "@/content/routes";
import { t } from "@/i18n";

const BASE = SITE_URL;

/** Structured data for the chain and its nine cafés. No self-served aggregateRating (Google policy). */
export function JsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${BASE}/#org`,
        name: t.meta.brand,
        url: BASE,
        logo: `${BASE}/icon.svg`,
        sameAs: [external.instagram, external.telegram],
      },
      ...cafes.map((c) => ({
        "@type": "CafeOrCoffeeShop",
        "@id": `${BASE}/#cafe-${c.id}`,
        name: t.meta.cafeName(c.address),
        parentOrganization: { "@id": `${BASE}/#org` },
        address: {
          "@type": "PostalAddress",
          streetAddress: c.address,
          addressLocality: t.city[c.city],
          addressCountry: "RU",
        },
        geo: { "@type": "GeoCoordinates", latitude: c.coords.lat, longitude: c.coords.lon },
        telephone: c.phone,
        servesCuisine: t.meta.cuisine,
        priceRange: "₽₽",
        openingHoursSpecification: {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          opens: c.open,
          closes: c.close === "00:00" ? "23:59" : c.close,
        },
        hasMap: yandexOrg(c.yandexOrgId),
        // Each café's own place on the site: its row on /locations, and its storefront (never a stock stand-in).
        url: `${BASE}${routes.locations.href}#${c.id}`,
        ...(c.photo.placeholder ? {} : { image: new URL(c.photo.src.src, BASE).href }),
      })),
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
