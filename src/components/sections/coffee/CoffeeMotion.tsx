"use client";

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";
import { kd } from "@/lib/store";
import type { City } from "@/content/types";
import { cupLife, steamLoop, turnHalo } from "./cup-life";
import { CUP, NOTE, type NoteLines } from "./note";
import { badgePen, cupPen, DEFAULT_NOTE, type Pen } from "./pen";

const key = (lines: NoteLines) => `${lines[0]}\n${lines[1]}`;

/** The landing: the hand lowers the cup tipped onto its right rim, lets go, and it rocks onto its base. */
const SET = { tilt: 3.2, desk: { rise: 7, down: 0.62 }, phone: { rise: 12, down: 0.5 } };
/** Scrolling faster than this, px/s, the barista waits: only the drink the page slows on gets its note. */
const HURRY = 1300;

/**
 * Play a paused entrance when its trigger is reached. ScrollTrigger does not fire onEnter for a start
 * that was already passed when the trigger was built (a matchMedia rebuild after a breakpoint change,
 * a restored scroll position), so every refresh also catches up: content never stays hidden.
 */
function playWhenReached(tl: gsap.core.Timeline, trigger: Element | null, start: string) {
  const st = ScrollTrigger.create({ trigger, start, onEnter: () => tl.play() });
  const check = () => {
    if (tl.progress() === 0 && !tl.isActive() && st.scroll() >= st.start) tl.play();
  };
  ScrollTrigger.addEventListener("refresh", check);
  const first = gsap.delayedCall(0.05, check);
  return () => {
    first.kill();
    st.kill();
    ScrollTrigger.removeEventListener("refresh", check);
  };
}

/**
 * The coffee poster's motion, full motion only (reduced motion and no JS keep the finished poster):
 * - the exchange lands: «А кофе?» asks, the answer rises heavy out of its line, the reply follows;
 * - the cup is set down on the counter while the clover behind it draws itself: lowered tipped onto its
 *   rim, let go, it rocks onto its base; then the barista writes «как дела?»;
 * - each drink that passes the cup's sleeve (desktop) or the band's reading line (phones) gets its note
 *   hand-written on the cup once the scroll slows there; pointing at a drink or tabbing to it writes
 *   that one instead. The pen drags the cup onto its rim as it writes, and the cup rocks back when it
 *   lifts;
 * - the cup steams while on screen; the steam streams with the scroll and curls back when it stops; a
 *   hard fling pulls the cup onto its rim toward the card; the clover behind it slowly turns.
 * Rows are read with ScrollTrigger only; nothing is pinned (the cup is CSS sticky).
 */
export function CoffeeMotion() {
  const mode = useMotionMode();

  useGSAP(
    () => {
      const root = document.getElementById("kofe");
      // The store reports the server value during hydration; the head script's attribute already knows
      // better, so reduced-motion guests never see a build-and-revert flash.
      const reduced = mode === "reduced" || document.documentElement.dataset.motion === "reduced";
      if (!root || reduced) return;
      // Only what the guest hasn't reached yet gets an entrance: a block already on screen (a deep link,
      // a restored scroll) stays as rendered.
      const ahead = (el: Element | null, at: number): el is Element =>
        !!el && el.getBoundingClientRect().top > window.innerHeight * at;
      const stops: (() => void)[] = [];

      // ── The exchange. Whole lines only: the heading is server-rendered text React owns. ──
      const head = root.querySelector<HTMLElement>(".coffee__head");
      const ask = head?.querySelector<HTMLElement>("[data-dlg-q]");
      const answer = head?.querySelector<HTMLElement>("[data-dlg-a]");
      const lead = root.querySelector<HTMLElement>(".coffee__lead");
      if (head && answer && ahead(head, 0.85)) {
        const intro = gsap.timeline({ paused: true });
        if (ask) intro.from(ask, { opacity: 0, x: -18, duration: 0.6, ease: "kd.out", clearProps: "opacity,transform" }, 0);
        intro.fromTo(
          answer,
          { clipPath: "inset(-12% -4% 112% -4%)", yPercent: 22 },
          { clipPath: "inset(-12% -4% -12% -4%)", yPercent: 0, duration: 0.95, ease: "kd.settle", clearProps: "clipPath,transform" },
          0.12,
        );
        if (lead) intro.from(lead, { opacity: 0, y: 18, duration: 0.7, ease: "kd.out", clearProps: "opacity,transform" }, 0.55);
        stops.push(playWhenReached(intro, head, "top 85%"));
      }
      const links = root.querySelector(".coffee__links");
      if (ahead(links, 0.9)) {
        gsap.from(Array.from(links.children), {
          opacity: 0,
          y: 20,
          duration: 0.7,
          ease: "kd.out",
          stagger: 0.06,
          clearProps: "opacity,transform",
          scrollTrigger: { trigger: links, start: "top 90%", toggleActions: "play none none none" },
        });
      }

      // ── The cup and the barista ──
      const rows = gsap.utils.toArray<HTMLElement>("[data-cup-row]", root);
      const list = root.querySelector<HTMLElement>("[data-cup-list]");
      const markers = rows.map((r) => r.querySelector<SVGPathElement>("[data-marker]"));
      const col = root.querySelector<HTMLElement>(".coffee__cupcol");
      const badge = root.querySelector<HTMLElement>("[data-cup-badge]");

      // The cup lands once: a later matchMedia rebuild (a breakpoint change) keeps it in place.
      let landed: boolean | null = null;
      const mm = gsap.matchMedia();
      if (rows.length && list) {
        mm.add(
          // A phone condition is needed: with desk alone the callback would never run below 1024.
          { desk: "(min-width: 1024px)", phone: "(max-width: 1023.98px)", fine: "(hover: hover) and (pointer: fine)" },
          (ctx) => {
            const desk = Boolean(ctx.conditions?.desk);
            const fine = Boolean(ctx.conditions?.fine);
            const stage = desk ? col : badge;
            const rockEl = stage?.querySelector<HTMLElement>("[data-cup-rock]");
            if (!stage || !rockEl) return;
            const drop = stage.querySelector<HTMLElement>("[data-cup-drop]");
            const lift = stage.querySelector<SVGGElement>("[data-ground-lift]");
            landed ??= !ahead(stage, desk ? 0.8 : 0.88);

            // ── The cup's life: one body that rocks on its base, and the steam that streams with the scroll ──
            // It watches the scroll while the cup is on screen: the stuck column on desktop, the card the
            // band rides on for phones (both non-sticky parents).
            const steamSvg = desk ? stage.querySelector<SVGSVGElement>(".coffee__steam") : null;
            const steam = steamSvg ? steamLoop(steamSvg) : null;
            let inView = ScrollTrigger.isInViewport(stage);
            const airSteam = () => void steam?.paused(!(inView && landed));
            const life = cupLife({
              rock: rockEl,
              ground: stage.querySelector<SVGEllipseElement>("[data-ground]"),
              view: desk ? stage : root.querySelector(".coffee__menu"),
              steam: steamSvg,
              draught: desk,
              onView: (on) => {
                inView = on;
                airSteam();
              },
            });
            const cup = desk ? stage.querySelector<SVGSVGElement>(".coffee__cup") : null;
            const pen: Pen | null = desk ? (cup ? cupPen(cup, life) : null) : badgePen(stage, life);
            if (!pen) {
              life.kill();
              return;
            }
            const halo = desk ? stage.querySelector("[data-halo-turn]") : null;
            if (halo) turnHalo(halo, stage);

            // What the cup says: the pointed-at drink, else the keyboard's, else the one at the sleeve.
            let city: City = kd.get().city;
            let scrollIdx = -1;
            let pointerIdx: number | null = null;
            let focusIdx: number | null = null;
            let shownIdx = -1;
            let shownKey = key(DEFAULT_NOTE);
            let pending: gsap.core.Tween | null = null;
            const linesFor = (i: number): NoteLines => {
              const r = rows[i];
              if (!r?.dataset.ask) return DEFAULT_NOTE;
              return [r.dataset.ask, (city === "vladikavkaz" ? r.dataset.sayVladikavkaz : r.dataset.sayNalchik) ?? ""];
            };

            // ── The landing: the hand lowers the cup tipped onto its right rim while its shadow gathers on
            // the counter and the clover draws itself; it lets go, the cup rocks onto its base, and then
            // «как дела?» ──
            const enter = gsap.timeline({
              paused: true,
              onStart: () => void (landed = true),
              onComplete: airSteam,
            });
            let stopEnter = () => {};
            if (!landed) {
              const set = desk ? SET.desk : SET.phone;
              life.place("set", SET.tilt);
              if (drop) {
                enter.fromTo(drop, { yPercent: -set.rise }, { yPercent: 0, duration: set.down, ease: "power2.out" }, 0);
                enter.fromTo(drop, { opacity: 0 }, { opacity: 1, duration: 0.22, ease: "none" }, 0);
              }
              if (lift) {
                gsap.set(lift, { svgOrigin: `150 ${CUP.baseY + 6}` });
                enter.fromTo(lift, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: set.down, ease: "power2.out" }, 0);
              }
              enter.add(() => life.hold("set", 0), set.down);
              if (desk) {
                const hatch = stage.querySelectorAll("[data-hatch]");
                if (hatch.length) enter.from(hatch, { drawSVG: "0%", duration: 0.5, stagger: 0.022, ease: "kd.out" }, 0.15);
              }
              // The note once the cup has sat down (the rocking takes about half a second).
              enter.add(
                () => {
                  if (shownIdx === -1 && !pen.busy()) pen.write(DEFAULT_NOTE, true);
                },
                set.down + 0.5,
              );
              pen.blank();
              stopEnter = playWhenReached(enter, stage, desk ? "top 80%" : "top 88%");
            } else {
              airSteam();
            }

            // ── Writing: the last request wins, nothing queues ──
            const mark = (i: number) => {
              rows.forEach((r, j) => r.toggleAttribute("data-current", j === i));
              const m = markers[i];
              if (desk && m) gsap.fromTo(m, { drawSVG: "0% 0%" }, { drawSVG: "0% 100%", duration: 0.45, ease: "kd.out", overwrite: true });
            };
            const flush = () => {
              const byScroll = pointerIdx === null && focusIdx === null;
              // A fast scroll past several drinks writes none of them: the barista waits for the page to
              // slow, and writes the drink it slows on.
              if (byScroll && Math.abs(life.speed()) > HURRY) {
                request(0.1);
                return;
              }
              const i = pointerIdx ?? focusIdx ?? scrollIdx;
              const lines = linesFor(i);
              const k = key(lines);
              // A city switch that leaves the words as they were changes nothing.
              if (i === shownIdx && k === shownKey) return;
              if (i !== shownIdx) mark(i);
              shownIdx = i;
              shownKey = k;
              if (!landed || enter.isActive()) enter.progress(1);
              landed = true;
              pen.write(lines);
            };
            const request = (delay: number) => {
              pending?.kill();
              pending = gsap.delayedCall(delay, flush);
            };

            // ── The scroll: a drink is at the cup when its centre crosses the line the note sits on ──
            // On desktop that is the stuck cup's sleeve, measured from the layout (the cup's size and the
            // sticky top follow the viewport, so it is re-read on every refresh); on phones the band is up
            // top, so the reading line is 60%. The last drink must be written while the cup is still on
            // screen: its start never falls later than the moment the section's bottom meets the
            // viewport's. Each row ends exactly where the next starts.
            const go = (i: number) => {
              scrollIdx = i;
              request(0.06);
            };
            const sticky = stage.querySelector<HTMLElement>(".coffee__sticky");
            const cupWrap = stage.querySelector<HTMLElement>(".coffee__cupwrap");
            const readingLine = () => {
              if (!desk || !sticky || !cupWrap) return window.innerHeight * 0.6;
              const top = parseFloat(getComputedStyle(sticky).top);
              // The wrap itself never moves (the landing and the rocking are on layers inside it).
              const sleeve = (Number.isFinite(top) ? top : 0) + cupWrap.offsetTop + cupWrap.offsetHeight * (NOTE.cy / CUP.h);
              return gsap.utils.clamp(0.3, 0.85, sleeve / window.innerHeight) * window.innerHeight;
            };
            const startOf = (i: number): number => {
              const r = rows[i].getBoundingClientRect();
              // Drinks side by side (the two-column board) share a line of the card: each takes its own
              // slice of it, left to right, so the notes still come one at a time and in menu order.
              const band = rows.filter((o) => Math.abs(o.getBoundingClientRect().top - r.top) < 2);
              const k = Math.max(0, band.indexOf(rows[i]));
              const y = r.top + window.scrollY + (r.height * (k + 0.5)) / band.length - readingLine();
              if (i < rows.length - 1) return y;
              const sectionEnd = root.getBoundingClientRect().bottom + window.scrollY - window.innerHeight - 2;
              return Math.max(Math.min(y, sectionEnd), i > 0 ? startOf(i - 1) + 1 : 0);
            };
            const rowTriggers = rows.map((row, i) => {
              const last = i === rows.length - 1;
              return ScrollTrigger.create({
                trigger: row,
                start: () => startOf(i),
                end: () => (last ? startOf(i) + row.offsetHeight + window.innerHeight : startOf(i + 1)),
                onToggle: (self) => {
                  if (self.isActive) go(i);
                },
                onLeaveBack: i === 0 ? () => go(-1) : undefined,
              });
            });
            // After a rebuild or a refresh, write the drink the guest is on.
            const syncRows = () => {
              const y = rowTriggers[0]?.scroll() ?? 0;
              let at = -1;
              rowTriggers.forEach((st, i) => {
                if (y >= st.start) at = i;
              });
              if (at !== scrollIdx) go(at);
            };
            ScrollTrigger.addEventListener("refresh", syncRows);
            const firstSync = gsap.delayedCall(0.1, syncRows);

            // ── Pointing and tabbing ──
            // Scrolling hands the cup back to the drink at the sleeve: a pointer resting on the card while
            // the page moves under it never steers the cup.
            let scrolling = false;
            const calm = gsap.delayedCall(0.2, () => void (scrolling = false)).pause();
            ScrollTrigger.create({
              trigger: root,
              start: "top bottom",
              end: "bottom top",
              onUpdate: () => {
                scrolling = true;
                calm.restart(true);
                if (pointerIdx !== null) {
                  pointerIdx = null;
                  request(0.06);
                }
              },
            });
            const rowOf = (el: EventTarget | null) => {
              const row = el instanceof Element ? el.closest<HTMLElement>("[data-cup-row]") : null;
              return row ? rows.indexOf(row) : -1;
            };
            const onMove = (e: PointerEvent) => {
              // Touch never points; after a scroll, a still mouse gets synthetic moves with no movement.
              if (e.pointerType === "touch" || scrolling || (!e.movementX && !e.movementY)) return;
              const i = rowOf(e.target);
              if (i < 0 || i === pointerIdx) return;
              pointerIdx = i;
              // Sweeping across the card writes only the drink the pointer settles on.
              request(0.14);
            };
            const onLeave = () => {
              if (pointerIdx === null) return;
              pointerIdx = null;
              request(0.14);
            };
            const onFocusIn = (e: FocusEvent) => {
              const el = e.target;
              if (!(el instanceof Element) || !el.matches(":focus-visible")) return;
              const i = rowOf(el);
              if (i < 0 || i === focusIdx) return;
              focusIdx = i;
              request(0.06);
            };
            const onFocusOut = (e: FocusEvent) => {
              if (e.relatedTarget instanceof Node && list.contains(e.relatedTarget)) return;
              if (focusIdx === null) return;
              focusIdx = null;
              request(0.06);
            };
            if (fine) {
              list.addEventListener("pointermove", onMove, { passive: true });
              list.addEventListener("pointerleave", onLeave);
            }
            list.addEventListener("focusin", onFocusIn);
            list.addEventListener("focusout", onFocusOut);

            // A city switch rewrites the note if its price changes.
            const unsubscribe = kd.subscribe(() => {
              const c = kd.get().city;
              if (c === city) return;
              city = c;
              request(0.06);
            });
            // The barista's hand arrives late (not preloaded): a refresh (Providers fires one when fonts
            // finish loading) re-measures the note on the sleeve.
            const relayout = () => {
              if (landed && !enter.isActive() && !pen.busy()) pen.settle(linesFor(shownIdx));
            };
            ScrollTrigger.addEventListener("refresh", relayout);

            // The entrance, the steam and the triggers belong to this context and are reverted with it.
            // The writes, the marker strokes and the cup's life were started from callbacks or run from
            // the ticker, so they are stopped here by hand.
            return () => {
              pending?.kill();
              pen.reset();
              life.kill();
              firstSync.kill();
              stopEnter();
              unsubscribe();
              ScrollTrigger.removeEventListener("refresh", syncRows);
              ScrollTrigger.removeEventListener("refresh", relayout);
              list.removeEventListener("pointermove", onMove);
              list.removeEventListener("pointerleave", onLeave);
              list.removeEventListener("focusin", onFocusIn);
              list.removeEventListener("focusout", onFocusOut);
              for (const m of markers) {
                if (!m) continue;
                gsap.killTweensOf(m);
                m.style.removeProperty("stroke-dasharray");
                m.style.removeProperty("stroke-dashoffset");
              }
              rows.forEach((r) => r.removeAttribute("data-current"));
            };
          },
        );
      }

      return () => {
        stops.forEach((stop) => stop());
        mm.revert();
      };
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
