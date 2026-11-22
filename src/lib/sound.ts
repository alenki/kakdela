"use client";

// The season's sounds («С наступающим!», docs/CONVENTIONS.md), made on the spot with Web Audio: no files, nothing
// fetched. On by default in the season: «Jingle Bells» plays on repeat from the guest's first click or tap (a
// browser lets a page sound only after one, unless it already lets this site sound), never from a key, so it
// doesn't talk over a screen reader. The bell in the header shows what is heard and stops it all; that «off»
// is kept in the browser (kd-sound, in the privacy policy's table), so the next visit starts quiet, and pressing
// the bell again plays and forgets it. While nothing plays, every call here is a no-op.
//   bell     a glockenspiel bar: the garland's bulbs and the tune (inharmonic partials of a free bar)
//   tear     paper ripping (the hero's tabs): fibres snapping, a crackle of tiny bursts in a band of noise
//   peel     a paper snowflake coming off the glass: the slower, softer crackle of a sticky edge
//   chime    one stroke of the Kremlin clock: a big bell's partials (hum, prime, tierce, quint, nominal)
//   jingle   a shake of sleigh bells
//   game     the runner's sounds (src/components/game): a jump, feet in snow, a slide, a ding every hundred,
//            a little fanfare for a record, a bonk and a falling «aww» on a crash; the music dips during a run
//   chess    the weekly puzzle's board (src/components/sections/chess): wooden pieces set down on wood, a
//            capture knocking the taken piece first, a bell for a check, a chord for the mate, a soft «no»
//   music    «Jingle Bells», verse and chorus, on the bells over a groove (kick, clap, sleigh-bell hats, bass,
//            chords that duck with the kick), round and round; every note it plays is a kd:note event, so the
//            garland can knock its bulb

import { BARS, CHORDS, EIGHTH } from "./melody";

type Listener = () => void;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let dry: GainNode | null = null;
let wet: GainNode | null = null;
let noise: AudioBuffer | null = null;
/** The guest's wish: on by default in the season (prime), off once they press the bell. */
let enabled = false;
let primed = false;
let unlisten: (() => void) | null = null;
const listeners = new Set<Listener>();

const emit = () => listeners.forEach((l) => l());
/** Sound is heard: wished for, and the browser lets it run. */
const playing = () => enabled && !!ctx && ctx.state === "running";

/** The guest's «off», kept for their next visit (kd-sound); their «on» forgets it. */
function remembered(): boolean {
  try {
    return localStorage.getItem("kd-sound") === "off";
  } catch {
    return false;
  }
}
function remember(off: boolean) {
  try {
    if (off) localStorage.setItem("kd-sound", "off");
    else localStorage.removeItem("kd-sound");
  } catch {
    /* storage can be unavailable (private mode) */
  }
}

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
  // On an iPhone the ring/silent switch mutes the web's "ambient" sound: this is the season's music, so play it.
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
  // Whenever the browser lets it run (the first press, a tab seen again), the music goes on.
  c.addEventListener("statechange", () => {
    if (c.state === "running" && enabled) {
      unlisten?.();
      begin();
    }
    emit();
  });
  document.addEventListener("visibilitychange", () => {
    if (!ctx) return;
    if (document.hidden) void ctx.suspend();
    else if (enabled) void ctx.resume();
  });
  return c;
}

/** The output up and the music on (both only once). */
function begin() {
  const c = ctx;
  if (!c || !master || !playing()) return;
  if (master.gain.value < 0.5) {
    master.gain.cancelScheduledValues(c.currentTime);
    master.gain.setValueAtTime(master.gain.value, c.currentTime);
    master.gain.linearRampToValueAtTime(0.9, c.currentTime + 0.08);
  }
  startMusic();
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

/** A glockenspiel bar an octave up (partials 1, 2.76, 5.40, 8.93 of a free bar), and a soft octave from the
 *  resonator under it: rounder, more music box. */
function bellAt(c: AudioContext, dest: AudioNode, midi: number, t: number, gain: number) {
  const f = hz(midi + 12);
  const v = 0.22 * gain;
  partial(c, dest, f, v, t, 1.6);
  partial(c, dest, f * 2.756, v * 0.32, t, 0.42);
  partial(c, dest, f * 5.404, v * 0.14, t, 0.16);
  partial(c, dest, f * 8.933, v * 0.05, t, 0.07);
  partial(c, dest, f * 2, v * 0.1, t, 0.9);
  hiss(c, dest, t, 0.012, v * 0.25, "highpass", 5200, 0.7);
}

/** A dozen little sleigh bells, each a cluster of high partials, in half a second. */
function jingleAt(c: AudioContext, dest: AudioNode, t0: number) {
  for (let k = 0; k < 14; k++) {
    const t = t0 + Math.pow(Math.random(), 1.6) * 0.5;
    const f = 2300 + Math.random() * 2600;
    for (const r of [1, 1.47, 2.09, 2.56]) partial(c, dest, f * r, 0.02 / r, t, 0.12 + Math.random() * 0.18);
    hiss(c, dest, t, 0.02, 0.03, "highpass", 6000, 0.6);
  }
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

// ── The music: «Jingle Bells» round and round ──
// Scheduled a bar at a time a second ahead of the audio clock (the clock is exact, timers are not), so it
// loops without a seam and stops at once. A suspended context's clock stands still, so a hidden tab picks up
// the tune where it left it. The first time round a bar of sleigh bells counts it in; then the verse builds
// (kick, hats and chords, the claps coming in halfway) and the chorus lands on the whole beat.

const BAR = EIGHTH * 8;
type Music = { bus: GainNode; pad: GainNode; padIn: BiquadFilterNode; next: number; bar: number; timer: number; notes: Set<number> };
let music: Music | null = null;

function startMusic() {
  const c = ctx;
  if (!c || music) return;
  const bus = out(c, 0.8, 0, 0.6);
  // The chords: two detuned saws a note through a low-pass, under a gain that ducks with every kick.
  const pad = c.createGain();
  pad.gain.value = 0.0001;
  pad.connect(bus);
  const padIn = c.createBiquadFilter();
  padIn.type = "lowpass";
  padIn.frequency.value = 1300;
  padIn.Q.value = 0.5;
  padIn.connect(pad);
  const m: Music = { bus, pad, padIn, next: c.currentTime + 0.25, bar: -1, timer: 0, notes: new Set() };
  music = m;
  const pump = () => {
    if (music !== m || !ctx) return;
    while (m.next < ctx.currentTime + 1.2) {
      playBar(m, m.bar, m.next);
      m.next += BAR;
      m.bar = m.bar + 1 >= CHORDS.length ? 0 : m.bar + 1;
    }
  };
  m.timer = window.setInterval(pump, 100);
  pump();
}

function stopMusic() {
  const m = music;
  music = null;
  if (!m) return;
  window.clearInterval(m.timer);
  m.notes.forEach((id) => window.clearTimeout(id));
  if (ctx) {
    const now = ctx.currentTime;
    m.bus.gain.cancelScheduledValues(now);
    m.bus.gain.setValueAtTime(m.bus.gain.value, now);
    m.bus.gain.linearRampToValueAtTime(0, now + 0.2);
  }
  window.setTimeout(() => {
    m.bus.disconnect();
    m.pad.disconnect();
  }, 400);
}

function playBar(m: Music, b: number, at: number) {
  const c = ctx!;
  const bus = m.bus;
  const kick = (t: number, v = 1) => {
    const o = c.createOscillator();
    const g = c.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(44, t + 0.12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.55 * v, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + 0.35);
  };
  // A clap is a few hands a hair apart.
  const clap = (t: number) => {
    for (const d of [0, 0.011, 0.023]) hiss(c, bus, t + d, d === 0.023 ? 0.16 : 0.03, 0.16, "bandpass", 1400, 1.1);
  };
  // A hat with a sleigh bell or two in it.
  const hat = (t: number, v: number) => {
    hiss(c, bus, t, 0.045, 0.05 * v, "highpass", 7500, 0.7);
    const f = 3600 + Math.random() * 1400;
    for (const r of [1, 1.47, 2.09]) partial(c, bus, f * r, (0.012 * v) / r, t, 0.09);
  };
  const bass = (t: number, midi: number, len: number) => {
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.value = hz(midi - 12);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.32, t + 0.01);
    g.gain.setValueAtTime(0.32, t + len * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + len + 0.02);
  };

  // The count-in: a bar of sleigh bells and a soft kick.
  if (b < 0) {
    for (let e = 0; e < 8; e++) hat(at + e * EIGHTH, e % 2 ? 1 : 0.6);
    kick(at + 4 * EIGHTH, 0.5);
    jingleAt(c, bus, at);
    return;
  }
  const last = b === CHORDS.length - 1;
  for (const root of CHORDS[b]) {
    for (const det of [-6, 6]) {
      const o = c.createOscillator();
      o.type = "sawtooth";
      o.frequency.value = hz(root + 12);
      o.detune.value = det;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(0.022, at + 0.06);
      g.gain.setValueAtTime(0.022, at + BAR - 0.05);
      g.gain.linearRampToValueAtTime(0.0001, at + BAR + 0.02);
      o.connect(g).connect(m.padIn);
      o.start(at);
      o.stop(at + BAR + 0.05);
    }
  }
  // The pump: the chords dip at each kick and swell back.
  for (const k of [0, 4]) {
    const t = at + k * EIGHTH;
    m.pad.gain.setValueAtTime(0.25, t);
    m.pad.gain.linearRampToValueAtTime(1, t + EIGHTH * 1.6);
  }
  kick(at);
  kick(at + 4 * EIGHTH);
  if (b % 2 === 1 && !last) kick(at + 7 * EIGHTH, 0.6);
  // The verse builds: the claps come in halfway through it, so the chorus lands like a drop.
  if (!last && b >= 8) {
    clap(at + 2 * EIGHTH);
    clap(at + 6 * EIGHTH);
  }
  for (let e = 0; e < 8; e++) hat(at + e * EIGHTH, (e % 2 ? 1 : 0.55) * (b < 8 ? 0.6 : 1));
  const root = CHORDS[b][0];
  bass(at, root, EIGHTH * 2.6);
  bass(at + 3 * EIGHTH, root + 12, EIGHTH * 0.9);
  bass(at + 4 * EIGHTH, root + 7, EIGHTH * 1.8);
  bass(at + 6 * EIGHTH, root, EIGHTH * 1.6);
  // The tune, on the bells, a soft triangle under them an octave down; each note told to the page as it sounds.
  for (const n of BARS[b]) {
    const t = at + n.at * EIGHTH;
    bellAt(c, bus, n.midi, t, 1);
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.value = hz(n.midi);
    const g = c.createGain();
    const len = Math.max(0.12, n.eighths * EIGHTH * 0.9);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.connect(g).connect(bus);
    o.start(t);
    o.stop(t + len + 0.02);
    const id = window.setTimeout(() => {
      m.notes.delete(id);
      window.dispatchEvent(new CustomEvent("kd:note", { detail: { note: n.note } }));
    }, Math.max(0, (t - c.currentTime) * 1000 - 20));
    m.notes.add(id);
  }
  // «Hey!»: a shake of the bells on the last bar, before it goes round again.
  if (last) jingleAt(c, bus, at + BAR - EIGHTH * 2);
}

// ── The weekly puzzle's board (src/components/sections/chess/cues.ts reads the cues off the game) ──
// Wooden pieces on a wooden board, struck rather than recorded: the board's low plate modes, the piece's own
// short ring and the soft contact of its felt. A heavier piece sits lower and louder, a capture knocks the
// taken piece first, and the board's few words are on the garland's bells, in its C major: a check is a D left
// hanging, the mate the chord it resolves to, «Мата нет.» two soft notes falling.

export type ChessCue =
  | { kind: "move"; piece: "p" | "n" | "b" | "r" | "q" | "k"; file: number; capture: boolean; then: "check" | "mate" | "wrong" | null }
  | { kind: "back" };

/** How heavily each piece sets down. */
const WEIGHT = { p: 0.8, n: 0.95, b: 0.95, r: 1.05, q: 1.15, k: 1.2 } as const;

/** A piece set down: the board's plate (two low modes, damped in tens of ms, lower for a heavier piece), the
 *  piece's own body (a band of noise near 1 kHz) and the felt's contact (a few ms of hiss). Never quite the
 *  same twice. */
function knockAt(c: AudioContext, dest: AudioNode, t: number, weight: number, gain: number) {
  const j = 1 + (Math.random() - 0.5) * 0.08;
  const f = (205 / Math.sqrt(weight)) * j;
  const v = gain * weight;
  partial(c, dest, f, 0.3 * v, t, 0.12);
  partial(c, dest, f * 2.31, 0.13 * v, t, 0.07);
  partial(c, dest, f * 4.7, 0.05 * v, t, 0.035);
  hiss(c, dest, t, 0.035, 0.15 * v, "bandpass", 1150 * j, 2.2);
  hiss(c, dest, t, 0.008, 0.07 * v, "lowpass", 3200, 0.7);
}

/** Wood on wood: the moving piece knocks the taken one off. Harder, brighter and shorter than a set-down. */
function clackAt(c: AudioContext, dest: AudioNode, t: number) {
  const f = 1450 * (1 + (Math.random() - 0.5) * 0.1);
  partial(c, dest, f, 0.1, t, 0.05);
  partial(c, dest, f * 1.73, 0.06, t, 0.035);
  partial(c, dest, f * 2.6, 0.035, t, 0.02);
  hiss(c, dest, t, 0.012, 0.13, "bandpass", 2600, 1.4);
}

/** Pieces pushed back across the board: felt rubbing over wood, swelling and gone. */
function slideAt(c: AudioContext, dest: AudioNode, t: number, dur: number) {
  const src = c.createBufferSource();
  src.buffer = noise;
  const f = c.createBiquadFilter();
  f.type = "bandpass";
  f.Q.value = 0.9;
  f.frequency.setValueAtTime(520, t);
  f.frequency.linearRampToValueAtTime(820, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.06, t + dur * 0.45);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(dest);
  src.start(t, Math.random() * 0.5);
  src.stop(t + dur + 0.02);
}

/** «Мата нет.»: two soft notes falling a minor third, G to E, like a head shaken. */
function noAt(c: AudioContext, dest: AudioNode, t: number) {
  for (const [midi, dt, len] of [[67, 0, 0.16], [64, 0.14, 0.32]] as const) {
    const o = c.createOscillator();
    o.type = "triangle";
    o.frequency.value = hz(midi);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t + dt);
    g.gain.exponentialRampToValueAtTime(0.12, t + dt + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dt + len);
    o.connect(g).connect(dest);
    o.start(t + dt);
    o.stop(t + dt + len + 0.02);
  }
}

export const sound = {
  /** Sound is heard now (the bell shows it pressed). */
  get on() {
    return playing();
  },
  subscribe(fn: Listener) {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  /**
   * The season's default: the sound on, unless the guest turned it off before. A browser lets a page sound only
   * after a press (or at once where it already lets this site sound), so the music starts with the guest's
   * first click or tap anywhere. Not a key: it mustn't talk over a screen reader. Not a press on the bell: that
   * press is the guest's own answer (SoundToggle).
   */
  prime() {
    if (primed || typeof window === "undefined") return;
    primed = true;
    if (remembered()) return;
    const c = setup();
    if (!c) return;
    enabled = true;
    const types = ["pointerdown", "pointerup", "touchend", "click"] as const;
    const first = (e: Event) => {
      if ((e.target as Element | null)?.closest?.(".hdr-sound")) return;
      if (!enabled) return unlisten?.();
      void c.resume();
    };
    unlisten = () => {
      types.forEach((t) => window.removeEventListener(t, first, true));
      unlisten = null;
    };
    types.forEach((t) => window.addEventListener(t, first, { capture: true, passive: true }));
    void c.resume().catch(() => {});
    if (c.state === "running") {
      unlisten();
      begin();
      emit();
    }
  },
  /** The bell pressed while quiet: call from the press itself (it is the gesture a browser asks for). */
  enable(): boolean {
    const c = setup();
    if (!c) return false;
    enabled = true;
    remember(false);
    void c.resume();
    if (c.state === "running") begin();
    emit();
    return true;
  },
  /** The bell pressed while it plays: everything stops, and the next visit starts quiet. */
  disable() {
    enabled = false;
    remember(true);
    unlisten?.();
    stopMusic();
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
  },

  /** A bulb rung by the guest's hand. */
  bell(midi: number, { gain = 0.5, pan = 0 }: { gain?: number; pan?: number } = {}) {
    const c = ctx;
    if (!playing() || !c || !admit(c)) return;
    bellAt(c, out(c, 1, pan, 1), midi, c.currentTime + 0.005, gain);
  },

  /** Paper torn: a crackle of fibres snapping (a burst every few ms) in a band of noise, a little louder at
   *  the end, as the rip runs out at the edge. */
  tear(strength = 1) {
    const c = ctx;
    if (!playing() || !c) return;
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
    if (!playing() || !c) return;
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
    if (!playing() || !c) return;
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

  /** A shake of sleigh bells. */
  jingle({ at }: { at?: number } = {}) {
    const c = ctx;
    if (!playing() || !c) return;
    jingleAt(c, out(c, 0.5, 0, 0.7), at ?? c.currentTime + 0.01);
  },

  /** The runner's sounds, in the season's bells and the snow (runner-controller.ts plays them on the run's
   *  own events). */
  game(kind: "start" | "pause" | "jump" | "land" | "duck" | "milestone" | "best" | "crash" | "record") {
    const c = ctx;
    if (!playing() || !c) return;
    const t = c.currentTime + 0.005;
    const o = out(c, 0.9, 0, 0.3);
    /** A tone gliding from f0 to f1 (Hz) and dying away. */
    const glide = (type: OscillatorType, f0: number, f1: number, at: number, dur: number, amp: number) => {
      const osc = c.createOscillator();
      osc.type = type;
      osc.frequency.setValueAtTime(f0, at);
      osc.frequency.exponentialRampToValueAtTime(f1, at + dur * 0.6);
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(amp, at + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
      osc.connect(g).connect(o);
      osc.start(at);
      osc.stop(at + dur + 0.02);
    };
    switch (kind) {
      case "start":
        // Sleigh bells and two bells up: off it goes.
        jingleAt(c, o, t);
        bellAt(c, o, 72, t + 0.05, 0.7);
        bellAt(c, o, 79, t + 0.16, 0.8);
        break;
      case "pause":
        bellAt(c, o, 79, t, 0.45);
        bellAt(c, o, 72, t + 0.11, 0.4);
        break;
      case "jump":
        // A springy pluck that rises, and a glint of sleigh bell.
        glide("triangle", 430, 1000, t, 0.17, 0.14);
        partial(c, o, 4300, 0.018, t + 0.02, 0.12);
        partial(c, o, 6300, 0.01, t + 0.02, 0.08);
        break;
      case "land":
        // Feet in snow: a short crunch of a few grains, and its body.
        for (let k = 0; k < 5; k++) hiss(c, o, t + k * 0.011 + Math.random() * 0.006, 0.02 + Math.random() * 0.02, 0.05 + Math.random() * 0.04, "bandpass", 900 + Math.random() * 1800, 1.2);
        hiss(c, o, t, 0.08, 0.05, "lowpass", 480, 0.7);
        break;
      case "duck": {
        // A slide through snow: a swish falling in pitch.
        const src = c.createBufferSource();
        src.buffer = noise;
        const f = c.createBiquadFilter();
        f.type = "bandpass";
        f.Q.value = 1.3;
        f.frequency.setValueAtTime(2800, t);
        f.frequency.exponentialRampToValueAtTime(700, t + 0.26);
        const g = c.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.09, t + 0.04);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
        src.connect(f).connect(g).connect(o);
        src.start(t, Math.random() * 0.5);
        src.stop(t + 0.32);
        break;
      }
      case "milestone":
        // A hundred more: two bright bells, up.
        bellAt(c, o, 76, t, 0.8);
        bellAt(c, o, 81, t + 0.085, 0.9);
        break;
      case "best":
        // Past the record, mid-run: a run of bells up the chord, and sleigh bells.
        [72, 76, 79, 84].forEach((m, i) => bellAt(c, o, m, t + i * 0.07, 0.75));
        jingleAt(c, o, t + 0.21);
        break;
      case "crash":
        // A bonk (the cup on the floor), a clatter of its lid, and three bells falling: «aww».
        glide("sine", 150, 52, t, 0.28, 0.4);
        hiss(c, o, t, 0.09, 0.09, "bandpass", 1500, 1.1);
        hiss(c, o, t + 0.07, 0.05, 0.05, "bandpass", 2400, 1.4);
        [79, 75, 72].forEach((m, i) => bellAt(c, o, m, t + 0.14 + i * 0.13, 0.55));
        break;
      case "record":
        // A new record, at the end of the run: a little fanfare.
        [72, 76, 79].forEach((m, i) => bellAt(c, o, m, t + i * 0.09, 0.8));
        bellAt(c, o, 84, t + 0.27, 1);
        bellAt(c, o, 84, t + 0.45, 0.7);
        jingleAt(c, o, t + 0.27);
        break;
    }
  },
  /** During a run the music steps back, so the run's own sounds come through. */
  gameMode(on: boolean) {
    const c = ctx, m = music;
    if (!c || !m) return;
    const now = c.currentTime;
    m.bus.gain.cancelScheduledValues(now);
    m.bus.gain.setValueAtTime(m.bus.gain.value, now);
    m.bus.gain.linearRampToValueAtTime(on ? 0.42 : 0.8, now + 0.35);
  },

  /** The weekly puzzle's board (cues.ts): a move lands `delay` s from now, as its piece ends its slide
   *  (Game.tsx); pieces sliding home start now and settle then. */
  chess(cue: ChessCue, { delay = 0 }: { delay?: number } = {}) {
    const c = ctx;
    if (!playing() || !c) return;
    const now = c.currentTime + 0.005;
    const t = now + delay;
    if (cue.kind === "back") {
      const o = out(c, 0.8, 0, 0.25);
      slideAt(c, o, now, delay + 0.1);
      knockAt(c, o, t + 0.03, 0.9, 0.4);
      return;
    }
    // The square's file pans it a little across the board.
    const o = out(c, 0.85, ((cue.file - 3.5) / 3.5) * 0.35, 0.3);
    if (cue.capture) clackAt(c, o, t);
    const down = cue.capture ? t + 0.045 : t;
    knockAt(c, o, down, WEIGHT[cue.piece], cue.capture ? 1.15 : 1);
    const bells = out(c, 0.8, 0, 1);
    if (cue.then === "check") bellAt(c, bells, 74, down + 0.09, 0.5);
    if (cue.then === "mate") [60, 64, 67, 72].forEach((m, i) => bellAt(c, bells, m, down + 0.12 + i * 0.05, 0.55 + i * 0.08));
    if (cue.then === "wrong") noAt(c, out(c, 1, 0, 0.4), down + 0.2);
  },

  /** The audio clock, s. */
  now: () => ctx?.currentTime ?? 0,
};
