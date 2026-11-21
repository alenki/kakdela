import type { CSSProperties } from "react";
import { FLAKES, type FlakeSpot } from "@/content/season";
import { flakeMask } from "@/lib/flake";

/**
 * A paper snowflake stuck to the page («С наступающим!», docs/CONVENTIONS.md): the notice's own paper (its fibres,
 * its colour) cut by a mask from the flake's seed (src/lib/flake.ts), drawn on the server, so it is there at
 * first paint and without scripts. Its place and size are season.css's (`xm-flake--<spot>`); it only shows in
 * the season. Decorative: hidden from screen readers. FlakePeel lets a guest peel one off.
 */
export function PaperFlake({ spot, className }: { spot: FlakeSpot; className?: string }) {
  return (
    <span
      className={`xm-flake xm-flake--${spot}${className ? ` ${className}` : ""}`}
      data-flake={spot}
      aria-hidden="true"
      style={{ "--flake": flakeMask(FLAKES[spot]) } as CSSProperties}
    >
      <span className="xm-flake__paper" />
    </span>
  );
}
