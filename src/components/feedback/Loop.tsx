import { LOOP_BOX, penLoop } from "@/lib/loop";

const cache = new Map<string, string>();
const loopFor = (seed: string) => {
  let d = cache.get(seed);
  if (!d) cache.set(seed, (d = penLoop(seed)));
  return d;
};

/**
 * The guest's pen loop round one printed option on the note (feedback.css draws it in when its radio is
 * checked, or when a printed note carries it). Stretched over the word's box; the stroke keeps its width.
 */
export function Loop({ seed }: { seed: string }) {
  return (
    <svg
      className="fb-loop"
      viewBox={`0 0 ${LOOP_BOX.w} ${LOOP_BOX.h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path d={loopFor(seed)} pathLength={1} />
    </svg>
  );
}
