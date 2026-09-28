// The coffee cup as a rigid body: it tips onto the rim of its base, never through the counter, and
// falls back under its own weight, losing a share of its speed at every clack onto the other rim. So it
// settles as a real cup does, «tok… tok, tk-tk», each rock smaller and quicker than the last (Housner's
// rocking block, slowed to poster tempo). A hand (the landing, the pen, a fling's draught) can hold it
// at an angle; let go, and the physics takes it back. Plain TS on purpose: no DOM, no GSAP, so the tests
// can drive it.

export type RockOptions = {
  /** Slenderness, radians: atan(half the base / the height of the centre of mass). */
  alpha: number;
  /** How hard the cup's weight pulls it back at upright, rad/s²: the tempo of the rocking. */
  pull: number;
  /** The share of its speed the cup keeps at each clack onto the other rim. */
  keep: number;
  /** The hand's grip: natural frequency of the spring that holds the cup at an angle, rad/s. */
  grip: number;
  /** The smallest rock worth drawing, radians: below it the cup sits still. */
  rest: number;
};

/** The takeaway cup: base 134 wide, centre of mass 195 up (a filled cone), a paper cup full of coffee. */
export const CUP_ROCK: RockOptions = {
  alpha: Math.atan(67 / 195),
  pull: 3,
  keep: 0.6,
  grip: 15,
  rest: 0.0009,
};

export type Rock = {
  /** The tilt, radians: + onto the right rim (clockwise on screen), − onto the left. */
  angle: number;
  /** rad/s. */
  speed: number;
  /** Where a hand holds the cup, radians; null when nothing does. */
  held: number | null;
  /** At rest on its base: nothing to step or draw. */
  still: boolean;
};

export const rock = (): Rock => ({ angle: 0, speed: 0, held: null, still: true });

/** Fixed substeps, so the rocking reads the same at 60 and 144 frames a second. */
const H = 1 / 240;
/** Never past 80% of the tipping angle: a cup on this poster doesn't fall over. */
const LIMIT = 0.8;

function substep(s: Rock, o: RockOptions) {
  if (s.held !== null) {
    // The hand: a critically damped spring to the held angle, strong enough to overrule the weight.
    s.speed += (o.grip * o.grip * (s.held - s.angle) - 2 * o.grip * s.speed) * H;
    s.angle += s.speed * H;
    return;
  }
  // Free: the weight pulls the cup back toward its base, about whichever rim it stands on. The pull
  // weakens as the tilt nears the tipping angle, as it does on a real block.
  if (s.angle === 0 && s.speed === 0) {
    s.still = true;
    return;
  }
  const side = s.angle !== 0 ? Math.sign(s.angle) : Math.sign(s.speed);
  const p2 = o.pull / Math.sin(o.alpha);
  s.speed -= side * p2 * Math.sin(o.alpha - Math.abs(s.angle)) * H;
  const next = s.angle + s.speed * H;
  if (s.angle !== 0 && Math.sign(next) !== Math.sign(s.angle)) {
    // The clack: the lifted rim lands and the cup pivots onto it, keeping part of its speed.
    s.speed *= o.keep;
    const rise = (s.speed * s.speed) / (2 * o.pull);
    if (rise < o.rest) {
      s.angle = 0;
      s.speed = 0;
      s.still = true;
      return;
    }
    s.angle = 0;
    return;
  }
  s.angle = next;
}

/** Advance `dt` seconds (capped: a tab that slept must not fling the cup). */
export function stepRock(s: Rock, dt: number, o: RockOptions = CUP_ROCK) {
  if (s.still) return;
  let t = Math.min(dt, 0.1);
  while (t > 1e-9 && !s.still) {
    substep(s, o);
    t -= H;
  }
  const max = o.alpha * LIMIT;
  if (Math.abs(s.angle) > max) {
    s.angle = Math.sign(s.angle) * max;
    s.speed = 0;
  }
  // A held cup that has arrived stays drawn where it is; a free one sleeps once it is back on its base.
  if (s.held !== null && Math.abs(s.held - s.angle) < 1e-5 && Math.abs(s.speed) < 1e-4) {
    s.angle = s.held;
    s.speed = 0;
    s.still = true;
  }
}

/** Hold the cup at `angle` radians (null lets go). Wakes it. */
export function holdRock(s: Rock, angle: number | null) {
  if (s.held === angle) return;
  s.held = angle;
  s.still = angle === null && s.angle === 0 && s.speed === 0;
}

/** Put the cup at `angle` at once, at rest (an entrance starts from a pose). */
export function placeRock(s: Rock, angle: number) {
  s.angle = angle;
  s.speed = 0;
  s.still = s.held === angle || (s.held === null && angle === 0);
}

/**
 * The pose for a tilt, as a transform about the base's centre: the cup turns about the rim it stands
 * on, `b` px out from the centre, so the centre lifts and slides. Returns px and degrees.
 */
export function rockPose(angle: number, b: number) {
  if (angle === 0) return { x: 0, y: 0, rotate: 0 };
  return {
    x: Math.sign(angle) * b * (1 - Math.cos(angle)),
    y: -b * Math.abs(Math.sin(angle)),
    rotate: (angle * 180) / Math.PI,
  };
}
