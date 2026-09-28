import { describe, expect, test } from "vitest";
import { answers } from "./answers";
import {
  answerByAnchor,
  chapterById,
  chapterCount,
  citiesOf,
  fullMenu,
  HERO_ANCHORS,
  kitchenCafes,
  menuCategories,
  menuItemById,
  menuItems,
  menuCount,
  menuSections,
  sectionCount,
} from "./full-menu";
import { breakfasts, cherryPie, desserts, extras, signatureDrinks } from "./menu";
import type { City, MenuItem } from "./types";

const CITIES: City[] = ["nalchik", "vladikavkaz"];

/** The page's own ids besides the sections, their headings and the dishes. */
const PAGE_IDS = ["soderzhanie", "main", "menu-title", "mn-prices-label", "mn-tabs-prices", "mn-cta-title"];

/** КБЖУ that is not shown until the client checks it (SPEC §8.2.5). */
const DROPPED_NUTRITION = [
  "espresso", "amerikano", "kapuchino", "filtr-kofe", "kakao", "raf-klassicheskij", "poke-s-kuricej", "poke-s-syomgoj", "sendvich-s-syomgoj",
  "oblepiha-klyukva", "imbir-limon-myod", "malina-marakujya", "dubajskij-batonchik", "deniz", "moti", "syrniki",
];

/** Every string in a value, with its path (photo `src` is an image module, not copy). */
function strings(value: unknown, path = ""): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (Array.isArray(value)) return value.flatMap((v, i) => strings(v, `${path}[${i}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([k, v]) => (k === "src" ? [] : strings(v, path ? `${path}.${k}` : k)));
  }
  return [];
}

describe("full menu: structure", () => {
  test("chapters are kitchen, bar, desserts", () => {
    expect(fullMenu.map((ch) => ch.id)).toEqual(["kuhnya", "bar", "deserty"]);
    for (const ch of fullMenu) expect(chapterById[ch.id]).toBe(ch);
  });

  test("ids rendered on the page are unique: dishes, sections and their headings", () => {
    const ids = [
      ...PAGE_IDS,
      ...menuSections.map((s) => s.id),
      ...menuSections.map((s) => `${s.id}-title`),
      ...menuSections.filter((s) => s.servedAt === "full-kitchen").map((s) => `${s.id}-kitchen`),
      ...menuItems.map((i) => i.id),
    ];
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes).toEqual([]);
    expect(Object.keys(menuItemById)).toHaveLength(menuItems.length);
  });

  test("data ids (chapters, categories, dishes) are unique among themselves", () => {
    const ids = [...fullMenu.map((ch) => ch.id), ...menuCategories.map((c) => c.id), ...menuItems.map((i) => i.id)];
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
  });

  test("the six sections hold every category once, in the order of a café day", () => {
    expect(menuSections.map((s) => s.id)).toEqual(["zavtraki", "obed", "kofe", "ne-kofe", "holodnoe", "deserty"]);
    const grouped = menuSections.flatMap((s) => s.categories.map((c) => c.id));
    expect([...grouped].sort()).toEqual(menuCategories.map((c) => c.id).sort());
    expect(new Set(grouped).size).toBe(grouped.length);
    expect(menuSections.map((s) => s.theme)).toEqual(["cream", "cream", "cream", "cream", "cream", "ink"]);
    expect(menuSections.map((s) => s.servedAt)).toEqual(["full-kitchen", "full-kitchen", "every-cafe", "every-cafe", "every-cafe", "every-cafe"]);
  });

  test("counts per city: 93 in Нальчик, 88 in Владикавказ", () => {
    expect(menuSections.map((s) => [s.id, sectionCount(s, "nalchik"), sectionCount(s, "vladikavkaz")])).toEqual([
      ["zavtraki", 14, 13],
      ["obed", 12, 8],
      ["kofe", 20, 20],
      ["ne-kofe", 11, 11],
      ["holodnoe", 15, 15],
      ["deserty", 21, 21],
    ]);
    expect(menuCount("nalchik")).toBe(93);
    expect(menuCount("vladikavkaz")).toBe(88);
  });

  test("every dish has a photo but the six the client has none for", () => {
    const without = menuItems.filter((i) => !i.photo).map((i) => i.id).sort();
    expect(without).toEqual(["granola", "kinder-kantri", "malinovyj-muss", "mini-pankejki", "shokoladnaya-pp-granola", "shu-s-funduchnym-kremom"]);
  });

  test("bar and dessert categories in the agreed order", () => {
    expect(chapterById.kuhnya.categories.map((c) => c.id)).toEqual([
      "zavtraki", "kashi", "sladkie-zavtraki", "poke", "bouly", "sendvichi", "rolly", "pasta",
    ]);
    expect(chapterById.bar.categories.map((c) => c.id)).toEqual([
      "firmennoe", "espresso-i-filtr", "avtorskie", "holodnyj-kofe", "matcha", "kakao-i-shokolad", "chai", "limonady",
      "freshi", "koktejli", "shoty",
    ]);
    expect(chapterById.deserty.categories.map((c) => c.id)).toEqual([
      "firmennye", "torty-i-pirozhnye", "batonchiki-i-sladosti",
    ]);
  });

  test("signature blocks", () => {
    const sig = (catId: string) =>
      menuCategories.find((c) => c.id === catId)!.items.filter((i) => i.signature).map((i) => i.id);
    expect(sig("zavtraki")).toEqual(breakfasts.map((b) => b.id));
    expect(menuItemById["shakshuka"].signature).toBeUndefined();
    expect(menuItemById["draniki-s-syomgoj"].signature).toBeUndefined();
    expect(menuCategories.find((c) => c.id === "firmennoe")!.items.map((i) => i.id)).toEqual(signatureDrinks.map((d) => d.id));
    expect(sig("firmennoe")).toEqual(signatureDrinks.map((d) => d.id));
    expect(sig("firmennye")).toEqual(desserts.map((d) => d.id));
    expect(menuCategories.find((c) => c.id === "torty-i-pirozhnye")!.items[0].id).toBe("vishnevyj-pirog");
    const signatureCats = menuCategories.filter((c) => c.signature).map((c) => c.id);
    expect(signatureCats).toEqual(["zavtraki", "firmennoe", "firmennye"]);
  });
});

describe("full menu: agrees with the homepage", () => {
  test("every answer anchor is an item with the answer's price", () => {
    for (const a of answers) {
      const item = menuItemById[a.item.anchor];
      expect(item, a.item.anchor).toBeDefined();
      expect(item.price, a.item.anchor).toEqual(a.item.price);
      expect(answerByAnchor[a.item.anchor]).toBe(a);
    }
    expect([...HERO_ANCHORS].sort()).toEqual(answers.map((a) => a.item.anchor).sort());
  });

  test("curated items reference menu.ts: the same price object and name", () => {
    const source: Record<string, { name: string; price: unknown }> = {
      ...Object.fromEntries(breakfasts.map((b) => [b.id, b])),
      ...Object.fromEntries(signatureDrinks.map((d) => [d.id, d])),
      ...Object.fromEntries(desserts.map((d) => [d.id, d])),
      shakshuka: extras.shakshuka,
      syrniki: extras.syrniki,
      "mini-pankejki": extras.pancakes,
      "vishnevyj-pirog": cherryPie,
    };
    const curated = menuItems.filter((i) => i.curated);
    expect(curated.map((i) => i.id).sort()).toEqual(Object.keys(source).sort());
    for (const item of curated) {
      expect(item.price, item.id).toBe(source[item.id].price);
      expect(item.name, item.id).toBe(source[item.id].name);
    }
  });
});

describe("full menu: copy", () => {
  const all = strings(fullMenu);

  test("no em or en dashes, emoji or straight double quotes", () => {
    expect(all.filter(([, s]) => /[\u2013\u2014]/.test(s))).toEqual([]);
    expect(all.filter(([, s]) => /\p{Extended_Pictographic}/u.test(s))).toEqual([]);
    expect(all.filter(([, s]) => s.includes('"'))).toEqual([]);
  });

  test("every description ends with a full stop", () => {
    const descs = menuItems.flatMap((i) => [
      [i.id, i.desc] as const,
      ...Object.entries(i.descByCity ?? {}).map(([city, d]) => [`${i.id} (${city})`, d] as const),
    ]);
    expect(descs.filter(([, d]) => d !== undefined && !d.endsWith("."))).toEqual([]);
  });
});

describe("full menu: prices, volumes, nutrition", () => {
  test("every cup-size price has cup-size volumes", () => {
    const bad = menuItems.filter((i: MenuItem) => "sizes" in i.price && !(i.volume && "sizes" in i.volume));
    expect(bad.map((i) => i.id)).toEqual([]);
  });

  test("prices the client still has to confirm", () => {
    expect(menuItemById["poke-s-syomgoj"].price).toEqual({ nalchik: null, vladikavkaz: 430 });
    expect(menuItemById["sendvich-s-pryanoj-govyadinoj"].price).toEqual({ nalchik: null, vladikavkaz: 610 });
  });

  test("doubtful КБЖУ is not on the page", () => {
    for (const id of DROPPED_NUTRITION) {
      expect(menuItemById[id], id).toBeDefined();
      expect(menuItemById[id].nutrition, id).toBeUndefined();
      expect(menuItemById[id].draftNote, id).toMatch(/КБЖУ/);
    }
    expect(menuItemById["kapitalnyj"].nutrition?.cities).toEqual(["nalchik"]);
  });
});

describe("full menu: cities", () => {
  test("chapter counts per city", () => {
    const counts = Object.fromEntries(fullMenu.map((ch) => [ch.id, CITIES.map((city) => chapterCount(ch, city))]));
    expect(counts).toEqual({ kuhnya: [26, 21], bar: [46, 46], deserty: [21, 21] });
  });

  test("citiesOf: item, then category, then both", () => {
    const rolly = menuCategories.find((c) => c.id === "rolly")!;
    const sladkie = menuCategories.find((c) => c.id === "sladkie-zavtraki")!;
    const kashi = menuCategories.find((c) => c.id === "kashi")!;
    expect(citiesOf(rolly.items[0], rolly)).toEqual(["nalchik"]);
    expect(citiesOf(menuItemById["pankejki"], sladkie)).toEqual(["vladikavkaz"]);
    expect(citiesOf(kashi.items[0], kashi)).toEqual(CITIES);
  });

  test("the kitchen is served at the full-kitchen cafés", () => {
    expect(kitchenCafes.nalchik.map((c) => c.address)).toEqual(["ул. Байсултанова, 1", "ул. Лермонтова, 4", "ул. Лермонтова, 59"]);
    expect(kitchenCafes.vladikavkaz.map((c) => c.address)).toEqual(["ул. Куйбышева, 3"]);
  });
});
