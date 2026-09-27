import type { MenuItem } from "@/content/types";
import { NBSP, typograf } from "@/lib/typograf";
import { t } from "@/i18n";

/** 85.3 → «85,3»; the source's second decimal (15.44) is kept to one (15,4). */
const dec = (n: number) => String(Math.round(n * 10) / 10).replace(".", ",");

function nutritionLine(item: MenuItem): string | null {
  const k = item.nutrition?.kbju;
  if (!k) return null;
  return k.b != null && k.zh != null && k.u != null ? t.breakfasts.kbju(dec(k.k), dec(k.b), dec(k.zh), dec(k.u)) : t.menu.kcal(dec(k.k));
}

function volumeLine(item: MenuItem): string | null {
  const v = item.volume;
  if (!v) return null;
  return "ml" in v ? t.menu.ml(String(v.ml)) : t.menu.ml(`${v.sizes[0]}${NBSP}/${NBSP}${v.sizes[1]}`);
}

/**
 * The small print under a dish: its volume, then КБЖУ, joined by «·» (each figure keeps its name, so a
 * line only breaks after a «·»). КБЖУ that holds only for one city's recipe is shown in that city only.
 */
export function ItemFacts({ item, className }: { item: MenuItem; className?: string }) {
  const volume = volumeLine(item);
  const kbju = nutritionLine(item);
  if (!volume && !kbju) return null;
  const only = item.nutrition?.cities?.length === 1 ? item.nutrition.cities[0] : undefined;
  const sep = volume && kbju ? `${NBSP}· ` : "";
  return (
    <p className={className}>
      {volume && typograf(volume)}
      {kbju &&
        (only ? (
          <span data-city-only={only}>
            {sep}
            {typograf(kbju)}
          </span>
        ) : (
          <>
            {sep}
            {typograf(kbju)}
          </>
        ))}
    </p>
  );
}
