"use client";

import { useEffect } from "react";
import { kd } from "@/lib/store";
import { sound } from "@/lib/sound";
import { msToMoscowMidnight, newYearAt, phaseAt, previewFrom } from "@/lib/season";

/** The chimes strike every 3.2 s or so, as the Kremlin clock does on television. */
const STRIKE = 3.2;

/**
 * The season's clock («С наступающим!», docs/CONVENTIONS.md), in the root layout, so it lives across page
 * switches. It turns html[data-season] over at Moscow midnight (the greeting changes on the page the guest is
 * reading), and at midnight on 1 January the Kremlin clock strikes twelve: with the sound on, its bell; with
 * or without, the garland jumps at every stroke (kd:chimes) and on the twelfth the line becomes «С Новым
 * годом!». With the sound on, a torn tab rips. A preview (`?season=`) keeps its phase.
 */
export function SeasonIsland() {
  useEffect(() => {
    const html = document.documentElement;
    if (!html.classList.contains("js")) return;
    const preview = previewFrom(location.search) !== undefined;
    const timers: number[] = [];

    // ── The day turns over at Moscow midnight ──
    const turn = () => {
      if (preview) return;
      const p = phaseAt(new Date());
      if (p) html.dataset.season = p;
      else delete html.dataset.season;
    };
    const midnight = () => {
      timers.push(
        window.setTimeout(() => {
          turn();
          midnight();
        }, msToMoscowMidnight(new Date()) + 500),
      );
    };
    midnight();

    // ── Midnight on 1 January: the chimes ──
    const ny = html.dataset.season === "eve" ? newYearAt(new Date()) : null;
    const until = ny == null ? Infinity : ny - Date.now();
    // Only for a guest whose page is open as it comes (a timer this long stays exact enough).
    if (until > 0 && until < 6 * 3600_000) {
      timers.push(
        window.setTimeout(() => {
          const t0 = sound.now();
          for (let k = 0; k < 12; k++) {
            if (sound.on) sound.chime({ at: t0 + 0.05 + k * STRIKE, gain: k === 11 ? 1.15 : 1 });
            timers.push(window.setTimeout(() => window.dispatchEvent(new CustomEvent("kd:chimes", { detail: { stroke: k + 1 } })), k * STRIKE * 1000));
          }
          timers.push(
            window.setTimeout(() => {
              if (!preview) html.dataset.season = "ny";
            }, 11 * STRIKE * 1000 + 200),
          );
        }, until),
      );
    }

    // ── A torn tab rips (the store counts the tears) ──
    let torn = kd.get().torn.length;
    const unsub = kd.subscribe(() => {
      const n = kd.get().torn.length;
      if (n > torn) sound.tear(0.9 + Math.random() * 0.2);
      torn = n;
    });

    return () => {
      timers.forEach((id) => window.clearTimeout(id));
      unsub();
    };
  }, []);

  return null;
}
