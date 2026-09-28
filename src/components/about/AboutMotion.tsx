"use client";

import { gsap, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";

/**
 * The about page's quiet entrances, after the opening's exchange (CSS): one rise per block as it comes
 * into view ([data-ab-rise]: a heading, the ruler, a list), the own entries in turn with the slip landing on
 * «Лучше всех» as in the hero, the guest's note laid down on the evening's field, and the eight answers
 * dropped one by one at the end. Only what the guest hasn't reached yet moves, so a deep link or a reload
 * halfway down never hides what is on screen. Reduced motion: nothing moves, nothing is hidden.
 */
export function AboutMotion() {
  const mode = useMotionMode();

  useGSAP(
    () => {
      if (mode !== "full" || document.documentElement.dataset.motion === "reduced") return;
      const main = document.getElementById("main");
      if (!main) return;
      const ahead = (el: Element | null, at = 0.9): el is Element => !!el && el.getBoundingClientRect().top > window.innerHeight * at;
      const rise = { opacity: 0, y: 20, duration: 0.7, ease: "kd.out", clearProps: "opacity,transform" };
      // The hero's landing: a touch larger, as if from above, and it settles (a slip's tilt is CSS `rotate`).
      const land = { opacity: 0, y: -26, scale: 1.05, duration: 0.55, ease: "kd.settle", clearProps: "opacity,transform" };
      // Timelines, not lone tweens: a timeline's trigger defers its first refresh by a tick (FooterMotion).
      const once = (trigger: Element, start = "top 88%") => gsap.timeline({ scrollTrigger: { trigger, start, once: true } });

      main.querySelectorAll("[data-ab-rise]").forEach((block) => {
        if (!ahead(block)) return;
        const items = block.querySelectorAll("[data-ab-item]");
        const tl = once(block).from(items.length ? items : block, { ...rise, stagger: 0.06 });
        const slips = block.querySelectorAll("[data-ab-slip]");
        if (slips.length) tl.from(slips, land, 0.3);
      });

      const note = main.querySelector("[data-ab-note]");
      if (ahead(note)) once(note, "top 85%").from(note, { ...land, y: -34, duration: 0.7 });

      const pick = main.querySelector("[data-ab-pick]");
      if (ahead(pick)) once(pick, "top 88%").from(pick.querySelectorAll("[data-pick-slip]"), { ...land, stagger: 0.07 });
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
