"use client";

import { gsap, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";

/**
 * «Отзывы» comes in once: the title rises and the 5,0 lands on its slip beside it (the hero strip's own
 * landing); then the notes are laid on the pile one by one, the bottom one first and the top one last
 * (the same landing), and the arrows and the link rise. Only blocks the guest hasn't reached yet move,
 * so a deep link never hides what is already on screen. Throwing the notes belongs to ReviewsPile: this
 * only moves each note's .rv-note__land, never its .rv-note__fly or the li. Reduced motion: nothing
 * moves, nothing is hidden.
 */
export function ReviewsMotion() {
  const mode = useMotionMode();

  useGSAP(
    () => {
      // The store hydrates from its server snapshot ("full"); the head script's attribute is right before
      // first paint, so reduced-motion visitors never get one hide-and-show pass before the store catches up.
      if (mode !== "full" || document.documentElement.dataset.motion === "reduced") return;
      const root = document.getElementById("otzyvy");
      if (!root) return;
      const ahead = (el: Element | null): el is Element => !!el && el.getBoundingClientRect().top > window.innerHeight * 0.9;
      const rise = { opacity: 0, y: 20, duration: 0.7, ease: "kd.out", clearProps: "opacity,transform" };
      // A touch larger, as if from above, and it settles (a slip's tilt is CSS `rotate`, never tweened).
      const land = { opacity: 0, y: -26, scale: 1.05, duration: 0.55, ease: "kd.settle", clearProps: "opacity,transform" };

      const title = root.querySelector(".rv-head .dlg");
      const slip = root.querySelector("[data-rv-slip]");
      if (ahead(title)) {
        const tl = gsap.timeline({ scrollTrigger: { trigger: title, start: "top 88%", once: true } });
        tl.from(title, rise);
        if (slip) tl.from(slip, land, 0.12);
      }

      const pile = root.querySelector(".rv-notes");
      if (ahead(pile)) {
        const lands = Array.from(root.querySelectorAll<HTMLElement>(".rv-note"))
          .sort((a, b) => Number(b.dataset.pos) - Number(a.dataset.pos))
          .flatMap((note) => note.querySelector(".rv-note__land") ?? []);
        gsap.from(lands, { ...land, stagger: 0.14, scrollTrigger: { trigger: pile, start: "top 85%", once: true } });
      }

      gsap.utils.toArray<HTMLElement>("[data-rv-reveal]", root).forEach((block) => {
        if (ahead(block)) gsap.from(block, { ...rise, scrollTrigger: { trigger: block, start: "top 88%", once: true } });
      });
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
