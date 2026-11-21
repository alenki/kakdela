"use client";

import { useEffect, useRef } from "react";
import { useMotionMode } from "@/lib/motion";

/**
 * The garland's box at the top of the page («С наступающим!», docs/CONVENTIONS.md). Empty until the season's
 * scripts can run; then garland-controller.ts (loaded with import(), only in the season) hangs the garland in
 * it and brings it to life. Lives in the root layout, so it stays lit from page to page.
 */
export function Garland() {
  const ref = useRef<HTMLDivElement>(null);
  const mode = useMotionMode();

  useEffect(() => {
    const root = ref.current;
    const html = document.documentElement;
    if (!root || !html.dataset.season || !html.classList.contains("js")) return;
    let cleanup: (() => void) | undefined;
    let gone = false;
    void import("./garland-controller").then(({ mountGarland }) => {
      if (!gone) cleanup = mountGarland(root, mode !== "full");
    });
    return () => {
      gone = true;
      cleanup?.();
    };
  }, [mode]);

  return <div ref={ref} className="xm-garland" aria-hidden="true" />;
}
