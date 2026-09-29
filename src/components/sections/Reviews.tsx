import type { CSSProperties } from "react";
import { reviews } from "@/content/people";
import { cafes } from "@/content/cafes";
import { external } from "@/content/routes";
import type { City, Review } from "@/content/types";
import { Slip } from "@/components/brand/Slip";
import { BtnLabel } from "@/components/chrome/BtnLabel";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { tornSheet } from "@/lib/tear";
import { bindLastWord, keepWhole, quote, typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { ReviewsPile } from "./reviews/ReviewsPile";
import { ReviewsMotion } from "./reviews/ReviewsMotion";

/** Every review of the chain, on the map of the guest's own city (both rendered; CSS shows one). */
const allReviews: { city: City; href: string }[] = [
  { city: "nalchik", href: external.yandexNalchik },
  { city: "vladikavkaz", href: external.yandexVladikavkaz },
];

/** «ул. Байсултанова, 1» → «Байсултанова, 1». */
const streetName = (address: string) => address.replace(/^(ул\.|пр\.)\s+/, "");

/** 5 → «5,0». */
const score = (n: number) => n.toFixed(1).replace(".", ",");

/** The most-rated café: its score is the 5,0 on the slip, and the screen reader's line says whose it is. */
const flagship = cafes.reduce((a, b) => (b.ratingsCount > a.ratingsCount ? b : a));

/** A guest's words: dish names whole, no lone last word, then «…» around it all (quote() goes last). */
const said = (text: string) => quote(bindLastWord(keepWhole(typograf(text))));

/** Each note's own rip along its top and its own small lean, seeded by the review. */
const sheets = new Map(
  reviews.map((r) => {
    const { clip, fibres, lean } = tornSheet(r.id);
    return [r.id, { "--rip": clip, "--fibres": fibres, "--lean": `${lean}deg` } as CSSProperties];
  }),
);

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

/** A thin line arrow pointing left; the next arrow is the same one turned round (reviews.css). */
function Arrow() {
  return (
    <svg className="rv-arrow__icon" viewBox="0 0 48 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M47 8H1M8 1 1 8l7 7" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/**
 * The café asks in the title, and the flagship's 5,0 answers beside it on the notice's paper. Under it
 * the guests answer, verbatim, on notes of the same paper lying in a pile: one on top, the others under
 * it. Every note is server-rendered in its place (data-pos, 0 on top); ReviewsPile throws the top one
 * aside and brings the others up, and without JS the first note stays on top. The about page lays its
 * own choice of the notes (`notes`); the homepage lays them all.
 */
export function ReviewsSection({ notes = reviews }: { notes?: Review[] }) {
  const n = notes.length;
  const many = n > 1;
  return (
    <section id="otzyvy" className="field section-pad rv" data-theme="cream" aria-label={t.reviews.q}>
      <div className="wrap">
        <header className="rv-head">
          <DialogueHeading id="otzyvy-title" q={t.reviews.q} a={typograf(t.reviews.a)} />
          <Slip seed={flagship.id} label={score(flagship.rating)} className="rv-slip" aria-hidden="true" data-rv-slip />
          <p className="sr-only">{typograf(t.reviews.rating(streetName(flagship.address), score(flagship.rating)))}</p>
        </header>

        <div className="rv-pile">
          {/* All the notes in one cell, so the longest quote sets the pile's size. */}
          <ul className="rv-notes" id="rv-notes">
            {notes.map((r, i) => (
              <li
                key={r.id}
                className="rv-note"
                data-pos={i}
                data-rv-say={t.reviews.shown(i + 1, n, r.text)}
                data-permission={r.permission ? undefined : "pending"}
                style={sheets.get(r.id)}
              >
                {/* One motion per wrapper: the landing (ReviewsMotion), then the throw (ReviewsPile). */}
                <div className="rv-note__land">
                  <div className="rv-note__fly">
                    <div className="rv-note__paper">
                      <blockquote className="rv-note__sheet" cite={r.sourceUrl}>
                        <p className="rv-quote reply">{said(r.text)}</p>
                      </blockquote>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {many && (
            <div className="rv-ctrl" data-rv-reveal>
              <button
                type="button"
                className="btn rv-arrow rv-arrow--prev"
                aria-label={t.reviews.prev}
                aria-controls="rv-notes"
                data-rv-prev
              >
                <BtnLabel>
                  <Arrow />
                </BtnLabel>
              </button>
              <button
                type="button"
                className="btn rv-arrow rv-arrow--next"
                aria-label={t.reviews.next}
                aria-controls="rv-notes"
                data-rv-next
              >
                <BtnLabel>
                  <Arrow />
                </BtnLabel>
              </button>
            </div>
          )}
        </div>

        <p className="rv-all" data-rv-reveal>
          {allReviews.map(({ city, href }) => (
            <a key={city} className="dlink" href={href} target="_blank" rel="noreferrer" data-city-only={city}>
              {t.reviews.all}
              <NewTab />
            </a>
          ))}
        </p>
      </div>
      {/* «Отзыв 2 из 3: …», written by ReviewsPile when the note on top changes. */}
      <p className="sr-only" aria-live="polite" aria-atomic="true" data-rv-live />
      {many && <ReviewsPile />}
      <ReviewsMotion />
    </section>
  );
}
