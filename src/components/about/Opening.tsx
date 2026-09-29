import type { CSSProperties } from "react";
import Image from "next/image";
import { answers } from "@/content/answers";
import { doorway } from "@/content/about";
import { DOOR_SCRIPT } from "@/lib/about-script";
import { doorVars } from "@/lib/door";
import { bindLastWord, typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { InlineScript } from "./InlineScript";
import { OpeningDoor } from "./opening/OpeningDoor";

/** The founding line, as on the homepage's team heading (typograf keeps «как дела?» on one line). */
const founding = bindLastWord(typograf(t.team.lead));

/** The answer, cut at its last space: «Спасибо, что» stays on the wall, «спросили.» goes on the door. */
const cut = t.about.a.lastIndexOf(" ");
const wall = typograf(t.about.a.slice(0, cut));
const word = typograf(t.about.a.slice(cut + 1));

/** Every answer the guest may have torn today, for about.css to put before the line («Сонно.»). Attributes,
 *  not hidden spans, so the heading's text is only what it says. */
const said = Object.fromEntries(answers.map((a) => [`data-said-${a.id}`, `${a.label}.`]));

const room = doorway.photo;

/**
 * The opening exchange. The homepage asks the guest «Как дела?»; here the guest asks back, «А у вас как
 * дела?», in the thin display voice, and the café answers in heavy caps: «Спасибо, что спросили.». Its last
 * word is a door. «Спасибо, что» is set on the wall; «спросили.» is lettered on a flush leaf of the same
 * cream, hung like the kitchen door at Лермонтова, 59, and it stands ajar: through the crack the café's
 * kitchen door asks «Как дела на кухне?». Question, answer, question, in one still frame.
 *
 * Scrolled (full motion, OpeningDoor), the door swings into the room and the photo in the doorway pulls
 * back from the kitchen door to the whole room, until the sign over the bar, «Как дела?», stands on the
 * guest's own line. The type never moves. On a fresh load at the top the door is shut at first paint and
 * comes ajar once the guest has asked (DOOR_SCRIPT, about.css). Without JS or with reduced motion it is
 * simply ajar. A guest who tore a tab today opens the line with it, in red, at the weight of its mood.
 * All the numbers are src/lib/door.ts, written here as the section's custom properties.
 */
export function Opening() {
  return (
    <section
      id="o-nas"
      className="field ab-open"
      data-theme="cream"
      aria-labelledby="o-nas-title"
      style={doorVars as CSSProperties}
    >
      <div className="ab-open__drive" data-open-drive>
        <div className="wrap ab-open__stage" data-open-stage>
          <h1 id="o-nas-title" className="dlg ab-open__head">
            <span className="dlg-ask ab-open__ask" data-open-ask {...said}>
              {typograf(t.about.ask)}
            </span>{" "}
            <span className="dlg-title display ab-open__title">
              <span className="ab-open__wall">{wall}</span>{" "}
              <span className="ab-open__door">
                {/* The doorway: it clips, and it gives the leaf (its direct child) its perspective. */}
                <span className="ab-open__frame" data-open-frame>
                  <span className="ab-open__room" aria-hidden="true">
                    <span className="ab-open__pan" data-open-pan>
                      <Image src={room.src} alt="" fill sizes="1333px" placeholder="blur" preload className="ab-open__img" />
                    </span>
                  </span>
                  <span className="ab-open__leaf" data-open-leaf>
                    <span className="ab-open__word" data-open-word>
                      {word}
                    </span>
                    <span className="ab-open__lever" data-open-lever aria-hidden="true" />
                    <span className="ab-open__shade" data-open-shade aria-hidden="true" />
                  </span>
                </span>
              </span>
            </span>
          </h1>
          <p className="sr-only">{room.alt}</p>
          <div className="ab-open__story">
            <p className="ab-open__founding reply">{founding}</p>
          </div>
        </div>
        <div className="ab-open__travel" aria-hidden="true" />
      </div>
      <InlineScript code={DOOR_SCRIPT} />
      <OpeningDoor />
    </section>
  );
}
