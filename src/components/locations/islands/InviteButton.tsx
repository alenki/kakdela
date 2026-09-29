"use client";

import { useEffect, useRef, useState } from "react";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { inviteText, inviteUrl } from "../invite";

/** One polite line for the whole page (#lc-said), refilled on the next frame so a repeat is heard. */
function say(text: string) {
  const el = document.getElementById("lc-said");
  if (!el) return;
  el.textContent = "";
  requestAnimationFrame(() => {
    el.textContent = text;
  });
}

type State = "idle" | "copied" | "shareFailed" | "copyFailed";

/**
 * «Где встретимся?», passed on. On a phone it opens the share sheet with the question already answered
 * («Встретимся в «Как дела?» на Лермонтова, 4?») and a link that opens this page on that café. On a computer, or
 * when the sheet won't open, it copies the same two lines, and the label says «Скопировано» for a moment. When
 * nothing works, the row says so and shows the link in a field, selected, to copy by hand. The button is hidden
 * without JS (it can do nothing there).
 */
export function InviteButton({ id, address, titleId }: { id: string; address: string; titleId: string }) {
  const [state, setState] = useState<State>("idle");
  const timer = useRef(0);
  const field = useRef<HTMLInputElement>(null);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  // The link to copy by hand gets the focus, all of it selected.
  useEffect(() => {
    if (state !== "shareFailed" && state !== "copyFailed") return;
    field.current?.focus();
    field.current?.select();
  }, [state]);

  const invite = async () => {
    const url = inviteUrl(id);
    const text = inviteText(address);
    const data = { title: t.meta.cafeName(address), text, url };
    // The share sheet belongs to phones and tablets: on a desktop it is the system's clumsy dialog.
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    let refused = false;
    if (coarse && typeof navigator.share === "function" && (!navigator.canShare || navigator.canShare(data))) {
      try {
        await navigator.share(data);
        return;
      } catch (e) {
        // Closed without sharing: nothing to say. Refused (no sheet, a policy): the copy is tried instead.
        if ((e as DOMException)?.name === "AbortError") return;
        refused = true;
      }
    }
    window.clearTimeout(timer.current);
    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setState("copied");
      say(t.locationsPage.invite.copied);
      timer.current = window.setTimeout(() => setState("idle"), 2400);
    } catch {
      const failed = refused ? "shareFailed" : "copyFailed";
      setState(failed);
      say(t.locationsPage.invite[failed]);
    }
  };

  const failed = state === "shareFailed" || state === "copyFailed";
  return (
    <span className="lc-invite">
      <button type="button" className="dlink lc-invite__btn" onClick={invite} aria-describedby={titleId} data-state={state}>
        {/* Both words in one cell, so the button keeps its width when it says «Скопировано». */}
        <span className="lc-invite__word">{typograf(t.locationsPage.invite.label)}</span>
        <span className="lc-invite__word" aria-hidden="true">
          {t.locationsPage.invite.copied}
        </span>
      </button>
      {failed && (
        <span className="lc-invite__fallback label">
          {/* Said once aloud through #lc-said; here for the eye. */}
          <span aria-hidden="true">{t.locationsPage.invite[state]}</span>{" "}
          <input
            ref={field}
            className="lc-invite__link"
            readOnly
            value={inviteUrl(id)}
            aria-label={t.locationsPage.invite.linkLabel}
            onFocus={(e) => e.currentTarget.select()}
          />
        </span>
      )}
    </span>
  );
}
