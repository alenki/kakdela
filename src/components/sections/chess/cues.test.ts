import { describe, expect, it } from "vitest";
import { fromUci, parseFen, play, sqOf, type Position } from "@/lib/chess";
import type { Puzzle } from "@/content/puzzles";
import type { ChessCue } from "@/lib/sound";
import { cueOf } from "./cues";
import { initGame, reduce, type Action, type GameState } from "./model";

// The model's fixture (model.test.ts): Black's rook steps from c8 to b8, then 1. Лe8+ Лxe8 2. Лxe8#.
const PZ: Puzzle = { id: "test", fen: "2r4k/6pp/8/8/8/8/4R3/4R1K1 b - - 0 1", moves: ["c8b8", "e2e8", "b8e8", "e1e8"], rating: 1000 };

const press = (name: string): Action => ({ type: "press", sq: sqOf(name) });
const go = (from: string, to: string) => [press(from), press(to)];
const fresh = () => initGame(PZ, 0, {});
const move = (piece: string, file: string, capture: boolean, then: string | null) => ({
  kind: "move",
  piece,
  file: "abcdefgh".indexOf(file),
  capture,
  then,
});

/** The cues a run of actions makes, in order (a state that moves nothing makes none). */
function cues(s: GameState, ...actions: Action[]): ChessCue[] {
  const out: ChessCue[] = [];
  for (const a of actions) {
    const next = reduce(s, a);
    const cue = cueOf(s, next);
    if (cue) out.push(cue);
    s = next;
  }
  return out;
}

describe("puzzle sounds", () => {
  it("are silent for a selection, the focus, a cancel and the hint", () => {
    expect(cues(fresh(), press("e2"), { type: "cancel" }, { type: "focus", sq: 0 }, press("h8"), { type: "help" })).toEqual([]);
  });
  it("knock the key with a check, the defence with a capture, and ring the mate", () => {
    expect(cues(fresh(), ...go("e2", "e8"), { type: "cafe" }, ...go("e1", "e8"))).toEqual([
      move("r", "e", false, "check"),
      move("r", "e", true, null),
      move("r", "e", true, "mate"),
    ]);
  });
  it("say no to a try the café refutes, then slide the pieces home", () => {
    const [mine, cafe, back, ...rest] = cues(fresh(), ...go("e1", "f1"), { type: "cafe" }, { type: "rewind" });
    expect(mine).toEqual(move("r", "f", false, null));
    expect(cafe).toMatchObject({ kind: "move", then: "wrong" });
    expect(back).toEqual({ kind: "back" });
    expect(rest).toEqual([]);
    // A press while the café's answer is read takes it back at once, with the same slide.
    expect(cues(fresh(), ...go("e1", "f1"), { type: "cafe" }, press("e2")).at(-1)).toEqual({ kind: "back" });
  });
  it("knock a drag's drop like a click's move", () => {
    expect(cues(fresh(), { type: "drop", from: sqOf("e2"), to: sqOf("e8") })).toEqual([move("r", "e", false, "check")]);
  });
  it("knock Black's entrance as it slides in", () => {
    expect(cues(initGame(PZ, 0, { entrance: true }), { type: "setup" })).toEqual([move("r", "b", false, null)]);
  });
  it("play the solution move by move, and slide everything home for «Решить заново»", () => {
    expect(cues(fresh(), { type: "help" }, { type: "help" }, { type: "step" }, { type: "step" }, { type: "step" }, { type: "help" })).toEqual([
      move("r", "e", false, "check"),
      move("r", "e", true, null),
      move("r", "e", true, "mate"),
      { kind: "back" },
    ]);
  });
  it("are silent for a solve that comes back from storage", () => {
    const s = initGame(PZ, 5, { saved: { v: 1, week: 5, id: "test", grade: "vsyo-shik", line: ["e2e8", "b8e8", "e1e8"] } });
    expect(cueOf(s, s)).toBeNull();
  });

  describe("read the move off the board", () => {
    const at = (pos: Position): GameState => ({ ...fresh(), pos, phase: "play" });
    const after = (fen: string, u: string) => {
      const p = parseFen(fen);
      return cueOf(at(p), at(play(p, fromUci(p, u)!)));
    };
    it("castling lands on the king's square", () => {
      expect(after("r3k3/8/8/8/8/8/8/R3K2R w KQq - 0 1", "e1g1")).toEqual(move("k", "g", false, null));
      expect(after("r3k3/8/8/8/8/8/8/R3K2R w KQq - 0 1", "e1c1")).toEqual(move("k", "c", false, null));
    });
    it("en passant is a capture, and a promotion lands as its new piece", () => {
      expect(after("4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1", "e5d6")).toEqual(move("p", "d", true, null));
      expect(after("4k3/1P6/8/8/8/8/8/4K3 w - - 0 1", "b7b8q")).toEqual(move("q", "b", false, "check"));
    });
  });
});
