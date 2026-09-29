type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Lays English words over a content module's own objects, in place, as the module loads (English build only,
 * so everything that imports the module, or holds one of its objects, reads English). A list is matched item
 * by item on `id` when the patch is keyed by ids; an object merges key by key; a list in the patch replaces
 * the list's contents (the same array, so every importer sees it); anything else (a string, a function) is
 * replaced. Prices, phones and coordinates are never in a patch.
 */
export function overlay(target: unknown, patch: Obj): void {
  if (Array.isArray(target)) {
    for (const [id, p] of Object.entries(patch)) {
      const item = target.find((x) => isObj(x) && x.id === id);
      if (!item) throw new Error(`content/en: no item «${id}»`);
      overlay(item, p as Obj);
    }
    return;
  }
  if (!isObj(target)) throw new Error("content/en: nothing to lay words over");
  for (const [k, p] of Object.entries(patch)) {
    const cur = target[k];
    if (isObj(p) && (isObj(cur) || Array.isArray(cur))) overlay(cur, p);
    else if (Array.isArray(p) && Array.isArray(cur)) cur.splice(0, cur.length, ...p);
    else target[k] = p;
  }
}
