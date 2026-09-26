import { useId } from "react";
import { WORDMARK } from "./wordmark-data";
import { mulberry32, round1 } from "@/lib/seed";

const CLOVER = WORDMARK.clover[0];
const PAD = 6;
export const CLOVER_VIEWBOX = `${CLOVER.box.x - PAD} ${CLOVER.box.y - PAD} ${CLOVER.box.w + PAD * 2} ${CLOVER.box.h + PAD * 2}`;
export const CLOVER_PATH = WORDMARK.clover.map((s) => s.d).join(" ");
export const CLOVER_BOX = CLOVER.box;

/** The logo's four-leaf clover, solid. */
export function Clover({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox={CLOVER_VIEWBOX}
      className={className}
      fill="currentColor"
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      <path d={CLOVER_PATH} fillRule="evenodd" />
    </svg>
  );
}

/** Seeded crayon hatch lines covering a box at 35°, jitter baked into geometry (no SVG filters). */
export function hatchLines(
  box: { x: number; y: number; w: number; h: number },
  opts: { pitch?: number; angle?: number; seed?: number; jitter?: number } = {},
) {
  const { pitch = 7, angle = 35, seed = 7, jitter = 1.4 } = opts;
  const rnd = mulberry32(seed);
  const a = (angle * Math.PI) / 180;
  const dx = Math.cos(a), dy = -Math.sin(a);
  // Perpendicular offset direction
  const nx = -dy, ny = dx;
  const cx = box.x + box.w / 2, cy = box.y + box.h / 2;
  const half = Math.hypot(box.w, box.h) / 2 + pitch;
  const lines: string[] = [];
  for (let o = -half; o <= half; o += pitch) {
    const j = () => (rnd() - 0.5) * 2 * jitter;
    const px = cx + nx * o, py = cy + ny * o;
    const x1 = px - dx * half + j(), y1 = py - dy * half + j();
    const x2 = px + dx * half + j(), y2 = py + dy * half + j();
    const mx = (x1 + x2) / 2 + nx * j() * 1.5, my = (y1 + y2) / 2 + ny * j() * 1.5;
    lines.push(`M${round1(x1)} ${round1(y1)}Q${round1(mx)} ${round1(my)} ${round1(x2)} ${round1(y2)}`);
  }
  return lines;
}

/**
 * The avatar clover: crayon hatching clipped to the clover, with an optional solid layer on top.
 * Hatch paths carry data-hatch for the intro draw.
 */
export function HatchedClover({
  className,
  seed = 11,
  solid = true,
  pitch = 9,
}: {
  className?: string;
  seed?: number;
  solid?: boolean;
  pitch?: number;
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const lines = hatchLines(CLOVER.box, { pitch, seed, jitter: 1.6 });
  return (
    <svg viewBox={CLOVER_VIEWBOX} className={className} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={`clv-${id}`}>
          <path d={CLOVER_PATH} fillRule="evenodd" />
        </clipPath>
      </defs>
      <g clipPath={`url(#clv-${id})`} fill="none" stroke="currentColor" strokeWidth={pitch * 0.62} strokeLinecap="round">
        {lines.map((d, i) => (
          <path key={i} d={d} data-hatch={i} />
        ))}
      </g>
      {solid && <path d={CLOVER_PATH} fillRule="evenodd" fill="currentColor" data-solid />}
    </svg>
  );
}
