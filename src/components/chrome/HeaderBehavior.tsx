"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ScrollTrigger } from "@/lib/gsap";
import { useKd } from "@/lib/store";

/**
 * Header colours follow the section beneath it (data-theme), and the header tucks away on scroll
 * down once past the hero. The clover nods whenever the guest answers.
 */
export function HeaderBehavior() {
  const answer = useKd((s) => s.answer);
  const guessed = useKd((s) => s.guessed);
  // The header lives in the persistent layout: re-bind to each page's sections after navigation.
  const pathname = usePathname();

  useEffect(() => {
    const header = document.querySelector<HTMLElement>("[data-header]");
    if (!header) return;
    // The footer sits after <main> (it is the contentinfo landmark), so it is listed on its own.
    const sections = Array.from(document.querySelectorAll<HTMLElement>("main [data-theme], #footer[data-theme]"));
    const triggers = sections.map((sec) =>
      ScrollTrigger.create({
        trigger: sec,
        start: "top top+=40",
        end: "bottom top+=40",
        onToggle: (self) => {
          if (self.isActive) header.dataset.theme = sec.dataset.theme;
        },
      }),
    );

    let last = window.scrollY;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const past = y > window.innerHeight * 0.75;
        const down = y > last + 4;
        const up = y < last - 4;
        // Past the hero the header gets a solid plate in the field colour, so it never prints onto content.
        header.toggleAttribute("data-solid", y > window.innerHeight * 0.6);
        if (past && down && !header.matches(":focus-within")) header.dataset.hidden = "";
        else if (up || !past) delete header.dataset.hidden;
        document.documentElement.style.setProperty("--header-offset", header.dataset.hidden === undefined ? "var(--header-h)" : "0px");
        last = y;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      triggers.forEach((tr) => tr.kill());
      window.removeEventListener("scroll", onScroll);
      header.dataset.theme = "sky";
      header.removeAttribute("data-solid");
    };
  }, [pathname]);

  // Nod: rotate the header clover a quarter turn on each real answer.
  useEffect(() => {
    if (!answer || guessed) return;
    document.querySelectorAll<SVGGElement>(".hdr-clover").forEach((g) => {
      const turns = Number(g.dataset.turns ?? 0) + 1;
      g.dataset.turns = String(turns);
      g.style.setProperty("--turn", `${turns * 90}deg`);
    });
  }, [answer, guessed]);

  return null;
}
