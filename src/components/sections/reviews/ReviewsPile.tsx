"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";

/** px of sideways drag that throws the top note when it is let go. */
const THROW = 90;
/** px/s: a flick this fast throws it from any distance. */
const FLING = 650;

type Drag = { id: number; x: number; y: number; t: number; lx: number; lt: number; vx: number; on: boolean; touch: boolean };

/**
 * The pile of notes. Next throws the top note aside and it slides back in under the pile, while the
 * notes under it move up a place (reviews.css, from data-pos): the → arrow, a click or a tap on the top
 * note, or a sideways drag let go past THROW (a mouse, a pen or a finger; up and down stays the page's
 * scroll). Back pulls the bottom note out from under the pile and lays it on top: the ← arrow. It loops,
 * and it never moves on its own. The notes are server-rendered in order: this moves data-pos between
 * them, throws the top one (GSAP on its .rv-note__fly only; where a note lies is CSS on the li) and tells
 * screen readers. Reduced motion: the pile changes at once.
 */
export function ReviewsPile() {
  const mode = useMotionMode();
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const root = document.getElementById("otzyvy");
    const list = root?.querySelector<HTMLElement>(".rv-notes");
    if (!root || !list) return;
    const notes = Array.from(list.querySelectorAll<HTMLElement>(".rv-note"));
    const n = notes.length;
    const flies = notes.map((note) => note.querySelector<HTMLElement>(".rv-note__fly")!);
    if (n < 2 || flies.some((fly) => !fly)) return;
    const prev = root.querySelector<HTMLButtonElement>("[data-rv-prev]");
    const next = root.querySelector<HTMLButtonElement>("[data-rv-next]");
    const live = root.querySelector<HTMLElement>("[data-rv-live]");
    const reduced = () => modeRef.current === "reduced";

    // order[0] is the note on top. A remount (Strict Mode, Fast Refresh) may find stale attributes: start
    // again from the server's order, then take over from the CSS.
    let order = notes.map((_, i) => i);
    const place = () => order.forEach((i, pos) => notes[i].setAttribute("data-pos", String(pos)));
    const unmark = (note: HTMLElement) => ["data-leaving", "data-arriving", "data-covered"].forEach((a) => note.removeAttribute(a));
    notes.forEach(unmark);
    place();
    root.dataset.js = "";

    /** «Отзыв 2 из 3: …» for note `i`. Cleared first, so the same note again (or five quick clicks) is read once. */
    let announceTimer = 0;
    function announce(i: number) {
      if (!live) return;
      live.textContent = "";
      window.clearTimeout(announceTimer);
      announceTimer = window.setTimeout(() => {
        live.textContent = notes[i].dataset.rvSay ?? "";
      }, 50);
    }

    // A change while the last one is still in the air finishes that one first.
    let scene: gsap.core.Timeline | null = null;
    const settle = () => {
      scene?.progress(1);
      scene = null;
    };

    /** Next: the top note is thrown out to `dir`'s side, from wherever it is, then slides back in under the pile. */
    function toss(dir: 1 | -1) {
      settle();
      const top = order[0];
      const note = notes[top];
      const fly = flies[top];
      order = [...order.slice(1), top];
      announce(order[0]);
      if (reduced()) {
        gsap.killTweensOf(fly);
        gsap.set(fly, { clearProps: "transform" });
        place();
        return;
      }
      // Over the pile while it flies, under it once it lands.
      note.setAttribute("data-leaving", "");
      place();
      const w = list!.offsetWidth;
      gsap.killTweensOf(fly);
      scene = gsap
        .timeline({
          onComplete: () => {
            scene = null;
          },
        })
        .to(fly, { x: dir * w * 0.8, y: -w * 0.03, rotation: dir * 13, duration: 0.42, ease: "kd.out" })
        .call(() => note.removeAttribute("data-leaving"))
        .to(fly, { x: 0, y: 0, rotation: 0, duration: 0.6, ease: "kd.out", clearProps: "transform" });
    }

    /** Back: the bottom note slides out from under the pile to the left, then is laid on top. */
    function back() {
      settle();
      const bottom = order[n - 1];
      const note = notes[bottom];
      const fly = flies[bottom];
      const covered = notes[order[0]];
      const lay = () => {
        order = [bottom, ...order.slice(0, -1)];
        place();
      };
      announce(bottom);
      if (reduced()) {
        lay();
        return;
      }
      // Its words show as soon as it comes out from under the others, and the note it covers keeps its
      // own until it is covered.
      note.setAttribute("data-arriving", "");
      covered.setAttribute("data-covered", "");
      const w = list!.offsetWidth;
      gsap.killTweensOf(fly);
      scene = gsap
        .timeline({
          onComplete: () => {
            note.removeAttribute("data-arriving");
            covered.removeAttribute("data-covered");
            scene = null;
          },
        })
        .to(fly, { x: -w * 0.8, y: -w * 0.03, rotation: -13, duration: 0.36, ease: "kd.out" })
        .call(lay)
        .to(fly, { x: 0, y: 0, rotation: 0, duration: 0.6, ease: "kd.out", clearProps: "transform" });
    }

    // Picking up the top note: it follows the pointer, tilting the way it goes, and the one under it starts
    // to come up (--lift). Let go past THROW, or flicked, it is thrown; short of that it drops back.
    let drag: Drag | null = null;
    const onDown = (e: PointerEvent) => {
      if (e.button !== 0 || !e.isPrimary || drag) return;
      const note = (e.target as Element).closest(".rv-note");
      if (!note || note !== notes[order[0]]) return;
      settle();
      gsap.killTweensOf(flies[order[0]]);
      const now = performance.now();
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, t: now, lx: e.clientX, lt: now, vx: 0, on: false, touch: e.pointerType === "touch" };
      // A mouse would start selecting the words: it picks the note up instead.
      if (!drag.touch) e.preventDefault();
    };
    const onMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x;
      const dy = e.clientY - drag.y;
      if (!drag.on) {
        // A finger going up or down is the page's scroll (touch-action: pan-y in reviews.css).
        if (drag.touch && Math.abs(dy) > Math.max(10, Math.abs(dx))) drag = null;
        if (!drag || Math.abs(dx) < 6) return;
        drag.on = true;
        list.setAttribute("data-dragging", "");
      }
      const now = performance.now();
      drag.vx = drag.vx * 0.5 + ((e.clientX - drag.lx) / Math.max(1, now - drag.lt)) * 500;
      drag.lx = e.clientX;
      drag.lt = now;
      if (reduced()) return;
      gsap.set(flies[order[0]], { x: dx, y: dy * 0.25, rotation: dx * 0.045 });
      list.style.setProperty("--lift", Math.min(1, Math.abs(dx) / (list.offsetWidth * 0.35)).toFixed(3));
    };
    const onUp = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const d = drag;
      drag = null;
      list.removeAttribute("data-dragging");
      list.style.removeProperty("--lift");
      const up = e.type === "pointerup";
      if (!d.on) {
        // A click or a tap on the top note: the next one.
        if (up && performance.now() - d.t < 500) toss(1);
        return;
      }
      const dx = e.clientX - d.x;
      if (up && (Math.abs(dx) > THROW || Math.abs(d.vx) > FLING)) {
        toss((Math.abs(dx) > THROW ? Math.sign(dx) : Math.sign(d.vx)) as 1 | -1);
        return;
      }
      if (!reduced()) gsap.to(flies[order[0]], { x: 0, y: 0, rotation: 0, duration: 0.35, ease: "kd.out", clearProps: "transform" });
    };

    const onPrev = () => back();
    const onNext = () => toss(1);
    prev?.addEventListener("click", onPrev);
    next?.addEventListener("click", onNext);
    list.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      window.clearTimeout(announceTimer);
      scene?.kill();
      gsap.killTweensOf(flies);
      gsap.set(flies, { clearProps: "transform" });
      // The CSS takes over again from the server's order.
      notes.forEach((note, i) => {
        unmark(note);
        note.setAttribute("data-pos", String(i));
      });
      list.removeAttribute("data-dragging");
      list.style.removeProperty("--lift");
      delete root.dataset.js;
      prev?.removeEventListener("click", onPrev);
      next?.removeEventListener("click", onNext);
      list.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  return null;
}
