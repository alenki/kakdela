# «С наступающим!»: the New Year dress

Date: 2026-11-20. Status: the user's brief, taken end to end without approval gates (their standing rule for this project): "It is becoming december, I want you to make this website christmas themed now. Make it very genius and perfect, so people feel christmas upon entering. You could include sound effects if you want."

## 1. Idea

In Russia the winter holiday is the New Year: the tree, the garland, paper snowflakes on the windows, «С наступающим!» said at every counter in December, the Kremlin chimes at midnight, Orthodox Christmas on 7 January and the Old New Year on the 13th. The café dresses its own site the way a café dresses its rooms, from its own materials and in its own words:

- **The garland** («Гирлянда»): a string of lights hung on nails under the header at the top of every page. It is a real cord: it sags, swings when the page is flung or stopped, and moves when a hand brushes it. Its lights come on in a wave when the page opens. Its bulbs are a glockenspiel: in order they are the notes of «Jingle Bells» (James Lord Pierpont, 1857, public domain; changed from «В лесу родилась ёлочка» at the user's request for something with more of a viral-Christmas vibe), a nail every four, so a finger run along it plays the song; turned on, the sound plays the song, verse and chorus, over a beat along the garland, every note knocking its bulb.
- **Paper snowflakes** («Снежинки»): cut from the notice's own paper, as children cut them for the window, each folded in six and cut by its own seed, so no two are alike. They are stuck on the hero's notice and photo, and a guest can peel one off: it flutters down as paper does.
- **Snow** («Снег»): real snow in the air in front of the page. It is the site's milk, so it shows the way snow shows: hardly at all against the day's cream, white over a photo, and thick at night, over the evening, the chess, the game, the footer, and the red of the coffee poster. It drifts on a gusty wind, is dragged along a little by a scrolling page and swirls round a moving pointer. At the end of every page it settles on the footer's wordmark and on the red clover.
- **The greeting** («С наступающим!»): the café's reply in the hero ends with the season's line, which follows the calendar.
- **Sound** («Звук»): on by default (the user's request, 2026-11-21: "put it on repeat and let the website start with sound on by default"). No browser lets a page sound before the guest's first press, so the music starts with their first click or tap anywhere (never a key) and plays on repeat; the bell in the header shows what is heard and turns it off, and that «off» is kept for the next visit. While it plays, the garland's bulbs ring when touched, a torn tab rips, a peeled snowflake peels, and at midnight on 1 January, Moscow time, the chimes strike twelve.

The look stays the site's: flat ink, cream, milk and the one red; the paper is the notice's paper; nothing is fetched to draw any of it. The realism is in how things move.

## 2. Decisions

| Question | Decision |
|---|---|
| Which holiday | The New Year season, as Russia keeps it. Russian copy: «С наступающим!» until 31 December, «С Новым годом!» from 1 January, «С Рождеством!» on 7 January, «Со старым Новым годом!» on 13 and 14 January. English: "Happy holidays!", "Happy New Year!", "Merry Christmas!", "Happy Old New Year!". |
| When | Every year from 20 November to 14 January inclusive, by the Moscow date, decided before first paint by the head script (`html[data-season]`). It turns itself off on 15 January and comes back next November. `?season=eve|ny|xmas|old|off` previews a phase (never stored). |
| Colours | The site's own: the garland's wire and nails in the text colour, its glass in tomato and milk; the snow in milk; the snowflakes in the notice's paper. No new tone, no glow. |
| Sound | Synthesized with Web Audio (no files). On by default, from the guest's first click or tap (the browser's rule), on repeat; a guest's «off» is kept (`kd-sound`), so the privacy policy's table and edition change with it. |
| Without JS | The snowflakes and the greeting are plain HTML and CSS and show wherever the head script ran; the garland, the snow and the sound need the scripts. |
| Reduced motion | The garland hangs still, already lit (a press still rings a bulb); snowflakes stay stuck; no falling snow, but the footer's wordmark wears the snow that has already settled. |

## 3. Physics

- **Garland:** position-based dynamics in metres (bulb pitch 12 cm whatever its size on the screen, so it moves the same everywhere): an inextensible cord of nodes pinned on nails, each bulb a pendulum on its socket wire; gravity, air drag, the page's acceleration (as the about page's sign), the pointer as a soft moving contact (a quick pass nudges, a slow one carries), a grab that follows the hand and a release that keeps its speed. Small steps (sub-stepped at about 1.2 kHz). The loop runs only while something moves and the garland is on screen.
- **Snowflake:** a falling plate with the quasi-steady model of Andersen, Pesavento and Wang (J. Fluid Mech. 2005): added mass, circulation (translational and rotational lift), angle-of-attack drag and rotational damping, in a vertical plane set at an angle to the screen, seen in perspective. A peeled flake falls edge first, turns broadside and flutters, its face flashing as it rocks.
- **Snow:** each flake relaxes to the air's velocity (a quarter of a second) plus its fall and its own zigzag; the air is a gusty mean wind plus a divergence-free field of slow eddies, the drag of the scrolling page (stronger on the far, small flakes next to the page) and the wake of a moving pointer. Depth sets size, speed and softness.
- **Settling:** a cell grid over the wordmark from its own shape; a flake that lands rests on what it hit and slides down while a lower neighbour is free (an angle of repose of about 45°), so the caps grow as snow does on a sign.

## 4. Files

- `src/lib/season.ts`: the window, the phases, the greeting's phase for a Moscow date, the head script's snippet (made from the same data, tested for parity).
- `src/lib/melody.ts`: «Jingle Bells», the verse and the chorus: 98 notes in eight lines, and a chord a bar.
- `src/lib/garland.ts`: layout (half-verses of fourteen bulbs at a width, a nail every four) and the physics, no DOM.
- `src/lib/flake.ts`: the snowflake cutter (seeded, six-fold, connected paper; an SVG mask) and the falling-plate model.
- `src/lib/snow.ts`: the wind, the flakes, the settling grid.
- `src/lib/sound.ts`: the Web Audio engine (bells, the music box, paper, the chimes).
- `src/components/season/*`: `SeasonGreeting` and `PaperFlake` (server), `SeasonIsland` (the clock, the midnight chimes, lazy loading), `Garland`, `Snowfall`, `FlakePeel`, `SoundToggle` (client).
- `src/styles/season.css`: all of it, under `html[data-season]`.
- Tests next to each library.
