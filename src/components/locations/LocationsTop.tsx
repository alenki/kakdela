import { cafes, cafesByCity } from "@/content/cafes";
import { external } from "@/content/routes";
import type { City } from "@/content/types";
import { CitySwitch } from "@/components/chrome/CitySwitch";
import { RouteLink } from "@/components/chrome/RouteLink";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { CafeEntry } from "./CafeEntry";
import { CityPlan } from "./CityPlan";
import { LocationsNearest, type LcPoint } from "./islands/LocationsNearest";

const CITIES: City[] = ["nalchik", "vladikavkaz"];
const MAPS: Record<City, string> = { nalchik: external.yandexNalchik, vladikavkaz: external.yandexVladikavkaz };

/**
 * «Кофейни» / «Где встретимся?»: the third line of the conversation. One section on a 12-column grid: the title,
 * the tools, the legend (the cafés) and the foot in columns 1 to 7; the city's plan beside them from the top, stuck
 * under the header while the legend is read (from 1024px), the way the hero's notice stands beside its answer.
 * Phones: the title, the tools, the plan, the legend. Both cities render on the server and the city switch shows
 * one; without JS both are listed, each under its heading. The mobile action bar appears once the title has
 * scrolled away (data-actionbar-after).
 */
export function LocationsTop() {
  const points: LcPoint[] = cafes.map((c) => ({
    id: c.id,
    city: c.city,
    lat: c.coords.lat,
    lon: c.coords.lon,
    address: c.address,
    open: c.open,
    close: c.close,
  }));

  return (
    <section id="kofejni" className="field lc-top" data-theme="cream" aria-labelledby="lc-title">
      <div className="wrap lc-grid">
        <header className="lc-head" data-actionbar-after>
          <DialogueHeading as="h1" id="lc-title" q={t.locations.q} a={typograf(t.locationsPage.a)} />
          <p className="lead">{typograf(t.locationsPage.lead)}</p>
        </header>

        <div className="lc-tools" data-lc-tools>
          <CitySwitch className="lc-tools__switch" />
          <LocationsNearest points={points} />
        </div>

        <div className="lc-plans" data-lc-plans>
          <div className="lc-plans__sticky" data-lc-sticky>
            {CITIES.map((city) => (
              <div key={city} className="lc-plans__city" data-city-only={city}>
                <CityPlan city={city} />
              </div>
            ))}
          </div>
        </div>

        <div className="lc-lists">
          {CITIES.map((city) => {
            const list = cafesByCity(city);
            const capId = `lc-cap-${city}`;
            return (
              <div key={city} className="lc-city" data-city-only={city} data-lc-city={city}>
                <h2 id={capId} className="lc-city__cap label">
                  {typograf(`${t.city[city]} · ${t.locations.cafesCount(list.length)}`)}
                </h2>
                <ol className="lc-list" role="list" aria-labelledby={capId} data-lc-list>
                  {list.map((c, i) => (
                    <CafeEntry key={c.id} cafe={c} n={i + 1} />
                  ))}
                </ol>
                <p className="lc-city__maps">
                  <a href={MAPS[city]} className="dlink" target="_blank" rel="noreferrer">
                    {typograf(t.locationsPage.onMaps(city))}
                    <span className="dlink__ext" aria-hidden="true">↗</span>
                    <span className="sr-only"> {t.a11y.newTab}</span>
                  </a>
                </p>
              </div>
            );
          })}
        </div>

        <footer className="lc-foot" data-lc-rise>
          <p className="lc-foot__common">{typograf(t.locations.common)}</p>
          <p className="dlinks">
            <RouteLink to="menu" className="dlink">
              {typograf(t.notFound.menu)}
            </RouteLink>
          </p>
        </footer>

        {/* One polite line for the page's small confirmations (the invitation copied). */}
        <p id="lc-said" className="sr-only" role="status" />
      </div>
    </section>
  );
}
