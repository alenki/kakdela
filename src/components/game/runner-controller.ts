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
  type Input,
  type Phase,
  type Run,
} from "@/lib/runner";
import { BEST_KEY, pad5, parseBest, readBest, writeBest } from "@/lib/runner-best";
import { createDrawer, type Drawer } from "./runner-draw";

/**
 * The runner's controller, loaded only when the game is near (see RunnerIsland). Plain DOM, no React:
 * native input on the stage and the touch pads, the fixed-step loop, auto-pause, the start scroll, the
 * HUD numbers, the record and the announcements. The loop runs only while a run is in play; nothing
 * moves before the guest starts one, and everything stops on pause, off screen, on blur and in a hidden
 * tab.
 */

export type RunnerHandle = { start(): void; pause(): void; resume(): void; destroy(): void };

type LenisLike = { scrollTo(target: number, opts: { duration?: number; lock?: boolean; onComplete?: () => void }): void };
const lenis = () => (window as unknown as { __lenis?: LenisLike }).__lenis;
const headerHeight = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 56;
const reduced = () => kd.get().motion === "reduced";

const JUMP_KEYS = new Set(["Space", "ArrowUp", "KeyW"]);
const DUCK_KEYS = new Set(["ArrowDown", "KeyS"]);
/** What a guest can use on the page: a press on one of these, off the game, leaves it. */
const USABLE =
  'a[href], button, input, select, textarea, summary, label, iframe, [contenteditable]:not([contenteditable="false"]), [tabindex]:not([tabindex^="-"])';

export function mountRunner(o: {
  root: HTMLElement;
  stage: HTMLElement;
  canvas: HTMLCanvasElement;
  pads: HTMLElement;
  score: HTMLElement;
  best: HTMLElement;
  live: HTMLElement;
  onPhase(p: Phase): void;
  onOver(r: { score: number; best: number; isNew: boolean }): void;
}): RunnerHandle {
  const { root, stage, canvas, pads } = o;
  const html = document.documentElement;
  const input: Input = { jumpPress: false, duck: false, jumpHeld: false };
  const duckPad = pads.querySelector<HTMLElement>('[data-pad="duck"]');
  const jumpPad = pads.querySelector<HTMLElement>('[data-pad="jump"]');

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

  let keyDuck = false;
  const duckPointers = new Set<number>();
  /** Jump keys and fingers still down: holding one keeps the cup jumping. */
  const jumpKeys = new Set<string>();
  const jumpPointers = new Set<number>();
  /** A pad shows held while its input is on, whatever holds it: the pad, the field (a jump) or a key. */
  const syncPads = () => {
    duckPad?.toggleAttribute("data-down", input.duck);
    jumpPad?.toggleAttribute("data-down", !!input.jumpHeld);
  };
  const syncJumpHeld = () => {
    input.jumpHeld = jumpKeys.size > 0 || jumpPointers.size > 0;
    syncPads();
  };
  const syncDuck = () => {
    input.duck = keyDuck || duckPointers.size > 0;
    syncPads();
  };
  let down: { code: string; epoch: number; at: number } | null = null;
  let pointerDownAt = -Infinity;

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

  /**
   * html[data-game] hides the mobile action bar: while a run is on screen (`inPlay`, from its start until
   * the stage is half gone), and on a touch screen whenever the pads are on screen, since the bar would
   * cover them (on a phone on its side the game can't show without the bar over its pads).
   */
  let inPlay = false, padsSeen = false, setGame = false;
  const syncGame = () => {
    const want = inPlay || padsSeen;
    if (want && !setGame && html.dataset.game === undefined) {
      html.dataset.game = "";
      setGame = true;
    } else if (!want && setGame) {
      delete html.dataset.game;
      setGame = false;
    }
  };
  const claimGame = () => {
    inPlay = true;
    syncGame();
  };
  const releaseGame = () => {
    inPlay = false;
    syncGame();
  };

  const clearInputs = () => {
    input.jumpPress = false;
    input.duck = false;
    input.jumpHeld = false;
    keyDuck = false;
    duckPointers.clear();
    jumpKeys.clear();
    jumpPointers.clear();
    syncPads();
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
    // Fit the whole game (the field, the note and the buttons, and on a touch screen the pads) between
    // the header and the bottom of the screen; if it can't all fit, the field's top goes just under the
    // header.
    const top = headerHeight() + 12, bottom = window.innerHeight - 12;
    const block = root.getBoundingClientRect();
    const field = (stage.parentElement ?? stage).getBoundingClientRect().top;
    const a = block.top, b = block.bottom;
    const d = b - a > bottom - top ? field - top : a < top ? a - top : b > bottom ? b - bottom : 0;
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

  /* ───── Keys on the stage ───── */

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
        if (begun) {
          keyDuck = true;
          syncDuck();
        }
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
        syncDuck();
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

  /* ───── Presses: the field and the pads ───── */

  /**
   * A press during a run: a jump (held, the cup jumps again on each landing) or a duck while held. The
   * pressed element takes the pointer, so a thumb that slides off keeps its press.
   */
  const hold = (e: PointerEvent, el: HTMLElement, action: "jump" | "duck") => {
    e.preventDefault();
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* the pointer may already be gone */
    }
    if (action === "duck") {
      duckPointers.add(e.pointerId);
      syncDuck();
    } else {
      input.jumpPress = true;
      jumpPointers.add(e.pointerId);
      syncJumpHeld();
    }
  };

  // The field jumps wherever it is pressed: ducking is the pad's job (or the keys').
  const onPointerDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    pointerDownAt = performance.now();
    if (document.activeElement !== stage) stage.focus({ preventScroll: true });
    if (phase === "running" && begun) hold(e, stage, "jump");
  };

  const padOf = (e: Event) => (e.target as Element | null)?.closest<HTMLElement>("[data-pad]") ?? null;
  const onPadDown = (e: PointerEvent) => {
    const pad = padOf(e);
    if (!pad || (e.pointerType === "mouse" && e.button !== 0)) return;
    pointerDownAt = performance.now();
    if (phase !== "running" || !begun) return;
    if (document.activeElement !== stage) stage.focus({ preventScroll: true }); // the keys stay with the game
    hold(e, pad, pad.dataset.pad === "duck" ? "duck" : "jump");
  };

  const onPointerEnd = (e: PointerEvent) => {
    if (jumpPointers.delete(e.pointerId)) syncJumpHeld();
    if (!duckPointers.delete(e.pointerId)) return;
    syncDuck();
    if (e.type !== "pointerup" && duckPointers.size === 0 && run) releaseAll(run);
  };

  // Idle, paused or over: only a click starts, so a scroll that begins on the stage never does.
  const onClick = () => {
    if (phase === "running") return;
    if (phase === "over" && pointerDownAt - crashAt < RESTART_LOCK * 1000) return;
    if (phase === "paused") resume();
    else start();
  };
  // Outside a run «Прыжок» is the field's twin; «Пригнуться» only ducks.
  const onPadClick = (e: MouseEvent) => {
    if (padOf(e)?.dataset.pad === "jump") onClick();
  };
  // A field or a pad held mid-run never opens the long-press menu.
  const onContextMenu = (e: Event) => {
    if (phase === "running") e.preventDefault();
  };

  /* ───── Auto-pause: never auto-resume ───── */

  /**
   * Where the press in progress began: in the game; off it on nothing a guest can use (a finger's or a
   * pen's near miss); or on something else, and any mouse press off the game. Null while no press is on
   * (the keyboard or a script moves the focus). Kept until the press's click, since on iOS the focus
   * moves after the pointerup; forgotten on a cancelled press and on any key.
   */
  let press: "game" | "near" | "away" | null = null;
  const onWindowPointerDown = (e: PointerEvent) => {
    const el = e.target instanceof Element ? e.target : null;
    press = el && root.contains(el) ? "game" : e.pointerType !== "mouse" && !el?.closest(USABLE) ? "near" : "away";
  };
  const forgetPress = () => {
    press = null;
  };
  let clickTimer = 0;
  const onWindowClick = () => {
    window.clearTimeout(clickTimer);
    clickTimer = window.setTimeout(forgetPress, 0);
  };

  // Focus leaving the game (the stage and its buttons) pauses it, unless a press that isn't leaving took
  // it: one in the game (its note, its gaps, the pads; Safari drops the focus to nothing on a button it
  // clicks) or a near miss off it. Then the stage takes the keys back, so they still play.
  let refocusTimer = 0;
  const onRootFocusOut = (e: FocusEvent) => {
    const to = e.relatedTarget as Node | null;
    if (to && root.contains(to)) return;
    if (press !== "game" && press !== "near") return pause(false);
    window.clearTimeout(refocusTimer);
    refocusTimer = window.setTimeout(() => {
      const el = document.activeElement;
      if (phase === "running" && !(el && (root.contains(el) || el.closest(USABLE)))) stage.focus({ preventScroll: true });
    }, 0);
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
  // The pads are on screen (only a touch screen shows them): the action bar keeps away.
  const padsIo = new IntersectionObserver((entries) => {
    padsSeen = !!entries[entries.length - 1]?.isIntersecting;
    syncGame();
  });
  padsIo.observe(pads);
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
  stage.addEventListener("contextmenu", onContextMenu);
  pads.addEventListener("pointerdown", onPadDown);
  pads.addEventListener("pointerup", onPointerEnd);
  pads.addEventListener("pointercancel", onPointerEnd);
  pads.addEventListener("lostpointercapture", onPointerEnd);
  pads.addEventListener("click", onPadClick);
  pads.addEventListener("contextmenu", onContextMenu);
  root.addEventListener("focusout", onRootFocusOut);
  window.addEventListener("pointerdown", onWindowPointerDown, { capture: true });
  window.addEventListener("click", onWindowClick, { capture: true });
  window.addEventListener("pointercancel", forgetPress);
  window.addEventListener("keydown", forgetPress, { capture: true });
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
      window.clearTimeout(refocusTimer);
      if (onScrollEnd) window.removeEventListener("scrollend", onScrollEnd);
      io?.disconnect();
      padsIo.disconnect();
      padsSeen = false;
      drawer?.destroy();
      stage.removeEventListener("keydown", onKeyDown);
      stage.removeEventListener("keyup", onKeyUp);
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointerup", onPointerEnd);
      stage.removeEventListener("pointercancel", onPointerEnd);
      stage.removeEventListener("lostpointercapture", onPointerEnd);
      stage.removeEventListener("click", onClick);
      stage.removeEventListener("contextmenu", onContextMenu);
      pads.removeEventListener("pointerdown", onPadDown);
      pads.removeEventListener("pointerup", onPointerEnd);
      pads.removeEventListener("pointercancel", onPointerEnd);
      pads.removeEventListener("lostpointercapture", onPointerEnd);
      pads.removeEventListener("click", onPadClick);
      pads.removeEventListener("contextmenu", onContextMenu);
      root.removeEventListener("focusout", onRootFocusOut);
      window.removeEventListener("pointerdown", onWindowPointerDown, { capture: true });
      window.removeEventListener("click", onWindowClick, { capture: true });
      window.removeEventListener("pointercancel", forgetPress);
      window.removeEventListener("keydown", forgetPress, { capture: true });
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
      duckPad?.removeAttribute("data-down");
      jumpPad?.removeAttribute("data-down");
      delete root.dataset.live;
      releaseGame();
    },
  };
}
