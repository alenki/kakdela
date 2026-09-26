"use client";

import { useKd } from "@/lib/store";
import { hhmm, pickByHour } from "@/lib/time";
import { t } from "@/i18n";

/** «Каждый день с 7:30» on the server; the live Moscow time and daypart line after mount. */
export function HeroStatus() {
  const now = useKd((s) => s.now);
  const city = useKd((s) => s.city);
  return (
    <p className="hero__status label" aria-live="off">
      {now === null ? (
        <span>{t.status.everyDay}</span>
      ) : (
        <>
          <span className="hero__clock">
            {t.status.now[city]} · <span className="mono">{hhmm(now)}</span>
          </span>
          <span className="hero__daypart">{pickByHour(t.dayparts, now).text}</span>
        </>
      )}
    </p>
  );
}
