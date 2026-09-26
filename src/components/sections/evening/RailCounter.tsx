"use client";

import { useEffect, useState } from "react";

const pad2 = (n: number) => String(n).padStart(2, "0");

/**
 * «01 / 03» under the mobile dessert rail. Server markup shows the first card; after mount it
 * follows the swipe. Also drops the rail from the tab order when it isn't actually scrollable
 * (the desktop 3-up), so keyboard users only stop there when there is something to scroll.
 */
export function RailCounter({ total, totalLabel }: { total: number; totalLabel: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const rail = document.querySelector<HTMLElement>("#vecher [data-rail]");
    if (!rail) return;
    const items = Array.from(rail.children) as HTMLElement[];
    let raf = 0;

    const measure = () => {
      raf = 0;
      // Desktop turns the rail into a non-scrolling grid (overflow: visible), where rotated photos
      // can still poke past the edge, so check the overflow mode as well as the widths.
      const scrollable = getComputedStyle(rail).overflowX !== "visible" && rail.scrollWidth > rail.clientWidth + 2;
      if (scrollable) rail.setAttribute("tabindex", "0");
      else rail.removeAttribute("tabindex");
      if (!scrollable) return setIndex(0);
      // The rail is position:relative, so offsetLeft is measured from its padding edge.
      const x = rail.scrollLeft + (parseFloat(getComputedStyle(rail).scrollPaddingLeft) || 0);
      const atEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4;
      let best = 0;
      let bestD = Infinity;
      items.forEach((el, i) => {
        const d = Math.abs(el.offsetLeft - x);
        if (d < bestD) {
          bestD = d;
          best = i;
        }
      });
      setIndex(atEnd ? items.length - 1 : best);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    schedule();
    rail.addEventListener("scroll", schedule, { passive: true });
    const ro = new ResizeObserver(schedule);
    ro.observe(rail);
    return () => {
      cancelAnimationFrame(raf);
      rail.removeEventListener("scroll", schedule);
      ro.disconnect();
    };
  }, []);

  return (
    <p className="ev-rail-meta mono" aria-hidden="true">
      <span className="ev-rail-meta__num">
        <span>{pad2(index + 1)}</span>
        <span className="ev-rail-meta__sep">/</span>
        <span>{totalLabel}</span>
      </span>
      <span className="ev-rail-meta__track">
        <span className="ev-rail-meta__bar" style={{ transform: `scaleX(${(index + 1) / total})` }} />
      </span>
    </p>
  );
}
