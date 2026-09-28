import type { AnswerId } from "@/content/types";
import { FIRST_MONDAY, puzzles, type Puzzle } from "@/content/puzzles";
import { t } from "@/i18n";
import { fromUci, parseFen, play, san, solves, sqName, status, type Color, type Kind, type Move, type Position } from "./chess";
import { TZ } from "./time";

// «Задача недели» on the site: which puzzle this week is, the grade a solve earns (in the hero's own
// answers), how the moves read aloud, and the saved solve. The rules themselves are in ./chess.

/** A solve is graded with one of the hero's answers: the café asks «Как дела?» and this is the reply. */
export type Grade = Extract<AnswerId, "10-iz-10" | "vsyo-shik" | "normalno" | "tak-sebe">;
export const GRADES: readonly Grade[] = ["10-iz-10", "vsyo-shik", "normalno", "tak-sebe"];

/** A clean solve is «10 из 10», one slip (a try or the hint) «Всё шик», more «Нормально»; the solution
 *  shown is «Так себе». */
export function gradeOf({ mistakes, hint, shown }: { mistakes: number; hint: boolean; shown: boolean }): Grade {
  if (shown) return "tak-sebe";
  const slips = mistakes + (hint ? 1 : 0);
  return slips === 0 ? "10-iz-10" : slips === 1 ? "vsyo-shik" : "normalno";
}

// ── The week ──
const moscowDate = new Intl.DateTimeFormat("en-CA", { timeZone: TZ });
const DAY = 86_400_000;
const dayNumber = (isoDate: string) => Date.parse(`${isoDate}T00:00:00Z`) / DAY;

/** Weeks since FIRST_MONDAY, turning over at Monday midnight in Moscow; negative before it. */
export function weekNumber(d: Date): number {
  return Math.floor((dayNumber(moscowDate.format(d)) - dayNumber(FIRST_MONDAY)) / 7);
}

/** This week's puzzle: the list goes round. */
export function puzzleFor(week: number): Puzzle {
  const n = puzzles.length;
  return puzzles[((week % n) + n) % n];
}

/** The position as Lichess gives it (`before`), Black's last move (`setup`) and the position to solve. */
export function startOf(pz: Puzzle): { before: Position; setup: Move; start: Position } {
  const before = parseFen(pz.fen);
  const setup = fromUci(before, pz.moves[0]);
  if (!setup) throw new Error(`Puzzle ${pz.id}: the setup move ${pz.moves[0]} is illegal`);
  return { before, setup, start: play(before, setup) };
}

// ── Russian ──
export const sanRu = (p: Position, m: Move) => san(p, m, t.chess.letters);

/** How a move reads aloud: «ферзь с d1 на h5», «слон с a2 берёт на e6, шах», «короткая рокировка». */
export function spokenRu(p: Position, m: Move): string {
  const S = t.chess.say;
  let s =
    m.flag === "k" || m.flag === "q"
      ? S.castle[m.flag]
      : `${S.names[m.piece.k]} ${S.from} ${sqName(m.from)} ${m.captured ? S.takes : S.to} ${sqName(m.to)}`;
  if (m.promo && m.promo !== "p" && m.promo !== "k") s += `, ${S.promotes[m.promo]}`;
  const after = status(play(p, m));
  if (after === "mate") s += `, ${S.mate}`;
  else if (after === "check") s += `, ${S.check}`;
  return s;
}

const ORDER: Kind[] = ["k", "q", "r", "b", "n", "p"];

/** The pieces in words, king first, each kind from the a-file up: the board's text alternative. */
export function describeRu(p: Position): string {
  const S = t.chess.say;
  const side = (c: Color) =>
    ORDER.flatMap((k) =>
      p.board
        .map((pc, sq) => (pc && pc.c === c && pc.k === k ? sqName(sq) : null))
        .filter((name): name is string => name !== null)
        .sort()
        .map((name) => `${S.names[k]} ${name}`),
    ).join(", ");
  return `${S.white}: ${side("w")}. ${S.black}: ${side("b")}.`;
}

// ── The saved solve: the page remembers it until Monday ──
export const SAVE_KEY = "kd-puzzle";
export type Saved = { v: 1; week: number; id: string; grade: Grade; line: [key: string, reply: string, mate: string] };

/** A stored solve, only if it is this week's puzzle and its line replays to mate from the key. */
export function parseSaved(raw: string | null, week: number, pz: Puzzle): Saved | null {
  if (!raw) return null;
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!v || typeof v !== "object") return null;
  const s = v as Partial<Saved>;
  if (s.v !== 1 || s.week !== week || s.id !== pz.id || !GRADES.includes(s.grade as Grade)) return null;
  const line = s.line;
  if (!Array.isArray(line) || line.length !== 3 || !line.every((u) => typeof u === "string")) return null;
  let p = startOf(pz).start;
  for (const [i, u] of line.entries()) {
    const m = fromUci(p, u);
    if (!m || (i === 0 && !solves(p, m))) return null;
    p = play(p, m);
  }
  if (status(p) !== "mate") return null;
  return { v: 1, week, id: pz.id, grade: s.grade as Grade, line: [line[0], line[1], line[2]] };
}

export function readSaved(week: number, pz: Puzzle): Saved | null {
  try {
    return parseSaved(localStorage.getItem(SAVE_KEY), week, pz);
  } catch {
    return null; // storage can be unavailable (private mode)
  }
}

export function writeSaved(s: Saved | null) {
  try {
    if (s) localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    else localStorage.removeItem(SAVE_KEY);
  } catch {
    /* storage can be unavailable (private mode) */
  }
}
