import type { City, MenuItem } from "@/content/types";
import { answerByAnchor } from "@/content/full-menu";
import { Photo } from "@/components/brand/Photo";
import { cn } from "@/lib/format";
import { MenuPrice } from "./MenuPrice";
import { MenuRowLine } from "./MenuRowLine";
import { ItemFacts } from "./ItemFacts";
import { dishName, ItemDesc, SaidLine } from "./ItemText";

/** A row served in one city only is rendered for that city only (html[data-city] hides the other). */
const cityOnly = (cities: City[]) => (cities.length === 1 ? cities[0] : undefined);

/**
 * Tier A: a signature dish, set as the homepage sets it (the breakfasts and the coffee lists): the name in
 * display type, a dotted leader, the price, the description and the small print under them. On the eight
 * answer dishes the hero's dialogue stands over the name. Kitchen rows carry a thumbnail below 1024px (the
 * sticky photo takes over from there) and the hooks of the kitchen preview.
 */
export function SignatureRow({ item, thumb, preview }: { item: MenuItem; thumb?: boolean; preview?: boolean }) {
  const answer = answerByAnchor[item.id];
  const photo = thumb ? item.photo : undefined;
  return (
    <li
      id={item.id}
      className={cn("mi mi--a", photo && "mi--thumb")}
      data-answer={answer?.id}
      data-mn-rise
      data-mn-row={preview ? "" : undefined}
      data-mn-key={preview ? item.id : undefined}
    >
      {photo && (
        <Photo
          photo={photo}
          sizes="(min-width: 1024px) 1px, (min-width: 480px) 128px, (min-width: 356px) 27vw, 96px"
          loading="lazy"
          className="mi__thumb photo--sm"
        />
      )}
      {answer && <SaidLine answer={answer} />}
      <h3 className="mi__name display item-title" lang={item.lang}>
        {dishName(item.name)}
      </h3>
      <span className="leader mi__leader" aria-hidden="true" />
      <p className="mi__price mono">
        <MenuPrice price={item.price} volume={item.volume} />
      </p>
      <ItemDesc item={item} className="mi__desc" />
      <ItemFacts item={item} className="mi__facts label mono" />
    </li>
  );
}

/**
 * Tier B: the card and the vitrine. A secondary menu row (.menu-row: the leader runs on from the name's last
 * line, the price on its baseline), the description and the small print. A thumbnail only where the row
 * has a photo; a row without one has no empty frame.
 */
export function CardRow({
  item,
  cities,
  thumb,
}: {
  item: MenuItem;
  cities: City[];
  /** "card": the kitchen card's small thumb; "vitrine": the desserts' larger one. */
  thumb?: "card" | "vitrine";
}) {
  const answer = answerByAnchor[item.id];
  const photo = thumb ? item.photo : undefined;
  return (
    <li
      id={item.id}
      className={cn("mi mi--b", photo && "mi--thumb", thumb === "vitrine" && "mi--vit")}
      data-answer={answer?.id}
      data-city-only={cityOnly(cities)}
    >
      {photo && (
        <Photo
          photo={photo}
          sizes={
            thumb === "vitrine"
              ? "(min-width: 1920px) 160px, (min-width: 1280px) 128px, (min-width: 1024px) 96px, (min-width: 480px) 128px, (min-width: 356px) 27vw, 96px"
              : "(min-width: 1920px) 120px, (min-width: 534px) 96px, 18vw"
          }
          loading="lazy"
          className="mi__thumb photo--sm"
        />
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

/**
 * Tier C: the three signature desserts, set as the homepage evening sets them: a photo over each, then the
 * name, the leader and the price, the description and the small print.
 */
export function ThirdRow({ item }: { item: MenuItem }) {
  return (
    <li id={item.id} className="mi mi--c" data-mn-rise>
      {item.photo && (
        <Photo photo={item.photo} aspect="4/5" sizes="(min-width: 640px) 31vw, calc(100vw - 32px)" loading="lazy" className="mi__photo" />
      )}
      <div className="mi__body">
        <div className="mi__line">
          <h3 className="mi__name display item-title" lang={item.lang}>
            {dishName(item.name)}
          </h3>
          <span className="leader mi__leader" aria-hidden="true" />
          <p className="mi__price mono">
            <MenuPrice price={item.price} volume={item.volume} />
          </p>
        </div>
        <ItemDesc item={item} className="mi__desc" />
        <ItemFacts item={item} className="mi__facts label mono" />
      </div>
    </li>
  );
}
