import { faq } from "@/content/feedback";
import { RouteLink } from "@/components/chrome/RouteLink";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { bindLastWord, typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { AskedMotion } from "./AskedMotion";

/**
 * «Уже спрашивали.»: the questions guests ask most, answered where they can read them without writing.
 * Set like a menu: the question in the display face where a dish's name would be, the café's answer
 * beside it where its description would be, one hairline between rows.
 */
export function Asked() {
  return (
    <section id="voprosy" className="field section-pad fb-asked" data-theme="cream" aria-labelledby="voprosy-title">
      <div className="wrap">
        <header className="section-head">
          <DialogueHeading id="voprosy-title" q={t.feedback.faq.q} a={typograf(t.feedback.faq.a)} />
          <p className="lead">{typograf(t.feedback.faq.lead)}</p>
        </header>
        <dl className="fb-qa">
          {faq.map((item) => (
            <div key={item.id} className="fb-qa__row" data-asked-row>
              <dt className="fb-qa__q display">{typograf(item.q)}</dt>
              <dd className="fb-qa__a">
                <p>{bindLastWord(typograf(item.a))}</p>
                {item.link &&
                  ("to" in item.link ? (
                    <RouteLink to={item.link.to} className="dlink">
                      {typograf(item.link.label)}
                    </RouteLink>
                  ) : (
                    <a className="dlink" href={item.link.href} target="_blank" rel="noreferrer">
                      {item.link.label}
                      <span className="dlink__ext" aria-hidden="true">
                        ↗
                      </span>
                      <span className="sr-only"> {t.a11y.newTab}</span>
                    </a>
                  ))}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <AskedMotion />
    </section>
  );
}
