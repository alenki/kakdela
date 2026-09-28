import type { KeyboardEvent, RefObject } from "react";
import type { City } from "@/content/types";
import { cafes } from "@/content/cafes";
import { noTone, toneById, tones } from "@/content/feedback";
import { CitySwitch } from "@/components/chrome/CitySwitch";
import { CONTACT_MAX, NAME_MAX, street, TEXT_MAX, TEXT_WARN, type NoteErrors, type NoteFields } from "@/lib/feedback";
import { typograf } from "@/lib/typograf";
import { cn } from "@/lib/format";
import { t } from "@/i18n";
import { Loop } from "./Loop";

const CITIES: City[] = ["nalchik", "vladikavkaz"];

export type Edit = (patch: Partial<NoteFields>) => void;

type Props = {
  fields: NoteFields;
  /** The pad's form: what to put right, and the edit. Without it the rows are the printed note. */
  form?: { errors: NoteErrors; edit: Edit };
  /** The fields the pad focuses: the first tone, the text, the contact. */
  refs?: {
    first: RefObject<HTMLInputElement | null>;
    text: RefObject<HTMLTextAreaElement | null>;
    contact: RefObject<HTMLInputElement | null>;
  };
  /** The printed note's city when no café is circled on it. */
  city?: City;
};

/**
 * The printed rows of the café's note, as a form on the pad or as the torn-off sheet on the café's side.
 * Both are drawn from the same markup at the same proportions (feedback.css sizes everything in the
 * sheet's own cqi), so the sheet that flies across is the one the guest filled in: the four tones with
 * one circled, the cafés with one circled, the words on their ruled lines, and the signature.
 */
export function NoteRows({ fields, form, refs, city = "nalchik" }: Props) {
  const ask = typograf(fields.tone ? toneById[fields.tone].ask : noTone.ask);
  const cafe = cafes.find((c) => c.id === fields.cafe) ?? null;
  // The printed note lists the cafés of its own city: the circled one's, or the city on show.
  const printCity = form ? null : (cafe?.city ?? city);

  return (
    <>
      {/* О чём записка? The four tones, one circled. */}
      <div className="fb-row">
        <p className="fb-row__label label" id={form ? "fb-tone-l" : undefined}>
          {t.feedback.tone}
        </p>
        <div className="fb-tones" role={form ? "radiogroup" : undefined} aria-labelledby={form ? "fb-tone-l" : undefined}>
          {tones.map((tone, i) => {
            const on = fields.tone === tone.id;
            return form ? (
              <label key={tone.id} className="fb-opt fb-opt--tone display">
                <input
                  ref={i === 0 ? refs?.first : undefined}
                  type="radio"
                  className="fb-opt__input"
                  name="tone"
                  value={tone.id}
                  checked={on}
                  onChange={() => form.edit({ tone: tone.id })}
                  // A second click on the circled tone rubs its loop out: the tone is optional.
                  onClick={() => on && form.edit({ tone: null })}
                />
                <span className="fb-opt__word">{tone.label}</span>
                <Loop seed={tone.id} />
              </label>
            ) : (
              <span key={tone.id} className="fb-opt fb-opt--tone display" data-on={on ? "" : undefined}>
                <span className="fb-opt__word">{tone.label}</span>
                <Loop seed={tone.id} />
              </span>
            );
          })}
        </div>
      </div>

      {/* Где это было? The city, then its cafés, one circled. */}
      <div className="fb-row">
        <div className="fb-row__head">
          <p className="fb-row__label label" id={form ? "fb-where-l" : undefined}>
            {t.feedback.where}
          </p>
          {form ? (
            <CitySwitch compact className="fb-city" />
          ) : (
            <p className="fb-row__label label">{t.city[printCity ?? city]}</p>
          )}
        </div>
        <div className="fb-cafes" role={form ? "radiogroup" : undefined} aria-labelledby={form ? "fb-where-l" : undefined}>
          {CITIES.filter((c) => form || c === printCity).map((city) => (
            // Only the city on show (html[data-city]); without JS both, each under its name.
            <div key={city} className="fb-cafes__city" data-fb-city={form ? city : undefined}>
              {form && <span className="fb-cafes__name label">{t.city[city]}</span>}
              {cafes
                .filter((c) => c.city === city)
                .map((c) => {
                  const on = fields.cafe === c.id;
                  return form ? (
                    <label key={c.id} className="fb-opt fb-opt--cafe">
                      <input
                        type="radio"
                        className="fb-opt__input"
                        name="cafe"
                        value={c.id}
                        checked={on}
                        onChange={() => form.edit({ cafe: c.id })}
                        onClick={() => on && form.edit({ cafe: null })}
                      />
                      <span className="fb-opt__word">{typograf(street(c.address))}</span>
                      <Loop seed={c.id} />
                    </label>
                  ) : (
                    <span key={c.id} className="fb-opt fb-opt--cafe" data-on={on ? "" : undefined}>
                      <span className="fb-opt__word">{typograf(street(c.address))}</span>
                      <Loop seed={c.id} />
                    </span>
                  );
                })}
            </div>
          ))}
        </div>
      </div>

      {/* The words, on ruled lines, under the tone's own question. */}
      <div className="fb-row">
        {form ? (
          <>
            <label className="fb-row__label label" htmlFor="fb-text">
              {ask}
            </label>
            <textarea
              ref={refs?.text}
              id="fb-text"
              name="text"
              className="fb-lines"
              rows={5}
              maxLength={TEXT_MAX}
              required
              value={fields.text}
              onChange={(e) => form.edit({ text: e.target.value })}
              onKeyDown={submitOnModEnter}
              aria-invalid={form.errors.text ? true : undefined}
              aria-describedby={cn("fb-line", form.errors.text && "fb-text-err")}
            />
            {fields.text.length >= TEXT_WARN && (
              <p className="fb-row__note label" aria-live="polite">
                {t.feedback.left(Math.max(0, TEXT_MAX - fields.text.length))}
              </p>
            )}
            {form.errors.text && (
              <p className="fb-err" id="fb-text-err">
                {t.feedback.errors[form.errors.text]}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="fb-row__label label">{ask}</p>
            <p className="fb-lines fb-lines--print">{fields.text}</p>
          </>
        )}
      </div>

      {/* The signature, and where to answer. */}
      <div className="fb-row fb-sign">
        <div className="fb-field">
          {form ? (
            <>
              <label className="fb-field__label label" htmlFor="fb-name">
                {t.feedback.sign}
              </label>
              <input
                id="fb-name"
                name="name"
                className="fb-field__line"
                autoComplete="name"
                maxLength={NAME_MAX}
                value={fields.name}
                onChange={(e) => form.edit({ name: e.target.value })}
              />
            </>
          ) : (
            <>
              <span className="fb-field__label label">{t.feedback.sign}</span>
              <span className="fb-field__line">{fields.name}</span>
            </>
          )}
        </div>
        <div className="fb-field">
          {form ? (
            <>
              <label className="fb-field__label label" htmlFor="fb-contact">
                {t.feedback.contact}
              </label>
              <input
                ref={refs?.contact}
                id="fb-contact"
                name="contact"
                className="fb-field__line"
                maxLength={CONTACT_MAX}
                spellCheck={false}
                value={fields.contact}
                onChange={(e) => form.edit({ contact: e.target.value })}
                aria-invalid={form.errors.contact ? true : undefined}
                aria-describedby={cn("fb-contact-hint", form.errors.contact && "fb-contact-err")}
              />
              <p className="fb-field__hint label" id="fb-contact-hint">
                {typograf(t.feedback.contactHint)}
              </p>
              {form.errors.contact && (
                <p className="fb-err fb-field__hint" id="fb-contact-err">
                  {t.feedback.errors[form.errors.contact]}
                </p>
              )}
            </>
          ) : (
            <>
              <span className="fb-field__label label">{t.feedback.contact}</span>
              <span className="fb-field__line">{fields.contact}</span>
            </>
          )}
        </div>
      </div>
    </>
  );
}

/** Ctrl or ⌘ with Enter sends the note from its text, as in any message box. */
function submitOnModEnter(e: KeyboardEvent<HTMLTextAreaElement>) {
  if ((e.ctrlKey || e.metaKey) && (e.key === "Enter" || e.key === "NumpadEnter")) {
    e.preventDefault();
    e.currentTarget.form?.requestSubmit();
  }
}
