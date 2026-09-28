"use client";

import { useEffect, useId, useReducer, useRef, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from "react";
import type { Sq } from "@/lib/chess";
import { describeRu, puzzleFor, readSaved, startOf, weekNumber, writeSaved, type Grade } from "@/lib/puzzle";
import { t } from "@/i18n";
import { boardVM, helpStep, initGame, logVM, reduce, type GameState } from "./model";
import { BoardView, ControlsView, LogView } from "./views";

/** How long the café takes to answer, how long its answer to a wrong move stays up, a solution's pace. */
const DELAY = { cafe: 420, read: 1100, auto: 800 } as const;

/**
 * The first state, read once as the game loads (never during render): this week's puzzle, a solve
 * saved this week, and whether Black's last move slides in as the board comes into view (not with
 * reduced motion, not after a capture, not when the board is already on screen).
 */
export function boot(root: HTMLElement, labels: Record<Grade, string>): GameState {
  const week = weekNumber(new Date());
  const pz = puzzleFor(week);
  const saved = readSaved(week, pz);
  const board = root.querySelector("[data-board]");
  const onScreen = !board || board.getBoundingClientRect().top < window.innerHeight;
  const still = document.documentElement.dataset.motion === "reduced";
  const entrance = !saved && !still && !onScreen && !startOf(pz).setup.captured;
  return initGame(pz, week, { saved, entrance, labels });
}

type Drag = { from: Sq; x0: number; y0: number; el: HTMLElement; grid: HTMLElement; pointer: number; on: boolean };

/**
 * «Задача недели», live: the board takes clicks, taps, a mouse or pen drag and the keyboard; the café
 * answers after a beat (the timers below); the transcript and the one button follow the state
 * (model.ts). What screen readers hear goes to a polite live region, as in the hero.
 */
export function Game({ init, payoffs }: { init: GameState; payoffs: Record<Grade, ReactNode> }) {
  const [s, dispatch] = useReducer(reduce, init);
  const boardRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLParagraphElement>(null);
  const squares = useRef<(HTMLButtonElement | null)[]>([]);
  const drag = useRef<Drag | null>(null);
  const swallowClick = useRef(false);
  const descId = useId();

  // The café's answer, the pause over a refuted move, the solution's next move.
  const { phase } = s;
  useEffect(() => {
    if (phase !== "cafe" && phase !== "read" && phase !== "auto") return;
    const next = phase === "cafe" ? "cafe" : phase === "read" ? "rewind" : "step";
    const id = window.setTimeout(() => dispatch({ type: next }), DELAY[phase]);
    return () => window.clearTimeout(id);
  }, [phase, s.plan.length]);

  // The entrance: Black's last move slides in once the board is well in view.
  useEffect(() => {
    const board = boardRef.current;
    if (phase !== "intro" || !board) return;
    let timer = 0;
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io.disconnect();
        timer = window.setTimeout(() => dispatch({ type: "setup" }), 250);
      },
      { threshold: 0.4 },
    );
    io.observe(board);
    return () => {
      io.disconnect();
      window.clearTimeout(timer);
    };
  }, [phase]);

  // From now on a piece that comes back (a rewind) fades in; the first render doesn't (chess.css).
  useEffect(() => {
    boardRef.current?.setAttribute("data-live", "");
  }, []);

  // Said once each time: cleared first, so the same words are said again.
  useEffect(() => {
    const live = liveRef.current;
    if (!live || !s.say.n) return;
    live.textContent = "";
    const id = window.setTimeout(() => {
      live.textContent = s.say.text;
    }, 50);
    return () => window.clearTimeout(id);
  }, [s.say]);

  // A solve made here is kept until Monday.
  const { grade, restored, week, line } = s;
  const id = s.pz.id;
  useEffect(() => {
    if (phase === "done" && grade && !restored) writeSaved({ v: 1, week, id, grade, line: [line[0], line[1], line[2]] });
  }, [phase, grade, restored, week, id, line]);

  // A mouse or pen can drag a piece; touch keeps the page scrolling (tap, then tap).
  useEffect(() => {
    const squareAt = (x: number, y: number): Sq | null => {
      const r = boardRef.current?.getBoundingClientRect();
      if (!r) return null;
      const f = Math.floor(((x - r.left) / r.width) * 8), row = Math.floor(((y - r.top) / r.height) * 8);
      return f >= 0 && f < 8 && row >= 0 && row < 8 ? row * 8 + f : null;
    };
    const onMove = (e: globalThis.PointerEvent) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.pointer) return;
      const dx = e.clientX - d.x0, dy = e.clientY - d.y0;
      if (!d.on) {
        if (Math.hypot(dx, dy) < 5) return;
        d.on = true;
        // Captured only now: captured from the press, the release would land on the grid and the
        // browser would send a plain click there instead of to the square's button.
        d.grid.setPointerCapture?.(d.pointer);
        d.el.setAttribute("data-drag", "");
        boardRef.current?.setAttribute("data-dragging", "");
        dispatch({ type: "grab", sq: d.from });
      }
      e.preventDefault();
      d.el.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    const onUp = (e: globalThis.PointerEvent) => {
      const d = drag.current;
      if (!d || e.pointerId !== d.pointer) return;
      drag.current = null;
      if (!d.on) return; // a click: the button's onClick has it
      swallowClick.current = true;
      d.el.removeAttribute("data-drag");
      boardRef.current?.removeAttribute("data-dragging");
      d.el.style.transform = "";
      const to = e.type === "pointerup" ? squareAt(e.clientX, e.clientY) : null;
      dispatch(to !== null && to !== d.from ? { type: "drop", from: d.from, to } : { type: "cancel" });
    };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch" || e.button !== 0 || phase !== "play") return;
    const button = (e.target as HTMLElement).closest<HTMLElement>("[data-sq]");
    const from = Number(button?.dataset.sq ?? -1);
    if (s.pos.board[from]?.c !== "w") return;
    const el = boardRef.current?.querySelector<HTMLElement>(`.piece[data-sq="${from}"]`);
    if (!el) return;
    drag.current = { from, x0: e.clientX, y0: e.clientY, el, grid: e.currentTarget, pointer: e.pointerId, on: false };
  };
  // The click that ends a drag is not a press.
  const onClickCapture = (e: MouseEvent<HTMLDivElement>) => {
    if (!swallowClick.current) return;
    swallowClick.current = false;
    e.preventDefault();
    e.stopPropagation();
  };

  // Arrows walk the squares (no wrap), Home and End go to the rank's ends, Escape lets go of a piece.
  // Enter and Space are the buttons' own click.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      if (s.selected !== null) {
        e.preventDefault();
        dispatch({ type: "cancel" });
      }
      return;
    }
    const from = Number((e.target as HTMLElement).dataset.sq ?? s.focus);
    const r = from >> 3, f = from & 7;
    const to: Record<string, Sq> = {
      ArrowUp: r > 0 ? from - 8 : from,
      ArrowDown: r < 7 ? from + 8 : from,
      ArrowLeft: f > 0 ? from - 1 : from,
      ArrowRight: f < 7 ? from + 1 : from,
      Home: from - f,
      End: from - f + 7,
    };
    if (!(e.key in to)) return;
    e.preventDefault();
    dispatch({ type: "focus", sq: to[e.key] });
    squares.current[to[e.key]]?.focus();
  };

  const vm = boardVM(s);
  const log = logVM(s);
  const help = helpStep(s);
  const onHelp = () => {
    if (help === "again") writeSaved(null);
    dispatch({ type: "help" });
  };

  const grid = (
    <div
      className="board__grid"
      role="grid"
      aria-label={t.chess.board}
      aria-describedby={descId}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onClickCapture={onClickCapture}
    >
      {Array.from({ length: 8 }, (_, r) => (
        <div key={r} role="row" className="board__row">
          {Array.from({ length: 8 }, (_, f) => {
            const sq = r * 8 + f;
            return (
              <div key={f} role="gridcell" className="board__cell">
                <button
                  type="button"
                  ref={(el) => {
                    squares.current[sq] = el;
                  }}
                  className="board__sq"
                  data-sq={sq}
                  tabIndex={sq === vm.focus ? 0 : -1}
                  aria-label={vm.labels[sq]}
                  onClick={() => dispatch({ type: "press", sq })}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="chess__board">
        <BoardView vm={vm} grid={grid} boardRef={boardRef} phase={phase} />
        <p id={descId} className="sr-only">
          {describeRu(s.pos)} {t.chess.boardHelp}
        </p>
      </div>
      <LogView
        rows={log.rows}
        pending={log.pending}
        payoff={
          phase === "done" && grade ? (
            <div className="chess__landing" data-live={restored ? undefined : ""}>
              {payoffs[grade]}
            </div>
          ) : null
        }
      />
      <ControlsView label={help === "hint" ? t.chess.hint : help === "solution" ? t.chess.solution : t.chess.again} onClick={onHelp} />
      <p ref={liveRef} className="sr-only" aria-live="polite" />
    </>
  );
}
