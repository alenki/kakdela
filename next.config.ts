import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

// `npm run build:lumako` sets STATIC_EXPORT=1 and NEXT_PUBLIC_BASE_PATH=/kakdela: a static site for plain
// Apache hosting under lumako.ru/kakdela (see scripts/postexport.mjs and docs/DEPLOY.md). No server there,
// so images ship as they are and the feedback form's server action is swapped for a stub that reports
// it could not send.
const staticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
// The English build (NEXT_PUBLIC_LOCALE=en, src/i18n/locale.ts) is the same site under /en: its base path
// ends in /en (`npm run dev:en`, and build:lumako's second pass), and in development it keeps a build
// folder of its own beside the Russian dev server's.
const english = process.env.NEXT_PUBLIC_LOCALE === "en";

// In development the two languages are two servers, both started by `npm run dev` (scripts/dev.mjs): the
// Russian one on :3000 passes /en on to the English one on :3001 (scripts/dev-en.mjs), and the English one
// passes everything outside /en back, so either port serves both languages and the switch between them.
const RU_DEV = "http://localhost:3000";
const EN_DEV = "http://localhost:3001";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85],
    unoptimized: staticExport,
  },
  ...(basePath && { basePath }),
  ...(english && !staticExport && { distDir: ".next-en" }),
  ...(staticExport && {
    output: "export",
    turbopack: {
      resolveAlias: { "@/app/feedback/actions": "./src/app/feedback/actions.static.ts" },
    },
  }),
};

export default function config(phase: string): NextConfig {
  if (phase !== PHASE_DEVELOPMENT_SERVER || staticExport) return nextConfig;
  if (!english && !basePath) {
    return {
      ...nextConfig,
      rewrites: async () => [
        { source: "/en", destination: `${EN_DEV}/en` },
        { source: "/en/:path*", destination: `${EN_DEV}/en/:path*` },
      ],
    };
  }
  if (english && basePath === "/en") {
    return {
      ...nextConfig,
      // A fallback runs only after the English pages have missed, and never takes /en itself (no loop).
      rewrites: async () => ({
        beforeFiles: [],
        afterFiles: [],
        fallback: [{ source: "/:path((?!en(?:/|$)).*)", destination: `${RU_DEV}/:path`, basePath: false }],
      }),
    };
  }
  return nextConfig;
}
