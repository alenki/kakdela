"use client";

import { useEffect } from "react";
import { gsap } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";

const DESKTOP = "(min-width: 1024px)";
/** The reading line, as a share of the screen's height: the row whose top has passed it is the one being read. */
const LINE = 0.45;
/** A row is served once the line has rested on it this long, so a fast scroll past twenty dishes never strobes. */
const SETTLE = 110;
/** Sweeping the pointer down the list serves the row it stops on, not every row it crosses. */
const HOVER = 60;
/** A photo gets this long to decode before it is served anyway (its blur placeholder shows meanwhile). */
const DECODE = 250;
/** Slides either side of the one on show that are laid out (and so load), for the next dish to be ready. */
const NEAR = 2;
/** The crossfade in menu.css: the old slide stays laid out under the new one this long. */
const FADE = 460;

type Props = {
  /** The table's dish for each answer (answer id → item id): the answer on show is served while the notice is read. */
  cover: Record<string, string>;
  /** The dish before any answer is known. */
  fallback: string;
};

/**
 * Serves the table (MenuTable). Everything is server-rendered: slides and captions share `data-key`, and this only
 * moves `data-active` (CSS crossfades), keeps the neighbours laid out (`data-near`, so their lazy photos load
 * ahead) and marks the notice's tab whose dish is on show (`data-current`, its name red).
 *
 * What is served: while the notice's back is being read, the answer on show (html[data-answer]), or the dish of
 * the last tab pointed at; then the kitchen row the guest is reading (a line at 45% of the screen, once the scroll
 * rests on it); a row or a tab under a fine pointer, or with keyboard focus, at once. Desktop only: phones have no
 * table, and there the rows carry their own photos.
 */
export function TableController({ cover, fallback }: Props) {
  const mode = useMotionMode();

  useEffect(() => {
    const table = document.querySelector<HTMLElement>("[data-mn-table]");
    const back = document.querySelector<HTMLElement>("[data-mn-back]");
    if (!table || !back) return;
    const root = document.documentElement;
    const slides = new Map(Array.from(table.querySelectorAll<HTMLElement>(".mn-slide")).map((el) => [el.dataset.key ?? "", el]));
    const caps = new Map(Array.from(table.querySelectorAll<HTMLElement>(".mn-cap")).map((el) => [el.dataset.key ?? "", el]));
    const order = Array.from(slides.keys());
    const rows = Array.from(document.querySelectorAll<HTMLElement>("[data-mn-row]"));
    const list = rows[0]?.closest<HTMLElement>(".mn-kitchen") ?? null;
    const tabs = Array.from(back.querySelectorAll<HTMLElement>("[data-mn-serve]"));
    const mq = window.matchMedia(DESKTOP);

    const coverKey = () => cover[root.dataset.answer ?? ""] ?? fallback;
    let active = slides.has(coverKey()) ? coverKey() : fallback;
    let previous: string | null = null;
    /** The dish of the last tab the guest pointed at or focused: the notice's choice until the kitchen is read. */
    let chosen: string | null = null;

    const lay = () => {
      const at = order.indexOf(active);
      slides.forEach((el, key) => el.toggleAttribute("data-near", key === previous || Math.abs(order.indexOf(key) - at) <= NEAR));
    };
    const mark = () => {
      slides.forEach((el, key) => el.toggleAttribute("data-active", key === active));
      caps.forEach((el, key) => el.toggleAttribute("data-active", key === active));
      tabs.forEach((a) => a.parentElement?.toggleAttribute("data-current", a.dataset.mnServe === active));
      rows.forEach((r) => r.toggleAttribute("data-served", r.dataset.mnRow === active));
    };

    // Live: the slide the pick style showed before paint becomes the controller's.
    mark();
    lay();
    table.dataset.live = "";
    back.dataset.live = "";
    // The answer's slip lands on the first dish once, as the torn tab lands in the hero (26px up, 5% larger).
    const first = slides.get(active)?.querySelector<HTMLElement>(".mn-slide__slip");
    if (first && mode === "full" && mq.matches && table.getBoundingClientRect().top < window.innerHeight) {
      gsap.from(first, { y: -26, scale: 1.05, opacity: 0, duration: 0.5, delay: 0.2, ease: "kd.settle", clearProps: "transform,opacity" });
    }

    let token = 0;
    let dropPrevious = 0;
    const serve = async (key: string | null | undefined) => {
      if (!key || key === active || !slides.has(key) || !mq.matches) return;
      const mine = ++token;
      const slide = slides.get(key)!;
      slide.setAttribute("data-near", "");
      const img = slide.querySelector("img");
      if (img) await Promise.race([img.decode().catch(() => undefined), new Promise((r) => window.setTimeout(r, DECODE))]);
      if (mine !== token) return;
      previous = active;
      active = key;
      mark();
      lay();
      window.clearTimeout(dropPrevious);
      dropPrevious = window.setTimeout(() => {
        previous = null;
        lay();
      }, FADE);
      // The answer's slip lands on its dish, as the torn tab does in the hero.
      const slip = slide.querySelector<HTMLElement>(".mn-slide__slip");
      if (slip && mode === "full") {
        gsap.fromTo(slip, { y: -18, scale: 1.04, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.42, ease: "kd.settle", clearProps: "transform,opacity" });
      }
    };

    // The reading line, once the scroll rests on a row.
    const pick = () => {
      if (!rows.length) return chosen ?? coverKey();
      const line = window.innerHeight * LINE;
      if (rows[0].getBoundingClientRect().top > line) return chosen ?? coverKey();
      let key = rows[0].dataset.mnRow;
      for (const r of rows) {
        if (r.getBoundingClientRect().top > line) break;
        key = r.dataset.mnRow;
      }
      return key ?? null;
    };
    let pointed = false;
    let pending: string | null = null;
    let settle = 0;
    let frame = 0;
    const follow = () => {
      frame = 0;
      if (!mq.matches || pointed || focusInside()) return;
      const key = pick();
      if (key === active) {
        pending = null;
        window.clearTimeout(settle);
        return;
      }
      if (key === pending) return;
      pending = key;
      window.clearTimeout(settle);
      settle = window.setTimeout(() => void serve(pending), SETTLE);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(follow);
    };

    // A fine pointer: the row or tab under it; keyboard focus: the row or tab focused.
    const keyOf = (target: EventTarget | null) => {
      const el = target instanceof Element ? target : null;
      const tab = el?.closest<HTMLElement>("[data-mn-serve]");
      if (tab) return { key: tab.dataset.mnServe, tab: true };
      return { key: el?.closest<HTMLElement>("[data-mn-row]")?.dataset.mnRow, tab: false };
    };
    const focusInside = () => {
      const a = document.activeElement;
      return !!a && ((list?.contains(a) ?? false) || back.contains(a));
    };
    let hover = 0;
    const onOver = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && !(e.pointerType === "pen" && e.buttons === 0)) return;
      const { key, tab } = keyOf(e.target);
      if (!key) return;
      pointed = true;
      window.clearTimeout(hover);
      hover = window.setTimeout(() => {
        if (tab) chosen = key;
        void serve(key);
      }, HOVER);
    };
    const onLeave = () => {
      pointed = false;
      window.clearTimeout(hover);
      schedule();
    };
    const onFocus = (e: FocusEvent) => {
      const { key, tab } = keyOf(e.target);
      if (tab && key) chosen = key;
      void serve(key);
    };
    const onBlur = () => window.setTimeout(schedule, 0);

    const zones = [back, list].filter((z): z is HTMLElement => !!z);
    for (const z of zones) {
      z.addEventListener("pointerover", onOver);
      z.addEventListener("pointerleave", onLeave);
      z.addEventListener("focusin", onFocus);
      z.addEventListener("focusout", onBlur);
    }
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    mq.addEventListener("change", schedule);
    schedule();

    return () => {
      for (const z of zones) {
        z.removeEventListener("pointerover", onOver);
        z.removeEventListener("pointerleave", onLeave);
        z.removeEventListener("focusin", onFocus);
        z.removeEventListener("focusout", onBlur);
      }
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      mq.removeEventListener("change", schedule);
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      window.clearTimeout(hover);
      window.clearTimeout(dropPrevious);
      token++;
      delete table.dataset.live;
      delete back.dataset.live;
      slides.forEach((el) => el.removeAttribute("data-near"));
      rows.forEach((r) => r.removeAttribute("data-served"));
    };
  }, [cover, fallback, mode]);

  return null;
}
