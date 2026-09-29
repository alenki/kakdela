import type { City, Price } from "@/content/types";
import { NBSP } from "./typograf";
import { EN } from "@/i18n/locale";

/** The decimal mark: «5,0» in Russian, "5.0" in the English build. */
export const DECIMAL = EN ? "." : ",";

/** «5 000»: digit groups joined by a no-break space (see NBSP in typograf.ts); "5,000" in the English build. */
export const groupDigits = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, EN ? "," : NBSP);

/** «670 ₽» (no-break space before the sign). */
export const rub = (n: number) => `${groupDigits(n)}${NBSP}₽`;

export const priceFor = (price: Price, city: City): number | null => price[city];

export const priceLabel = (price: Price, city: City, fallback: string) => {
  const v = price[city];
  return v == null ? fallback : rub(v);
};

/** Screen-reader form: «670 рублей». */
export const rubSpoken = (n: number) =>
  EN ? `${n} ${n === 1 ? "ruble" : "rubles"}` : `${n} ${plural(n, "рубль", "рубля", "рублей")}`;

export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}

export const km = (v: number) => (v < 10 ? v.toFixed(1).replace(".", DECIMAL) : String(Math.round(v)));

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}
