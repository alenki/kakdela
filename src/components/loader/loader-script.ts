// «До краёв»: the loading screen (docs/CONVENTIONS.md, «До краёв: the loader»). Its code is minified from
// assets-src/loader/*.js into loader-code.ts by scripts/build-loader.mjs; here it gets the site's own pages
// (a click on a link to one of them is a page switch, which pours too) and the build's base path. The root
// layout inlines it in <head>, right after HEAD_SCRIPT, which decides whether a load's show runs.
import { routes } from "@/content/routes";
import { LOADER_CODE } from "./loader-code";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const ROUTES = [...new Set(Object.values(routes).map((r) => r.href.split("#")[0]))];

export const LOADER_SCRIPT = LOADER_CODE.replace(/__KD_ROUTES__/g, JSON.stringify(ROUTES)).replace(/__KD_BASE__/g, JSON.stringify(BASE));
