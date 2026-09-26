import { t } from "@/i18n";

// The barista's note on FlatCup's sleeve (cup viewBox 300×460, sleeve band y 286–352).
// Shared by the server section (first paint: «как дела?») and the CupNote island (rewrites).
export const NOTE = {
  cx: 150,
  cy: 319,
  rotate: -3,
  /** One line («как дела?»): Neucha 26, baseline 328. */
  single: { y: 328, size: 26, clipY: 298, clipH: 46 },
  /** Two lines: the question, then «→ drink price». */
  first: { y: 313, size: 24, clipY: 287, clipH: 33 },
  second: { y: 341, size: 21, clipY: 320, clipH: 33 },
  /** Widest a line may run on the sleeve before the island shrinks it. */
  maxWidth: 164,
  arrow: { w: 17, gap: 6 },
  /** FlatCup's own wipe rect (data-note-wipe) at full width. */
  wipeW: 190,
  /** Line clips at rest: wide open, so first paint and no-JS show the note. */
  rest: { x: 44, w: 212 },
} as const;

/** A hand-drawn arrow, local coords (0,0) = start of the stroke on the x-height. */
export const ARROW_D = "M0.8 -0.6Q7.6 1.6 15.6 -0.9M10.4 -5.2L16 -1L10.2 3.4";

/** «классика? → капучино 240» → ["классика?", "капучино 240"]. A note without an arrow is one line. */
export function splitNote(note: string): [string, string] {
  const i = note.indexOf("→");
  return i < 0 ? [note.trim(), ""] : [note.slice(0, i).trim(), note.slice(i + 1).trim()];
}

/** Inline arrow for HTML notes (mono row lines, the mobile badge). Glyph-free by convention. */
export function NoteArrow({ className }: { className?: string }) {
  return (
    <svg viewBox="-1 -7 19 12" className={className} aria-hidden="true" focusable="false">
      <path d={ARROW_D} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The note group passed into FlatCup's `note` slot. Server markup shows the default note fully;
 * the island measures, swaps and re-clips these nodes (it never re-renders them through React).
 */
export function NoteSvg({ idPrefix }: { idPrefix: string }) {
  const l1 = `${idPrefix}-l1`;
  const l2 = `${idPrefix}-l2`;
  return (
    <g transform={`rotate(${NOTE.rotate} ${NOTE.cx} ${NOTE.cy})`} className="cup-note" data-note-root>
      <clipPath id={l1} clipPathUnits="userSpaceOnUse">
        <rect data-note-r1 x={NOTE.rest.x} y={NOTE.single.clipY} width={NOTE.rest.w} height={NOTE.single.clipH} />
      </clipPath>
      <clipPath id={l2} clipPathUnits="userSpaceOnUse">
        <rect data-note-r2 x={NOTE.rest.x} y={NOTE.second.clipY} width={NOTE.rest.w} height={NOTE.second.clipH} />
      </clipPath>
      <text
        data-note-l1
        x={NOTE.cx}
        y={NOTE.single.y}
        fontSize={NOTE.single.size}
        textAnchor="middle"
        clipPath={`url(#${l1})`}
      >
        {t.coffee.defaultNote}
      </text>
      <g clipPath={`url(#${l2})`}>
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
        <text data-note-l2 x={NOTE.cx} y={NOTE.second.y} fontSize={NOTE.second.size} />
      </g>
    </g>
  );
}

/** Tiny scribble for the badge cup's sleeve: at 110px tall, letters would only be a smudge. */
export function NoteScribble() {
  return (
    <g className="cup-note cup-note--scribble" transform={`rotate(${NOTE.rotate} ${NOTE.cx} ${NOTE.cy})`}>
      <path
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
