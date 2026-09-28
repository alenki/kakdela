import type { ReactNode } from "react";
import { CLOVER_BOX, CLOVER_PATH } from "./HatchedClover";

// The cobalt takeaway cup with the white clover, from the brand's Instagram, in flat poster style. For
// the coffee poster only. viewBox 300×460 (CUP in note.ts); the sleeve band (y 286 to 352) carries the
// barista's note, passed in as `note`.
const BODY = "M44 92L256 92L229 430Q227 442 215 442L85 442Q73 442 71 430Z";
const SHADE = "M200 92L256 92L229 430Q227 442 215 442L186 442Z";
const SLEEVE = "M59 286L241 286L236 352L64 352Z";

const cloverScale = 118 / CLOVER_BOX.w;
const cloverTx = 150 - (CLOVER_BOX.x + CLOVER_BOX.w / 2) * cloverScale;
const cloverTy = 186 - (CLOVER_BOX.y + CLOVER_BOX.h / 2) * cloverScale;

/** The cup's contact shadow on the counter, under its base (y 442). */
function Shadow(props: { "data-ground"?: boolean }) {
  return <ellipse cx="150" cy="448" rx="100" ry="9" fill="var(--color-ink)" opacity="0.14" {...props} />;
}

/**
 * The cup. `id` prefixes its clip path (unique on the page, the same on server and client). The poster
 * draws the contact shadow apart (CupGround) so it stays on the counter while the cup moves above it:
 * pass `ground={false}` there.
 */
export function Cup({ id, className, note, ground = true }: { id: string; className?: string; note?: ReactNode; ground?: boolean }) {
  return (
    <svg viewBox="0 0 300 460" className={className} aria-hidden="true" focusable="false" data-cup>
      <defs>
        <clipPath id={`${id}-body`}>
          <path d={BODY} />
        </clipPath>
      </defs>
      {ground && <Shadow />}
      <path d={BODY} fill="var(--kofe-cobalt)" />
      <g clipPath={`url(#${id}-body)`}>
        <path d={SHADE} fill="var(--kofe-cobalt-deep)" />
        <path d="M66 110L82 110L98 420L86 420Z" fill="var(--color-milk)" opacity="0.14" />
      </g>
      {/* The lid, with its sip slot. */}
      <path d="M54 72Q64 38 150 34Q236 38 246 72Z" fill="var(--color-milk)" />
      <path d="M30 70L270 70L263 96L37 96Z" fill="var(--color-milk)" />
      <path d="M30 70L270 70M36 84L264 84" stroke="var(--color-ink)" strokeOpacity="0.55" strokeWidth="1.5" fill="none" />
      <rect x="178" y="48" width="30" height="7" rx="3.5" fill="var(--color-ink)" opacity="0.7" />
      {/* The clover decal. */}
      <path
        d={CLOVER_PATH}
        fillRule="evenodd"
        fill="var(--color-milk)"
        transform={`translate(${cloverTx.toFixed(1)} ${cloverTy.toFixed(1)}) scale(${cloverScale.toFixed(4)})`}
      />
      {/* The sleeve, and the note on it. */}
      <path d={SLEEVE} fill="var(--color-milk)" />
      <path d="M59 286L241 286M64 352L236 352" stroke="var(--color-ink)" strokeOpacity="0.2" strokeWidth="1" />
      {note}
    </svg>
  );
}

/**
 * The cup's contact shadow on a layer of its own, in the cup's units, laid under the cup and outside its
 * moving layers: it stays on the counter, grows as the cup is set down on it, and draws in under the
 * rim the cup rocks on (the island moves `data-ground`; the landing scales `data-ground-lift`).
 */
export function CupGround({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 460" className={className} aria-hidden="true" focusable="false">
      <g data-ground-lift>
        <Shadow data-ground />
      </g>
    </svg>
  );
}

/**
 * Three wisps of steam from the sip slot (x 178 to 208, y 48), in the cup's own units. A separate,
 * unfiltered layer laid over the cup and placed before it, so the lid covers each wisp's start and the
 * steam's frames never repaint the cup's shadow. Invisible until the island loops it (CSS); the island
 * also bends it with the scroll, about the slot.
 */
export function CupSteam({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 300 460" className={className} aria-hidden="true" focusable="false">
      <path data-steam d="M186 44C178 30 196 20 188 6S180-16 190-30" />
      <path data-steam d="M194 42C204 28 186 16 196 2S206-20 196-38" />
      <path data-steam d="M202 44C196 34 210 24 204 12S198-6 207-18" />
    </svg>
  );
}
