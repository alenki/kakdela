import { desserts, cherryPie } from "@/content/menu";
import { chessEvent } from "@/content/people";
import { external } from "@/content/routes";
import type { Price } from "@/content/types";
import { OctPhoto } from "@/components/brand/OctPhoto";
import { RouteLink } from "@/components/chrome/RouteLink";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { rub } from "@/lib/format";
import { keepLastSentence, NBSP, typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { Board, KnightMark } from "./evening/Board";
import { LaceSeam } from "./evening/LaceSeam";
import { RailCounter } from "./evening/RailCounter";
import { EveningMotion } from "./evening/EveningMotion";
import { ChessReplay } from "./evening/ChessReplay";

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * Russian typesetting for this section's copy: a line never starts with a dash, «5 000 ₽» never
 * splits, one-letter words and «пр.»/«ул.» stay with the word after them. Level 1 keeps the
 * section's breaks as they were; the default level would also hold «на», «до», «во» (see typograf).
 */
const typo = (s: string) => typograf(s, 1);
const kicker = t.dayparts.find((d) => d.from === 20)?.text ?? "";

/** One price when both cities agree, otherwise both, and CSS shows the guest's city. */
function CityPrice({ price }: { price: Price }) {
  const label = (v: number | null) => (v == null ? t.hero.askLater : rub(v));
  if (price.nalchik === price.vladikavkaz) return <>{label(price.nalchik)}</>;
  return (
    <>
      <span data-city-only="nalchik">{label(price.nalchik)}</span>
      <span data-city-only="vladikavkaz">{label(price.vladikavkaz)}</span>
    </>
  );
}

/** «— Отлично. А у вас?» → tomato-slot dash + the words. */
function DialogueLine({ text }: { text: string }) {
  const body = typo(text.replace(/^—\s*/, ""));
  return (
    <>
      <span className="dash">—</span> {body}
    </>
  );
}

export function EveningSection() {
  return (
    <section id="vecher" className="field section-pad evening" data-theme="oxblood" aria-label={t.evening.label}>
      <LaceSeam className="ev-seam" />

      <div className="wrap">
        {/* ───────── A · desserts ───────── */}
        <div className="ev-desserts">
          <header className="ev-desserts__head">
            <p className="label ev-kicker">{kicker}</p>
            <DialogueHeading
              id="vecher-desserts"
              q={t.evening.dessertsQ}
              a={typo(t.evening.dessertsA)}
              className="ev-dlg"
              answerClassName="ev-desserts__a"
            />
            <p className="reply ev-reply" data-ev-reveal>
              {typo(t.evening.dessertsReply)}
            </p>
          </header>

          <div className="ev-rail-wrap">
            <ol className="ev-rail hide-scrollbar" data-rail aria-label={t.evening.railLabel} tabIndex={0}>
              {desserts.map((d, i) => (
                <li key={d.id} className="ev-dessert" data-dessert={i}>
                  <div className="ev-dessert__media">
                    {/* The image is the octagon inside the doily (78% of the card): 4 of 12 full-bleed
                        columns ≈ 30vw on desktop, a 380px rail card from 500px, a 76vw card below. */}
                    <OctPhoto photo={d.photo} lace sizes="(min-width: 1024px) 24vw, (min-width: 500px) 300px, 60vw" className="ev-dessert__photo" />
                    {d.tag && <span className="ev-chip">{d.tag}</span>}
                  </div>
                  <div className="ev-dessert__text">
                    <div className="ev-dessert__row">
                      <h3 className="ev-dessert__name reply">{d.name}</h3>
                      <span className="leader" aria-hidden="true" />
                      <span className="ev-dessert__price mono">
                        <CityPrice price={d.price} />
                      </span>
                    </div>
                    <p className="ev-dessert__desc">{typo(d.desc)}</p>
                  </div>
                </li>
              ))}
            </ol>
            <RailCounter total={desserts.length} totalLabel={pad2(desserts.length)} />
          </div>

          <div className="ev-desserts__foot" data-ev-reveal>
            {/* A receipt leader where the line fits; on phones it wraps as plain dialogue: «… мороженого — 350 ₽». */}
            <p className="ev-pie mono">
              <span className="ev-pie__name">{typo(cherryPie.name)}</span>
              <span className="leader" aria-hidden="true" />
              <span className="ev-pie__dash">
                {NBSP}—{NBSP}
              </span>
              <span className="ev-pie__price">
                <CityPrice price={cherryPie.price} />
              </span>
            </p>
            <RouteLink to="menu" className="dlink ev-link">
              <span className="dash">—</span>
              {t.evening.allDesserts}
            </RouteLink>
          </div>
        </div>

        {/* ───────── B · chess ───────── */}
        <div className="ev-chess" data-chess>
          <div className="ev-chess__head">
            <DialogueHeading
              id="vecher-chess"
              q={t.evening.chessQ}
              a={keepLastSentence(typo(t.evening.chessA))}
              className="ev-dlg"
              answerClassName="ev-chess__a"
            />
          </div>

          <ol className="ev-notation" aria-label={t.evening.notationLabel}>
            {t.evening.notation.map((n, i) => (
              <li key={n.move} className="ev-note" data-row={i} data-side={i % 2 === 0 ? "w" : "b"}>
                <span className="ev-note__move mono">{n.move}</span>
                <span className="ev-note__line mono">
                  <span className="ev-note__text">
                    <DialogueLine text={n.line} />
                    <span className="ev-note__ul" data-ul={i} aria-hidden="true" />
                  </span>
                </span>
              </li>
            ))}
          </ol>

          <div className="ev-chess__board">
            <Board
              label={t.evening.boardLabel}
              caption={
                <>
                  {t.evening.boardCaption.before} <span className="ev-board__move">{t.evening.boardCaption.move}</span> ·{" "}
                  {t.evening.boardCaption.after}
                </>
              }
            />
          </div>

          <article className="ev-event" aria-labelledby="ev-event-title" data-ev-card>
            <div className="ev-event__top">
              <p className="label">
                {t.city.nalchik} · {typo(chessEvent.where)}
              </p>
              <KnightMark className="ev-event__mark" />
            </div>
            <h3 id="ev-event-title" className="ev-event__title a-voice">
              {chessEvent.title}
            </h3>
            <p className="ev-event__body">{typo(chessEvent.body)}</p>
            <div className="ev-event__foot">
              <p className="ev-event__when mono">{chessEvent.when}</p>
              <a className="btn btn-primary ev-event__cta" href={external.telegram} target="_blank" rel="noreferrer">
                {t.evening.vote}
                <span className="sr-only"> {t.a11y.newTab}</span>
              </a>
            </div>
          </article>

          <p className="ev-kids mono" data-ev-reveal>
            <span className="dash" aria-hidden="true">
              —
            </span>
            <span>{typo(t.evening.kids)}</span>
          </p>
        </div>
      </div>

      <EveningMotion />
      <ChessReplay />
    </section>
  );
}
