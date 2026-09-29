import { describe, expect, it } from "vitest";
import { own } from "@/content/about";
import { answers } from "@/content/answers";
import { cafes } from "@/content/cafes";
import { chapterById, fullMenu, HERO_ANCHORS, kitchenCafes, menuItemById } from "@/content/full-menu";
import { signatureDrinks } from "@/content/menu";
import { ru } from "@/i18n/ru";
import { tornEdge } from "@/lib/tear";
import { answerDishes, answerForItem, citiesById, flipStub, itemForAnswer, pageItems, servedAt, street, tableItems } from "./model";
import { MENU_PICK_STYLE, TABLE_SCRIPT } from "./pick-script";
import { plateCrop, PLATE_ZOOM } from "./plate-crop";
import { plates } from "./plates";

/** The polygon's points, as [x, y] in percent. */
const points = (polygon: string) => Array.from(polygon.matchAll(/(-?[\d.]+)% (-?[\d.]+)%/g), (m) => [Number(m[1]), Number(m[2])]);

describe("/menu: the notice turned over", () => {
  it("each of the eight answers stands for a dish on the page, in the notice's order", () => {
    expect(answerDishes.map((d) => d.answer.id)).toEqual(answers.map((a) => a.id));
    for (const { answer, item } of answerDishes) {
      expect(item.id).toBe(answer.item.anchor);
      expect(pageItems).toContain(item);
      expect(answerForItem[item.id]).toBe(answer);
      expect(itemForAnswer[answer.id]).toBe(item);
    }
  });

  it("the torn stub seen from behind is the front's stub mirrored top to bottom", () => {
    for (const a of answers) {
      const front = points(tornEdge(a.id).stub);
      const back = points(flipStub(tornEdge(a.id).stub));
      expect(back).toHaveLength(front.length);
      back.forEach(([x, y], i) => {
        expect(x).toBe(front[i][0]);
        expect(y).toBeCloseTo(100 - front[i][1], 5);
      });
      // The front's stub is the top of the tab; the back's is its foot, at the perforation.
      expect(Math.min(...back.map(([, y]) => y))).toBeGreaterThan(80);
    }
  });

  it("before paint: every answer puts its dish on the table, reddens its tab and tears it when said", () => {
    for (const a of answers) {
      const dish = itemForAnswer[a.id].id;
      expect(MENU_PICK_STYLE).toContain(`html[data-answer="${a.id}"] .mn-table:not([data-live]) .mn-slide[data-key="${dish}"]`);
      expect(MENU_PICK_STYLE).toContain(`html[data-answer="${a.id}"] .mn-back:not([data-live]) .mn-tab[data-tab="${a.id}"]`);
      expect(MENU_PICK_STYLE).toContain(`html[data-said="${a.id}"] .mn-tab[data-tab="${a.id}"] .mn-tab__paper{clip-path:var(--stub)}`);
    }
    // No answer yet (no JS): the first answer's dish.
    expect(MENU_PICK_STYLE).toContain(`html:not([data-answer]) .mn-table:not([data-live]) .mn-slide[data-key="${answers[0].item.anchor}"]`);
  });

  it("the table's priming script parses and names only dishes the table serves", () => {
    expect(() => new Function(TABLE_SCRIPT)).not.toThrow();
    for (const a of answers) expect(tableItems.map((i) => i.id)).toContain(itemForAnswer[a.id].id);
  });
});

describe("/menu: the table", () => {
  it("serves every kitchen dish, then the answers' dishes from the bar, each once", () => {
    const kitchen = chapterById.kuhnya.categories.flatMap((c) => c.items);
    expect(tableItems.slice(0, kitchen.length)).toEqual(kitchen);
    const ids = tableItems.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every photographed dish the table or the vitrine shows has its plate measured", () => {
    const shown = [...tableItems, ...chapterById.deserty.categories.flatMap((c) => c.items), ...chapterById.bar.categories[0].items];
    const missing = shown.filter((i) => i.photo && !plates[i.id]).map((i) => i.id);
    expect(missing).toEqual([]);
    for (const [id, p] of Object.entries(plates)) {
      expect(menuItemById[id], id).toBeDefined();
      expect(p.x, id).toBeGreaterThan(0.2);
      expect(p.x, id).toBeLessThan(0.8);
      expect(p.y, id).toBeGreaterThan(0.2);
      expect(p.y, id).toBeLessThan(0.8);
    }
  });

  it("lays each plate on the frame's middle, covering the frame", () => {
    // Every dish photo is 3:2 (src/assets/photos/manifest.json); in tests an image import carries no size.
    const photo = { src: { width: 1200, height: 800 } } as Parameters<typeof plateCrop>[1];
    for (const aspect of ["4/5", "4/3", "1/1"] as const) {
      for (const item of pageItems) {
        if (!item.photo) continue;
        const c = plateCrop(item.id, photo, aspect);
        // Covers: never smaller than the frame, never leaving a gap.
        expect(c.w).toBeGreaterThanOrEqual(1);
        expect(c.h).toBeGreaterThanOrEqual(1);
        expect(c.l).toBeLessThanOrEqual(0);
        expect(c.t).toBeLessThanOrEqual(0);
        expect(c.l + c.w).toBeGreaterThanOrEqual(1 - 1e-4);
        expect(c.t + c.h).toBeGreaterThanOrEqual(1 - 1e-4);
        // The plate lands on the middle unless the photo's edge stops it (crop.ts rounds to 1e-4).
        const p = plates[item.id] ?? { x: 0.5, y: 0.5 };
        const x = c.l + p.x * c.w;
        const y = c.t + p.y * c.h;
        const free = (at: number, size: number) => at < -1e-3 && at > 1 - size + 1e-3;
        if (free(c.l, c.w)) expect(x).toBeCloseTo(0.5, 2);
        if (free(c.t, c.h)) expect(y).toBeCloseTo(0.5, 2);
      }
    }
    expect(PLATE_ZOOM).toBeGreaterThan(1);
  });
});

describe("/menu: anchors", () => {
  it("every dish the rest of the site links to is on the page", () => {
    const linked = [
      ...HERO_ANCHORS,
      ...answers.map((a) => a.item.anchor),
      ...signatureDrinks.map((d) => d.id),
      ...own.map((o) => o.link.hash).filter((h): h is string => !!h),
    ];
    for (const id of linked) expect(menuItemById[id], id).toBeDefined();
  });

  it("the page's own ids never collide with a chapter, category or dish", () => {
    const page = ["main", "soderzhanie", "menu-title", "mn-prices-label"];
    const menu = [...fullMenu.map((ch) => ch.id), ...fullMenu.flatMap((ch) => ch.categories.map((c) => c.id)), ...pageItems.map((i) => i.id)];
    const headings = [...fullMenu.map((ch) => `${ch.id}-title`), ...fullMenu.flatMap((ch) => ch.categories.map((c) => `${c.id}-title`))];
    const all = [...page, ...menu, ...headings];
    expect(all.filter((id, i) => all.indexOf(id) !== i)).toEqual([]);
  });
});

describe("/menu: the copy is true to the data", () => {
  it("the kitchen is cooked where cafes.ts says, and «в N из M» counts them", () => {
    for (const city of ["nalchik", "vladikavkaz"] as const) {
      const kitchens = servedAt(chapterById.kuhnya, city);
      expect(kitchens).toEqual(kitchenCafes[city]);
      expect(kitchens.length).toBeGreaterThan(0);
      const total = cafes.filter((c) => c.city === city).length;
      expect(ru.menu.chapters.kuhnya.lead(kitchens.length, total, city)).toContain(`${kitchens.length} из ${total}`);
    }
    expect(street("ул. Байсултанова, 1")).toBe("Байсултанова, 1");
    expect(street("пр. Шогенцукова, 19")).toBe("Шогенцукова, 19");
  });

  it("«во всех кофейнях по одной цене»: every bar and dessert price is the same in both cities", () => {
    for (const ch of [chapterById.bar, chapterById.deserty]) {
      expect(ch.servedAt).toBe("every-cafe");
      for (const c of ch.categories) {
        for (const i of c.items) {
          if ("sizes" in i.price) continue;
          expect(i.price.nalchik, i.id).toBe(i.price.vladikavkaz);
          expect(citiesById[i.id], i.id).toHaveLength(2);
        }
      }
    }
  });

  it("the desserts' lead: without sugar and without gluten are both on the menu", () => {
    const desc = chapterById.deserty.categories.flatMap((c) => c.items.map((i) => i.desc ?? "")).join(" ");
    expect(desc).toMatch(/без сахара/);
    expect(desc).toMatch(/без глютена/i);
  });

  it("no em or en dashes in the menu's strings", () => {
    const strings = JSON.stringify(ru.menu, (_, v) => (typeof v === "function" ? String(v) : v));
    expect(strings).not.toMatch(/[–—]/);
  });
});
