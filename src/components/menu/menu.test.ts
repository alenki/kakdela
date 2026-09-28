import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { answers } from "@/content/answers";
import { menuItemById, menuItems } from "@/content/full-menu";
import { breakfasts, cherryPie, desserts, extras, season, signatureDrinks } from "@/content/menu";
import { ru } from "@/i18n/ru";
import { NBSP } from "@/lib/typograf";
import { MENU_PICK_SCRIPT, PICK_BY_ANCHOR } from "./pick-script";

const css = readFileSync(fileURLToPath(new URL("../../styles/sections/menu.css", import.meta.url)), "utf8");

describe("/menu: the one red", () => {
  it("styles every answer: its red at the dish (pick and said), its «сегодня» and its yesterday line", () => {
    for (const a of answers) {
      expect(css).toContain(`html[data-pick="${a.id}"] .mi[data-answer="${a.id}"] .mn-said__a`);
      expect(css).toContain(`html:not([data-pick])[data-said="${a.id}"] .mi[data-answer="${a.id}"] .mn-said__a`);
      expect(css).toContain(`html[data-said="${a.id}"] .mn-ans[data-answer="${a.id}"] .mn-ans__today`);
      expect(css).toContain(`html[data-yesterday="${a.id}"]:not([data-said]) [data-mn-yd="${a.id}"]`);
    }
  });
  it("maps exactly the eight hero anchors to their answers, before paint and in the islands", () => {
    expect(PICK_BY_ANCHOR).toEqual(Object.fromEntries(answers.map((a) => [a.item.anchor, a.id])));
    for (const a of answers) expect(MENU_PICK_SCRIPT).toContain(`"${a.item.anchor}":"${a.id}"`);
    expect(Object.keys(PICK_BY_ANCHOR)).toHaveLength(8);
  });
});

describe("/menu: curated dishes are the homepage's", () => {
  it("references name, price, description and photo unchanged", () => {
    const curated = [
      ...breakfasts.map((b) => ({ id: b.id, name: b.name, price: b.price, desc: b.desc, photo: b.photo })),
      ...signatureDrinks.map((d) => ({ id: d.id, name: d.name, price: d.price, desc: d.desc, photo: undefined })),
      ...desserts.map((d) => ({ id: d.id, name: d.name, price: d.price, desc: d.desc, photo: d.photo })),
      { id: "shakshuka", name: extras.shakshuka.name, price: extras.shakshuka.price, desc: undefined, photo: extras.shakshuka.photo },
      { id: "vishnevyj-pirog", name: cherryPie.name, price: cherryPie.price, desc: undefined, photo: cherryPie.photo },
    ];
    for (const c of curated) {
      const item = menuItemById[c.id];
      expect(item, c.id).toBeDefined();
      expect(item.name).toBe(c.name);
      expect(item.price).toBe(c.price);
      if (c.desc !== undefined) expect(item.desc).toBe(c.desc);
      if (c.photo !== undefined) expect(item.photo).toBe(c.photo);
    }
  });
  it("leaves the ended season out", () => {
    expect(season.active).toBe(false);
    const names = menuItems.map((i) => i.name.toLowerCase());
    for (const n of ["золотой клеверок", "шипучка", "ирис кис-кис", "турбо тоник"]) expect(names.some((x) => x.includes(n))).toBe(false);
  });
});

describe("/menu: copy", () => {
  it("has no em or en dash in the page's strings, and no em dash in its styles", () => {
    const flat = JSON.stringify(ru.menu, (_k, v) => (typeof v === "function" ? v.toString() : v));
    expect(flat).not.toMatch(/[\u2013\u2014]/);
    // Column ranges in comments («1 to 7» written with an en dash) stay, as in every stylesheet here.
    expect(css).not.toMatch(/\u2014/);
  });
  it("counts in Russian", () => {
    expect(ru.menu.count.kuhnya(26)).toBe("26 блюд");
    expect(ru.menu.count.kuhnya(21)).toBe("21 блюдо");
    expect(ru.menu.count.bar(46)).toBe("46 напитков");
    expect(ru.menu.count.deserty(21)).toBe("21 десерт");
    expect(ru.menu.kitchenShare(3, 7)).toBe(`в 3${NBSP}из 7 кофеен`);
    expect(ru.menu.chapters.kuhnya.lead(3, 7, "Нальчика")).toMatch(/кофеен Нальчика, в остальных меню лёгкое\.$/);
    expect(ru.menu.chapters.kuhnya.lead(1, 2, "Владикавказа")).toMatch(/кофеен Владикавказа, в другой меню лёгкое\.$/);
    expect(ru.menu.chapters.kuhnya.lead(2, 2, "Владикавказа")).toMatch(/кофеен Владикавказа\.$/);
  });
});
