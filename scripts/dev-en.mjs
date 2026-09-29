// The English dev server alone: `npm run dev:en` -> http://localhost:3001/en. `npm run dev` starts it too
// (scripts/dev.mjs), and the Russian server on :3000 passes /en on to it.
// Same code, NEXT_PUBLIC_LOCALE=en (src/i18n/locale.ts); next.config.ts gives it the /en base path.
import { spawn } from "node:child_process";

const env = { ...process.env, NEXT_PUBLIC_LOCALE: "en", NEXT_PUBLIC_BASE_PATH: "/en" };
spawn("npx next dev -p 3001", { stdio: "inherit", shell: true, env }).on("exit", (code) => process.exit(code ?? 0));
