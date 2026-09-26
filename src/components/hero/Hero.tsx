import type { CSSProperties } from "react";
import { answers } from "@/content/answers";
import { cafes } from "@/content/cafes";
import { Wordmark } from "@/components/brand/Wordmark";
import { HatchedClover, CLOVER_BOX } from "@/components/brand/Clover";
import { WORDMARK_VIEWBOX } from "@/components/brand/wordmark-data";
import { OctPhoto } from "@/components/brand/OctPhoto";
import { RouteLink } from "@/components/chrome/RouteLink";
import { PAD_SCRIPT } from "@/lib/head-script";
import { tornEdge } from "@/lib/tear";
import { rub } from "@/lib/format";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { HeroController } from "./HeroController";
import { HeroStatus } from "./HeroStatus";
import { YesterdayLine } from "./YesterdayLine";

// Where the clover sits inside the full wordmark (for the crayon-hatch overlay during the intro).
const vb = WORDMARK_VIEWBOX;
const cloverOverlay: CSSProperties = {
  left: `${((CLOVER_BOX.x - 6 - vb.x) / vb.w) * 100}%`,
  top: `${((CLOVER_BOX.y - 6 - vb.y) / vb.h) * 100}%`,
  width: `${((CLOVER_BOX.w + 12) / vb.w) * 100}%`,
  height: `${((CLOVER_BOX.h + 12) / vb.h) * 100}%`,
};

function Price({ price }: { price: { nalchik: number | null; vladikavkaz: number | null } }) {
  return (
    <>
      <span data-city-only="nalchik">{price.nalchik != null ? rub(price.nalchik) : t.hero.askLater}</span>
      <span data-city-only="vladikavkaz">{price.vladikavkaz != null ? rub(price.vladikavkaz) : t.hero.askLater}</span>
    </>
  );
}

export function Hero() {
  return (
    <section id="hero" className="field hero" data-theme="sky" aria-labelledby="hero-title">
      <h1 id="hero-title" className="sr-only">
        {t.meta.h1}
      </h1>
      <div className="wrap hero__grid">
        <div className="hero__top">
          <HeroStatus />
          <p className="label hero__cities">{t.hero.cities(cafes.length)}</p>
        </div>

        {/* The notice: the logo asks, the tabs answer. */}
        <div className="notice" data-notice>
          <div className="notice__sheet">
          <span className="notice__pin" aria-hidden="true" />
          <div className="notice__logo-wrap">
            <Wordmark variant="full" className="notice__logo" />
            <span className="notice__hatch" style={cloverOverlay} aria-hidden="true">
              <HatchedClover solid={false} seed={20260926} pitch={10} />
            </span>
          </div>
          <p className="notice__prompt label" id="pad-prompt">
            {t.hero.prompt} <span aria-hidden="true">↓</span>
          </p>
          </div>
          <fieldset className="pad" data-pad aria-describedby="pad-prompt">
            <legend className="sr-only">{t.a11y.padGroup}</legend>
            <div className="pad__perf perf" aria-hidden="true" />
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
                      <span className="tab__text a-voice">{a.label}</span>
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
            <p className="reply">{t.hero.allTorn}</p>
            <button type="button" className="btn" data-reprint>
              <span className="btn-dash" aria-hidden="true" />
              {t.hero.reprint}
            </button>
          </div>
        </div>

        {/* The reply stage: all eight answers are server-rendered and stacked in one cell. */}
        <div className="stage" data-stage>
          {/* Visible notes are read too (the guess note says the answer below isn't the guest's yet);
              the inactive ones are display: none, so they stay out of the accessibility tree. */}
          <div className="stage__notes label">
            <span className="stage__note stage__note--guess">{t.hero.guessNote}</span>
            <span className="stage__note stage__note--first">{t.hero.firstNote}</span>
            <YesterdayLine />
          </div>
          <div className="stage__panels">
            {answers.map((a) => (
              <article key={a.id} className="panel" data-panel={a.id} aria-label={`${a.label}: ${a.item.name}`}>
                <p className="panel__q q-voice">
                  <span className="dash">—</span> {t.footer.q}
                </p>
                <p
                  className="panel__a a-voice"
                  data-answer-word
                  style={{ "--w": a.posture.weight, "--skew": `${a.posture.skewX}deg`, "--sy": a.posture.scaleY } as CSSProperties}
                >
                  <span className="dash">—</span>
                  <span data-word>{a.label}.</span>
                </p>
                <div className="panel__body">
                  <div className="panel__photo" data-photo>
                    <OctPhoto
                      photo={a.item.photo}
                      lace
                      sizes="(min-width: 1280px) 17vw, (min-width: 1024px) 21vw, 38vw"
                      loading="lazy"
                    />
                  </div>
                  <div className="panel__text">
                    <p className="panel__receipt mono" data-receipt>
                      <span className="panel__item">{a.item.name}</span>
                      <span className="leader" aria-hidden="true" />
                      <span className="panel__price">
                        <Price price={a.item.price} />
                      </span>
                    </p>
                    <p className="panel__city label">
                      <span data-city-only="nalchik">{t.hero.priceNote.nalchik}</span>
                      <span data-city-only="vladikavkaz">{t.hero.priceNote.vladikavkaz}</span>
                    </p>
                    <p className="panel__reply reply" data-reply>
                      {typograf(a.reply)}
                    </p>
                    <RouteLink to="menu" className="dlink panel__more">
                      <span className="dash">—</span>
                      {t.hero.toMenu}
                    </RouteLink>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="hero__actions">
          <RouteLink to="menu" className="btn btn-primary">
            {t.hero.actions.menu}
          </RouteLink>
          <a href="#gde" className="btn">
            <span className="btn-dash" aria-hidden="true" />
            {t.hero.actions.nearest}
          </a>
          <RouteLink to="delivery" className="btn hero__delivery">
            <span className="btn-dash" aria-hidden="true" />
            {t.hero.actions.delivery}
          </RouteLink>
          <a href="#komanda" className="hero__cue label">
            <span aria-hidden="true">↓</span> {t.hero.scrollCue}
          </a>
        </div>
      </div>
      <p className="sr-only" aria-live="polite" data-live />
      <HeroController />
    </section>
  );
}
