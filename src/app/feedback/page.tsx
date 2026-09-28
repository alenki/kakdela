import type { Metadata } from "next";
import { NoteDesk } from "@/components/feedback/NoteDesk";
import { Asked } from "@/components/feedback/Asked";
import { SiteFooter } from "@/components/sections/SiteFooter";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";

export const metadata: Metadata = {
  title: t.feedback.meta.title,
  description: t.feedback.meta.description,
  alternates: { canonical: "/feedback" },
};

/**
 * «Обратная связь»: the guest's turn in the conversation. The heading, then the café's pad beside the
 * café itself (NoteDesk), then the questions already answered, and the night footer.
 */
export default function FeedbackPage() {
  return (
    <>
      <main id="main" tabIndex={-1}>
        <section id="zapiska" className="field fb" data-theme="cream" aria-labelledby="fb-title">
          <div className="wrap">
            {/* The shared section-head layout: the title on cols 1–8, the lead at 9–12 on its last baseline. */}
            <header className="section-head">
              <h1 id="fb-title" className="dlg">
                <span className="dlg-label label">{t.feedback.label}</span>{" "}
                <span className="dlg-title display">{typograf(t.feedback.title)}</span>
              </h1>
              <p className="lead">{typograf(t.feedback.lead)}</p>
            </header>
            <NoteDesk />
          </div>
        </section>
        <Asked />
      </main>
      <SiteFooter />
    </>
  );
}
