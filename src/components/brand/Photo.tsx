import Image from "next/image";
import type { CSSProperties } from "react";
import type { Photo as PhotoData } from "@/content/types";
import { cn } from "@/lib/format";

/** Width / height, as CSS writes it: "4/5", "1/1", "3/2", "16/10". */
export type Aspect = `${number}/${number}`;

/**
 * Callers describe the frame's width. When the source is wider than the frame, `cover` scales it to the
 * frame's height, so the rendered image is wider than the frame by (source aspect ÷ frame aspect).
 * Scale each length (never the media conditions) by that, or the browser picks a candidate that is
 * too small and the photo goes soft.
 */
export function coverSizes(sizes: string, k: number): string {
  if (k <= 1.01) return sizes;
  const f = Math.round(k * 1000) / 1000;
  const entries: string[] = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < sizes.length; i++) {
    const c = sizes[i];
    if (c === "(") depth++;
    else if (c === ")") depth--;
    else if (c === "," && depth === 0) {
      entries.push(sizes.slice(start, i));
      start = i + 1;
    }
  }
  entries.push(sizes.slice(start));
  return entries
    .map((raw) => {
      const entry = raw.trim();
      let from: number;
      if (entry.endsWith(")")) {
        // A math function length, e.g. calc(29.6vw - 225px): walk back to its opening paren and name.
        let d = 0;
        from = entry.length - 1;
        for (; from >= 0; from--) {
          if (entry[from] === ")") d++;
          else if (entry[from] === "(" && --d === 0) break;
        }
        while (from > 0 && /[a-z-]/i.test(entry[from - 1])) from--;
      } else {
        from = entry.lastIndexOf(" ") + 1;
      }
      return `${entry.slice(0, from)}calc(${entry.slice(from)} * ${f})`;
    })
    .join(", ");
}

type Props = {
  photo: PhotoData;
  /** The frame's rendered width, as for next/image. */
  sizes: string;
  /** Frame shape; the photo covers it. A section may still override aspect-ratio in CSS. */
  aspect?: Aspect;
  className?: string;
  preload?: boolean;
  loading?: "lazy" | "eager";
};

/** Food, drink and people: a plain rectangular photo that fills its container's width. */
export function Photo({ photo, sizes, aspect = "4/5", className, preload, loading }: Props) {
  const [w, h] = aspect.split("/").map(Number);
  const frame = w / h;
  const source = photo.src.width / photo.src.height;
  return (
    <figure
      className={cn("photo", className)}
      style={{ "--photo-aspect": `${w} / ${h}` } as CSSProperties}
      data-placeholder={photo.placeholder ? "" : undefined}
    >
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        sizes={coverSizes(sizes, source / frame)}
        placeholder="blur"
        preload={preload}
        loading={preload ? undefined : loading}
        className="photo__img"
      />
    </figure>
  );
}
