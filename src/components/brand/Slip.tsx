import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import type { Mood } from "@/content/types";
import { cn } from "@/lib/format";
import { tornStrip } from "@/lib/tear";

type Props = Omit<ComponentPropsWithoutRef<"p">, "children" | "style"> & {
  /** Seeds the tear and the tilt. An answer's id, so the rip has the shape of its tab on the notice. */
  seed: string;
  /** The word on the slip, in the display face. It never wraps (brand.css). */
  label: string;
  /** The answer's mood: a sleepy or so-so one droops (clockwise); any other, or none, rises. */
  mood?: Mood;
};

/**
 * A torn-off tab lying on its side: the notice's paper, the scissor cut on the left and the tab's own
 * tear on the right (tornStrip, seeded), a little askew. One element, so it takes one grid cell. The
 * look is brand.css; where it lies and how big it is belong to the caller's class.
 */
export function Slip({ seed, label, mood, className, ...rest }: Props) {
  const strip = tornStrip(seed);
  const tilt = mood === "tired" || mood === "meh" ? strip.tilt : -strip.tilt;
  return (
    <p
      className={cn("slip", className)}
      style={{ "--tear": strip.clip, "--fibres": strip.fibres, "--tilt": `${tilt}deg` } as CSSProperties}
      {...rest}
    >
      <span className="slip__paper display">{label}</span>
    </p>
  );
}
