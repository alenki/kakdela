"use client";

import { answerById } from "@/content/answers";
import { useKd } from "@/lib/store";
import { t } from "@/i18n";

/** «— Вчера было «Сонно». А сегодня?» for guests returning on a new day. */
export function YesterdayLine() {
  const y = useKd((s) => s.yesterday);
  const guessed = useKd((s) => s.guessed);
  const a = y ? answerById[y] : undefined;
  if (!a || !guessed) return null;
  return <span className="stage__note stage__note--yesterday">{t.hero.yesterday(a.label)}</span>;
}
