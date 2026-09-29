export const meta = {
  name: 'about-door-review',
  description: 'Review the new /about door hero across five lenses, each verified by an adversarial skeptic',
  phases: [
    { title: 'Review', detail: 'five lenses: lifecycle, css/browsers, a11y, visual taste, conventions/perf' },
    { title: 'Verify', detail: 'one skeptic per lens tries to refute every finding' },
  ],
}

const ROOT = 'E:/Desktop/PC/WORK/Web Development/kakdela'
const SCRATCH = 'C:/Users/omarh/AppData/Local/Temp/claude/E--Desktop-PC-WORK-Web-Development-kakdela/7a0a4fd8-e01e-4e6c-93c3-2830e72005e5/scratchpad'

const BRIEF = `
You are reviewing a just-built HERO for the /about page of «Как дела?» (a chain of cafés), repo ${ROOT} (Next.js 16 App Router, React 19, GSAP 3.15 + ScrollTrigger, Lenis). The user asked for "a ground breaking award winning geniusly creative smooth hero". The concept, «Приоткрыто»: the h1 is «А у вас как дела?» (thin display) / «Спасибо, что спросили.» (heavy caps), and the answer's last word «спросили.» is lettered on a flush door leaf standing ajar (CSS 3D rotate: y on the leaf, perspective on its parent frame). Through the crack you see a real photo of the café's kitchen door that reads «КАК ДЕЛА НА КУХНЕ?». On a fresh load at the top the door is shut at first paint (one unbroken line), then the lever dips and it comes ajar (CSS keyframes gated by html[data-knock], set by an inline script). Scrolling (full motion, from the top only) sticks the stage under the header for 50svh (40svh on phones); the leaf swings into the room and slips behind its jamb while the photo inside the doorway pulls back (log-linear) from the kitchen door to the whole room, until the bar's real sign «КАК ДЕЛА?» stands exactly on the guest's question's baseline at its cap height. Two arrangements: "line" (min-width 640 and min-aspect-ratio 4/3: answer on one line gutter to gutter, the door to the right rising to a floor hairline) and "stack" (phones/tablets portrait: «Спасибо, что» over the door).

FILES (read them all first):
- src/components/about/Opening.tsx (server component, the DOM)
- src/components/about/opening/OpeningDoor.tsx (the client island: arms the drive, ScrollTrigger reading progress, the pointer lift and click-to-open)
- src/lib/door.ts (all numbers and pure geometry) and src/lib/door.test.ts (vitest)
- src/lib/about-script.ts (DOOR_SCRIPT, the inline before-paint script) and src/components/about/InlineScript.tsx
- src/styles/about.css: the opening block at the top of the file (up to the «.framed__img» rule)
- small edits: src/content/about.ts (doorway), src/content/photos.ts (lermontova59Room), src/i18n/ru.ts (t.about.room)
- the project's law: docs/CONVENTIONS.md (esp. Design tokens, Type, Motion rules, «О нас (/about)», Accessibility, Verification) and AGENTS.md. The old hero was replaced; CONVENTIONS.md has NOT yet been updated to describe the door (that is known and will be done after this review; do not report it).
- related: src/components/about/street/StreetDrive.tsx (another sticky drive on the same page), src/components/about/AboutMotion.tsx, src/lib/gsap.ts, src/lib/motion.ts, src/components/providers/Providers.tsx (Lenis), src/lib/head-script.ts.

HOW TO LOOK AT IT (the dev server runs at http://localhost:3000; NEVER start or restart it; NEVER use the Playwright MCP browser, it is shared):
- node scripts/shot.mjs viewport out.png 1440 900 --reduced --url=http://localhost:3000/about (also without --reduced, with --nojs, and at other sizes; "#o-nas" instead of viewport shoots the section). PNGs go to ${ROOT}/.playwright-mcp/shots/. Open them with the Read tool and LOOK.
- ${SCRATCH}/drive.mjs: node "${SCRATCH}/drive.mjs" <w> <h> <prefix> [--said=sonno] [--noknock] films the knock (k0..k3) and drives the scroll to progress 0.15..1, printing the lock numbers (signBase vs askBase, caps, coverage) and screenshots to .playwright-mcp/shots/<prefix>-*.png. Copy and adapt it in the scratchpad for your own probes (Firefox is available via require("playwright").firefox.launch(); WebKit is NOT installed and cannot be downloaded here, so reason about Safari from knowledge instead).
- @axe-core/playwright is a devDependency.
- Put any throwaway scripts in ${SCRATCH}/review/ (create it). Name your screenshots with a unique prefix.
- npx vitest run src/lib/door.test.ts, npx eslint <files>. (npx tsc --noEmit shows errors in src/components/menu/* from another session's work in progress: ignore those.)

RULES: Do NOT edit any file in the repo. Other Claude sessions are editing other parts of the repo right now (the /menu page, /locations, i18n); ignore their files and any dev-server noise they cause (a transient hydration warning or "Router action dispatched before initialization" during page load while another session's files recompile is known noise unless you can reproduce it reliably and tie it to the hero). Known and accepted trade-offs (don't report unless you find they are worse than stated): the room photo is only 1333px wide, so the kitchen door in the crack is shown at up to 1.3x its pixels and is soft on tablets and 1920+; the story (founding line and lead) sits below the fold on phones; the drive does not arm on screens under 560px tall or when the page is not at the top on mount; at the end of the drive «спросили.» has gone into the room with its door (that is the beat). Copy rule: no em dashes anywhere.

Report only REAL, specific problems or high-value improvements, each with evidence (a screenshot you looked at, a measured number, a code path you traced) and a concrete fix. Severity: critical (broken for users), major (clearly visible or likely bug), minor, polish (taste improvement).
`

const FINDINGS = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', description: 'short kebab id, unique within your list' },
          title: { type: 'string' },
          severity: { type: 'string', enum: ['critical', 'major', 'minor', 'polish'] },
          file: { type: 'string' },
          line: { type: 'number' },
          evidence: { type: 'string', description: 'what you observed or traced, with numbers or screenshot paths' },
          repro: { type: 'string' },
          fix: { type: 'string', description: 'a concrete change (code-level when possible)' },
        },
        required: ['id', 'title', 'severity', 'file', 'evidence', 'repro', 'fix'],
      },
    },
    summary: { type: 'string' },
  },
  required: ['findings', 'summary'],
}

const VERDICTS = {
  type: 'object',
  properties: {
    verdicts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          real: { type: 'boolean' },
          severity: { type: 'string', enum: ['critical', 'major', 'minor', 'polish'] },
          reason: { type: 'string' },
          fix: { type: 'string', description: 'the fix you would actually apply, refined' },
        },
        required: ['id', 'real', 'severity', 'reason', 'fix'],
      },
    },
  },
  required: ['verdicts'],
}

const LENSES = [
  { key: 'lifecycle', prompt: `LENS: runtime correctness of the island and the inline script. Trace and TEST: React StrictMode double effects (dev), a client-side navigation to /about from another page and away again (use a script that loads / then clicks the «О нас» link in the header), a reload halfway down, a back/forward load, /about#seychas, resizing across the line/stack media query and across heights while at rest and mid-drive, the font swap, Lenis smooth wheel with scrub, a mid-visit switch to reduced motion (emulateMedia), ScrollTrigger interplay with StreetDrive and AboutMotion triggers further down (does arming the drive's spacer after their triggers were created shift their start/end? check their positions), the knock's skip rules (wheel/keydown/scroll during the knock), the pointer lift and click-to-open (mouse), memory/listener leaks on unmount, and the measure() math (rest crop read with transform off; askB from the ask's rect while its CSS entrance animation runs). Verify numerically where you can.` },
  { key: 'css-browsers', prompt: `LENS: CSS and rendering across browsers and sizes. Run the page in Firefox (playwright firefox) as well as Chromium, at 390x844, 360x780, 768x1024, 1024x768, 1280x720, 1366x768, 1440x900, 1920x1080, 2560x1440, 844x390 and a 200% zoom equivalent (720x450), reduced and full motion, and mid-drive. Check: container query units inside unregistered custom properties resolved at the right element, rotate: y with perspective on the parent and overflow: clip, backface-visibility, sticky inside a container-type: size stage, the shut door's seam against the wall grain (knock frame), the leaf's text crispness at rest, the ask on one line with every torn answer (html[data-answer] + no data-guess; set localStorage kd-last to {id, day} as drive.mjs does), the story fitting above the floor on short laptops, the super under the floor, no horizontal overflow, forced-colors (emulateMedia forcedColors active) and print (page.pdf or emulateMedia print). Reason explicitly about Safari/WebKit risks for each technique used and flag any that are likely to break there with a fallback.` },
  { key: 'a11y', prompt: `LENS: accessibility and resilience. Run axe (@axe-core/playwright) on /about at 1440 and 390, check the h1's accessible name and reading order (with a torn answer set and without), the image inside the h1 (alt="" inside aria-hidden), the sr-only room description, focus order and visible focus, that nothing focusable was added, keyboard scrolling through the drive (Space/PageDown/arrows) never trapped, reduced motion (both the OS setting and html[data-motion=reduced]), no-JS (--nojs), forced colours, 200%/400% zoom reflow, contrast of every text over the paper and of the word on the shaded leaf, and the knock never holding the guest. Also check the page's other headings still follow in order.` },
  { key: 'visual-taste', prompt: `LENS: art direction. You are an Awwwards jury creative director AND the brand's designer. Look hard at many frames: the knock (k0 shut, k1 latch, k2 swing, k3 ajar) and the drive (p 0.15 .. 1) at 1440x900, 1920x1080, 2560x1440, 1024x768 and 390x844 (the phone drive works in full motion at 390x844), with and without a torn answer. Judge: does it break jaws, is every frame composed, is the motion smooth and weighted (ease, timing, the pause, the latch, the swing's end, the pull's feel), are there ugly in-between frames (smear, a word cut mid-letter, a thin sliver of leaf, the photo showing an unflattering crop, dead paper), is the lever the right size and shape, is the gap between «ЧТО» and «СПРОСИЛИ.» right when shut, does the phone arrangement look as intentional as desktop, does the end frame (the lock) land with a satisfying "click" and read clearly, is there anything cheap. Propose the few highest-value, on-brand refinements with exact values (not a redesign). The brand: printed café menu, warm paper, black ink, one red, real photos, no gradients-as-decoration, no serif, no em dashes, taste over tricks.` },
  { key: 'conventions-perf', prompt: `LENS: code quality, project conventions and performance. Check the new/changed code against docs/CONVENTIONS.md and the surrounding code's idiom (comment density and voice, naming, typograf() on rendered copy, t.* strings, no em dashes anywhere including comments, RouteLink etc.), dead code or unused exports/vars (e.g. doorVars entries not used by CSS, DOOR fields unused), duplication between door.ts, the CSS and the test mirror, test adequacy (would the tests catch a CSS drift?), the privacy test's storage rules, the next/image usage (preload, sizes, placeholder, the LCP element), per-frame cost of the drive (style recalcs from --swing, layer count, will-change toggling), layout reads per frame, and bundle impact. Measure LCP and CLS on /about with a Playwright PerformanceObserver script (desktop 1440x900 and a phone 390x844) and compare with the homepage.` },
]

const results = await pipeline(
  LENSES,
  (l) => agent(`${BRIEF}\n\n${l.prompt}\n\nReturn your findings (most severe first).`, { label: `review:${l.key}`, phase: 'Review', schema: FINDINGS }),
  (found, l) => {
    if (!found || !found.findings.length) return { lens: l.key, found: found ? found.findings : [], verdicts: [], summary: found ? found.summary : 'no result' }
    return agent(`${BRIEF}\n\nYou are an adversarial SKEPTIC. Another reviewer (lens: ${l.key}) reported the findings below. For EACH one, try hard to REFUTE it: re-read the code, re-run or adapt their repro, look at the screenshots yourself. Mark real=false if it is wrong, not reproducible, already handled, a known accepted trade-off, dev-only noise, or a taste change that would not clearly improve the work or would break the brand. Default to real=false when you cannot confirm it. For real ones, set the severity you believe and write the exact fix you would apply.\n\nFINDINGS:\n${JSON.stringify(found.findings, null, 1)}`,
      { label: `verify:${l.key}`, phase: 'Verify', schema: VERDICTS })
      .then((v) => ({ lens: l.key, found: found.findings, verdicts: v ? v.verdicts : [], summary: found.summary }))
  },
)

const confirmed = []
for (const r of results.filter(Boolean)) {
  for (const f of r.found) {
    const v = r.verdicts.find((x) => x.id === f.id)
    if (v && v.real) confirmed.push({ lens: r.lens, ...f, severity: v.severity, verifier: v.reason, fix: v.fix })
  }
}
const order = { critical: 0, major: 1, minor: 2, polish: 3 }
confirmed.sort((a, b) => order[a.severity] - order[b.severity])
log(`${confirmed.length} confirmed of ${results.filter(Boolean).reduce((n, r) => n + r.found.length, 0)} reported`)
return { confirmed, rejected: results.filter(Boolean).flatMap((r) => r.found.filter((f) => !(r.verdicts.find((v) => v.id === f.id) || {}).real).map((f) => ({ lens: r.lens, id: f.id, title: f.title, why: (r.verdicts.find((v) => v.id === f.id) || {}).reason }))), summaries: results.filter(Boolean).map((r) => ({ lens: r.lens, summary: r.summary })) }
