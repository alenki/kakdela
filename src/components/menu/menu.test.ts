import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { answers } from "@/content/answers";
import { menuItemById, menuItems, menuSections } from "@/content/full-menu";
import { breakfasts, cherryPie, desserts, extras, season, signatureDrinks } from "@/content/menu";
import { ru } from "@/i18n/ru";
import { MENU_PICK_SCRIPT, PICK_BY_ANCHOR } from "./pick-script";

const css = readFileSync(fileURLToPath(new URL("../../styles/sections/menu.css", import.meta.url)), "utf8");

describe("/menu: the one red", () => {
  it("styles every answer: its red at the dish, for the one the guest lands on and for today's tear", () => {
    for (const a of answers) {
      expect(css).toContain(`html[data-pick="${a.id}"] .mi[data-answer="${a.id}"] .mn-said__a`);
      expect(css).toContain(`html:not([data-pick])[data-said="${a.id}"] .mi[data-answer="${a.id}"] .mn-said__a`);
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
  it("counts in Russian, and names every section", () => {
    expect(ru.menu.count(93)).toBe("93 позиции");
    expect(ru.menu.count(88)).toBe("88 позиций");
    expect(ru.menu.count(21)).toBe("21 позиция");
    for (const s of menuSections) {
      expect(ru.menu.sections[s.id].title.length).toBeGreaterThan(2);
      expect(ru.menu.sections[s.id].line).toMatch(/\?$/);
    }
});
});
