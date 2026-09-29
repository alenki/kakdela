// After `next build` with STATIC_EXPORT=1: fits `out/` to a plain Apache host under NEXT_PUBLIC_BASE_PATH.
// - CSS `url("/tex/…")` and `url("/brand/…")` point into public/ and don't get the base path from Next.
// - No .htaccess: lumako.ru (reg.ru) answered the whole site with its 403 page while one was there. So Apache
//   works as it does out of the box, and every page still loads: each is copied into its own folder as
//   index.html, where Apache's own slash redirect (/kakdela/about -> /kakdela/about/) lands, and the first
//   script in <head> keeps that slash out of Next's URLs (usePathname() would
//   say "/about/", which no page expects): it drops it from the address before Next reads it, and hides the
//   same redirect from the HEAD request an export's router sends before each client navigation, which would
//   otherwise make /about/ the new page's address.
import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

const OUT = "out";
const base = process.env.NEXT_PUBLIC_BASE_PATH || "";

async function* files(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* files(p);
    else yield p;
  }
}

// /kakdela/about/ -> /kakdela/about, before anything else runs; the base itself keeps its slash (/kakdela/ is
// the home page either way). Then a HEAD answered by a redirect that only adds a slash reads as not redirected.
// The script leaves the DOM once it has run, so hydration never meets it.
const UNSLASH =
  `<script>(function(){var b=${JSON.stringify(base)},p=location.pathname;` +
  `if(p.length>b.length+1&&p.charAt(p.length-1)==="/")history.replaceState(history.state,"",p.slice(0,-1)+location.search+location.hash);` +
  `var f=window.fetch;if(f)window.fetch=function(i,o){var r=f.apply(this,arguments);if(!o||o.method!=="HEAD")return r;` +
  `return r.then(function(s){if(!s.redirected)return s;var a=new URL(i instanceof Request?i.url:String(i),location.href),z=new URL(s.url);` +
  `return z.pathname===a.pathname+"/"&&z.search===a.search?new Response(null,{status:s.status,statusText:s.statusText,headers:s.headers}):s})};` +
  `document.currentScript.remove()})()</script>`;

let fixed = 0;
let unslashed = 0;
for await (const f of files(OUT)) {
  if (!/\.(css|html)$/.test(f)) continue;
  const src = await readFile(f, "utf8");
  let out = base ? src.replace(/url\((["']?)\/(tex|brand)\//g, `url($1${base}/$2/`) : src;
  if (out !== src) fixed++;
  if (f.endsWith(".html")) {
    out = out.replace("<head>", `<head>${UNSLASH}`);
    unslashed++;
  }
  if (out !== src) await writeFile(f, out);
}

// about.html -> about/index.html, privacy/consent.html -> privacy/consent/index.html. The home page and the
// 404s stay as they are.
let folded = 0;
for await (const f of files(OUT)) {
  const rel = relative(OUT, f).replace(/\\/g, "/");
  if (!rel.endsWith(".html") || /^(index|404|_not-found)\.html$/.test(rel)) continue;
  const to = join(OUT, rel.slice(0, -".html".length), "index.html");
  await mkdir(dirname(to), { recursive: true });
  await copyFile(f, to);
  folded++;
}

// Next writes a page's segment payloads nested (about/__next.about/__PAGE__.txt) but the client
// prefetches them dotted (about/__next.about.__PAGE__.txt): copy each to the dotted name too.
let flat = 0;
for await (const f of files(OUT)) {
  const parts = f.split(/[\\/]/);
  const i = parts.findIndex((p, k) => p.startsWith("__next.") && k < parts.length - 1);
  if (i < 0) continue;
  const dotted = join(...parts.slice(0, i), parts.slice(i).join("."));
  await copyFile(f, dotted);
  flat++;
}

console.log(
  `postexport: base "${base}", fixed asset urls in ${fixed} file(s), unslash script in ${unslashed} page(s), ` +
    `${folded} page(s) copied to folder/index.html, flattened ${flat} segment payload(s)`,
);
