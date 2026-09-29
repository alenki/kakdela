// «До краёв»: the worker (docs/CONVENTIONS.md, «До краёв: the loader»). pour.js starts it
// from a Blob of this code, with liquid-sim.js and liquid-gl.js before it (all three minified into one
// string by scripts/build-loader.mjs), and hands it the canvas. Its own requestAnimationFrame steps the
// pour and draws it, so the page's work on the main thread (hydration above all) never holds a frame up.
// In: init (the canvas and the show), start (the size and the needle, once the cover is up), p (the needle,
// every frame until the pour starts; from then on the pour steps it itself), m (a milestone), size, exit,
// go (the cover is down). Out: ready, fail, began (the pour has started), live (its first frames are
// drawn), brim (and whether the screen is all ink), drain, done, and with ?dk=log its frame times.
(function () {
  "use strict";
  var sim = null, glass = null, running = false, last = 0, frames = 0, log = null;
  var raf = typeof self.requestAnimationFrame === "function"
    ? function (f) { self.requestAnimationFrame(f); }
    : function (f) { setTimeout(function () { f(performance.now()); }, 16); };
  function post(m) { self.postMessage(m); }

  var ready = false, begin = null;
  self.onmessage = function (e) {
    var m = e.data;
    if (m.k === "init") {
      // The pour's state at once (milestones may come in while the shaders build), the drawing when it can.
      sim = KDLiquid.create({ W: m.W, H: m.H, seed: m.seed, mode: m.mode, W8: m.W8, got: m.got });
      log = m.log ? [] : null;
      var t0 = performance.now();
      KDGlass.create(m.canvas, function (g) {
        if (!g || !g.draw) {
          sim = null;
          post({ k: "fail", why: g && g.errors ? g.errors.join(" ") : "webgl2" });
          return;
        }
        glass = g;
        glass.size(m.W, m.H, m.q);
        ready = true;
        post({ k: "ready", ms: Math.round(performance.now() - t0), at: g.took });
        if (begin) start();
      });
      return;
    }
    if (!sim) return;
    if (m.k === "start") {
      begin = m;
      if (ready) start();
    } else if (m.k === "p") {
      if (begin && !running) {
        begin.p = m.p;
        begin.t = m.t;
      }
    } else if (m.k === "m") KDLiquid.milestone(sim, m);
    else if (m.k === "size") {
      KDLiquid.resize(sim, m.W, m.H);
      if (ready) glass.size(m.W, m.H, m.q);
      // A pour still waiting on its shaders starts at the new size.
      if (begin && !running) {
        begin.W = m.W;
        begin.H = m.H;
        begin.q = m.q;
      }
    } else if (m.k === "exit") KDLiquid.exit(sim);
    else if (m.k === "go") KDLiquid.go(sim);
  };
  // The pour starts at the size the page measured on its first frame, onto the pool where the page first
  // painted it, with the needle where the runtime has it by then (the shaders can take a while to build
  // while the page loads): the valve catches the level up.
  function start() {
    if (running) return;
    var m = begin;
    KDLiquid.resize(sim, m.W, m.H);
    glass.size(m.W, m.H, m.q);
    KDLiquid.start(sim, { p: m.p, t: m.t });
    post({ k: "began" });
    running = true;
    raf(tick);
  }

  function tick(now) {
    if (!running) return;
    if (glass.lost()) {
      running = false;
      post({ k: "fail", why: "lost" });
      return;
    }
    var dt = last ? (now - last) / 1000 : 0;
    last = now;
    var t0 = log ? performance.now() : 0;
    var ev = dt > 0 ? KDLiquid.advance(sim, dt) : [];
    var v = KDLiquid.view(sim);
    glass.draw(v);
    frames++;
    if (log) log.push([Math.round(now * 10) / 10, Math.round((performance.now() - t0) * 100) / 100]);
    // Live once its first frames are drawn: the exit is the pour's from now on.
    if (frames === 2) post({ k: "live" });
    // (The frame times go before `done`: the page ends the show on it.)
    if (log && v.phase === "done") post({ k: "log", log: log });
    for (var i = 0; i < ev.length; i++) post(ev[i] === "brim" ? { k: "brim", covered: v.covered } : { k: ev[i] });
    if (v.phase === "done") {
      running = false;
      glass.clear();
      return;
    }
    raf(tick);
  }
})();
