"use client";

import { gsap, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";

/**
 * Entrances for the breakfasts: the heading, then each block (the bar, every menu row, the photo,
 * the links) rises in once as it arrives. Everything is server-rendered and visible;
 * this only runs after mount in full motion, so reduced motion and no-JS keep the final state.
 */
export function BreakfastsMotion() {
  const mode = useMotionMode();

  useGSAP(
    () => {
      if (mode !== "full") return;
      const root = document.getElementById("zavtraki");
      if (!root) return;
      // Only animate what the guest hasn't reached yet: a block already on screen (deep link, motion
      // toggled mid-page) stays as rendered, and no trigger is created already past.
      const vh = window.innerHeight;
      const ahead = (el: Element) => el.getBoundingClientRect().top > vh * 0.9;
      const rise = (targets: Element | Element[], trigger: Element) =>
        gsap.from(targets, {
          opacity: 0,
          y: 20,
          duration: 0.7,
          ease: "kd.out",
          stagger: 0.06,
          clearProps: "opacity,transform",
          scrollTrigger: { trigger, start: "top 90%", toggleActions: "play none none none" },
        });

      const head = root.querySelector("[data-bf-head]");
      if (head && ahead(head)) rise(Array.from(head.children), head);
      root.querySelectorAll("[data-bf-rise]").forEach((el) => {
        if (ahead(el)) rise(el, el);
      });
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
