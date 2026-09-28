import { fullMenu } from "@/content/full-menu";
import { CitySwitch } from "@/components/chrome/CitySwitch";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";

/**
 * The running head of a printed menu: the three chapters and whose prices, sticky under the header. It takes
 * the theme of the chapter beneath and marks the chapter being read (RunningHeadController); when the
 * header tucks away on the way down, the head rides up with it (menu.css).
 */
export function MenuRunningHead() {
  return (
    <nav className="mn-run" data-theme="cream" aria-label={t.menu.runNav} data-mn-run>
      <div className="wrap mn-run__inner">
        <ul className="mn-run__links" role="list">
          {fullMenu.map((ch) => (
            <li key={ch.id}>
              <a className="mn-run__link" href={`#${ch.id}`} data-mn-run-link={ch.id}>
                {typograf(ch.title)}
              </a>
            </li>
          ))}
        </ul>
        <div className="mn-run__prices">
          <p id="mn-run-prices" className="label mn-run__label">
            {t.breakfasts.prices}
            <span className="mn-prices__static">: {t.city.nalchik}</span>
          </p>
          <CitySwitch compact className="mn-prices__switch mn-run__switch" labelledBy="mn-run-prices" />
        </div>
      </div>
    </nav>
  );
}
