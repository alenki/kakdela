import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { answers } from "@/content/answers";
import { ru } from "@/i18n/ru";
import {
  DOOR,
  LINE_MQ,
  ROOM,
  ROOM_AR,
  SAID_WEIGHT,
  coverCrop,
  doorVars,
  edgeAngle,
  kdInOut,
  lockCrop,
  pose,
  projectX,
  pullCrop,
  wordOpacity,
  type Crop,
  type Geo,
} from "./door";

const CSS = readFileSync(path.resolve(__dirname, "../styles/about.css"), "utf8");

/**
 * A mirror of about.css and the tokens it reads (globals.css): the doorway, the photo at rest and at the
 * end, and the ask, at a viewport of `vw` × `vh`. It is what the stylesheet computes, so the checks below
 * hold for the page itself (and a change to either must come with a change to the other).
 */
function layout(vw: number, vh: number) {
  const rem = Math.min(20, Math.max(16, 9.333 + 0.004167 * vw));
  const header = vw >= 2400 ? 80 : vw >= 1920 ? 72 : vw >= 1024 ? 64 : 56;
  const gutter = vw < 640 ? 16 : Math.min(104, Math.max(24, 0.034 * vw));
  const gap = vw < 640 ? 16 : Math.min(48, Math.max(20, 0.016 * vw));
  const canvas = vw - 2 * gutter;
  const line = vw >= 640 && vw / vh >= 4 / 3;
  const maxW = ROOM.width * ROOM.maxScale;
  const k = line ? "line" : "stack";
  const ajar = DOOR.ajar[k];
  const eyeX = DOOR.eyeX[k] * canvas;
  const persp = DOOR.perspective[k] * canvas;

  if (line) {
    const stage = Math.max(vh - header, 32 * rem);
    const F = Math.min(canvas / DOOR.lineEm, 14 * rem, stage / DOOR.heightFit);
    const W = DOOR.doorEm * F;
    const fh = DOOR.floor * stage;
    const eye = DOOR.eyeLine * stage;
    const askB = eye - DOOR.askGapEm * F;
    const H = Math.max(ROOM_AR * W, (fh - askB) / (1 - ROOM.sign.baseline), askB / ROOM.sign.baseline);
    const wz = Math.min((DOOR.zoom.line * H) / ROOM_AR, maxW);
    const anchor = { x: DOOR.anchorX.line * W, y: eye + 0.44 * F };
    const rest: Crop = { w: wz, h: wz * ROOM_AR, l: anchor.x - ROOM.lettering.x * wz, t: anchor.y - ROOM.lettering.y * wz * ROOM_AR };
    const askFont = (ROOM.sign.cap * H) / DOOR.capEm;
    // Drives only with the whole doorway on screen, on a screen at least 560 tall (OpeningDoor).
    const drives = vh >= 560 && header + fh <= vh - 8;
    return { line, vw, vh, F, W, fh, ajar, eyeX, persp, rest, anchor, end: lockCrop(W, fh, askB), askB, askFont, wall: DOOR.wallEm * F, gap, drives };
  }
  const F = Math.min(canvas / DOOR.stackEm, 11 * rem);
  const W = DOOR.doorEm * F;
  const fh = Math.max(DOOR.stackDoor.minRem * rem, Math.min(DOOR.stackDoor.em * F, vh - header - DOOR.stackDoor.leaveRem * rem));
  const H = Math.max(ROOM_AR * W, fh);
  const wz = Math.min((DOOR.zoom.stack * H) / ROOM_AR, maxW);
  const anchor = { x: DOOR.anchorX.stack * W, y: fh / 2 };
  const rest: Crop = { w: wz, h: wz * ROOM_AR, l: anchor.x - ROOM.lettering.x * wz, t: anchor.y - ROOM.lettering.y * wz * ROOM_AR };
  return { line, vw, vh, F, W, fh, ajar, eyeX, persp, rest, anchor, end: coverCrop(W, fh), askB: 0, askFont: 0, wall: 0, gap, drives: true };
}

const SIZES: [number, number][] = [
  [360, 780], [390, 667], [390, 844], [430, 932], [768, 1024], [820, 1180], [1024, 1366], [1280, 1024],
  [667, 375], [844, 390], [932, 430], [900, 600], [1024, 768], [1280, 720], [1280, 800], [1280, 960],
  [1366, 768], [1440, 900], [1536, 864], [1920, 1080], [2560, 1440], [3440, 1440],
];

const geoOf = (L: ReturnType<typeof layout>): Geo => {
  const u0 = DOOR.jambEm * L.F;
  return { ajar: L.ajar, edge: edgeAngle(L.eyeX, L.persp), eyeX: L.eyeX, persp: L.persp, u0, u1: u0 + DOOR.wordEm * L.F };
};

describe("the door's arithmetic", () => {
  it("kd.inOut runs from 0 to 1 and is symmetric", () => {
    expect(kdInOut(0)).toBeCloseTo(0, 6);
    expect(kdInOut(1)).toBeCloseTo(1, 6);
    expect(kdInOut(0.5)).toBeCloseTo(0.5, 4);
    expect(kdInOut(-1)).toBe(kdInOut(0));
    expect(kdInOut(2)).toBe(kdInOut(1));
  });

  it("measures its widths from the answer's own two parts", () => {
    const a = ru.about.a;
    const cut = a.lastIndexOf(" ");
    expect([a.slice(0, cut), a.slice(cut + 1)]).toEqual(["Спасибо, что", "спросили."]);
    expect(DOOR.doorEm).toBeCloseTo(DOOR.wordEm + 2 * DOOR.jambEm, 6);
    expect(DOOR.lineEm).toBeGreaterThanOrEqual(DOOR.wallEm + DOOR.doorEm);
  });

  it("a word fades before it can smear", () => {
    expect(wordOpacity(DOOR.wordFade[0])).toBe(1);
    expect(wordOpacity(DOOR.wordFade[1])).toBe(0);
    expect(wordOpacity(0.1)).toBe(0);
  });
});

describe.each(SIZES)("the door at %i×%i", (vw, vh) => {
  const L = layout(vw, vh);
  const g = geoOf(L);

  it("never shows the photo past 1.3 times its pixels, and the drive only scales it down", () => {
    expect(L.rest.w).toBeLessThanOrEqual(ROOM.width * ROOM.maxScale + 0.01);
    expect(L.end.w).toBeLessThanOrEqual(L.rest.w + 0.01);
  });

  it("keeps the doorway covered all the way from the kitchen door to the room", () => {
    for (let i = 0; i <= 200; i++) {
      const c = pullCrop(L.rest, L.end, L.anchor, kdInOut(i / 200));
      expect(c.l).toBeLessThanOrEqual(0.5);
      expect(c.t).toBeLessThanOrEqual(0.5);
      expect(c.l + c.w).toBeGreaterThanOrEqual(L.W - 0.5);
      expect(c.t + c.h).toBeGreaterThanOrEqual(L.fh - 0.5);
    }
  });

  it("lands exactly on the end crop", () => {
    const c = pullCrop(L.rest, L.end, L.anchor, pose(1, g).e);
    expect(c.l).toBeCloseTo(L.end.l, 6);
    expect(c.t).toBeCloseTo(L.end.t, 6);
    expect(c.w).toBeCloseTo(L.end.w, 6);
    const c0 = pullCrop(L.rest, L.end, L.anchor, pose(0, g).e);
    expect(c0.l).toBeCloseTo(L.rest.l, 6);
    expect(c0.t).toBeCloseTo(L.rest.t, 6);
  });

  it("shows «Как дела на кухне?» whole in the crack at rest", () => {
    const free = projectX(L.W, L.ajar, L.eyeX, L.persp);
    const x0 = L.rest.l + ROOM.lettering.x0 * L.rest.w;
    const x1 = L.rest.l + ROOM.lettering.x1 * L.rest.w;
    expect(x0 - free).toBeGreaterThanOrEqual(8);
    expect(L.W - x1).toBeGreaterThanOrEqual(8);
    expect(L.rest.t + ROOM.lettering.y0 * L.rest.h).toBeGreaterThan(0);
    expect(L.rest.t + ROOM.lettering.y1 * L.rest.h).toBeLessThan(L.fh);
  });

  it("keeps the word legible ajar, and hides it behind the jamb once the swing is done", () => {
    const rest = pose(0, g);
    expect(rest.word).toBe(1);
    expect(g.eyeX).toBeLessThanOrEqual(0);
    expect(pose(DOOR.swingTo, g).gone).toBe(true);
    expect(pose(DOOR.swingTo, g).word).toBe(0);
    let prev = -Infinity;
    for (let i = 0; i <= 100; i++) {
      const s = pose(i / 100, g);
      expect(s.angle).toBeGreaterThanOrEqual(prev);
      prev = s.angle;
      const ratio = (projectX(g.u1, s.angle, g.eyeX, g.persp) - projectX(g.u0, s.angle, g.eyeX, g.persp)) / (g.u1 - g.u0);
      if (ratio < DOOR.wordFade[1]) expect(s.word).toBe(0);
    }
  });

  if (L.line) {
    it("fits the longest ask on the wall", () => {
      expect(10.97 * L.askFont).toBeLessThanOrEqual(L.wall - L.gap);
    });
  }

  if (L.line && L.drives) {
    it("stands the bar's sign on the ask's baseline at its cap height, wholly in the doorway", () => {
      expect(L.end.t + ROOM.sign.baseline * L.end.h).toBeCloseTo(L.askB, 6);
      expect(ROOM.sign.cap * L.end.h).toBeCloseTo(DOOR.capEm * L.askFont, 6);
      expect(L.end.l + ROOM.sign.x0 * L.end.w).toBeGreaterThanOrEqual(0);
      expect(L.end.l + ROOM.sign.x1 * L.end.w).toBeLessThanOrEqual(L.W);
      expect(L.end.t + (ROOM.sign.baseline - ROOM.sign.cap) * L.end.h).toBeGreaterThanOrEqual(0);
    });
  }
});

describe("about.css and door.ts agree", () => {
  it("repeats LINE_MQ verbatim", () => {
    expect(CSS).toContain(`@media ${LINE_MQ}`);
  });

  it("defines every --open-* and --room-* it reads", () => {
    const used = new Set([...CSS.matchAll(/var\((--(?:open|room)-[a-z-]+)/g)].map((m) => m[1]));
    // Set on <html> by DOOR_SCRIPT, not by the section.
    used.delete("--open-gx");
    used.delete("--open-gy");
    expect(used.size).toBeGreaterThan(10);
    for (const v of used) expect(doorVars, v).toHaveProperty([v]);
  });

  it("sets today's torn answer at the weight of its mood, never the café's 860", () => {
    for (const a of answers) {
      const rule = CSS.match(new RegExp(`html\\[data-answer="${a.id}"\\]:not\\(\\[data-guess\\]\\) \\.ab-open__ask::before \\{([^}]*)\\}`));
      expect(rule, a.id).not.toBeNull();
      expect(rule![1]).toContain(`attr(data-said-${a.id})`);
      expect(rule![1]).toContain(`--said-w: ${SAID_WEIGHT[a.mood]};`);
      expect(SAID_WEIGHT[a.mood]).toBeLessThan(860);
    }
  });
});
