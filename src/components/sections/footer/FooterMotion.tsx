"use client";

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";
import { WORDMARK_VIEWBOX } from "@/components/brand/wordmark-data";

/** How far each half of the wordmark stands open before the doors close (in viewport widths). */
const DOOR_VW = 0.18;

/**
 * «— Спокойной ночи», slowly: the closing exchange lands line by line, the service doors rise,
 * and the giant wordmark closes like café doors as the page ends (the only scrub outside the
 * hero). Everything is server-rendered and final without JS; reduced motion leaves it assembled.
 */
export function FooterMotion() {
  const mode = useMotionMode();

  useGSAP(
    () => {
      if (mode === "reduced") return;
      const root = document.getElementById("footer");
      if (!root) return;
      // Only choreograph what the guest hasn't reached yet (no replays on reload or mode switch).
      const ahead = (el: Element | null, at: number) => !!el && el.getBoundingClientRect().top > window.innerHeight * at;

      // ── 1 · The closing exchange: ask, answer heavy, the café says goodnight ──
      const talk = root.querySelector<HTMLElement>("[data-ft-talk]");
      if (talk && ahead(talk, 0.74)) {
        const q = talk.querySelector("[data-dlg-q]");
        const line = talk.querySelector("[data-ft-answer]");
        const word = talk.querySelector("[data-ft-word]");
        const signoff = talk.querySelector("[data-ft-signoff]");
        const status = talk.querySelector("[data-ft-status]");
        // From 640 up the live status sits at the far end of the clock line, facing the kicker: it
        // arrives with it. On phones it closes the exchange, after the sign-off.
        const clockLine = window.matchMedia("(min-width: 640px)").matches;
        const tl = gsap.timeline({
          defaults: { ease: "kd.out" },
          scrollTrigger: { trigger: talk, start: "top 74%", toggleActions: "play none none none" },
        });
        tl.from(talk.querySelector("[data-ft-kicker]"), { opacity: 0, x: -14, duration: 0.8, clearProps: "opacity,transform" }, 0);
        if (clockLine) tl.from(status, { opacity: 0, x: 14, duration: 0.8, clearProps: "opacity,transform" }, 0.08);
        // The reply wraps under a long answer (flex-wrap on the heading's width). The answer changes
        // width while it gathers weight, so hold the heading at its final width until it has landed,
        // or the reply could jump between lines mid-entrance. Measured when the entrance plays: the
        // guest may have answered in the hero after this was set up.
        const dlg = talk.querySelector<HTMLElement>(".ft-dlg");
        if (dlg) tl.set(dlg, { flexBasis: () => `${dlg.getBoundingClientRect().width}px`, immediateRender: false }, 0);
        tl.from(q, { opacity: 0, y: 18, duration: 1, clearProps: "opacity,transform" }, 0.1)
          .from(line, { opacity: 0, yPercent: 10, duration: 1.1, clearProps: "opacity,transform" }, 0.45)
          // The answer gathers weight as it lands, as it did up in the hero. Its end state is read
          // when it starts (not at setup), so an answer given since then lands at its own posture.
          .from(word, { fontWeight: 180, letterSpacing: "0.06em", duration: 1.3, ease: "kd.settle", immediateRender: false, clearProps: "fontWeight,letterSpacing" }, 0.45)
          .from(talk.querySelector("[data-ft-night]"), { opacity: 0, y: 16, duration: 1, clearProps: "opacity,transform" }, 1.05)
          .from(clockLine ? [signoff] : [signoff, status], { opacity: 0, y: 10, duration: 0.8, stagger: 0.12, clearProps: "opacity,transform" }, 1.35);
        if (dlg) tl.set(dlg, { clearProps: "flexBasis" }, 1.75);
      }

      // ── 2 · Service doors: the frame draws, the doors rise one after another ──
      const doors = root.querySelector<HTMLElement>("[data-ft-doors]");
      if (doors && ahead(doors, 0.88)) {
        const tl = gsap.timeline({
          defaults: { ease: "kd.out" },
          scrollTrigger: { trigger: doors, start: "top 88%", toggleActions: "play none none none" },
        });
        tl.from(doors.querySelectorAll("[data-ft-rule]"), { scaleX: 0, transformOrigin: "0% 50%", duration: 1.1, ease: "kd.inOut", stagger: 0.15, clearProps: "transform" }, 0)
          .from(doors.querySelectorAll("[data-ft-door]"), { opacity: 0, y: 22, duration: 0.9, stagger: 0.07, clearProps: "opacity,transform" }, 0.2);
      }

      // ── 3 · Contacts and small print: one quiet fade ──
      // A timeline, not a lone tween: timeline triggers defer their first refresh by a tick, so this
      // never force-refreshes other sections' pending `once` triggers mid-loop (ScrollTrigger crash).
      const info = root.querySelectorAll<HTMLElement>("[data-ft-info]");
      if (info.length && ahead(info[0], 0.9)) {
        gsap
          .timeline({ scrollTrigger: { trigger: info[0], start: "top 90%", toggleActions: "play none none none" } })
          .from(info, { opacity: 0, y: 14, duration: 0.8, stagger: 0.08, ease: "kd.out", clearProps: "opacity,transform" });
      }

      // ── 4 · The doors close: КАК. and ДЕЛА? meet around the badge as the page ends ──
      const sign = root.querySelector<HTMLElement>("[data-ft-sign]");
      const svg = sign?.querySelector<SVGSVGElement>("svg");
      if (!sign || !svg) return;
      const part = (p: string) => svg.querySelector(`[data-part="${p}"]`);
      // SVG transforms are in viewBox units: convert 18vw through the rendered width (the mark runs
      // gutter to gutter, so this is re-measured on every refresh, e.g. after a resize).
      const door = () => (window.innerWidth * DOOR_VW * WORDMARK_VIEWBOX.w) / Math.max(1, svg.getBoundingClientRect().width);
      // 'top 85%' → 'bottom bottom', but never shorter than a fifth of the screen (short phones).
      const range = () => {
        const r = sign.getBoundingClientRect();
        const vh = window.innerHeight;
        const top = r.top + window.scrollY;
        const end = Math.min(top + r.height - vh, ScrollTrigger.maxScroll(window));
        const start = Math.min(top - vh * 0.85, Math.max(top - vh, end - vh * 0.2));
        return { start, end: Math.max(end, start + 1) };
      };

      // «кофе» / «завтраки» start hidden explicitly: a staggered fromTo only pre-renders its first
      // target, so the other letters would show, then blink out as the scrub reached them.
      const arcs = svg.querySelectorAll('[data-part="kofe"] path, [data-part="zavtraki"] path');
      gsap.set(arcs, { opacity: 0 });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: sign,
          start: () => range().start,
          end: () => range().end,
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      });
      // The halves travel evenly (the scroll is the ease) and meet at 0.9; the clover blooms last.
      tl.fromTo(part("kak"), { x: () => -door() }, { x: 0, duration: 0.9, ease: "power1.inOut" }, 0)
        .fromTo(part("dela"), { x: () => door() }, { x: 0, duration: 0.9, ease: "power1.inOut" }, 0)
        .fromTo(part("oct"), { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.74, ease: "power1.inOut" }, 0.06)
        .to(arcs, { opacity: 1, duration: 0.16, stagger: { amount: 0.26 } }, 0.5)
        .fromTo(part("clover"), { scale: 0.6, opacity: 0, transformOrigin: "50% 45%" }, { scale: 1, opacity: 1, duration: 0.3, ease: "power2.out" }, 0.7);
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
