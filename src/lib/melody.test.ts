import { describe, expect, it } from "vitest";
import { BARS, CHORDS, EIGHTH, LINES, NOTES } from "./melody";

describe("Jingle Bells", () => {
  it("has its verse and its chorus, every line four bars of 4/4, a chord a bar", () => {
    expect(LINES).toHaveLength(8);
    for (const line of LINES) expect(line.reduce((s, n) => s + n.eighths, 0)).toBe(32);
    expect(CHORDS).toHaveLength(LINES.length * 4);
    expect(NOTES).toHaveLength(LINES.reduce((s, l) => s + l.length, 0));
    // «Jingle bells, jingle bells»: the chorus opens on six E's.
    expect(LINES[4].slice(0, 6).map((n) => n.midi)).toEqual([64, 64, 64, 64, 64, 64]);
  });

  it("lays every note in its bar, so it can play a bar at a time and go round", () => {
    expect(BARS).toHaveLength(CHORDS.length);
    expect(BARS.flat().map((n) => n.note)).toEqual(NOTES.map((_, i) => i));
    for (const bar of BARS) {
      for (const n of bar) {
        expect(n.at).toBeGreaterThanOrEqual(0);
        expect(n.at).toBeLessThan(8);
      }
    }
    // Every bar starts on a note or carries one held over it; the song is a minute round at 128.
    expect((NOTES.reduce((s, n) => s + n.eighths, 0) * EIGHTH) / 60).toBeCloseTo(1, 0);
  });
});
