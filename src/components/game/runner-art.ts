import { CATALOGUE, CUP_BOXES, type Box, type ObstacleKind, type Pose } from "@/lib/runner";
import { hashString, mulberry32 } from "@/lib/seed";

/**
 * The runner's drawings, shared by the server poster (inline SVG) and the canvas (Path2D). Sprite units
 * are world units, SVG y-down, origin at the sprite's top left; the sprite's foot is its bottom edge.
 * Paths use absolute M, L, C, Q and Z only (the tests read their points).
 *
 * Paint order: `bg` fills (in the field colour, so the ground marks never show through), `accent`
 * fills (tomato: the cup's sleeve, the game's one highlight), `ink` fills and `stroke` / `fine` lines
 * in the text colour.
 */
export type Sprite = {
  w: number;
  h: number;
  bg: readonly string[];
  accent: readonly string[];
  ink: readonly string[];
  stroke: readonly string[];
  fine: readonly string[];
};

/** Line widths in world units: the drawings, the fine lines (the tab), the floor. */
export const STROKE = 2.2;
export const FINE = 1.2;
export const GROUND_LINE = 1.6;

const f = (n: number) => String(Math.round(n * 100) / 100);
const poly = (pts: readonly (readonly [number, number])[], close = true) =>
  pts.map(([x, y], i) => `${i ? "L" : "M"}${f(x)} ${f(y)}`).join(" ") + (close ? " Z" : "");
const sprite = (w: number, h: number, parts: Partial<Omit<Sprite, "w" | "h">>): Sprite => ({
  w, h, bg: [], accent: [], ink: [], stroke: [], fine: [], ...parts,
});

/**
 * A seeded torn edge: `points + 1` offsets in ±amp, the rip's jags. Deterministic like `tornEdge`
 * (src/lib/tear.ts), but as numbers, because the canvas needs points rather than a clip-path.
 */
export function tornEnd(id: string, points: number, amp: number): number[] {
  const rnd = mulberry32(hashString(id));
  return Array.from({ length: points + 1 }, () => (rnd() - 0.5) * 2 * amp);
}

/* ───────────── The cup: a takeaway cup with a lid, on two legs ─────────────
   Standing it is 30 × 44: the lid 6, a body tapering from 24 to 20 over 28, the tomato sleeve across
   its middle, legs 10. Every pose is a drawing of its own; nothing is rotated at runtime. */

const LID = "M5 0 L25 0 L26 2 L28 3 L28 6 L2 6 L2 3 L4 2 Z";
const BODY = "M3 6 L27 6 L25 34 L5 34 Z";
const SLEEVE = "M3.64 15 L26.36 15 L25.71 24 L4.29 24 Z";
const upright = (legs: string[]) => sprite(30, 44, { bg: [BODY], accent: [SLEEVE], ink: [LID], stroke: [BODY, ...legs] });

// The duck: tipped forward almost flat, lid first, the legs still going underneath.
const D_BODY = "M2 5.5 L36 3 L36 19 L2 17.5 Z";
const D_SLEEVE = "M16 4.47 L24 3.88 L24 18.47 L16 18.12 Z";
const D_LID = "M36 2 L39 2 L39 4 L41 5 L41 17 L39 18 L39 20 L36 20 Z";
const ducked = (legs: string[]) => sprite(44, 22, { bg: [D_BODY], accent: [D_SLEEVE], ink: [D_LID], stroke: [D_BODY, ...legs] });

// The crash: tipped back about 20°, the lid lifted off, three drops of coffee in the air.
const X_BODY = "M5 19 L27 11 L34 37 L16 43 Z";
const X_SLEEVE = "M8.52 26.68 L29.24 19.32 L31.48 27.64 L11.96 34.36 Z";
const X_LID = "M3.3 14.3 L25.3 6.3 L23.3 0.7 L1.3 8.7 Z";
const drop = (x: number, y: number) =>
  `M${f(x)} ${f(y)} C${f(x + 1.6)} ${f(y + 1.6)} ${f(x + 1.6)} ${f(y + 3.2)} ${f(x)} ${f(y + 3.6)} C${f(x - 1.6)} ${f(y + 3.2)} ${f(x - 1.6)} ${f(y + 1.6)} ${f(x)} ${f(y)} Z`;

export const CUP_ART: Record<Pose, Sprite> = {
  stand: upright(["M11 34 L11 44 L14 44", "M19 34 L19 44 L22 44"]),
  // One leg planted (knee forward, foot flat), the other swung back; the two frames swap them.
  runA: upright(["M11 34 L14 39 L13 44 L16 44", "M19 34 L16 38 L13 41"]),
  runB: upright(["M19 34 L22 39 L21 44 L24 44", "M11 34 L8 38 L5 41"]),
  // Knees tucked forward, as its hitbox is.
  air: upright(["M11 34 L15 37 L14 41", "M19 34 L23 37 L22 41"]),
  duckA: ducked(["M10 17.8 L12 22 L15 22", "M22 18.4 L24 22 L27 22"]),
  duckB: ducked(["M10 17.8 L8 22 L11 22", "M22 18.4 L20 22 L23 22"]),
  crash: sprite(36, 48, {
    bg: [X_BODY],
    accent: [X_SLEEVE],
    ink: [X_LID, drop(31, 1), drop(34.2, 6), drop(28.4, 9)],
    stroke: [X_BODY, "M22.4 41 L20 45 L23 48", "M28.6 39 L31 43 L35 45"],
  }),
};

/* ───────────── The obstacles ───────────── */

// A bar stool from the side: a solid seat, two splayed legs, a footrest.
const STOOL_PATHS = (dx: number) => ({
  seat: poly([[1 + dx, 1], [25 + dx, 1], [25 + dx, 7], [1 + dx, 7]]),
  legs: [`M${6 + dx} 7 L${3 + dx} 40`, `M${20 + dx} 7 L${23 + dx} 40`, `M${4.8 + dx} 26 L${21.2 + dx} 26`],
});
const stool = STOOL_PATHS(0), stool2 = STOOL_PATHS(32);

// Cups stacked on their saucer-less feet, handles to the right, 11 u each.
function stack(n: number): Sprite {
  const bodies: string[] = [], handles: string[] = [];
  for (let i = 0; i < n; i++) {
    const y = i * 11;
    bodies.push(poly([[1, y + 1], [17, y + 1], [15.5, y + 11], [2.5, y + 11]]));
    handles.push(`M16.66 ${f(y + 3.2)} C21.5 ${f(y + 3.2)} 21.5 ${f(y + 8.6)} 15.94 ${f(y + 8.6)}`);
  }
  return sprite(22, n * 11, { bg: bodies, stroke: [...bodies, ...handles] });
}

// A slice of medovik on its side: a low wedge, its layers, crumbs along the top.
const MED_BODY = poly([[1, 7], [63, 2], [63, 18], [1, 18]]);
const crumb = (x: number) => {
  const y = 7 - (5 * (x - 1)) / 62 - 1.2;
  return poly([[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]]);
};

// A paper plane folded from the notice's paper, nose first: the wing above the fold, the keel below.
const PLANE_WING = poly([[1, 9], [35, 1], [30, 9]]);
const PLANE_KEEL = poly([[1, 9], [30, 9], [32, 15]]);

export const OBSTACLE_ART: Record<Exclude<ObstacleKind, "tab">, Sprite> = {
  stool: sprite(26, 40, { bg: [stool.seat], ink: [stool.seat], stroke: [stool.seat, ...stool.legs] }),
  stools: sprite(58, 40, {
    bg: [stool.seat, stool2.seat],
    ink: [stool.seat, stool2.seat],
    stroke: [stool.seat, ...stool.legs, stool2.seat, ...stool2.legs],
  }),
  stack3: stack(3),
  stack4: stack(4),
  plane: sprite(36, 16, {
    bg: [PLANE_WING, PLANE_KEEL],
    stroke: [PLANE_WING, PLANE_KEEL],
    fine: [poly([[5, 8.5], [31, 4.6]], false)],
  }),
  medovik: sprite(64, 18, {
    bg: [MED_BODY],
    ink: [10, 22, 34, 46, 57].map(crumb),
    stroke: [MED_BODY, "M1 10.5 L63 6.2", "M1 13.6 L63 10.4", "M1 15.9 L63 14.2"],
  }),
};

/* ───────────── The tab: a torn-off answer, flying at head height ─────────────
   A strip of the notice's paper, 40 × 14, torn at its trailing end, two hairlines for the word on it.
   Frame B curls the torn end up by 2 u (a change of shape, never a rotation). */

const TAB_JAGS = tornEnd("runner-tab", 7, 1.5);
function tab(curl: number): Sprite {
  const lift = (x: number) => curl * Math.min(1, Math.max(0, (x - 20) / 17));
  const edge = TAB_JAGS.map((j, i) => {
    const x = 37.5 + j, y = 2 + (11 * i) / 7;
    return [x, y - lift(x)] as const;
  });
  // The strip stays flat to x = 20; only the torn end bends.
  const outline = poly([[1, 2], [20, 2], [28, 2 - lift(28)], ...edge, [28, 13 - lift(28)], [20, 13], [1, 13]]);
  return sprite(40, 14, {
    bg: [outline],
    fine: [outline, poly([[6, 6], [22, 6 - lift(22)]], false), poly([[6, 9.5], [15, 9.5]], false)],
  });
}
export const TAB_ART: readonly [Sprite, Sprite] = [tab(0), tab(2)];

/* ───────────── The floor ───────────── */

/** Tile width of the floor's marks, world units. */
export const MARK_TILE = 64;

/**
 * The specks in the floor band under the ground line: 0 to 2 per 64 u tile, dots or short dashes,
 * seeded by the tile, so they are the same on the poster, the canvas and every run. Calls
 * `fn(x, y, len)` in world units (y is below the ground, negative; len 0 is a dot).
 */
export function forEachMark(x0: number, x1: number, fn: (x: number, y: number, len: number) => void) {
  for (let tile = Math.floor(x0 / MARK_TILE); tile <= Math.floor(x1 / MARK_TILE); tile++) {
    const rnd = mulberry32(Math.imul(tile, 2654435761) ^ 0x5eed);
    const n = Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) {
      const x = tile * MARK_TILE + rnd() * MARK_TILE;
      const y = -(4 + rnd() * 10);
      const len = rnd() < 0.5 ? 0 : 3 + rnd() * 5;
      fn(x, y, len);
    }
  }
}

/** The idle frame: the cup standing at the left, the first stool ahead (the run starts exactly so). */
export const POSTER = { cup: { x: 60 }, stool: { x: 440 } } as const;

const obstacleBoxes = (k: ObstacleKind): readonly Box[] => CATALOGUE[k].boxes;
const poseBoxes = (p: Pose): readonly Box[] =>
  p === "crash" ? [] : p === "air" ? CUP_BOXES.air : p.startsWith("duck") ? CUP_BOXES.duck : CUP_BOXES.stand;

/** Every drawing with its paths and hitboxes, for the consistency test. */
export const ARTS: Record<string, { w: number; h: number; paths: string[]; boxes: readonly Box[] }> = Object.fromEntries([
  ...(Object.keys(CUP_ART) as Pose[]).map((p) => [`cup.${p}`, CUP_ART[p], poseBoxes(p)] as const),
  ...(Object.keys(OBSTACLE_ART) as Exclude<ObstacleKind, "tab">[]).map((k) => [k, OBSTACLE_ART[k], obstacleBoxes(k)] as const),
  ...TAB_ART.map((s, i) => [`tab.${i}`, s, obstacleBoxes("tab")] as const),
].map(([name, s, boxes]) => [name, { w: s.w, h: s.h, paths: [...s.bg, ...s.accent, ...s.ink, ...s.stroke, ...s.fine], boxes }]));
