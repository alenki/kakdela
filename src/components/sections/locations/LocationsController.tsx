"use client";

import { useEffect } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";

const ONCE = "play none none none";

/** Open or close one café row. Shared with the «Какая ближе ко мне?» island. */
export function setCafeOpen(row: Element, open: boolean) {
  row.toggleAttribute("data-open", open);
  row.querySelector("[data-cafe-toggle]")?.setAttribute("aria-expanded", String(open));
}

/**
 * Enhances the server-rendered section: the disclosures, and one quiet rise for the heading block and
 * for the list. Only what is still below the fold waits for its entrance; reduced motion hides nothing.
 */
export function LocationsController() {
  const mode = useMotionMode();

  // Disclosures: one delegated listener for every row.
  useEffect(() => {
    const root = document.getElementById("gde");
    if (!root) return;
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as Element | null)?.closest?.("[data-cafe-toggle]");
      const row = btn?.closest("[data-cafe]");
      if (!btn || !row) return;
      setCafeOpen(row, btn.getAttribute("aria-expanded") !== "true");
    };
    root.addEventListener("click", onClick);
    return () => root.removeEventListener("click", onClick);
  }, []);

  useGSAP(
    () => {
      const root = document.getElementById("gde");
      if (!root || mode !== "full") return;
      const below = (el: Element) => el.getBoundingClientRect().top > window.innerHeight * 0.92;
      const rise = { y: 20, opacity: 0, duration: 0.7, ease: "kd.out", clearProps: "transform,opacity" };

      const head = root.querySelector("[data-loc-head]");
      if (head && below(head)) {
        const block = [head.querySelector("[data-dlg-q]"), head.querySelector("[data-dlg-a]"), head.querySelector(".lead"), root.querySelector("[data-loc-tools]")];
        gsap.from(block.filter(Boolean), { ...rise, stagger: 0.06, scrollTrigger: { trigger: head, start: "top 86%", toggleActions: ONCE } });
      }

      // The rows of the city on screen, then the closing line.
      const rows = Array.from(root.querySelectorAll("[data-cafe], [data-loc-foot]")).filter((r) => r.getClientRects().length > 0 && below(r));
      if (rows.length) gsap.from(rows, { ...rise, stagger: 0.05, scrollTrigger: { trigger: rows[0], start: "top 92%", toggleActions: ONCE } });
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
