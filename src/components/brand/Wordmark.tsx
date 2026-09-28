import { WORDMARK, WORDMARK_OCTAGON, WORDMARK_VIEWBOX } from "./wordmark-data";

type Variant = "full" | "compact" | "badge" | "plain";

const VIEWBOX: Record<Variant, { x: number; y: number; w: number; h: number }> = {
  full: WORDMARK_VIEWBOX,
  compact: { x: 124, y: 325, w: 1671, h: 342 },
  badge: { x: 668, y: 325, w: 341, h: 341 },
  plain: { x: 124, y: 359, w: 1583, h: 291 },
};

/**
 * The plain lockup, measured off the client's badge-free artwork: no octagon and no arcs, so the clover
 * grows by 8% and rises a little above the caps, and «дела?» closes up behind it.
 */
const PLAIN_CLOVER = "matrix(1.08 0 0 1.08 -117.04 -61.44)";
const PLAIN_DELA = "translate(-90 0)";

type Props = {
  variant?: Variant;
  className?: string;
  /** Accessible name; omit when decorative (aria-hidden). */
  title?: string;
  cloverClassName?: string;
  /** Draw the octagon frame round the clover (default). The plain variant never has one. */
  octagon?: boolean;
  /** Render the letters inline (default). The header sets false and paints them from a cached mask image. */
  letters?: boolean;
};

/**
 * The «Как дела?» wordmark, traced from the client's logo. Parts carry data-part (kak, kofe, zavtraki,
 * oct, clover, dela), so CSS can colour one of them, e.g. the tomato clover. Paths use currentColor.
 */
export function Wordmark({
  variant = "full",
  className,
  title,
  cloverClassName,
  octagon = true,
  letters: withLetters = true,
}: Props) {
  const vb = VIEWBOX[variant];
  const letters = variant !== "badge" && withLetters;
  const arcs = variant === "full";
  const plain = variant === "plain";
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
      {octagon && !plain && (
        <path
          data-part="oct"
          d={WORDMARK_OCTAGON.d}
          fill="none"
          stroke="currentColor"
          strokeWidth={WORDMARK_OCTAGON.stroke}
          strokeLinejoin="miter"
        />
      )}
      <g data-part="clover" className={cloverClassName} transform={plain ? PLAIN_CLOVER : undefined}>
        {WORDMARK.clover.map((s, i) => (
          <path key={i} d={s.d} fillRule="evenodd" />
        ))}
      </g>
      {letters && (
        <g data-part="dela" transform={plain ? PLAIN_DELA : undefined}>
          {WORDMARK.dela.map((s, i) => (
            <path key={i} d={s.d} fillRule="evenodd" />
          ))}
        </g>
      )}
    </svg>
  );
}
