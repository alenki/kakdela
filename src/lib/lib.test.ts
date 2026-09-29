import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { isOpen, minutesInMoscow, pickByHour, toMinutes } from "./time";
import { haversineKm } from "./geo";
import { groupDigits, km, plural, rub, rubSpoken } from "./format";
import { bindLastWord, keepWhole, NBSP, quote, typograf, WJ } from "./typograf";
import { ripClip, rollRip, tornEdge, tornSheet, tornStrip } from "./tear";
import { mulberry32 } from "./seed";
import { cafes } from "@/content/cafes";
import { answerById, answers } from "@/content/answers";
import { breakfasts } from "@/content/menu";
import { reviews, team } from "@/content/people";
import { ru } from "@/i18n/ru";
import { HEAD_SCRIPT } from "./head-script";

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
  it("reads Moscow time regardless of the machine time zone", () => {
    // 2026-09-26T04:15:00Z is 07:15 in Moscow (UTC+3, no DST).
    expect(minutesInMoscow(new Date("2026-09-26T04:15:00Z"))).toBe(7 * 60 + 15);
    expect(minutesInMoscow(new Date("2026-09-26T21:05:00Z"))).toBe(5); // 00:05 next day
  });
  it("picks dayparts", () => {
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
});

describe("format", () => {
  it("formats rubles with no-break spaces", () => {
    expect(rub(670)).toBe(`670${NBSP}₽`);
    expect(rub(5000)).toBe(`5${NBSP}000${NBSP}₽`);
    // Digit groups take the plain no-break space: Montserrat's narrow one (U+202F) reads as «2709» at label size.
    expect(groupDigits(2709)).toBe(`2${NBSP}709`);
    expect(groupDigits(1234567)).toBe(`1${NBSP}234${NBSP}567`);
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
  // «~» stands for a no-break space and «^» for a word joiner, so expectations stay readable.
  const show = (s: string) => s.replaceAll(NBSP, "~").replaceAll(WJ, "^");
  const ty = (s: string, level?: 1 | 2 | 3) => show(typograf(s, level));

  it("uses the real no-break code points", () => {
    expect(NBSP.codePointAt(0)).toBe(0xa0);
    expect(WJ.codePointAt(0)).toBe(0x2060);
    expect(NBSP.length + WJ.length).toBe(2);
  });
  it("holds one- and two-letter words and short prepositions to the next word", () => {
    expect(ty("Скрэмбл с креветками и свежая зелень")).toBe("Скрэмбл с~креветками и~свежая зелень");
    expect(ty("На вопрос «как дела?» у нас шесть ответов")).toBe("На~вопрос «как~дела?» у~нас шесть ответов");
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
    // The site has no dashes; these guard copy that might add one later (U+2014, U+2013).
    const EM = "\u2014", EN = "\u2013";
    expect(ty(`Дальше ${EM} слаще.`)).toBe(`Дальше~${EM} слаще.`);
    expect(ty(`7:30 ${EN} 23:00 · каждый день`)).toBe(`7:30~${EN} 23:00~· каждый день`);
    expect(ty(`${EM} А домой привезёте?`)).toBe(`${EM}~А~домой привезёте?`);
    expect(ty(`цены ${EM}`)).toBe(`цены~${EM}`);
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
    expect(ty("2 709 оценок на Яндекс Картах")).toBe("2~709 оценок на~Яндекс Картах");
    expect(ty("1 234 567")).toBe("1~234~567");
    expect(ty("сертификат на 5 000 ₽.")).toBe("сертификат на~5~000~₽.");
    expect(ty("50 м, 1,4 км, 320 ккал, 10 %")).toBe("50~м, 1,4~км, 320~ккал, 10~%");
    // Not units: a longer word that starts like one, or the preposition «с».
    expect(ty("с 2023 года, 1 сентября, 5 с сахаром")).toBe("с~2023 года, 1 сентября, 5 с~сахаром");
    expect(ty("10 из 10")).toBe("10 из~10");
  });
  it("leaves «ёлочки», words and punctuation untouched: only spaces change", () => {
    const samples = [
      "Отличное место для всей семьи, яркий интерьер, уютно… Заказали «Лучше всех» и «Как в сказке»…",
      "Каждая приятная встреча начинается с фразы «как дела?». И мы хотели",
      '"straight" quotes and «ёлочки» „лапки“ stay as typed',
      "Несколько туров, партия до десяти минут. Победитель получает сертификат на 5 000 ₽.",
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
  it("keeps the brand's «как дела?» on one line, wherever it appears", () => {
    expect(ty("Здесь помнят, какой кофе я пью, и спрашивают, как дела.")).toBe("Здесь помнят, какой кофе я~пью, и~спрашивают, как~дела.");
    // Not «как делать», not «никак дела».
    expect(ty("как делать")).toBe("как делать");
    expect(ty("никак дела")).toBe("никак дела");
    // The team lead: the phrase whole.
    expect(ty(ru.team.lead)).toContain("«как~дела?»");
  });
  it("keeps names whole: hyphenated words and names in «ёлочки»", () => {
    expect(show(keepWhole("Эспрессо-тоник и мини-панкейки"))).toBe("Эспрессо-^тоник и мини-^панкейки");
    expect(show(keepWhole("Заказали «Как в сказке» и «Лучше всех»"))).toBe("Заказали «Как~в~сказке» и «Лучше~всех»");
    // Not a hyphen between numbers, not a long quotation.
    expect(show(keepWhole("10-15 минут"))).toBe("10-15 минут");
    const long = "«это очень длинная цитата, которую можно переносить»";
    expect(keepWhole(long)).toBe(long);
    const once = keepWhole(typograf("Эспрессо-тоник «Как в сказке»"));
    expect(keepWhole(once)).toBe(once); // idempotent
    // The English site's names, and never Russian nested quotes („…“ closes on “, which never opens one here).
    expect(show(keepWhole("Have a “Sweeter Still” with the “Never Better”"))).toBe("Have a “Sweeter~Still” with the “Never~Better”");
    const nested = "Взяли „Лучше всех“ и кофе „Клевер“ с собой";
    expect(keepWhole(nested)).toBe(nested);
  });
  it("binds the last word", () => {
    expect(show(bindLastWord("Бариста варят достойный эспрессо."))).toBe("Бариста варят достойный~эспрессо.");
  });
  it("sets a guest's words in «ёлочки», a name inside in „лапках“, and keeps that name whole", () => {
    expect(quote("Заказали «Лучше всех»")).toBe("«Заказали „Лучше всех“»");
    const said = (s: string) => show(quote(bindLastWord(keepWhole(typograf(s)))));
    expect(said("Заказали «Лучше всех» и «Как в сказке»… Бариста варят достойный эспрессо.")).toBe(
      "«Заказали „Лучше~всех“ и~„Как~в~сказке“… Бариста варят достойный~эспрессо.»",
    );
    // quote() goes last: a short quotation still breaks between its words.
    expect(said("Уютно, вкусно, тепло")).toBe("«Уютно, вкусно,~тепло»");
  });
});

describe("i18n (ru)", () => {
  it("declines counts through format.plural", () => {
    expect(ru.locations.cafesCount(1)).toBe("1 кофейня");
    expect(ru.locations.cafesCount(2)).toBe("2 кофейни");
    expect(ru.locations.cafesCount(7)).toBe("7 кофеен");
    expect(ru.locations.cafesCount(cafes.length)).toBe("9 кофеен");
  });
  it("keeps the unit with its number in distances", () => {
    expect(ru.locations.metres(50)).toBe(`50${NBSP}м`);
    expect(ru.locations.km("1,4")).toBe(`1,4${NBSP}км`);
    expect(ru.locations.nearestTagMetres(800)).toBe(`ближе всех · 800${NBSP}м`);
  });
  it("reads out the note on top of the reviews' pile, and whose 5,0 the slip is", () => {
    expect(ru.reviews.shown(2, 3, "Уютно.")).toBe("Отзыв 2 из 3: Уютно.");
    expect(ru.reviews.rating("Байсултанова, 1", "5,0")).toBe("Байсултанова, 1: 5,0 на Яндекс Картах");
  });
});

describe("determinism (server and client must agree)", () => {
  it("tears the same edge for the same tab", () => {
    expect(tornEdge("sonno")).toEqual(tornEdge("sonno"));
    expect(tornEdge("sonno")).not.toEqual(tornEdge("normalno"));
  });
  it("lands the same strip for the same tab, its tear clear of the word", () => {
    expect(tornStrip("sonno")).toEqual(tornStrip("sonno"));
    expect(tornStrip("sonno").clip).not.toEqual(tornStrip("normalno").clip);
    const depths = (polygon: string) => [...polygon.matchAll(/100% - ([\d.]+)em/g)].map((m) => Number(m[1]));
    for (const a of answers) {
      const { clip, fibres, tilt } = tornStrip(a.id);
      const paper = depths(clip), fringe = depths(fibres);
      // brand.css pads the strip's right end by 0.62em: the rip never reaches the letters, and the
      // fringe stays inside the strip's box.
      expect(paper).toHaveLength(10);
      expect(Math.max(...paper)).toBeLessThan(0.45);
      expect(fringe).toHaveLength(28);
      expect(Math.min(...fringe)).toBeGreaterThan(0.1);
      // Every third nick sits on a jag, a little proud of the paper.
      paper.forEach((d, i) => expect(fringe[i * 3]).toBeLessThan(d));
      expect(tilt).toBeGreaterThanOrEqual(1.2);
      expect(tilt).toBeLessThanOrEqual(2.8);
    }
  });
  it("tears the same sheet for the same review, its rip clear of the words", () => {
    expect(tornSheet("elbrus")).toEqual(tornSheet("elbrus"));
    expect(tornSheet("elbrus").clip).not.toEqual(tornSheet("warmth").clip);
    const depths = (polygon: string) => [...polygon.matchAll(/% ([\d.]+)em/g)].map((m) => Number(m[1]));
    for (const r of reviews) {
      const { clip, fibres, lean } = tornSheet(r.id);
      const paper = depths(clip), fringe = depths(fibres);
      // reviews.css pads the note's top by 1.7em: the rip never reaches the words, and the fringe stays
      // inside the note's box.
      expect(paper).toHaveLength(27);
      expect(Math.max(...paper)).toBeLessThan(0.5);
      expect(fringe).toHaveLength(79);
      expect(Math.min(...fringe)).toBeGreaterThan(0.1);
      // Every third nick sits over a jag, a little proud of the paper.
      paper.forEach((d, i) => expect(fringe[i * 3]).toBeLessThan(d));
      expect(Math.abs(lean)).toBeLessThanOrEqual(0.8);
    }
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
  it("answers the team from the notice, on slips that fit their cards", () => {
    // team.css sizes the slip so «Как в сказке», the longest tab, fills most of a card; its word never wraps.
    const longest = answerById["kak-v-skazke"].label.length;
    for (const p of team) {
      if (p.answerId) expect(Object.hasOwn(answerById, p.answerId)).toBe(true);
      const label = p.answerId ? answerById[p.answerId].label : p.answer;
      expect(label.length).toBeLessThanOrEqual(longest);
    }
  });
  it("gives every answer its match in team.css, with JS and without", () => {
    const css = readFileSync(new URL("../styles/sections/team.css", import.meta.url), "utf8");
    for (const { id } of answers) {
      expect(css).toContain(`html[data-answer="${id}"]:not([data-guess]) [data-team-answer="${id}"]`);
      expect(css).toContain(`html:not(.js):has(#ans-${id}:checked) [data-team-answer="${id}"]`);
    }
  });
});

describe("head script: today's tear", () => {
  // Runs HEAD_SCRIPT against a minimal document and storage: data-said is today's tear only.
  function run(stored: unknown) {
    const dataset: Record<string, string> = {};
    const store: Record<string, string | null> = { "kd-last": stored == null ? null : JSON.stringify(stored) };
    const env = {
      document: { documentElement: { dataset, classList: { add() {}, remove() {} } } },
      localStorage: { getItem: (k: string) => store[k] ?? null },
      sessionStorage: { getItem: () => "1" },
      matchMedia: () => ({ matches: false }),
      location: { hash: "" },
      setTimeout: () => 0,
    };
    const fn = new Function("window", "document", "localStorage", "sessionStorage", "matchMedia", "location", "setTimeout", HEAD_SCRIPT);
    fn(env, env.document, env.localStorage, env.sessionStorage, env.matchMedia, env.location, env.setTimeout);
    return dataset;
  }
  const day = (offset: number) => new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow" }).format(new Date(Date.now() + offset));
  it("marks a tear made today", () => {
    const d = run({ id: "sonno", day: day(0) });
    expect(d.said).toBe("sonno");
    expect(d.answer).toBe("sonno");
    expect(d.guess).toBeUndefined();
  });
  it("never marks yesterday's tear, a guess or tampered storage", () => {
    expect(run({ id: "sonno", day: day(-864e5) }).said).toBeUndefined();
    expect(run(null).said).toBeUndefined();
    expect(run({ id: "<img>", day: day(0) }).said).toBeUndefined();
  });
});

describe("the «Разделы» roll's rip", () => {
  it("tears the same rip for the same seed", () => {
    expect(rollRip(7, 1440)).toEqual(rollRip(7, 1440));
    expect(rollRip(7, 1440).edge).not.toEqual(rollRip(8, 1440).edge);
  });
  it("has a jag every 22px or so, 18 to 80 of them, from side to side", () => {
    expect(rollRip(1, 390).edge).toHaveLength(19);
    expect(rollRip(1, 1440).edge).toHaveLength(66);
    expect(rollRip(1, 5120).edge).toHaveLength(81);
    for (const seed of [1, 2, 3, 0x6b64, 4294967295]) {
      for (const width of [320, 390, 1024, 1440, 1920, 2560]) {
        const { edge } = rollRip(seed, width);
        expect(edge[0][0]).toBe(0);
        expect(edge[edge.length - 1][0]).toBe(100);
        // Left to right, never doubling back, and never more than 10px off the line.
        edge.slice(1).forEach(([x], i) => expect(x).toBeGreaterThan(edge[i][0]));
        edge.forEach(([, y]) => expect(Math.abs(y)).toBeLessThan(10));
      }
    }
  });
  it("puts the lighter rim just under the paper's edge", () => {
    for (const seed of [1, 2, 3, 0x6b64]) {
      const { edge, rim } = rollRip(seed, 1440);
      expect(rim).toHaveLength((edge.length - 1) * 3 + 1);
      // Every third nick sits on a jag, 0.8 to 2.6px under it.
      edge.slice(0, -1).forEach(([, y], i) => {
        expect(rim[i * 3][1] - y).toBeGreaterThanOrEqual(0.8);
        expect(rim[i * 3][1] - y).toBeLessThanOrEqual(2.6);
      });
      // The rim, like the paper, stays inside the sheet's 30px band for its rip (15px either side).
      rim.forEach(([, y]) => expect(Math.abs(y)).toBeLessThan(15));
    }
  });
  it("clips the rip from the box's bottom, so the sheet can change height", () => {
    const { edge } = rollRip(3, 1440);
    const clip = ripClip(edge, 15);
    expect(clip).toMatch(/^polygon\(0% 0px, 100% 0px, 100% calc\(100% [-+] [\d.]+px\)/);
    expect(clip.endsWith("px))")).toBe(true);
    expect(clip).not.toMatch(/- -/);
    // A rip deeper than its band flips the sign instead of writing «- -».
    expect(ripClip([[0, 20], [100, 20]], 15)).toBe("polygon(0% 0px, 100% 0px, 100% calc(100% + 5px), 0% calc(100% + 5px))");
  });
});
