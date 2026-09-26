"use client";

import { gsap, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";

/**
 * Entrances for «Вечер». Everything is server-rendered and visible; this only adds the reveal
 * after mount (full motion only). The chess replay lives in ChessReplay.
 * CSS tilts and hovers in evening.css use `transform`, never the individual `rotate`/`scale`
 * properties: GSAP folds those into its inline transform, so after a context revert (motion
 * toggle) they applied twice. Every tween here clears `transform`, handing it back to the CSS.
 */
export function EveningMotion() {
  const mode = useMotionMode();

  useGSAP(
    () => {
      if (mode !== "full") return;
      const root = document.getElementById("vecher");
      if (!root) return;
      const all = <T extends Element = HTMLElement>(s: string, el: ParentNode = root) => Array.from(el.querySelectorAll<T>(s));
      const once = (trigger: Element, start = "top 84%") => ({ trigger, start, toggleActions: "play none none none" });
      // Only animate what the guest hasn't reached yet. Creating once-triggers that are already past
      // (deep link to #vecher, motion toggled near the bottom) makes them fire mid-creation and
      // corrupts ScrollTrigger's list; anything already on screen simply stays as rendered.
      const vh = window.innerHeight;
      const ahead = (el: Element | null | undefined, pct = 0.84) => !!el && el.getBoundingClientRect().top > vh * pct;

      // Headings: the question gathers (ASK), the answer lands (ANSWER).
      all(".ev-dlg").forEach((h) => {
        if (!ahead(h)) return;
        const q = h.querySelector("[data-dlg-q]");
        const a = h.querySelector<HTMLElement>("[data-dlg-a]");
        const dash = a?.querySelector(".dash");
        const tl = gsap.timeline({ defaults: { ease: "kd.out" }, scrollTrigger: once(h) });
        if (q) tl.from(q, { opacity: 0, letterSpacing: "0.42em", duration: 0.9, clearProps: "opacity,letterSpacing" }, 0);
        if (a?.classList.contains("ev-desserts__a")) {
          // «Дальше — слаще»: the answer gets heavier as it lands. Only on one line: where it wraps
          // (phones), a light start could fit one line and then jump to two mid-tween.
          const lh = parseFloat(getComputedStyle(a).lineHeight) || a.offsetHeight;
          const oneLine = a.offsetHeight < lh * 1.5;
          tl.from(
            a,
            { ...(oneLine ? { fontWeight: 180 } : {}), opacity: 0, yPercent: 12, duration: 1.15, ease: "kd.settle", clearProps: "fontWeight,opacity,transform" },
            0.12,
          );
        } else if (a) {
          tl.fromTo(
            a,
            { yPercent: 38, clipPath: "inset(-20% -4% 100% -4%)" },
            { yPercent: 0, clipPath: "inset(-20% -4% -30% -4%)", duration: 0.95, clearProps: "clipPath,transform" },
            0.12,
          );
        }
        if (dash) tl.from(dash, { scaleX: 0, transformOrigin: "0% 50%", duration: 0.6, clearProps: "transform" }, 0.2);
      });

      // Single lines: reply, desserts foot, family line.
      all("[data-ev-reveal]").forEach((el) => {
        if (!ahead(el, 0.9)) return;
        gsap.from(el, { opacity: 0, y: 22, duration: 0.8, ease: "kd.out", clearProps: "opacity,transform", scrollTrigger: once(el, "top 90%") });
      });

      // Desserts: cards rise in turn; each doily turns into place under its octagon.
      const rail = root.querySelector("[data-rail]");
      const cards = all("[data-dessert]");
      if (rail && cards.length && ahead(rail, 0.82)) {
        const tl = gsap.timeline({ defaults: { ease: "kd.out" }, scrollTrigger: once(rail, "top 82%") });
        tl.from(cards, { y: 90, opacity: 0, duration: 1, stagger: 0.12, clearProps: "opacity,transform" }, 0);
        // The lace's hover transition (transform, 1.4s) would smooth every frame of this turn: hold
        // it off while GSAP owns the transform; clearProps hands both back to the CSS.
        const laces = all(".oct-photo__lace", rail);
        gsap.set(laces, { transition: "none" });
        tl.from(laces, { rotate: -38, scale: 0.9, duration: 1.5, stagger: 0.12, clearProps: "transform,transition" }, 0);
        tl.from(all(".oct-photo__frame", rail), { scale: 0.9, duration: 1.2, stagger: 0.12, clearProps: "transform" }, 0.05);
        tl.from(all(".ev-chip", rail), { scale: 0.8, opacity: 0, duration: 0.6, clearProps: "opacity,transform" }, 0.7);
      }

      // Chess: the notation prints line by line (PRINT, from the left); the card settles.
      const notes = all(".ev-note");
      if (notes.length && ahead(notes[0].parentElement ?? notes[0])) {
        gsap.from(notes, {
          opacity: 0,
          x: -18,
          duration: 0.7,
          stagger: 0.07,
          ease: "kd.out",
          clearProps: "opacity,transform",
          scrollTrigger: once(notes[0].parentElement ?? notes[0]),
        });
      }
      const card = root.querySelector("[data-ev-card]");
      if (card && ahead(card, 0.88)) gsap.from(card, { opacity: 0, y: 40, duration: 0.9, ease: "kd.out", clearProps: "opacity,transform", scrollTrigger: once(card, "top 88%") });
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
