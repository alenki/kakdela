import Image from "next/image";
import type { CSSProperties } from "react";
import type { Photo } from "@/content/types";
import { coverSizes } from "@/components/brand/Photo";
import { cn } from "@/lib/format";
import { keepWhole, typograf } from "@/lib/typograf";
import { plateCrop, type Aspect } from "./plate-crop";

const pct = (v: number) => `${Math.round(v * 100000) / 1000}%`;

type Props = {
  /** The menu item's id: its plate is measured under that key (plates.ts). */
  id: string;
  photo: Photo;
  aspect: Aspect;
  /** The frame's rendered width, as for next/image; the image is wider by the crop. */
  sizes: string;
  className?: string;
  loading?: "lazy" | "eager";
  /** Decorative (the table, which repeats a row): no alt text. */
  decorative?: boolean;
};

/**
 * A dish on its plate: the brand's Photo (rectangular, 2px radius, no frame), laid by a crop instead of
 * `object-fit`, so wherever it is shown every plate stands on the same spot of its frame. Reading down the menu
 * beside the table, only the food changes.
 */
export function Plate({ id, photo, aspect, sizes, className, loading = "lazy", decorative }: Props) {
  const crop = plateCrop(id, photo, aspect);
  const [w, h] = aspect.split("/").map(Number);
  return (
    <figure
      className={cn("photo mn-plate", className)}
      style={{ "--photo-aspect": `${w} / ${h}` } as CSSProperties}
      data-placeholder={photo.placeholder ? "" : undefined}
    >
      <span className="mn-plate__img" style={{ left: pct(crop.l), top: pct(crop.t), width: pct(crop.w), height: pct(crop.h) }}>
        <Image
          src={photo.src}
          alt={decorative ? "" : photo.alt}
          fill
          sizes={coverSizes(sizes, crop.w)}
          placeholder="blur"
          loading={loading}
          className="photo__img"
        />
      </span>
    </figure>
  );
}

/**
 * A dish without a photo: its name, set in the display face on the notice's paper, in the photo's frame (the
 * about street's stand-in rule). Never a stock photo and never the logo. Always decorative: the name is read
 * from its row.
 */
export function Placard({ name, aspect, className }: { name: string; aspect: Aspect; className?: string }) {
  const [w, h] = aspect.split("/").map(Number);
  return (
    <figure className={cn("mn-placard", className)} style={{ "--photo-aspect": `${w} / ${h}` } as CSSProperties} aria-hidden="true">
      <span className="mn-placard__name display">{keepWhole(typograf(name))}</span>
    </figure>
  );
}
