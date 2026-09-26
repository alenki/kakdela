"use client";

import { useId, useSyncExternalStore } from "react";
import { m } from "motion/react";
import type { City } from "@/content/types";
import { kd, useKd } from "@/lib/store";
import { t } from "@/i18n";
import { cn } from "@/lib/format";

const CITIES: City[] = ["nalchik", "vladikavkaz"];
const subscribeNever = () => () => {};

/** «Нальчик 7 | Владикавказ 2». Every instance stays in sync through the store + html[data-city]. */
export function CitySwitch({ className, compact }: { className?: string; compact?: boolean }) {
  const city = useKd((s) => s.city);
  const group = useId();
  // Until hydration the store only knows the server default, so CSS paints the active pill from
  // html[data-city] (set before paint); the animated Motion pill takes over once ready.
  const ready = useSyncExternalStore(subscribeNever, () => true, () => false);
  return (
    <div role="radiogroup" aria-label={t.a11y.city} className={cn("city-switch", compact && "city-switch--compact", className)} data-ready={ready ? "" : undefined}>
      {CITIES.map((c) => {
        const active = city === c;
        return (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={active}
            className="city-switch__opt"
            data-active={active ? "" : undefined}
            onClick={() => kd.setCity(c)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "ArrowDown") {
                e.preventDefault();
                const next = c === "nalchik" ? "vladikavkaz" : "nalchik";
                kd.setCity(next);
                (e.currentTarget.parentElement?.querySelector(`[data-city-opt="${next}"]`) as HTMLElement | null)?.focus();
              }
            }}
            tabIndex={active ? 0 : -1}
            data-city-opt={c}
          >
            <span className="city-switch__static" aria-hidden="true" />
            {active && <m.span layoutId={`city-pill-${group}`} className="city-switch__pill" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
            <span className="city-switch__label">{t.city[c]}</span>
            {!compact && <span className="city-switch__count mono" aria-hidden="true">{t.city.count[c]}</span>}
          </button>
        );
      })}
    </div>
  );
}
