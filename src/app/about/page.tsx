import type { Metadata } from "next";
import { Opening } from "@/components/about/Opening";
import { Now } from "@/components/about/Now";
import { Street } from "@/components/about/Street";
import { Own } from "@/components/about/Own";
import { Welcome } from "@/components/about/Welcome";
import { Back } from "@/components/about/Back";
import { AboutMotion } from "@/components/about/AboutMotion";
import { ReviewsSection } from "@/components/sections/Reviews";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { aboutReviews } from "@/content/about";
import { t } from "@/i18n";

export const metadata: Metadata = {
  title: t.about.meta.title,
  description: t.about.meta.description,
  alternates: { canonical: "/about" },
  openGraph: { title: t.about.meta.title, description: t.about.meta.description, url: "/about" },
};

// «О нас»: the homepage asks «Как дела?»; here the guest asks back, and the café answers. The same café
// day: cream through the morning chapters and the homepage's «Отзывы», ink from the evening's welcome to
// the footer.
export default function AboutPage() {
  return (
    <>
      <main id="main" tabIndex={-1}>
        <Opening />
        <Now />
        <Street />
        <Own />
        <ReviewsSection notes={aboutReviews} />
        <Welcome />
        <Back />
      </main>
      <SiteFooter />
      <AboutMotion />
    </>
  );
}
