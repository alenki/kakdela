"use client";

import { useEffect } from "react";
import { useMotionMode } from "@/lib/motion";
import { ARRIVAL, PHYS, arrivalAt, atRest, hanging, pose, push, rig, shove, step, type Hand, type SignState } from "@/lib/sign";

/**
 * The opening's sign, alive (src/lib/sign.ts has the physics, Opening.tsx the markup).
 *
 * Full motion: it takes over from the arrival (CSS baked from the same physics, html[data-hang]) at its
 * hand-off, or at the guest's first touch or hard scroll, from the exact state the arrival had reached, so
 * nothing jumps. A mouse or a pen drags the sign by the point it took and lets it swing; a click (not a drag)
 * turns it over, pushed on the side clicked. On touch a tap turns it and a sideways swipe swings it; up and
 * down stays the page's scroll. The page's scroll moves its nail: a hard fling or a sudden stop lets the cord
 * go slack. A frame loop runs only while it moves and never while the section is off screen; at rest the sign
 * is handed back to the stylesheet exactly.
 *
 * Reduced motion: a click turns it over at once, and back.
 */
export function HangingSign() {
  const mode = useMotionMode();

  useEffect(() => {
    const root = document.getElementById("o-nas");
    const html = document.documentElement;
    const one = (sel: string) => root?.querySelector<HTMLElement>(sel) ?? null;
    const card = one("[data-sign-card]");
    const swing = one("[data-sign-swing]");
    const fall = one("[data-sign-fall]");
    const turn = one("[data-sign-turn]");
    const nail = one("[data-sign-nail]");
    const cords = root ? Array.from(root.querySelectorAll<HTMLElement>("[data-sign-cord]")) : [];
    if (!root || !card || !swing || !fall || !turn || !nail || cords.length !== 2) return;

    if (mode !== "full" || html.dataset.motion === "reduced") {
      const flip = (e: MouseEvent) => {
        if (e.button === 0) root.toggleAttribute("data-turned");
      };
      root.dataset.still = "";
      card.addEventListener("click", flip);
      return () => {
        card.removeEventListener("click", flip);
        root.removeAttribute("data-turned");
        delete root.dataset.still;
      };
    }

    const r = rig();
    /** Pixels per metre: the sign is 40 cm across, whatever its size on the screen. */
    let px = card.offsetWidth / PHYS.width || 1;
    let s: SignState = hanging(r);
    let hand: Hand | null = null;
    let accel = 0;
    let running = false;
    let visible = true;
    let raf = 0;
    let last = 0;
    let acc = 0;
    root.dataset.live = "";

    const parts = [swing, fall, card, turn, ...cords];
    const render = () => {
      const p = pose(s, r);
      swing.style.rotate = `${p.swing.toFixed(3)}deg`;
      fall.style.translate = `0 ${(p.fall * r.W * px).toFixed(2)}px`;
      card.style.rotate = `${p.tilt.toFixed(3)}deg`;
      turn.style.rotate = `y ${p.turn.toFixed(3)}deg`;
      // Light, not decoration: the card darkens as it turns from the guest.
      root.style.setProperty("--sign-shade", (0.16 * (1 - Math.abs(Math.cos((p.turn * Math.PI) / 180)))).toFixed(3));
      p.cords.forEach((c, i) => {
        cords[i].style.rotate = `${c.angle.toFixed(3)}deg`;
        cords[i].style.scale = `1 ${c.stretch.toFixed(4)}`;
      });
    };
    const handBack = () => {
      for (const el of parts) {
        el.style.removeProperty("rotate");
        el.style.removeProperty("translate");
        el.style.removeProperty("scale");
      }
      root.style.removeProperty("--sign-shade");
    };

    // The page's own motion, as the guest sees it: the nail moves with it.
    let sy = window.scrollY;
    let sv = 0;
    let sa = 0;
    let st = performance.now();
    const sample = (now: number) => {
      const dt = (now - st) / 1000;
      if (dt < 0.004) return;
      const y = window.scrollY;
      if (dt > 0.15) {
        // After a pause the page starts from still.
        sy = y;
        sv = 0;
        sa = 0;
        st = now;
        accel = 0;
        return;
      }
      const v = (y - sy) / dt;
      const a = (v - sv) / dt;
      sy = y;
      sv = v;
      st = now;
      // Smoothed over some 50 ms: the page's motion, not the steps between frames.
      sa += (a - sa) * Math.min(1, dt / 0.05);
      // The page moves against the scroll (m/s², y down on the screen).
      accel = -sa / px;
    };

    const frame = (now: number) => {
      raf = 0;
      sample(now);
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      acc += dt;
      for (let n = 0; acc >= PHYS.step && n < 60; n++) {
        step(s, r, PHYS.step, { hand, accel });
        acc -= PHYS.step;
      }
      render();
      if (!hand && Math.abs(accel) < 0.05 && atRest(s, r)) {
        running = false;
        last = 0;
        acc = 0;
        s = hanging(r);
        handBack();
        return;
      }
      raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      // While the arrival plays, the compositor has the sign.
      if (running || !visible || html.dataset.hang !== undefined) return;
      running = true;
      last = 0;
      acc = 0;
      raf = requestAnimationFrame(frame);
    };

    // The arrival: the compositor plays it, and the physics goes on from its exact state.
    const arrival = () => swing.getAnimations().find((a): a is CSSAnimation => a instanceof CSSAnimation);
    const takeOver = () => {
      if (html.dataset.hang === undefined) return;
      const an = arrival();
      const ms = an && typeof an.currentTime === "number" ? an.currentTime : Infinity;
      const t = (ms - ARRIVAL.delay) / 1000;
      delete html.dataset.hang;
      if (t < ARRIVAL.until) {
        s = arrivalAt(t, r);
        render();
        wake();
      }
    };
    let watch = 0;
    const watchArrival = () => {
      watch = 0;
      if (html.dataset.hang === undefined) return;
      const an = arrival();
      if (!an) {
        // Nothing is playing (a browser without linear()): nothing to take over.
        delete html.dataset.hang;
        return;
      }
      const ms = typeof an.currentTime === "number" ? an.currentTime : 0;
      if (ms >= ARRIVAL.delay + ARRIVAL.handoff * 1000) takeOver();
      else watch = requestAnimationFrame(watchArrival);
    };
    if (html.dataset.hang !== undefined) watch = requestAnimationFrame(watchArrival);

    const onScroll = () => {
      sample(performance.now());
      if (Math.abs(accel) > 2) takeOver();
      if (Math.abs(accel) > 0.3) wake();
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (!visible) {
        cancelAnimationFrame(raf);
        raf = 0;
        running = false;
        last = 0;
        acc = 0;
      } else if (!atRest(s, r)) wake();
    });
    io.observe(root);

    const ro = new ResizeObserver(() => {
      px = card.offsetWidth / PHYS.width || px;
      if (running) render();
    });
    ro.observe(card);

    // Hands. The point taken, in the sign's own frame (m), so it stays under the finger.
    type Down = { id: number; touch: boolean; x: number; y: number; t: number; rx: number; ry: number; moved: boolean };
    let down: Down | null = null;
    const toNail = (x: number, y: number) => {
      const b = nail.getBoundingClientRect();
      return { x: (x - b.left) / px, y: (y - b.top) / px };
    };
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      takeOver();
      const p = toNail(e.clientX, e.clientY);
      const c = Math.cos(-s.a);
      const sn = Math.sin(-s.a);
      const dx = p.x - s.x;
      const dy = p.y - s.y;
      down = {
        id: e.pointerId,
        touch: e.pointerType === "touch",
        x: e.clientX,
        y: e.clientY,
        t: performance.now(),
        rx: dx * c - dy * sn,
        ry: dx * sn + dy * c,
        moved: false,
      };
      if (!down.touch) {
        e.preventDefault();
        card.setPointerCapture(e.pointerId);
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!down || e.pointerId !== down.id || down.touch) return;
      if (!down.moved && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) {
        down.moved = true;
        root.dataset.grab = "";
      }
      if (down.moved) {
        const p = toNail(e.clientX, e.clientY);
        hand = { rx: down.rx, ry: down.ry, tx: p.x, ty: p.y };
        wake();
      }
    };
    const release = () => {
      hand = null;
      down = null;
      delete root.dataset.grab;
      wake();
    };
    const onUp = (e: PointerEvent) => {
      if (!down || e.pointerId !== down.id) return;
      const dx = e.clientX - down.x;
      const dy = e.clientY - down.y;
      const dt = (performance.now() - down.t) / 1000;
      const side = down.rx / (r.W / 2);
      if (down.touch) {
        if (Math.hypot(dx, dy) < 10 && dt < 0.4) push(s, side);
        else if (Math.abs(dx) > 12 && Math.abs(dx) > 1.5 * Math.abs(dy)) {
          const v = dx / px / Math.max(0.05, dt);
          shove(s, r, down.rx, down.ry, Math.max(-1.2, Math.min(1.2, v)));
        }
      } else if (!down.moved && dt < 0.5) push(s, side);
      release();
    };
    const onCancel = (e: PointerEvent) => {
      if (down && e.pointerId === down.id) release();
    };
    card.addEventListener("pointerdown", onDown);
    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerup", onUp);
    card.addEventListener("pointercancel", onCancel);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(watch);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      card.removeEventListener("pointerdown", onDown);
      card.removeEventListener("pointermove", onMove);
      card.removeEventListener("pointerup", onUp);
      card.removeEventListener("pointercancel", onCancel);
      handBack();
      delete root.dataset.live;
      delete root.dataset.grab;
    };
  }, [mode]);

  return null;
}
