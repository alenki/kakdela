"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LazyMotion, MotionConfig } from "motion/react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { kd } from "@/lib/store";
import { useMotionMode } from "@/lib/motion";
import { bindPour } from "@/components/chrome/pour-controller";

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
    // A phone's own bars change only the viewport's height (Telegram's in-app browser resizes the page
    // as its bar folds). The layout holds still (--vh, head-script.ts), and whatever still follows the
    // live viewport is no reason to refresh: a refresh ends by restoring the scroll, which throws the
    // page back and stops iOS's momentum dead. On touch, a height change just after such a resize is
    // taken for the bars; content, fonts and a turned phone still refresh.
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    let vw = window.innerWidth;
    let barsAt = -Infinity;
    const onResize = () => {
      if (window.innerWidth === vw) barsAt = performance.now();
      vw = window.innerWidth;
    };
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(() => {
      const h = height();
      if (Math.abs(h - lastH) <= 2) return;
      lastH = h;
      if (!fine && performance.now() - barsAt < 500) return;
      refresh();
    });
    blocks.forEach((el) => ro.observe(el));
    return () => {
      window.clearTimeout(t);
      document.fonts?.removeEventListener?.("loadingdone", refresh);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, [pathname]); // observe the new page's <main>/footer after navigation
}

/** The canvas takes the footer's ink while the footer is on screen, so overscrolling past it never flashes cream. */
function useFooterCanvas() {
  const pathname = usePathname();
  useEffect(() => {
    const root = document.documentElement;
    const footer = document.getElementById("footer");
    if (!footer) return;
    const io = new IntersectionObserver(([entry]) => {
      root.toggleAttribute("data-canvas-ink", entry.isIntersecting);
    });
    io.observe(footer);
    return () => {
      io.disconnect();
      root.removeAttribute("data-canvas-ink");
    };
  }, [pathname]); // observe the new page's footer after navigation
}

/** Motion follows the OS: keep a reduced-motion change made mid-visit in sync. */
function useOsMotionSync() {
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => kd.setMotion(mq.matches ? "reduced" : "full");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
}

type LoaderWindow = { __kdPush?: (href: string) => void; KDLoader?: { arrived: (path: string) => void } };

/**
 * The loading screen on page switches (docs/CONVENTIONS.md, «До краёв»). Its runtime catches the click on
 * a link to a page not yet shown, puts its cover up and pushes the route through the router lent here;
 * each page that arrives is reported back, so it knows when the new one is in.
 */
function useLoaderSwitch() {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    const w = window as unknown as LoaderWindow;
    w.__kdPush = (href) => router.push(href);
    return () => {
      delete w.__kdPush;
    };
  }, [router]);
  useEffect(() => {
    (window as unknown as LoaderWindow).KDLoader?.arrived(pathname);
  }, [pathname]);
}

/** The buttons' liquid pour, in full motion only; otherwise the stylesheet's flat level (an instant swap). */
function usePour(mode: "full" | "reduced") {
  useEffect(() => (mode === "full" ? bindPour() : undefined), [mode]);
}

export function Providers({ children }: { children: ReactNode }) {
  const mode = useMotionMode();
  useClock();
  useSmoothScroll(mode);
  usePour(mode);
  useScrollRefresh();
  useFooterCanvas();
  useOsMotionSync();
  useLoaderSwitch();
  return (
    <MotionConfig reducedMotion={mode === "reduced" ? "always" : "never"}>
      <LazyMotion features={loadFeatures} strict>
        {children}
      </LazyMotion>
    </MotionConfig>
  );
}
