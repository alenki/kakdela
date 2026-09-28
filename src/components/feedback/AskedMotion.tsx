"use client";

import { gsap, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";

/**
 * «Уже спрашивали.» comes in quietly: the title, then the rows as they reach the screen. Only what the
 * guest hasn't reached yet moves; reduced motion returns early, so nothing is ever hidden.
 */
export function AskedMotion() {
  const mode = useMotionMode();

  useGSAP(
    () => {
      if (mode !== "full" || document.documentElement.dataset.motion === "reduced") return;
      const root = document.getElementById("voprosy");
      if (!root) return;
      const ahead = (el: Element | null): el is Element => !!el && el.getBoundingClientRect().top > window.innerHeight * 0.9;
      const rise = { opacity: 0, y: 20, duration: 0.7, ease: "kd.out", clearProps: "opacity,transform" };
      const head = root.querySelector(".section-head");
      if (ahead(head)) {
        gsap.timeline({ scrollTrigger: { trigger: head, start: "top 88%", once: true } }).from(head.children, { ...rise, stagger: 0.06 });
      }
      gsap.utils.toArray<HTMLElement>("[data-asked-row]", root).forEach((row) => {
        if (ahead(row)) gsap.timeline({ scrollTrigger: { trigger: row, start: "top 92%", once: true } }).from(row, rise);
      });
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
