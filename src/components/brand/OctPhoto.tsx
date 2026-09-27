import Image from "next/image";
import type { Photo } from "@/content/types";
import { cn } from "@/lib/format";
import { Lace } from "./Lace";

const HAIRLINE = "50,0.75 85.1,14.9 99.25,50 85.1,85.1 50,99.25 14.9,85.1 0.75,50 14.9,14.9";

/**
 * Callers describe the square frame's width. A landscape source covers that square at
 * width × aspect, so scale each length (never the media conditions) by the aspect, or the
 * browser picks a candidate a third too small and the photo goes soft.
 */
function coverSizes(sizes: string, aspect: number): string {
  if (aspect <= 1.01) return sizes;
  const k = Math.round(aspect * 1000) / 1000;
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
      return `${entry.slice(0, from)}calc(${entry.slice(from)} * ${k})`;
    })
    .join(", ");
}

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
          sizes={coverSizes(sizes, photo.src.width / photo.src.height)}
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
