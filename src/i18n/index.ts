import { ru } from "./ru";

export type Locale = "ru";
const dictionaries = { ru } as const;

// Russian-first. An English dictionary will mirror ru's shape when EN ships.
export function getDictionary(locale: Locale = "ru") {
  return dictionaries[locale];
}

export const t = ru;
