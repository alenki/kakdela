"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { BtnLabel } from "@/components/chrome/BtnLabel";
import type { Phase } from "@/lib/runner";
import { pad5, readBest } from "@/lib/runner-best";
import { NBSP, typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import type { RunnerHandle } from "./runner-controller";

const subscribeNever = () => () => {};

type Control = { start(): void; pause(): void; resume(): void };

const LABEL: Record<Phase, string> = { idle: t.game.start, running: t.game.pause, paused: t.game.resume, over: t.game.again };

/**
 * The runner's markup and its thin client half. The server renders the stage with the idle poster (its
 * children); this component adds the HUD, the note and the one button, and loads the controller (the
 * loop, the input, the canvas) only when the game comes near or the guest reaches for it. Engine and
 * controller are imported for their types only, so they stay out of the page's first load.
 */
export function RunnerIsland({ variant, children }: { variant: "section" | "aside"; children: ReactNode }) {
  const ready = useSyncExternalStore(subscribeNever, () => true, () => false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [isNew, setIsNew] = useState(false);
  const noteId = useId();

  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scoreRef = useRef<HTMLSpanElement>(null);
  const bestRef = useRef<HTMLSpanElement>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);
  const ctlRef = useRef<Control | null>(null);

  useEffect(() => {
    const root = rootRef.current!, stage = stageRef.current!;
    let alive = true, pending = false;
    let handle: RunnerHandle | null = null;
    let loading: Promise<void> | null = null;

    // The HUD's first values; from here on the controller is its only writer.
    scoreRef.current!.textContent = pad5(0);
    bestRef.current!.textContent = pad5(readBest());

    const load = () =>
      (loading ??= import("./runner-controller")
        .then(({ mountRunner }) => {
          if (!alive) return;
          handle = mountRunner({
            root,
            stage,
            canvas: canvasRef.current!,
            score: scoreRef.current!,
            best: bestRef.current!,
            live: liveRef.current!,
            onPhase: (p) => {
              setPhase(p);
              if (p === "running") setIsNew(false);
            },
            onOver: (r) => setIsNew(r.isNew),
          });
          if (pending) {
            pending = false;
            handle.start();
          }
        })
        .catch(() => {
          // A failed chunk (offline): «Играть» stays and tries again.
          loading = null;
          pending = false;
        }));

    ctlRef.current = {
      start: () => {
        if (handle) handle.start();
        else {
          pending = true;
          void load();
        }
      },
      pause: () => handle?.pause(),
      resume: () => handle?.resume(),
    };

    // Before the controller arrives, a click on the stage or Space/Enter released on it queues a start.
    const early = (e: Event) => {
      if (handle) return;
      if (e.type === "click" || ((e as KeyboardEvent).code === "Space" || (e as KeyboardEvent).code === "Enter")) ctlRef.current?.start();
    };
    const earlyKey = (e: KeyboardEvent) => {
      if (!handle && e.code === "Space") e.preventDefault();
    };
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect();
          void load();
        }
      },
      { rootMargin: "800px 0px" },
    );
    io.observe(root);
    const warm = () => void load();
    root.addEventListener("pointerenter", warm, { once: true });
    root.addEventListener("focusin", warm, { once: true });
    stage.addEventListener("click", early);
    stage.addEventListener("keyup", early);
    stage.addEventListener("keydown", earlyKey);

    return () => {
      alive = false;
      io.disconnect();
      root.removeEventListener("pointerenter", warm);
      root.removeEventListener("focusin", warm);
      stage.removeEventListener("click", early);
      stage.removeEventListener("keyup", early);
      stage.removeEventListener("keydown", earlyKey);
      handle?.destroy();
      handle = null;
      ctlRef.current = null;
    };
  }, []);

  const onMain = () => {
    const c = ctlRef.current;
    if (!c) return;
    if (phase === "running") c.pause();
    else if (phase === "paused") c.resume();
    else c.start();
  };

  // The 404's primary action stays «На главную»; in the section the button leads until the run starts.
  const mainClass = variant === "section" && phase !== "running" ? "btn btn-primary" : "btn";

  return (
    <div ref={rootRef} className="runner" data-variant={variant} data-state={phase} data-ready={ready ? "" : undefined}>
      <div className="runner__frame">
        <div
          ref={stageRef}
          className="runner__stage"
          role="application"
          aria-label={t.game.stage}
          aria-describedby={noteId}
          aria-keyshortcuts="Space ArrowUp ArrowDown Escape"
          tabIndex={ready ? 0 : undefined}
        >
          {children}
          <canvas ref={canvasRef} className="runner__canvas" aria-hidden="true" />
        </div>
        {/* Over the stage but outside role="application", so browse mode reads it. Not live. */}
        <p className="runner__hud mono">
          <span className="runner__key">{t.game.score}</span>
          {NBSP}
          <span ref={scoreRef} />
          {`${NBSP}· `}
          <span className="runner__key">{t.game.best}</span>
          {NBSP}
          <span ref={bestRef} />
        </p>
      </div>

      <div className="runner__foot">
        <p id={noteId} className="runner__note label">
          {phase === "paused" ? (
            t.game.paused
          ) : phase === "over" ? (
            isNew ? t.game.newBest : t.game.over
          ) : (
            <span className="runner__hint-touch">{typograf(t.game.hintTouch)}</span>
          )}
        </p>
        {/* The main button comes last, at the right edge, so it never moves: a second click on «Пауза»
            lands on «Продолжить», never on «Заново», which opens to its left. */}
        <div className="runner__actions">
          {phase === "paused" && (
            <button type="button" className="btn" onClick={() => ctlRef.current?.start()}>
              <BtnLabel>{t.game.restart}</BtnLabel>
            </button>
          )}
          <button type="button" className={mainClass} onClick={onMain}>
            <BtnLabel>{LABEL[phase]}</BtnLabel>
          </button>
        </div>
      </div>

      <p ref={liveRef} className="sr-only" aria-live="polite" />
    </div>
  );
}
