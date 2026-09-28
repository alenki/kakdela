import { describe, expect, it } from "vitest";
import { fromUci, inCheck, keys, legalMoves, matesInOne, parseFen, play, status, uci, type Position } from "./chess";
import { describeRu, gradeOf, parseSaved, puzzleFor, sanRu, spokenRu, startOf, weekNumber, type Saved } from "./puzzle";
import { FIRST_MONDAY, puzzles, type Puzzle } from "@/content/puzzles";

const move = (p: Position, u: string) => {
  const m = fromUci(p, u);
  if (!m) throw new Error(`illegal ${u}`);
  return m;
};

describe("puzzle: the week", () => {
  it("turns over at Monday midnight, Moscow time", () => {
    expect(weekNumber(new Date("2026-09-20T20:59:59Z"))).toBe(-1); // Sunday 23:59:59 in Moscow
    expect(weekNumber(new Date("2026-09-20T21:00:00Z"))).toBe(0); // Monday 00:00
    expect(weekNumber(new Date("2026-09-27T20:59:59Z"))).toBe(0);
    expect(weekNumber(new Date("2026-09-27T21:00:00Z"))).toBe(1);
    expect(weekNumber(new Date("2027-09-20T21:00:00Z"))).toBe(52);
  });
  it("goes round the list, before the first week too", () => {
    expect(puzzleFor(0)).toBe(puzzles[0]);
    expect(puzzleFor(puzzles.length)).toBe(puzzles[0]);
    expect(puzzleFor(-1)).toBe(puzzles[puzzles.length - 1]);
  });
  it("starts on a Monday", () => {
    expect(new Date(`${FIRST_MONDAY}T12:00:00Z`).getUTCDay()).toBe(1);
  });
});

describe("puzzle: the grade is one of the hero's answers", () => {
  it("rewards a clean solve and forgives one slip", () => {
    expect(gradeOf({ mistakes: 0, hint: false, shown: false })).toBe("10-iz-10");
    expect(gradeOf({ mistakes: 1, hint: false, shown: false })).toBe("vsyo-shik");
    expect(gradeOf({ mistakes: 0, hint: true, shown: false })).toBe("vsyo-shik");
    expect(gradeOf({ mistakes: 1, hint: true, shown: false })).toBe("normalno");
    expect(gradeOf({ mistakes: 4, hint: false, shown: false })).toBe("normalno");
    expect(gradeOf({ mistakes: 0, hint: true, shown: true })).toBe("tak-sebe");
  });
});

describe("puzzle: Russian", () => {
  it("writes and says moves", () => {
    const start = parseFen("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1");
    expect(sanRu(start, move(start, "g1f3"))).toBe("Кf3");
    expect(spokenRu(start, move(start, "e2e4"))).toBe("пешка с e2 на e4");
    const scholar = parseFen("r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4");
    expect(spokenRu(scholar, move(scholar, "h5f7"))).toBe("ферзь с h5 берёт на f7, мат");
    const castle = parseFen("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1");
    expect(spokenRu(castle, move(castle, "e1g1"))).toBe("короткая рокировка");
    expect(spokenRu(castle, move(castle, "e1c1"))).toBe("длинная рокировка");
    const promo = parseFen("7k/P7/8/8/8/8/8/K7 w - - 0 1");
    expect(spokenRu(promo, move(promo, "a7a8q"))).toBe("пешка с a7 на a8, превращается в ферзя, шах");
  });
  it("describes a position for a screen reader", () => {
    expect(describeRu(parseFen("1r5k/6pp/8/8/8/8/4R3/4R1K1 w - - 0 1"))).toBe(
      "Белые: король g1, ладья e1, ладья e2. Чёрные: король h8, ладья b8, пешка g7, пешка h7.",
    );
  });
});

describe("puzzle: a saved solve", () => {
  const pz = puzzles[0];
  const good: Saved = { v: 1, week: 3, id: pz.id, grade: "10-iz-10", line: [pz.moves[1], pz.moves[2], pz.moves[3]] };
  const raw = (s: unknown) => JSON.stringify(s);

  it("comes back for the same puzzle and week", () => {
    expect(parseSaved(raw(good), 3, pz)).toEqual(good);
  });
  it("is dropped when it doesn't hold up", () => {
    expect(parseSaved(null, 3, pz)).toBeNull();
    expect(parseSaved("{not json", 3, pz)).toBeNull();
    expect(parseSaved(raw({ ...good, v: 2 }), 3, pz)).toBeNull();
    expect(parseSaved(raw(good), 4, pz)).toBeNull(); // another week
    expect(parseSaved(raw(good), 3, puzzles[1])).toBeNull(); // another puzzle
    expect(parseSaved(raw({ ...good, grade: "sonno" }), 3, pz)).toBeNull();
    expect(parseSaved(raw({ ...good, line: [pz.moves[1], pz.moves[2]] }), 3, pz)).toBeNull();
    expect(parseSaved(raw({ ...good, line: [pz.moves[1], pz.moves[2], "a1a1"] }), 3, pz)).toBeNull();
    // Legal moves that don't end in mate.
    const start = startOf(pz).start;
    const afterKey = play(start, move(start, pz.moves[1]));
    const afterReply = play(afterKey, move(afterKey, pz.moves[2]));
    const quiet = legalMoves(afterReply).find((m) => status(play(afterReply, m)) !== "mate")!;
    expect(parseSaved(raw({ ...good, line: [pz.moves[1], pz.moves[2], uci(quiet)] }), 3, pz)).toBeNull();
  });
});

/** Every rule the pipeline (scripts/fetch-puzzles.mjs) checks, again, on the committed list. */
function soundness(pz: Puzzle): string | null {
  const { before, setup, start } = startOf(pz);
  if (setup.flag === "k" || setup.flag === "q" || setup.flag === "ep" || setup.promo) return "setup special";
  if (before.turn !== "b" || start.turn !== "w") return "not white to move";
  if (inCheck(start)) return "white in check";
  if (matesInOne(start).length) return "mate in one";
  const found = keys(start).map(uci);
  if (found.length !== 1 || found[0] !== pz.moves[1]) return `keys ${found.join(" ")}`;
  const afterKey = play(start, move(start, pz.moves[1]));
  const reply = fromUci(afterKey, pz.moves[2]);
  if (!reply) return "reply illegal";
  if (!matesInOne(play(afterKey, reply)).some((m) => uci(m) === pz.moves[3])) return "mate";
  for (const r of legalMoves(afterKey)) {
    if (!matesInOne(play(afterKey, r)).some((m) => !m.promo || m.promo === "q")) return "underpromotion only";
  }
  return null;
}

describe("puzzle: the committed list", () => {
  it("has a year of distinct puzzles", () => {
    expect(puzzles).toHaveLength(52);
    expect(new Set(puzzles.map((p) => p.id)).size).toBe(52);
  });
  it("has only sound mates in two the page can play", { timeout: 60_000 }, () => {
    const faults = puzzles.map((pz) => [pz.id, soundness(pz)]).filter(([, why]) => why);
    expect(faults).toEqual([]);
  });
});
