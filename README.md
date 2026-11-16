# Pocket Blocks

A mobile-first block puzzle on an 8×8 board, written in vanilla HTML, CSS and JavaScript. There is no build step, there are no dependencies or network calls, and it plays offline.

- Drag pieces from the tray, or tap a piece and then tap the board cell where its top-left block should go.
- Full rows and columns clear at the same time.
- Score = `5 × blocks placed + 80 × lines²`. Two lines in one move give 320 line points. Combos and board clears get celebration effects but no bonus points.
- You get three pieces per tray. The tray refills only after all three are placed, and the game ends when none of the remaining pieces fit.
- Keyboard: `1`–`3` select a piece, arrow keys aim, `Enter`/`Space` place, `Esc` cancels.
- 14 themes, each with its own block material, environment, particles, motion and synthesized sound kit.
- Optional starting boards (Settings → Game): Off, Random (the default, a 25% chance) or Always. You can also pick a variant: Scattered Start, Almost There or Corner Trouble.

## Running locally

ES modules and the Web Worker need an HTTP server. Opening the HTML file directly (`file://`) won't work.

```bash
node tools/serve.js 8080
```

Then open http://localhost:8080/. The server has no dependencies and binds to all interfaces. Any other static server works too, for example `npx serve`.

Useful URL parameter: `?seed=123` starts a reproducible seeded game. Normal play uses a random seed.

## Tests

```bash
node tests/run.js
```

`npm test` does the same thing. This runs the logic suites in Node 18+ with no dependencies. To run one suite, add a filter: `node tests/run.js openings`.

For the full browser suite, start the server and open http://localhost:8080/tests/index.html. It runs the same suites plus DOM tests: redraws keeping running animations, effects cleanup, environments, small-phone layouts, every theme × starting-variant combination, and the restart, game-over and View Board flow. The browser suite writes to this origin's localStorage (opening mode, high score) and restores the opening mode afterwards.

What the suites cover:

| Area | File |
|---|---|
| Collision, bounds, simultaneous row/column clears, scoring | `tests/rules.test.js` |
| Whole-tray solvability (pieces that fit alone but not together), clears between simulated moves, recency ordering, uniform orientation weighting, constructive fallback | `tests/rules.test.js`, `tests/generator.test.js` |
| 100 accepted seeded boards per variant with accepted/rejected counts, layout constraints, opening-batch sequence, Almost There early clear, bounded fallback that keeps the same tray, Off mode matching normal generation, reproducibility, fresh layouts | `tests/openings.test.js` |
| Game over, refill timing, many successive batches, duplicate input, stale worker results after restart, scoring of pre-placed blocks, touch/mouse drag and cancellation | `tests/game.test.js` |
| Theme registry completeness, preview/cancel/commit, theme switching without gameplay changes, auto-switch only on an all-clear | `tests/themes.test.js` |
| Settings persistence and unavailable storage, audio unlock/drop-when-suspended/voice limits/buffer cache/cleanup (fake Web Audio) | `tests/settings-audio.test.js` |
| DOM, layout at 320×568 to 430×932 plus landscape, 14 themes × 3 variants | `tests/dom.test.js` (browser only) |

## Testing on an iPhone

1. Connect the computer and the iPhone to the same Wi-Fi network.
2. Run `node tools/serve.js 8080`. The script prints `http://<your-LAN-IP>:8080/`.
3. Open that address in Safari on the iPhone. Sound starts after the first tap, because iOS requires a user gesture before audio can play.
4. Optional: tap Share → Add to Home Screen for a full-screen app that respects the safe areas.
5. To debug on the device, turn on Settings → Safari → Advanced → Web Inspector, then open Safari on a Mac → Develop → *your iPhone*.

Service workers need HTTPS or localhost, so offline play over a LAN IP won't activate. Test offline on GitHub Pages (HTTPS) instead: load the game once, turn on Airplane Mode, then reload.

## Deploying to GitHub Pages

1. Push this folder to a repository. The game's files must sit at the repository root, or in `/docs` if you choose that option.
2. Go to Settings → Pages → Build and deployment → Deploy from a branch, then pick the branch and folder.
3. Open `https://<user>.github.io/<repo>/`. All paths are relative, so the game works under a sub-path.
4. When you add or rename files, update the `ASSETS` list in `sw.js` and bump `VERSION`.

## Project layout

```
index.html               App shell and dialogs
styles/base.css          Layout, HUD, tray, dialogs, settings sheet, safe areas
styles/materials.css     The 14 block materials and per-theme board framing
styles/effects.css       Previews, placement and clear animations, labels, particles, game over
styles/environments.css  Animated theme backgrounds
src/core/shapes.js       The 27 fixed orientations
src/core/rules.js        Bitboard rules shared by real moves, the generator search and tests
src/core/generator.js    Fair tray generation (recency ordering, 12 + 16 proposals, constructive fallback)
src/core/openings.js     Starting-board registry, geometry checks, opening validation
src/core/game.js         Game state controller (DOM-free, event based)
src/core/settings.js     localStorage preferences with an in-memory fallback
src/core/rng.js          Seeded RNG (mulberry32)
src/gen/service.js       Worker client with a synchronous fallback, timeout and stale-result guard
src/gen/worker.js        Module Web Worker for generation
src/themes/themes.js     Theme registry, auto-switch rule, ThemeController
src/audio/engine.js      Web Audio engine (unlock, recovery, voice limit, buffer cache, loudness)
src/audio/kits.js        Per-theme procedural sound kits
src/ui/render.js         Board and tray rendering (diff-based)
src/ui/drag.js           Pure drag controller (touch lift, snapping, cancellation)
src/ui/input.js          Pointer, tap-to-place and keyboard bindings
src/ui/effects.js        Effects layer and bounded particle system
src/ui/environments.js   Background motif builders
src/ui/app.js            Wiring, dialogs, settings, isolated effects demo
sw.js                    Offline cache (network-first, cache fallback)
tools/serve.js           Static dev server
tools/make-icons.js      Regenerates the PNG icons
```

## Extending

### Add a theme

1. Add an entry to `THEMES` in `src/themes/themes.js`, or call `registerTheme(...)`. An entry needs:
   - `id`, `name`
   - `material`: CSS class `m-<material>`
   - `env`: a key in `ENVIRONMENTS`
   - `particle`: a key in `KINDS` in `src/ui/effects.js`
   - `sound`: a key in `KITS`
   - `palette`: exactly 7 colours
   - `vars`: CSS custom properties. Copy an existing theme's keys.
2. Add the block material in `styles/materials.css`:
   - `.m-<material> { … }` plus an optional `> i` decoration layer
   - optional board framing under `[data-theme="<id>"] .board`
3. Add `.m-<material>.fx-place` and `.clear-ghost.m-<material>` animations in `styles/effects.css`.
4. Add an environment in `src/ui/environments.js`, with `static()` and `motion()` HTML builders, and its CSS in `styles/environments.css`. Reuse an existing environment if that fits better.
5. Add a sound kit in `src/audio/kits.js` with `place`, `invalid`, `clear`, `combo`, `allClear`, `gameOver` and `ui`. The material helpers (`bell`, `glass`, `wood`, `metal`, `clack`) are shared.
6. Run `node tests/run.js`. The theme tests check that every material, animation, particle, environment and sound event exists.

Auto-switch follows registry order.

### Add a starting-board variant

Push an object onto `OPENING_VARIANTS` in `src/core/openings.js`, or call `registerOpeningVariant(...)`:

```js
{
  id: 'stripes', name: 'Stripes', description: '…',
  cellRange: [8, 14],                                // allowed occupied-cell count
  generate(rng) { return { cells: new Set([...]), meta: {} } }, // or null to retry
  check(set, meta) { return [] },                    // extra geometry problems (optional)
  needsClear(meta) { return [lineIndices] },         // optional: require an early clear (rows 0-7, cols 8-15)
}
```

The shared pipeline then handles the rest:
- bounded retries (12)
- common geometry checks: no full lines, no isolated gaps, at least two empty 3×3 windows and six empty 2×2 windows
- one fair tray draw
- the placement-count and full-sequence checks
- falling back to an empty board while keeping the same tray

The variant shows up in Settings → Game automatically. Add it to the per-variant loop in `tests/openings.test.js` to get the 100-board report.

## Design notes

- **Fair generation.**
  - Recently offered shapes (the last nine) are shuffled toward the end of the collection.
  - Attempts 1–12 draw three distinct shapes from the fresh prefix `max(10, 27 − recent)`.
  - Attempts 13–28 draw uniformly with replacement.
  - Every proposal is validated by a memoised depth-first search over piece orders and legal placements, applying real clears between moves.
  - If all of those fail, a complete constructive search finds a valid three-piece sequence.
  - Generation runs in a module worker. Results from a previous game or batch are discarded.
- **Starting boards** never reroll the tray. The opening tray is drawn once by the normal generator. If the board/tray pair fails validation, the board becomes empty, the same tray is kept and its sequence is recomputed.
- **Rendering** keeps cell elements persistent, so placement animations aren't cut off by redraws. Cleared cells are copied into an overlay that animates while the real board updates immediately, so placement geometry stays exact.
- **Audio** is fully procedural, so no recordings are bundled and no credits are needed. Each kit is built from material models: modal partials for ceramic, glass, wood and metal, filtered-noise friction, droplets and envelopes. On top of that, each kit has its own event rhythms.
  - Every voice goes through a master gain and a gentle compressor, with a 36-voice limit and a capped combo intensity.
  - Sounds are never queued while the context is suspended.
  - Mahjong is built from layered ceramic clacks, a table thump and shuffle friction, not musical tones.
- **Motion.** `prefers-reduced-motion` turns off particles, sweeps, board shakes and background motion, leaving short fades. Backgrounds pause while the page is hidden and are rebuilt without motion nodes when Animated Backgrounds is off.

## Verification status

- **Automated (Node):** the logic suites listed above. Run them yourself with `node tests/run.js`.
- **Desktop browser (Chromium-based, the built-in preview browser):**
  - the browser test page, including iframe layouts at 320×568, 375×667, 390×844, 430×932 and 568×320 landscape
  - all 42 theme × variant starts
  - synthetic touch PointerEvents (lift, cancel, double pointerup)
  - keyboard play
  - real Web Audio playback of all 14 kits × 8 events (checked for errors and voice limits; the sound itself was not listened to)
  - offline reload with the server stopped
- **Simulated mobile:** viewport emulation only.
- **Not done:** testing on a physical iPhone or in Safari/WebKit. iOS-specific behaviour has not been exercised on real hardware, including audio unlock, safe areas, home-indicator spacing, rubber-band prevention and app-switch recovery.
