"use client";

import { gsap, useGSAP } from "@/lib/gsap";
import { useMotionMode } from "@/lib/motion";

/**
 * Walks the street as the page scrolls (full motion only). The section gets data-drive: its stage sticks
 * under the header (CSS) and the wrapper around it grows by the street's overflow (--travel), so each
 * pixel scrolled down moves the street a pixel to the left. ScrollTrigger only reads the wrapper's
 * progress (no pin); one tween moves the track. The hairline through the signs draws itself once, as the
 * street comes into view, and the door being read is data-current (its caption in full ink, about.css).
 * Reduced motion, or before this runs: the row scrolls sideways on its own.
 */
export function StreetDrive() {
  const mode = useMotionMode();

  useGSAP(
    () => {
      if (mode !== "full" || document.documentElement.dataset.motion === "reduced") return;
      const root = document.getElementById("dveri");
      const drive = root?.querySelector<HTMLElement>("[data-street]");
      const stage = root?.querySelector<HTMLElement>("[data-street-stage]");
      const track = root?.querySelector<HTMLElement>("[data-street-track]");
      if (!root || !drive || !stage || !track) return;

      // Driven, the stage is no longer a scroller: it leaves the tab order and the landmarks.
      root.dataset.drive = "";
      stage.removeAttribute("tabindex");
      stage.removeAttribute("role");

      const doors = Array.from(track.querySelectorAll<HTMLElement>("[data-door]"));
      let travel = 0;
      let centres: number[] = [];
      const measure = () => {
        travel = Math.max(0, track.offsetWidth - stage.clientWidth);
        drive.style.setProperty("--travel", `${travel}px`);
        // Along the track (the door and the track move together, so the difference ignores the drive).
        const left = track.getBoundingClientRect().left;
        centres = doors.map((d) => {
          const r = d.getBoundingClientRect();
          return r.left - left + r.width / 2;
        });
      };
      measure();

      // The door being read: a point that walks from the first door's middle to the last one's as the
      // street goes by, so the first is lit when the street arrives and the last when it leaves.
      let current = -1;
      const mark = () => {
        const p = travel ? Math.min(1, Math.max(0, -Number(gsap.getProperty(track, "x")) / travel)) : 0;
        const at = centres[0] + p * (centres[centres.length - 1] - centres[0]);
        let best = 0;
        centres.forEach((c, i) => {
          if (Math.abs(c - at) < Math.abs(centres[best] - at)) best = i;
        });
        if (best === current) return;
        doors[current]?.removeAttribute("data-current");
        doors[best]?.setAttribute("data-current", "");
        current = best;
      };

      const header = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--header-h")) || 64;
      gsap.to(track, {
        x: () => -travel,
        ease: "none",
        onUpdate: mark,
        scrollTrigger: {
          trigger: drive,
          start: () => `top ${header()}px`,
          end: "bottom bottom",
          scrub: 0.4,
          invalidateOnRefresh: true,
          onRefreshInit: measure,
        },
      });
      mark();

      // The line of the question draws itself from the first sign on, once (only if it is still ahead).
      const line = root.querySelector<HTMLElement>("[data-street-line]");
      if (line && drive.getBoundingClientRect().top > window.innerHeight * 0.75) {
        gsap.from(line, {
          scaleX: 0,
          transformOrigin: "0% 50%",
          duration: 1.6,
          ease: "kd.inOut",
          clearProps: "transform",
          scrollTrigger: { trigger: drive, start: "top 75%", once: true },
        });
      }

      return () => {
        delete root.dataset.drive;
        stage.setAttribute("tabindex", "0");
        stage.setAttribute("role", "region");
        drive.style.removeProperty("--travel");
        doors[current]?.removeAttribute("data-current");
      };
    },
    { dependencies: [mode], revertOnUpdate: true },
  );

  return null;
}
