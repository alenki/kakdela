"use client";

import { useLayoutEffect } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { isFinePointer, useMotionMode } from "@/lib/motion";
import { DOOR, LINE_MQ, ROOM, coverCrop, edgeAngle, lockCrop, pose, projectX, pullCrop, type Crop, type Geo, type Point } from "@/lib/door";

type LenisLike = { scrollTo: (target: number, options?: { duration?: number }) => void };
const lenis = () => (window as unknown as { __lenis?: LenisLike }).__lenis;

/**
 * Opens the opening's door as the page scrolls (full motion only; src/lib/door.ts has the numbers). The
 * section gets data-drive: its stage sticks under the header (CSS) and a spacer under it adds the drive's
 * length, so ScrollTrigger only reads the wrapper's progress (no pin). Two things move and never the type:
 * the leaf swings into the room and slips behind its jamb (its angle is CSS `rotate`, through --swing),
 * darkening as it turns from the window, its word fading before it can smear; and the photo in the doorway
 * pulls back from the kitchen door to the room until the bar's «КАК ДЕЛА?» stands on the ask's baseline, at
 * its cap height. On a fine pointer, at rest, the door eases open a little as the pointer nears its free
 * edge, and a click opens it by scrolling through the drive.
 *
 * The drive arms only at the top of the page with the whole doorway on screen; otherwise, and with reduced
 * motion, the door stays ajar and still. Geometry is measured on refresh only; each frame writes two
 * opacities, one custom property and the photo's transform.
 */
export function OpeningDoor() {
  const mode = useMotionMode();

  // The leaf's grain phase (DOOR_SCRIPT sets it first, before paint) is the page's and goes with it. The
  // knock is left alone: it takes itself off once played, and a remount must not cut it short.
  useLayoutEffect(() => {
    const html = document.documentElement;
    const root = document.getElementById("o-nas");
    let el: HTMLElement | null = root?.querySelector<HTMLElement>("[data-open-leaf]") ?? null;
    if (root && el && html.dataset.knock) {
      let x = 0;
      let y = 0;
      while (el && el !== root) {
        x += el.offsetLeft;
        y += el.offsetTop;
        el = el.offsetParent as HTMLElement | null;
      }
      html.style.setProperty("--open-gx", `${x}px`);
      html.style.setProperty("--open-gy", `${y}px`);
    }
    return () => {
      html.style.removeProperty("--open-gx");
      html.style.removeProperty("--open-gy");
    };
  }, []);

  useGSAP(
    () => {
      const html = document.documentElement;
      if (mode !== "full" || html.dataset.motion === "reduced") return;
      const root = document.getElementById("o-nas");
      const q = <T extends HTMLElement>(sel: string) => root?.querySelector<T>(sel) ?? null;
      const drive = q("[data-open-drive]");
      const stage = q("[data-open-stage]");
      const frame = q("[data-open-frame]");
      const leaf = q("[data-open-leaf]");
      const word = q("[data-open-word]");
      const shade = q("[data-open-shade]");
      const lever = q("[data-open-lever]");
      const pan = q("[data-open-pan]");
      const ask = q("[data-open-ask]");
      const travel = q(".ab-open__travel");
      if (!root || !drive || !stage || !frame || !leaf || !word || !shade || !lever || !pan || !ask || !travel) return;

      // Only from the top, with the whole doorway on screen: a reload halfway down keeps the still.
      if (
        window.scrollY >= 24 ||
        window.innerHeight < 560 ||
        window.matchMedia("(forced-colors: active)").matches ||
        frame.getBoundingClientRect().bottom > window.innerHeight - 8
      )
        return;
      root.dataset.drive = "";
      root.dataset.rest = "";

      let geo: Geo = { ajar: 0, edge: 90, eyeX: 0, persp: 1, u0: 0, u1: 1 };
      let rest: Crop = { l: 0, t: 0, w: 1, h: 1 };
      let end: Crop = rest;
      let anchor: Point = { x: 0, y: 0 };
      // The free edge at rest, for the lift: its x, and the doorway's height, on screen.
      let edgeX = 0;
      let box = { top: 0, bottom: 0 };

      const measure = () => {
        const line = window.matchMedia(LINE_MQ).matches;
        const cs = getComputedStyle(frame);
        const persp = parseFloat(cs.perspective) || 1;
        const eyeX = parseFloat(cs.perspectiveOrigin) || 0;
        const ajar = parseFloat(getComputedStyle(leaf).getPropertyValue("--ajar")) || DOOR.ajar[line ? "line" : "stack"];
        // The photo's place at rest is CSS's (door.ts numbers in cq units): read it with the drive's transform off.
        const moved = pan.style.transform;
        pan.style.transform = "none";
        const fr = frame.getBoundingClientRect();
        const pr = pan.getBoundingClientRect();
        pan.style.transform = moved;
        rest = { l: pr.left - fr.left, t: pr.top - fr.top, w: pr.width, h: pr.height };
        anchor = { x: rest.l + ROOM.lettering.x * rest.w, y: rest.t + ROOM.lettering.y * rest.h };
        if (line) {
          const size = parseFloat(getComputedStyle(ask).fontSize);
          end = lockCrop(fr.width, fr.height, ask.getBoundingClientRect().top + DOOR.baseEm * size - fr.top);
        } else {
          end = coverCrop(fr.width, fr.height);
        }
        geo = { ajar, edge: edgeAngle(eyeX, persp), eyeX, persp, u0: word.offsetLeft, u1: word.offsetLeft + word.offsetWidth };
        edgeX = fr.left + projectX(fr.width, ajar, eyeX, persp);
        box = { top: fr.top, bottom: fr.bottom };
      };

      // The lift's tween (fine pointers only, below).
      let liftTo: ((v: number) => void) | null = null;
      let open = false;
      let atRest = true;
      let gone = false;
      let still = 0;
      const settle = () => delete root.dataset.moving;

      const apply = (p: number) => {
        if (p > 0 && html.dataset.knock) delete html.dataset.knock;
        const s = pose(p, geo);
        leaf.style.setProperty("--swing", `${s.angle - geo.ajar}deg`);
        word.style.opacity = String(s.word);
        lever.style.opacity = String(s.word);
        shade.style.opacity = String(s.shade);
        const c = pullCrop(rest, end, anchor, s.e);
        pan.style.transform = `translate(${c.l - rest.l}px, ${c.t - rest.t}px) scale(${c.w / rest.w})`;

        if (s.gone !== gone) {
          gone = s.gone;
          leaf.toggleAttribute("data-gone", gone);
        }
        const nowOpen = open ? p >= DOOR.openBack : p >= DOOR.openAt;
        if (nowOpen !== open) {
          open = nowOpen;
          root.toggleAttribute("data-open", open);
        }
        const nowRest = p < DOOR.restAt;
        if (nowRest !== atRest) {
          atRest = nowRest;
          root.toggleAttribute("data-rest", atRest);
          if (!atRest) liftTo?.(0);
        }
        // Layers only while it moves, so the word and the photo re-raster crisp once it stops.
        if (p > 0) {
          if (!("moving" in root.dataset)) root.dataset.moving = "";
          clearTimeout(still);
          still = window.setTimeout(settle, 150);
        }
      };

      const header = () => parseFloat(getComputedStyle(html).getPropertyValue("--header-h")) || 64;
      const state = { p: 0 };
      measure();
      apply(0);
      const tween = gsap.to(state, {
        p: 1,
        ease: "none",
        onUpdate: () => apply(state.p),
        scrollTrigger: {
          trigger: drive,
          start: () => `top ${header()}px`,
          end: () => `+=${travel.offsetHeight}`,
          scrub: 0.6,
          invalidateOnRefresh: true,
          onRefreshInit: measure,
          onRefresh: () => apply(state.p),
        },
      });
      let alive = true;
      document.fonts?.ready.then(() => {
        if (alive) tween.scrollTrigger?.refresh();
      });

      // The invitation: a mouse or a pen (never touch) near the free edge eases the door a little wider and
      // dips its lever; a click on the doorway opens it, through the drive.
      let raf = 0;
      let last: PointerEvent | null = null;
      let pressed = "";
      let downX = 0;
      let downY = 0;
      const onMove = (e: PointerEvent) => {
        if (e.pointerType === "touch" || (e.pointerType === "pen" && e.buttons !== 0)) return;
        last = e;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          if (!last || !liftTo) return;
          const d = Math.abs(last.clientX - edgeX);
          const near = atRest && d < DOOR.lift.reach && last.clientY >= box.top && last.clientY <= box.bottom;
          liftTo(near ? DOOR.lift.deg * (1 - d / DOOR.lift.reach) : 0);
        });
      };
      const onLeave = () => liftTo?.(0);
      const onDown = (e: PointerEvent) => {
        pressed = e.pointerType;
        downX = e.clientX;
        downY = e.clientY;
      };
      // Only a clean single click: a drag or a double click is the guest selecting the heading's word.
      const onClick = (e: MouseEvent) => {
        if ((pressed !== "mouse" && pressed !== "pen") || !atRest || e.detail > 1) return;
        if (Math.hypot(e.clientX - downX, e.clientY - downY) > 4 || String(window.getSelection() ?? "").trim()) return;
        const to = tween.scrollTrigger?.end ?? 0;
        const l = lenis();
        if (l) l.scrollTo(to, { duration: 1.4 });
        else window.scrollTo({ top: to, behavior: "smooth" });
      };
      if (isFinePointer()) {
        const lift = { v: 0 };
        liftTo = gsap.quickTo(lift, "v", {
          duration: 0.45,
          ease: "kd.out",
          onUpdate: () => {
            leaf.style.setProperty("--lift", `${lift.v}deg`);
            lever.style.setProperty("--lever", `${lift.v * DOOR.lift.lever}deg`);
          },
        });
        stage.addEventListener("pointermove", onMove, { passive: true });
        stage.addEventListener("pointerleave", onLeave);
        frame.addEventListener("pointerdown", onDown);
        frame.addEventListener("click", onClick);
      }

      return () => {
        alive = false;
        stage.removeEventListener("pointermove", onMove);
        stage.removeEventListener("pointerleave", onLeave);
        frame.removeEventListener("pointerdown", onDown);
        frame.removeEventListener("click", onClick);
        cancelAnimationFrame(raf);
        clearTimeout(still);
        for (const k of ["drive", "rest", "open", "moving"]) delete root.dataset[k];
        leaf.removeAttribute("data-gone");
        for (const p of ["--swing", "--lift"]) leaf.style.removeProperty(p);
        lever.style.removeProperty("--lever");
        lever.style.removeProperty("opacity");
        word.style.removeProperty("opacity");
        shade.style.removeProperty("opacity");
        pan.style.removeProperty("transform");
      };
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
