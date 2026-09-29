# «До краёв», with realistic liquid physics: design

Date: 2026-09-29. Status: approved by the user ("build everything as you see fit, but keep in mind that this is the loading screen: the user should not wait for the loading screen to also load").

## 1. Goals

- The loader's liquid moves like a real liquid: a stream that falls, thins, arcs and comes in gulps; a plunge that digs a crater and throws droplets that fall back in; waves that ring and slosh. The look stays exactly as it was: one flat ink with the dark grain, no second tone, no highlight.
- The screen starts partly filled: the bottom 38% is poured from the first frame.
- The loading screen never has to load. Everything it needs is inline in `<head>` (no files, no images, no fonts), its first frame is plain HTML and CSS, and nothing about the page waits for it.
- It stays honest and smooth: the level is still the runtime's needle, and hydration never makes it stutter.

Out of scope: the runtime (`runtime.js`: the milestones, the needle, the guest's input, the clean finish) and the reduced-motion show (the cream cover simply fades), which stay as they are.

## 2. Decisions taken with the user

| Question | Decision |
|---|---|
| Look | Unchanged: the site's flat ink (`#141210`) with its dark grain. The user, after a first round drew it as shaded coffee with crema and bubbles: "the realisticness I told you about was specifically about the liquid physics, not the visuals. The visuals I don't want changed at all, leave them as simple and clean as they were". Droplets are part of the physics and are drawn in the same flat ink. |
| Rendering | WebGL2 in a Web Worker, drawing on an OffscreenCanvas, with the physics stepped live in the worker. Tested in Chromium: the worker's frames keep coming at 60 fps through a 1.2 s block of the main thread. |
| Start | 38% full. Every show opens on a still pool with the stream falling in from the top edge. |

## 3. What the guest sees

1. **First paint:** the cream cover with its grain and, across the bottom 38%, a flat pool of ink with its grain (HTML and CSS).
2. **The worker takes over** as soon as its GPU context and shaders are ready, drawing the same pool in the same place, so the swap can't be seen. Until then the page's pool waits, still (the first WebGL context of a visit, and a GPU busy painting the page, can take from tens of milliseconds to most of a second, and anything the main thread moved then would move in hops: a load gives it a frame now and then between parsing and hydration), and the glass takes it up there and catches up with the needle; the page's pool stays under the canvas until the cover goes at the brim. The stream's head falls in from the top edge and plunges in: a crater, a crown of droplets that fall back in, rings of waves.
3. **While the page loads:** the level rises with the needle. The stream thins as it falls, arcs a little, comes in gulps that travel down it and sways, and the pour point drifts slowly across; the gulps throw up more droplets now and then.
4. **When the needle waits:** the stream thins to a thread and never stops (as before).
5. **The exit:** the last gush lifts the ink out through the top edge, the screen is all ink for a moment (the cover goes, unseen), then it drains toward the left wall and the live page is there. Same timing as before (about 1.2 s).

## 4. Architecture

- `assets-src/loader/runtime.js`: unchanged.
- `assets-src/loader/pour.js`: the host, on the main thread. Builds the cover, the pool and a `<canvas>` in `<ld-screen>`, starts the worker from a Blob of inline code, passes on the milestones, and runs the exit's handshake: the worker says `brim` (the cover and the pool go, under the ink) and the host answers `go`; the worker says `drain` (the host calls `ctx.uncover()`) and later `done` (the reveal resolves).
- `assets-src/loader/liquid-sim.js`: the physics, with no DOM and no GL, so the tests drive it. The surface model is `pour.js`'s (sloshing modes, gulps, chop, spill, climb, the lurch and Torricelli's drain) without the bare floor's sheet and slam, which a pre-filled pool never needs. New: the stream's shape from the valve's history (width with the flow and the fall, gulps travelling down, the arc from the spout), splash droplets, and the needle stepped live.
- `assets-src/loader/liquid-gl.js`: the WebGL2 renderer. One full-screen pass draws the pool, the stream and the droplets as one flat-ink silhouette (a field that is 0.5 at every edge, so droplets and the stream join the surface smoothly), with the ink's grain; the droplets' field is drawn first as point sprites. Its shaders are built on the driver's threads (`KHR_parallel_shader_compile`).
- `assets-src/loader/liquid-worker.js`: the worker's loop and messages.
- `scripts/build-loader.mjs`: minifies the three liquid files into the worker's code and inlines it as a string in the main code; checks that no `</script` can end up in the page.
- **Fallbacks:** no OffscreenCanvas, no WebGL2 in a worker, or any worker error: the HTML pool keeps rising with the needle and the cover fades at the end. A worker that is not live when the page is ready is never waited for: the cover fades.
- **Cost:** the backing store is capped at twice the CSS pixels and about 4 million pixels. The physics costs well under a millisecond a frame in the worker (0.4 ms at the median in Chromium at 1440 x 900); the main thread posts the needle each frame until the worker draws, then only a message per milestone.

## 5. Testing

- `src/components/loader/liquid.test.ts` (vitest) drives `liquid-sim.js`: the pre-filled level, never ahead of the needle, the same pour whether or not the page's main thread is held up (the worker steps the needle on its own clock from the milestones), a late start onto the still pool, a surface that never dips under where it started, the brim and a full drain within the exit's budget, bounded particles and finite numbers, the same pour for the same seed, a resize that keeps the share.
- Headless Chromium frame captures at 1440×900, 390×844 and 1920×1080, first on a private harness page, then on the dev server.
- A stall test: block the main thread mid-pour and check the worker's frame times.
- `npx tsc --noEmit`, `npx eslint src` and `npx vitest run` clean.
