"use client";

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";

const ONCE = "play none none none";

/**
 * One quiet rise per block as it arrives, as on the homepage: each section's heading, then its cards in small
 * batches (whatever arrives together rises together), and the last word. The top of the page never moves.
 * Everything is server-rendered and visible before this runs; reduced motion returns early, and whatever is
 * already on screen at mount (a deep link) stays as rendered.
 */
export function MenuMotion() {
  const mode = useMotionMode();

  useGSAP(
    () => {
      if (mode !== "full") return;
      const root = document.getElementById("main");
      if (!root) return;
      const vh = window.innerHeight;
      const ahead = (el: Element) => el.getClientRects().length > 0 && el.getBoundingClientRect().top > vh * 0.9;
      const rise = { opacity: 0, y: 20, duration: 0.7, ease: "kd.out", clearProps: "opacity,transform" };

      root.querySelectorAll("[data-mn-head]").forEach((head) => {
        if (!ahead(head)) return;
        gsap.from(Array.from(head.children), { ...rise, stagger: 0.06, scrollTrigger: { trigger: head, start: "top 90%", toggleActions: ONCE } });
      });
      root.querySelectorAll("[data-mn-rise], .mn-kitchen").forEach((el) => {
        if (!ahead(el)) return;
        gsap.from(el, { ...rise, scrollTrigger: { trigger: el, start: "top 90%", toggleActions: ONCE } });
      });

      // The cards. A jump carries the page past some of them: those are simply there, only what is on screen rises.
      const cards = Array.from(root.querySelectorAll<HTMLElement>("[data-mn-card]")).filter(ahead);
      if (cards.length) {
        gsap.set(cards, { opacity: 0, y: 20 });
        ScrollTrigger.batch(cards, {
          start: "top 92%",
          once: true,
          onEnter: (batch) => {
            const passed = batch.filter((el) => el.getBoundingClientRect().bottom < 0);
            const here = batch.filter((el) => !passed.includes(el));
            if (passed.length) gsap.set(passed, { opacity: 1, y: 0, clearProps: "opacity,transform" });
            if (here.length) gsap.to(here, { opacity: 1, y: 0, duration: 0.7, ease: "kd.out", stagger: 0.06, clearProps: "opacity,transform" });
          },
        });
      }
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
