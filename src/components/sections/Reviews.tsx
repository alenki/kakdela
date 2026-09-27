import { reviews } from "@/content/people";
import { cafes, ratingsTotal } from "@/content/cafes";
import { external } from "@/content/routes";
import type { City } from "@/content/types";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { bindLastWord, keepWhole, typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { ReviewsMotion } from "./reviews/ReviewsMotion";

/** Every review of the chain, on the map of the guest's own city (both rendered; CSS shows one). */
const allReviews: { city: City; href: string }[] = [
  { city: "nalchik", href: external.yandexNalchik },
  { city: "vladikavkaz", href: external.yandexVladikavkaz },
];

/** «ул. Байсултанова, 1» → «Байсултанова, 1», as the figures name it. */
const streetName = (address: string) => address.replace(/^(ул\.|пр\.)\s+/, "");

/** 5 → «5,0». */
const score = (n: number) => n.toFixed(1).replace(".", ",");

/** The most-rated café: its score is the big «5,0» (static; never counts up), the figures say whose it is. */
const flagship = cafes.reduce((a, b) => (b.ratingsCount > a.ratingsCount ? b : a));
const figures = [
  t.reviews.figures.flagship(streetName(flagship.address), flagship.ratingsCount),
  t.reviews.figures.range(score(ratingsTotal.min), score(ratingsTotal.max)),
  t.reviews.figures.total(ratingsTotal.ratings),
];

/** « ↗» and the screen-reader note after an external link. */
function NewTab() {
  return (
    <>
      <span className="dlink__ext" aria-hidden="true">
        ↗
      </span>
      <span className="sr-only"> {t.a11y.newTab}</span>
    </>
  );
}

export function ReviewsSection() {
  return (
    <section id="otzyvy" className="field section-pad rv" data-theme="cream" aria-labelledby="otzyvy-title">
      <div className="wrap">
        <header className="section-head">
          <DialogueHeading id="otzyvy-title" q={t.reviews.q} a={typograf(t.reviews.a)} />
          {/* The guests' answer, in the lead's place: the 5,0 on the title's baseline, and where it comes from. */}
          <div className="rv-score" data-rv-reveal>
            <p className="rv-score__num display">{score(flagship.rating)}</p>
            <ul className="rv-score__figs label" role="list">
              {figures.map((f) => (
                <li key={f}>{typograf(f)}</li>
              ))}
            </ul>
          </div>
        </header>

        {/* Guests, verbatim. */}
        <ul className="rv-quotes" role="list">
          {reviews.map((r) => {
            const cafe = cafes.find((c) => c.id === r.cafeId);
            return (
              <li key={r.id} data-rv-reveal>
                <figure className="rv-q" data-permission={r.permission ? undefined : "pending"}>
                  {/* A dish named in a quote never breaks: «Как в сказке» stays on one line. */}
                  <blockquote className="rv-q__quote" cite={r.sourceUrl}>
                    <p className="rv-q__text reply">{bindLastWord(keepWhole(typograf(r.text)))}</p>
                  </blockquote>
                  <figcaption className="rv-q__cap label">
                    {/* «Байсултанова, 1 ·», then the source as the link. */}
                    {cafe && <>{typograf(`${streetName(cafe.address)} ·`)} </>}
                    <a className="dlink" href={r.sourceUrl} target="_blank" rel="noreferrer">
                      {t.reviews.source}
                      <NewTab />
                    </a>
                  </figcaption>
                </figure>
              </li>
            );
          })}
        </ul>

        <p className="rv-all" data-rv-reveal>
          {allReviews.map(({ city, href }) => (
            <a key={city} className="dlink" href={href} target="_blank" rel="noreferrer" data-city-only={city}>
              {t.reviews.all}
              <NewTab />
            </a>
          ))}
        </p>
      </div>
      <ReviewsMotion />
    </section>
  );
}
