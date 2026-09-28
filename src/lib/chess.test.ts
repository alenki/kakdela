import { describe, expect, it } from "vitest";
import {
  defense,
  fromUci,
  keys,
  legalMoves,
  matesInOne,
  parseFen,
  perft,
  play,
  refutation,
  san,
  solves,
  sqName,
  sqOf,
  START_FEN,
  status,
  toFen,
  uci,
  type Letters,
} from "./chess";

/** Russian letters: король, ферзь, ладья, слон, конь; captures with «x». */
const RU: Letters = { k: "Кр", q: "Ф", r: "Л", b: "С", n: "К", x: "x" };

/** Plays UCI moves from a FEN and returns each move in Russian notation. */
function line(fen: string, moves: string[]): string[] {
  let p = parseFen(fen);
  return moves.map((u) => {
    const m = fromUci(p, u);
    if (!m) throw new Error(`illegal ${u} in ${toFen(p)}`);
    const s = san(p, m, RU);
    p = play(p, m);
    return s;
  });
}

// Perft positions and counts from the Chess Programming Wiki («Perft Results»): every legal move to a
// fixed depth, so castling, en passant, promotions, pins and checks are all counted exactly.
const KIWIPETE = "r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1";
const POS3 = "8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1";
const POS4 = "r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1";
const POS5 = "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8";
const POS6 = "r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10";

describe("chess: board and FEN", () => {
  it("names squares from a8 (0) to h1 (63)", () => {
    expect(sqName(0)).toBe("a8");
    expect(sqName(7)).toBe("h8");
    expect(sqName(56)).toBe("a1");
    expect(sqName(63)).toBe("h1");
    expect(sqOf("e4")).toBe(36);
    expect(sqName(sqOf("d6"))).toBe("d6");
  });
  it("reads and writes FEN unchanged", () => {
    for (const fen of [START_FEN, KIWIPETE, POS3, POS4, POS5, POS6, "4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1"]) {
      expect(toFen(parseFen(fen))).toBe(fen);
    }
  });
  it("rejects a malformed FEN", () => {
    expect(() => parseFen("not a fen")).toThrow();
    expect(() => parseFen("8/8/8/8/8/8/8/8 w - - 0 1")).toThrow(); // no kings
    expect(() => parseFen("rnbqkbnr/pppppppp/9/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1")).toThrow();
  });
});

describe("chess: move generation (perft)", () => {
  const cases: [string, string, number[]][] = [
    ["start", START_FEN, [20, 400, 8902, 197281]],
    ["kiwipete", KIWIPETE, [48, 2039, 97862]],
    ["position 3", POS3, [14, 191, 2812, 43238]],
    ["position 4", POS4, [6, 264, 9467]],
    ["position 5", POS5, [44, 1486, 62379]],
    ["position 6", POS6, [46, 2079, 89890]],
  ];
  for (const [name, fen, counts] of cases) {
    it(`counts ${name} to depth ${counts.length}`, { timeout: 30_000 }, () => {
      const p = parseFen(fen);
      counts.forEach((n, i) => expect(perft(p, i + 1)).toBe(n));
    });
  }
});

describe("chess: UCI", () => {
  it("reads a legal move and writes it back", () => {
    const p = parseFen(START_FEN);
    const m = fromUci(p, "e2e4");
    expect(m && uci(m)).toBe("e2e4");
    expect(m?.flag).toBe("double");
    expect(fromUci(p, "e2e5")).toBeNull();
    expect(fromUci(p, "e7e5")).toBeNull(); // not White's piece
    expect(fromUci(p, "zz")).toBeNull();
  });
  it("names the promotion piece", () => {
    const p = parseFen("7k/P7/8/8/8/8/8/K7 w - - 0 1");
    expect(fromUci(p, "a7a8n")?.promo).toBe("n");
    expect(uci(fromUci(p, "a7a8q")!)).toBe("a7a8q");
    expect(fromUci(p, "a7a8")).toBeNull(); // a promotion must say what it becomes
  });
});

describe("chess: Russian notation", () => {
  it("writes a game in short notation with Russian letters", () => {
    // Scholar's mate.
    expect(line(START_FEN, ["e2e4", "e7e5", "f1c4", "b8c6", "d1h5", "g8f6", "h5f7"])).toEqual(["e4", "e5", "Сc4", "Кc6", "Фh5", "Кf6", "Фxf7#"]);
    // Fool's mate.
    expect(line(START_FEN, ["f2f3", "e7e5", "g2g4", "d8h4"]).at(-1)).toBe("Фh4#");
  });
  it("disambiguates by file, then by rank", () => {
    expect(line("4k3/8/8/8/8/5N2/8/1N2K3 w - - 0 1", ["b1d2"])).toEqual(["Кbd2"]);
    expect(line("4k3/8/8/8/8/5N2/8/1N2K3 w - - 0 1", ["f3d2"])).toEqual(["Кfd2"]);
    expect(line("4k3/8/8/R7/8/8/8/R3K3 w - - 0 1", ["a1a3"])).toEqual(["Л1a3"]);
    expect(line("4k3/8/8/R7/8/8/8/R3K3 w - - 0 1", ["a5a3"])).toEqual(["Л5a3"]);
  });
  it("writes castling with zeros, promotions and en passant", () => {
    expect(line("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", ["e1g1"])).toEqual(["0-0"]);
    expect(line("r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1", ["e1c1"])).toEqual(["0-0-0"]);
    expect(line("7k/P7/8/8/8/8/8/K7 w - - 0 1", ["a7a8q"])).toEqual(["a8Ф+"]);
    expect(line("7k/P7/8/8/8/8/8/K7 w - - 0 1", ["a7a8n"])).toEqual(["a8К"]);
    expect(line("4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1", ["e5d6"])).toEqual(["exd6"]);
    expect(line("4k3/8/8/8/8/8/8/4K2R w K - 0 1", ["h1h8"])).toEqual(["Лh8+"]);
  });
});

describe("chess: the mate-in-two solver", () => {
  // A: White mates on the back rank: 1. Лe8+ Лxe8 2. Лxe8#. The e1 rook can't go first (e2 is in its way).
  const A = parseFen("1r5k/6pp/8/8/8/8/4R3/4R1K1 w - - 0 1");
  // S: the queen can mate at once (Фf8#) or stalemate (Фf7).
  const S = parseFen("7k/8/6K1/8/8/8/8/5Q2 w - - 0 1");
  const move = (p: Parameters<typeof fromUci>[0], u: string) => {
    const m = fromUci(p, u);
    if (!m) throw new Error(`illegal ${u}`);
    return m;
  };

  it("finds the one key and the defence after it", () => {
    expect(matesInOne(A)).toEqual([]);
    expect(keys(A).map(uci)).toEqual(["e2e8"]);
    const key = move(A, "e2e8");
    expect(solves(A, key)).toBe(true);
    const reply = defense(A, key);
    expect(reply && uci(reply)).toBe("b8e8");
    expect(matesInOne(play(play(A, key), reply!)).map(uci)).toEqual(["e1e8"]);
    expect(line(toFen(A), ["e2e8", "b8e8", "e1e8"])).toEqual(["Лe8+", "Лxe8", "Лxe8#"]);
  });
  it("answers a try with a reply that leaves no mate", () => {
    const tryMove = move(A, "e1f1");
    expect(solves(A, tryMove)).toBe(false);
    const r = refutation(A, tryMove);
    expect(r).not.toBeNull();
    const after = play(play(A, tryMove), r!);
    expect(matesInOne(after)).toEqual([]);
    // The key has no refutation.
    expect(refutation(A, move(A, "e2e8"))).toBeNull();
  });
  it("counts a mate at once as solved, and a stalemate as not", () => {
    expect(solves(S, move(S, "f1f8"))).toBe(true);
    expect(status(play(S, move(S, "f1f7")))).toBe("stalemate");
    expect(solves(S, move(S, "f1f7"))).toBe(false);
    expect(refutation(S, move(S, "f1f7"))).toBeNull(); // nothing to answer with
    expect(defense(S, move(S, "f1f8"))).toBeNull();
  });
  it("prefers the given defence when it is legal", () => {
    // The Lichess example row (00sHx): the FEN is before Black's setup move, then the solution.
    const before = parseFen("q3k1nr/1pp1nQpp/3p4/1P2p3/4P3/B1PP1b2/B5PP/5K2 b k - 0 17");
    const start = play(before, move(before, "e8d7"));
    expect(keys(start).map(uci)).toEqual(["a2e6"]);
    const key = move(start, "a2e6");
    expect(uci(defense(start, key, "d7d8")!)).toBe("d7d8");
    // A preference that isn't a legal reply is ignored.
    const fallback = defense(start, key, "h8h1");
    expect(fallback).not.toBeNull();
    expect(uci(fallback!)).not.toBe("h8h1");
    const afterKey = play(start, key);
    expect(matesInOne(play(afterKey, move(afterKey, "d7d8"))).map(uci)).toContain("f7f8");
  });
});

describe("chess: status", () => {
  it("tells mate, stalemate, check and play apart", () => {
    // Fool's mate.
    expect(status(parseFen("rnb1kbnr/pppp1ppp/8/4p3/6Pq/5P2/PPPPP2P/RNBQKBNR w KQkq - 1 3"))).toBe("mate");
    expect(status(parseFen("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1"))).toBe("stalemate");
    expect(status(parseFen("7k/8/6K1/8/8/8/8/7Q b - - 0 1"))).toBe("check");
    expect(status(parseFen(START_FEN))).toBe("play");
    expect(legalMoves(parseFen("7k/5Q2/6K1/8/8/8/8/8 b - - 0 1"))).toHaveLength(0);
  });
});
