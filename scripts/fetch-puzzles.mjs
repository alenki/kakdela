// Builds src/content/puzzles.ts: a year of weekly mates in two for «Задача недели», taken from the Lichess
// puzzle database (database.lichess.org, CC0) and checked with the same rules the page plays by.
// Usage: npm run assets:puzzles   (downloads one or two ~9 MB frames of the dump, not the whole file)
//
// The dump is pzstd-framed: every zstd frame is preceded by a 12-byte skippable frame (magic
// 0x184D2A5?, length 4, then the size of the frame that follows). Node's streaming zstd decoder stops
// at the skippable frame, so each frame is fetched with an HTTP Range request and decoded on its own.
import zlib from "node:zlib";
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { fromUci, inCheck, keys, legalMoves, matesInOne, parseFen, play, uci } from "../src/lib/chess.ts";

const SOURCE = "https://database.lichess.org/lichess_db_puzzle.csv.zst";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/content/puzzles.ts");
const MAX_FRAMES = 2;
const POOL = 600; // verified candidates are plenty once there are this many
const PER_BAND = 13; // four bands of 13: 52 weeks
// Casual: Lichess rating 1000 to 1400, in four bands of a hundred. The weeks take them in this order,
// round and round, so an easier week is never followed by an easier one twice.
const BANDS = [[1000, 1099], [1200, 1299], [1100, 1199], [1300, 1400]];
const MAX_PIECES = 18; // a clean diagram
const MIN_POPULARITY = 90;
const MIN_PLAYS = 2000;

async function range(from, to) {
  const res = await fetch(SOURCE, { headers: { Range: `bytes=${from}-${to}` } });
  if (res.status !== 206) throw new Error(`HTTP ${res.status} for bytes ${from}-${to}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Why a candidate fails, or null when it is a sound casual puzzle the page can play. */
function verify(fen, [setupU, keyU, replyU, mateU]) {
  let before;
  try {
    before = parseFen(fen);
  } catch {
    return "fen";
  }
  const setup = fromUci(before, setupU);
  if (!setup) return "setup illegal";
  // The entrance replays Black's last move by sliding one piece: no castling, en passant or promotion.
  if (setup.flag === "k" || setup.flag === "q" || setup.flag === "ep" || setup.promo) return "setup special";
  const start = play(before, setup);
  if (start.turn !== "w") return "not white to move";
  if (inCheck(start)) return "white in check";
  if (matesInOne(start).length) return "mate in one";
  const found = keys(start).map(uci);
  if (found.length !== 1 || found[0] !== keyU) return "key not unique";
  const afterKey = play(start, fromUci(start, keyU));
  const reply = fromUci(afterKey, replyU);
  if (!reply) return "reply illegal";
  const afterReply = play(afterKey, reply);
  if (!matesInOne(afterReply).some((m) => uci(m) === mateU)) return "mate";
  // The page promotes to a queen: every defence must leave a mate that isn't an underpromotion.
  for (const r of legalMoves(afterKey)) {
    if (!matesInOne(play(afterKey, r)).some((m) => !m.promo || m.promo === "q")) return "underpromotion only";
  }
  return { pieces: start.board.filter(Boolean).length };
}

const stats = { rows: 0, filtered: 0 };
const rejected = {};
const pool = [];
let header = null;
let offset = 0;
let carry = Buffer.alloc(0);

for (let f = 0; f < MAX_FRAMES && pool.length < POOL; f++) {
  const head = await range(offset, offset + 11);
  if ((head.readUInt32LE(0) & 0xfffffff0) !== 0x184d2a50 || head.readUInt32LE(4) !== 4) {
    throw new Error(`Expected a pzstd skippable frame at byte ${offset}`);
  }
  const size = head.readUInt32LE(8);
  const frame = await range(offset + 12, offset + 12 + size - 1);
  offset += 12 + size;
  // Lines may straddle two frames: keep the unfinished tail as bytes and prepend it to the next frame.
  const data = Buffer.concat([carry, zlib.zstdDecompressSync(frame)]);
  const end = data.lastIndexOf(0x0a);
  carry = Buffer.from(data.subarray(end + 1));
  const lines = data.subarray(0, end).toString("utf8").split("\n");

  for (const line of lines) {
    if (pool.length >= POOL) break;
    const cols = line.split(",");
    if (!header) {
      header = Object.fromEntries(cols.map((name, i) => [name, i]));
      continue;
    }
    stats.rows++;
    const col = (name) => cols[header[name]] ?? "";
    if (!col("Themes").split(" ").includes("mateIn2")) continue;
    const fen = col("FEN");
    if (fen.split(" ")[1] !== "b") continue; // Black moves first, so White solves
    const moves = col("Moves").split(" ");
    if (moves.length !== 4 || moves.some((m) => m.length !== 4)) continue; // no promotions
    const rating = Number(col("Rating"));
    if (!(rating >= BANDS[0][0] && rating <= 1400)) continue;
    if (Number(col("Popularity")) < MIN_POPULARITY || Number(col("NbPlays")) < MIN_PLAYS) continue;
    stats.filtered++;
    const result = verify(fen, moves);
    if (typeof result === "string") {
      rejected[result] = (rejected[result] ?? 0) + 1;
      continue;
    }
    if (result.pieces > MAX_PIECES) {
      rejected["too many pieces"] = (rejected["too many pieces"] ?? 0) + 1;
      continue;
    }
    pool.push({ id: col("PuzzleId"), fen, moves, rating, popularity: Number(col("Popularity")), plays: Number(col("NbPlays")) });
  }
  console.log(`frame ${f}: ${stats.rows} rows read, ${pool.length} verified`);
}

// The best-liked in each band (then the most played, then by id, so a rerun on the same dump agrees).
const bands = BANDS.map(([lo, hi]) =>
  pool
    .filter((p) => p.rating >= lo && p.rating <= hi)
    .sort((a, b) => b.popularity - a.popularity || b.plays - a.plays || a.id.localeCompare(b.id))
    .slice(0, PER_BAND),
);
bands.forEach((b, i) => {
  if (b.length < PER_BAND) throw new Error(`Band ${BANDS[i].join("-")} has only ${b.length} puzzles`);
});
const weeks = [];
for (let i = 0; i < PER_BAND; i++) for (const b of bands) weeks.push(b[i]);

const today = new Date().toISOString().slice(0, 10);
const rows = weeks.map((p) => `  { id: ${JSON.stringify(p.id)}, fen: ${JSON.stringify(p.fen)}, moves: [${p.moves.map((m) => JSON.stringify(m)).join(", ")}], rating: ${p.rating} },`);
const file = `// Generated by scripts/fetch-puzzles.mjs (npm run assets:puzzles) on ${today}. Don't edit by hand: run the
// script again. src/lib/puzzle.test.ts checks every puzzle with the page's own rules.
// Source: the Lichess puzzle database (database.lichess.org), CC0. Mates in two from real games, White to
// move, Lichess rating 1000 to 1400, at most ${MAX_PIECES} pieces, popularity ${MIN_POPULARITY}+ and ${MIN_PLAYS}+ plays.
//   fen    the position before Black's last move, as Lichess gives it
//   moves  Black's last move, the key, Black's defence and the mate, in UCI

export type Puzzle = {
  /** The Lichess puzzle id (lichess.org/training/<id>). */
  id: string;
  fen: string;
  moves: readonly [setup: string, key: string, reply: string, mate: string];
  rating: number;
};

/** The Monday (Moscow time) of the first week. Each Monday brings the next puzzle, round the list. */
export const FIRST_MONDAY = "2026-09-21";

export const puzzles: readonly Puzzle[] = [
${rows.join("\n")}
];
`;
writeFileSync(OUT, file);
console.log({ ...stats, verified: pool.length, rejected, written: weeks.length, out: path.relative(process.cwd(), OUT) });
