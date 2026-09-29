import { chapterById } from "@/content/full-menu";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { rowsOf } from "./model";
import { BoardLine, CategoryHead, ChapterHead, DishCard } from "./Rows";

/** A house drink's card: six across from 1024px, three on a tablet, two on a phone. */
const CARD = "(min-width: 1024px) 15vw, (min-width: 640px) 30vw, 45vw";

/**
 * «Бар» / «Что будете пить?», in every café. The house drinks first, as cards with their photos (a drink without
 * one is served as its name); then the rest of the bar as a board of type, the way a café prints it over the
 * counter: the categories flow down three columns on a desktop, two on a tablet, one on a phone.
 */
export function BarChapter() {
  const ch = chapterById.bar;
  const copy = t.menu.chapters.bar;
  const [house, ...rest] = ch.categories;
  return (
    <section id={ch.id} className="field section-pad mn-ch mn-bar" data-theme="cream" aria-labelledby={`${ch.id}-title`}>
      <div className="wrap">
        <ChapterHead id={ch.id} q={copy.q} a={copy.a}>
          <p className="lead">{typograf(copy.lead)}</p>
        </ChapterHead>
        <section id={house.id} className="mn-cat mn-house" aria-labelledby={`${house.id}-title`}>
          <CategoryHead category={house} />
          <ul className="mn-cards mn-cards--house" role="list">
            {rowsOf(ch, house).map((row) => (
              <DishCard key={row.item.id} row={row} sizes={CARD} />
            ))}
          </ul>
        </section>
        <div className="mn-board">
          {rest.map((cat) => (
            <section key={cat.id} id={cat.id} className="mn-cat mn-board__cat" aria-labelledby={`${cat.id}-title`}>
              <CategoryHead category={cat} />
              <ul className="mn-lines" role="list">
                {rowsOf(ch, cat).map((row) => (
                  <BoardLine key={row.item.id} row={row} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
