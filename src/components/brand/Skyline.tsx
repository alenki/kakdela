import { useId } from "react";
import type { City } from "@/content/types";
import { hatchLines } from "./Clover";

// Hand-authored, stylised horizons (viewBox 1440×240).
// Nalchik looks south-west to Elbrus's twin domes; Vladikavkaz to Kazbek's cone and flat-topped Столовая гора.
// The snowcap's lower edge is a crayon zigzag around `snowY`: [x, dy] steps (|dy| ≤ 8), west → east,
// with the deepest tongues under the summits. First and last steps sit in the sky, so the clip to the
// mountain mass closes the cap along the ridge.
type SnowStep = readonly [x: number, dy: number];
export const SKYLINES: Record<City, { ridge: string; foothills: string; snowY: number; snow: readonly SnowStep[]; peak: { x: number; y: number } }> = {
  nalchik: {
    ridge:
      "M0 200L40 188L72 178L96 184L128 164L156 172L188 150L214 158L246 136L270 146L302 126L330 138L362 122L388 130L420 112L446 124L478 108L506 118L540 104L566 114L598 100L626 110C680 98 730 86 770 68C792 58 804 44 826 38C846 33 862 36 874 46C884 54 896 56 906 50C918 40 936 38 950 44C968 52 984 66 1006 80C1040 100 1080 108 1120 112L1146 104L1172 116L1204 108L1230 122L1262 114L1290 130L1322 124L1350 140L1384 134L1412 150L1440 156",
    foothills:
      "M0 214C120 200 220 206 330 196C440 186 520 204 640 198C760 192 860 210 980 202C1100 194 1220 208 1330 200C1390 196 1420 200 1440 198",
    snowY: 102,
    // Elbrus: ten tongues of uneven reach, the longest under the west and east summits, a short one under
    // the saddle. Each leans downhill: steep on its uphill side, long on the other.
    snow: [
      [632, -7], [650, -2], [657, 4], [681, -5], [691, -1], [698, 5], [722, -4], [731, 6], [752, 0], [758, -6],
      [768, 7], [790, -3], [798, 1], [806, -2], [816, 8], [846, -1], [858, 0], [870, -2], [884, 1], [896, 5],
      [906, -4], [924, -1], [938, 8], [952, -3], [966, -1], [984, 6], [990, -2], [1008, -5], [1030, 5],
      [1036, -1], [1056, -3], [1072, 6], [1078, -6], [1106, -7],
    ],
    peak: { x: 834, y: 35 },
  },
  vladikavkaz: {
    ridge:
      "M0 196L48 182L90 170L130 176L170 152L204 160L240 134L270 142L300 118L330 126L360 96L384 70L402 48L416 36L428 42L440 56L462 78L488 96L516 112L548 106L580 122L612 114L644 132L680 124L712 110L740 96L758 90C800 86 900 84 980 86C1040 87 1100 86 1140 90L1162 98L1188 124L1210 138L1246 132L1280 148L1316 142L1352 156L1392 150L1440 162",
    foothills:
      "M0 212C110 204 210 208 320 200C430 192 540 206 660 202C780 198 880 212 1000 206C1120 200 1240 210 1340 204C1400 200 1424 202 1440 201",
    snowY: 80,
    // Kazbek: a narrow cone, so tighter steps; six tongues, the deepest either side of the summit.
    snow: [
      [356, -7], [370, -2], [375, 5], [388, -4], [393, 1], [398, 8], [408, -3], [414, 2], [418, -1], [428, 7],
      [434, -2], [440, -5], [454, 6], [459, -2], [468, 4], [473, -1], [484, -7],
    ],
    peak: { x: 416, y: 34 },
  },
};

const close = (d: string) => `${d}L1440 240L0 240Z`;

/** The snowcap's lower edge as an open line, and the cap itself: that edge closed up through the sky. */
function snowcap({ snow, snowY }: { snow: readonly SnowStep[]; snowY: number }) {
  const edge = snow.map(([x, dy], i) => `${i ? "L" : "M"}${x} ${snowY + dy}`).join("");
  return { edge, cap: `${edge}L${snow[snow.length - 1][0]} 0L${snow[0][0]} 0Z` };
}

export function Skyline({
  city,
  className,
  label,
  pins = [],
}: {
  city: City;
  className?: string;
  label?: string;
  pins?: { x: number; y: number; id: string; name: string }[];
}) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const s = SKYLINES[city];
  const snow = snowcap(s);
  const hatch = hatchLines({ x: 0, y: 20, w: 1440, h: 220 }, { pitch: 9, angle: 58, seed: city === "nalchik" ? 3 : 5, jitter: 1.2 });
  return (
    <svg viewBox="0 0 1440 240" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true" focusable="false" data-skyline={city}>
      <defs>
        <clipPath id={`mass-${id}`}>
          <path d={close(s.ridge)} />
        </clipPath>
      </defs>
      <path d={close(s.ridge)} fill="var(--color-sky-deep)" fillOpacity={0.42} />
      <g clipPath={`url(#mass-${id})`}>
        <g stroke="var(--color-ink)" strokeOpacity={0.16} strokeWidth={1.4} fill="none" strokeLinecap="round">
          {hatch.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
        <path d={snow.cap} fill="var(--color-milk)" />
        <path
          d={snow.edge}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.45}
          strokeWidth={1.1}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </g>
      <path d={close(s.foothills)} fill="var(--bg, var(--color-sky))" />
      <path d={s.foothills} fill="none" stroke="currentColor" strokeWidth={1.5} vectorEffect="non-scaling-stroke" data-draw />
      <path d={s.ridge} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" data-draw />
      {label && (
        <g data-peak>
          <line x1={s.peak.x} y1={s.peak.y - 6} x2={s.peak.x} y2={s.peak.y - 26} stroke="currentColor" strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <text x={s.peak.x + 6} y={s.peak.y - 18} className="skyline-label">
            {label}
          </text>
        </g>
      )}
      {pins.map((p) => (
        // data-x: GSAP rewrites the transform to matrix(), so the draw timing reads the x from here.
        <g key={p.id} data-pin={p.id} data-x={p.x} transform={`translate(${p.x} ${p.y})`}>
          <circle r={5} fill="var(--color-ink)" />
          <circle r={9} fill="none" stroke="var(--color-ink)" strokeOpacity={0.35} strokeWidth={1} vectorEffect="non-scaling-stroke" />
          <title>{p.name}</title>
        </g>
      ))}
    </svg>
  );
}
