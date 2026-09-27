import type { City, MenuPrice as Price, Volume } from "@/content/types";
import { cn, groupDigits, rub } from "@/lib/format";
import { typograf, WJ } from "@/lib/typograf";
import { t } from "@/i18n";
import { dishName } from "./ItemText";

const CITIES: City[] = ["nalchik", "vladikavkaz"];

/**
 * A secondary menu row (.menu-row, as the hero sets its dish): «Поке с курицей ……… 380 ₽». The name may
 * wrap; the leader runs on from its last line and the price stands at that line's end. Where the city on
 * show has no price, «уточняйте в кофейне» takes a line of its own with no leader (menu.css), and the
 * leader is rendered only for the cities that have one.
 */
export function MenuRowLine({
  name,
  price,
  volume,
  lang,
  as: Tag = "p",
  className,
}: {
  name: string;
  price: Price;
  volume?: Volume;
  lang?: "en";
  as?: "p" | "span";
  className?: string;
}) {
  const priced = "sizes" in price ? CITIES : CITIES.filter((c) => price[c] != null);
  const ask = (c?: City) => (
    <span key={c ?? "all"} className="mn-row__ask" data-city-only={c}>
      {typograf(t.hero.askLater)}
    </span>
  );
  const amount = (v: number, c?: City) => (
    <span key={c ?? "all"} className="menu-row__price mono" data-city-only={c}>
      {rub(v)}
    </span>
  );

  let tail;
  if ("sizes" in price) {
    const [a, b] = price.sizes;
    const ml = volume && "sizes" in volume ? volume.sizes : null;
    tail = (
      <span className="menu-row__price mono">
        <span aria-hidden={ml ? true : undefined}>
          {groupDigits(a)} / {rub(b)}
        </span>
        {ml && <span className="sr-only">{t.menu.sizesSpoken(ml[0], rub(a), ml[1], rub(b))}</span>}
      </span>
    );
  } else if (price.nalchik === price.vladikavkaz) {
    tail = price.nalchik != null ? amount(price.nalchik) : ask();
  } else {
    tail = CITIES.map((c) => {
      const v = price[c];
      return v != null ? amount(v, c) : ask(c);
    });
  }

  return (
    <Tag className={cn("menu-row mn-row", className)}>
      <span className="menu-row__name" lang={lang}>
        {dishName(name)}
        {priced.length > 0 && (
          // The word joiner glues the leader to the last word; the leader itself paints no width.
          <span className="menu-row__lead" aria-hidden="true" data-city-only={priced.length === 1 ? priced[0] : undefined}>
            {WJ}
            <span className="leader menu-row__dots" />
          </span>
        )}
      </span>
      {tail}
    </Tag>
  );
}
