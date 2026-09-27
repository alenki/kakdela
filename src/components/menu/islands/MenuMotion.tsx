"use client";

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";

const ONCE = "play none none none";

/**
 * One quiet rise per block as it arrives, as on the homepage: each chapter's heading, then its blocks (the
 * kitchen line, every signature row, the photos, the labels), and the card's categories and the vitrine's
 * rows in small batches. The cover never moves. Everything is server-rendered and visible before this runs;
 * reduced motion returns early, and a block already on screen at mount (a deep link) stays as rendered.
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
      root.querySelectorAll("[data-mn-rise]").forEach((el) => {
        if (!ahead(el)) return;
        gsap.from(el, { ...rise, scrollTrigger: { trigger: el, start: "top 90%", toggleActions: ONCE } });
      });
      root.querySelectorAll("[data-mn-photo]").forEach((el) => {
        if (!ahead(el)) return;
        gsap.from(el, { ...rise, duration: 0.8, scrollTrigger: { trigger: el, start: "top 85%", toggleActions: ONCE } });
      });

      // Many small units (the card's categories, the vitrine's rows): whatever arrives together rises together.
      const units = Array.from(root.querySelectorAll<HTMLElement>("[data-mn-unit], .mn-vit__list > .mi")).filter(ahead);
      if (units.length) {
        gsap.set(units, { opacity: 0, y: 20 });
        ScrollTrigger.batch(units, {
          start: "top 90%",
          once: true,
          onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: 0.7, ease: "kd.out", stagger: 0.06, clearProps: "opacity,transform" }),
        });
      }
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
