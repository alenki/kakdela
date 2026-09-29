// `npm run dev`: both languages at http://localhost:3000, Russian at the root and English at /en. The English
// site is a build of its own (src/i18n/locale.ts), so it runs as a second dev server on :3001
// (scripts/dev-en.mjs, its lines marked [en] here) and next.config.ts has :3000 pass /en on to it. If :3001
// is already taken, the English server is taken to be running. Arguments go to the Russian server.
import { spawn, spawnSync } from "node:child_process";
import { createConnection } from "node:net";

const running = await new Promise((resolve) => {
  const s = createConnection({ port: 3001, host: "localhost" }, () => (s.end(), resolve(true)));
  s.on("error", () => resolve(false));
});

let en = null;
if (running) console.log("[en] :3001 is taken: using the English server already running there");
else {
  en = spawn("node scripts/dev-en.mjs", { shell: true, detached: process.platform !== "win32" });
  const mark = (out) => (chunk) => out.write(String(chunk).replace(/^(?=.)/gm, "[en] "));
  en.stdout.on("data", mark(process.stdout));
  en.stderr.on("data", mark(process.stderr));
}

const stopEnglish = () => {
  if (!en || en.exitCode !== null) return;
  if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(en.pid), "/T", "/F"], { stdio: "ignore" });
  else process.kill(-en.pid, "SIGTERM");
};

const ru = spawn(["npx next dev", ...process.argv.slice(2)].join(" "), { stdio: "inherit", shell: true });
ru.on("exit", (code) => {
  stopEnglish();
  process.exit(code ?? 0);
});
for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, stopEnglish);
