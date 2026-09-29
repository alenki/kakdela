import { ru } from "./ru";
import { en } from "./en";
import { EN } from "./locale";

export type { Locale } from "./locale";

/** English over Russian, key by key: objects merge, anything else (a string, a list, a function) is replaced. */
export function mergeDictionary<T>(base: T, over: unknown): T {
  if (!over || typeof over !== "object" || Array.isArray(over) || !base || typeof base !== "object" || Array.isArray(base)) {
    return (over ?? base) as T;
  }
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(over)) out[k] = mergeDictionary(out[k], v);
  return out as T;
}

// The build's language (src/i18n/locale.ts). A key the English dictionary lacks shows in Russian until its
// twin lands in en.ts.
export const t = EN ? mergeDictionary(ru, en) : ru;

export function getDictionary() {
  return t;
}
