// Before first paint the table must already hold the dish of the answer on show (html[data-answer], set by the
// head script: today's torn tab, or the time of day's guess), and the notice's back must already know which of
// its tabs is red and which one was torn off today (html[data-said]). None of that is stored by the menu: it is
// read from the attributes the head script writes, by CSS generated here from answers.ts, so it is right at
// first paint and on a client-side visit alike. TableController takes over once it is live
// (.mn-table[data-live], .mn-back[data-live]).
import { answers } from "@/content/answers";
import { DEFAULT_TABLE_ITEM, itemForAnswer } from "./model";

const serve = (scope: string, key: string) =>
  `${scope} .mn-table:not([data-live]) .mn-slide[data-key="${key}"]{display:block;opacity:1;z-index:1}` +
  `${scope} .mn-table:not([data-live]) .mn-cap[data-key="${key}"]{visibility:visible}`;

export const MENU_PICK_STYLE =
  serve("html:not([data-answer])", DEFAULT_TABLE_ITEM) +
  answers
    .map(
      ({ id }) =>
        serve(`html[data-answer="${id}"]`, itemForAnswer[id].id) +
        `html[data-answer="${id}"] .mn-back:not([data-live]) .mn-tab[data-tab="${id}"]{--mn-tab-ink:var(--color-tomato-ink)}` +
        `html[data-said="${id}"] .mn-tab[data-tab="${id}"]{--mn-torn:1}` +
        `html[data-said="${id}"] .mn-tab[data-tab="${id}"] .mn-tab__paper{clip-path:var(--stub)}` +
        `html[data-said="${id}"] .mn-tab[data-tab="${id}"] .mn-tab__face{opacity:0}` +
        `html[data-said="${id}"] .mn-tab[data-tab="${id}"] .mn-tab__torn{display:inline}`,
    )
    .join("");

/** The answer's dish by answer id, for the priming below. */
const DISH = JSON.stringify(Object.fromEntries(answers.map(({ id }) => [id, itemForAnswer[id].id])));

/**
 * Placed right after the table: its dish is the page's largest paint on a desktop. Its <img> stays lazy (the
 * other slides must not load), so fetch the same candidate now, at high priority (the hero's PHOTO_SCRIPT). A
 * detached Image: the server markup is never touched. Phones have no table and skip it.
 */
export const TABLE_SCRIPT = `(function(){try{if(!matchMedia('(min-width: 1024px)').matches)return;var m=${DISH};var a=document.documentElement.dataset.answer;var k=(a&&m[a])||${JSON.stringify(DEFAULT_TABLE_ITEM)};var i=document.querySelector('.mn-table .mn-slide[data-key="'+k+'"] img');if(!i||!i.srcset)return;var p=new Image();p.fetchPriority='high';p.sizes=i.sizes;p.srcset=i.srcset;p.src=i.src}catch(e){}})();`;
