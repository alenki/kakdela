import Image from "next/image";
import type { Photo } from "@/content/types";
import { coverSizes } from "@/components/brand/Photo";
import { cn } from "@/lib/format";

/** The logo's octagon as a hairline, just outside the clip (viewBox 0 0 100 100). */
const HAIRLINE = "50,0.75 85.1,14.9 99.25,50 85.1,85.1 50,99.25 14.9,85.1 0.75,50 14.9,14.9";

/**
 * A drink photo in the logo's octagon with a hairline round it: the coffee card only (everywhere else
 * photos are plain rectangles). Square; it fills its container's width. `sizes` describes that width.
 */
export function OctPhoto({
  photo,
  sizes,
  className,
  loading,
}: {
  photo: Photo;
  sizes: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  return (
    <figure className={cn("oct-photo", className)}>
      <div className="oct-photo__frame">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={coverSizes(sizes, photo.src.width / photo.src.height)}
          placeholder="blur"
          loading={loading}
          className="oct-photo__img"
        />
      </div>
      <svg className="oct-photo__line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <polygon points={HAIRLINE} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
    </figure>
  );
}
