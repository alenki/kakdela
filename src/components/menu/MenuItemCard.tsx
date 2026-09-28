import type { City, MenuItem } from "@/content/types";
import { answerByAnchor } from "@/content/full-menu";
import { Photo } from "@/components/brand/Photo";
import { cn } from "@/lib/format";
import { t } from "@/i18n";
import { MenuRowLine } from "./MenuRowLine";
import { ItemFacts } from "./ItemFacts";
import { ItemDesc, SaidLine } from "./ItemText";

/** A dish served in one city only is rendered for that city only (html[data-city] hides the other). */
const cityOnly = (cities: City[]) => (cities.length === 1 ? cities[0] : undefined);

/** The card's frame: half the screen on phones and tablets, a third from 1024, a quarter from 1920. */
const SIZES = "(min-width: 1920px) 23vw, (min-width: 1024px) 31vw, (min-width: 640px) 46vw, calc(50vw - 24px)";

/**
 * One dish: its photo (a house dish is marked «Фирменное» on it), then a menu row, name …… price, the
 * description and the small print. On the eight answer dishes the hero's dialogue stands over the name
 * («Как дела? Сонно.»), and its answer word takes the page's one red when the guest lands there (menu.css).
 * A dish without a photo is set as a row under the grid, never as an empty frame.
 */
export function MenuItemCard({ item, cities }: { item: MenuItem; cities: City[] }) {
  const answer = answerByAnchor[item.id];
  return (
    <li id={item.id} className={cn("mi", !item.photo && "mi--row")} data-answer={answer?.id} data-city-only={cityOnly(cities)} data-mn-card>
      {item.photo && (
        <div className="mi__media">
          <Photo photo={item.photo} aspect="4/5" sizes={SIZES} loading="lazy" className="mi__photo" />
          {item.signature && <span className="mi__badge">{t.menu.signature}</span>}
        </div>
      )}
      <div className="mi__text">
        {answer && <SaidLine answer={answer} />}
        <MenuRowLine name={item.name} price={item.price} volume={item.volume} lang={item.lang} className="mi__row" />
        <ItemDesc item={item} className="mi__desc" />
        <ItemFacts item={item} className="mi__facts label mono" />
      </div>
    </li>
  );
}
