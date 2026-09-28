import { describe, expect, it } from "vitest";
import { signatureDrinks } from "@/content/menu";
import type { Drink } from "@/content/types";
import { groupDigits } from "@/lib/format";
import { NBSP } from "@/lib/typograf";
import { ru } from "@/i18n/ru";
import { NOTE, noteLines, notePrice, noteSlant, penStroke, type LineBox } from "./note";

/** The points of a path of M and Q commands, sampled finely along each arc. */
function sample(d: string): [number, number][] {
  const n = d.match(/-?\d+(\.\d+)?/g)!.map(Number);
  const pts: [number, number][] = [];
  let [x, y] = [n[0], n[1]];
  for (let i = 2; i + 3 < n.length; i += 4) {
    const [cx, cy, ex, ey] = n.slice(i, i + 4);
    for (let k = 0; k <= 40; k++) {
      const t = k / 40;
      const u = 1 - t;
      pts.push([u * u * x + 2 * u * t * cx + t * t * ex, u * u * y + 2 * u * t * cy + t * t * ey]);
    }
    [x, y] = [ex, ey];
  }
  return pts;
}

describe("coffee: the barista's notes", () => {
  it("writes the small cup's price, held to the name", () => {
    const cap = signatureDrinks.find((d) => d.id === "kapuchino")!;
    expect(noteLines(cap, "nalchik")).toEqual(["классика?", `капучино${NBSP}240`]);
    expect(notePrice({ sizes: [240, 270] }, "vladikavkaz")).toBe(240);
  });

  it("follows the city, groups digits and never invents a price", () => {
    const d: Drink = {
      id: "t",
      name: "Т",
      price: { nalchik: 1200, vladikavkaz: null },
      cupNote: { ask: "проверка?", say: "тест" },
    };
    expect(noteLines(d, "nalchik")).toEqual(["проверка?", `тест${NBSP}1${NBSP}200`]);
    expect(noteLines(d, "vladikavkaz")).toEqual(["проверка?", "тест"]);
    expect(noteLines({ ...d, cupNote: undefined }, "nalchik")).toBeNull();
  });

  it("gives every signature drink a question and its own menu price, with no dashes", () => {
    expect(signatureDrinks).toHaveLength(6);
    for (const d of signatureDrinks) {
      for (const city of ["nalchik", "vladikavkaz"] as const) {
        const lines = noteLines(d, city);
        expect(lines, d.id).not.toBeNull();
        const [ask, say] = lines!;
        expect(ask, d.id).toMatch(/\?$/);
        expect(`${ask} ${say}`, d.id).not.toMatch(/[\u2014\u2013]/);
        const v = notePrice(d.price, city);
        if (v != null) expect(say.endsWith(`${NBSP}${groupDigits(v)}`), d.id).toBe(true);
      }
    }
  });

  it("draws a pen stroke that inks the whole line in, from its first letter to its last", () => {
    // Neucha's text boxes on the sleeve: the question, the answer, «как дела?».
    const boxes: [LineBox, number][] = [
      [{ x: 96, y: 289, width: 108, height: 30 }, 24],
      [{ x: 75, y: 320, width: 151, height: 26 }, 21],
      [{ x: 93, y: 301, width: 114, height: 32.5 }, 26],
    ];
    for (const [box, size] of boxes) {
      const { d, width } = penStroke(box, size, 7);
      const pts = sample(d);
      // It starts before the first letter and ends after the last, running left to right.
      expect(pts[0][0]).toBeLessThan(box.x);
      expect(pts[pts.length - 1][0]).toBeGreaterThan(box.x + box.width);
      // Finished, the nib has covered the line's ink band (the box, less the font's empty top).
      for (let x = box.x; x <= box.x + box.width; x += 1.5) {
        for (let y = box.y + box.height * 0.12; y <= box.y + box.height * 0.96; y += 1.5) {
          const near = Math.min(...pts.map(([px, py]) => Math.hypot(px - x, py - y)));
          expect(near, `${x},${y}`).toBeLessThanOrEqual(width / 2);
        }
      }
    }
    // The same line in the same hand draws the same stroke.
    expect(penStroke(boxes[0][0], 24, 7)).toEqual(penStroke(boxes[0][0], 24, 7));
  });

  it("sets each drink's note in its own slant, the same every time; «как дела?» as the server drew it", () => {
    expect(noteSlant([ru.coffee.defaultNote, ""])).toEqual({ rotate: NOTE.rotate, dx: 0 });
    const slants = signatureDrinks.map((d) => noteSlant(noteLines(d, "nalchik")!));
    for (const s of slants) {
      expect(Math.abs(s.rotate - NOTE.rotate)).toBeLessThanOrEqual(1.3);
      expect(Math.abs(s.dx)).toBeLessThanOrEqual(3);
    }
    expect(new Set(slants.map((s) => s.rotate)).size).toBeGreaterThan(1);
    // A city switch changes the price, never the hand.
    for (const d of signatureDrinks) expect(noteSlant(noteLines(d, "vladikavkaz")!)).toEqual(noteSlant(noteLines(d, "nalchik")!));
  });

  it("keeps the coffee copy free of em dashes", () => {
    const c = ru.coffee;
    for (const s of [c.ask, c.a, c.lead, c.listTitle, c.defaultNote, ...Object.values(c.links)]) {
      expect(s).not.toMatch(/\u2014/);
    }
  });
});
