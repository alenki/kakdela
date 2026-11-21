// Snow on the page (src/lib/snow.ts has the air, the flakes and the settling; docs/CONVENTIONS.md, «С
// наступающим!»). Loaded with import() by Snowfall.tsx, only in the season. Two canvases:
//   the fall    fixed over the screen, under the header: the flakes in the air in front of the page, in the
//               site's milk, so they show the way snow shows (hardly against the day's cream, white over a
//               photo, thick over the evening's ink and the coffee poster's red)
//   the drift   laid over the footer's wordmark and moving with the page: the snow that has settled on its
//               letters and its clover, from before the guest came (snowedOn) and from what falls while they
//               are there
// The fall runs while the tab is seen and the page isn't covered (the loader, the «Разделы» dialog, a run of
// the game); reduced motion and Save-Data have no fall, only the snow already on the wordmark.

import { fall, flakesFor, land, makeDrift, snowedOn, spawn, type Drift, type Flake } from "@/lib/snow";
import { mulberry32 } from "@/lib/seed";

const MILK = "#fff8ee";
/** The drift's cell, CSS px: a flake is a cell or two. */
const CELL = 2;

export function mountSnow(canvas: HTMLCanvasElement, opts: { fall: boolean }): () => void {
  const html = document.documentElement;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) return () => {};
  const rnd = mulberry32(Date.now() & 0xffff);
  const dpr = () => Math.min(1.5, window.devicePixelRatio || 1);
  let W = 0, H = 0, scale = 1;
  const flakes: Flake[] = [];
  let raf = 0;
  let sleep = 0;
  let last = 0;
  let t = 0;
  let alive = true;

  // Soft discs of milk, from crisp (far) to blurred (near): a flake out of focus is a soft round.
  const sprites = [0, 0.35, 0.7, 1].map((soft) => {
    const s = 32;
    const c = document.createElement("canvas");
    c.width = c.height = s;
    const g = c.getContext("2d")!;
    const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    grad.addColorStop(0, MILK);
    grad.addColorStop(Math.max(0.05, 0.86 - soft * 0.6), MILK);
    grad.addColorStop(1, "rgba(255,248,238,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, s, s);
    return c;
  });

  // The canvas is as tall as the tallest the screen has been at this width: a phone's bars folding (Telegram
  // resizes the page as they do, mid-scroll) never makes it reallocate or stretch; it just reaches past the
  // screen's foot for a moment.
  const size = () => {
    const w = window.innerWidth, h = window.innerHeight, s = dpr();
    if (w === W && h <= H && s === scale) return;
    H = w === W ? Math.max(H, h) : h;
    W = w;
    scale = s;
    canvas.width = Math.round(W * scale);
    canvas.height = Math.round(H * scale);
    canvas.style.height = `${H}px`;
    const want = flakesFor(W, H);
    while (flakes.length < want) flakes.push(spawn(rnd, W, H));
    flakes.length = want;
  };

  // ── The page's motion and the guest's hand ──
  let sy = window.scrollY, sv = 0, st = performance.now();
  const scrollSpeed = (now: number) => {
    const dt = (now - st) / 1000;
    if (dt < 0.004) return sv;
    const y = window.scrollY;
    const v = Math.abs(y - sy) > H * 0.8 ? 0 : (y - sy) / dt;
    sv += (v - sv) * Math.min(1, dt / 0.08);
    sy = y;
    st = now;
    return sv;
  };
  let hand: { x: number; y: number; vx: number; vy: number; at: number } | null = null;
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const now = performance.now();
    if (hand && now - hand.at < 100) {
      const dt = Math.max(0.008, (now - hand.at) / 1000);
      const vx = (e.clientX - hand.x) / dt, vy = (e.clientY - hand.y) / dt;
      hand = { x: e.clientX, y: e.clientY, vx: hand.vx * 0.5 + vx * 0.5, vy: hand.vy * 0.5 + vy * 0.5, at: now };
    } else hand = { x: e.clientX, y: e.clientY, vx: 0, vy: 0, at: now };
  };

  // ── The drift on the wordmark ──
  let drift: Drift | null = null;
  let driftCanvas: HTMLCanvasElement | null = null;
  let dctx: CanvasRenderingContext2D | null = null;
  let mark: SVGSVGElement | null = null;
  let markRect: DOMRect | null = null;
  let markSeen = false;
  const paint = (c: number, r: number, rad = CELL * 0.9) => {
    if (!dctx) return;
    dctx.beginPath();
    dctx.arc((c + 0.5) * CELL, (r + 0.5) * CELL, rad, 0, Math.PI * 2);
    dctx.fill();
  };
  let hung = 0;
  let hungWidth = -1;
  async function hangDrift() {
    const gen = ++hung;
    mark = document.querySelector<SVGSVGElement>("#footer .ft-mark");
    const sign = mark?.parentElement;
    if (!mark || !sign) return;
    const box = mark.getBoundingClientRect();
    if (box.width < 40) return;
    // Only a new size hangs it again (the snow on it would go): a phone's bars changing the height don't.
    if (Math.round(box.width) === hungWidth && driftCanvas?.isConnected) return;
    hungWidth = Math.round(box.width);
    const cols = Math.ceil(box.width / CELL), rows = Math.ceil(box.height / CELL) + 8;
    // The letters as a mask: the wordmark drawn into the grid (its own shape, whatever its size).
    const clone = mark.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("width", String(cols));
    clone.setAttribute("height", String(rows - 8));
    clone.setAttribute("preserveAspectRatio", "none");
    clone.querySelectorAll("[class]").forEach((n) => n.removeAttribute("class"));
    clone.setAttribute("fill", "#000");
    const img = new Image();
    img.src = `data:image/svg+xml,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
    try {
      await img.decode();
    } catch {
      return;
    }
    if (!alive || gen !== hung) return;
    driftCanvas?.remove();
    drift = null;
    const off = document.createElement("canvas");
    off.width = cols;
    off.height = rows;
    const o = off.getContext("2d", { willReadFrequently: true })!;
    // The grid starts 8 cells above the letters: room for the caps.
    o.drawImage(img, 0, 8, cols, rows - 8);
    const px = o.getImageData(0, 0, cols, rows).data;
    const maskBits = new Uint8Array(cols * rows);
    for (let k = 0; k < maskBits.length; k++) maskBits[k] = px[k * 4 + 3] > 110 ? 1 : 0;
    drift = makeDrift(maskBits, cols, rows, 6);
    driftCanvas = document.createElement("canvas");
    driftCanvas.className = "xm-drift";
    driftCanvas.setAttribute("aria-hidden", "true");
    const s = Math.min(2, window.devicePixelRatio || 1);
    driftCanvas.width = Math.round(cols * CELL * s);
    driftCanvas.height = Math.round(rows * CELL * s);
    driftCanvas.style.width = `${cols * CELL}px`;
    driftCanvas.style.height = `${rows * CELL}px`;
    // Over the letters, in the sign's own box (an SVG has no offsetTop): it moves with the page.
    const signBox = sign.getBoundingClientRect();
    driftCanvas.style.left = `${(box.left - signBox.left).toFixed(1)}px`;
    driftCanvas.style.top = `${(box.top - signBox.top - 8 * CELL).toFixed(1)}px`;
    sign.appendChild(driftCanvas);
    dctx = driftCanvas.getContext("2d");
    if (!dctx) return;
    dctx.scale(s, s);
    dctx.fillStyle = MILK;
    // The evening's snow, already there.
    for (const p of snowedOn(drift, Math.round(cols * 1.6), 11)) paint(p.c, p.r, CELL * (0.75 + rnd() * 0.45));
  }

  // ── The frame ──
  const covered = () =>
    html.classList.contains("ld-on") || html.hasAttribute("data-dialog") || html.hasAttribute("data-game") || document.hidden;
  const frame = (now: number) => {
    raf = 0;
    if (!alive) return;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
    last = now;
    t += dt;
    if (covered()) {
      // Nothing to draw under a cover: look again in a quarter of a second.
      if (canvas.dataset.idle === undefined) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.dataset.idle = "";
      }
      last = 0;
      sleep = window.setTimeout(() => (raf = requestAnimationFrame(frame)), 250);
      return;
    }
    delete canvas.dataset.idle;
    const v = scrollSpeed(now);
    const h = hand && now - hand.at < 120 ? hand : null;
    fall(flakes, dt, W, H, { t, scroll: v, hand: h }, rnd);
    // Flakes by the page (the far ones) that come down onto the wordmark stay there.
    if (drift && driftCanvas) {
      markRect = driftCanvas.getBoundingClientRect();
      markSeen = markRect.bottom > 0 && markRect.top < H;
      if (markSeen) {
        for (const f of flakes) {
          if (f.z > 0.45) continue;
          const c = Math.floor((f.x - markRect.left) / CELL), r = Math.floor((f.y + f.r - markRect.top) / CELL);
          if (c < 0 || r < 0 || c >= drift.cols || r >= drift.rows) continue;
          const p = land(drift, c, r, rnd);
          if (p) {
            paint(p.c, p.r, CELL * (0.7 + f.r * 0.25));
            Object.assign(f, spawn(rnd, W, H, true));
          }
        }
      }
    }
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (const f of flakes) {
      const s = f.z < 0.3 ? 0 : f.z < 0.6 ? 1 : f.z < 0.85 ? 2 : 3;
      const d = f.r * (2 + f.z * 0.9);
      ctx.globalAlpha = 0.5 + 0.45 * f.z;
      ctx.drawImage(sprites[s], f.x - d / 2, f.y - d / 2, d, d);
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  };

  size();
  const onResize = () => {
    size();
    void hangDrift();
  };
  window.addEventListener("resize", onResize);
  // The footer can move (fonts, content): the drift follows when the page's height settles.
  const ro = new ResizeObserver(() => void hangDrift());
  const footer = document.getElementById("footer");
  if (footer) ro.observe(footer);
  void hangDrift();
  if (opts.fall) {
    window.addEventListener("pointermove", onMove, { passive: true });
    canvas.dataset.on = "";
    raf = requestAnimationFrame(frame);
  }

  return () => {
    alive = false;
    cancelAnimationFrame(raf);
    window.clearTimeout(sleep);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pointermove", onMove);
    ro.disconnect();
    driftCanvas?.remove();
    delete canvas.dataset.on;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
}
