import type { CSSProperties } from "react";
import { HANG_SCRIPT } from "@/lib/about-script";
import { CAP, letterAsk } from "@/lib/lettering";
import { GLYPH, arrivalCss, signVars } from "@/lib/sign";
import { bindLastWord, typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { InlineScript } from "./InlineScript";
import { HangingSign } from "./opening/HangingSign";

/** The founding line, as on the homepage's team heading (typograf keeps «как дела?» on one line). */
const founding = bindLastWord(typograf(t.team.lead));

/** The ask in the logo's lettering, on two lines: «А у вас» over «как дела», whose «?» is the logo's own. */
const ask = letterAsk(t.about.ask);

/** The answer, broken at its last space: «Спасибо, что» over «спросили.». */
const cut = t.about.a.lastIndexOf(" ");
const lines = [typograf(t.about.a.slice(0, cut)), typograf(t.about.a.slice(cut + 1))];

/** The arrival, simulated once when the page is built (src/lib/sign.ts) and played by the compositor. */
const ARRIVAL_CSS = arrivalCss();

/**
 * The opening exchange. The homepage asks the guest «Как дела?»; here the guest asks back, «А у вас как
 * дела?», in the logo's own lettering (src/lib/lettering.ts), and its «?» is the logo's. Its dot is a nail,
 * and the café's answer hangs from it on the notice's paper, «Спасибо, что спросили.»: everything the café
 * is hangs on that one question. Turned over, the sign is the café's door sign, open or shut right now.
 *
 * On a fresh load at the top the café hangs it (HANG_SCRIPT and the baked arrival): it drops onto the nail,
 * the cord catches and it swings. Then it is a card on a cord (HangingSign): the guest can take it and let it
 * swing or turn it over, and a hard fling of the page makes it hop on its cord. Without JS, with reduced
 * motion, in forced colours and on paper it simply hangs. All the numbers are src/lib/sign.ts, written here
 * as the section's custom properties.
 */
export function Opening() {
  return (
    <section
      id="o-nas"
      className="field ab-sign"
      data-theme="cream"
      aria-labelledby="o-nas-title"
      style={signVars as CSSProperties}
    >
      <style href="ab-sign-arrival" precedence="default">
        {ARRIVAL_CSS}
      </style>
      <div className="ab-sign__frame">
        <div className="wrap ab-sign__stage">
          <h1 id="o-nas-title" className="ab-sign__head">
            <span className="ab-sign__ask">
              {/* Read as words, seen as the lettering; the rig after it is read after its «?». */}
              <span className="sr-only">{typograf(t.about.ask)}</span>
              <span className="ab-sign__words" aria-hidden="true">
                {ask.lines.map((l) => {
                  const w = Math.round(l.w * 10) / 10;
                  return (
                    <svg
                      key={l.text}
                      className="ab-sign__line"
                      viewBox={`0 0 ${w} ${CAP}`}
                      style={{ "--w": (w / CAP).toFixed(4) } as CSSProperties}
                      focusable="false"
                    >
                      <path d={l.d} />
                    </svg>
                  );
                })}
              </span>
              <span className="ab-sign__q">
                <span className="ab-sign__rig">
                  <svg
                    className="ab-sign__glyph"
                    viewBox={`${GLYPH.x} ${GLYPH.y} ${GLYPH.w} ${GLYPH.h}`}
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d={GLYPH.hook} fillRule="evenodd" />
                    <path d={GLYPH.dot} fillRule="evenodd" />
                  </svg>
                  <span className="ab-sign__nail" data-sign-nail>
                    <span className="ab-sign__swing" data-sign-swing>
                      <span className="ab-sign__fall" data-sign-fall>
                        <span className="ab-sign__card" data-sign-card>
                          <span className="ab-sign__turn" data-sign-turn>
                            <span className="ab-sign__face ab-sign__face--front">
                              <span className="ab-sign__answer display">
                                <span>{lines[0]}</span> <span>{lines[1]}</span>
                              </span>
                              <Holes />
                            </span>
                            <span className="ab-sign__face ab-sign__face--back" aria-hidden="true">
                              <span className="ab-sign__state display" data-open>
                                {t.about.sign.open}
                              </span>
                              <span className="ab-sign__note" data-open>
                                {typograf(t.about.sign.openNote)}
                              </span>
                              <span className="ab-sign__state display" data-shut>
                                {t.about.sign.closed}
                              </span>
                              <span className="ab-sign__note" data-shut>
                                {typograf(t.about.sign.closedNote)}
                              </span>
                              <Holes />
                            </span>
                          </span>
                        </span>
                      </span>
                    </span>
                    <span className="ab-sign__cord ab-sign__cord--a" data-sign-cord aria-hidden="true" />
                    <span className="ab-sign__cord ab-sign__cord--b" data-sign-cord aria-hidden="true" />
                  </span>
                </span>
              </span>
            </span>
          </h1>
          <div className="ab-sign__story">
            <p className="ab-sign__founding reply">{founding}</p>
          </div>
        </div>
      </div>
      <InlineScript code={HANG_SCRIPT} />
      <HangingSign />
    </section>
  );
}

/** The two punched holes the cord runs through. */
function Holes() {
  return (
    <>
      <span className="ab-sign__hole ab-sign__hole--a" aria-hidden="true" />
      <span className="ab-sign__hole ab-sign__hole--b" aria-hidden="true" />
    </>
  );
}
