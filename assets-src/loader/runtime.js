// The loading screen's runtime: everything but its look (the look is pour.js). Minified and inlined in
// <head> by scripts/build-loader.mjs (src/components/loader/loader-script.ts), right after HEAD_SCRIPT.
// It plays two kinds of show:
//   a load: the head script decides (html.ld-on and data-ld="full|brisk|calm", html.ld-lock when there is
//     no hash to land on), and boot() plays it over the page while it loads;
//   a switch: a click on a link to one of the site's own pages that hasn't been shown in this visit (a page
//     seen before has nothing left to load). It plays over the page the guest is leaving (brisk, or calm),
//     pushes the route once its cover is up and hands the new page over when it has loaded underneath.
//     React lends it the router (window.__kdPush) and tells it each page that arrives (KDLoader.arrived,
//     from the Providers).
// Nothing here writes into React's nodes: the loader's root is a custom element under <html>, made before
// <body> exists on a load (React hydrates <html> and <body> by tag name and skips a tag it doesn't
// expect), and it is removed at the end.
//
// The look calls KDLoader.define({ min, sweep, hold, uncovers, mount, frame, milestone, reveal, cleanup }):
//   mount(ctx) builds inside ctx.root (on a switch it sets ctx.covered, a Promise for the cover being up);
//   frame(p, ctx) runs every frame while waiting, p the honest progress (0..1, never back); milestone(name)
//   as each really arrives; reveal(ctx) returns a Promise that resolves when the page is live (with
//   `uncovers`, it calls ctx.uncover() itself when the page starts to show); cleanup(ctx) cancels anything
//   left, also when the show is cut short.
(function () {
  "use strict";
  var d = document.documentElement;
  var ds = d.dataset;
  var def = null;
  var ease = { out: "cubic-bezier(.16,1,.3,1)" };
  // The build's base path (the English build lives under /en) and the site's own pages
  // (src/content/routes.ts), both filled in where the script is inlined.
  var BASE = __KD_BASE__;
  var ROUTES = __KD_ROUTES__;
  // The pages shown in this visit.
  var seen = {};

  // What a show waits for, and how much each counts.
  var PLANS = {
    // A load: parsed (now), the DOM, the faces, the first screen's images decoded, the app (hydration),
    // window load.
    load: { W: [0.1, 0.15, 0.2, 0.2, 0.15, 0.2], names: ["parsed", "dom", "fonts", "lcp", "app", "load"] },
    // A switch: asked (now), the new page in (committed), its faces, its first screen's images decoded.
    nav: { W: [0.1, 0.35, 0.15, 0.4], names: ["asked", "route", "fonts", "lcp"] },
  };

  var S = null; // the show on screen

  // Where the needle is heading: the shares in, plus a creep of at most 60% into the largest share out.
  function aim(W, got, t) {
    var sum = 0, next = 0;
    for (var i = 0; i < W.length; i++) {
      if (got[i]) sum += W[i];
      else next = Math.max(next, W[i]);
    }
    return Math.min(1, sum + 0.6 * next * (1 - Math.exp(-t / 1.4)));
  }
  // It chases the aim with no overshoot, never goes back, and never crosses in under `sweep` seconds.
  function follow(cur, to, dt, sweep) {
    var gap = Math.max(0, Math.min(to, 1) - cur);
    var step = Math.max(gap * (1 - Math.exp(-dt / 0.16)), Math.min(gap, dt / (3 * sweep)));
    return cur + Math.min(step, dt / sweep);
  }
  function mark(name) {
    if (!S) return;
    var i = S.names.indexOf(name);
    if (i < 0 || S.got[i]) return;
    S.got[i] = true;
    S.ctx.done[name] = true;
    if (def && def.milestone && S.phase === "wait") {
      try { def.milestone(name, S.ctx); } catch (e) {}
    }
  }

  // The path under the base path, without a trailing slash; null outside this build.
  function pathOf(p) {
    if (BASE) {
      if (p !== BASE && p.indexOf(BASE + "/") !== 0) return null;
      p = p.slice(BASE.length);
    }
    return p.replace(/\/$/, "") || "/";
  }
  function saveData() { try { return !!navigator.connection.saveData; } catch (e) { return false; } }

  // A show: its root under <html>, the look mounted in it, the clock started.
  function begin(kind, mode, page, extra) {
    var root = document.createElement("ld-screen");
    root.id = "ld-screen";
    root.setAttribute("aria-hidden", "true");
    d.appendChild(root);
    var plan = PLANS[kind];
    var ready = {};
    var ctx = {
      root: root,
      kind: kind,
      nav: kind === "nav",
      mode: mode,
      page: page,
      vw: d.clientWidth,
      vh: window.innerHeight,
      t: 0, p: 0, dt: 0,
      W: plan.W,
      done: {},
      hurried: false,
      // The page is in: the DOM on a load, the new route on a switch.
      ready: new Promise(function (r) { ready.dom = r; }),
      ease: ease,
    };
    ctx.got = plan.names.map(function () { return false; });
    ctx.got[0] = true;
    S = {
      kind: kind, ctx: ctx, phase: "wait", names: plan.names, got: ctx.got, W: plan.W, ready: ready,
      v: 0, vis: 0, prev: 0, loadedAt: -1, readyAt: -1, hydratedAt: -1, asked: false, raf: 0, first: true,
      exitT: 0, href: "", from: "", pushed: false,
    };
    for (var k in extra) S[k] = extra[k];
    window.addEventListener("resize", onResize);
    listen(true);
    try { def.mount(ctx); } catch (e) { finish(true); return null; }
    S.raf = requestAnimationFrame(tick);
    return S;
  }

  // The page's faces (at most 3s).
  function facesIn() {
    try {
      var cs = getComputedStyle(d);
      var disp = cs.getPropertyValue("--nf-display").trim() || "sans-serif";
      var sans = cs.getPropertyValue("--nf-sans").trim() || "sans-serif";
      return Promise.race([
        Promise.all([document.fonts.load("860 64px " + disp, "КАКДЕЛА?"), document.fonts.load("500 16px " + sans, "Как дела")]),
        new Promise(function (r) { setTimeout(r, 3000); }),
      ]).then(function () {}, function () {});
    } catch (e) { return Promise.resolve(); }
  }

  // The images the guest sees first: in the first screen, largest first, at most three; then `done`.
  function firstScreen(done, extra) {
    var vw = d.clientWidth, vh = window.innerHeight;
    var area = function (im) { var r = im.getBoundingClientRect(); return r.width * r.height; };
    var main = document.getElementById("main") || document;
    var imgs = Array.prototype.slice.call(main.getElementsByTagName("img")).filter(function (im) {
      var r = im.getBoundingClientRect();
      return r.width * r.height > vw * vh * 0.04 && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
    }).sort(function (a, b) { return area(b) - area(a); }).slice(0, 3);
    if (extra) imgs.unshift(extra);
    if (!imgs.length) return done();
    var left = imgs.length;
    var one = function () { if (--left <= 0) done(); };
    imgs.forEach(function (im) {
      var decoded = function () { (im.decode ? im.decode() : Promise.resolve()).then(one, one); };
      if (im.complete) decoded();
      else {
        im.addEventListener("load", decoded, { once: true });
        im.addEventListener("error", one, { once: true });
      }
    });
  }

  var KDLoader = {
    define: function (o) { def = o; },
    // A load: the show the head script asked for, and the switches from here on.
    boot: function () {
      var here = pathOf(location.pathname);
      if (here) seen[here] = 1;
      window.addEventListener("click", clicked, true);
      if (!def || !ds.ld || !d.classList.contains("ld-on")) return;
      if (!begin("load", ds.ld, here || "/", {})) return;
      var sh = S;
      facesIn().then(function () { if (S === sh) mark("fonts"); });
      var onDom = function () {
        if (S !== sh) return;
        sh.ready.dom();
        mark("dom");
        firstScreen(function () { mark("lcp"); }, window.__kdLcp);
      };
      if (document.readyState !== "loading") onDom();
      else document.addEventListener("DOMContentLoaded", onDom, { once: true });
      var onLoad = function () { if (S !== sh) return; mark("load"); sh.loadedAt = sh.vis; };
      if (document.readyState === "complete") onLoad();
      else window.addEventListener("load", onLoad, { once: true });
    },
    // React: a page is on show (every commit of a new path, and the first one at hydration).
    arrived: function (path) {
      var p = pathOf((BASE || "") + (path || "/")) || "/";
      seen[p] = 1;
      if (!S || S.kind !== "nav" || !S.pushed || S.in || p === S.from) return;
      S.in = true;
      S.ctx.page = p;
      var sh = S;
      // One frame for the new page's layout (and the router's scroll) to settle before it is measured.
      requestAnimationFrame(function () {
        if (S !== sh) return;
        sh.ready.dom();
        mark("route");
        firstScreen(function () { mark("lcp"); });
        facesIn().then(function () { if (S === sh) mark("fonts"); });
      });
    },
  };

  // ── A switch ──
  function clicked(e) {
    if (S || !def || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var push = window.__kdPush;
    if (typeof push !== "function") return;
    var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
    if (!a || (a.getAttribute("target") && a.getAttribute("target") !== "_self") || a.hasAttribute("download")) return;
    var u;
    try { u = new URL(a.getAttribute("href"), location.href); } catch (err) { return; }
    if (u.origin !== location.origin) return;
    var to = pathOf(u.pathname), here = pathOf(location.pathname);
    if (!to || to === here || seen[to] || ROUTES.indexOf(to) < 0) return;
    if (saveData() || document.visibilityState === "hidden") return;
    e.preventDefault();
    var mode = ds.motion === "reduced" ? "calm" : "brisk";
    ds.ld = mode;
    d.classList.add("ld-on", "ld-lock");
    if (!begin("nav", mode, to, { href: (to === "/" ? "/" : to) + u.search + u.hash, from: here })) return;
    var sh = S;
    // The route goes once the cover is up (at most 400ms from the click): the page underneath is only
    // swapped where no one sees it.
    var go = function () { if (S === sh) pushNow(sh); };
    Promise.resolve(S.ctx.covered).then(go, go);
    setTimeout(go, 400);
  }
  function pushNow(sh) {
    if (sh.pushed) return;
    sh.pushed = true;
    try { window.__kdPush(sh.href); } catch (e) { location.assign(BASE + sh.href); }
  }

  function onResize() {
    if (!S) return;
    S.ctx.vw = d.clientWidth;
    S.ctx.vh = window.innerHeight;
  }

  // ── The guest is never held: the page doesn't scroll under the cover, and asking to move on hurries
  // it; Tab, or focus landing anywhere, ends it at once (on a switch only Tab: the router moves the focus
  // itself when the new page comes in) ──
  function listen(on) {
    var f = on ? "addEventListener" : "removeEventListener";
    window[f]("wheel", hold, { capture: true, passive: false });
    window[f]("touchmove", hold, { capture: true, passive: false });
    window[f]("keydown", hold, true);
    window[f]("pointerdown", tap, true);
    document[f]("focusin", focused);
    window[f]("pageshow", restored);
    window[f]("popstate", back);
  }
  var KEYS = { " ": 1, Spacebar: 1, PageDown: 1, PageUp: 1, End: 1, Home: 1, ArrowDown: 1, ArrowUp: 1 };
  function hold(e) {
    if (!S || (S.phase !== "wait" && S.phase !== "reveal")) return;
    if (e.type === "keydown" && e.key === "Tab") return finish(true);
    // Zoom (a pinch, Ctrl + wheel) and the browser's own shortcuts pass.
    if ((e.type === "wheel" || e.type === "keydown") && (e.ctrlKey || e.metaKey || e.altKey)) return;
    if (e.type === "keydown" && !KEYS[e.key]) return;
    if (e.type === "touchmove" && e.touches && e.touches.length > 1) return;
    if (d.classList.contains("ld-lock") && e.cancelable) e.preventDefault();
    e.stopImmediatePropagation();
    S.asked = true;
  }
  function tap() { if (S) S.asked = true; }
  function focused() { if (S && S.kind === "load" && (S.phase === "wait" || S.phase === "reveal")) finish(true); }
  function restored(e) { if (e.persisted) finish(true); }
  // Back or forward mid-switch: the browser's own way wins.
  function back() { if (S && S.kind === "nav") { S.pushed = true; finish(true); } }

  function hydrated() {
    if (ds.pour) return true;
    for (var k in document) if (k.indexOf("__reactContainer$") === 0) return true;
    return false;
  }

  // ── The clock: visible time only (frames stop in a hidden tab) ──
  function tick(now) {
    if (!S || S.phase !== "wait") return;
    var ctx = S.ctx;
    if (S.first) {
      // Frames run: the head script's wall-clock kill hands over to this clock's own limit.
      S.first = false;
      if (S.kind === "load") clearTimeout(window.__kdKill);
    }
    var dt = S.prev ? Math.min(0.1, (now - S.prev) / 1000) : 0;
    S.prev = now;
    S.vis += dt;
    var vis = S.vis, mode = ctx.mode;
    if (S.kind === "load" && !S.got[4]) {
      if (hydrated()) {
        if (S.hydratedAt < 0) S.hydratedAt = vis;
        else if (vis - S.hydratedAt > 0.12) mark("app");
      }
      if (S.got[5] && vis - S.loadedAt > 1.5) mark("app");
    }
    // It goes after 7s of visible time (5 brisk) whatever is missing; a switch still waits for its page
    // (the old one is not handed back) up to 12s.
    var late = vis > (mode === "brisk" ? 5 : 7) || (S.asked && (S.kind === "load" ? S.got[1] : S.in));
    var hurry = late && (S.kind === "load" || S.in || vis > 12);
    if (hurry && !ctx.hurried) {
      ctx.hurried = true;
      for (var i = 0; i < S.names.length; i++) mark(S.names[i]);
    }
    var sweep = (def.sweep && def.sweep[mode]) || (mode === "brisk" ? 0.5 : mode === "calm" ? 0.6 : 1.15);
    S.v = follow(S.v, aim(S.W, S.got, vis), dt, hurry ? 0.3 : sweep);
    if (S.v > 0.999 && S.got.every(Boolean)) S.v = 1;
    ctx.t = vis;
    ctx.p = S.v;
    ctx.dt = dt;
    try { if (def.frame) def.frame(S.v, ctx); } catch (e) {}
    if (!S || S.phase !== "wait") return;
    var min = def.min && def.min[mode] != null ? def.min[mode] : mode === "brisk" ? 0.5 : mode === "calm" ? 0.4 : 1.3;
    if (S.v === 1 && (vis >= min || hurry)) {
      if (S.readyAt < 0) S.readyAt = vis;
      if ((vis - S.readyAt) * 1000 >= (def.hold != null ? def.hold : 140)) return reveal();
    }
    S.raf = requestAnimationFrame(tick);
  }

  // The exit. The look plays it first and calls ctx.uncover() when the page starts to show (the drain):
  // only then do the page's own animations start and does it take the pointer, so that work (a restyle
  // of the whole page) never holds up the exit's first frames.
  function reveal() {
    var sh = S;
    sh.phase = "reveal";
    var uncover = function () { if (S === sh) d.classList.add("ld-reveal"); };
    sh.ctx.uncover = uncover;
    var p;
    try { p = def.reveal ? def.reveal(sh.ctx) : null; } catch (e) {}
    if (!def.uncovers) uncover();
    setTimeout(uncover, 1200);
    var end = function () { if (S === sh) finish(false); };
    Promise.resolve(p).then(end, end);
    // The exit never holds the page for long, whatever happens to it.
    sh.exitT = setTimeout(end, 4000);
  }

  // Done, or cut short (Tab, a bfcache restore, the kill switch): the page exactly as it is without a loader.
  function finish(cut) {
    if (!S) {
      // The head script's kill switch, before any show began.
      d.classList.remove("ld-on", "ld-lock", "ld-reveal");
      delete ds.ld;
      return;
    }
    var sh = S;
    sh.phase = "done";
    cancelAnimationFrame(sh.raf);
    clearTimeout(sh.exitT);
    if (sh.kind === "load") clearTimeout(window.__kdKill);
    listen(false);
    window.removeEventListener("resize", onResize);
    try { if (def && def.cleanup) def.cleanup(sh.ctx); } catch (e) {}
    if (sh.ctx.root) sh.ctx.root.remove();
    d.classList.remove("ld-on", "ld-lock", "ld-reveal");
    delete ds.ld;
    S = null;
    // A switch cut short still goes where the guest asked.
    if (sh.kind === "nav") pushNow(sh);
    // The welcome has been shown: a later load this session plays the brisk show (the head script reads it).
    if (sh.kind === "load") { try { sessionStorage.setItem("kd-intro", "1"); } catch (e) {} }
    window.dispatchEvent(new CustomEvent("kd:loader-done", { detail: { cut: !!cut, kind: sh.kind } }));
  }
  KDLoader.finish = finish;
  window.KDLoader = KDLoader;
})();
