"use client";

import { useEffect } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";

/**
 * Enhances the server-rendered team section:
 * - the founding line rises out of line masks once it is three quarters up the screen;
 * - the four cards rise after it, in order;
 * - on phones the card rail becomes a keyboard stop only while it actually scrolls sideways.
 * Reduced motion: nothing moves, nothing is hidden.
 */
export function TeamMotion() {
  const mode = useMotionMode();

  useEffect(() => {
    const rail = document.querySelector<HTMLElement>("#komanda [data-team-rail]");
    if (!rail) return;
    const sync = () => {
      if (rail.scrollWidth > rail.clientWidth + 1) rail.tabIndex = 0;
      else rail.removeAttribute("tabindex");
    };
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(rail);
    return () => ro.disconnect();
  }, []);

  useGSAP(
    (_ctx, contextSafe) => {
      if (mode !== "full" || document.documentElement.dataset.motion === "reduced") return;
      const root = document.getElementById("komanda");
      const lead = root?.querySelector<HTMLElement>("[data-team-lead]");
      const rail = root?.querySelector<HTMLElement>("[data-team-rail]");
      if (!root || !lead || !rail || !contextSafe) return;
      const title = root.querySelector<HTMLElement>(".team__title");
      const source = root.querySelector<HTMLElement>("[data-team-source]");
      const cards = gsap.utils.toArray<HTMLElement>("[data-team-card]", rail);
      let alive = true;

      // Cards: a quiet rise, in reading order.
      gsap.from(cards, {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: "kd.out",
        stagger: 0.08,
        clearProps: "transform,opacity",
        scrollTrigger: { trigger: rail, start: "top 82%", toggleActions: "play none none none" },
      });

      // Lead: split only once the real faces are in, so the lines match what the guest will see.
      const reveal = contextSafe(() => {
        if (!alive) return;
        const split = SplitText.create(lead, {
          type: "lines",
          mask: "lines",
          linesClass: "team-ln",
          aria: "none",
          // Keep the no-break spaces (dash and short-word bindings) and leave the unbreakable
          // «как дела?» — unit whole, or the split lines would wrap differently from the
          // paragraph they revert to.
          reduceWhiteSpace: false,
          ignore: lead.querySelectorAll(".team__bind"),
        });
        const tl = gsap.timeline({
          defaults: { ease: "kd.out" },
          scrollTrigger: { trigger: lead, start: "top 75%", toggleActions: "play none none none" },
          onComplete: () => split.revert(),
        });
        if (title) tl.from(title, { opacity: 0, y: 14, duration: 0.7, clearProps: "all" }, 0);
        tl.from(split.lines, { yPercent: 100, duration: 0.9, stagger: 0.08 }, 0.06);
        if (source) tl.from(source, { opacity: 0, duration: 0.6, clearProps: "all" }, ">-0.35");
      });

      const fonts = document.fonts;
      if (fonts && fonts.status !== "loaded") fonts.ready.then(reveal);
      else reveal();

      return () => {
        alive = false;
      };
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
