"use server";

import nodemailer from "nodemailer";
import { cafes } from "@/content/cafes";
import { toneById } from "@/content/feedback";
import { consentBlanks, EDITION_LABEL } from "@/content/privacy";
import { t } from "@/i18n";
import { checkNote, contactKind, hasErrors, noteNumber, readNote, street, type Channel, type NoteFields, type NoteState } from "@/lib/feedback";

const CAFE_IDS = new Set(cafes.map((c) => c.id));
const moscowTime = new Intl.DateTimeFormat("ru-RU", { timeZone: "Europe/Moscow", dateStyle: "short", timeStyle: "short" });

/**
 * Hands a note to the café: a plain-text letter to the operator's mailbox at a mail provider in Russia.
 * The mailbox is the only place a note is kept (the site's server keeps nothing), so the guests' data is
 * recorded in Russia first and never crosses a border (152-FZ art. 18 part 5, art. 12; /privacy says so).
 * The letter carries the consent record (art. 9 part 3): the note's number, the time, the consent's
 * edition. Set up with FEEDBACK_SMTP_URL (e.g. smtps://user:password@smtp.example.ru:465),
 * FEEDBACK_MAIL_TO and, if the provider needs another sender, FEEDBACK_MAIL_FROM. Without them a
 * development build prints the note to the server log; a production build reports that it could not
 * send, so a note is never lost in silence. A production build also refuses while the consent still has
 * blanks where the operator's details go (consentBlanks): the settings alone never open the form. Every
 * refusal and failure is logged for the operator by the note's number, never with what the guest wrote.
 */
async function deliver(id: string, note: NoteFields, channel: Channel | null): Promise<boolean> {
  const cafe = cafes.find((c) => c.id === note.cafe);
  const tone = note.tone ? toneById[note.tone].label : null;
  const subject = [`Записка № ${noteNumber(id)}`, tone, cafe && street(cafe.address)].filter(Boolean).join(" · ");
  const text = [
    `Записка № ${noteNumber(id)} (${id})`,
    `Отправлена: ${moscowTime.format(new Date())}, время московское`,
    `Тема: ${tone ?? "не отмечена"}`,
    `Кофейня: ${cafe ? `${cafe.address} (${t.city[cafe.city]})` : "не отмечена"}`,
    `Подпись: ${note.name || "без подписи"}`,
    `Ответить: ${note.contact || "не нужно"}`,
    `Согласие на обработку персональных данных: дано, редакция от ${EDITION_LABEL}`,
    "",
    note.text,
  ].join("\n");

  const url = process.env.FEEDBACK_SMTP_URL;
  const to = process.env.FEEDBACK_MAIL_TO;
  const production = process.env.NODE_ENV === "production";
  const blanks = consentBlanks();
  if (production && blanks.length) {
    console.error(`[feedback] № ${noteNumber(id)} not sent: the consent names no ${blanks.join(", ")} (src/content/privacy.ts)`);
    return false;
  }
  if (!url || !to) {
    if (production) {
      console.error(`[feedback] № ${noteNumber(id)} not sent: FEEDBACK_SMTP_URL or FEEDBACK_MAIL_TO is not set`);
      return false;
    }
    console.info(`[feedback] ${subject}\n${text}`);
    return true;
  }
  try {
    const mail = nodemailer.createTransport({ url, connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 12000 });
    await mail.sendMail({
      from: process.env.FEEDBACK_MAIL_FROM || to,
      to,
      subject,
      text,
      // A guest who left an email gets the answer straight from the mailbox. An address object, so the
      // mailer never reads the guest's string as a list of addresses.
      replyTo: channel === "email" ? { name: "", address: note.contact } : undefined,
    });
    return true;
  } catch (e) {
    const err = e as { code?: string; responseCode?: number; message?: string };
    console.error(`[feedback] № ${noteNumber(id)} not sent: ${err.code ?? ""} ${err.responseCode ?? ""} ${err.message ?? ""}`.trim());
    return false;
  }
}

/**
 * The note's form action (useActionState on the page, and a plain POST without JS). Every note is read
 * and checked again here, whatever the page already checked, the consent included: without it nothing
 * is sent. A filled honeypot is thanked and dropped.
 */
export async function sendNote(_prev: NoteState, form: FormData): Promise<NoteState> {
  const fields = readNote((key) => form.get(key), CAFE_IDS);
  const errors = checkNote(fields);
  if (hasErrors(errors)) return { status: "invalid", fields, errors };
  const kind = contactKind(fields.contact);
  const channel = kind === "phone" || kind === "email" ? kind : null;
  const id = crypto.randomUUID();
  if (String(form.get("website") ?? "").trim()) return { status: "sent", id, note: fields, channel };
  if (!(await deliver(id, fields, channel))) return { status: "failed", fields };
  return { status: "sent", id, note: fields, channel };
}
