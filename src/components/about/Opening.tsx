import { Fragment, type CSSProperties } from "react";
import { answers } from "@/content/answers";
import { kitchenDoor } from "@/content/about";
import { focusCrop } from "@/lib/crop";
import { bindLastWord, typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { FramedPhoto } from "./FramedPhoto";

/** The founding line, as on the homepage's team heading (typograf keeps «как дела?» on one line). */
const founding = bindLastWord(typograf(t.team.lead));

/** «Спасибо, что спросили.» breaks after its comma on a phone, and each half rises out of its own slot. */
const lines = t.about.a.split(/(?<=,)\s+/u);

/** Every answer the guest may have torn today, for about.css to put before the line («Сонно.»). Attributes,
 *  not hidden spans, so the heading's text is only what it says. */
const said = Object.fromEntries(answers.map((a) => [`data-said-${a.id}`, `${a.label}.`]));

const door = kitchenDoor.photo;
const doorCrop = focusCrop(door.src.width / door.src.height, kitchenDoor.focus, 4 / 5, kitchenDoor.zoom);

/**
 * The opening exchange. The homepage asks the guest «Как дела?»; here the guest asks back, «А у вас как
 * дела?», in the thin display voice, and after a beat the café answers in heavy caps, gutter to gutter:
 * «Спасибо, что спросили.». A guest who tore a tab today opens with that answer, in red («Сонно. А у вас
 * как дела?»): every answer rides on the line as a data attribute and about.css writes the one
 * html[data-answer] names before it (a tear, never a time-of-day guess), so it is right at first paint. Then the founding line in the
 * café's italic, and the kitchen door at Лермонтова, 59, which asks the kitchen the same question.
 * The exchange lands with CSS keyframes (about.css): it plays at first paint, needs no script, and
 * reduced motion never sees it.
 */
export function Opening() {
  return (
    <section id="o-nas" className="field ab-open" data-theme="cream" aria-labelledby="o-nas-title">
      <div className="wrap ab-open__grid">
        <h1 id="o-nas-title" className="dlg ab-open__head">
          <span className="dlg-label label ab-open__label">{t.about.label}</span>{" "}
          <span className="dlg-ask ab-open__ask" {...said}>
            {typograf(t.about.ask)}
          </span>{" "}
          <span className="dlg-title display ab-open__title">
            {lines.map((l, i) => (
              <Fragment key={l}>
                {i > 0 && " "}
                <span className="ab-open__line" style={{ "--i": i } as CSSProperties}>
                  <span className="ab-open__words">{typograf(l)}</span>
                </span>
              </Fragment>
            ))}
          </span>
        </h1>

        <div className="ab-open__story">
          <p className="ab-open__founding reply">{founding}</p>
          <p className="ab-open__lead">{bindLastWord(typograf(t.about.lead))}</p>
        </div>

        <div className="ab-open__door">
          <FramedPhoto
            photo={door}
            crop={doorCrop}
            aspect="4/5"
            // about.css: three columns of twelve from 1280 (four from 1024), half the canvas on a tablet,
            // two thirds of a phone.
            sizes="(min-width: 1280px) 23vw, (min-width: 1024px) 31vw, (min-width: 640px) 46vw, 66vw"
            loading="eager"
          />
          <p className="ab-open__caption label">{typograf(t.about.door)}</p>
        </div>
      </div>
    </section>
  );
}
