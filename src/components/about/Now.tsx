import type { CSSProperties } from "react";
import { DialogueHeading } from "@/components/type/DialogueHeading";
import { NOW_SCRIPT } from "@/lib/about-script";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { InlineScript } from "./InlineScript";
import { NowClock } from "./now/NowClock";

/** 7.5 → «07:30», 24 → «24:00». */
const clock = (h: number) => `${String(Math.floor(h)).padStart(2, "0")}:${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;

const HOURS = Array.from({ length: 25 }, (_, h) => h);
const parts = t.dayparts;
/** The cafés are closed through the first part of the day (t.dayparts starts with «Мы спим.»). */
const OPEN_FROM = parts[1].from;

/**
 * «А прямо сейчас?»: the café answers with the part of the day it is in Moscow, in its own words
 * (t.dayparts): «Самое время для второго кофе.», «Мы спим. Откроемся в 07:30.». All six are
 * server-rendered and about.css shows the one html[data-daypart] names; NOW_SCRIPT sets it before first
 * paint and NowClock keeps it in step with the page's minute clock. Without JS: «Каждый день с 07:30.».
 * Under it the day as a printed timetable: a ruler from midnight to midnight, the closed hours hatched,
 * the red hand at this minute (its «сейчас 14:32» is drawn by CSS counters, so it too is right at first
 * paint), then the six parts in words, this one in ink.
 */
export function Now() {
  return (
    <section id="seychas" className="field section-pad ab-now" data-theme="cream" aria-labelledby="seychas-title">
      <InlineScript code={NOW_SCRIPT} />
      <div className="wrap">
        <header className="section-head" data-ab-rise>
          <DialogueHeading id="seychas-title" q={t.about.now.ask} ask={typograf(t.about.now.ask)}>
            <span className="dlg-title display ab-now__title">
              {parts.map((p, i) => (
                <span key={p.from} className="ab-now__say" data-dp={i}>
                  {typograf(p.text)}.
                </span>
              ))}
              <span className="ab-now__say ab-now__say--still">{typograf(t.about.now.fallback)}.</span>
            </span>
          </DialogueHeading>
          <p className="lead">{typograf(t.about.now.lead)}</p>
        </header>

        {/* Decorative: the words under it say the same. */}
        <div className="ab-ruler" aria-hidden="true" data-ab-rise>
          <div className="ab-ruler__band">
            <span className="ab-ruler__closed" style={{ "--from": 0, "--to": OPEN_FROM } as CSSProperties} />
            {parts.map((p, i) => (
              <span key={p.from} className="ab-ruler__part" data-dp={i} style={{ "--from": p.from, "--to": p.to } as CSSProperties} />
            ))}
            {HOURS.map((h) => (
              <span key={h} className="ab-ruler__tick" data-major={h % 3 === 0 ? "" : undefined} style={{ "--at": h } as CSSProperties} />
            ))}
            <span className="ab-ruler__now" data-label={t.about.now.now} />
          </div>
          <div className="ab-ruler__hours">
            {HOURS.filter((h) => h % 3 === 0).map((h) => (
              <span key={h} className="ab-ruler__hour mono" style={{ "--at": h } as CSSProperties}>
                {String(h).padStart(2, "0")}
              </span>
            ))}
          </div>
        </div>

        <ol className="ab-parts" aria-label={t.about.now.ruler} data-ab-rise>
          {parts.map((p, i) => (
            <li key={p.from} className="ab-part" data-dp={i}>
              <span className="ab-part__time mono">
                {clock(p.from)}–{clock(p.to)}
              </span>
              <span className="ab-part__text">{typograf(p.text)}</span>
            </li>
          ))}
        </ol>
      </div>
      <NowClock />
    </section>
  );
}
