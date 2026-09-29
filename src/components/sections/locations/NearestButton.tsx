"use client";

import { useRef, useState } from "react";
import type { City } from "@/content/types";
import { BtnLabel } from "@/components/chrome/BtnLabel";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { kd } from "@/lib/store";
import { distLabel as dist, FAR_KM, GEO_TIMEOUT as TIMEOUT, nearestTag, rank, type Ranked as RankedBy } from "@/lib/nearest";
import { typograf } from "@/lib/typograf";
import { t } from "@/i18n";

export type NearPoint = { id: string; city: City; lat: number; lon: number; address: string };
type Ranked = RankedBy<NearPoint>;
type State = { kind: "idle" } | { kind: "locating" } | { kind: "error" } | { kind: "done"; text: string };

/**
 * Re-order the server-rendered rows with CSS `order` (no React re-render of café content), tag the
 * nearest in each city, switch city if the nearest café is in the other one, and glide the rows
 * into place (FLIP).
 */
function applyRanking(ranked: Ranked[]) {
  const root = document.getElementById("gde");
  if (!root) return;
  const reduced = kd.get().motion === "reduced";
  const rows = new Map(Array.from(root.querySelectorAll<HTMLElement>("[data-cafe]")).map((r) => [r.dataset.cafe ?? "", r]));
  const all = Array.from(rows.values());

  // Rows still waiting for their scroll entrance would otherwise move while invisible.
  gsap.killTweensOf(all);
  gsap.set(all, { opacity: 1, y: 0, clearProps: "opacity,transform" });
  const first = new Map(all.map((r) => [r, r.getBoundingClientRect().top]));

  const order: Record<City, number> = { nalchik: 0, vladikavkaz: 0 };
  for (const p of ranked) {
    const row = rows.get(p.id);
    if (!row) continue;
    const r = order[p.city]++;
    row.style.order = String(r);
    row.toggleAttribute("data-nearest", r === 0);
    const tag = row.querySelector<HTMLElement>("[data-near]");
    if (tag) {
      tag.hidden = false;
      tag.textContent = r === 0 ? nearestTag(p.d) : typograf(t.locations.away(dist(p.d)));
    }
  }

  const switching = ranked[0].city !== kd.get().city;
  if (switching) kd.setCity(ranked[0].city);

  if (!reduced && !switching) {
    for (const row of all) {
      const dy = (first.get(row) ?? 0) - row.getBoundingClientRect().top;
      if (Math.abs(dy) > 1) gsap.fromTo(row, { y: dy }, { y: 0, duration: 0.8, ease: "kd.inOut", overwrite: "auto", clearProps: "transform" });
    }
  }
  ScrollTrigger.refresh();
}

/** «Какая ближе ко мне?»: geolocation is asked for only on this click. */
export function NearestButton({ points }: { points: NearPoint[] }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const request = useRef(0);

  const locate = () => {
    if (state.kind === "locating") return;
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setState({ kind: "error" });
      return;
    }
    const id = ++request.current;
    setState({ kind: "locating" });
    // The browser's own timeout starts only after permission; this one also covers an ignored prompt.
    const guard = window.setTimeout(() => {
      if (request.current === id) setState((s) => (s.kind === "locating" ? { kind: "error" } : s));
    }, TIMEOUT);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        window.clearTimeout(guard);
        const here = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        const ranked = rank(points, here);
        if (!ranked.length) return;
        const n = ranked[0];
        // Out of town, ranking by metres of a 1 400 km trip means nothing: just say how far, honestly.
        if (n.d > FAR_KM) {
          setState({ kind: "done", text: t.locations.far(dist(n.d)) });
          return;
        }
        applyRanking(ranked);
        setState({ kind: "done", text: t.locations.found(n.address, dist(n.d)) });
      },
      () => {
        window.clearTimeout(guard);
        setState({ kind: "error" });
      },
      { enableHighAccuracy: false, timeout: TIMEOUT, maximumAge: 5 * 60_000 },
    );
  };

  const busy = state.kind === "locating";
  return (
    <>
      <button
        type="button"
        className="btn loc-near"
        onClick={locate}
        aria-busy={busy || undefined}
        aria-describedby="gde-near-msg"
        data-busy={busy ? "" : undefined}
      >
        <BtnLabel>{t.locations.nearest}</BtnLabel>
      </button>
      <p id="gde-near-msg" className="loc-near__msg" role="status" data-state={state.kind}>
        {state.kind === "locating" ? t.locations.locating : state.kind === "error" ? typograf(t.locations.denied) : state.kind === "done" ? typograf(state.text) : ""}
      </p>
    </>
  );
}
