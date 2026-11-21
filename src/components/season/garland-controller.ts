// The garland on the page (src/lib/garland.ts has its layout and physics; docs/CONVENTIONS.md, «С наступающим!»).
// Loaded with import() by Garland.tsx, only in the season. It draws the garland as SVG in its box at the top
// of the page, under the header's line, and gives it the page's motion (a flung page presses it down, a hard
// stop lets it jump), the guest's hand (a cursor brushes the bulbs, a press carries one and lets it swing, a
// click or a tap knocks it) and, with the sound on, the song: each bulb rings its note, and turning the sound
// on plays the verse along the garland, every note knocking its bulb. A frame loop runs only while something
// moves and never while the garland is off screen. The lights come on by CSS (season.css), held under the
// loader like every animation. Reduced motion: it hangs still, lit; a click still rings a bulb.

import { advance, atRest, buildGarland, knock, layoutGarland, settle, PITCH_M, type Grab, type Hand, type Sim } from "@/lib/garland";
import { sound } from "@/lib/sound";

const NS = "http://www.w3.org/2000/svg";

/** How far the hand reaches, px: a cursor brushes a little round it, a fingertip is wider. */
const REACH = { mouse: 7, pen: 6, touch: 14 } as const;
/** How far a held bulb can be carried from where it hangs before it slips out of the fingers, m. */
const CARRY = 0.07;
const SLIP = 0.13;

type Geometry = { nailsY: number; glass: number; socket: number; lead: number; width: number; height: number };

const el = <K extends keyof SVGElementTagNameMap>(name: K, attrs: Record<string, string | number> = {}) => {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  return e;
};

/** A garland bulb's glass, hanging from its socket: a teardrop pointing down, `g` tall, from y = 0. */
function glassPath(g: number, top: number) {
  const w = g * 0.64, s = top / 2;
  const f = (n: number) => n.toFixed(2);
  return (
    `M${f(-s)} 0C${f(-s)} ${f(g * 0.12)} ${f(-w / 2)} ${f(g * 0.22)} ${f(-w / 2)} ${f(g * 0.5)}` +
    `C${f(-w / 2)} ${f(g * 0.78)} ${f(-w * 0.14)} ${f(g)} 0 ${f(g)}` +
    `C${f(w * 0.14)} ${f(g)} ${f(w / 2)} ${f(g * 0.78)} ${f(w / 2)} ${f(g * 0.5)}` +
    `C${f(w / 2)} ${f(g * 0.22)} ${f(s)} ${f(g * 0.12)} ${f(s)} 0Z`
  );
}

export function mountGarland(root: HTMLElement, reduced: boolean): () => void {
  const html = document.documentElement;
  let sim: Sim;
  let geo: Geometry;
  let svg: SVGSVGElement | null = null;
  let cord: SVGPathElement;
  let bulbs: SVGGElement[] = [];
  let hits: HTMLElement[] = [];
  let running = false;
  let visible = true;
  let raf = 0;
  let last = 0;
  /** Where every particle hangs at rest, m. */
  let restX = new Float64Array(0);
  let restY = new Float64Array(0);

  const num = (v: string, fb: number) => {
    const n = parseFloat(v);
    return Number.isFinite(n) ? n : fb;
  };

  // ── The rig, at rest, for the current width ──
  function build() {
    const cs = getComputedStyle(html);
    const rem = num(cs.fontSize, 16);
    // The gutter is a clamp(): let the layout resolve it, as wide as the page's own.
    const probe = document.createElement("span");
    probe.style.cssText = "position:absolute;visibility:hidden;width:var(--gutter);height:var(--header-h)";
    root.appendChild(probe);
    const gutter = probe.offsetWidth || 16;
    const header = probe.offsetHeight || num(cs.getPropertyValue("--header-h"), 64);
    probe.remove();
    const width = root.clientWidth || window.innerWidth;
    const layout = layoutGarland(width, gutter, 2.8 * rem);
    sim = buildGarland(layout);
    settle(sim);
    restX = Float64Array.from(sim.x);
    restY = Float64Array.from(sim.y);
    const glass = Math.max(10, Math.min(0.37 * layout.pitch, 1.2 * rem));
    let deepest = 0;
    for (let i = 0; i < sim.n; i++) deepest = Math.max(deepest, sim.y[i]);
    const nailsY = header + 2;
    geo = {
      nailsY,
      glass,
      socket: glass * 0.32,
      lead: glass * 0.2,
      width,
      // Room under the deepest bulb for a swing and a bump.
      height: Math.ceil(nailsY + deepest * layout.pxPerM + glass * 2.6 + 12),
    };
    draw();
    render();
  }

  const X = (m: number) => sim.layout.margin + m * sim.layout.pxPerM;
  const Y = (m: number) => geo.nailsY + m * sim.layout.pxPerM;

  // ── The drawing ──
  function draw() {
    svg?.remove();
    hits.forEach((h) => h.remove());
    const { width, height, glass, socket, lead } = geo;
    root.style.height = `${height}px`;
    svg = el("svg", { class: "xm-garland__svg", width, height, viewBox: `0 0 ${width} ${height}`, focusable: "false" });
    cord = el("path", { class: "xm-garland__cord" });
    svg.appendChild(cord);
    const socketW = glass * 0.46;
    bulbs = sim.layout.bulbs.map((b, k) => {
      const g = el("g", { class: "xm-bulb", "data-kind": k % 2 });
      g.style.setProperty("--i", String(k));
      g.appendChild(el("line", { class: "xm-bulb__lead", x1: 0, y1: 0, x2: 0, y2: lead + 0.5 }));
      g.appendChild(el("rect", { class: "xm-bulb__socket", x: -socketW / 2, y: lead, width: socketW, height: socket, rx: Math.min(1.2, socketW / 4) }));
      const gl = el("path", { class: "xm-bulb__glass", d: glassPath(glass, socketW * 0.86) });
      gl.setAttribute("transform", `translate(0 ${(lead + socket - 0.4).toFixed(2)})`);
      g.appendChild(gl);
      svg!.appendChild(g);
      return g;
    });
    const nails = el("g", { class: "xm-garland__nails" });
    for (const e of sim.layout.nails) {
      nails.appendChild(el("circle", { cx: X(e * PITCH_M).toFixed(2), cy: Y(0).toFixed(2), r: Math.max(1.6, glass * 0.13) }));
    }
    svg.appendChild(nails);
    root.prepend(svg);
    // The bulbs' hit areas, where they hang: a press carries a bulb, a click or a tap knocks it.
    const reach = Math.max(14, glass * 1.05);
    hits = sim.layout.bulbs.map((_, k) => {
      const i = sim.cord + k;
      const node = sim.attach[k];
      const h = document.createElement("span");
      h.className = "xm-garland__hit";
      h.setAttribute("aria-hidden", "true");
      h.dataset.bulb = String(k);
      const top = Y(sim.y[node]);
      const bottom = Y(sim.y[i]) + glass + socket;
      h.style.cssText = `left:${(X(sim.x[i]) - reach).toFixed(1)}px;top:${top.toFixed(1)}px;width:${(2 * reach).toFixed(1)}px;height:${(bottom - top + 4).toFixed(1)}px`;
      root.appendChild(h);
      return h;
    });
  }

  function render() {
    const { x, y, cord: n } = sim;
    // The cord: a smooth curve through its nodes (Catmull-Rom, as cubic Béziers).
    const px = (i: number) => X(x[Math.max(0, Math.min(n - 1, i))]);
    const py = (i: number) => Y(y[Math.max(0, Math.min(n - 1, i))]);
    let d = `M${px(0).toFixed(2)} ${py(0).toFixed(2)}`;
    for (let i = 0; i < n - 1; i++) {
      const c1x = px(i) + (px(i + 1) - px(i - 1)) / 6, c1y = py(i) + (py(i + 1) - py(i - 1)) / 6;
      const c2x = px(i + 1) - (px(i + 2) - px(i)) / 6, c2y = py(i + 1) - (py(i + 2) - py(i)) / 6;
      d += `C${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${px(i + 1).toFixed(2)} ${py(i + 1).toFixed(2)}`;
    }
    cord.setAttribute("d", d);
    for (let k = 0; k < bulbs.length; k++) {
      const node = sim.attach[k];
      const i = sim.cord + k;
      const dx = x[i] - x[node], dy = y[i] - y[node];
      const angle = (-Math.atan2(dx, dy) * 180) / Math.PI;
      bulbs[k].setAttribute("transform", `translate(${X(x[node]).toFixed(2)} ${Y(y[node]).toFixed(2)}) rotate(${angle.toFixed(2)})`);
    }
  }

  // ── The page's motion: the nails move with it, so its acceleration acts on the garland ──
  let sy = window.scrollY, sv = 0, sa = 0, st = performance.now();
  let accel = 0;
  const sample = (now: number) => {
    const dt = (now - st) / 1000;
    if (dt < 0.004) return;
    const yNow = window.scrollY;
    // A pause, or a jump (an anchor, a new page): the page starts from still.
    if (dt > 0.15 || Math.abs(yNow - sy) > window.innerHeight * 0.6) {
      sy = yNow;
      sv = 0;
      sa = 0;
      st = now;
      accel = 0;
      return;
    }
    const v = (yNow - sy) / dt;
    const a = (v - sv) / dt;
    sy = yNow;
    sv = v;
    st = now;
    sa += (a - sa) * Math.min(1, dt / 0.05);
    // The page moves against the scroll; in its frame the garland feels the opposite, y down, m/s².
    accel = Math.max(-30, Math.min(30, sa / sim.layout.pxPerM));
  };

  // ── The hand ──
  type Pointer = { x: number; y: number; x0: number; y0: number; r: number; at: number; type: string };
  let pointer: Pointer | null = null;
  let grab: (Grab & { pointerId: number; sx: number; sy: number; moved: boolean }) | null = null;
  const local = (cx: number, cy: number) => {
    const r = root.getBoundingClientRect();
    return { x: (cx - r.left - sim.layout.margin) / sim.layout.pxPerM, y: (cy - r.top - geo.nailsY) / sim.layout.pxPerM };
  };
  const onMove = (e: PointerEvent) => {
    if (!visible || reduced) return;
    const p = local(e.clientX, e.clientY);
    const span = sim.layout.length * PITCH_M;
    const inside = p.x > -0.1 && p.x < span + 0.1 && p.y > -0.08 && p.y < geo.height / sim.layout.pxPerM;
    if (grab && e.pointerId === grab.pointerId) {
      if (Math.hypot(e.clientX - grab.sx, e.clientY - grab.sy) > 4) grab.moved = true;
      carry(p.x, p.y);
      wake();
      return;
    }
    if (!inside) {
      pointer = null;
      return;
    }
    const type = e.pointerType === "touch" ? "touch" : e.pointerType === "pen" ? "pen" : "mouse";
    const r = REACH[type] / sim.layout.pxPerM;
    pointer = pointer ? { ...pointer, x: p.x, y: p.y, r, at: performance.now(), type } : { x: p.x, y: p.y, x0: p.x, y0: p.y, r, at: performance.now(), type };
    wake();
  };
  const carry = (gx: number, gy: number) => {
    if (!grab) return;
    // From where it hangs at rest.
    const ax = restX[sim.cord + grab.bulb], ay = restY[sim.cord + grab.bulb];
    const dx = gx - ax, dy = gy - ay;
    const d = Math.hypot(dx, dy);
    if (d > SLIP) {
      // It slips out of the fingers and swings.
      release(true);
      return;
    }
    const k = d > CARRY ? CARRY / d : 1;
    grab.x = ax + dx * k;
    grab.y = ay + dy * k;
  };
  const ring = (bulb: number, force: number) => {
    const b = sim.layout.bulbs[bulb];
    sound.bell(b.midi, { gain: 0.25 + 0.75 * force, pan: (X(b.t * PITCH_M) / geo.width) * 1.4 - 0.7 });
  };
  /** A knock, away from the side it came from (`from`: the press's x in the garland's box, px). */
  const strike = (bulb: number, from: number) => {
    const i = sim.cord + bulb;
    const dir = from < X(sim.x[i]) ? 1 : -1;
    if (!reduced) {
      knock(sim, bulb, dir * 0.55);
      wake();
    }
    ring(bulb, 0.7);
  };
  const release = (slipped = false) => {
    if (!grab) return;
    const g = grab;
    grab = null;
    hits[g.bulb]?.removeAttribute("data-held");
    root.removeAttribute("data-holding");
    if (!g.moved && !slipped) strike(g.bulb, g.sx - root.getBoundingClientRect().left);
    else ring(g.bulb, 0.5);
    wake();
  };
  const onDown = (e: PointerEvent) => {
    const hit = (e.target as HTMLElement).closest<HTMLElement>(".xm-garland__hit");
    if (!hit || e.button !== 0) return;
    const bulb = Number(hit.dataset.bulb);
    const r = root.getBoundingClientRect();
    if (e.pointerType === "touch" || reduced) {
      // A tap knocks it (on touch the page keeps its scroll: nothing is held).
      tap = { bulb, x: e.clientX, y: e.clientY, id: e.pointerId, left: e.clientX - r.left };
      return;
    }
    e.preventDefault();
    hit.setPointerCapture?.(e.pointerId);
    const p = local(e.clientX, e.clientY);
    grab = { bulb, x: p.x, y: p.y, pointerId: e.pointerId, sx: e.clientX, sy: e.clientY, moved: false };
    hit.dataset.held = "";
    root.dataset.holding = "";
    carry(p.x, p.y);
    wake();
  };
  let tap: { bulb: number; x: number; y: number; id: number; left: number } | null = null;
  const onUp = (e: PointerEvent) => {
    if (grab && e.pointerId === grab.pointerId) release();
    if (tap && e.pointerId === tap.id) {
      if (Math.hypot(e.clientX - tap.x, e.clientY - tap.y) < 10) strike(tap.bulb, tap.left);
      tap = null;
    }
  };
  const onCancel = (e: PointerEvent) => {
    if (grab && e.pointerId === grab.pointerId) release(true);
    if (tap && e.pointerId === tap.id) tap = null;
  };

  // ── The loop ──
  const frame = (now: number) => {
    raf = 0;
    sample(now);
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    let hand: Hand | null = null;
    if (pointer) {
      // A cursor resting on the garland isn't touching it any more.
      if (now - pointer.at < 260) hand = { x: pointer.x, y: pointer.y, x0: pointer.x0, y0: pointer.y0, r: pointer.r };
      pointer.x0 = pointer.x;
      pointer.y0 = pointer.y;
    }
    const rings = advance(sim, dt, { accel, hand, grab });
    for (const r of rings) ring(r.bulb, r.force);
    render();
    const idle = !grab && !hand && Math.abs(accel) < 0.05;
    if (idle && atRest(sim)) {
      running = false;
      last = 0;
      return;
    }
    if (!visible && !grab) {
      running = false;
      last = 0;
      return;
    }
    raf = requestAnimationFrame(frame);
  };
  function wake() {
    if (running || reduced || !visible) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(frame);
  }
  const onScroll = () => {
    sample(performance.now());
    if (Math.abs(accel) > 0.4) wake();
  };

  // ── The song, when the sound comes on ──
  const onSound = (e: Event) => {
    if (!(e as CustomEvent<{ on: boolean }>).detail?.on) return;
    sound.jingle();
    const n = bulbs.length;
    sound.melody({
      verses: sim.layout.halves > 2 ? 2 : 1,
      delay: 0.7,
      onNote: (k) => {
        if (!visible || reduced) return;
        knock(sim, k % n, 0.42);
        wake();
      },
    });
  };

  build();
  // The lights come on: a wave from the first bulb, by CSS (held under the loader). A garland hung again
  // (a new width) is simply lit.
  root.dataset.lit = "";
  const lit = window.setTimeout(() => {
    delete root.dataset.lit;
    root.dataset.on = "";
  }, 450 + bulbs.length * 44 + 600 + (html.classList.contains("ld-on") ? 60_000 : 0));
  const onLoaded = () => {
    window.clearTimeout(lit);
    window.setTimeout(() => {
      delete root.dataset.lit;
      root.dataset.on = "";
    }, 450 + bulbs.length * 44 + 700);
  };
  window.addEventListener("kd:loader-done", onLoaded, { once: true });

  // The Kremlin clock strikes (SeasonIsland): every light blinks, and the garland gives a little jump.
  let blink = 0;
  const onChimes = () => {
    root.dataset.blink = "";
    window.clearTimeout(blink);
    blink = window.setTimeout(() => delete root.dataset.blink, 240);
    if (reduced || !visible) return;
    for (let b = 0; b < bulbs.length; b++) knock(sim, b, (b % 2 ? 1 : -1) * 0.3);
    wake();
  };
  window.addEventListener("kd:chimes", onChimes);

  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !atRest(sim)) wake();
  });
  io.observe(root);
  let lastWidth = root.clientWidth;
  const ro = new ResizeObserver(() => {
    const w = root.clientWidth;
    if (w === lastWidth) return;
    lastWidth = w;
    cancelAnimationFrame(raf);
    running = false;
    grab = null;
    build();
    delete root.dataset.lit;
    root.dataset.on = "";
  });
  ro.observe(root);

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onCancel);
  root.addEventListener("pointerdown", onDown);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("kd:sound", onSound);

  return () => {
    cancelAnimationFrame(raf);
    io.disconnect();
    ro.disconnect();
    window.removeEventListener("pointermove", onMove);
    window.removeEventListener("pointerup", onUp);
    window.removeEventListener("pointercancel", onCancel);
    root.removeEventListener("pointerdown", onDown);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("kd:sound", onSound);
    window.removeEventListener("kd:chimes", onChimes);
    window.removeEventListener("kd:loader-done", onLoaded);
    window.clearTimeout(lit);
    window.clearTimeout(blink);
    svg?.remove();
    hits.forEach((h) => h.remove());
    delete root.dataset.lit;
    delete root.dataset.on;
    delete root.dataset.blink;
    delete root.dataset.holding;
    root.style.removeProperty("height");
  };
}
