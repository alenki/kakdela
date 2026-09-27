"use client";

import type { ComponentProps } from "react";
import { usePathname } from "next/navigation";
import { routes } from "@/content/routes";
import { RouteLink } from "./RouteLink";

/** A RouteLink that says so when it points at the page on show: aria-current="page" (the header's «Меню» on /menu). */
export function CurrentLink(props: ComponentProps<typeof RouteLink>) {
  const pathname = usePathname();
  const here = !props.hash && pathname === routes[props.to].href;
  return <RouteLink aria-current={here ? "page" : undefined} {...props} />;
}
