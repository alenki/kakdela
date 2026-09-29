import type { CSSProperties } from "react";
import type { City, Price } from "@/content/types";
import { answers } from "@/content/answers";
import { Wordmark } from "@/components/brand/Wordmark";
import { Photo } from "@/components/brand/Photo";
import { Slip } from "@/components/brand/Slip";
import { BtnLabel } from "@/components/chrome/BtnLabel";
import { RouteLink } from "@/components/chrome/RouteLink";
import { PAD_SCRIPT, PHOTO_SCRIPT } from "@/lib/head-script";
import { tornEdge } from "@/lib/tear";
import { rub } from "@/lib/format";
import { keepWhole, typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { HeroController } from "./HeroController";
import { HeroStatus } from "./HeroStatus";

const CITIES: City[] = ["nalchik", "vladikavkaz"];

/** Hero copy never breaks inside a dish's name: not at a hyphen («Эспрессо-тоник») and not inside
 *  «ёлочки» («Завтрак / «Как в сказке»», never «Завтрак «Как / в сказке»»). */
const dish = (s: string) => keepWhole(typograf(s));

/**
 * The dish's price in the city on show, centred beside the reply's lines (hero.css). Where
 * the dish has no price there yet, «уточняйте в кофейне» instead (CSS shows the active city).
 */
function DishPrice({ price }: { price: Price }) {
  return (
    <p className="panel__price">
      {CITIES.map((city) => {
        const p = price[city];
        return p != null ? (
          <span key={city} className="mono" data-city-only={city}>
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
                <BtnLabel>{t.hero.reprint}</BtnLabel>
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
                {/* The tab the guest tore off, landed on its side across the dish, a little askew: rising
                    on a good day, drooping on a sleepy or so-so one (Slip, brand.css; placed by hero.css). */}
                <Slip seed={a.id} label={a.label} mood={a.mood} className="panel__slip" data-answer />
                <Photo
                  photo={a.item.photo}
                  aspect="3/2"
                  className="panel__photo"
                  // hero.css: the stage's width, inside the gutters (side by side: five columns from 1280,
                  // six from 1024; stacked: the screen less its gutters).
                  sizes="(min-width: 1280px) and (min-aspect-ratio: 6/5) 37vw, (min-width: 1024px) and (min-aspect-ratio: 6/5) 44vw, 93vw"
                  loading="lazy"
                />
                <div className="panel__text">
                  <p className="panel__reply reply">{dish(a.reply)}</p>
                  <DishPrice price={a.item.price} />
                </div>
              </article>
            ))}
          </div>
          <script dangerouslySetInnerHTML={{ __html: PHOTO_SCRIPT }} />
        </div>

        <div className="hero__actions">
          <RouteLink to="menu" className="btn btn-primary">
            <BtnLabel>{t.hero.actions.menu}</BtnLabel>
          </RouteLink>
          <a href="#gde" className="btn">
            <BtnLabel>{t.hero.actions.nearest}</BtnLabel>
          </a>
        </div>
      </div>
      <p className="sr-only" aria-live="polite" data-live />
      <HeroController />
    </section>
  );
}
