import Image from "next/image";
import { cafes, cafesByCity } from "@/content/cafes";
import { yandexOrg, yandexRoute } from "@/content/routes";
import type { Cafe, City } from "@/content/types";
import { Skyline, SKYLINES } from "@/components/brand/Skyline";
import { Clover } from "@/components/brand/Clover";
import { CitySwitch } from "@/components/chrome/CitySwitch";
import { CafeStatus } from "@/components/chrome/CafeStatus";
import { RouteLink } from "@/components/chrome/RouteLink";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { round1 } from "@/lib/seed";
import { NBSP } from "@/lib/typograf";
import { t } from "@/i18n";
import { LocationsController } from "./locations/LocationsController";
import { LocationsReply } from "./locations/LocationsReply";
import { NearestButton, type NearPoint } from "./locations/NearestButton";

const CITIES: City[] = ["nalchik", "vladikavkaz"];

/*
 * Pins sit on the plain below the foothills: west→east across the band, north→south compressed into
 * its height. One km-scale for both cities, so Vladikavkaz's two cafés read as close as they are.
 */
const BAND = { x0: 380, x1: 1060, y0: 214, y1: 230 };
/** Ring-to-ring clearance in viewBox units at the largest on-screen pin scale (phones). */
const PIN_GAP = 30;

/**
 * The band squeezes north–south into 16 units, so two cafés on one meridian (Байсултанова, 1 and
 * Шогенцукова, 14 are 2.5 km apart but ~50 m in longitude) would sit on top of each other. Nudge
 * close pairs apart along x only, symmetric and deterministic: tens of metres of drift, readable pins.
 */
function spread(pts: { x: number; y: number }[]) {
  for (let pass = 0; pass < 24; pass++) {
    let moved = false;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        if (Math.hypot(dx, dy) >= PIN_GAP - 0.01) continue;
        const push = (Math.sqrt(Math.max(0, PIN_GAP ** 2 - dy ** 2)) - Math.abs(dx)) / 2;
        const dir = dx >= 0 ? 1 : -1;
        a.x -= dir * push;
        b.x += dir * push;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return pts;
}

function pinsByCity() {
  const local = CITIES.map((city) => {
    const list = cafesByCity(city);
    const lat0 = list.reduce((s, c) => s + c.coords.lat, 0) / list.length;
    const kx = 111.32 * Math.cos((lat0 * Math.PI) / 180);
    const pts = list.map((c) => ({ c, e: c.coords.lon * kx, n: c.coords.lat * 110.57 }));
    const es = pts.map((p) => p.e), ns = pts.map((p) => p.n);
    const box = { e0: Math.min(...es), e1: Math.max(...es), n0: Math.min(...ns), n1: Math.max(...ns) };
    return { city, pts, box };
  });
  const spanE = Math.max(...local.map((l) => l.box.e1 - l.box.e0)) || 1;
  const spanN = Math.max(...local.map((l) => l.box.n1 - l.box.n0)) || 1;
  const sx = (BAND.x1 - BAND.x0) / spanE, sy = (BAND.y1 - BAND.y0) / spanN;
  const cx = (BAND.x0 + BAND.x1) / 2, cy = (BAND.y0 + BAND.y1) / 2;
  return Object.fromEntries(
    local.map(({ city, pts, box }) => {
      const me = (box.e0 + box.e1) / 2, mn = (box.n0 + box.n1) / 2;
      const placed = spread(pts.map(({ e, n }) => ({ x: cx + (e - me) * sx, y: cy - (n - mn) * sy })));
      return [city, pts.map(({ c }, i) => ({ id: c.id, name: c.address, x: round1(placed[i].x), y: round1(placed[i].y) }))];
    }),
  ) as Record<City, { id: string; name: string; x: number; y: number }[]>;
}

/**
 * The Skyline masks its mountains below the foothills with a flat `--bg` fill, which leaves a
 * grain-free strip across the sky field. Instead, clip the mass to the band between the ridge and the
 * foothills (even-odd of the two closed outlines) and let the field's own grain run under the pins.
 * locations.css swaps the clip in; if the Skyline markup changes, it simply falls back to the fill.
 */
const closed = (d: string) => `${d}L1440 240L0 240Z`;
function SkyClips() {
  return (
    <svg className="loc-sky__defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        {CITIES.map((city) => (
          <clipPath key={city} id={`gde-mass-${city}`} clipPathUnits="userSpaceOnUse">
            <path clipRule="evenodd" d={closed(SKYLINES[city].ridge) + closed(SKYLINES[city].foothills)} />
          </clipPath>
        ))}
      </defs>
    </svg>
  );
}

/** «ул.» in the thin voice, the street in the heavy one: the logo's two voices on every sign. */
function splitAddress(address: string) {
  const m = /^(ул\.|пр\.)\s+(.+)$/.exec(address);
  return m ? { pre: m[1], rest: m[2] } : { pre: "", rest: address };
}

function Arrow() {
  return (
    <svg className="loc-arrow" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path d="M2.5 9.5 9.5 2.5M4 2.5h5.5V8" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CafeRow({ cafe: c }: { cafe: Cafe }) {
  const { pre, rest } = splitAddress(c.address);
  const bodyId = `gde-${c.id}-body`;
  const moreId = `gde-${c.id}-more`;
  return (
    <li className="cafe" data-cafe={c.id}>
      <div className="cafe__head">
        <div className="cafe__name">
          <h3 className="cafe__addr">
            {/* NBSP, not a space: Chrome drops a span's trailing space from the heading's accessible name («ул.Байсултанова»). */}
            {pre && <span className="cafe__pre q-voice">{pre}{NBSP}</span>}
            <span className="cafe__street a-voice">{rest}</span>
          </h3>
          {c.alias && <span className="cafe__alias reply">{c.alias}</span>}
        </div>
        <p className="cafe__status">
          <CafeStatus cafe={c} />
          <span className="cafe__near mono" data-near hidden />
        </p>
        <button type="button" className="cafe__toggle" aria-expanded="false" aria-controls={`${bodyId} ${moreId}`} data-cafe-toggle>
          <span className="sr-only">
            {t.locations.more}: {c.address}
          </span>
          <span className="cafe__plus" aria-hidden="true" />
        </button>
      </div>

      {/* Phones: tucked into the card. Desktop: laid straight into the row (display: contents). */}
      <div className="cafe__body" id={bodyId}>
        <div className="cafe__body-in">
          <div className="cafe__body-pad">
            <ul className="cafe__tags" aria-label={t.locations.tags}>
              {c.tags.map((tag) => (
                <li key={tag} className="cafe__chip mono">
                  {tag}
                </li>
              ))}
            </ul>
            <p className="cafe__info mono">
              <span className="cafe__hours">
                <span className="label">{t.locations.hours}</span> {c.open}–{c.close}
              </span>
              <span className="cafe__tel">{c.phoneDisplay}</span>
            </p>
            <div className="cafe__actions">
              <a className="btn cafe__route" href={yandexRoute(c.coords.lat, c.coords.lon)} target="_blank" rel="noreferrer">
                <span className="btn-dash" aria-hidden="true" />
                {t.locations.route}
                <Arrow />
                <span className="sr-only">{t.a11y.newTab}</span>
              </a>
              <a className="btn cafe__call" href={`tel:${c.phone}`}>
                {t.locations.call}
                <span className="cafe__call-num mono">{c.phoneDisplay}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="cafe__more" id={moreId}>
        <div className="cafe__more-in">
          <div className="cafe__more-pad">
            <figure className="cafe__photo" data-placeholder={c.photo.placeholder ? "" : undefined}>
              <Image
                src={c.photo.src}
                alt={c.photo.alt}
                fill
                sizes="(min-width: 1024px) 480px, (min-width: 640px) 46vw, calc(100vw - 32px)"
                placeholder="blur"
                loading="lazy"
                className="cafe__img"
              />
            </figure>
            <div className="cafe__maps">
              <p className="cafe__rating mono">{t.locations.rating(c.rating, c.ratingsCount)}</p>
              <a className="dlink cafe__org" href={yandexOrg(c.yandexOrgId)} target="_blank" rel="noreferrer">
                <span className="dash">—</span>
                {t.locations.onMaps}
                <Arrow />
                <span className="sr-only">{t.a11y.newTab}</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

/** «— Где вы?» / «— Ближе, чем кажется.»: the horizon, the nine addresses, and the way there. */
export function LocationsSection() {
  const pins = pinsByCity();
  const points: NearPoint[] = cafes.map((c) => ({ id: c.id, city: c.city, lat: c.coords.lat, lon: c.coords.lon, address: c.address }));

  return (
    <section id="gde" className="field section-pad locations" data-theme="sky" aria-labelledby="gde-title">
      <div className="loc-sky" data-loc-sky>
        <SkyClips />
        {CITIES.map((city) => (
          <div key={city} className="loc-sky__city" data-city-only={city}>
            <Skyline city={city} label={t.locations.peaks[city]} pins={pins[city]} className="loc-sky__svg" />
          </div>
        ))}
      </div>

      <div className="wrap">
        <header className="loc-head" data-loc-head>
          <DialogueHeading id="gde-title" q={t.locations.q} a={t.locations.a} className="loc-head__dlg" />
          <LocationsReply className="loc-head__reply reply" />
          <div className="loc-tools">
            <CitySwitch className="loc-tools__switch" />
            <NearestButton points={points} />
          </div>
        </header>

        {/* One block per city. With JS only the chosen city shows; without it both do (locations.css),
            so a guest in Vladikavkaz is never left with Nalchik's list and a switch that can't switch. */}
        {CITIES.map((city) => {
          const list = cafesByCity(city);
          const n = list.length;
          const capId = `gde-cap-${city}`;
          return (
            <div key={city} className="cafes-city" data-city-only={city}>
              <p className="cafes__cap label">
                <span id={capId}>
                  {t.city[city]} · {t.locations.cafesCount(n)}
                </span>
                <span>{t.status.everyDay}</span>
              </p>
              <ul className="cafes" aria-labelledby={capId}>
                {list.map((c) => (
                  <CafeRow key={c.id} cafe={c} />
                ))}
              </ul>
            </div>
          );
        })}

        <footer className="loc-foot">
          <p className="loc-foot__common">
            <Clover className="loc-foot__clover" />
            <span>{t.locations.common}</span>
          </p>
          <RouteLink to="locations" className="dlink loc-foot__all">
            <span className="dash">—</span>
            {t.locations.all}
          </RouteLink>
        </footer>
      </div>
      <LocationsController />
    </section>
  );
}
