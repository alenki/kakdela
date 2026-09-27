"use client";

import { answerById } from "@/content/answers";
import { useKd } from "@/lib/store";
import { pickByHour } from "@/lib/time";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";

/**
 * The one quiet line over the answer: the time of day in Moscow time («Доброе утро…»), or, for a
 * guest back on a new day, yesterday's answer. Without JS: «Каждый день с 07:30».
 */
export function HeroStatus() {
  const now = useKd((s) => s.now);
  const guessed = useKd((s) => s.guessed);
  const yesterday = useKd((s) => s.yesterday);
  const y = guessed && yesterday ? answerById[yesterday] : undefined;
  return (
    <p className="stage__line label">
      {now === null ? (
        <span className="stage__nojs">{typograf(t.status.everyDay)}</span>
      ) : (
        <span className="stage__now">{typograf(y ? t.hero.yesterday(y.label) : pickByHour(t.dayparts, now).text)}</span>
      )}
    </p>
  );
}
