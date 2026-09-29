import { describe, expect, it } from "vitest";
import { fromUci, parseFen, play, sqOf, toFen, type Position } from "@/lib/chess";
import type { Puzzle } from "@/content/puzzles";
import { arrowPaths, assignIds, boardVM, helpStep, initGame, logVM, reduce, trackIds, type Action, type GameState } from "./model";

// Solver fixture A, one move earlier: Black's rook steps from c8 to b8, then White mates on the back rank
// (1. Лe8+ Лxe8 2. Лxe8#).
const PZ: Puzzle = { id: "test", fen: "2r4k/6pp/8/8/8/8/4R3/4R1K1 b - - 0 1", moves: ["c8b8", "e2e8", "b8e8", "e1e8"], rating: 1000 };
const START = "1r5k/6pp/8/8/8/8/4R3/4R1K1 w - - 1 2";

const sq = sqOf;
const run = (s: GameState, ...actions: Action[]) => actions.reduce(reduce, s);
const press = (name: string): Action => ({ type: "press", sq: sq(name) });
/** Select a piece and move it: two presses, as a click-click or Enter, Enter. */
const go = (from: string, to: string) => [press(from), press(to)];
const fen = (s: GameState) => toFen(s.pos);
const fresh = () => initGame(PZ, 0, {});

describe("puzzle model: the start", () => {
  it("waits for White's first move, the café's last move arrowed and no square marked", () => {
    const s = fresh();
    expect(s.phase).toBe("play");
    expect(fen(s)).toBe(START);
    expect(logVM(s)).toEqual({ rows: [], pending: 1 });
    expect(boardVM(s).arrow).not.toBeNull();
    expect(boardVM(s).marks).toEqual([]);
  });
  it("can replay Black's last move as its entrance", () => {
    const s = initGame(PZ, 0, { entrance: true });
    expect(s.phase).toBe("intro");
    expect(toFen(s.pos)).toBe(PZ.fen);
    const t = reduce(s, { type: "setup" });
    expect(t.phase).toBe("play");
    expect(fen(t)).toBe(START);
    // A press during the entrance finishes it first.
    expect(fen(reduce(s, press("e2")))).toBe(START);
  });
  it("selects only White's movable pieces and shows where they can go", () => {
    let s = run(fresh(), press("h8"));
    expect(s.selected).toBeNull();
    s = run(s, press("e2"));
    expect(s.selected).toBe(sq("e2"));
    const vm = boardVM(s);
    expect(vm.marks.some((m) => m.kind === "ring" && m.sq === sq("b2"))).toBe(false); // nothing to take on b2
    expect(vm.marks.some((m) => m.kind === "dot" && m.sq === sq("e8"))).toBe(true);
    expect(run(s, { type: "cancel" }).selected).toBeNull();
  });
  it("grabs a piece for a drag without letting go of it", () => {
    const s = run(fresh(), press("e2"), { type: "grab", sq: sq("e2") });
    expect(s.selected).toBe(sq("e2")); // a press here would have let go
    expect(run(fresh(), { type: "grab", sq: sq("h8") }).selected).toBeNull(); // not White's
    expect(run(fresh(), { type: "drop", from: sq("e2"), to: sq("e8") }).phase).toBe("cafe");
  });
});

describe("puzzle model: a try", () => {
  it("is refuted, noted and taken back", () => {
    let s = run(fresh(), ...go("e1", "f1"));
    expect(s.phase).toBe("cafe");
    expect(logVM(s).rows).toEqual([{ n: 1, white: "Лf1", black: null, note: null, bad: false }]);
    s = reduce(s, { type: "cafe" });
    expect(s.phase).toBe("read");
    const [row] = logVM(s).rows;
    expect(row.white).toBe("Лf1?");
    expect(row.black).toMatch(/!$/);
    expect(row.note).toBe("Мата нет.");
    expect(row.bad).toBe(true);
    expect(s.mistakes).toBe(1);
    s = reduce(s, { type: "rewind" });
    expect(s.phase).toBe("play");
    expect(fen(s)).toBe(START);
    expect(logVM(s).pending).toBe(1);
    expect(logVM(s).rows).toHaveLength(1); // the try stays in the transcript
  });
  it("is taken back at once by a press while the café's answer is read", () => {
    const s = run(fresh(), ...go("e1", "f1"), { type: "cafe" }, press("e2"));
    expect(s.phase).toBe("play");
    expect(fen(s)).toBe(START);
  });
  it("keeps only the last three tries in the transcript", () => {
    let s = fresh();
    for (const to of ["f1", "d1", "c1", "b1"]) s = run(s, ...go("e1", to), { type: "cafe" }, { type: "rewind" });
    expect(logVM(s).rows.map((r) => r.white)).toEqual(["Лd1?", "Лc1?", "Лb1?"]);
    expect(s.mistakes).toBe(4);
  });
});

describe("puzzle model: the solve", () => {
  it("answers the key with the defence, then takes the mate", () => {
    let s = run(fresh(), ...go("e2", "e8"), { type: "cafe" });
    expect(s.phase).toBe("play");
    expect(logVM(s)).toEqual({ rows: [{ n: 1, white: "Лe8+!", black: "Лxe8", note: null, bad: false }], pending: 2 });
    s = run(s, ...go("e1", "e8"));
    expect(s.phase).toBe("done");
    expect(logVM(s).rows.at(-1)).toEqual({ n: 2, white: "Лxe8#", black: null, note: "Мат.", bad: false });
    expect(logVM(s).pending).toBeNull();
    expect(s.grade).toBe("10-iz-10");
    expect(boardVM(s).arrow).toBeNull(); // the tab is the moment now
    expect(s.line).toEqual(["e2e8", "b8e8", "e1e8"]);
  });
  it("takes back a second move that isn't mate", () => {
    let s = run(fresh(), ...go("e2", "e8"), { type: "cafe" });
    const afterDefence = fen(s);
    s = run(s, ...go("g1", "h1"), { type: "cafe" });
    expect(s.phase).toBe("read");
    expect(logVM(s).rows.at(-1)).toMatchObject({ n: 2, white: "Крh1?", note: "Мата нет.", bad: true });
    s = reduce(s, { type: "rewind" });
    expect(fen(s)).toBe(afterDefence);
    expect(logVM(s).pending).toBe(2);
    s = run(s, ...go("e1", "e8"));
    expect(s.grade).toBe("vsyo-shik");
  });
  it("grades by slips: a try and the hint make «Нормально»", () => {
    const s = run(fresh(), ...go("e1", "f1"), { type: "cafe" }, { type: "rewind" }, { type: "help" }, ...go("e2", "e8"), { type: "cafe" }, ...go("e1", "e8"));
    expect(s.grade).toBe("normalno");
  });
});

describe("puzzle model: help", () => {
  it("first rings the piece to move, then plays the solution", () => {
    let s = run(fresh(), { type: "help" });
    expect(s.hint).toBe(sq("e2"));
    expect(helpStep(s)).toBe("solution");
    expect(boardVM(s).marks.some((m) => m.kind === "hint" && m.sq === sq("e2"))).toBe(true);
    s = run(s, { type: "help" });
    expect(s.phase).toBe("auto");
    s = run(s, { type: "step" }, { type: "step" }, { type: "step" });
    expect(s.phase).toBe("done");
    expect(s.grade).toBe("tak-sebe");
    expect(logVM(s).rows.map((r) => [r.white, r.black])).toEqual([["Лe8+!", "Лxe8"], ["Лxe8#", null]]);
    expect(helpStep(s)).toBe("again");
  });
  it("starts again from the puzzle's position", () => {
    const s = run(fresh(), { type: "help" }, { type: "help" }, { type: "step" }, { type: "step" }, { type: "step" }, { type: "help" });
    expect(s.phase).toBe("play");
    expect(fen(s)).toBe(START);
    expect(s.grade).toBeNull();
    expect(logVM(s)).toEqual({ rows: [], pending: 1 });
    expect(helpStep(s)).toBe("hint");
  });
});

describe("puzzle model: a saved solve", () => {
  it("comes back solved, with its grade", () => {
    const s = initGame(PZ, 5, { saved: { v: 1, week: 5, id: "test", grade: "vsyo-shik", line: ["e2e8", "b8e8", "e1e8"] } });
    expect(s.phase).toBe("done");
    expect(s.restored).toBe(true);
    expect(s.grade).toBe("vsyo-shik");
    expect(logVM(s).rows).toHaveLength(2);
    expect(toFen(s.pos).startsWith("4R2k/6pp/8/8/8/8/8/6K1")).toBe(true);
  });
});

describe("puzzle model: pieces keep their ids", () => {
  const step = (p: Position, ids: (string | null)[], u: string) => {
    const m = fromUci(p, u)!;
    return [play(p, m), trackIds(ids, m)] as const;
  };
  it("through a capture, castling, promotion and en passant", () => {
    let p = parseFen("r3k3/1P6/8/3pP3/8/8/8/R3K2R w KQq d6 0 1");
    let ids = assignIds(p);
    const rook = ids[sq("h1")], king = ids[sq("e1")], pawn = ids[sq("b7")], ep = ids[sq("e5")];
    [p, ids] = step(p, ids, "e5d6"); // en passant: the d5 pawn goes
    expect(ids[sq("d6")]).toBe(ep);
    expect(ids[sq("d5")]).toBeNull();
    [p, ids] = step(p, ids, "a8a7");
    [p, ids] = step(p, ids, "e1g1"); // castling: the rook comes along
    expect(ids[sq("g1")]).toBe(king);
    expect(ids[sq("f1")]).toBe(rook);
    expect(ids[sq("h1")]).toBeNull();
    [p, ids] = step(p, ids, "a7a6");
    [p, ids] = step(p, ids, "b7b8q"); // promotion: the same piece, now a queen
    expect(ids[sq("b8")]).toBe(pawn);
    expect(p.board[sq("b8")]).toEqual({ c: "w", k: "q" });
    expect(ids.filter(Boolean)).toHaveLength(p.board.filter(Boolean).length);
  });
});

describe("puzzle model: the arrow", () => {
  it("is a finite, repeatable curve whose tip lies in the target square", () => {
    for (const [from, to, knight] of [["g8", "f6", true], ["c8", "b8", false], ["a1", "h8", false], ["h2", "h1", false]] as const) {
      const a = arrowPaths(sq(from), sq(to), knight);
      expect(a).toEqual(arrowPaths(sq(from), sq(to), knight));
      const nums = `${a.shaft} ${a.head}`.match(/-?\d+(\.\d+)?/g)!.map(Number);
      expect(nums.every(Number.isFinite)).toBe(true);
      const [x, y] = a.tip;
      const t = sq(to);
      expect(Math.floor(x / 100)).toBe(t & 7);
      expect(Math.floor(y / 100)).toBe(t >> 3);
    }
  });
});
