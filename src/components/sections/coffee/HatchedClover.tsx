import { WORDMARK } from "@/components/brand/wordmark-data";
import { mulberry32 } from "@/lib/seed";

// The logo's clover, for the coffee poster only (docs/CONVENTIONS.md): the cup's decal, and the big
// crayon-hatched clover printed tone on tone behind the cup.

const CLOVER = WORDMARK.clover[0];
const PAD = 6;
export const CLOVER_VIEWBOX = `${CLOVER.box.x - PAD} ${CLOVER.box.y - PAD} ${CLOVER.box.w + PAD * 2} ${CLOVER.box.h + PAD * 2}`;
export const CLOVER_PATH = WORDMARK.clover.map((s) => s.d).join(" ");
export const CLOVER_BOX = CLOVER.box;

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Seeded crayon hatch lines covering a box at 35°, the jitter baked into the geometry (no SVG filters). */
export function hatchLines(
  box: { x: number; y: number; w: number; h: number },
  opts: { pitch?: number; angle?: number; seed?: number; jitter?: number } = {},
) {
  const { pitch = 7, angle = 35, seed = 7, jitter = 1.4 } = opts;
  const rnd = mulberry32(seed);
  const a = (angle * Math.PI) / 180;
  const dx = Math.cos(a);
  const dy = -Math.sin(a);
  // The offset direction, perpendicular to the strokes.
  const nx = -dy;
  const ny = dx;
  const cx = box.x + box.w / 2;
  const cy = box.y + box.h / 2;
  const half = Math.hypot(box.w, box.h) / 2 + pitch;
  const lines: string[] = [];
  for (let o = -half; o <= half; o += pitch) {
    const j = () => (rnd() - 0.5) * 2 * jitter;
    const px = cx + nx * o;
    const py = cy + ny * o;
    const x1 = px - dx * half + j();
    const y1 = py - dy * half + j();
    const x2 = px + dx * half + j();
    const y2 = py + dy * half + j();
    const mx = (x1 + x2) / 2 + nx * j() * 1.5;
    const my = (y1 + y2) / 2 + ny * j() * 1.5;
    lines.push(`M${r1(x1)} ${r1(y1)}Q${r1(mx)} ${r1(my)} ${r1(x2)} ${r1(y2)}`);
  }
  return lines;
}

/**
 * The clover in crayon hatch: seeded strokes clipped to the leaf, so server and client draw the same
 * lines. Each stroke carries data-hatch for the entrance, which draws them in one by one. `id` names
 * the clip path; it must be unique on the page.
 */
export function HatchedClover({
  id,
  className,
  seed = 11,
  pitch = 9,
}: {
  id: string;
  className?: string;
  seed?: number;
  pitch?: number;
}) {
  const lines = hatchLines(CLOVER.box, { pitch, seed, jitter: 1.6 });
  return (
    <svg viewBox={CLOVER_VIEWBOX} className={className} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={`${id}-clip`}>
          <path d={CLOVER_PATH} clipRule="evenodd" />
        </clipPath>
      </defs>
      <g
        clipPath={`url(#${id}-clip)`}
        fill="none"
        stroke="currentColor"
        strokeWidth={pitch * 0.62}
        strokeLinecap="round"
      >
        {lines.map((d, i) => (
          <path key={i} d={d} data-hatch={i} />
        ))}
      </g>
    </svg>
  );
}
