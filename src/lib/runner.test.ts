import { describe, expect, it } from "vitest";
import {
  camera,
  createRun,
  cupBoxes,
  DT,
  nextPhase,
  obstacleBoxes,
  PHYS,
  poseOf,
  releaseAll,
  resumeGrace,
  speedAt,
  step,
  touchZone,
  UNLOCK,
  WORLD,
  type Input,
  type Obstacle,
  type ObstacleKind,
  type Phase,
  type Run,
  type RunnerEvent,
} from "./runner";
import { BEST_MAX, pad5, parseBest, serializeBest } from "./runner-best";
import { mulberry32 } from "./seed";
import { ARTS, CUP_ART, TAB_ART } from "@/components/game/runner-art";
import { ru } from "@/i18n/ru";

/* ───────────── helpers ───────────── */

type Bot = (run: Run, input: Input) => void;
type SpawnLog = { id: number; kind: ObstacleKind; score: number; t: number }[];

/** Plays one run with a bot, collecting the events. Stops at a crash. */
function play(seed: number, bot: Bot | null, seconds: number, opts: { ghost?: boolean; best?: number } = {}) {
  const run = createRun(seed, opts);
  const input: Input = { jumpPress: false, duck: false };
  const events: RunnerEvent[] = [];
  const spawns: SpawnLog = [];
  const steps = Math.round(seconds / DT);
  for (let i = 0; i < steps && !run.crashed; i++) {
    bot?.(run, input);
    step(run, input);
    for (const e of run.events) {
      events.push(e);
      if (e.t === "spawn") spawns.push({ id: e.id, kind: e.kind, score: e.score, t: run.t });
    }
    run.events.length = 0;
  }
  return { run, events, spawns };
}

/** An obstacle's collision extent in world units. */
function extent(o: Obstacle) {
  let x0 = Infinity, x1 = -Infinity, top = -Infinity;
  for (const b of obstacleBoxes(o)) {
    x0 = Math.min(x0, b[0]);
    x1 = Math.max(x1, b[2]);
    top = Math.max(top, b[3]);
  }
  return { x0: o.x + x0, x1: o.x + x1, top: o.y + top };
}

const CUP_BACK = 64; // the standing and airborne body box: x 64…86
const cupCentre = (WORLD.cupX + 4 + WORLD.standFront) / 2;
const HALF_AIR = PHYS.vJump / PHYS.g; // 0.289 s to the apex
const AIRTIME = 2 * HALF_AIR;
/** Seconds after takeoff until the airborne cup's lowest box (y + 4) rises above `top`. */
const rise = (top: number) => {
  const h = Math.max(0, top - 4);
  return (PHYS.vJump - Math.sqrt(PHYS.vJump ** 2 - 2 * PHYS.g * h)) / PHYS.g;
};

/** The next obstacle the cup hasn't passed yet, optionally only of some kinds. */
function ahead(run: Run, pick: (o: Obstacle) => boolean) {
  for (const o of run.obstacles) if (extent(o).x1 > CUP_BACK && pick(o)) return o;
  return null;
}

/** Centred full jumps; ducks the tab 0.3 s ahead unless `jumpTabs`. Runs under the planes. */
function centredBot(jumpTabs: boolean): Bot {
  const pressed = new Set<number>();
  return (run, input) => {
    input.duck = false;
    if (!jumpTabs) {
      const tab = ahead(run, (o) => o.kind === "tab");
      if (tab && (extent(tab).x0 - WORLD.duckFront) / (run.v * tab.k) <= 0.3) input.duck = true;
    }
    const o = ahead(run, (o) => o.kind !== "plane" && (jumpTabs || o.kind !== "tab"));
    if (!o || pressed.has(o.id) || run.v <= 0) return;
    const e = extent(o);
    if (((e.x0 + e.x1) / 2 - cupCentre) / (run.v * o.k) <= HALF_AIR) {
      input.jumpPress = true;
      pressed.add(o.id);
    }
  };
}

/**
 * Takes off at a seeded point in the middle 60% of each obstacle's valid window, and presses duck at a
 * seeded moment 0.3 to 0.08 s before a tab arrives, releasing it the step the tab has passed.
 */
function jitterBot(seed: number, via?: (zone: "jump" | "duck") => "jump" | "duck"): Bot {
  const rnd = mulberry32(seed ^ 0x9e3779b9);
  const frac = new Map<number, number>();
  const duckAt = new Map<number, number>();
  const pressed = new Set<number>();
  const act = (a: "jump" | "duck") => (via ? via(a) : a);
  return (run, input) => {
    input.duck = false;
    const tab = ahead(run, (o) => o.kind === "tab");
    if (tab) {
      if (!duckAt.has(tab.id)) duckAt.set(tab.id, 0.08 + rnd() * 0.22);
      const toArrive = (extent(tab).x0 - WORLD.standFront) / (run.v * tab.k);
      if (toArrive <= duckAt.get(tab.id)!) input.duck = act("duck") === "duck";
    }
    const o = ahead(run, (o) => o.kind !== "tab" && o.kind !== "plane");
    if (!o || pressed.has(o.id) || run.v <= 0) return;
    if (!frac.has(o.id)) frac.set(o.id, 0.2 + rnd() * 0.6);
    const e = extent(o), u = run.v * o.k, a = rise(e.top);
    const arrive = (e.x0 - WORLD.standFront) / u, leave = (e.x1 - CUP_BACK) / u;
    const lo = leave - AIRTIME + a, hi = arrive - a;
    if (lo + frac.get(o.id)! * (hi - lo) <= 0) {
      input.jumpPress = act("jump") === "jump";
      pressed.add(o.id);
    }
  };
}

/* ───────────── engine ───────────── */

describe("runner: determinism", () => {
  it("replays the same run from the same seed", () => {
    const a = play(42, centredBot(false), 60);
    const b = play(42, centredBot(false), 60);
    expect(a.spawns).toEqual(b.spawns);
    expect(a.run.score).toBe(b.run.score);
    const c = play(43, centredBot(false), 60);
    expect(c.spawns.map((s) => s.kind)).not.toEqual(a.spawns.map((s) => s.kind));
  });
});

describe("runner: jump", () => {
  /** Jumps once from standing (after the run-up, in ghost mode), pressing for `holdSteps` steps. */
  function arc(holdSteps: number) {
    const run = createRun(1, { ghost: true });
    const input: Input = { jumpPress: false, duck: false };
    for (let i = 0; i < 240; i++) step(run, input);
    run.events.length = 0;
    let apex = 0, steps = 0;
    do {
      if (steps < holdSteps) input.jumpPress = true; // step() consumes the edge: press it again
      step(run, input);
      steps++;
      apex = Math.max(apex, run.y);
    } while (!run.grounded && steps < 500);
    return { run, apex, steps };
  }

  it("rises 75.1 u and lands on the 70th step (0.578 s)", () => {
    const { run, apex, steps } = arc(1);
    expect(apex).toBeCloseTo(75.1, 1);
    expect(steps).toBe(70);
    expect(run.y).toBe(0);
    expect(run.events.filter((e) => e.t === "jump")).toHaveLength(1);
    expect(run.events.filter((e) => e.t === "land")).toHaveLength(1);
  });

  it("is always a full jump, however long the press", () => {
    const tap = arc(1), hold = arc(40);
    expect(hold.apex).toBe(tap.apex);
    expect(hold.steps).toBe(70);
    expect(hold.run.events.filter((e) => e.t === "jump")).toHaveLength(1);
  });

  it("keeps jumping while the jump is held, and stops once it is let go", () => {
    const run = createRun(1, { ghost: true });
    const input: Input = { jumpPress: false, duck: false };
    for (let i = 0; i < 240; i++) step(run, input);
    run.events.length = 0;
    input.jumpPress = input.jumpHeld = true;
    for (let i = 0; i < 70 * 3; i++) step(run, input);
    expect(run.events.filter((e) => e.t === "jump")).toHaveLength(3);
    input.jumpHeld = false;
    for (let i = 0; i < 70 * 2; i++) step(run, input);
    expect(run.events.filter((e) => e.t === "jump")).toHaveLength(3); // the one in the air lands, no more
    expect(run.grounded).toBe(true);
  });

  it("jumps from a held duck, full height, and lands still ducked", () => {
    const run = createRun(1, { ghost: true });
    const input: Input = { jumpPress: false, duck: true };
    for (let i = 0; i < 240; i++) step(run, input);
    expect(run.ducking).toBe(true);
    run.events.length = 0;
    input.jumpPress = true; // duck still held: a second finger, or Space with ArrowDown down
    let apex = 0, steps = 0;
    do {
      step(run, input);
      steps++;
      apex = Math.max(apex, run.y);
    } while (!run.grounded && steps < 500);
    expect(apex).toBeCloseTo(75.1, 1);
    expect(steps).toBe(70);
    expect(run.ducking).toBe(true);
  });

  it("fast-falls on a fresh duck after a jump from a held duck", () => {
    const run = createRun(1, { ghost: true });
    const input: Input = { jumpPress: false, duck: true };
    for (let i = 0; i < 240; i++) step(run, input);
    input.jumpPress = true;
    for (let i = 0; i < 10; i++) step(run, input);
    input.duck = false;
    step(run, input);
    input.duck = true;
    let n = 0;
    while (!run.grounded) {
      step(run, input);
      n++;
    }
    expect(11 + n).toBeLessThan(40); // well before the 70 steps of a full jump
  });

  it("buffers a press made just before landing", () => {
    for (const [before, jumps] of [[0.08, true], [0.15, false]] as const) {
      const run = createRun(1, { ghost: true });
      const input: Input = { jumpPress: false, duck: false };
      for (let i = 0; i < 240; i++) step(run, input);
      input.jumpPress = true;
      step(run, input); // take off
      const pressAt = 70 - Math.round(before / DT);
      for (let i = 1; i < 70; i++) {
        if (i === pressAt) input.jumpPress = true;
        step(run, input);
      }
      run.events.length = 0;
      step(run, input); // the first step on the ground
      expect(run.events.some((e) => e.t === "jump")).toBe(jumps);
    }
  });

  it("fast-falls from the apex in under 0.15 s", () => {
    const run = createRun(1, { ghost: true });
    const input: Input = { jumpPress: false, duck: false };
    for (let i = 0; i < 240; i++) step(run, input);
    input.jumpPress = true;
    for (let i = 0; i < 35; i++) step(run, input);
    input.duck = true;
    let n = 0;
    while (!run.grounded) {
      step(run, input);
      n++;
    }
    expect(n * DT).toBeLessThan(0.15);
    expect(run.ducking).toBe(true);
  });
});

describe("runner: hitboxes", () => {
  /** A run with one hand-placed tab `lead` units ahead of the cup's front. */
  function withTab(lead: number) {
    const run = createRun(5);
    run.t = 10;
    run.v = speedAt(10);
    run.obstacles.length = 0;
    run.untilNext = 1e9;
    const tab = createRun(5).obstacles[0];
    Object.assign(tab, { id: 999, kind: "tab", y: 28, w: 40, h: 14, k: 1.08, boxes: obstacleBoxes({ kind: "tab" } as Obstacle) });
    tab.x = tab.px = WORLD.standFront + lead - obstacleBoxes(tab)[0][0];
    run.obstacles.push(tab);
    return run;
  }
  /** A run with one hand-placed plane `lead` units ahead of the cup's front. */
  function withPlane(lead: number) {
    const run = withTab(0);
    const plane = run.obstacles[0];
    Object.assign(plane, { kind: "plane", y: 50, w: 36, h: 16, k: 1, boxes: obstacleBoxes({ kind: "plane" } as Obstacle) });
    plane.x = plane.px = WORLD.standFront + lead - obstacleBoxes(plane)[0][0];
    return run;
  }
  const pass = (run: Run, input: Input) => {
    for (let i = 0; i < 120 && !run.crashed; i++) step(run, input);
    return run.crashed;
  };

  it("lets a ducking cup under the tab and stops a standing one", () => {
    expect(pass(withTab(30), { jumpPress: false, duck: true })).toBe(false);
    expect(pass(withTab(30), { jumpPress: false, duck: false })).toBe(true);
  });

  it("lets a cup on the floor under the plane, standing or ducking, and stops a jumping one", () => {
    expect(pass(withPlane(30), { jumpPress: false, duck: false })).toBe(false);
    expect(pass(withPlane(30), { jumpPress: false, duck: true })).toBe(false);
    // Taking off as the plane arrives: the rising cup meets it.
    expect(pass(withPlane(10), { jumpPress: true, duck: false })).toBe(true);
  });

  it("lets a full jump over the tab", () => {
    const run = withTab(200);
    const tab = run.obstacles[0];
    const input: Input = { jumpPress: false, duck: false };
    // Take off when the tab's centre is half an airtime from the cup's.
    while (((extent(tab).x0 + extent(tab).x1) / 2 - cupCentre) / (run.v * 1.08) > HALF_AIR) step(run, input);
    input.jumpPress = true;
    let overlapped = 0;
    while (extent(tab).x1 > CUP_BACK) {
      step(run, input);
      expect(run.crashed).toBe(false);
      // While the tab is over the cup's width, the cup is in the air above it.
      if (extent(tab).x0 < WORLD.standFront && extent(tab).x1 > CUP_BACK) {
        overlapped++;
        expect(run.grounded).toBe(false);
      }
    }
    expect(overlapped).toBeGreaterThan(0);
  });

  it("tucks the legs in the air", () => {
    const run = createRun(1, { ghost: true });
    const input: Input = { jumpPress: false, duck: false };
    for (let i = 0; i < 240; i++) step(run, input);
    expect(cupBoxes(run)[1]).toEqual([9, 0, 21, 12]);
    input.jumpPress = true;
    step(run, input);
    expect(cupBoxes(run)[1]).toEqual([10, 4, 24, 12]);
  });

  it("never collides on touching edges", () => {
    const run = createRun(2);
    run.obstacles.length = 0;
    run.untilNext = 1e9;
    const o = createRun(2).obstacles[0]; // the poster stool
    o.x = o.px = WORLD.standFront - Math.min(...obstacleBoxes(o).map((b) => b[0])); // its seat just touches
    run.obstacles.push(o);
    run.v = 0;
    run.t = 0;
    // Freeze the world: speed 0 at t = 0 moves nothing in one step.
    const input: Input = { jumpPress: false, duck: false };
    const t0 = run.t;
    run.t = -DT; // speedAt(0) = 0
    step(run, input);
    expect(run.t).toBeCloseTo(t0, 9);
    expect(run.crashed).toBe(false);
  });
});

describe("runner: crash", () => {
  it("freezes the run at the first collision", () => {
    const { run, events } = play(7, null, 30);
    expect(run.crashed).toBe(true);
    const crash = events.find((e) => e.t === "crash");
    expect(crash && crash.t === "crash" && crash.score).toBe(run.score);
    const snapshot = JSON.stringify({ s: run.score, t: run.t, d: run.dist, o: run.obstacles.map((o) => o.x) });
    step(run, { jumpPress: true, duck: false });
    expect(JSON.stringify({ s: run.score, t: run.t, d: run.dist, o: run.obstacles.map((o) => o.x) })).toBe(snapshot);
    expect(poseOf(run, run.t, false)).toBe("crash");
  });
});

describe("runner: speed and score", () => {
  it("runs up from standing, then accelerates to the cap", () => {
    expect(speedAt(0)).toBe(0);
    expect(speedAt(0.6)).toBeCloseTo(165, 9);
    expect(speedAt(1.2)).toBeCloseTo(330, 9);
    expect(speedAt(31.2)).toBeCloseTo(510, 9);
    expect(speedAt(61.2)).toBeCloseTo(690, 9);
    expect(speedAt(1e4)).toBe(690);
    let prev = -1;
    for (let t = 0; t < 120; t += 0.05) {
      expect(speedAt(t)).toBeGreaterThanOrEqual(prev);
      prev = speedAt(t);
    }
  });

  it("scores a point per 40 u, never backwards, one milestone per hundred", () => {
    const { run, events } = play(3, null, 120, { ghost: true });
    expect(run.score).toBe(Math.floor(run.dist / 40));
    const milestones = events.filter((e) => e.t === "milestone").map((e) => (e.t === "milestone" ? e.score : 0));
    expect(milestones).toEqual(Array.from({ length: Math.floor(run.score / 100) }, (_, i) => (i + 1) * 100));
  });

  it("caps the score at 99 999", () => {
    const run = createRun(3, { ghost: true });
    run.t = 200;
    run.dist = 99_999 * 40 - 3;
    const input: Input = { jumpPress: false, duck: false };
    for (let i = 0; i < 60; i++) step(run, input);
    expect(run.score).toBe(99_999);
  });

  it("announces a new record once, and only over an existing one", () => {
    const withBest = play(3, null, 30, { ghost: true, best: 50 }).events.filter((e) => e.t === "newBest");
    expect(withBest).toHaveLength(1);
    expect(withBest[0].t === "newBest" && withBest[0].score).toBe(51);
    expect(play(3, null, 30, { ghost: true, best: 0 }).events.some((e) => e.t === "newBest")).toBe(false);
  });
});

describe("runner: the opening and the unlocks", () => {
  it("opens with the poster's stool, 1.68 s away", () => {
    const run = createRun(11, { ghost: true });
    expect(run.obstacles).toHaveLength(1);
    expect(run.obstacles[0]).toMatchObject({ kind: "stool", x: 440 });
    const input: Input = { jumpPress: false, duck: false };
    while (extent(run.obstacles[0]).x0 > WORLD.standFront) step(run, input);
    expect(run.t).toBeGreaterThan(1.6);
    expect(run.t).toBeCloseTo(1.68, 1);
  });

  it("keeps to the unlocks and the order rules on every seed", () => {
    for (let seed = 1; seed <= 60; seed++) {
      const { spawns } = play(seed, null, 150, { ghost: true });
      expect(spawns.slice(0, 3).every((s) => s.kind === "stool" || s.kind === "stack3")).toBe(true);
      for (const s of spawns) {
        if (s.kind === "medovik") expect(s.score).toBeGreaterThanOrEqual(UNLOCK.medovik);
        if (s.kind === "tab") expect(s.score).toBeGreaterThanOrEqual(UNLOCK.tab);
        if (s.kind === "plane") expect(s.score).toBeGreaterThanOrEqual(UNLOCK.plane);
        if (s.kind === "stack4" || s.kind === "stools") expect(s.score).toBeGreaterThanOrEqual(UNLOCK.stack4);
      }
      const kinds = ["stool" as ObstacleKind, ...spawns.map((s) => s.kind)];
      for (let i = 1; i < kinds.length; i++) {
        expect(kinds[i] === "tab" && kinds[i - 1] === "tab").toBe(false);
        expect(kinds[i] === "plane" && kinds[i - 1] === "plane").toBe(false);
      }
      for (let i = 2; i < kinds.length; i++) expect(kinds[i] === kinds[i - 1] && kinds[i] === kinds[i - 2]).toBe(false);
      // The first obstacle to spawn at 120 points or more is the first tab.
      const at = spawns.findIndex((s) => s.score >= UNLOCK.tab);
      expect(spawns[at].kind).toBe("tab");
      expect(spawns.findIndex((s) => s.kind === "tab")).toBe(at);
    }
  });
});

describe("runner: fairness", () => {
  it("leaves at least 0.6 s between one obstacle leaving the cup and the next arriving", () => {
    // Back-to-back full jumps need about 0.2 s here; 0.6 s is the floor the spawn gaps guarantee.
    let min = Infinity;
    for (let seed = 1; seed <= 300; seed++) {
      const run = createRun(seed, { ghost: true });
      const input: Input = { jumpPress: false, duck: false };
      const left = new Map<number, number>(), arrived = new Map<number, number>();
      for (let i = 0; i < 150 / DT; i++) {
        step(run, input);
        run.events.length = 0;
        for (const o of run.obstacles) {
          const e = extent(o);
          const front = o.kind === "tab" ? WORLD.duckFront : WORLD.standFront;
          if (!arrived.has(o.id) && e.x0 <= front) arrived.set(o.id, run.t);
          if (!left.has(o.id) && e.x1 <= CUP_BACK) left.set(o.id, run.t);
        }
      }
      const ids = [...arrived.keys()].sort((a, b) => a - b);
      for (let i = 1; i < ids.length; i++) {
        const prevLeft = left.get(ids[i - 1]);
        if (prevLeft != null) min = Math.min(min, arrived.get(ids[i])! - prevLeft);
      }
    }
    expect(min).toBeGreaterThanOrEqual(0.6);
  }, 60_000);

  const SEEDS = Array.from({ length: 120 }, (_, i) => i + 1);
  const clean = (bot: (seed: number) => Bot) => {
    const crashed = SEEDS.filter((seed) => play(seed, bot(seed), 150).run.crashed);
    expect(crashed).toEqual([]);
  };
  it("is cleared by centred jumps and ducks", () => clean(() => centredBot(false)), 60_000);
  it("is cleared by jumps alone (touch without ducking)", () => clean(() => centredBot(true)), 60_000);
  it("is cleared anywhere in the middle of every window", () => clean((seed) => jitterBot(seed)), 60_000);
  it("is cleared through the touch zones", () =>
    clean((seed) => jitterBot(seed, (a) => touchZone(a === "duck" ? 0.9 * 149 : 0.3 * 149, 149))), 60_000);
});

describe("runner: pausing", () => {
  /** Sim seconds until an obstacle (by predicate, it may not have spawned yet) reaches the cup's front. */
  function timeToArrive(run: Run, pick: (o: Obstacle) => boolean) {
    run.ghost = true; // measure the world, not the cup
    const input: Input = { jumpPress: false, duck: false };
    let n = 0;
    for (;;) {
      const o = run.obstacles.find(pick);
      if (o && extent(o).x0 <= WORLD.standFront) return n * DT;
      step(run, input);
      run.events.length = 0;
      if (++n > 10_000) throw new Error("never arrived");
    }
  }

  it("gives the next obstacle at least 0.9 s after a resume, keeping the gaps behind it", () => {
    const { run } = play(21, centredBot(false), 20);
    const input: Input = { jumpPress: false, duck: false };
    const next = () => run.obstacles.find((o) => extent(o).x0 >= WORLD.standFront)!;
    // Wind forward until the next obstacle is 0.1 s away.
    while ((extent(next()).x0 - WORLD.standFront) / (run.v * next().k) > 0.1) {
      step(run, input);
      run.events.length = 0;
    }
    const o = next();
    const i = run.obstacles.indexOf(o);
    const gaps = run.obstacles.slice(i + 1).map((b, j) => b.x - run.obstacles[i + j].x);
    const until = run.untilNext, before = o.x;
    resumeGrace(run);
    const after = run.obstacles.slice(i + 1).map((b, j) => b.x - run.obstacles[i + j].x);
    after.forEach((g, j) => expect(g).toBeCloseTo(gaps[j], 9));
    expect(run.untilNext - until).toBeCloseTo(o.x - before, 9);
    const lead = timeToArrive(run, (b) => b === o);
    expect(lead).toBeGreaterThanOrEqual(0.9 - DT);
    expect(lead).toBeLessThan(1);
  });

  it("keeps the lead during the run-up, when the speed is still climbing", () => {
    const run = createRun(3, { ghost: true });
    const input: Input = { jumpPress: false, duck: false };
    for (let i = 0; i < 113; i++) step(run, input); // t ≈ 0.94 s, the stool about 0.73 s away
    const stool = run.obstacles[0];
    resumeGrace(run);
    expect(timeToArrive(run, (o) => o === stool)).toBeGreaterThanOrEqual(0.9 - DT);
  });

  it("holds back the obstacle about to spawn when nothing is ahead on screen", () => {
    const run = createRun(4, { ghost: true });
    run.t = 110;
    run.v = speedAt(110);
    run.score = 5000;
    run.obstacles.length = 0;
    run.nextKind = "tab";
    run.untilNext = 2;
    const firstId = run.nextId;
    resumeGrace(run);
    expect(timeToArrive(run, (o) => o.id === firstId)).toBeGreaterThanOrEqual(0.9 - DT);
  });

  it("leaves an obstacle under a mid-air cup alone, and the jump clears it", () => {
    const run = createRun(1);
    const stool = run.obstacles[0];
    const input: Input = { jumpPress: false, duck: false };
    while (((extent(stool).x0 + extent(stool).x1) / 2 - cupCentre) / Math.max(run.v, 1) > HALF_AIR) step(run, input);
    input.jumpPress = true;
    while (run.grounded || extent(stool).x0 >= WORLD.standFront) step(run, input);
    expect(run.grounded).toBe(false);
    const x = stool.x;
    resumeGrace(run);
    expect(stool.x).toBe(x);
    for (let i = 0; i < 120 && !run.grounded; i++) step(run, input);
    expect(run.grounded).toBe(true);
    expect(run.crashed).toBe(false);
  });

  it("keeps a cup ducked under a passing tab after the keys are released", () => {
    const run = createRun(5);
    run.t = 10;
    run.v = speedAt(10);
    run.obstacles.length = 0;
    run.untilNext = 1e9;
    const tab = createRun(5).obstacles[0];
    Object.assign(tab, { id: 7, kind: "tab", y: 28, w: 40, h: 14, k: 1.08, boxes: obstacleBoxes({ kind: "tab" } as Obstacle) });
    tab.x = tab.px = 70;
    run.obstacles.push(tab);
    const input: Input = { jumpPress: false, duck: true };
    step(run, input);
    expect(run.ducking).toBe(true);
    input.duck = false;
    releaseAll(run);
    for (let i = 0; i < 60; i++) step(run, input);
    expect(run.crashed).toBe(false);
    expect(run.ducking).toBe(false); // released once the tab had passed
  });

  it("otherwise drops held keys and the buffer", () => {
    const run = createRun(1, { ghost: true });
    const input: Input = { jumpPress: false, duck: true };
    for (let i = 0; i < 10; i++) step(run, input);
    run.buffer = 0.05;
    releaseAll(run);
    expect(run.duckHeld).toBe(false);
    expect(run.buffer).toBe(0);
  });
});

describe("runner: phases, camera, touch zones", () => {
  it("moves between phases only on valid actions", () => {
    const table: [Phase, "start" | "pause" | "resume" | "crash", Phase][] = [
      ["idle", "start", "running"], ["idle", "pause", "idle"], ["idle", "resume", "idle"], ["idle", "crash", "idle"],
      ["running", "pause", "paused"], ["running", "crash", "over"], ["running", "start", "running"], ["running", "resume", "running"],
      ["paused", "resume", "running"], ["paused", "start", "running"], ["paused", "pause", "paused"], ["paused", "crash", "paused"],
      ["over", "start", "running"], ["over", "pause", "over"], ["over", "resume", "over"], ["over", "crash", "over"],
    ];
    for (const [from, action, to] of table) expect(nextPhase(from, action)).toBe(to);
  });

  it("frames a 390px phone with a readable cup and the desktop's lead time", () => {
    const c = camera(358, 149);
    expect(c.scale).toBeCloseTo(0.687, 2);
    expect(c.viewW).toBeCloseTo(521, 0);
    expect(c.pace).toBe(0.8);
    expect(44 * c.scale).toBeGreaterThanOrEqual(28);
  });

  it("never shows more than the world, nor crops the jump", () => {
    for (let w = 288; w <= 2400; w += 8) {
      for (const aspect of [12 / 5, 3, 4]) {
        const c = camera(w, w / aspect);
        expect(c.viewW).toBeLessThanOrEqual(640 + 1e-9);
        expect(c.viewW).toBeLessThan(WORLD.spawnX);
        expect(c.viewH).toBeGreaterThanOrEqual(WORLD.hMin);
      }
    }
  });

  it("gives every frame the same reaction lead time within 3%", () => {
    const frames = [[358, 149], [780, 260], [1342, 336], [1789, 447], [2386, 597]];
    const leads = frames.map(([w, h]) => {
      const c = camera(w, h);
      return (c.viewW - WORLD.standFront) / (330 * c.pace);
    });
    const [min, max] = [Math.min(...leads), Math.max(...leads)];
    expect(max / min).toBeLessThan(1.03);
  });

  it("ducks from the lower third, jumps above it", () => {
    expect(touchZone(0, 150)).toBe("jump");
    expect(touchZone(99.9, 150)).toBe("jump");
    expect(touchZone(100, 150)).toBe("duck");
    expect(touchZone(150, 150)).toBe("duck");
  });
});

/* ───────────── art ───────────── */

/** Every coordinate pair of an absolute-command path (M, L, C, Q, Z only). */
function points(d: string) {
  expect(d).toMatch(/^[MLCQZ0-9.\s,-]+$/);
  const n = d.match(/-?\d*\.?\d+/g)!.map(Number);
  const out: [number, number][] = [];
  for (let i = 0; i < n.length; i += 2) out.push([n[i], n[i + 1]]);
  return out;
}

describe("runner: art", () => {
  it("draws every sprite inside its box, and every hitbox inside the drawing", () => {
    for (const [name, art] of Object.entries(ARTS)) {
      const all = art.paths.flatMap(points);
      expect(all.length, name).toBeGreaterThan(0);
      for (const [x, y] of all) {
        expect(x, name).toBeGreaterThanOrEqual(-0.01);
        expect(x, name).toBeLessThanOrEqual(art.w + 0.01);
        expect(y, name).toBeGreaterThanOrEqual(-0.01);
        expect(y, name).toBeLessThanOrEqual(art.h + 0.01);
      }
      const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
      const [bx0, bx1, by0, by1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
      for (const [x0, y0, x1, y1] of art.boxes) {
        // Hitboxes are y-up from the sprite's foot; the art is SVG y-down.
        expect(x0, name).toBeGreaterThanOrEqual(bx0 - 0.01);
        expect(x1, name).toBeLessThanOrEqual(bx1 + 0.01);
        expect(art.h - y1, name).toBeGreaterThanOrEqual(by0 - 0.01);
        expect(art.h - y0, name).toBeLessThanOrEqual(by1 + 0.01);
      }
    }
  });

  it("has a cup for every pose and a torn tab in two flutter frames", () => {
    for (const pose of ["stand", "runA", "runB", "air", "duckA", "duckB", "crash"] as const) expect(CUP_ART[pose]).toBeDefined();
    expect(TAB_ART).toHaveLength(2);
  });
});

/* ───────────── best score and copy ───────────── */

describe("runner: best score", () => {
  it("reads only a valid record", () => {
    expect(parseBest(null)).toBe(0);
    expect(parseBest("")).toBe(0);
    expect(parseBest("junk")).toBe(0);
    expect(parseBest("1280")).toBe(0);
    expect(parseBest(JSON.stringify({ v: 2, best: 10 }))).toBe(0);
    expect(parseBest(JSON.stringify({ v: 1, best: -1 }))).toBe(0);
    expect(parseBest(JSON.stringify({ v: 1, best: 1.5 }))).toBe(0);
    expect(parseBest(JSON.stringify({ v: 1, best: BEST_MAX + 1 }))).toBe(0);
    expect(parseBest(JSON.stringify({ v: 1, best: "1280" }))).toBe(0);
    expect(parseBest(serializeBest(1280))).toBe(1280);
    expect(parseBest(serializeBest(0))).toBe(0);
  });
  it("pads the HUD to five digits", () => {
    expect(pad5(0)).toBe("00000");
    expect(pad5(412)).toBe("00412");
    expect(pad5(99_999)).toBe("99999");
  });
});

describe("runner: copy", () => {
  it("has no dashes and reads the result plainly", () => {
    const strings = [
      ...Object.values(ru.game).filter((v) => typeof v === "string"),
      ru.notFound.game,
      ru.game.result(412, 1280, false),
      ru.game.result(1280, 1280, true),
    ];
    for (const s of strings) expect(s).not.toMatch(/[\u2013\u2014]/);
    expect(ru.game.result(412, 1280, false)).toBe("Стаканчик опрокинулся. Счёт 412, рекорд 1 280.");
    expect(ru.game.result(1280, 1280, true)).toBe("Новый рекорд: 1 280.");
  });
});
