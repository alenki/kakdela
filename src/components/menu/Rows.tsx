import type { MenuCategory } from "@/content/types";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { keepWhole, typograf } from "@/lib/typograf";
import { cn } from "@/lib/format";
import { t } from "@/i18n";
import { onlyCity, type Row } from "./model";
import { Placard, Plate } from "./Plate";
import { Desc, Facts, Price } from "./Price";

const name = (s: string) => keepWhole(typograf(s));

/** A dish's name: a link to itself, so every dish can be focused, reached and sent (/menu#shakshuka). */
function NameLink({ row }: { row: Row }) {
  return (
    <a href={`#${row.item.id}`} className="mn-name__link" lang={row.item.lang}>
      {name(row.item.name)}
    </a>
  );
}

/** The row's own marks: a signature row is set large, a one-city row steps back in the other city. */
const rowData = (row: Row) => ({
  id: row.item.id,
  "data-sig": row.item.signature ? "" : undefined,
  "data-only": onlyCity(row.cities) ?? undefined,
});

/** Phones and tablets (and every width without JS): the row's own photo, 96 to 128px square. */
const THUMB = "(min-width: 480px) 128px, 27vw";

/**
 * A kitchen row, set as the homepage's breakfasts are: the name in the display face over its description, the
 * price in a column of its own. From 1024px the photo is the table's (MenuTable), so the row's own goes; below,
 * every row with a photo carries it.
 */
export function DishRow({ row }: { row: Row }) {
  const { item, cities } = row;
  return (
    <li className="mn-row" data-mn-row={item.id} {...rowData(row)}>
      {item.photo && <Plate id={item.id} photo={item.photo} aspect="1/1" sizes={THUMB} className="mn-row__photo photo--sm" />}
      <h4 className="mn-row__name mn-name display">
        <NameLink row={row} />
      </h4>
      <p className="mn-row__price mono">
        <Price item={item} cities={cities} />
      </p>
      <Desc item={item} className="mn-row__desc" />
      <Facts item={item} className="mn-row__facts label mono" />
    </li>
  );
}

/**
 * A card in the vitrine (the desserts, the bar's house drinks): the dish on its plate, the name and the price
 * under it, then the description and the small print. Phones set it as a row with its photo beside.
 */
export function DishCard({ row, sizes }: { row: Row; sizes: string }) {
  const { item, cities } = row;
  return (
    <li className="mn-card" {...rowData(row)}>
      {item.photo ? (
        <Plate id={item.id} photo={item.photo} aspect="4/3" sizes={sizes} className="mn-card__photo" />
      ) : (
        <Placard name={item.name} aspect="4/3" className="mn-card__photo" />
      )}
      <h4 className="mn-card__name mn-name display">
        <NameLink row={row} />
      </h4>
      <p className="mn-card__price mono">
        <Price item={item} cities={cities} />
      </p>
      <Desc item={item} className="mn-card__desc" />
      <Facts item={item} className="mn-card__facts label mono" />
    </li>
  );
}

/** A line on the bar's board: the name, the price at the end, the volume and КБЖУ under it. Type only. */
export function BoardLine({ row }: { row: Row }) {
  const { item, cities } = row;
  return (
    <li className="mn-line" {...rowData(row)}>
      <h4 className="mn-line__name mn-name display">
        <NameLink row={row} />
      </h4>
      <p className="mn-line__price mono">
        <Price item={item} cities={cities} />
      </p>
      <Desc item={item} className="mn-line__desc" />
      <Facts item={item} className="mn-line__facts label mono" />
    </li>
  );
}

/** A category's head: its name in the display face's thin voice, on a rule; where it is served, if not everywhere. */
export function CategoryHead({ category, className }: { category: MenuCategory; className?: string }) {
  const only = category.cities?.length === 1 ? category.cities[0] : null;
  return (
    <header className={cn("mn-cat__head", className)}>
      <h3 id={`${category.id}-title`} className="mn-cat__title">
        {name(category.title)}
      </h3>
      {only && <p className="mn-cat__only label">{typograf(t.menu.only[only])}</p>}
    </header>
  );
}

/** A chapter's heading: its name (not shown) and the waiter's question, then the lead. */
export function ChapterHead({ id, q, a, children, className }: { id: string; q: string; a: string; children?: React.ReactNode; className?: string }) {
  return (
    <header className={cn("section-head mn-ch__head", className)} data-mn-head>
      <DialogueHeading id={`${id}-title`} q={q} a={typograf(a)} />
      {children}
    </header>
  );
}
