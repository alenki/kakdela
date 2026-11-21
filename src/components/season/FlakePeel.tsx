"use client";

import { useEffect } from "react";
import { useMotionMode } from "@/lib/motion";
import { FALL, fallStep, release, type Fall } from "@/lib/flake";
import { hashString } from "@/lib/seed";
import { sound } from "@/lib/sound";

/** A pull this long peels a flake off (px). */
const PEEL_AT = 30;
/** The page's depth of field: how near a flake can come before the camera, px. */
const PERSPECTIVE = 900;

/**
 * Peeling the paper snowflakes off the page («С наступающим!», docs/CONVENTIONS.md). A press lifts a flake (it
 * follows the hand a little, its shadow lengthening as it comes off the surface); pulled far enough, or simply
 * clicked or tapped, it comes away (with the sound on, a soft peel) and falls as paper falls (src/lib/flake.ts:
 * a fluttering plate, in a vertical plane through the guest's line of sight, so it rocks toward them and away,
 * its face flashing), turning slowly, until it is gone below the screen. It stays off until the page is
 * opened again. Full motion only: otherwise the flakes stay stuck and take no presses.
 */
export function FlakePeel() {
  const mode = useMotionMode();

  useEffect(() => {
    if (mode !== "full") return;
    const html = document.documentElement;
    if (!html.dataset.season) return;
    const layer = document.createElement("div");
    layer.className = "xm-fall";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);
    const falling = new Set<number>();

    type Hold = { el: HTMLElement; id: number; x0: number; y0: number; x: number; y: number; t: number; vx: number; vy: number };
    let hold: Hold | null = null;

    function drop(el: HTMLElement, vx: number, vy: number) {
      const rect = el.getBoundingClientRect();
      const w = el.offsetWidth, h = el.offsetHeight;
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      const turn = parseFloat(getComputedStyle(el).rotate) || 0;
      const clone = el.cloneNode(true) as HTMLElement;
      clone.className = "xm-flake xm-flake--falling";
      clone.removeAttribute("data-flake");
      clone.style.cssText += `;left:${cx - w / 2}px;top:${cy - h / 2}px;width:${w}px;height:${h}px;rotate:none;translate:none;transform:none`;
      layer.appendChild(clone);
      el.dataset.peeled = "";
      el.style.removeProperty("transform");
      el.style.removeProperty("--xm-lift");
      sound.peel();
      // The physics in metres: the flake is FALL.chord across.
      const pxPerM = w / FALL.chord;
      const s: Fall = release(vx / pxPerM, vy / pxPerM, hashString(el.dataset.flake ?? "f"));
      // Its turn about its own middle, as it was stuck, then slowly on.
      s.spin = (turn * Math.PI) / 180;
      // A breath of the room's air drifts it sideways as it goes.
      const drift = ((hashString(`${el.dataset.flake}-drift`) % 100) / 100 - 0.5) * 60;
      const start = performance.now();
      let last = start;
      const id = Math.random();
      falling.add(id);
      const frame = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        for (let k = 0; k < Math.round(dt / 0.0005); k++) fallStep(s, 0.0005);
        const t = (now - start) / 1000;
        const dx = drift * t;
        const dy = s.y * pxPerM;
        // The glide is toward the guest and away: depth, kept short of the camera.
        const dz = Math.max(-PERSPECTIVE * 0.8, Math.min(PERSPECTIVE * 0.45, -s.x * pxPerM));
        // Upright (stuck, th = ±90°) it faces the guest; flat, it is seen edge on.
        const tilt = 90 - (Math.abs(s.th * 180) / Math.PI) % 180;
        clone.style.transform = `perspective(${PERSPECTIVE}px) translate3d(${dx.toFixed(1)}px,${dy.toFixed(1)}px,${dz.toFixed(1)}px) rotateX(${tilt.toFixed(2)}deg) rotate(${((s.spin * 180) / Math.PI).toFixed(2)}deg)`;
        if (cy + dy - h > window.innerHeight + 40 || t > 9) {
          clone.remove();
          falling.delete(id);
          return;
        }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    }

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || !e.isPrimary) return;
      const el = (e.target as HTMLElement).closest<HTMLElement>(".xm-flake[data-flake]");
      if (!el || el.dataset.peeled !== undefined) return;
      e.preventDefault();
      el.setPointerCapture?.(e.pointerId);
      hold = { el, id: e.pointerId, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t: performance.now(), vx: 0, vy: 0 };
    };
    const onMove = (e: PointerEvent) => {
      if (!hold || e.pointerId !== hold.id) return;
      const now = performance.now();
      const dt = Math.max(0.008, (now - hold.t) / 1000);
      hold.vx = hold.vx * 0.4 + ((e.clientX - hold.x) / dt) * 0.6;
      hold.vy = hold.vy * 0.4 + ((e.clientY - hold.y) / dt) * 0.6;
      hold.x = e.clientX;
      hold.y = e.clientY;
      hold.t = now;
      const dx = hold.x - hold.x0, dy = hold.y - hold.y0;
      const d = Math.hypot(dx, dy);
      if (d >= PEEL_AT) {
        const h = hold;
        hold = null;
        drop(h.el, h.vx, h.vy);
        return;
      }
      // Lifting: it gives a little toward the hand, and stands further off the surface.
      const k = d / PEEL_AT;
      hold.el.style.transform = `translate(${(dx * 0.35).toFixed(1)}px, ${(dy * 0.35).toFixed(1)}px)`;
      hold.el.style.setProperty("--xm-lift", k.toFixed(3));
    };
    const onUp = (e: PointerEvent) => {
      if (!hold || e.pointerId !== hold.id) return;
      const h = hold;
      hold = null;
      if (Math.hypot(h.x - h.x0, h.y - h.y0) < 6) drop(h.el, 0, -40);
      else {
        // Let go before it came off: it lies back down.
        h.el.style.removeProperty("transform");
        h.el.style.removeProperty("--xm-lift");
      }
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      layer.remove();
      document.querySelectorAll<HTMLElement>(".xm-flake[data-peeled]").forEach((el) => delete el.dataset.peeled);
    };
  }, [mode]);

  return null;
}
