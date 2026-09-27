import { signatureDrinks } from "@/content/menu";
import { photos } from "@/content/photos";
import type { Drink, Photo } from "@/content/types";
import { FlatCup } from "@/components/brand/FlatCup";
import { OctPhoto } from "@/components/brand/OctPhoto";
import { Wordmark } from "@/components/brand/Wordmark";
import { HatchedClover } from "@/components/brand/Clover";
import { RouteLink } from "@/components/chrome/RouteLink";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { groupDigits, rub } from "@/lib/format";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { CupNote } from "./coffee/CupNote";
import { NoteArrow, NoteScribble, NoteSvg, splitNote } from "./coffee/NoteSvg";

// Drinks that have the client's own photo. V60 has none yet: it wears the logo badge instead.
const DRINK_PHOTO: Record<string, Photo | undefined> = {
  kapuchino: photos.kapuchino,
  klever: photos.klever,
  "stanciya-mir": photos.stanciyaMir,
  "dalshe-slashe": photos.dalsheSlashe,
  "espresso-tonik": photos.espressoTonik,
};

function DrinkPrice({ price }: { price: Drink["price"] }) {
  if ("sizes" in price) {
    const [s, l] = price.sizes;
    return (
      <>
        {groupDigits(s)} / {rub(l)}
      </>
    );
  }
  return (
    <>
      <span data-city-only="nalchik">{price.nalchik != null ? rub(price.nalchik) : typograf(t.hero.askLater)}</span>
      <span data-city-only="vladikavkaz">{price.vladikavkaz != null ? rub(price.vladikavkaz) : typograf(t.hero.askLater)}</span>
    </>
  );
}

function RowNote({ note }: { note: string }) {
  const [q, a] = splitNote(note);
  // Only the question is prose («в горы?»); the answer («V60 280») is a name and a price, not a number to group.
  return (
    <p className="drink__note mono" aria-hidden="true">
      <span>{typograf(q)}</span>
      {a && (
        <>
          {" "}
          <span className="drink__note-a">
            <NoteArrow className="drink__arrow" /> {a}
          </span>
        </>
      )}
    </p>
  );
}

/**
 * «— А кофе?» / «— А с кофе мы не шутим.» — the loud supporting set-piece on the tomato field.
 * Desktop: the answer runs gutter to gutter; under it the cobalt takeaway cup stays in view (CSS
 * sticky) while the signature card scrolls past it — one column of drinks up to 1600px, a two-column
 * menu board beyond. The CupNote island rewrites the barista's note on the sleeve for each drink.
 */
export function CoffeeSection() {
  return (
    <section id="kofe" className="field section-pad coffee" data-theme="tomato" aria-labelledby="kofe-title">
      <div className="wrap coffee__grid">
        <DialogueHeading id="kofe-title" q={t.coffee.q} a={t.coffee.a} className="coffee__head" answerClassName="coffee__answer" />
        <p className="coffee__lead reply">{typograf(t.coffee.lead)}</p>

        {/* Desktop: the tall sticky column. */}
        <div className="coffee__cupcol" aria-hidden="true">
          <div className="coffee__sticky">
            <div className="coffee__halo" data-cup-halo>
              <HatchedClover solid={false} seed={20260404} pitch={11} className="coffee__clover" />
            </div>
            <div className="coffee__cupwrap" data-cup-enter>
              <FlatCup className="coffee__cup" note={<NoteSvg idPrefix="kofe-note" />} noteClipId="kofe-note-wipe" />
            </div>
            <span className="coffee__counter" />
          </div>
        </div>

        <div className="coffee__menu">
          {/* A tomato mat that rides under the fixed header while the card scrolls beneath it, so the
              header's milk labels never land on the milk card (every width, every motion mode). */}
          <div className="coffee__mat" aria-hidden="true" />
          {/* Mobile: a small sticky badge under the header carries the note instead. */}
          <div className="coffee__badge" aria-hidden="true" data-cup-badge>
            <div className="coffee__badge-inner">
              <FlatCup className="coffee__badge-cup" note={<NoteScribble />} noteClipId="kofe-badge-wipe" />
              <p className="coffee__badge-note">
                <span className="coffee__badge-l1" data-bn-l1>
                  {t.coffee.defaultNote}
                </span>
                <span className="coffee__badge-l2" data-bn-l2 hidden>
                  <NoteArrow className="coffee__badge-arrow" />
                  <span data-bn-l2t />
                </span>
              </p>
            </div>
          </div>

          <div className="coffee__card">
            <div className="coffee__card-head label">
              <span>01 / {t.coffee.cardTitle}</span>
              <span className="coffee__card-city">
                <span data-city-only="nalchik">{typograf(t.hero.priceNote.nalchik)}</span>
                <span data-city-only="vladikavkaz">{typograf(t.hero.priceNote.vladikavkaz)}</span>
              </span>
            </div>
            <ul className="coffee__list">
              {signatureDrinks.map((d) => {
                const photo = DRINK_PHOTO[d.id];
                return (
                  <li key={d.id} className="drink" data-cup-row data-note={d.cupNote ?? t.coffee.defaultNote}>
                    <div className="drink__main">
                      <div className="drink__line">
                        <h3 className="drink__name a-voice" lang={d.lang}>
                          {d.name}
                        </h3>
                        <span className="leader" aria-hidden="true" />
                        <p className="drink__price mono">
                          <DrinkPrice price={d.price} />
                        </p>
                      </div>
                      {d.desc && <p className="drink__desc">{typograf(d.desc)}</p>}
                      {d.cupNote && <RowNote note={d.cupNote} />}
                    </div>
                    <div className="drink__thumb">
                      {photo ? (
                        <OctPhoto photo={photo} sizes="(min-width: 1600px) 8vw, (min-width: 764px) 11vw, 84px" loading="lazy" />
                      ) : (
                        <Wordmark variant="badge" className="drink__badge" />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <p className="coffee__links">
          <RouteLink to="menu" className="dlink">
            <span className="dash">—</span>
            <span className="coffee__link-label">{typograf(t.coffee.links.menu)}</span>
          </RouteLink>
          <RouteLink to="delivery" className="dlink">
            <span className="dash">—</span>
            <span className="coffee__link-label">{typograf(t.coffee.links.delivery)}</span>
          </RouteLink>
        </p>
      </div>
      <CupNote />
    </section>
  );
}
