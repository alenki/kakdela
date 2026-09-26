import Link from "next/link";
import type { ComponentProps } from "react";
import { routes, type RouteKey } from "@/content/routes";

type Props = Omit<ComponentProps<typeof Link>, "href" | "prefetch"> & { to: RouteKey };

/** Internal link through the routes config. Planned (unbuilt) pages are never prefetched. */
export function RouteLink({ to, ...rest }: Props) {
  const r = routes[to];
  return <Link href={r.href} prefetch={r.status === "live" ? undefined : false} {...rest} />;
}
