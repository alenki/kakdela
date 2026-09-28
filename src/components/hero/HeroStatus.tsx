"use client";

import { answerById } from "@/content/answers";
import { useKd } from "@/lib/store";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";

/**
 * The line over the answer, only for a guest back on a new day who hasn't answered yet: «Вчера было
 * «Сонно». А сегодня?». Everyone else gets an empty line that CSS hides; the head script flags the
 * returning guest before paint (html[data-yesterday]), so CSS keeps the line's place from the start.
 */
export function HeroStatus() {
  const guessed = useKd((s) => s.guessed);
  const yesterday = useKd((s) => s.yesterday);
  const y = guessed && yesterday ? answerById[yesterday] : undefined;
  return (
    <p className="stage__line label">
      {y && <span className="stage__now">{typograf(t.hero.yesterday(y.label))}</span>}
    </p>
  );
}
