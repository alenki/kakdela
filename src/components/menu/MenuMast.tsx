import { CitySwitch } from "@/components/chrome/CitySwitch";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";

/**
 * The page's title: «Меню» / «Что будете?», the waiter's line after the homepage's «Как дела?». Then the lead and
 * whose prices the page shows (the city switch, as over the homepage's breakfasts). Never animated: it is the
 * first screen. The mobile action bar appears once it has scrolled away (data-actionbar-after).
 */
export function MenuMast() {
  return (
    <header className="mn-mast" data-actionbar-after>
      <DialogueHeading as="h1" id="menu-title" q={t.menu.q} a={typograf(t.menu.a)} />
      <p className="lead mn-mast__lead">{typograf(t.menu.lead)}</p>
      <div className="mn-prices">
        <p id="mn-prices-label" className="label">
          {t.breakfasts.prices}
          {/* Without JS the switch can't switch: it is hidden and the prices shown (Нальчик) are named. */}
          <span className="mn-prices__static">: {t.city.nalchik}</span>
        </p>
        <CitySwitch compact className="mn-prices__switch" labelledBy="mn-prices-label" />
      </div>
    </header>
  );
}
