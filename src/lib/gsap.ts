"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase, DrawSVGPlugin);

// kd.out: entrances. kd.inOut: a list row moving to its new place. kd.peel: the old answer leaving.
// kd.settle: the new answer landing, and the tabs' first-visit sway. DrawSVG is for the coffee poster
// (the barista's pen, the steam, the hatched clover).
CustomEase.create("kd.out", "0.16,1,0.3,1");
CustomEase.create("kd.inOut", "0.65,0,0.35,1");
CustomEase.create("kd.peel", "0.32,0,0.67,0");
CustomEase.create("kd.settle", "M0,0 C0.18,0.9 0.32,1.04 1,1");
// kd.unroll: the «Разделы» sheet coming off the roll (menu-roll.ts). Quick off the mark, a hair (1.8%)
// past its rest, and back.
CustomEase.create("kd.unroll", "M0,0 C0.2,0.72 0.3,1.018 0.52,1.014 0.68,1.009 0.82,1 1,1");
// kd.rollup: the same sheet going back, quicker: it is moving from the first frame (its rip in sight
// at once) and the roll takes it up a little faster as it goes.
CustomEase.create("kd.rollup", "M0,0 C0.12,0.14 0.52,0.5 1,1");

ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger, useGSAP };
