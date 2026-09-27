"use client";

import { useSyncExternalStore } from "react";
import { kd, useKd } from "@/lib/store";
import { t } from "@/i18n";

const subscribeNever = () => () => {};

/**
 * «Меньше движения / Больше движения»: the site-wide motion switch, a quiet text control whose label
 * names the action. Without JS it can't do anything, so it stays hidden until the page is interactive.
 */
export function MotionToggle() {
  // Renders the mode, so it must use the hydration-safe store snapshot (not useMotionMode).
  const mode = useKd((s) => s.motion);
  const ready = useSyncExternalStore(subscribeNever, () => true, () => false);
  return (
    <button
      type="button"
      className="ft-motion dlink"
      hidden={!ready}
      onClick={() => kd.setMotion(mode === "full" ? "reduced" : "full")}
    >
      {mode === "full" ? t.footer.lessMotion : t.footer.moreMotion}
    </button>
  );
}
