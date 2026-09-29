import { cafes, cafesByCity } from "@/content/cafes";
import { yandexRoute } from "@/content/routes";
import type { Cafe, City } from "@/content/types";
import { CitySwitch } from "@/components/chrome/CitySwitch";
import { CafeStatus } from "@/components/chrome/CafeStatus";
import { RouteLink } from "@/components/chrome/RouteLink";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { splitAddress } from "@/components/locations/address";
import { NBSP, typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { LocationsController } from "./locations/LocationsController";
import { NearestButton, type NearPoint } from "./locations/NearestButton";

const CITIES: City[] = ["nalchik", "vladikavkaz"];

/** «Все завтраки · летняя веранда»: the tags are stored lowercase, the line reads in sentence case. */
function features(tags: string[]) {
  const s = tags.join(" · ");
  return typograf(s.charAt(0).toUpperCase() + s.slice(1));
}

function External({ href, children, className }: { href: string; children: string; className: string }) {
  return (
    <a className={`dlink ${className}`} href={href} target="_blank" rel="noreferrer">
      {children}
      <span className="dlink__ext" aria-hidden="true">↗</span>
      <span className="sr-only"> {t.a11y.newTab}</span>
    </a>
  );
}

/*
 * One café, one row: the address and what it has, the live status (the row's one statement of time),
 * and the two ways there. Phones stack them; from 1024px they sit in the section's columns.
 */
function CafeRow({ cafe: c }: { cafe: Cafe }) {
  const { pre, rest } = splitAddress(c.address);
  return (
    <li className="cafe" data-cafe={c.id}>
      <div className="cafe__name">
        <h3 className="cafe__addr display item-title">
          {/* NBSP, not a space: Chrome drops a span's trailing space from the heading's accessible name («ул.Байсултанова»). */}
          {pre && <span className="cafe__pre">{pre}{NBSP}</span>}
          {rest}
        </h3>
        {c.alias && <span className="cafe__note">{c.alias}</span>}
      </div>
      <p className="cafe__when">
        <CafeStatus cafe={c} />
        <span className="cafe__near label" data-near hidden />
      </p>
      <p className="cafe__feat label">{features(c.tags)}</p>
      <p className="cafe__ways">
        <a className="dlink mono cafe__tel" href={`tel:${c.phone}`}>
          <span className="sr-only">{t.locations.call}: </span>
          {c.phoneDisplay}
        </a>
        <External className="cafe__route" href={yandexRoute(c.coords.lat, c.coords.lon)}>
          {t.locations.route}
        </External>
      </p>
    </li>
  );
}

/** «Кофейни» / «Ближе, чем кажется.»: nine addresses and the way to each. */
export function LocationsSection() {
  const points: NearPoint[] = cafes.map((c) => ({ id: c.id, city: c.city, lat: c.coords.lat, lon: c.coords.lon, address: c.address }));

  return (
    <section id="gde" className="field section-pad locations" data-theme="cream" aria-labelledby="gde-title">
      <div className="wrap">
        <header className="section-head" data-loc-head>
          <DialogueHeading id="gde-title" q={t.locations.q} a={t.locations.a} />
        </header>

        <div className="loc-tools" data-loc-tools>
          <CitySwitch className="loc-tools__switch" />
          <NearestButton points={points} />
        </div>

        {/* Both cities render on the server; the city switch shows one. Without JS both are listed,
            each under its own caption (locations.css). */}
        {CITIES.map((city) => {
          const list = cafesByCity(city);
          const capId = `gde-cap-${city}`;
          return (
            <div key={city} className="loc-city" data-city-only={city}>
              <p id={capId} className="loc-city__cap label">
                {t.city[city]} · {t.locations.cafesCount(list.length)}
              </p>
              <ul className="cafes" aria-labelledby={capId}>
                {list.map((c) => (
                  <CafeRow key={c.id} cafe={c} />
                ))}
              </ul>
            </div>
          );
        })}

        <footer className="loc-foot" data-loc-foot>
          <p className="loc-foot__common">{typograf(t.locations.common)}</p>
          <RouteLink to="locations" className="dlink loc-foot__all">
            {t.locations.all}
          </RouteLink>
        </footer>
      </div>
      <LocationsController />
    </section>
  );
}
