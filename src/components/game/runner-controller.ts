import { kd } from "@/lib/store";
import { t } from "@/i18n";
import {
  createRun,
  DT,
  MAX_FRAME,
  releaseAll,
  RESTART_LOCK,
  RESUME_LEAD,
  resumeGrace,
  step,
  touchZone,
  type Input,
  type Phase,
  type Run,
} from "@/lib/runner";
import { BEST_KEY, pad5, parseBest, readBest, writeBest } from "@/lib/runner-best";
import { createDrawer, type Drawer } from "./runner-draw";

/**
 * The runner's controller, loaded only when the game is near (see RunnerIsland). Plain DOM, no React:
 * native input on the stage, the fixed-step loop, auto-pause, the start scroll, the HUD numbers, the
 * record and the announcements. The loop runs only while a run is in play; nothing moves before the
 * guest starts one, and everything stops on pause, off screen, on blur and in a hidden tab.
 */

export type RunnerHandle = { start(): void; pause(): void; resume(): void; destroy(): void };

type LenisLike = { scrollTo(target: number, opts: { duration?: number; lock?: boolean; onComplete?: () => void }): void };
const lenis = () => (window as unknown as { __lenis?: LenisLike }).__lenis;
const headerHeight = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 56;
const reduced = () => kd.get().motion === "reduced";

const JUMP_KEYS = new Set(["Space", "ArrowUp", "KeyW"]);
const DUCK_KEYS = new Set(["ArrowDown", "KeyS"]);

export function mountRunner(o: {
  root: HTMLElement;
  stage: HTMLElement;
  canvas: HTMLCanvasElement;
  score: HTMLElement;
  best: HTMLElement;
  live: HTMLElement;
  onPhase(p: Phase): void;
  onOver(r: { score: number; best: number; isNew: boolean }): void;
}): RunnerHandle {
  const { root, stage, canvas } = o;
  const html = document.documentElement;
  const input: Input = { jumpPress: false, duck: false, jumpHeld: false };

  let phase: Phase = "idle";
  /** Bumped on every phase change: a key press only counts in the phase it began in. */
  let epoch = 0;
  let run: Run | null = null;
  let drawer: Drawer | null = null;
  let storedBest = readBest();
  let crashAt = -Infinity;

  let raf = 0, last = 0, acc = 0;
  let begun = false, attempt = 0;
  let fallback = 0, announceTimer = 0;
  let onScrollEnd: (() => void) | null = null;
  let setGame = false;

  let keyDuck = false;
  const duckPointers = new Set<number>();
  /** Jump keys and fingers still down: holding one keeps the cup jumping. */
  const jumpKeys = new Set<string>();
  const jumpPointers = new Set<number>();
  const syncJumpHeld = () => (input.jumpHeld = jumpKeys.size > 0 || jumpPointers.size > 0);
  let down: { code: string; epoch: number; at: number } | null = null;
  let pointerDownAt = -Infinity;
  let pointerInside = false;

  /* ───── HUD, record, announcements ───── */

  let shownScore = "", shownBest = "";
  const hud = () => {
    const s = pad5(run?.score ?? 0), b = pad5(Math.max(storedBest, run?.score ?? 0));
    if (s !== shownScore) o.score.textContent = shownScore = s;
    if (b !== shownBest) o.best.textContent = shownBest = b;
  };
  const announce = (msg: string) => {
    window.clearTimeout(announceTimer);
    o.live.textContent = "";
    announceTimer = window.setTimeout(() => (o.live.textContent = msg), 50);
  };

  const setPhase = (p: Phase) => {
    phase = p;
    epoch++;
    down = null;
    o.onPhase(p);
  };

  const claimGame = () => {
    if (html.dataset.game !== undefined) return;
    html.dataset.game = "";
    setGame = true;
  };
  const releaseGame = () => {
    if (!setGame) return;
    delete html.dataset.game;
    setGame = false;
  };

  const clearInputs = () => {
    input.jumpPress = false;
    input.duck = false;
    input.jumpHeld = false;
    keyDuck = false;
    duckPointers.clear();
    jumpKeys.clear();
    jumpPointers.clear();
    if (run) releaseAll(run);
  };

  /* ───── The loop ───── */

  const draw = (alpha = 1) => {
    if (run && drawer) drawer.frame(run, alpha, reduced());
  };
  const stopLoop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  const crash = () => {
    stopLoop();
    clearInputs();
    crashAt = performance.now();
    const score = run!.score;
    const prev = readBest();
    const isNew = score > prev && prev > 0;
    if (score > prev) writeBest(score);
    storedBest = Math.max(prev, score);
    hud();
    draw();
    setPhase("over");
    announce(t.game.result(score, storedBest, isNew));
    o.onOver({ score, best: storedBest, isNew });
  };

  const tick = (now: number) => {
    raf = 0;
    if (phase !== "running" || !begun || !run || !drawer) return;
    const dt = Math.min(MAX_FRAME, Math.max(0, (now - last) / 1000));
    last = now;
    acc += dt * drawer.pace();
    while (acc >= DT && !run.crashed) {
      step(run, input);
      acc -= DT;
    }
    run.events.length = 0; // jump, land, milestones, spawns: nothing on screen reacts to them
    if (run.crashed) return crash();
    hud();
    draw(acc / DT);
    raf = requestAnimationFrame(tick);
  };

  /* ───── Starting: scroll the game into view, then begin ───── */

  const begin = (token: number) => {
    if (token !== attempt || begun || phase !== "running" || !run) return;
    begun = true;
    window.clearTimeout(fallback);
    if (onScrollEnd) window.removeEventListener("scrollend", onScrollEnd);
    onScrollEnd = null;
    if (!drawer) drawer = createDrawer(stage, canvas, () => draw());
    drawer.refresh();
    draw();
    root.dataset.live = ""; // frame 0 is on the canvas: the poster can go
    hud();
    // Auto-pause waits while the game scrolls into view; whatever happened meanwhile counts now.
    const r = stage.getBoundingClientRect();
    const seen = r.height > 0 ? (Math.min(r.bottom, window.innerHeight) - Math.max(r.top, headerH)) / r.height : 0;
    if (document.hidden || !document.hasFocus() || seen < 0.85) {
      pause(false);
      if (seen < 0.5) releaseGame();
      return;
    }
    last = performance.now();
    acc = 0;
    raf = requestAnimationFrame(tick);
  };

  const attemptStart = () => {
    const token = ++attempt;
    begun = false;
    claimGame();
    // Fit the stage and the controls under it between the header and the bottom of the screen; if
    // they can't both fit, the stage's top goes just under the header.
    const top = headerHeight() + 12, bottom = window.innerHeight - 12;
    const frame = stage.parentElement ?? stage;
    const foot = root.querySelector<HTMLElement>(".runner__foot") ?? frame;
    const a = frame.getBoundingClientRect().top, b = foot.getBoundingClientRect().bottom;
    const d = b - a > bottom - top ? a - top : a < top ? a - top : b > bottom ? b - bottom : 0;
    if (Math.abs(d) < 1) return begin(token);
    if (reduced()) {
      window.scrollBy({ top: d, behavior: "instant" });
      return begin(token);
    }
    fallback = window.setTimeout(() => begin(token), 700);
    const l = lenis();
    if (l) {
      l.scrollTo(window.scrollY + d, { duration: 0.5, lock: true, onComplete: () => begin(token) });
    } else {
      onScrollEnd = () => begin(token);
      window.addEventListener("scrollend", onScrollEnd, { once: true });
      window.scrollBy({ top: d, behavior: "smooth" });
    }
  };

  const start = () => {
    if (phase === "over" && performance.now() - crashAt < RESTART_LOCK * 1000) return;
    stopLoop();
    run = createRun(crypto.getRandomValues(new Uint32Array(1))[0], { best: storedBest });
    clearInputs();
    shownScore = "";
    setPhase("running");
    stage.focus({ preventScroll: true });
    attemptStart();
  };

  const pause = (manual: boolean) => {
    if (phase !== "running") return;
    // Before the run has begun (it is scrolling into view) only the guest can pause it.
    if (!begun && !manual) return;
    attempt++;
    stopLoop();
    clearInputs();
    draw();
    setPhase("paused");
    if (manual || root.contains(document.activeElement)) announce(t.game.paused);
  };

  const resume = () => {
    if (phase !== "paused" || !run) return;
    resumeGrace(run, RESUME_LEAD);
    setPhase("running");
    stage.focus({ preventScroll: true });
    attemptStart();
  };

  /* ───── Input on the stage ───── */

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (phase === "running") {
      if (JUMP_KEYS.has(e.code)) {
        e.preventDefault();
        if (begun) {
          if (!e.repeat) input.jumpPress = true;
          jumpKeys.add(e.code);
          syncJumpHeld();
        }
      } else if (DUCK_KEYS.has(e.code)) {
        e.preventDefault();
        if (begun) input.duck = keyDuck = true;
      } else if (e.code === "Escape" || e.code === "KeyP") {
        e.preventDefault();
        if (!e.repeat) pause(true); // holding P must not flip between pause and play
      }
      return;
    }
    if (e.code === "Space") e.preventDefault(); // never scroll the page from the stage
    if ((e.code === "Space" || e.code === "Enter") && !e.repeat) down = { code: e.code, epoch, at: performance.now() };
    if (e.code === "KeyP" && phase === "paused") {
      e.preventDefault();
      if (!e.repeat) resume();
    }
  };

  const onKeyUp = (e: KeyboardEvent) => {
    if (phase === "running") {
      if (DUCK_KEYS.has(e.code)) {
        keyDuck = false;
        input.duck = duckPointers.size > 0;
      } else if (jumpKeys.delete(e.code)) syncJumpHeld();
      return;
    }
    // Start, resume or restart on the release of a press the stage saw begin in this phase: the Enter
    // that pressed «Играть» (and moved focus here) never counts, nor does a key mashed at the crash.
    const d = down;
    down = null;
    if (!d || d.code !== e.code || d.epoch !== epoch) return;
    if (phase === "over" && d.at - crashAt < RESTART_LOCK * 1000) return;
    if (phase === "paused") resume();
    else start();
  };

  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointerDownAt = performance.now();
    if (document.activeElement !== stage) stage.focus({ preventScroll: true });
    if (phase !== "running" || !begun) return;
    e.preventDefault();
    try {
      stage.setPointerCapture(e.pointerId);
    } catch {
      /* the pointer may already be gone */
    }
    const r = stage.getBoundingClientRect();
    if (touchZone(e.clientY - r.top, r.height) === "duck") {
      duckPointers.add(e.pointerId);
      input.duck = true;
    } else {
      input.jumpPress = true;
      jumpPointers.add(e.pointerId);
      syncJumpHeld();
    }
  };

  const onPointerEnd = (e: PointerEvent) => {
    if (jumpPointers.delete(e.pointerId)) syncJumpHeld();
    if (!duckPointers.delete(e.pointerId)) return;
    input.duck = keyDuck || duckPointers.size > 0;
    if (e.type !== "pointerup" && duckPointers.size === 0 && run) releaseAll(run);
  };

  // Idle, paused or over: only a click starts, so a scroll that begins on the stage never does.
  const onClick = () => {
    if (phase === "running") return;
    if (phase === "over" && pointerDownAt - crashAt < RESTART_LOCK * 1000) return;
    if (phase === "paused") resume();
    else start();
  };

  /* ───── Auto-pause: never auto-resume ───── */

  // Focus leaving the game (from the stage or from its buttons) pauses it; moving between them doesn't.
  const onRootFocusOut = (e: FocusEvent) => {
    const to = e.relatedTarget as Node | null;
    if (to && root.contains(to)) return;
    // Safari doesn't focus a button it clicks (focus drops to nothing): pressing «Пауза» isn't leaving.
    if (!to && pointerInside) return;
    pause(false);
  };
  // A press on one of the game's buttons, held until its click has been handled. On iOS the pointerup
  // comes before the (synthetic) mousedown that moves focus, so it is cleared after the click instead.
  const onRootPointerDown = (e: PointerEvent) => {
    pointerInside = !!(e.target as Element | null)?.closest("button");
  };
  const onWindowPointerDown = (e: PointerEvent) => {
    if (!root.contains(e.target as Node)) pointerInside = false;
  };
  const clearPointerInside = () => (pointerInside = false);
  let clickTimer = 0;
  const onWindowClick = () => {
    window.clearTimeout(clickTimer);
    clickTimer = window.setTimeout(clearPointerInside, 0);
  };
  const onWindowBlur = () => pause(false);
  const onVisibility = () => {
    if (document.hidden) pause(false);
  };
  const onStorage = (e: StorageEvent) => {
    if (e.key !== BEST_KEY || phase === "running") return;
    storedBest = parseBest(e.newValue);
    hud();
  };

  // Mostly off screen (under the header counts as off): pause; half gone: give the action bar back.
  let io: IntersectionObserver | null = null;
  let headerH = headerHeight();
  const observe = () => {
    io?.disconnect();
    io = new IntersectionObserver(
      (entries) => {
        // One target: the newest entry is the current state. While a start is scrolling the game
        // into view, entries wait (begin() checks for itself).
        const entry = entries[entries.length - 1];
        if (!entry || (phase === "running" && !begun)) return;
        if (entry.intersectionRatio < 0.85) pause(false);
        if (entry.intersectionRatio < 0.5) releaseGame();
      },
      { rootMargin: `-${headerH}px 0px 0px 0px`, threshold: [0, 0.5, 0.85, 1] },
    );
    io.observe(stage);
  };
  observe();
  let resizeFrame = 0;
  const onResize = () => {
    if (resizeFrame) return;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      const h = headerHeight();
      if (h !== headerH) {
        headerH = h;
        observe();
      }
    });
  };

  stage.addEventListener("keydown", onKeyDown);
  stage.addEventListener("keyup", onKeyUp);
  stage.addEventListener("pointerdown", onPointerDown);
  stage.addEventListener("pointerup", onPointerEnd);
  stage.addEventListener("pointercancel", onPointerEnd);
  stage.addEventListener("lostpointercapture", onPointerEnd);
  stage.addEventListener("click", onClick);
  root.addEventListener("focusout", onRootFocusOut);
  root.addEventListener("pointerdown", onRootPointerDown, { capture: true });
  window.addEventListener("pointerdown", onWindowPointerDown, { capture: true });
  window.addEventListener("click", onWindowClick, { capture: true });
  window.addEventListener("pointercancel", clearPointerInside);
  window.addEventListener("blur", onWindowBlur);
  window.addEventListener("resize", onResize);
  window.addEventListener("storage", onStorage);
  document.addEventListener("visibilitychange", onVisibility);

  return {
    start,
    pause: () => pause(true),
    resume,
    destroy() {
      attempt++;
      stopLoop();
      cancelAnimationFrame(resizeFrame);
      window.clearTimeout(fallback);
      window.clearTimeout(announceTimer);
      window.clearTimeout(clickTimer);
      if (onScrollEnd) window.removeEventListener("scrollend", onScrollEnd);
      io?.disconnect();
      drawer?.destroy();
      stage.removeEventListener("keydown", onKeyDown);
      stage.removeEventListener("keyup", onKeyUp);
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointerup", onPointerEnd);
      stage.removeEventListener("pointercancel", onPointerEnd);
      stage.removeEventListener("lostpointercapture", onPointerEnd);
      stage.removeEventListener("click", onClick);
      root.removeEventListener("focusout", onRootFocusOut);
      root.removeEventListener("pointerdown", onRootPointerDown, { capture: true });
      window.removeEventListener("pointerdown", onWindowPointerDown, { capture: true });
      window.removeEventListener("click", onWindowClick, { capture: true });
      window.removeEventListener("pointercancel", clearPointerInside);
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
      delete root.dataset.live;
      releaseGame();
    },
  };
}
