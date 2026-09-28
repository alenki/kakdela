"use client";

import { gsap, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";

const ONCE = "play none none none";

/**
 * One quiet rise for the heading and one for the blitz as they come into view. The board has its own
 * entrance (Black's last move slides in, Game.tsx). Everything is server-rendered and final without JS;
 * reduced motion returns early, and a block already on screen at mount stays as rendered.
 */
export function ChessMotion() {
  const mode = useMotionMode();

  useGSAP(
    () => {
      if (mode !== "full") return;
      const root = document.getElementById("shahmaty");
      if (!root) return;
      const rise = { opacity: 0, y: 20, duration: 0.7, ease: "kd.out", clearProps: "opacity,transform" };
      // Timelines, not lone tweens (see FooterMotion): a timeline defers its trigger's first refresh.
      root.querySelectorAll<HTMLElement>("[data-ch-block]").forEach((block) => {
        if (block.getBoundingClientRect().top < window.innerHeight * 0.88) return;
        gsap.timeline({ scrollTrigger: { trigger: block, start: "top 88%", toggleActions: ONCE } }).from(block, rise);
      });
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
