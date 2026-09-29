import { chapterById } from "@/content/full-menu";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { rowsOf } from "./model";
import { BoardLine, CategoryHead, ChapterHead, DishCard } from "./Rows";

/** A vitrine card: three across from 1024px (four columns each), two on a tablet; a phone sets it as a row, its photo
 *  the rows' thumbnail (menu.css --mn-thumb). */
const CARD = "(min-width: 1024px) 31vw, (min-width: 640px) 46vw, (min-width: 470px) 112px, 24vw";

/**
 * «Десерты» / «К кофе что-нибудь?»: the night chapter, on ink, as the homepage's evening is. A vitrine: shelves of
 * three, every dessert on its plate at the same spot of its frame, the names, prices and descriptions level
 * across each shelf. A dessert without a photo is set in type under its shelf, as the bar's board is (no paper
 * placards on the night's ink). The chapter's foot says the menu changes.
 */
export function DessertsChapter() {
  const ch = chapterById.deserty;
  const copy = t.menu.chapters.deserty;
  const n = ch.categories.reduce((sum, c) => sum + c.items.length, 0);
  return (
    <section id={ch.id} className="field section-pad mn-ch mn-desserts" data-theme="ink" aria-label={copy.q}>
      <div className="wrap">
        <ChapterHead id={ch.id} q={copy.q} a={copy.a}>
          <p className="lead">{typograf(copy.lead(n))}</p>
        </ChapterHead>
        {ch.categories.map((cat) => {
          const rows = rowsOf(ch, cat);
          // The vitrine shows what can be shown; a dessert without a photo is set in type under the shelf.
          const shown = rows.filter((r) => r.item.photo);
          const told = rows.filter((r) => !r.item.photo);
          return (
            <section key={cat.id} id={cat.id} className="mn-cat mn-shelf" aria-labelledby={`${cat.id}-title`}>
              <CategoryHead category={cat} />
              <ul className="mn-cards mn-cards--vitrine" role="list">
                {shown.map((row) => (
                  <DishCard key={row.item.id} row={row} sizes={CARD} />
                ))}
              </ul>
              {told.length > 0 && (
                <ul className="mn-lines mn-shelf__told" role="list">
                  {told.map((row) => (
                    <BoardLine key={row.item.id} row={row} />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
        <p className="label mn-note" data-mn-rise>
          {typograf(t.menu.note)}
        </p>
      </div>
    </section>
  );
}
