import { desserts } from "@/content/menu";
import type { Price } from "@/content/types";
import { Photo } from "@/components/brand/Photo";
import { RouteLink } from "@/components/chrome/RouteLink";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { rub } from "@/lib/format";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { EveningMotion } from "./evening/EveningMotion";

/** One price when both cities agree, otherwise both, and CSS shows the guest's city. */
function CityPrice({ price }: { price: Price }) {
  const label = (v: number | null) => (v == null ? typograf(t.hero.askLater) : rub(v));
  if (price.nalchik === price.vladikavkaz) return <>{label(price.nalchik)}</>;
  return (
    <>
      <span data-city-only="nalchik">{label(price.nalchik)}</span>
      <span data-city-only="vladikavkaz">{label(price.vladikavkaz)}</span>
    </>
  );
}

/**
 * «Вечером» / «Дальше слаще.»: the page goes to night. Three desserts, each set as a printed menu
 * entry (photo, name, price, a line of description), then the full-menu link. The chess blitz follows in a section of its own (Chess.tsx).
 */
export function EveningSection() {
  return (
    <section id="vecher" className="field section-pad evening" data-theme="ink" aria-label={t.evening.label}>
      <div className="wrap">
        <header className="section-head" data-ev-block>
          <DialogueHeading id="vecher-title" q={t.evening.q} a={typograf(t.evening.a)} />
        </header>

        <ul className="ev-desserts" role="list" data-ev-block>
          {desserts.map((d) => (
            <li key={d.id} className="ev-dessert" data-ev-item>
              {/* A third of the canvas from 640, the full width on phones. */}
              <Photo
                photo={d.photo}
                aspect="4/5"
                sizes="(min-width: 640px) 31vw, calc(100vw - 32px)"
                loading="lazy"
                className="ev-dessert__photo"
              />
              <div className="ev-dessert__text">
                <div className="ev-dessert__line">
                  <h3 className="ev-dessert__name display item-title">{d.name}</h3>
                  <p className="ev-dessert__price mono">
                    <CityPrice price={d.price} />
                  </p>
                </div>
                <p className="ev-dessert__desc">{typograf(d.desc)}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="ev-more" data-ev-block>
          <RouteLink to="menu" className="dlink ev-more__link">
            {typograf(t.evening.allDesserts)}
          </RouteLink>
        </div>
      </div>

      <EveningMotion />
    </section>
  );
}
