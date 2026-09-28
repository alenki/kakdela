"use client";

import { gsap, ScrollTrigger } from "@/lib/gsap";
import { mulberry32 } from "@/lib/seed";
import { holdRock, placeRock, rock, rockPose, stepRock } from "./rock";

// The coffee cup's small life, full motion only. One body (rock.ts): the cup rocks on the rim of its
// base, and everything that moves it is a hand on that body: the landing sets it down, the pen drags it
// while it writes, a hard fling's draught pulls it toward the card. The steam is the light thing: it
// streams with the scroll and curls back when the page stops. All of it runs from one ticker callback
// that sleeps whenever nothing moves. Built inside the island's matchMedia context; `kill` stops it.

/** Who holds the cup. The strongest hold wins; when the last lets go, the cup falls back and rocks. */
export type Hand = "set" | "pen" | "draught";

const D = Math.PI / 180;
/** The rims the cup stands on, as a share of its width out from the base's centre (67 of 300). */
const RIM = 67 / 300;
/**
 * The draught: the card rushing past on the cup's right thins the air on that side, so a hard fling pulls
 * the cup onto its right rim, whichever way the page goes. It takes hold above `on` px/s, tilts the cup
 * further the harder the fling (up to `max` degrees at `full`), and lets go below `off`: the cup drops
 * back onto its base and rocks.
 */
const DRAUGHT = { on: 2600, off: 1700, full: 6500, max: 2.2 };
/**
 * The steam, as a plume about the sip slot: it leans toward the card with the scroll's speed, stretches
 * up when the page goes down (the cup travels down it) and squats when it goes up. A soft spring, a
 * little under-damped, so it curls back past upright when the page stops.
 */
const STEAM = { bend: 18, bendAt: 3600, stretch: 1 / 5200, low: 0.72, high: 1.45, freq: 7, damp: 0.42, lag: 0.55 };

export type CupLife = {
  /** `hand` holds the cup tipped `deg` onto a rim (+ right). 0 lets go: it falls back and rocks to rest. */
  hold(hand: Hand, deg: number): void;
  /** Tip the cup to `deg` at once and hold it there (an entrance starts from a pose). */
  place(hand: Hand, deg: number): void;
  /**
   * How fast the page scrolls, px/s (+ down): the smoothed speed, or the last frame's when that is
   * faster, so a fling reads as one from its first frames. 0 when this life doesn't watch the scroll.
   */
  speed(): number;
  kill(): void;
};

type Spring = { x: number; v: number };
function follow(s: Spring, to: number, dt: number) {
  const w = STEAM.freq;
  s.v += (w * w * (to - s.x) - 2 * STEAM.damp * w * s.v) * dt;
  s.x += s.v * dt;
}

export function cupLife(opts: {
  /** The layer that rocks (its CSS transform-origin is the centre of the cup's base). */
  rock: HTMLElement;
  /** The contact shadow (CupGround's data-ground), drawn in under the rim the cup stands on. */
  ground?: SVGEllipseElement | null;
  /** Watch the scroll while `view` (a non-sticky parent) is on screen: the speed, the steam, the draught. */
  view?: Element | null;
  /** The steam layer, bent by the scroll about the sip slot (its CSS transform-origin). */
  steam?: SVGSVGElement | null;
  /** A hard fling pulls the cup toward the card (desktop, where the card runs beside it). */
  draught?: boolean;
  onView?: (on: boolean) => void;
}): CupLife {
  const body = rock();
  const hands = new Map<Hand, number>();
  let rim = 0;
  const measure = () => void (rim = opts.rock.offsetWidth * RIM);
  measure();

  let awake = false;
  /** How long everything has been still, s. The life sleeps after a moment of it, not at the first still
   * frame: the scroll that wakes it has only just begun, and the next frames carry its speed. */
  let quiet = 0;
  let inView = opts.view ? ScrollTrigger.isInViewport(opts.view) : false;
  let lastY = window.scrollY;
  let v = 0;
  let now = 0;
  let pull = 0;
  const bend: Spring = { x: 0, v: 0 };
  const stretch: Spring = { x: 1, v: 0 };
  let rockT = "";
  let steamT = "";

  const grip = () => {
    let a: number | null = null;
    for (const deg of hands.values()) if (a === null || Math.abs(deg) > Math.abs(a)) a = deg;
    holdRock(body, a === null ? null : a * D);
    wake();
  };

  const draw = () => {
    const p = rockPose(body.angle, rim);
    const t = p.rotate ? `translate(${p.x.toFixed(2)}px, ${p.y.toFixed(2)}px) rotate(${p.rotate.toFixed(3)}deg)` : "";
    if (t !== rockT) {
      opts.rock.style.transform = t;
      rockT = t;
      // The shadow gathers under the rim the cup stands on as the other lifts off the counter.
      if (opts.ground) {
        const f = Math.min(1, Math.abs(body.angle) / (2.5 * D));
        opts.ground.setAttribute("cx", (150 + Math.sign(body.angle) * 18 * f).toFixed(1));
        opts.ground.setAttribute("rx", (100 * (1 - 0.24 * f)).toFixed(1));
      }
    }
    if (opts.steam) {
      // The plume is air: it rocks less than the cup it rises from.
      const lean = -STEAM.lag * p.rotate;
      const s =
        lean || bend.x || stretch.x !== 1
          ? `rotate(${lean.toFixed(3)}deg) skewX(${bend.x.toFixed(2)}deg) scaleY(${stretch.x.toFixed(3)})`
          : "";
      if (s !== steamT) {
        opts.steam.style.transform = s;
        steamT = s;
      }
    }
  };

  const frame = (_time: number, ms: number) => {
    const dt = Math.min(ms / 1000, 0.1);
    if (opts.view) {
      // The scroll's speed from the page's own movement, smoothed over about 80ms. A jump (an anchor, a
      // restored position, a layout shift) is not a fling.
      const y = window.scrollY;
      const dy = y - lastY;
      lastY = y;
      const raw = dt > 0 && Math.abs(dy) < 1600 ? dy / dt : 0;
      now = raw;
      v += (raw - v) * (1 - Math.exp(-dt / 0.08));
      if (!raw && Math.abs(v) < 5) v = 0;
      const fast = inView ? Math.abs(v) : 0;
      if (opts.draught) {
        // Up with the fling's strength while it lasts; held there while it eases; let go below `off`.
        const want = DRAUGHT.max * Math.min(1, Math.max(0, fast - DRAUGHT.off) / (DRAUGHT.full - DRAUGHT.off));
        const next = fast > DRAUGHT.on ? Math.max(pull, want) : fast > DRAUGHT.off ? pull : 0;
        if (next !== pull) {
          pull = next;
          if (pull) hands.set("draught", pull);
          else hands.delete("draught");
          grip();
        }
      }
      if (opts.steam) {
        follow(bend, -STEAM.bend * Math.min(1, fast / STEAM.bendAt), dt);
        follow(stretch, inView ? gsap.utils.clamp(STEAM.low, STEAM.high, 1 + v * STEAM.stretch) : 1, dt);
      }
    }
    stepRock(body, dt);
    // Tiny residues are no motion: snap the plume home so it can sleep.
    const calm = !v && Math.abs(bend.x) < 0.02 && Math.abs(bend.v) < 0.05 && Math.abs(stretch.x - 1) < 0.002 && Math.abs(stretch.v) < 0.005;
    if (calm) {
      bend.x = bend.v = stretch.v = 0;
      stretch.x = 1;
    }
    draw();
    quiet = body.still && calm ? quiet + dt : 0;
    if (quiet > 0.3) sleep();
  };

  function wake() {
    quiet = 0;
    if (awake) return;
    awake = true;
    lastY = window.scrollY;
    gsap.ticker.add(frame);
  }
  function sleep() {
    if (!awake) return;
    awake = false;
    gsap.ticker.remove(frame);
  }

  const st = opts.view
    ? ScrollTrigger.create({
        trigger: opts.view,
        start: "top bottom",
        end: "bottom top",
        onUpdate: wake,
        onToggle: (self) => {
          inView = self.isActive;
          opts.onView?.(inView);
          wake();
        },
        onRefresh: measure,
      })
    : null;

  return {
    hold(hand, deg) {
      if (deg) hands.set(hand, deg);
      else if (!hands.delete(hand)) return;
      grip();
    },
    place(hand, deg) {
      hands.set(hand, deg);
      grip();
      placeRock(body, deg * D);
      draw();
    },
    speed: () => (awake && Math.abs(now) > Math.abs(v) ? now : v),
    kill() {
      sleep();
      st?.kill();
      hands.clear();
      opts.rock.style.removeProperty("transform");
      opts.steam?.style.removeProperty("transform");
      opts.ground?.setAttribute("cx", "150");
      opts.ground?.setAttribute("rx", "100");
    },
  };
}

/**
 * Steam from the sip slot: each wisp draws itself upward, drifts, and thins away at the top, on its
 * own seeded rhythm, for ever. Returns a paused timeline: the island plays it only while the cup is on
 * screen.
 */
export function steamLoop(svg: SVGSVGElement, seed = 2604) {
  const rnd = mulberry32(seed);
  const all = gsap.timeline({ paused: true });
  gsap.utils.toArray<SVGPathElement>("[data-steam]", svg).forEach((wisp, i) => {
    const d = 2.8 + rnd() * 0.9;
    const drift = (i % 2 ? 1 : -1) * (2 + rnd() * 2);
    const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.3 + rnd() * 0.7 });
    tl.fromTo(
      wisp,
      { drawSVG: "0% 0%", opacity: 0, x: 0, y: 0 },
      { drawSVG: "0% 70%", opacity: 0.7, duration: d * 0.45, ease: "sine.out" },
    )
      .to(wisp, { drawSVG: "45% 100%", x: drift, y: -10, duration: d * 0.35, ease: "sine.inOut" })
      .to(wisp, { drawSVG: "100% 100%", opacity: 0, y: -18, duration: d * 0.3, ease: "sine.in" });
    all.add(tl, i * 0.95 + rnd() * 0.3);
  });
  return all;
}

/** The hatched clover behind the cup turns a few degrees while the section scrolls past (scrubbed). */
export function turnHalo(el: Element, trigger: Element) {
  gsap.fromTo(
    el,
    { rotation: -4 },
    { rotation: 6, ease: "none", scrollTrigger: { trigger, start: "top bottom", end: "bottom top", scrub: 0.8 } },
  );
}
