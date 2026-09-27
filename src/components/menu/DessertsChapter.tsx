import { chapterById } from "@/content/full-menu";
import { RouteLink } from "@/components/chrome/RouteLink";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { ChapterHead } from "./ChapterHead";
import { Vitrine } from "./MenuCard";
import { ThirdRow } from "./MenuRows";

/**
 * «Десерты» / «К кофе что-нибудь?», on ink: the page goes to night, as the homepage does. The three house
 * desserts in thirds, as the homepage evening sets them, then the rest as the vitrine (a thumbnail beside
 * every row) on the same thirds, and the way home or to a café.
 */
export function DessertsChapter() {
  const chapter = chapterById.deserty;
  const [lead, ...rest] = chapter.categories;
  const count = chapter.categories.reduce((n, c) => n + c.items.length, 0);
  const copy = t.menu.chapters.deserty;

  return (
    <section id="deserty" className="field section-pad mn-ch mn-ch--desserts" data-theme="ink" aria-labelledby="deserty-title">
      <div className="wrap">
        <ChapterHead id="deserty" q={copy.q} a={copy.a}>
          {typograf(copy.lead(count))}
        </ChapterHead>

        <div id={lead.id} className="mn-sig mn-sig--thirds">
          <h3 id={`${lead.id}-title`} className="label mn-sig__label" data-mn-rise>
            {typograf(lead.title)}
          </h3>
          <ul className="mn-thirds" role="list" aria-labelledby={`${lead.id}-title`}>
            {lead.items.map((item) => (
              <ThirdRow key={item.id} item={item} />
            ))}
          </ul>
        </div>

        {rest.map((c) => (
          <Vitrine key={c.id} category={c} />
        ))}

        <div className="mn-foot" data-mn-rise>
          <p className="dlinks">
            <RouteLink to="delivery" className="dlink">
              {typograf(t.breakfasts.links.delivery)}
            </RouteLink>
            <RouteLink to="home" hash="gde" className="dlink">
              {typograf(t.hero.actions.nearest)}
            </RouteLink>
          </p>
          <p className="label mn-note">{typograf(t.menu.note)}</p>
        </div>
      </div>
    </section>
  );
}
