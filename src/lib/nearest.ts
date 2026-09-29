import { haversineKm } from "./geo";
import { groupDigits, km } from "./format";
import { typograf } from "./typograf";
import { t } from "@/i18n";

// «Какая ближе ко мне?»: the distances the homepage's cafés and /locations say, one rounding for both, so a row's
// tag and the message above it never disagree by a step.

/** The browser's own timeout starts only after permission; this one also covers an ignored prompt. */
export const GEO_TIMEOUT = 8000;
/** Beyond this the guest is clearly out of town: no «ближе всех», just an honest distance. */
export const FAR_KM = 60;

/** Under a kilometre, metres (rounded to 50: GPS is not more precise than that); then «1,4 км», «34 км», «1 234 км». */
const isNear = (d: number) => d < 0.975;
const metres = (d: number) => Math.max(50, Math.round((d * 1000) / 50) * 50);
const kmNum = (d: number) => (d < 1000 ? km(d) : groupDigits(Math.round(d)));

/** «650 м», «1,4 км»: the unit never leaves its number. */
export const distLabel = (d: number) => (isNear(d) ? t.locations.metres(metres(d)) : t.locations.km(kmNum(d)));

/** «ближе всех · 1,4 км»: typograf holds «·» to the words before it and the unit to its number. */
export const nearestTag = (d: number) =>
  typograf(isNear(d) ? t.locations.nearestTagMetres(metres(d)) : t.locations.nearestTag(kmNum(d)));

export type Here = { lat: number; lon: number };
export type Ranked<P> = P & { d: number };

/** Every point with its distance from the guest, nearest first. */
export function rank<P extends Here>(points: P[], here: Here): Ranked<P>[] {
  return points.map((p) => ({ ...p, d: haversineKm(here, p) })).sort((a, b) => a.d - b.d);
}
