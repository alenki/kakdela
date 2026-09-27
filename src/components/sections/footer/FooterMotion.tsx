"use client";

import { gsap, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";

const ONCE = "play none none none";

/**
 * Two quiet rises: the columns as they come into view, then the wordmark. Everything is
 * server-rendered and final without JS; reduced motion returns early, so nothing is ever hidden.
 */
export function FooterMotion() {
  const mode = useMotionMode();

  useGSAP(
    () => {
      if (mode === "reduced") return;
      const root = document.getElementById("footer");
      if (!root) return;
      // Only what the guest hasn't reached yet: no replay on a reload at the bottom or a mode switch.
      const ahead = (el: Element, at: number) => el.getBoundingClientRect().top > window.innerHeight * at;
      const rise = { opacity: 0, y: 20, duration: 0.7, ease: "kd.out", clearProps: "opacity,transform" };
      // Timelines, not lone tweens: a timeline's trigger defers its first refresh by a tick, so it never
      // force-refreshes other sections' pending triggers mid-setup (a ScrollTrigger crash).
      const cols = root.querySelectorAll("[data-ft-col]");
      if (cols.length && ahead(cols[0], 0.88)) {
        gsap
          .timeline({ scrollTrigger: { trigger: cols[0], start: "top 88%", toggleActions: ONCE } })
          .from(cols, { ...rise, stagger: 0.06 });
      }
      const sign = root.querySelector("[data-ft-sign]");
      if (sign && ahead(sign, 0.92)) {
        gsap
          .timeline({ scrollTrigger: { trigger: sign, start: "top 92%", toggleActions: ONCE } })
          .from(sign, { ...rise, y: 32, duration: 1 });
      }
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
