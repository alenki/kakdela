// «До краёв» (To the brim). The whole screen becomes one of the site's buttons: a glass seen from the front,
// 38% full of the site's ink when the show starts; a stream pours into it as the page loads, the level
// rising only as the runtime's honest needle does, and when the page is ready the last gush takes it past
// the top edge and it drains toward the left wall to hand the page over. No words, no numbers: the level is
// the progress.
//
// This is the main thread's side of it, and it does little: the cover (the page's cream, and the pool as
// plain HTML from the very first paint), a <canvas>, and a Web Worker made from a Blob of inline code
// (liquid-sim.js, liquid-gl.js, liquid-worker.js) that steps the pour and draws it with WebGL2 on its own
// thread, so hydration never holds a frame up. Nothing is fetched: the loading screen never has to load.
// Its GPU context and shaders can take a moment while the page itself loads, and nothing moved from this
// thread can move smoothly then (a load gives it a frame now and then between parsing and hydration), so
// until the worker draws, the pool on the page waits where it first painted, and the worker's glass takes
// it up there with the stream falling in, and catches up with the needle. Here it only passes on the
// milestones (and the needle, until the pour starts: from then on the worker steps it on its own clock) and
// runs the exit's handshake: the worker says `brim` (the screen is all ink: the cover goes, unseen, and it
// is told `go`),
// `drain` (the page shows, and its own animations start) and `done`. Without a worker or WebGL2 the pool
// on the page is the whole pour, and the cover fades; a worker that is not drawing yet when the page is
// ready is never waited for.
(function () {
  "use strict";

  var PREFILL = 0.38; // the share of the screen already poured when the show starts (as in liquid-sim.js)
  // The worker's code, inlined as a string by scripts/build-loader.mjs.
  var CODE = __KD_LIQUID__;
  var url = null;

  var X = null; // everything this show holds

  function mount(ctx) {
    var root = ctx.root;
    var calm = ctx.mode === "calm";
    X = { ctx: ctx, fades: [], cleanups: [], els: {}, worker: null, started: false, live: false, flat: false, exiting: false, done: false, coverIn: !ctx.nav, log: /dk=log/.test(location.search) ? [] : null };
    root.classList.add("dk");
    root.innerHTML = '<style></style><div class="dk-cover">' + (calm ? "" : '<div class="dk-pool"></div>') + "</div>" + (calm ? "" : '<canvas class="dk-glass"></canvas>');
    var q = function (sel) { return root.querySelector(sel); };
    X.els = { gut: q("style"), cover: q(".dk-cover"), pool: q(".dk-pool"), glass: q(".dk-glass") };

    // A switch: the cover (the pool with it) comes up over the page being left, the runtime pushes the
    // route once it is up, and the pour starts on it.
    if (ctx.nav) {
      gutter();
      var up = X.els.cover.animate([{ opacity: 0 }, { opacity: 1 }], { duration: calm ? 200 : 260, easing: "cubic-bezier(.4,0,.2,1)", fill: "backwards" });
      X.fades.push(up);
      ctx.covered = up.finished.then(function () { if (X) X.coverIn = true; }, function () {});
    }

    // The page is in (the DOM on a load, the new route on a switch): the lock's scrollbar follows it.
    ctx.ready.then(gutter);
    var onResize = function () {
      clearTimeout(X.resizeT);
      X.resizeT = setTimeout(resized, 120);
    };
    window.addEventListener("resize", onResize);
    X.cleanups.push(function () { window.removeEventListener("resize", onResize); clearTimeout(X.resizeT); });

    if (calm) return;
    var size = measure();
    var seedP = /[?&]seed=(\d+)/.exec(location.search);
    X.seed = seedP ? Number(seedP[1]) >>> 0 : (Math.random() * 4294967296) >>> 0;
    spawn(size);
  }

  // The screen in CSS px, and the canvas's pixels to the CSS px (at most 2, and about 4 million pixels in
  // all).
  function measure() {
    var r = X.ctx.root.getBoundingClientRect();
    var W = Math.round(r.width) || X.ctx.vw, H = Math.round(r.height) || X.ctx.vh;
    var q = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(4.2e6 / (W * H)));
    X.H = H;
    return { W: W, H: H, q: Math.round(q * 1000) / 1000 };
  }

  // The pool on the page at the needle's level (as liquid-sim.js maps it), a hair under the glass's: the
  // whole pour when there is no worker.
  function pool(p) {
    if (!X.els.pool) return;
    var H = X.H, ceil = Math.min(72, Math.max(28, 0.06 * H));
    var top = H - (PREFILL * H + p * (H - ceil - PREFILL * H)) + 2;
    X.els.pool.style.transform = "translateY(" + top.toFixed(1) + "px)";
  }

  // The worker, drawing on the canvas it is handed. Anything missing (OffscreenCanvas, Worker) or any
  // error: the pool on the page instead.
  function spawn(size) {
    var ctx = X.ctx, cv = X.els.glass;
    try {
      if (!cv.transferControlToOffscreen || typeof Worker !== "function") throw new Error("none");
      if (!url) url = URL.createObjectURL(new Blob([CODE], { type: "text/javascript" }));
      if (X.log) X.log.push(["spawn", Math.round(performance.now())]);
      var w = new Worker(url);
      X.worker = w;
      w.onmessage = heard;
      w.onerror = function () { fail("error"); };
      cv.width = Math.round(size.W * size.q);
      cv.height = Math.round(size.H * size.q);
      var off = cv.transferControlToOffscreen();
      w.postMessage({ k: "init", canvas: off, W: size.W, H: size.H, q: size.q, seed: X.seed, mode: ctx.mode === "brisk" ? "brisk" : "full", W8: ctx.W, got: ctx.got.slice(), log: !!X.log }, [off]);
    } catch {
      fail("none");
    }
  }

  function post(m) { if (X && X.worker) X.worker.postMessage(m); }

  function heard(e) {
    var m = e.data;
    if (!X || X.done) return;
    if (X.log) X.log.push(["w", m.k, Math.round(performance.now()), m.ms, m.at]);
    if (m.k === "began") {
      // The pour has started on this pool, and steps the needle itself from here.
      X.began = true;
    } else if (m.k === "live") {
      // The canvas is drawing. The pool on the page stays under it until the cover goes at the brim: the
      // canvas's first frames can reach the screen a frame or two after the worker has drawn them, and a
      // pool taken away before then would leave the glass empty for a frame. Under the canvas's ink it
      // never shows: the surface never dips under where the pour started.
      X.live = true;
    } else if (m.k === "brim") {
      // The screen is all ink: the cover goes under it, and the drain may start. A brim the time limit
      // called before the surface cleared the top edge would show the page in the gap: there the cover
      // fades instead.
      if (m.covered) X.els.cover.style.opacity = "0";
      else X.fades.push(X.els.cover.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, easing: X.ctx.ease.out, fill: "forwards" }));
      post({ k: "go" });
    } else if (m.k === "drain") {
      // The page shows from the drain: its own animations start there.
      if (X.ctx.uncover) X.ctx.uncover();
    } else if (m.k === "done") {
      if (X.resolve) X.resolve();
    } else if (m.k === "fail") fail(m.why);
    else if (m.k === "log") window.__dkWorker = m.log;
  }

  // No worker, or it failed: the pool on the page rises with the needle (frame), and the cover fades at
  // the end. Mid-exit, the exit is that fade.
  function fail(why) {
    if (!X || X.flat) return;
    X.flat = true;
    if (X.log) X.log.push(["fail", String(why)]);
    if (X.worker) {
      try { X.worker.terminate(); } catch { /* gone already */ }
      X.worker = null;
    }
    if (X.els.glass) X.els.glass.remove();
    if (X.els.pool) X.els.pool.style.display = "";
    if (X.exiting && X.resolve) fadeOut(X.ctx).then(X.resolve);
  }

  function frame(p, ctx) {
    if (!X || ctx.mode === "calm") return;
    // The pour starts on the first frame (on a switch, once the cover is up), measured again: in <head>
    // a phone can still be laying out 980px wide when the show mounts.
    if (!X.started && X.worker && X.coverIn) {
      X.started = true;
      var sz = measure();
      post({ k: "start", W: sz.W, H: sz.H, q: sz.q, p: p, t: ctx.t });
    } else if (X.started && X.worker && !X.began) post({ k: "p", p: p, t: ctx.t });
    // Without the worker the pool on the page keeps the level.
    if (X.flat) pool(p);
  }

  function milestone(name, ctx) {
    if (X && (name === "load" || name === "route" || name === "lcp")) gutter();
    if (!X || ctx.mode === "calm") return;
    post({ k: "m", got: ctx.got.slice(), hurried: !!ctx.hurried });
  }

  function reveal(ctx) {
    if (!X) return;
    X.exiting = true;
    if (X.log) X.log.push(["reveal", Math.round(ctx.t * 1000), X.live]);
    // Calm, the pool on the page, or a pour that never got to draw: the cover simply fades.
    if (ctx.mode === "calm" || X.flat || !X.live) return fadeOut(ctx);
    post({ k: "exit" });
    return new Promise(function (res) {
      X.resolve = res;
      // Never held for long, whatever happens to the worker (the runtime's own limit is 4s).
      X.exitT = setTimeout(res, 3000);
    });
  }
  function fadeOut(ctx) {
    if (X.worker) {
      try { X.worker.terminate(); } catch { /* gone already */ }
      X.worker = null;
    }
    var a = ctx.root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 320, easing: ctx.ease.out, fill: "forwards" });
    X.fades.push(a);
    ctx.uncover();
    return a.finished.then(function () {}, function () {});
  }

  function cleanup() {
    if (!X) return;
    X.done = true;
    if (X.worker) {
      try { X.worker.terminate(); } catch { /* gone already */ }
    }
    clearTimeout(X.exitT);
    for (var i = 0; i < X.fades.length; i++) X.fades[i].cancel();
    for (i = 0; i < X.cleanups.length; i++) X.cleanups[i]();
    if (X.log) window.__dkLog = X.log;
    X = null;
  }

  function resized() {
    if (!X || X.done || X.exiting) return;
    // The pool on the page follows the new height from the next frame; the worker, the new size.
    var sz = measure();
    if (X.worker && X.started) post({ k: "size", W: sz.W, H: sz.H, q: sz.q });
  }

  /* ───── The lock's scrollbar ───── */

  // The lock shows the page's own scrollbar (loader.css). A page shorter than the screen has none, so
  // there the lock hides it: the style lives in the loader's root and leaves with it. Read when the show
  // starts on a switch, once the page is in, and again as it loads.
  function gutter() {
    if (!X || X.done || !X.els.gut) return;
    var d = document.documentElement;
    var short = d.scrollHeight <= window.innerHeight + 1;
    var css = short ? "html.ld-lock{overflow:hidden}" : "";
    if (X.els.gut.textContent !== css) X.els.gut.textContent = css;
  }

  KDLoader.define({
    min: { full: 1.3, brisk: 0.45, calm: 0.9 },
    sweep: { full: 1.1, brisk: 0.45, calm: 0.6 },
    hold: 0,
    uncovers: true,
    mount: mount,
    frame: frame,
    milestone: milestone,
    reveal: reveal,
    cleanup: cleanup,
  });
})();
