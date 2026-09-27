import type { MenuCategory } from "@/content/types";
import { citiesOf } from "@/content/full-menu";
import { cn } from "@/lib/format";
import { typograf } from "@/lib/typograf";
import { CardRow } from "./MenuRows";

/** A category served in one city only is rendered for that city only. */
const cityOnly = (c: MenuCategory) => (c.cities?.length === 1 ? c.cities[0] : undefined);

/**
 * «The card»: the rest of a chapter set like the back of a printed menu, in newspaper columns (one on
 * phones, two on tablets, the thirds from 1024, the quarters from 1920). A category may run on into the
 * next column, as in print; a row never splits, and a title never ends a column.
 */
export function MenuCard({ categories, thumbs }: { categories: MenuCategory[]; thumbs?: boolean }) {
  return (
    <div className={cn("mn-card", thumbs && "mn-card--thumbs")}>
      {categories.map((c) => (
        <div key={c.id} id={c.id} className="mn-card__cat mn-cat" data-city-only={cityOnly(c)}>
          <h3 id={`${c.id}-title`} className="mn-cat__title display item-title" data-mn-unit>
            {typograf(c.title)}
          </h3>
          <ul className="mn-cat__list" role="list" aria-labelledby={`${c.id}-title`}>
            {c.items.map((item) => (
              <CardRow key={item.id} item={item} cities={citiesOf(item, c)} thumb={thumbs ? "card" : undefined} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/**
 * «The vitrine»: a dessert category laid out like a counter, a thumbnail beside every row, on the same
 * thirds as the three signature desserts above it.
 */
export function Vitrine({ category }: { category: MenuCategory }) {
  return (
    <div id={category.id} className="mn-vit mn-cat" data-city-only={cityOnly(category)}>
      <h3 id={`${category.id}-title`} className="mn-cat__title display item-title" data-mn-rise>
        {typograf(category.title)}
      </h3>
      <ul className="mn-vit__list" role="list" aria-labelledby={`${category.id}-title`}>
        {category.items.map((item) => (
          <CardRow key={item.id} item={item} cities={citiesOf(item, category)} thumb="vitrine" />
        ))}
      </ul>
    </div>
  );
}
