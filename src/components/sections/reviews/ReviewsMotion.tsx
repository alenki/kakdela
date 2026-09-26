"use client";

import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";

/** One reveal per block: the tomato dash (or the café's clover) draws, then the lines rise in their masks. */
function reveal(block: HTMLElement, lines: Element[], onComplete?: () => void) {
  const dash = block.querySelector("[data-rv-dash]");
  const clover = block.querySelector("[data-rv-clover]");
  const tail = block.querySelectorAll("[data-rv-cap], .rv__all");
  const tl = gsap.timeline({
    defaults: { ease: "kd.out" },
    scrollTrigger: { trigger: block, start: "top 84%", toggleActions: "play none none none" },
    onComplete,
  });
  if (dash) tl.from(dash, { scaleX: 0, transformOrigin: "0% 50%", duration: 0.5, ease: "kd.inOut", clearProps: "transform" }, 0);
  if (clover) tl.from(clover, { rotation: -90, scale: 0.6, opacity: 0, duration: 0.9, clearProps: "transform,opacity" }, 0);
  // 100% of the line plus the mask's descender allowance, so nothing peeks before its turn.
  tl.from(lines, { yPercent: 125, duration: 0.85, stagger: 0.07, clearProps: "transform" }, dash ? 0.3 : 0.12);
  if (tail.length) tl.from(tail, { opacity: 0, y: 8, duration: 0.6, clearProps: "transform,opacity" }, ">-0.5");
  return tl;
}

/**
 * Hand a quote back to the browser. Reverting rewrites the paragraph's HTML, so a dish link that has
 * keyboard focus is focused again in the fresh markup (otherwise focus would drop to <body>).
 */
function unsplit(split: SplitText, text: HTMLElement) {
  const focused = Array.from(text.querySelectorAll<HTMLElement>("a[href]")).indexOf(document.activeElement as HTMLElement);
  split.revert();
  if (focused >= 0) text.querySelectorAll<HTMLElement>("a[href]")[focused]?.focus({ preventScroll: true });
}

/**
 * Quiet entrances for «— Как вам у нас?»: each guest line waits for its tomato dash to draw,
 * then rises line by line inside masks, once. The 5,0 and the figures never move.
 * Markup is server-rendered and readable without JS; reduced motion leaves everything static.
 * Keyboard focus inside a block lands its reveal at once, so nothing focused waits under a mask.
 */
export function ReviewsMotion() {
  const mode = useMotionMode();

  useGSAP(
    () => {
      // The store hydrates from its server snapshot ("full"); the head script's attribute is right before
      // first paint, so reduced-motion visitors never get one split-and-hide pass before the store catches up.
      if (mode === "reduced" || document.documentElement.dataset.motion === "reduced") return;
      const root = document.getElementById("otzyvy");
      if (!root) return;
      const offs: (() => void)[] = [];
      const landOnFocus = (block: HTMLElement, land: () => void) => {
        block.addEventListener("focusin", land);
        offs.push(() => block.removeEventListener("focusin", land));
      };

      // Guests' quotes: real line breaks come from SplitText (re-split on font swap / resize until played).
      root.querySelectorAll<HTMLElement>("[data-rv-q]").forEach((block) => {
        const text = block.querySelector<HTMLElement>("[data-rv-text]");
        if (!text) return;
        let tl: gsap.core.Timeline | undefined;
        const split = SplitText.create(text, {
          type: "lines",
          mask: "lines",
          linesClass: "rv-line",
          tag: "span",
          aria: "none",
          // Keep the server's no-break spaces (\s would eat them), so lines break the same before and after the reveal.
          reduceWhiteSpace: false,
          autoSplit: true,
          // Hand the paragraph back to the browser once it has landed.
          onSplit: (self) => (tl = reveal(block, self.lines, () => unsplit(self, text))),
        });
        // A dish link (or the source) reached by keyboard mid-reveal would sit under its line mask.
        landOnFocus(block, () => {
          if (split.isSplit) tl?.progress(1);
        });
      });

      // The café's sign-off: two authored lines, masked only while they move.
      const close = root.querySelector<HTMLElement>("[data-rv-close]");
      if (close) {
        const lines = Array.from(close.querySelectorAll("[data-rv-line]"));
        const masks = lines.map((l) => l.parentElement).filter(Boolean);
        gsap.set(masks, { overflow: "clip" });
        const tl = reveal(close, lines, () => gsap.set(masks, { clearProps: "overflow" }));
        landOnFocus(close, () => tl.progress(1));
      }

      return () => offs.forEach((off) => off());
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
