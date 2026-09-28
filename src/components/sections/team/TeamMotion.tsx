"use client";

import { gsap, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";

/**
 * One quiet rise per block as it comes into view: the founding line, then the four cards in reading
 * order, each card's slip landing on its portrait as the row rises. Only blocks the guest hasn't
 * reached yet move, so a deep link never hides what is already on screen. Reduced motion: nothing
 * moves, nothing is hidden.
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
      // Cards rise a row at a time (four up on a desktop, two up on a phone), a beat apart. 0.18s in, each
      // card's slip lands on its portrait the way the guest's answer lands on the dish in the hero
      // (HeroController: a touch larger, as if from above, and settles). The slip's tilt is its CSS
      // `rotate`: GSAP folds it into the inline transform while the landing runs and hands it back on
      // clearProps, so the slip keeps its lean throughout.
      const cards = gsap.utils.toArray<HTMLElement>("[data-team-card]", root);
      [...new Set(cards.map((c) => c.offsetTop))].forEach((top) => {
        const row = cards.filter((c) => c.offsetTop === top);
        if (!ahead(row[0])) return;
        const slips = row.flatMap((c) => c.querySelector("[data-team-slip]") ?? []);
        const scene = gsap.timeline({ scrollTrigger: { trigger: row[0], start: "top 88%", once: true } });
        scene.from(row, { y: 20, opacity: 0, duration: 0.7, ease: "kd.out", stagger: 0.06, clearProps: "transform,opacity" }, 0);
        if (slips.length) {
          scene.fromTo(
            slips,
            { opacity: 0, y: -26, scale: 1.05 },
            { opacity: 1, y: 0, scale: 1, duration: 0.55, ease: "kd.settle", stagger: 0.06, clearProps: "opacity,transform" },
            0.18,
          );
        }
      });
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
