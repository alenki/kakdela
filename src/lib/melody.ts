// «В лесу родилась ёлочка»: Leonid Bekman's tune (1905, public domain) to Raisa Kudasheva's verse, the first
// verse as it is sung, in F major in 2/4. The words are here only to name the notes: nothing on the page
// shows them. The garland (src/lib/garland.ts) hangs its bulbs at these notes' times, an eighth to a bulb's
// pitch, so a hand run along it at an even speed plays the song in its own rhythm.

export type Note = {
  /** The syllable it is sung to. */
  syllable: string;
  /** MIDI pitch as written (C4 = 60); the bells sound it an octave up. */
  midi: number;
  /** How long it lasts, in eighths (a rest after a held note counts in its length). */
  eighths: number;
};

const C4 = 60, F4 = 65, G4 = 67, A4 = 69, BB4 = 70, C5 = 72, D5 = 74;
const n = (syllable: string, midi: number, eighths = 1): Note => ({ syllable, midi, eighths });

/** The verse in two halves, as the garland hangs them: «В лесу родилась ёлочка, в лесу она росла.» and
 *  «Зимой и летом стройная, зелёная была.» (16 and 17 eighths: the first ends on a held note and a breath). */
export const VERSE: readonly (readonly Note[])[] = [
  [
    n("В ле", C4), n("су", A4), n("ро", A4), n("ди", G4), n("лась", A4), n("ё", F4), n("лоч", C4), n("ка", C4),
    n("в ле", C4), n("су", A4), n("о", A4), n("на", BB4), n("рос", G4), n("ла", C5, 3),
  ],
  [
    n("Зи", C5), n("мой", D5), n("и", D5), n("ле", BB4), n("том", BB4), n("строй", A4), n("на", G4), n("я", F4),
    n("зе", C4), n("лё", A4), n("на", A4), n("я", G4), n("бы", A4), n("ла", F4, 4),
  ],
];

/** Every note of the verse in order. */
export const NOTES: readonly Note[] = VERSE.flat();

/** The tempo the music box plays it at: an eighth in seconds (a quarter at about 104). */
export const EIGHTH = 0.29;
