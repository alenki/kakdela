// Inline scripts for the about page (src/components/about), each placed right after the markup it sets
// up, so it runs before first paint. They only write html attributes and custom properties (html is the
// one element React leaves alone: suppressHydrationWarning), never the server markup. On a client-side
// navigation React doesn't run them; the islands do the same work in a layout effect instead.
import { ru } from "@/i18n/ru";

const PARTS = JSON.stringify(ru.dayparts.map((p) => [p.from, p.to]));

/**
 * «А прямо сейчас?»: the minute it is in Moscow and its part of the day.
 *   html[data-daypart]   0..5, the index in t.dayparts (CSS shows that answer)
 *   --kd-now             minutes since Moscow midnight (the ruler's red hand)
 *   --kd-h, --kd-m       the hour and the minute, for the hand's label (CSS counters)
 * NowClock keeps them in step with the page's minute clock.
 */
export const NOW_SCRIPT = `(function(){try{var p=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Moscow',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date()),h=0,m=0;
for(var i=0;i<p.length;i++){if(p[i].type==='hour')h=+p[i].value;if(p[i].type==='minute')m=+p[i].value}
var d=document.documentElement,t=h+m/60,P=${PARTS},k=0;for(var j=0;j<P.length;j++){if(t>=P[j][0]&&t<P[j][1])k=j}
d.dataset.daypart=k;d.style.setProperty('--kd-now',h*60+m);d.style.setProperty('--kd-h',h);d.style.setProperty('--kd-m',m)}catch(e){}})();`;

/** «А у вас?»: the guest's answer from today (a tear on the notice, or a pick here) is already chosen. */
export const BACK_SCRIPT = `(function(){var d=document.documentElement.dataset,el=d.answer&&!d.guess&&document.getElementById('back-'+d.answer);if(el)el.checked=true})();`;
