import { WORDMARK, WORDMARK_OCTAGON, WORDMARK_VIEWBOX } from "./wordmark-data";

type Variant = "full" | "compact" | "badge";

const VIEWBOX: Record<Variant, { x: number; y: number; w: number; h: number }> = {
  full: WORDMARK_VIEWBOX,
  compact: { x: 124, y: 325, w: 1671, h: 342 },
  badge: { x: 668, y: 325, w: 341, h: 341 },
};

type Props = {
  variant?: Variant;
  className?: string;
  /** Accessible name; omit when decorative (aria-hidden). */
  title?: string;
  cloverClassName?: string;
  /** Render the letters inline (default). The header sets false and paints them from a cached mask image. */
  letters?: boolean;
  /** For the loader: the clover as its four leaves (data-leaf 0–3, clockwise from the top), and the
   *  octagon with a unit path length, so it can be drawn with one dash. Once per page (fixed ids). */
  leaves?: boolean;
};

/* The clover's leaves meet at the octagon's centre and are parted by slits at these angles
   (degrees clockwise from twelve o'clock, measured on the trace; re-measure if the vector changes).
   Each leaf is the whole clover clipped to the wedge between two slits, so it can grow on its own. */
const LEAF_SLITS = [348, 73, 163, 257];
const LEAF_WEDGES = LEAF_SLITS.map((from, i) => {
  const { cx, cy } = WORDMARK_OCTAGON;
  let to = LEAF_SLITS[(i + 1) % LEAF_SLITS.length];
  if (to < from) to += 360;
  const points = [`${cx},${cy}`];
  for (let s = 0; s <= 4; s++) {
    const a = ((from + ((to - from) * s) / 4) * Math.PI) / 180;
    points.push(`${Math.round((cx + 400 * Math.sin(a)) * 10) / 10},${Math.round((cy - 400 * Math.cos(a)) * 10) / 10}`);
  }
  return points.join(" ");
});

/**
 * The «Как дела?» wordmark, traced from the client's logo. Parts carry data-part (kak, kofe, zavtraki,
 * oct, clover, dela), so CSS can colour one of them, e.g. the tomato clover. Paths use currentColor.
 */
export function Wordmark({ variant = "full", className, title, cloverClassName, letters: withLetters = true, leaves = false }: Props) {
  const vb = VIEWBOX[variant];
  const letters = variant !== "badge" && withLetters;
  const arcs = variant === "full";
  return (
    <svg
      viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
      className={className}
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {letters && (
        <g data-part="kak">
          {WORDMARK.kak.map((s, i) => (
            <path key={i} d={s.d} fillRule="evenodd" />
          ))}
        </g>
      )}
      {arcs && (
        <>
          <g data-part="kofe">
            {WORDMARK.kofe.map((s, i) => (
              <path key={i} d={s.d} fillRule="evenodd" />
            ))}
          </g>
          <g data-part="zavtraki">
            {WORDMARK.zavtraki.map((s, i) => (
              <path key={i} d={s.d} fillRule="evenodd" />
            ))}
          </g>
        </>
      )}
      <path
        data-part="oct"
        d={WORDMARK_OCTAGON.d}
        fill="none"
        stroke="currentColor"
        strokeWidth={WORDMARK_OCTAGON.stroke}
        strokeLinejoin="miter"
        pathLength={leaves ? 1 : undefined}
      />
      {leaves ? (
        <g data-part="clover" className={cloverClassName}>
          <defs>
            <g id="wm-clover">
              {WORDMARK.clover.map((s, i) => (
                <path key={i} d={s.d} fillRule="evenodd" />
              ))}
            </g>
            {LEAF_WEDGES.map((points, i) => (
              <clipPath key={i} id={`wm-leaf-${i}`}>
                <polygon points={points} />
              </clipPath>
            ))}
          </defs>
          {LEAF_WEDGES.map((_, i) => (
            <g key={i} data-leaf={i} clipPath={`url(#wm-leaf-${i})`}>
              <use href="#wm-clover" />
            </g>
          ))}
        </g>
      ) : (
        <g data-part="clover" className={cloverClassName}>
          {WORDMARK.clover.map((s, i) => (
            <path key={i} d={s.d} fillRule="evenodd" />
          ))}
        </g>
      )}
      {letters && (
        <g data-part="dela">
          {WORDMARK.dela.map((s, i) => (
            <path key={i} d={s.d} fillRule="evenodd" />
          ))}
        </g>
      )}
    </svg>
  );
}
