// Snow in the runner's world («С наступающим!», docs/CONVENTIONS.md, «The runner»). No DOM: the game's
// drawer (src/components/game/runner-draw.ts) steps it every frame of a run and paints it; runner-snow.test.ts
// drives it. World units as the engine's (src/lib/runner.ts): y up, the floor at y = 0, a window of about
// 640 × 217 u, the floor scrolling by the distance run.
//
// The flakes here are the game's own count of the snow (the page's snow is what is seen falling: it streams
// over the whole section at these same speeds while a run is in play; see run-stream.ts). It snows in the world
// the cup runs through, not on the glass: a flake by the play's own depth (z ≈ 1)
// streams back past the cup exactly as fast as the floor does, the far ones slower and the near ones faster
// (parallax). Flakes at the play's depth that come down on the floor or on an obstacle stay there. The floor
// carries an even dusting (seeded by the distance, so it is the same wherever the floor comes round) that
// what lands builds up; the cup's feet pack it down as it runs, so it leaves a track (with gaps where it
// jumped), and its landings, slides and crashes kick some up. The stools, the stacks of cups and the medovik
// come in already wearing caps, which the snow at their depth adds to.

import { mulberry32 } from "./seed";

export type GameFlake = { x: number; y: number; z: number; r: number; ph: number; w: number };
export type Puff = { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number };

export const GSNOW = {
  /** Flakes in the window. */
  count: 80,
  /** The floor's cells, u, and its dusting (mean depth, u). */
  cell: 2,
  dusting: 2.6,
  /** How deep the floor's snow can get, u, and how much a landed flake adds. */
  deep: 5.2,
  grain: 0.05,
  /** Packed under the cup: running feet, and the body sliding (share of the depth left). */
  packed: 0.5,
  slid: 0.3,
  /** Caps on the obstacles: how deep they come in, at most, and how much a flake adds. */
  capFrom: 2,
  capTo: 3.6,
  capMax: 5.4,
  /** Fall, u/s: far flakes and near. */
  fallFar: 18,
  fallNear: 50,
  /** The air: a breeze toward the cup's back, gusting, u/s. */
  wind: -6,
  gust: 7,
  /** Kicked-up snow: gravity and air drag. */
  g: 420,
  drag: 2.2,
};

/** Where an obstacle's top is, for its cap: spans in its own drawing (x from its left, y down from its
 *  top, as runner-art draws it), each from (x0, y0) to (x1, y1). Flying things carry none. */
export const TOPS: Record<string, readonly (readonly [number, number, number, number])[]> = {
  stool: [[1, 1, 25, 1]],
  stools: [[1, 1, 25, 1], [33, 1, 57, 1]],
  stack3: [[1, 1, 17, 1]],
  stack4: [[1, 1, 17, 1]],
  medovik: [[1, 7, 63, 2]],
};

export type GameSnow = {
  flakes: GameFlake[];
  puffs: Puff[];
  /** What has landed on (or been packed out of) the floor's dusting, per cell of floor distance. */
  floor: Map<number, number>;
  /** Each obstacle's cap, by its id. */
  caps: Map<number, number>;
  time: number;
  /** The floor's offset at the last step, and the kick-up's running count. */
  off: number;
  kick: number;
  rnd: () => number;
};

/** The floor's dusting at distance x: smooth drifts, the same every time the floor comes round. */
export function dusting(x: number): number {
  return GSNOW.dusting + 0.5 * Math.sin(x / 23.1) + 0.3 * Math.sin(x / 7.7 + 1.7) + 0.12 * Math.sin(x / 3.1 + 0.4);
}

const cellOf = (x: number) => Math.floor(x / GSNOW.cell);

/** The snow's depth on the floor at distance x (u). */
export function floorDepth(s: GameSnow, x: number): number {
  return Math.max(0, Math.min(GSNOW.deep, dusting(x) + (s.floor.get(cellOf(x)) ?? 0)));
}

function addFloor(s: GameSnow, x: number, dy: number) {
  const c = cellOf(x);
  const now = dusting(x) + (s.floor.get(c) ?? 0);
  const next = Math.max(0, Math.min(GSNOW.deep, now + dy));
  s.floor.set(c, next - dusting(x));
}

/** Packs the floor between distances x0 and x1 down to `share` of its depth (never deeper). */
function pack(s: GameSnow, x0: number, x1: number, share: number) {
  for (let c = cellOf(x0); c <= cellOf(x1); c++) {
    const x = (c + 0.5) * GSNOW.cell;
    const d = dusting(x) + (s.floor.get(c) ?? 0);
    const target = Math.min(d, Math.max(share * dusting(x), 0.35));
    s.floor.set(c, target - dusting(x));
  }
}

function newFlake(rnd: () => number, viewW: number, viewH: number, top: boolean): GameFlake {
  const z = 0.25 + Math.pow(rnd(), 0.9) * 1.25;
  return {
    // Spread past the right edge: the snow streams in from there as the cup runs.
    x: rnd() * (viewW + 80),
    y: top ? viewH + rnd() * 24 : rnd() * viewH,
    z,
    r: 0.45 + 0.6 * z * z,
    ph: rnd() * Math.PI * 2,
    w: 1.6 + rnd() * 3,
  };
}

export function makeGameSnow(seed: number, viewW: number, viewH: number, off = 0): GameSnow {
  const rnd = mulberry32(seed);
  return {
    flakes: Array.from({ length: GSNOW.count }, () => newFlake(rnd, viewW, viewH, false)),
    puffs: [],
    floor: new Map(),
    caps: new Map(),
    time: 0,
    off,
    kick: 0,
    rnd,
  };
}

/** The obstacle as the snow sees it: where it is in the window (its left edge), its foot, its kind and height. */
export type SnowObstacle = { id: number; kind: string; x: number; y: number; h: number };
/** The cup as the snow sees it. */
export type SnowCup = { x: number; y: number; grounded: boolean; ducking: boolean; crashed: boolean; speed: number };

/** An obstacle's cap: a few drifts it brought along, then whatever lands on it. */
export function capOf(s: GameSnow, o: SnowObstacle): number {
  if (!TOPS[o.kind] || o.y > 0) return 0;
  let c = s.caps.get(o.id);
  if (c === undefined) {
    c = GSNOW.capFrom + s.rnd() * (GSNOW.capTo - GSNOW.capFrom);
    s.caps.set(o.id, c);
  }
  return c;
}

/** The top of an obstacle (world y, u) under window x, or null if x is off its tops. */
export function topAt(o: SnowObstacle, x: number): number | null {
  const tops = TOPS[o.kind];
  if (!tops || o.y > 0) return null;
  const lx = x - o.x;
  for (const [x0, y0, x1, y1] of tops) {
    if (lx < x0 || lx > x1) continue;
    const yDown = y0 + ((y1 - y0) * (lx - x0)) / (x1 - x0);
    return o.y + o.h - yDown;
  }
  return null;
}

/** Snow kicked up at window (x, y): `n` grains, flung up and out at up to `power` u/s, `back` setting how
 *  much they lean against the run. */
export function kickUp(s: GameSnow, x: number, y: number, n: number, power: number, back = 0.5) {
  for (let k = 0; k < n; k++) {
    const a = Math.PI * (0.15 + 0.7 * s.rnd());
    const v = power * (0.35 + 0.65 * s.rnd());
    const max = 0.45 + s.rnd() * 0.5;
    s.puffs.push({
      x: x + (s.rnd() - 0.5) * 6,
      y: y + s.rnd() * 2,
      vx: Math.cos(a) * v - back * power * 0.4,
      vy: Math.sin(a) * v,
      life: max,
      max,
      r: 0.5 + s.rnd() * 0.9,
    });
  }
}

/** The kicked-up grains, `dt` seconds on: they go back with the floor (`travel`, u), fall, slow in the air,
 *  and settle where they land. */
export function flyPuffs(s: GameSnow, dt: number, off: number, travel = 0) {
  for (const p of s.puffs) {
    p.life -= dt;
    p.vy -= GSNOW.g * dt;
    const keep = Math.exp(-GSNOW.drag * dt);
    p.vx *= keep;
    p.vy *= keep;
    p.x += p.vx * dt - travel;
    p.y += p.vy * dt;
    if (p.y <= floorDepth(s, off + p.x) && p.vy < 0) {
      addFloor(s, off + p.x, GSNOW.grain * 0.5);
      p.life = 0;
    }
  }
  s.puffs = s.puffs.filter((p) => p.life > 0 && p.x > -20);
}

/**
 * One frame: `dt` seconds of the guest's time and the floor's new offset `off` (the distance run, as the
 * frame draws it). Moves the flakes (the floor's travel since the last frame streams them back, by depth),
 * lands those at the play's depth on the floor or a cap, packs the cup's track, kicks snow from its feet,
 * and flies the kicked-up grains.
 */
export function stepGameSnow(s: GameSnow, dt: number, off: number, viewW: number, viewH: number, cup: SnowCup, obstacles: readonly SnowObstacle[]) {
  const travel = off - s.off;
  s.off = off;
  if (!(dt > 0)) return;
  s.time += dt;
  const gust = GSNOW.wind + GSNOW.gust * Math.sin(s.time * 0.37) * Math.sin(s.time * 0.11 + 1);
  for (const f of s.flakes) {
    f.ph += f.w * dt;
    f.x += -travel * (0.3 + 0.7 * f.z) + (gust * f.z + Math.cos(f.ph) * (1.5 + 2.5 * f.z)) * dt;
    f.y -= (GSNOW.fallFar + (GSNOW.fallNear - GSNOW.fallFar) * Math.min(1, f.z)) * dt;
    // At the play's depth, the floor and the caps catch it.
    let caught = false;
    if (f.z > 0.82 && f.z < 1.15) {
      for (const o of obstacles) {
        const top = topAt(o, f.x);
        if (top === null) continue;
        const cap = capOf(s, o);
        if (f.y <= top + cap && f.y > top - 3) {
          s.caps.set(o.id, Math.min(GSNOW.capMax, cap + GSNOW.grain * 1.2));
          caught = true;
          break;
        }
      }
      if (!caught && f.y <= floorDepth(s, off + f.x)) {
        addFloor(s, off + f.x, GSNOW.grain);
        caught = true;
      }
    }
    if (caught || f.y < -8) Object.assign(f, newFlake(s.rnd, viewW, viewH, true));
    else if (f.x < -10) f.x += viewW + 20 + s.rnd() * 40;
    else if (f.x > viewW + 90) f.x -= viewW + 100;
  }
  // The cup's track: its feet pack the snow as it runs; sliding, its body packs a wider, flatter band.
  if (cup.grounded && !cup.crashed && cup.y <= 0.01) {
    const [a, b, share] = cup.ducking ? [2, 40, GSNOW.slid] : [8, 23, GSNOW.packed];
    pack(s, off + cup.x + a, off + cup.x + b, share);
    // A stride throws a little snow off the back; a slide sprays it ahead of the lid.
    s.kick += dt * Math.min(2, cup.speed / 330) * (cup.ducking ? 26 : 7);
    while (s.kick >= 1) {
      s.kick -= 1;
      if (cup.ducking) kickUp(s, cup.x + 40, 1, 1, 70, -0.6);
      else kickUp(s, cup.x + 12, 1, 1, 45, 0.9);
    }
  }
  flyPuffs(s, dt, off, travel);
  // Forget the floor and the caps the window has left behind.
  const gone = cellOf(off - 60);
  for (const c of s.floor.keys()) if (c < gone) s.floor.delete(c);
  for (const id of s.caps.keys()) if (!obstacles.some((o) => o.id === id)) s.caps.delete(id);
}
