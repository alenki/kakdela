import { useId, type ReactNode } from "react";
import { round1 } from "@/lib/seed";

// The chess board for «— Партию?». Server-rendered in its final position (after 2… Кe4), so it
// reads complete without JS and in reduced motion; ChessReplay only rewinds and replays it.
// viewBox 800×800, one square = 100 units; files a–h left→right, ranks 8 top → 1 bottom.

/** A left-facing Staunton knight, flat poster style (100×100 box). Eye is cut out (evenodd). */
export const KNIGHT_PATH =
  "M30 79C27.5 71 29.5 63 37 57C34 58.5 27 61.5 21.5 62.5C16 63.5 12 60 11 55C10.2 51 12 48 14 46C20 38 28 28 36 20C40 15 45 11 49 10L55 4.5L60 15C72 20 81 34 82 50C83 62 80 72 78 79Z" +
  "M36.2 30.5a2.9 2.9 0 1 0-5.8 0a2.9 2.9 0 1 0 5.8 0Z" +
  "M25 87L28 79H80L83 87Z" +
  "M17 95V90Q17 87 20 87H80Q83 87 83 90V95Z";
/** The carved line along the mane. */
export const KNIGHT_MANE = "M61 21C70 26 75.5 36 75.5 50C75.5 60 74 68 72.5 74";

type Pt = { x: number; y: number };
type Side = "w" | "b";

const S = 100;
const KNIGHT_SCALE = 0.84;
const TRIM_START = 48; // the tail starts just clear of the ghost left on the origin square (knight ≈ ±38 units)
const TRIM_END = 42; // arrowhead tip stops at the knight's edge
const BOW = 0.42; // every arc bows east by this share of its chord

const sq = (id: string): Pt => ({ x: (id.charCodeAt(0) - 97) * S + S / 2, y: (8 - Number(id[1])) * S + S / 2 });
const lerp = (a: Pt, b: Pt, t: number): Pt => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
const quad = (p0: Pt, c: Pt, p1: Pt, t: number) => lerp(lerp(p0, c, t), lerp(c, p1, t), t);
const f = (p: Pt) => `${round1(p.x)} ${round1(p.y)}`;

/** Parameter at a given arc length from the start (or the end) of a quadratic. */
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
  const i = lens.findIndex((l) => l >= target);
  return Math.max(0, i) / N;
}

/** De Casteljau: the piece of a quadratic between t0 and t1, still a quadratic. */
function segment(p0: Pt, c: Pt, p1: Pt, t0: number, t1: number): [Pt, Pt, Pt] {
  const c1 = lerp(p0, c, t1);
  const e = quad(p0, c, p1, t1);
  const u = t0 / t1;
  return [quad(p0, c1, e, u), lerp(c1, e, u), e];
}

function move(from: string, to: string, side: Side) {
  const p0 = sq(from), p1 = sq(to);
  const dx = p1.x - p0.x, dy = p1.y - p0.y, L = Math.hypot(dx, dy);
  // Unit normal pointing east (+x): all four arcs bow the same way, like two voices in step.
  let n = { x: -dy / L, y: dx / L };
  if (n.x < 0) n = { x: -n.x, y: -n.y };
  const c = { x: (p0.x + p1.x) / 2 + n.x * L * BOW, y: (p0.y + p1.y) / 2 + n.y * L * BOW };
  const t0 = tAtLength(p0, c, p1, TRIM_START, false);
  const t1 = tAtLength(p0, c, p1, TRIM_END, true);
  const [a, ac, e] = segment(p0, c, p1, t0, t1);
  // Chevron head along the end tangent.
  const tl = Math.hypot(e.x - ac.x, e.y - ac.y);
  const tx = (e.x - ac.x) / tl, ty = (e.y - ac.y) / tl;
  const H = 17, W = 12;
  const w1 = { x: e.x - tx * H - ty * W, y: e.y - ty * H + tx * W };
  const w2 = { x: e.x - tx * H + ty * W, y: e.y - ty * H - tx * W };
  return {
    from,
    to,
    side,
    shaft: `M${f(a)}Q${f(ac)} ${f(e)}`,
    head: `M${f(w1)}L${f(e)}L${f(w2)}`,
    /** Full curve (square centre → square centre) the knight travels along, plus the trim window. */
    curve: [p0.x, p0.y, round1(c.x), round1(c.y), p1.x, p1.y, round1(t0 * 1000) / 1000, round1(t1 * 1000) / 1000].join(" "),
  };
}

/** Exactly the notation dialogue: 1. Кf3 Кf6 2. Кe5 Кe4. */
export const MOVES = [move("g1", "f3", "w"), move("g8", "f6", "b"), move("f3", "e5", "w"), move("f6", "e4", "b")];

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = [8, 7, 6, 5, 4, 3, 2, 1];

function Knight({ href, side, ghost }: { href: string; side: Side; ghost?: boolean }) {
  const cls = `ev-knight ev-knight--${side}${ghost ? " ev-knight--ghost" : ""}`;
  return (
    <g transform={`translate(${-46.5 * KNIGHT_SCALE} ${-50 * KNIGHT_SCALE}) scale(${KNIGHT_SCALE})`} className={cls}>
      <use href={`#${href}`} className="ev-knight__body" />
      {!ghost && <path d={KNIGHT_MANE} className="ev-knight__mane" />}
    </g>
  );
}

export function Board({ label, caption }: { label: string; caption: ReactNode }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const kid = `knight-${id}`;
  const ghosts: { at: string; side: Side }[] = [
    { at: "g1", side: "w" },
    { at: "f3", side: "w" },
    { at: "g8", side: "b" },
    { at: "f6", side: "b" },
  ];
  const e5 = sq("e5"), e4 = sq("e4");
  return (
    <figure className="ev-board" data-board>
      <div className="ev-board__ranks mono" aria-hidden="true">
        {RANKS.map((r) => (
          <span key={r}>{r}</span>
        ))}
      </div>
      <div className="ev-board__grid" role="img" aria-label={label}>
        <svg viewBox="0 0 800 800" className="ev-board__svg" aria-hidden="true" focusable="false">
          <defs>
            <path id={kid} d={KNIGHT_PATH} fillRule="evenodd" />
          </defs>
          {ghosts.map((g) => {
            const p = sq(g.at);
            return (
              <g key={g.at} transform={`translate(${p.x} ${p.y})`} data-ghost={g.at}>
                <Knight href={kid} side={g.side} ghost />
              </g>
            );
          })}
          <g className="ev-arrows" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {MOVES.map((m, i) => (
              <g key={i} data-arrow={i} data-side={m.side} data-from={m.from} data-curve={m.curve} className={`ev-arrow ev-arrow--${m.side}`}>
                <path d={m.shaft} data-shaft />
                <path d={m.head} data-head />
              </g>
            ))}
          </g>
          <g transform={`translate(${e4.x} ${e4.y})`} data-knight="b">
            <g data-lift>
              <Knight href={kid} side="b" />
            </g>
          </g>
          <g transform={`translate(${e5.x} ${e5.y})`} data-knight="w">
            <g data-lift>
              <Knight href={kid} side="w" />
            </g>
          </g>
        </svg>
      </div>
      <div className="ev-board__files mono" aria-hidden="true">
        {FILES.map((file) => (
          <span key={file}>{file}</span>
        ))}
      </div>
      <figcaption className="ev-board__caption label">{caption}</figcaption>
    </figure>
  );
}

/** Small ink knight for the event card. */
export function KnightMark({ className }: { className?: string }) {
  return (
    <svg viewBox="8 2 78 96" className={className} aria-hidden="true" focusable="false">
      <path d={KNIGHT_PATH} fillRule="evenodd" fill="currentColor" />
      <path d={KNIGHT_MANE} fill="none" stroke="var(--color-milk)" strokeWidth={2.4} strokeLinecap="round" opacity={0.7} />
    </svg>
  );
}
