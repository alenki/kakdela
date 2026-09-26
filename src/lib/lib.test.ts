import { describe, expect, it } from "vitest";
import { hhmm, isOpen, minutesInMoscow, minutesUntilOpen, pickByHour, toMinutes } from "./time";
import { haversineKm, project } from "./geo";
import { groupDigits, km, plural, rub, rubSpoken } from "./format";
import { bindLastWord, keepLastSentence, NBSP, NNBSP, typograf } from "./typograf";
import { tornEdge } from "./tear";
import { mulberry32 } from "./seed";
import { cafes } from "@/content/cafes";
import { answers } from "@/content/answers";
import { breakfasts } from "@/content/menu";
import { ru } from "@/i18n/ru";

const midnightClose = { open: "07:30", close: "00:00" as const };
const elevenClose = { open: "07:30", close: "23:00" as const };

describe("time", () => {
  it("treats a 00:00 close as the end of the day", () => {
    expect(toMinutes("00:00", true)).toBe(1440);
    expect(isOpen(midnightClose, 23 * 60 + 59)).toBe(true);
    expect(isOpen(midnightClose, 0)).toBe(false);
  });
  it("opens exactly at 07:30", () => {
    expect(isOpen(midnightClose, 7 * 60 + 29)).toBe(false);
    expect(isOpen(midnightClose, 7 * 60 + 30)).toBe(true);
  });
  it("closes at 23:00 for the early-closing cafés", () => {
    expect(isOpen(elevenClose, 22 * 60 + 59)).toBe(true);
    expect(isOpen(elevenClose, 23 * 60)).toBe(false);
  });
  it("counts minutes until opening across midnight", () => {
    expect(minutesUntilOpen(midnightClose, 0)).toBe(450);
    expect(minutesUntilOpen(elevenClose, 23 * 60 + 30)).toBe(30 + 450);
  });
  it("reads Moscow time regardless of the machine time zone", () => {
    // 2026-09-26T04:15:00Z is 07:15 in Moscow (UTC+3, no DST).
    expect(minutesInMoscow(new Date("2026-09-26T04:15:00Z"))).toBe(7 * 60 + 15);
    expect(minutesInMoscow(new Date("2026-09-26T21:05:00Z"))).toBe(5); // 00:05 next day
  });
  it("formats and picks dayparts", () => {
    expect(hhmm(7 * 60 + 5)).toBe("07:05");
    expect(pickByHour(ru.dayparts, 7 * 60 + 29).text).toMatch(/спим/);
    expect(pickByHour(ru.dayparts, 12 * 60).text).toMatch(/второго кофе/);
    expect(pickByHour(ru.dayparts, 23 * 60 + 59).text).toMatch(/последний капучино/);
  });
});

describe("geo", () => {
  it("measures Nalchik → Vladikavkaz at roughly 100 km", () => {
    const d = haversineKm(cafes[0].coords, cafes.find((c) => c.city === "vladikavkaz")!.coords);
    expect(d).toBeGreaterThan(85);
    expect(d).toBeLessThan(115);
  });
  it("projects points inside the box", () => {
    const pts = project(cafes.filter((c) => c.city === "nalchik").map((c) => c.coords), { w: 1000, h: 100, pad: 10 });
    for (const p of pts) {
      expect(p.x).toBeGreaterThanOrEqual(10 - 1e-6);
      expect(p.x).toBeLessThanOrEqual(990 + 1e-6);
      expect(p.y).toBeGreaterThanOrEqual(10 - 1e-6);
      expect(p.y).toBeLessThanOrEqual(90 + 1e-6);
    }
  });
});

describe("format", () => {
  it("formats rubles with no-break spaces", () => {
    expect(rub(670)).toBe("670 ₽");
    expect(rub(5000)).toBe("5 000 ₽");
    expect(groupDigits(2709)).toBe("2 709");
  });
  it("declines рубль correctly", () => {
    expect(plural(1, "рубль", "рубля", "рублей")).toBe("рубль");
    expect(plural(3, "рубль", "рубля", "рублей")).toBe("рубля");
    expect(plural(11, "рубль", "рубля", "рублей")).toBe("рублей");
    expect(rubSpoken(670)).toBe("670 рублей");
    expect(rubSpoken(21)).toBe("21 рубль");
  });
  it("formats kilometres Russian-style", () => {
    expect(km(1.24)).toBe("1,2");
    expect(km(12.6)).toBe("13");
  });
});

describe("typograf", () => {
  // «~» stands for a no-break space and «^» for a narrow one, so expectations stay readable.
  const show = (s: string) => s.replaceAll(NBSP, "~").replaceAll(NNBSP, "^");
  const ty = (s: string, level?: 1 | 2 | 3) => show(typograf(s, level));

  it("uses the real no-break code points", () => {
    expect(NBSP.codePointAt(0)).toBe(0xa0);
    expect(NNBSP.codePointAt(0)).toBe(0x202f);
    expect(NBSP.length + NNBSP.length).toBe(2);
  });
  it("holds one- and two-letter words and short prepositions to the next word", () => {
    expect(ty("Скрэмбл с креветками и свежая зелень")).toBe("Скрэмбл с~креветками и~свежая зелень");
    expect(ty("На вопрос «как дела?» у нас шесть ответов")).toBe("На~вопрос «как дела?» у~нас шесть ответов");
    expect(ty("авокадо под голландезом для вас")).toBe("авокадо под~голландезом для~вас");
    expect(ty("Отлично. А у вас?")).toBe("Отлично. А~у~вас?");
    expect(ty("«в пути»")).toBe("«в~пути»");
    // Only whole short words: «Эфиопия», «Шик» and «мини-панкейки» are left alone.
    expect(ty("новая Эфиопия, Шик и мини-панкейки")).toBe("новая Эфиопия, Шик и~мини-панкейки");
  });
  it("binds less at lower levels", () => {
    const s = "мороженым во всех кофейнях под соусом, и мы";
    expect(ty(s, 1)).toBe("мороженым во всех кофейнях под соусом, и~мы");
    expect(ty(s, 2)).toBe("мороженым во~всех кофейнях под соусом, и~мы");
    expect(ty(s)).toBe("мороженым во~всех кофейнях под~соусом, и~мы");
  });
  it("never starts a line with a dash or «·», and holds an opening dash to its word", () => {
    expect(ty("Дальше — слаще.")).toBe("Дальше~— слаще.");
    expect(ty("7:30 – 23:00 · каждый день")).toBe("7:30~– 23:00~· каждый день");
    expect(ty("— А домой привезёте?")).toBe("—~А~домой привезёте?");
    expect(ty("цены —")).toBe("цены~—");
  });
  it("keeps particles with the word before", () => {
    expect(ty("Так же, как было бы.")).toBe("Так~же, как было~бы.");
    expect(ty("Успеете ли?")).toBe("Успеете~ли?");
  });
  it("keeps addresses together", () => {
    expect(ty("пр. Шогенцукова, 19")).toBe("пр.~Шогенцукова,~19");
    expect(ty("ул. Байсултанова, 1")).toBe("ул.~Байсултанова,~1");
    // A comma between numbers is not an address: «5,0» and «4,8, 5,0» stay as they are.
    expect(ty("от 4,8, 5,0")).toBe("от~4,8, 5,0");
  });
  it("keeps numbers whole and with their units", () => {
    expect(ty("2 709 оценок на Яндекс Картах")).toBe("2^709 оценок на~Яндекс Картах");
    expect(ty("1 234 567")).toBe("1^234^567");
    expect(ty("сертификат на 5 000 ₽.")).toBe("сертификат на~5^000~₽.");
    expect(ty("50 м, 1,4 км, 320 ккал, 10 %")).toBe("50~м, 1,4~км, 320~ккал, 10~%");
    // Not units: a longer word that starts like one, or the preposition «с».
    expect(ty("с 2023 года, 1 сентября, 5 с сахаром")).toBe("с~2023 года, 1 сентября, 5 с~сахаром");
    expect(ty("10 из 10")).toBe("10 из~10");
  });
  it("leaves «ёлочки», words and punctuation untouched: only spaces change", () => {
    const samples = [
      "Отличное место для всей семьи, яркий интерьер, уютно… Заказали «Лучше всех» и «Как в сказке»…",
      "Каждая приятная встреча начинается с фразы «как дела?» — и мы хотели",
      '"straight" quotes and «ёлочки» „лапки“ stay as typed',
      "Несколько туров, партия — до десяти минут. Победителю — сертификат на 5 000 ₽.",
    ];
    const bare = (s: string) => s.replace(/\s+/g, " "); // \s covers both no-break spaces
    for (const s of samples) {
      const out = typograf(s);
      expect(bare(out)).toBe(bare(s));
      expect(out.length).toBe(s.length);
      expect(out.match(/[«»„“"]/g)).toEqual(s.match(/[«»„“"]/g));
      expect(typograf(out)).toBe(out); // idempotent
    }
  });
  it("keeps the brand phrase intact in the team lead (Team lifts it by exact match)", () => {
    const lead = typograf(ru.team.lead);
    const at = lead.indexOf(`«${ru.team.phrase}»`);
    expect(at).toBeGreaterThan(-1);
    expect(lead.startsWith(`${NBSP}—`, at + ru.team.phrase.length + 2)).toBe(true);
  });
  it("binds the last word and the last sentence", () => {
    expect(show(bindLastWord("Бариста варят достойный эспрессо."))).toBe("Бариста варят достойный~эспрессо.");
    expect(show(keepLastSentence("Блиц. До десяти минут."))).toBe("Блиц. До~десяти~минут.");
    expect(show(keepLastSentence("Без точки"))).toBe("Без точки");
  });
});

describe("i18n (ru)", () => {
  it("declines counts through format.plural", () => {
    expect(ru.locations.cafesCount(1)).toBe("1 кофейня");
    expect(ru.locations.cafesCount(2)).toBe("2 кофейни");
    expect(ru.locations.cafesCount(7)).toBe("7 кофеен");
    expect(ru.hero.cities(cafes.length)).toBe("Нальчик · Владикавказ — 9 кофеен");
    expect(ru.locations.rating(5, 626)).toBe("5,0 · 626 оценок");
    expect(ru.locations.rating(4.8, 1234)).toBe(`4,8 · 1${NNBSP}234 оценки`);
    expect(ru.locations.rating(4.9, 21)).toBe("4,9 · 21 оценка");
  });
  it("keeps the unit with its number in distances", () => {
    expect(ru.locations.metres(50)).toBe(`50${NBSP}м`);
    expect(ru.locations.km("1,4")).toBe(`1,4${NBSP}км`);
    expect(ru.locations.nearestTagMetres(800)).toBe(`ближе всех · 800${NBSP}м`);
  });
});

describe("determinism (server and client must agree)", () => {
  it("tears the same edge for the same tab", () => {
    expect(tornEdge("sonno")).toEqual(tornEdge("sonno"));
    expect(tornEdge("sonno")).not.toEqual(tornEdge("normalno"));
  });
  it("seeds the same sequence", () => {
    const a = mulberry32(7), b = mulberry32(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe("content integrity", () => {
  it("has eight answers, each pointing at a real priced item", () => {
    expect(answers).toHaveLength(8);
    for (const a of answers) {
      expect(a.item.price.nalchik).not.toBeNull();
      expect(a.reply.length).toBeGreaterThan(10);
    }
    expect(new Set(answers.map((a) => a.id)).size).toBe(8);
  });
  it("lists six breakfasts and nine cafés (7 + 2)", () => {
    expect(breakfasts).toHaveLength(6);
    expect(cafes.filter((c) => c.city === "nalchik")).toHaveLength(7);
    expect(cafes.filter((c) => c.city === "vladikavkaz")).toHaveLength(2);
    for (const c of cafes) expect(c.phone).toMatch(/^\+7\d{10}$/);
  });
});
