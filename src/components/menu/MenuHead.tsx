import type { City } from "@/content/types";
import { flagship } from "@/content/cafes";
import { menuCount } from "@/content/full-menu";
import { external } from "@/content/routes";
import { CitySwitch } from "@/components/chrome/CitySwitch";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";

const CITIES: City[] = ["nalchik", "vladikavkaz"];

/**
 * The top of the menu: what the café is and how many dishes it has, then the waiter's «Что будете?» over
 * «Меню», and one line of how to reach it (the hours, a call to the city's flagship, Telegram). Below
 * 1024px whose prices the page shows also lives here (from 1024 it sits in the tabs). Never animated: it
 * is the first screen. The mobile action bar appears once it has scrolled away (data-actionbar-after).
 */
export function MenuHead() {
  const counts = CITIES.map((c) => t.menu.count(menuCount(c)));
  return (
    <section id="soderzhanie" className="field mn-head" data-theme="cream" aria-labelledby="menu-title" data-actionbar-after>
      <div className="wrap">
        <div className="mn-head__top">
          <p className="label">{typograf(t.menu.kicker)}</p>
          <p className="label mono">
            {counts[0] === counts[1]
              ? counts[0]
              : CITIES.map((c, i) => (
                  <span key={c} data-city-only={c}>
                    {counts[i]}
                  </span>
                ))}
          </p>
        </div>

        <div className="mn-head__title">
          <p className="mn-head__q reply">{typograf(t.menu.a)}</p>
          <h1 id="menu-title" className="mn-head__h1 display">
            {t.menu.q}
          </h1>
        </div>

        <div className="mn-head__meta">
          <p className="mn-head__hours">{typograf(t.status.everyDay)}</p>
          <span className="mn-head__dot" aria-hidden="true" />
          <p className="mn-head__actions">
            {CITIES.map((c) => (
              <a key={c} className="btn btn-primary" href={`tel:${flagship[c].phone}`} data-city-only={c}>
                {t.locations.call}
                <span className="sr-only">: {flagship[c].phoneDisplay}</span>
              </a>
            ))}
            <a className="btn" href={external.telegram} target="_blank" rel="noreferrer">
              Telegram<span className="dlink__ext" aria-hidden="true">↗</span>
              <span className="sr-only"> {t.a11y.newTab}</span>
            </a>
          </p>
        </div>

        {/* Whose prices (below 1024; from there the tabs carry it). Without JS the switch can't switch: it
            goes, and the label names the city whose prices show. */}
        <div className="mn-prices mn-head__prices">
          <p id="mn-prices-label" className="label">
            {t.breakfasts.prices}
            <span className="mn-prices__static">: {t.city.nalchik}</span>
          </p>
          <CitySwitch compact className="mn-prices__switch" labelledBy="mn-prices-label" />
        </div>
      </div>
    </section>
  );
}
