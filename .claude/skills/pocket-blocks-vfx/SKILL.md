---
name: pocket-blocks-vfx
description: >
  The Pocket Blocks VFX workflow and Rui's aesthetic preferences, learned from
  the Jelly Pop pilot. Use whenever designing, prototyping, reviewing or
  shipping visual effects for any Pocket Blocks theme (clears, placement,
  streaks, board clears, idle), and before touching src/ui/vfx*.js,
  src/ui/vfx-choreo/, src/ui/vfx-jelly/ or studio/.
---

# Pocket Blocks VFX

Pair this with the `motion-design` skill (timing, easing, Disney principles).
This file is project memory: what worked, what was rejected, and why.

## The workflow (non-negotiable)

Never describe an effect and ship it straight into the game. Every theme goes:

1. **Inspect.** Read the theme's entry in `src/themes/themes.js`, its block
   material in `styles/materials.css`, its environment, and any existing
   choreography. Screenshot the theme on a phone-width board.
2. **Three concepts.** Develop three *substantially different* single-line
   clear concepts as Studio variants (`studio/concepts/<theme>-*.js`). Each:
   inspiration and feeling, one primary motif, material and rendering style, a
   7-keyframe storyboard (anticipation → transformation → climax →
   follow-through → settle), and how it differs from every existing theme.
   They must differ in *motif*, not just in particles.
3. **Storyboards first.** Render keyframes on the real board at 390 px with
   the Studio's storyboard view, inspect every frame yourself, fix what looks
   wrong, and only then present them. Stop and wait for a pick.
4. **Animate the pick, single clear only.** Refine timing and easing in the
   Studio. Expose parameters specific to the design (not a generic particle
   panel). Get approval.
5. **Extend the language** to idle, placement, multi-line, streak and board
   clear. Each event gets its own *choreography*, not more particles.
   Milestones are opt-in (see preferences). Get approval for the full set.
6. **Ship it** only after an explicit go-ahead: move the approved files into
   `src/ui/vfx-<theme>/` so the Studio and the game import the same code, and
   write a thin adapter in `src/ui/vfx-choreo/<theme>.js` (see Jelly).
7. **Verify in the real game**: screenshots of the shipped effect side by side
   with the Studio, rapid play (0 blocked moves), 4x-throttled timing,
   `node tests/run.js`, and the browser suite at `/tests/index.html`.

Work on a branch. Production effects of other themes are never touched.

## The VFX Studio (`/studio/`)

Dev only; never imported or cached by the game. URL options:
`?theme=jelly&variants=jelly-c,prod-current&event=single&fixture=row-mid&device=390&t=600&paused=1&storyboard=jelly-c`

- A concept is a pure function of time:
  `{ id, label, supports: [events], params, presets, duration(P, ev), keyframes(P, ev), prepare(scene, P, ev), render(ctx, t, state, scene, P, ev) }`.
  Purity is what makes scrubbing, stepping, looping and storyboards exact.
  Use the seeded `rng()` from `jelly-art.js`, never `Math.random`.
- `prepare` may return `hidden: [cellIndices]`: cells the concept animates
  itself, hidden on the DOM board while it plays.
- Production variants (`studio/variants/production.js`) run the real engine on
  a simulated clock for side-by-side comparison.
- Capture storyboards with Playwright: open `?storyboard=<id>&event=<ev>&paused=1`
  and screenshot each `.panel` at deviceScaleFactor 2.

## Shipping adapter pattern (`src/ui/vfx-choreo/jelly.js`)

- Build the Studio's scene from the live board: `v.cell(i)`, `linesOf(v, move, theme)`,
  `v.board.state` for colours, `bounds` from cells 0 and 63.
- One event per move, by priority: board clear > multi-line (row + column) >
  streak (combo ≥ 2) > single. Placement only when the move cleared nothing.
  Define `streak`, `boardClear` and `milestone` as no-ops so shared defaults never run.
- Effects that animate cells still on the board (idle, placement) hide them
  with `.vfx-hide` and **abort if those cells change** (the player moved).
- Long-travelling choreography sets `pad` on the adapter (Jelly: 0.34) so the
  canvas margin is deep enough; the engine reads it.
- Intensity (`v.level`) scales sparkle density; never silently simplify the art.
- On dark themes the engine draws items with additive `'lighter'` blending.
  Studio art is drawn `source-over`, so the adapter sets `blend: 'source-over'`
  on its items (Classic does) or the shipped look drifts from the approved one.
- Second shipped example: `src/ui/vfx-choreo/pastel.js` (Classic) adapts the
  light suite in `src/ui/vfx-classic/suite.js`; theme id stays `pastel` so
  saved settings survive the rename.

## Rui's preferences (learned in review)

Loved:
- **Character over particles.** The winning Jelly concept made the blocks the
  dancers (crouch, canon hop, pirouette, pose, follow-the-leader exit with
  ribbon trails). It "works best from a gameplay perspective": the eye follows
  a few clear actors instead of a cloud.
- Glossy, rounded, pastel candy; crisp tilted specular highlights; translucent
  confectionery; sparkles as garnish, not substance.
- The carousel ring in the board clear.
- Blocks on the board must look like the blocks in the effects. When an effect
  introduced a nicer block, the board blocks were redrawn to match (CSS
  `.m-gel` now mirrors `jellyBlock()` in `jelly-art.js`).
- Quick pace for quick play: Jelly's clear went from ~2.0 s to ~1.6 s. Keep
  anticipation ≥ ~80 ms (below that it stops reading); tighten holds and exits.

Rejected:
- **Biological / slimy**: long connected gelatin masses, membranes, merging
  ovals, organic necking. ("disturbingly organic")
- **Soap bubbles**: round translucent droplets read as Cream Soda, not candy.
- **Generic radial bursts, recoloured particle systems, scattered droplets**
  without composition.
- **Faces on blocks** for a jelly/candy theme: they turn material into mascots
  and "don't fit the theme". Personality must come from motion.
- **Milestone effects** when the theme already has an animated background:
  "I don't know if we Need them". Make milestones opt-in per theme.
- Flat geometry, cheap gradients, heavy blur; gradients fading to transparent
  *black* (turns glows grey on light themes; use `clearOf(color)`).
- **Light on dark skies:** a wide, pale glow reads as beige fog. Use a compact
  point (near-white core, short *saturated* falloff: `lightSprite` in
  `vfx-cloud/cloud-art.js`). Additive blending does not help: the effect canvas
  is transparent over the DOM board, so 'lighter' has nothing to add to.
- **"Translucent" on a dark board** means lit from within (blend towards warm
  light, lay a lit face over the base), never alpha towards the dark board,
  which turns pearls grey-olive.

Classic (formerly Classic Pastel), second review:
- Rejected **decorative** directions outright (satin ribbon waltz, porcelain
  petals, opalescent inlay): "unnecessarily decorative and elaborate".
- Loved **abstract, premium light**: a crisp sweep edge (single), a resonance
  pulse on both lines with a flare at the crossing (multi), and especially a
  band of coloured light running round the **board frame** (streak, board clear).
- Readability comes from saturated coloured light with thin white filaments,
  not white blooms. Grid tick marks and too many sparks clutter multi-line
  clears: one spark per block, and only lift *empty* neighbouring cells.
- Asked for a **dark board** (midnight navy-black, saturated blocks) so colour
  pops; a strong backdrop change can be the best VFX upgrade.

Cloud Palace, third review (Pearl of Dawn shipped, `src/ui/vfx-cloud/`):
- Restyled to a **twilight sky** (dusk indigo board, warm horizon) so champagne
  light and gold glints read; pale lilac washed every warm light out.
- Picked the **in-place, inward** concept (pearl kindles, dissolves from its
  edges with gold glints on the contour, melts to a point of light) over
  rising motes and parting clouds.
- Pace for a calm theme: "a little too fast" at ~1.0 s; shipped single ~1.1 s.
- **Every event needs its own ending gesture.** Streak (gather, then halo) and
  board clear (frame race, then a centre halo) "look really similar"; the board
  clear now washes light inward over the cell contours instead. Audit the set
  side by side for shared endings before presenting.

Neon Arcade, fourth review (Power Down shipped, `src/ui/vfx-neon/`):
- Rui had no concepts this time and asked Claude to propose three. Picked the
  CRT switch-off for "gameplay" readability, but loved the stepped 8-bit
  Derez too.
- **Direction can matter:** "vertical line clearing doesn't give the same
  effect of a CRT turning off". Rows power down; columns derez (sideways
  zig-zag lanes). The suite dispatches by `line.axis` (`lineFx`), and the
  multi-line mixes both: the row bar implodes into the crossing while the
  column derezzes outward from it. Offer a per-axis split whenever a motif
  has a natural orientation.
- Stepped (frame-quantised) motion is welcome as a contrast if formations
  stay structured: each pixel lattice keeps its own lane and colour.

Cream Soda Pop, fifth review: after seeing three new concepts (Champagne
Fizz, Ice and Refraction, Soda Fountain; kept in the Studio), Rui chose to
keep the existing batch-1 soda choreography and only remove its translucent
liquid band. Before redesigning, ask whether the current effect just needs a
part taken out.

Concepts not chosen (kept in the Studio for reference): Gummy Jewel Cascade
(safe, least distinctive) and Sugar Crystal Transformation (elegant, but read
as gemstones rather than edible candy).

## Keeping themes from becoming interchangeable

- Decide the theme's **motif** first, in one sentence (Jelly: "character and
  rhythm, the blocks are the dancers"). Every event must express it.
- Check new concepts against existing themes' motifs: Classic = abstract coloured light and frame circuits,
  Jelly = candy ballet, Cloud = pearls dissolving inward into points of light with gold contour glints, Soda = rising bubbles,
  Patisserie = piped frosting. Do not reuse another theme's silhouette.
- Contrast directions: soda rises; jelly hops and loops; classic sweeps and circles the frame;
  patisserie pipes along paths. Pick a direction of travel nobody owns yet.
- Bigger achievements get new choreography (twin troupes, a painted heart, a
  carousel), never just more particles.

## Rendering and mobile performance

- Draw everything on one canvas over the board; pre-render sprites once per
  colour (`spriteOf`); no live `filter: blur` or `shadowBlur`.
- Canvas at ≤ 1.5x device pixels for glows; crisp shapes look fine there.
- Frame cost on throttled phones is mostly **rasterising area**, not JS (the
  engine's draw timer can read 0.5 ms while frames take 70 ms). Benchmark each
  layer in-page (render, then `getImageData(0,0,1,1)` to flush) with layers
  switched off to find the heavy one. Cloud's fix: cache each pearl face as a
  sprite (per colour, 8 sheen angles crossfaded, regular + lit), stamp faint
  rings instead of redrawing whole blocks, and pre-build sprites a few at a
  time in idle (`pearlWarmJobs`). Result ~27 ms p95 at 4x (Classic 21, Jelly 36).
- Jelly ballet: ~3 ms draw per frame (≤ 10 ms worst) at 4x CPU throttle;
  0 blocked moves in rapid play. Rendering cost is in the dancers and
  ribbon segments, so keep ribbons ≤ ~18 segments per dancer.
- Effects never block input: the board updates immediately; cleared cells are
  canvas snapshots.
- Respect reduced motion (canvas off) and the Effect intensity setting.
- Switching theme must tear down every timer, item and `.vfx-hide` class.

## Gotchas

- Studio line objects carry no `pitch` or colour index `ci` (the game's
  `linesOf` lines do): derive pitch from `line.len / 7` and the index from the
  palette (`ciOf` in `vfx-neon/neon-art.js`), or maths silently goes NaN.
- A theme shipped outside its batch must be added to `CHOREO` in
  `src/ui/vfx-choreo/index.js` and to the registry test in `tests/vfx.test.js`.

- The dev server (`node tools/serve.js 8080`) dies between turns; restart it.
- Mobile Safari caches hard; bump `VERSION` in `sw.js` and list new files.
- GitHub Pages serves one branch; the Studio only exists where it's merged.
- Blast's "Colour Wipe" flash and labels are mode-wide; they overlap theme
  finales briefly by design.
