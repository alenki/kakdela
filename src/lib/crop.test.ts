import { describe, expect, it } from "vitest";
import { focusCrop, signCrop, type Crop } from "./crop";
import { cafes } from "@/content/cafes";
import type { Photo } from "@/content/types";
import manifest from "@/assets/photos/manifest.json";

// Under vitest an image import is its path, not next/image's data: read the size from the manifest.
const sizeOf = (photo: Photo) => {
  const file = String(photo.src).split("/").pop();
  const m = manifest.find((e) => e.file.endsWith(`/${file}`));
  if (!m) throw new Error(`no manifest entry for ${file}`);
  return { width: m.width, height: m.height };
};

const EPS = 1e-3;
const covers = (c: Crop) => {
  expect(c.l).toBeLessThanOrEqual(EPS);
  expect(c.t).toBeLessThanOrEqual(EPS);
  expect(c.l + c.w).toBeGreaterThanOrEqual(1 - EPS);
  expect(c.t + c.h).toBeGreaterThanOrEqual(1 - EPS);
};

describe("signCrop (the about page's street)", () => {
  const FRAME = 4 / 5;
  const LINE = 0.3;
  const MIN = 0.45;
  const signed = cafes.filter((c) => c.photo.sign);

  it("has a sign for every café photo that isn't a stand-in, bar the mural", () => {
    expect(signed.length).toBe(8);
  });

  it("puts every sign on one line, at least MIN of the frame wide, and always covers the frame", () => {
    for (const c of signed) {
      const sign = c.photo.sign!;
      const { width, height } = sizeOf(c.photo);
      const aspect = width / height;
      const crop = signCrop(aspect, sign, FRAME, LINE, MIN);
      covers(crop);
      // The sign's middle lands on the line exactly.
      expect(crop.t + sign.y * crop.h).toBeCloseTo(LINE, 3);
      expect(sign.w * crop.w).toBeGreaterThanOrEqual(MIN - EPS);
      // The image keeps its proportions: w/h in frame units is the photo's aspect over the frame's.
      expect(crop.w / crop.h).toBeCloseTo(aspect / FRAME, 3);
      // Never zoomed so far that the photo goes soft on a phone: the frame (74vw) at 2× wants 640 source
      // pixels across it. A landscape photo is always zoomed further into a 4:5 frame, from a wider source.
      expect(width / crop.w).toBeGreaterThanOrEqual(640);
    }
  });

  it("keeps the sign in the frame's middle when the photo has room", () => {
    const crop = signCrop(2 / 3, { x: 0.5, y: 0.5, w: 0.5 }, 4 / 5, 0.5, 0.4);
    expect(crop.l + 0.5 * crop.w).toBeCloseTo(0.5, 3);
    expect(crop.t + 0.5 * crop.h).toBeCloseTo(0.5, 3);
  });

  it("zooms in rather than let a sign near the top miss a low line", () => {
    const crop = signCrop(2 / 3, { x: 0.5, y: 0.1, w: 0.5 }, 4 / 5, 0.4, 0.4);
    covers(crop);
    expect(crop.t + 0.1 * crop.h).toBeCloseTo(0.4, 3);
    expect(crop.w).toBeGreaterThan(1);
  });
});

describe("focusCrop", () => {
  it("covers the frame and centres the focus where it can", () => {
    const c = focusCrop(2 / 3, { x: 0.5, y: 0.5 }, 4 / 5, 2);
    covers(c);
    expect(c.w).toBe(2);
    expect(c.l + 0.5 * c.w).toBeCloseTo(0.5, 3);
  });
  it("stops at the photo's edge instead of leaving a gap", () => {
    const c = focusCrop(2 / 3, { x: 0.98, y: 0.02 }, 4 / 5, 2);
    covers(c);
    expect(c.l).toBeCloseTo(1 - c.w, 3);
    expect(c.t).toBe(0);
  });
});
