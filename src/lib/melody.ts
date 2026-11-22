// «Jingle Bells» (James Lord Pierpont, 1857, public domain): the verse and the chorus, in C major, 4/4. The garland
// (src/lib/garland.ts) hangs a bulb for every note, line after line, so a hand run along it plays the tune;
// with the sound on, src/lib/sound.ts plays the song on the bells over a beat (kick, clap, sleigh-bell hats,
// bass and soft chords), every note knocking its bulb.

export type Note = {
  /** MIDI pitch as written (C4 = 60); the bells sound it an octave up. */
  midi: number;
  /** How long it lasts, in eighths. */
  eighths: number;
};

const G3 = 55, A3 = 57, B3 = 59, C = 60, D = 62, E = 64, F = 65, G = 67, A = 69;
const line = (notes: [number, number][]): Note[] => notes.map(([midi, eighths]) => ({ midi, eighths }));

/** The song in its eight lines (four bars each). The verse: «Dashing through the snow, in a one-horse open
 *  sleigh», «O'er the fields we go, laughing all the way», «Bells on bobtail ring, making spirits bright», «What
 *  fun it is to ride and sing a sleighing song tonight!». Then the chorus: «Jingle bells, jingle bells, jingle
 *  all the way», «Oh what fun it is to ride in a one-horse open sleigh, hey!», the first again, «…open sleigh». */
const L1 = line([[E, 2], [E, 2], [E, 4], [E, 2], [E, 2], [E, 4], [E, 2], [G, 2], [C, 3], [D, 1], [E, 8]]);
export const LINES: readonly (readonly Note[])[] = [
  line([[G3, 2], [E, 2], [D, 2], [C, 2], [G3, 6], [G3, 1], [G3, 1], [G3, 2], [E, 2], [D, 2], [C, 2], [A3, 8]]),
  line([[A3, 2], [F, 2], [E, 2], [D, 2], [B3, 8], [G, 2], [G, 2], [F, 2], [D, 2], [E, 8]]),
  line([[G3, 2], [E, 2], [D, 2], [C, 2], [G3, 8], [G3, 2], [E, 2], [D, 2], [C, 2], [A3, 6], [A3, 2]]),
  line([[A3, 2], [F, 2], [E, 2], [D, 2], [G, 2], [G, 2], [G, 2], [G, 2], [A, 2], [G, 2], [F, 2], [D, 2], [C, 4], [G3, 4]]),
  L1,
  line([[F, 2], [F, 2], [F, 3], [F, 1], [F, 2], [E, 2], [E, 2], [E, 1], [E, 1], [E, 2], [D, 2], [D, 2], [E, 2], [D, 4], [G, 4]]),
  L1,
  line([[F, 2], [F, 2], [F, 2], [F, 2], [F, 2], [E, 2], [E, 2], [E, 1], [E, 1], [G, 2], [G, 2], [F, 2], [D, 2], [C, 8]]),
];

/** Every note of the song in order. */
export const NOTES: readonly Note[] = LINES.flat();

const CM = [48, 52, 55], FM = [53, 57, 60], GM = [43, 47, 50], G7 = [43, 47, 53], DM = [50, 53, 57];
/** The harmony, a chord a bar (roots as MIDI, with the chord's third and fifth above). The verse: C C C F,
 *  Dm G G7 C, C C C F, Dm C G7 C; the chorus: C C C C, F C D G, C C C C, F C G C. */
export const CHORDS: readonly (readonly number[])[] = [
  CM, CM, CM, FM, DM, GM, G7, CM,
  CM, CM, CM, FM, DM, CM, G7, CM,
  [48, 52, 55], [48, 52, 55], [48, 52, 55], [48, 52, 55],
  [53, 57, 60], [48, 52, 55], [50, 54, 57], [43, 47, 50],
  [48, 52, 55], [48, 52, 55], [48, 52, 55], [48, 52, 55],
  [53, 57, 60], [48, 52, 55], [43, 47, 50], [48, 52, 55],
];

/** The tune bar by bar, a chord's bar each: every note's place in the song, where in its bar it starts
 *  (eighths) and its pitch and length. The music plays it a bar at a time, so it can go round for ever. */
export type BarNote = { note: number; at: number; midi: number; eighths: number };
export const BARS: readonly (readonly BarNote[])[] = (() => {
  const out: BarNote[][] = CHORDS.map(() => []);
  let t = 0;
  NOTES.forEach((n, note) => {
    const bar = Math.floor(t / 8);
    out[bar].push({ note, at: t - bar * 8, midi: n.midi, eighths: n.eighths });
    t += n.eighths;
  });
  return out;
})();

/** The groove: 128 beats a minute; an eighth in seconds. */
export const EIGHTH = 60 / 128 / 2;
