"use client";

import { useEffect } from "react";
import { PICK_BY_ANCHOR } from "../pick-script";

type LenisLike = { scrollTo: (target: number, options?: { onComplete?: () => void }) => void };
const lenis = () => (window as unknown as { __lenis?: LenisLike }).__lenis;

/** 16px of air between the chrome and the dish it lands on (the --mn-scroll margin in menu.css). */
const AIR = 16;

// Back/Forward into /menu is a restore, not an arrival: the browser puts the scroll back, and focus stays.
let lastPop = -1e9;
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    lastPop = performance.now();
  });
}

/**
 * In-page travel on /menu. Every «#…» link on the page (the answers index, the contents, the running head,
 * the action bar's «Меню») glides to its target (Lenis on fine pointers in full motion, an instant jump
 * otherwise), lands it just under the running head, and moves focus there. Landing on one of the eight
 * answer dishes sets html[data-pick], and CSS turns that dish's answer word the page's one red. Nothing is
 * stored: picking on the menu is navigation, not an answer. Without JS the links are plain anchors.
 */
export function MenuNav() {
  useEffect(() => {
    const root = document.getElementById("main");
    const html = document.documentElement;
    if (!root) return;

    const idOf = (hash: string) => {
      try {
        return decodeURIComponent(hash.replace(/^#/, ""));
      } catch {
        return "";
      }
    };
    // A target on this page that the guest can see (a dish of the other city is display: none).
    const targetOf = (id: string) => {
      const el = id ? document.getElementById(id) : null;
      return el && el !== root && root.contains(el) && el.getClientRects().length > 0 ? el : null;
    };
    const pickFromHash = () => {
      const pick = PICK_BY_ANCHOR[idOf(location.hash)];
      if (pick) html.dataset.pick = pick;
    };

    // An element's top in the document, from layout alone: a row still waiting for its entrance is drawn
    // 20px low (a transform), and the landing must not follow it.
    const docTop = (el: HTMLElement) => {
      let y = 0;
      for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) y += n.offsetTop;
      return y;
    };
    // A chapter docks right under the running head (its own padding is the air); anything else keeps 16px.
    const airOf = (el: HTMLElement) => (el.matches(".mn-ch") ? 0 : AIR);
    const heights = () => ({
      header: document.querySelector<HTMLElement>("[data-header]"),
      run: document.querySelector<HTMLElement>("[data-mn-run]")?.offsetHeight ?? 0,
    });
    // The chrome over the page when the scroll ends: the running head, and the header unless it will have
    // tucked away (HeaderBehavior tucks it on the way down past 75vh).
    const chromeAbove = (y: number) => {
      const { header, run } = heights();
      const tucked = y > window.scrollY && y > window.innerHeight * 0.75;
      return run + (tucked ? 0 : (header?.offsetHeight ?? 0));
    };
    const yOf = (el: HTMLElement) => {
      if (el.id === "soderzhanie") return 0;
      const top = docTop(el) - airOf(el);
      return Math.max(0, top - chromeAbove(top - chromeAbove(top)));
    };

    // Focus follows the jump: a dish row itself, otherwise the heading of the chapter or category. It is made
    // focusable only for the landing, so a click on a row never takes focus.
    const focus = (el: HTMLElement) => {
      const f = el.matches("li") ? el : (el.querySelector<HTMLElement>("h1, h2, h3") ?? el);
      if (!f.hasAttribute("tabindex")) {
        f.setAttribute("tabindex", "-1");
        f.addEventListener("blur", () => f.removeAttribute("tabindex"), { once: true });
      }
      f.focus({ preventScroll: true });
    };

    let token = 0;
    let safety = 0;
    const go = (el: HTMLElement) => {
      const mine = ++token;
      const land = () => {
        if (mine !== token) return;
        token++;
        window.clearTimeout(safety);
        focus(el);
        if (el.dataset.answer) html.dataset.pick = el.dataset.answer;
      };
      const y = yOf(el);
      const l = lenis();
      if (l) {
        l.scrollTo(y, { onComplete: land });
        // Lenis may never complete (a wheel interrupts it): land anyway.
        safety = window.setTimeout(land, 2500);
      } else {
        window.scrollTo({ top: y, behavior: "instant" });
        requestAnimationFrame(land);
      }
    };

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const id = idOf(a.getAttribute("href") ?? "");
      const el = targetOf(id);
      if (!el) return;
      e.preventDefault();
      // Lenis listens on window for anchors: this jump is ours.
      e.stopPropagation();
      if (idOf(location.hash) !== id) history.pushState(null, "", `#${id}`);
      go(el);
    };

    // Arrival: a hard load or a client navigation with a hash (the hero's «В меню»). The browser (or Next)
    // has jumped already; once the fonts have settled the layout, correct the landing against the chrome as
    // it is. On a client navigation focus moves to the dish (it would be lost otherwise); a hard load already
    // starts the Tab order at the target, so no ring is painted there.
    const w = window as unknown as { __kdMenuLoad?: number };
    pickFromHash();
    let alive = true;
    const arrived = performance.now() - lastPop < 1000 ? null : targetOf(idOf(location.hash));
    // No landing to settle: the hard-load mark is spent now, so a later client arrival still moves focus.
    if (!arrived) delete w.__kdMenuLoad;
    if (arrived) {
      const settle = () => {
        // Read here, not at mount: a development double mount must not use up the mark.
        if (!alive) return;
        const hardLoad = w.__kdMenuLoad === 1;
        delete w.__kdMenuLoad;
        const { header, run } = heights();
        const chrome = run + (header && !header.hasAttribute("data-hidden") ? header.offsetHeight : 0) + airOf(arrived);
        const off = docTop(arrived) - window.scrollY - chrome;
        if (Math.abs(off) > 8) window.scrollTo({ top: window.scrollY + off, behavior: "instant" });
        if (!hardLoad) focus(arrived);
        if (arrived.dataset.answer) html.dataset.pick = arrived.dataset.answer;
      };
      (document.fonts?.ready ?? Promise.resolve()).then(() => requestAnimationFrame(settle));
    }

    document.addEventListener("click", onClick);
    window.addEventListener("hashchange", pickFromHash);
    window.addEventListener("popstate", pickFromHash);
    return () => {
      alive = false;
      token++;
      window.clearTimeout(safety);
      document.removeEventListener("click", onClick);
      window.removeEventListener("hashchange", pickFromHash);
      window.removeEventListener("popstate", pickFromHash);
      delete html.dataset.pick;
    };
  }, []);

  return null;
}
