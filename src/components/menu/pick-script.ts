// Runs as the first child of /menu's <main>, before the page paints: a hash that names one of the eight
// answer dishes (/menu#espresso-tonik, the hero's «В меню») sets html[data-pick], so the answer word at
// that dish is already red at first paint. Only the eight anchors map (built from answers.ts); nothing is
// stored. MenuNav keeps the attribute in step afterwards and removes it when the guest leaves /menu.
// It also marks a hard load (window.__kdMenuLoad): an inline script never runs on a client navigation.
import { answers } from "@/content/answers";

const PICKS = JSON.stringify(Object.fromEntries(answers.map((a) => [a.item.anchor, a.id])));

export const MENU_PICK_SCRIPT = `(function(){try{window.__kdMenuLoad=1;var m=${PICKS};var h=decodeURIComponent(location.hash.slice(1));if(Object.prototype.hasOwnProperty.call(m,h))document.documentElement.dataset.pick=m[h]}catch(e){}})();`;

/** The same map for the islands: anchor → answer id. */
export const PICK_BY_ANCHOR: Record<string, string> = Object.fromEntries(answers.map((a) => [a.item.anchor, a.id]));
