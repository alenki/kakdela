import type { Cafe } from "@/content/types";

export const TZ = "Europe/Moscow"; // Nalchik and Vladikavkaz are on Moscow time.

const fmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** Minutes since local (Moscow) midnight. */
export function minutesInMoscow(date: Date): number {
  const parts = fmt.formatToParts(date);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

export const hhmm = (mins: number) => {
  const m = ((mins % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

/** "00:00" closing is treated as 24:00 (end of the same day). */
export function toMinutes(t: string, isClose = false): number {
  const [h, m] = t.split(":").map(Number);
  const v = h * 60 + m;
  return isClose && v === 0 ? 1440 : v;
}

export function isOpen(cafe: Pick<Cafe, "open" | "close">, mins: number): boolean {
  const o = toMinutes(cafe.open), c = toMinutes(cafe.close, true);
  return mins >= o && mins < c;
}

export function minutesUntilOpen(cafe: Pick<Cafe, "open" | "close">, mins: number): number {
  const o = toMinutes(cafe.open);
  return mins < o ? o - mins : 1440 - mins + o;
}

/** Hour as a fraction, e.g. 7:30 → 7.5. */
export const hourFraction = (mins: number) => mins / 60;

export function pickByHour<T extends { from: number; to: number }>(list: readonly T[], mins: number): T {
  const h = hourFraction(mins);
  return list.find((x) => h >= x.from && h < x.to) ?? list[0];
}
