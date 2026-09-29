import { afterAll, describe, expect, it, vi } from "vitest";
import { ru } from "./ru";
import { en } from "./en";
import { mergeDictionary } from "./index";
import { answersEn, cafesEn, feedbackEn, fullMenuEn, menuEn, peopleEn, photosEn, privacyEn } from "@/content/en";
import { answers } from "@/content/answers";
import { cafes } from "@/content/cafes";
import { breakfasts, desserts, signatureDrinks } from "@/content/menu";
import { reviews, team } from "@/content/people";
import { photos } from "@/content/photos";
import { faq, tones } from "@/content/feedback";
import { consent, policy } from "@/content/privacy";

// The English build (src/i18n/locale.ts): every Russian string has its English twin, and the English words
// keep the house rules. When this fails after a ru.ts change, add the twin to en.ts.

type Tree = Record<string, unknown>;
const isTree = (v: unknown): v is Tree => typeof v === "object" && v !== null && !Array.isArray(v);

/** Dotted paths of the leaves (a string, a number, a list or a function counts as one leaf). */
function leaves(v: unknown, at = ""): string[] {
  if (!isTree(v)) return [at];
  return Object.entries(v).flatMap(([k, x]) => leaves(x, at ? `${at}.${k}` : k));
}
const get = (v: unknown, path: string) => path.split(".").reduce<unknown>((o, k) => (isTree(o) ? o[k] : undefined), v);

/** Every string in a value, lists and objects included (functions are skipped). */
function strings(v: unknown): string[] {
  if (typeof v === "string") return [v];
  if (Array.isArray(v)) return v.flatMap(strings);
  if (isTree(v)) return Object.values(v).flatMap(strings);
  return [];
}

// Leaves that are data, not words: the same in both languages, so en.ts leaves them to ru.ts.
const DATA = new Set(["city.count.nalchik", "city.count.vladikavkaz"]);

describe("en.ts", () => {
  it("has every key ru.ts has", () => {
    const missing = leaves(ru).filter((p) => !DATA.has(p) && get(en, p) === undefined);
    expect(missing).toEqual([]);
  });

  it("has no key ru.ts lacks", () => {
    expect(leaves(en).filter((p) => get(ru, p) === undefined)).toEqual([]);
  });

  it("keeps each function's arguments", () => {
    const off = leaves(ru).filter((p) => {
      const a = get(ru, p);
      const b = get(en, p);
      return typeof a === "function" && typeof b === "function" && a.length !== b.length;
    });
    expect(off).toEqual([]);
  });

  it("merges over ru.ts key by key", () => {
    const t = mergeDictionary(ru, en);
    expect(t.hero.q).toBe("How are you?");
    expect(t.city.count).toEqual(ru.city.count);
    expect(t.locations.cafesCount(1)).toBe("1 café");
  });
});

const ALL_EN = [en, answersEn, menuEn, cafesEn, peopleEn, feedbackEn, photosEn, privacyEn, fullMenuEn];

describe("English words", () => {
  it("are English, with no em dashes or Russian quotes", () => {
    const bad = ALL_EN.flatMap(strings).filter((s) => /[а-яё—«»]/i.test(s));
    expect(bad).toEqual([]);
  });

  it("cover every answer, café, dish, person, photo, tone, question and clause", () => {
    const ids = (list: { id: string }[]) => list.map((x) => x.id).sort();
    expect(Object.keys(answersEn).sort()).toEqual(ids(answers));
    expect(Object.keys(cafesEn).sort()).toEqual(ids(cafes));
    expect(Object.keys(menuEn.breakfasts).sort()).toEqual(ids(breakfasts));
    expect(Object.keys(menuEn.signatureDrinks).sort()).toEqual(ids(signatureDrinks));
    expect(Object.keys(menuEn.desserts).sort()).toEqual(ids(desserts));
    expect(Object.keys(peopleEn.reviews).sort()).toEqual(ids(reviews));
    expect(Object.keys(peopleEn.team).sort()).toEqual(ids(team));
    expect(Object.keys(photosEn).sort()).toEqual(Object.keys(photos).sort());
    expect(Object.keys(feedbackEn.tones).sort()).toEqual(ids(tones));
    expect(Object.keys(feedbackEn.faq).sort()).toEqual(ids(faq));
    expect(Object.keys(privacyEn.policy).sort()).toEqual(ids(policy));
    expect(Object.keys(privacyEn.consent).sort()).toEqual(ids(consent));
  });

  it("give each café as many tags as in Russian", () => {
    for (const c of cafes) expect(cafesEn[c.id as keyof typeof cafesEn].tags.length).toBe(c.tags.length);
  });

  it("keep the tabs within «Как в сказке» (12 characters)", () => {
    for (const a of Object.values(answersEn)) expect(a.label.length).toBeLessThanOrEqual(12);
  });

  it("say each question's short answer in three words at most, and link inside the answer where Russian does", () => {
    for (const q of faq) {
      const e = feedbackEn.faq[q.id as keyof typeof feedbackEn.faq];
      expect(e.short.split(/\s+/).length).toBeLessThanOrEqual(3);
      if (q.link && q.a.includes(q.link.label) && "link" in e) expect(e.a).toContain(e.link.label);
    }
  });
});

describe("The English /menu", () => {
  afterAll(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  // Loaded as the English build loads it, so the homepage dishes' words (menu.ts's overlay) count too. An id
  // the overlay no longer finds throws on import.
  it("shows no Russian: every chapter, category, name and description has its English words", async () => {
    vi.stubEnv("NEXT_PUBLIC_LOCALE", "en");
    vi.resetModules();
    const { fullMenu } = await import("@/content/full-menu");
    const shown = fullMenu.flatMap((ch) => [
      ch.title,
      ...ch.categories.flatMap((c) => [
        c.title,
        ...c.items.flatMap((i) => [i.name, i.desc ?? "", ...Object.values(i.descByCity ?? {})]),
      ]),
    ]);
    expect(shown.filter((s) => /[а-яё]/i.test(s))).toEqual([]);
  });
});
