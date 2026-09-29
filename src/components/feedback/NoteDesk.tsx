"use client";

import { startTransition, useActionState, useLayoutEffect, useRef, useState, useSyncExternalStore, type CSSProperties, type FormEvent } from "react";
import type { City } from "@/content/types";
import { cafes, flagship } from "@/content/cafes";
import { cafeReply, noTone, tones } from "@/content/feedback";
import { sendNote } from "@/app/feedback/actions";
import { Wordmark } from "@/components/brand/Wordmark";
import { Photo } from "@/components/brand/Photo";
import { BtnLabel } from "@/components/chrome/BtnLabel";
import { CafeStatus } from "@/components/chrome/CafeStatus";
import { RouteLink } from "@/components/chrome/RouteLink";
import { checkNote, EMPTY_NOTE, hasErrors, IDLE, noteNumber, street, type NoteErrors, type NoteFields, type NoteState } from "@/lib/feedback";
import { tornSheet } from "@/lib/tear";
import { useKd } from "@/lib/store";
import { useMotionMode } from "@/lib/motion";
import { bindLastWord, typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { EN } from "@/i18n/locale";
import { NoteRows, type Edit } from "./NoteRows";
import { bringIntoView, FLIGHT_S, flyNote } from "./flight";

const CITIES: City[] = ["nalchik", "vladikavkaz"];
const byId = (id: string | null) => cafes.find((c) => c.id === id) ?? null;
const subscribeNever = () => () => {};

/** The café's voice: typeset, and never ending on a lone word. */
const say = (s: string) => bindLastWord(typograf(s));

/** A loose note lies askew: the sheet's own lean (tornSheet, ±0.8°), at least 0.9° and at most 2.1°. */
const lean = (l: number) => Math.round((l < 0 ? -1 : 1) * (0.9 + Math.abs(l) * 1.5) * 100) / 100;

/** The errors without `key` (it was put right). */
const without = (errors: NoteErrors, key: keyof NoteErrors): NoteErrors => {
  const next = { ...errors };
  delete next[key];
  return next;
};

/**
 * «Обратная связь»: the café's pad on one side, the café on the other, as the hero's notice and its
 * answer. The guest fills in the note on the pad (circles a tone and a café, writes, signs), and the
 * café's side answers every move: the tone's line in the café's italic, the circled café's photo, its
 * status and phone. Sent, the sheet is torn off the pad (the stub stays under the perforation, a fresh
 * sheet waits under it) and laid on the café's side over the photo, and the café replies.
 *
 * The form is a server action through useActionState, so without JS it still posts and the page comes
 * back with the note and the reply (or the note as it was, with what to put right). With JS the page
 * checks the note first and the flight is flight.ts.
 */
export function NoteDesk() {
  const [state, formAction, pending] = useActionState(sendNote, IDLE);
  const city = useKd((s) => s.city);
  const mode = useMotionMode();
  // After hydration the page checks the note itself; before it (and without JS) the browser does.
  const hydrated = useSyncExternalStore(subscribeNever, () => true, () => false);

  // The fields are the page's; a round trip without JS comes back with them.
  const echo = state.status === "invalid" || state.status === "failed" ? state.fields : null;
  const [fields, setFields] = useState<NoteFields>(echo ?? EMPTY_NOTE);
  const [errors, setErrors] = useState<NoteErrors>(state.status === "invalid" ? state.errors : {});
  // The note the guest has moved on from: the café's side lets it go and listens again.
  const [resumed, setResumed] = useState<string | null>(null);

  // The café answered: a sent note leaves a fresh sheet on the pad; a refused one says what to put right.
  const [seen, setSeen] = useState<NoteState>(state);
  if (state !== seen) {
    setSeen(state);
    if (state.status === "sent") {
      setFields(EMPTY_NOTE);
      setErrors({});
    } else if (state.status === "invalid") setErrors(state.errors);
  }

  const sent = state.status === "sent" && resumed !== state.id ? state : null;
  const torn = state.status === "sent" ? tornSheet(state.id) : null;

  // A café can only be circled in the city on show: switching city lets go of the other city's.
  const [cityWas, setCityWas] = useState(city);
  if (city !== cityWas) {
    setCityWas(city);
    if (byId(fields.cafe)?.city !== city) setFields((f) => ({ ...f, cafe: null }));
  }
  // Whom the café's side shows: the note's café once it has gone, the circled one while writing.
  const cafe = sent ? byId(sent.note.cafe) : byId(fields.cafe);
  const reply = sent ? cafeReply(sent.note, cafe ? street(cafe.address) : null, sent.channel) : "";
  const voice = sent ? "reply" : (fields.tone ?? "none");

  const padRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLFormElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLDivElement>(null);
  const replyRef = useRef<HTMLParagraphElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const contactRef = useRef<HTMLInputElement>(null);
  const firstRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const from = useRef<DOMRect | null>(null);
  // A note that came back with the page (no JS) is already lying there: it never flies.
  const landed = useRef<string | null>(state.status === "sent" ? state.id : null);

  const edit: Edit = (patch) => {
    setFields((f) => ({ ...f, ...patch }));
    if ("text" in patch) setErrors((e) => without(e, "text"));
    if ("contact" in patch) setErrors((e) => without(e, "contact"));
    if ("consent" in patch) setErrors((e) => without(e, "consent"));
    if (state.status === "sent") setResumed(state.id);
  };

  // With JS the page sends the note itself, in a transition: React then leaves the form as it is (a
  // form action would reset it, and a refused note would lose its circles). The fields are the page's,
  // and a sent note clears them above. Without JS the form posts as it stands.
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    const found = checkNote(fields);
    if (hasErrors(found)) {
      setErrors(found);
      // The first thing to put right, in the order of the sheet.
      (found.text ? textRef : found.contact ? contactRef : consentRef).current?.focus();
      return;
    }
    setErrors({});
    from.current = sheetRef.current?.getBoundingClientRect() ?? null;
    const data = new FormData(e.currentTarget);
    startTransition(() => formAction(data));
  };

  /** Phones: the fresh sheet under the stub unfolds again. */
  const resume = () => {
    if (state.status === "sent") setResumed(state.id);
    requestAnimationFrame(() => firstRef.current?.focus());
  };

  // The sheet is torn off and laid on the café's side, and the café's reply rises once it lands. Focus
  // goes to the reply at once, so a screen reader hears it while the paper is still in the air.
  useLayoutEffect(() => {
    if (state.status !== "sent" || landed.current === state.id) return;
    landed.current = state.id;
    const note = noteRef.current;
    const stage = stageRef.current;
    const start = from.current;
    from.current = null;
    const fly = !!note && !!start && mode === "full" && document.documentElement.dataset.motion !== "reduced";
    // Before anything reads the layout: the reply's rise starts at the first style pass, and must wait.
    if (fly) {
      note.setAttribute("data-flying", "");
      stage?.style.setProperty("--fb-in", `${FLIGHT_S}s`);
    }
    replyRef.current?.focus({ preventScroll: true });
    if (!note) return;
    if (!fly || !start) {
      bringIntoView(note, replyRef.current, false);
      return;
    }
    bringIntoView(note, replyRef.current, true);
    return flyNote({
      from: start,
      note,
      pad: padRef.current,
      onLand: () => {
        note.removeAttribute("data-flying");
        stage?.style.removeProperty("--fb-in");
      },
    });
  }, [state, mode]);

  return (
    <div className="fb-desk" data-sent={sent ? "" : undefined}>
      {/* The pad: the letterhead asks «Как дела?», the sheet under the perforation answers. */}
      <div className="fb-pad" ref={padRef}>
        <div className="fb-pad__head">
          <Wordmark variant="plain" className="fb-pad__logo" cloverClassName="fb-pad__clover" />
        </div>
        <div className="fb-pad__perf" aria-hidden="true" />
        <div className="fb-pad__body">
          <form
            ref={sheetRef}
            className="fb-sheet"
            action={formAction}
            onSubmit={onSubmit}
            noValidate={hydrated}
            aria-label={t.feedback.pad}
            aria-busy={pending || undefined}
            data-tearing={pending ? "" : undefined}
          >
            <NoteRows fields={fields} form={{ errors, edit }} refs={{ first: firstRef, text: textRef, contact: contactRef }} />
            {/* For robots only: a person never sees it, a robot fills it in and is thanked and dropped. */}
            <div className="fb-hp" aria-hidden="true">
              <label>
                {EN ? "Website" : "Сайт"} <input name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
              </label>
            </div>
            <div className="fb-sheet__foot">
              {state.status === "failed" && (
                <p className="fb-err fb-sheet__failed" role="alert">
                  {typograf(t.feedback.errors.failed)}
                </p>
              )}
              {/* The consent: a box of its own, never ticked for the guest, and its text on its own page. */}
              <div className="fb-agree">
                <label className="fb-tick">
                  <input
                    ref={consentRef}
                    type="checkbox"
                    className="fb-tick__input"
                    name="consent"
                    value="yes"
                    required
                    checked={fields.consent}
                    onChange={(e) => edit({ consent: e.target.checked })}
                    aria-invalid={errors.consent ? true : undefined}
                    aria-describedby={errors.consent ? "fb-consent-err" : undefined}
                  />
                  <span className="fb-tick__box" aria-hidden="true">
                    <svg viewBox="0 0 24 24" focusable="false">
                      <path d="M4.6 12.9c1.6 1.2 3 2.7 4.1 4.6 2.3-4.9 5.6-9 10.2-12.4" pathLength={1} />
                    </svg>
                  </span>
                  <span className="fb-tick__text">{typograf(t.feedback.consent)}</span>
                </label>
                {/* In a new tab: the guest's note stays as it is. */}
                <p className="fb-agree__links dlinks label">
                  <RouteLink to="consent" className="dlink" target="_blank">
                    {t.feedback.consentText}
                    <span className="sr-only"> {t.a11y.newTab}</span>
                  </RouteLink>
                  <RouteLink to="privacy" className="dlink" target="_blank">
                    {t.feedback.policy}
                    <span className="sr-only"> {t.a11y.newTab}</span>
                  </RouteLink>
                </p>
                {errors.consent && (
                  <p className="fb-err" id="fb-consent-err">
                    {typograf(t.feedback.errors[errors.consent])}
                  </p>
                )}
              </div>
              <button type="submit" className="btn btn-primary fb-send" aria-disabled={pending || undefined}>
                <BtnLabel>{pending ? t.feedback.sending : t.feedback.send}</BtnLabel>
              </button>
            </div>
          </form>
          {/* What the tear leaves under the perforation: the strip above the note's own rip. */}
          {torn && (
            <div className="fb-pad__stub-wrap" aria-hidden="true">
              <div className="fb-pad__stub" style={{ "--stub": torn.stub } as CSSProperties} />
            </div>
          )}
          {/* Phones: the fresh sheet stays folded under the stub until the guest wants it. */}
          {sent && (
            <div className="fb-pad__next">
              <button type="button" className="btn" onClick={resume}>
                <BtnLabel>{t.feedback.again}</BtnLabel>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* The café's side: whom the note goes to, its photo, and the café's voice. */}
      <div className="fb-stage" ref={stageRef}>
        <div className="fb-stage__stick">
          {/* Whom the note goes to, once a café is circled: its street and status. Empty, the line keeps
              its height, so the photo never jumps. */}
          <p className="fb-stage__cafe label">
            {cafe ? (
              <>
                <span className="fb-stage__street">{typograf(street(cafe.address))}</span>
                <span aria-hidden="true"> · </span>
                <CafeStatus cafe={cafe} />
              </>
            ) : (
              "\u00a0"
            )}
          </p>

          <div className="fb-board">
            {/* Every café's photo in one cell; the circled one shows, or the city's flagship (CSS crossfades). */}
            <div className="fb-photos">
              {cafes.map((c) => (
                <div
                  key={c.id}
                  className="fb-photo"
                  data-active={(cafe ? cafe.id === c.id : flagship[c.city].id === c.id) ? "" : undefined}
                  data-city-only={cafe ? undefined : c.city}
                >
                  <Photo photo={c.photo} aspect="3/2" sizes="(min-width: 1280px) 37vw, (min-width: 1024px) 44vw, 93vw" />
                </div>
              ))}
            </div>
            {state.status === "sent" && torn && (
              <div
                ref={noteRef}
                className="fb-note"
                role="group"
                aria-label={t.feedback.sent(noteNumber(state.id))}
                data-gone={sent ? undefined : ""}
                style={{ "--lean": `${lean(torn.lean)}deg` } as CSSProperties}
              >
                <div className="fb-note__paper" style={{ "--rip": torn.clip, "--fibres": torn.fibres } as CSSProperties}>
                  <div className="fb-sheet fb-sheet--print">
                    {/* Its number, to quote in a request about the data (/privacy). */}
                    <p className="fb-note__no label" aria-hidden="true">
                      {t.feedback.number(noteNumber(state.id))}
                    </p>
                    <NoteRows fields={state.note} city={city} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="fb-stage__text">
            {/* All the café's lines in one cell, so the longest sets the height and nothing jumps. */}
            <div className="fb-says">
              <p className="fb-say reply" data-active={voice === "none" ? "" : undefined} id={voice === "none" ? "fb-line" : undefined}>
                {say(noTone.line)}
              </p>
              {tones.map((tone) => (
                <p
                  key={tone.id}
                  className="fb-say reply"
                  data-active={voice === tone.id ? "" : undefined}
                  id={voice === tone.id ? "fb-line" : undefined}
                >
                  {say(tone.line)}
                  {tone.id === "vopros" && (
                    <>
                      {" "}
                      <a className="dlink fb-say__link" href="#voprosy">
                        {t.feedback.asked}
                      </a>
                    </>
                  )}
                </p>
              ))}
              <p ref={replyRef} className="fb-say reply" data-active={voice === "reply" ? "" : undefined} tabIndex={-1}>
                {say(reply)}
              </p>
            </div>
            <p className="fb-call">
              <span className="fb-call__label label">{t.feedback.urgent}</span>
              {cafe ? (
                <a className="fb-call__phone" href={`tel:${cafe.phone}`}>
                  {cafe.phoneDisplay}
                </a>
              ) : (
                CITIES.map((c) => (
                  <a key={c} className="fb-call__phone" href={`tel:${flagship[c].phone}`} data-city-only={c}>
                    {flagship[c].phoneDisplay}
                  </a>
                ))
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
