import Image from "next/image";
import type { Photo } from "@/content/types";
import { cn } from "@/lib/format";
import { Lace } from "./Lace";

const HAIRLINE = "50,0.75 85.1,14.9 99.25,50 85.1,85.1 50,99.25 14.9,85.1 0.75,50 14.9,14.9";

type Props = {
  photo: Photo;
  sizes: string;
  className?: string;
  /** Lace doily behind the octagon. */
  lace?: boolean;
  preload?: boolean;
  loading?: "lazy" | "eager";
};

/** Food and drink always sit in the logo's octagon. Square, fills its container width. */
export function OctPhoto({ photo, sizes, className, lace, preload, loading }: Props) {
  return (
    <figure className={cn("oct-photo", lace && "oct-photo--lace", className)} data-placeholder={photo.placeholder ? "" : undefined}>
      {lace && <Lace className="oct-photo__lace" />}
      <div className="oct-photo__frame octagon">
        <Image
          src={photo.src}
          alt={photo.alt}
          fill
          sizes={sizes}
          placeholder="blur"
          preload={preload}
          loading={preload ? undefined : loading}
          className="oct-photo__img"
        />
      </div>
      <svg className="oct-photo__line" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <polygon points={HAIRLINE} fill="none" stroke="currentColor" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      </svg>
    </figure>
  );
}
