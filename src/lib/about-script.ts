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

/**
 * The opening's sign (Opening.tsx): on a fresh load at the top of the page the café hangs its answer on the
 * nail (the arrival, baked into CSS from src/lib/sign.ts; nothing waits on it).
 *   html[data-hang]   the arrival is on: a load (or a reload at the top, as the loader reads kd-scroll) with
 *                     full motion, no hash, no Save-Data and no forced colours. It is never cut short: the
 *                     island (HangingSign) takes over from the exact state it has reached, at its hand-off or
 *                     at the guest's first touch, and takes the attribute off.
 * Anything else (a back or forward load, a hash, reduced motion, a client-side visit) shows the sign hanging.
 */
export const HANG_SCRIPT = `(function(){try{var d=document.documentElement,ds=d.dataset;if(!document.getElementById('o-nas'))return;
if(ds.motion!=='full'||location.hash||window.scrollY>2)return;
var sd=false,fc=false,nav='',sc=0;try{sd=!!navigator.connection.saveData}catch(e){}try{fc=matchMedia('(forced-colors: active)').matches}catch(e){}
try{nav=performance.getEntriesByType('navigation')[0].type}catch(e){}try{sc=+sessionStorage.getItem('kd-scroll')||0}catch(e){}
if(sd||fc||!(nav==='navigate'||nav==='prerender'||nav===''||(nav==='reload'&&sc<=2)))return;ds.hang='1'}catch(e){}})();`;

/** «А у вас?»: the guest's answer from today (a tear on the notice, or a pick here) is already chosen. */
export const BACK_SCRIPT = `(function(){var d=document.documentElement.dataset,el=d.answer&&!d.guess&&document.getElementById('back-'+d.answer);if(el)el.checked=true})();`;
