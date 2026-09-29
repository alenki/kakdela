"use client";

// «Какая ближе ко мне?» on /locations, as the plan needs it: where the guest is, how sure the fix is, and which
// café the answer points at. LocationsNearest writes it; PlanController draws it. A module store, so a late mount
// still reads the last answer.

export type NearAnswer = {
  here: { lat: number; lon: number };
  /** The fix's radius in metres (Geolocation's own accuracy). */
  accuracy: number;
  /** The café the red mark and the line go to: the nearest open one, or the invited one. */
  target: string;
  /** Straight-line distance to it, in km. */
  d: number;
};

let answer: NearAnswer | null = null;
const listeners = new Set<() => void>();

export const nearStore = {
  get: () => answer,
  set(next: NearAnswer | null) {
    answer = next;
    for (const l of listeners) l();
  },
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
};
