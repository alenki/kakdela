import { Hero } from "@/components/hero/Hero";
import { TeamSection } from "@/components/sections/Team";
import { BreakfastsSection } from "@/components/sections/Breakfasts";
import { CoffeeSection } from "@/components/sections/Coffee";
import { LocationsSection } from "@/components/sections/Locations";
import { ReviewsSection } from "@/components/sections/Reviews";
import { EveningSection } from "@/components/sections/Evening";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { JsonLd } from "@/components/seo/JsonLd";

// One conversation, one café day: the hero asks, every section answers.
export default function HomePage() {
  return (
    <>
      <main id="main" tabIndex={-1}>
        <Hero />
        <TeamSection />
        <BreakfastsSection />
        <CoffeeSection />
        <LocationsSection />
        <ReviewsSection />
        <EveningSection />
      </main>
      {/* Outside <main>: the footer is the page's contentinfo landmark. */}
      <SiteFooter />
      <JsonLd />
    </>
  );
}
