import { cafes, cafesByCity } from "@/content/cafes";
import { yandexOrg, yandexRoute } from "@/content/routes";
import type { Cafe, City } from "@/content/types";
import { Photo } from "@/components/brand/Photo";
import { CitySwitch } from "@/components/chrome/CitySwitch";
import { CafeStatus } from "@/components/chrome/CafeStatus";
import { RouteLink } from "@/components/chrome/RouteLink";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { NBSP, typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { LocationsController } from "./locations/LocationsController";
import { LocationsReply } from "./locations/LocationsReply";
import { NearestButton, type NearPoint } from "./locations/NearestButton";

const CITIES: City[] = ["nalchik", "vladikavkaz"];

/** «ул.» stays quieter than the street: the name is what a guest reads on the sign. */
function splitAddress(address: string) {
  const m = /^(ул\.|пр\.)\s+(.+)$/.exec(address);
  return m ? { pre: m[1], rest: m[2] } : { pre: "", rest: address };
}

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
 * One café, one row. The head (address, live status, toggle) is always visible; the body (features,
 * phone, route) folds away on phones and lies open in the row from 1024px; the photo, the full hours
 * and the rating fold away everywhere. The status is the row's one statement of time.
 */
function CafeRow({ cafe: c }: { cafe: Cafe }) {
  const { pre, rest } = splitAddress(c.address);
  const bodyId = `gde-${c.id}-body`;
  const moreId = `gde-${c.id}-more`;
  return (
    <li className="cafe" data-cafe={c.id}>
      <div className="cafe__head">
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
        <button type="button" className="cafe__toggle" aria-expanded="false" aria-controls={`${bodyId} ${moreId}`} data-cafe-toggle>
          <span className="sr-only">
            {t.locations.more}: {c.address}
          </span>
          <span className="cafe__plus" aria-hidden="true" />
        </button>
      </div>

      <div className="cafe__body" id={bodyId}>
        <div className="cafe__fold">
          <div className="cafe__body-pad">
            <p className="cafe__feat label">{features(c.tags)}</p>
            <a className="dlink mono cafe__tel" href={`tel:${c.phone}`}>
              <span className="sr-only">{t.locations.call}: </span>
              {c.phoneDisplay}
            </a>
            <External className="cafe__route" href={yandexRoute(c.coords.lat, c.coords.lon)}>
              {t.locations.route}
            </External>
          </div>
        </div>
      </div>

      <div className="cafe__more" id={moreId}>
        <div className="cafe__fold">
          <div className="cafe__more-pad">
            <Photo
              photo={c.photo}
              aspect="3/2"
              sizes="(min-width: 1024px) 38vw, (min-width: 640px) 45vw, calc(100vw - 32px)"
              loading="lazy"
              className="cafe__photo"
            />
            <p className="cafe__hours mono">{typograf(t.locations.hours(c.open, c.close))}</p>
            <p className="cafe__rating mono">
              {t.locations.rating(c.rating, c.ratingsCount)}{" "}
              <External className="cafe__org" href={yandexOrg(c.yandexOrgId)}>
                {t.locations.onMaps}
              </External>
            </p>
          </div>
        </div>
      </div>
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
          <LocationsReply className="lead" />
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
