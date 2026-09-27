import { desserts, cherryPie } from "@/content/menu";
import { chessEvent } from "@/content/people";
import { external } from "@/content/routes";
import type { Price } from "@/content/types";
import { Photo } from "@/components/brand/Photo";
import { RouteLink } from "@/components/chrome/RouteLink";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { rub } from "@/lib/format";
import { typograf, WJ } from "@/lib/typograf";
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

/** The chess facts, one sentence to a line, the dates last: a notice reads down, not across. */
const chessFacts = [...typograf(chessEvent.body).split(/(?<=\.) (?=\S)/), `${typograf(chessEvent.when)}.`];

/**
 * «Вечером» / «Дальше слаще.»: the page goes to night. Three desserts set like the coffee list
 * (photo, name, dotted leader, price, a line of description), the cherry pie as a secondary menu row
 * beside the full-menu link, then the chess blitz as a plain event block below a hairline.
 */
export function EveningSection() {
  return (
    <section id="vecher" className="field section-pad evening" data-theme="ink" aria-label={t.evening.label}>
      <div className="wrap">
        <header className="section-head" data-ev-block>
          <DialogueHeading id="vecher-title" q={t.evening.q} a={typograf(t.evening.a)} />
          <p className="lead">{typograf(t.evening.lead)}</p>
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
                  <span className="leader" aria-hidden="true" />
                  <p className="ev-dessert__price mono">
                    <CityPrice price={d.price} />
                  </p>
                </div>
                <p className="ev-dessert__desc">{typograf(d.desc)}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* A secondary row: the name may wrap, but the leader runs on from the end of its last line (the
            word joiner glues it to the last word) and the price stands at that line's end. */}
        <div className="ev-more" data-ev-block>
          <p className="menu-row ev-pie">
            <span className="menu-row__name">
              {typograf(cherryPie.name)}
              <span className="menu-row__lead" aria-hidden="true">
                {WJ}
                <span className="leader menu-row__dots" />
              </span>
            </span>
            <span className="menu-row__price mono">
              <CityPrice price={cherryPie.price} />
            </span>
          </p>
          <RouteLink to="menu" className="dlink ev-more__link">
            {typograf(t.evening.allDesserts)}
          </RouteLink>
        </div>

        <article className="ev-chess rule-t" aria-labelledby="vecher-chess" data-ev-block>
          <div className="ev-chess__head">
            <p className="ev-chess__place label">
              {t.city.nalchik} · {typograf(chessEvent.where)}
            </p>
            <h3 id="vecher-chess" className="ev-chess__title display item-title">
              {chessEvent.title}
            </h3>
          </div>
          <p className="ev-chess__body">
            {chessFacts.map((line, i) => (
              <span key={line} className="ev-chess__line">
                {line}
                {i < chessFacts.length - 1 && " "}
              </span>
            ))}
          </p>
          <div className="ev-chess__actions">
            <a className="btn btn-primary" href={external.telegram} target="_blank" rel="noreferrer">
              {typograf(t.evening.vote)}
              <span className="ev-chess__ext" aria-hidden="true">
                ↗
              </span>
              <span className="sr-only"> {t.a11y.newTab}</span>
            </a>
          </div>
        </article>
      </div>

      <EveningMotion />
    </section>
  );
}
