import { PaperFlake } from "@/components/season/PaperFlake";
import type { CSSProperties } from "react";
import { cafes } from "@/content/cafes";
import { fullMenu } from "@/content/full-menu";
import type { City, MenuChapter, Price } from "@/content/types";
import { rub } from "@/lib/format";
import { tornEdge } from "@/lib/tear";
import { keepWhole, typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { answerDishes, CITIES, flipStub, servedAt } from "./model";

/** A tab's price in the city on show. Where the dish has no price there yet the tab is too narrow for «уточняйте в
 *  кофейне»: the slot stays empty and only a screen reader hears it (the dish's row says it to everyone). */
function TabPrice({ price }: { price: Price }) {
  return CITIES.map((c) => {
    const v = price[c];
    return (
      <span key={c} data-city-only={c}>
        {v != null ? rub(v) : <span className="sr-only">{typograf(t.hero.askLater)}</span>}
      </span>
    );
  });
}

/** Where a chapter is served, per city: «в 3 из 7 кофеен» for the kitchen, «во всех кофейнях» for the rest. */
function Where({ chapter }: { chapter: MenuChapter }) {
  if (chapter.servedAt === "every-cafe") return <>{typograf(t.menu.everywhere)}</>;
  return CITIES.map((c: City) => (
    <span key={c} data-city-only={c}>
      {typograf(t.menu.kitchenShare(servedAt(chapter, c).length, cafes.filter((x) => x.city === c).length))}
    </span>
  ));
}

/**
 * «На обороте»: the homepage's notice, turned over. The front asks «Как дела?» and the guest tears off an answer;
 * the back is the café's side of it. Turned top over bottom, its tabs hang along the top, and on the back of each
 * answer is the dish that answer stands for, with its price (behind «Сонно», the espresso tonic). The tab the
 * guest tore off today is missing here too: only its stub is left at the perforation (html[data-said],
 * pick-script.ts), and the dish it stood for lies on the table beside the sheet, under the torn tab's slip.
 * Under the perforation the sheet carries the contents: the three chapters and their categories.
 *
 * It is the page's contents (a nav, the action bar's «Меню» comes back here), and the tabs are plain links to
 * their dishes. Pointing at a tab (or focusing it) serves its dish on the table (TableController), and pointing at a
 * kitchen category serves its first dish.
 */
export function NoticeBack() {
  return (
    <nav id="soderzhanie" className="mn-back" aria-label={t.menu.contents} data-mn-back>
      {/* The New Year season: the snowflake stuck on the front's top corner shows past this side's edge, under
          the paper (season.css). */}
      <PaperFlake spot="noticeLeft" className="xm-flake--behind" />
      {/* The tabs and the perforation are one strip of the paper, as the front's pad is (one shadow). */}
      <div className="mn-back__pad">
      <ul className="mn-tabs" role="list">
        {answerDishes.map(({ answer, item }) => {
          const stub = flipStub(tornEdge(answer.id).stub);
          const price = "sizes" in item.price ? null : item.price;
          return (
            <li key={answer.id} className="mn-tab" data-tab={answer.id} style={{ "--stub": stub } as CSSProperties}>
              <a href={`#${item.id}`} className="mn-tab__paper" data-mn-serve={item.id}>
                {/* The answer this dish stands for is on the front of the tab (and on the table's slip): heard first. */}
                <span className="sr-only">{answer.label}: </span>
                <span className="mn-tab__face">
                  <span className="mn-tab__name display">{keepWhole(typograf(item.name))}</span>
                  {price && (
                    <span className="mn-tab__price mono">
                      <TabPrice price={price} />
                    </span>
                  )}
                </span>
                {/* Read only once the tab is torn (pick-script.ts), in place of the face: «Эспрессо-тоник, оторвано». */}
                <span className="mn-tab__torn sr-only">
                  {keepWhole(typograf(item.name))}, {t.hero.torn}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
      <div className="mn-back__perf" aria-hidden="true" />
      </div>
      <div className="mn-back__sheet">
        {fullMenu.map((ch) => (
          <div key={ch.id} className="mn-toc" data-mn-toc={ch.id}>
            <p className="mn-toc__head">
              <a href={`#${ch.id}`} className="mn-toc__chapter">
                {ch.title}
              </a>
              <span className="mn-toc__where label">
                <Where chapter={ch} />
              </span>
            </p>
            <ul className="mn-toc__cats" role="list">
              {ch.categories.map((c) => (
                <li key={c.id} className="mn-toc__cat" data-only={c.cities?.length === 1 ? c.cities[0] : undefined}>
                  <a
                    href={`#${c.id}`}
                    className="mn-toc__link display"
                    data-mn-serve={ch.servedAt === "full-kitchen" ? c.items.find((i) => i.photo)?.id : undefined}
                  >
                    {keepWhole(typograf(c.title))}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
