import { PLAN_VB, type PlanFrame } from "@/content/plans";
import { projectOn, type SheetPoint } from "./plan-projection";

// The /locations plan's geometry on the page: where the cafés and the guest fall on the printed sheet (the
// same projection scripts/fetch-plans.mjs drew the streets with), and where a label may read.

export type { SheetPoint };

/** The smallest sheet the plan is drawn on: a 320px phone less its gutters and the paper's margins (px). */
export const SMALLEST_SHEET_PX = 268;
/** A mark on a phone: the 20px disc, its 2px paper ring each side, and 4px of air. */
export const PHONE_MARK_PX = 28;
/** How far apart two phone marks must sit, in sheet units. */
export const PHONE_MIN_UNITS = (PHONE_MARK_PX * PLAN_VB.w) / SMALLEST_SHEET_PX;

/**
 * A label's width in sheet units on the smallest sheet: display caps at 0.875rem, about 0.46em a letter, and its
 * padding. What the server places labels by (CityPlan); PlanController checks the real box on the page.
 */
export const labelUnits = (text: string) => ((text.length * 0.46 * 14 + 8) * PLAN_VB.w) / SMALLEST_SHEET_PX;

/** Longitude and latitude → sheet units (0–1000 across, 0–1250 down). */
export const project = (frame: PlanFrame, p: { lat: number; lon: number }): SheetPoint => projectOn(frame, PLAN_VB, p);

/** Sheet units per metre. */
export const unitsPerMetre = (frame: PlanFrame) => PLAN_VB.w / frame.widthM;

/** A sheet point as percentages of the sheet: how the HTML marks are placed over the print. */
export const pct = (p: SheetPoint) => ({ x: (p.x / PLAN_VB.w) * 100, y: (p.y / PLAN_VB.h) * 100 });

export const onSheet = (p: SheetPoint, inset = 0) =>
  p.x >= inset && p.x <= PLAN_VB.w - inset && p.y >= inset && p.y <= PLAN_VB.h - inset;

/**
 * Where the segment from `from` (off the sheet) to `to` (on it) comes onto the sheet, `inset` units inside its
 * edge: the guest's end of the line when they are outside the plan. A point already on the sheet is returned.
 */
export function enterSheet(from: SheetPoint, to: SheetPoint, inset = 0): SheetPoint {
  if (onSheet(from, inset)) return from;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  let t0 = 0;
  // Liang-Barsky: the latest entry across the four edges.
  const edges: [number, number][] = [
    [-dx, from.x - inset],
    [dx, PLAN_VB.w - inset - from.x],
    [-dy, from.y - inset],
    [dy, PLAN_VB.h - inset - from.y],
  ];
  for (const [p, q] of edges) if (p < 0) t0 = Math.max(t0, q / p);
  return { x: from.x + t0 * dx, y: from.y + t0 * dy };
}

/**
 * Marks set a little apart where two cafés are too close to tell apart on a small sheet, as a printed plan
 * displaces its symbols: each pair closer than `min` units is pushed apart along the line between them, half
 * each, until none is. Prints under 421px wide use these positions; wider ones put every mark on its true point.
 */
export function spread(points: SheetPoint[], min: number): SheetPoint[] {
  const out = points.map((p) => ({ ...p }));
  for (let pass = 0; pass < 24; pass++) {
    let moved = false;
    for (let i = 0; i < out.length; i++)
      for (let j = i + 1; j < out.length; j++) {
        const dx = out[j].x - out[i].x;
        const dy = out[j].y - out[i].y;
        const d = Math.hypot(dx, dy);
        if (d >= min || d === 0) continue;
        const push = (min - d) / 2 + 0.01;
        out[i].x -= (dx / d) * push;
        out[i].y -= (dy / d) * push;
        out[j].x += (dx / d) * push;
        out[j].y += (dy / d) * push;
        moved = true;
      }
    if (!moved) break;
  }
  return out;
}

/**
 * The side a mark's label reads on, «e» (right) or «w» (left): the first that stays on the sheet and clear of
 * the other marks, for a label `width` units long. Widths come from the smallest sheet that shows labels, so
 * a side that fits there fits everywhere.
 */
export function labelSide(p: SheetPoint, others: SheetPoint[], width: number, clear = 70): "e" | "w" {
  const gap = 34; // the disc's radius and the space before the label, in units on the smallest sheet
  const fits = (dir: 1 | -1) => {
    const x0 = dir === 1 ? p.x + gap : p.x - gap - width;
    const x1 = x0 + width;
    if (x0 < 12 || x1 > PLAN_VB.w - 12) return false;
    return !others.some((o) => Math.abs(o.y - p.y) < clear && o.x > x0 - gap && o.x < x1 + gap);
  };
  const prefer: ("e" | "w")[] = p.x > PLAN_VB.w * 0.55 ? ["w", "e"] : ["e", "w"];
  for (const side of prefer) if (fits(side === "e" ? 1 : -1)) return side;
  return prefer[0];
}
