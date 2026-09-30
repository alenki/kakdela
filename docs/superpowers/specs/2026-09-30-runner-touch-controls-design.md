# The runner on a phone: thumb pads, the buttons above the field

2026-09-30. The runner («Игра со стаканчиком», `src/components/game/*`) was hard to play on a phone.

## What was wrong

1. **The controls sat on the game.** Touch jumped from the upper two thirds of the field and ducked from its lower third. On a phone held upright the field is about 150px tall, and the lower third is where the cup and the obstacles are: a thumb held there to duck hides the very things it ducks under. Nothing on screen shows where one zone ends and the other begins.
2. **«Пауза» was where the thumbs are.** It sat under the field at the right edge, in the thumb's reach, and was hit by accident.
3. **A press next to «Пауза» paused the game too.** Reproduced on an emulated phone: a tap 24px left of the button, on the note's empty space, paused the run. The tap focuses the page's `<main tabindex="-1">` (the skip link's target), so the stage's `focusout` sees focus leave for something outside the game and pauses. Only presses on the game's own buttons were excused.

## The design

Chosen by the user from three control schemes and two pause placements.

### Touch layout (`(pointer: coarse)`)

From the top: the note and the buttons, then the field, then two pads.

- **Two pads under the field**, side by side, as wide as the field: «Пригнуться» on the left, «Прыжок» on the right, each with a small drawn arrow (down, up). Pills in the site's line colour; while a pad is held it fills with the text colour at once (no pour: a game control answers instantly). Height `clamp(56px, 11 * var(--svh), 96px)`, 12px apart, 12px under the field.
- **The note and every game button move above the field** («Играть», «Пауза», «Продолжить», «Заново», «Ещё раз»): one row, 48px tall in every state, the note on the left (at most two lines), the buttons at the right edge. The main button keeps one spot in every state, as before. The row never changes height, so the field and the pads never move when the game pauses or ends.
- **The room:** the field still keeps its ratio and fits the screen, now together with the row and the pads: `--runner-room` loses 48px, the pads' height and the two 12px gaps. A phone on its side (844 × 390) gets a 546 × 182 field. The room reads `var(--svh)`: the small viewport height the head script freezes per width (the site's fix for Telegram's in-app browser, whose bars resize the page mid-scroll).
- **No touch hint.** The labelled pads are the instructions; `hintTouch` goes from both dictionaries.

Desktop (a fine pointer) keeps its layout: the field, then the note and the buttons under it. No pads.

### Input

- **During a run:** a press on «Прыжок» jumps (held, the cup jumps again on each landing); a press on «Пригнуться» ducks while held (in the air it drops fast, as the keys do). Both take the pointer (capture), so a thumb that slides off keeps its press. A press anywhere on the field jumps: the lower-third duck zone is gone (`touchZone` and its tests go), for every pointer. Ducking is the pad's or the keys' job.
- **Outside a run:** a tap on «Прыжок» acts like a tap on the field: it starts, continues or plays again (after the 0.6s crash lock, which counts from the start of the press). «Пригнуться» only works during a run.
- **Feedback:** a pad shows held (`data-down`) while its input is on, whatever drives it: the pad, the field (jump) or the keys. So a tap on the field lights «Прыжок».
- While a run is on, the pads take every touch (`touch-action: none`) and swallow the long-press menu; otherwise a swipe that starts on them scrolls the page.
- The pads are `aria-hidden` and not focusable: they duplicate the stage's keys, which stay the accessible controls.

### Auto-pause

The rule becomes: **a press never pauses the game unless it lands on something else to use.**

- A press inside the game (the field, the pads, the note, the gaps, the buttons) is never leaving. Only «Пауза» (and Esc or P) pauses.
- A finger's (or pen's) press outside the game on nothing usable (a near miss off the pads) isn't leaving either.
- A press on a link, a button, a field or anything else focusable outside the game pauses, as does a mouse click anywhere outside the game (a desktop player who clicks away has moved on).
- The keyboard (Tab away), a blur, a hidden tab and the stage scrolling mostly off screen pause, as before.
- When a stray press moved focus to nothing (the page's `<main>`, the body), the stage takes focus back, so the keys keep working.

The press is classified on `pointerdown` (window, capture) and forgotten after its click, on `pointercancel` and on any key press, so a stale press never excuses a later Tab.

### The action bar

`html[data-game]` hides the mobile action bar while a run is on screen, as before, and now also on a touch screen whenever the pads are on screen (an `IntersectionObserver` on the pads; a desktop never shows them). Found while verifying: on a phone on its side the floating bar sits over the pads whenever the game is in view, and a tap meant for «Прыжок» followed the bar's «Кофейни» link instead. Upright, the full-width bar covers the pads whenever the game sits low on the screen.

### Start scroll

A start still scrolls the game into view, now fitting the whole block (the note row, the field, the pads on touch; the field and the foot on desktop) between the header and the bottom of the screen. If it can't fit, the field's top goes just under the header, as before.

## Files

- `src/components/game/RunnerIsland.tsx`: the pads' markup, the note without the touch hint, the early (pre-controller) start from «Прыжок».
- `src/components/game/runner-controller.ts`: pad input, pad feedback, the field jumping anywhere, the new focus rule, the block-fitting start scroll.
- `src/lib/runner.ts`, `src/lib/runner.test.ts`: `touchZone` and its two tests removed (the bot loses its `via`).
- `src/styles/sections/game.css`: the touch layout and the pads.
- `src/i18n/ru.ts`, `src/i18n/en.ts`: `jump` («Прыжок», "Jump"), `duck` («Пригнуться», "Duck"); `hintTouch` removed.
- `docs/CONVENTIONS.md` («The runner»): the touch layout and the pause rule.

## Verification

- `npm test`, `npm run typecheck`, `npm run lint`.
- A Playwright script on an emulated phone (390 × 844, touch): the pads jump and duck; a tap beside «Пауза», on the note, between the pads and just under them never pauses; «Пауза» pauses and «Прыжок» continues; a link tap outside pauses; Tab away pauses.
- Screenshots: phone upright and on its side (idle, running, paused, over), the 404 on a phone, desktop unchanged.
