"use client";

import { gsap, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";

type Curve = { x0: number; y0: number; cx: number; cy: number; x1: number; y1: number; t0: number; t1: number };

const parse = (s: string | undefined): Curve | null => {
  const n = (s ?? "").split(" ").map(Number);
  if (n.length !== 8 || n.some(Number.isNaN)) return null;
  const [x0, y0, cx, cy, x1, y1, t0, t1] = n;
  return { x0, y0, cx, cy, x1, y1, t0, t1 };
};
const at = (c: Curve, t: number) => {
  const u = 1 - t;
  return { x: u * u * c.x0 + 2 * u * t * c.cx + t * t * c.x1, y: u * u * c.y0 + 2 * u * t * c.cy + t * t * c.y1 };
};

const STEP = 1.2; // seconds between moves
const TRAVEL = 0.82; // one knight hop
const KEYS = 14; // samples along the arc

/**
 * Replays the notation dialogue on the board: rewinds the knights to g1/g8, then each move hops
 * its knight along the arc while the arrow trails behind it, a ghost stays on the square it left
 * and the matching notation line underlines. Ends exactly on the server-rendered final position,
 * which is also what reduced motion and no-JS show.
 */
export function ChessReplay() {
  const mode = useMotionMode();

  useGSAP(
    () => {
      if (mode !== "full") return;
      const root = document.getElementById("vecher");
      const board = root?.querySelector<HTMLElement>("[data-board]");
      if (!root || !board) return;

      const arrows = Array.from(board.querySelectorAll<SVGGElement>("[data-arrow]"));
      const curves = arrows.map((g) => parse(g.dataset.curve));
      const knight = { w: board.querySelector<SVGGElement>('[data-knight="w"]'), b: board.querySelector<SVGGElement>('[data-knight="b"]') };
      const uls = Array.from(root.querySelectorAll<HTMLElement>("[data-ul]"));
      if (!knight.w || !knight.b || curves.some((c) => !c) || arrows.length !== 4) return;

      const ease = gsap.parseEase("kd.inOut");
      /** Time share at which the eased hop reaches curve parameter p (bisection). */
      const timeFor = (p: number) => {
        let lo = 0, hi = 1;
        for (let i = 0; i < 24; i++) {
          const mid = (lo + hi) / 2;
          if (ease(mid) < p) lo = mid;
          else hi = mid;
        }
        return (lo + hi) / 2;
      };

      // ── Rewind to the opening: knights home, no trails, no underlines ──
      const firstW = curves[0]!, firstB = curves[1]!;
      gsap.set(knight.w, { x: firstW.x0, y: firstW.y0 });
      gsap.set(knight.b, { x: firstB.x0, y: firstB.y0 });
      gsap.set(board.querySelectorAll("[data-ghost]"), { opacity: 0 });
      gsap.set(board.querySelectorAll("[data-shaft]"), { drawSVG: "0% 0%", opacity: 0 });
      gsap.set(board.querySelectorAll("[data-head]"), { drawSVG: "50% 50%", opacity: 0 });
      gsap.set(uls, { scaleX: 0, transformOrigin: "0% 50%" });

      const tl = gsap.timeline({ delay: 0.25, scrollTrigger: { trigger: board, start: "top 72%", toggleActions: "play none none none" } });

      arrows.forEach((g, i) => {
        const c = curves[i]!;
        const side = g.dataset.side === "b" ? "b" : "w";
        const k = knight[side]!;
        const lift = k.querySelector("[data-lift]");
        const shaft = g.querySelector("[data-shaft]");
        const head = g.querySelector("[data-head]");
        const ghost = board.querySelector(`[data-ghost="${g.dataset.from}"]`);
        const t = i * STEP;

        // The notation line for this move underlines; the previous one lets go.
        if (i > 0 && uls[i - 1]) tl.to(uls[i - 1], { scaleX: 0, transformOrigin: "100% 50%", duration: 0.45, ease: "kd.inOut" }, t);
        if (uls[i]) tl.fromTo(uls[i], { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 0.6, ease: "kd.out" }, t);

        // The knight hops along the arc; a ghost stays behind on the square it left.
        const pts = Array.from({ length: KEYS + 1 }, (_, j) => at(c, j / KEYS));
        tl.to(k, { keyframes: { x: pts.map((p) => p.x), y: pts.map((p) => p.y), easeEach: "none" }, duration: TRAVEL, ease: "kd.inOut" }, t);
        if (lift) tl.to(lift, { scale: 1.14, duration: TRAVEL / 2, ease: "sine.out", yoyo: true, repeat: 1, transformOrigin: "50% 60%" }, t);
        if (ghost) tl.to(ghost, { opacity: 1, duration: 0.6, ease: "kd.out" }, t + 0.08);

        // The arrow trails the knight (it starts past the ghost and stops at the knight's edge).
        const s0 = timeFor(c.t0) * TRAVEL, s1 = timeFor(c.t1) * TRAVEL;
        if (shaft) {
          tl.set(shaft, { opacity: 1 }, t + s0);
          tl.to(shaft, { drawSVG: "0% 100%", duration: Math.max(0.1, s1 - s0), ease: "none" }, t + s0);
        }
        if (head) {
          tl.set(head, { opacity: 1 }, t + TRAVEL - 0.04);
          tl.to(head, { drawSVG: "0% 100%", duration: 0.3, ease: "kd.out" }, t + TRAVEL - 0.04);
        }
      });
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
