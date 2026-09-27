"use client";

import { gsap, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";

const ONCE = "play none none none";

/**
 * One quiet rise per block as it comes into view: the heading, the photo, then the list title, the
 * drinks in reading order and the links. The section is server-rendered and visible before this runs;
 * reduced motion returns early, so nothing is ever hidden.
 */
export function CoffeeMotion() {
  const mode = useMotionMode();

  useGSAP(
    () => {
      if (mode !== "full" || document.documentElement.dataset.motion === "reduced") return;
      const root = document.getElementById("kofe");
      if (!root) return;
      const head = root.querySelector("[data-kofe-head]");
      const photo = root.querySelector("[data-kofe-photo]");
      const rows = root.querySelectorAll("[data-kofe-rise]");
      const rise = { y: 20, opacity: 0, duration: 0.7, ease: "kd.out", clearProps: "transform,opacity" };

      if (head) gsap.from(head, { ...rise, scrollTrigger: { trigger: head, start: "top 85%", toggleActions: ONCE } });
      if (photo) gsap.from(photo, { ...rise, duration: 0.8, scrollTrigger: { trigger: photo, start: "top 85%", toggleActions: ONCE } });
      if (rows.length)
        gsap.from(rows, { ...rise, stagger: 0.05, scrollTrigger: { trigger: rows[0], start: "top 88%", toggleActions: ONCE } });
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
