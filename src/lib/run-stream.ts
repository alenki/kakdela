// The runner's run as the page's snow feels it («С наступающим!», docs/CONVENTIONS.md). While a run is in play the
// game's drawer (src/components/game/runner-draw.ts) says, every frame, how fast its floor travels across the
// screen and which section it runs in; the page's snow (src/components/season/snow-controller.ts) streams the
// flakes over that section back at the same speed, by their depth, so the whole section seems to run, not only
// the game's window. Plain shared state: both are loaded with import() and share this one module.

export const runStream = {
  /** The floor's travel across the screen, CSS px per second (leftward), at the last live frame. */
  speed: 0,
  /** performance.now() of that frame; a run that stopped saying so has stopped. */
  at: -Infinity,
  /** The section the game sits in. */
  section: null as HTMLElement | null,
};
