"use client";

import { useEffect } from "react";

const CHAPTERS = ["kuhnya", "bar", "deserty"];

/**
 * Keeps the running head honest: it takes the theme of the chapter under it (cream by day, ink for the
 * desserts), marks that chapter's link with aria-current="location", and says when it is stuck under the
 * header (data-stuck: its top hairline gives way to the header's, and it may follow the header up).
 */
export function RunningHeadController() {
  useEffect(() => {
    const runner = document.querySelector<HTMLElement>("[data-mn-run]");
    if (!runner) return;
    const links = new Map(
      Array.from(runner.querySelectorAll<HTMLElement>("[data-mn-run-link]")).map((a) => [a.dataset.mnRunLink ?? "", a]),
    );
    const chapters = CHAPTERS.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    let headerH = 0;
    const measure = () => {
      headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 64;
    };

    let current = "";
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = runner.getBoundingClientRect();
      runner.toggleAttribute("data-stuck", r.top <= headerH + 1);
      // The chapter under the head's lower edge.
      const line = r.bottom + 1;
      const under = chapters.find((c) => {
        const b = c.getBoundingClientRect();
        return b.top <= line && b.bottom > line;
      });
      const id = under?.id ?? "";
      const theme = under?.dataset.theme ?? "cream";
      if (runner.dataset.theme !== theme) runner.dataset.theme = theme;
      if (id !== current) {
        links.get(current)?.removeAttribute("aria-current");
        if (id) links.get(id)?.setAttribute("aria-current", "location");
        current = id;
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      schedule();
    };
    measure();
    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      runner.removeAttribute("data-stuck");
      runner.dataset.theme = "cream";
      links.forEach((a) => a.removeAttribute("aria-current"));
    };
  }, []);

  return null;
}
