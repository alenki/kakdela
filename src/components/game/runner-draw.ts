import { camera, DT, poseOf, WORLD, type Run } from "@/lib/runner";
import { CUP_ART, FINE, forEachMark, GROUND_LINE, OBSTACLE_ART, STROKE, TAB_ART, type Sprite } from "./runner-art";

/**
 * Paints the runner on its canvas: the floor, the obstacles and the cup, in the colours of the field
 * it sits on (read from --fg / --bg / --accent, so the ink homepage and the cream 404 need nothing
 * else). The canvas is transparent, so the field's grain shows through. No text is ever drawn here.
 */
export type Drawer = {
  /** Re-reads the colours (cheap; called when a run begins). */
  refresh(): void;
  /** Real-time pace for this stage size (see `camera`). */
  pace(): number;
  frame(run: Run, alpha: number, reduced: boolean): void;
  destroy(): void;
};

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

export function createDrawer(stage: HTMLElement, canvas: HTMLCanvasElement, redraw: () => void): Drawer {
  const ctx = canvas.getContext("2d");
  const paths = new Map<string, Path2D>();
  const path = (d: string) => {
    let p = paths.get(d);
    if (!p) paths.set(d, (p = new Path2D(d)));
    return p;
  };

  let cssW = 0, cssH = 0, dpr = 1;
  let cam = camera(0, 0);
  const ink = { fg: "#141210", bg: "#f3ebdc", accent: "#d0392b" };

  /** A computed custom property as a canvas colour, or the fallback if the canvas can't parse it. */
  const colour = (name: string, fallback: string) => {
    if (!ctx) return fallback;
    ctx.fillStyle = fallback;
    ctx.fillStyle = getComputedStyle(stage).getPropertyValue(name).trim() || fallback;
    return String(ctx.fillStyle);
  };
  const refresh = () => {
    ink.fg = colour("--fg", ink.fg);
    ink.bg = colour("--bg", ink.bg);
    ink.accent = colour("--accent", ink.accent);
  };

  const size = (w: number, h: number) => {
    cssW = w;
    cssH = h;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    // A very large stage at 2× would be a big bitmap for little gain: cap it at about 3.5 megapixels,
    // but never below the screen's own 1× (a softer canvas than the poster it replaces would show).
    if (w * h * dpr * dpr > 3.5e6) dpr = Math.max(Math.min(dpr, 1), Math.sqrt(3.5e6 / (w * h)));
    canvas.width = Math.max(1, Math.round(w * dpr));
    canvas.height = Math.max(1, Math.round(h * dpr));
    cam = camera(w, h);
  };

  const first = stage.getBoundingClientRect();
  size(first.width, first.height);
  refresh();

  const ro = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    if (Math.abs(width - cssW) < 0.5 && Math.abs(height - cssH) < 0.5) return;
    size(width, height);
    refresh();
    redraw();
  });
  ro.observe(stage);

  // Moving the window to a screen with another pixel ratio: re-armed on every change.
  let mq: MediaQueryList | null = null;
  const onDpr = () => {
    size(cssW, cssH);
    redraw();
    watchDpr();
  };
  const watchDpr = () => {
    mq?.removeEventListener("change", onDpr);
    mq = window.matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
    mq.addEventListener("change", onDpr, { once: true });
  };
  watchDpr();

  /** Draws a sprite with its foot at world (x, y). */
  const sprite = (s: Sprite, x: number, y: number, groundY: number) => {
    if (!ctx) return;
    const k = dpr * cam.scale;
    ctx.setTransform(k, 0, 0, k, dpr * x * cam.scale, dpr * (groundY - (y + s.h) * cam.scale));
    ctx.fillStyle = ink.bg;
    for (const d of s.bg) ctx.fill(path(d));
    ctx.fillStyle = ink.accent;
    for (const d of s.accent) ctx.fill(path(d));
    ctx.fillStyle = ink.fg;
    for (const d of s.ink) ctx.fill(path(d));
    ctx.strokeStyle = ink.fg;
    ctx.lineWidth = STROKE;
    for (const d of s.stroke) ctx.stroke(path(d));
    ctx.lineWidth = FINE;
    for (const d of s.fine) ctx.stroke(path(d));
  };

  const frame = (run: Run, alpha: number, reduced: boolean) => {
    if (!ctx) return;
    // Setting canvas.width resets the context, so nothing is assumed to persist between frames.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { scale, viewW } = cam;
    const k = dpr * scale;
    const groundY = cssH - WORLD.ground * scale;

    // The floor: one line, and its specks scrolling with the distance run.
    const off = Math.max(0, run.dist - (1 - alpha) * run.v * DT);
    ctx.setTransform(k, 0, 0, k, 0, dpr * groundY);
    ctx.strokeStyle = ink.fg;
    ctx.fillStyle = ink.fg;
    ctx.lineWidth = Math.max(GROUND_LINE, 1 / k);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(viewW + 1, 0);
    ctx.stroke();
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = FINE;
    ctx.beginPath();
    forEachMark(off, off + viewW + 8, (x, y, len) => {
      const mx = x - off;
      if (len === 0) {
        ctx.moveTo(mx + 0.9, -y);
        ctx.arc(mx, -y, 0.9, 0, Math.PI * 2);
      } else {
        ctx.moveTo(mx, -y);
        ctx.lineTo(mx + len, -y);
      }
    });
    ctx.stroke();
    ctx.globalAlpha = 1;

    const flutter = reduced ? 0 : Math.floor(run.t / 0.12) % 2;
    for (const o of run.obstacles) {
      const x = lerp(o.px, o.x, alpha);
      if (x > viewW + 4 || x + o.w < -4) continue;
      sprite(o.kind === "tab" ? TAB_ART[flutter] : OBSTACLE_ART[o.kind], x, o.y, groundY);
    }

    sprite(CUP_ART[poseOf(run, run.t, reduced)], WORLD.cupX, lerp(run.py, run.y, alpha), groundY);
  };

  return {
    refresh,
    pace: () => cam.pace,
    frame,
    destroy() {
      ro.disconnect();
      mq?.removeEventListener("change", onDpr);
    },
  };
}
