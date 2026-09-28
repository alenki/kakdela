import type { City, MenuChapter } from "@/content/types";
import { cafesByCity } from "@/content/cafes";
import { chapterCount, fullMenu, kitchenCafes } from "@/content/full-menu";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";

const CITIES: City[] = ["nalchik", "vladikavkaz"];

/** «26 блюд · в 3 из 7 кофеен», «46 напитков · во всех кофейнях»: counted from the data, per city. */
function countLine(chapter: MenuChapter, city: City) {
  const n = chapterCount(chapter, city);
  const where =
    chapter.servedAt === "full-kitchen"
      ? t.menu.kitchenShare(kitchenCafes[city].length, cafesByCity(city).length)
      : t.menu.everywhere;
  return typograf(`${t.menu.count[chapter.id](n)} · ${where}`);
}

/**
 * «Содержание»: the three chapters of the café day with what each holds in the guest's city, and every
 * category one tap away. Plain in-page links (no leaders: these are not price rows).
 */
export function MenuContents() {
  return (
    <nav className="mn-toc" aria-labelledby="mn-toc-title">
      <p id="mn-toc-title" className="label mn-toc__title">
        {t.menu.contents}
      </p>
      <ol className="mn-toc__list" role="list">
        {fullMenu.map((ch) => {
          const lines = CITIES.map((c) => countLine(ch, c));
          return (
            <li key={ch.id} className="mn-toc__ch">
              <a className="mn-toc__link" href={`#${ch.id}`}>
                {typograf(ch.title)}
              </a>
              <p className="mn-toc__count label mono">
                {lines[0] === lines[1]
                  ? lines[0]
                  : CITIES.map((c, i) => (
                      <span key={c} data-city-only={c}>
                        {lines[i]}
                      </span>
                    ))}
              </p>
              <p className="dlinks mn-toc__cats">
                {ch.categories.map((cat) => (
                  <a
                    key={cat.id}
                    className="dlink"
                    href={`#${cat.id}`}
                    data-city-only={cat.cities?.length === 1 ? cat.cities[0] : undefined}
                  >
                    {typograf(cat.title)}
                  </a>
                ))}
              </p>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
