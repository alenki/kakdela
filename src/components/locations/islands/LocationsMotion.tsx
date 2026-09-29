"use client";

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";

/**
 * The page's quiet arrivals: the rows and the foot rise once as they come (only what is below the fold
 * at mount; a row already on screen, or reached by a link, stays as rendered). The paper never moves; where the
 * plan starts below the fold (phones), its marks are set down on it once, the hero's landing in miniature.
 * Reduced motion returns early and hides nothing.
 */
export function LocationsMotion() {
  const mode = useMotionMode();

  useGSAP(
    () => {
      if (mode !== "full") return;
      const root = document.getElementById("kofejni");
      if (!root) return;
      const vh = window.innerHeight;
      const ahead = (el: Element, at = 0.9) => el.getClientRects().length > 0 && el.getBoundingClientRect().top > vh * at;

      // The row a link names is never hidden, wherever the pick has put it (and whenever it is put there).
      let linked = "";
      try {
        linked = decodeURIComponent(location.hash.slice(1));
      } catch {}
      const units = Array.from(root.querySelectorAll<HTMLElement>("[data-lc-rise]")).filter((el) => el.id !== linked && ahead(el));
      if (units.length) {
        gsap.set(units, { opacity: 0, y: 20 });
        ScrollTrigger.batch(units, {
          start: "top 90%",
          once: true,
          onEnter: (batch) => {
            const passed = batch.filter((el) => el.getBoundingClientRect().bottom < 0);
            const here = batch.filter((el) => !passed.includes(el));
            if (passed.length) gsap.set(passed, { opacity: 1, y: 0, clearProps: "opacity,transform" });
            if (here.length) gsap.to(here, { opacity: 1, y: 0, duration: 0.7, ease: "kd.out", stagger: 0.06, clearProps: "opacity,transform" });
          },
        });
      }

      // The plan on show, if it waits below the fold: its marks land in the list's order.
      root.querySelectorAll<HTMLElement>("[data-lc-plan]").forEach((plan) => {
        const map = plan.querySelector("[data-lc-map]");
        if (!map || !ahead(map, 0.85)) return;
        const drops = Array.from(plan.querySelectorAll<HTMLElement>(".lc-mk__drop"));
        gsap.from(drops, {
          y: -12,
          scale: 1.2,
          opacity: 0,
          duration: 0.5,
          ease: "kd.settle",
          stagger: 0.05,
          clearProps: "transform,opacity",
          scrollTrigger: { trigger: map, start: "top 85%", toggleActions: "play none none none" },
        });
      });
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
