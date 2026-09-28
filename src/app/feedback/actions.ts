"use server";

import { cafes } from "@/content/cafes";
import { t } from "@/i18n";
import { toneById } from "@/content/feedback";
import { checkNote, contactKind, hasErrors, readNote, type NoteFields, type NoteState } from "@/lib/feedback";

const CAFE_IDS = new Set(cafes.map((c) => c.id));

/**
 * Hands a note to the café. PLACEHOLDER channel (client sign-off): a Telegram bot posting to the team's
 * chat, set up with FEEDBACK_TELEGRAM_TOKEN and FEEDBACK_TELEGRAM_CHAT_ID. Without them a development
 * build prints the note to the server log; a production build reports that it could not send, so a note
 * is never lost in silence.
 */
async function deliver(id: string, note: NoteFields): Promise<boolean> {
  const cafe = cafes.find((c) => c.id === note.cafe);
  const lines = [
    `Записка ${id.slice(0, 8)}${note.tone ? ` · ${toneById[note.tone].label}` : ""}`,
    `Кофейня: ${cafe ? `${cafe.address} (${t.city[cafe.city]})` : "не указана"}`,
    `Подпись: ${note.name || "без подписи"}`,
    `Ответить: ${note.contact || "не нужно"}`,
    "",
    note.text,
  ];
  const text = lines.join("\n");
  const token = process.env.FEEDBACK_TELEGRAM_TOKEN;
  const chat = process.env.FEEDBACK_TELEGRAM_CHAT_ID;
  if (!token || !chat) {
    if (process.env.NODE_ENV === "production") return false;
    console.info(`[feedback]\n${text}`);
    return true;
  }
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(8000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * The note's form action (useActionState on the page, and a plain POST without JS). Every note is read
 * and checked again here, whatever the page already checked. A filled honeypot is thanked and dropped.
 */
export async function sendNote(_prev: NoteState, form: FormData): Promise<NoteState> {
  const fields = readNote((key) => form.get(key), CAFE_IDS);
  const errors = checkNote(fields);
  if (hasErrors(errors)) return { status: "invalid", fields, errors };
  const kind = contactKind(fields.contact);
  const channel = kind === "unclear" ? null : kind;
  const id = crypto.randomUUID();
  if (String(form.get("website") ?? "").trim()) return { status: "sent", id, note: fields, channel };
  if (!(await deliver(id, fields))) return { status: "failed", fields };
  return { status: "sent", id, note: fields, channel };
}
