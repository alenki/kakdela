/**
 * Chess rules for the weekly puzzle («Задача недели»): FEN, legal moves, check and mate.
 *
 * Self-contained on purpose: no imports and only erasable TypeScript, so `scripts/fetch-puzzles.mjs`
 * can import this file directly (Node strips the types) and check every puzzle by the same rules the
 * page plays by. Keep it that way.
 *
 * The board is 64 squares in FEN order: a8 = 0, h8 = 7, a1 = 56, h1 = 63 (row `sq >> 3` from the top,
 * file `sq & 7`). Positions are values: `play()` returns a new one and never changes its argument.
 */

export type Color = "w" | "b";
export type Kind = "p" | "n" | "b" | "r" | "q" | "k";
export type Sq = number;
export type Piece = { readonly c: Color; readonly k: Kind };
export type Position = {
  readonly board: readonly (Piece | null)[];
  readonly turn: Color;
  /** Castling rights as bits: 1 white short, 2 white long, 4 black short, 8 black long. */
  readonly castling: number;
  /** The en-passant target square (the one the pawn passed over), or -1. */
  readonly ep: Sq;
  readonly half: number;
  readonly full: number;
};
/** `double`: a pawn's two-square step; `ep`: en passant; `k` / `q`: short / long castling. */
export type Flag = "" | "double" | "ep" | "k" | "q";
export type Move = {
  readonly from: Sq;
  readonly to: Sq;
  readonly piece: Piece;
  readonly captured: Piece | null;
  readonly promo: Kind | null;
  readonly flag: Flag;
};

export const START_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

const FILES = "abcdefgh";
const KINDS = "pnbrqk";
const PROMOS: Kind[] = ["q", "r", "b", "n"];

/** 0 → «a8», 63 → «h1». */
export const sqName = (s: Sq) => `${FILES[s & 7]}${8 - (s >> 3)}`;

/** «a8» → 0, «h1» → 63; anything else → -1. */
export function sqOf(name: string): Sq {
  const f = FILES.indexOf(name[0] ?? "");
  const r = name.length === 2 ? Number(name[1]) : NaN;
  return f >= 0 && r >= 1 && r <= 8 ? (8 - r) * 8 + f : -1;
}

export const other = (c: Color): Color => (c === "w" ? "b" : "w");

// One shared object per piece, so boards never allocate pieces.
const PIECES: Record<string, Piece> = {};
for (const c of ["w", "b"] as Color[]) for (const k of KINDS) PIECES[c + k] = { c, k: k as Kind };
const piece = (c: Color, k: Kind) => PIECES[c + k];

// ── Attack tables, built once ──
// Directions as [row step, file step]; rows count down the board (-1 is towards rank 8).
const DIRS: [number, number][] = [[-1, 0], [1, 0], [0, 1], [0, -1], [-1, 1], [-1, -1], [1, 1], [1, -1]];
const ROOK_DIRS = [0, 1, 2, 3];
const BISHOP_DIRS = [4, 5, 6, 7];
const ALL_DIRS = [0, 1, 2, 3, 4, 5, 6, 7];
const KNIGHT: Sq[][] = [];
const KING: Sq[][] = [];
/** RAYS[direction][square]: the squares along that direction, nearest first. */
const RAYS: Sq[][][] = DIRS.map(() => []);
const inside = (r: number, f: number) => r >= 0 && r < 8 && f >= 0 && f < 8;
for (let s = 0; s < 64; s++) {
  const r = s >> 3, f = s & 7;
  const hop = (steps: [number, number][]) => steps.filter(([dr, df]) => inside(r + dr, f + df)).map(([dr, df]) => (r + dr) * 8 + f + df);
  KNIGHT[s] = hop([[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]]);
  KING[s] = hop(DIRS);
  DIRS.forEach(([dr, df], d) => {
    const ray: Sq[] = [];
    for (let i = 1; inside(r + dr * i, f + df * i); i++) ray.push((r + dr * i) * 8 + f + df * i);
    RAYS[d][s] = ray;
  });
}

// ── FEN ──
export function parseFen(fen: string): Position {
  const bad = (why: string) => new Error(`Bad FEN (${why}): ${fen}`);
  const [place = "", turn, castle = "", ep = "", half = "0", full = "1"] = fen.trim().split(/\s+/);
  const rows = place.split("/");
  if (rows.length !== 8) throw bad("rows");
  const board: (Piece | null)[] = [];
  for (const row of rows) {
    let n = 0;
    for (const ch of row) {
      if (ch >= "1" && ch <= "8") {
        for (let i = 0; i < Number(ch); i++) board.push(null);
        n += Number(ch);
      } else {
        const k = ch.toLowerCase();
        if (!KINDS.includes(k)) throw bad(`piece ${ch}`);
        board.push(piece(ch === k ? "b" : "w", k as Kind));
        n++;
      }
    }
    if (n !== 8) throw bad("row width");
  }
  if (turn !== "w" && turn !== "b") throw bad("side to move");
  let castling = 0;
  if (castle !== "-") {
    for (const ch of castle) {
      const bit = "KQkq".indexOf(ch);
      if (bit < 0) throw bad("castling");
      castling |= 1 << bit;
    }
  }
  const epSq = ep === "-" ? -1 : sqOf(ep);
  if (ep !== "-" && epSq < 0) throw bad("en passant");
  if (!/^\d+$/.test(half) || !/^\d+$/.test(full)) throw bad("counters");
  for (const c of ["w", "b"] as Color[]) {
    if (board.filter((p) => p === piece(c, "k")).length !== 1) throw bad("kings");
  }
  return { board, turn, castling, ep: epSq, half: Number(half), full: Number(full) };
}

export function toFen(p: Position): string {
  const rows: string[] = [];
  for (let r = 0; r < 8; r++) {
    let row = "", empty = 0;
    for (let f = 0; f < 8; f++) {
      const pc = p.board[r * 8 + f];
      if (!pc) {
        empty++;
        continue;
      }
      if (empty) row += empty;
      empty = 0;
      row += pc.c === "w" ? pc.k.toUpperCase() : pc.k;
    }
    rows.push(empty ? row + empty : row);
  }
  const castle = [..."KQkq"].filter((_, i) => p.castling & (1 << i)).join("") || "-";
  return `${rows.join("/")} ${p.turn} ${castle} ${p.ep < 0 ? "-" : sqName(p.ep)} ${p.half} ${p.full}`;
}

// ── Attacks ──
function kingOf(board: Position["board"], c: Color): Sq {
  const king = piece(c, "k");
  return board.indexOf(king);
}

/** Is `sq` attacked by any piece of colour `by`? */
function attacked(board: Position["board"], sq: Sq, by: Color): boolean {
  const r = sq >> 3, f = sq & 7;
  // A pawn attacks diagonally forwards: a white one from the row below, a black one from the row above.
  const pr = by === "w" ? r + 1 : r - 1;
  if (pr >= 0 && pr < 8) {
    const pawn = piece(by, "p");
    if (f > 0 && board[pr * 8 + f - 1] === pawn) return true;
    if (f < 7 && board[pr * 8 + f + 1] === pawn) return true;
  }
  const knight = piece(by, "n"), king = piece(by, "k");
  for (const t of KNIGHT[sq]) if (board[t] === knight) return true;
  for (const t of KING[sq]) if (board[t] === king) return true;
  const queen = piece(by, "q");
  const slides = (dirs: number[], slider: Piece) => {
    for (const d of dirs) {
      for (const t of RAYS[d][sq]) {
        const pc = board[t];
        if (!pc) continue;
        if (pc === slider || pc === queen) return true;
        break;
      }
    }
    return false;
  };
  return slides(ROOK_DIRS, piece(by, "r")) || slides(BISHOP_DIRS, piece(by, "b"));
}

/** Is `side` (by default the side to move) in check? */
export function inCheck(p: Position, side: Color = p.turn): boolean {
  return attacked(p.board, kingOf(p.board, side), other(side));
}

// ── Moves ──
const mv = (from: Sq, to: Sq, pc: Piece, captured: Piece | null, flag: Flag = "", promo: Kind | null = null): Move => ({
  from,
  to,
  piece: pc,
  captured,
  promo,
  flag,
});

/** Every move by the side to move that obeys how the pieces move; some may leave their king in check. */
function pseudoMoves(p: Position): Move[] {
  const { board, turn: us } = p;
  const them = other(us);
  const out: Move[] = [];
  const target = (from: Sq, to: Sq, pc: Piece) => {
    const t = board[to];
    if (!t) out.push(mv(from, to, pc, null));
    else if (t.c === them) out.push(mv(from, to, pc, t));
  };
  const slide = (from: Sq, pc: Piece, dirs: number[]) => {
    for (const d of dirs) {
      for (const to of RAYS[d][from]) {
        const t = board[to];
        if (!t) out.push(mv(from, to, pc, null));
        else {
          if (t.c === them) out.push(mv(from, to, pc, t));
          break;
        }
      }
    }
  };
  const fwd = us === "w" ? -8 : 8;
  const startRow = us === "w" ? 6 : 1;
  const lastRow = us === "w" ? 0 : 7;
  const pawnTo = (from: Sq, to: Sq, pc: Piece, captured: Piece | null) => {
    if (to >> 3 === lastRow) for (const k of PROMOS) out.push(mv(from, to, pc, captured, "", k));
    else out.push(mv(from, to, pc, captured));
  };

  for (let s = 0; s < 64; s++) {
    const pc = board[s];
    if (!pc || pc.c !== us) continue;
    switch (pc.k) {
      case "p": {
        const one = s + fwd;
        if (!board[one]) {
          pawnTo(s, one, pc, null);
          const two = one + fwd;
          if (s >> 3 === startRow && !board[two]) out.push(mv(s, two, pc, null, "double"));
        }
        for (const df of [-1, 1]) {
          const f = (s & 7) + df;
          if (f < 0 || f > 7) continue;
          const to = one + df;
          const t = board[to];
          if (t && t.c === them) pawnTo(s, to, pc, t);
          else if (to === p.ep && !t) out.push(mv(s, to, pc, board[to - fwd], "ep"));
        }
        break;
      }
      case "n":
        for (const to of KNIGHT[s]) target(s, to, pc);
        break;
      case "b":
        slide(s, pc, BISHOP_DIRS);
        break;
      case "r":
        slide(s, pc, ROOK_DIRS);
        break;
      case "q":
        slide(s, pc, ALL_DIRS);
        break;
      case "k": {
        for (const to of KING[s]) target(s, to, pc);
        const home = us === "w" ? 60 : 4;
        const [shortBit, longBit] = us === "w" ? [1, 2] : [4, 8];
        if (s !== home || !(p.castling & (shortBit | longBit)) || attacked(board, s, them)) break;
        const rook = piece(us, "r");
        if (p.castling & shortBit && !board[s + 1] && !board[s + 2] && board[s + 3] === rook && !attacked(board, s + 1, them) && !attacked(board, s + 2, them)) {
          out.push(mv(s, s + 2, pc, null, "k"));
        }
        if (p.castling & longBit && !board[s - 1] && !board[s - 2] && !board[s - 3] && board[s - 4] === rook && !attacked(board, s - 1, them) && !attacked(board, s - 2, them)) {
          out.push(mv(s, s - 2, pc, null, "q"));
        }
        break;
      }
    }
  }
  return out;
}

/** The position after `m`. Never changes `p`. `m` must be one of `legalMoves(p)`. */
export function play(p: Position, m: Move): Position {
  const board = p.board.slice();
  const us = p.turn;
  board[m.from] = null;
  board[m.to] = m.promo ? piece(us, m.promo) : m.piece;
  // The pawn taken en passant stands beside the mover, behind the square it moved to.
  if (m.flag === "ep") board[m.to + (us === "w" ? 8 : -8)] = null;
  if (m.flag === "k") {
    board[m.to - 1] = board[m.to + 1];
    board[m.to + 1] = null;
  }
  if (m.flag === "q") {
    board[m.to + 1] = board[m.to - 2];
    board[m.to - 2] = null;
  }
  let castling = p.castling;
  if (m.piece.k === "k") castling &= us === "w" ? ~3 : ~12;
  // A rook leaving its corner, or taken on it, ends that side's right.
  for (const s of [m.from, m.to]) {
    if (s === 63) castling &= ~1;
    if (s === 56) castling &= ~2;
    if (s === 7) castling &= ~4;
    if (s === 0) castling &= ~8;
  }
  return {
    board,
    turn: other(us),
    castling,
    ep: m.flag === "double" ? (m.from + m.to) / 2 : -1,
    half: m.piece.k === "p" || m.captured ? 0 : p.half + 1,
    full: us === "b" ? p.full + 1 : p.full,
  };
}

/** Every legal move for the side to move (a pawn reaching the last rank gives four: Q, R, B, N). */
export function legalMoves(p: Position): Move[] {
  const us = p.turn;
  return pseudoMoves(p).filter((m) => {
    const next = play(p, m);
    return !attacked(next.board, kingOf(next.board, us), other(us));
  });
}

export function status(p: Position): "play" | "check" | "mate" | "stalemate" {
  const check = inCheck(p);
  if (legalMoves(p).length === 0) return check ? "mate" : "stalemate";
  return check ? "check" : "play";
}

// ── Notation ──
/** A notation's piece letters and capture mark: the site passes Russian «Кр Ф Л С К» and «x». */
export type Letters = { readonly k: string; readonly q: string; readonly r: string; readonly b: string; readonly n: string; readonly x: string };

/** «e2e4», «a7a8q». */
export const uci = (m: Move) => `${sqName(m.from)}${sqName(m.to)}${m.promo ?? ""}`;

/** The legal move written as UCI, or null. A promotion must name its piece («a7a8q»). */
export function fromUci(p: Position, s: string): Move | null {
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(s)) return null;
  const from = sqOf(s.slice(0, 2)), to = sqOf(s.slice(2, 4));
  const promo = (s[4] ?? null) as Kind | null;
  return legalMoves(p).find((m) => m.from === from && m.to === to && m.promo === promo) ?? null;
}

/**
 * Short algebraic notation with the given letters: «Кf3», «Фxf7#», «Кbd2», «Л1a3», «exd6», «e8Ф»,
 * «0-0-0». A piece names its file when another of its kind could reach the square, its rank when they
 * share the file, both when neither is enough.
 */
export function san(p: Position, m: Move, L: Letters): string {
  let s: string;
  const kind = m.piece.k;
  if (m.flag === "k") s = "0-0";
  else if (m.flag === "q") s = "0-0-0";
  else if (kind === "p") {
    s = `${m.captured ? FILES[m.from & 7] + L.x : ""}${sqName(m.to)}${m.promo && m.promo !== "p" ? L[m.promo] : ""}`;
  } else {
    const rivals = legalMoves(p).filter((o) => o.piece === m.piece && o.to === m.to && o.from !== m.from);
    let from = "";
    if (rivals.length) {
      if (!rivals.some((o) => (o.from & 7) === (m.from & 7))) from = FILES[m.from & 7];
      else if (!rivals.some((o) => o.from >> 3 === m.from >> 3)) from = String(8 - (m.from >> 3));
      else from = sqName(m.from);
    }
    s = `${L[kind]}${from}${m.captured ? L.x : ""}${sqName(m.to)}`;
  }
  const after = status(play(p, m));
  return s + (after === "mate" ? "#" : after === "check" ? "+" : "");
}

// ── The mate-in-two solver ──
const VALUE: Record<Kind, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };

/** Does the side to move have a legal move? Stops at the first one. */
function anyLegal(p: Position): boolean {
  const us = p.turn;
  return pseudoMoves(p).some((m) => {
    const next = play(p, m);
    return !attacked(next.board, kingOf(next.board, us), other(us));
  });
}

const mates = (p: Position, m: Move) => {
  const next = play(p, m);
  return inCheck(next) && !anyLegal(next);
};
const hasMate = (p: Position) => legalMoves(p).some((m) => mates(p, m));

/** Every move that mates at once. */
export function matesInOne(p: Position): Move[] {
  return legalMoves(p).filter((m) => mates(p, m));
}

/**
 * Does `key` force mate in two: is there a mate at once after every reply? A key that mates at once
 * counts; one that stalemates doesn't.
 */
export function solves(p: Position, key: Move): boolean {
  const next = play(p, key);
  const replies = legalMoves(next);
  if (!replies.length) return inCheck(next);
  return replies.every((r) => hasMate(play(next, r)));
}

/** Every first move that forces mate in two. A sound puzzle has exactly one. */
export function keys(p: Position): Move[] {
  return legalMoves(p).filter((m) => solves(p, m));
}

/**
 * The café's answer to a try: a reply after which there is no mate at once, the biggest capture first,
 * then a check, then in move order. Null when the try leaves no reply (mate, stalemate) or no reply
 * escapes (the try forces mate after all).
 */
export function refutation(p: Position, t: Move): Move | null {
  const next = play(p, t);
  const score = (r: Move) => (r.captured ? VALUE[r.captured.k] * 10 : 0) + (inCheck(play(next, r)) ? 5 : 0);
  const ranked = legalMoves(next)
    .map((r, i) => ({ r, i, s: score(r) }))
    .sort((a, b) => b.s - a.s || a.i - b.i);
  return ranked.find(({ r }) => !hasMate(play(next, r)))?.r ?? null;
}

/**
 * The café's defence after the key: `prefer` (UCI: the puzzle's own line) when it is a legal reply,
 * otherwise the reply that leaves the fewest mates. Null when the key leaves no reply.
 */
export function defense(p: Position, key: Move, prefer?: string): Move | null {
  const next = play(p, key);
  const replies = legalMoves(next);
  const preferred = prefer ? replies.find((r) => uci(r) === prefer) : undefined;
  if (preferred) return preferred;
  let best: Move | null = null, fewest = Infinity;
  for (const r of replies) {
    const n = matesInOne(play(next, r)).length;
    if (n < fewest) {
      fewest = n;
      best = r;
    }
  }
  return best;
}

/** The number of move sequences `depth` plies long: the standard test of a move generator. */
export function perft(p: Position, depth: number): number {
  if (depth === 0) return 1;
  const moves = legalMoves(p);
  if (depth === 1) return moves.length;
  let n = 0;
  for (const m of moves) n += perft(play(p, m), depth - 1);
  return n;
}
