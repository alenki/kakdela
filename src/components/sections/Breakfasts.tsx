import { Fragment, type CSSProperties } from "react";
import { breakfasts, extras } from "@/content/menu";
import type { Breakfast, City, Price } from "@/content/types";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { OctPhoto } from "@/components/brand/OctPhoto";
import { Lace } from "@/components/brand/Lace";
import { RouteLink } from "@/components/chrome/RouteLink";
import { CitySwitch } from "@/components/chrome/CitySwitch";
import { cn, rub } from "@/lib/format";
import { NBSP, typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { BreakfastsPreview } from "./breakfasts/BreakfastsPreview";
import { BreakfastsMotion } from "./breakfasts/BreakfastsMotion";

const CITIES: City[] = ["nalchik", "vladikavkaz"];
/** The nutrition strip's cells, in reading order. */
const KBJU_KEYS = ["k", "b", "zh", "u"] as const;

/**
 * Russian typesetting for this section's copy: a dash never opens a line, and one- and two-letter
 * words (и, в, с, на…) stay with the next word. Level 2 keeps the section's breaks as they were;
 * the default level would also hold «под» and friends (see typograf).
 */
const nb = (s: string) => typograf(s, 2);

const no = (i: number) => String(i + 1).padStart(2, "0");
const dec = (n: number) => String(n).replace(".", ",");
/** Two unbreakable groups, set as two lines on the card (energy, then macros). */
const kbjuGroups = (k: NonNullable<Breakfast["kbju"]>) => t.breakfasts.kbjuGroups(k.k, dec(k.b), dec(k.zh), dec(k.u));

/** A four-cell nutrition strip: value over label, like the back of a menu card. */
function Kbju({ k }: { k: NonNullable<Breakfast["kbju"]> }) {
  return (
    <dl className="bf-kbju mono">
      {KBJU_KEYS.map((key) => (
        <div key={key} className="bf-kbju__cell">
          <dt className="bf-kbju__label">{t.breakfasts.kbjuLabels[key]}</dt>
          <dd className="bf-kbju__value">{dec(k[key])}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Both cities are rendered; CSS shows the active one (and rolls it in when the guest switches). */
function CityPrice({ price, className }: { price: Price; className?: string }) {
  return (
    <span className={cn("bf-price", className)}>
      {CITIES.map((c) => {
        const v = price[c];
        return (
          <span key={c} data-city-only={c} className={v == null ? "bf-price__ask" : undefined}>
            {v != null ? rub(v) : nb(t.hero.askLater)}
          </span>
        );
      })}
    </span>
  );
}

/** «— Нормально? Шакшука — 550 ₽. Хочется сладкого? Сырники — 380 ₽ и мини-панкейки — 410 ₽.» */
function Afterword() {
  // Two lines of dialogue: the «Нормально?» answer, then the sweet one.
  const lines = [
    [{ lead: t.breakfasts.after.normal, price: extras.shakshuka.price, end: "." }],
    [
      { lead: t.breakfasts.after.sweet, price: extras.syrniki.price, end: " " },
      { lead: t.breakfasts.after.and, price: extras.pancakes.price, end: "." },
    ],
  ];
  return CITIES.map((c) => {
    const missing = lines.flat().some((l) => l.price[c] == null);
    return (
      <div key={c} data-city-only={c} className="bf-after-wrap">
        <p className="bf-after reply">
          {lines.map((line, n) => (
            <span key={n} className="bf-after__line">
              <span className="dash">—</span>
              {NBSP}
              {line.map((l, i) => {
                const v = l.price[c];
                // nb(): the dash never starts a line; with no price for this city, the sentence drops it.
                const lead = v == null ? nb(l.lead).replace(/\s*—\s*$/, "") : nb(l.lead);
                return (
                  <Fragment key={i}>
                    {lead}
                    {v != null && (
                      <>
                        {" "}
                        <span className="bf-after__price mono">{rub(v)}</span>
                      </>
                    )}
                    {l.end}
                  </Fragment>
                );
              })}
            </span>
          ))}
        </p>
        {missing && (
          <p className="bf-note mono">
            {nb(t.hero.priceNote[c])}: {nb(t.hero.askLater)}
          </p>
        )}
      </div>
    );
  });
}

export function BreakfastsSection() {
  const last = no(breakfasts.length - 1);
  return (
    <section id="zavtraki" className="field section-pad bf" data-theme="cream" aria-labelledby="zavtraki-title">
      <div className="wrap">
        <header className="bf__head" data-bf-head>
          <DialogueHeading id="zavtraki-title" q={t.breakfasts.q} className="bf__title" />
          <p className="kicker bf__kicker" data-bf-kicker>
            {nb(t.breakfasts.kicker)}
          </p>
        </header>

        <div className="bf__body" data-bf-body>
          <div className="bf__main">
            <div className="bf-board__head">
              <p className="label bf-board__allday">{t.breakfasts.allDay}</p>
              <div className="bf-board__city">
                <p className="label bf-board__note">
                  {nb(t.breakfasts.pricesFor)}
                  {/* Without JS the switch can't switch: it is hidden and the prices shown (Нальчик) are named. */}
                  <span className="bf-board__static">
                    {NBSP}
                    {t.city.nalchik}
                  </span>
                </p>
                <CitySwitch compact className="bf-board__switch" />
              </div>
            </div>

            {/* The printed board: six answers, each one a breakfast you can order. */}
            <ol className="bf-list" data-bf-list>
              {breakfasts.map((b, i) => (
                <li
                  key={b.id}
                  className="bf-item"
                  data-bf-row
                  data-bf-key={b.id}
                  data-active={i === 0 ? "" : undefined}
                  style={{ "--i": i } as CSSProperties}
                >
                  <span className="bf-rule" data-bf-rule aria-hidden="true" />
                  <span className="bf-item__no mono" aria-hidden="true" data-bf-meta>
                    {no(i)}
                  </span>
                  <div className="bf-item__photo" data-bf-photo>
                    <OctPhoto
                      photo={b.photo}
                      sizes="(min-width: 1024px) 1px, (min-width: 640px) 30vw, 46vw"
                      loading="lazy"
                      className="bf-item__oct"
                    />
                  </div>
                  <h3 className="bf-item__name a-voice">
                    <RouteLink to="menu" className="bf-item__link">
                      <span className="dash bf-item__dash" aria-hidden="true" data-bf-dash>
                        —
                      </span>
                      <span className="bf-item__mask">
                        <span className="bf-item__word" data-bf-word>
                          {nb(b.name)}
                        </span>
                      </span>
                    </RouteLink>
                  </h3>
                  <span className="leader bf-item__leader" aria-hidden="true" />
                  <p className="bf-item__price mono" data-bf-meta>
                    <CityPrice price={b.price} />
                  </p>
                  <p className="bf-item__desc" data-bf-meta>
                    {nb(b.desc)}
                  </p>
                  {b.kbju && (
                    <p className="bf-item__kbju mono" data-bf-meta>
                      {kbjuGroups(b.kbju).map((g, k) => (
                        <Fragment key={k}>
                          {k > 0 && <span className="sr-only">, </span>}
                          <span className="bf-item__kbju-group">{g}</span>
                        </Fragment>
                      ))}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </div>

          {/* Desktop: a sticky plate on lace follows the hovered / focused / read row. Decorative
              duplicate of the list above, so it stays out of the accessibility tree. */}
          <aside className="bf-preview" aria-hidden="true">
            <div className="bf-preview__sticky">
              <div className="bf-preview__inner" data-bf-preview>
                <div className="bf-stage">
                  <Lace className="bf-stage__lace" />
                  <div className="bf-stage__plates">
                    {breakfasts.map((b, i) => (
                      <div key={b.id} className="bf-slide" data-bf-key={b.id} data-active={i === 0 ? "" : undefined}>
                        {/* The plate is 78% of a stage that fills columns 8–12: ≈29.5vw at every
                            desktop width (smaller only on short screens). */}
                        <OctPhoto photo={b.photo} sizes="(min-width: 1024px) 30vw, 1px" loading="lazy" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bf-caps">
                  {breakfasts.map((b, i) => (
                    <div key={b.id} className="bf-cap" data-bf-key={b.id} data-active={i === 0 ? "" : undefined}>
                      <p className="label bf-cap__no">
                        {no(i)} / {last}
                      </p>
                      <p className="reply bf-cap__name">«{nb(b.name)}»</p>
                      {b.kbju ? (
                        <Kbju k={b.kbju} />
                      ) : (
                        <p className="label bf-cap__more">{nb(t.breakfasts.kbjuInMenu)}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Outside the sticky body, so it spans the whole grid: the reply under the board, the links
            and the note under the plate. */}
        <footer className="bf-foot" data-bf-foot>
          <span className="bf-rule bf-rule--close" data-bf-rule aria-hidden="true" />
          <Afterword />
          <div className="bf-links">
            <RouteLink to="menu" className="dlink">
              <span className="dash">—</span>
              {nb(t.breakfasts.links.menu)}
            </RouteLink>
            <RouteLink to="delivery" className="dlink">
              <span className="dash">—</span>
              {nb(t.breakfasts.links.delivery)}
            </RouteLink>
          </div>
          <p className="bf-note mono">{nb(t.breakfasts.lightNote)}</p>
        </footer>
      </div>
      <BreakfastsPreview />
      <BreakfastsMotion />
    </section>
  );
}
