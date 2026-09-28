"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Grade } from "@/lib/puzzle";
import type { GameState } from "./model";
import type { Game as GameComponent } from "./Game";

type Loaded = { Game: typeof GameComponent; init: GameState };

/**
 * The puzzle's thin client half, as the runner's (src/components/game/RunnerIsland.tsx). The server
 * renders this week's board still (the children); the game (its rules, the solver, the year of
 * puzzles) is fetched only when the section comes near or the guest reaches for it, then takes the
 * board's place. It never hydrates, so it can read the date and the saved solve as it starts, and it
 * stays out of the page's first load. A failed chunk (offline) leaves the still board.
 */
export function PuzzleIsland({ children, payoffs, labels }: { children: ReactNode; payoffs: Record<Grade, ReactNode>; labels: Record<Grade, string> }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const board = root?.querySelector("[data-board]");
    if (!root || !board) return;
    let alive = true;
    let loading = false;
    const load = () => {
      if (loading) return;
      loading = true;
      import("./Game")
        .then((m) => {
          if (alive) setLoaded({ Game: m.Game, init: m.boot(root, labels) });
        })
        .catch(() => {
          loading = false;
        });
    };
    // The wrapper is display: contents (its children sit on the section's grid), so watch the board.
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        io.disconnect();
        load();
      }
    }, { rootMargin: "800px 0px" });
    io.observe(board);
    root.addEventListener("pointerenter", load);
    root.addEventListener("focusin", load);
    return () => {
      alive = false;
      io.disconnect();
      root.removeEventListener("pointerenter", load);
      root.removeEventListener("focusin", load);
    };
  }, [labels]);

  return (
    <div ref={rootRef} className="chess__play">
      {loaded ? <loaded.Game init={loaded.init} payoffs={payoffs} /> : children}
    </div>
  );
}
