import type { MetadataRoute } from "next";
import { routes } from "@/content/routes";

export const dynamic = "force-static";

const BASE = "https://www.kakdelacoffee.ru";

// Only live routes are listed; planned pages join as they ship.
export default function sitemap(): MetadataRoute.Sitemap {
  return Object.values(routes)
    .filter((r) => r.status === "live" && !r.href.includes("#"))
    .map((r) => ({ url: `${BASE}${r.href}`, changeFrequency: "weekly", priority: r.href === "/" ? 1 : 0.7 }));
}
