"use client";

// The season's sounds («С наступающим!», docs/CONVENTIONS.md), made on the spot with Web Audio: no files, nothing
// fetched. Off until the guest presses the bell in the header (a browser lets a page sound only after a press
// anyway), remembered only for the visit, never stored. While off, every call here is a no-op.
//   bell     a glockenspiel bar: the garland's bulbs and the music box (inharmonic partials of a free bar)
//   tear     paper ripping (the hero's tabs): fibres snapping, a crackle of tiny bursts in a band of noise
//   peel     a paper snowflake coming off the glass: the slower, softer crackle of a sticky edge
//   chime    one stroke of the Kremlin clock: a big bell's partials (hum, prime, tierce, quint, nominal)
//   jingle   a shake of sleigh bells
//   melody   «В лесу родилась ёлочка» on the bells, with a callback on every note

import { NOTES, EIGHTH } from "./melody";

type Listener = () => void;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let dry: GainNode | null = null;
let wet: GainNode | null = null;
let noise: AudioBuffer | null = null;
let enabled = false;
let tune: { bus: GainNode; timers: number[] } | null = null;
const listeners = new Set<Listener>();

const emit = () => listeners.forEach((l) => l());

type AudioWindow = Window & { webkitAudioContext?: typeof AudioContext };
type SessionNavigator = Navigator & { audioSession?: { type: string } };

/** A small room for the bells: an exponentially dying stereo noise as the impulse response. */
function room(c: AudioContext, seconds = 1.8, decay = 0.38): AudioBuffer {
  const len = Math.floor(c.sampleRate * seconds);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / c.sampleRate;
      // Darker as it dies: a one-pole low-pass that closes with time.
      const a = 0.25 + 0.7 * Math.exp(-t / 0.5);
      lp += a * ((Math.random() * 2 - 1) - lp);
      d[i] = lp * Math.exp(-t / decay);
    }
  }
  return buf;
}

function setup(): AudioContext | null {
  if (ctx) return ctx;
  const AC = window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
  if (!AC) return null;
  // On an iPhone the ring/silent switch mutes the web's "ambient" sound: the guest asked for it, so play it.
  try {
    const nav = navigator as SessionNavigator;
    if (nav.audioSession) nav.audioSession.type = "playback";
  } catch {
    /* not there */
  }
  const c = new AC({ latencyHint: "interactive" });
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -16;
  comp.knee.value = 14;
  comp.ratio.value = 3.5;
  comp.attack.value = 0.003;
  comp.release.value = 0.25;
  master = c.createGain();
  master.gain.value = 0;
  master.connect(comp).connect(c.destination);
  dry = c.createGain();
  dry.connect(master);
  const verb = c.createConvolver();
  verb.buffer = room(c);
  wet = c.createGain();
  wet.gain.value = 0.22;
  wet.connect(verb).connect(master);
  noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
  const nd = noise.getChannelData(0);
  for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
  ctx = c;
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else if (enabled) void ctx.resume();
  });
  return c;
}

/** Where a voice goes: the dry bus and a share of the room, panned. */
function out(c: AudioContext, gain: number, pan = 0, room = 1): GainNode {
  const g = c.createGain();
  g.gain.value = gain;
  let node: AudioNode = g;
  if (pan && typeof c.createStereoPanner === "function") {
    const p = c.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, pan));
    g.connect(p);
    node = p;
  }
  node.connect(dry!);
  if (room > 0) {
    const send = c.createGain();
    send.gain.value = room;
    node.connect(send).connect(wet!);
  }
  return g;
}

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

/** One partial: a sine that strikes and dies away exponentially. */
function partial(c: AudioContext, dest: AudioNode, f: number, amp: number, at: number, decay: number) {
  if (f > c.sampleRate / 2.2) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.frequency.value = f;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(amp, at + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, at + decay);
  o.connect(g).connect(dest);
  o.start(at);
  o.stop(at + decay + 0.02);
}

/** A burst of filtered noise: the mallet's tick, a crackle grain, a whoosh. */
function hiss(c: AudioContext, dest: AudioNode, at: number, dur: number, amp: number, type: BiquadFilterType, freq: number, q = 0.8) {
  const src = c.createBufferSource();
  src.buffer = noise;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(amp, at + Math.min(0.003, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(f).connect(g).connect(dest);
  src.start(at, Math.random() * 0.8);
  src.stop(at + dur + 0.02);
}

/** Voices playing at once, so a hand dragged through the whole garland doesn't pile up a roar. */
let voices: number[] = [];
function admit(c: AudioContext, max = 18): boolean {
  const now = c.currentTime;
  voices = voices.filter((t) => t > now);
  if (voices.length >= max) return false;
  voices.push(now + 0.5);
  return true;
}

export const sound = {
  get on() {
    return enabled;
  },
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  /** Call from the press itself: a browser lets a page start sound only from a guest's gesture. */
  enable(): boolean {
    const c = setup();
    if (!c || !master) return false;
    void c.resume();
    enabled = true;
    master.gain.cancelScheduledValues(c.currentTime);
    master.gain.setValueAtTime(master.gain.value, c.currentTime);
    master.gain.linearRampToValueAtTime(0.9, c.currentTime + 0.08);
    emit();
    window.dispatchEvent(new CustomEvent("kd:sound", { detail: { on: true } }));
    return true;
  },
  disable() {
    enabled = false;
    sound.stopMelody();
    if (ctx && master) {
      const now = ctx.currentTime;
      master.gain.cancelScheduledValues(now);
      master.gain.setValueAtTime(master.gain.value, now);
      master.gain.linearRampToValueAtTime(0, now + 0.12);
      const c = ctx;
      window.setTimeout(() => {
        if (!enabled) void c.suspend();
      }, 200);
    }
    emit();
    window.dispatchEvent(new CustomEvent("kd:sound", { detail: { on: false } }));
  },

  /** A bulb, a music-box note: a glockenspiel bar (partials 1, 2.76, 5.40, 8.93 of a free bar) an octave up. */
  bell(midi: number, { gain = 0.5, pan = 0, at, dest }: { gain?: number; pan?: number; at?: number; dest?: AudioNode } = {}) {
    const c = ctx;
    // A tune's notes are scheduled ahead and always play; a hand's bells take their turn.
    if (!enabled || !c || (!dest && !admit(c))) return;
    const t = at ?? c.currentTime + 0.005;
    const f = hz(midi + 12);
    const o = dest ?? out(c, 1, pan, 1);
    const v = 0.22 * gain;
    partial(c, o, f, v, t, 1.6);
    partial(c, o, f * 2.756, v * 0.32, t, 0.42);
    partial(c, o, f * 5.404, v * 0.14, t, 0.16);
    partial(c, o, f * 8.933, v * 0.05, t, 0.07);
    // A soft octave from the resonator under the bar: rounder, more music box.
    partial(c, o, f * 2, v * 0.1, t, 0.9);
    hiss(c, o, t, 0.012, v * 0.25, "highpass", 5200, 0.7);
  },

  /** Paper torn: a crackle of fibres snapping (a burst every few ms) in a band of noise, a little louder at
   *  the end, as the rip runs out at the edge. */
  tear(strength = 1) {
    const c = ctx;
    if (!enabled || !c) return;
    const t0 = c.currentTime + 0.005;
    const dur = 0.17 + 0.08 * strength;
    const o = out(c, 0.9, (Math.random() - 0.5) * 0.3, 0.25);
    let t = 0;
    while (t < dur) {
      const k = t / dur;
      const amp = (0.05 + 0.13 * k * k + Math.random() * 0.05) * strength;
      hiss(c, o, t0 + t, 0.006 + Math.random() * 0.012, amp, "bandpass", 1800 + Math.random() * 3200, 1.1);
      t += 0.002 + Math.random() * 0.007;
    }
    // The body of the sheet giving way.
    hiss(c, o, t0, dur * 0.9, 0.05 * strength, "lowpass", 900, 0.6);
  },

  /** A paper snowflake peeled off the glass: slower, softer, lower, and a little whoosh as it lets go. */
  peel() {
    const c = ctx;
    if (!enabled || !c) return;
    const t0 = c.currentTime + 0.005;
    const dur = 0.32;
    const o = out(c, 0.8, (Math.random() - 0.5) * 0.4, 0.3);
    let t = 0;
    while (t < dur) {
      const amp = 0.025 + Math.random() * 0.04;
      hiss(c, o, t0 + t, 0.01 + Math.random() * 0.02, amp, "bandpass", 700 + Math.random() * 1500, 1.4);
      t += 0.008 + Math.random() * 0.02;
    }
    hiss(c, o, t0 + dur * 0.8, 0.35, 0.05, "bandpass", 2400, 0.5);
  },

  /** One stroke of the Kremlin clock: a big bell (hum, prime, tierce, quint, nominal and up), each partial a
   *  hair detuned against its twin so it beats, dying away over seconds. */
  chime({ at, gain = 1 }: { at?: number; gain?: number } = {}) {
    const c = ctx;
    if (!enabled || !c) return;
    const t = at ?? c.currentTime + 0.01;
    const o = out(c, 0.55 * gain, 0, 1.6);
    const f = 196;
    const parts: [number, number, number][] = [
      [0.5, 0.5, 7],
      [1, 0.55, 5],
      [1.19, 0.4, 4],
      [1.5, 0.25, 3],
      [2, 0.45, 3.4],
      [2.51, 0.18, 2],
      [3, 0.14, 1.6],
      [4.07, 0.08, 1],
    ];
    for (const [r, a, d] of parts) {
      partial(c, o, f * r, a * 0.3, t, d);
      partial(c, o, f * r + 0.7, a * 0.12, t, d * 0.9);
    }
    hiss(c, o, t, 0.06, 0.08, "lowpass", 600, 0.7);
  },

  /** A shake of sleigh bells: a dozen little bells, each a cluster of high partials, in half a second. */
  jingle({ at }: { at?: number } = {}) {
    const c = ctx;
    if (!enabled || !c) return;
    const t0 = at ?? c.currentTime + 0.01;
    const o = out(c, 0.5, 0, 0.7);
    for (let k = 0; k < 14; k++) {
      const t = t0 + Math.pow(Math.random(), 1.6) * 0.5;
      const f = 2300 + Math.random() * 2600;
      for (const r of [1, 1.47, 2.09, 2.56]) partial(c, o, f * r, 0.02 / r, t, 0.12 + Math.random() * 0.18);
      hiss(c, o, t, 0.02, 0.03, "highpass", 6000, 0.6);
    }
  },

  /** «В лесу родилась ёлочка» on the bells, `verses` times. `onNote(i, inSeconds)` hears every note as it is
   *  scheduled, so the page can strike the garland's bulb in time. Stops with stopMelody() or disable(). */
  melody({ verses = 1, onNote, delay = 0.35 }: { verses?: number; onNote?: (note: number, inSeconds: number) => void; delay?: number } = {}) {
    const c = ctx;
    if (!enabled || !c) return;
    sound.stopMelody();
    const bus = out(c, 1, 0, 1);
    const timers: number[] = [];
    let t = c.currentTime + delay;
    const start = c.currentTime;
    for (let v = 0; v < verses; v++) {
      NOTES.forEach((n, i) => {
        // A music box breathes a little: the first note of each phrase lands a touch late.
        const at = t + (i % 8 === 0 || i === 14 ? 0.015 : 0);
        sound.bell(n.midi, { at, gain: 0.85, dest: bus });
        const k = v * NOTES.length + i;
        if (onNote) timers.push(window.setTimeout(() => onNote(k, at - c.currentTime), Math.max(0, (at - start) * 1000 - 20)));
        t += n.eighths * EIGHTH;
      });
    }
    tune = { bus, timers };
  },
  stopMelody() {
    if (!tune) return;
    tune.timers.forEach((id) => window.clearTimeout(id));
    if (ctx) {
      const now = ctx.currentTime;
      tune.bus.gain.setValueAtTime(tune.bus.gain.value, now);
      tune.bus.gain.linearRampToValueAtTime(0, now + 0.15);
      const bus = tune.bus;
      window.setTimeout(() => bus.disconnect(), 300);
    }
    tune = null;
  },
  /** The audio clock, s. */
  now: () => ctx?.currentTime ?? 0,
};
