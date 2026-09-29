"use client";

import { useLayoutEffect } from "react";
import { gsap } from "@/lib/gsap";

const DESKTOP = "(min-width: 1024px)";
/** The reading line, as a share of the screen's height: the row whose top has passed it is the one being read. */
const LINE = 0.45;
/** A row is served once the line has rested on it this long, so a fast scroll past twenty dishes never strobes. */
const SETTLE = 110;
/** Sweeping the pointer down the list serves the row it stops on, not every row it crosses. */
const HOVER = 60;
/** A photo gets this long to arrive and decode before it is served anyway (its blur placeholder shows meanwhile). */
const DECODE = 250;
/** Dishes either side of the one on show that are laid out (and so load), for the next one to be ready. */
const NEAR = 2;
/** The crossfade in menu.css: the old dish stays laid out under the new one this long. */
const FADE = 460;
/** A link's glide that never reports its rest (no Lenis, no scrollend, or already there) is over after this. */
const GLIDE = 1200;

type Props = {
  /** The table's dish for each answer (answer id → item id): the answer on show is served while the notice is read. */
  cover: Record<string, string>;
  /** The dish before any answer is known. */
  fallback: string;
};

const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
/** A photo is ready once it has arrived and decoded; a lazy one that has just been laid out starts arriving now. */
const ready = (img: HTMLImageElement) =>
  (img.complete ? Promise.resolve() : new Promise<void>((r) => img.addEventListener("load", () => r(), { once: true }))).then(() =>
    img.decode().catch(() => undefined),
  );

/**
 * Serves the table (MenuTable). Everything is server-rendered: slides and captions share `data-key`, and this only
 * moves `data-active` (CSS crossfades), keeps the neighbours laid out (`data-near`, so their lazy photos load
 * ahead) and marks the notice's tab whose dish is on show (`data-current`, its name red) and the kitchen row
 * (`data-served`).
 *
 * What is served: while the notice's back is being read, the answer on show (html[data-answer]) or the dish of
 * the last tab or kitchen category pointed at; then the kitchen row the guest is reading (a line at 45% of the
 * screen, once the scroll rests on it); a row or a tab under a fine pointer that has moved there, or with keyboard
 * focus, at once. Following a link on the page (a tab, a category, a dish) serves its dish at once and keeps it
 * while the page glides there and after, until the guest scrolls again: the rows gliding past the line are not
 * being read. A page that opens on a dish (/menu#shakshuka) opens with that dish on the table, and marks it
 * (`data-came`, as :target does, since a client-side visit never sets :target). Set up before paint (a layout
 * effect), so a client-side visit never shows another dish first. Desktop only: phones have no table, and there
 * the rows carry their own photos.
 */
export function TableController({ cover, fallback }: Props) {
  useLayoutEffect(() => {
    const table = document.querySelector<HTMLElement>("[data-mn-table]");
    const back = document.querySelector<HTMLElement>("[data-mn-back]");
    if (!table || !back) return;
    const root = document.documentElement;
    const slides = new Map(Array.from(table.querySelectorAll<HTMLElement>(".mn-slide")).map((el) => [el.dataset.key ?? "", el]));
    const caps = new Map(Array.from(table.querySelectorAll<HTMLElement>(".mn-cap")).map((el) => [el.dataset.key ?? "", el]));
    const order = Array.from(slides.keys());
    const rows = Array.from(document.querySelectorAll<HTMLElement>("[data-mn-row]"));
    const kitchen = new Set(rows.map((r) => r.dataset.mnRow));
    const list = rows[0]?.closest<HTMLElement>(".mn-kitchen") ?? null;
    const servers = Array.from(back.querySelectorAll<HTMLElement>("[data-mn-serve]"));
    const mq = window.matchMedia(DESKTOP);
    const full = () => root.dataset.motion === "full";

    // The dish the page opened on: marked as the one the guest came for, and served if the table has it.
    const arrived = () => {
      let id = "";
      try {
        id = decodeURIComponent(window.location.hash.slice(1));
      } catch {}
      document.querySelectorAll("[data-came]").forEach((el) => el.removeAttribute("data-came"));
      const el = id ? document.getElementById(id) : null;
      if (el && el.closest("#main")) el.setAttribute("data-came", "");
      return el && slides.has(id) ? id : null;
    };
    const coverKey = () => cover[root.dataset.answer ?? ""] ?? fallback;
    let active = arrived() ?? (slides.has(coverKey()) ? coverKey() : fallback);
    let previous: string | null = null;
    /** The dish of the last tab or category the guest pointed at or focused: the notice's choice until the kitchen is read. */
    let chosen: string | null = null;

    const lay = () => {
      const at = order.indexOf(active);
      // While the notice is read, the kitchen's first dishes are the next likely ones.
      const next = kitchen.has(active) ? [] : order.slice(0, NEAR);
      slides.forEach((el, key) =>
        el.toggleAttribute("data-near", key === previous || next.includes(key) || Math.abs(order.indexOf(key) - at) <= NEAR),
      );
    };
    const mark = () => {
      slides.forEach((el, key) => el.toggleAttribute("data-active", key === active));
      caps.forEach((el, key) => el.toggleAttribute("data-active", key === active));
      servers.forEach((a) => a.closest(".mn-tab")?.toggleAttribute("data-current", a.dataset.mnServe === active));
      rows.forEach((r) => r.toggleAttribute("data-served", r.dataset.mnRow === active));
    };

    // Live: the dish the pick style showed before paint (or the dish arrived at) becomes the controller's.
    mark();
    lay();
    table.dataset.live = "";
    back.dataset.live = "";
    // The first dish's slip lands by CSS at first paint (pick-script.ts); once that landing has run (it may wait
    // paused under the page's loader) or was never going to, the page's own landings take over.
    let alive = true;
    const landed = () => {
      if (alive) table.setAttribute("data-landed", "");
    };
    const landing = slides
      .get(active)
      ?.querySelector(".mn-slide__slip")
      ?.getAnimations()
      .find((a) => (a as CSSAnimation).animationName === "mn-slip-land");
    if (landing) landing.finished.then(landed, landed);
    else landed();

    let token = 0;
    let dropPrevious = 0;
    const serve = async (key: string | null | undefined, land = false) => {
      if (!key || !slides.has(key) || !mq.matches) return;
      // Back to the dish on show: whatever was still on its way is dropped.
      if (key === active) {
        token++;
        return;
      }
      const mine = ++token;
      const slide = slides.get(key)!;
      slide.setAttribute("data-near", "");
      const img = slide.querySelector("img");
      await Promise.race([img ? ready(img) : Promise.resolve(), wait(DECODE)]);
      // Laid out for a frame at its starting opacity, so the crossfade runs even from display: none.
      await frame();
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
      // Pointing at a tab: its slip lands on its dish, as the torn tab lands in the hero (26px up, 5% larger).
      const slip = slide.querySelector<HTMLElement>(".mn-slide__slip");
      if (land && slip && full()) {
        gsap.fromTo(slip, { y: -26, scale: 1.05, opacity: 0 }, { y: 0, scale: 1, opacity: 1, duration: 0.45, ease: "kd.settle", clearProps: "transform,opacity" });
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
    const focusInside = () => {
      const a = document.activeElement;
      return !!a && ((list?.contains(a) ?? false) || back.contains(a));
    };
    let pointed = false;
    let pending: string | null = null;
    let settle = 0;
    let raf = 0;
    const follow = () => {
      raf = 0;
      if (!mq.matches || pointed || gliding || held || focusInside()) return;
      const key = pick();
      if (key === active) {
        pending = null;
        window.clearTimeout(settle);
        return;
      }
      if (key === pending) return;
      pending = key;
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        pending = null;
        void serve(key);
      }, SETTLE);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(follow);
    };

    // A fine pointer serves what it has moved onto. The page scrolling under a resting pointer (the wheel, a link's
    // glide to its dish) is not the guest pointing: the reading line serves then.
    let moved = false;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "mouse" || (e.pointerType === "pen" && e.buttons === 0)) moved = true;
    };
    const onScroll = () => {
      moved = false;
      pointed = false;
      schedule();
    };

    // A link followed on the page: its dish is served now and held while the page glides there and after, until
    // the guest scrolls with their own hand (the wheel, a touch, a key); a link without a dish (a chapter, the bar)
    // only keeps the line quiet until the glide rests.
    let gliding = false;
    let held: string | null = null;
    let glideCap = 0;
    const rest = () => {
      window.clearTimeout(glideCap);
      if (!gliding) return;
      if ((window as unknown as { __lenis?: { isScrolling: unknown } }).__lenis?.isScrolling) {
        glideCap = window.setTimeout(rest, 400);
        return;
      }
      gliding = false;
      schedule();
    };
    const onFollow = (e: MouseEvent) => {
      const a = e.target instanceof Element ? e.target.closest<HTMLAnchorElement>("a[href*='#']") : null;
      if (!a || !a.hash || a.pathname !== window.location.pathname || !a.closest("#main")) return;
      const key = a.dataset.mnServe ?? a.closest<HTMLElement>("[data-mn-row]")?.dataset.mnRow ?? null;
      gliding = true;
      held = key && slides.has(key) ? key : null;
      pending = null;
      window.clearTimeout(settle);
      window.clearTimeout(glideCap);
      glideCap = window.setTimeout(rest, GLIDE);
      if (held) {
        if (a.dataset.mnServe) chosen = held;
        void serve(held);
      }
    };
    const onOwn = () => {
      if (!gliding && !held) return;
      gliding = false;
      held = null;
      window.clearTimeout(glideCap);
      schedule();
    };
    const keyOf = (target: EventTarget | null) => {
      const el = target instanceof Element ? target : null;
      const tab = el?.closest<HTMLElement>("[data-mn-serve]");
      if (tab) return { key: tab.dataset.mnServe, tab: true };
      return { key: el?.closest<HTMLElement>("[data-mn-row]")?.dataset.mnRow, tab: false };
    };
    let hover = 0;
    const onOver = (e: PointerEvent) => {
      if (!moved || (e.pointerType !== "mouse" && !(e.pointerType === "pen" && e.buttons === 0))) return;
      const { key, tab } = keyOf(e.target);
      if (!key) return;
      pointed = true;
      pending = null;
      window.clearTimeout(settle);
      window.clearTimeout(hover);
      hover = window.setTimeout(() => {
        if (tab) chosen = key;
        void serve(key, tab);
      }, HOVER);
    };
    const onLeave = () => {
      pointed = false;
      pending = null;
      window.clearTimeout(hover);
      schedule();
    };
    const onFocus = (e: FocusEvent) => {
      const { key, tab } = keyOf(e.target);
      if (!key) return;
      if (tab) chosen = key;
      pending = null;
      window.clearTimeout(settle);
      void serve(key, tab);
    };
    const onBlur = () => window.setTimeout(schedule, 0);
    const onHash = () => {
      const key = arrived();
      if (key) {
        held = key;
        void serve(key);
      }
    };

    const zones = [back, list].filter((z): z is HTMLElement => !!z);
    for (const z of zones) {
      z.addEventListener("pointerover", onOver);
      z.addEventListener("pointerleave", onLeave);
      z.addEventListener("focusin", onFocus);
      z.addEventListener("focusout", onBlur);
    }
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("click", onFollow, true);
    window.addEventListener("scrollend", rest);
    for (const type of ["wheel", "touchstart", "keydown"] as const) window.addEventListener(type, onOwn, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    window.addEventListener("hashchange", onHash);
    mq.addEventListener("change", schedule);
    schedule();

    return () => {
      for (const z of zones) {
        z.removeEventListener("pointerover", onOver);
        z.removeEventListener("pointerleave", onLeave);
        z.removeEventListener("focusin", onFocus);
        z.removeEventListener("focusout", onBlur);
      }
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("click", onFollow, true);
      window.removeEventListener("scrollend", rest);
      for (const type of ["wheel", "touchstart", "keydown"] as const) window.removeEventListener(type, onOwn);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("hashchange", onHash);
      mq.removeEventListener("change", schedule);
      cancelAnimationFrame(raf);
      window.clearTimeout(settle);
      window.clearTimeout(hover);
      window.clearTimeout(dropPrevious);
      window.clearTimeout(glideCap);
      alive = false;
      token++;
      delete table.dataset.live;
      delete back.dataset.live;
      table.removeAttribute("data-landed");
      slides.forEach((el) => el.removeAttribute("data-near"));
      rows.forEach((r) => r.removeAttribute("data-served"));
      document.querySelectorAll("[data-came]").forEach((el) => el.removeAttribute("data-came"));
    };
  }, [cover, fallback]);

  return null;
}
