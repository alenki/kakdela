import Link from "next/link";
import { BtnLabel } from "@/components/chrome/BtnLabel";
import { RouteLink } from "@/components/chrome/RouteLink";
import { Runner } from "@/components/game/Runner";
import type { City } from "@/content/types";
import { external } from "@/content/routes";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";

export const metadata = { title: "Страница не найдена · «Как дела?»" };

const CITIES: City[] = ["nalchik", "vladikavkaz"];
const MAPS: Record<City, string> = { nalchik: external.yandexNalchik, vladikavkaz: external.yandexVladikavkaz };
// «Ещё варим.» | «Загляните чуть позже.»: the title breaks between its sentences, never inside them.
const lines = t.notFound.title.split(/(?<=[.!?…])\s+/u);

/**
 * Every link to a page that isn't built yet lands here: one heading, one way home, two ways on, and
 * the runner under them while the page is brewing.
 */
export default function NotFound() {
  return (
    <main id="main" tabIndex={-1}>
      <section className="field not-found" data-theme="cream">
        {/* The shared section-head layout: title on cols 1–8, the way on at 9–12 on its last baseline. */}
        <div className="wrap section-head not-found__inner">
          <h1 className="dlg">
            <span className="dlg-label label">{t.notFound.label}</span>{" "}
            <span className="dlg-title display">
              {lines.map((l) => (
                <span key={l} className="not-found__line">
                  {typograf(l)}
                </span>
              ))}
            </span>
          </h1>
          <div className="not-found__aside">
            <p className="lead">{typograf(t.notFound.lead)}</p>
            <Link href="/" className="btn btn-primary">
              <BtnLabel>{t.notFound.home}</BtnLabel>
            </Link>
            <ul className="not-found__links" role="list">
              <li>
                <RouteLink to="menu" className="dlink">
                  {t.notFound.menu}
                </RouteLink>
              </li>
              <li>
                <a href={external.telegram} className="dlink" target="_blank" rel="noreferrer">
                  {t.notFound.telegram}
                  <span className="dlink__ext" aria-hidden="true">↗</span>
                  <span className="sr-only"> {t.a11y.newTab}</span>
                </a>
              </li>
              {/* The chain on the map of the guest's own city; both are rendered and CSS shows the active one. */}
              {CITIES.map((city) => (
                <li key={city} data-city-only={city}>
                  <a href={MAPS[city]} className="dlink" target="_blank" rel="noreferrer">
                    {typograf(t.notFound.maps)}
                    <span className="dlink__ext" aria-hidden="true">↗</span>
                    <span className="sr-only"> {t.a11y.newTab}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* A side offer under the head, never its equal: a label, and a button that is never primary. */}
        <div className="wrap not-found__game">
          <h2 className="label not-found__game-label">{typograf(t.notFound.game)}</h2>
          <Runner variant="aside" />
        </div>
      </section>
    </main>
  );
}
