"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(useGSAP, ScrollTrigger, CustomEase);

// kd.out: entrances. kd.inOut: a list row moving to its new place. kd.peel: the old answer leaving.
// kd.settle: the new answer landing, and the tabs' first-visit sway.
CustomEase.create("kd.out", "0.16,1,0.3,1");
CustomEase.create("kd.inOut", "0.65,0,0.35,1");
CustomEase.create("kd.peel", "0.32,0,0.67,0");
CustomEase.create("kd.settle", "M0,0 C0.18,0.9 0.32,1.04 1,1");

ScrollTrigger.config({ ignoreMobileResize: true });

export { gsap, ScrollTrigger, useGSAP };
