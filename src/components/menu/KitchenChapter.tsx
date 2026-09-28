import type { City } from "@/content/types";
import { cafesByCity } from "@/content/cafes";
import { chapterById, citiesOf, kitchenCafes } from "@/content/full-menu";
import { Photo } from "@/components/brand/Photo";
import { CafeStatus } from "@/components/chrome/CafeStatus";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { ChapterHead } from "./ChapterHead";
import { MenuCard } from "./MenuCard";
import { CardRow, SignatureRow } from "./MenuRows";
import { dishName } from "./ItemText";
import { KitchenPreview } from "./islands/KitchenPreview";

const CITIES: City[] = ["nalchik", "vladikavkaz"];

/**
 * «Кухня» / «С чего начнём?». The six breakfasts named as answers are set as the homepage sets them, beside
 * a sticky photo of the dish being read (from 1024px); the other breakfasts follow as secondary rows, then
 * the rest of the kitchen as the card. Under the heading, where the full kitchen is and whether it is open.
 */
export function KitchenChapter() {
  const chapter = chapterById.kuhnya;
  const [lead, ...rest] = chapter.categories;
  const signature = lead.items.filter((i) => i.signature);
  const more = lead.items.filter((i) => !i.signature);
  const copy = t.menu.chapters.kuhnya;

  return (
    <section id="kuhnya" className="field section-pad mn-ch mn-ch--kitchen" data-theme="cream" aria-labelledby="kuhnya-title">
      <div className="wrap">
        <ChapterHead id="kuhnya" q={copy.q} a={copy.a}>
          {CITIES.map((c) => (
            <span key={c} data-city-only={c}>
              {typograf(copy.lead(kitchenCafes[c].length, cafesByCity(c).length, t.menu.cityGen[c]))}
            </span>
          ))}
        </ChapterHead>

        {/* Where the kitchen is, and whether it is open now: the question of a guest at 8:10. */}
        <div className="mn-kitchen" data-mn-rise>
          <p id="mn-kitchen-label" className="label mn-kitchen__label">
            {t.menu.fullKitchen}
          </p>
          <ul className="mn-kitchen__list" role="list" aria-labelledby="mn-kitchen-label">
            {CITIES.flatMap((c) =>
              kitchenCafes[c].map((cafe) => (
                <li key={cafe.id} className="mn-kitchen__cafe" data-city-only={c}>
                  <span className="mn-kitchen__addr">{typograf(cafe.address)}</span>
                  <CafeStatus cafe={cafe} />
                </li>
              )),
            )}
          </ul>
        </div>

        <div id={lead.id} className="mn-sig mn-sig--kitchen">
          <div className="mn-sig__main">
            <h3 id={`${lead.id}-title`} className="label mn-sig__label" data-mn-rise>
              {typograf(lead.title)}
            </h3>
            <ol className="mn-sig__list" role="list" aria-labelledby={`${lead.id}-title`} data-mn-list>
              {signature.map((item) => (
                <SignatureRow key={item.id} item={item} thumb preview />
              ))}
            </ol>

            {more.length > 0 && (
              <div className="mn-more" data-mn-rise>
                <h3 id="mn-more-title" className="label mn-more__title">
                  {t.breakfasts.extras}
                </h3>
                <ul className="mn-more__list" role="list" aria-labelledby="mn-more-title">
                  {more.map((item) => (
                    <CardRow key={item.id} item={item} cities={citiesOf(item, lead)} />
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ≥1024: a sticky photo of the hovered / focused / read dish (the homepage breakfasts). A decorative
              duplicate of the list, so it stays out of the accessibility tree. */}
          <aside className="mn-preview" aria-hidden="true" data-mn-preview>
            <div className="mn-preview__sticky" data-mn-sticky>
              <div className="mn-stage">
                {signature.map((item, i) =>
                  item.photo ? (
                    <div key={item.id} className="mn-slide" data-mn-key={item.id} data-active={i === 0 ? "" : undefined}>
                      <Photo photo={item.photo} sizes="(min-width: 1024px) 30vw, 1px" loading="lazy" />
                    </div>
                  ) : null,
                )}
              </div>
              <div className="mn-caps">
                {signature.map((item, i) => (
                  <div key={item.id} className="mn-cap" data-mn-key={item.id} data-active={i === 0 ? "" : undefined}>
                    <p className="mn-cap__name">{dishName(item.name)}</p>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <MenuCard categories={rest} thumbs />
      </div>
      <KitchenPreview />
    </section>
  );
}
