// The New Year season («С наступающим!», docs/CONVENTIONS.md): when the site wears it and which line the café
// says. Decided by the Moscow date, before first paint, by the head script (html[data-season]); the snippet it
// runs is made here from the same numbers, so the two can never disagree (season.test.ts checks every day).
//   eve   from 20 November to 31 December: «С наступающим!»
//   ny    1 to 6 and 8 to 12 January: «С Новым годом!»
//   xmas  7 January, Orthodox Christmas: «С Рождеством!»
//   old   13 and 14 January, the Old New Year: «Со старым Новым годом!»
// Outside the window nothing is set and nothing seasonal shows. `?season=eve|ny|xmas|old|off` previews a phase
// on any date (it is never stored).

export type SeasonPhase = "eve" | "ny" | "xmas" | "old";
export const PHASES: readonly SeasonPhase[] = ["eve", "ny", "xmas", "old"];

/** The window, by the Moscow date: [month, day], both ends inclusive. It runs over the turn of the year. */
export const SEASON = {
  from: [11, 20] as const,
  to: [1, 14] as const,
  /** Orthodox Christmas. */
  xmas: [1, 7] as const,
  /** The Old New Year: the night of the 13th to the 14th, kept on both days. */
  old: [1, 13] as const,
};

/** The phase for a Moscow calendar date (month 1 to 12), or null outside the season. */
export function seasonPhase(month: number, day: number): SeasonPhase | null {
  const [fm, fd] = SEASON.from;
  const [tm, td] = SEASON.to;
  if ((month === fm && day >= fd) || (month > fm && month <= 12)) return "eve";
  if (month < tm || (month === tm && day <= td)) {
    if (month === SEASON.xmas[0] && day === SEASON.xmas[1]) return "xmas";
    if (month === SEASON.old[0] && day >= SEASON.old[1]) return "old";
    return "ny";
  }
  return null;
}

const moscowDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Moscow", year: "numeric", month: "2-digit", day: "2-digit" });

/** The Moscow date of an instant: { y, m, d }. */
export function moscowDate(at: Date): { y: number; m: number; d: number } {
  const [y, m, d] = moscowDay.format(at).split("-").map(Number);
  return { y, m, d };
}

/** The phase at an instant (Moscow date), or null. */
export function phaseAt(at: Date): SeasonPhase | null {
  const { m, d } = moscowDate(at);
  return seasonPhase(m, d);
}

/** Moscow has kept UTC+3 all year since 2014: its midnight is 21:00 UTC the day before. */
const MSK_OFFSET = 3 * 3600_000;

/** Milliseconds from `at` to the next Moscow midnight. */
export function msToMoscowMidnight(at: Date): number {
  const local = at.getTime() + MSK_OFFSET;
  const day = 86_400_000;
  return day - (((local % day) + day) % day);
}

/** The instant the New Year starts in Moscow for the season `at` is in (00:00 on 1 January), or null if `at`
 *  is past it already this season. */
export function newYearAt(at: Date): number | null {
  const { y, m } = moscowDate(at);
  if (m < 11) return null;
  return Date.UTC(y + 1, 0, 1) - MSK_OFFSET;
}

/** A preview from the address: `?season=eve|ny|xmas|old|off`. `undefined` when there is none. */
export function previewFrom(search: string): SeasonPhase | null | undefined {
  const m = /[?&]season=(eve|ny|xmas|old|off)(?:&|$)/.exec(search);
  if (!m) return undefined;
  return m[1] === "off" ? null : (m[1] as SeasonPhase);
}

/**
 * The head script's part (ES5, runs before first paint). It expects `day` ("YYYY-MM-DD", the Moscow date, or
 * "" when the browser can't say), `ds` (the root's dataset) and the global `location`, as HEAD_SCRIPT has
 * them, and sets `ds.season`. Made from SEASON, so it always agrees with seasonPhase().
 */
export function seasonSnippet(): string {
  const [fm, fd] = SEASON.from;
  const [tm, td] = SEASON.to;
  const [xm, xd] = SEASON.xmas;
  const [om, od] = SEASON.old;
  return (
    `var sm=+day.slice(5,7),sd=+day.slice(8,10),sp='';` +
    `if(day){if((sm===${fm}&&sd>=${fd})||(sm>${fm}&&sm<=12))sp='eve';` +
    `else if(sm<${tm}||(sm===${tm}&&sd<=${td}))sp=(sm===${xm}&&sd===${xd})?'xmas':(sm===${om}&&sd>=${od})?'old':'ny'}` +
    `try{var sq=/[?&]season=(eve|ny|xmas|old|off)(?:&|$)/.exec(location.search);if(sq)sp=sq[1]==='off'?'':sq[1]}catch(e){}` +
    `if(sp)ds.season=sp;else delete ds.season;`
  );
}

/** The phase the page is wearing now (html[data-season]), on the client. */
export function currentPhase(): SeasonPhase | null {
  if (typeof document === "undefined") return null;
  const p = document.documentElement.dataset.season;
  return p && (PHASES as readonly string[]).includes(p) ? (p as SeasonPhase) : null;
}
