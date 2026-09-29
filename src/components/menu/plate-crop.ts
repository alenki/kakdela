import type { Photo } from "@/content/types";
import { focusCrop } from "@/lib/crop";
import { plates } from "./plates";

export type Aspect = `${number}/${number}`;

/**
 * How much closer than a plain cover the table and the vitrine stand: enough room to move every photo so its
 * plate lands on the frame's middle, never so close that a plate's rim leaves the frame.
 */
export const PLATE_ZOOM = 1.12;

/** Where a dish's photo lies in a frame of `aspect`: its plate (plates.ts) on the frame's middle, as far as it goes. */
export function plateCrop(id: string, photo: Pick<Photo, "src">, aspect: Aspect) {
  const [w, h] = aspect.split("/").map(Number);
  const frame = w / h;
  const source = photo.src.width / photo.src.height;
  const cover = Math.max(1, source / frame);
  return focusCrop(source, plates[id] ?? { x: 0.5, y: 0.5 }, frame, cover * PLATE_ZOOM);
}
