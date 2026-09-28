import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { blankCaption, brief, consent, consentBlanks, consentIntro, deviceStorage, EDITION, EDITION_LABEL, operator, policy, type Clause } from "@/content/privacy";
import { routes } from "@/content/routes";
import { ru } from "@/i18n/ru";

const SRC = path.resolve(__dirname, "..");
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((f) => {
    const p = path.join(dir, f);
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx)$/.test(f) && !/\.test\.ts$/.test(f) ? [p] : [];
  });
const code = files(SRC)
  .filter((f) => !f.includes(`${path.sep}content${path.sep}privacy.ts`))
  .map((f) => readFileSync(f, "utf8"))
  .join("\n");

/** Every sentence of a document, flattened. */
const text = (clauses: Clause[]) =>
  clauses.flatMap((c) => [c.title, ...c.body.flatMap((b) => (typeof b === "string" ? [b] : "list" in b ? b.list : b.table.rows.flat()))]);
const all = [...text(policy), ...text(consent), consentIntro, ...brief];

describe("the policy tells the truth about the browser", () => {
  it("lists exactly the keys the site keeps in the browser", () => {
    // Every storage key in the code is a "kd-…" literal (store.ts, head-script.ts, puzzle.ts, runner-best.ts,
    // HeroController.tsx); a new one must join the policy's table, and a dropped one leave it.
    const inCode = new Set([...code.matchAll(/["'`](kd-[a-z]+)["'`]/g)].map((m) => m[1]));
    expect(inCode).toEqual(new Set(deviceStorage.map((d) => d.key)));
    // And the site keeps nothing else there: every write goes through one of those keys.
    for (const m of code.matchAll(/(?:local|session)Storage\.setItem\(\s*([^,]+),/g)) {
      expect(m[1]).toMatch(/^["'`]kd-[a-z]+["'`]$|^(SAVE_KEY|BEST_KEY)$/);
    }
  });
  it("says so when the site starts setting cookies or calling out", () => {
    expect(code).not.toMatch(/document\.cookie|cookies\(\)\.set/);
    expect(code).not.toMatch(/mc\.yandex|metrika|gtag\(|googletagmanager|<iframe/i);
    // The browser's position is only ever asked for on the «Какая ближе ко мне?» click.
    expect(code.match(/geolocation\.getCurrentPosition/g)).toHaveLength(1);
  });
  it("never sends a note abroad: no foreign delivery left in the form's action", () => {
    const action = readFileSync(path.join(SRC, "app/feedback/actions.ts"), "utf8");
    expect(action).not.toMatch(/api\.telegram\.org|t\.me\//);
    expect(action).toMatch(/EDITION_LABEL/);
  });
});

describe("the documents", () => {
  it("fill in only the operator's known details", () => {
    for (const line of all) {
      for (const [, key] of line.matchAll(/\{(\w+)\}/g)) expect(Object.hasOwn(operator, key)).toBe(true);
    }
    expect(Object.keys(blankCaption).sort()).toEqual(Object.keys(operator).sort());
  });
  it("keep the house rules: no dashes, «ёлочки», no stray spaces", () => {
    for (const line of all) {
      expect(line).not.toMatch(/[—–]/);
      expect(line).not.toMatch(/"/);
      expect(line).not.toMatch(/\s{2,}|^\s|\s$/);
    }
  });
  it("carry one edition, and are live pages", () => {
    const [y, m, d] = EDITION.split("-").map(Number);
    const month = ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"][m - 1];
    expect(EDITION_LABEL).toBe(`${d} ${month} ${y} года`);
    expect(routes.privacy).toEqual({ href: "/privacy", status: "live" });
    expect(routes.consent).toEqual({ href: "/privacy/consent", status: "live" });
  });
  it("say the same things in the policy and the consent", () => {
    const flat = (c: Clause[]) => text(c).join(" ");
    for (const fact of [/не дольше одного года/, /в течение 30 дней/, /Трансграничная передача (персональных данных )?не осуществляется/, /на (её )?территории/]) {
      expect(flat(policy)).toMatch(fact);
      expect(flat(consent)).toMatch(fact);
    }
    // The consent is its own document: the policy only points to it.
    expect(flat(policy)).not.toContain("даю согласие");
    expect(consentIntro).toContain("даю согласие");
  });
  it("are linked beside the consent box, by the names the documents carry", () => {
    const desk = readFileSync(path.join(SRC, "components/feedback/NoteDesk.tsx"), "utf8");
    expect(desk).toMatch(/<RouteLink to="consent"[^>]*>\s*\{t\.feedback\.consentText\}/);
    expect(desk).toMatch(/<RouteLink to="privacy"[^>]*>\s*\{typograf\(t\.footer\.privacy\)\}/);
    expect(desk).toMatch(/type="checkbox"[\s\S]{0,200}name="consent"[\s\S]{0,80}required/);
    expect(ru.privacy.label).toBe(ru.footer.privacy);
  });
  it("hold back collecting while the consent names a blank, but not for the register number", () => {
    expect(consentBlanks().sort()).toEqual(["address", "email", "hosting", "inn", "mail", "name", "ogrn"]);
    expect(consentBlanks()).not.toContain("registry");
  });
});
