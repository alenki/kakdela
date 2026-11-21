"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useMotionMode } from "@/lib/motion";

type Conn = Navigator & { connection?: { saveData?: boolean } };

/**
 * The snow («С наступающим!», docs/CONVENTIONS.md): a canvas over the page. snow-controller.ts (loaded with
 * import(), only in the season) lets it snow, and lays the snow that has settled over the footer's wordmark.
 * The fall waits for the loader to finish; reduced motion and Save-Data keep only the settled snow. It follows
 * the page: a new page's footer gets its own snow.
 */
export function Snowfall() {
  const ref = useRef<HTMLCanvasElement>(null);
  const mode = useMotionMode();
  const pathname = usePathname();

  useEffect(() => {
    const canvas = ref.current;
    const html = document.documentElement;
    if (!canvas || !html.dataset.season || !html.classList.contains("js")) return;
    let saveData = false;
    try {
      saveData = !!(navigator as Conn).connection?.saveData;
    } catch {
      /* not there */
    }
    let cleanup: (() => void) | undefined;
    let gone = false;
    void import("./snow-controller").then(({ mountSnow }) => {
      if (!gone) cleanup = mountSnow(canvas, { fall: mode === "full" && !saveData });
    });
    return () => {
      gone = true;
      cleanup?.();
    };
  }, [mode, pathname]);

  return <canvas ref={ref} className="xm-snow" aria-hidden="true" />;
}
