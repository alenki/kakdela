import type { Metadata } from "next";
import { LegalDoc } from "@/components/privacy/LegalDoc";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { consent, consentIntro } from "@/content/privacy";
import { t } from "@/i18n";

export const metadata: Metadata = {
  title: t.consent.meta.title,
  description: t.consent.meta.description,
  alternates: { canonical: "/privacy/consent" },
};

/**
 * The consent a guest gives on the note, set out on its own (152-FZ art. 9 part 1: separately from any
 * other document, since 01.09.2025). The note's tick links here.
 */
export default function ConsentPage() {
  return (
    <>
      <main id="main" tabIndex={-1}>
        <LegalDoc
          id="soglasie"
          label={t.consent.label}
          title={t.consent.title}
          lead={t.consent.lead}
          intro={consentIntro}
          clauses={consent}
          other={{ to: "privacy", label: t.consent.policy }}
        />
      </main>
      <SiteFooter />
    </>
  );
}
