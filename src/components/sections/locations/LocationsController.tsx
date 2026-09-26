"use client";

import { useEffect } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";
import { useKd } from "@/lib/store";

/** Open or close one café card. Shared with the «Какая ближе ко мне?» island. */
export function setCafeOpen(row: Element, open: boolean) {
  row.toggleAttribute("data-open", open);
  row.querySelector("[data-cafe-toggle]")?.setAttribute("aria-expanded", String(open));
}

/**
 * The pin's x in viewBox units, from the Skyline's data-x. Not from its transform attribute: GSAP
 * rewrites that to matrix(...) and a revert doesn't restore it, so a rebuilt timeline would pop every pin at once.
 */
const pinX = (pin: SVGElement) => {
  const x = Number(pin.dataset.x);
  return Number.isFinite(x) ? x : 720;
};

/**
 * Enhances the server-rendered section: the disclosures, the skyline drawing itself in once
 * (and again for the other city), pins popping as the foothill line reaches them, and a calm
 * reveal of the heading and rows. Reduced motion: everything stays in its final state.
 */
export function LocationsController() {
  const mode = useMotionMode();
  const city = useKd((s) => s.city);

  // Disclosures: one delegated listener for every card.
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

  // The horizon draws once on enter; switching city afterwards draws the other one straight away.
  useGSAP(
    () => {
      const sky = document.querySelector<HTMLElement>("#gde [data-loc-sky]");
      const svg = sky
        ? Array.from(sky.querySelectorAll<SVGSVGElement>("svg[data-skyline]")).find((s) => s.getClientRects().length > 0)
        : undefined;
      if (!sky || !svg || mode === "reduced") return;

      const lines = svg.querySelectorAll("[data-draw]");
      const fills = [svg.querySelector(":scope > path"), svg.querySelector(":scope > g[clip-path]")].filter(Boolean);
      const peak = svg.querySelector("[data-peak]");
      const pins = Array.from(svg.querySelectorAll<SVGGElement>("[data-pin]"));

      const DRAW = 1.4;
      const tl = gsap.timeline({ paused: true, defaults: { ease: "kd.out" } });
      tl.fromTo(lines, { drawSVG: "0%" }, { drawSVG: "100%", duration: DRAW, ease: "kd.inOut", stagger: 0.12 }, 0);
      if (fills.length) tl.fromTo(fills, { opacity: 0 }, { opacity: 1, duration: 1.2 }, 0.3);
      if (peak) tl.fromTo(peak, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.6 }, 1.05);
      // Each pin lands as the foothill line (drawn first, west → east, nearly flat) passes over it:
      // invert the draw ease to find when the line reaches the pin's x.
      const ease = gsap.parseEase("kd.inOut");
      const reachAt = (frac: number) => {
        let lo = 0, hi = 1;
        for (let i = 0; i < 16; i++) {
          const mid = (lo + hi) / 2;
          if (ease(mid) < frac) lo = mid;
          else hi = mid;
        }
        return lo * DRAW;
      };
      for (const pin of pins) {
        tl.fromTo(
          pin,
          { scale: 0, transformOrigin: "50% 50%" },
          { scale: 1, duration: 0.5, ease: "back.out(1.4)" },
          reachAt(pinX(pin) / 1440),
        );
      }

      if (sky.dataset.drawn) {
        tl.play();
      } else {
        ScrollTrigger.create({
          trigger: sky,
          start: "top 82%",
          // no once: triggers that fire mid-creation (deep links) would corrupt ScrollTrigger; re-entries are harmless
          onEnter: () => {
            sky.dataset.drawn = "1";
            tl.play();
          },
        });
      }
    },
    { dependencies: [city, mode], revertOnUpdate: true },
  );

  // Heading and rows: only what is still below the fold waits for its entrance.
  useGSAP(
    () => {
      const root = document.getElementById("gde");
      if (!root || mode === "reduced") return;
      const below = (el: Element) => el.getBoundingClientRect().top > window.innerHeight * 0.92;

      const head = root.querySelector<HTMLElement>("[data-loc-head]");
      if (head && below(head)) {
        const tl = gsap.timeline({ defaults: { ease: "kd.out" }, scrollTrigger: { trigger: head, start: "top 86%", toggleActions: "play none none none" } });
        tl.from(head.querySelector("[data-dlg-q]"), { opacity: 0, y: 12, duration: 0.7 })
          .from(head.querySelector("[data-dlg-a]"), { opacity: 0, yPercent: 35, duration: 0.9 }, 0.08)
          .from(head.querySelectorAll(".loc-head__reply, .loc-tools"), { opacity: 0, y: 14, duration: 0.8, stagger: 0.08 }, 0.3);
      }

      const rows = Array.from(root.querySelectorAll<HTMLElement>("[data-cafe]")).filter((r) => r.getClientRects().length > 0 && below(r));
      if (!rows.length) return;
      gsap.set(rows, { "--draw": 0, opacity: 0, y: 18 });
      ScrollTrigger.batch(rows, {
        start: "top 92%",
        // no once: triggers that fire mid-creation (deep links) would corrupt ScrollTrigger; re-entries are harmless
        onEnter: (batch) =>
          gsap.to(batch, { "--draw": 1, opacity: 1, y: 0, duration: 0.9, ease: "kd.out", stagger: 0.07, overwrite: "auto", clearProps: "opacity,transform" }),
      });
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
