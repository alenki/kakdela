"use client";

import { useSyncExternalStore } from "react";
import { kd, useKd } from "@/lib/store";
import { t } from "@/i18n";

const subscribeNever = () => () => {};

/**
 * «Меньше движения / Больше движения»: the site-wide motion switch. The label names the action;
 * the little line shows the current state (a wave while things move, flat when they rest).
 * Without JS it can't do anything, so it stays hidden until the page is interactive.
 */
export function MotionToggle() {
  // Renders the mode, so it must use the hydration-safe store snapshot (not useMotionMode).
  const mode = useKd((s) => s.motion);
  const ready = useSyncExternalStore(subscribeNever, () => true, () => false);
  return (
    <button
      type="button"
      className="ft-motion"
      data-mode={mode}
      hidden={!ready}
      onClick={() => kd.setMotion(mode === "full" ? "reduced" : "full")}
    >
      <svg className="ft-motion__icon" viewBox="0 0 28 12" aria-hidden="true" focusable="false">
        <path className="ft-motion__wave" d="M1 6Q4.25 0.5 7.5 6T14 6T20.5 6T27 6" />
        <path className="ft-motion__flat" d="M1 6H27" />
      </svg>
      <span>{mode === "full" ? t.footer.lessMotion : t.footer.moreMotion}</span>
    </button>
  );
}
