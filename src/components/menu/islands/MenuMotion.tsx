"use client";

import { gsap, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";

/** A block rises once its top is this far down the screen. */
const AT = 0.92;

/**
 * The menu's quiet entrances, on the site's terms: each chapter's heading, each category's head and every row,
 * line or card rises once as it arrives (opacity and 20px, kd.out, 0.7s), the ones that arrive together 0.05s
 * apart. The first screen never moves (the table's slip is TableController's). Everything is server-rendered and
 * visible: this only runs after mount in full motion, and only on what the guest hasn't reached yet.
 *
 * Not ScrollTrigger: the menu is read by jumping (the notice's contents, a dish's link, the action bar), and a
 * block jumped past must simply be there when the guest scrolls back. So every scroll frame shows whatever has
 * come above the line, and whatever is already above the screen appears without a rise.
 */
export function MenuMotion() {
  const mode = useMotionMode();

  useGSAP(
    (_, contextSafe) => {
      if (mode !== "full" || !contextSafe) return;
      const main = document.getElementById("main");
      if (!main) return;
      const vh = window.innerHeight;
      const blocks = Array.from(main.querySelectorAll<HTMLElement>("[data-mn-head], .mn-cat__head, [data-mn-rise], .mn-row, .mn-line, .mn-card")).filter(
        (el) => el.getBoundingClientRect().top > vh * AT,
      );
      if (!blocks.length) return;
      // A chapter's heading rises line by line (its title, then its lead).
      const parts = (el: HTMLElement) => (el.matches("[data-mn-head]") ? Array.from(el.children) : [el]);
      const pending = new Set(blocks);
      gsap.set(blocks.flatMap(parts), { opacity: 0, y: 20 });

      let frame = 0;
      const check = contextSafe(() => {
        frame = 0;
        const line = window.innerHeight * AT;
        const rise: Element[] = [];
        const skip: Element[] = [];
        for (const el of pending) {
          const r = el.getBoundingClientRect();
          if (r.top > line) continue;
          pending.delete(el);
          (r.bottom < 0 ? skip : rise).push(...parts(el));
        }
        if (skip.length) gsap.set(skip, { clearProps: "opacity,transform" });
        if (rise.length) gsap.to(rise, { opacity: 1, y: 0, duration: 0.7, ease: "kd.out", stagger: 0.05, overwrite: true, clearProps: "opacity,transform" });
        if (!pending.size) window.removeEventListener("scroll", schedule);
      });
      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(check);
      };
      window.addEventListener("scroll", schedule, { passive: true });
      schedule();
      return () => {
        window.removeEventListener("scroll", schedule);
        cancelAnimationFrame(frame);
      };
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
