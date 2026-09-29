import { cafes } from "@/content/cafes";
import { chapterById } from "@/content/full-menu";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { CITIES, rowsOf, servedAt, street } from "./model";
import { CategoryHead, ChapterHead, DishRow } from "./Rows";

/**
 * «Кухня» / «С чего начнём?»: the morning chapter, beside the table (MenuTable) from 1024px. Its lead says how many
 * of the city's cafés cook it and which, counted from cafes.ts; then the categories, breakfast first, each a list
 * of rows set as the homepage's breakfasts are.
 */
export function KitchenChapter() {
  const ch = chapterById.kuhnya;
  const copy = t.menu.chapters.kuhnya;
  return (
    <section id={ch.id} className="mn-ch mn-kitchen" aria-labelledby={`${ch.id}-title`}>
      <ChapterHead id={ch.id} q={copy.q} a={copy.a}>
        <div className="mn-ch__lead">
          {CITIES.map((c) => {
            const kitchens = servedAt(ch, c);
            return (
              <div key={c} data-city-only={c}>
                <p className="lead">{typograf(copy.lead(kitchens.length, cafes.filter((x) => x.city === c).length, c))}</p>
                <p className="label mn-ch__where">{typograf(kitchens.map((k) => street(k.address)).join(" · "))}</p>
              </div>
            );
          })}
        </div>
      </ChapterHead>
      {ch.categories.map((cat) => (
        <section key={cat.id} id={cat.id} className="mn-cat" aria-labelledby={`${cat.id}-title`}>
          <CategoryHead category={cat} />
          <ul className="mn-rows" role="list">
            {rowsOf(ch, cat).map((row) => (
              <DishRow key={row.item.id} row={row} />
            ))}
          </ul>
        </section>
      ))}
    </section>
  );
}
