import { CitySwitch } from "@/components/chrome/CitySwitch";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { AnswersIndex } from "./AnswersIndex";
import { MenuContents } from "./MenuContents";

/**
 * The cover: «Меню» / «Что будете?», the waiter's side of the homepage's «Как дела?». Under it the eight
 * answers, each beside its dish, then the contents with the whose-prices switch. Never animated: it is the
 * first screen. The mobile action bar appears once it has scrolled away (data-actionbar-after).
 */
export function MenuTop() {
  return (
    <section id="soderzhanie" className="field mn-top" data-theme="cream" aria-labelledby="menu-title" data-actionbar-after>
      <div className="wrap">
        <header className="section-head mn-top__head">
          <DialogueHeading as="h1" id="menu-title" q={t.menu.q} a={typograf(t.menu.a)} />
          <p className="lead">{typograf(t.menu.lead)}</p>
        </header>

        <div className="mn-top__body">
          {/* Whose prices the whole page shows (the homepage breakfasts bar). */}
          <div className="mn-prices">
            <p id="mn-prices-label" className="label">
              {t.breakfasts.prices}
              {/* Without JS the switch can't switch: it is hidden and the prices shown (Нальчик) are named. */}
              <span className="mn-prices__static">: {t.city.nalchik}</span>
            </p>
            <CitySwitch compact className="mn-prices__switch" labelledBy="mn-prices-label" />
          </div>
          <AnswersIndex />
          <MenuContents />
        </div>
      </div>
    </section>
  );
}
