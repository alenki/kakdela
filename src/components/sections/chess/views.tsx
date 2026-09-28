import type { CSSProperties, ReactNode, Ref } from "react";
import type { Kind, Sq } from "@/lib/chess";
import { cn } from "@/lib/format";
import { t } from "@/i18n";
import type { BoardVM, Entry } from "./model";

// What «Задача недели» looks like, with no state of its own: the server draws the week's puzzle with
// these (the static view, and all there is without JS), and Game.tsx draws the live one the same way.

// ── The pieces: flat poster silhouettes on one plinth (100×100, the plate at y 87–95) ──
// The knight is the version-1 knight, a little smaller. Each piece is one colour with its seams drawn
// in the other: milk with ink seams for White, ink with milk outlines for Black (chess.css).
const PLATE = "M17 95V90Q17 87 20 87H80Q83 87 83 90V95Z";
const COLLAR = "M26 87L29 80H71L74 87Z";
const circle = (cx: number, cy: number, r: number) => `M${cx + r} ${cy}A${r} ${r} 0 1 1 ${cx - r} ${cy}A${r} ${r} 0 1 1 ${cx + r} ${cy}Z`;
const band = (x0: number, y0: number, x1: number, y1: number, r: number) =>
  `M${x0} ${y0 + r}Q${x0} ${y0} ${x0 + r} ${y0}H${x1 - r}Q${x1} ${y0} ${x1} ${y0 + r}V${y1 - r}Q${x1} ${y1} ${x1 - r} ${y1}H${x0 + r}Q${x0} ${y1} ${x0} ${y1 - r}Z`;

const SHAPES: Record<Kind, string[]> = {
  p: [circle(50, 30, 12), band(36, 42, 64, 49, 2.5), "M41 49C41 62 35.5 72 30 80H70C64.5 72 59 62 59 49Z", COLLAR, PLATE],
  r: ["M28 18H38V24H45V18H55V24H62V18H72V36H28Z", "M31 36H69L66 42H34Z", "M35 42H65L67 80H33Z", COLLAR, PLATE],
  b: [
    circle(50, 12, 5),
    // The mitre, with its slit cut out.
    "M50 17C61 25 66 36 62 46C60 50 56 52 50 52C44 52 40 50 38 46C34 36 39 25 50 17ZM52 26L58.5 32.5L56 35L49.5 28.5Z",
    band(39, 52, 61, 57, 2),
    "M42 57C42 67 36 74 31 80H69C64 74 58 67 58 57Z",
    COLLAR,
    PLATE,
  ],
  q: [
    circle(20, 27, 4.5),
    circle(35, 19, 4.5),
    circle(50, 15, 4.5),
    circle(65, 19, 4.5),
    circle(80, 27, 4.5),
    "M21 31L33 56H67L79 31L64 44L65 24L57 42L50 20L43 42L35 24L36 44Z",
    band(33, 56, 67, 62, 2),
    "M37 62C37 70 33 75 29 80H71C67 75 63 70 63 62Z",
    COLLAR,
    PLATE,
  ],
  k: [
    "M46.5 4H53.5V10H59.5V17H53.5V23H46.5V17H40.5V10H46.5Z",
    "M50 26C58 22 70 23 70 33C70 42 63 48 61 54H39C37 48 30 42 30 33C30 23 42 22 50 26Z",
    band(36, 54, 64, 60, 2),
    "M38 60C38 69 34 75 30 80H70C66 75 62 69 62 60Z",
    COLLAR,
    PLATE,
  ],
  n: [PLATE],
};
/** The version-1 knight (its eye cut out) and its collar, drawn at 90% on the shared plate. */
const KNIGHT =
  "M30 79C27.5 71 29.5 63 37 57C34 58.5 27 61.5 21.5 62.5C16 63.5 12 60 11 55C10.2 51 12 48 14 46C20 38 28 28 36 20C40 15 45 11 49 10L55 4.5L60 15C72 20 81 34 82 50C83 62 80 72 78 79Z" +
  "M36.2 30.5a2.9 2.9 0 1 0-5.8 0a2.9 2.9 0 1 0 5.8 0Z";
const KNIGHT_COLLAR = "M25 87L28 79H80L83 87Z";
const KNIGHT_MANE = "M61 21C70 26 75.5 36 75.5 50C75.5 60 74 68 72.5 74";

// Inline, so the instances <use> clones keep them; the colours come in as custom properties from the
// piece (chess.css).
const BODY: CSSProperties = { fill: "var(--pc-body)", stroke: "var(--pc-line)", strokeWidth: "var(--pc-w)", strokeLinejoin: "round" };
const LINE: CSSProperties = { fill: "none", stroke: "var(--pc-line)", strokeWidth: 2.6, strokeLinecap: "round" };
const shape = (d: string) => <path key={d} d={d} fillRule="evenodd" style={BODY} />;

/** The sprite every board on the page draws from (once, in the section). */
export function PieceDefs() {
  return (
    <svg className="chess__defs" width="0" height="0" aria-hidden="true" focusable="false">
      {(Object.keys(SHAPES) as Kind[]).map((k) => (
        <symbol key={k} id={`kd-pc-${k}`} viewBox="0 0 100 100">
          {k === "n" && (
            <g transform="translate(5 9.5) scale(0.9)">
              {shape(KNIGHT)}
              {shape(KNIGHT_COLLAR)}
              <path d={KNIGHT_MANE} style={LINE} />
            </g>
          )}
          {SHAPES[k].map(shape)}
        </symbol>
      ))}
    </svg>
  );
}

// ── The board ──
const at = (sq: Sq) => ({ "--f": sq & 7, "--r": sq >> 3 }) as CSSProperties;
const FILES = "abcdefgh";

type BoardProps = {
  vm: BoardVM;
  /** The live board's grid of squares (Game.tsx). Without it the board is one image with a text alternative. */
  grid?: ReactNode;
  /** The static board's text alternative: the pieces in words, and Black's last move. */
  alt?: string;
  boardRef?: Ref<HTMLDivElement>;
  phase?: string;
};

/**
 * Bottom to top: the checker (the board's own background), the marks (the last move, the selection, the
 * hint, where a piece can go), the coordinates, the pieces, the café's arrow, and on top the transparent
 * grid of squares that takes the input, so a focus ring draws over the pieces while the tints stay under.
 */
export function BoardView({ vm, grid, alt, boardRef, phase }: BoardProps) {
  return (
    <div
      ref={boardRef}
      className="board"
      data-board
      data-phase={phase}
      role={grid ? undefined : "img"}
      aria-label={grid ? undefined : alt}
    >
      <div className="board__marks" aria-hidden="true">
        {vm.marks.map((m) => (
          <span key={`${m.kind}${m.sq}`} className={`mark mark--${m.kind}`} style={at(m.sq)} />
        ))}
      </div>
      <div className="board__coords" aria-hidden="true">
        {[...FILES].map((f, i) => (
          <span key={f} className="coord coord--file" style={at(56 + i)}>
            {f}
          </span>
        ))}
        {[8, 7, 6, 5, 4, 3, 2, 1].map((r, i) => (
          <span key={r} className="coord coord--rank" style={at(i * 8)}>
            {r}
          </span>
        ))}
      </div>
      <div className="board__pieces" aria-hidden="true">
        {vm.pieces.map((p) => (
          <span key={p.id} className={`piece piece--${p.c}`} data-id={p.id} data-sq={p.sq} style={at(p.sq)}>
            <svg viewBox="0 0 100 100" focusable="false">
              <use href={`#kd-pc-${p.k}`} />
            </svg>
          </span>
        ))}
      </div>
      {vm.arrow && (
        <svg key={vm.arrow.shaft} className="board__arrow" viewBox="0 0 800 800" aria-hidden="true" focusable="false">
          <path d={vm.arrow.shaft} />
          <path d={vm.arrow.head} />
        </svg>
      )}
      {grid}
    </div>
  );
}

// ── The transcript ──
/** «1. Лd1? Сb7!  Мата нет.»: tries dimmed, the pending move as «1. ?», and at the end the payoff. */
export function LogView({ rows, pending, payoff }: { rows: Entry[]; pending: number | null; payoff?: ReactNode }) {
  return (
    <div className="chess__log">
      <ol className="log" role="list">
        {rows.map((r, i) => (
          <li key={i} className={cn("log__row", r.bad && "log__row--try")}>
            <span className="log__n">{r.n}.</span>
            <span className="log__w">{r.white}</span>
            <span className="log__b">{r.black}</span>
            {r.note && <span className="log__note">{r.note}</span>}
          </li>
        ))}
        {pending !== null && (
          <li className="log__row log__row--pending">
            <span className="log__n" aria-hidden="true">
              {pending}.
            </span>
            <span className="log__w" aria-hidden="true">
              ?
            </span>
            <span className="sr-only">{t.chess.pending(pending)}</span>
          </li>
        )}
      </ol>
      {payoff}
    </div>
  );
}

/** The one text button: «Подсказка», then «Показать решение», then «Решить заново». Before the game
 *  loads it only holds its place (chess.css). */
export function ControlsView({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <p className="chess__controls" data-static={onClick ? undefined : ""}>
      <button type="button" className="dlink chess__help" onClick={onClick} tabIndex={onClick ? undefined : -1}>
        {label}
      </button>
    </p>
  );
}
