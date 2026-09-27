"use client";

import { useEffect } from "react";
import { kd } from "@/lib/store";

const DESKTOP = "(min-width: 1024px)";

/**
 * Drives the sticky plate on the breakfast board. Rows, plates and captions are all server-rendered
 * and share `data-bf-key`; this only moves `data-active` between them (no React re-render of text).
 * Hover or focus picks a row. Otherwise the scroll does: while the plate is stuck, a reading line
 * slides from the plate's top edge to its bottom edge, and the last row whose top it has passed is
 * shown. So every dish gets its turn (in proportion to its row) while the plate is fully on screen:
 * the first as the plate sticks, the last before it lets go. (A fixed line at the plate's centre
 * would show «02» before the first row had been read and never reach «05» and «06» while stuck.)
 * Also flags the section after the first city switch, so prices roll in only on a real change, and
 * after the first plate swap, so the plate never re-animates on hydration.
 */
export function BreakfastsPreview() {
  useEffect(() => {
    const root = document.getElementById("zavtraki");
    const list = root?.querySelector<HTMLElement>("[data-bf-list]");
    const body = root?.querySelector<HTMLElement>("[data-bf-body]");
    const sticky = root?.querySelector<HTMLElement>(".bf-preview__sticky");
    const plate = root?.querySelector<HTMLElement>("[data-bf-preview]");
    if (!root || !list || !body || !sticky || !plate) return;
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
    let stickTop = 0; // the plate's sticky `top`, in px (header + gap); re-read on resize
    const measure = () => {
      stickTop = parseFloat(getComputedStyle(sticky).top) || 0;
    };
    const follow = () => {
      raf = 0;
      if (!inView || !mq.matches || pointerInside || focusInside()) return;
      const b = body.getBoundingClientRect();
      // How far the plate has travelled through its sticky range: 0 as it sticks, 1 as it lets go.
      const range = b.height - plate.offsetHeight;
      const travelled = stickTop - b.top;
      const p = range > 0 ? Math.min(1, Math.max(0, travelled / range)) : travelled > 0 ? 1 : 0;
      // The reading line, in viewport px: the plate's top edge at p = 0, its bottom edge at p = 1.
      const line = b.top + p * b.height;
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
    const onResize = () => {
      measure();
      schedule();
    };
    measure();
    const io = new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView) schedule();
    });
    io.observe(list);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    mq.addEventListener("change", onResize);

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
      window.removeEventListener("resize", onResize);
      mq.removeEventListener("change", onResize);
      io.disconnect();
      cancelAnimationFrame(raf);
      unsub();
      delete root.dataset.js;
      delete root.dataset.swap;
    };
  }, []);

  return null;
}
