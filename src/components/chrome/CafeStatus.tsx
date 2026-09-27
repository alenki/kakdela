"use client";

import type { Cafe } from "@/content/types";
import { useKd } from "@/lib/store";
import { isOpen } from "@/lib/time";
import { t } from "@/i18n";
import { cn } from "@/lib/format";

/** Live open/closed status. Server renders the neutral hours («07:30–23:00»); the clock fills in after mount. */
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
  // Two unbreakable halves: where a column is narrow, the line may only break after «·».
  const [head, tail] = open ? [t.status.open, `${t.status.until} ${cafe.close}`] : [t.status.closed, t.status.opensAt];
  return (
    <span className={cn("status mono", className)} data-open={open ? "" : undefined}>
      <span className="status__dot" data-state={open ? "open" : "closed"} aria-hidden="true" />
      <span className="status__text">
        <span className="status__part">{head} ·</span> <span className="status__part">{tail}</span>
      </span>
    </span>
  );
}
