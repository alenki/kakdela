import type { City, MenuItem } from "@/content/types";
import { groupDigits, rub } from "@/lib/format";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { CITIES, onlyCity } from "./model";

/** One city's amount; a dish without a price there says to ask, quietly. */
function Amount({ v }: { v: number | null }) {
  return v == null ? <span className="mn-ask">{typograf(t.hero.askLater)}</span> : <>{rub(v)}</>;
}

/**
 * A menu row's price slot, in `.mono`. One price when both cities agree, otherwise both, each with
 * data-city-only (CSS shows the guest's city, so a switch never re-renders). Cup sizes read «240 / 270 ₽» and are
 * spoken with their volumes: «200 мл за 240 ₽, 300 мл за 270 ₽». A dish served in one city only says so in the
 * other («только в Нальчике»): it is never hidden, so its anchor and the layout hold.
 */
export function Price({ item, cities }: { item: MenuItem; cities: City[] }) {
  const { price, volume } = item;
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
  const only = onlyCity(cities);
  if (!only && price.nalchik === price.vladikavkaz) return <Amount v={price.nalchik} />;
  return CITIES.map((c) => (
    <span key={c} data-city-only={c}>
      {only && only !== c ? <span className="mn-only">{typograf(t.menu.only[only])}</span> : <Amount v={price[c]} />}
    </span>
  ));
}

/** 85.3 → «85,3»; the source's second decimal (15.44) is kept to one (15,4). */
const dec = (n: number) => String(Math.round(n * 10) / 10).replace(".", ",");

export function kbjuLine(item: MenuItem): string | null {
  const k = item.nutrition?.kbju;
  if (!k) return null;
  return k.b != null && k.zh != null && k.u != null ? t.breakfasts.kbju(dec(k.k), dec(k.b), dec(k.zh), dec(k.u)) : t.menu.kcal(dec(k.k));
}

export function volumeLine(item: MenuItem): string | null {
  const v = item.volume;
  if (!v) return null;
  return "ml" in v ? t.menu.ml(String(v.ml)) : t.menu.ml(`${v.sizes[0]} / ${v.sizes[1]}`);
}

/**
 * The small print under a dish: its volume, then КБЖУ, joined by «·» (each figure keeps its name, so a line only
 * breaks after a «·»). КБЖУ that holds for one city's recipe only is shown in that city only.
 */
export function Facts({ item, className, volume = true }: { item: MenuItem; className?: string; volume?: boolean }) {
  const vol = volume ? volumeLine(item) : null;
  const kbju = kbjuLine(item);
  if (!vol && !kbju) return null;
  const only = item.nutrition?.cities?.length === 1 ? item.nutrition.cities[0] : undefined;
  // Nothing but one city's КБЖУ: the whole line belongs to that city (no empty paragraph in the other).
  if (!vol && kbju && only) {
    return (
      <p className={className} data-city-only={only}>
        {typograf(kbju)}
      </p>
    );
  }
  const sep = vol && kbju ? " · " : "";
  return (
    <p className={className}>
      {vol && typograf(vol)}
      {kbju && (only ? <span data-city-only={only}>{typograf(sep + kbju)}</span> : typograf(sep + kbju))}
    </p>
  );
}

/** A dish's description, and a city's own recipe where it has one (each with data-city-only). */
export function Desc({ item, className }: { item: MenuItem; className?: string }) {
  if (!item.desc) return null;
  const vl = item.descByCity?.vladikavkaz;
  if (!vl) return <p className={className}>{typograf(item.desc)}</p>;
  return (
    <>
      <p className={className} data-city-only="nalchik">
        {typograf(item.desc)}
      </p>
      <p className={className} data-city-only="vladikavkaz">
        {typograf(vl)}
      </p>
    </>
  );
}
