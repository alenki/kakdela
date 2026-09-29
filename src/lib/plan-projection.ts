// The /locations plan's projection: where a point on the ground falls on the printed sheet. Shared by the
// page (src/lib/plan.ts) and by scripts/fetch-plans.mjs, which draws the streets with it. No imports and only
// erasable TypeScript, so Node's type stripping can load it into the script (as fetch-puzzles does chess.ts).
//
// Equirectangular about the sheet's centre: over a few kilometres it is exact to well under a metre.

/** Metres per degree of latitude (mean) and of longitude at the equator. */
export const M_LAT = 111_132;
export const M_LON = 111_320;

export type LatLon = { lat: number; lon: number };
export type Frame = { center: LatLon; widthM: number };
export type Sheet = { w: number; h: number };
export type SheetPoint = { x: number; y: number };

/** Longitude and latitude → sheet units (x grows east, y grows south). */
export function projectOn(frame: Frame, sheet: Sheet, p: LatLon): SheetPoint {
  const k = Math.cos((frame.center.lat * Math.PI) / 180);
  const u = sheet.w / frame.widthM;
  return {
    x: sheet.w / 2 + (p.lon - frame.center.lon) * M_LON * k * u,
    y: sheet.h / 2 - (p.lat - frame.center.lat) * M_LAT * u,
  };
}
