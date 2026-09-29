// The pour on the page: every .btn's liquid (src/lib/pour.ts) drawn as a clip-path on its .btn__pour,
// the layer that carries BtnLabel's copy of the label, so the words turn over exactly at the surface.
// The pointer's x goes with every hover, press and leave, so the stream lands by the wall the pointer
// came in at (the further in it came, the further in it lands) and a drain runs out by the one it left.
// Delegated from the document in the capture phase (a component that stops an event can't hide it),
// so a button rendered later (the runner's, the hero's reprint) needs nothing. One frame loop for all
// of them, and only while one is moving: at rest a pill is either empty (no inline clip, the
// stylesheet's) or brim-full (clip-path: none). This is the only writer of
// that inline clip-path; React never sets a style on .btn__pour, and nothing here touches a .btn's
// classes (React owns them: the runner swaps btn-primary).

import { pour, pourClip, pourTo, resizePour, settlePour, stepPour, surfaceBuffer, type Pour } from "@/lib/pour";

type Btn = {
  el: HTMLElement;
  sim: Pour;
  /** A mouse (or a hovering pen) over it; a press on it; keyboard focus on it. Any one pours. */
  hover: boolean;
  press: boolean;
  focus: boolean;
  /** The clip last written, so an unchanged frame writes nothing. */
  clip: string;
};

const btnOf = (t: EventTarget | null) => (t instanceof Element ? t.closest<HTMLElement>(".btn") : null);
const layerOf = (el: HTMLElement) => el.querySelector<HTMLElement>(":scope > .btn__pour");
/** A hover is a mouse, or a pen above the screen; a pen that lands arrives pressed, and touch never hovers. */
const hovers = (e: PointerEvent) => e.pointerType === "mouse" || (e.pointerType === "pen" && e.buttons === 0);
const pourable = (el: HTMLElement) => !el.matches(':disabled, [aria-disabled="true"]');

function focusVisible(el: HTMLElement) {
  try {
    return el.matches(":focus-visible");
  } catch {
    return false;
  }
}

/** Bind the pour to the page; returns the unbind (which hands the buttons back to the stylesheet). */
export function bindPour(): () => void {
  const root = document.documentElement;
  const forced = window.matchMedia("(forced-colors: active)");
  const btns = new WeakMap<HTMLElement, Btn>();
  const moving = new Set<Btn>();
  const buf = surfaceBuffer();
  let pressed: Btn | null = null;
  /** Pills found hovered when the pour was bound, until a pointer confirms or clears it. */
  const seeded = new Set<Btn>();
  /** Keyboard focus pours in at the end it came from: Tab walks a row left to right, Shift+Tab back. */
  let backwards = false;
  let frame = 0;
  let last = 0;

  const get = (el: HTMLElement) => {
    let b = btns.get(el);
    if (!b) {
      // Each pill rolls its own dice, so no two pills (and no two visits) pour alike.
      const seed = (Math.random() * 2 ** 32) >>> 0;
      b = { el, sim: pour(el.offsetWidth, el.offsetHeight, seed), hover: false, press: false, focus: false, clip: "empty" };
      btns.set(el, b);
    }
    return b;
  };

  // The pointer's x in the pill's own px (a pressed pill is scaled down).
  const localX = (b: Btn, clientX: number) => {
    const r = b.el.getBoundingClientRect();
    return r.width > 0 ? ((clientX - r.left) * b.el.offsetWidth) / r.width : b.el.offsetWidth / 2;
  };

  const paint = (b: Btn) => {
    const clip = pourClip(b.sim, buf);
    if (clip === b.clip) return;
    b.clip = clip;
    const layer = layerOf(b.el);
    if (!layer) return;
    if (clip === "empty") layer.style.removeProperty("clip-path");
    else layer.style.clipPath = clip === "full" ? "none" : clip;
  };

  const tick = (now: number) => {
    frame = 0;
    const dt = last ? (now - last) / 1000 : 1 / 60;
    last = now;
    // Measure every moving pill first, then write: no layout is forced between the writes.
    for (const b of moving) {
      if (b.el.isConnected) resizePour(b.sim, b.el.offsetWidth, b.el.offsetHeight);
    }
    for (const b of moving) {
      // Gone (a navigation, a re-render) or hidden: it rests empty.
      if (!b.el.isConnected || b.el.offsetWidth === 0) {
        settlePour(b.sim, false);
        paint(b);
        moving.delete(b);
        continue;
      }
      stepPour(b.sim, dt);
      paint(b);
      if (b.sim.still) moving.delete(b);
    }
    if (moving.size) frame = requestAnimationFrame(tick);
    else last = 0;
  };

  const update = (b: Btn, x?: number) => {
    const full = (b.hover || b.press || b.focus) && pourable(b.el);
    resizePour(b.sim, b.el.offsetWidth, b.el.offsetHeight);
    // Forced colours hide the liquid; keep its state right without animating it.
    if (forced.matches) settlePour(b.sim, full);
    else pourTo(b.sim, full, x);
    if (b.sim.still) {
      moving.delete(b);
      paint(b);
      return;
    }
    moving.add(b);
    if (!frame) frame = requestAnimationFrame(tick);
  };

  // A press whose release never came (a context menu took it, the window changed) is over once a mouse
  // moves with no button held.
  const staleRelease = (e: PointerEvent) => {
    if (pressed && e.pointerType === "mouse" && e.buttons === 0) onUp();
  };
  const onOver = (e: PointerEvent) => {
    staleRelease(e);
    const el = btnOf(e.target);
    if (!el || !hovers(e) || el.contains(e.relatedTarget as Node | null)) return;
    const b = get(el);
    if (b.hover) return;
    b.hover = true;
    update(b, localX(b, e.clientX));
  };
  const onOut = (e: PointerEvent) => {
    staleRelease(e);
    const el = btnOf(e.target);
    if (!el || e.pointerType === "touch" || el.contains(e.relatedTarget as Node | null)) return;
    const b = get(el);
    if (!b.hover) return;
    b.hover = false;
    update(b, localX(b, e.clientX));
  };
  // A press (the main button) counts as a hover: the pill sinking to 0.965 under a pointer near its
  // edge must not drain it.
  const onDown = (e: PointerEvent) => {
    if (e.pointerType === "touch") {
      dropSeeded();
      return;
    }
    const el = btnOf(e.target);
    if (!el || e.button !== 0) return;
    const b = get(el);
    if (pressed && pressed !== b) onUp();
    pressed = b;
    if (b.press) return;
    b.press = true;
    update(b, localX(b, e.clientX));
  };
  const onUp = () => {
    const b = pressed;
    pressed = null;
    if (!b || !b.press) return;
    b.press = false;
    update(b);
  };

  const focusSide = (b: Btn) => (backwards ? b.el.offsetWidth : 0);
  const onFocus = (e: FocusEvent) => {
    const el = btnOf(e.target);
    if (!el || el !== e.target) return;
    const b = get(el);
    const visible = focusVisible(el);
    if (b.focus === visible) return;
    b.focus = visible;
    update(b, focusSide(b));
  };
  const onBlur = (e: FocusEvent) => {
    const el = btnOf(e.target);
    if (!el || el !== e.target) return;
    // Another window took the focus: this one keeps it, and the pour stays.
    if (document.activeElement === el) return;
    const b = get(el);
    if (!b.focus) return;
    b.focus = false;
    update(b);
  };
  // A key on a button the mouse focused makes its focus visible without a focus event; the browser
  // decides that as it handles the key, so look once it has. Tab moves the focus instead (focusin).
  let keyCheck = 0;
  const checkKeyFocus = () => {
    keyCheck = 0;
    const el = btnOf(document.activeElement);
    if (!el || el !== document.activeElement || !focusVisible(el)) return;
    const b = get(el);
    if (b.focus) return;
    b.focus = true;
    update(b);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Tab") {
      backwards = e.shiftKey;
      return;
    }
    if (!keyCheck) keyCheck = window.setTimeout(checkKeyFocus, 0);
  };

  // A hidden tab runs no frames: every pour jumps to where it was heading.
  const onHide = () => {
    if (!document.hidden) return;
    for (const b of moving) {
      settlePour(b.sim, b.sim.full);
      paint(b);
    }
    moving.clear();
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
  };
  // Back from the bfcache: nothing is hovered or pressed any more; start every pill over.
  const onShow = (e: PageTransitionEvent) => {
    if (!e.persisted) return;
    moving.clear();
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
    pressed = null;
    for (const el of document.querySelectorAll<HTMLElement>(".btn")) {
      const b = btns.get(el);
      if (!b) continue;
      b.hover = false;
      b.press = false;
      b.focus = el === document.activeElement && focusVisible(el);
      settlePour(b.sim, b.focus && pourable(el));
      paint(b);
    }
  };

  const early = { capture: true, passive: true } as const;
  const dropSeeded = () => {
    for (const b of seeded) {
      if (!b.hover) continue;
      b.hover = false;
      update(b);
    }
    seeded.clear();
    document.removeEventListener("pointermove", onSeedMove, early);
  };
  function onSeedMove(e: PointerEvent) {
    if (!hovers(e)) return;
    for (const b of seeded) if (b.el.contains(e.target as Node | null)) seeded.delete(b);
    dropSeeded();
  }
  const onMenu = () => onUp();
  document.addEventListener("pointerover", onOver, early);
  document.addEventListener("pointerout", onOut, early);
  document.addEventListener("pointerdown", onDown, early);
  window.addEventListener("pointerup", onUp, early);
  window.addEventListener("pointercancel", onUp, early);
  document.addEventListener("focusin", onFocus, early);
  document.addEventListener("focusout", onBlur, early);
  document.addEventListener("keydown", onKey, early);
  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pageshow", onShow);
  window.addEventListener("blur", onMenu);
  document.addEventListener("contextmenu", onMenu, early);
  root.dataset.pour = "live";

  // A pill already under the pointer or the keyboard (motion turned back on mid-visit) starts full, as
  // the stylesheet had it (the same query). A touch screen keeps :hover on the last thing tapped, so a
  // hover found here is only taken on trust: the first touch, or a mouse moving anywhere else, drains it.
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  for (const el of document.querySelectorAll<HTMLElement>(".btn")) {
    const hover = fine && el.matches(":hover");
    const focus = el === document.activeElement && focusVisible(el);
    if ((!hover && !focus) || !pourable(el)) continue;
    const b = get(el);
    b.hover = hover;
    b.focus = focus;
    if (hover) seeded.add(b);
    settlePour(b.sim, true);
    paint(b);
  }
  if (seeded.size) document.addEventListener("pointermove", onSeedMove, early);

  return () => {
    cancelAnimationFrame(frame);
    window.clearTimeout(keyCheck);
    document.removeEventListener("pointerover", onOver, early);
    document.removeEventListener("pointerout", onOut, early);
    document.removeEventListener("pointerdown", onDown, early);
    window.removeEventListener("pointerup", onUp, early);
    window.removeEventListener("pointercancel", onUp, early);
    document.removeEventListener("focusin", onFocus, early);
    document.removeEventListener("focusout", onBlur, early);
    document.removeEventListener("keydown", onKey, early);
    document.removeEventListener("visibilitychange", onHide);
    window.removeEventListener("pageshow", onShow);
    window.removeEventListener("blur", onMenu);
    document.removeEventListener("contextmenu", onMenu, early);
    document.removeEventListener("pointermove", onSeedMove, early);
    delete root.dataset.pour;
    for (const layer of document.querySelectorAll<HTMLElement>(".btn__pour")) layer.style.removeProperty("clip-path");
  };
}
