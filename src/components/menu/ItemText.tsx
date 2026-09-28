import type { Answer, City, MenuItem } from "@/content/types";
import { keepWhole, typograf } from "@/lib/typograf";
import { t } from "@/i18n";

const CITIES: City[] = ["nalchik", "vladikavkaz"];

/** A dish name: never broken at a hyphen or inside «ёлочки». */
export const dishName = (s: string) => keepWhole(typograf(s));

/**
 * The hero's dialogue, printed over each of the eight answer dishes: «Как дела? Сонно.». Graphite, always;
 * the answer word turns the page's one red when it is today's tear or the answer the guest came with
 * (html[data-said] / html[data-pick], menu.css).
 */
export function SaidLine({ answer }: { answer: Answer }) {
  return (
    <p className="mn-said">
      <span className="mn-said__q">{t.hero.q}</span>{" "}
      <span className="mn-said__a">{dishName(answer.label)}.</span>
    </p>
  );
}

/** Descriptions keep their words whole too: «по-деревенски» never breaks at its hyphen. */
const copy = (s: string) => keepWhole(typograf(s));

/** A dish's description. Where a city's recipe differs, both are rendered and CSS shows the guest's city. */
export function ItemDesc({ item, className }: { item: MenuItem; className?: string }) {
  const by = item.descByCity;
  if (!by || !Object.keys(by).length) return item.desc ? <p className={className}>{copy(item.desc)}</p> : null;
  return (
    <p className={className}>
      {CITIES.map((c) => {
        const d = by[c] ?? item.desc;
        return d ? (
          <span key={c} data-city-only={c}>
            {copy(d)}
          </span>
        ) : null;
      })}
    </p>
  );
}
