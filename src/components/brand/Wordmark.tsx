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
};

/**
 * The «Как дела?» wordmark, traced from the client's logo. Parts carry data-part so motion code can
 * animate them: kak, kofe, zavtraki, oct, clover, dela. Paths use currentColor.
 */
export function Wordmark({ variant = "full", className, title, cloverClassName, letters: withLetters = true }: Props) {
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
            <path key={i} d={s.d} fillRule="evenodd" data-i={i} />
          ))}
        </g>
      )}
      {arcs && (
        <>
          <g data-part="kofe">
            {WORDMARK.kofe.map((s, i) => (
              <path key={i} d={s.d} fillRule="evenodd" data-i={i} />
            ))}
          </g>
          <g data-part="zavtraki">
            {WORDMARK.zavtraki.map((s, i) => (
              <path key={i} d={s.d} fillRule="evenodd" data-i={i} />
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
      />
      <g data-part="clover" className={cloverClassName}>
        {WORDMARK.clover.map((s, i) => (
          <path key={i} d={s.d} fillRule="evenodd" />
        ))}
      </g>
      {letters && (
        <g data-part="dela">
          {WORDMARK.dela.map((s, i) => (
            <path key={i} d={s.d} fillRule="evenodd" data-i={i} />
          ))}
        </g>
      )}
    </svg>
  );
}
