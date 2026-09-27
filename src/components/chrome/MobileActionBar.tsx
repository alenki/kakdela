"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { RouteLink } from "./RouteLink";
import { t } from "@/i18n";

/**
 * Thumb-zone actions on phones and tablets: shown after the hero, hidden over the footer and the dialog.
 * Like the header, it takes the theme of the section beneath it.
 */
export function MobileActionBar() {
  const [heroGone, setHeroGone] = useState(false);
  const [footerIn, setFooterIn] = useState(false);
  const [theme, setTheme] = useState("cream");
  const pathname = usePathname();

  useEffect(() => {
    const hero = document.getElementById("hero");
    const footer = document.getElementById("footer");
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.target === hero) setHeroGone(!e.isIntersecting);
        if (e.target === footer) setFooterIn(e.isIntersecting);
      }
    }, { threshold: 0 });
    if (hero) io.observe(hero);
    if (footer) io.observe(footer);

    // The field under the bar's middle line (the bar is 56px tall).
    const fields = Array.from(document.querySelectorAll<HTMLElement>("main [data-theme]"));
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight - 28;
      const f = fields.find((el) => {
        const r = el.getBoundingClientRect();
        return r.top <= line && r.bottom > line;
      });
      if (f?.dataset.theme) setTheme(f.dataset.theme);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();

    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      setHeroGone(false);
      setFooterIn(false);
    };
  }, [pathname]); // re-observe the new page's sections after navigation

  const visible = heroGone && !footerIn;
  return (
    <AnimatePresence>
      {visible && (
        <m.nav
          className="action-bar"
          data-theme={theme}
          aria-label={t.actionBar.label}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <RouteLink to="menu" className="action-bar__btn">{t.actionBar.menu}</RouteLink>
          <a href="#gde" className="action-bar__btn">{t.actionBar.nearest}</a>
          <RouteLink to="delivery" className="action-bar__btn">{t.actionBar.delivery}</RouteLink>
        </m.nav>
      )}
    </AnimatePresence>
  );
}
