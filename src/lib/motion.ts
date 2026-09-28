"use client";

import { useSyncExternalStore } from "react";
import { kd, type MotionMode } from "./store";

/**
 * Motion mode, from the OS prefers-reduced-motion setting.
 * For EFFECT-ONLY consumers (GSAP islands, Lenis): during hydration it already returns the real
 * client value read from html[data-motion], so full-motion effects never start and revert on a
 * reduced-motion device. Components that RENDER the mode must use useKd((s) => s.motion) instead.
 */
export function useMotionMode(): MotionMode {
  return useSyncExternalStore(
    kd.subscribe,
    () => kd.get().motion,
    () => (typeof document === "undefined" ? "full" : kd.get().motion),
  );
}

export const isFinePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

export const isDesktop = () => typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches;
