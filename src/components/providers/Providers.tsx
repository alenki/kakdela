"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LazyMotion, MotionConfig } from "motion/react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { kd } from "@/lib/store";
import { useMotionMode } from "@/lib/motion";
import { markHydrated } from "@/lib/loader";

const loadFeatures = () => import("./motion-features").then((m) => m.default);

/** One shared minute clock (Moscow time) for every status line on the page. */
function useClock() {
  useEffect(() => {
    kd.tick();
    let interval: number | undefined;
    const align = window.setTimeout(() => {
      kd.tick();
      interval = window.setInterval(() => kd.tick(), 60_000);
    }, (60 - new Date().getSeconds()) * 1000);
    return () => {
      window.clearTimeout(align);
      window.clearInterval(interval);
    };
  }, []);
}

/** Lenis on fine pointers only, driven by GSAP's ticker; rebuilt when the motion mode changes. */
function useSmoothScroll(mode: "full" | "reduced") {
  useEffect(() => {
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (mode !== "full" || !fine) return;
    const lenis = new Lenis({ autoRaf: false, lerp: 0.1, smoothWheel: true, anchors: true, stopInertiaOnNavigate: true });
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    lenis.on("scroll", ScrollTrigger.update);
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;
    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, [mode]);
}

/** Keep ScrollTrigger honest when fonts swap in or content changes height. */
function useScrollRefresh() {
  const pathname = usePathname();
  useEffect(() => {
    let t: number | undefined;
    const refresh = () => {
      window.clearTimeout(t);
      t = window.setTimeout(() => ScrollTrigger.refresh(), 180);
    };
    document.fonts?.ready.then(refresh);
    document.fonts?.addEventListener?.("loadingdone", refresh);
    // The page's content: <main> plus the footer that follows it (the contentinfo landmark).
    const blocks = [document.getElementById("main"), document.getElementById("footer")].filter((el): el is HTMLElement => !!el);
    const height = () => blocks.reduce((sum, el) => sum + el.offsetHeight, 0);
    let lastH = height();
    const ro = new ResizeObserver(() => {
      const h = height();
      if (Math.abs(h - lastH) > 2) {
        lastH = h;
        refresh();
      }
    });
    blocks.forEach((el) => ro.observe(el));
    return () => {
      window.clearTimeout(t);
      document.fonts?.removeEventListener?.("loadingdone", refresh);
      ro.disconnect();
    };
  }, [pathname]); // observe the new page's <main>/footer after navigation
}

/** Keep OS-level reduced-motion changes in sync when the guest hasn't chosen explicitly. */
function useOsMotionSync() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => {
      let explicit: string | null = null;
      try { explicit = localStorage.getItem("kd-motion"); } catch {}
      if (!explicit) {
        document.documentElement.dataset.motion = mq.matches ? "reduced" : "full";
        kd.set({ motion: mq.matches ? "reduced" : "full" });
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
}

export function Providers({ children }: { children: ReactNode }) {
  const mode = useMotionMode();
  // The loading screen waits for this before it tears away (the page is interactive by then).
  useEffect(() => markHydrated(), []);
  useClock();
  useSmoothScroll(mode);
  useScrollRefresh();
  useOsMotionSync();
  return (
    <MotionConfig reducedMotion={mode === "reduced" ? "always" : "never"}>
      <LazyMotion features={loadFeatures} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
