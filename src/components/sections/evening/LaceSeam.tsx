import { useId } from "react";

// The one brand-owned seam on the page: a milk lace trim where cream gives way to oxblood.
// Picots and a pierced ribbon sit over the cream; scallops with eyelets hang over the oxblood.
// One 32×38 tile, repeated by an SVG pattern across a 4000-wide viewBox (wider than any screen at
// the band's scale), cropped from the centre so a scallop always sits mid-screen and the seam runs
// edge to edge at every width. The band's height is set in rem (evening.css), so past 1600px the
// lace grows with the root size like the rest of the page instead of shrinking into a fringe.
const W = 32;
const H = 38;
/** Must exceed the widest viewport ÷ the band's scale (3840px ÷ 1.25 ≈ 3072); 2000 is a tile centre. */
const VB = 4000;
/** y of the section's top edge inside the band. */
export const SEAM_Y = 17;

const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${r * 2} 0a${r} ${r} 0 1 0 ${-r * 2} 0Z`;

const PICOTS = "M0 5A4 4 0 0 1 8 5A4 4 0 0 1 16 5A4 4 0 0 1 24 5A4 4 0 0 1 32 5";
const SCALLOP = `M32 ${SEAM_Y}A16 18 0 0 1 0 ${SEAM_Y}`;

// pierced ribbon (these sit over the cream, so they also get a faint stitched rim)
const RIBBON = [circle(4, 10.5, 1.4), circle(12, 10.5, 1.4), circle(20, 10.5, 1.4), circle(28, 10.5, 1.4)].join("");
const EYELETS = [
  RIBBON,
  // scallop: one eyelet, two pinholes, a ring of picot holes
  circle(16, 24, 3.1),
  circle(8.6, 20.6, 1.2),
  circle(23.4, 20.6, 1.2),
  circle(6.2, 26.4, 0.9),
  circle(10.4, 30.6, 0.9),
  circle(16, 32.2, 0.9),
  circle(21.6, 30.6, 0.9),
  circle(25.8, 26.4, 0.9),
].join("");

const SHAPE = `${PICOTS}L32 ${SEAM_Y}A16 18 0 0 1 0 ${SEAM_Y}Z${EYELETS}`;

export function LaceSeam({ className }: { className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return (
    <svg
      className={className}
      viewBox={`0 0 ${VB} ${H}`}
      preserveAspectRatio="xMidYMin slice"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <pattern id={`seam-${id}`} patternUnits="userSpaceOnUse" width={W} height={H}>
          {/* lace lifted off the oxblood: a hard crescent of shadow under each scallop */}
          <path d={`${SCALLOP}Z`} transform="translate(0 3)" fill="rgb(20 18 16 / 0.28)" />
          <path d={SHAPE} fillRule="evenodd" fill="var(--color-milk)" />
          <path d={`${PICOTS}${RIBBON}`} fill="none" stroke="var(--color-ink)" strokeOpacity={0.2} strokeWidth={0.9} />
        </pattern>
      </defs>
      <rect width={VB} height={H} fill={`url(#seam-${id})`} />
    </svg>
  );
}
