import { chapterById } from "@/content/full-menu";
import { photos } from "@/content/photos";
import { Photo } from "@/components/brand/Photo";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { ChapterHead } from "./ChapterHead";
import { MenuCard } from "./MenuCard";
import { SignatureRow } from "./MenuRows";

/**
 * «Бар» / «Как обычно?». The house signatures as the homepage coffee sets them (one drink photo run out to
 * the left edge beside the list), then the whole bar card in newspaper columns, type only.
 */
export function BarChapter() {
  const chapter = chapterById.bar;
  const [lead, ...rest] = chapter.categories;
  const copy = t.menu.chapters.bar;

  return (
    <section id="bar" className="field section-pad mn-ch mn-ch--bar" data-theme="cream" aria-labelledby="bar-title">
      <div className="wrap">
        <ChapterHead id="bar" q={copy.q} a={copy.a}>
          {typograf(copy.lead)}
        </ChapterHead>

        <div id={lead.id} className="mn-sig mn-sig--bar">
          <div className="mn-bar-photo" data-mn-photo>
            {/* The coffee section's frame: 4:5 on a phone, the source's 3:2 from 480, as tall as the list from 1024. */}
            <Photo
              photo={photos.stanciyaMir}
              aspect="4/5"
              sizes="(min-width: 1280px) 58vw, (min-width: 1024px) 49vw, (min-width: 480px) 54vw, 100vw"
              loading="lazy"
            />
          </div>
          <h3 id={`${lead.id}-title`} className="label mn-sig__label" data-mn-rise>
            {typograf(lead.title)}
          </h3>
          <ol className="mn-sig__list" role="list" aria-labelledby={`${lead.id}-title`}>
            {lead.items.map((item) => (
              <SignatureRow key={item.id} item={item} />
            ))}
          </ol>
        </div>

        <MenuCard categories={rest} />
      </div>
    </section>
  );
}
