# «Всё держится на этом вопросе»: the About hero

Date: 2026-09-29. Approved by the user: concept 2 of five browser prototypes, with these choices: the sign's
back is the live door sign, the sign feels the page's scroll (gently), and it is hung on a fresh load.

## Summary

The opening of «О нас» (`#o-nas`, the page's h1) is rebuilt. The guest's line «А у вас как дела» ends in the
logo's own question mark, set huge; its dot is a nail, and the café's answer «Спасибо, что спросили.» hangs
from it on a paper sign. Everything the chain is hangs on that one question. Turned over, the sign is the
café's door sign: «Открыто» or «Закрыто», right now. The door, its photo and its scroll drive go.

## What goes, what stays

- Goes: the door (`Opening.tsx` markup, `opening/OpeningDoor.tsx`), `src/lib/door.ts` and `door.test.ts`,
  `DOOR_SCRIPT`, the opening block of `src/styles/about.css`, `doorway` in `src/content/about.ts`,
  `photos.lermontova59Room` and its English alt. The room photo stops being the page's LCP image (the same
  photo stays in the Street chapter as `cafeLermontova59`).
- Stays: the h1's copy (`t.about.ask`, `t.about.a`), today's torn answer opening the ask in red at the weight
  of its mood (`html[data-answer]`, `data-said-*`), the founding line (`t.team.lead`, the section's italic
  moment), `#o-nas`, the cream theme, the ask's entrance and the founding line's rise.

## The rig: one geometry, scaled by the sign's width

Everything is a multiple of the sign's width `W` (CSS `--sw`), so one set of numbers (and one baked arrival)
holds at every size. The physics sees the same sign at every size: 40 cm across.

- The sign: `W` × `0.56 W`, the notice's paper (`--paper`, `--paper-tex`, a hairline `--edge`,
  `--paper-shadow`), two punched holes `0.40 W` either side of its middle, `0.0315 W` under its top edge.
- The «?»: the traced logo's own hook and dot (`WORDMARK.dela[4]`, `[5]`), `0.62 W` tall. Its dot is the
  nail: centre `0.56 W` under the glyph's top, `0.184 W` from its left, radius `0.06 W`. These follow from the
  wordmark data and are computed from it, so a new logo vector moves them with it.
- The cord: two strands from the nail to the holes; at rest the holes hang `0.26 W` under the nail's centre.
  The sign's foot is `0.7885 W` under the nail (`1.3485 W` under the huge glyph's top in the stack).

### The line (landscape: `(min-width: 1024px) and (min-aspect-ratio: 6/5)`)

Revised after the first build was reviewed: the ask set small top left, with the huge «?» and the sign under
it, left a wide empty field top right and the question read as misplaced.

- The question is the headline: the thin display voice on one line from the left gutter, its own «?» still in
  the text (it is read) but unseen, and the logo's «?» in its place at the size of the caps (`HEAD`).
- The sign hangs from that «?»'s dot with its right edge on the right gutter. The dot stands over the sign's
  middle and the headline and the rig share the first screen, so one equation gives the sign's width (between
  `18rem` and `52%` of the canvas) and the headline's size (up to `32svh`; past it, on the widest screens, the
  sign keeps to its dot, short of the gutter).
- The founding line runs from the left gutter to the sign, its last line on the sign's foot. Today's torn
  answer is a small red line of its own over the question.

### The stack (everything else)

- The ask, then the rig as a block with the «?» centred, the sign the width of the content, then the founding
  line. The ask stays on one line (sized for the longest, «Как в сказке. А у вас как дела?»).

The first paint is CSS alone: no measuring, nothing jumps when the script arrives.

## The sign's two sides

- Front: «Спасибо, что / спросили.» in the heavy caps, broken where the answer's last space is (English:
  «Thanks for / asking.»), sized to the paper. It is the h1's own text.
- Back: the café's door sign. «Открыто» with «каждый день с 07:30»; from 00:00 to 07:30 Moscow time
  (`html[data-daypart="0"]`, which `NOW_SCRIPT` writes before paint and `NowClock` keeps current)
  «Закрыто» with «откроемся в 07:30». English: «Open», «every day from 07:30», «Closed», «we open at 07:30».
  Hidden from screen readers: the same hours are read in «А прямо сейчас?» right below.

## Physics (`src/lib/sign.ts`, pure, tested)

- The sign is a rigid card on two cords from one nail. The cords only pull (they can go slack); constraints are
  solved position-based at 1 kHz, deterministically. The card has air drag.
- Its twist about the cord is a torsion spring that counts turns: spun, it winds the cord and unwinds back
  until the front faces the room again.
- Scale: the card is 40 cm across under 9.81 m/s². The swing (about 0.85 s) and the twist (about 5 s) follow
  from that and are the same on every screen.
- Inputs: a hand (a point of the card pulled toward a target, softly), a push on one side (turns it), and
  the page's vertical acceleration (the nail moves with the page).
- Outputs, for CSS and the island alike: the swing about the nail, the drop along the cord, the card's own
  tilt, its turn, and each cord strand's angle and length.

## Motion (full motion only: a declared exception to the motion rules, like the door was)

- The arrival (a fresh load at the top: the door's conditions, flag `html[data-hang]` from `HANG_SCRIPT`):
  the café hangs its answer. The sign drops from a hand's height, the cord catches on the nail, it swings and
  settles with a slight twist. The motion is simulated at build time by `sign.ts` and baked into CSS
  animations (`linear()` curves), so it runs on the compositor from first paint, waits under the loader like
  every CSS entrance (`loader.css` pauses them until the drain), and never waits on the script. Where
  `linear()` isn't supported the sign simply hangs.
- Hands (after hydration): a mouse or pen drags the sign by the point it took and lets it swing; a click
  (not a drag) turns it over, pushed on the side clicked, harder the further out. Touch: a tap turns it, a
  sideways swipe swings it, vertical swipes stay the page's scroll.
- Scroll: the page's vertical acceleration (the smoothed scroll the guest sees) acts on the sign. A vertical
  jolt can't swing a hanging sign sideways, so ordinary scrolling leaves it still, and a hard fling or sudden
  stop (more than 1 g) lets the cord go slack for a moment: the sign hops and lands back with a small bounce.
- The takeover: if the guest touches or scrolls during the arrival, the island re-simulates the arrival up to
  the moment the CSS animation has reached and continues from that exact state, with no jump.
- The island runs a frame loop only while something moves, and not at all while the section is off screen.
- Every other visit (a client-side visit, a hash, a reload further down) simply shows the sign hanging.

## Stills

- No JS, reduced motion: the sign hangs still, front out. With reduced motion a click turns it over at once.
- Forced colours: the card outlined, the «?» and the cord in the text colour. Print: the front, still.

## Accessibility

- The h1 reads «А у вас как дела? Спасибо, что спросили.» (with today's torn answer first, as now).
- The «?», the cord and the back are `aria-hidden`. Turning the sign repeats hours read just below, so it is a
  pointer and touch nicety, not a control (as the door's click was).

## Performance

- The LCP becomes the heading's text; the photo and its preload go.
- The arrival is CSS. The island is small; nothing visible moves from the main thread during a load.

## Files

- New: `src/lib/sign.ts`, `src/lib/sign.test.ts`, `src/components/about/opening/HangingSign.tsx`.
- Rewritten: `src/components/about/Opening.tsx`, the opening block of `src/styles/about.css`, `HANG_SCRIPT` in
  `src/lib/about-script.ts` (in place of `DOOR_SCRIPT`).
- Edited: `src/i18n/ru.ts` and `src/i18n/en.ts` (`t.about.sign`), `src/content/about.ts`,
  `src/content/photos.ts`, `src/content/en/index.ts`, `docs/CONVENTIONS.md` («О нас», the motion rules' list
  of exceptions), `README.md`.
- Deleted: `src/lib/door.ts`, `src/lib/door.test.ts`, `src/components/about/opening/OpeningDoor.tsx`.

## Tests (`sign.test.ts`, vitest)

- It hangs level at rest, both strands taut, the sign's centre where the geometry puts it.
- The arrival catches and settles; no strand ever runs past its length.
- A spin winds up and comes back to the front; the back shows on a hard push.
- Energy only decays in a free swing; the run is deterministic.
- Page acceleration under 1 g never slackens the cord; a short jolt over 1 g does, and it lands again.
- The baked `linear()` curves reproduce the simulation, start at its first pose and end at rest.
- The geometry agrees with the wordmark data; about.css defines every property it reads; the layout mirror of
  about.css keeps the sign on the first screen, its right edge on the gutter and clear of the founding line at
  24 sizes, with the longest ask; the torn answers keep the weights of their moods.

## Verification

`npm run typecheck`, `npm run lint`, `npm test`; screenshots of `/about` at 390, 1024, 1440, 1920 and 2560
with and without reduced motion and JS; frames of the arrival and of a takeover mid-arrival; axe.

## Notes

- `.claude/workflows/about-door-review.js` reviews the door and no longer applies; it is left for the user.

## Revision, 2026-09-30: the question in the logo's lettering

The user, on the built page: today's torn answer over the question («Так себе.») read as unexplained; the
founding line had too much empty space above it; and the question's thin condensed caps didn't belong with the
logo's «?», which they like. So:

- **The torn answer goes** from the opening: no `data-said-*`, no `::before`, no `SAID_WEIGHT`. The last chapter,
  «А у вас?», still remembers and shows today's tear.
- **The question is set in the logo's own lettering** (`src/lib/lettering.ts`): the wordmark's К, А, Д, Е and Л
  redrawn clean from the trace's measurements (the trace's stair-stepped hairlines showed at headline size), and
  У, В, С drawn from the same parts; English gets N, D, H, O, W, R, Y and U the same way. «КАК» and «ДЕЛА» keep the
  wordmark's own spacing. The lettering is SVG built on the server; the h1 still reads «А у вас как дела?
  Спасибо, что спросили.» (the words sit beside the drawing for screen readers).
- **Two lines on the line,** «А у вас» over «как дела», with the logo's «?» after the second at the size of the
  caps: the lettering is about twice as wide as the condensed face, so one line would have shrunk the «?» to half
  its size. The same equation sizes the pair; the caps (the question's em) stop at 17svh.
- **The wide line** (`WIDE_MQ`, 2:1 or wider): the question on one line, so the sign still reaches the right
  gutter on ultrawide screens.
- **The founding line** starts level with the paper's top edge (in the flow), instead of ending on the sign's foot.
- The stack sets the question's longer line across the content (caps at most 16svh), then the rig as before.
