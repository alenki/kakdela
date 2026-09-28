import type { City } from "@/content/types";
import { flagship } from "@/content/cafes";
import { RouteLink } from "@/components/chrome/RouteLink";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";

const CITIES: City[] = ["nalchik", "vladikavkaz"];

/**
 * The last word, at night: the waiter's «Что-нибудь ещё?», an invitation, and the two ways there (the
 * nearest café, a call to the city's flagship), set on the centre line as the top of the page is.
 */
export function MenuCta() {
  return (
    <section className="field mn-cta" data-theme="ink" aria-labelledby="mn-cta-title" data-mn-section>
      <div className="wrap mn-cta__inner" data-mn-rise>
        <p className="mn-cta__q reply">{typograf(t.menu.cta.q)}</p>
        <h2 id="mn-cta-title" className="mn-cta__title display">
          {typograf(t.menu.cta.title)}
        </h2>
        <p className="mn-cta__actions">
          <RouteLink to="home" hash="gde" className="btn btn-primary">
            {typograf(t.hero.actions.nearest)}
          </RouteLink>
          {CITIES.map((c) => (
            <a key={c} className="btn" href={`tel:${flagship[c].phone}`} data-city-only={c}>
              {t.locations.call}
              <span className="sr-only">: {flagship[c].phoneDisplay}</span>
            </a>
          ))}
        </p>
        <p className="mn-cta__note label">{typograf(t.menu.note)}</p>
      </div>
    </section>
  );
}
