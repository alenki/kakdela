"use client";

import type { Cafe } from "@/content/types";
import { useKd } from "@/lib/store";
import { isOpen } from "@/lib/time";
import { t } from "@/i18n";
import { cn } from "@/lib/format";

/** Live open/closed badge. Server renders the neutral «с 7:30»; the clock fills in after mount. */
export function CafeStatus({ cafe, className }: { cafe: Cafe; className?: string }) {
  const now = useKd((s) => s.now);
  if (now === null) {
    return (
      <span className={cn("status mono", className)}>
        <span className="status__dot" data-state="idle" aria-hidden="true" />
        {cafe.open}–{cafe.close}
      </span>
    );
  }
  const open = isOpen(cafe, now);
  return (
    <span className={cn("status mono", className)} data-open={open ? "" : undefined}>
      <span className="status__dot" data-state={open ? "open" : "closed"} aria-hidden="true" />
      {open ? `${t.status.open} · ${t.status.until} ${cafe.close}` : `${t.status.closed} · ${t.status.opensAt}`}
    </span>
  );
}
