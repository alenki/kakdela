import { breakfasts, extras } from "@/content/menu";
import type { Breakfast, City, Price } from "@/content/types";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { Photo } from "@/components/brand/Photo";
import { RouteLink } from "@/components/chrome/RouteLink";
import { CitySwitch } from "@/components/chrome/CitySwitch";
import { rub } from "@/lib/format";
import { typograf, WJ } from "@/lib/typograf";
import { t } from "@/i18n";
import { BreakfastsPreview } from "./breakfasts/BreakfastsPreview";
import { BreakfastsMotion } from "./breakfasts/BreakfastsMotion";

const CITIES: City[] = ["nalchik", "vladikavkaz"];
const dec = (n: number) => String(n).replace(".", ",");
const kbju = (k: NonNullable<Breakfast["kbju"]>) => typograf(t.breakfasts.kbju(k.k, dec(k.b), dec(k.zh), dec(k.u)));

/** Both cities are rendered; CSS shows the active one. A city without a price says to ask. */
function CityPrice({ price }: { price: Price }) {
  return CITIES.map((c) => {
    const v = price[c];
    return (
      <span key={c} data-city-only={c} className={v == null ? "bf-price__ask" : undefined}>
        {v != null ? rub(v) : typograf(t.hero.askLater)}
      </span>
    );
  });
}

export function BreakfastsSection() {
  return (
    <section id="zavtraki" className="field section-pad bf" data-theme="cream" aria-labelledby="zavtraki-title">
      <div className="wrap">
        <header className="section-head" data-bf-head>
          <DialogueHeading id="zavtraki-title" q={t.breakfasts.q} a={typograf(t.breakfasts.a)} />
          <p className="lead">{typograf(t.breakfasts.lead)}</p>
        </header>

        <div className="bf__body">
          {/* Heads the list: whose prices it shows. */}
          <div className="bf-bar" data-bf-rise>
            <p className="label" id="zavtraki-prices">
              {t.breakfasts.prices}
              {/* Without JS the switch can't switch: it is hidden and the prices shown (Нальчик) are named. */}
              <span className="bf-bar__static">: {t.city.nalchik}</span>
            </p>
            <CitySwitch compact className="bf-bar__switch" labelledBy="zavtraki-prices" />
          </div>

          <div className="bf__main">
            {/* Six answers to «как дела?», each one a breakfast. The row links to the full menu. */}
            <ol className="bf-list" data-bf-list>
              {breakfasts.map((b, i) => (
                <li key={b.id} className="bf-item" data-bf-row data-bf-rise data-bf-key={b.id} data-active={i === 0 ? "" : undefined}>
                  {/* Mobile and tablet only: desktop shows the dish in the photo column. */}
                  <Photo
                    photo={b.photo}
                    sizes="(min-width: 1024px) 1px, (min-width: 480px) 128px, (min-width: 356px) 27vw, 96px"
                    loading="lazy"
                    className="bf-item__photo photo--sm"
                  />
                  <h3 className="bf-item__name display item-title">
                    <RouteLink to="menu" className="bf-item__link">
                      {typograf(b.name)}
                    </RouteLink>
                  </h3>
                  <span className="leader bf-item__leader" aria-hidden="true" />
                  <p className="bf-item__price mono">
                    <CityPrice price={b.price} />
                  </p>
                  <p className="bf-item__desc">{typograf(b.desc)}</p>
                  {b.kbju && <p className="bf-item__kbju label mono">{kbju(b.kbju)}</p>}
                </li>
              ))}
            </ol>

            <div className="bf-extras" data-bf-rise>
              <h3 className="label bf-extras__title">{t.breakfasts.extras}</h3>
              <ul className="bf-extras__list">
                {Object.values(extras).map((x) => (
                  <li key={x.name} className="menu-row bf-extra">
                    <span className="menu-row__name">
                      {typograf(x.name)}
                      <span className="menu-row__lead" aria-hidden="true">
                        {WJ}
                        <span className="leader menu-row__dots" />
                      </span>
                    </span>
                    <span className="menu-row__price mono">
                      <CityPrice price={x.price} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bf-foot" data-bf-rise>
              <p className="dlinks">
                <RouteLink to="menu" className="dlink">
                  {typograf(t.breakfasts.links.menu)}
                </RouteLink>
                <RouteLink to="delivery" className="dlink">
                  {typograf(t.breakfasts.links.delivery)}
                </RouteLink>
              </p>
              <p className="label bf-note">{typograf(t.breakfasts.lightNote)}</p>
            </div>
          </div>

          {/* Desktop: a sticky photo of the hovered / focused / read row. A decorative duplicate of
              the list, so it stays out of the accessibility tree. */}
          <aside className="bf-preview" aria-hidden="true" data-bf-preview>
            <div className="bf-preview__sticky" data-bf-sticky data-bf-rise>
              <div className="bf-stage">
                {breakfasts.map((b, i) => (
                  <div key={b.id} className="bf-slide" data-bf-key={b.id} data-active={i === 0 ? "" : undefined}>
                    {/* Columns 9–12: 30% of the canvas at every desktop width (less on short screens). */}
                    <Photo photo={b.photo} sizes="(min-width: 1024px) 30vw, 1px" loading="lazy" />
                  </div>
                ))}
              </div>
              <div className="bf-caps">
                {breakfasts.map((b, i) => (
                  <div key={b.id} className="bf-cap" data-bf-key={b.id} data-active={i === 0 ? "" : undefined}>
                    <p className="bf-cap__name">{typograf(b.name)}</p>
                    {b.kbju && <p className="label mono">{kbju(b.kbju)}</p>}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
      <BreakfastsPreview />
      <BreakfastsMotion />
    </section>
  );
}
