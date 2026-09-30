"use client";

import { useEffect, useRef } from "react";
import { gsap } from "@/lib/gsap";
import { answerById } from "@/content/answers";
import type { AnswerId } from "@/content/types";
import { kd } from "@/lib/store";
import { useMotionMode } from "@/lib/motion";
import { rubSpoken } from "@/lib/format";

/**
 * «А у вас?»: the guest's pick is remembered as if torn off the notice (kd.answer: the homepage's hero and
 * team show it); browsing the slips with the arrow keys only previews
 * (kd.preview), as on the notice. The reply is announced («Сонно: Эспрессо-тоник, 290 рублей») and, in full
 * motion, its lines rise in. The markup and the choice itself work without this (about.css).
 */
export function BackController() {
  const mode = useMotionMode();
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const root = document.getElementById("a-u-vas");
    const group = root?.querySelector<HTMLElement>("[data-ab-pick]");
    if (!root || !group) return;
    const live = root.querySelector<HTMLElement>("[data-back-live]");
    const input = (id: string) => document.getElementById(`back-${id}`) as HTMLInputElement | null;

    // A client-side visit doesn't run BACK_SCRIPT: choose today's answer here.
    const html = document.documentElement.dataset;
    if (html.answer && !html.guess && !group.querySelector("input:checked")) {
      const el = input(html.answer);
      if (el) el.checked = true;
    }

    let timer = 0;
    const announce = (id: AnswerId) => {
      if (!live) return;
      const a = answerById[id];
      const price = a.item.price[kd.get().city];
      const text = `${a.label}: ${a.item.name}${price != null ? `, ${rubSpoken(price)}` : ""}`;
      if (live.textContent === text) live.textContent = "";
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        live.textContent = text;
      }, 50);
    };

    const land = (id: AnswerId) => {
      if (modeRef.current !== "full") return;
      const reply = root.querySelector<HTMLElement>(`[data-reply="${id}"]`);
      if (reply) {
        gsap.fromTo(
          reply.children,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: "kd.out", overwrite: true, clearProps: "opacity,transform" },
        );
      }
    };

    let lastKey = "";
    let lastKeyAt = 0;
    const onKeyDown = (e: KeyboardEvent) => {
      lastKey = e.key;
      lastKeyAt = performance.now();
    };
    const choose = (el: HTMLInputElement) => {
      const id = el.value as AnswerId;
      if (!(id in answerById)) return;
      const arrow = performance.now() - lastKeyAt < 250 && lastKey.startsWith("Arrow");
      if (arrow) kd.preview(id);
      else kd.answer(id);
      announce(id);
    };
    const onChange = (e: Event) => {
      const el = e.target as HTMLInputElement;
      if (!el.matches(".ab-pick__input")) return;
      choose(el);
      land(el.value as AnswerId);
    };
    // A click on the slip that is already chosen (today's answer, or one browsed to with the arrows)
    // fires no change: make it the answer all the same.
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLInputElement;
      if (!el.matches?.(".ab-pick__input") || !el.checked) return;
      if (document.documentElement.dataset.answer === el.value && !document.documentElement.dataset.guess) return;
      choose(el);
    };
    group.addEventListener("keydown", onKeyDown);
    group.addEventListener("change", onChange);
    group.addEventListener("click", onClick);
    return () => {
      window.clearTimeout(timer);
      group.removeEventListener("keydown", onKeyDown);
      group.removeEventListener("change", onChange);
      group.removeEventListener("click", onClick);
    };
  }, []);

  return null;
}
