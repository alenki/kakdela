import type { CSSProperties } from "react";
import { faq, type FaqItem, type FaqLink } from "@/content/feedback";
import { RouteLink } from "@/components/chrome/RouteLink";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { bindLastWord, typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { AskedMotion } from "./AskedMotion";

/**
 * «Уже спрашивали.»: the questions guests ask most, answered where they can read them without writing.
 * Set like a page of the café's menu: the guest's question where a dish's name would be (in the café's
 * face, sentence case), the café's short answer where the price stands (heavy caps, flush right), the
 * rest of the answer under them as the dish's description. Every entry is an anchor: /feedback#voprosy-halyal.
 */
export function Asked() {
  return (
    <section id="voprosy" className="field section-pad fb-asked" data-theme="cream" aria-labelledby="voprosy-title">
      <div className="wrap">
        <header className="section-head">
          <DialogueHeading id="voprosy-title" q={t.feedback.faq.q} a={typograf(t.feedback.faq.a)} />
          <p className="lead">{typograf(t.feedback.faq.lead)}</p>
        </header>
        {/* From 1440 the list reads down two menu columns; the server says how many rows each holds. */}
        <dl className="fb-qa" style={{ "--fb-qa-rows": Math.ceil(faq.length / 2) } as CSSProperties}>
          {faq.map((item) => (
            <div key={item.id} id={`voprosy-${item.id}`} className="fb-qa__item" data-asked-row>
              <dt className="fb-qa__q">{typograf(item.q)}</dt>
              <dd className="fb-qa__a display">{typograf(item.short)}</dd>
              <dd className="fb-qa__more">
                <More item={item} />
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <AskedMotion />
    </section>
  );
}

/**
 * The rest of the answer: its link set on the words that say it (the label found verbatim), else after it.
 * A mark right after the link («записку:», «кейтеринг.») stays on its line: the link is an inline-block,
 * which the line would otherwise break after.
 */
function More({ item: { a, link } }: { item: FaqItem }) {
  if (!link) return <>{bindLastWord(typograf(a))}</>;
  const at = a.indexOf(link.label);
  if (at < 0) {
    return (
      <>
        {typograf(a)} <FaqLinkTo link={link} />
      </>
    );
  }
  const after = a.slice(at + link.label.length);
  const mark = /^[.,:;!?…]/.exec(after)?.[0] ?? "";
  return (
    <>
      {typograf(a.slice(0, at))}
      <span className="fb-qa__glue">
        <FaqLinkTo link={link} />
        {mark}
      </span>
      {bindLastWord(typograf(after.slice(mark.length)))}
    </>
  );
}

function FaqLinkTo({ link }: { link: FaqLink }) {
  // A place on this page is a plain anchor, as the café's «Уже спрашивали» link up there is: the browser
  // then moves the keyboard on to it, where a client-side navigation would leave focus down here.
  if ("anchor" in link) {
    return (
      <a className="dlink" href={`#${link.anchor}`}>
        {typograf(link.label)}
      </a>
    );
  }
  return "to" in link ? (
    <RouteLink to={link.to} className="dlink">
      {typograf(link.label)}
    </RouteLink>
  ) : (
    <a className="dlink" href={link.href} target="_blank" rel="noreferrer">
      {link.label}
      <span className="dlink__ext" aria-hidden="true">
        ↗
      </span>
      <span className="sr-only"> {t.a11y.newTab}</span>
    </a>
  );
}
