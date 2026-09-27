"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ScrollTrigger } from "@/lib/gsap";

/**
 * The header takes the theme (data-theme) of the section beneath it, gets a solid plate once the page
 * scrolls, and tucks away on scroll down once past the hero.
 */
export function HeaderBehavior() {
  // The header lives in the persistent layout: re-bind to each page's sections after navigation.
  const pathname = usePathname();

  useEffect(() => {
    const header = document.querySelector<HTMLElement>("[data-header]");
    if (!header) return;
    // The footer sits after <main> (it is the contentinfo landmark), so it is listed on its own.
    const fields = Array.from(document.querySelectorAll<HTMLElement>("main [data-theme], #footer[data-theme]"));

    let last = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      // The theme is the field under the header's middle line, read from the live layout. Enter/leave
      // callbacks miss jumps (anchors, a restored scroll, a boundary landing exactly on the line) and
      // would leave the colours of a section that is no longer there.
      const line = header.offsetHeight / 2;
      let theme: string | undefined;
      for (const f of fields) {
        const r = f.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) theme = f.dataset.theme;
      }
      if (theme && header.dataset.theme !== theme) header.dataset.theme = theme;
      // As soon as anything can pass under it, the header gets a solid plate in the field colour, so it
      // never prints onto content.
      header.toggleAttribute("data-solid", y > 2);
      const past = y > window.innerHeight * 0.75;
      const down = y > last + 4;
      const up = y < last - 4;
      if (past && down && !header.matches(":focus-within")) header.dataset.hidden = "";
      else if (up || !past) delete header.dataset.hidden;
      last = y;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // Layout changes without a scroll (fonts, a disclosure, the city switch) end in a ScrollTrigger refresh.
    ScrollTrigger.addEventListener("refresh", schedule);
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      ScrollTrigger.removeEventListener("refresh", schedule);
      header.dataset.theme = "cream";
      header.removeAttribute("data-solid");
      delete header.dataset.hidden;
    };
  }, [pathname]);

  return null;
}
