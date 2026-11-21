import { describe, expect, it } from "vitest";
import { msToMoscowMidnight, newYearAt, phaseAt, previewFrom, seasonPhase, seasonSnippet, type SeasonPhase } from "./season";
import { HEAD_SCRIPT } from "./head-script";

/** Runs the head script's season part as the head script does, with a Moscow date and an address. */
function snippet(day: string, search = ""): string | undefined {
  const ds: Record<string, string> = {};
  new Function("day", "location", "ds", seasonSnippet())(day, { search }, ds);
  return ds.season;
}

describe("the season", () => {
  it("runs from 20 November to 14 January, with its four lines", () => {
    const cases: [number, number, SeasonPhase | null][] = [
      [11, 19, null],
      [11, 20, "eve"],
      [12, 1, "eve"],
      [12, 31, "eve"],
      [1, 1, "ny"],
      [1, 6, "ny"],
      [1, 7, "xmas"],
      [1, 8, "ny"],
      [1, 12, "ny"],
      [1, 13, "old"],
      [1, 14, "old"],
      [1, 15, null],
      [2, 1, null],
      [7, 7, null],
      [10, 31, null],
    ];
    for (const [m, d, want] of cases) expect([m, d, seasonPhase(m, d)]).toEqual([m, d, want]);
  });

  it("is decided the same way before paint, every day of the year", () => {
    const start = Date.UTC(2028, 0, 1);
    for (let i = 0; i < 366; i++) {
      const at = new Date(start + i * 86_400_000);
      const day = at.toISOString().slice(0, 10);
      const [, m, d] = day.split("-").map(Number);
      expect([day, snippet(day) ?? null]).toEqual([day, seasonPhase(m, d)]);
    }
    // A browser that can't say the date: nothing seasonal.
    expect(snippet("")).toBeUndefined();
  });

  it("previews a phase from the address, and only a known one", () => {
    expect(snippet("2026-07-01", "?season=old")).toBe("old");
    expect(snippet("2026-12-10", "?season=off")).toBeUndefined();
    expect(snippet("2026-07-01", "?city=1&season=xmas")).toBe("xmas");
    expect(snippet("2026-12-10", "?season=bogus")).toBe("eve");
    expect(snippet("2026-12-10", "?seasons=ny")).toBe("eve");
    expect(previewFrom("?season=ny")).toBe("ny");
    expect(previewFrom("?season=off")).toBeNull();
    expect(previewFrom("")).toBeUndefined();
  });

  it("reads the Moscow date, not the visitor's", () => {
    // 22:30 UTC on 31 December is already 1 January in Moscow.
    expect(phaseAt(new Date(Date.UTC(2026, 11, 31, 22, 30)))).toBe("ny");
    expect(phaseAt(new Date(Date.UTC(2026, 11, 31, 20, 30)))).toBe("eve");
    expect(phaseAt(new Date(Date.UTC(2027, 0, 14, 21, 0)))).toBeNull();
  });

  it("knows when midnight and the New Year come in Moscow", () => {
    expect(msToMoscowMidnight(new Date(Date.UTC(2026, 11, 31, 20, 59)))).toBe(60_000);
    expect(msToMoscowMidnight(new Date(Date.UTC(2026, 11, 31, 21, 0)))).toBe(86_400_000);
    expect(newYearAt(new Date(Date.UTC(2026, 11, 31, 12)))).toBe(Date.UTC(2026, 11, 31, 21));
    expect(newYearAt(new Date(Date.UTC(2026, 10, 25)))).toBe(Date.UTC(2026, 11, 31, 21));
    expect(newYearAt(new Date(Date.UTC(2027, 0, 3)))).toBeNull();
  });

  it("keeps the head script a script every browser can parse", () => {
    expect(() => new Function(HEAD_SCRIPT)).not.toThrow();
    expect(HEAD_SCRIPT).toContain("ds.season=sp");
    // Safari before 16.4 can't parse a lookbehind.
    expect(HEAD_SCRIPT).not.toMatch(/\(\?<[=!]/);
  });
});
