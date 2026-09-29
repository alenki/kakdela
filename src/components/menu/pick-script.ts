// Before first paint the table must already hold the dish of the answer on show (html[data-answer], set by the
// head script: today's torn tab, or the time of day's guess), or the dish the page opened on (/menu#shakshuka,
// :target), and the notice's back must already know which of its tabs is red and which one was torn off today
// (html[data-said]). None of that is stored by the menu: it is read from the attributes the head script writes
// and from the address, by CSS generated here from answers.ts and the table's dishes, so it is right at first
// paint and on a client-side visit alike. TableController takes over once it is live (.mn-table[data-live],
// .mn-back[data-live]).
import { answers } from "@/content/answers";
import { answerDishes, DEFAULT_TABLE_ITEM, itemForAnswer, tableItems } from "./model";

/** The site's settle ease (kd.settle in src/lib/gsap.ts), for the CSS landing. */
const SETTLE = "cubic-bezier(0.18, 0.9, 0.32, 1.04)";

const serve = (scope: string, key: string) =>
  `${scope} .mn-table:not([data-live]) .mn-slide[data-key="${key}"]{display:block;opacity:1;z-index:1}` +
  `${scope} .mn-table:not([data-live]) .mn-cap[data-key="${key}"]{visibility:visible}`;

/**
 * The first dish's slip lands at first paint, as the torn tab lands in the hero; never again once landed. Only in
 * full motion: html[data-motion] is the head script's word for it, and the media query keeps a page without JS
 * (whose html always says "full") from moving for a guest who asked for less.
 */
const land = (scope: string, key: string) =>
  `html[data-motion="full"]${scope.slice(4)} .mn-table:not([data-landed]) .mn-slide[data-key="${key}"] .mn-slide__slip{animation:mn-slip-land 500ms ${SETTLE} 250ms both}`;

/** A page opened on a kitchen dish serves that dish instead (the rows the table repeats are .mn-row). */
const arrival =
  `.mn-day:has(.mn-row:target) .mn-table:not([data-live]) .mn-slide{opacity:0!important}` +
  `.mn-day:has(.mn-row:target) .mn-table:not([data-live]) .mn-cap{visibility:hidden!important}` +
  `.mn-day:has(.mn-row:target) .mn-table:not([data-landed]) .mn-slide__slip{animation:none!important}` +
  `.mn-day:has(.mn-row:target) .mn-back:not([data-live]) .mn-tab{--mn-tab-ink:currentColor!important}` +
  answerDishes
    .map(
      ({ answer, item }) =>
        `.mn-day:has([id="${item.id}"]:target) .mn-back:not([data-live]) .mn-tab[data-tab="${answer.id}"]{--mn-tab-ink:var(--color-tomato-ink)!important}`,
    )
    .join("") +
  tableItems
    .map(
      ({ id }) =>
        `.mn-day:has([id="${id}"]:target) .mn-table:not([data-live]) .mn-slide[data-key="${id}"]{display:block!important;opacity:1!important;z-index:2}` +
        `.mn-day:has([id="${id}"]:target) .mn-table:not([data-live]) .mn-cap[data-key="${id}"]{visibility:visible!important}`,
    )
    .join("");

const landings =
  land("html:not([data-answer])", DEFAULT_TABLE_ITEM) + answers.map(({ id }) => land(`html[data-answer="${id}"]`, itemForAnswer[id].id)).join("");

export const MENU_PICK_STYLE =
  `@media (prefers-reduced-motion: no-preference){${landings}}` +
  serve("html:not([data-answer])", DEFAULT_TABLE_ITEM) +
  `html:not([data-answer]) .mn-back:not([data-live]) .mn-tab[data-tab="${answerDishes[0].answer.id}"]{--mn-tab-ink:var(--color-tomato-ink)}` +
  answers
    .map(
      ({ id }) =>
        serve(`html[data-answer="${id}"]`, itemForAnswer[id].id) +
        `html[data-answer="${id}"] .mn-back:not([data-live]) .mn-tab[data-tab="${id}"]{--mn-tab-ink:var(--color-tomato-ink)}` +
        `html[data-said="${id}"] .mn-tab[data-tab="${id}"]{--mn-torn:1}` +
        `html[data-said="${id}"] .mn-tab[data-tab="${id}"] .mn-tab__paper::before{clip-path:var(--stub)}` +
        `html[data-said="${id}"] .mn-tab[data-tab="${id}"] .mn-tab__face{opacity:0;visibility:hidden}` +
        `html[data-said="${id}"] .mn-tab[data-tab="${id}"] .mn-tab__torn{display:inline}`,
    )
    .join("") +
  arrival;

/** The answer's dish by answer id, for the priming below. */
const DISH = JSON.stringify(Object.fromEntries(answers.map(({ id }) => [id, itemForAnswer[id].id])));

/** The notice's paper tile under the build's base path, the address postexport.mjs gives the CSS's url() too. */
const PAPER = JSON.stringify(`${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/tex/paper.png`);

/**
 * Placed right after the table. The notice's paper is a phone's largest paint, and the table's dish a desktop's;
 * both are fetched now, at high priority (the hero's PHOTO_SCRIPT, the cafés page's pick script). The dish's <img>
 * stays lazy (the other slides must not load), so a detached Image fetches the same candidate; the server markup
 * is never touched. A page opened on a dish primes that dish instead.
 */
export const TABLE_SCRIPT = `(function(){function g(s,ss,sz){try{var p=new Image();p.fetchPriority='high';if(ss){p.sizes=sz;p.srcset=ss}p.src=s}catch(e){}}g(${PAPER});try{if(!matchMedia('(min-width: 1024px)').matches)return;var m=${DISH};var a=document.documentElement.dataset.answer;var h='';try{h=decodeURIComponent(location.hash.slice(1))}catch(e){}var k=(a&&m[a])||${JSON.stringify(DEFAULT_TABLE_ITEM)};var t=h&&document.querySelector('.mn-table .mn-slide[data-key="'+h.replace(/["\\\\]/g,'')+'"] img');var i=t||document.querySelector('.mn-table .mn-slide[data-key="'+k+'"] img');if(i&&i.srcset)g(i.src,i.srcset,i.sizes)}catch(e){}})();`;
