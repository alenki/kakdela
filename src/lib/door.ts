// The about page's opening door («Спасибо, что | спросили.», src/components/about/Opening.tsx): its numbers
// and its geometry, in one place for the stylesheet (as the section's --open-* and --room-* properties),
// the island (OpeningDoor) and the tests (door.test.ts). Pure: no DOM, no GSAP, no imports.

/** The line: the answer on one line gutter to gutter, the door rising from under the header to the floor.
 *  Anything narrower or taller is the stack: «Спасибо, что» over the door. about.css repeats it verbatim. */
export const LINE_MQ = "(min-width: 640px) and (min-aspect-ratio: 4/3)";

/** The build's language (NEXT_PUBLIC_LOCALE, inlined at build time): the English site says «Thanks for | asking.». */
const EN = process.env.NEXT_PUBLIC_LOCALE === "en";

export const DOOR = {
  // Widths in em of the display face at 860, uppercase, tracked -0.012em, measured in Chromium.
  // Re-measure when the copy, the weight or the face changes (door.test.ts pins what follows from them).
  // English: «Thanks for» / «asking.», measured the same way.
  /** «спросили.», the word on the leaf. */
  wordEm: EN ? 2.599 : 3.792,
  /** The leaf's margin either side of the word. */
  jambEm: 0.1,
  /** The doorway: the word and its margins. */
  doorEm: EN ? 2.799 : 3.992,
  /** «Спасибо, что» and the space after it. */
  wallEm: EN ? 4.025 : 4.846,
  /** The line gutter to gutter: the wall and the doorway (8.838, with a hair to spare). */
  lineEm: EN ? 6.83 : 8.84,
  /** The stack: «Спасибо, что» (4.732) across a phone, with a hair to spare. */
  stackEm: EN ? 3.94 : 4.76,
  /** The ask across a phone: the longest, «Как в сказке. А у вас как дела?», sets 10.97em at 0.06em. */
  askEm: 11.6,
  /** The face at line-height 1: its cap height, and its baseline from the top of the line. */
  capEm: 0.66,
  baseEm: 0.8,

  /** The line's eye line (the answer's top) and floor, as fractions of the stage's height. */
  eyeLine: 0.36,
  floor: 0.94,
  /** The ask's baseline stands this far (in the answer's size) over the answer. */
  askGapEm: 0.18,
  /** On a short screen the line's answer is at most this share of the stage's height (1 / 4.8). */
  heightFit: 4.8,
  /** The stack's door: 6.2 times the answer's size, short enough to leave 18.5rem of the screen to the rest,
   *  never under 14rem. */
  stackDoor: { em: 6.2, leaveRem: 18.5, minRem: 14 },
  /** How far the door stands ajar at rest, in degrees. */
  ajar: { line: 34, stack: 42 },
  /** The perspective, in the stage's inline size, and the eye across from the hinge (negative: left). */
  perspective: { line: 1.1, stack: 1.8 },
  eyeX: { line: -0.24, stack: 0 },
  /** The lever on the line, this far (in the answer's size) under the eye line. */
  leverEm: 1.55,

  /** The drive, in viewport heights. */
  travel: { line: 0.5, stack: 0.4 },
  /** The room at rest: the photo zoomed this many times the lock's width, the kitchen door's lettering
   *  this far across the doorway. */
  zoom: { line: 2.2, stack: 3 },
  anchorX: { line: 0.79, stack: 0.8 },

  /** The drive's timeline, in its progress: the swing ends, the pull runs, the super changes (and back). */
  swingTo: 0.6,
  pullFrom: 0.04,
  pullTo: 0.74,
  openAt: 0.74,
  openBack: 0.7,
  /** Under this the door is at rest (it lifts to the pointer, a click opens it). */
  restAt: 0.02,
  /** The swing ends this many degrees past edge-on, so the leaf is wholly behind its jamb. */
  edgeMargin: 3,

  /** One window, up and to the left of the guest: the leaf darkens as it turns from it. */
  light: [-0.25, -0.35, 0.9] as const,
  shadeMax: 0.22,
  /** The word fades from this share of its flat width to this one, before it can smear. */
  wordFade: [0.16, 0.09] as const,

  /** The invitation (fine pointers): the door eases this many degrees wider within `reach` px of its free
   *  edge, and the lever dips `lever` times as much. */
  lift: { deg: 8, reach: 140, lever: -1.75 },
} as const;

/**
 * The room behind the door: cafe-lermontova-59.jpg, measured with sharp. Re-measure when the photo changes.
 *   sign       «КАК ДЕЛА?» over the bar: its caps from row 655 to 719 of 2000 (baseline and cap height as
 *              fractions of the photo's height), and its extent across
 *   lettering  «КАК ДЕЛА НА КУХНЕ?» on the kitchen door: its middle and its box
 */
export const ROOM = {
  width: 1333,
  height: 2000,
  /** Never shown past this many times its own pixels. */
  maxScale: 1.3,
  sign: { baseline: 0.3595, cap: 0.032, x0: 0.127, x1: 0.564 },
  lettering: { x: 0.834, y: 0.505, x0: 0.785, x1: 0.883, y0: 0.495, y1: 0.514 },
} as const;

/** height / width */
export const ROOM_AR = ROOM.height / ROOM.width;

/** Today's torn answer opens the ask in red at the weight of its mood; never the café's 860. */
export const SAID_WEIGHT = { tired: 110, meh: 200, hungry: 320, good: 460 } as const;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const rad = (deg: number) => (deg * Math.PI) / 180;

/** A CSS cubic-bezier(x1, y1, x2, y2) as a function of 0..1, solved for x by bisection. */
export function bezier(x1: number, y1: number, x2: number, y2: number) {
  const bez = (s: number, a: number, b: number) => 3 * a * s * (1 - s) ** 2 + 3 * b * s * s * (1 - s) + s ** 3;
  return (t: number) => {
    const x = clamp01(t);
    let lo = 0;
    let hi = 1;
    for (let i = 0; i < 40; i++) {
      const m = (lo + hi) / 2;
      if (bez(m, x1, x2) < x) lo = m;
      else hi = m;
    }
    return bez((lo + hi) / 2, y1, y2);
  };
}

/** kd.inOut (cubic-bezier(.65, 0, .35, 1)). */
export const kdInOut = bezier(0.65, 0, 0.35, 1);
/** The swing: a door already ajar answers the first pixel of a push, then slows into its jamb. */
export const swingEase = bezier(0.3, 0.2, 0.35, 1);
/** The pull: it gathers, then settles the sign onto the line. */
export const pullEase = bezier(0.45, 0, 0.3, 1);

/** Where a point `u` px along the leaf from its hinge lands across the doorway, with the leaf at `deg` and
 *  the eye `eyeX` px across from the hinge, `persp` px away (CSS: rotate y, perspective on the frame). */
export function projectX(u: number, deg: number, eyeX: number, persp: number): number {
  const a = rad(deg);
  return eyeX + ((u * Math.cos(a) - eyeX) * persp) / (persp + u * Math.sin(a));
}

/** The angle at which the leaf is edge-on to the eye: past it, it is behind its jamb. */
export function edgeAngle(eyeX: number, persp: number): number {
  return 90 - (Math.atan(Math.max(0, -eyeX) / persp) * 180) / Math.PI;
}

/** The leaf's shade at `deg`: flat ink, as much as it has turned from the window (0 when shut). */
export function shade(deg: number): number {
  const [lx, , lz] = DOOR.light;
  const len = Math.hypot(...DOOR.light);
  const a = rad(deg);
  const lit = (lx * Math.sin(a) + lz * Math.cos(a)) / len;
  const flat = lz / len;
  return DOOR.shadeMax * clamp01((flat - lit) / flat);
}

/** The word's opacity for the share of its flat width it still shows. */
export function wordOpacity(ratio: number): number {
  const [from, to] = DOOR.wordFade;
  return clamp01((ratio - to) / (from - to));
}

/** A photo laid in the doorway, in px of the frame: `w` × `h`, its top-left corner at `l`, `t`. */
export type Crop = { l: number; t: number; w: number; h: number };
export type Point = { x: number; y: number };

/** The line's end: the whole room, right-aligned, so the bar's sign stands on the ask's baseline `askB`
 *  (px from the frame's top) at the ask's cap height, and the photo still covers the doorway. */
export function lockCrop(frameW: number, frameH: number, askB: number): Crop {
  const b = ROOM.sign.baseline;
  const h = Math.max(ROOM_AR * frameW, (frameH - askB) / (1 - b), askB / b);
  const w = h / ROOM_AR;
  return { l: frameW - w, t: askB - b * h, w, h };
}

/** The stack's end: the whole room as wide as the doorway allows, right-aligned, the kitchen door at mid height. */
export function coverCrop(frameW: number, frameH: number): Crop {
  const h = Math.max(ROOM_AR * frameW, frameH);
  const w = h / ROOM_AR;
  return { l: frameW - w, t: Math.min(0, Math.max(frameH - h, frameH / 2 - ROOM.lettering.y * h)), w, h };
}

/**
 * The pull from the kitchen door (`rest`) to the room (`end`), at `e` from 0 to 1. The zoom is log-linear
 * (it feels even), and the point of the photo under the anchor walks in a straight line from the lettering
 * to where the end crop has it, so it starts on the rest crop and lands exactly on the end one.
 */
export function pullCrop(rest: Crop, end: Crop, anchor: Point, e: number): Crop {
  const w = rest.w ** (1 - e) * end.w ** e;
  const h = w * ROOM_AR;
  const px = ROOM.lettering.x + ((anchor.x - end.l) / end.w - ROOM.lettering.x) * e;
  const py = ROOM.lettering.y + ((anchor.y - end.t) / end.h - ROOM.lettering.y) * e;
  return { l: anchor.x - px * w, t: anchor.y - py * h, w, h };
}

/** What the island measures once per refresh. `u0`, `u1`: the word's ends along the leaf, in px. */
export type Geo = { ajar: number; edge: number; eyeX: number; persp: number; u0: number; u1: number };

/** The door at drive progress `p`: its angle, the word's opacity, its shade, the pull's progress, and
 *  whether it is behind its jamb. */
export function pose(p: number, g: Geo) {
  const angle = g.ajar + (g.edge + DOOR.edgeMargin - g.ajar) * swingEase(p / DOOR.swingTo);
  const ratio = (projectX(g.u1, angle, g.eyeX, g.persp) - projectX(g.u0, angle, g.eyeX, g.persp)) / (g.u1 - g.u0);
  return {
    angle,
    word: wordOpacity(ratio),
    shade: shade(angle),
    e: pullEase((p - DOOR.pullFrom) / (DOOR.pullTo - DOOR.pullFrom)),
    gone: angle >= g.edge,
  };
}

const round = (v: number, n = 4) => Math.round(v * 10 ** n) / 10 ** n;

/** The custom properties Opening.tsx writes on the section, for about.css. */
export const doorVars: Record<`--${string}`, string> = {
  "--open-line-em": String(DOOR.lineEm),
  "--open-stack-em": String(DOOR.stackEm),
  "--open-wall-em": String(DOOR.wallEm),
  "--open-door-em": String(DOOR.doorEm),
  "--open-jamb-em": String(DOOR.jambEm),
  "--open-ask-em": String(DOOR.askEm),
  "--open-cap": String(DOOR.capEm),
  "--open-base": String(DOOR.baseEm),
  "--open-eye": String(DOOR.eyeLine * 100),
  "--open-floor": String(DOOR.floor * 100),
  "--open-ask-gap": String(DOOR.askGapEm),
  "--open-fit": String(DOOR.heightFit),
  "--open-stack-door": String(DOOR.stackDoor.em),
  "--open-stack-leave": `${DOOR.stackDoor.leaveRem}rem`,
  "--open-stack-min": `${DOOR.stackDoor.minRem}rem`,
  "--open-lever": `${DOOR.leverEm}em`,
  "--open-ajar-line": `${DOOR.ajar.line}deg`,
  "--open-ajar-stack": `${DOOR.ajar.stack}deg`,
  "--open-shade-line": String(round(shade(DOOR.ajar.line))),
  "--open-shade-stack": String(round(shade(DOOR.ajar.stack))),
  "--open-persp-line": `${DOOR.perspective.line * 100}cqi`,
  "--open-persp-stack": `${DOOR.perspective.stack * 100}cqi`,
  "--open-eye-x-line": `${DOOR.eyeX.line * 100}cqi`,
  "--open-zoom-line": String(DOOR.zoom.line),
  "--open-zoom-stack": String(DOOR.zoom.stack),
  "--open-ax-line": String(DOOR.anchorX.line),
  "--open-ax-stack": String(DOOR.anchorX.stack),
  "--open-travel-line": `${DOOR.travel.line * 100}svh`,
  "--open-travel-stack": `${DOOR.travel.stack * 100}svh`,
  "--room-ar": String(round(ROOM_AR)),
  "--room-max": `${Math.round(ROOM.width * ROOM.maxScale)}px`,
  "--room-sign-b": String(ROOM.sign.baseline),
  "--room-sign-cap": String(ROOM.sign.cap),
  "--room-kx": String(ROOM.lettering.x),
  "--room-ky": String(ROOM.lettering.y),
};
