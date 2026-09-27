// The loading screen (components/chrome/Loader.tsx) runs before React, from an inline script
// (lib/loader-script.ts). These are the two ways the app and the loader talk to each other:
//   LOADER_HYDRATED  the app → the loader: React has hydrated; the page is ready to be revealed.
//   LOADER_DONE      the loader → the app: the screen is gone. detail.landed: the logo and the answer
//                    landed in the hero, so the hero plays its arrival (the tabs sway from the impact).
// #ldr[data-state] is "on" while loading, "exit" while it tears away, "done" after; absent when the
// loader never ran (no JS, reduced motion, opted out).

export const LOADER_HYDRATED = "kd:hydrated";
export const LOADER_DONE = "kd:loaded";

export type LoaderDone = { landed: boolean };

/** True while the loading screen still covers the page. */
export function loaderPending(): boolean {
  if (typeof document === "undefined") return false;
  const state = document.getElementById("ldr")?.dataset.state;
  return state === "on" || state === "exit";
}

/** Runs `fn` once the loading screen is gone. Only waits while it is still up; returns the unsubscribe. */
export function onLoaderDone(fn: (done: LoaderDone) => void): () => void {
  const onDone = (e: Event) => fn({ landed: Boolean((e as CustomEvent<LoaderDone>).detail?.landed) });
  window.addEventListener(LOADER_DONE, onDone, { once: true });
  return () => window.removeEventListener(LOADER_DONE, onDone);
}

/** Called once the app has hydrated (Providers). */
export function markHydrated() {
  window.dispatchEvent(new Event(LOADER_HYDRATED));
}
