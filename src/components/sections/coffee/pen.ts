"use client";

import { gsap } from "@/lib/gsap";
import { hashString } from "@/lib/seed";
import { t } from "@/i18n";
import type { CupLife } from "./cup-life";
import { NOTE, noteSlant, penStroke, type LineBox, type NoteLines, type PenStroke } from "./note";

/** The barista's pen on one cup: the big cup's sleeve (desktop) or the phones' band. */
export type Pen = {
  /**
   * Rub out what is on the cup (unless `fresh`) and hand-write `lines`. The pen drags the cup onto its
   * right rim while it works and lets go when it lifts, so the cup rocks back onto its base. The last call
   * wins: a note half written or half rubbed out is rubbed out from where it got to.
   */
  write: (lines: NoteLines, fresh?: boolean) => void;
  /** Writing or rubbing out. */
  busy: () => boolean;
  /** Hide the note, so an entrance can write it in. */
  blank: () => void;
  /** Re-measure and show `lines` in full at once (after a font swap changed the text's width). */
  settle: (lines: NoteLines) => void;
  /** Back to the server state: the default note in full, nothing running. */
  reset: () => void;
};

/** «как дела?», one line. */
export const DEFAULT_NOTE: NoteLines = [t.coffee.defaultNote, ""];

/** How far the pen drags the cup onto its right rim while it writes, degrees. */
const LEAN = 1.1;
/** Rubbing out: quick, and quicker toward the end, like a thumb. */
const RUB = { duration: 0.24, ease: "power2.in", stagger: 0.05 } as const;
/** Pen speed, in the note's units a second: a steady hand (the wave of the stroke is its rhythm). */
const SPEED = 300;
const INK = "none";
const inkTime = (w: number) => 0.1 + w / SPEED;

const setAttrs = (el: Element, a: Record<string, string | number>) => {
  for (const k in a) el.setAttribute(k, String(a[k]));
};
const r1 = (n: number) => Math.round(n * 10) / 10;

/**
 * Swap words without replacing React's own text node (React keeps a reference to it; replacing it
 * would break a later reconcile). Elements React rendered empty get a node of their own.
 */
function setText(el: Element, value: string) {
  const first = el.firstChild;
  if (first && first.nodeType === Node.TEXT_NODE && !first.nextSibling) first.nodeValue = value;
  else el.textContent = value;
}

/** Where everything goes for one note on the big cup's sleeve, measured before it goes up. */
type Plan = {
  lines: NoteLines;
  l1: { y: number; size: number };
  l2: { x: number; y: number; size: number } | null;
  /** The arrow's place, or null for a one-line note. */
  arrow: string | null;
  root: string;
  nib1: PenStroke & { w: number };
  nib2: (PenStroke & { w: number }) | null;
};

/**
 * The big cup: the note is SVG <text> on the sleeve, each line masked by the pen's stroke (NoteSvg), so
 * drawing the stroke in inks the line in and drawing it out rubs it out. The arrow is a stroke of its own.
 */
export function cupPen(svg: SVGSVGElement, life: CupLife | null): Pen | null {
  const q = <T extends Element>(s: string) => svg.querySelector<T>(s);
  const root = q<SVGGElement>("[data-note-root]");
  const l1 = q<SVGTextElement>("[data-note-l1]");
  const l2 = q<SVGTextElement>("[data-note-l2]");
  const arrow = q<SVGPathElement>("[data-note-arrow]");
  const opens = Array.from(svg.querySelectorAll<SVGRectElement>("[data-note-open]"));
  const [pen1, pen2] = Array.from(svg.querySelectorAll<SVGPathElement>("[data-note-pen]"));
  if (!root || !l1 || !l2 || !arrow || opens.length !== 2 || !pen1 || !pen2) return null;
  const strokes = [pen1, pen2, arrow];
  /** What is on the cup (null: the server's note, never measured), whether it is up in full, the pen at work. */
  let shown: Plan | null = null;
  let open = true;
  let tl: gsap.core.Timeline | null = null;

  // A hidden line to measure words with before they go up: the old note stays on the cup while it is
  // rubbed out. It sits in the note's own units and takes the note's hand from the CSS.
  const probe = document.createElementNS("http://www.w3.org/2000/svg", "text");
  probe.setAttribute("visibility", "hidden");
  root.append(probe);
  const measure = (s: string, size: number, x: number, y: number, anchor: "middle" | "start") => {
    setAttrs(probe, { x, y, "font-size": size, "text-anchor": anchor });
    setText(probe, s);
    const b = probe.getBBox();
    const box: LineBox = { x: b.x, y: b.y, width: b.width, height: b.height };
    return { w: probe.getComputedTextLength(), box };
  };
  /** Measure at `size`, shrunk to fit `room` if the words run wider. */
  const fit = (s: string, size: number, room: number, x: number, y: number, anchor: "middle" | "start") => {
    const m = measure(s, size, x, y, anchor);
    if (m.w <= room) return { size, ...m };
    const shrunk = r1((size * room) / m.w);
    return { size: shrunk, ...measure(s, shrunk, x, y, anchor) };
  };

  const plan = (lines: NoteLines): Plan => {
    const [question, answer] = lines;
    const seed = hashString(`${question}|${answer}`);
    const { rotate, dx } = noteSlant(lines);
    const rootT = `translate(${dx} 0) rotate(${rotate} ${NOTE.cx} ${NOTE.cy})`;
    if (!answer) {
      const m = fit(question, NOTE.single.size, NOTE.maxWidth, NOTE.cx, NOTE.single.y, "middle");
      return {
        lines,
        l1: { y: NOTE.single.y, size: m.size },
        l2: null,
        arrow: null,
        root: rootT,
        nib1: { ...penStroke(m.box, m.size, seed), w: m.w },
        nib2: null,
      };
    }
    const m1 = fit(question, NOTE.first.size, NOTE.maxWidth, NOTE.cx, NOTE.first.y, "middle");
    const room = NOTE.maxWidth - NOTE.arrow.w - NOTE.arrow.gap;
    const m2 = fit(answer, NOTE.second.size, room, 0, NOTE.second.y, "start");
    const lead = NOTE.arrow.w + NOTE.arrow.gap;
    const x0 = NOTE.cx - (lead + m2.w) / 2;
    const x2 = r1(x0 + lead);
    return {
      lines,
      l1: { y: NOTE.first.y, size: m1.size },
      l2: { x: x2, y: NOTE.second.y, size: m2.size },
      arrow: `translate(${r1(x0)} ${NOTE.second.y - 6})`,
      root: rootT,
      nib1: { ...penStroke(m1.box, m1.size, seed), w: m1.w },
      // The answer was measured at x 0; its pen runs from the arrow's tip over the words at their place.
      nib2: { ...penStroke({ ...m2.box, x: m2.box.x + x2 }, m2.size, seed + 1), w: m2.w },
    };
  };

  /**
   * Put a planned note on the cup: its words, their places, the slant, and the pen laid over each line.
   * The strokes stay as they were (the caller shows them when the pen comes down).
   */
  const apply = (p: Plan) => {
    const [question, answer] = p.lines;
    setText(l1, question);
    setText(l2, answer);
    setAttrs(l1, { y: p.l1.y, "font-size": p.l1.size });
    if (p.l2) setAttrs(l2, { x: p.l2.x, y: p.l2.y, "font-size": p.l2.size, "text-anchor": "start" });
    if (p.arrow) arrow.setAttribute("transform", p.arrow);
    root.setAttribute("transform", p.root);
    for (const [nib, s] of [
      [pen1, p.nib1],
      [pen2, p.nib2],
    ] as const) {
      if (s) setAttrs(nib, { d: s.d, "stroke-width": s.width });
      else nib.removeAttribute("d");
    }
  };

  /** The rects open the masks in full: a late font swap can never leave letters cut off. */
  const setOpen = (on: boolean) => {
    for (const r of opens) {
      if (on) r.removeAttribute("visibility");
      else r.setAttribute("visibility", "hidden");
    }
    open = on;
  };
  /** A stroke drawn out to nothing still shows its round cap: hide it until the pen comes down. */
  const lift = (els: Element[]) => els.forEach((el) => el.setAttribute("visibility", "hidden"));
  const touch = (el: Element) => el.setAttribute("visibility", "visible");
  /** Every stroke of a planned note drawn in full and showing (a note up in full, pen and all). */
  const drawn = (p: Plan) => {
    gsap.set(strokes, { drawSVG: "0% 100%" });
    lift(strokes);
    touch(pen1);
    if (p.nib2) touch(pen2);
    if (p.arrow) touch(arrow);
  };

  /** Rub out whatever is on the cup, from where it got to. */
  const rubOut = (w: gsap.core.Timeline) => {
    w.add(() => {
      if (!open) return;
      // The note is up in full: lay the pen over it as drawn (the server's note has none yet), then take
      // the rects away, so rubbing the pen out rubs the note out.
      shown ??= plan(DEFAULT_NOTE);
      apply(shown);
      drawn(shown);
      setOpen(false);
    });
    w.to([pen2, arrow, pen1], { drawSVG: "0% 0%", ...RUB });
    w.add(() => lift(strokes));
  };

  return {
    write(lines, fresh = false) {
      tl?.kill();
      const next = plan(lines);
      const w = gsap.timeline();
      w.add(() => life?.hold("pen", LEAN));
      if (!fresh) rubOut(w);
      w.add(() => {
        lift(strokes);
        setOpen(false);
        apply(next);
        shown = next;
        gsap.set(strokes, { drawSVG: "0% 0%" });
      });
      w.to(pen1, { drawSVG: "0% 100%", duration: inkTime(next.nib1.w), ease: INK, onStart: () => touch(pen1) });
      if (next.nib2) {
        // The pen lifts, draws the arrow, and writes the drink and its price.
        w.to(arrow, { drawSVG: "0% 100%", duration: 0.15, ease: INK, onStart: () => touch(arrow) }, "+=0.07");
        w.to(pen2, { drawSVG: "0% 100%", duration: inkTime(next.nib2.w), ease: INK, onStart: () => touch(pen2) }, "+=0.03");
      }
      w.add(() => {
        setOpen(true);
        life?.hold("pen", 0);
      });
      tl = w;
    },
    busy: () => !!tl?.isActive(),
    blank() {
      tl?.kill();
      lift(strokes);
      setOpen(false);
      life?.hold("pen", 0);
    },
    settle(lines) {
      const p = plan(lines);
      apply(p);
      shown = p;
      drawn(p);
      setOpen(true);
    },
    reset() {
      tl?.kill();
      probe.remove();
      setText(l1, t.coffee.defaultNote);
      setText(l2, "");
      setAttrs(l1, { y: NOTE.single.y, "font-size": NOTE.single.size });
      setAttrs(l2, { x: NOTE.cx, y: NOTE.second.y, "font-size": NOTE.second.size });
      l2.removeAttribute("text-anchor");
      root.setAttribute("transform", `rotate(${NOTE.rotate} ${NOTE.cx} ${NOTE.cy})`);
      arrow.removeAttribute("transform");
      arrow.setAttribute("visibility", "hidden");
      for (const nib of [pen1, pen2]) {
        nib.removeAttribute("d");
        nib.removeAttribute("stroke-width");
        nib.removeAttribute("visibility");
      }
      gsap.set(strokes, { clearProps: "strokeDasharray,strokeDashoffset" });
      setOpen(true);
      shown = null;
    },
  };
}

/**
 * The phones' band: the note is HTML beside a small cup. Each line inks in behind a soft pen edge (a
 * mask, CSS --ink 0 to 1), and the scribble on the small cup's sleeve is drawn in with it.
 */
export function badgePen(badge: HTMLElement, life: CupLife | null): Pen | null {
  const l1 = badge.querySelector<HTMLElement>("[data-bn-l1]");
  const l2 = badge.querySelector<HTMLElement>("[data-bn-l2]");
  const l2t = badge.querySelector<HTMLElement>("[data-bn-l2t]");
  const scribble = badge.querySelector<SVGPathElement>("[data-note-scribble]");
  if (!l1 || !l2 || !l2t || !scribble) return null;
  let tl: gsap.core.Timeline | null = null;

  return {
    write([question, answer], fresh = false) {
      tl?.kill();
      const w = gsap.timeline();
      w.add(() => life?.hold("pen", LEAN));
      if (!fresh) {
        w.to([l2, l1], { "--ink": 0, ...RUB }, 0);
        w.to(scribble, { drawSVG: "0% 0%", duration: RUB.duration + RUB.stagger, ease: RUB.ease }, 0);
      }
      w.add(() => {
        setText(l1, question);
        setText(l2t, answer);
        l2.hidden = !answer;
        gsap.set([l1, l2], { "--ink": 0 });
        gsap.set(scribble, { drawSVG: "0% 0%", visibility: "hidden" });
      });
      w.addLabel("ink");
      const first = answer ? 0.42 : 0.6;
      w.to(l1, { "--ink": 1, duration: first, ease: INK }, "ink");
      if (answer) w.to(l2, { "--ink": 1, duration: 0.5, ease: INK }, `ink+=${first + 0.08}`);
      w.to(
        scribble,
        { drawSVG: "0% 100%", duration: answer ? first + 0.58 : first, ease: INK, onStart: () => void gsap.set(scribble, { visibility: "visible" }) },
        "ink",
      );
      w.add(() => life?.hold("pen", 0));
      tl = w;
    },
    busy: () => !!tl?.isActive(),
    blank() {
      tl?.kill();
      gsap.set([l1, l2], { "--ink": 0 });
      gsap.set(scribble, { visibility: "hidden" });
      life?.hold("pen", 0);
    },
    // HTML text reflows by itself when the font arrives: nothing to measure.
    settle() {},
    reset() {
      tl?.kill();
      setText(l1, t.coffee.defaultNote);
      setText(l2t, "");
      l2.hidden = true;
      for (const el of [l1, l2]) el.style.removeProperty("--ink");
      gsap.set(scribble, { clearProps: "strokeDasharray,strokeDashoffset,visibility" });
    },
  };
}
