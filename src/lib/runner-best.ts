/**
 * The runner's record, kept in the guest's browser. Tiny and dependency-free: the eager island reads it
 * for the first HUD write, the lazy controller writes it, and the tests check the parser.
 */

export const BEST_KEY = "kd-runner";
export const BEST_MAX = 99_999;

/** «00412»: the HUD's fixed five digits (tabular figures, so the line never jitters). */
export const pad5 = (n: number) => String(n).padStart(5, "0");

/** Anything but `{"v":1,"best":<integer 0…99 999>}` reads as no record. */
export function parseBest(raw: string | null): number {
  if (!raw) return 0;
  try {
    const v: unknown = JSON.parse(raw);
    if (typeof v !== "object" || v === null) return 0;
    const { v: version, best } = v as { v?: unknown; best?: unknown };
    if (version !== 1 || typeof best !== "number" || !Number.isInteger(best)) return 0;
    return best >= 0 && best <= BEST_MAX ? best : 0;
  } catch {
    return 0;
  }
}

export const serializeBest = (n: number) => JSON.stringify({ v: 1, best: n });

export function readBest(): number {
  try {
    return parseBest(localStorage.getItem(BEST_KEY));
  } catch {
    return 0; // storage can be unavailable (private mode)
  }
}

export function writeBest(n: number) {
  try {
    localStorage.setItem(BEST_KEY, serializeBest(n));
  } catch {
    /* storage can be unavailable (private mode) */
  }
}
