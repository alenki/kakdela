import type { RouteKey } from "./routes";
import { external } from "./routes";
import { chessEvent } from "./people";
import type { Channel, NoteFields, Tone } from "@/lib/feedback";
import { t } from "@/i18n";
import { EN } from "@/i18n/locale";
import { overlay } from "./en/overlay";
import { feedbackEn } from "./en";

// «Обратная связь» (/feedback). The note's four tones, in the notice's own words («Всё шик», «Так себе»;
// «Есть идея» and «Есть вопрос» after «Есть хочу»), each with the question over the note's text, the
// café's line while the guest writes, and its reply once the note has gone. Then the questions the café
// answers below the pad. The replies promise only what the café does with a note: pass it on and answer
// where a contact is left (verify with the client).

type ToneCopy = {
  id: Tone;
  /** Circled at the top of the note, in the display face. */
  label: string;
  /** The label over the note's text. */
  ask: string;
  /** The café's line beside the pad while the guest writes. */
  line: string;
  /** The café's reply once the note has gone; `at` is the café's street («Байсултанова, 1»), if circled. */
  reply: (at: string | null) => string;
};

export const tones: ToneCopy[] = [
  {
    id: "shik",
    label: "Всё шик",
    ask: "Что понравилось?",
    line: "Приятно слышать. Расскажите, что понравилось, и мы передадим тем, кто это сделал.",
    reply: (at) => `Спасибо! Передадим команде${at ? ` на ${at}` : ""}: им будет приятно.`,
  },
  {
    id: "ideya",
    label: "Есть идея",
    ask: "Какая идея?",
    line: "Рассказывайте. Хорошие идеи мы обсуждаем всей командой.",
    reply: (at) => `Спасибо, записали. Обсудим идею с командой${at ? ` на ${at}` : ""}.`,
  },
  {
    id: "tak-sebe",
    label: "Так себе",
    ask: "Что пошло не так?",
    line: "Жаль. Расскажите, что случилось, и оставьте контакт: разберёмся и ответим.",
    reply: (at) => (at ? `Простите, что так вышло. Передадим в кофейню на ${at} и разберёмся.` : "Простите, что так вышло. Разберёмся."),
  },
  {
    id: "vopros",
    label: "Есть вопрос",
    ask: "Какой вопрос?",
    line: "Спрашивайте. Может быть, ответ уже есть ниже.",
    reply: () => "Спасибо за вопрос.",
  },
];

export const toneById = Object.fromEntries(tones.map((x) => [x.id, x])) as Record<Tone, ToneCopy>;

/** Before a tone is circled. */
export const noTone = {
  ask: "Что хотите рассказать?",
  line: "Слушаем. Можно коротко, можно подробно.",
  reply: "Спасибо, что написали.",
};

/** Tones that ask for an answer: without a contact the café says it can't give one. */
const ANSWER_EXPECTED: ReadonlySet<Tone> = new Set(["tak-sebe", "vopros"]);

/**
 * The café's reply to a note that has gone: the tone's own words (with the café's street, if one was
 * circled), then how it will answer. «Спасибо! Передадим команде на Байсултанова, 1: им будет
 * приятно. Ответим на почту.»
 */
export function cafeReply(note: Pick<NoteFields, "tone">, at: string | null, channel: Channel | null): string {
  const first = note.tone ? toneById[note.tone].reply(at) : noTone.reply;
  if (channel) return `${first} ${t.feedback.answerBy[channel]}`;
  if (note.tone && ANSWER_EXPECTED.has(note.tone)) return `${first} ${t.feedback.noContact}`;
  return first;
}

// ── «Уже спрашивали.»: the questions answered under the pad ──
// Only facts the site already states elsewhere (ru.ts, cafes, people): nothing here is new. Each answer is
// said first in a word or a time (`short`, set where a menu sets the price), then the rest (`a`).

/** A page of the site, an address outside it, or a place on this page (`anchor`, an id without the «#»). */
export type FaqLink = { to: RouteKey; label: string } | { href: string; label: string } | { anchor: string; label: string };
export type FaqItem = {
  /** Its anchor is #voprosy-<id>. */
  id: string;
  /** The guest's question, in the guest's words. */
  q: string;
  /** The café's answer said first: a word or a time, at most three words. */
  short: string;
  /** The rest of the answer. A link whose label is found in it verbatim is set on those words; otherwise it follows. */
  a: string;
  link?: FaqLink;
};

export const faq: FaqItem[] = [
  {
    id: "chasy",
    q: "Во сколько вы открываетесь?",
    short: "В 07:30.",
    a: "Каждый день. Закрываемся в 23:00 или в полночь, смотря какая кофейня.",
    link: { to: "locations", label: "Часы каждой кофейни" },
  },
  {
    id: "zavtraki",
    q: "Завтраки только утром?",
    short: "Весь день.",
    a: "Все завтраки есть не в каждой кофейне: в некоторых меню полегче.",
    link: { to: "menu", label: "меню" },
  },
  {
    id: "noutbuk",
    q: "Можно с ноутбуком?",
    short: "Можно.",
    a: "Во всех кофейнях есть Wi‑Fi и розетки.",
  },
  {
    id: "halyal",
    q: "У вас халяль?",
    short: "Да.",
    a: "Халяль и намазхана во всех кофейнях.",
  },
  {
    id: "english",
    q: "Есть меню на английском?",
    short: "Да.",
    a: "Во всех кофейнях.",
  },
  {
    id: "dostavka",
    q: "Вы привозите?",
    short: "Да.",
    a: "Через Яндекс Еду.",
    link: { to: "delivery", label: "Доставка" },
  },
  {
    id: "blic",
    q: "Когда шахматный блиц?",
    // «Объявим.» holds while chessEvent.when says the dates are announced; once it names a day, say that.
    short: "Объявим.",
    a: `${chessEvent.when}. Несколько туров, партия до десяти минут.`,
    link: { href: external.telegram, label: "Telegram" },
  },
  {
    id: "keitering",
    q: "Приедете на наше мероприятие?",
    short: "Приедем.",
    a: "У нас есть кейтеринг.",
    link: { to: "catering", label: "кейтеринг" },
  },
  {
    id: "rabota",
    q: "Хочу работать у вас.",
    short: "Ждём.",
    a: "Будем рады знакомству.",
    link: { to: "careers", label: "Работа у нас" },
  },
  {
    // The last line sends the guest back up to the pad, as the café's «Есть вопрос» line sends them down here.
    id: "svoy",
    q: "Не нашли свой вопрос?",
    short: "Спрашивайте.",
    a: "Напишите записку: ответим, если оставите телефон или почту.",
    link: { anchor: "zapiska", label: "Напишите записку" },
  },
];

// The English build lays its words over these (src/content/en).
if (EN) overlay({ tones, noTone, faq }, feedbackEn);
