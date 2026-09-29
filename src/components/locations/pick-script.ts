// Runs as the first child of /locations' <main>, before the page paints. A hash that names a café
// (/locations#lermontova-4) sets html[data-lc-pick] and shows that café's city, so the page opens on its own
// plan with its mark already red; «?vstrecha» (the link «Позвать сюда» sends) also sets html[data-lc-invited],
// and the row says «вас позвали сюда». Only the nine ids map (built from cafes.ts); nothing is stored, so the
// guest's own city comes back on their next visit. It fetches nothing: the prints are eager images, which React
// already preloads from the response's headers, and the paper is the stylesheet's.
// It is rendered through InlineScript, so a client navigation leaves it inert: PlanController does the same on mount.
import { cafes } from "@/content/cafes";
import type { City } from "@/content/types";
import { INVITE_PARAM } from "./invite";

export const CITY_BY_CAFE: Record<string, City> = Object.fromEntries(cafes.map((c) => [c.id, c.city]));

export const LOCATIONS_PICK_SCRIPT = `(function(){var d=document.documentElement;window.__kdLcLoad=1;try{var m=${JSON.stringify(CITY_BY_CAFE)};var h=decodeURIComponent(location.hash.slice(1));if(Object.prototype.hasOwnProperty.call(m,h)){d.dataset.lcPick=h;d.dataset.city=m[h];if(new URLSearchParams(location.search).has(${JSON.stringify(INVITE_PARAM)}))d.dataset.lcInvited=''}}catch(e){}})();`;

/**
 * What the pick looks like before PlanController takes over (main.lc[data-lc-live]): the picked mark in its
 * current state, the invited row's line, and on phones the picked row first under the plan, landing so that the
 * plan and the row share the screen. One set of rules per café, from cafes.ts.
 */
export const LOCATIONS_PICK_STYLE = cafes
  .map(
    ({ id }) =>
      `html[data-lc-pick="${id}"] .lc:not([data-lc-live]) [data-lc-mk="${id}"]{--lc-disc:var(--color-tomato);--lc-scale:var(--lc-on-scale);--lc-lab-o:1;--lc-lab-dx:0px}` +
      `html[data-lc-pick="${id}"][data-lc-invited] #${id} .lc-cafe__invited{display:inline}` +
      `@media (max-width:639.98px),(max-width:1023.98px) and (orientation:portrait){html[data-lc-pick="${id}"] #${id}{order:-1;scroll-margin-top:var(--lc-land)}}`,
  )
  .join("");
