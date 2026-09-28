import type { Metadata } from "next";
import { LegalDoc } from "@/components/privacy/LegalDoc";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { brief, policy } from "@/content/privacy";
import { t } from "@/i18n";

export const metadata: Metadata = {
  title: t.privacy.meta.title,
  description: t.privacy.meta.description,
  alternates: { canonical: "/privacy" },
};

/** The policy on personal data (152-FZ art. 18.1): what the site knows about its guests, and why. */
export default function PrivacyPage() {
  return (
    <>
      <main id="main" tabIndex={-1}>
        <LegalDoc
          id="politika"
          label={t.privacy.label}
          title={t.privacy.title}
          lead={t.privacy.lead}
          brief={brief}
          clauses={policy}
          other={{ to: "consent", label: t.privacy.consent }}
        />
      </main>
      <SiteFooter />
    </>
  );
}
