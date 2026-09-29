import type { Metadata } from "next";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { JsonLd } from "@/components/seo/JsonLd";
import { LocationsTop } from "@/components/locations/LocationsTop";
import { LocationsJsonLd } from "@/components/locations/LocationsJsonLd";
import { PlanController } from "@/components/locations/islands/PlanController";
import { LocationsMotion } from "@/components/locations/islands/LocationsMotion";
import { LOCATIONS_PICK_SCRIPT, LOCATIONS_PICK_STYLE } from "@/components/locations/pick-script";
import { InlineScript } from "@/components/chrome/InlineScript";
import { t } from "@/i18n";
import { EN } from "@/i18n/locale";
import { ogImage } from "@/lib/og";

const { title, description } = t.locationsPage.meta;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/locations" },
  // A page's openGraph replaces the layout's whole: the site-wide fields come along, for the invitation's preview.
  // The card is the Nalchik plan with the page's question, in each language (scripts/make-plan-card.mjs).
  openGraph: {
    type: "website",
    locale: EN ? "en_US" : "ru_RU",
    siteName: t.meta.brand,
    title,
    description,
    url: "/locations",
    images: ogImage(
      "locations.jpg",
      EN
        ? "A plan of Nalchik with the “Kak dela?” cafés and the question “Where shall we meet?”"
        : "План Нальчика с кофейнями «Как дела?» и вопрос «Где встретимся?»",
    ),
  },
};

// The third line of the conversation: the homepage asks «Как дела?», the menu «Что будете?», this page «Где
// встретимся?». One cream section: the title, the city's printed plan and its legend (the nine cafés), then the
// night footer.
export default function LocationsPage() {
  return (
    <>
      <main id="main" tabIndex={-1} className="lc">
        {/* Before paint: a hash naming a café (/locations#lermontova-4, a friend's link) marks it and shows its city. */}
        <InlineScript code={LOCATIONS_PICK_SCRIPT} />
        <style dangerouslySetInnerHTML={{ __html: LOCATIONS_PICK_STYLE }} />
        <LocationsTop />
        <PlanController />
        <LocationsMotion />
      </main>
      {/* Outside <main>: the footer is the page's contentinfo landmark. */}
      <SiteFooter />
      <JsonLd />
      <LocationsJsonLd />
    </>
  );
}
