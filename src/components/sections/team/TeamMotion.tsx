"use client";

import { gsap, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";

/**
 * One quiet rise per block as it comes into view: the founding line, the four cards in reading order,
 * then the note. Only blocks the guest hasn't reached yet move, so a deep link never hides what is
 * already on screen. Reduced motion: nothing moves, nothing is hidden.
 */
export function TeamMotion() {
  const mode = useMotionMode();

  useGSAP(
    () => {
      if (mode !== "full" || document.documentElement.dataset.motion === "reduced") return;
      const root = document.getElementById("komanda");
      if (!root) return;
      const ahead = (el: Element | null): el is Element => !!el && el.getBoundingClientRect().top > window.innerHeight * 0.9;
      const rise = (targets: Element | Element[], trigger: Element) =>
        gsap.from(targets, {
          y: 20,
          opacity: 0,
          duration: 0.7,
          ease: "kd.out",
          stagger: 0.06,
          clearProps: "transform,opacity",
          scrollTrigger: { trigger, start: "top 88%", once: true },
        });

      const head = root.querySelector("[data-team-head]");
      if (ahead(head)) rise(head, head);
      // Cards rise a row at a time (four up on a desktop, two up on a phone), a beat apart.
      const cards = gsap.utils.toArray<HTMLElement>("[data-team-card]", root);
      [...new Set(cards.map((c) => c.offsetTop))].forEach((top) => {
        const row = cards.filter((c) => c.offsetTop === top);
        if (ahead(row[0])) rise(row, row[0]);
      });
      const note = root.querySelector("[data-team-note]");
      if (ahead(note)) rise(note, note);
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
