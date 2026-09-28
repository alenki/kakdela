"use client";

import { useEffect } from "react";

/**
 * Marks the clause being read in the policy's contents (aria-current on its link, privacy.css sets it).
 * The contents and the clauses are server-rendered; this only moves one attribute. The clause in view
 * is the last one whose heading has passed a reading line a third of the way down the screen.
 */
export function TocSpy() {
  useEffect(() => {
    const links = Array.from(document.querySelectorAll<HTMLAnchorElement>("[data-pp-toc] a[href^='#']"));
    const heads = links
      .map((a) => document.getElementById(decodeURIComponent(a.hash.slice(1))))
      .filter((el): el is HTMLElement => !!el);
    if (!heads.length) return;

    let frame = 0;
    let current: HTMLAnchorElement | null = null;
    const update = () => {
      frame = 0;
      const line = window.innerHeight / 3;
      let at = -1;
      heads.forEach((h, i) => {
        if (h.getBoundingClientRect().top <= line) at = i;
      });
      const next = at >= 0 ? links[at] : null;
      if (next === current) return;
      current?.removeAttribute("aria-current");
      next?.setAttribute("aria-current", "true");
      current = next;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      current?.removeAttribute("aria-current");
    };
  }, []);

  return null;
}
