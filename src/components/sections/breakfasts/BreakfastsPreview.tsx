"use client";

import { useEffect } from "react";

const DESKTOP = "(min-width: 1024px)";

/**
 * Drives the sticky photo beside the breakfast list. Rows, photos and captions are all server-rendered
 * and share `data-bf-key`; this only moves `data-active` between them (CSS crossfades the photos).
 * Hover or focus picks a row. Otherwise the scroll does: while the photo is stuck, a reading line
 * moves down the list from the first row's middle to the last row's, and the last row whose top it
 * has passed is shown. So every dish gets its turn while the photo is fully on screen and level with
 * its row: the first as it sticks, the last a little before it lets go.
 */
export function BreakfastsPreview() {
  useEffect(() => {
    const root = document.getElementById("zavtraki");
    const list = root?.querySelector<HTMLElement>("[data-bf-list]");
    const column = root?.querySelector<HTMLElement>("[data-bf-preview]");
    const sticky = column?.querySelector<HTMLElement>("[data-bf-sticky]");
    if (!root || !list || !column || !sticky) return;
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
    };

    // Hover and keyboard focus. While either is on the list, it owns the photo.
    let pointerInside = false;
    const fromEvent = (e: Event) => activate((e.target as HTMLElement).closest<HTMLElement>("[data-bf-row]")?.dataset.bfKey);
    const onEnter = () => { pointerInside = true; };
    const onLeave = () => { pointerInside = false; };
    const focusInside = () => list.contains(document.activeElement);
    list.addEventListener("pointerover", fromEvent);
    list.addEventListener("focusin", fromEvent);
    list.addEventListener("pointerenter", onEnter);
    list.addEventListener("pointerleave", onLeave);

    // Scroll-follow (desktop only, and only while the list is on screen).
    const mq = window.matchMedia(DESKTOP);
    let inView = false;
    let raf = 0;
    let stickTop = 0; // the photo's sticky `top`, in px (header + gap); re-read on resize
    const measure = () => {
      stickTop = parseFloat(getComputedStyle(sticky).top) || 0;
    };
    const follow = () => {
      raf = 0;
      if (!inView || !mq.matches || pointerInside || focusInside()) return;
      const c = column.getBoundingClientRect();
      // How far the photo has travelled through its sticky range: 0 as it sticks, 1 as it lets go.
      const range = c.height - sticky.offsetHeight;
      const travelled = stickTop - c.top;
      const p = range > 0 ? Math.min(1, Math.max(0, travelled / range)) : travelled > 0 ? 1 : 0;
      // The reading line, in column px: the first row's middle at p = 0, the last row's by p = 0.85,
      // so the last dish still has its turn before the photo lets go.
      const mid = (r: HTMLElement) => {
        const b = r.getBoundingClientRect();
        return b.top - c.top + b.height / 2;
      };
      const from = mid(rows[0]);
      const line = c.top + from + Math.min(1, p / 0.85) * (mid(rows[rows.length - 1]) - from);
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
      delete root.dataset.js;
    };
  }, []);

  return null;
}
