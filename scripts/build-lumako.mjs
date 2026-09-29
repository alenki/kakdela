// Static build for lumako.ru/kakdela (reg.ru shared hosting, Apache): `npm run build:lumako` -> out/.
// Built twice: Russian at the root, then the same code with NEXT_PUBLIC_LOCALE=en, nested at out/en
// (/kakdela/en/…). No .htaccess in either: see scripts/postexport.mjs.
import { spawnSync } from "node:child_process";
import { renameSync, rmSync } from "node:fs";

const ru = { ...process.env, STATIC_EXPORT: "1", NEXT_PUBLIC_BASE_PATH: "/kakdela" };
const en = { ...ru, NEXT_PUBLIC_LOCALE: "en", NEXT_PUBLIC_BASE_PATH: "/kakdela/en" };
rmSync("out", { recursive: true, force: true });
rmSync("out-ru", { recursive: true, force: true });
const run = (cmd, env = ru) => {
  const r = spawnSync(cmd, { stdio: "inherit", shell: true, env });
  if (r.status !== 0) process.exit(r.status ?? 1);
};
run("npx next build");
run("node scripts/postexport.mjs");
renameSync("out", "out-ru");
run("npx next build", en);
run("node scripts/postexport.mjs", en);
renameSync("out", "out-ru/en");
renameSync("out-ru", "out");
// One archive to upload and unpack in the hosting's file manager (Windows' own bsdtar, not Git's tar).
rmSync("kakdela-lumako.zip", { force: true });
run(process.platform === "win32"
  ? `"${process.env.SystemRoot}\\System32\\tar.exe" -a -c -f kakdela-lumako.zip -C out .`
  : "cd out && zip -qr ../kakdela-lumako.zip .");
console.log("kakdela-lumako.zip: unpack into lumako.ru's site root as the folder kakdela/ (see docs/DEPLOY.md)");
