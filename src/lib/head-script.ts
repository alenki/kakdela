// Runs in <head> before first paint. Sets html data attributes that CSS reads, so returning
// visitors never see a flash of the wrong city, motion mode or answer, and React never has to
// re-render server markup to reflect them.
//   data-city       nalchik | vladikavkaz          (localStorage kd-city)
//   data-motion     full | reduced                   (kd-motion, else prefers-reduced-motion)
//   data-answer     today's answer, or a time-of-day guess
//   data-guess="1"  the answer is only a guess
//   data-yesterday  the answer from a previous day
//   .intro          first visit this session → the hero's tabs sway once and settle
// Stored ids are whitelisted: a renamed answer or tampered storage must never reach the page.
import { answers } from "@/content/answers";

const IDS = JSON.stringify(answers.map((a) => a.id));

export const HEAD_SCRIPT = `(function(){
var d=document.documentElement,ds=d.dataset;d.classList.add('js');
function g(s,k){try{return window[s].getItem(k)}catch(e){return null}}
var c=g('localStorage','kd-city');if(c==='vladikavkaz')ds.city=c;
var m=g('localStorage','kd-motion'),rm=false;try{rm=matchMedia('(prefers-reduced-motion: reduce)').matches}catch(e){}
ds.motion=(m==='reduced'||(m!=='full'&&rm))?'reduced':'full';
var h=0,mi=0,day='';try{var p=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Moscow',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(new Date());
for(var i=0;i<p.length;i++){if(p[i].type==='hour')h=+p[i].value;if(p[i].type==='minute')mi=+p[i].value}
day=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow'}).format(new Date())}catch(e){h=new Date().getHours()}
var t=h+mi/60;
var guess=t<11?'sonno':t<16?'luchshe-vseh':'vsyo-shik';
var ids=${IDS},last=null,yd='';try{last=JSON.parse(g('localStorage','kd-last')||'null')}catch(e){}
if(!last||typeof last!=='object'||ids.indexOf(last.id)<0)last=null;
try{yd=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Moscow'}).format(new Date(Date.now()-864e5))}catch(e){}
if(last&&last.day===day){ds.answer=last.id}else{if(last&&yd&&last.day===yd)ds.yesterday=last.id;ds.answer=guess;ds.guess='1'}
if(ds.motion==='full'&&!location.hash&&!g('sessionStorage','kd-intro'))d.classList.add('intro');
setTimeout(function(){d.classList.remove('intro')},2600);
})();`;

/** Placed right after the answer pad: checks the radio chosen by the head script, before paint. */
export const PAD_SCRIPT = `(function(){var id=document.documentElement.dataset.answer;var el=id&&document.getElementById('ans-'+id);if(el)el.checked=true})();`;

/** Placed right after the answer panels: the photo on show is the hero's LCP. Its <img> stays lazy
 *  (the other seven must not load), so fetch the same candidate now, at high priority, instead of
 *  after the first layout. A detached Image: the server markup is never touched. */
export const PHOTO_SCRIPT = `(function(){var id=document.documentElement.dataset.answer;var i=id&&document.querySelector('#hero [data-panel="'+id+'"] img');if(!i||!i.srcset)return;var p=new Image();p.fetchPriority='high';p.sizes=i.sizes;p.srcset=i.srcset;p.src=i.src})();`;
