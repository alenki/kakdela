import { Fragment } from "react";
import { Wordmark } from "@/components/brand/Wordmark";
import { RouteLink } from "@/components/chrome/RouteLink";
import { flagship } from "@/content/cafes";
import { operator } from "@/content/privacy";
import { external, type RouteKey } from "@/content/routes";
import type { City } from "@/content/types";
import { NBSP, typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { FooterMotion } from "./footer/FooterMotion";

// Split as in the «Разделы» dialog: the four places set large, the services in the text face.
const PLACES: RouteKey[] = ["menu", "locations", "events", "about"];
const SERVICES: RouteKey[] = ["delivery", "catering", "bonus", "certificates", "careers", "feedback"];
const linkLabel = (key: RouteKey) => typograf(t.nav.links.find((l) => l.key === key)?.label ?? key);

/** The city's main line is its flagship's: Байсултанова, 1 in Nalchik, Куйбышева, 3 in Vladikavkaz. */
const CITIES = Object.keys(flagship) as City[];
const SOCIAL = [
  { label: "Telegram", href: external.telegram },
  { label: "Instagram", href: external.instagram },
];

/** The operator as the site's owner: name, ИНН, ОГРН, address and the mailbox for requests, when known. */
const owner = operator.name
  ? [operator.name, operator.inn && `ИНН ${operator.inn}`, operator.ogrn && `ОГРН ${operator.ogrn}`, operator.address, operator.email]
      .filter(Boolean)
      .join(`${NBSP}· `)
  : null;

/** Small print: each «·»-separated phrase stays whole, so a line only ever breaks after a «·». */
function Phrases({ text }: { text: string }) {
  const parts = text.split(" · ");
  return parts.map((p, i) => (
    <Fragment key={i}>
      <span className="ft-nobr">{typograf(p, 1)}</span>
      {i < parts.length - 1 && `${NBSP}· `}
    </Fragment>
  ));
}

/**
 * The page ends at night, set like the «Разделы» dialog: the places large, the services, the city's
 * phone with the socials, the café facts and the ©, then the plain wordmark in milk with its tomato
 * clover: the footer's one moment.
 */
export function SiteFooter() {
  return (
    <footer id="footer" className="field ft" data-theme="ink">
      <div className="wrap">
        <div className="ft-grid">
          <nav className="ft-col" aria-labelledby="ft-places" data-ft-col>
            <p id="ft-places" className="ft-label label">
              {t.nav.sections}
            </p>
            <ul className="ft-list ft-list--places display" role="list">
              {PLACES.map((key) => (
                <li key={key}>
                  <RouteLink to={key} className="ft-link">
                    {linkLabel(key)}
                  </RouteLink>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="ft-col" aria-labelledby="ft-services" data-ft-col>
            <p id="ft-services" className="ft-label label">
              {t.footer.services}
            </p>
            <ul className="ft-list" role="list">
              {SERVICES.map((key) => (
                <li key={key}>
                  <RouteLink to={key} className="ft-link">
                    {linkLabel(key)}
                  </RouteLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="ft-col" data-ft-col>
            <address className="ft-address">
              <p className="ft-label label">
                {t.footer.phone}
                {`${NBSP}· `}
                {CITIES.map((city) => (
                  <span key={city} data-city-only={city}>
                    {t.city[city]}
                  </span>
                ))}
              </p>
              <div className="ft-list">
                {CITIES.map((city) => (
                  <a key={city} className="ft-link ft-phone" href={`tel:${flagship[city].phone}`} data-city-only={city}>
                    {flagship[city].phoneDisplay}
                  </a>
                ))}
              </div>
              <ul className="ft-social" role="list">
                {SOCIAL.map((s) => (
                  <li key={s.label}>
                    <a className="dlink" href={s.href} target="_blank" rel="noreferrer">
                      {s.label}
                      <span className="dlink__ext" aria-hidden="true">↗</span>
                      <span className="sr-only"> {t.a11y.newTab}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </address>
            <p className="ft-note label">
              <Phrases text={t.footer.utility} />
            </p>
            <p className="ft-copy label">
              <Phrases text={t.footer.copyright} />
            </p>
            {/* The site owner's details (149-FZ art. 10 part 2), once they are filled in (src/content/privacy.ts). */}
            {owner && (
              // Plain text, not <Phrases>: a legal address is longer than the column and must wrap.
              <p className="ft-owner label">{typograf(owner)}</p>
            )}
            <p className="ft-legal label">
              <RouteLink to="privacy" className="dlink">
                {typograf(t.footer.privacy)}
              </RouteLink>
            </p>
          </div>
        </div>

        <div className="ft-sign" data-ft-sign>
          <Wordmark variant="plain" className="ft-mark" cloverClassName="ft-mark__clover" />
        </div>
      </div>
      <FooterMotion />
    </footer>
  );
}
