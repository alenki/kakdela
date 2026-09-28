import type { Puzzle } from "@/content/puzzles";
import {
  defense,
  fromUci,
  legalMoves,
  matesInOne,
  play,
  refutation,
  solves,
  sqName,
  sqOf,
  status,
  uci,
  type Color,
  type Kind,
  type Move,
  type Position,
  type Sq,
} from "@/lib/chess";
import { gradeOf, sanRu, spokenRu, startOf, type Grade, type Saved } from "@/lib/puzzle";
import { t } from "@/i18n";

// «Задача недели» as a pure state machine: the guest's moves, the café's answers, the transcript, the
// help and the grade. Game.tsx runs the timers and the input; views.tsx draws boardVM and logVM.
//
//   intro  Black's last move is about to slide in (the entrance)
//   play   the guest's move
//   cafe   the guest has moved; the café answers in a moment
//   read   the café refuted a wrong move; the pieces go back in a moment (a press takes them back now)
//   auto   the solution plays itself
//   done   mate: the grade is in

export type Phase = "intro" | "play" | "cafe" | "read" | "auto" | "done";

/** A transcript row: «1. Лd1? Сb7!» «Мата нет.» A `bad` row is a try that was taken back. */
export type Entry = { n: number; white: string; black: string | null; note: string | null; bad: boolean };

/** What stands on the board, and what is marked on it. */
type Snapshot = { pos: Position; ids: (string | null)[]; last: Move | null; arrow: Move | null };

export type GameState = Snapshot & {
  pz: Puzzle;
  week: number;
  /** The position to solve. */
  start: Position;
  /** Black's last move before the puzzle (the entrance slides it in). */
  setup: Move;
  selected: Sq | null;
  /** The square that holds keyboard focus (the grid's one tab stop). */
  focus: Sq;
  hint: Sq | null;
  hintUsed: boolean;
  mistakes: number;
  shown: boolean;
  /** The solve so far, in UCI: the key and the defence, then the mate. */
  line: string[];
  log: Entry[];
  phase: Phase;
  /** Where a wrong move goes back to: the start of the current attempt. */
  anchor: Snapshot;
  /** The guest's move the café is about to answer. */
  pending: { from: Position; move: Move } | null;
  /** The solution's moves still to play (UCI). */
  plan: string[];
  grade: Grade | null;
  /** The grades' words («10 из 10»…), for what the live region says at the end. */
  labels: Partial<Record<Grade, string>>;
  /** Came back solved from storage: nothing to save or announce. */
  restored: boolean;
  /** The live region's next words; `n` changes every time, so the same words are said again. */
  say: { n: number; text: string };
};

export type Action =
  | { type: "setup" }
  | { type: "focus"; sq: Sq }
  | { type: "press"; sq: Sq }
  /** A drag has started on this square: select it (a press would toggle it off). */
  | { type: "grab"; sq: Sq }
  | { type: "drop"; from: Sq; to: Sq }
  | { type: "cancel" }
  | { type: "cafe" }
  | { type: "rewind" }
  | { type: "help" }
  | { type: "step" };

const S = t.chess.say;
const MAX_TRIES = 3;

// ── Pieces keep an id from square to square, so the board can slide them ──
export function assignIds(p: Position): (string | null)[] {
  const count: Record<string, number> = {};
  return p.board.map((pc) => {
    if (!pc) return null;
    const kind = pc.c + pc.k;
    count[kind] = (count[kind] ?? 0) + 1;
    return `${kind}${count[kind]}`;
  });
}

export function trackIds(ids: readonly (string | null)[], m: Move): (string | null)[] {
  const next = ids.slice();
  next[m.to] = ids[m.from];
  next[m.from] = null;
  if (m.flag === "ep") next[m.to + (m.piece.c === "w" ? 8 : -8)] = null;
  if (m.flag === "k") {
    next[m.to - 1] = ids[m.to + 1];
    next[m.to + 1] = null;
  }
  if (m.flag === "q") {
    next[m.to + 1] = ids[m.to - 2];
    next[m.to - 2] = null;
  }
  return next;
}

const kingSquare = (p: Position, c: Color) => p.board.findIndex((pc) => pc?.c === c && pc.k === "k");
const speak = (s: GameState, text: string) => ({ n: s.say.n + 1, text });
const movable = (p: Position, sq: Sq) => p.board[sq]?.c === p.turn && legalMoves(p).some((m) => m.from === sq);
/** The guest's move from one square to another; a pawn on the last rank becomes a queen. */
const pick = (p: Position, from: Sq, to: Sq) =>
  legalMoves(p).find((m) => m.from === from && m.to === to && (!m.promo || m.promo === "q")) ?? null;

/** Only the last few tries stay in the transcript. */
function capTries(log: Entry[]): Entry[] {
  const tries = log.filter((e) => e.bad);
  if (tries.length <= MAX_TRIES) return log;
  const gone = new Set(tries.slice(0, tries.length - MAX_TRIES));
  return log.filter((e) => !gone.has(e));
}
const withLast = (log: Entry[], e: Entry) => [...log.slice(0, -1), e];

// ── The game ──
export function initGame(
  pz: Puzzle,
  week: number,
  { saved = null, entrance = false, labels = {} }: { saved?: Saved | null; entrance?: boolean; labels?: Partial<Record<Grade, string>> },
): GameState {
  const { before, setup, start } = startOf(pz);
  const idsBefore = assignIds(before);
  const anchor: Snapshot = { pos: start, ids: trackIds(idsBefore, setup), last: setup, arrow: setup };
  const base: GameState = {
    ...anchor,
    pz,
    week,
    start,
    setup,
    selected: null,
    focus: kingSquare(start, "w"),
    hint: null,
    hintUsed: false,
    mistakes: 0,
    shown: false,
    line: [],
    log: [],
    phase: "play",
    anchor,
    pending: null,
    plan: [],
    grade: null,
    labels,
    restored: false,
    say: { n: 0, text: "" },
  };
  if (saved) {
    let s = base;
    for (const u of saved.line) s = advance(s, fromUci(s.pos, u)!);
    return { ...s, phase: "done", grade: saved.grade, arrow: null, restored: true };
  }
  if (entrance) return { ...base, pos: before, ids: idsBefore, last: null, arrow: null, phase: "intro" };
  return base;
}

/**
 * One move of the accepted line (the key, the defence or the mate), written into the transcript: the
 * key gets its «!», the defence joins the key's row, the mate opens row 2 with «Мат.».
 */
function advance(s: GameState, m: Move): GameState {
  const next = play(s.pos, m);
  const snap: Snapshot = { pos: next, ids: trackIds(s.ids, m), last: m, arrow: m.piece.c === "b" ? m : null };
  const line = [...s.line, uci(m)];
  if (m.piece.c === "b") {
    const row = s.log.at(-1)!;
    return { ...s, ...snap, line, anchor: snap, log: withLast(s.log, { ...row, black: sanRu(s.pos, m) }) };
  }
  const n = line.length === 1 ? 1 : 2;
  const entry: Entry =
    status(next) === "mate"
      ? { n, white: sanRu(s.pos, m), black: null, note: t.chess.mate, bad: false }
      : { n, white: `${sanRu(s.pos, m)}!`, black: null, note: null, bad: false };
  return { ...s, ...snap, line, log: [...s.log, entry] };
}

/** The accepted line read aloud: «слон с a2 на e6, шах; король с d7 на d8; ферзь с f7 на f8, мат». */
function spokenLine(s: GameState): string {
  let p = s.start;
  return s.line
    .map((u) => {
      const m = fromUci(p, u)!;
      const said = spokenRu(p, m);
      p = play(p, m);
      return said;
    })
    .join("; ");
}

function finish(s: GameState, said: string): GameState {
  const grade = gradeOf({ mistakes: s.mistakes, hint: s.hintUsed, shown: s.shown });
  const label = s.labels[grade] ?? grade;
  return {
    ...s,
    phase: "done",
    grade,
    arrow: null,
    selected: null,
    hint: null,
    pending: null,
    plan: [],
    say: speak(s, `${said} ${t.chess.ask} ${label}.`),
  };
}

function rewind(s: GameState): GameState {
  return { ...s, ...s.anchor, selected: null, phase: "play", pending: null, say: speak(s, S.back) };
}

/** The guest moved: mate ends it, a stalemate is taken back at once, anything else waits for the café. */
function guestMove(s: GameState, m: Move): GameState {
  const next = play(s.pos, m);
  const said = `${S.you}: ${spokenRu(s.pos, m)}.`;
  const moved = { ...s, selected: null, hint: null, focus: m.to };
  const n = s.line.length === 0 ? 1 : 2;
  const after = status(next);
  if (after === "mate") return finish(advance(moved, m), said);
  const snap = { pos: next, ids: trackIds(s.ids, m), last: m, arrow: null };
  if (after === "stalemate") {
    const log = capTries([...s.log, { n, white: `${sanRu(s.pos, m)}?`, black: null, note: t.chess.stalemate, bad: true }]);
    return { ...moved, ...snap, log, mistakes: s.mistakes + 1, phase: "read", say: speak(s, `${said} ${t.chess.stalemate}`) };
  }
  const log = [...s.log, { n, white: sanRu(s.pos, m), black: null, note: null, bad: false }];
  return { ...moved, ...snap, log, phase: "cafe", pending: { from: s.pos, move: m } };
}

/** The café answers: the defence after the key; after anything else, a refutation, then back it goes. */
function cafe(s: GameState): GameState {
  const { from, move } = s.pending!;
  const said = `${S.you}: ${spokenRu(from, move)}.`;
  const white = sanRu(from, move);
  if (s.line.length === 0 && solves(from, move)) {
    const reply = defense(from, move, uci(move) === s.pz.moves[1] ? s.pz.moves[2] : undefined)!;
    const keyed = { ...s, pos: from, ids: s.anchor.ids, log: s.log.slice(0, -1), pending: null };
    const done = advance(advance(keyed, move), reply);
    return { ...done, phase: "play", say: speak(s, `${said} ${S.cafe}: ${spokenRu(s.pos, reply)}. ${S.yourMove}`) };
  }
  const reply = refutation(from, move) ?? legalMoves(s.pos)[0];
  const row: Entry = { n: s.line.length === 0 ? 1 : 2, white: `${white}?`, black: `${sanRu(s.pos, reply)}!`, note: t.chess.noMate, bad: true };
  return {
    ...s,
    pos: play(s.pos, reply),
    ids: trackIds(s.ids, reply),
    last: reply,
    arrow: reply,
    log: capTries(withLast(s.log, row)),
    mistakes: s.mistakes + 1,
    phase: "read",
    pending: null,
    say: speak(s, `${said} ${S.cafe}: ${spokenRu(s.pos, reply)}. ${t.chess.noMate}`),
  };
}

/** The move to mate with now (the puzzle's own after its defence, else any mate that isn't an
 *  underpromotion). */
function mateNow(s: GameState): string {
  const own = s.pz.moves[3];
  if (s.line[1] === s.pz.moves[2] && fromUci(s.pos, own)) return own;
  return uci(matesInOne(s.pos).find((m) => !m.promo || m.promo === "q")!);
}

export type HelpStep = "hint" | "solution" | "again";
export const helpStep = (s: GameState): HelpStep => (s.phase === "done" ? "again" : s.hintUsed ? "solution" : "hint");

function help(s: GameState): GameState {
  const step = helpStep(s);
  if (step === "again") return { ...initGame(s.pz, s.week, { labels: s.labels }), focus: s.focus, say: speak(s, S.yourMove) };
  const ready = s.phase === "intro" ? reduce(s, { type: "setup" }) : s.phase === "read" ? rewind(s) : s;
  if (ready.phase !== "play") return s;
  const plan = ready.line.length === 0 ? [ready.pz.moves[1], ready.pz.moves[2], ready.pz.moves[3]] : [mateNow(ready)];
  if (step === "hint") {
    const from = sqOf(plan[0].slice(0, 2));
    const kind = ready.pos.board[from]!.k;
    return { ...ready, hint: from, hintUsed: true, selected: null, say: speak(s, S.hint(S.names[kind])) };
  }
  return { ...ready, phase: "auto", shown: true, hint: null, selected: null, plan };
}

/** The solution, one move at a time. */
function step(s: GameState): GameState {
  const [u, ...plan] = s.plan;
  const m = fromUci(s.pos, u)!;
  const next = advance({ ...s, plan }, m);
  return status(next.pos) === "mate" ? finish(next, `${S.solution}: ${spokenLine(next)}.`) : next;
}

export function reduce(s: GameState, a: Action): GameState {
  switch (a.type) {
    case "setup":
      return s.phase === "intro" ? { ...s, ...s.anchor, phase: "play" } : s;
    case "focus":
      return { ...s, focus: a.sq };
    case "cancel":
      return { ...s, selected: null };
    case "press": {
      if (s.phase === "intro") return reduce(reduce(s, { type: "setup" }), a);
      if (s.phase === "read") return { ...rewind(s), focus: a.sq };
      if (s.phase !== "play") return { ...s, focus: a.sq };
      const m = s.selected !== null ? pick(s.pos, s.selected, a.sq) : null;
      if (m) return guestMove(s, m);
      const again = s.selected === a.sq;
      return { ...s, focus: a.sq, selected: !again && movable(s.pos, a.sq) ? a.sq : null };
    }
    case "grab":
      return s.phase === "play" && movable(s.pos, a.sq) ? { ...s, selected: a.sq, focus: a.sq } : s;
    case "drop": {
      if (s.phase === "intro") return reduce(reduce(s, { type: "setup" }), a);
      if (s.phase !== "play") return s;
      const m = pick(s.pos, a.from, a.to);
      return m ? guestMove(s, m) : { ...s, selected: null };
    }
    case "cafe":
      return s.phase === "cafe" && s.pending ? cafe(s) : s;
    case "rewind":
      return s.phase === "read" ? rewind(s) : s;
    case "help":
      return help(s);
    case "step":
      return s.phase === "auto" && s.plan.length ? step(s) : s;
  }
}

// ── What the views draw ──
export type MarkKind = "last" | "sel" | "hint" | "dot" | "ring";
export type BoardVM = {
  pieces: { id: string; c: Color; k: Kind; sq: Sq }[];
  marks: { sq: Sq; kind: MarkKind }[];
  arrow: ArrowPaths | null;
  /** Every square's accessible name: «e4, белый ферзь, можно взять». */
  labels: string[];
  focus: Sq;
};

export function boardVM(s: GameState): BoardVM {
  const pieces = s.pos.board
    .map((pc, sq) => (pc ? { id: s.ids[sq] ?? `x${sq}`, c: pc.c, k: pc.k, sq } : null))
    .filter((p): p is BoardVM["pieces"][number] => p !== null)
    .sort((a, b) => a.id.localeCompare(b.id));
  const marks: BoardVM["marks"] = [];
  if (s.last) marks.push({ sq: s.last.from, kind: "last" }, { sq: s.last.to, kind: "last" });
  const targets = s.selected !== null ? legalMoves(s.pos).filter((m) => m.from === s.selected && (!m.promo || m.promo === "q")) : [];
  if (s.selected !== null) marks.push({ sq: s.selected, kind: "sel" });
  for (const m of targets) marks.push({ sq: m.to, kind: m.captured ? "ring" : "dot" });
  if (s.hint !== null) marks.push({ sq: s.hint, kind: "hint" });
  const arrow = s.arrow && s.phase !== "done" ? arrowPaths(s.arrow.from, s.arrow.to, s.arrow.piece.k === "n") : null;
  const labels = s.pos.board.map((pc, sq) => {
    const target = targets.find((m) => m.to === sq);
    return [
      sqName(sq),
      pc && t.chess.pieces[pc.c][pc.k],
      sq === s.selected && t.chess.selected,
      target && (target.captured ? t.chess.capture : t.chess.target),
      sq === s.hint && t.chess.hinted,
    ]
      .filter(Boolean)
      .join(", ");
  });
  return { pieces, marks, arrow, labels, focus: s.focus };
}

/** The transcript, and the move number waiting for the guest («1. ?»), if any. */
export function logVM(s: GameState): { rows: Entry[]; pending: number | null } {
  const waiting = s.phase === "play" || s.phase === "intro";
  return { rows: s.log, pending: waiting ? (s.line.length === 0 ? 1 : 2) : null };
}

// ── The arrow: a quadratic arc from square to square, ported from the version-1 knights board ──
// viewBox 800×800, one square = 100 units. The tail starts just off the origin's centre, the chevron
// stops at the edge of the piece that landed, and every arc bows the same way.
type Pt = { x: number; y: number };
export type ArrowPaths = { shaft: string; head: string; tip: [number, number] };

const TRIM_START = 18;
const TRIM_END = 34;
const round1 = (n: number) => Math.round(n * 10) / 10;
const centre = (s: Sq): Pt => ({ x: (s & 7) * 100 + 50, y: (s >> 3) * 100 + 50 });
const lerp = (a: Pt, b: Pt, k: number): Pt => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
const quad = (p0: Pt, c: Pt, p1: Pt, k: number) => lerp(lerp(p0, c, k), lerp(c, p1, k), k);
const pt = (p: Pt) => `${round1(p.x)} ${round1(p.y)}`;

/** The curve parameter at a given arc length from the start (or the end). */
function tAtLength(p0: Pt, c: Pt, p1: Pt, len: number, fromEnd: boolean) {
  const N = 240;
  const lens = [0];
  let prev = p0;
  for (let i = 1; i <= N; i++) {
    const p = quad(p0, c, p1, i / N);
    lens.push(lens[i - 1] + Math.hypot(p.x - prev.x, p.y - prev.y));
    prev = p;
  }
  const target = fromEnd ? lens[N] - len : len;
  return Math.max(0, lens.findIndex((l) => l >= target)) / N;
}

/** De Casteljau: the piece of a quadratic between t0 and t1, still a quadratic. */
function segment(p0: Pt, c: Pt, p1: Pt, t0: number, t1: number): [Pt, Pt, Pt] {
  const c1 = lerp(p0, c, t1);
  const e = quad(p0, c, p1, t1);
  const u = t0 / t1;
  return [quad(p0, c1, e, u), lerp(c1, e, u), e];
}

export function arrowPaths(from: Sq, to: Sq, knight: boolean): ArrowPaths {
  const p0 = centre(from), p1 = centre(to);
  const dx = p1.x - p0.x, dy = p1.y - p0.y, L = Math.hypot(dx, dy);
  // The unit normal, turned to the east (or the south, for a move along a rank).
  let n = { x: -dy / L, y: dx / L };
  if (n.x < 0 || (n.x === 0 && n.y < 0)) n = { x: -n.x, y: -n.y };
  const bow = L * (knight ? 0.42 : 0.16);
  const c = { x: (p0.x + p1.x) / 2 + n.x * bow, y: (p0.y + p1.y) / 2 + n.y * bow };
  const [a, ac, e] = segment(p0, c, p1, tAtLength(p0, c, p1, TRIM_START, false), tAtLength(p0, c, p1, TRIM_END, true));
  // The chevron, along the end tangent.
  const tl = Math.hypot(e.x - ac.x, e.y - ac.y);
  const tx = (e.x - ac.x) / tl, ty = (e.y - ac.y) / tl;
  const H = 17, W = 12;
  const w1 = { x: e.x - tx * H - ty * W, y: e.y - ty * H + tx * W };
  const w2 = { x: e.x - tx * H + ty * W, y: e.y - ty * H - tx * W };
  return { shaft: `M${pt(a)}Q${pt(ac)} ${pt(e)}`, head: `M${pt(w1)}L${pt(e)}L${pt(w2)}`, tip: [round1(e.x), round1(e.y)] };
}
