"use client";

import { useEffect, useId, useRef, useState } from "react";
import { m } from "motion/react";
import { CitySwitch } from "@/components/chrome/CitySwitch";
import { useMotionMode } from "@/lib/motion";
import { t } from "@/i18n";

export type MenuTab = { id: string; label: string };

/**
 * The menu's tabs, sticky under the header: one per section, the one being read underlined (the line slides
 * between tabs on the city pill's spring), in the colours of the section beneath (cream by day, ink for the
 * desserts). From 1024 whose prices sits at the right end. On phones the tabs scroll sideways and keep the
 * current one in view. When the header tucks away on the way down, the bar rides up with it (menu.css).
 * The links are plain anchors: MenuNav glides to them, and without JS the browser jumps.
 */
export function MenuTabs({ tabs }: { tabs: MenuTab[] }) {
  const bar = useRef<HTMLElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const group = useId();
  const mode = useMotionMode();
  const [active, setActive] = useState<string | null>(null);
  const [theme, setTheme] = useState("cream");
  const [stuck, setStuck] = useState(false);

  // The section under the bar's lower edge is the one being read; the bar is stuck once it reaches the header.
  useEffect(() => {
    const nav = bar.current;
    if (!nav) return;
    const sections = Array.from(document.querySelectorAll<HTMLElement>("[data-mn-section]"));
    let headerH = 0;
    const measure = () => {
      headerH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 64;
    };
    let frame = 0;
    const update = () => {
      frame = 0;
      const r = nav.getBoundingClientRect();
      setStuck(r.top <= headerH + 1);
      const line = r.bottom + 1;
      const under = sections.find((s) => {
        const b = s.getBoundingClientRect();
        return b.top <= line && b.bottom > line;
      });
      setActive(under?.id ?? null);
      setTheme(under?.dataset.theme ?? "cream");
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const onResize = () => {
      measure();
      schedule();
    };
    measure();
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    // The bar also moves without a scroll: it rides back down when the header returns. Read it again then.
    nav.addEventListener("transitionend", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      nav.removeEventListener("transitionend", schedule);
    };
  }, []);

  // Phones: the tabs scroll sideways; keep the current one in the middle of the strip.
  useEffect(() => {
    const strip = list.current;
    const tab = active ? strip?.querySelector<HTMLElement>(`[data-tab="${active}"]`) : null;
    if (!strip || !tab || strip.scrollWidth <= strip.clientWidth) return;
    const left = tab.offsetLeft - (strip.clientWidth - tab.offsetWidth) / 2;
    strip.scrollTo({ left, behavior: mode === "full" ? "smooth" : "auto" });
  }, [active, mode]);

  return (
    <nav ref={bar} className="mn-tabs" data-theme={theme} data-stuck={stuck ? "" : undefined} aria-label={t.menu.tabsNav} data-mn-run>
      <div className="wrap mn-tabs__inner">
        <ul ref={list} className="mn-tabs__list" role="list">
          {tabs.map((tab) => {
            const on = active === tab.id;
            return (
              <li key={tab.id} className="mn-tabs__item">
                <a className="mn-tab" href={`#${tab.id}`} data-tab={tab.id} aria-current={on ? "location" : undefined}>
                  {tab.label}
                  {on && (
                    <m.span
                      layoutId={`mn-tab-${group}`}
                      className="mn-tab__line"
                      aria-hidden="true"
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                </a>
              </li>
            );
          })}
        </ul>
        <div className="mn-tabs__prices">
          <p id="mn-tabs-prices" className="label mn-tabs__label">
            {t.breakfasts.prices}
            <span className="mn-prices__static">: {t.city.nalchik}</span>
          </p>
          <CitySwitch compact className="mn-prices__switch" labelledBy="mn-tabs-prices" />
        </div>
      </div>
    </nav>
  );
}
