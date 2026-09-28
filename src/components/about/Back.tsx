import { answers } from "@/content/answers";
import type { City, Price } from "@/content/types";
import { Slip } from "@/components/brand/Slip";
import { BtnLabel } from "@/components/chrome/BtnLabel";
import { RouteLink } from "@/components/chrome/RouteLink";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { BACK_SCRIPT } from "@/lib/about-script";
import { rub } from "@/lib/format";
import { keepWhole, typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { InlineScript } from "./InlineScript";
import { BackController } from "./back/BackController";

const CITIES: City[] = ["nalchik", "vladikavkaz"];
const dish = (s: string) => keepWhole(typograf(s));

/** The dish's price in the city on show, or «уточняйте в кофейне» where it has none yet (as in the hero). */
function DishPrice({ price }: { price: Price }) {
  return CITIES.map((city) => {
    const p = price[city];
    return (
      <span key={city} className={p == null ? "ab-reply__ask" : "mono"} data-city-only={city}>
        {p != null ? rub(p) : typograf(t.hero.askLater)}
      </span>
    );
  });
}

/**
 * «А у вас?»: the café asks back, and the page ends where the homepage begins. The eight answers lie as the
 * notice's slips: a radio group, so it works with no script at all (about.css shows the checked answer's
 * reply with :has). The café replies as in the hero: its line in italic, then the dish of that name and
 * its price. A pick is a tear: BackController remembers it (the homepage's notice and the team's slips
 * show it, and the opening's line starts with it); browsing with the arrow keys only previews. Today's
 * answer is already chosen (BACK_SCRIPT, before first paint).
 */
export function Back() {
  return (
    <section id="a-u-vas" className="field section-pad ab-back" data-theme="ink" aria-labelledby="a-u-vas-title">
      <div className="wrap">
        <header className="ab-back__head" data-ab-rise>
          <DialogueHeading id="a-u-vas-title" q={t.about.back.a} a={typograf(t.about.back.a)} />
          <p className="ab-back__prompt label" id="a-u-vas-prompt">
            {t.about.back.prompt}
          </p>
        </header>

        <div className="ab-back__body">
          <fieldset className="ab-pick" aria-describedby="a-u-vas-prompt" data-ab-pick>
            <legend className="sr-only">{t.a11y.padGroup}</legend>
            {answers.map((a) => (
              <label key={a.id} className="ab-pick__opt" htmlFor={`back-${a.id}`} data-pick={a.id}>
                <input type="radio" name="back" id={`back-${a.id}`} value={a.id} className="ab-pick__input" />
                <Slip as="span" seed={a.id} label={a.label} mood={a.mood} className="ab-pick__slip" data-pick-slip />
              </label>
            ))}
            <InlineScript code={BACK_SCRIPT} />
          </fieldset>

          {/* Every reply is server-rendered in one cell: the longest sets the height, nothing moves. */}
          <div className="ab-replies" data-ab-replies>
            <div className="ab-reply ab-reply--idle">
              <p className="ab-reply__line reply">{typograf(t.about.back.idle)}</p>
            </div>
            {answers.map((a) => (
              <article key={a.id} className="ab-reply" data-reply={a.id} aria-label={`${a.label}: ${a.item.name}`}>
                <p className="ab-reply__line reply">{dish(a.reply)}</p>
                <p className="ab-reply__dish menu-row">
                  <span className="menu-row__name">{dish(a.item.name)}</span>
                  <span className="menu-row__price">
                    <DishPrice price={a.item.price} />
                  </span>
                </p>
                <p className="ab-reply__more">
                  <RouteLink to="menu" hash={a.item.anchor} className="dlink">
                    {t.about.back.dish}
                  </RouteLink>
                </p>
              </article>
            ))}
          </div>
        </div>

        <div className="ab-back__actions" data-ab-rise>
          <RouteLink to="menu" className="btn btn-primary">
            <BtnLabel>{t.hero.actions.menu}</BtnLabel>
          </RouteLink>
          <RouteLink to="home" hash="gde" className="btn">
            <BtnLabel>{t.hero.actions.nearest}</BtnLabel>
          </RouteLink>
        </div>
      </div>
      <p className="sr-only" aria-live="polite" data-back-live />
      <BackController />
    </section>
  );
}
