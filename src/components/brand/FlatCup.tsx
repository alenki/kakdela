import { useId, type ReactNode } from "react";
import { CLOVER_BOX, CLOVER_PATH } from "./Clover";

// The cobalt takeaway cup with the white clover, from the brand's Instagram. Flat poster style.
// viewBox 300×460. The sleeve band holds the barista's note (rendered by `note`).
const BODY = "M44 92L256 92L229 430Q227 442 215 442L85 442Q73 442 71 430Z";
const SHADE = "M200 92L256 92L229 430Q227 442 215 442L186 442Z";
const SLEEVE = "M59 286L241 286L236 352L64 352Z";

const cloverScale = 118 / CLOVER_BOX.w;
const cloverTx = 150 - (CLOVER_BOX.x + CLOVER_BOX.w / 2) * cloverScale;
const cloverTy = 186 - (CLOVER_BOX.y + CLOVER_BOX.h / 2) * cloverScale;

export function FlatCup({ className, note, noteClipId }: { className?: string; note?: ReactNode; noteClipId?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const clip = noteClipId ?? `cupnote-${id}`;
  return (
    <svg viewBox="0 0 300 460" className={className} aria-hidden="true" focusable="false" data-cup>
      <defs>
        <clipPath id={`cupbody-${id}`}>
          <path d={BODY} />
        </clipPath>
        <clipPath id={clip} clipPathUnits="userSpaceOnUse">
          <rect data-note-wipe x="56" y="280" width="190" height="80" />
        </clipPath>
      </defs>
      <ellipse cx="150" cy="448" rx="100" ry="9" fill="var(--color-ink)" opacity="0.14" />
      <g data-cup-body>
        <path d={BODY} fill="var(--color-cobalt)" />
        <g clipPath={`url(#cupbody-${id})`}>
          <path d={SHADE} fill="var(--color-cobalt-deep)" />
          <path d="M66 110L82 110L98 420L86 420Z" fill="var(--color-milk)" opacity="0.14" />
        </g>
        {/* lid */}
        <path d="M54 72Q64 38 150 34Q236 38 246 72Z" fill="var(--color-milk)" />
        <path d="M30 70L270 70L263 96L37 96Z" fill="var(--color-milk)" />
        <path d="M30 70L270 70M36 84L264 84" stroke="var(--color-ink)" strokeOpacity="0.55" strokeWidth="1.5" fill="none" />
        <rect x="178" y="48" width="30" height="7" rx="3.5" fill="var(--color-ink)" opacity="0.7" />
        {/* clover decal */}
        <path d={CLOVER_PATH} fillRule="evenodd" fill="var(--color-milk)" transform={`translate(${cloverTx.toFixed(1)} ${cloverTy.toFixed(1)}) scale(${cloverScale.toFixed(4)})`} />
        {/* sleeve */}
        <path d={SLEEVE} fill="var(--color-milk)" />
        <path d="M59 286L241 286M64 352L236 352" stroke="var(--color-ink)" strokeOpacity="0.2" strokeWidth="1" />
        <g clipPath={`url(#${clip})`} data-note>
          {note}
        </g>
      </g>
    </svg>
  );
}
