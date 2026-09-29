import { readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { cafes, cafesByCity } from "@/content/cafes";
import { PLAN_VB, planFrames } from "@/content/plans";
import type { City } from "@/content/types";
import { haversineKm } from "./geo";
import { enterSheet, labelSide, labelUnits, onSheet, PHONE_MARK_PX, PHONE_MIN_UNITS, project, SMALLEST_SHEET_PX, spread, unitsPerMetre } from "./plan";
import { shortAddress } from "@/components/locations/address";

const CITIES: City[] = ["nalchik", "vladikavkaz"];
const print = (city: City) => readFileSync(new URL(`../assets/plans/${city}.svg`, import.meta.url), "utf8");

/** Units per px on the smallest sheet. */
const UPX = PLAN_VB.w / SMALLEST_SHEET_PX;

describe("plan: the sheets", () => {
  it("are 4:5 for every city", () => {
    expect(PLAN_VB.w / PLAN_VB.h).toBeCloseTo(0.8, 6);
    for (const c of CITIES) expect(planFrames[c].widthM / planFrames[c].heightM).toBeCloseTo(0.8, 6);
  });

  it("were fitted to the cafés as they are now (after adding or moving one, run npm run assets:plans)", () => {
    for (const c of CITIES)
      expect([...planFrames[c].fittedTo]).toEqual(cafesByCity(c).map((x) => ({ id: x.id, lat: x.coords.lat, lon: x.coords.lon })));
  });

  it("put every café well inside its sheet", () => {
    for (const cafe of cafes) {
      const p = project(planFrames[cafe.city], cafe.coords);
      expect(onSheet(p, 80), `${cafe.id} at ${p.x.toFixed(0)},${p.y.toFixed(0)}`).toBe(true);
    }
  });

  it("keep the cartouche's corner clear of every café", () => {
    const box = { w: 360, h: 190 };
    for (const city of CITIES) {
      const corner = planFrames[city].cartouche;
      const x0 = corner.endsWith("l") ? 0 : PLAN_VB.w - box.w;
      const y0 = corner.startsWith("t") ? 0 : PLAN_VB.h - box.h;
      for (const c of cafesByCity(city)) {
        const p = project(planFrames[city], c.coords);
        const inBox = p.x > x0 - 40 && p.x < x0 + box.w + 40 && p.y > y0 - 40 && p.y < y0 + box.h + 40;
        expect(inBox, `${c.id} under the cartouche`).toBe(false);
      }
    }
  });

  it("keep the ground's proportions: a distance on the sheet is the distance on the ground", () => {
    for (const city of CITIES) {
      const [a, b] = cafesByCity(city);
      const pa = project(planFrames[city], a.coords);
      const pb = project(planFrames[city], b.coords);
      const metres = haversineKm(a.coords, b.coords) * 1000;
      expect(Math.hypot(pa.x - pb.x, pa.y - pb.y) / unitsPerMetre(planFrames[city]) / metres).toBeCloseTo(1, 2);
    }
  });

  it("never let two marks of a city touch on the smallest phone, moving none of them more than a few px", () => {
    for (const city of CITIES) {
      const truth = cafesByCity(city).map((c) => project(planFrames[city], c.coords));
      const pts = spread(truth, PHONE_MIN_UNITS);
      pts.forEach((p, i) => expect(Math.hypot(p.x - truth[i].x, p.y - truth[i].y) / UPX, `${city} mark ${i + 1} moved`).toBeLessThanOrEqual(6));
      for (let i = 0; i < pts.length; i++)
        for (let j = i + 1; j < pts.length; j++) {
          const px = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y) / UPX;
          expect(px, `${city} marks ${i + 1} and ${j + 1}`).toBeGreaterThanOrEqual(PHONE_MARK_PX - 0.01);
        }
    }
  });

  it("find every café's label a side that stays on the sheet and off its neighbours", () => {
    for (const city of CITIES) {
      const list = cafesByCity(city);
      const pts = list.map((c) => project(planFrames[city], c.coords));
      list.forEach((c, i) => {
        const w = labelUnits(shortAddress(c.address));
        const side = labelSide(pts[i], pts.filter((_, j) => j !== i), w);
        const x0 = side === "e" ? pts[i].x + 34 : pts[i].x - 34 - w;
        expect(x0, `${c.id} label start`).toBeGreaterThanOrEqual(12);
        expect(x0 + w, `${c.id} label end`).toBeLessThanOrEqual(PLAN_VB.w - 12);
      });
    }
  });
});

describe("plan: the prints", () => {
  it("stay light: at most 160 KB, and 60 KB gzipped", () => {
    for (const city of CITIES) {
      const svg = print(city);
      expect(svg.length).toBeLessThanOrEqual(160 * 1024);
      expect(gzipSync(svg).length).toBeLessThanOrEqual(60 * 1024);
    }
  });

  it("are one ink on nothing: no text, no scripts, no links out, no ground", () => {
    for (const city of CITIES) {
      const svg = print(city);
      expect(svg).toMatch(/^<svg [^>]*viewBox="0 0 1000 1250"/);
      expect(svg).not.toMatch(/<text|<script|<foreignObject|href=|<rect(?![^>]*fill="#fff")/);
      const colours = new Set(svg.match(/#[0-9a-f]{3,6}\b/gi));
      for (const c of colours) expect(["#141210", "#fff", "#000"]).toContain(c.toLowerCase());
    }
  });

  it("carry heavier lines for small sheets", () => {
    for (const city of CITIES) expect(print(city)).toMatch(/@media \(max-width:459px\)\{[^}]*\.mj\{stroke-width:/);
  });
});

describe("plan: geometry helpers", () => {
  it("bring an off-sheet guest to the edge along the line to the café", () => {
    const cafe = { x: 500, y: 600 };
    const e = enterSheet({ x: -500, y: 600 }, cafe, 20);
    expect(e.x).toBeCloseTo(20, 6);
    expect(e.y).toBeCloseTo(600, 6);
    expect(enterSheet({ x: 500, y: 3000 }, cafe, 0).y).toBeCloseTo(PLAN_VB.h, 6);
    expect(enterSheet({ x: 300, y: 300 }, cafe, 20)).toEqual({ x: 300, y: 300 });
  });

  it("read a label away from the sheet's edge and from a neighbour on its line", () => {
    expect(labelSide({ x: 100, y: 500 }, [], 300)).toBe("e");
    expect(labelSide({ x: 900, y: 500 }, [], 300)).toBe("w");
    expect(labelSide({ x: 400, y: 500 }, [{ x: 520, y: 510 }], 300)).toBe("w");
  });
});
