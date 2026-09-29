import type { CSSProperties } from "react";
import { street } from "@/content/about";
import type { Cafe } from "@/content/types";
import { Wordmark } from "@/components/brand/Wordmark";
import { CafeStatus } from "@/components/chrome/CafeStatus";
import { RouteLink } from "@/components/chrome/RouteLink";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { signCrop, focusCrop } from "@/lib/crop";
import { NBSP, typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { FramedPhoto } from "./FramedPhoto";
import { StreetDrive } from "./street/StreetDrive";

/**
 * The frame every door is cut to, and the line the signs sit on (as a fraction of its height). about.css
 * draws the line at the same height: keep the two in step (--line there).
 */
const FRAME = 4 / 5;
export const SIGN_LINE = 0.3;
/** No sign narrower than this share of its frame: the far ones are brought a little closer. */
const SIGN_MIN = 0.45;

/** Each city's first door, counted along the whole street (the doors stagger in by it). */
const firstDoor = street.map((_, i) => street.slice(0, i).reduce((sum, town) => sum + town.cafes.length, 0));

/** The frame's width (about.css: --door-w), for next/image. */
const DOOR_SIZES = "(min-width: 1024px) 45vh, (min-width: 640px) 40vh, 74vw";

/** «ул.» stays quieter than the street, as in the homepage's list. */
function Address({ address }: { address: string }) {
  const m = /^(ул\.|пр\.)\s+(.+)$/.exec(address);
  if (!m) return <>{typograf(address)}</>;
  return (
    <>
      <span className="ab-door__pre">
        {m[1]}
        {NBSP}
      </span>
      {typograf(m[2])}
    </>
  );
}

function Door({ cafe: c, index }: { cafe: Cafe; index: number }) {
  const p = c.photo;
  const aspect = p.src.width / p.src.height;
  return (
    <li className="ab-door" data-door style={{ "--i": index } as CSSProperties}>
      {p.placeholder ? (
        // A stand-in photo would be someone else's street: the sign on paper until the café's own arrives.
        <div className="ab-door__paper photo" aria-hidden="true">
          <Wordmark variant="plain" className="ab-door__mark" cloverClassName="ab-door__clover" />
          <span className="ab-door__soon label">{t.about.street.soon}</span>
        </div>
      ) : (
        <FramedPhoto
          photo={p}
          crop={p.sign ? signCrop(aspect, p.sign, FRAME, SIGN_LINE, SIGN_MIN) : focusCrop(aspect, { x: 0.5, y: 0.5 }, FRAME)}
          aspect="4/5"
          sizes={DOOR_SIZES}
          className="ab-door__photo"
        />
      )}
      <div className="ab-door__cap">
        <h3 className="ab-door__addr display">
          <Address address={c.address} />
        </h3>
        <p className="ab-door__note label">{typograf([c.alias, t.city[c.city]].filter(Boolean).join(" · "))}</p>
        <p className="ab-door__when">
          <CafeStatus cafe={c} />
        </p>
      </div>
    </li>
  );
}

/**
 * «А где вы?» / «Девять дверей, один вопрос.»: the page's one moment. The nine cafés stand side by side as
 * a street, city by city, each photo cut so its «Как дела?» sign sits on one line (signCrop,
 * src/lib/crop.ts, from the sign measured in photos.ts), and a hairline runs along that line behind the
 * photos, from sign to sign: nine addresses, one question. A café whose photo is a stand-in shows the
 * plain wordmark on the notice's paper, on the same line.
 * In full motion StreetDrive walks the street as the page scrolls: the stage stays under the header
 * (CSS sticky) and the street slides past it. Otherwise (reduced motion, no JS) it is a row the guest
 * scrolls sideways.
 */
export function Street() {
  return (
    <section id="dveri" className="field section-pad ab-street" data-theme="cream" aria-labelledby="dveri-title">
      <div className="wrap">
        <header className="section-head" data-ab-rise>
          <DialogueHeading id="dveri-title" q={t.about.street.ask} ask={typograf(t.about.street.ask)} a={typograf(t.about.street.a)} />
        </header>
      </div>

      <div className="ab-street__drive" data-street>
        {/* Without the drive the row scrolls sideways: a named, focusable region, so keys can scroll it. */}
        <div className="ab-street__stage" data-street-stage tabIndex={0} role="region" aria-label={t.about.street.a}>
          <div className="ab-street__track" data-street-track>
            <span className="ab-street__line" aria-hidden="true" data-street-line />
            {street.map(({ city, cafes }, town) => {
              const capId = `dveri-${city}`;
              return (
                <div key={city} className="ab-town" role="group" aria-labelledby={capId}>
                  <p className="ab-town__mark" id={capId}>
                    <span className="ab-town__name display">{t.city[city]}</span>
                    <span className="ab-town__count label">{t.locations.cafesCount(cafes.length)}</span>
                  </p>
                  <ul className="ab-town__doors" role="list">
                    {cafes.map((c, i) => (
                      <Door key={c.id} cafe={c} index={firstDoor[town] + i} />
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="wrap">
        <p className="dlinks ab-street__foot" data-ab-rise>
          <RouteLink to="locations" className="dlink">
            {t.about.street.all}
          </RouteLink>
          <RouteLink to="home" hash="gde" className="dlink">
            {t.about.street.nearest}
          </RouteLink>
        </p>
      </div>
      <StreetDrive />
    </section>
  );
}
