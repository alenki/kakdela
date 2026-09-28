import Image from "next/image";
import type { CSSProperties } from "react";
import type { Photo } from "@/content/types";
import type { Crop } from "@/lib/crop";
import { coverSizes } from "@/components/brand/Photo";
import { cn } from "@/lib/format";

const pct = (v: number) => `${Math.round(v * 100000) / 1000}%`;

type Props = {
  photo: Photo;
  /** Where the photo lies in the frame (src/lib/crop.ts). */
  crop: Crop;
  /** The frame's rendered width, as for next/image; the image is `crop.w` times wider. */
  sizes: string;
  /** The frame's shape, "w/h"; the crop must have been cut for it. */
  aspect: `${number}/${number}`;
  className?: string;
  loading?: "lazy" | "eager";
};

/**
 * A photo laid in its frame by a crop instead of `object-fit`: the image keeps its own proportions and is
 * placed and sized in percentages of the frame, so a point of it (a café's sign, a kitchen door) lands in
 * the same place at every size. Otherwise it is the brand's Photo: rectangular, 2px radius, no frame.
 */
export function FramedPhoto({ photo, crop, sizes, aspect, className, loading = "lazy" }: Props) {
  const [w, h] = aspect.split("/").map(Number);
  return (
    <figure
      className={cn("photo framed", className)}
      style={{ "--photo-aspect": `${w} / ${h}` } as CSSProperties}
      data-placeholder={photo.placeholder ? "" : undefined}
    >
      <span className="framed__img" style={{ left: pct(crop.l), top: pct(crop.t), width: pct(crop.w), height: pct(crop.h) }}>
        <Image src={photo.src} alt={photo.alt} fill sizes={coverSizes(sizes, crop.w)} placeholder="blur" loading={loading} className="photo__img" />
      </span>
    </figure>
  );
}
