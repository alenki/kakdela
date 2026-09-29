"use client";

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";

/**
 * «Уже спрашивали.» comes in quietly: the heading, then the list as it reaches the screen, the entries
 * that arrive together (from 1440, the two of a row) rising in reading order. An entry fades where it
 * stands and only its words rise, so its rules never slide against the rule above. Only what the guest
 * has never seen moves; a page opened on a #voprosy link, or reduced motion, shows everything as rendered.
 */
export function AskedMotion() {
  const mode = useMotionMode();

  useGSAP(
    () => {
      if (mode !== "full" || document.documentElement.dataset.motion === "reduced") return;
      if (window.location.hash.startsWith("#voprosy")) return;
      const root = document.getElementById("voprosy");
      if (!root) return;
      const vh = window.innerHeight;
      const rise = { duration: 0.7, ease: "kd.out" };

      const head = root.querySelector(".section-head");
      if (head && head.getBoundingClientRect().top > vh) {
        gsap
          .timeline({ scrollTrigger: { trigger: head, start: "top 88%", once: true } })
          .from(head.children, { ...rise, opacity: 0, y: 20, stagger: 0.06, clearProps: "opacity,transform" });
      }

      // Entries below the screen's edge: one painted in the bottom band at load stays as it is.
      const items = gsap.utils.toArray<HTMLElement>("[data-asked-row]", root).filter((el) => el.getBoundingClientRect().top > vh);
      if (!items.length) return;
      const words = (els: Element[]) => els.flatMap((el) => Array.from(el.children));
      gsap.set(items, { opacity: 0 });
      gsap.set(words(items), { y: 20 });
      // Grouped as they arrive, at whatever width the page has by then.
      ScrollTrigger.batch(items, {
        start: "top 92%",
        once: true,
        onEnter: (batch) => {
          const passed = batch.filter((el) => el.getBoundingClientRect().bottom < 0);
          const here = batch.filter((el) => !passed.includes(el));
          if (passed.length) {
            gsap.set(passed, { opacity: 1, clearProps: "opacity" });
            gsap.set(words(passed), { y: 0, clearProps: "transform" });
          }
          here.forEach((el, i) => {
            gsap.to(el, { ...rise, opacity: 1, delay: i * 0.06, clearProps: "opacity" });
            gsap.to(el.children, { ...rise, y: 0, delay: i * 0.06, clearProps: "transform" });
          });
        },
      });
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
