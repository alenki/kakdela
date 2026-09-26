"use client";

import { answerById } from "@/content/answers";
import { useKd } from "@/lib/store";
import { t } from "@/i18n";

/**
 * The café answers in the mood the guest tore off in the hero. A time-of-day guess doesn't count:
 * until the guest answers, the reply stays neutral (that is also what the server renders).
 */
export function LocationsReply({ className }: { className?: string }) {
  const mood = useKd((s) => (s.answer && !s.guessed ? answerById[s.answer].mood : "none"));
  return <p className={className}>{t.locations.reply[mood]}</p>;
}
