// The New Year season («С наступающим!», docs/CONVENTIONS.md): which paper snowflake is stuck where. Each is a
// seed for the cutter (src/lib/flake.ts): the same seed is always the same flake. Picked by eye from a sheet
// of forty-eight; flake.test.ts checks each one is a single piece of paper at a finer grid than the cutter's.
// Where they sit is season.css's business.

export const FLAKES = {
  /** The hero's notice: its top corners, a big one and a smaller one. */
  noticeLeft: "kd-33",
  noticeRight: "kd-18",
  /** On the answer's photo, its top corner: half on the dish, half on the wall. */
  photo: "kd-10",
  /** The other pages' paper: the notice turned over, the plan's sheet, the pad, the about page's sign. */
  menu: "kd-35",
  locations: "kd-5",
  feedback: "kd-16",
  about: "kd-42",
} as const;

export type FlakeSpot = keyof typeof FLAKES;
