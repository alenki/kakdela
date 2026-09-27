import { DEFAULT_ANSWER } from "@/content/answers";
import { LOADER_DONE, LOADER_HYDRATED } from "./loader";

type Config = { hydrated: string; done: string; fallback: string };

/**
 * The loading screen's choreography (markup: components/chrome/Loader.tsx). It is inlined right after
 * that markup, so it starts while the HTML is still parsing, long before React. It animates with the
 * Web Animations API only, which writes no attributes: hydration finds the server markup untouched.
 * Its one attribute, #ldr[data-state], sits on an element that opts out of the hydration diff.
 *
 * The scene, on the ink of the night before the café opens:
 *   the badge draws itself, КАК and ДЕЛА? step out of it, «кофе» and «завтраки» swing into orbit, and
 *   the question's dot drops in. The clover is the progress: a leaf per quarter of the real load
 *   (HTML, eager images, fonts, hydration, the load event). Each leaf rolls the answer line on, like
 *   a slot machine that lands on the answer the hero will show. The perforation lights up as it goes.
 *   Loaded, the sheet tears along the perforation: the logo lands in the hero's notice, the answer in
 *   the hero's panel, and the app takes over (LOADER_DONE; the tabs sway from the landing).
 *
 * Self-contained: it is serialised with Function#toString, so it must not use anything from outside
 * its own body (configuration comes in as the argument).
 */
function kdLoader(cfg: Config) {
  const d = document;
  const html = d.documentElement;
  const root = d.getElementById("ldr");
  if (!root || root.dataset.state || typeof root.animate !== "function") return;
  if (!html.classList.contains("js") || html.dataset.motion === "reduced") return;
  let stored: string | null = null;
  try {
    stored = sessionStorage.getItem("kd-loader");
  } catch {}
  if (stored === "off") return;
  // A second load this session plays the same scene, quicker.
  const pace = stored === "seen" ? 0.62 : 1;
  try {
    sessionStorage.setItem("kd-loader", "seen");
  } catch {}

  const $ = <T extends Element = HTMLElement>(sel: string, from: ParentNode = root) => from.querySelector<T>(sel);
  const $$ = <T extends Element = SVGGraphicsElement>(sel: string) => Array.from(root.querySelectorAll<T>(sel));
  const mark = $<SVGSVGElement>(".ldr__mark");
  const fly = $("[data-ldr-fly]");
  const lift = $("[data-ldr-lift]");
  const oct = $<SVGGraphicsElement>('[data-part="oct"]');
  const clover = $<SVGGraphicsElement>('[data-part="clover"]');
  const leaves = $$("[data-leaf]");
  const top = $("[data-ldr-top]");
  const bottom = $("[data-ldr-bottom]");
  const perf = $("[data-ldr-perf]");
  const lit = $("[data-ldr-lit]");
  const say = $("[data-ldr-say]");
  const all = $$<HTMLElement>("[data-mood]");
  if (!mark || !fly || !lift || !oct || !clover || leaves.length !== 4 || !top || !bottom || !perf || !say || !all.length) return;
  root.dataset.state = "on";

  // kd.out, kd.inOut and kd.settle (lib/gsap.ts); a pop with some overshoot for the leaves; a fall and a rise.
  const OUT = "cubic-bezier(.16,1,.3,1)";
  const IN_OUT = "cubic-bezier(.65,0,.35,1)";
  const SETTLE = "cubic-bezier(.18,.9,.32,1.04)";
  const POP = "cubic-bezier(.3,1.45,.55,1)";
  const FALL = "cubic-bezier(.5,0,.9,.4)";
  const RISE = "cubic-bezier(.1,.6,.4,1)";
  /** Scene seconds: a quicker second load scales the whole scene. */
  const play = (el: Element | null | undefined, frames: Keyframe[], dur: number, at = 0, easing = OUT) =>
    el ? el.animate(frames, { duration: dur * 1000 * pace, delay: at * 1000 * pace, easing, fill: "both" }) : null;

  // Wheel, touch and keyboard scrolling wait for the page: nothing moves under the sheet.
  const SCROLL_KEYS = /^(Arrow(Up|Down)|Page(Up|Down)|Home|End| )$/;
  const block = (e: Event) => {
    if (e.type === "keydown" && !SCROLL_KEYS.test((e as KeyboardEvent).key)) return;
    e.preventDefault();
    e.stopPropagation();
  };
  const blocked = ["wheel", "touchmove", "keydown"];
  blocked.forEach((t) => window.addEventListener(t, block, { capture: true, passive: false }));
  const unblock = () => blocked.forEach((t) => window.removeEventListener(t, block, { capture: true }));

  // ── Act one: the question is asked ──
  const ob = oct.getBBox();
  const cx = ob.x + ob.width / 2;
  const cy = ob.y + ob.height / 2;
  /** transform-origin at the badge's centre, for an element with transform-box: fill-box. */
  const hub = (el: SVGGraphicsElement) => {
    const b = el.getBBox();
    return `${cx - b.x}px ${cy - b.y}px`;
  };
  play(oct, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], 0.8, 0.05, IN_OUT);
  const step = (el: Element, dx: number, i: number) =>
    play(el, [{ opacity: 0, transform: `translateX(${dx}px)` }, { opacity: 1, transform: "none" }], 0.9, 0.28 + i * 0.07);
  $$('[data-part="kak"] > path').reverse().forEach((el, i) => step(el, 70, i));
  const dela = $$('[data-part="dela"] > path');
  const dot = dela.pop();
  dela.forEach((el, i) => step(el, -70, i));
  play(dot, [
    { opacity: 0, transform: "translateY(-160px)", easing: FALL },
    { opacity: 1, offset: 0.12 },
    { transform: "none", offset: 0.5, easing: RISE },
    { transform: "translateY(-32px)", offset: 0.7, easing: FALL },
    { transform: "none", offset: 0.86, easing: RISE },
    { transform: "translateY(-7px)", offset: 0.94, easing: FALL },
    { opacity: 1, transform: "none" },
  ], 0.95, 0.72, "linear");
  $$('[data-part="kofe"], [data-part="zavtraki"]').forEach((el) => {
    const o = hub(el);
    play(el, [{ opacity: 0, transform: "rotate(-70deg)", transformOrigin: o }, { opacity: 1, transform: "none", transformOrigin: o }], 1.3, 0.35);
  });
  play(perf, [{ opacity: 0 }, { opacity: 1 }], 0.6, 0.3);

  // ── Act two: the answer comes, a leaf at a time ──
  // The line lands on the answer the hero is about to show (head script), after three others.
  const final = all.find((m) => m.dataset.mood === (html.dataset.answer || cfg.fallback)) || all[0];
  const others = all.filter((m) => m !== final);
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  const moods = others.slice(0, 3).concat(final);
  let said = -1;
  /** The slot turns: out goes up as in comes up behind it, in lockstep, so the two never overlap. */
  const roll = (k: number) => {
    const last = k === moods.length - 1;
    const [dur, ease] = last ? [0.6, SETTLE] : [0.4, OUT];
    if (said >= 0) play(moods[said], [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-115%)" }], dur, 0, ease);
    play(moods[k], [{ opacity: 0, transform: "translateY(115%)" }, { opacity: 1, transform: "none" }], dur, 0, ease);
    said = k;
  };
  const grow = (k: number) => {
    const o = hub(leaves[k]);
    play(leaves[k], [{ transform: "scale(0) rotate(-40deg)", transformOrigin: o }, { transform: "none", transformOrigin: o }], 0.75, 0, POP);
  };
  const burn = lit?.animate([{ clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)" }], { duration: 1000, fill: "both" });
  burn?.pause();

  // What "loaded" means, weighted. Every gate ends at 1; the cap opens them all.
  const gates: Record<string, number> = { dom: 0, images: 0, fonts: 0, hydrated: 0, load: 0 };
  const weight: Record<string, number> = { dom: 0.3, images: 0.15, fonts: 0.14, hydrated: 0.25, load: 0.1 };
  const open = () => Object.keys(gates).every((g) => gates[g] === 1);
  const progress = () => Object.keys(gates).reduce((sum, g) => sum + weight[g] * gates[g], 0.06);
  const onDom = () => {
    gates.dom = 1;
    const imgs = Array.from(d.images).filter((img) => img.loading !== "lazy" && !img.complete);
    let loaded = 0;
    if (!imgs.length) gates.images = 1;
    imgs.forEach((img) => {
      const one = () => (gates.images = ++loaded / imgs.length);
      img.addEventListener("load", one, { once: true });
      img.addEventListener("error", one, { once: true });
    });
    // The answer line is set in the display face: load it now rather than on first use.
    const family = getComputedStyle(final).fontFamily;
    Promise.all([d.fonts.load(`860 1em ${family}`), d.fonts.ready]).then(() => (gates.fonts = 1), () => (gates.fonts = 1));
  };
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", onDom, { once: true });
  else onDom();
  window.addEventListener(cfg.hydrated, () => (gates.hydrated = 1), { once: true });
  if (d.readyState === "complete") gates.load = 1;
  else window.addEventListener("load", () => (gates.load = 1), { once: true });
  // However slow the network, the page is never held back for more than 8 s.
  const cap = window.setTimeout(() => Object.keys(gates).forEach((g) => (gates[g] = 1)), 8000);

  const FILL_FROM = 0.45; // scene seconds: the badge is half drawn
  const SPEED = 1; // of the whole bar per scene second: a leaf every 0.25 s when nothing waits
  const start = performance.now();
  let prev = start;
  let fill = 0;
  let grown = 0;
  const frame = (now: number) => {
    const dt = Math.min(100, now - prev) / 1000 / pace;
    prev = now;
    if ((now - start) / 1000 / pace > FILL_FROM) {
      const goal = open() ? 1 : Math.min(0.97, progress());
      fill = Math.min(goal, fill + SPEED * dt);
    }
    if (burn) burn.currentTime = fill * 1000;
    while (grown < 4 && fill >= (grown + 1) / 4) grow(grown++);
    if (gates.fonts === 1 && said < grown - 1) roll(grown - 1);
    if (grown === 4 && said === 3) {
      window.clearTimeout(cap);
      // A four-leaf clover: found. One beat, then the sheet tears.
      const o = hub(clover);
      play(clover, [{ transform: "none", transformOrigin: o }, { transform: "scale(1.14)", transformOrigin: o, offset: 0.35 }, { transform: "none", transformOrigin: o }], 0.55, 0.25, IN_OUT);
      // (After the last answer has settled: the flight measures it where it stands.)
      window.setTimeout(tear, 650 * pace);
      return;
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);

  // ── Act three: the sheet tears, the logo and the answer land in the hero ──
  function tear() {
    root!.dataset.state = "exit";
    if (d.visibilityState === "hidden") return finish(false);
    const vw = innerWidth;
    const vh = innerHeight;
    const seen = (r: DOMRect | undefined): r is DOMRect => !!r && r.width > 0 && r.top >= 0 && r.left >= 0 && r.bottom <= vh && r.right <= vw;
    const text = (el: Element) => {
      const range = d.createRange();
      range.selectNodeContents(el);
      return range.getBoundingClientRect();
    };
    const hero = d.getElementById("hero");
    const notice = hero?.querySelector<SVGSVGElement>(".notice__logo");
    const panel = hero?.querySelector(".panel[data-active]") ?? hero?.querySelector(`[data-panel="${final.dataset.mood}"]`);
    const answer = panel?.querySelector<HTMLElement>("[data-answer]");
    const logoTo = notice?.getBoundingClientRect();
    const answerTo = answer && answer.textContent === final.textContent ? text(answer) : undefined;
    const landLogo = seen(logoTo);
    const landAnswer = seen(answerTo);

    const moves: (Animation | null)[] = [];
    const holds: Animation[] = [];
    /** Keeps an element of the page hidden until the loader lets go of it. */
    const hold = (el: Element | null | undefined, frames: Keyframe[] = [{ opacity: 0 }, { opacity: 0 }]) => {
      if (el) holds.push(el.animate(frames, { duration: 60_000, fill: "both" }));
    };

    // The pull, then the rip: the upper sheet lifts away, the lower one falls like a torn-off tab.
    const tearY = perf!.getBoundingClientRect().top + perf!.offsetHeight / 2;
    play(perf, [{ opacity: 1 }, { opacity: 0 }], 0.15);
    // Both halves hinge on the right end of the tear (loader.css), so the rip opens from the left.
    moves.push(play(top, [
      { transform: "none", easing: OUT },
      { transform: "translateY(-5px) rotate(0.5deg)", offset: 0.14, easing: "cubic-bezier(.6,0,.3,1)" },
      { transform: `translateY(${-(tearY + 90)}px) rotate(5deg)` },
    ], 1.05, 0, "linear"));
    moves.push(play(bottom, [
      { transform: "none", easing: OUT },
      { transform: "translateY(8px) rotate(-0.7deg)", offset: 0.14, easing: "cubic-bezier(.45,0,.8,.3)" },
      { transform: `translateY(${vh - tearY + 90}px) rotate(-7deg)` },
    ], 1, 0, "linear"));

    // The logo: lifted off the sheet, then set down exactly on the notice's, ink on paper.
    const m = mark!.getBoundingClientRect();
    if (landLogo) {
      const s = logoTo.width / m.width;
      const dy = logoTo.top - m.top;
      moves.push(play(fly, [{ transform: "none" }, { transform: `translateX(${logoTo.left - m.left}px)` }], 0.95, 0.12, IN_OUT));
      moves.push(play(lift, [
        { transform: "none", easing: "cubic-bezier(.3,0,.5,1)" },
        { transform: `translateY(${Math.min(-12, dy * 0.08)}px) scale(${1.04 + (s - 1) * 0.1})`, offset: 0.24, easing: "cubic-bezier(.45,0,.15,1)" },
        { transform: `translateY(${dy}px) scale(${s})` },
      ], 0.95, 0.12, "linear"));
      // Milk on the ink, ink on the paper: the colour turns as soon as it leaves the sheet, since the
      // light page opens up right under it.
      play(mark, [{ color: getComputedStyle(mark!).color }, { color: getComputedStyle(notice!).color }], 0.5, 0.1, OUT);
      hold(notice);
    } else {
      moves.push(play(fly, [{ transform: "none" }, { transform: `translateY(${-(m.bottom + 90)}px) rotate(-4deg)` }], 1, 0.1, "cubic-bezier(.6,0,.3,1)"));
    }

    // The answer: out of its slot and into the hero's dialogue, at the hero's size.
    play(say, [{ clipPath: "none" }, { clipPath: "none" }], 0.01);
    if (landAnswer) {
      const box = final.getBoundingClientRect();
      const from = text(final);
      // Type doesn't scale quite linearly (advances round at each size): fit both ends, not just the height.
      const sx = answerTo.width / from.width;
      const sy = answerTo.height / from.height;
      const x = answerTo.left - box.left - (from.left - box.left) * sx;
      const y = answerTo.top - box.top - (from.top - box.top) * sy;
      moves.push(play(say, [{ transform: "none" }, { transform: `translateX(${x}px)` }], 0.9, 0.18, IN_OUT));
      moves.push(play(final, [
        { transform: "none", transformOrigin: "0 0", easing: "cubic-bezier(.3,0,.5,1)" },
        { transform: `translateY(${Math.min(-10, y * 0.08)}px) scale(${1 + (sy - 1) * 0.08})`, transformOrigin: "0 0", offset: 0.22, easing: "cubic-bezier(.45,0,.15,1)" },
        { transform: `translateY(${y}px) scale(${sx}, ${sy})`, transformOrigin: "0 0" },
      ], 0.9, 0.18, "linear"));
      play(final, [{ color: getComputedStyle(final).color }, { color: getComputedStyle(answer!).color }], 0.5, 0.12, OUT);
      hold(answer);
      // The dish arrives once its name has (HeroController).
      hold(panel?.querySelector(".panel__body"));
    } else {
      moves.push(play(say, [{ transform: "none" }, { transform: `translateY(${vh - tearY + 90}px) rotate(7deg)` }], 1, 0, FALL));
    }

    // The header and the phone's action bar come in after the landing.
    const bar = d.querySelector(".action-bar");
    hold(d.querySelector(".site-header"), [{ transform: "translateY(-100%)" }, { transform: "translateY(-100%)" }]);
    hold(bar, [{ transform: "translateY(calc(100% + 24px))" }, { transform: "translateY(calc(100% + 24px))" }]);

    let ended = false;
    const end = () => {
      if (ended) return;
      ended = true;
      holds.forEach((a) => a.cancel());
      finish(landLogo);
      d.querySelector(".site-header")?.animate([{ transform: "translateY(-100%)" }, { transform: "none" }], { duration: 700 * pace, easing: OUT });
      bar?.animate([{ transform: "translateY(calc(100% + 24px))" }, { transform: "none" }], { duration: 700 * pace, delay: 80 * pace, easing: OUT });
    };
    Promise.all(moves.map((a) => a?.finished)).then(end, end);
    window.setTimeout(end, 2500 * pace);
  }

  function finish(landed: boolean) {
    root!.dataset.state = "done";
    unblock();
    try {
      root!.getAnimations({ subtree: true }).forEach((a) => a.cancel());
    } catch {}
    window.dispatchEvent(new CustomEvent(cfg.done, { detail: { landed } }));
  }
}

const config: Config = { hydrated: LOADER_HYDRATED, done: LOADER_DONE, fallback: DEFAULT_ANSWER };

export const LOADER_SCRIPT = `(${kdLoader.toString()})(${JSON.stringify(config)});`;
