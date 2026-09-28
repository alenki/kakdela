"use client";

import { gsap, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";

const ONCE = "play none none none";

/**
 * Enhances the server-rendered section with one quiet rise for the heading block and one for the list.
 * Only what is still below the fold waits for its entrance; reduced motion hides nothing.
 */
export function LocationsController() {
  const mode = useMotionMode();

  useGSAP(
    () => {
      const root = document.getElementById("gde");
      if (!root || mode !== "full") return;
      const below = (el: Element) => el.getBoundingClientRect().top > window.innerHeight * 0.92;
      const rise = { y: 20, opacity: 0, duration: 0.7, ease: "kd.out", clearProps: "transform,opacity" };

      const head = root.querySelector("[data-loc-head]");
      if (head && below(head)) {
        const block = [head.querySelector("[data-dlg-a]"), root.querySelector("[data-loc-tools]")];
        gsap.from(block.filter(Boolean), { ...rise, stagger: 0.06, scrollTrigger: { trigger: head, start: "top 86%", toggleActions: ONCE } });
      }

      // The rows of the city on screen, then the closing line.
      const rows = Array.from(root.querySelectorAll("[data-cafe], [data-loc-foot]")).filter((r) => r.getClientRects().length > 0 && below(r));
      if (rows.length) gsap.from(rows, { ...rise, stagger: 0.05, scrollTrigger: { trigger: rows[0], start: "top 92%", toggleActions: ONCE } });
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
