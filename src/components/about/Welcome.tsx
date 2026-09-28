import type { CSSProperties } from "react";
import { house, welcomeQuote } from "@/content/about";
import { cafes } from "@/content/cafes";
import { RouteLink } from "@/components/chrome/RouteLink";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { tornSheet } from "@/lib/tear";
import { bindLastWord, keepWhole, quote, typograf } from "@/lib/typograf";
import { t } from "@/i18n";

const note = tornSheet(welcomeQuote.id);
const noteStyle = { "--rip": note.clip, "--fibres": note.fibres, "--lean": `${note.lean}deg` } as CSSProperties;
const where = cafes.find((c) => c.id === welcomeQuote.cafeId);

/**
 * «Кому у вас рады?» / «Всем, кто зайдёт.»: the page turns to evening (ink). A guest's own words about
 * the door, on a note of the notice's paper torn off a pad (the reviews' paper, tornSheet), the section's
 * one italic moment; beside it what the cafés have, set as a timetable between hairlines, every line
 * taken from the cafés' own data (src/content/about.ts). Then the way to work here.
 */
export function Welcome() {
  return (
    <section id="rady" className="field section-pad ab-welcome" data-theme="ink" aria-labelledby="rady-title">
      <div className="wrap">
        <header className="section-head" data-ab-rise>
          <DialogueHeading id="rady-title" q={t.about.welcome.ask} ask={typograf(t.about.welcome.ask)} a={typograf(t.about.welcome.a)} />
        </header>

        <div className="ab-welcome__grid">
          <figure className="ab-note" style={noteStyle} data-permission={welcomeQuote.permission ? undefined : "pending"}>
            <div className="ab-note__land" data-ab-note>
              <div className="ab-note__paper">
                <blockquote className="ab-note__sheet" cite={welcomeQuote.sourceUrl}>
                  <p className="ab-note__quote reply">{quote(bindLastWord(keepWhole(typograf(welcomeQuote.text))))}</p>
                </blockquote>
              </div>
            </div>
            {where && (
              <figcaption className="ab-note__who label">
                <a className="dlink" href={welcomeQuote.sourceUrl} target="_blank" rel="noreferrer">
                  {typograf(t.about.welcome.said(where.address))}
                  <span className="dlink__ext" aria-hidden="true">
                    ↗
                  </span>
                  <span className="sr-only"> {t.a11y.newTab}</span>
                </a>
              </figcaption>
            )}
          </figure>

          <div className="ab-house" data-ab-rise>
            <p className="ab-house__label label" id="rady-list">
              {t.about.welcome.listLabel}
            </p>
            <ul className="ab-house__list" role="list" aria-labelledby="rady-list">
              {house.map((row) => (
                <li key={row.name} className="ab-house__row">
                  <span className="ab-house__name display">{typograf(row.name)}</span>
                  <span className="ab-house__where">{typograf(row.where)}</span>
                </li>
              ))}
            </ul>
            <p className="ab-house__careers">
              <span className="ab-house__ask">{typograf(t.about.welcome.careers)}</span>{" "}
              <RouteLink to="careers" className="dlink">
                {t.about.welcome.careersLink}
              </RouteLink>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
