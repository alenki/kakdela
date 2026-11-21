// The garland («С наступающим!», docs/CONVENTIONS.md): a string of lights hung on nails under the header at the
// top of every page. This file is its layout and its physics, with no DOM (garland.test.ts drives it);
// src/components/season/garland-controller.ts draws it and gives it the page's motion and the guest's hand.
//
// The bulbs are the song's notes (src/lib/melody.ts), one to a bulb in order, so a hand run along the garland
// plays «В лесу родилась ёлочка», and a nail holds every four. The physics sees a real garland whatever its
// size on the screen (bulbs 12 cm apart): an inextensible
// cord of nodes pinned on the nails, each bulb a pendulum on its socket's lead. Position-based dynamics in
// small fixed steps (one projection per step, 1.2 kHz), in metres and seconds, y down from the nails.

import { VERSE } from "./melody";

/** Bulbs hang 12 cm apart. */
export const PITCH_M = 0.12;

export const PHYS = {
  /** Integration step, s. */
  step: 1 / 1200,
  gravity: 9.81,
  /** The cord's mass per metre (two twisted wires), kg/m. */
  cordDensity: 0.02,
  /** A bulb with its socket, kg. */
  bulbMass: 0.006,
  /** The socket's lead, from the cord to the bulb's centre of mass, m. */
  stem: 0.026,
  /** How much longer than its swag the cord is (about a tenth of the swag in sag). */
  slack: 0.022,
  /** The air and the wire's own friction: the share of velocity lost per second. */
  damping: 0.85,
  /** A bulb's glass, as something the hand can meet (radius, m). */
  bulbRadius: 0.014,
  /** The hand's touch: a soft push, N per metre it presses in (a quick pass nudges, a slow one carries). */
  touch: 8,
  /** At rest: every particle slower than this, m/s. */
  restSpeed: 0.003,
};

export type Layout = {
  /** The garland's box, px. */
  width: number;
  /** From bulb to bulb, px. */
  pitch: number;
  pxPerM: number;
  /** The first nail's x (the gutter), px. */
  margin: number;
  /** Half-verses hung: 1 on a phone, up to 4 on a wide screen (the song goes round). */
  halves: number;
  /** The garland's length in bulbs. */
  length: number;
  /** The nails, in bulb pitches from the first. */
  nails: number[];
  /** The bulbs in order: where (pitches from the first nail to its left half-pitch), its note's pitch, and its
   *  place in the verse. */
  bulbs: { t: number; midi: number; note: number }[];
};

const VERSE_NOTES = VERSE[0].length + VERSE[1].length;

/**
 * Hangs the song across a width: as many half-verses (fourteen notes each) as bring the bulbs' pitch closest
 * to `target` px, between nails at the gutters, a nail every four bulbs (as near as whole bulbs allow, so the
 * swags come out even; a nail never stands where a bulb hangs).
 */
export function layoutGarland(width: number, gutter: number, target: number): Layout {
  const span = Math.max(1, width - 2 * gutter);
  let halves = 1;
  let best = Infinity;
  for (let h = 1; h <= 4; h++) {
    const d = Math.abs(span / (h * VERSE[0].length) - target);
    if (d < best) {
      best = d;
      halves = h;
    }
  }
  const bulbs: Layout["bulbs"] = [];
  let t = 0;
  for (let h = 0; h < halves; h++) {
    for (const n of VERSE[h % 2]) {
      bulbs.push({ t, midi: n.midi, note: t % VERSE_NOTES });
      t++;
    }
  }
  const length = t;
  const pitch = span / length;
  const swags = Math.max(1, Math.round(length / 4));
  const nails = Array.from({ length: swags + 1 }, (_, k) => Math.round((k * length) / swags));
  return { width, pitch, pxPerM: pitch / PITCH_M, margin: gutter, halves, length, nails, bulbs };
}

export type Sim = {
  layout: Layout;
  /** Particles: the cord's nodes (two to an eighth, one on every nail), then the bulbs. */
  n: number;
  cord: number;
  x: Float64Array;
  y: Float64Array;
  px: Float64Array;
  py: Float64Array;
  /** Inverse masses (0: pinned, or held). */
  w: Float64Array;
  /** Each bulb's node on the cord. */
  attach: Int32Array;
  /** Each cord segment's length. */
  seg: Float64Array;
  /** Sim time, s, each bulb's last ring, and whether the hand was on it at the last frame. */
  time: number;
  rangAt: Float64Array;
  touch: Uint8Array;
  /** The step time not yet taken, s. */
  acc: number;
  damping: number;
};

/** The rig, roughly hung: the cord in parabolas of its length between the nails, the bulbs straight under it.
 *  settle() lets it find its own rest. */
export function buildGarland(layout: Layout): Sim {
  const half = PITCH_M / 2;
  const cord = layout.length * 2 + 1;
  const n = cord + layout.bulbs.length;
  const x = new Float64Array(n), y = new Float64Array(n), w = new Float64Array(n);
  const seg = new Float64Array(cord - 1).fill(half * (1 + PHYS.slack));
  const nails = new Set(layout.nails.map((e) => e * 2));
  const nodeMass = PHYS.cordDensity * half * (1 + PHYS.slack);
  for (let i = 0; i < cord; i++) {
    x[i] = i * half;
    w[i] = nails.has(i) ? 0 : 1 / nodeMass;
  }
  for (let k = 0; k + 1 < layout.nails.length; k++) {
    const a = layout.nails[k] * 2, b = layout.nails[k + 1] * 2;
    const sag = (b - a) * half * Math.sqrt((3 * PHYS.slack) / 8);
    for (let i = a; i <= b; i++) {
      const u = (i - a) / (b - a);
      y[i] = 4 * sag * u * (1 - u);
    }
  }
  const attach = new Int32Array(layout.bulbs.length);
  layout.bulbs.forEach((bulb, k) => {
    const node = bulb.t * 2 + 1;
    const i = cord + k;
    attach[k] = node;
    x[i] = x[node];
    y[i] = y[node] + PHYS.stem;
    w[i] = 1 / PHYS.bulbMass;
  });
  return {
    layout, n, cord, x, y, px: Float64Array.from(x), py: Float64Array.from(y), w, attach, seg,
    time: 0, rangAt: new Float64Array(layout.bulbs.length).fill(-1), touch: new Uint8Array(layout.bulbs.length),
    acc: 0, damping: PHYS.damping,
  };
}

/** The guest's hand, m in the garland's frame: where it is, where it was at the last frame (it sweeps between
 *  them across the frame's steps, so a flick still meets the cord) and its reach. */
export type Hand = { x: number; y: number; x0: number; y0: number; r: number };
/** A bulb held and carried to (x, y), m. */
export type Grab = { bulb: number; x: number; y: number };

export type Input = {
  /** The page's acceleration as the garland feels it (a page flung up presses it down), m/s², y down. */
  accel?: number;
  hand?: Hand | null;
  grab?: Grab | null;
};

/** A bulb the hand met this frame, and how hard (0 to 1): it rings. */
export type Ring = { bulb: number; force: number };

/**
 * Advances the garland by `dt` seconds of the guest's time, in fixed steps (the rest carried over to the next
 * frame). Returns the bulbs the hand met hard enough to ring.
 */
export function advance(s: Sim, dt: number, input: Input = {}): Ring[] {
  s.acc += Math.min(dt, 0.05);
  const steps = Math.floor(s.acc / PHYS.step);
  s.acc -= steps * PHYS.step;
  if (steps === 0) return [];
  const { x, y, px, py, w, n, cord, seg, attach } = s;
  const h = PHYS.step;
  const keep = Math.max(0, 1 - s.damping * h);
  const g = (PHYS.gravity + (input.accel ?? 0)) * h * h;
  const grab = input.grab ?? null;
  const held = grab ? cord + grab.bulb : -1;
  const heldW = held >= 0 ? w[held] : 0;
  if (held >= 0) w[held] = 0;
  const hand = input.hand ?? null;
  const met = new Uint8Array(attach.length);
  const v0 = bulbVelocities(s);
  const gx0 = held >= 0 ? x[held] : 0, gy0 = held >= 0 ? y[held] : 0;
  for (let k = 1; k <= steps; k++) {
    const u = k / steps;
    for (let i = 0; i < n; i++) {
      if (w[i] === 0) continue;
      const vx = (x[i] - px[i]) * keep;
      const vy = (y[i] - py[i]) * keep;
      px[i] = x[i];
      py[i] = y[i];
      x[i] += vx;
      y[i] += vy + g;
    }
    if (held >= 0) {
      // Carried by the hand along the frame's path.
      px[held] = x[held];
      py[held] = y[held];
      x[held] = gx0 + (grab!.x - gx0) * u;
      y[held] = gy0 + (grab!.y - gy0) * u;
    }
    // The cord: it can't stretch, but it can go slack.
    for (let i = 0; i < cord - 1; i++) {
      const j = i + 1;
      const ws = w[i] + w[j];
      if (ws === 0) continue;
      const dx = x[j] - x[i], dy = y[j] - y[i];
      const d = Math.sqrt(dx * dx + dy * dy);
      const c = d - seg[i];
      if (c <= 0 || d === 0) continue;
      const f = c / (d * ws);
      x[i] += w[i] * f * dx; y[i] += w[i] * f * dy;
      x[j] -= w[j] * f * dx; y[j] -= w[j] * f * dy;
    }
    // A bulb hangs at its lead's length from its node.
    for (let b = 0; b < attach.length; b++) {
      const i = attach[b], j = cord + b;
      const ws = w[i] + w[j];
      if (ws === 0) continue;
      const dx = x[j] - x[i], dy = y[j] - y[i];
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d === 0) continue;
      const f = (d - PHYS.stem) / (d * ws);
      x[i] += w[i] * f * dx; y[i] += w[i] * f * dy;
      x[j] -= w[j] * f * dx; y[j] -= w[j] * f * dy;
    }
    // The hand brushes the bulbs, softly (a compliant contact: a quick pass nudges them, a slow one carries
    // them along); the wire is too thin to catch and follows its bulbs.
    if (hand) {
      const hx = hand.x0 + (hand.x - hand.x0) * u;
      const hy = hand.y0 + (hand.y - hand.y0) * u;
      const r = hand.r + PHYS.bulbRadius;
      for (let i = cord; i < n; i++) {
        if (w[i] === 0) continue;
        const dx = x[i] - hx, dy = y[i] - hy;
        const d2 = dx * dx + dy * dy;
        if (d2 >= r * r) continue;
        const d = Math.sqrt(d2) || 1e-9;
        const k = w[i] * PHYS.touch * h * h;
        const push = ((r - d) * k) / ((1 + k) * d);
        x[i] += dx * push;
        y[i] += dy * push;
        met[i - cord] = 1;
      }
    }
  }
  if (held >= 0) w[held] = heldW;
  s.time += steps * h;
  // A bulb rings when the hand comes onto it, as hard as the two meet, or when the hand passes it by (a
  // bulb swung out of the way still rings as the hand goes past: that way a hand run along the garland
  // always plays every note). A hand already pushing a bulb along doesn't ring it again.
  const rings: Ring[] = [];
  const span = steps * h;
  const hvx = hand ? (hand.x - hand.x0) / span : 0;
  const hvy = hand ? (hand.y - hand.y0) / span : 0;
  const reach = hand ? hand.r + PHYS.bulbRadius + 0.016 : 0;
  for (let b = 0; b < attach.length; b++) {
    const i = cord + b;
    let hit = 0;
    if (hand && b !== grab?.bulb) {
      if (met[b] && !s.touch[b]) hit = Math.hypot(hvx - v0[2 * b], hvy - v0[2 * b + 1]);
      const a0 = hand.x0 - x[i], a1 = hand.x - x[i];
      if (a0 * a1 < 0) {
        const u = a0 / (a0 - a1);
        if (Math.abs(hand.y0 + (hand.y - hand.y0) * u - y[i]) < reach) hit = Math.max(hit, Math.abs(hvx));
      }
    }
    if (hit > 0.15 && s.time - s.rangAt[b] > 0.14) {
      s.rangAt[b] = s.time;
      rings.push({ bulb: b, force: Math.min(1, hit / 1.6) });
    }
    s.touch[b] = met[b];
  }
  return rings;
}

/** The bulbs' velocities (x, y pairs), m/s. */
function bulbVelocities(s: Sim): Float64Array {
  const out = new Float64Array(s.attach.length * 2);
  for (let b = 0; b < s.attach.length; b++) {
    const i = s.cord + b;
    out[2 * b] = (s.x[i] - s.px[i]) / PHYS.step;
    out[2 * b + 1] = (s.y[i] - s.py[i]) / PHYS.step;
  }
  return out;
}

/** Knocks a bulb sideways at `speed` m/s (a note of the song striking it, or a tap). */
export function knock(s: Sim, bulb: number, speed: number) {
  const i = s.cord + bulb;
  s.px[i] = s.x[i] - speed * PHYS.step;
  s.rangAt[bulb] = s.time;
}

/** The fastest particle's speed, m/s. */
export function topSpeed(s: Sim): number {
  let top = 0;
  for (let i = 0; i < s.n; i++) {
    if (s.w[i] === 0) continue;
    const vx = (s.x[i] - s.px[i]) / PHYS.step, vy = (s.y[i] - s.py[i]) / PHYS.step;
    top = Math.max(top, vx * vx + vy * vy);
  }
  return Math.sqrt(top);
}

export const atRest = (s: Sim) => topSpeed(s) < PHYS.restSpeed;

/** Lets the rig hang itself out quickly (a heavy damping) until it is still: its rest, before anyone sees it. */
export function settle(s: Sim, seconds = 4) {
  s.damping = 40;
  for (let t = 0; t < seconds; t += 1 / 60) {
    advance(s, 1 / 60);
    if (t > 0.5 && atRest(s)) break;
  }
  s.damping = PHYS.damping;
  s.px.set(s.x);
  s.py.set(s.y);
  s.acc = 0;
}

/** How far below the nails the rig hangs at its deepest, m (the bulbs' centres). */
export function depth(s: Sim): number {
  let d = 0;
  for (let i = 0; i < s.n; i++) d = Math.max(d, s.y[i]);
  return d;
}
