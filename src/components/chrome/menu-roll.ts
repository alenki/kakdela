// «Разделы» is a sheet off the café's paper roll (docs/CONVENTIONS.md, «Разделы: the roll»). Opening,
// it comes down from above the screen with its torn edge first, and each block rises as the rip
// uncovers it; the burger's two lines swing into the ×. Closing («Закрыть», Esc, a link) runs it back:
// the × folds into the burger's lines, the sheet rolls back up, faster as it goes, and each block
// sinks as the rip passes over it. MenuDialog closes the dialog when the sheet is up (close's `done`).
// Transforms only. The rip is a clip-path written once per open, never per frame, and it is measured
// from the box's bottom, so the sheet keeps its edge when the window resizes.

import { gsap } from "@/lib/gsap";
import { kd } from "@/lib/store";
import { rollRip, ripClip } from "@/lib/tear";

/** The band under the sheet for its rip, rim and shadow (chrome.css, --roll-jag). */
const JAG = 30;
/** Coming down, and going back up, all the way (a sheet part of the way down goes in proportion).
 *  Going is quicker than coming: nobody waits for a menu they've finished with. */
const UNROLL = 0.9;
const ROLLUP = 0.38;
/** One sheet, one rip: it comes down with the same edge every time. */
const SEED = 0x6b64;

const reduced = () => kd.get().motion === "reduced";

/** The first moment an ease reaches a given progress, as a share of its duration. */
function when(ease: string, progress: number) {
  const e = gsap.parseEase(ease);
  for (let i = 0; i <= 200; i++) if (e(i / 200) >= progress) return i / 200;
  return 1;
}

export type Roll = {
  /** Right after showModal(): the sheet comes down (reduced motion: it is simply there). */
  open(): void;
  /**
   * The sheet rolls back up, then `done` (MenuDialog closes the dialog there). Reduced motion: `done`
   * at once. Also called after the browser has closed the dialog by itself, without `done`.
   */
  close(done?: () => void): void;
  /** Motion mode turned reduced mid-move: finish at once. */
  settle(): void;
  kill(): void;
};

const idle: Roll = { open() {}, close() {}, settle() {}, kill() {} };

const PARTS = ["sheet", "paper", "shadow", "fibres", "shade", "scroll"] as const;

/** The sheet's layers (MenuDialog's data-roll hooks), or null if the markup isn't the one this expects. */
function partsOf(dialog: HTMLDialogElement) {
  const found = PARTS.map((name) => dialog.querySelector<HTMLElement>(`[data-roll="${name}"]`));
  const label = dialog.querySelector<HTMLElement>(".menu-dialog__close-label");
  const lines = Array.from(dialog.querySelectorAll<HTMLElement>(".menu-dialog__x > span"));
  if (found.some((el) => !el) || !label || lines.length !== 2) return null;
  const [sheet, paper, shadow, fibres, shade, scroll] = found as HTMLElement[];
  return { sheet, paper, shadow, fibres, shade, scroll, label, lines };
}

export function bindRoll(dialog: HTMLDialogElement): Roll {
  const parts = partsOf(dialog);
  if (!parts) return idle;
  const { sheet, paper, shadow, fibres, shade, scroll, label, lines } = parts;
  // What rises (and sinks) as the rip passes: the list items, never the links (their colour and press
  // transitions stay CSS's). The top bar doesn't move: its × grows out of the burger in place.
  const blocks = Array.from(dialog.querySelectorAll<HTMLElement>(".menu-dialog__primary > li, .menu-dialog__services, .menu-dialog__side > *"));

  let tl: gsap.core.Timeline | null = null;
  let closing = false;
  let h = 0;

  /** Where the sheet waits off the roll: all of it above the screen, rip, rim and shadow included. */
  const up = () => -(h + JAG + 90);
  /** How far up the sheet is when its rip crosses a line on the screen (0 at rest, 1 all the way up). */
  const upAt = (y: number) => (h + JAG / 2 - y) / -up();
  const sheetY = () => Number(gsap.getProperty(sheet, "y"));

  /** Measure the window and hang the sheet off the roll: straight along the top, the rip at the bottom. */
  function hang() {
    h = dialog.clientHeight;
    // Paper above the screen, so the sheet's small run past its rest never shows the roll's end.
    dialog.style.setProperty("--roll-over", `${Math.round(Math.max(56, h * 0.09))}px`);
    const rip = rollRip(SEED, dialog.clientWidth);
    paper.style.clipPath = shadow.style.clipPath = ripClip(rip.edge, JAG / 2);
    fibres.style.clipPath = ripClip(rip.rim, JAG / 2);
  }

  /** While the sheet moves, the words hold still on the screen: the rip uncovers and covers them. */
  const follow = () => gsap.set(scroll, { y: -sheetY() });

  /** Half the gap between the header burger's two lines: where the × starts from and goes back to. */
  function burgerHalfGap() {
    const [a, b] = Array.from(document.querySelectorAll<HTMLElement>(".hdr-burger__lines > span"));
    return a && b ? (b.getBoundingClientRect().top - a.getBoundingClientRect().top) / 2 : 3.25;
  }

  function rest() {
    tl?.kill();
    tl = null;
    closing = false;
    gsap.set([sheet, scroll, label, ...lines, ...blocks], { clearProps: "transform,opacity" });
    shade.style.opacity = "";
  }

  function open() {
    // Opened again while it rolls up: it comes back down from where it is.
    const from = closing ? sheetY() : null;
    rest();
    hang();
    scroll.scrollTop = 0;
    // Over the ink sections the paper's brown shadow can't be seen: it deepens (chrome.css).
    dialog.dataset.over = document.querySelector<HTMLElement>("[data-header]")?.dataset.theme ?? "cream";
    if (reduced()) return;

    const start = from ?? up();
    const dur = Math.max(0.35, UNROLL * (start / up()));
    gsap.set(sheet, { y: start });
    follow();
    shade.style.opacity = "1";
    const gap = burgerHalfGap();
    gsap.set(lines[0], { y: -gap, rotation: 0 });
    gsap.set(lines[1], { y: gap, rotation: 0 });
    gsap.set(label, { opacity: 0, x: 12 });

    tl = gsap.timeline({
      onComplete: () => {
        gsap.set([sheet, scroll], { clearProps: "transform" });
        shade.style.opacity = "";
        tl = null;
      },
    });
    tl.to(sheet, { y: 0, duration: dur, ease: "kd.unroll", onUpdate: follow }, 0);

    // Each block rises from where the rip first reaches it. Blocks below the fold, and any the rip has
    // already passed, don't move.
    const startUp = start / up();
    for (const b of blocks) {
      const r = b.getBoundingClientRect();
      const reach = upAt(r.top + Math.min(r.height, 40));
      if (r.top >= h || reach >= startUp) continue;
      const at = Math.max(0, when("kd.unroll", 1 - reach / startUp) * dur - 0.04);
      tl.fromTo(b, { y: 32, opacity: 0.25 }, { y: 0, opacity: 1, duration: 0.75, ease: "kd.out", clearProps: "transform,opacity" }, at);
    }

    // The burger's lines close up and swing into the ×; «Закрыть» slides in beside it.
    tl.to(lines, { y: 0, duration: 0.16, ease: "power2.in" }, 0.1)
      .to(lines[0], { rotation: 45, duration: 0.5, ease: "back.out(2.4)", clearProps: "transform" }, 0.26)
      .to(lines[1], { rotation: -45, duration: 0.5, ease: "back.out(2.4)", clearProps: "transform" }, 0.26)
      .to(label, { opacity: 1, x: 0, duration: 0.5, ease: "kd.out", clearProps: "transform,opacity" }, 0.2);
  }

  function close(done?: () => void) {
    if (closing) return;
    tl?.kill();
    tl = null;
    if (reduced()) {
      rest();
      done?.();
      return;
    }
    h = dialog.clientHeight;
    const y0 = sheetY();
    const startUp = y0 / up();
    const dur = Math.max(0.2, ROLLUP * (1 - startUp));
    shade.style.opacity = "1";
    closing = true;
    tl = gsap.timeline({
      onComplete: () => {
        // Up out of sight: the dialog can go. open() sets everything again.
        closing = false;
        tl = null;
        done?.();
      },
    });
    tl.to(sheet, { y: up(), duration: dur, ease: "kd.rollup", onUpdate: follow }, 0);

    // Each block sinks as the rip comes up to it (the rise, run back). Blocks below the fold, and any
    // the rip already covers, don't move.
    for (const b of blocks) {
      const r = b.getBoundingClientRect();
      if (r.top >= h || r.bottom <= 0) continue;
      const reach = upAt(r.bottom);
      if (reach <= startUp) continue;
      const at = Math.max(0, when("kd.rollup", (reach - startUp) / (1 - startUp)) * dur - 0.08);
      tl.to(b, { y: 32, opacity: 0.25, duration: 0.2, ease: "power2.in" }, at);
    }

    // The × folds back into the burger's two lines, where the header's own are waiting under the sheet.
    const gap = burgerHalfGap();
    tl.to(label, { opacity: 0, x: 12, duration: 0.14, ease: "power2.in" }, 0)
      .to(lines, { rotation: 0, duration: 0.16, ease: "power2.inOut" }, 0)
      .to(lines[0], { y: -gap, duration: 0.18, ease: "back.out(2)" }, 0.14)
      .to(lines[1], { y: gap, duration: 0.18, ease: "back.out(2)" }, 0.14);
  }

  return {
    open,
    close,
    settle() {
      if (!tl) return;
      // Rolling up: skip to the end (and close). Coming down: be at rest.
      if (closing) tl.progress(1);
      else {
        rest();
        hang();
      }
    },
    kill() {
      tl?.kill();
      tl = null;
      closing = false;
    },
  };
}
