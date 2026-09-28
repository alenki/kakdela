import { t } from "@/i18n";
import { ARROW_D, NOTE } from "./note";

/** The hand-drawn arrow for HTML notes (the row lines, the phones' band, the current drink's marker). */
export function NoteArrow({ className }: { className?: string }) {
  return (
    <svg viewBox="-1 -7 19 12" className={className} aria-hidden="true" focusable="false">
      <path d={ARROW_D} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * One line's mask: a milk rect that opens it in full (the server's state, and the rest between writes)
 * and the pen, a wide stroke the island lays over the words and draws in to ink them in.
 */
function LineMask({ id }: { id: string }) {
  const { x, y, w, h } = NOTE.mask;
  return (
    <mask id={id} maskUnits="userSpaceOnUse" x={x} y={y} width={w} height={h}>
      <rect data-note-open x={x} y={y} width={w} height={h} fill="#fff" />
      <path data-note-pen fill="none" stroke="#fff" strokeLinecap="round" strokeLinejoin="round" />
    </mask>
  );
}

/**
 * The note on the big cup's sleeve, passed into Cup's `note` slot. The server markup shows the default
 * note in full; the pen (pen.ts) measures, swaps and re-masks these nodes and never re-renders them
 * through React. `idPrefix` names the two line masks.
 */
export function NoteSvg({ idPrefix }: { idPrefix: string }) {
  const m1 = `${idPrefix}-l1`;
  const m2 = `${idPrefix}-l2`;
  return (
    <g transform={`rotate(${NOTE.rotate} ${NOTE.cx} ${NOTE.cy})`} className="cup-note" data-note-root>
      <LineMask id={m1} />
      <LineMask id={m2} />
      <text data-note-l1 x={NOTE.cx} y={NOTE.single.y} fontSize={NOTE.single.size} textAnchor="middle" mask={`url(#${m1})`}>
        {t.coffee.defaultNote}
      </text>
      <path
        data-note-arrow
        d={ARROW_D}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        visibility="hidden"
      />
      <text data-note-l2 x={NOTE.cx} y={NOTE.second.y} fontSize={NOTE.second.size} mask={`url(#${m2})`} />
    </g>
  );
}

/** A small scribble for the phones' badge cup: at 110px tall, letters would only be a smudge. */
export function NoteScribble() {
  return (
    <g className="cup-note cup-note--scribble" transform={`rotate(${NOTE.rotate} ${NOTE.cx} ${NOTE.cy})`}>
      <path
        data-note-scribble
        d="M78 312c7-10 11 6 17-2s9-7 14 0 9-8 15-2 6 5 12-1 8-6 13 0 7 3 12-2 6-3 10 1M96 336c6-7 10 5 15-1s8-5 13 1 9-6 14-1 7 4 12-1 6-2 9 1"
        fill="none"
        stroke="currentColor"
        strokeWidth={4.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}
