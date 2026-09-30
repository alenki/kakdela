import { describe, expect, it } from "vitest";
import { WORDMARK } from "@/components/brand/wordmark-data";
import { en } from "@/i18n/en";
import { ru } from "@/i18n/ru";
import { CAP, LETTERS, area, glyph, letterAsk, outline, setLine } from "./lettering";
import { ASKS, CAPS } from "./sign";

/** The English build's question (its dictionary is partial: a missing key falls back to Russian). */
const EN_ASK = en.about?.ask ?? "";

/** A glyph's ink, from its outlines. */
function bounds(ch: string) {
  const pts = glyph(ch).parts.flatMap((c) => outline(c));
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

describe("the lettering", () => {
  it("winds every solid one way and every counter the other", () => {
    for (const ch of LETTERS) {
      const g = glyph(ch);
      const signs = g.parts.map((c) => Math.sign(area(c)));
      expect(signs.filter((s) => s > 0).length, ch).toBeGreaterThan(0);
      // A counter lies inside a solid: the letter's net area stays positive.
      expect(g.parts.reduce((a, c) => a + area(c), 0), ch).toBeGreaterThan(0);
    }
    expect(glyph("В").parts.filter((c) => area(c) < 0)).toHaveLength(2);
    expect(glyph("O").parts.filter((c) => area(c) < 0)).toHaveLength(1);
  });

  it("redraws the logo's К, А, Д, Е and Л to the trace's size", () => {
    const traced: [string, (typeof WORDMARK.dela)[number]][] = [
      ["К", WORDMARK.kak[0]],
      ["А", WORDMARK.dela[3]],
      ["Д", WORDMARK.dela[0]],
      ["Е", WORDMARK.dela[1]],
      ["Л", WORDMARK.dela[2]],
    ];
    for (const [ch, shape] of traced) {
      const b = bounds(ch);
      expect(b.x0, ch).toBeGreaterThanOrEqual(-0.5);
      expect(Math.abs(b.x1 - b.x0 - shape.box.w), ch).toBeLessThan(2.5);
      expect(Math.abs(b.y1 - b.y0 - shape.box.h), ch).toBeLessThan(2.5);
    }
    // Every letter stands on the baseline and reaches the cap line.
    for (const ch of LETTERS) {
      const b = bounds(ch);
      expect(b.y0, ch).toBeGreaterThan(-0.5);
      expect(b.y0, ch).toBeLessThan(0.5);
      expect(b.y1, ch).toBeGreaterThanOrEqual(CAP - 0.5);
    }
  });

  it("spaces «КАК» and «ДЕЛА» as the logo does", () => {
    for (const [word, shapes] of [
      ["КАК", WORDMARK.kak],
      ["ДЕЛА", WORDMARK.dela.slice(0, 4)],
    ] as const) {
      const { starts } = setLine(word);
      shapes.forEach((s, i) => expect(Math.abs(starts[i] - (s.box.x - shapes[0].box.x)), `${word} ${i}`).toBeLessThan(1.5));
    }
  });

  it("sets each build's question on two lines, the second ending where the «?» stands", () => {
    const a = letterAsk(ru.about.ask);
    expect(a.lines.map((l) => l.text.toUpperCase())).toEqual(["А У ВАС", "КАК ДЕЛА"]);
    expect(EN_ASK).toBe("And how are you?");
    const b = letterAsk(EN_ASK);
    expect(b.lines.map((l) => l.text.toUpperCase())).toEqual(["AND HOW", "ARE YOU"]);
    for (const l of [...a.lines, ...b.lines]) expect(l.d).not.toMatch(/NaN|Infinity/);
    // Set on one line, the two lines are the question set whole.
    for (const [ask, l] of [
      [ru.about.ask, a],
      [EN_ASK, b],
    ] as const) {
      const whole = setLine(ask.replace(/[?\s]+$/u, ""));
      expect(whole.w, ask).toBeCloseTo(l.lines[0].w + l.join + l.lines[1].w, 6);
    }
  });

  it("measures the question as sign.ts has it (the stylesheet's numbers)", () => {
    expect(CAPS.height).toBe(CAP);
    for (const [ask, want] of [
      [ru.about.ask, ASKS.ru],
      [EN_ASK, ASKS.en],
    ] as const) {
      const l = letterAsk(ask);
      expect(want.lines[0], ask).toBeCloseTo(l.lines[0].w / CAP, 3);
      expect(want.lines[1], ask).toBeCloseTo(l.lines[1].w / CAP, 3);
      expect(want.qGap, ask).toBeCloseTo(l.qGap / CAP, 3);
      expect(want.join, ask).toBeCloseTo(l.join / CAP, 3);
    }
  });
});
