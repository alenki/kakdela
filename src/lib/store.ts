"use client";

import { useSyncExternalStore } from "react";
import type { AnswerId, City } from "@/content/types";
import { answerById } from "@/content/answers";
import { minutesInMoscow } from "./time";

export type MotionMode = "full" | "reduced";

export type KdState = {
  /** The answer currently shown (guessed or torn). */
  answer: AnswerId | null;
  /** true while the answer is only a time-of-day guess (not chosen by the guest). */
  guessed: boolean;
  torn: AnswerId[];
  city: City;
  motion: MotionMode;
  /** Minutes since Moscow midnight; null until mounted (server renders neutral copy). */
  now: number | null;
  /** Answer from a previous day (for «Вчера было…»). */
  yesterday: AnswerId | null;
};

const SERVER: KdState = { answer: null, guessed: false, torn: [], city: "nalchik", motion: "full", now: null, yesterday: null };

let state: KdState | null = null;

/** Only known answer ids ever enter the store (defence in depth after the head-script whitelist). */
const asAnswer = (v: string | undefined): AnswerId | null => (v && Object.hasOwn(answerById, v) ? (v as AnswerId) : null);
const listeners = new Set<() => void>();

function readDom(): KdState {
  const d = document.documentElement.dataset;
  return {
    answer: asAnswer(d.answer),
    guessed: d.guess === "1",
    torn: [],
    city: d.city === "vladikavkaz" ? "vladikavkaz" : "nalchik",
    motion: d.motion === "reduced" ? "reduced" : "full",
    now: minutesInMoscow(new Date()),
    yesterday: asAnswer(d.yesterday),
  };
}

function current(): KdState {
  if (state === null) state = typeof document === "undefined" ? SERVER : readDom();
  return state;
}

function emit() {
  for (const l of listeners) l();
}

function safe(fn: () => void) {
  try { fn(); } catch { /* storage can be unavailable (private mode) */ }
}

export const kd = {
  get: current,
  subscribe(fn: () => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
  set(patch: Partial<KdState>) {
    state = { ...current(), ...patch };
    emit();
  },
  setCity(city: City) {
    document.documentElement.dataset.city = city;
    safe(() => localStorage.setItem("kd-city", city));
    kd.set({ city });
  },
  /** A friend's link to a café: show its city without remembering it (html[data-city] and the store, never storage). */
  showCity(city: City) {
    document.documentElement.dataset.city = city;
    kd.set({ city });
  },
  setMotion(motion: MotionMode) {
    document.documentElement.dataset.motion = motion;
    kd.set({ motion });
  },
  answer(id: AnswerId) {
    const s = current();
    const torn = s.torn.includes(id) ? s.torn : [...s.torn, id];
    document.documentElement.dataset.answer = id;
    // A tear is an answer: /menu marks it (a preview never is).
    document.documentElement.dataset.said = id;
    delete document.documentElement.dataset.guess;
    const day = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow" }).format(new Date());
    safe(() => localStorage.setItem("kd-last", JSON.stringify({ id, day })));
    kd.set({ answer: id, guessed: false, torn });
  },
  /** Browsing with the arrow keys: show the answer everywhere, but don't remember it until torn. */
  preview(id: AnswerId) {
    document.documentElement.dataset.answer = id;
    delete document.documentElement.dataset.guess;
    kd.set({ answer: id, guessed: false });
  },
  resetTorn() {
    kd.set({ torn: [] });
  },
  tick() {
    kd.set({ now: minutesInMoscow(new Date()) });
  },
};

/** Subscribe to a slice. Selectors must return primitives or stable references. */
export function useKd<T>(select: (s: KdState) => T): T {
  return useSyncExternalStore(
    kd.subscribe,
    () => select(current()),
    () => select(SERVER),
  );
}
