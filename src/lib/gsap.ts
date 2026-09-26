"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, DrawSVGPlugin, CustomEase);

// Three motion verbs: ASK (light, gathering), ANSWER (heavy settle, tiny overshoot), PRINT (from the left).
CustomEase.create("kd.out", "0.16,1,0.3,1");
CustomEase.create("kd.inOut", "0.65,0,0.35,1");
CustomEase.create("kd.peel", "0.32,0,0.67,0");
CustomEase.create("kd.settle", "M0,0 C0.18,0.9 0.32,1.04 1,1");

ScrollTrigger.config({ ignoreMobileResize: true });

let draggable: Promise<typeof import("gsap/Draggable")["Draggable"]> | null = null;

/** Draggable + Inertia only load when the guest reaches for a tab. */
export function loadDraggable() {
  draggable ??= Promise.all([import("gsap/Draggable"), import("gsap/InertiaPlugin")]).then(([d, i]) => {
    gsap.registerPlugin(d.Draggable, i.InertiaPlugin);
    return d.Draggable;
  });
  return draggable;
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
