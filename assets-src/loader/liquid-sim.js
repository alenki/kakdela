// «До краёв»: the pour's physics (docs/CONVENTIONS.md, «До краёв: the loader»). No DOM and no GL:
// liquid-worker.js steps it in a Web Worker and liquid-gl.js draws what view() returns, and the tests
// (src/components/loader/liquid.test.ts) drive it directly.
//
// The screen is a glass tank seen from the front, 0.26 mm to the CSS px (1440 x 900 is 37 cm by 23 cm),
// 38% full when the show starts. The surface is the buttons' liquid (src/lib/pour.ts) at the screen's
// scale: the tank's own sloshing modes, each at the tempo water that deep and that long would have, fed
// where the stream lands (its gulps, its chop), spilling where a face gets too steep, climbing the walls a
// little. The stream falls from a lip 5 cm above the top edge, so its shape is the valve's own history:
// gulps travel down it, it thins as it speeds up, and it arcs and bends as the pour point moves. Where it
// plunges in it digs a crater that rings and throws up droplets, which fly and fall back in. The level is
// the runtime's needle and nothing else, stepped here on the pour's own clock from the milestones the page
// tells it (so the page's own work, hydration above all, never makes it wait and then rush), and the valve
// only pours ahead by the fall's own time.
// Read by liquid-worker.js, later in the same bundle.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
var KDLiquid = (function () {
  "use strict";

  /* ───── The scale ───── */

  var STEP = 1 / 240; // substeps: 240 Hz, whatever the display's rate
  var MPX = 0.00026; // metres to the CSS px
  var GRAV = 9.81 / MPX; // px/s²
  var TENSION = 7.28e-5 / (MPX * MPX * MPX); // water's surface tension over its density, px³/s²
  var MS = 1 / MPX; // px/s in a metre a second
  var VLIP = MS; // the stream leaves its lip at 1 m/s...
  var LIPH = 0.05 / MPX; // ...5 cm above the top edge
  var BRIM = 24; // the last gush puts the mean level this far past the top edge
  var HIST = 240; // the lip's history, a substep at a time: a second of it
  var PREFILL = 0.38; // how full the glass is when the show starts
  var MAX_DROPS = 64;

  // The pour's temper (pour.ts's, re-tuned for a basin, not a 4 cm pill).
  var GLUG = 0.2, GLUG_SLIP = 0.35, GLUG_WIDTH = 0.045;
  var RUSH = 0.45, RUSH_FOR = 0.1;
  var VALVE_IN = 0.05, VALVE_OUT = 0.04;
  var TAU = 0.14; // how quickly the valve chases the needle
  var SWAY_BEATS = 4, TREMBLE_BEATS = 15;
  var CHOP_BEAT = 0.035, DRAIN_CHOP = 0.35;
  var DAMP = 1.0, BED_MAX = 22, BREAK = 0.8;
  var SPILL = 0.6, SPILL_RATE = 200, PROBES = 64;
  var DRIFT = 0.45, DRIFT_MODES = 6, DRIFT_LIFT = 1.5;
  var SLOPE_MAX = 1.1, CROWD = 0.4, HEAP = 0.6;
  // A wait: the stream thins to a thread this share of a full one (easing there and back), keeps a gentle
  // chop where it lands, and its landing keeps a slow swell going so the waterline never stands dead still.
  var THIN_W = 0.3, THIN_STIR = 0.1, THIN_EASE = 0.14, THIN_SWELL = 0.15, SWELL_BEATS = 1.5;

  var clamp = function (v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; };
  var smooth = function (a, b, v) { var t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  function every(a) { for (var i = 0; i < a.length; i++) if (!a[i]) return false; return true; }

  /* ───── Chance (mulberry32, as in pour.ts and seed.ts) ───── */

  function mix(a) {
    var t = a >>> 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function roll(s) { s.luck = (s.luck + 0x6d2b79f5) >>> 0; return mix(s.luck); }
  function between(s, lo, hi) { return lo + (hi - lo) * roll(s); }
  function lattice(key, i) { return mix(key + Math.imul(i, 0x9e3779b9)); }
  function strand(key, salt) { return (key ^ Math.imul(salt, 0x85ebca6b)) >>> 0; }
  function noise(key, t, beats) {
    var x = t * beats, i = Math.floor(x), f = x - i, a = lattice(key, i);
    return 2 * (a + (lattice(key, i + 1) - a) * f * f * (3 - 2 * f)) - 1;
  }
  // The gulps: the flow over its mean at pour time t, dipping by `dip` between gulps (they average 1).
  function glug(m, t, dip) {
    var u = (t - m.lead) / m.beat, near = Math.round(u), sum = 0;
    for (var k = near - 1; k <= near + 1; k++) {
      var at = k + GLUG_SLIP * (2 * lattice(m.key, k) - 1);
      var size = 0.7 + 0.6 * lattice(m.key, k + 7919);
      var x = ((u - at) * m.beat) / GLUG_WIDTH;
      sum += size * Math.exp(-x * x);
    }
    return 1 - dip + (dip * sum * m.beat) / (GLUG_WIDTH * Math.sqrt(Math.PI));
  }

  // The stream's fall: from the lip to screen y (px fallen after t seconds, and seconds to y).
  function lipFall(t) { return t <= 0 ? 0 : VLIP * t + 0.5 * GRAV * t * t; }
  function fallTo(y) { return (-VLIP + Math.sqrt(VLIP * VLIP + 2 * GRAV * Math.max(0, y + LIPH))) / GRAV; }

  /* ───── The tank's own constants, by its size ───── */

  function config(W, H, mode) {
    var zw = Math.pow(W / 1440, 0.7); // the stream and the features across it
    var zg = Math.sqrt(W * H) / 1138; // heights
    var zp = Math.max(0.8, Math.pow(W / 1440, 0.3)); // droplets, never too small to see
    var brisk = mode === "brisk";
    return {
      zw: zw,
      zg: zg,
      zp: zp,
      N: clamp(Math.round(W / 20), 16, 72), // the modes: the shortest wave 40 px
      SX: clamp(Math.round(W / 4), 96, 720) + 1, // the surface's columns
      SY: clamp(Math.round(H / 4), 64, 600) + 1, // the stream's rows
      stream: 18 * zw, // a full stream's width at the top edge
      sway: 4 * zw,
      tremble: 0.5,
      wander: 0.05 * W, // the pour point drifts this far each way...
      wanderFor: 5.5, // ...there and back in this many seconds
      landSigma: 14 * zw,
      share: 0.05, // what piles under the stream, of what lands
      splash: 0.035,
      splashWide: 44 * zw,
      crater: 30 * zg,
      chop: 34 * zg,
      chopWide: 12 * zw,
      swellWide: 90 * zw,
      slant: 10 * zg,
      dampShort: 500,
      bed: 900,
      breakAt: 70 * zg,
      shallow: 5,
      meniscus: 4,
      meniscusReach: 11,
      meniscusFade: 19,
      climb: 0.05,
      climbPace: 13,
      climbDamp: 0.5,
      climbReach: 46 * zw,
      climbMax: 80 * zg,
      driftMax: 26 * zg,
      bore: 0.03,
      boreDeep: 70 * zg,
      boreMax: 28 * zg,
      trough: 10 * zg,
      brimCalm: 2.2,
      lid: 8,
      lidDeep: 40 * zg,
      // The valve: brim-fulls a second at full gush, and the flow a full-width stream stands for.
      qmax: (brisk ? 2.8 : 1.8) * W * H,
      qref: 0.15 * W * H,
      // The fill never brims by itself: p = 1 stands the level this far under the top edge.
      ceil: clamp(0.06 * H, 28, 72),
      // The exit: the last gush (seconds to lift the level out, screens a second at most from far under
      // the brim), the brim's hold (and the longest it waits for the cover to go), the drain (the outlet
      // opening over its first part).
      rise: brisk ? 0.1 : 0.18,
      gushRate: brisk ? 2.2 : 1.5,
      hold: brisk ? 0.06 : 0.12,
      wait: 0.6,
      drain: brisk ? 0.5 : 0.74,
      opening: brisk ? 0.1 : 0.16,
      outlet: brisk ? 0.05 : 0.035,
      drainShare: brisk ? 0.05 : 0.035,
      lurch: 0.03, // of the width, each side of the level: a 6% slope end to end
      lurchDamp: 7,
      lurchFor: 0.22,
      // Where it lands: the first splash's droplets, and the spray's (a second, at full stream).
      crown: 20,
      spray: 2.5,
    };
  }

  /* ───── State ───── */

  function calm() {
    return { gush: 1, rush: 1, rushFor: 1, land: 0.22, stream: 1, pile: 1, slant: 0, climb: 1, lurch: 1, bend: 0.5, bowl: 0, chop: 1, beat: 0.12, lead: 0, key: 0, wander: 0, spout: 0 };
  }
  // The pour's temper: its strength, where it lands, its slant, its gulps, its chop, its lurch.
  function deal(s) {
    var m = s.mood;
    m.gush = between(s, 0.92, 1.08);
    m.rush = between(s, 0.5, 1.3);
    m.rushFor = between(s, 0.7, 1.4);
    m.land = between(s, 0.17, 0.28); // the pour point's home, from the right wall (a share of the width)
    m.stream = between(s, 0.9, 1.1);
    m.pile = between(s, 0.6, 1.4);
    m.slant = between(s, -1, 1);
    m.climb = between(s, 0.85, 1.15);
    m.lurch = between(s, 0.75, 1);
    m.bend = between(s, 0, 1.2);
    m.bowl = between(s, -1, 1);
    m.chop = between(s, 0.6, 1);
    m.beat = between(s, 0.1, 0.15);
    m.lead = between(s, 0.1, 0.5) * m.beat;
    m.key = (roll(s) * 4294967296) >>> 0;
    m.wander = roll(s) * 6.2831853;
    m.spout = -between(s, 0.06, 0.16) * MS; // the stream leaves the spout moving left: it arcs
  }

  // o: { W, H, seed, mode ("full" | "brisk"), W8 (each milestone's share), got (which are in) }
  function create(o) {
    var W = o.W, H = o.H, c = config(W, H, o.mode);
    var s = {
      W: W, H: H, c: c, N: c.N, mode: o.mode,
      t: 0, acc: 0, vol: PREFILL * H * W, flow: 0, open: false, openAt: -9, shutAt: -9, age: 0,
      amp: new Float64Array(c.N + 1), pot: new Float64Array(c.N + 1), run: new Float64Array(4),
      hist: new Float64Array(HIST), histW: new Float64Array(HIST), histX: new Float64Array(HIST), histU: new Float64Array(HIST), hi: 0,
      wv: 0,
      luck: (mix(o.seed ^ 0x9e3779b9) * 4294967296) >>> 0,
      mood: calm(),
      W8: o.W8.slice(), got: o.got.slice(), v: 0, vis: 0, hurried: false, sweep: o.mode === "brisk" ? 0.45 : 1.1,
      phase: "wait", exitAt: 0, rise: 0, from: 0, to: 0, heldFrom: 0, cover: false, drainAt: 0, lvl0: 0,
      landX: W * 0.78, landY: H * (1 - PREFILL), landV: 0, landW: 0, landed: false, splashed: false, mom: 0, gl: 1,
      drops: new Float64Array(MAX_DROPS * 5), nDrops: 0,
      top: 0, bottom: 0, brimmed: false,
    };
    alloc(s);
    derive(s, 0);
    return s;
  }

  // Everything sized by the tank: the samples and the view.
  function alloc(s) {
    var c = s.c, M = c.SX - 1;
    s.XS = new Float64Array(M + 1);
    s.YS = new Float64Array(M + 1);
    s.CARRY = new Float64Array(M + 1);
    s.col = new Float64Array(c.SX);
    s.mK = new Float64Array(c.N + 1);
    s.mLift = new Float64Array(c.N + 1);
    s.mFlow = new Float64Array(c.N + 1);
    // surf: the surface's screen y at each column; stream: x and half width at each row; drops: x, y,
    // radius and a spare for each droplet in the air (a point sprite's four floats).
    s.out = {
      W: s.W, H: s.H, t: 0, level: 0, phase: s.phase,
      SX: c.SX, surf: new Float32Array(c.SX),
      SY: c.SY, stream: new Float32Array(c.SY * 2), top: -1, bottom: -1,
      nDrops: 0, drops: new Float32Array(MAX_DROPS * 4),
    };
  }

  /* ───── The show's steps ───── */

  // The pour starts: the valve opens and the stream's head comes in over the top edge on the first frame,
  // onto a still pool. `at` ({ p, t }: the runtime's needle and its clock) is a late start: the pool is
  // still where the page first painted it, the needle has moved on, and the valve catches the level up.
  function start(s, at) {
    if (s.phase !== "wait") return;
    deal(s);
    s.phase = "fill";
    s.open = true;
    s.age = 0;
    s.wv = 1;
    if (at) {
      s.v = clamp(at.p || 0, 0, 1);
      s.vis = at.t || 0;
    }
    s.openAt = s.t - fallTo(0);
    history(s);
    derive(s, 0);
  }
  // The lip's history for a stream that opened at s.openAt: its width and where the lip was.
  function history(s) {
    var c = s.c, m = s.mood;
    for (var k = 0; k < HIST; k++) {
      var i = (s.hi - k + HIST) % HIST, at = s.t - k * STEP;
      s.histX[i] = pourX(s, at);
      s.histU[i] = (pourX(s, at) - pourX(s, at - STEP)) / STEP + m.spout;
      s.histW[i] = at >= s.openAt ? c.stream * m.stream * s.wv : 0;
      s.hist[i] = 0;
    }
  }
  // Where the pour point is at sim time t: its home, drifting slowly across, swaying and trembling.
  function pourX(s, t) {
    var c = s.c, m = s.mood;
    return s.W * (1 - m.land) + c.wander * Math.sin((6.2831853 * t) / c.wanderFor + m.wander) + c.sway * noise(strand(m.key, 1), t, SWAY_BEATS) + c.tremble * noise(strand(m.key, 2), t, TREMBLE_BEATS);
  }

  // A milestone: which are in, and whether the runtime is hurrying. The pour steps its own copy of the
  // runtime's needle from these, on its own clock: the page's main thread, held up by hydration, gives the
  // runtime's clock a frame now and then, and a needle read from there would stand still and then leap.
  function milestone(s, m) {
    s.got = m.got.slice();
    s.hurried = !!m.hurried;
  }

  // The exit: the last gush lifts the level from where it is out through the top edge, eased, in c.rise
  // seconds (longer from far under the brim: c.gushRate screens a second at most).
  function exit(s) {
    if (s.phase !== "fill") return;
    var c = s.c, level = s.vol / s.W;
    s.phase = "gush";
    s.exitAt = s.t;
    s.from = level;
    s.to = s.H + BRIM + 4;
    s.rise = Math.max(s.hurried ? 0.12 : c.rise, (s.to - s.from) / (c.gushRate * s.H));
    s.open = true;
  }
  // The cover is down: the brim may drain.
  function go(s) { s.cover = true; }

  // Keep how full it is when the window changes size.
  function resize(s, W, H) {
    if (W === s.W && H === s.H) return;
    var fx = W / s.W, fy = H / s.H, fa = (W * H) / (s.W * s.H), share = s.vol / (s.W * s.H);
    var c = config(W, H, s.mode), fw = c.stream / s.c.stream;
    var amp = new Float64Array(c.N + 1), pot = new Float64Array(c.N + 1);
    for (var n = 1; n <= Math.min(c.N, s.N); n++) { amp[n] = s.amp[n] * fy; pot[n] = s.pot[n] * fy; }
    s.amp = amp;
    s.pot = pot;
    s.N = c.N;
    s.flow *= fa;
    for (var i = 0; i < HIST; i++) { s.hist[i] *= fa; s.histW[i] *= fw; s.histX[i] *= fx; s.histU[i] *= fx; }
    for (i = 0; i < s.nDrops; i++) { s.drops[i * 5] *= fx; s.drops[i * 5 + 1] = H - (s.H - s.drops[i * 5 + 1]) * fy; }
    s.lvl0 *= fy;
    s.from *= fy;
    s.to = s.to ? H + BRIM + 4 : 0;
    s.landX *= fx;
    s.landY = H - (s.H - s.landY) * fy;
    s.W = W;
    s.H = H;
    s.c = c;
    s.vol = share * W * H;
    MC.key = "";
    alloc(s);
    derive(s, 0);
  }

  function level(s) { return s.vol / s.W; }
  function ceil(s) { return s.c.ceil; }

  // A frame: dt seconds on. Returns what happened in it: "brim" (the screen is all ink), "drain" (it
  // has started to go), "done" (the glass is empty).
  function advance(s, dt) {
    var ev = [];
    if (s.phase === "wait" || s.phase === "done") return ev;
    step(s, Math.min(dt, 0.05), ev);
    return ev;
  }

  /* ───── The needle, as the runtime moves it (runtime.js: aim and follow) ───── */

  function aim(W8, got, t) {
    var sum = 0, next = 0;
    for (var i = 0; i < W8.length; i++) {
      if (got[i]) sum += W8[i];
      else next = Math.max(next, W8[i]);
    }
    return Math.min(1, sum + 0.6 * next * (1 - Math.exp(-t / 1.4)));
  }
  function follow(cur, to, dt, sweep) {
    var gap = Math.max(0, Math.min(to, 1) - cur);
    var st = Math.max(gap * (1 - Math.exp(-dt / 0.16)), Math.min(gap, dt / (3 * sweep)));
    return cur + Math.min(st, dt / sweep);
  }
  // Where the needle will be d seconds from now, with what has arrived so far.
  function ahead(s, d) {
    var v = s.v, vis = s.vis, sw = s.hurried ? 0.3 : s.sweep, all = every(s.got);
    var n = Math.max(1, Math.ceil(d * 60)), h = d / n;
    for (var i = 0; i < n; i++) {
      vis += h;
      v = follow(v, aim(s.W8, s.got, vis), h, sw);
      if (v > 0.999 && all) v = 1;
    }
    return v;
  }

  /* ───── A frame ───── */

  function step(s, dt, ev) {
    var c = s.c, W = s.W, H = s.H;
    s.vis += dt;
    s.v = follow(s.v, aim(s.W8, s.got, s.vis), dt, s.hurried ? 0.3 : s.sweep);
    if (s.v > 0.999 && every(s.got)) s.v = 1;
    // What the valve aims at: where the needle will be when what leaves the lip now lands.
    var goal = 0, rate = 0, lvl = s.vol / W;
    if (s.phase === "fill") {
      var fall = fallTo(clamp(H - lvl, 0, H)), span = H - c.ceil - H * PREFILL;
      var a = ahead(s, fall), b = ahead(s, fall + 0.05);
      goal = H * PREFILL + a * span;
      rate = ((b - a) * span) / 0.05;
    } else if (s.phase === "gush" || s.phase === "hold") {
      goal = gushAt(s, s.t);
      rate = (gushAt(s, s.t + 0.05) - goal) / 0.05;
    }
    s.acc += dt;
    var t0 = s.t;
    while (s.acc >= STEP - 1e-9) {
      s.acc -= STEP;
      substep(s, STEP, goal + rate * (s.t - t0), rate);
    }
    derive(s, dt);
    if (!ev) return;
    if (s.phase === "gush") {
      // The brim: the whole surface over the top edge (or, if it will not clear it in time, now: the
      // drain is never late).
      if (s.brimmed || s.t - s.exitAt > 3 * s.rise) {
        s.phase = "hold";
        s.heldFrom = s.t;
        ev.push("brim");
      }
    } else if (s.phase === "hold") {
      var held = s.t - s.heldFrom;
      if (held >= c.hold - 1e-6 && (s.cover || held >= c.wait)) {
        startDrain(s);
        ev.push("drain");
      }
    } else if (s.phase === "drain") {
      if ((s.top > H - 0.5 && s.t - s.drainAt > 0.1) || s.t - s.drainAt > c.drain + 0.14) {
        s.phase = "done";
        s.out.phase = "done";
        ev.push("done");
      }
    }
  }
  function gushAt(s, t) {
    var u = clamp((t - s.exitAt) / s.rise, 0, 1);
    return s.from + (s.to - s.from) * u * u * (3 - 2 * u);
  }

  /* ───── The valve: chase the needle ───── */

  function valve(s, dt, goal, rate) {
    var W = s.W, H = s.H, c = s.c, m = s.mood;
    var lvl = s.vol / W;
    var fall = fallTo(clamp(H - lvl, 0, H));
    var lag = Math.min(HIST - 1, Math.round(fall / STEP));
    var want = 0;
    if (s.open) {
      var inflight = 0;
      for (var j = 0; j < lag; j++) inflight += s.hist[(s.hi - j + HIST) % HIST] * STEP;
      var gap = goal - lvl - inflight / W;
      var gush = s.phase === "gush" || s.phase === "hold";
      var rush = Math.exp(-s.age / (RUSH_FOR * m.rushFor));
      var cap = c.qmax * m.gush * (1 + RUSH * m.rush * rush) * (gush ? 1.5 : 1);
      want = clamp(((gap * W) / TAU + rate * W) * (gush ? 1.6 : 1), 0, cap);
      if (gush && lvl < H + BRIM) want = Math.max(want, cap * 0.35);
      if (gush && lvl >= H + BRIM + 2) {
        s.open = false;
        s.shutAt = s.t;
        want = 0;
      }
    }
    s.flow += (want - s.flow) * (1 - Math.exp(-dt / (want > s.flow ? VALVE_IN : VALVE_OUT)));
    if (!s.open && s.flow < 1) s.flow = 0;
    var g = glug(m, s.age + dt / 2, GLUG);
    // What is seen: the stream's width follows the flow (a thread while the needle waits, never nothing
    // while the valve is open) and pulses with the gulps.
    var to = s.open ? clamp(Math.sqrt(s.flow / c.qref), THIN_W, 1.4) : 0;
    s.wv += (to - s.wv) * (1 - Math.exp(-dt / THIN_EASE));
    var prev = s.hi;
    s.hi = (s.hi + 1) % HIST;
    s.hist[s.hi] = s.flow * g;
    s.histW[s.hi] = s.open ? c.stream * m.stream * s.wv * Math.pow(g, 0.9) : 0;
    var x = pourX(s, s.t + dt);
    s.histU[s.hi] = (x - s.histX[prev]) / dt + m.spout;
    s.histX[s.hi] = x;
    // What lands now left the lip `lag` substeps ago.
    return s.hist[(s.hi - lag + HIST) % HIST];
  }

  /* ───── One substep of the surface (pour.ts's substep, for a rectangular tank) ───── */

  function substep(s, dt, goal, rate) {
    var W = s.W, H = s.H, c = s.c, m = s.mood, N = s.N;
    var out = s.phase === "drain" || s.phase === "done";
    var flow;
    if (!out) flow = valve(s, dt, goal, rate);
    else {
      var u0 = drained(c, s.t - s.drainAt), u1 = drained(c, s.t + dt - s.drainAt);
      var l0 = s.lvl0 * (1 - u0) * (1 - u0), l1 = s.lvl0 * (1 - u1) * (1 - u1);
      flow = ((l1 - l0) * W) / dt;
      if (u0 >= 1) flow = -0.02 * W * H;
      s.flow = flow;
    }
    s.vol += flow * dt;
    s.age += dt;
    var t = s.age - dt / 2;
    var lvl = s.vol / W;
    var pool = Math.max(c.shallow, lvl);
    var heap = 0;
    for (var n = 1; n <= N; n++) heap += s.amp[n] * s.amp[n];
    var rms = Math.sqrt(heap / 2);
    var depth = pool + HEAP * rms;
    var inside = s.vol > 0 && lvl < H + 0.5;
    var lands = inside && !out && s.landed;
    var away = s.landX < W / 2 ? 1 : -1;
    var rush = Math.exp(-t / (RUSH_FOR * m.rushFor));
    var share = inside ? ((out ? c.drainShare : c.share * m.pile * (1 + 0.8 * m.rush * rush)) * depth) / (depth + 10) : 0;
    var gulp = out ? 1 : glug(m, t, GLUG);
    var splash = lands ? (-c.splash * clamp((gulp - 1) / GLUG, -1, 1.5) * pool) / (pool + c.crater) : 0;
    var at = out ? W * c.outlet : s.landX;
    var sigma = Math.round((out ? c.landSigma * 2.2 : c.landSigma * m.stream * Math.max(0.5, s.wv)) * 4) / 4;
    var slant = lands ? (away * c.slant * m.slant * flow) / c.qmax : 0;
    var stir = 0;
    if (inside && out) stir = m.chop * DRAIN_CHOP * Math.min(1, Math.abs(flow) / (0.25 * W * H)) * (pool / (pool + 10)) * (1 - smooth(0.05 * H, 0.35 * H, lvl));
    else if (lands) stir = m.chop * clamp(s.mom, THIN_STIR, 1.3) * (pool / (pool + 10));
    var swell = lands ? THIN_SWELL * GRAV * c.chop * (pool / (pool + 10)) * (1 - smooth(0.35, 0.7, s.wv)) * noise(strand(m.key, 5), t, SWELL_BEATS) : 0;
    var impact = stir > 0 ? GRAV * c.chop * stir * noise(strand(m.key, 3), t, 1 / CHOP_BEAT) : 0;
    // Past the brim the unseen liquid calms quickly, and under the rim the last trough closes; a slosh
    // that stands too tall breaks. The drain starts from the brim, so it keeps its lurch.
    var calmed = BREAK * Math.max(0, rms - c.breakAt) + (out ? 0 : c.brimCalm * Math.max(0, lvl - H) + c.lid * smooth(H - c.lidDeep, H, lvl));
    var lurchCalm = out ? c.lurchDamp * (1 - smooth(0, c.lurchFor, s.t - s.drainAt)) : 0;
    var squeeze = s.vol <= 0 ? 40 : out && lvl < 0.25 * H ? -flow / Math.max(s.vol, 1) : 0;
    var C = modes(s, sigma);
    var K = C.K, GT = C.GT, EDS = C.EDS, BELL = C.BELL, RING = C.RING, SPLG = C.SPLG, SWG = C.SWG;
    var twoW = 2 / W, chopK = (2 * c.chopWide) / W, swK = (2 * c.swellWide) / W;
    var thA = (Math.PI * clamp(at, 0, W)) / W, cA1 = Math.cos(thA), cAp = 1, cA = cA1;
    var eBase = Math.exp(-(DAMP + calmed + squeeze) * dt);
    var eLurch = lurchCalm ? Math.exp(-lurchCalm * dt) : 1;
    var eBed = Math.exp(-Math.min(BED_MAX, c.bed / (depth * depth)) * dt);
    var tiltG = GRAV * slant * 8;
    var riseL = 0, riseR = 0;
    for (n = 1; n <= N; n++) {
      var k = K[n], kd = k * depth;
      var kt = kd > 4.5 ? k : k * Math.tanh(kd);
      var deep = out ? (kd > 30 ? 0 : 1 / Math.cosh(kd)) : 1;
      var lnd = (share * BELL[n] + splash * SPLG[n]) * cA;
      var shove = 0;
      if (stir > 0) shove += chopK * RING[n] * deep * impact * cA;
      if (swell) shove += swK * SWG[n] * swell * cA;
      var source = twoW * lnd * deep;
      var tilt = n % 2 ? tiltG / (n * n * Math.PI * Math.PI) : 0;
      s.pot[n] -= (GT[n] * s.amp[n] + shove - tilt) * dt;
      var wave = kt * s.pot[n];
      s.amp[n] += (wave + flow * source) * dt;
      var e = EDS[n] * eBase * (n <= 3 ? eLurch : 1);
      s.amp[n] *= e;
      s.pot[n] *= e * eBed;
      riseL += wave;
      riseR += n % 2 ? -wave : wave;
      var nx = 2 * cA1 * cA - cAp;
      cAp = cA;
      cA = nx;
    }
    spill(s, dt);
    // Nothing climbs the wall the outlet is drawing the liquid down.
    climb(s, 0, inside && !out ? c.climb * m.climb * Math.max(0, riseL) : 0, dt);
    climb(s, 2, inside ? c.climb * m.climb * Math.max(0, riseR) : 0, dt);
    s.t += dt;
  }

  // How far the drain has got after t seconds (0..1). The outlet opens over c.opening seconds, and through
  // it the head falls as Torricelli has it, so the level goes as (1 − u)²: the surface comes in over the
  // top edge gently, runs, and slows into the floor.
  function drained(c, t) {
    var o = c.opening, a = t <= 0 ? 0 : t < o ? (t * t) / (2 * o) : t - o / 2;
    return clamp(a / (c.drain - o / 2), 0, 1);
  }
  function startDrain(s) {
    var c = s.c, W = s.W;
    s.phase = "drain";
    s.open = false;
    s.drainAt = s.t;
    s.lvl0 = s.vol / W;
    s.age = 0;
    // The lurch: the surface comes back in sloping down toward the outlet, by the left wall.
    var A = c.lurch * W * s.mood.lurch;
    s.amp[1] = -A;
    if (s.N >= 3) s.amp[3] = -A * 0.12 * s.mood.bend;
    if (s.N >= 2) s.amp[2] = A * 0.1 * s.mood.bowl;
    for (var n = 1; n <= s.N; n++) s.pot[n] = 0;
    s.run[0] = s.run[1] = s.run[2] = s.run[3] = 0;
  }

  // Each mode's constants for a tank this size: its wavenumber, its restoring force (gravity and
  // tension), its short-wave damping over a substep, and its share of the stream's, the chop's, the
  // swell's and the splash's bells.
  var MC = { key: "", sigma: -1 };
  function modes(s, sigma) {
    var c = s.c, N = s.N, W = s.W;
    var key = W + ":" + N + ":" + c.chopWide + ":" + c.swellWide + ":" + c.splashWide + ":" + c.dampShort;
    if (MC.key !== key) {
      MC.key = key;
      MC.sigma = -1;
      MC.K = new Float64Array(N + 1); MC.GT = new Float64Array(N + 1); MC.EDS = new Float64Array(N + 1);
      MC.RING = new Float64Array(N + 1); MC.SWG = new Float64Array(N + 1); MC.SPLG = new Float64Array(N + 1); MC.BELL = new Float64Array(N + 1);
      for (var n = 1; n <= N; n++) {
        var k = (n * Math.PI) / W;
        MC.K[n] = k;
        MC.GT[n] = GRAV + TENSION * k * k;
        MC.EDS[n] = Math.exp(-c.dampShort * k * k * STEP);
        MC.RING[n] = Math.exp(-0.5 * (k * c.chopWide) * (k * c.chopWide));
        MC.SWG[n] = Math.exp(-0.5 * (k * c.swellWide) * (k * c.swellWide));
        MC.SPLG[n] = Math.exp(-0.5 * (k * c.splashWide) * (k * c.splashWide));
      }
    }
    if (MC.sigma !== sigma) {
      MC.sigma = sigma;
      for (var j = 1; j <= N; j++) MC.BELL[j] = Math.exp(-0.5 * (MC.K[j] * sigma) * (MC.K[j] * sigma));
    }
    return MC;
  }

  function climb(s, i, to, dt) {
    var c = s.c;
    s.run[i + 1] += (c.climbPace * c.climbPace * (to - s.run[i]) - 2 * c.climbDamp * c.climbPace * s.run[i + 1]) * dt;
    s.run[i] += s.run[i + 1] * dt;
  }

  var PC = new Float64Array(PROBES), PS = new Float64Array(PROBES);
  for (var pi = 0; pi < PROBES; pi++) { PC[pi] = Math.cos((Math.PI * pi) / PROBES); PS[pi] = Math.sin((Math.PI * pi) / PROBES); }
  // A face too steep for water spills: the modes building the steepest point lose energy.
  function spill(s, dt) {
    var N = s.N, worst = 0, where = 0, bound = 0;
    // No face can be steeper than the sum of every mode's own steepest: most of the time that settles it.
    for (var b = 1; b <= N; b++) bound += b * Math.abs(s.amp[b]);
    if ((bound * Math.PI) / s.W <= SPILL) return;
    for (var i = 1; i < PROBES; i++) {
      var th = (Math.PI * i) / PROBES, c1 = PC[i], sPrev = 0, sN = PS[i], slope = 0;
      for (var n = 1; n <= N; n++) {
        slope -= n * s.amp[n] * sN;
        var sNext = 2 * c1 * sN - sPrev;
        sPrev = sN;
        sN = sNext;
      }
      if (Math.abs(slope) > Math.abs(worst)) { worst = slope; where = th; }
    }
    worst *= Math.PI / s.W;
    var over = Math.abs(worst) / SPILL - 1;
    if (over <= 0) return;
    for (var m = 1; m <= N; m++) {
      var part = (-((m * Math.PI) / s.W) * s.amp[m] * Math.sin(m * where)) / worst;
      if (part <= 0) continue;
      var e = Math.exp(-SPILL_RATE * over * part * dt);
      s.amp[m] *= e;
      s.pot[m] *= e;
    }
  }

  /* ───── The frame as it is seen ───── */

  // Everything the frame shows, after the substeps (dt: the frame's seconds; 0 when nothing moves on).
  function derive(s, dt) {
    surface(s);
    stream(s, dt);
    if (dt > 0) spray(s, dt);
    publish(s);
  }

  // The surface (pour.ts's sampleSurface), resampled onto the view's columns.
  function surface(s) {
    var W = s.W, H = s.H, c = s.c, N = s.N, M = c.SX - 1;
    var XS = s.XS, YS = s.YS, CARRY = s.CARRY, mK = s.mK, mLift = s.mLift, mFlow = s.mFlow;
    var lvl = s.vol / W;
    var depth = Math.max(c.shallow, lvl);
    // Modes with nothing left in them are left out.
    var top = 0;
    for (var q = 1; q <= N; q++) if (Math.abs(s.amp[q]) > 0.01 || Math.abs(s.pot[q]) * ((q * Math.PI) / W) * c.bore > 0.01) top = q;
    N = top;
    for (var n = 1; n <= N; n++) {
      mK[n] = (n * Math.PI) / W;
      mLift[n] = Math.min(DRIFT_LIFT, 1 / Math.tanh(mK[n] * depth));
      mFlow[n] = mK[n] * s.pot[n];
    }
    var fade = smooth(0, c.meniscusFade, lvl) * smooth(0, c.meniscusFade, H - lvl);
    var men = c.meniscus * fade;
    var tongueL = c.climbMax * Math.tanh(Math.max(0, s.run[0]) / c.climbMax) * smooth(0, c.meniscusFade, lvl);
    var tongueR = c.climbMax * Math.tanh(Math.max(0, s.run[2]) / c.climbMax) * smooth(0, c.meniscusFade, lvl);
    var drift = DRIFT * smooth(12, 44, depth);
    var bore = c.bore * (1 - smooth(18, c.boreDeep, depth));
    for (var i = 0; i <= M; i++) {
      var x = -1 + (i / M) * (W + 2);
      var th1 = (Math.PI * clamp(x, 0, W)) / W, c1 = Math.cos(th1);
      var cPrev = 1, cN = c1, sPrev = 0, sN = Math.sin(th1), eta = 0, xi = 0, u = 0;
      for (n = 1; n <= N; n++) {
        eta += s.amp[n] * cN;
        if (n <= DRIFT_MODES) xi -= s.amp[n] * sN * mLift[n];
        u -= mFlow[n] * sN;
        var cNext = 2 * c1 * cN - cPrev, sNext = 2 * c1 * sN - sPrev;
        cPrev = cN; cN = cNext; sPrev = sN; sN = sNext;
      }
      var offL = Math.max(0, x), offR = Math.max(0, W - x);
      var rise = men * (Math.exp(-offL / c.meniscusReach) + Math.exp(-offR / c.meniscusReach)) + tongueL * Math.exp(-offL / c.climbReach) + tongueR * Math.exp(-offR / c.climbReach);
      XS[i] = x;
      var ride = 0.3 + 0.7 * smooth(-c.trough, c.trough, eta);
      CARRY[i] = x > 0 && x < W ? drift * clamp(xi, -c.driftMax, c.driftMax) + ride * clamp(bore * u, -c.boreMax, c.boreMax) : 0;
      YS[i] = H - (lvl + eta + rise);
    }
    // Crests are sharper than troughs: the samples drift sideways with the water, never past each other.
    var take = 1;
    for (i = 0; i < M; i++) {
      var close = CARRY[i] - CARRY[i + 1];
      if (close <= 0) continue;
      var dx = XS[i + 1] - XS[i];
      var room = Math.min((1 - CROWD) * dx, dx - Math.abs(YS[i + 1] - YS[i]) / SLOPE_MAX);
      take = Math.min(take, (Math.max(0, room) + 0.05) / close);
    }
    for (i = 0; i <= M; i++) {
      var X = XS[i] + take * CARRY[i];
      if (i > 0 && X < XS[i - 1] + 0.05) X = XS[i - 1] + 0.05;
      XS[i] = X;
    }
    // Read them at the columns.
    var col = s.col, j = 0, lo = Infinity, hi = -Infinity;
    for (var e = 0; e < c.SX; e++) {
      var cx = (e / (c.SX - 1)) * W;
      while (j < M - 1 && XS[j + 1] < cx) j++;
      var a = XS[j], b = XS[j + 1], f = b > a ? clamp((cx - a) / (b - a), 0, 1) : 0;
      var y = clamp(YS[j] + (YS[j + 1] - YS[j]) * f, -240, H + 4);
      col[e] = y;
      if (y < lo) lo = y;
      if (y > hi) hi = y;
    }
    s.top = lo;
    s.bottom = hi;
    s.brimmed = hi < -0.5 && lvl > H;
  }
  // The surface's height (screen y) at x.
  function surfaceAt(s, x) {
    var SX = s.c.SX, f = clamp(x / s.W, 0, 1) * (SX - 1), i = Math.min(SX - 2, Math.floor(f));
    return s.col[i] + (s.col[i + 1] - s.col[i]) * (f - i);
  }

  // The stream, row by row: what is at screen y left the lip fallTo(y) ago, with the width and the place
  // the lip had then (moving sideways as the lip was), and has thinned as it sped up. Where it lands
  // tells the surface where to churn and the plunge how hard.
  var VTOP = VLIP + GRAV * fallTo(0);
  function stream(s, dt) {
    var c = s.c, H = s.H, SY = c.SY, R = s.out.stream;
    var opened = s.openAt > -9 && s.phase !== "wait";
    var head = opened ? lipFall(s.t - s.openAt) - LIPH : -1;
    var tail = !s.open && s.shutAt > -9 && s.phase !== "fill" ? lipFall(s.t - s.shutAt) - LIPH : -Infinity;
    if (s.phase === "drain" || s.phase === "done") head = -1;
    // Where it meets the pool: the surface under where it falls.
    var ly = surfaceAt(s, s.landX), lx = s.landX;
    for (var it = 0; it < 2; it++) {
      var tl = fallTo(clamp(ly, 0, H)), kl = Math.min(HIST - 1, Math.round(tl / STEP)), il = (s.hi - kl + HIST) % HIST;
      lx = clamp(s.histX[il] + s.histU[il] * tl, 0, s.W);
      ly = surfaceAt(s, lx);
    }
    var tL = fallTo(clamp(ly, 0, H)), iL = (s.hi - Math.min(HIST - 1, Math.round(tL / STEP)) + HIST) % HIST;
    var vL = VLIP + GRAV * tL;
    var wL = s.histW[iL] * Math.sqrt(VTOP / vL);
    var was = s.landed;
    s.landed = opened && head >= ly && tail < ly && wL > 0;
    s.landX = lx;
    s.landY = ly;
    s.landV = vL;
    s.landW = wL;
    // How hard it plunges, against a full stream falling onto the pool where the show starts.
    var vRef = VLIP + GRAV * fallTo(H * (1 - PREFILL));
    var hard = s.landed ? ((wL / (0.8 * c.stream)) * (wL / (0.8 * c.stream)) * (vL * vL)) / (vRef * vRef) : 0;
    s.mom += (hard - s.mom) * (dt > 0 ? 1 - Math.exp(-dt / 0.03) : 1);
    s.gl = s.landed ? glug(s.mood, s.age - tL, GLUG) : 1;
    // The first plunge onto a still pool.
    if (dt > 0 && s.landed && !was && !s.splashed && s.phase === "fill" && ly > 0) {
      s.splashed = true;
      launch(s, Math.round(c.crown * between(s, 0.7, 1.3) * clamp(s.mom, 0.5, 1.5)), true);
    }
    var bottom = Math.min(head, ly + 10);
    var first = -1, last = -1;
    for (var j = 0; j < SY; j++) {
      var y = (j / (SY - 1)) * H, o = j * 2, r = 0, x = 0;
      if (y <= bottom && y >= tail) {
        var tf = fallTo(y), k = Math.min(HIST - 1, Math.round(tf / STEP)), i = (s.hi - k + HIST) % HIST;
        r = 0.5 * s.histW[i] * Math.sqrt(VTOP / (VLIP + GRAV * tf));
        x = s.histX[i] + s.histU[i] * tf;
        // The head and the tail are rounded.
        if (r > 0) {
          var endH = head - y, endT = y - tail;
          if (endH < 1.2 * r) r *= Math.sqrt(Math.max(0, endH) / (1.2 * r));
          if (endT < 1.2 * r) r *= Math.sqrt(Math.max(0, endT) / (1.2 * r));
        }
        if (r > 0.05) {
          if (first < 0) first = j;
          last = j;
        } else r = 0;
      }
      R[o] = x;
      R[o + 1] = r;
    }
    s.out.top = first < 0 ? -1 : (first / (SY - 1)) * H;
    s.out.bottom = last < 0 ? -1 : (last / (SY - 1)) * H;
  }

  /* ───── Droplets: the splash ───── */

  // n droplets thrown up from where the stream plunges in (`hard`: the first plunge's crown, higher).
  function launch(s, n, hard) {
    var c = s.c, a = s.drops, strength = Math.sqrt(clamp(s.mom, 0.3, 1.6));
    for (var i = 0; i < n && s.nDrops < MAX_DROPS; i++) {
      var side = roll(s) < 0.5 ? -1 : 1, o = s.nDrops * 5;
      var r = (1.6 + 3.2 * Math.pow(roll(s), 2)) * c.zp;
      a[o] = clamp(s.landX + side * (0.5 * s.landW + roll(s) * 3 * c.zp), r, s.W - r);
      a[o + 1] = s.landY - r;
      a[o + 2] = side * (hard ? between(s, 0.08, 0.45) : between(s, 0.05, 0.35)) * MS;
      a[o + 3] = -(hard ? between(s, 0.35, 0.95) : between(s, 0.2, 0.7)) * MS * strength;
      a[o + 4] = r;
      s.nDrops++;
    }
  }
  function spray(s, dt) {
    var a = s.drops, W = s.W, n = s.nDrops;
    for (var i = 0; i < n; ) {
      var o = i * 5, x = a[o], y = a[o + 1], vx = a[o + 2], vy = a[o + 3], r = a[o + 4];
      x += vx * dt;
      y += vy * dt + 0.5 * GRAV * dt * dt;
      vy += GRAV * dt;
      if (x < r) { x = r; vx = -0.4 * vx; } else if (x > W - r) { x = W - r; vx = -0.4 * vx; }
      if (vy > 0 && y > surfaceAt(s, x) - 0.3 * r) {
        // Back in: a little crater that rings.
        dent(s, x, r);
        n--;
        for (var k = 0; k < 5; k++) a[o + k] = a[n * 5 + k];
        continue;
      }
      a[o] = x; a[o + 1] = y; a[o + 2] = vx; a[o + 3] = vy;
      i++;
    }
    s.nDrops = n;
    if (!s.landed || s.landY <= 0 || s.phase === "drain" || s.phase === "done") return;
    // The spray: now and then, and at the top of every strong gulp.
    var p = s.c.spray * s.mom * dt;
    if (roll(s) < p) launch(s, 1, false);
    var peak = s.gl > 1 + 0.6 * GLUG;
    if (peak && !s.peak) launch(s, 1 + Math.floor(2.5 * roll(s) * Math.min(1.5, s.mom)), false);
    s.peak = peak;
  }
  // A droplet back in the pool: a small dent in the surface where it went in.
  function dent(s, x, r) {
    var W = s.W, N = s.N, th = (Math.PI * clamp(x, 0, W)) / W, A = (2 / W) * Math.PI * r * r * 1.5, sg = 2 * r;
    for (var n = 1; n <= N; n++) {
      var k = (n * Math.PI) / W;
      s.amp[n] -= A * Math.cos(n * th) * Math.exp(-0.5 * (k * sg) * (k * sg));
    }
  }

  /* ───── The view ───── */

  function publish(s) {
    var c = s.c, o = s.out;
    o.W = s.W;
    o.H = s.H;
    o.t = s.t;
    o.level = s.vol / s.W;
    o.phase = s.phase;
    o.covered = s.brimmed;
    for (var e = 0; e < c.SX; e++) o.surf[e] = s.col[e];
    o.nDrops = s.nDrops;
    for (var i = 0; i < s.nDrops; i++) {
      o.drops[i * 4] = s.drops[i * 5];
      o.drops[i * 4 + 1] = s.drops[i * 5 + 1];
      o.drops[i * 4 + 2] = s.drops[i * 5 + 4];
      o.drops[i * 4 + 3] = 0;
    }
  }

  function view(s) { return s.out; }

  return {
    PREFILL: PREFILL,
    MAX_DROPS: MAX_DROPS,
    create: create,
    start: start,
    milestone: milestone,
    exit: exit,
    go: go,
    resize: resize,
    advance: advance,
    level: level,
    ceil: ceil,
    view: view,
  };
})();
