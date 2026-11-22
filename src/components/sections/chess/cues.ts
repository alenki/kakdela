import { inCheck, status, type Piece, type Position, type Sq } from "@/lib/chess";
import type { ChessCue } from "@/lib/sound";
import type { GameState } from "./model";

// What «Задача недели» sounds like, read off two states in a row, so the model (model.ts) knows nothing of
// sound. Game.tsx hands the cue to src/lib/sound.ts, which plays it only while the season's sound is on.
//   move   a piece lands (the guest's, the café's, the solution's, Black's entrance): wood set down on wood, a
//          capture knocking the taken piece first; then a check pings, the mate rings, and the café's
//          refutation or a stalemate falls («Мата нет.», «Пат.»)
//   back   the pieces slide home (a wrong move taken back, «Решить заново»)

const same = (a: Piece | null, b: Piece | null) => a?.c === b?.c && a?.k === b?.k;
const count = (p: Position) => p.board.reduce((n, pc) => n + (pc ? 1 : 0), 0);

/** The square a move landed on: the one that holds a piece it didn't before (castling: the king's). */
function landed(prev: Position, next: Position): Sq | null {
  let to: Sq | null = null;
  for (let sq = 0; sq < 64; sq++) {
    const pc = next.board[sq];
    if (pc && !same(pc, prev.board[sq]) && (to === null || pc.k === "k")) to = sq;
  }
  return to;
}

/** The sound of going from one state to the next, or null for one that moves nothing (a selection, the
 *  focus, the hint). */
export function cueOf(prev: GameState, next: GameState): ChessCue | null {
  if (next.pos === prev.pos) return null;
  if (prev.phase === "read" || prev.phase === "done") return { kind: "back" };
  const to = landed(prev.pos, next.pos);
  if (to === null) return null;
  const then = status(next.pos) === "mate" ? "mate" : next.phase === "read" ? "wrong" : inCheck(next.pos) ? "check" : null;
  return { kind: "move", piece: next.pos.board[to]!.k, file: to & 7, capture: count(next.pos) < count(prev.pos), then };
}
