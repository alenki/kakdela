import type Lenis from "lenis";
import { gsap } from "@/lib/gsap";

/** px of air kept under the header and over the fold when a landing is brought into view. */
const LAND_GAP = 16;

/**
 * Brings the landing into view: the note's top under the header and, where the screen has room, the
 * café's reply above the fold (`end`). On a phone the café's side sits under the pad; on a desktop it is
 * sticky, but a guest who sends from high up the page may not have it all in view yet. The flight
 * follows the note while the page moves, so this runs with it.
 */
export function bringIntoView(note: HTMLElement, end: HTMLElement | null, smooth: boolean) {
  const r = note.getBoundingClientRect();
  const e = end?.getBoundingClientRect() ?? r;
  const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 56;
  const top = header + LAND_GAP;
  const bottom = window.innerHeight - LAND_GAP;
  let delta = 0;
  if (r.top < top) delta = r.top - top;
  else if (e.bottom > bottom) delta = Math.min(e.bottom - bottom, r.top - top);
  if (Math.abs(delta) < 4) return;
  const y = window.scrollY + delta;
  const lenis = (window as unknown as { __lenis?: Lenis }).__lenis;
  if (lenis && smooth) lenis.scrollTo(y, { duration: 0.9 });
  else window.scrollTo({ top: y, behavior: smooth ? "smooth" : "auto" });
}

type Flight = {
  /** Where the filled sheet was on screen when it was sent. */
  from: DOMRect;
  /** The note on the café's side, already laid out in its place (and hidden while it flies). */
  note: HTMLElement;
  /** The pad: it gives a little as the sheet comes away, as the hero's notice does. */
  pad: HTMLElement | null;
  onLand: () => void;
};

/**
 * The note is torn off the pad and laid on the café's side: the hero's tear, carried across the page.
 * A copy of the landed note starts exactly over the sheet the guest filled in (same proportions, scaled
 * to its width), comes away from the stub with its right corner first, is carried over in an arc,
 * turning a little in the air, and lands as the hero's tab does (from 26px up and 5% larger, kd.settle).
 * It follows the note's live position, so a scroll on the way (phones) never loses it. Then the real
 * note shows and the copy goes. Returns a cleanup that finishes it at once.
 */
export function flyNote({ from, note, pad, onLand }: Flight): () => void {
  const lean = parseFloat(note.style.getPropertyValue("--lean")) || 0;
  // The copy is laid out at the sheet's own width, where it is the sheet (everything on it is sized in
  // its cqi), and only ever scaled down on the way: text scaled up would come out soft.
  const k = note.offsetWidth / Math.max(1, from.width);

  // The copy: no ids (they would repeat), nothing to read or tab to.
  const layer = document.createElement("div");
  layer.className = "fb-flight";
  layer.setAttribute("aria-hidden", "true");
  const copy = note.cloneNode(true) as HTMLElement;
  copy.removeAttribute("data-flying");
  copy.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
  copy.style.width = `${from.width}px`;
  layer.appendChild(copy);
  document.body.appendChild(layer);

  const at = { rip: 0, p: 0, q: 0 };
  const start = note.getBoundingClientRect();
  const dist = Math.hypot(start.left - from.left, start.top - from.top);
  const arc = Math.min(110, 30 + dist * 0.14);
  const place = () => {
    const r = note.getBoundingClientRect();
    const { rip, p, q } = at;
    const x0 = from.left;
    const y0 = from.top - 10 * rip;
    const x1 = r.left;
    const y1 = r.top - 26 * (1 - q);
    gsap.set(copy, {
      x: x0 + (x1 - x0) * p,
      y: y0 + (y1 - y0) * p - Math.sin(Math.PI * p) * arc,
      scale: 1 + (1.05 * k - 1) * p - 0.05 * k * q,
      // Straight on the pad (the landed note keeps its own lean inside), a pull to the left as it rips,
      // a turn in the air, then down level.
      rotation: (-lean - 2.2 * rip) * (1 - p) - Math.sin(Math.PI * p) * 3.5,
      rotationX: Math.sin(p * Math.PI * 3) * 11 * (1 - p),
      "--air": Math.max(0, Math.min(1, rip * (1 - q))),
    });
  };
  gsap.set(copy, { transformOrigin: "0% 0%", transformPerspective: 900 });
  place();

  if (pad) gsap.fromTo(pad, { x: -1.5 }, { x: 0, duration: 0.08, repeat: 1, yoyo: true, clearProps: "x" });
  const tl = gsap
    .timeline({
      onUpdate: place,
      onComplete: () => {
        layer.remove();
        onLand();
      },
    })
    .to(at, { rip: 1, duration: 0.24, ease: "kd.peel" })
    .to(at, { p: 1, duration: 0.82, ease: "kd.inOut" })
    .to(at, { q: 1, duration: 0.55, ease: "kd.settle" });

  return () => {
    if (tl.progress() < 1) tl.progress(1);
    tl.kill();
    layer.remove();
  };
}

/** How long a flight takes, for what waits for its landing (the café's reply rises after it). */
export const FLIGHT_S = 0.24 + 0.82 + 0.3;
