import { Fragment } from "react";
import { WORLD } from "@/lib/runner";
import { CUP_ART, FINE, forEachMark, GROUND_LINE, OBSTACLE_ART, POSTER, STROKE, type Sprite } from "./runner-art";

const GROUND_Y = WORLD.viewH - WORLD.ground;

function SpriteSvg({ s, x, y = 0 }: { s: Sprite; x: number; y?: number }) {
  return (
    <g transform={`translate(${x} ${GROUND_Y - y - s.h})`}>
      {s.bg.map((d, i) => <path key={`b${i}`} d={d} fill="var(--bg)" />)}
      {s.accent.map((d, i) => <path key={`a${i}`} d={d} fill="var(--accent)" />)}
      {s.ink.map((d, i) => <path key={`i${i}`} d={d} fill="currentColor" />)}
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {s.stroke.map((d, i) => <path key={`s${i}`} d={d} strokeWidth={STROKE} />)}
        {s.fine.map((d, i) => <path key={`f${i}`} d={d} strokeWidth={FINE} />)}
      </g>
    </g>
  );
}

/**
 * The runner before it starts, as inline SVG: the floor, the cup standing at the left and the first
 * stool ahead. It fits the stage exactly as the canvas does (xMinYMax slice over the same 640 × 217
 * world), so when a run begins the first canvas frame lands on it without a jump. Server-rendered and
 * static: nothing here moves.
 */
export function RunnerPoster() {
  const marks: { x: number; y: number; len: number }[] = [];
  forEachMark(0, WORLD.viewW, (x, y, len) => marks.push({ x, y: GROUND_Y - y, len }));
  return (
    <svg
      className="runner__poster"
      viewBox={`0 0 ${WORLD.viewW} ${WORLD.viewH}`}
      preserveAspectRatio="xMinYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <path d={`M0 ${GROUND_Y} L${WORLD.viewW + 1} ${GROUND_Y}`} stroke="currentColor" strokeWidth={GROUND_LINE} strokeLinecap="round" />
      <g fill="none" stroke="currentColor" strokeWidth={FINE} strokeLinecap="round" opacity={0.45}>
        {marks.map((m, i) => (
          <Fragment key={i}>
            {m.len === 0 ? <circle cx={round(m.x)} cy={round(m.y)} r={0.9} /> : <path d={`M${round(m.x)} ${round(m.y)} L${round(m.x + m.len)} ${round(m.y)}`} />}
          </Fragment>
        ))}
      </g>
      <SpriteSvg s={OBSTACLE_ART.stool} x={POSTER.stool.x} />
      <SpriteSvg s={CUP_ART.stand} x={POSTER.cup.x} />
    </svg>
  );
}

const round = (n: number) => Math.round(n * 100) / 100;
