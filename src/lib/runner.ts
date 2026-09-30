import { mulberry32 } from "./seed";

/**
 * The runner's engine: a takeaway cup runs through the café, jumping stools, stacks of cups and a slice
 * of medovik, ducking the torn answer tabs, and keeping its feet on the floor under the paper planes. Pure and deterministic (a seed replays a run), with no
 * DOM: the controller feeds it input and fixed steps, the renderer reads its state.
 *
 * World units, y up, the ground at y = 0. The visible window is 640 × 217 u; see `camera`.
 */

export const DT = 1 / 120;
/**
 * Real seconds one frame may advance at most. A longer stall (a tab switch, a GC, a busy main thread)
 * freezes the run instead of catching up in one jump, which reads as a sudden burst of speed.
 */
export const MAX_FRAME = 0.05;
export const WORLD = { viewW: 640, viewH: 217, ground: 18, cupX: 60, standFront: 86, duckFront: 100, spawnX: 700, hMin: 140 } as const;
export const PHYS = { g: 1800, vJump: 520, fastFallV: 300, fastFallG: 3, jumpBuffer: 0.1 } as const;
export const SPEED = { start: 330, max: 690, accel: 6, runUp: 1.2 } as const;
export const SCORE = { unitsPerPoint: 40, milestone: 100, max: 99_999 } as const;
export const GAP = { min: 0.72, extraStart: 1.1, extraEnd: 0.45, tabAdjust: 50 } as const;
export const UNLOCK = { medovik: 40, tab: 120, plane: 160, stack4: 200, stools: 200 } as const;
/** The tabs fly a little faster than the floor moves. */
export const TAB_SPEED = 1.08;
/** Real seconds after a crash before a new run can start (mashing the jump key never restarts). */
export const RESTART_LOCK = 0.6;
/** Sim seconds the next obstacle is kept away from the cup after a resume. */
export const RESUME_LEAD = 0.9;

export type Box = readonly [x0: number, y0: number, x1: number, y1: number];
export type ObstacleKind = "stool" | "stools" | "stack3" | "stack4" | "medovik" | "tab" | "plane";
export type Pose = "stand" | "runA" | "runB" | "air" | "duckA" | "duckB" | "crash";
export type Phase = "idle" | "running" | "paused" | "over";
/** `jumpHeld`: a jump key or finger still down; the cup jumps again each time it lands. */
export type Input = { jumpPress: boolean; duck: boolean; jumpHeld?: boolean };
export type RunnerEvent =
  | { t: "jump" }
  | { t: "land" }
  | { t: "crash"; score: number }
  | { t: "milestone"; score: number }
  | { t: "newBest"; score: number }
  | { t: "spawn"; id: number; kind: ObstacleKind; score: number };

export type Obstacle = {
  id: number;
  kind: ObstacleKind;
  /** Left edge and bottom, world units; `px` is x at the start of the last step (for interpolation). */
  x: number;
  px: number;
  y: number;
  w: number;
  h: number;
  /** Speed relative to the floor. */
  k: number;
  boxes: readonly Box[];
};

type Spec = { w: number; h: number; y: number; weight: number; unlock: number; boxes: readonly Box[] };

const STOOL_BOXES: readonly Box[] = [[2, 33, 24, 39], [6, 0, 20, 33]];
/** Sizes and hitboxes (inset 2 to 3 u from the drawing, so a graze is forgiven). Boxes are y-up from the foot. */
export const CATALOGUE: Record<ObstacleKind, Spec> = {
  stool: { w: 26, h: 40, y: 0, weight: 3, unlock: 0, boxes: STOOL_BOXES },
  stack3: { w: 22, h: 33, y: 0, weight: 3, unlock: 0, boxes: [[3, 0, 19, 31]] },
  medovik: { w: 64, h: 18, y: 0, weight: 2, unlock: UNLOCK.medovik, boxes: [[3, 0, 61, 15]] },
  tab: { w: 40, h: 14, y: 28, weight: 1.5, unlock: UNLOCK.tab, boxes: [[4, 2, 36, 12]] },
  // Just over the standing cup's lid: a cup on the floor passes under it, a jumping one flies into it.
  plane: { w: 36, h: 16, y: 50, weight: 1.5, unlock: UNLOCK.plane, boxes: [[4, 3, 32, 13]] },
  stack4: { w: 22, h: 44, y: 0, weight: 2, unlock: UNLOCK.stack4, boxes: [[3, 0, 19, 42]] },
  stools: {
    w: 58, h: 40, y: 0, weight: 1.5, unlock: UNLOCK.stools,
    boxes: [...STOOL_BOXES, ...STOOL_BOXES.map(([a, b, c, d]) => [a + 32, b, c + 32, d] as Box)],
  },
};
const KINDS = Object.keys(CATALOGUE) as ObstacleKind[];

/** The cup's hitboxes, relative to (cupX, y). The lid's lip and the top 3 u are forgiven. */
export const CUP_BOXES = {
  stand: [[4, 12, 26, 41], [9, 0, 21, 12]] as readonly Box[],
  air: [[4, 12, 26, 41], [10, 4, 24, 12]] as readonly Box[],
  duck: [[2, 1, 40, 20]] as readonly Box[],
};

export type Run = {
  seed: number;
  rnd: () => number;
  ghost: boolean;
  /** Sim seconds, speed (u/s), distance (u) and score. */
  t: number;
  v: number;
  dist: number;
  score: number;
  best: number;
  newBestFired: boolean;
  nextMilestone: number;
  /** The cup: height, the height at the start of the last step, vertical speed. */
  y: number;
  py: number;
  vy: number;
  grounded: boolean;
  ducking: boolean;
  duckHeld: boolean;
  fastFall: boolean;
  /** A duck already held at takeoff doesn't fast-fall the jump; only a fresh press in the air does. */
  ffBlocked: boolean;
  /** Seconds a jump press stays buffered before landing. */
  buffer: number;
  /** A tab the cup stays ducked under after the keys were released (a pause), or -1. */
  duckLatch: number;
  obstacles: Obstacle[];
  /** Floor distance until the next spawn, and the kind already chosen for it. */
  untilNext: number;
  nextKind: ObstacleKind;
  /** The last two kinds, most recent last (the poster's stool counts). */
  last: ObstacleKind[];
  picked: number;
  tabForced: boolean;
  nextId: number;
  crashed: boolean;
  /** Pushed by `step`, drained by the caller. */
  events: RunnerEvent[];
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

/** Floor speed: a 1.2 s run-up from standing, then a steady climb to the cap at t ≈ 61 s. */
export function speedAt(t: number): number {
  if (t <= 0) return 0;
  if (t < SPEED.runUp) return (SPEED.start * t) / SPEED.runUp;
  return Math.min(SPEED.max, SPEED.start + SPEED.accel * (t - SPEED.runUp));
}

function makeObstacle(run: Run, kind: ObstacleKind, x: number): Obstacle {
  const s = CATALOGUE[kind];
  return { id: run.nextId++, kind, x, px: x, y: s.y, w: s.w, h: s.h, k: kind === "tab" ? TAB_SPEED : 1, boxes: s.boxes };
}

/** The next kind: weighted among the unlocked, with the opening and order rules. */
function pickKind(run: Run): ObstacleKind {
  run.picked++;
  const [a, b] = run.last.length === 2 ? run.last : [undefined, run.last[0]];
  // The opening is plain: a stool or a stack of three. (The first tab is forced in `step`.)
  const opening = run.picked <= 3;
  let total = 0;
  const pool: ObstacleKind[] = [];
  for (const k of KINDS) {
    const s = CATALOGUE[k];
    if (opening ? k !== "stool" && k !== "stack3" : run.score < s.unlock) continue;
    if ((k === "tab" || k === "plane") && b === k) continue; // never two tabs, or two planes, in a row
    if (a === k && b === k) continue; // never three of a kind
    pool.push(k);
    total += s.weight;
  }
  let r = run.rnd() * total;
  for (const k of pool) {
    r -= CATALOGUE[k].weight;
    if (r < 0) return k;
  }
  return pool[pool.length - 1];
}

function remember(run: Run, kind: ObstacleKind) {
  run.last.push(kind);
  if (run.last.length > 2) run.last.shift();
}

/** Seconds from one obstacle's trailing edge to the next one's leading edge, tighter as the speed climbs. */
function gapFor(run: Run) {
  const progress = clamp((run.v - SPEED.start) / (SPEED.max - SPEED.start), 0, 1);
  return GAP.min + run.rnd() * lerp(GAP.extraStart, GAP.extraEnd, progress);
}

/** A new run. It opens with the stool the idle poster shows, at x = 440. */
export function createRun(seed: number, opts: { best?: number; ghost?: boolean } = {}): Run {
  const run: Run = {
    seed,
    rnd: mulberry32(seed),
    ghost: !!opts.ghost,
    t: 0, v: 0, dist: 0, score: 0,
    best: opts.best ?? 0,
    newBestFired: false,
    nextMilestone: SCORE.milestone,
    y: 0, py: 0, vy: 0,
    grounded: true, ducking: false, duckHeld: false, fastFall: false, ffBlocked: false,
    buffer: 0,
    duckLatch: -1,
    obstacles: [],
    untilNext: 0,
    nextKind: "stool",
    last: [],
    picked: 0,
    tabForced: false,
    nextId: 1,
    crashed: false,
    events: [],
  };
  const first = makeObstacle(run, "stool", 440);
  run.obstacles.push(first);
  remember(run, "stool");
  run.nextKind = pickKind(run);
  // As if the stool had spawned at spawnX: the next one comes G seconds (at start speed) behind it.
  run.untilNext = first.x + first.w + gapFor(run) * SPEED.start - WORLD.spawnX;
  return run;
}

function spawn(run: Run) {
  const kind = run.nextKind;
  const o = makeObstacle(run, kind, WORLD.spawnX + run.untilNext);
  run.obstacles.push(o);
  remember(run, kind);
  run.events.push({ t: "spawn", id: o.id, kind, score: run.score });
  const next = pickKind(run);
  run.nextKind = next;
  // The tab flies faster and closes on the obstacle ahead: give it a little more room.
  run.untilNext += o.w + gapFor(run) * Math.max(run.v, SPEED.start) + (next === "tab" ? GAP.tabAdjust : 0);
}

/** The cup's hitboxes for its current state, relative to (cupX, y). */
export function cupBoxes(run: Run): readonly Box[] {
  if (run.ducking) return CUP_BOXES.duck;
  return run.grounded ? CUP_BOXES.stand : CUP_BOXES.air;
}

export function obstacleBoxes(o: Pick<Obstacle, "kind">): readonly Box[] {
  return CATALOGUE[o.kind].boxes;
}

/** The leftmost point of an obstacle's hitboxes, in world x. */
function leadEdge(o: Obstacle) {
  let x0 = Infinity;
  for (const b of o.boxes) x0 = Math.min(x0, b[0]);
  return o.x + x0;
}
function trailEdge(o: Obstacle) {
  let x1 = -Infinity;
  for (const b of o.boxes) x1 = Math.max(x1, b[2]);
  return o.x + x1;
}

function collides(run: Run) {
  const cup = cupBoxes(run);
  const cx = WORLD.cupX, cy = run.y;
  for (const o of run.obstacles) {
    if (o.x > cx + 44 || o.x + o.w < cx) continue;
    for (const b of o.boxes) {
      const bx0 = o.x + b[0], by0 = o.y + b[1], bx1 = o.x + b[2], by1 = o.y + b[3];
      for (const c of cup) {
        // Strict: edges that only touch never collide.
        if (cx + c[0] < bx1 && bx0 < cx + c[2] && cy + c[1] < by1 && by0 < cy + c[3]) return true;
      }
    }
  }
  return false;
}

/** Advances the run by one fixed step. `input.jumpPress` is an edge and is consumed here. */
export function step(run: Run, input: Input): void {
  if (run.crashed) return;

  if (input.jumpPress) {
    run.buffer = PHYS.jumpBuffer;
    input.jumpPress = false;
  }
  run.duckHeld = input.duck;
  if (input.duck) run.duckLatch = -1;

  // Jump (from the ground, buffered into the landing, or again on landing while the key is held).
  if (run.grounded && (run.buffer > 0 || input.jumpHeld)) {
    run.vy = PHYS.vJump;
    run.grounded = false;
    run.buffer = 0;
    run.duckLatch = -1;
    run.ffBlocked = input.duck;
    run.events.push({ t: "jump" });
  }

  // Vertical motion, exact for constant acceleration within the step.
  run.py = run.y;
  if (!run.grounded) {
    if (!input.duck) run.ffBlocked = false;
    if (input.duck && !run.fastFall && !run.ffBlocked) {
      run.fastFall = true;
      run.vy = Math.min(run.vy, -PHYS.fastFallV);
    } else if (!input.duck) run.fastFall = false;
    const g = PHYS.g * (run.fastFall ? PHYS.fastFallG : 1);
    run.y += run.vy * DT - 0.5 * g * DT * DT;
    run.vy -= g * DT;
    if (run.y <= 0) {
      run.y = 0;
      run.vy = 0;
      run.grounded = true;
      run.fastFall = false;
      run.ffBlocked = false;
      run.events.push({ t: "land" });
    }
  }
  if (run.buffer > 0) run.buffer = Math.max(0, run.buffer - DT);

  // The world.
  run.t += DT;
  run.v = speedAt(run.t);
  const move = run.v * DT;
  for (const o of run.obstacles) {
    o.px = o.x;
    o.x -= move * o.k;
  }
  while (run.obstacles.length && run.obstacles[0].x + run.obstacles[0].w < -40) run.obstacles.shift();

  run.dist += move;
  const score = Math.min(SCORE.max, Math.floor(run.dist / SCORE.unitsPerPoint));
  if (score !== run.score) {
    run.score = score;
    while (score >= run.nextMilestone) {
      run.events.push({ t: "milestone", score: run.nextMilestone });
      run.nextMilestone += SCORE.milestone;
    }
    if (!run.newBestFired && run.best > 0 && score > run.best) {
      run.newBestFired = true;
      run.events.push({ t: "newBest", score });
    }
  }

  // The first obstacle to spawn past 120 is the tab, so most guests meet it early. The kind already
  // chosen for that spawn gives way, and the tab gets its usual extra room.
  if (!run.tabForced && run.score >= UNLOCK.tab && run.picked > 3) {
    run.tabForced = true;
    if (run.nextKind !== "tab") {
      run.nextKind = "tab";
      run.untilNext += GAP.tabAdjust;
    }
  }

  run.untilNext -= move;
  while (run.untilNext <= 0) spawn(run);

  // A latched duck holds until its tab has passed the cup.
  if (run.duckLatch >= 0) {
    const tab = run.obstacles.find((o) => o.id === run.duckLatch);
    if (!tab || trailEdge(tab) <= WORLD.cupX + 2) run.duckLatch = -1;
  }
  run.ducking = run.grounded && (run.duckHeld || run.duckLatch >= 0);

  if (!run.ghost && collides(run)) {
    run.crashed = true;
    run.events.push({ t: "crash", score: run.score });
  }
}

/**
 * Drops every held input (a pause, a blur, a lost pointer), so nothing sticks. One exception: a cup
 * ducking under a tab that is passing over it stays down until the tab is by.
 */
export function releaseAll(run: Run): void {
  run.duckHeld = false;
  run.buffer = 0;
  run.fastFall = false;
  run.ffBlocked = false;
  run.duckLatch = -1;
  if (!run.grounded || !run.ducking) return;
  const [d] = CUP_BOXES.duck;
  for (const o of run.obstacles) {
    if (o.kind !== "tab") continue;
    if (leadEdge(o) < WORLD.cupX + d[2] && trailEdge(o) > WORLD.cupX + d[0]) {
      run.duckLatch = o.id;
      return;
    }
  }
}

/**
 * After a pause the guest needs a moment: the next obstacle still ahead of the cup is pushed back to at
 * least `minLead` sim seconds away, and everything behind it with it (the gaps between them stay). An
 * obstacle already under the cup is left alone, so a jump paused mid-air still clears it. If nothing
 * is ahead on screen, the obstacle about to spawn is held back instead. Arrivals are timed at the
 * highest speed the window can reach (the run-up climbs fast), so the lead is never shorter.
 */
export function resumeGrace(run: Run, minLead = RESUME_LEAD): void {
  const v = Math.max(speedAt(run.t + minLead), 1);
  const i = run.obstacles.findIndex((o) => leadEdge(o) >= WORLD.standFront);
  if (i < 0) {
    const s = CATALOGUE[run.nextKind];
    const k = run.nextKind === "tab" ? TAB_SPEED : 1;
    let x0 = Infinity;
    for (const b of s.boxes) x0 = Math.min(x0, b[0]);
    // The floor covers untilNext before the spawn; then the obstacle flies in from spawnX.
    const arrival = Math.max(0, run.untilNext) / v + (WORLD.spawnX + x0 - WORLD.standFront) / (v * k);
    if (arrival < minLead) run.untilNext += (minLead - arrival) * v;
    return;
  }
  const o = run.obstacles[i];
  const arrival = (leadEdge(o) - WORLD.standFront) / (v * o.k);
  if (arrival >= minLead) return;
  const shift = (minLead - arrival) * v * o.k;
  for (let j = i; j < run.obstacles.length; j++) {
    run.obstacles[j].x += shift;
    run.obstacles[j].px += shift;
  }
  run.untilNext += shift;
}

/** The drawn pose. The legs and the duck alternate at 12 Hz, except in reduced motion. */
export function poseOf(run: Run, time: number, reduced: boolean): Pose {
  if (run.crashed) return "crash";
  if (!run.grounded) return "air";
  const b = !reduced && Math.floor(time * 12) % 2 === 1;
  if (run.ducking) return b ? "duckB" : "duckA";
  if (run.v > 40) {
    if (reduced) return "stand";
    return b ? "runB" : "runA";
  }
  return "stand";
}

/**
 * Fits the 640 × 217 u world to a stage of cssW × cssH px, like SVG `xMinYMax slice`: the ground
 * line always sits at the bottom and the cup at the left. A narrow stage shows less of the world
 * ahead, so its clock runs slower (`pace`, fed into the step accumulator) and the reaction time
 * stays the same on a phone as on a desktop.
 */
export function camera(cssW: number, cssH: number) {
  if (!(cssW > 0) || !(cssH > 0)) return { scale: 1, viewW: WORLD.viewW, viewH: WORLD.viewH, pace: 1 };
  const scale = Math.max(cssW / WORLD.viewW, cssH / WORLD.viewH);
  const viewW = cssW / scale, viewH = cssH / scale;
  const pace = clamp((viewW - WORLD.standFront) / (WORLD.viewW - WORLD.standFront), 0.8, 1);
  return { scale, viewW, viewH, pace };
}

/** The game's phases; an action that doesn't apply leaves the phase as it is. */
export function nextPhase(p: Phase, a: "start" | "pause" | "resume" | "crash"): Phase {
  if (a === "start") return "running";
  if (p === "running" && a === "pause") return "paused";
  if (p === "running" && a === "crash") return "over";
  if (p === "paused" && a === "resume") return "running";
  return p;
}
