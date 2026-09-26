"use client";

import { useEffect } from "react";
import { kd } from "@/lib/store";

const DESKTOP = "(min-width: 1024px)";
/** The reading line, as a share of the viewport height: about where the sticky plate's centre sits. */
const LINE = 0.44;

/**
 * Drives the sticky plate on the breakfast board. Rows, plates and captions are all server-rendered
 * and share `data-bf-key`; this only moves `data-active` between them (no React re-render of text).
 * Hover or focus picks a row; otherwise the last row whose top has crossed the reading line does
 * (above the board, the first). Also flags the section after the first city switch, so prices roll
 * in only on a real change, and after the first plate swap, so the plate never re-animates on hydration.
 */
export function BreakfastsPreview() {
  useEffect(() => {
    const root = document.getElementById("zavtraki");
    const list = root?.querySelector<HTMLElement>("[data-bf-list]");
    if (!root || !list) return;
    const rows = Array.from(list.querySelectorAll<HTMLElement>("[data-bf-row]"));
    if (!rows.length) return;
    root.dataset.js = "";

    const byKey = (key: string) => root.querySelectorAll<HTMLElement>(`[data-bf-key="${key}"]`);
    let active = rows.find((r) => r.hasAttribute("data-active"))?.dataset.bfKey ?? rows[0].dataset.bfKey ?? "";

    const activate = (key: string | undefined) => {
      if (!key || key === active) return;
      byKey(active).forEach((el) => el.removeAttribute("data-active"));
      byKey(key).forEach((el) => el.setAttribute("data-active", ""));
      active = key;
      root.dataset.swap = "";
    };

    // Hover and keyboard focus. While either is on the board, it owns the plate.
    let pointerInside = false;
    const fromEvent = (e: Event) => activate((e.target as HTMLElement).closest<HTMLElement>("[data-bf-row]")?.dataset.bfKey);
    const onEnter = () => { pointerInside = true; };
    const onLeave = () => { pointerInside = false; };
    const focusInside = () => list.contains(document.activeElement);
    list.addEventListener("pointerover", fromEvent);
    list.addEventListener("focusin", fromEvent);
    list.addEventListener("pointerenter", onEnter);
    list.addEventListener("pointerleave", onLeave);

    // Scroll-follow (desktop only, and only while the board is on screen).
    const mq = window.matchMedia(DESKTOP);
    let inView = false;
    let raf = 0;
    const follow = () => {
      raf = 0;
      if (!inView || !mq.matches || pointerInside || focusInside()) return;
      const line = window.innerHeight * LINE;
      let key = rows[0].dataset.bfKey;
      for (const r of rows) {
        if (r.getBoundingClientRect().top > line) break;
        key = r.dataset.bfKey;
      }
      activate(key);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(follow);
    };
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView) schedule();
    });
    io.observe(list);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    mq.addEventListener("change", schedule);

    // City switch → prices roll (CSS animation keyed off data-roll).
    let city = kd.get().city;
    const unsub = kd.subscribe(() => {
      const next = kd.get().city;
      if (next !== city) {
        city = next;
        root.dataset.roll = "";
      }
    });

    return () => {
      list.removeEventListener("pointerover", fromEvent);
      list.removeEventListener("focusin", fromEvent);
      list.removeEventListener("pointerenter", onEnter);
      list.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      mq.removeEventListener("change", schedule);
      io.disconnect();
      cancelAnimationFrame(raf);
      unsub();
      delete root.dataset.js;
      delete root.dataset.swap;
    };
  }, []);

  return null;
}
