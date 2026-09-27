"use client";

import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";
import { t } from "@/i18n";
import { NOTE, splitNote } from "./NoteSvg";

type Pen = {
  /** Wipe the current note out (unless `fresh`) and hand-write `note`, then squash the cup. */
  write: (note: string, fresh?: boolean) => gsap.core.Timeline;
  /** Hide the note so an entrance can write it in. */
  blank: () => void;
  /** Back to the server state: the default note, clips wide open. */
  reset: () => void;
};

const setAttrs = (el: Element, a: Record<string, string | number>) => {
  for (const k in a) el.setAttribute(k, String(a[k]));
};
const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Swap words without replacing React's own text node (React keeps a reference to it; replacing it
 * would break a later reconcile). Elements React rendered empty get a node of our own.
 */
function setText(el: Element, value: string) {
  const first = el.firstChild;
  if (first && first.nodeType === Node.TEXT_NODE && !first.nextSibling) first.nodeValue = value;
  else el.textContent = value;
}

function squash(tl: gsap.core.Timeline, body: Element) {
  tl.fromTo(
    body,
    { scaleY: 0.985 },
    { scaleY: 1, duration: 0.3, ease: "kd.settle", transformOrigin: "50% 100%", immediateRender: false },
  );
}

/**
 * Play a paused entrance when its trigger is reached. ScrollTrigger does not fire onEnter for a start
 * that was already passed when the trigger was built (a matchMedia rebuild after a breakpoint change,
 * a restored scroll position), so every refresh also catches up — content never stays hidden.
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

/** The big cup: the note is SVG <text> on the sleeve, clipped by per-line rects that sweep like a pen. */
function cupPen(svg: SVGSVGElement): Pen | null {
  const q = <T extends Element>(s: string) => svg.querySelector<T>(s);
  const wipe = q<SVGRectElement>("[data-note-wipe]");
  const c1 = q<SVGRectElement>("[data-note-r1]");
  const c2 = q<SVGRectElement>("[data-note-r2]");
  const l1 = q<SVGTextElement>("[data-note-l1]");
  const l2 = q<SVGTextElement>("[data-note-l2]");
  const arrow = q<SVGPathElement>("[data-note-arrow]");
  const body = q<SVGGElement>("[data-cup-body]");
  if (!wipe || !c1 || !c2 || !l1 || !l2 || !arrow || !body) return null;

  /** Swap the words, measure them, park both line clips at zero width. Returns the sweep widths. */
  const layout = (question: string, answer: string) => {
    setText(l1, question);
    setText(l2, answer);
    if (!answer) {
      setAttrs(l1, { y: NOTE.single.y, "font-size": NOTE.single.size });
      const w = l1.getComputedTextLength();
      setAttrs(c1, { x: r1(NOTE.cx - w / 2 - 4), y: NOTE.single.clipY, height: NOTE.single.clipH, width: 0 });
      setAttrs(c2, { width: 0 });
      arrow.setAttribute("visibility", "hidden");
      return { w1: w + 8, w2: 0 };
    }
    setAttrs(l1, { y: NOTE.first.y, "font-size": NOTE.first.size });
    let w1 = l1.getComputedTextLength();
    if (w1 > NOTE.maxWidth) {
      l1.setAttribute("font-size", String(r1((NOTE.first.size * NOTE.maxWidth) / w1)));
      w1 = l1.getComputedTextLength();
    }
    setAttrs(c1, { x: r1(NOTE.cx - w1 / 2 - 4), y: NOTE.first.clipY, height: NOTE.first.clipH, width: 0 });

    const room = NOTE.maxWidth - NOTE.arrow.w - NOTE.arrow.gap;
    setAttrs(l2, { "font-size": NOTE.second.size, "text-anchor": "start" });
    let w2 = l2.getComputedTextLength();
    if (w2 > room) {
      l2.setAttribute("font-size", String(r1((NOTE.second.size * room) / w2)));
      w2 = l2.getComputedTextLength();
    }
    const total = NOTE.arrow.w + NOTE.arrow.gap + w2;
    const x0 = NOTE.cx - total / 2;
    setAttrs(arrow, { transform: `translate(${r1(x0)} ${NOTE.second.y - 6})`, visibility: "visible" });
    setAttrs(l2, { x: r1(x0 + NOTE.arrow.w + NOTE.arrow.gap), y: NOTE.second.y });
    setAttrs(c2, { x: r1(x0 - 4), y: NOTE.second.clipY, height: NOTE.second.clipH, width: 0 });
    return { w1: w1 + 8, w2: total + 8 };
  };

  return {
    write(note, fresh = false) {
      const [question, answer] = splitNote(note);
      let geo = { w1: 0, w2: 0 };
      const tl = gsap.timeline();
      if (!fresh) tl.to(wipe, { attr: { width: 0 }, duration: 0.25, ease: "kd.peel" });
      tl.add(() => {
        geo = layout(question, answer);
        wipe.setAttribute("width", String(NOTE.wipeW));
      });
      // Handwriting: the question, then «→ drink price», left to right at pen speed.
      tl.to(c1, { attr: { width: () => geo.w1 }, duration: answer ? 0.22 : 0.55, ease: "none" });
      if (answer) tl.to(c2, { attr: { width: () => geo.w2 }, duration: 0.33, ease: "none" });
      squash(tl, body);
      return tl;
    },
    blank() {
      setAttrs(c1, { width: 0 });
      setAttrs(c2, { width: 0 });
    },
    reset() {
      gsap.killTweensOf([wipe, c1, c2, body]);
      setText(l1, t.coffee.defaultNote);
      setText(l2, "");
      setAttrs(l1, { y: NOTE.single.y, "font-size": NOTE.single.size });
      setAttrs(l2, { x: NOTE.cx, y: NOTE.second.y, "font-size": NOTE.second.size });
      l2.removeAttribute("text-anchor");
      setAttrs(c1, { x: NOTE.rest.x, y: NOTE.single.clipY, width: NOTE.rest.w, height: NOTE.single.clipH });
      setAttrs(c2, { x: NOTE.rest.x, y: NOTE.second.clipY, width: NOTE.rest.w, height: NOTE.second.clipH });
      setAttrs(arrow, { visibility: "hidden" });
      arrow.removeAttribute("transform");
      wipe.setAttribute("width", String(NOTE.wipeW));
      gsap.set(body, { clearProps: "transform" });
      body.removeAttribute("transform");
      body.removeAttribute("data-svg-origin");
    },
  };
}

/** The mobile badge: the note is HTML beside a small cup whose sleeve carries a scribble. */
function badgePen(badge: HTMLElement): Pen | null {
  const l1 = badge.querySelector<HTMLElement>("[data-bn-l1]");
  const l2 = badge.querySelector<HTMLElement>("[data-bn-l2]");
  const l2t = badge.querySelector<HTMLElement>("[data-bn-l2t]");
  const wipe = badge.querySelector<SVGRectElement>("[data-note-wipe]");
  const body = badge.querySelector<SVGGElement>("[data-cup-body]");
  if (!l1 || !l2 || !l2t || !wipe || !body) return null;
  const HIDE = "inset(0% 100% 0% 0%)";
  const SHOW = "inset(0% 0% 0% 0%)";

  return {
    write(note, fresh = false) {
      const [question, answer] = splitNote(note);
      const tl = gsap.timeline();
      if (!fresh) {
        tl.to([l1, l2], { clipPath: HIDE, duration: 0.25, ease: "kd.peel" }, 0);
        tl.to(wipe, { attr: { width: 0 }, duration: 0.25, ease: "kd.peel" }, 0);
      }
      tl.add(() => {
        setText(l1, question);
        setText(l2t, answer);
        l2.hidden = !answer;
        gsap.set([l1, l2], { clipPath: HIDE });
        wipe.setAttribute("width", "0");
      });
      tl.addLabel("ink");
      tl.to(l1, { clipPath: SHOW, duration: answer ? 0.22 : 0.55, ease: "none" }, "ink");
      if (answer) tl.to(l2, { clipPath: SHOW, duration: 0.33, ease: "none" });
      tl.to(wipe, { attr: { width: NOTE.wipeW }, duration: 0.55, ease: "none" }, "ink");
      squash(tl, body);
      tl.set([l1, l2], { clearProps: "clipPath" });
      return tl;
    },
    blank() {
      gsap.set([l1, l2], { clipPath: HIDE });
      wipe.setAttribute("width", "0");
    },
    reset() {
      gsap.killTweensOf([l1, l2, wipe, body]);
      setText(l1, t.coffee.defaultNote);
      setText(l2t, "");
      l2.hidden = true;
      gsap.set([l1, l2], { clearProps: "clipPath" });
      wipe.setAttribute("width", String(NOTE.wipeW));
      gsap.set(body, { clearProps: "transform" });
      body.removeAttribute("transform");
      body.removeAttribute("data-svg-origin");
    },
  };
}

/**
 * Rewrites the barista's note as each signature drink passes the cup (desktop: the tall sticky
 * cup; phones: the small sticky badge). Rows are read with ScrollTrigger only; nothing is pinned.
 * Reduced motion: nothing runs, the cup keeps «как дела?» and every row shows its own note.
 */
export function CupNote() {
  const mode = useMotionMode();

  useGSAP(
    () => {
      const root = document.getElementById("kofe");
      // The store reports the server value ("full") during hydration; the head script's attribute
      // already knows better, so reduced-motion guests never see a build-and-revert flash.
      const reduced = mode === "reduced" || document.documentElement.dataset.motion === "reduced";
      if (!root || reduced) return;
      const rows = gsap.utils.toArray<HTMLElement>("[data-cup-row]", root);
      const notes = rows.map((r) => r.dataset.note || t.coffee.defaultNote);

      // ── The exchange lands: the question asks, the answer settles in heavy, the café replies ──
      // Whole-line moves only: the heading is server-rendered text React owns, so it is never split.
      const head = root.querySelector<HTMLElement>(".coffee__head");
      const answer = head?.querySelector<HTMLElement>("[data-dlg-a]");
      const question = head?.querySelector<HTMLElement>("[data-dlg-q]");
      const dash = answer?.querySelector<HTMLElement>(".dash");
      const lead = root.querySelector<HTMLElement>(".coffee__lead");
      let stopIntro: (() => void) | null = null;
      if (head && answer && question) {
        const intro = gsap.timeline({ paused: true });
        intro
          .from(question, { opacity: 0, x: -18, duration: 0.6, ease: "kd.out" }, 0)
          .fromTo(
            answer,
            { clipPath: "inset(-12% -4% 112% -4%)", yPercent: 22 },
            { clipPath: "inset(-12% -4% -12% -4%)", yPercent: 0, duration: 0.95, ease: "kd.settle", clearProps: "clipPath,transform" },
            0.12,
          );
        if (dash) intro.from(dash, { scaleX: 0, transformOrigin: "0% 50%", duration: 0.5, ease: "kd.out", clearProps: "all" }, 0.3);
        if (lead) intro.from(lead, { opacity: 0, y: 18, duration: 0.7, ease: "kd.out" }, 0.55);
        stopIntro = playWhenReached(intro, head, "top 85%");
      }

      // The cup lands once. A later matchMedia rebuild (breakpoint change) keeps it in place.
      let landed = false;
      const mm = gsap.matchMedia();
      mm.add({ desk: "(min-width: 1024px)", phone: "(max-width: 1023.98px)" }, (ctx) => {
        const desk = Boolean(ctx.conditions?.desk);
        const badge = root.querySelector<HTMLElement>("[data-cup-badge]");
        const cup = root.querySelector<SVGSVGElement>(".coffee__cup");
        const pen = desk ? (cup ? cupPen(cup) : null) : badge ? badgePen(badge) : null;
        if (!pen) return;

        let current = -1;
        let writing: gsap.core.Timeline | null = null;
        let pending: gsap.core.Tween | null = null;

        // ── Entrance: the cup lands, then the barista writes «как дела?» ──
        const enter = gsap.timeline({ paused: true, onStart: () => void (landed = true) });
        let stopEnter = () => {};
        if (!landed) {
          if (desk) {
            const wrap = root.querySelector<HTMLElement>("[data-cup-enter]");
            const hatch = root.querySelectorAll<SVGPathElement>("[data-cup-halo] [data-hatch]");
            if (wrap) enter.from(wrap, { yPercent: 12, rotation: -8, opacity: 0, duration: 1, ease: "kd.settle", transformOrigin: "50% 100%" }, 0);
            if (hatch.length) enter.from(hatch, { drawSVG: "0%", duration: 0.5, stagger: 0.022, ease: "kd.out" }, 0.15);
          } else if (badge) {
            const cupEl = badge.querySelector("svg");
            if (cupEl) enter.from(cupEl, { y: 18, rotation: -10, opacity: 0, duration: 0.8, ease: "kd.settle", transformOrigin: "50% 100%" }, 0);
          }
          enter.add(() => {
            if (current === -1 && !writing?.isActive()) writing = pen.write(t.coffee.defaultNote, true);
          }, desk ? 0.7 : 0.45);
          pen.blank();
          stopEnter = playWhenReached(enter, desk ? root.querySelector(".coffee__cupcol") : badge, desk ? "top 80%" : "top 88%");
        }

        // ── Each drink that passes the cup rewrites the note (last one wins, nothing queues) ──
        const flush = (i: number) => {
          if (i === current) return;
          current = i;
          rows.forEach((r, j) => r.toggleAttribute("data-current", j === i));
          if (!landed || enter.isActive()) enter.progress(1);
          landed = true;
          writing?.progress(1);
          writing = pen.write(i < 0 ? t.coffee.defaultNote : notes[i]);
        };
        const go = (i: number) => {
          pending?.kill();
          pending = gsap.delayedCall(0.06, () => flush(i));
        };
        // A row is "at the cup" when its centre crosses the line the note sits on. On desktop that
        // is the sleeve of the stuck cup, measured from the layout (the cup's size and the sticky
        // top follow the viewport, so it is re-read on every refresh); on phones the badge is up
        // top, so the reading line is 60%. The last drink must also be written while the cup is
        // still on screen, so its start never falls later than the moment the section's bottom
        // meets the viewport's. Each row ends exactly where the next starts.
        const sticky = root.querySelector<HTMLElement>(".coffee__sticky");
        const cupWrap = root.querySelector<HTMLElement>("[data-cup-enter]");
        const readingLine = () => {
          if (!desk || !sticky || !cupWrap) return window.innerHeight * 0.6;
          const top = parseFloat(getComputedStyle(sticky).top);
          // offsetTop/offsetHeight ignore the entrance transform; the sleeve's centre is y 319 of 460.
          const sleeve = (Number.isFinite(top) ? top : 0) + cupWrap.offsetTop + cupWrap.offsetHeight * (NOTE.cy / 460);
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
        // Same catch-up for the rows: after a rebuild or refresh, write the drink the reader is on.
        const syncRows = () => {
          const y = rowTriggers[0]?.scroll() ?? 0;
          let at = -1;
          rowTriggers.forEach((st, i) => {
            if (y >= st.start) at = i;
          });
          if (at !== current) go(at);
        };
        ScrollTrigger.addEventListener("refresh", syncRows);
        const firstSync = gsap.delayedCall(0.1, syncRows);

        // The entrance and triggers belong to this matchMedia context and are reverted with it;
        // the rewrites were started from scroll callbacks, so they are stopped here by hand.
        return () => {
          pending?.kill();
          writing?.kill();
          firstSync.kill();
          stopEnter();
          ScrollTrigger.removeEventListener("refresh", syncRows);
          rows.forEach((r) => r.removeAttribute("data-current"));
          pen.reset();
        };
      });

      return () => {
        stopIntro?.();
        mm.revert();
      };
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
