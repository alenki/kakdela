"use client";

import { gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";

type Row = {
  rule: Element | null;
  dash: Element | null;
  word: Element | null;
  leader: Element | null;
  meta: Element[];
  photo: Element | null;
};

/**
 * Entrances for the breakfast board. The question gathers (ASK), each row PRINTS from the left
 * (its rule draws, the name rises out of its line mask, the price and note follow), and the plate
 * settles onto the lace. Everything is server-rendered and visible before this runs; reduced motion
 * returns early, so the page simply stays in its final state.
 */
export function BreakfastsMotion() {
  const mode = useMotionMode();

  useGSAP(
    (_ctx, contextSafe) => {
      if (mode === "reduced" || !contextSafe) return;
      const root = document.getElementById("zavtraki");
      if (!root) return;
      const all = (sel: string, scope: ParentNode = root) => Array.from(scope.querySelectorAll(sel));
      const desktop = window.matchMedia("(min-width: 1024px)").matches;

      // ── ASK: the thin question gathers in from loose tracking; the café's kicker follows.
      const head = root.querySelector("[data-bf-head]");
      const q = root.querySelector<HTMLElement>("[data-dlg-q]");
      if (head && q) {
        // Words wrap the chars, so the lines only break between words while split (chars alone
        // would let «— ЧТО Н / А ЗАВТРАК?» break mid-word at 320–340px). Only the chars move.
        const split = SplitText.create(q, { type: "words,chars", aria: "none" });
        const mid = (split.chars.length - 1) / 2;
        // 9px per letter up to a ~106px title (phones to 1440), then in proportion to it (≈16px at 2560),
        // so the gather still reads on a title that spans columns 1–7 of a wide screen.
        const spread = Math.max(9, (parseFloat(getComputedStyle(q).fontSize) || 0) * 0.085);
        gsap
          .timeline({
            scrollTrigger: { trigger: head, start: "top 85%", toggleActions: "play none none none" },
            defaults: { ease: "kd.out" },
            onComplete: () => split.revert(),
          })
          .from(split.chars, { opacity: 0, x: (i: number) => (i - mid) * spread, duration: 1.1, stagger: { each: 0.02, from: "center" } }, 0)
          .from(all("[data-bf-kicker]"), { opacity: 0, y: 18, duration: 0.9, clearProps: "opacity,transform" }, 0.3);
      }

      // ── PRINT: rows arrive in reading order, batched by what enters together.
      const rowEls = all("[data-bf-row]") as HTMLElement[];
      const rows = new Map<Element, Row>(
        rowEls.map((row) => [
          row,
          {
            rule: row.querySelector("[data-bf-rule]"),
            dash: row.querySelector("[data-bf-dash]"),
            word: row.querySelector("[data-bf-word]"),
            leader: row.querySelector(".bf-item__leader"),
            meta: all("[data-bf-meta]", row),
            photo: desktop ? null : row.querySelector("[data-bf-photo]"),
          },
        ]),
      );
      const pick = <K extends keyof Row>(k: K) => [...rows.values()].flatMap((r) => r[k] ?? []) as Element[];

      gsap.set(pick("rule"), { scaleX: 0, transformOrigin: "0% 50%" });
      gsap.set(pick("dash"), { scaleX: 0, transformOrigin: "0% 50%" });
      gsap.set(pick("word"), { yPercent: 150 }); // clear of the mask, breve of Й included
      gsap.set(pick("leader"), { clipPath: "inset(0% 100% 0% 0%)" });
      gsap.set(pick("meta"), { opacity: 0, y: 10 });
      if (!desktop) gsap.set(pick("photo"), { opacity: 0, scale: 0.9, rotate: -6 });

      ScrollTrigger.batch(rowEls, {
        start: "top 90%",
        // no once (see EveningMotion): re-entries only re-tween targets already at rest
        // contextSafe: timelines built later, on enter, still revert with the context (motion-mode change).
        onEnter: contextSafe((batch: Element[]) => {
          const tl = gsap.timeline({ defaults: { ease: "kd.out" } });
          batch.forEach((el, k) => {
            const r = rows.get(el);
            if (!r) return;
            const at = k * 0.06;
            if (r.rule) tl.to(r.rule, { scaleX: 1, duration: 0.9, clearProps: "transform" }, at);
            if (r.photo) tl.to(r.photo, { opacity: 1, scale: 1, rotate: 0, duration: 0.9, clearProps: "opacity,transform" }, at);
            if (r.word) tl.to(r.word, { yPercent: 0, duration: 0.85, clearProps: "transform" }, at + 0.08);
            if (r.dash) tl.to(r.dash, { scaleX: 1, duration: 0.5, clearProps: "transform" }, at + 0.14);
            if (r.leader) tl.to(r.leader, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "kd.inOut", clearProps: "clipPath" }, at + 0.22);
            tl.to(r.meta, { opacity: 1, y: 0, duration: 0.7, stagger: 0.04, clearProps: "opacity,transform" }, at + 0.24);
          });
        }),
      });

      // ── The afterword: the closing rule draws, then the reply and links.
      const foot = root.querySelector("[data-bf-foot]");
      if (foot) {
        const rule = foot.querySelector("[data-bf-rule]");
        const rest = Array.from(foot.children).filter((c) => c !== rule);
        gsap
          .timeline({ scrollTrigger: { trigger: foot, start: "top 90%", toggleActions: "play none none none" }, defaults: { ease: "kd.out" } })
          .from(rule, { scaleX: 0, transformOrigin: "0% 50%", duration: 0.9, clearProps: "transform" }, 0)
          .from(rest, { opacity: 0, y: 16, duration: 0.8, stagger: 0.08, clearProps: "opacity,transform" }, 0.15);
      }

      // ── Desktop plate: the doily turns in, the octagon settles on it.
      const preview = root.querySelector("[data-bf-preview]");
      const body = root.querySelector("[data-bf-body]");
      if (desktop && preview && body) {
        gsap
          .timeline({ scrollTrigger: { trigger: body, start: "top 80%", toggleActions: "play none none none" }, defaults: { ease: "kd.out" } })
          .from(preview.querySelector(".bf-stage__lace"), { opacity: 0, rotate: -28, scale: 0.84, duration: 1.3, clearProps: "opacity,transform" }, 0)
          .from(preview.querySelector(".bf-stage__plates"), { opacity: 0, rotate: -8, scale: 0.9, duration: 1.1, clearProps: "opacity,transform" }, 0.15)
          .from(preview.querySelector(".bf-caps"), { opacity: 0, y: 14, duration: 0.8, clearProps: "opacity,transform" }, 0.45);
      }
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
