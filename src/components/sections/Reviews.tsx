import { Fragment, type ReactElement } from "react";
import Image from "next/image";
import { reviews } from "@/content/people";
import { cafes, ratingsTotal } from "@/content/cafes";
import { answerById } from "@/content/answers";
import { external } from "@/content/routes";
import type { AnswerId, City, Review } from "@/content/types";
import { Clover } from "@/components/brand/Clover";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { bindLastWord, NBSP, typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { ReviewsMotion } from "./reviews/ReviewsMotion";

const OCT_LINE = "50,0.75 85.1,14.9 99.25,50 85.1,85.1 50,99.25 14.9,85.1 0.75,50 14.9,14.9";

const allReviews: { city: City; href: string }[] = [
  { city: "nalchik", href: external.yandexNalchik },
  { city: "vladikavkaz", href: external.yandexVladikavkaz },
];

/** «ул. Байсултанова, 1» → «Байсултанова, 1», as the figures name it. */
const streetName = (address: string) => address.replace(/^(ул\.|пр\.)\s+/, "");

/** The guests' answer: the network's top rating, «5,0» (static; never counts up). */
const [scoreWhole, scoreFrac] = ratingsTotal.max.toFixed(1).split(".");

/** ↗ drawn, not typed (glyph coverage varies across the four families). */
function ExtArrow() {
  return (
    <svg className="rv-ext" viewBox="0 0 10 10" aria-hidden="true" focusable="false">
      <path d="M2.5 7.5 7.5 2.5M3.6 2.5h3.9v3.9" fill="none" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** «a — b» inside a mono figure: the separator keeps the section's tomato dash. */
function Figure({ text }: { text: string }) {
  const parts = text.split(" — ");
  return (
    <>
      {parts.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <>
              {NBSP}
              <span className="rv-fig__dash">—</span>{" "}
            </>
          )}
          {typograf(p)}
        </Fragment>
      ))}
    </>
  );
}

/** A dish the guest named: set in the answer voice, links to the breakfasts; a peek of the plate on hover. */
function DishMention({ id }: { id: AnswerId }) {
  const a = answerById[id];
  return (
    <a href="#zavtraki" className="rv-dish">
      <span className="rv-dish__name a-voice">{a.label}</span>
      {/* Stock stand-ins say so, as they do in the hero's octagon. */}
      <span className="rv-dish__peek" aria-hidden="true" data-placeholder={a.item.photo.placeholder ? "" : undefined}>
        <span className="rv-dish__mat octagon" />
        <span className="rv-dish__oct octagon">
          <Image src={a.item.photo.src} alt="" fill sizes="120px" loading="lazy" className="rv-dish__img" />
        </span>
        <svg className="rv-dish__line" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
          <polygon points={OCT_LINE} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>
      </span>
    </a>
  );
}

/** Verbatim text; any «dish» the guest mentions by name becomes a link to it. */
function QuoteText({ review }: { review: Review }) {
  let nodes: (string | ReactElement)[] = [review.text];
  for (const id of review.mentions ?? []) {
    const needle = `«${answerById[id].label}»`;
    nodes = nodes.flatMap((n) => {
      if (typeof n !== "string" || !n.includes(needle)) return [n];
      const [before, ...rest] = n.split(needle);
      return [before, "«", <DishMention key={id} id={id} />, "»", rest.join(needle)];
    });
  }
  // Typeset after the split, so the dish names are still found verbatim; the last two words travel
  // together, so no quote ends on a lone «эспрессо.».
  const last = nodes.length - 1;
  return (
    <>
      {nodes.map((n, i) => (typeof n !== "string" ? n : i === last ? bindLastWord(typograf(n)) : typograf(n)))}
    </>
  );
}

export function ReviewsSection() {
  const { flagship, range, total } = t.reviews.figures;
  const thanks = t.reviews.thanks.split(/(?<=\.)\s+/);

  return (
    <section id="otzyvy" className="field section-pad rv" data-theme="cream" aria-labelledby="otzyvy-title">
      <div className="wrap rv__grid">
        {/* The question and the guests' answer: a static 5,0 (never counts up). */}
        <div className="rv__aside">
          <DialogueHeading q={t.reviews.q} id="otzyvy-title" className="rv__dlg">
            <span className="dlg-line dlg-a a-voice rv__score" data-dlg-a>
              <span className="dash">—</span>{" "}
              <span className="rv__num">
                {scoreWhole}
                <span className="rv__comma">,</span>
                {scoreFrac}
              </span>
            </span>
          </DialogueHeading>
          <ul className="rv__figs label" role="list">
            {[flagship, range, total].map((f) => (
              <li key={f} className="rv__fig">
                <span>
                  <Figure text={f} />
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Guests, verbatim. Each line hangs on a tomato dash in the margin. */}
        <div className="rv__quotes">
          {reviews.map((r) => {
            const cafe = cafes.find((c) => c.id === r.cafeId);
            return (
              <figure key={r.id} className="rv-q" data-rv-q data-permission={r.permission ? undefined : "pending"}>
                <span className="rv-q__dash" aria-hidden="true" data-rv-dash>
                  —
                </span>
                <blockquote className="rv-q__quote" cite={r.sourceUrl}>
                  <p className="rv-q__text" data-rv-text>
                    <QuoteText review={r} />
                  </p>
                </blockquote>
                <figcaption className="rv-q__cap" data-rv-cap>
                  <a className="rv-q__src label" href={r.sourceUrl} target="_blank" rel="noreferrer">
                    <span>{typograf(t.reviews.source)}</span>
                    {cafe && (
                      <span className="rv-q__cafe">
                        <span className="rv-q__sep" aria-hidden="true">
                          ·
                        </span>
                        {streetName(cafe.address)}
                        <ExtArrow />
                      </span>
                    )}
                    {!cafe && <ExtArrow />}
                    <span className="sr-only"> {t.a11y.newTab}</span>
                  </a>
                </figcaption>
              </figure>
            );
          })}

          {/* The café signs off: its clover takes the dash's place in the margin. */}
          <div className="rv__close" data-rv-close>
            <span className="rv__clover" aria-hidden="true" data-rv-clover>
              <Clover />
            </span>
            <p className="rv__thanks reply">
              {thanks.map((line, i) => (
                <Fragment key={i}>
                  {i > 0 && " "}
                  <span className="rv__thanks-mask">
                    <span className="rv__thanks-line" data-rv-line>
                      {typograf(line)}
                    </span>
                  </span>
                </Fragment>
              ))}
            </p>
            {allReviews.map(({ city, href }) => (
              <a key={city} className="dlink rv__all" href={href} target="_blank" rel="noreferrer" data-city-only={city}>
                <span className="dash">—</span>
                {t.reviews.all}
                <span className="rv__all-city label">{t.city[city]}</span>
                <ExtArrow />
                <span className="sr-only"> {t.a11y.newTab}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
      <ReviewsMotion />
    </section>
  );
}
