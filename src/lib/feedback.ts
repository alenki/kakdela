// The feedback page's note («Обратная связь», /feedback): what a guest can write on it, how it is read
// off the form and checked. Pure and shared: the server action checks every note with it, and the page
// checks it first, so a note that can't go never leaves the pad.

export const TONES = ["shik", "ideya", "tak-sebe", "vopros"] as const;
/** What the note is about, circled at its top: «Всё шик», «Есть идея», «Так себе», «Есть вопрос». */
export type Tone = (typeof TONES)[number];

export const TEXT_MAX = 2000;
export const NAME_MAX = 80;
export const CONTACT_MAX = 120;
/** From here on the note shows how many characters are left. */
export const TEXT_WARN = 1800;

export type NoteFields = {
  tone: Tone | null;
  /** A café's id from src/content/cafes, or none. */
  cafe: string | null;
  text: string;
  /** «Подпись»: how the guest signs, if at all. */
  name: string;
  /** Where to answer: a phone, an email or a Telegram name, or nothing. */
  contact: string;
};

export const EMPTY_NOTE: NoteFields = { tone: null, cafe: null, text: "", name: "", contact: "" };

/** How the café can answer, read off the contact. */
export type Channel = "phone" | "email" | "telegram";

export type NoteErrors = Partial<{ text: "empty" | "long"; contact: "unclear" }>;

export type NoteState =
  | { status: "idle" }
  | { status: "invalid"; fields: NoteFields; errors: NoteErrors }
  | { status: "failed"; fields: NoteFields }
  | { status: "sent"; id: string; note: NoteFields; channel: Channel | null };

export const IDLE: NoteState = { status: "idle" };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/u;
const TELEGRAM = /^(?:@|(?:https?:\/\/)?t\.me\/)([a-z0-9_]{5,32})\/?$/iu;
const PHONE = /^\+?[\d\s()\-.]+$/u;

/** «+7 (928) 082-61-11» → phone, «anna@mail.ru» → email, «@anna_k» or «t.me/anna_k» → Telegram. */
export function contactKind(raw: string): Channel | null | "unclear" {
  const s = raw.trim();
  if (!s) return null;
  if (s.length > CONTACT_MAX) return "unclear";
  if (EMAIL.test(s)) return "email";
  if (TELEGRAM.test(s)) return "telegram";
  if (PHONE.test(s)) {
    const digits = s.replace(/\D/gu, "").length;
    if (digits >= 10 && digits <= 15) return "phone";
  }
  return "unclear";
}

/** Plain text off a form field: one kind of line break, no stray spaces round it. */
const clean = (v: unknown) => (typeof v === "string" ? v.replace(/\r\n?/gu, "\n").trim() : "");

/**
 * Reads a note off the form (FormData.get, or anything shaped like it). Unknown tones and cafés are
 * dropped, the signature is cut to NAME_MAX; the text and the contact are left whole for checkNote().
 */
export function readNote(get: (key: string) => unknown, cafeIds: ReadonlySet<string>): NoteFields {
  const tone = clean(get("tone"));
  const cafe = clean(get("cafe"));
  return {
    tone: (TONES as readonly string[]).includes(tone) ? (tone as Tone) : null,
    cafe: cafeIds.has(cafe) ? cafe : null,
    text: clean(get("text")),
    name: clean(get("name")).replace(/\s+/gu, " ").slice(0, NAME_MAX),
    contact: clean(get("contact")).replace(/\s+/gu, " "),
  };
}

/** What stops a note from going: no words (or too many), or a contact that can't be answered. */
export function checkNote(note: NoteFields): NoteErrors {
  const errors: NoteErrors = {};
  const text = note.text.trim();
  if (text.length < 2) errors.text = "empty";
  else if (text.length > TEXT_MAX) errors.text = "long";
  if (contactKind(note.contact) === "unclear") errors.contact = "unclear";
  return errors;
}

export const hasErrors = (errors: NoteErrors) => Object.keys(errors).length > 0;
