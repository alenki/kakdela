import { describe, expect, it } from "vitest";
import { cafes } from "@/content/cafes";
import { routes } from "@/content/routes";
import { ru } from "@/i18n/ru";
import { NBSP } from "@/lib/typograf";
import { featureLine, shortAddress, splitAddress } from "./address";
import { INVITE_PARAM, inviteText, inviteUrl } from "./invite";
import { CITY_BY_CAFE, LOCATIONS_PICK_SCRIPT, LOCATIONS_PICK_STYLE } from "./pick-script";

/** Runs the pick script against a minimal document, as the browser would before the page paints. */
function pick(hash: string, search = "", stored: string | null = null) {
  const dataset: Record<string, string> = stored ? { city: stored } : {};
  const win: Record<string, unknown> = {};
  new Function("window", "document", "location", "URLSearchParams", LOCATIONS_PICK_SCRIPT)(
    win,
    { documentElement: { dataset } },
    { hash, search },
    URLSearchParams,
  );
  return { dataset, win };
}

describe("/locations: a friend's link", () => {
  it("marks the café a hash names and shows its city, without storing anything", () => {
    const d = pick("#plieva-32", "", "nalchik").dataset;
    expect(d.lcPick).toBe("plieva-32");
    expect(d.city).toBe("vladikavkaz");
    expect(d.lcInvited).toBeUndefined();
  });

  it("says it was an invitation only when the link carries the mark", () => {
    expect(pick("#lermontova-4", `?${INVITE_PARAM}`).dataset.lcInvited).toBe("");
    expect(pick("#lermontova-4", "?utm=x").dataset.lcInvited).toBeUndefined();
  });

  it("ignores anything that isn't one of the nine cafés", () => {
    for (const h of ["", "#", "#__proto__", "#constructor", "#%E0%A4%A", "#kofejni", "#bajsultanova-1x"]) {
      const d = pick(h, `?${INVITE_PARAM}`, "vladikavkaz").dataset;
      expect(d.lcPick, h).toBeUndefined();
      expect(d.city, h).toBe("vladikavkaz");
      expect(d.lcInvited, h).toBeUndefined();
    }
  });

  it("marks a hard load, and fetches nothing of its own", () => {
    expect(pick("").win.__kdLcLoad).toBe(1);
    expect(LOCATIONS_PICK_SCRIPT).not.toMatch(/new Image|fetch\(|\.src=/);
  });

  it("maps every café to its city, and styles every pick before the controller takes over", () => {
    expect(Object.keys(CITY_BY_CAFE)).toHaveLength(cafes.length);
    for (const c of cafes) {
      expect(CITY_BY_CAFE[c.id]).toBe(c.city);
      expect(LOCATIONS_PICK_STYLE).toContain(`html[data-lc-pick="${c.id}"] .lc:not([data-lc-live]) [data-lc-mk="${c.id}"]`);
      expect(LOCATIONS_PICK_STYLE).toContain(`html[data-lc-pick="${c.id}"][data-lc-invited] #${c.id} .lc-cafe__invited`);
    }
  });
});

describe("/locations: the invitation", () => {
  it("links to this page on the café, marked as an invitation", () => {
    for (const c of cafes) {
      const url = new URL(inviteUrl(c.id));
      expect(url.pathname).toBe(routes.locations.href);
      expect(url.searchParams.has(INVITE_PARAM)).toBe(true);
      expect(url.hash).toBe(`#${c.id}`);
    }
  });

  it("asks the question as friends would, with the address as they say it", () => {
    expect(inviteText("ул. Лермонтова, 4")).toBe("Встретимся в «Как дела?» на Лермонтова, 4?");
    for (const c of cafes) {
      const text = inviteText(c.address);
      expect(text.endsWith("?")).toBe(true);
      expect(text).toContain("«Как дела?»");
      expect(text).not.toMatch(/ул\.|пр\./);
    }
  });
});

describe("/locations: copy", () => {
  const p = ru.locationsPage;
  it("never uses an em dash", () => {
    const strings = [p.meta.title, p.meta.description, p.a, p.lead, p.plan.you, p.plan.credit, p.invite.label, p.invite.copied, p.invited];
    for (const s of strings) expect(s).not.toContain("—");
    expect(p.foundOpen("ул. А, 1", "1 км", "00:00", "ул. Б, 2")).not.toContain("—");
  });

  it("counts the ratings with their noun held to the number", () => {
    expect(p.rating(5, 626)).toBe(`5,0 · 626${NBSP}оценок на Яндекс${NBSP}Картах`);
    expect(p.rating(4.8, 292)).toContain(`292${NBSP}оценки`);
    expect(p.rating(5, 214)).toContain(`214${NBSP}оценок`);
    expect(p.rating(5, 21)).toContain(`21${NBSP}оценка`);
    expect(p.rating(4.9, 2709)).toContain(`2${NBSP}709${NBSP}оценок`);
  });

  it("names the plans and their scale", () => {
    expect(p.plan.label("nalchik", 7)).toBe("План Нальчика: 7 кофеен «Как дела?»");
    expect(p.plan.label("vladikavkaz", 2)).toBe("План Владикавказа: 2 кофейни «Как дела?»");
    expect(p.plan.scale(500)).toBe(`500${NBSP}м`);
    expect(p.plan.scale(1000)).toBe(`1${NBSP}км`);
    expect(p.plan.scale(1500)).toBe(`1,5${NBSP}км`);
  });

  it("reads addresses the way the homepage does", () => {
    expect(splitAddress("ул. Байсултанова, 1")).toEqual({ pre: "ул.", rest: "Байсултанова, 1" });
    expect(shortAddress("пр. Ленина, 32")).toBe("Ленина, 32");
    // A line breaks only after «·», never inside a tag.
    expect(featureLine(["все завтраки", "летняя веранда"])).toBe(`Все${NBSP}завтраки · летняя${NBSP}веранда`);
  });

  it("keeps the kitchen in the tags: a full kitchen serves all the breakfasts, a light one says so", () => {
    for (const c of cafes) expect(c.tags).toContain(c.kitchen === "full" ? "все завтраки" : "лёгкое меню");
  });
});
