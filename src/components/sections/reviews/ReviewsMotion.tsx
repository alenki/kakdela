"use client";

import { gsap, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";

/**
 * One quiet entrance for «Отзывы»: the 5,0 with its figures, then the quotes and the link, each fades
 * up once as it enters. The 5,0 never counts. Markup is server-rendered and readable without JS;
 * reduced motion leaves everything still.
 */
export function ReviewsMotion() {
  const mode = useMotionMode();

  useGSAP(
    () => {
      // The store hydrates from its server snapshot ("full"); the head script's attribute is right before
      // first paint, so reduced-motion visitors never get one hide-and-show pass before the store catches up.
      if (mode === "reduced" || document.documentElement.dataset.motion === "reduced") return;
      const root = document.getElementById("otzyvy");
      if (!root) return;

      const blocks = gsap.utils.toArray<HTMLElement>("[data-rv-reveal]", root);
      blocks.forEach((block) => {
        // Blocks side by side (the three quotes from 1024px) rise together, a beat apart.
        const row = blocks.filter((b) => b.offsetTop === block.offsetTop);
        gsap.from(block, {
          opacity: 0,
          y: 20,
          duration: 0.7,
          ease: "kd.out",
          delay: row.indexOf(block) * 0.06,
          clearProps: "opacity,transform",
          scrollTrigger: { trigger: block, start: "top 88%", once: true },
        });
      });
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
