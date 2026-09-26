/**
 * Russian typesetting for flowing copy, shared by server and client components.
 * Copy in ru.ts and src/content stays plain; call `typograf()` where it is rendered.
 * It only swaps ordinary spaces for no-break ones: words, quotes («ёлочки») and dashes are untouched.
 */

// Built from their code points so they stay visible and unambiguous in source.
/** No-break space (U+00A0). */
export const NBSP = String.fromCharCode(0xa0);
/** Narrow no-break space (U+202F): the thousands separator in «5 000». */
export const NNBSP = String.fromCharCode(0x202f);

/**
 * Which short words are held to the next word:
 * 1 → one-letter words (в, к, с, у, о, и, а, я);
 * 2 → one- and two-letter words (на, до, во, из, мы…);
 * 3 → two-letter words plus для, без, над, под, при, про (the default).
 */
export type TypografLevel = 1 | 2 | 3;

const SHORT: Record<TypografLevel, string> = {
  1: "[а-яё]",
  2: "[а-яё]{1,2}",
  3: "[а-яё]{1,2}|для|без|над|под|при|про",
};
const SHORT_RE = Object.fromEntries(
  Object.entries(SHORT).map(([k, words]) => [k, new RegExp(`(?<=^|[\\s«„(])(${words})\\s+`, "giu")]),
) as Record<TypografLevel, RegExp>;

/** Units that stay with their number: «50 м», «1,4 км», «320 ккал». (No «с»: it is also a preposition.) */
const UNITS = "ккал|кг|км|мл|мин|см|шт|г|л|м|ч|%";

const RULES: [RegExp, string][] = [
  // An opening dialogue dash holds on to the first word: «— А домой привезёте?»
  [/^—\s+/u, `—${NBSP}`],
  // A dash or «·» never starts a line: it stays with the word before.
  [/\s+([—–·])/gu, `${NBSP}$1`],
  // Particles stay with the word before: «так же», «было ли».
  [/\s+(же|ли|бы)(?=[\s.,!?…:;»]|$)/giu, `${NBSP}$1`],
  // Street abbreviations stay with the name: «пр. Шогенцукова».
  [/(?<=^|[\s«(])(ул|пр|пер|пл|д)\.\s+/giu, `$1.${NBSP}`],
  // House numbers stay with the street name: «Байсултанова, 1» (not a list: «50 м, 1,4 км»).
  [/(?<=\p{Lu}\p{Ll}*),\s+(?=\d)/gu, `,${NBSP}`],
  // Digit groups never split, with a narrow no-break space: «2 709», «5 000».
  [/(?<=\d)\s(?=\d{3}(?!\d))/gu, NNBSP],
  // A number keeps its unit, and «₽» never starts a line.
  [new RegExp(`(?<=\\d)\\s+(?=(?:${UNITS})(?![\\p{L}\\d]))`, "gu"), NBSP],
  [/\s+₽/gu, `${NBSP}₽`],
];

/**
 * Apply the no-break rules: short words stay with the next word (see `TypografLevel`), a dash never
 * starts a line, numbers keep their digit groups, units and «₽». Idempotent.
 */
export function typograf(s: string, level: TypografLevel = 3): string {
  const out = s.replace(SHORT_RE[level], `$1${NBSP}`);
  return RULES.reduce((acc, [re, to]) => acc.replace(re, to), out);
}

/** The last two words travel together, so a paragraph never ends on a lone word. */
export const bindLastWord = (s: string) => s.replace(/ (?=[^ ]+$)/u, NBSP);

/** «Блиц. До десяти минут.»: if the text has to wrap, it breaks only between the sentences. */
export const keepLastSentence = (s: string) =>
  s.replace(/(?<=[.!?…]\s)[^.!?…]+[.!?…]?$/u, (m) => m.replace(/ /g, NBSP));
