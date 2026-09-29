// «Шаг назад»: the homepage's loader (docs/CONVENTIONS.md, «Шаг назад: the loader»). There is no
// loading screen of its own. The hero is filmed in close-up: its notice fills the screen, and the tear
// line along the notice is the progress bar, punched hole by hole as the page really loads. When
// everything has arrived, the camera takes one long step back to the live page. Nothing is swapped,
// because the loader was the hero all along.
//
// This file is the camera: one inline script, placed right after the hero's markup, so it runs as soon
// as the hero has been parsed and long before React. It never writes into React's nodes. It reads the
// hero's layout, writes its numbers into stylesheets of its own, animates with WAAPI (transforms, on the
// compositor) and flags its phases as classes on <html>, which React leaves alone; src/styles/loader.css
// does the rest. The head script decides whether it runs at all (html.ld-loading and
// html[data-loader="full|brisk|calm"]) and holds the kill switch.
//
// The maths is plain functions, tested in loader-script.test.ts and handed to the script as arguments.
// Every function here ships as its own source text, so none of them may use a module binding.

export type Box = { l: number; t: number; w: number; h: number };
/** The close-up: the notice drawn at scale `s`, its top-left corner at (x, y) on screen; `wide` when
 *  the whole logo is in frame. */
export type Frame = { s: number; x: number; y: number; wide: boolean };

/**
 * The close-up's framing. Wherever the whole logo fits across the screen (a margin of 4% each side)
 * with the paper still covering it, that is the frame: the logo edge to edge and the tear line in its
 * lower fifth, never so big that the two don't both fit. Elsewhere (phones, tablets, square windows,
 * the stacked hero) the logo can only be cropped, so the crop is the paper's full height, centred on the
 * tab the café guessed: a phone opens on «ДЕЛА? / СОННО». Either way the paper covers the whole screen
 * with 4px to spare (its hairline edge never shows), and the traced logo is never drawn past 1.6px per
 * unit of its 1671.
 */
export function frameFor(vw: number, vh: number, n: Box, logo: Box, perf: Box, tab: Box | null): Frame {
  const o = 4;
  const cover = Math.max((vw + 2 * o) / n.w, (vh + 2 * o) / n.h);
  const cap = (1.6 * 1671) / logo.w;
  const line = perf.t + perf.h / 2;
  const m = Math.min(120, Math.max(20, vw * 0.04));
  const fit = (vw - 2 * m) / logo.w;
  const wide = cover <= fit;
  let s: number, x: number, y: number;
  if (wide) {
    s = Math.max(Math.min(fit, (vh * 0.7) / (line - logo.t), cap), cover, 1);
    x = vw / 2 - s * (logo.l + logo.w / 2 - n.l);
    // The tear line at 82% of the screen, but the logo's top no higher than 6%.
    y = Math.max(vh * 0.82 - s * (line - n.t), vh * 0.06 - s * (logo.t - n.t));
  } else {
    s = Math.max(Math.min(cover * 1.02, cap), cover, 1.6);
    const cx = tab ? tab.l + tab.w / 2 : n.l + n.w / 2;
    x = vw / 2 - s * (cx - n.l);
    y = vh / 2 - (s * n.h) / 2;
  }
  // Never past the paper's edge.
  x = Math.min(-o, Math.max(vw + o - s * n.w, x));
  y = Math.min(-o, Math.max(vh + o - s * n.h, y));
  return { s, x, y, wide };
}

/**
 * The tear line's holes as hero.css tiles them: 10px tiles spread edge to edge (`space`), so hole i's
 * centre is 5 + i × (w − 10) / (n − 1) px from the line's inner left edge.
 */
export function holesAlong(w: number) {
  const n = Math.max(1, Math.floor(w / 10));
  const pitch = n > 1 ? (w - 10) / (n - 1) : 0;
  return { n, pitch, at: (i: number) => (n > 1 ? 5 + i * pitch : w / 2) };
}

/**
 * Where the needle is heading: the shares of the milestones in, plus a creep into what is still to
 * come, at most 60% of the largest share outstanding. It never claims a milestone that hasn't happened.
 */
export function aimAt(weights: number[], done: boolean[], t: number) {
  let sum = 0;
  let next = 0;
  for (let i = 0; i < weights.length; i++) {
    if (done[i]) sum += weights[i];
    else next = Math.max(next, weights[i]);
  }
  return Math.min(1, sum + 0.6 * next * (1 - Math.exp(-t / 1.4)));
}

/**
 * One frame of the needle: it chases the aim with no overshoot, never goes back, and never crosses
 * the line faster than once per `sweep` seconds. Close to the aim it keeps at least a third of that
 * pace, so the last holes go through in a run instead of a crawl.
 */
export function follow(v: number, aim: number, dt: number, sweep: number) {
  const gap = Math.max(0, Math.min(aim, 1) - v);
  const step = Math.max(gap * (1 - Math.exp(-dt / 0.16)), Math.min(gap, dt / (3 * sweep)));
  return v + Math.min(step, dt / sweep);
}

type KdWindow = Window & { __kdLoader?: () => void; __kdLcp?: HTMLImageElement };

function camera(frame: typeof frameFor, holesOf: typeof holesAlong, aim: typeof aimAt, chase: typeof follow) {
  const d = document.documentElement;
  const ds = d.dataset;
  const mode = ds.loader;
  if (!mode || !d.classList.contains("ld-loading")) return;
  const calm = mode === "calm";
  // Later visits in the same session: the same show, brisker.
  const k = mode === "brisk" ? 0.7 : 1;
  const win = window as KdWindow;
  const strip = () => {
    d.classList.remove("ld-loading", "ld-cam", "ld-fonts", "ld-reveal", "ld-measure", "ld-wide", "ld-tall");
    delete ds.loader;
  };

  const hero = document.getElementById("hero");
  const q = <T extends Element>(s: string) => (hero ? hero.querySelector<T>(s) : null);
  const notice = q<HTMLElement>(".notice");
  const logo = q<SVGSVGElement>(".notice__logo");
  const perf = q<HTMLElement>(".pad__perf");
  const stage = q<HTMLElement>(".stage");
  const actions = q<HTMLElement>(".hero__actions");
  const pad = q<HTMLElement>("[data-pad]");
  // Not the markup this expects, the page already scrolled, or it loaded in a background tab (by the
  // time anyone looks it is ready): no show.
  const unseen = document.visibilityState === "hidden" && !(document as Document & { prerendering?: boolean }).prerendering;
  if (!hero || !notice || !logo || !perf || !stage || !actions || !pad || window.scrollY > 2 || unseen) return strip();

  // ── State ──
  // The camera slowly closes in while the page loads (3%), then leans in a hair more and steps back.
  const PUSH = 1.03;
  const PUSH_MS = 3200 * k;
  const MIN = k < 1 ? 0.45 : 1.3; // the shortest show, seconds
  const SWEEP = k < 1 ? 0.5 : 1.15; // the needle never crosses the screen faster than this
  const SAFE = k < 1 ? 5 : 7; // the longest wait before it goes anyway
  // What the page waits for, and how much each counts: the hero parsed (now), the DOM, the fonts, the
  // hero's photo, the app (hydration), window load.
  const W = [0.1, 0.15, 0.2, 0.2, 0.15, 0.2];
  const got = [true, false, false, false, false, false];
  let phase: "wait" | "reveal" | "done" = "wait";
  let geo: { s: number; wall: number; tx: number; ty: number; h: ReturnType<typeof holesAlong>; i0: number; i1: number } | null = null;
  let push: Animation | null = null;
  let shown = -2;
  let v = 0;
  let vis = 0;
  let prev = 0;
  let loadedAt = -1;
  let readyAt = -1;
  let asked = false;
  let raf = 0;
  let resizeRaf = 0;
  let end = 0;
  const anims: Animation[] = [];

  // Two stylesheets of its own: the camera, and the needle (rewritten per hole). Adopted, so there is no
  // node in <head> for React to trip over; a <style> where adoption isn't supported.
  const sheets: CSSStyleSheet[] = [];
  const nodes: HTMLStyleElement[] = [];
  const writers = [0, 1].map((): ((css: string) => void) => {
    try {
      const s = new CSSStyleSheet();
      document.adoptedStyleSheets = document.adoptedStyleSheets.concat(s);
      sheets.push(s);
      return (css) => s.replaceSync(css);
    } catch {
      const el = document.createElement("style");
      document.head.appendChild(el);
      nodes.push(el);
      return (css) => {
        el.textContent = css;
      };
    }
  });
  const box = (el: Element): Box => {
    const r = el.getBoundingClientRect();
    return { l: r.left, t: r.top, w: r.width, h: r.height };
  };
  const tf = (x: number, y: number, s: number) => `translate(${x}px,${y}px) scale(${s})`;

  // ── The camera ──
  function measure() {
    const vw = d.clientWidth;
    const vh = window.innerHeight;
    const N = box(notice!);
    const checked = pad!.querySelector(".tab__input:checked");
    const tab = checked && checked.closest(".tab");
    const f = calm ? { s: 1, x: N.l, y: N.t, wide: true } : frame(vw, vh, N, box(logo!), box(perf!), tab ? box(tab) : null);
    // The subject: the point of the notice under the screen's centre. Every layer is drawn as
    // P → F + s(P − C), the wall at a smaller s than the notice (it is further from the lens).
    const Fx = vw / 2;
    const Fy = vh / 2;
    const Cx = N.l + (Fx - f.x) / f.s;
    const Cy = N.t + (Fy - f.y) / f.s;
    const wall = 1 + (f.wide ? 0.4 : 0.22) * (f.s - 1);
    // What the frame would crop prints as the step back brings it into view: the tab words under the
    // whole logo, the prompt beside a cropped one.
    d.classList.toggle("ld-wide", f.wide && !calm);
    d.classList.toggle("ld-tall", !f.wide && !calm);
    const layer = (sel: string, el: Element, s: number) => {
      const B = box(el);
      return `html.ld-cam ${sel}{transform-origin:${Cx - B.l}px ${Cy - B.t}px;transform:${tf(Fx - Cx, Fy - Cy, s)}}`;
    };
    // --ld-k on the two blocks that use it, not :root, so writing it never restyles the whole page.
    writers[0](
      `#hero,.site-header{--ld-k:${k}}` +
        (calm ? "" : layer(".notice", notice!, f.s) + layer(".stage", stage!, wall) + layer(".hero__actions", actions!, wall)),
    );
    // The holes on screen once the camera has closed in: those left of the frame count as punched,
    // those right of it are punched at the reveal.
    const h = holesOf(perf!.clientWidth);
    const left = box(perf!).l + perf!.clientLeft;
    const onScreen = (i: number) => Fx + f.s * PUSH * (left + h.at(i) - Cx);
    let i0 = 0;
    let i1 = h.n - 1;
    if (!calm) {
      while (i0 < h.n - 1 && onScreen(i0) < 6) i0++;
      while (i1 > i0 && onScreen(i1) > vw - 6) i1--;
    }
    geo = { s: f.s, wall, tx: Fx - Cx, ty: Fy - Cy, h, i0, i1 };
    shown = -2;
  }

  function startPush(from: number, ms: number) {
    if (calm || !geo || ms <= 0) return;
    push = notice!.animate([{ transform: tf(geo.tx, geo.ty, geo.s * from) }, { transform: tf(geo.tx, geo.ty, geo.s * PUSH) }], {
      duration: ms,
      easing: "cubic-bezier(.3,.15,.25,1)",
      fill: "forwards",
    });
  }
  /** How far the camera has closed in, over the notice's own scale (1 until it moves). */
  function pushNow() {
    const m = /matrix\(([^,]+)/.exec(getComputedStyle(notice!).transform);
    return m && geo ? parseFloat(m[1]) / geo.s : 1;
  }

  // The needle: `p` of the line's holes on screen are punched, and it sits on the next.
  function paint(p: number) {
    if (!geo) return;
    const { h, i0, i1 } = geo;
    const last = p >= 1 ? h.n - 1 : i0 - 1 + Math.floor(p * (i1 - i0 + 1) + 1e-6);
    if (last === shown) return;
    shown = last;
    const cut = last < 0 ? 0 : h.at(last) + h.pitch / 2;
    writers[1](`html.ld-cam .pad__perf{--ld-cut:${cut.toFixed(1)}px;--ld-nx:${h.at(Math.min(last + 1, h.n - 1)).toFixed(1)}px}`);
  }

  // Layout moved under the camera (the text faces arriving, a rotation): measure again, untransformed,
  // and carry the push on from where it got to.
  function remeasure() {
    resizeRaf = 0;
    if (phase !== "wait") return;
    const at = pushNow();
    const t = push && push.currentTime != null ? Number(push.currentTime) : PUSH_MS;
    push?.cancel();
    push = null;
    d.classList.add("ld-measure");
    measure();
    d.classList.remove("ld-measure");
    paint(v);
    // A push that has already run its course is re-created as a hold at the scale it reached.
    startPush(at, Math.max(1, PUSH_MS - t));
  }

  measure();
  paint(0);
  d.classList.add("ld-cam");
  startPush(1, PUSH_MS);

  // ── Milestones ──
  const onDom = () => {
    got[1] = true;
  };
  const onLoad = () => {
    got[5] = true;
    loadedAt = vis;
  };
  if (document.readyState !== "loading") onDom();
  else document.addEventListener("DOMContentLoaded", onDom, { once: true });
  if (document.readyState === "complete") onLoad();
  else window.addEventListener("load", onLoad, { once: true });

  // The words wait for their faces, so the close-up never shows a fallback font.
  const fonts = () => {
    got[2] = true;
    if (phase !== "done") d.classList.add("ld-fonts");
  };
  try {
    const face = (el: HTMLElement | null, weight: number, size: number) =>
      el ? document.fonts.load(`${weight} ${size}px ${getComputedStyle(el).fontFamily}`, el.textContent || "Как") : Promise.resolve([]);
    Promise.race([
      Promise.all([face(q(".tab__text"), 860, 48), face(q(".notice__prompt"), 500, 16)]),
      new Promise((r) => window.setTimeout(r, 3000)),
    ]).then(fonts, fonts);
    document.fonts.ready.then(() => remeasure());
  } catch {
    fonts();
  }

  // The photo on show, the hero's LCP: the copy PHOTO_SCRIPT is fetching, decoded.
  const pic = win.__kdLcp || q<HTMLImageElement>(`.panel[data-panel="${ds.answer}"] img`);
  const photo = () => {
    got[3] = true;
  };
  // Settled either way (a broken image's decode() rejects, which counts too), or still on its way.
  if (!pic) photo();
  else if (pic.complete) pic.decode().then(photo, photo);
  else {
    pic.addEventListener("load", () => pic.decode().then(photo, photo), { once: true });
    pic.addEventListener("error", photo, { once: true });
  }

  // The app: HeroController marks the hero on mount. Waited for at most 1.5s past load.
  const app = new MutationObserver(() => {
    if (hero.hasAttribute("data-js")) got[4] = true;
  });
  if (hero.hasAttribute("data-js")) got[4] = true;
  else app.observe(hero, { attributes: true, attributeFilter: ["data-js"] });

  // ── The guest: nothing scrolls under the camera, and asking to move on hurries it ──
  const KEYS: Record<string, 1> = { " ": 1, Spacebar: 1, PageDown: 1, PageUp: 1, End: 1, Home: 1, ArrowDown: 1, ArrowUp: 1 };
  const hold = (e: Event) => {
    // Tab, or focus arriving any other way: the guest is working the page, so it is theirs at once
    // (ended before the focus moves, so the browser scrolls to it on the real layout).
    if (e instanceof KeyboardEvent && e.key === "Tab") return finish();
    // Zoom (a trackpad pinch, Ctrl+wheel, Ctrl +) and the browser's own shortcuts pass.
    if ((e instanceof WheelEvent || e instanceof KeyboardEvent) && (e.ctrlKey || e.metaKey || e.altKey)) return;
    if (e instanceof KeyboardEvent && !KEYS[e.key]) return;
    if (typeof TouchEvent !== "undefined" && e instanceof TouchEvent && e.touches.length > 1) return; // a pinch still zooms
    if (e.cancelable) e.preventDefault();
    e.stopImmediatePropagation(); // Lenis and the hero never see it
    asked = true;
  };
  const tap = () => {
    asked = true;
  };
  const focused = () => finish();
  const scrolled = () => {
    if (window.scrollY > 2) finish();
  };
  const resized = () => {
    if (!resizeRaf) resizeRaf = requestAnimationFrame(remeasure);
  };
  const restored = (e: PageTransitionEvent) => {
    if (e.persisted) finish();
  };
  // Reduced motion switched on mid-show: stop moving at once.
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const still = () => {
    if (motion.matches && !calm) finish();
  };
  motion.addEventListener("change", still);
  const grab = { capture: true, passive: false };
  window.addEventListener("wheel", hold, grab);
  window.addEventListener("touchmove", hold, grab);
  window.addEventListener("keydown", hold, true);
  window.addEventListener("pointerdown", tap, true);
  document.addEventListener("focusin", focused);
  window.addEventListener("scroll", scrolled, { passive: true });
  window.addEventListener("resize", resized);
  window.addEventListener("pageshow", restored);

  // ── The clock: visible time only (frames stop in a hidden tab) ──
  // The first frame proves frames run: the head script's wall-clock kill (which counts hidden and
  // prerender time) hands over to this clock's own limit.
  let first = true;
  function tick(now: number) {
    if (first) {
      first = false;
      window.clearTimeout((win as Window & { __kdKill?: number }).__kdKill);
    }
    // The hero left the page (a client-side navigation mid-show): the show goes with it.
    if (!hero!.isConnected) return finish();
    if (phase === "reveal") {
      raf = requestAnimationFrame(tick);
      return;
    }
    const dt = prev ? Math.min(0.1, (now - prev) / 1000) : 0;
    prev = now;
    vis += dt;
    if (got[5] && !got[4] && vis - loadedAt > 1.5) got[4] = true;
    const hurry = vis > SAFE || (asked && got[1]);
    if (hurry) got.fill(true);
    v = chase(v, aim(W, got, vis), dt, hurry ? 0.3 : SWEEP);
    if (v > 0.999 && got.every(Boolean)) v = 1;
    paint(v);
    if (v === 1 && (vis >= MIN || hurry)) {
      if (readyAt < 0) readyAt = vis;
      // A beat for the last hole to read, then the step back.
      if (vis - readyAt >= 0.14) reveal();
    }
    raf = requestAnimationFrame(tick);
  }
  raf = requestAnimationFrame(tick);

  // ── The step back ──
  function reveal() {
    phase = "reveal";
    paint(1);
    d.classList.add("ld-fonts", "ld-reveal");
    if (calm) {
      // No camera: the buttons and the header fade in round the notice and its answer.
      [actions, document.querySelector(".site-header")].forEach(
        (el) => el && anims.push(el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: "ease-out", fill: "forwards" })),
      );
      end = window.setTimeout(finish, 460);
      return;
    }
    const g = geo!;
    const dolly = (el: HTMLElement, s0: number) =>
      el.animate(
        [
          { transform: tf(g.tx, g.ty, s0), easing: "cubic-bezier(.3,0,.45,1)" },
          { transform: tf(g.tx, g.ty, s0 * 1.012), offset: 0.1, easing: "cubic-bezier(.62,0,.1,1)" },
          { transform: tf(0, 0, 1) },
        ],
        { duration: 1600 * k, fill: "forwards" },
      );
    anims.push(dolly(notice!, g.s * pushNow()), dolly(stage!, g.wall), dolly(actions!, g.wall));
    push?.cancel();
    push = null;
    // The last beat in loader.css, the tabs' sway, ends 2.36s in.
    end = window.setTimeout(finish, 2420 * k);
  }

  // Done, or cut short (bfcache, a scroll, the kill switch): the page exactly as it is without a loader.
  function finish() {
    if (phase === "done") return;
    phase = "done";
    cancelAnimationFrame(raf);
    cancelAnimationFrame(resizeRaf);
    window.clearTimeout(end);
    window.removeEventListener("wheel", hold, grab);
    window.removeEventListener("touchmove", hold, grab);
    window.removeEventListener("keydown", hold, true);
    window.removeEventListener("pointerdown", tap, true);
    document.removeEventListener("focusin", focused);
    window.removeEventListener("scroll", scrolled);
    window.removeEventListener("resize", resized);
    window.removeEventListener("pageshow", restored);
    motion.removeEventListener("change", still);
    app.disconnect();
    strip();
    if (sheets.length) document.adoptedStyleSheets = document.adoptedStyleSheets.filter((s) => !sheets.includes(s));
    nodes.forEach((n) => n.remove());
    // In the same task as the classes going, so no frame shows one without the other.
    anims.forEach((a) => a.cancel());
    push?.cancel();
    try {
      // The welcome has been shown: the hero's own first-visit sway doesn't repeat this session, and a
      // later load plays the show brisker (the head script reads it).
      sessionStorage.setItem("kd-intro", "1");
    } catch {}
    delete win.__kdLoader;
    window.dispatchEvent(new Event("kd:loader-done"));
  }
  win.__kdLoader = finish;
}

/** Inlined right after the hero's markup (Hero.tsx). The maths travels with it, as arguments. */
export const LOADER_SCRIPT = `(${camera})(${frameFor},${holesAlong},${aimAt},${follow});`;
