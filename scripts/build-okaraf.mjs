// Static build for okaraf.com/kakdela: `npm run build:okaraf` -> out/ and kakdela-okaraf.zip.
// The lumako build turned around: English at the root (/kakdela/…), Russian nested at out/ru (/kakdela/ru/…).
// NEXT_PUBLIC_ROOT_LOCALE=en tells both builds which language is where (src/i18n/locale.ts), so the
// language switch links between them. No .htaccess in either: see scripts/postexport.mjs.
import { spawnSync } from "node:child_process";
import { renameSync, rmSync } from "node:fs";

const base = { ...process.env, STATIC_EXPORT: "1", NEXT_PUBLIC_ROOT_LOCALE: "en" };
const en = { ...base, NEXT_PUBLIC_LOCALE: "en", NEXT_PUBLIC_BASE_PATH: "/kakdela" };
const ru = { ...base, NEXT_PUBLIC_LOCALE: "ru", NEXT_PUBLIC_BASE_PATH: "/kakdela/ru" };
rmSync("out", { recursive: true, force: true });
rmSync("out-en", { recursive: true, force: true });
const run = (cmd, env) => {
  const r = spawnSync(cmd, { stdio: "inherit", shell: true, env });
  if (r.status !== 0) process.exit(r.status ?? 1);
};
run("npx next build", en);
run("node scripts/postexport.mjs", en);
renameSync("out", "out-en");
run("npx next build", ru);
run("node scripts/postexport.mjs", ru);
renameSync("out", "out-en/ru");
renameSync("out-en", "out");
rmSync("kakdela-okaraf.zip", { force: true });
run(
  process.platform === "win32"
    ? `"${process.env.SystemRoot}\\System32\\tar.exe" -a -c -f kakdela-okaraf.zip -C out .`
    : "cd out && zip -qr ../kakdela-okaraf.zip .",
  process.env,
);
console.log("kakdela-okaraf.zip: unpack into okaraf.com's site root as the folder kakdela/");
