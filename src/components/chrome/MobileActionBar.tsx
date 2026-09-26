"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, m } from "motion/react";
import { RouteLink } from "./RouteLink";
import { t } from "@/i18n";

/** Thumb-zone actions on phones, shown after the hero and hidden over the footer / dialog. */
export function MobileActionBar() {
  const [heroGone, setHeroGone] = useState(false);
  const [footerIn, setFooterIn] = useState(false);
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
    return () => {
      io.disconnect();
      setHeroGone(false);
      setFooterIn(false);
    };
  }, [pathname]); // re-observe the new page's hero/footer after navigation

  const visible = heroGone && !footerIn;
  return (
    <AnimatePresence>
      {visible && (
        <m.nav
          className="action-bar"
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
