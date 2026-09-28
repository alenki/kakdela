import type { CSSProperties, ReactNode } from "react";
import { RouteLink } from "@/components/chrome/RouteLink";
import type { RouteKey } from "@/content/routes";
import { blankCaption, EDITION, EDITION_LABEL, operator, type Block, type Clause, type OperatorField } from "@/content/privacy";
import { tornSheet } from "@/lib/tear";
import { bindLastWord, NBSP, typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { TocSpy } from "./TocSpy";

const TOKEN = /\{(\w+)\}/gu;

/**
 * Legal text on top of typograf(): a reference never leaves its number («статьи 18.1», «части 5»,
 * «№ 152-ФЗ») and a number never leaves the word it counts («24 часов», «10 рабочих дней», «14 лет»).
 */
const legal = (s: string) =>
  typograf(s)
    .replace(/(?<=(?:^|[\s(])(?:стать[яиюей]|част[ьиюей]|пункт[аеу]?|№))\s+(?=\d)/giu, NBSP)
    .replace(/(?<=(?:^|[\s(])\d+(?:\.\d+)?)\s+(?=[а-яё])/gu, NBSP);
const isField = (k: string): k is OperatorField => Object.hasOwn(operator, k);

/**
 * The operator's details in running text. A detail not known yet is a blank on a form: a line with what
 * goes on it printed under it («ИНН»), heard as «ИНН: будет указано».
 */
function fill(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let at = 0;
  for (const m of text.matchAll(TOKEN)) {
    if (m.index > at) out.push(legal(text.slice(at, m.index)));
    const key = m[1];
    const value = isField(key) ? operator[key] : null;
    out.push(
      value ? (
        legal(value)
      ) : (
        <span
          key={m.index}
          className="pp-blank"
          style={{ "--cap": (isField(key) ? blankCaption[key] : key).length } as CSSProperties}
        >
          <span className="pp-blank__cap" aria-hidden="true">
            {isField(key) ? blankCaption[key] : key}
          </span>
          <span className="sr-only">
            {isField(key) ? blankCaption[key] : key}: {t.privacy.blank}
          </span>
        </span>
      ),
    );
    at = m.index + m[0].length;
  }
  if (at < text.length) out.push(bindLastWord(legal(text.slice(at))));
  return out;
}

/** A hand-drawn tick, as on the note's consent box. */
function Tick() {
  return (
    <svg className="pp-tick" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4.6 12.9c1.6 1.2 3 2.7 4.1 4.6 2.3-4.9 5.6-9 10.2-12.4" />
    </svg>
  );
}

/** One clause's body: paragraphs numbered «3.2.», the lists and tables under them left unnumbered. */
function Body({ n, blocks }: { n: number; blocks: Block[] }) {
  let p = 0;
  return blocks.map((b, i) => {
    if (typeof b === "string") {
      p += 1;
      return (
        <p key={i} className="pp-p">
          <span className="pp-p__n">
            {n}.{p}.
          </span>{" "}
          {fill(b)}
        </p>
      );
    }
    if ("list" in b) {
      return (
        <ul key={i} className="pp-list">
          {b.list.map((item) => (
            <li key={item}>{fill(item)}</li>
          ))}
        </ul>
      );
    }
    return (
      <div key={i} className="pp-table-wrap">
        <table className="pp-table">
          <caption className="sr-only">{b.table.caption}</caption>
          <thead>
            <tr>
              {b.table.head.map((h) => (
                <th key={h} scope="col" className="label">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {b.table.rows.map(([key, what, kept]) => (
              <tr key={key}>
                <th scope="row">
                  <code className="pp-key">{key}</code>
                </th>
                <td>{typograf(what)}</td>
                <td>{typograf(kept)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  });
}

type Props = {
  /** The section's id: the page's one field. */
  id: string;
  label: string;
  title: string;
  lead: string;
  /** «Коротко»: the whole thing in a few plain lines, on a note above the text (the policy only). */
  brief?: string[];
  /** A statement before the numbered clauses (the consent's «Отправляя записку… я даю согласие…»). */
  intro?: string;
  clauses: Clause[];
  /** The other document, linked under the contents. */
  other: { to: RouteKey; label: string };
};

/**
 * A legal document, set like the rest of the site: the heading and lead, then the contents on the left
 * (sticky from 1024, the clause being read marked) and the numbered clauses on the right, their
 * paragraph numbers hanging in the margin. Quiet: no motion but the contents' mark, and it prints clean.
 */
export function LegalDoc({ id, label, title, lead, brief, intro, clauses, other }: Props) {
  const rip = tornSheet(`${id}:brief`);
  return (
    <section id={id} className="field pp" data-theme="cream" aria-labelledby={`${id}-title`}>
      <div className="wrap">
        <header className="section-head">
          <h1 id={`${id}-title`} className="dlg">
            <span className="dlg-label label">{typograf(label)}</span>{" "}
            <span className="dlg-title display">{typograf(title)}</span>
          </h1>
          <p className="lead">{typograf(lead)}</p>
        </header>

        <div className="pp-doc">
          <nav className="pp-toc" aria-labelledby={`${id}-toc`} data-pp-toc>
            <p id={`${id}-toc`} className="pp-toc__label label">
              {t.privacy.contents}
            </p>
            <ol className="pp-toc__list">
              {clauses.map((c, i) => (
                <li key={c.id}>
                  <a href={`#${c.id}`} className="pp-toc__link">
                    <span className="pp-toc__n">{i + 1}</span>
                    <span>{typograf(c.title)}</span>
                  </a>
                </li>
              ))}
            </ol>
            <p className="pp-toc__meta label">
              <time dateTime={EDITION}>{t.privacy.edition(EDITION_LABEL)}</time>
            </p>
            <p className="pp-toc__meta label">
              <RouteLink to={other.to} className="dlink">
                {other.label}
              </RouteLink>
            </p>
          </nav>

          <div className="pp-body">
            {brief && (
              <aside
                className="pp-brief"
                aria-labelledby={`${id}-brief`}
                style={{ "--rip": rip.clip, "--fibres": rip.fibres, "--lean": `${rip.lean}deg` } as CSSProperties}
              >
                <div className="pp-brief__sheet">
                  <h2 id={`${id}-brief`} className="pp-brief__title display">
                    {t.privacy.brief}
                  </h2>
                  <ul className="pp-brief__list">
                    {brief.map((line) => (
                      <li key={line} className="pp-brief__item">
                        <Tick />
                        <span>{fill(line)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </aside>
            )}
            {intro && <p className="pp-intro">{fill(intro)}</p>}
            {clauses.map((c, i) => (
              <section key={c.id} className="pp-clause" aria-labelledby={c.id}>
                <h2 id={c.id} className="pp-clause__title display">
                  <span className="pp-clause__n">{i + 1}.</span> {typograf(c.title)}
                </h2>
                <Body n={i + 1} blocks={c.body} />
              </section>
            ))}
            <p className="pp-edition label">
              <time dateTime={EDITION}>{t.privacy.edition(EDITION_LABEL)}</time>
            </p>
          </div>
        </div>
      </div>
      <TocSpy />
    </section>
  );
}
