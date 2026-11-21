// Runs in <head> before first paint. Sets html data attributes that CSS reads, so returning
// visitors never see a flash of the wrong city, motion mode or answer, and React never has to
// re-render server markup to reflect them.
//   .js             the site's scripts will run here (PROBE_SCRIPT passed): the page is set for them.
//                   A browser that failed the probe keeps the no-JS page, with no loader and no intro.
//   data-city       nalchik | vladikavkaz          (localStorage kd-city)
//   data-motion     full | reduced                   (prefers-reduced-motion)
//   data-answer     today's answer, or a time-of-day guess
//   data-guess="1"  the answer is only a guess
//   data-said       today's torn answer only (never a guess or an arrow-key preview); read by /menu
//   data-yesterday  the answer from a previous day
//   .intro          first visit this session → the hero's tabs sway once and settle (after the
//                   loader, when it runs: the page's animations wait under its cover)
//   .ld-on + data-ld   the loading screen runs (full | brisk | calm) on any route: a fresh load, or a
//                   reload at the top, seen (not a background tab), no Save-Data, never back/forward.
//                   brisk: a later load this session; calm: reduced motion. .ld-lock holds the
//                   scroll unless there is a hash to land on. The screen itself is LOADER_SCRIPT
//                   (src/components/loader/loader-script.ts); this only decides a load's show, and
//                   kills it if it never starts or runs past 15s. Page switches decide for themselves.
//   --vh, --svh     1% of 100vh and of 100svh in px, measured once the body is parsed and again only
//                   when the width changes (or on any resize with a fine pointer). CSS sizes with
//                   these, never raw vh/svh: Telegram's in-app browser resizes the page as its bars
//                   fold, and raw units would reflow the page mid-scroll (Safari's never move anyway).
//   data-season     the New Year season's phase by the Moscow date (eve | ny | xmas | old), absent
//                   outside it; `?season=…` previews one (src/lib/season.ts, «С наступающим!»)
// Stored ids are whitelisted: a renamed answer or tampered storage must never reach the page.
import { answers } from "@/content/answers";
import { seasonSnippet } from "./season";

const IDS = JSON.stringify(answers.map((a) => a.id));

/**
 * Inlined in <head> just before HEAD_SCRIPT, in a <script> of its own: it only parses and runs where the
 * site's bundle can (the newest things the build still ships: private methods, `#x in`, `??=`,
 * `Object.hasOwn`, `Array#at`; Safari 15.4 and up, the build targeting Safari 16). An older browser
 * skips it on a syntax error, the flag stays unset, and HEAD_SCRIPT keeps the no-JS page instead of
 * setting a page for scripts that would never run (a header with no plate, a band whose note never
 * changes, a «Разделы» button that does nothing). Keep it in step with package.json's browserslist.
 */
export const PROBE_SCRIPT = `!function(){var K=class{static a=1;#b=2;#c(){return #b in this}d(){return this.#c()}},k=null;k??=new K;if(k?.d()&&Object.hasOwn&&[].at)window.__kdJs=1}();`;

export const HEAD_SCRIPT = `(function(){
var d=document.documentElement,ds=d.dataset,js=!!window.__kdJs;if(js)d.classList.add('js');
function g(s,k){try{return window[s].getItem(k)}catch(e){return null}}
var c=g('localStorage','kd-city');if(c==='vladikavkaz')ds.city=c;
var rm=false;try{rm=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
ds.motion=rm?'reduced':'full';
var h=0,mi=0,day='';try{var p=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Moscow',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
for(var i=0;i<p.length;i++){if(p[i].type==='hour')h=+p[i].value;if(p[i].type==='minute')mi=+p[i].value}
day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow'}).format(new Date())}catch(e){h=new Date().getHours()}
var t=h+mi/60;
${seasonSnippet()}
var guess=t<11?'sonno':t<16?'luchshe-vseh':'vsyo-shik';
var ids=${IDS},last=null,yd='';try{last=JSON.parse(g('localStorage','kd-last')||'null')}catch(e){}
if(!last||typeof last!=='object'||ids.indexOf(last.id)<0)last=null;
try{yd=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow'}).format(new Date(Date.now()-864e5))}catch(e){}
if(last&&last.day===day){ds.answer=last.id;ds.said=last.id}else{if(last&&yd&&last.day===yd)ds.yesterday=last.id;ds.answer=guess;ds.guess='1'}
var nav='',sd=false;try{nav=performance.getEntriesByType('navigation')[0].type}catch(e){}
try{sd=!!navigator.connection.saveData}catch(e){}
var ld=js&&!sd&&(document.visibilityState!=='hidden'||document.prerendering)&&(nav==='navigate'||nav==='prerender'||nav===''||(nav==='reload'&&!(+g('sessionStorage','kd-scroll')>2)));
if(ld){ds.ld=ds.motion==='reduced'?'calm':g('sessionStorage','kd-intro')?'brisk':'full';d.classList.add('ld-on');if(!location.hash)d.classList.add('ld-lock');
var kill=function(){if(window.KDLoader)window.KDLoader.finish(true);else{d.classList.remove('ld-on','ld-lock','ld-reveal');delete ds.ld}};
try{document.addEventListener('DOMContentLoaded',function(){if(!document.getElementById('ld-screen'))kill()})}catch(e){}window.__kdKill=setTimeout(kill,15000)}
try{window.addEventListener('pagehide',function(){try{sessionStorage.setItem('kd-scroll',String(Math.round(window.scrollY)))}catch(e){}})}catch(e){}
if(js&&ds.motion==='full'&&!location.hash&&!g('sessionStorage','kd-intro'))d.classList.add('intro');
var un=function(){setTimeout(function(){d.classList.remove('intro')},2600)};try{if(ld)window.addEventListener('kd:loader-done',un);else un()}catch(e){un()}
var vw=-1,fine=false;try{fine=matchMedia('(hover: hover) and (pointer: fine)').matches}catch(e){}
var vp=function(){var b=document.body;if(!b)return;var e=document.createElement('div');e.style.cssText='position:absolute;top:0;left:0;width:0;height:100vh;visibility:hidden;pointer-events:none';b.appendChild(e);var v=e.getBoundingClientRect().height;e.style.height='100svh';var s=e.getBoundingClientRect().height;b.removeChild(e);if(v>0){d.style.setProperty('--vh',v/100+'px');d.style.setProperty('--svh',(s>0&&s<=v?s:v)/100+'px')}vw=window.innerWidth};
try{if(document.body)vp();else document.addEventListener('DOMContentLoaded',vp);window.addEventListener('resize',function(){if(fine||window.innerWidth!==vw)vp()})}catch(e){}
})();`;

/** Placed right after the answer pad: checks the radio chosen by the head script, before paint. */
export const PAD_SCRIPT = `(function(){var id=document.documentElement.dataset.answer;var el=id&&document.getElementById('ans-'+id);if(el)el.checked=true})();`;

/** Placed right after the answer panels: the photo on show is the hero's LCP. Its <img> stays lazy
 *  (the other seven must not load), so fetch the same candidate now, at high priority, instead of
 *  after the first layout. A detached Image: the server markup is never touched. The loader waits for
 *  it (window.__kdLcp). */
export const PHOTO_SCRIPT = `(function(){var id=document.documentElement.dataset.answer;var i=id&&document.querySelector('#hero [data-panel="'+id+'"] img');if(!i||!i.srcset)return;var p=new Image();p.fetchPriority='high';p.sizes=i.sizes;p.srcset=i.srcset;p.src=i.src;window.__kdLcp=p})();`;
