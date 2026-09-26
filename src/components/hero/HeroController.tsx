"use client";

import { useEffect, useRef } from "react";
import { gsap, SplitText } from "@/lib/gsap";
import { answerById, answers, DEFAULT_ANSWER } from "@/content/answers";
import type { AnswerId } from "@/content/types";
import { kd } from "@/lib/store";
import { useMotionMode } from "@/lib/motion";
import { rubSpoken } from "@/lib/format";
import { mulberry32, hashString } from "@/lib/seed";

const TEAR_AT = 64; // px of downward pull that rips the tab
const TENSION = 0.35;

type Source = "pointer" | "drag" | "key-arrow" | "key" | "init";

/**
 * Brings the notice to life: tearing tabs (drag, click, tap, Space), the three-beat answer scene,
 * the all-torn/reprint loop and the first-visit logo assembly. Markup and content stay
 * server-rendered; this only toggles data attributes and animates between siblings.
 */
export function HeroController() {
  const mode = useMotionMode();
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const hero = document.getElementById("hero");
    const pad = hero?.querySelector<HTMLElement>("[data-pad]");
    if (!hero || !pad) return;
    const live = hero.querySelector<HTMLElement>("[data-live]");
    const empty = hero.querySelector<HTMLElement>("[data-empty]");
    const reduced = () => modeRef.current === "reduced";

    const panelOf = (id: string) => hero.querySelector<HTMLElement>(`[data-panel="${id}"]`);
    const tabOf = (id: string) => hero.querySelector<HTMLElement>(`[data-tab="${id}"]`);
    const inputOf = (id: string) => document.getElementById(`ans-${id}`) as HTMLInputElement | null;

    // ── Initial state from the pre-paint script ──
    // On a client-side navigation back to "/", React renders the hero without running the inline
    // pad script, so fall back to html[data-answer] and sync the radio ourselves.
    const checked = pad.querySelector<HTMLInputElement>(".tab__input:checked");
    const fromHtml = document.documentElement.dataset.answer;
    let active: AnswerId = (checked?.value as AnswerId) ?? (fromHtml && fromHtml in answerById ? (fromHtml as AnswerId) : DEFAULT_ANSWER);
    const activeInput = inputOf(active);
    if (activeInput) activeInput.checked = true;
    hero.dataset.js = "";
    panelOf(active)?.setAttribute("data-active", "");
    tabOf(active)?.setAttribute("data-current", "");
    if (document.documentElement.dataset.guess === "1") hero.dataset.guess = "";
    kd.set({ answer: active, guessed: document.documentElement.dataset.guess === "1" });

    let scene: gsap.core.Timeline | null = null;
    let split: SplitText | null = null;
    const torn = new Set<AnswerId>();
    let firstTear = true;

    // ── Beat choreography ──
    function show(id: AnswerId, source: Source) {
      if (id === active && source !== "init") return;
      scene?.progress(1);
      split?.revert();
      split = null;
      const prev = panelOf(active);
      const next = panelOf(id);
      if (!next) return;
      tabOf(active)?.removeAttribute("data-current");
      tabOf(id)?.setAttribute("data-current", "");
      active = id;

      const a = answerById[id];

      if (prev && prev !== next) {
        prev.removeAttribute("data-active");
        if (!reduced()) {
          prev.setAttribute("data-leaving", "");
          gsap.fromTo(prev, { opacity: 1 }, {
            opacity: 0, duration: 0.22, ease: "kd.peel",
            onComplete: () => { prev.removeAttribute("data-leaving"); gsap.set(prev, { clearProps: "opacity" }); },
          });
        }
      }
      // Coming back before its leave fade finished (A→B→A): stop that fade first.
      gsap.killTweensOf(next, "opacity");
      next.removeAttribute("data-leaving");
      gsap.set(next, { clearProps: "opacity" });
      next.setAttribute("data-active", "");
      if (reduced()) return;

      const word = next.querySelector<HTMLElement>("[data-word]");
      const dash = next.querySelector<HTMLElement>(".panel__a .dash");
      const photo = next.querySelector<HTMLElement>("[data-photo]");
      const receipt = next.querySelector<HTMLElement>("[data-receipt]");
      const reply = next.querySelector<HTMLElement>("[data-reply]");
      const more = next.querySelector<HTMLElement>(".panel__more");

      scene = gsap.timeline({ defaults: { ease: "kd.out" } });
      // Beat 1 — the answer lands heavy (0–0.6s).
      if (word) {
        scene.fromTo(word,
          { fontWeight: 180, letterSpacing: "0.06em", opacity: 0, yPercent: 14, skewX: 0, scaleY: 1 },
          { fontWeight: a.posture.weight, letterSpacing: "-0.005em", opacity: 1, yPercent: 0, skewX: a.posture.skewX, scaleY: a.posture.scaleY, duration: 0.62, ease: "kd.settle", clearProps: "fontWeight,letterSpacing,transform" },
          0);
      }
      if (dash) scene.fromTo(dash, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 0.45 }, 0);
      // Beat 2 — the dish and its price (0.35–0.95s).
      if (photo) scene.fromTo(photo, { scale: 0.86, rotate: -9, opacity: 0 }, { scale: 1, rotate: -2, opacity: 1, duration: 0.7, clearProps: "scale,opacity" }, 0.3);
      if (receipt) scene.fromTo(receipt, { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.5, clearProps: "all" }, 0.4);
      // Beat 3 — the café replies (0.6–1.1s).
      if (reply) {
        split = SplitText.create(reply, { type: "words", aria: "none" });
        scene.fromTo(split.words, { opacity: 0, yPercent: 60 }, { opacity: 1, yPercent: 0, duration: 0.5, stagger: 0.022 }, 0.6);
        scene.call(() => { split?.revert(); split = null; });
      }
      if (more) scene.fromTo(more, { opacity: 0 }, { opacity: 1, duration: 0.4, clearProps: "opacity" }, 0.85);
    }

    // ── Tearing ──
    const layer = document.createElement("div");
    layer.className = "tear-layer";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);

    function tear(id: AnswerId, vx = 0, vy = 0) {
      const tab = tabOf(id);
      const paper = tab?.querySelector<HTMLElement>("[data-tab-paper]");
      if (!tab || !paper || torn.has(id)) return;
      torn.add(id);
      kd.set({ torn: [...torn] });
      if (firstTear) {
        firstTear = false;
        hero!.dataset.first = "";
      }
      delete hero!.dataset.guess;

      if (!reduced()) {
        const rect = paper.getBoundingClientRect();
        const clone = paper.cloneNode(true) as HTMLElement;
        clone.removeAttribute("data-tab-paper");
        clone.classList.add("tab__paper--falling");
        clone.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;clip-path:${tab.style.getPropertyValue("--piece")};`;
        layer.appendChild(clone);
        const rnd = mulberry32(hashString(id) + torn.size);
        const spin = (rnd() - 0.5) * 32 + vx * 0.012;
        gsap.set(clone, { transformPerspective: 700, transformOrigin: "50% 0%" });
        gsap.to(clone, {
          y: window.innerHeight - rect.top + 80 + Math.max(0, vy) * 0.05,
          x: vx * 0.18 + (rnd() - 0.5) * window.innerWidth * 0.06,
          rotation: spin,
          duration: 1.05,
          ease: "power2.in",
          onComplete: () => clone.remove(),
        });
        gsap.to(clone, { rotationX: 22, duration: 0.16, yoyo: true, repeat: 5, ease: "sine.inOut" });
        gsap.to(clone, { opacity: 0, duration: 0.3, delay: 0.78 });
        gsap.fromTo(pad!, { x: -1.5 }, { x: 0, duration: 0.08, repeat: 1, yoyo: true, clearProps: "x" });
      }
      gsap.set(paper, { clearProps: "transform" });
      tab.setAttribute("data-torn", "");

      if (torn.size === answers.length && empty) {
        window.setTimeout(() => {
          empty.hidden = false;
          if (!reduced()) gsap.fromTo(empty, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.6, ease: "kd.out" });
        }, reduced() ? 0 : 650);
      }
    }

    /** «Сонно — Эспрессо-тоник, 290 рублей». Every answer is announced, including a tear of the
     *  pre-selected guess, where show() has nothing to redraw. */
    let announceTimer = 0;
    function announce(id: AnswerId) {
      if (!live) return;
      const a = answerById[id];
      const price = a.item.price[kd.get().city];
      const text = `${a.label} — ${a.item.name}${price != null ? `, ${rubSpoken(price)}` : ""}`;
      // Same words again (tearing the answer already shown): clear first so it is re-announced.
      if (live.textContent === text) live.textContent = "";
      window.clearTimeout(announceTimer);
      announceTimer = window.setTimeout(() => { live.textContent = text; }, 50);
    }

    function select(id: AnswerId, source: Source, vx = 0, vy = 0) {
      delete hero!.dataset.guess;
      if (source === "key-arrow") {
        // Browsing with the arrows previews an answer; only a tear (Space, click, drag) is remembered.
        kd.preview(id);
      } else {
        tear(id, vx, vy);
        kd.answer(id);
      }
      announce(id);
      show(id, source);
      revealOnPhone(id);
    }

    // On phones the answer sits under the notice: after a tear, nudge it into view (never past the tabs).
    function revealOnPhone(id: AnswerId) {
      if (window.matchMedia("(min-width: 1024px)").matches) return;
      const panel = panelOf(id);
      if (!panel) return;
      const r = panel.getBoundingClientRect();
      const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 56;
      const overflow = r.bottom - (window.innerHeight - 72);
      if (overflow <= 0) return;
      const maxUp = r.top - header - 12;
      window.scrollBy({ top: Math.min(overflow, Math.max(0, maxUp)), behavior: reduced() ? "auto" : "smooth" });
    }

    // Native radio changes: click/tap on a tab label, Space, arrow keys.
    let lastKey = "";
    let lastKeyAt = 0;
    const onKeyDown = (e: KeyboardEvent) => { lastKey = e.key; lastKeyAt = performance.now(); };
    const onChange = (e: Event) => {
      const input = e.target as HTMLInputElement;
      if (!input.matches(".tab__input")) return;
      const recentKey = performance.now() - lastKeyAt < 250;
      const arrow = recentKey && lastKey.startsWith("Arrow");
      select(input.value as AnswerId, arrow ? "key-arrow" : recentKey ? "key" : "pointer");
    };
    // Space/Enter on an already-selected tab still tears it.
    const onKeyUp = (e: KeyboardEvent) => {
      const input = e.target as HTMLInputElement;
      if (!input.matches?.(".tab__input") || (e.key !== " " && e.key !== "Enter")) return;
      if (input.checked && !torn.has(input.value as AnswerId)) select(input.value as AnswerId, "key");
    };
    pad.addEventListener("keydown", onKeyDown);
    pad.addEventListener("keyup", onKeyUp);
    pad.addEventListener("change", onChange);

    // Desktop pull-to-tear on fine pointers.
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let drag: { id: AnswerId; tab: HTMLElement; paper: HTMLElement; x0: number; y0: number; t: number; lx: number; ly: number; vx: number; vy: number; on: boolean } | null = null;
    let suppressClick = false;

    const onPointerDown = (e: PointerEvent) => {
      if (!fine || e.button !== 0 || reduced()) return;
      // Touch on hybrid devices scrolls the page; only mouse/pen pull the tab.
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      const tab = (e.target as HTMLElement).closest<HTMLElement>(".tab");
      if (!tab) return;
      const id = tab.dataset.tab as AnswerId;
      if (torn.has(id)) return;
      const paper = tab.querySelector<HTMLElement>("[data-tab-paper]")!;
      drag = { id, tab, paper, x0: e.clientX, y0: e.clientY, t: performance.now(), lx: e.clientX, ly: e.clientY, vx: 0, vy: 0, on: false };
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!drag) return;
      const dy = e.clientY - drag.y0, dx = e.clientX - drag.x0;
      const now = performance.now(), dt = Math.max(1, now - drag.t);
      drag.vx = ((e.clientX - drag.lx) / dt) * 1000;
      drag.vy = ((e.clientY - drag.ly) / dt) * 1000;
      drag.lx = e.clientX; drag.ly = e.clientY; drag.t = now;
      if (!drag.on && Math.abs(dy) > 4) {
        drag.on = true;
        drag.tab.setPointerCapture?.(e.pointerId);
        drag.tab.dataset.pulling = "";
      }
      if (!drag.on) return;
      e.preventDefault();
      if (dy >= TEAR_AT) {
        const d = drag;
        drag = null;
        suppressClick = true;
        delete d.tab.dataset.pulling;
        const input = inputOf(d.id);
        if (input) input.checked = true;
        select(d.id, "drag", d.vx, d.vy);
        return;
      }
      const pull = Math.max(0, dy) * TENSION;
      const rot = Math.max(-4, Math.min(4, dx * 0.08));
      gsap.set(drag.paper, { y: pull, rotation: rot, transformOrigin: "50% 0%" });
    };
    const onPointerUp = () => {
      if (!drag) return;
      if (drag.on) {
        suppressClick = true;
        delete drag.tab.dataset.pulling;
        gsap.to(drag.paper, { y: 0, rotation: 0, duration: 0.35, ease: "kd.out", clearProps: "transform" });
      }
      drag = null;
    };
    const onPointerCancel = () => {
      if (!drag) return;
      delete drag.tab.dataset.pulling;
      gsap.to(drag.paper, { y: 0, rotation: 0, duration: 0.3, ease: "kd.out", clearProps: "transform" });
      drag = null;
    };
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (suppressClick) {
        suppressClick = false;
        if (target.closest(".tab")) e.preventDefault();
        return;
      }
      // Clicking the tab that is already checked (the time-of-day guess, or after a reprint) fires
      // no change event, so tear it here. Unchecked tabs are handled by onChange.
      const tab = target.closest<HTMLElement>(".tab");
      if (!tab || target.matches(".tab__input")) return;
      const input = tab.querySelector<HTMLInputElement>(".tab__input");
      const id = tab.dataset.tab as AnswerId;
      if (input?.checked && !torn.has(id)) select(id, "pointer");
    };
    pad.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerCancel);
    pad.addEventListener("click", onClick, true);

    // Reprint the notice when every answer has been taken.
    const reprint = hero.querySelector<HTMLButtonElement>("[data-reprint]");
    const onReprint = () => {
      torn.clear();
      kd.resetTorn();
      if (empty) empty.hidden = true;
      const papers = Array.from(hero.querySelectorAll<HTMLElement>(".tab"));
      papers.forEach((t) => t.removeAttribute("data-torn"));
      if (!reduced()) {
        gsap.fromTo(papers.map((t) => t.querySelector("[data-tab-paper]")), { yPercent: -100 }, { yPercent: 0, duration: 0.7, stagger: 0.04, ease: "kd.out", clearProps: "transform" });
      }
      inputOf(active)?.focus();
    };
    reprint?.addEventListener("click", onReprint);

    // ── First-visit logo assembly (≤1.4s, skippable) ──
    let intro: gsap.core.Timeline | null = null;
    const html = document.documentElement;
    const skip = () => intro?.progress(1);
    if (html.classList.contains("intro") && !reduced()) {
      const logo = hero.querySelector<SVGSVGElement>(".notice__logo");
      const q = (sel: string) => Array.from(logo?.querySelectorAll<SVGElement>(sel) ?? []);
      const hatchWrap = hero.querySelector<HTMLElement>(".notice__hatch");
      const hatch = Array.from(hatchWrap?.querySelectorAll<SVGPathElement>("[data-hatch]") ?? []);
      intro = gsap.timeline({
        defaults: { ease: "kd.out" },
        onComplete: () => {
          try { sessionStorage.setItem("kd-intro", "1"); } catch {}
          gsap.set(hatchWrap, { autoAlpha: 0 });
        },
      });
      intro
        .fromTo(q('[data-part="oct"]'), { drawSVG: "0%", opacity: 1 }, { drawSVG: "100%", duration: 0.6, ease: "kd.inOut" }, 0)
        .fromTo(hatchWrap, { autoAlpha: 1 }, { autoAlpha: 1, duration: 0.01 }, 0)
        .fromTo(hatch, { drawSVG: "0%" }, { drawSVG: "100%", duration: 0.28, stagger: 0.01 }, 0.1)
        .fromTo(q('[data-part="clover"]'), { opacity: 0, scale: 0.92, transformOrigin: "50% 45%" }, { opacity: 1, scale: 1, duration: 0.4 }, 0.55)
        .to(hatchWrap, { autoAlpha: 0, duration: 0.3 }, 0.85)
        .fromTo(q('[data-part="kak"] path').reverse(), { x: 90, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, stagger: 0.06 }, 0.3)
        .fromTo(q('[data-part="dela"] path'), { x: -90, opacity: 0 }, { x: 0, opacity: 1, duration: 0.8, stagger: 0.06 }, 0.3)
        .fromTo(q('[data-part="kofe"] path, [data-part="zavtraki"] path'), { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.02 }, 0.6)
        .fromTo(hero.querySelectorAll(".tab__paper"), { yPercent: -8, rotation: (i: number) => (i % 2 ? 2 : -2) }, { yPercent: 0, rotation: 0, duration: 0.9, stagger: 0.035, ease: "kd.settle", clearProps: "transform" }, 0.7);
      html.classList.remove("intro");
      window.addEventListener("wheel", skip, { once: true, passive: true });
      window.addEventListener("touchstart", skip, { once: true, passive: true });
      window.addEventListener("keydown", skip, { once: true });
      window.addEventListener("pointerdown", skip, { once: true });
    } else {
      html.classList.remove("intro");
    }

    // Warm the other answer photos once the page is idle (so a tear never shows an empty frame).
    const warm = () => {
      hero.querySelectorAll<HTMLImageElement>(".panel .oct-photo__img").forEach((img) => {
        if (img.complete && img.naturalWidth) return;
        const pre = new Image();
        pre.sizes = img.sizes;
        pre.srcset = img.srcset;
        pre.src = img.src;
      });
    };
    const ric = typeof window.requestIdleCallback === "function";
    const idle = ric ? window.requestIdleCallback(warm, { timeout: 4000 }) : window.setTimeout(warm, 2500);

    return () => {
      window.clearTimeout(announceTimer);
      scene?.progress(1).kill();
      // Strict-mode remount (dev) or unmount mid-intro: revert and let the next mount replay it.
      if (intro && intro.progress() < 1) {
        intro.revert();
        html.classList.add("intro");
      } else intro?.kill();
      split?.revert();
      layer.remove();
      pad.removeEventListener("keydown", onKeyDown);
      pad.removeEventListener("keyup", onKeyUp);
      pad.removeEventListener("change", onChange);
      pad.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerCancel);
      pad.removeEventListener("click", onClick, true);
      reprint?.removeEventListener("click", onReprint);
      window.removeEventListener("wheel", skip);
      window.removeEventListener("touchstart", skip);
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
      if (ric) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      delete hero.dataset.js;
    };
  }, []);

  return null;
}
