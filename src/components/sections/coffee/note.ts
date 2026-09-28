import type { City, Drink } from "@/content/types";
import { groupDigits } from "@/lib/format";
import { hashString, mulberry32 } from "@/lib/seed";
import { NBSP } from "@/lib/typograf";

// The barista's note: geometry shared by the cup's SVG (server) and the pen (island), and the note's
// words, built from menu.ts. Plain TS on purpose: no React, no GSAP, so the tests can load it.

/** The cup's drawing (Cup.tsx): a 300×460 viewBox, standing on y 448. */
export const CUP = {
  w: 300,
  h: 460,
  /** The bottom of the cup's body: the line it rocks on. */
  baseY: 442,
} as const;

/** The note on the sleeve (band y 286 to 352). */
export const NOTE = {
  cx: 150,
  cy: 319,
  rotate: -3,
  /** One line («как дела?»): Neucha 26, baseline 328. */
  single: { y: 328, size: 26 },
  /** Two lines: the question, then the arrow and the drink with its price. */
  first: { y: 313, size: 24 },
  second: { y: 341, size: 21 },
  /** Widest a line may run on the sleeve before the pen shrinks it. */
  maxWidth: 164,
  arrow: { w: 17, gap: 6 },
  /** Each line's mask: the sleeve with room to spare, in the note's own (unslanted) units. */
  mask: { x: 36, y: 268, w: 228, h: 102 },
} as const;

/** A hand-drawn arrow, local coords (0,0) = the start of the stroke on the x-height. */
export const ARROW_D = "M0.8 -0.6Q7.6 1.6 15.6 -0.9M10.4 -5.2L16 -1L10.2 3.4";

/** The note's two lines: the question, then the drink and its price. An empty second line: one line. */
export type NoteLines = readonly [ask: string, say: string];

/** A two-size drink costs its small cup; otherwise the city's price (null: none there yet). */
export const notePrice = (price: Drink["price"], city: City): number | null =>
  "sizes" in price ? price.sizes[0] : price[city];

/**
 * The note for a drink in a city: ["классика?", "капучино 240"], the price from menu.ts held to the
 * name by a no-break space. A city without a price gets just the name; a drink without a note, null.
 */
export function noteLines(drink: Drink, city: City): NoteLines | null {
  const note = drink.cupNote;
  if (!note) return null;
  const v = notePrice(drink.price, city);
  return [note.ask, v == null ? note.say : `${note.say}${NBSP}${groupDigits(v)}`];
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Each note in its own hand: a hand never sets two notes on a sleeve the same way, so each drink's note
 * sits at its own slant and a touch off centre, the same every time for the same question. The default
 * note sits exactly as the server drew it.
 */
export function noteSlant([ask, say]: NoteLines): { rotate: number; dx: number } {
  if (!say) return { rotate: NOTE.rotate, dx: 0 };
  const rnd = mulberry32(hashString(ask));
  return { rotate: r1(NOTE.rotate + (rnd() - 0.5) * 2.6), dx: r1((rnd() - 0.5) * 6) };
}

/** A line's text box (getBBox), in the note's own units. */
export type LineBox = { x: number; y: number; width: number; height: number };

/** The pen's path over one line, and its nib: a stroke this wide, drawn in, inks the line in. */
export type PenStroke = { d: string; width: number };

/**
 * The barista's pen over one line of the note, as a path to draw in as the line's mask: a wave that runs
 * along the words the way a hand does, up and down through each letter, so the ink arrives stroke by
 * stroke behind a moving nib instead of behind a straight edge. The nib is wide enough, and the waves
 * close enough, that the finished stroke covers the whole ink band of the line. `size` is the font
 * size; `seed` gives each line a hand of its own.
 */
export function penStroke(box: LineBox, size: number, seed: number): PenStroke {
  const rnd = mulberry32(seed);
  const width = box.height * 0.56;
  const amp = box.height * 0.33;
  const yc = box.y + box.height * 0.52;
  // The pen comes down a little before the first letter and lifts a little after the last, so the
  // wave's first dip and last rise reach the corners of the line.
  const x0 = box.x - width * 0.55;
  const x1 = box.x + box.width + width * 0.55;
  const n = Math.max(2, Math.round((x1 - x0) / (size * 0.34)));
  const dx = (x1 - x0) / n;
  let d = `M${r1(x0)} ${r1(yc)}`;
  for (let i = 0; i < n; i++) {
    // A quadratic arc peaks halfway to its control point: 2 × amp reaches amp, give or take the hand.
    const up = i % 2 === 0 ? -1 : 1;
    const peak = amp * 2 * (0.9 + rnd() * 0.2);
    d += `Q${r1(x0 + dx * (i + 0.5))} ${r1(yc + up * peak)} ${r1(x0 + dx * (i + 1))} ${r1(yc)}`;
  }
  return { d, width: r1(width) };
}
