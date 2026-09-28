import type { SignBox } from "@/content/types";

/**
 * Where a photo lies in its frame, in fractions of the frame: the image is `w` of the frame's width and `h`
 * of its height, its top-left corner `l` across and `t` down (both ≤ 0). The image keeps its own
 * proportions and always covers the frame. FramedPhoto (src/components/about) sets these as percentages,
 * so the cut holds at every size.
 */
export type Crop = { w: number; h: number; l: number; t: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const round = (v: number) => Math.round(v * 10000) / 10000;
const done = (w: number, h: number, l: number, t: number): Crop => ({ w: round(w), h: round(h), l: round(l), t: round(t) });

/**
 * The street's cut: the photo's sign lands exactly `line` down the frame, so every café's sign sits on one
 * line from frame to frame. The photo zooms only as far as that takes (and far enough to cover the
 * frame), the sign is at least `min` of the frame wide, and it sits as near the frame's middle across as
 * the photo allows (only the line is exact).
 * `aspect` is the photo's width / height, `frame` the frame's width / height.
 */
export function signCrop(aspect: number, sign: SignBox, frame: number, line: number, min: number): Crop {
  // Lengths in frame widths: the frame is 1 wide and `fh` tall.
  const fh = 1 / frame;
  const w = Math.max(
    1,
    aspect * fh,
    // Room over the sign for the line, and under it for the rest of the frame.
    (aspect * fh * line) / sign.y,
    (aspect * fh * (1 - line)) / (1 - sign.y),
    min / sign.w,
  );
  const h = w / aspect / fh;
  return done(w, h, clamp(0.5 - sign.x * w, 1 - w, 0), clamp(line - sign.y * h, 1 - h, 0));
}

/** A plain cut: the photo zoomed `zoom` times (at least enough to cover), `focus` as near the middle as it goes. */
export function focusCrop(aspect: number, focus: { x: number; y: number }, frame: number, zoom = 1): Crop {
  const fh = 1 / frame;
  const w = Math.max(1, aspect * fh, zoom);
  const h = w / aspect / fh;
  return done(w, h, clamp(0.5 - focus.x * w, 1 - w, 0), clamp(0.5 - focus.y * h, 1 - h, 0));
}
