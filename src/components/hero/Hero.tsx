import type { CSSProperties } from "react";
import type { City, Price } from "@/content/types";
import { answers } from "@/content/answers";
import { Wordmark } from "@/components/brand/Wordmark";
import { Photo } from "@/components/brand/Photo";
import { RouteLink } from "@/components/chrome/RouteLink";
import { PAD_SCRIPT, PHOTO_SCRIPT } from "@/lib/head-script";
import { tornEdge } from "@/lib/tear";
import { rub } from "@/lib/format";
import { keepWhole, typograf, WJ } from "@/lib/typograf";
import { t } from "@/i18n";
import { HeroController } from "./HeroController";
import { HeroStatus } from "./HeroStatus";

const CITIES: City[] = ["nalchik", "vladikavkaz"];

/** Hero copy never breaks inside a dish's name: not at a hyphen («Эспрессо-тоник») and not inside
 *  «ёлочки» («Завтрак / «Как в сказке»», never «Завтрак «Как / в сказке»»). */
const dish = (s: string) => keepWhole(typograf(s));

/**
 * A menu row: «Эспрессо-тоник ………… 290 ₽». The name may wrap, but the leader runs on from the end of its
 * last line and the price stands at that line's end (hero.css), so there is never a lone leader line.
 * Where the dish has no price in the city on show, «уточняйте в кофейне» takes a line of its own, with
 * no leader (CSS shows the active city).
 */
function MenuRow({ name, price }: { name: string; price: Price }) {
  const priced = CITIES.filter((city) => price[city] != null);
  return (
    <p className="menu-row panel__row">
      <span className="menu-row__name">
        {dish(name)}
        {priced.length > 0 && (
          // The word joiner glues the leader to the last word; the leader itself paints no width.
          <span className="menu-row__lead" aria-hidden="true" data-city-only={priced.length === 1 ? priced[0] : undefined}>
            {WJ}
            <span className="leader menu-row__dots" />
          </span>
        )}
      </span>
      {CITIES.map((city) => {
        const p = price[city];
        return p != null ? (
          <span key={city} className="menu-row__price mono" data-city-only={city}>
            {rub(p)}
          </span>
        ) : (
          <span key={city} className="panel__ask" data-city-only={city}>
            {typograf(t.hero.askLater)}
          </span>
        );
      })}
    </p>
  );
}

export function Hero() {
  return (
    <section id="hero" className="field hero" data-theme="cream" aria-labelledby="hero-title">
      <h1 id="hero-title" className="sr-only">
        {t.meta.h1}
      </h1>
      <div className="wrap hero__grid">
        {/* The notice: the logo asks, the tabs answer. */}
        <div className="notice">
          <div className="notice__sheet">
            <Wordmark variant="full" className="notice__logo" />
            <p className="notice__prompt label" id="pad-prompt">
              {t.hero.prompt}
            </p>
          </div>
          {/* One cell for the tabs and the all-torn note: the note sits in the torn strip instead of
              growing the notice (hero.css). */}
          <div className="notice__pad">
            <fieldset className="pad" data-pad aria-describedby="pad-prompt">
              <legend className="sr-only">{t.a11y.padGroup}</legend>
              <div className="pad__perf" aria-hidden="true" />
              <div className="pad__tabs">
                {answers.map((a) => {
                  const edge = tornEdge(a.id);
                  return (
                    <label
                      key={a.id}
                      className="tab"
                      htmlFor={`ans-${a.id}`}
                      data-tab={a.id}
                      style={{ "--stub": edge.stub, "--piece": edge.piece } as CSSProperties}
                    >
                      <input type="radio" name="answer" id={`ans-${a.id}`} value={a.id} className="tab__input" />
                      <span className="tab__paper" data-tab-paper>
                        <span className="tab__text display">{a.label}</span>
                      </span>
                      {/* Read only once the tab is torn (hero.css): «Сонно, оторвано». */}
                      <span className="tab__torn sr-only">, {t.hero.torn}</span>
                    </label>
                  );
                })}
              </div>
              <script dangerouslySetInnerHTML={{ __html: PAD_SCRIPT }} />
            </fieldset>
            <div className="notice__empty" data-empty hidden>
              <p className="notice__empty-text">{t.hero.allTorn}</p>
              <button type="button" className="btn" data-reprint>
                {t.hero.reprint}
              </button>
            </div>
          </div>
        </div>

        {/* The answer: all eight are server-rendered and stacked in one cell (no layout shift). */}
        <div className="stage">
          <HeroStatus />
          <div className="stage__panels">
            {answers.map((a) => (
              <article key={a.id} className="panel" data-panel={a.id} aria-label={`${a.label}: ${a.item.name}`}>
                <p className="panel__q">
                  {t.hero.q}
                </p>
                <p className="panel__a display" data-answer>
                  {a.label}.
                </p>
                <div className="panel__body">
                  <Photo
                    photo={a.item.photo}
                    aspect="4/5"
                    className="panel__photo"
                    // hero.css: up to half of the 5-column stage from 1280, two fifths of 6 columns from
                    // 1024; a fixed 14rem on tablets; a third of the screen on phones.
                    sizes="(min-width: 1280px) 19vw, (min-width: 1024px) 17vw, (min-width: 640px) 14rem, 33vw"
                    loading="lazy"
                  />
                  <div className="panel__text">
                    <MenuRow name={a.item.name} price={a.item.price} />
                    <p className="panel__reply reply">{dish(a.reply)}</p>
                    <RouteLink to="menu" hash={a.item.anchor} className="dlink panel__more">
                      {t.hero.toMenu}
                    </RouteLink>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <script dangerouslySetInnerHTML={{ __html: PHOTO_SCRIPT }} />
        </div>

        <div className="hero__actions">
          <RouteLink to="menu" className="btn btn-primary">
            {t.hero.actions.menu}
          </RouteLink>
          <a href="#gde" className="btn">
            {t.hero.actions.nearest}
          </a>
        </div>
      </div>
      <p className="sr-only" aria-live="polite" data-live />
      <HeroController />
    </section>
  );
}
