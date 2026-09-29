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
 * The opening's door (Opening.tsx): on a fresh load at the top of the page, it is shut at first paint and
 * comes ajar once the guest has asked (about.css plays it; nothing else waits on it).
 *   html[data-knock]          the knock is on: a load (or a reload at the top, as the loader reads kd-scroll)
 *                             with full motion, no hash and no Save-Data. Any wheel, touch, key or scroll ends
 *                             it on the spot, and it takes itself off once played.
 *   --open-gx, --open-gy      the leaf's offset in the section, so its grain lies in phase with the wall's
 *                             and the shut door shows no seam
 * Anything else (a back or forward load, a hash, reduced motion, a client-side visit) opens on the door
 * already ajar.
 */
export const DOOR_SCRIPT = `(function(){try{var d=document.documentElement,ds=d.dataset,s=document.getElementById('o-nas'),l=s&&s.querySelector('[data-open-leaf]');if(!l)return;
if(ds.motion!=='full'||location.hash||window.scrollY>2)return;
var sd=false,fc=false,nav='',sc=0;try{sd=!!navigator.connection.saveData}catch(e){}try{fc=matchMedia('(forced-colors: active)').matches}catch(e){}
try{nav=performance.getEntriesByType('navigation')[0].type}catch(e){}try{sc=+sessionStorage.getItem('kd-scroll')||0}catch(e){}
if(sd||fc||!(nav==='navigate'||nav==='prerender'||nav===''||(nav==='reload'&&sc<=2)))return;
var g=function(){var x=0,y=0,e=l;while(e&&e!==s){x+=e.offsetLeft;y+=e.offsetTop;e=e.offsetParent}d.style.setProperty('--open-gx',x+'px');d.style.setProperty('--open-gy',y+'px')};
ds.knock='1';g();if(document.fonts)document.fonts.ready.then(g);
var ev=['wheel','touchmove','keydown','scroll'],end=function(){delete ds.knock;for(var i=0;i<ev.length;i++)removeEventListener(ev[i],end,true)};
for(var i=0;i<ev.length;i++)addEventListener(ev[i],end,{capture:true,passive:true});setTimeout(end,3000)}catch(e){}})();`;

/** «А у вас?»: the guest's answer from today (a tear on the notice, or a pick here) is already chosen. */
export const BACK_SCRIPT = `(function(){var d=document.documentElement.dataset,el=d.answer&&!d.guess&&document.getElementById('back-'+d.answer);if(el)el.checked=true})();`;
