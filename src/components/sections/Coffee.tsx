import { signatureDrinks } from "@/content/menu";
import { photos } from "@/content/photos";
import type { City, Drink } from "@/content/types";
import { Photo } from "@/components/brand/Photo";
import { RouteLink } from "@/components/chrome/RouteLink";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { groupDigits, rub } from "@/lib/format";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { CoffeeMotion } from "./coffee/CoffeeMotion";

const CITIES: City[] = ["nalchik", "vladikavkaz"];

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
 * «Кофе» / «А с кофе мы не шутим.»: one drink photo beside the house list, set like a printed menu
 * (name, dotted leader, price; a line of description under it). From 1024px the photo runs out to the
 * left edge and spans the list from its first rule to its last.
 */
export function CoffeeSection() {
  return (
    <section id="kofe" className="field section-pad coffee" data-theme="cream" aria-labelledby="kofe-title">
      <div className="wrap">
        <header className="section-head" data-kofe-head>
          <DialogueHeading id="kofe-title" q={t.coffee.q} a={typograf(t.coffee.a)} />
          <p className="lead">{typograf(t.coffee.lead)}</p>
        </header>

        <div className="coffee__body">
          <div className="coffee__photo" data-kofe-photo>
            {/* The frame's width. From 480 to 1023 it is 3:2, the source's own shape, so it needs none of
                the 4:5 cover scaling Photo applies (×1.875): 54vw × 1.875 ≈ 100vw. */}
            <Photo
              photo={photos.stanciyaMir}
              aspect="4/5"
              sizes="(min-width: 1280px) 58vw, (min-width: 1024px) 49vw, (min-width: 480px) 54vw, 100vw"
              loading="lazy"
            />
          </div>

          <p id="kofe-list-title" className="label coffee__label" data-kofe-rise>
            {t.coffee.listTitle}
          </p>
          <ul className="coffee__list" role="list" aria-labelledby="kofe-list-title">
            {signatureDrinks.map((d) => (
              <li key={d.id} className="drink" data-kofe-rise>
                <div className="drink__line">
                  <h3 className="drink__name display item-title" lang={d.lang}>
                    {typograf(d.name)}
                  </h3>
                  <span className="leader" aria-hidden="true" />
                  <p className="drink__price mono">
                    <DrinkPrice price={d.price} />
                  </p>
                </div>
                {d.desc && <p className="drink__desc">{typograf(d.desc)}</p>}
              </li>
            ))}
          </ul>

          <p className="dlinks coffee__links" data-kofe-rise>
            <RouteLink to="menu" className="dlink">
              {typograf(t.coffee.links.menu)}
            </RouteLink>
            <RouteLink to="delivery" className="dlink">
              {typograf(t.coffee.links.delivery)}
            </RouteLink>
          </p>
        </div>
      </div>
      <CoffeeMotion />
    </section>
  );
}
