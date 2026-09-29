"use client";

import { useEffect } from "react";
import { planFrames } from "@/content/plans";
import type { City } from "@/content/types";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { enterSheet, onSheet, project, type SheetPoint } from "@/lib/plan";
import { kd } from "@/lib/store";
import { isOpen } from "@/lib/time";
import { INVITE_PARAM } from "../invite";
import { nearStore, type NearAnswer } from "./near-store";

type LenisLike = { scrollTo: (target: number, options?: { onComplete?: () => void; immediate?: boolean }) => void };
const lenis = () => (window as unknown as { __lenis?: LenisLike }).__lenis;

/** Side by side, the plan stuck beside the legend: desktops, and anything held on its side (locations-page.css). */
const WIDE = "(min-width: 1024px), (min-width: 640px) and (orientation: landscape)";
/** A new row takes the plan only once the scroll has rested this long: a fling past five rows is one change. */
const SETTLE_MS = 140;
/** Where the eye reads the list, as a share of the screen's height. */
const READ_AT = 0.45;
/** A fix vaguer than this can't tell three cafés 400 m apart: the rows are ranked, but nothing is drawn. */
const MAX_ACCURACY_M = 1000;

// Back/Forward into /locations is a restore, not an arrival: the browser puts the scroll back.
let lastPop = -1e9;
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    lastPop = performance.now();
  });
}

const idOf = (hash: string) => {
  try {
    return decodeURIComponent(hash.replace(/^#/, ""));
  } catch {
    return "";
  }
};
/** Below this the sheet sets the closest marks apart (locations-page.css: the plan's container queries). */
const SMALL_SHEET = 421;
/** A mark's place on its sheet as drawn, back from the % it is set at. */
const markPoint = (mk: HTMLElement, small: boolean): SheetPoint => ({
  x: parseFloat(mk.style.getPropertyValue(small ? "--xs" : "--x")) * 10,
  y: parseFloat(mk.style.getPropertyValue(small ? "--ys" : "--y")) * 12.5,
});

/**
 * The plan's one red, and what moves it. The current café is, in this order: the one the pointer is on (a row or
 * a mark) or keyboard focus is in; the one held (a friend's link, the answer to «Какая ближе ко мне?», a tapped
 * mark); on a desktop with nothing held, the row being read. It is written as data-current on the mark and the
 * row; CSS does the rest. Also: marks of cafés closed for the night turn hollow, the guest and the dotted line are
 * drawn, and a pick arriving by client navigation is honoured.
 */
export function PlanController() {
  useEffect(() => {
    const main = document.getElementById("main");
    const root = document.getElementById("kofejni");
    if (!main || !root) return;
    const html = document.documentElement;
    main.dataset.lcLive = "";
    const desktop = window.matchMedia(WIDE);
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const reduced = () => kd.get().motion === "reduced";

    const rowOf = (id: string | null) => (id ? root.querySelector<HTMLElement>(`[data-lc-cafe="${CSS.escape(id)}"]`) : null);
    const cityOfRow = (row: HTMLElement | null) => (row?.closest<HTMLElement>("[data-lc-city]")?.dataset.lcCity as City | undefined) ?? null;
    const planOf = (city: City) => root.querySelector<HTMLElement>(`[data-lc-plan="${city}"]`);
    const listOf = (city: City) => root.querySelector<HTMLElement>(`[data-lc-city="${city}"] [data-lc-list]`);
    const header = () => document.querySelector<HTMLElement>("[data-header]")?.offsetHeight ?? 0;

    let transient: string | null = null;
    let pointing = false;
    let hold: string | null = null;
    let reading: string | null = null;
    let current: string | null = null;

    // ── The current café ──
    /** Boxes a label must keep clear of: the other discs, the cartouche, and the guest's mark when it is drawn. */
    const obstacles = (map: HTMLElement, except?: HTMLElement) =>
      Array.from(map.querySelectorAll<HTMLElement>(".lc-mk__disc, .lc-plan__cartouche, .lc-you:not([hidden]) .lc-you__ring"))
        .filter((el) => !except?.contains(el))
        .map((el) => el.getBoundingClientRect());
    const overlaps = (a: DOMRect, b: DOMRect, pad = 3) =>
      !(b.right < a.left - pad || b.left > a.right + pad || b.bottom < a.top - pad || b.top > a.bottom + pad);
    /**
     * The café's name always shows, where it reads best: on the paper (it may run into the sheet's margin, past
     * the neatline, as a printed plan's names do), never over the guest's own mark, and over as few other marks as
     * can be. Its own side first, then the other, then above and below the disc; the first clear one wins.
     */
    const fitLabel = (mk: HTMLElement) => {
      const map = mk.closest<HTMLElement>("[data-lc-map]");
      const sheet = mk.closest<HTMLElement>(".lc-plan__sheet");
      const label = mk.querySelector<HTMLElement>(".lc-mk__label");
      if (!map || !sheet || !label) return;
      const paper = sheet.getBoundingClientRect();
      const blocks = obstacles(map, mk);
      const guest = Array.from(map.querySelectorAll<HTMLElement>(".lc-you:not([hidden]) .lc-you__ring")).map((el) => el.getBoundingClientRect());
      // Measured where it lands, not where it waits (4px short): the slide is held still for the measure.
      label.style.translate = "none";
      label.style.transition = "none";
      const judge = (side: string) => {
        mk.dataset.side = side;
        const r = label.getBoundingClientRect();
        // Where it lands: beside the disc it is centred on its line; above or below, on its column.
        const l = side === "n" || side === "s" ? new DOMRect(r.x - r.width / 2, r.y, r.width, r.height) : new DOMRect(r.x, r.y - r.height / 2, r.width, r.height);
        const onPaper = l.left >= paper.left + 4 && l.right <= paper.right - 4 && l.top >= paper.top + 4 && l.bottom <= paper.bottom - 4;
        // Covering the guest is worse than covering any number of other marks.
        const score = (onPaper ? 0 : 1000) + guest.filter((b) => overlaps(l, b)).length * 100 + blocks.filter((b) => overlaps(l, b)).length;
        return { side, score };
      };
      const own = mk.dataset.side === "w" ? "w" : "e";
      let best: { side: string; score: number } | null = null;
      for (const side of [own, own === "e" ? "w" : "e", "n", "s"]) {
        const r = judge(side);
        if (!best || r.score < best.score) best = r;
        if (r.score === 0) break;
      }
      if (best) mk.dataset.side = best.side;
      label.style.removeProperty("translate");
      label.style.removeProperty("transition");
    };
    const lists = Array.from(root.querySelectorAll<HTMLElement>("[data-lc-list]"));
    const apply = () => {
      const next = transient ?? hold ?? reading;
      const shown = listOf(kd.get().city);
      for (const l of lists) l.toggleAttribute("data-pointing", l === shown && pointing && !!transient);
      if (next === current) return;
      root.querySelectorAll("[data-current]").forEach((el) => el.removeAttribute("data-current"));
      current = next;
      if (!next) return;
      root.querySelectorAll<HTMLElement>(`[data-lc-mk="${CSS.escape(next)}"], [data-lc-cafe="${CSS.escape(next)}"]`).forEach((el) => {
        el.setAttribute("data-current", "");
        if (el.matches("[data-lc-mk]") && el.getClientRects().length) fitLabel(el);
      });
    };

    // ── Rows and marks under the pointer, and keyboard focus in the list ──
    const isMouse = (e: PointerEvent) => e.pointerType === "mouse" || (e.pointerType === "pen" && e.buttons === 0);
    const onOver = (e: PointerEvent) => {
      if (!isMouse(e) || !fine.matches) return;
      const el = (e.target as Element).closest<HTMLElement>("[data-lc-cafe], [data-lc-mk]");
      const id = el?.dataset.lcCafe ?? el?.dataset.lcMk ?? null;
      if (id === transient && pointing) return;
      transient = id;
      pointing = !!id;
      apply();
    };
    const onOut = (e: PointerEvent) => {
      if (!isMouse(e)) return;
      const to = (e.relatedTarget as Element | null)?.closest?.("[data-lc-cafe], [data-lc-mk]");
      if (to) return;
      if (!pointing) return;
      transient = null;
      pointing = false;
      apply();
    };
    const onFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (!el.matches(":focus-visible")) return;
      const id = el.closest<HTMLElement>("[data-lc-cafe]")?.dataset.lcCafe ?? null;
      if (!id) return;
      transient = id;
      pointing = false;
      apply();
    };
    const onFocusOut = (e: FocusEvent) => {
      const to = (e.relatedTarget as Element | null)?.closest?.("[data-lc-cafe]");
      if (to || pointing) return;
      transient = null;
      apply();
    };

    // ── To a row: the plan's marks, a client arrival ──
    const docTop = (el: HTMLElement) => {
      let y = 0;
      for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) y += n.offsetTop;
      return y;
    };
    const plansCol = root.querySelector<HTMLElement>("[data-lc-plans]");
    const sticky = root.querySelector<HTMLElement>("[data-lc-sticky]");
    const landing = (row: HTMLElement) => {
      const y = Math.max(0, docTop(row) - (parseFloat(getComputedStyle(row).scrollMarginTop) || header() + 16));
      if (!desktop.matches || !plansCol || !sticky) return y;
      // Side by side, a late row lands no lower in the page than lets the stuck plan stay whole beside it: the
      // row sits a little further down the screen instead of the plan running up under the header.
      const stuckAt = parseFloat(getComputedStyle(sticky).top) || header();
      return Math.min(y, Math.max(0, docTop(plansCol) + plansCol.offsetHeight - sticky.offsetHeight - stuckAt));
    };
    /** Focus follows the jump, on the row itself, made focusable only for the landing. */
    const focus = (row: HTMLElement) => {
      if (!row.hasAttribute("tabindex")) {
        row.setAttribute("tabindex", "-1");
        row.addEventListener("blur", () => row.removeAttribute("tabindex"), { once: true });
      }
      row.focus({ preventScroll: true });
    };
    /**
     * An instant jump that a ScrollTrigger refresh won't undo: through its own scroll record, and once more after
     * the next refresh (a new page's first refresh restores the scroll it cached before the jump).
     */
    let reassert: (() => void) | null = null;
    const jump = (y: number) => {
      ScrollTrigger.getScrollFunc(window)(y);
      if (reassert) ScrollTrigger.removeEventListener("refresh", reassert);
      const again = () => {
        ScrollTrigger.removeEventListener("refresh", again);
        if (reassert === again) reassert = null;
        if (Math.abs(window.scrollY - y) > 8) ScrollTrigger.getScrollFunc(window)(y);
      };
      reassert = again;
      ScrollTrigger.addEventListener("refresh", again);
      window.setTimeout(() => {
        if (reassert === again) {
          ScrollTrigger.removeEventListener("refresh", again);
          reassert = null;
        }
      }, 1500);
    };
    let token = 0;
    let safety = 0;
    const goTo = (row: HTMLElement) => {
      const mine = ++token;
      const land = () => {
        if (mine !== token) return;
        token++;
        window.clearTimeout(safety);
        focus(row);
        // From here the guest's own scroll (a wheel, a key, a finger, the scrollbar) hands the red back.
        requestAnimationFrame(() => {
          landed = true;
        });
      };
      const y = landing(row);
      const l = lenis();
      if (l && !reduced()) {
        l.scrollTo(y, { onComplete: land });
        safety = window.setTimeout(land, 2500);
      } else {
        jump(y);
        requestAnimationFrame(land);
      }
    };

    // A mark: on a mouse, it points (hover) and a click goes to its row. On touch the first tap holds it (red, its
    // address on the plan) and a second tap on it goes; without JS it is a plain link to the row.
    let downType = "";
    const onMouseDown = (e: MouseEvent) => {
      if ((e.target as Element).closest("[data-lc-mk]")) e.preventDefault();
    };
    const onDown = (e: PointerEvent) => {
      downType = e.pointerType;
      onMarkDown(e);
    };
    const onMarkClick = (e: MouseEvent) => {
      const mk = (e.target as Element).closest<HTMLElement>("[data-lc-mk]");
      if (!mk || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const id = mk.dataset.lcMk ?? "";
      const row = rowOf(id);
      if (!row) return;
      e.preventDefault();
      // Lenis listens on window for anchors: this jump is ours.
      e.stopPropagation();
      const touch = downType === "touch" || downType === "pen";
      hold = id;
      // A tap holds its café; a click only goes there, and the guest's own scroll gives the red back to reading.
      softHold = !touch;
      landed = false;
      apply();
      if (touch && current === id && !wasCurrent) return;
      goTo(row);
    };
    // The café current before a tap: a first tap on a mark holds it, a second goes to its row.
    let wasCurrent = false;
    const onMarkDown = (e: PointerEvent) => {
      const mk = (e.target as Element).closest<HTMLElement>("[data-lc-mk]");
      wasCurrent = !!mk && mk.dataset.lcMk === current;
    };
    let softHold = false;
    let landed = false;
    const release = () => {
      if (!softHold) return;
      softHold = false;
      landed = false;
      hold = null;
      commitReading();
      apply();
    };
    const onKeyScroll = (e: KeyboardEvent) => {
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(e.key)) release();
    };

    // ── The reading line (desktop, nothing held) ──
    let settle = 0;
    const readRow = () => {
      if (hold || !desktop.matches) return null;
      const list = listOf(kd.get().city);
      const sticky = root.querySelector<HTMLElement>("[data-lc-sticky]");
      if (!list || !list.getClientRects().length) return null;
      const lr = list.getBoundingClientRect();
      // No sticky range (two cafés beside a taller plan): nothing to read along.
      if (sticky && lr.height <= sticky.offsetHeight) return null;
      if (lr.bottom < 0 || lr.top > window.innerHeight) return null;
      const line = window.innerHeight * READ_AT;
      const rows = Array.from(list.querySelectorAll<HTMLElement>("[data-lc-cafe]")).sort(
        (a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top,
      );
      let id = rows[0]?.dataset.lcCafe ?? null;
      for (const r of rows) {
        if (r.getBoundingClientRect().top > line) break;
        id = r.dataset.lcCafe ?? id;
      }
      return id;
    };
    const commitReading = () => {
      settle = 0;
      const next = readRow();
      if (next === reading) return;
      reading = next;
      apply();
    };
    const onScroll = () => {
      if (landed) release();
      window.clearTimeout(settle);
      settle = window.setTimeout(commitReading, SETTLE_MS);
    };

    // ── The guest and the dotted line ──
    let way: gsap.core.Timeline | null = null;
    /** The size of the sheet the way was drawn on: only a real resize redraws it. */
    let drawnAt = "";
    const clearWay = () => {
      // Revert, not kill: a draw cut short (a city shown, a resize) must not leave the guest half-landed.
      way?.revert();
      way = null;
      drawnAt = "";
      root.querySelectorAll<HTMLElement>("[data-lc-you]").forEach((el) => (el.hidden = true));
      root.querySelectorAll<SVGLineElement>("[data-lc-line], [data-lc-reveal]").forEach((l) => {
        l.removeAttribute("x1");
        l.removeAttribute("x2");
        l.removeAttribute("y1");
        l.removeAttribute("y2");
      });
    };
    /**
     * «Вы здесь» reads where it is clear: of above, below, right and left of the guest, the first whose words stay on
     * the sheet and off every disc, the café's label, the cartouche and the line; if none is, the dot says it alone.
     */
    const placeYou = (plan: HTMLElement, you: HTMLElement, line: [number, number, number, number] | null) => {
      const map = plan.querySelector<HTMLElement>("[data-lc-map]")!;
      const label = you.querySelector<HTMLElement>(".lc-you__label");
      if (!label) return;
      const m = map.getBoundingClientRect();
      const blocks = [
        ...Array.from(map.querySelectorAll<HTMLElement>(".lc-mk__disc, .lc-plan__cartouche")).map((el) => el.getBoundingClientRect()),
        // The café's name: it keeps its place, and the guest's words yield to it.
        ...Array.from(map.querySelectorAll<HTMLElement>("[data-lc-mk] .lc-mk__label"))
          .filter((el) => el.closest<HTMLElement>("[data-lc-mk]")?.dataset.lcMk === hold || el.closest("[data-current]"))
          .map((el) => el.getBoundingClientRect()),
      ];
      // The line, as points every 6px, in the page's coordinates.
      const dots: [number, number][] = [];
      if (line) {
        const [x1, y1, x2, y2] = line;
        const n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / 6));
        for (let i = 0; i <= n; i++) dots.push([m.left + x1 + ((x2 - x1) * i) / n, m.top + y1 + ((y2 - y1) * i) / n]);
      }
      for (const side of ["n", "s", "e", "w"]) {
        you.dataset.lab = side;
        const l = label.getBoundingClientRect();
        if (l.left < m.left + 4 || l.right > m.right - 4 || l.top < m.top + 4 || l.bottom > m.bottom - 4) continue;
        const hits = blocks.filter((b) => overlaps(l, b)).length + dots.filter(([x, y]) => x > l.left - 3 && x < l.right + 3 && y > l.top - 3 && y < l.bottom + 3).length;
        if (!hits) return;
      }
      you.dataset.lab = "none";
    };
    const drawWay = (a: NearAnswer, animate = true) => {
      clearWay();
      const row = rowOf(a.target);
      const city = cityOfRow(row);
      const plan = city ? planOf(city) : null;
      const mk = plan?.querySelector<HTMLElement>(`[data-lc-mk="${CSS.escape(a.target)}"]`);
      const map = plan?.querySelector<HTMLElement>("[data-lc-map]");
      // The café takes the red (and its label its final side); then the guest's words find the room that is left.
      let you: HTMLElement | null = null;
      let placeGuest = () => {};
      const done = () => {
        holdTarget(a.target);
        if (mk) fitLabel(mk);
        placeGuest();
      };
      if (!city || !plan || !mk || !map || a.accuracy > MAX_ACCURACY_M) return done();
      you = plan.querySelector<HTMLElement>("[data-lc-you]");
      const to = markPoint(mk, map.clientWidth < SMALL_SHEET);
      const guest = project(planFrames[city], a.here);
      const from = enterSheet(guest, to, 6);
      const inside = onSheet(guest, 0);
      // In px on the sheet as drawn now, to trim the ends: 18px clear of the guest's ring, 4px outside the disc.
      const w = map.clientWidth;
      const h = map.clientHeight;
      const fx = (from.x / 1000) * w, fy = (from.y / 1250) * h;
      const tx = (to.x / 1000) * w, ty = (to.y / 1250) * h;
      const len = Math.hypot(tx - fx, ty - fy);
      const disc = (mk.querySelector<HTMLElement>(".lc-mk__disc")?.offsetWidth ?? 24) / 2 + 6;
      const startGap = inside ? 18 : 0;
      const pctX = (v: number) => `${((v / w) * 100).toFixed(3)}%`;
      const pctY = (v: number) => `${((v / h) * 100).toFixed(3)}%`;
      // A way shorter than a few dots says nothing the two marks don't: then only the guest is drawn.
      const drawn = len - startGap - disc >= 14;
      const ux = len ? (tx - fx) / len : 0;
      const uy = len ? (ty - fy) / len : 0;
      const x1 = fx + ux * startGap, y1 = fy + uy * startGap;
      const x2 = tx - ux * disc, y2 = ty - uy * disc;
      const L = drawn ? Math.hypot(x2 - x1, y2 - y1) : 0;
      drawnAt = `${w}x${h}`;
      const line = plan.querySelector<SVGLineElement>("[data-lc-line]");
      const reveal = plan.querySelector<SVGLineElement>("[data-lc-reveal]");
      if (drawn) {
        for (const l of [line, reveal]) {
          l?.setAttribute("x1", pctX(x1));
          l?.setAttribute("y1", pctY(y1));
          l?.setAttribute("x2", pctX(x2));
          l?.setAttribute("y2", pctY(y2));
        }
      }
      // The guest first, then the café's name clear of it, then the guest's words clear of both.
      if (you) {
        you.hidden = !inside;
        you.dataset.lab = "none";
        you.style.setProperty("--x", pctX(fx));
        you.style.setProperty("--y", pctY(fy));
      }
      // The café's name reads away from the way in, so the line arrives at a clear disc (if that side is clear).
      mk.dataset.side = tx >= fx ? "e" : "w";
      hold = a.target;
      fitLabel(mk);
      if (you && inside) placeGuest = () => placeYou(plan, you, drawn ? [x1, y1, x2, y2] : null);
      if (reduced() || !animate) {
        reveal?.style.removeProperty("stroke-dasharray");
        return done();
      }
      way = gsap.timeline({ onComplete: done });
      if (you && inside) way.from(you, { scale: 0.6, opacity: 0, duration: 0.45, ease: "kd.settle", clearProps: "transform,opacity,scale" }, 0);
      if (reveal && drawn) {
        reveal.style.strokeDasharray = `${L}`;
        way.fromTo(
          reveal,
          { strokeDashoffset: L },
          {
            strokeDashoffset: 0,
            duration: Math.min(1.1, Math.max(0.6, 0.45 + L / 600)),
            ease: "kd.inOut",
            // Once drawn, the line holds at any width: the dash that revealed it goes.
            onComplete: () => {
              reveal.style.removeProperty("stroke-dasharray");
              reveal.style.removeProperty("stroke-dashoffset");
            },
          },
          0.2,
        );
      }
    };
    const holdTarget = (id: string) => {
      hold = id;
      softHold = false;
      reading = null;
      apply();
    };
    const onNear = () => {
      const a = nearStore.get();
      if (a) drawWay(a);
    };

    // ── The pick: a friend's link, or any link to a café ──
    const pickFrom = (hash: string, arriving: boolean) => {
      const id = idOf(hash);
      const row = rowOf(id);
      const city = cityOfRow(row);
      if (!row || !city) return false;
      html.dataset.lcPick = id;
      if (new URLSearchParams(location.search).has(INVITE_PARAM)) html.dataset.lcInvited = "";
      if (kd.get().city !== city) kd.showCity(city);
      holdTarget(id);
      if (arriving) requestAnimationFrame(() => goTo(row));
      return true;
    };
    const onHash = () => {
      pickFrom(location.hash, true);
    };

    // ── The city: a switch drops what belonged to the other one ──
    let city = kd.get().city;
    let now = kd.get().now;
    const marks = Array.from(root.querySelectorAll<HTMLElement>("[data-lc-mk]"));
    const nightShift = () => {
      if (now === null) return;
      for (const mk of marks) {
        const open = mk.dataset.open ?? "07:30";
        const close = (mk.dataset.close ?? "00:00") as "23:00" | "00:00";
        mk.toggleAttribute("data-closed", !isOpen({ open, close }, now));
      }
    };
    const onStore = () => {
      const s = kd.get();
      if (s.now !== now) {
        now = s.now;
        nightShift();
      }
      if (s.city === city) return;
      city = s.city;
      if (hold && cityOfRow(rowOf(hold)) !== city) {
        hold = null;
        softHold = false;
        clearWay();
      }
      transient = null;
      pointing = false;
      reading = null;
      apply();
      commitReading();
      // Back in the answer's city: its way comes back as it was, without being drawn again.
      const a = nearStore.get();
      if (a && cityOfRow(rowOf(a.target)) === city) drawWay(a, false);
    };

    // ── Start ──
    // The pick always comes from the address (so a development double mount finds it again). Whether this is an
    // arrival to land, or a hard load the browser has already jumped for, is read once the fonts have settled
    // the rows, from the mark the inline script left: read then, not at mount, so a double mount can't spend it.
    const w = window as unknown as { __kdLcLoad?: number };
    const restoring = performance.now() - lastPop < 1000;
    let alive = true;
    const picked = pickFrom(location.hash, false);
    (document.fonts?.ready ?? Promise.resolve()).then(() =>
      requestAnimationFrame(() => {
        if (!alive) return;
        const hardLoad = w.__kdLcLoad === 1;
        delete w.__kdLcLoad;
        const row = picked ? rowOf(html.dataset.lcPick ?? null) : null;
        if (!row || restoring) return;
        if (hardLoad) {
          const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
          if (nav && nav.type !== "navigate") return;
        }
        if (!hardLoad) {
          // A client arrival: the hidden city's row was display: none when the router tried to scroll to it.
          goTo(row);
          return;
        }
        // A hard load: the browser jumped before the fonts settled the rows above; correct the landing, no focus.
        const off = landing(row) - window.scrollY;
        if (Math.abs(off) > 8) jump(window.scrollY + off);
      }),
    );
    nightShift();
    if (nearStore.get()) onNear();
    commitReading();

    const marksLayers = Array.from(root.querySelectorAll<HTMLElement>("[data-lc-marks]"));
    for (const el of [...lists, ...marksLayers]) {
      el.addEventListener("pointerover", onOver);
      el.addEventListener("pointerout", onOut);
    }
    for (const l of lists) {
      l.addEventListener("focusin", onFocusIn);
      l.addEventListener("focusout", onFocusOut);
    }
    for (const m of marksLayers) {
      m.addEventListener("pointerdown", onDown);
      m.addEventListener("mousedown", onMouseDown);
      m.addEventListener("click", onMarkClick);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", release, { passive: true });
    window.addEventListener("touchmove", release, { passive: true });
    window.addEventListener("keydown", onKeyScroll);
    window.addEventListener("hashchange", onHash);
    // The way is set in % of the sheet but trimmed in px: a sheet that changes size gets it redrawn, still.
    let resized = 0;
    const ro = new ResizeObserver(() => {
      window.cancelAnimationFrame(resized);
      resized = window.requestAnimationFrame(() => {
        const a = nearStore.get();
        if (!a || hold !== a.target) return;
        const map = planOf(cityOfRow(rowOf(a.target)) ?? kd.get().city)?.querySelector<HTMLElement>("[data-lc-map]");
        if (map && `${map.clientWidth}x${map.clientHeight}` !== drawnAt) drawWay(a, false);
      });
    });
    root.querySelectorAll<HTMLElement>("[data-lc-map]").forEach((m) => ro.observe(m));
    desktop.addEventListener("change", commitReading);
    const offStore = kd.subscribe(onStore);
    const offNear = nearStore.subscribe(onNear);

    return () => {
      alive = false;
      token++;
      window.clearTimeout(safety);
      window.clearTimeout(settle);
      way?.revert();
      for (const el of [...lists, ...marksLayers]) {
        el.removeEventListener("pointerover", onOver);
        el.removeEventListener("pointerout", onOut);
      }
      for (const l of lists) {
        l.removeEventListener("focusin", onFocusIn);
        l.removeEventListener("focusout", onFocusOut);
        l.removeAttribute("data-pointing");
      }
      for (const m of marksLayers) {
        m.removeEventListener("pointerdown", onDown);
        m.removeEventListener("mousedown", onMouseDown);
        m.removeEventListener("click", onMarkClick);
      }
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", release);
      window.removeEventListener("touchmove", release);
      window.removeEventListener("keydown", onKeyScroll);
      window.removeEventListener("hashchange", onHash);
      ro.disconnect();
      window.cancelAnimationFrame(resized);
      if (reassert) ScrollTrigger.removeEventListener("refresh", reassert);
      desktop.removeEventListener("change", commitReading);
      offStore();
      offNear();
      root.querySelectorAll("[data-current]").forEach((el) => el.removeAttribute("data-current"));
      marks.forEach((mk) => mk.removeAttribute("data-closed"));
      delete main.dataset.lcLive;
      delete html.dataset.lcPick;
      delete html.dataset.lcInvited;
    };
  }, []);

  return null;
}
