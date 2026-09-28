import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkNote, contactKind, EMPTY_NOTE, readNote, TEXT_MAX, TONES } from "./feedback";
import { LOOP_BOX, penLoop } from "./loop";
import { tornSheet } from "./tear";
import { cafes } from "@/content/cafes";
import { cafeReply, faq, noTone, toneById, tones } from "@/content/feedback";
import { routes } from "@/content/routes";
import { ru } from "@/i18n/ru";

const CAFE_IDS = new Set(cafes.map((c) => c.id));
const form = (fields: Record<string, string>) => (key: string) => fields[key] ?? null;

describe("the note's contact", () => {
  it("reads phones, emails and Telegram names", () => {
    expect(contactKind("+7 (928) 082-61-11")).toBe("phone");
    expect(contactKind("89280826111")).toBe("phone");
    expect(contactKind("anna@mail.ru")).toBe("email");
  });
  it("recognises a Telegram name only to explain that the café can't answer there", () => {
    expect(contactKind("@anna_k")).toBe("telegram");
    expect(contactKind("t.me/anna_k")).toBe("telegram");
    expect(contactKind("https://t.me/anna_k/")).toBe("telegram");
    expect(checkNote({ ...EMPTY_NOTE, text: "Вопрос", contact: "@anna_k", consent: true })).toEqual({ contact: "telegram" });
  });
  it("turns down an address with a list separator: a typo must not send the reply to a stranger", () => {
    expect(contactKind("anna,petr@mail.ru")).toBe("unclear");
    expect(contactKind("anna;petr@mail.ru")).toBe("unclear");
    expect(contactKind("<anna@mail.ru>")).toBe("unclear");
    expect(contactKind("anna.petrova+kd@yandex.ru")).toBe("email");
  });
  it("leaves an empty contact alone and flags what can't be answered", () => {
    expect(contactKind("")).toBeNull();
    expect(contactKind("   ")).toBeNull();
    expect(contactKind("не знаю")).toBe("unclear");
    expect(contactKind("12345")).toBe("unclear");
    expect(contactKind("@abc")).toBe("unclear");
    expect(contactKind(`${"a".repeat(130)}@mail.ru`)).toBe("unclear");
  });
});

describe("reading and checking a note", () => {
  it("keeps only known tones and cafés, and tidies the text", () => {
    const note = readNote(form({ tone: "shik", cafe: "lenina-32", text: "  Спасибо!\r\nВсё было вкусно.  ", name: "  Анна   К. ", contact: " anna@mail.ru ", consent: "yes" }), CAFE_IDS);
    expect(note).toEqual({ tone: "shik", cafe: "lenina-32", text: "Спасибо!\nВсё было вкусно.", name: "Анна К.", contact: "anna@mail.ru", consent: true });
    const odd = readNote(form({ tone: "<script>", cafe: "moscow-1", text: "Да" }), CAFE_IDS);
    expect(odd.tone).toBeNull();
    expect(odd.cafe).toBeNull();
    expect(readNote(() => null, CAFE_IDS)).toEqual(EMPTY_NOTE);
  });
  it("asks for words, and not too many", () => {
    const agreed = { ...EMPTY_NOTE, consent: true };
    expect(checkNote(agreed)).toEqual({ text: "empty" });
    expect(checkNote({ ...agreed, text: " . " })).toEqual({ text: "empty" });
    expect(checkNote({ ...agreed, text: "x".repeat(TEXT_MAX + 1) })).toEqual({ text: "long" });
    expect(checkNote({ ...agreed, text: "Всё шик" })).toEqual({});
  });
  it("sends back a contact that can't be answered", () => {
    expect(checkNote({ ...EMPTY_NOTE, text: "Вопрос", contact: "потом", consent: true })).toEqual({ contact: "unclear" });
    expect(checkNote({ ...EMPTY_NOTE, text: "Вопрос", contact: "anna@mail.ru", consent: true })).toEqual({});
  });
  it("never lets a note go without the guest's own consent", () => {
    expect(checkNote({ ...EMPTY_NOTE, text: "Всё шик" })).toEqual({ consent: "missing" });
    // Only the box's own value counts: a forged or missing field is no consent.
    for (const v of [null, "", "on", "true", "да", "YES"]) {
      expect(readNote(form({ text: "Всё шик", ...(v === null ? {} : { consent: v }) }), CAFE_IDS).consent).toBe(false);
    }
    expect(readNote(form({ text: "Всё шик", consent: "yes" }), CAFE_IDS).consent).toBe(true);
  });
});

describe("the café's side", () => {
  it("has a line, a question and a reply for every tone, in the notice's words", () => {
    expect(tones.map((x) => x.id)).toEqual([...TONES]);
    for (const tone of tones) {
      expect(tone.ask.endsWith("?")).toBe(true);
      expect(tone.line.length).toBeGreaterThan(10);
      expect(tone.reply("Ленина, 32").length).toBeGreaterThan(10);
    }
    expect(toneById["tak-sebe"].label).toBe("Так себе");
  });
  it("replies with the café's street and how it will answer", () => {
    expect(cafeReply({ tone: "shik" }, "Байсултанова, 1", "email")).toBe(
      "Спасибо! Передадим команде на Байсултанова, 1: им будет приятно. Ответим на почту.",
    );
    expect(cafeReply({ tone: "ideya" }, null, null)).toBe("Спасибо, записали. Обсудим идею с командой.");
    expect(cafeReply({ tone: null }, null, "phone")).toBe(`${noTone.reply} Ответим по телефону.`);
  });
  it("says so when a complaint or a question leaves no way to answer", () => {
    expect(cafeReply({ tone: "vopros" }, null, null)).toBe(`Спасибо за вопрос. ${ru.feedback.noContact}`);
    expect(cafeReply({ tone: "tak-sebe" }, "Лермонтова, 4", null)).toContain(ru.feedback.noContact);
    expect(cafeReply({ tone: "shik" }, null, null)).not.toContain(ru.feedback.noContact);
  });
  it("answers only with links to real pages", () => {
    for (const item of faq) {
      if (item.link && "to" in item.link) expect(Object.hasOwn(routes, item.link.to)).toBe(true);
      expect(item.q.trim()).toBe(item.q);
    }
    expect(routes.feedback).toEqual({ href: "/feedback", status: "live" });
  });
});

describe("paper and pen", () => {
  it("draws the same loop for the same option, a different one for another", () => {
    expect(penLoop("shik")).toBe(penLoop("shik"));
    expect(penLoop("shik")).not.toBe(penLoop("ideya"));
  });
  it("draws one smooth stroke round the box, a little past where it began", () => {
    for (const seed of [...TONES, ...cafes.map((c) => c.id)]) {
      const d = penLoop(seed);
      expect(d).toMatch(/^M[\d.-]+ [\d.-]+(C[\d.-]+ [\d.-]+ [\d.-]+ [\d.-]+ [\d.-]+ [\d.-]+)+$/);
      const nums = d.match(/-?[\d.]+/g)!.map(Number);
      expect(nums.every(Number.isFinite)).toBe(true);
      const xs = nums.filter((_, i) => i % 2 === 0);
      const ys = nums.filter((_, i) => i % 2 === 1);
      // Round the word: it reaches both ends of the box, and never far past them.
      expect(Math.min(...xs)).toBeLessThan(8);
      expect(Math.max(...xs)).toBeGreaterThan(LOOP_BOX.w - 8);
      expect(Math.min(...xs)).toBeGreaterThan(-8);
      expect(Math.max(...xs)).toBeLessThan(LOOP_BOX.w + 8);
      expect(Math.min(...ys)).toBeGreaterThan(-6);
      expect(Math.max(...ys)).toBeLessThan(LOOP_BOX.h + 6);
      // The ends never meet: the pen runs on past its start, on the outside.
      const [x0, y0] = [nums[0], nums[1]];
      const [x1, y1] = nums.slice(-2);
      expect(Math.hypot(x1 - x0, y1 - y0)).toBeGreaterThan(2);
    }
  });
  it("leaves a stub on the pad that fits the note's own rip", () => {
    const { clip, stub } = tornSheet("a-note");
    const rip = [...clip.matchAll(/([\d.]+)% ([\d.]+)em/g)].map((m) => `${m[1]}% ${m[2]}em`);
    const kept = [...stub.matchAll(/([\d.]+)% ([\d.]+)em/g)].map((m) => `${m[1]}% ${m[2]}em`);
    expect(stub.startsWith("polygon(0% 0%, 100% 0%, ")).toBe(true);
    expect(kept).toEqual([...rip].reverse());
  });
  it("gives every loop room in the stylesheet, and every error its words", () => {
    const css = readFileSync(new URL("../styles/sections/feedback.css", import.meta.url), "utf8");
    expect(css).toContain(".fb-opt__input:checked ~ .fb-loop path");
    expect(css).toContain(".fb-opt[data-on] .fb-loop path");
    for (const key of ["empty", "long", "unclear", "failed"] as const) expect(ru.feedback.errors[key].length).toBeGreaterThan(5);
  });
});
