"use client";

import { useLayoutEffect } from "react";
import { useKd } from "@/lib/store";
import { pickByHour } from "@/lib/time";
import { t } from "@/i18n";

/**
 * Keeps «А прямо сейчас?» on the minute: the page's clock (Providers) ticks the store once a minute, and
 * this writes the same html attribute and custom properties as NOW_SCRIPT (src/lib/about-script.ts), which
 * only runs on a full page load. A layout effect, so a client-side visit is right before its first paint.
 * Leaving the page takes them off again.
 */
export function NowClock() {
  const now = useKd((s) => s.now);

  useLayoutEffect(() => {
    if (now === null) return;
    const html = document.documentElement;
    html.dataset.daypart = String(t.dayparts.indexOf(pickByHour(t.dayparts, now)));
    html.style.setProperty("--kd-now", String(now));
    html.style.setProperty("--kd-h", String(Math.floor(now / 60)));
    html.style.setProperty("--kd-m", String(now % 60));
  }, [now]);

  useLayoutEffect(
    () => () => {
      const html = document.documentElement;
      delete html.dataset.daypart;
      for (const p of ["--kd-now", "--kd-h", "--kd-m"]) html.style.removeProperty(p);
    },
    [],
  );

  return null;
}
