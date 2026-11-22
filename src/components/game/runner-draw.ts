import { camera, DT, poseOf, WORLD, type Run } from "@/lib/runner";
import { floorDepth, kickUp, flyPuffs, makeGameSnow, stepGameSnow, TOPS, capOf, type GameSnow, type SnowObstacle } from "@/lib/runner-snow";
import { runStream } from "@/lib/run-stream";
import { CUP_ART, FINE, forEachMark, GROUND_LINE, OBSTACLE_ART, STROKE, TAB_ART, type Sprite } from "./runner-art";

/**
 * Paints the runner on its canvas: the floor, the obstacles and the cup, in the colours of the field
 * it sits on (read from --fg / --bg / --accent, so the ink homepage and the cream 404 need nothing
 * else). The canvas is transparent, so the field's grain shows through. No text is ever drawn here.
 *
 * In the New Year season (html[data-season]) it also paints the snow of the game's world (src/lib/runner-snow.ts)
 * in the site's milk: the floor's snow with the cup's track in it, the caps on the obstacles and the snow its
 * feet kick up. The falling snow is the page's own (snow-controller.ts): while a run is in play this says how
 * fast the floor travels across the screen (src/lib/run-stream.ts), and the page's flakes over the whole
 * section stream back with it, so the section runs, not only this window. The game's own flakes still fall,
 * unseen, to build up the floor and the caps. On a light field the snow on things gets a hairline of the text
 * colour, or it would vanish into the cream. A still frame (paused, over) keeps the floor and the caps.
 */
export type Drawer = {
  /** Re-reads the colours (cheap; called when a run begins). */
  refresh(): void;
  /** Real-time pace for this stage size (see `camera`). */
  pace(): number;
  /** One frame; `live` while a run is in play (the snow moves), not for a still one. */
  frame(run: Run, alpha: number, reduced: boolean, live?: boolean): void;
  /** The run's moments the snow answers: feet leaving it, landing in it, a crash into it. */
  snow(kind: "jump" | "land" | "crash"): void;
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
  const ink = { fg: "#141210", bg: "#f3ebdc", accent: "#d0392b", snow: "#fff8ee", light: false };

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
    ink.snow = colour("--color-milk", ink.snow);
    // A light field (the cream 404) needs the snow outlined.
    const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(ink.bg);
    ink.light = !!m && (parseInt(m[1], 16) * 0.3 + parseInt(m[2], 16) * 0.59 + parseInt(m[3], 16) * 0.11) / 255 > 0.55;
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

  /* ───── The season's snow ───── */

  const season = () => document.documentElement.dataset.season !== undefined;
  let snow: GameSnow | null = null;
  let snowRun: Run | null = null;
  let lastNow = 0;
  /** The snow on things (the floor, a cap): milk, and on a light field a hairline round it. */
  const snowFill = () => {
    if (!ctx) return;
    ctx.fillStyle = ink.snow;
    ctx.fill();
    if (ink.light) {
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = ink.fg;
      ctx.lineWidth = FINE * 0.6;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  };
  /** A cap on an obstacle, in its sprite's own units (the sprite's transform is still set). */
  const cap = (o: SnowObstacle, depth: number) => {
    if (!ctx) return;
    for (const [x0, y0, x1, y1] of TOPS[o.kind] ?? []) {
      ctx.beginPath();
      const steps = 10;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = lerp(x0, x1, t), y = lerp(y0, y1, t);
        // Round at the ends, a little drift along the top.
        const h = depth * Math.pow(Math.min(1, 5 * t, 5 * (1 - t)), 0.6) * (1 + 0.1 * Math.sin(o.id * 1.7 + t * 9));
        if (i === 0) ctx.moveTo(x, y + 0.3);
        ctx.lineTo(x, y - h);
      }
      ctx.lineTo(x1, y1 + 0.3);
      ctx.closePath();
      snowFill();
    }
  };
  /** The snow the cup kicked up, in the air. */
  const puffs = (groundY: number) => {
    if (!ctx || !snow || !snow.puffs.length) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = ink.snow;
    const { scale } = cam;
    for (const p of snow.puffs) {
      ctx.globalAlpha = Math.max(0, Math.min(1, (p.life / p.max) * 1.6));
      ctx.beginPath();
      ctx.arc(p.x * scale, groundY - p.y * scale, Math.max(0.7, p.r * scale * 0.6), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  const frame = (run: Run, alpha: number, reduced: boolean, live = true) => {
    if (!ctx) return;
    // Setting canvas.width resets the context, so nothing is assumed to persist between frames.
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { scale, viewW, viewH } = cam;
    const k = dpr * scale;
    const groundY = cssH - WORLD.ground * scale;
    const off = Math.max(0, run.dist - (1 - alpha) * run.v * DT);

    // The snow: a new run brings fresh snow (the floor's dusting, the caps); it moves only while the run does.
    const snowy = season();
    const obstacles: SnowObstacle[] = run.obstacles.map((o) => ({ id: o.id, kind: o.kind, x: lerp(o.px, o.x, alpha), y: o.y, h: o.h }));
    const now = performance.now();
    if (snowy) {
      if (!snow || snowRun !== run) {
        snow = makeGameSnow(run.seed ^ 0x5eed, viewW, viewH, off);
        snowRun = run;
        lastNow = now;
      }
      const dt = live && !reduced ? Math.min(0.05, (now - lastNow) / 1000) : 0;
      lastNow = now;
      // Tell the page's snow how fast the floor goes by (px/s): the whole section streams with it.
      if (dt > 0) {
        runStream.speed = Math.max(0, ((off - snow.off) * scale) / dt);
        runStream.at = now;
        runStream.section = stage.closest<HTMLElement>("section") ?? stage;
      } else runStream.at = -Infinity;
      const cup = { x: WORLD.cupX, y: lerp(run.py, run.y, alpha), grounded: run.grounded, ducking: run.ducking, crashed: run.crashed, speed: run.v };
      stepGameSnow(snow, dt, off, viewW, viewH, cup, obstacles);
    }

    // The floor: one line, and its specks scrolling with the distance run.
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

    // The snow on the floor, the cup's track in it.
    if (snowy && snow) {
      const s = snow;
      ctx.beginPath();
      ctx.moveTo(-1, 0.6);
      for (let x = -1; x <= viewW + 1; x += 1) ctx.lineTo(x, -floorDepth(s, off + x));
      ctx.lineTo(viewW + 1, 0.6);
      ctx.closePath();
      snowFill();
    }

    const flutter = reduced ? 0 : Math.floor(run.t / 0.12) % 2;
    for (let i = 0; i < run.obstacles.length; i++) {
      const o = run.obstacles[i];
      const x = obstacles[i].x;
      if (x > viewW + 4 || x + o.w < -4) continue;
      sprite(o.kind === "tab" ? TAB_ART[flutter] : OBSTACLE_ART[o.kind], x, o.y, groundY);
      if (snowy && snow && TOPS[o.kind]) cap(obstacles[i], capOf(snow, obstacles[i]));
    }

    sprite(CUP_ART[poseOf(run, run.t, reduced)], WORLD.cupX, lerp(run.py, run.y, alpha), groundY);

    // In front of the play: the snow the cup kicked up (a still frame, the crash, keeps its burst in the air).
    if (snowy && snow && !reduced) puffs(groundY);
  };

  /** Where the cup's feet are, in the window. */
  const feet = () => WORLD.cupX + 15;

  return {
    refresh,
    pace: () => cam.pace,
    frame,
    snow(kind) {
      if (!snow || !season()) return;
      if (kind === "jump") kickUp(snow, feet(), 0.6, 6, 55, 0.7);
      else if (kind === "land") kickUp(snow, feet(), 0.6, 12, 85, 0.5);
      else {
        // The crash throws a burst; the still frame shows it a moment later, in the air.
        kickUp(snow, feet() + 6, 3, 28, 150, 0.15);
        flyPuffs(snow, 0.09, snow.off);
      }
    },
    destroy() {
      ro.disconnect();
      mq?.removeEventListener("change", onDpr);
      runStream.at = -Infinity;
    },
  };
}
