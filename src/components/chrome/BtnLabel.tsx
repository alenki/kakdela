import type { ReactNode } from "react";

/**
 * A `.btn`'s contents: the label, then the pour (globals.css, pour-controller.ts), a copy of the label
 * in the fill's colours inside the liquid that rises on hover. The liquid's clip cuts the copy too, so
 * the words turn over exactly at its surface. The copy is hidden from screen readers; keep `.sr-only`
 * text outside, next to this.
 */
export function BtnLabel({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="btn__label">{children}</span>
      {/* The pour's controller owns this span's inline clip-path: never give it a style here. */}
      <span className="btn__pour" aria-hidden="true" suppressHydrationWarning>
        <span className="btn__label">{children}</span>
      </span>
    </>
  );
}
