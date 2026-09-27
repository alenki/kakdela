"use client";

import { gsap, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";

const ONCE = "play none none none";

/**
 * One quiet rise per block as it comes into view: the heading, the desserts in turn, the pie row,
 * the chess block. The section is server-rendered and visible before this runs; reduced motion
 * returns early, so nothing is ever hidden. A block already on screen at mount (a deep link to
 * #vecher, motion switched back on near the bottom) stays as rendered.
 */
export function EveningMotion() {
  const mode = useMotionMode();

  useGSAP(
    () => {
      if (mode !== "full") return;
      const root = document.getElementById("vecher");
      if (!root) return;
      const fold = window.innerHeight * 0.88;
      const rise = { y: 20, opacity: 0, duration: 0.7, ease: "kd.out", clearProps: "transform,opacity" };

      root.querySelectorAll<HTMLElement>("[data-ev-block]").forEach((block) => {
        if (block.getBoundingClientRect().top < fold) return;
        const items = block.querySelectorAll("[data-ev-item]");
        gsap.from(items.length ? items : block, {
          ...rise,
          stagger: 0.06,
          scrollTrigger: { trigger: block, start: "top 88%", toggleActions: ONCE },
        });
      });
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
