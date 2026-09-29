"use client";

import { useEffect, useRef, useState } from "react";
import type { City } from "@/content/types";
import { BtnLabel } from "@/components/chrome/BtnLabel";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { distLabel, FAR_KM, GEO_TIMEOUT, nearestTag, rank, type Ranked } from "@/lib/nearest";
import { kd } from "@/lib/store";
import { isOpen, minutesInMoscow } from "@/lib/time";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";
import { nearStore } from "./near-store";

export type LcPoint = { id: string; city: City; lat: number; lon: number; address: string; open: string; close: "23:00" | "00:00" };
type State = { kind: "idle" } | { kind: "locating" } | { kind: "error" } | { kind: "done"; text: string };
type Answer = { kind: "invited" | "nearest"; target: Ranked<LcPoint>; text: string; tag: string };

/**
 * Who the answer points at. A guest who came by a friend's invitation is shown the way there. Otherwise the
 * nearest café, unless it has closed for the night while another in its city is still open: then the nearest
 * open one, and the message says both. At 01:00, when every café sleeps, the nearest, and when they open.
 */
function answerFor(ranked: Ranked<LcPoint>[], now: number): Answer {
  const html = document.documentElement;
  const invited = html.dataset.lcInvited !== undefined ? ranked.find((p) => p.id === html.dataset.lcPick) : undefined;
  if (invited) {
    const d = distLabel(invited.d);
    // The way there, and whether it is open when the guest gets there.
    const text = isOpen(invited, now)
      ? t.locationsPage.invitedFound(invited.address, d)
      : t.locationsPage.invitedFoundClosed(invited.address, d, invited.open);
    return { kind: "invited", target: invited, text, tag: typograf(t.locationsPage.invitedAway(d)) };
  }
  const n = ranked[0];
  if (isOpen(n, now)) return { kind: "nearest", target: n, text: t.locations.found(n.address, distLabel(n.d)), tag: nearestTag(n.d) };
  const open = ranked.find((p) => p.city === n.city && isOpen(p, now));
  if (open) {
    const d = distLabel(open.d);
    return { kind: "nearest", target: open, text: t.locationsPage.foundOpen(open.address, d, open.close, n.address), tag: typograf(t.locationsPage.nearestOpenTag(d)) };
  }
  return { kind: "nearest", target: n, text: t.locationsPage.foundAllClosed(n.address, distLabel(n.d), n.open), tag: nearestTag(n.d) };
}

/**
 * Re-order the server-rendered rows of each city with CSS `order` (no React re-render of café content), tag each
 * with its distance, switch city when the answer is in the other one, and glide the rows into place (FLIP).
 */
function applyRanking(ranked: Ranked<LcPoint>[], answer: Answer) {
  const root = document.getElementById("kofejni");
  if (!root) return;
  const reduced = kd.get().motion === "reduced";
  const rows = new Map(Array.from(root.querySelectorAll<HTMLElement>("[data-lc-cafe]")).map((r) => [r.dataset.lcCafe ?? "", r]));
  const all = Array.from(rows.values());

  // Rows still waiting for their entrance would otherwise move while invisible.
  gsap.killTweensOf(all);
  gsap.set(all, { opacity: 1, y: 0, clearProps: "opacity,transform" });
  const first = new Map(all.map((r) => [r, r.getBoundingClientRect().top]));

  const switching = answer.target.city !== kd.get().city;
  // Reduced motion: no glide, so the rows change places behind a short dip of the list instead of jumping in view.
  const lists = Array.from(root.querySelectorAll<HTMLElement>("[data-lc-list]"));
  if (reduced && !switching) lists.forEach((l) => (l.style.opacity = "0"));

  const order: Record<City, number> = { nalchik: 0, vladikavkaz: 0 };
  for (const p of ranked) {
    const row = rows.get(p.id);
    if (!row) continue;
    const chosen = p.id === answer.target.id;
    // The answer first, then the rest from nearest to farthest.
    row.style.order = String(chosen ? -1 : ++order[p.city]);
    row.toggleAttribute("data-chosen", chosen);
    const tag = row.querySelector<HTMLElement>("[data-lc-near]");
    if (tag) {
      tag.hidden = false;
      tag.textContent = chosen ? answer.tag : typograf(t.locations.away(distLabel(p.d)));
    }
  }

  if (switching) kd.setCity(answer.target.city);
  if (reduced && !switching) requestAnimationFrame(() => lists.forEach((l) => l.style.removeProperty("opacity")));

  if (!reduced && !switching) {
    for (const row of all) {
      if (!row.getClientRects().length) continue;
      const dy = (first.get(row) ?? 0) - row.getBoundingClientRect().top;
      if (Math.abs(dy) > 1) gsap.fromTo(row, { y: dy }, { y: 0, duration: 0.8, ease: "kd.inOut", overwrite: "auto", clearProps: "transform" });
    }
  }
  ScrollTrigger.refresh();
}

/** Invited from far away: only the invited row says how far («вас позвали сюда · 1 431 км»), the others stay put. */
function tagInvitedOnly(answer: Answer) {
  const row = document.querySelector<HTMLElement>(`[data-lc-cafe="${CSS.escape(answer.target.id)}"]`);
  const tag = row?.querySelector<HTMLElement>("[data-lc-near]");
  if (!row || !tag) return;
  row.toggleAttribute("data-chosen", true);
  row.toggleAttribute("data-far", true);
  tag.hidden = false;
  tag.textContent = typograf(t.locationsPage.invitedAway(distLabel(answer.target.d)));
}

/** «Какая ближе ко мне?» on /locations: geolocation only on this click, the answer on the plan and in the list. */
export function LocationsNearest({ points }: { points: LcPoint[] }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const request = useRef(0);

  // Leaving the page forgets the answer, and any that is still on its way: the next visit starts clean.
  useEffect(
    () => () => {
      request.current++;
      nearStore.set(null);
    },
    [],
  );

  const locate = () => {
    if (state.kind === "locating") return;
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setState({ kind: "error" });
      return;
    }
    const id = ++request.current;
    setState({ kind: "locating" });
    const guard = window.setTimeout(() => {
      if (request.current === id) setState((s) => (s.kind === "locating" ? { kind: "error" } : s));
    }, GEO_TIMEOUT);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        window.clearTimeout(guard);
        if (request.current !== id) return;
        const here = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        const ranked = rank(points, here);
        if (!ranked.length) return;
        const answer = answerFor(ranked, kd.get().now ?? minutesInMoscow(new Date()));
        // Out of town, ranking by metres of a 1 400 km trip means nothing: just say how far, honestly. Invited from
        // there, the invitation still gets its answer and its way on the plan; the other rows stay as they are.
        if (answer.target.d > FAR_KM) {
          if (answer.kind !== "invited") {
            setState({ kind: "done", text: t.locationsPage.far(ranked[0].city, distLabel(ranked[0].d)) });
            return;
          }
          // Shown, not stored: the guest is elsewhere, and the invitation isn't their city to remember.
          if (answer.target.city !== kd.get().city) kd.showCity(answer.target.city);
          tagInvitedOnly(answer);
        } else applyRanking(ranked, answer);
        // From out of town the way would only start at the sheet's edge: the café is held, nothing is drawn.
        const far = answer.target.d > FAR_KM;
        nearStore.set({ here, accuracy: far ? Infinity : pos.coords.accuracy, target: answer.target.id, d: answer.target.d });
        setState({ kind: "done", text: answer.text });
      },
      () => {
        window.clearTimeout(guard);
        if (request.current === id) setState({ kind: "error" });
      },
      // Cafés 350 m apart can't be told apart on a cell-tower fix: ask for the real one.
      { enableHighAccuracy: true, timeout: GEO_TIMEOUT, maximumAge: 60_000 },
    );
  };

  const busy = state.kind === "locating";
  return (
    <>
      <button
        type="button"
        className="btn lc-near"
        onClick={locate}
        aria-busy={busy || undefined}
        aria-describedby="lc-near-msg"
        data-busy={busy ? "" : undefined}
      >
        <BtnLabel>{t.locations.nearest}</BtnLabel>
      </button>
      <p id="lc-near-msg" className="lc-near__msg" role="status" data-state={state.kind}>
        {state.kind === "locating"
          ? t.locations.locating
          : state.kind === "error"
            ? typograf(t.locations.denied)
            : state.kind === "done"
              ? typograf(state.text)
              : ""}
      </p>
    </>
  );
}
