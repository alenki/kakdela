"use client";

import { useSyncExternalStore, type CSSProperties } from "react";
import { answerById } from "@/content/answers";
import { cafesByCity } from "@/content/cafes";
import type { Answer, City } from "@/content/types";
import { useKd } from "@/lib/store";
import { hhmm, isOpen, minutesUntilOpen, toMinutes } from "@/lib/time";
import { NBSP, typograf } from "@/lib/typograf";
import { t } from "@/i18n";

/** The answer the guest actually gave today. A time-of-day guess does not count. */
function useRemembered(): Answer | null {
  const id = useKd((s) => (s.guessed ? null : s.answer));
  return id ? (answerById[id] ?? null) : null;
}

/**
 * «— Лучше всех.» in the heavy voice, holding the same posture it landed in up in the hero
 * («Сонно» still slumps). Server and guessers get «— …».
 */
export function FooterAnswer() {
  const a = useRemembered();
  const style = a
    ? ({ "--w": a.posture.weight, "--skew": `${a.posture.skewX}deg`, "--sy": a.posture.scaleY } as CSSProperties)
    : undefined;
  return (
    <span className="dlg-line dlg-a a-voice ft-answer" data-dlg-a data-ft-answer>
      <span className="dash">—</span>
      <span className="ft-word" data-ft-word data-empty={a ? undefined : ""} style={style}>
        {a ? `${a.label}.` : t.footer.noAnswer}
      </span>
    </span>
  );
}

/** The café's goodnight, chosen by the mood of the answer («none» until the guest answers). */
export function FooterGoodnight() {
  const a = useRemembered();
  // Level 1, the footer's typesetting (see SiteFooter).
  const line = typograf(t.footer.goodnight[a ? a.mood : "none"].replace(/^—\s*/, ""), 1);
  return (
    <p className="ft-night reply" data-ft-night>
      <span className="dash">—</span>
      {" "}
      {line}
    </p>
  );
}

// One sign-off per visit: fixed for the session, the next one on the next visit.
let signoffIndex: number | null = null;
function readSignoff(): number {
  if (signoffIndex !== null) return signoffIndex;
  const n = t.footer.signoffs.length;
  let i = 0;
  try {
    const kept = sessionStorage.getItem("kd-signoff");
    if (kept !== null && Number.isInteger(Number(kept))) {
      i = ((Number(kept) % n) + n) % n;
    } else {
      const last = Number(localStorage.getItem("kd-signoff-last") ?? -1);
      i = ((Number.isInteger(last) ? last + 1 : 0) % n + n) % n;
      sessionStorage.setItem("kd-signoff", String(i));
      localStorage.setItem("kd-signoff-last", String(i));
    }
  } catch {
    i = 0; // storage unavailable (private mode): the first sign-off, like the server
  }
  signoffIndex = i;
  return i;
}
const subscribeNever = () => () => {};

export function FooterSignoff({ children }: { children?: React.ReactNode }) {
  const i = useSyncExternalStore(subscribeNever, readSignoff, () => 0);
  return (
    <p className="ft-signoff reply" data-ft-signoff>
      {children}
      <span>{t.footer.signoffs[i]}</span>
    </p>
  );
}

/**
 * The city's day, from its cafés: while any is open, the latest close among them; otherwise the
 * wait until the first one opens.
 */
function cityStatus(city: City, now: number): { open: boolean; text: string } {
  const list = cafesByCity(city);
  const openNow = list.filter((c) => isOpen(c, now));
  if (openNow.length) {
    const close = Math.max(...openNow.map((c) => toMinutes(c.close, true)));
    return { open: true, text: `${t.status.todayUntil}${NBSP}${hhmm(close)}` };
  }
  const wait = Math.min(...list.map((c) => minutesUntilOpen(c, now)));
  return { open: false, text: `${t.status.tillOpen}${NBSP}${hhmm(wait)}` };
}

/**
 * Live mono line for the guest's city: «Сегодня открыто до 00:00» while a café is open,
 * «До открытия 06:41» at night. The server (and first paint) says «Каждый день с 07:30».
 */
export function FooterStatus() {
  const now = useKd((s) => s.now);
  const city = useKd((s) => s.city);
  const live = now === null ? null : cityStatus(city, now);
  const state = live === null ? "idle" : live.open ? "open" : "closed";
  const text = live === null ? typograf(t.status.everyDay, 1) : live.text;
  return (
    <p className="ft-status label" data-ft-status aria-live="off">
      <span className="ft-status__dot" data-state={state} aria-hidden="true" />
      <span className="mono">{text}</span>
    </p>
  );
}
