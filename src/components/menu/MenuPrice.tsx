import type { City, MenuPrice as Price, Volume } from "@/content/types";
import { groupDigits, rub } from "@/lib/format";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";

const CITIES: City[] = ["nalchik", "vladikavkaz"];

/** One city's amount; a dish without a price there says to ask, quietly. */
function Amount({ v }: { v: number | null }) {
  return v == null ? <span className="mi__ask">{typograf(t.hero.askLater)}</span> : <>{rub(v)}</>;
}

/**
 * The price slot of a menu row. One price when both cities agree, otherwise both, each with
 * data-city-only (CSS shows the guest's city). Cup sizes read «240 / 270 ₽» and are spoken with their
 * volumes: «200 мл за 240 ₽, 300 мл за 270 ₽».
 */
export function MenuPrice({ price, volume }: { price: Price; volume?: Volume }) {
  if ("sizes" in price) {
    const [a, b] = price.sizes;
    const ml = volume && "sizes" in volume ? volume.sizes : null;
    return (
      <>
        <span aria-hidden={ml ? true : undefined}>
          {groupDigits(a)} / {rub(b)}
        </span>
        {ml && <span className="sr-only">{t.menu.sizesSpoken(ml[0], rub(a), ml[1], rub(b))}</span>}
      </>
    );
  }
  if (price.nalchik === price.vladikavkaz) return <Amount v={price.nalchik} />;
  return CITIES.map((c) => (
    <span key={c} data-city-only={c}>
      <Amount v={price[c]} />
    </span>
  ));
}
