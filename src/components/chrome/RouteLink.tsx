import Link from "next/link";
import type { ComponentProps } from "react";
import { routes, type RouteKey } from "@/content/routes";

type Props = Omit<ComponentProps<typeof Link>, "href" | "prefetch"> & {
  to: RouteKey;
  /** An anchor on that page, without the «#»: `<RouteLink to="menu" hash="luchshe-vseh">`. */
  hash?: string;
};

/** Internal link through the routes config. Planned (unbuilt) pages are never prefetched. */
export function RouteLink({ to, hash, ...rest }: Props) {
  const r = routes[to];
  return <Link href={hash ? `${r.href}#${hash}` : r.href} prefetch={r.status === "live" ? undefined : false} {...rest} />;
}
