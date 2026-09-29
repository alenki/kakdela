"use client";

import { useEffect } from "react";
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
 * come above the line, and whatever is already above the screen appears without a rise; a block the keyboard
 * reaches, and the whole page when it is printed, are shown at once.
 */
export function MenuMotion() {
  const mode = useMotionMode();

  // In every motion mode: a dish reached by the keyboard comes into view whole (its photo, its small print and the
  // ring round it), clear of the header and, on a phone, of the action bar. The browser only brings its name in.
  useEffect(() => {
    const main = document.getElementById("main");
    if (!main) return;
    let raf = 0;
    const onFocus = (e: FocusEvent) => {
      const a = e.target;
      if (!(a instanceof HTMLAnchorElement) || !a.matches(".mn-name__link:focus-visible")) return;
      const item = a.closest<HTMLElement>(".mn-row, .mn-card, .mn-line");
      if (!item) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = item.getBoundingClientRect();
        // A card's ring stands 8px outside it; a row's and a line's sit on their rules.
        const pad = item.matches(".mn-card") ? 16 : 8;
        const header = document.querySelector<HTMLElement>("[data-header]")?.getBoundingClientRect().bottom ?? 0;
        const bar = document.querySelector<HTMLElement>(".action-bar")?.getBoundingClientRect();
        const foot = bar && bar.height && bar.top < window.innerHeight ? bar.top : window.innerHeight;
        const top = Math.max(0, header) + pad;
        const bottom = foot - pad;
        const dy = r.top < top ? r.top - top : r.bottom > bottom ? Math.min(r.bottom - bottom, r.top - top) : 0;
        if (!dy) return;
        const lenis = (window as unknown as { __lenis?: { scrollTo: (y: number, o: { immediate: boolean }) => void } }).__lenis;
        if (lenis) lenis.scrollTo(window.scrollY + dy, { immediate: true });
        else window.scrollBy(0, dy);
      });
    };
    main.addEventListener("focusin", onFocus);
    return () => {
      main.removeEventListener("focusin", onFocus);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Below the table's width a dish's link to itself goes nowhere: the row is already in front of the guest, and
  // following it only pulled the page up to it. The link stays, to be focused, long-pressed and sent.
  useEffect(() => {
    const main = document.getElementById("main");
    if (!main) return;
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onClick = (e: MouseEvent) => {
      if (desktop.matches || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (!(e.target instanceof Element) || !e.target.closest(".mn-name__link")) return;
      e.preventDefault();
      // Lenis (a mouse in a narrow window) follows anchors from window whatever the default: it never hears of it.
      e.stopPropagation();
    };
    main.addEventListener("click", onClick);
    return () => main.removeEventListener("click", onClick);
  }, []);

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
      // Whatever the keyboard reaches, and everything when the page is printed, is shown at once.
      const show = contextSafe((els: HTMLElement[]) => {
        els.forEach((el) => pending.delete(el));
        gsap.set(els.flatMap(parts), { clearProps: "opacity,transform" });
      });
      const onFocus = (e: FocusEvent) => {
        const hit = Array.from(pending).filter((el) => el.contains(e.target as Node));
        if (hit.length) show(hit);
      };
      const onPrint = () => show(Array.from(pending));
      window.addEventListener("scroll", schedule, { passive: true });
      main.addEventListener("focusin", onFocus);
      window.addEventListener("beforeprint", onPrint);
      schedule();
      return () => {
        window.removeEventListener("scroll", schedule);
        main.removeEventListener("focusin", onFocus);
        window.removeEventListener("beforeprint", onPrint);
        cancelAnimationFrame(frame);
      };
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
