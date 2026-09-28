import { signatureDrinks } from "@/content/menu";
import { photos } from "@/content/photos";
import type { City, Drink, Photo } from "@/content/types";
import { Wordmark } from "@/components/brand/Wordmark";
import { RouteLink } from "@/components/chrome/RouteLink";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { groupDigits, rub } from "@/lib/format";
import { bindLastWord, keepWhole, typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { CoffeeMotion } from "./coffee/CoffeeMotion";
import { Cup, CupGround, CupSteam } from "./coffee/Cup";
import { HatchedClover } from "./coffee/HatchedClover";
import { ARROW_D, noteLines } from "./coffee/note";
import { NoteArrow, NoteScribble, NoteSvg } from "./coffee/NoteSvg";
import { OctPhoto } from "./coffee/OctPhoto";

const CITIES: City[] = ["nalchik", "vladikavkaz"];

// Drinks with the client's own photo. V60 has none yet: it wears the logo badge instead.
const DRINK_PHOTO: Record<string, Photo | undefined> = {
  kapuchino: photos.kapuchino,
  klever: photos.klever,
  "stanciya-mir": photos.stanciyaMir,
  "dalshe-slashe": photos.dalsheSlashe,
  "espresso-tonik": photos.espressoTonik,
};

/** Cup sizes share one price line («240 / 270 ₽»); a city price renders for both cities and CSS shows one. */
function DrinkPrice({ price }: { price: Drink["price"] }) {
  if ("sizes" in price) {
    const [s, l] = price.sizes;
    return (
      <>
        {groupDigits(s)} / {rub(l)}
      </>
    );
  }
  return CITIES.map((c) => {
    const v = price[c];
    return (
      <span key={c} data-city-only={c} className={v == null ? "drink__ask" : undefined}>
        {v != null ? rub(v) : typograf(t.hero.askLater)}
      </span>
    );
  });
}

/**
 * The barista's note under a drink, in their hand: «классика? → капучино 240». Hidden from screen
 * readers: it repeats the name and the price. Both cities only when their prices differ.
 */
function RowNote({ drink }: { drink: Drink }) {
  const [nalchik, vladikavkaz] = CITIES.map((c) => noteLines(drink, c));
  if (!nalchik || !vladikavkaz) return null;
  const says: { city?: City; say: string }[] =
    nalchik[1] === vladikavkaz[1]
      ? [{ say: nalchik[1] }]
      : [
          { city: "nalchik", say: nalchik[1] },
          { city: "vladikavkaz", say: vladikavkaz[1] },
        ];
  return (
    <p className="drink__note" aria-hidden="true">
      <span>{typograf(nalchik[0])}</span>{" "}
      {says.map(({ city, say }) => (
        <span key={city ?? "both"} className="drink__note-a" data-city-only={city}>
          <NoteArrow className="drink__arrow" /> {say}
        </span>
      ))}
    </p>
  );
}

/**
 * «А кофе?» / «А с кофе мы не шутим.»: the page's one poster, on the tomato field (docs/CONVENTIONS.md,
 * «Coffee: the poster»). Desktop: the answer runs gutter to gutter; under it the cobalt takeaway cup
 * stays in view (CSS sticky) while the signature card scrolls past it, one column of drinks up to
 * 1600px and a two-column board beyond. Phones: a small sticky band with the cup rides under the
 * header instead. The CoffeeMotion island has the barista rewrite the note on the cup for each drink.
 */
export function CoffeeSection() {
  return (
    <section id="kofe" className="field section-pad coffee" data-theme="tomato" aria-labelledby="kofe-title">
      <div className="wrap coffee__grid">
        <DialogueHeading
          id="kofe-title"
          q={t.coffee.q}
          ask={typograf(t.coffee.ask)}
          a={typograf(t.coffee.a)}
          className="coffee__head"
          answerClassName="coffee__answer"
        />
        <p className="coffee__lead reply">{bindLastWord(typograf(t.coffee.lead))}</p>

        {/* Desktop: the tall sticky column. Decorative: the card says everything the cup does. The
            contact shadow stays on the counter; inside the drop (the landing) the cup rocks on its base. */}
        <div className="coffee__cupcol" aria-hidden="true">
          <div className="coffee__sticky">
            <div className="coffee__halo">
              <span className="coffee__halo-turn" data-halo-turn>
                <HatchedClover id="kofe-halo" seed={20260404} pitch={11} className="coffee__clover" />
              </span>
            </div>
            <div className="coffee__cupwrap">
              <CupGround className="coffee__ground" />
              <div className="coffee__drop" data-cup-drop>
                <div className="coffee__rock" data-cup-rock>
                  <CupSteam className="coffee__steam" />
                  <Cup id="kofe-cup" className="coffee__cup" ground={false} note={<NoteSvg idPrefix="kofe-note" />} />
                </div>
              </div>
            </div>
            <span className="coffee__counter" />
          </div>
        </div>

        <div className="coffee__menu">
          {/* Phones and tablets: a small sticky band under the header carries the note instead. */}
          <div className="coffee__badge" aria-hidden="true" data-cup-badge>
            <div className="coffee__badge-inner">
              <span className="coffee__badge-cupwrap">
                <CupGround className="coffee__badge-ground" />
                <span className="coffee__badge-drop" data-cup-drop>
                  <span className="coffee__badge-rock" data-cup-rock>
                    <Cup id="kofe-badge" className="coffee__badge-cup" ground={false} note={<NoteScribble />} />
                  </span>
                </span>
              </span>
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
            <div className="coffee__card-head">
              <span>
                <span aria-hidden="true">01 / </span>
                <span id="kofe-list-title">{t.coffee.listTitle}</span>
              </span>
              <span className="coffee__card-city">
                {CITIES.map((c) => (
                  <span key={c} data-city-only={c}>
                    {typograf(`${t.breakfasts.prices} · ${t.city[c]}`)}
                  </span>
                ))}
              </span>
            </div>
            <ul className="coffee__list" role="list" aria-labelledby="kofe-list-title" data-cup-list>
              {signatureDrinks.map((d) => {
                const photo = DRINK_PHOTO[d.id];
                const [nalchik, vladikavkaz] = CITIES.map((c) => noteLines(d, c));
                return (
                  <li
                    key={d.id}
                    className="drink"
                    data-cup-row
                    data-ask={nalchik ? typograf(nalchik[0]) : undefined}
                    data-say-nalchik={nalchik?.[1]}
                    data-say-vladikavkaz={vladikavkaz?.[1]}
                  >
                    <div className="drink__main">
                      <div className="drink__line">
                        <h3 className="drink__name display item-title" lang={d.lang}>
                          {/* The drink the cup is writing about: a hand-drawn arrow points at it. */}
                          <svg className="drink__marker" viewBox="-1 -7 19 12" aria-hidden="true" focusable="false">
                            <path d={ARROW_D} data-marker />
                          </svg>
                          <RouteLink to="menu" hash={d.id} className="drink__link">
                            {keepWhole(typograf(d.name))}
                          </RouteLink>
                        </h3>
                        <span className="drink__leader" aria-hidden="true" />
                        <p className="drink__price mono">
                          <DrinkPrice price={d.price} />
                        </p>
                      </div>
                      {d.desc && <p className="drink__desc">{typograf(d.desc)}</p>}
                      <RowNote drink={d} />
                    </div>
                    <div className="drink__thumb">
                      {photo ? (
                        <OctPhoto
                          photo={photo}
                          sizes="(min-width: 1600px) 8vw, (min-width: 1024px) min(11vw, 168px), (min-width: 640px) min(11vw, 112px), 84px"
                          loading="lazy"
                        />
                      ) : (
                        <Wordmark variant="badge" className="drink__badge" cloverClassName="drink__badge-clover" />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <p className="dlinks coffee__links">
          <RouteLink to="menu" className="dlink">
            {typograf(t.coffee.links.menu)}
          </RouteLink>
          <RouteLink to="delivery" className="dlink">
            {typograf(t.coffee.links.delivery)}
          </RouteLink>
        </p>
      </div>
      <CoffeeMotion />
    </section>
  );
}
