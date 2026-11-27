# FX Reel picks (themes 06–30)

Rui's choices from the FX Reel (live mockups, three concepts per theme), 2026-11-26.
Letters refer to the reel's concepts. "Row / column" means a different concept per
line direction, like Neon Arcade (rows CRT, columns derez).

| # | Theme | Rows | Columns | Notes |
|---|---|---|---|---|
| 06 | Nostalgic Steampunk | A Steam Vent | B Gear Train | |
| 07 | Moonlit Koi Pond | B Koi Pass | B | |
| 08 | Little Witch's Apothecary | C Rune Seal | C | |
| 09 | Strawberry Patisserie | B Piped Ribbon | B | Add randomised strawberries, sprinkles or chocolate drizzle |
| 10 | Abyssal Aquarium | A Lumen Pulse | A | |
| 11 | Clockwork Toybox | B Domino Topple | B | |
| 12 | Stained Glass Reverie | A Sunbeam Through | A | |
| 13 | Dreamware 2004 | — | — | Likes B (Progress Bar) but it feels awkward; the theme needs an overhaul first (not reading as Frutiger Aero) |
| 14 | Mahjong Parlor | A Tile Flip | A | |
| 15 | Starflower Post | R2 C Firework Bloom | R2 C | Round two (punchier Star Bloom) |
| 16 | Moonside Mechanism | B Orbit | A Phase Wane | |
| 17 | Pixel Crush | B Bounce Drop | A Downsample | |
| 18 | Capsule Field Notes | A Capsule Pop | A | |
| 19 | Queen's Tea Party | A Card Fan | B Riffle | |
| 20 | Paper Sky Daydream | A Paper Plane | A | |
| 21 | Prism Desk | C Widget Dismiss | C | |
| 22 | Lily Reliquary | R2 A Gilded Ascension | R2 B Bell Toll | Round two (new directions) |
| 23 | Starry Alchemy | B Zodiac Wheel | C Painted Stars | |
| 24 | Garden Ticket | B Tear Stub | B | |
| 25 | End of the World | B Halftone Dissolve | B | |
| 26 | Garden of Doors | A Doors Open | R2 C Sliding Panels | Round two gave the column concept |
| 27 | Heaven 404 | B Rainbow Glitch (calmed) | A Error Cascade | Rows: B, made gentle, no strobing |
| 28 | Surveil | A Target Lock | A | |
| 29 | Totality | C Monolith Sink | C | |
| 30 | Room 201 | B Teal Grain | B | |

Round two: https://claude.ai/artifact/8WK4KWBQFDcgsknmeZwkiR (Garden of Doors columns, Starflower
Post, Lily Reliquary). Mockup source for both reels lives outside the repo; rebuild each pick
properly in the Studio.

Later, after the effects ship: some themes will need a sound update to fit their new effects.

## Status

- Line clears (rows, columns, multi-line) for all 23 picked themes plus Strawberry Patisserie are in
  the game (src/ui/vfx-reel/reel-fx.js, generated from the reel mockups; adapter src/ui/vfx-choreo/reel.js).
  Patisserie keeps its batch-1 placement, streak and board clear and gains the piped ribbon with
  random toppings (strawberries, sprinkles or chocolate drizzle).
- Still to design per theme: placement, streak, board clear (shared recipe effects for now), then sound.
- Dreamware 2004: theme overhaul first.

## Round three (board clear, placement, idle)

https://claude.ai/artifact/ScJQdFCiDCvZAYGf5LCJPP: three board-clear concepts per theme (each plays the
theme's picked line clear, then its finale) plus one placement and one idle concept to keep or send
back, for the 23 themes above. Strawberry Patisserie keeps its batch-1 board clear, placement and idle.
Picks (board finale / placement / idle):

| Theme | Board | Placement | Idle |
|---|---|---|---|
| Steampunk | B Great Gear | Rivet Set | Seam Wisp |
| Moonlit Koi | B Koi Circle | Settle Ripple | Nibble |
| Witch's Apothecary | A Grand Circle | Sparkle Pop | Rune Wink (new: vapour read like Steampunk) |
| Abyssal Aquarium | C The Lure | Glow Settle | Bobbing (new, per note) |
| Clockwork Toybox | B Toy Parade | Wooden Bounce | Wind Wiggle |
| Stained Glass | B Morning Light | Pane Glint | Pane Glint (per note) |
| Mahjong Parlor | B Shuffle | Clack | none |
| Starflower Post | C Star Fireworks | Sticker Press | none |
| Moonside Mechanism | B Orrery Rings | Bezel Glint | Phase Shift |
| Pixel Crush | C Screen Wipe | Two-Frame Flash | none |
| Capsule Field Notes | B Capsule Shower | Pencil Tick | Capsule Wobble |
| Queen's Tea Party | A Card Shower | Card Snap | Suit Pulse |
| Paper Sky | A Paper Flock | Crease Flash | Passing Plane |
| Prism Desk | C All Clear Widget | Frosted Lift | Refraction Spark |
| Lily Reliquary | B Sanctum Doors | Foil Gleam | Drifting Ember |
| Starry Alchemy | C Shooting Stars | Swirl Brushed In (new, per note) | Twinkle |
| Garden Ticket | B Garden Sprouts | Perforation Stitch | Ticket Flutter |
| End of the World | C Last Moon | Dot Pop | Passing Bird |
| Garden of Doors | A Grand Doors | Latch Click | Door Ajar |
| Heaven 404 | B Goldfish Bowl | Window Pop | Blinking Cursor |
| Surveil | A Area Secured | Bracket Snap | Hunting Box |
| Totality | C Monoliths Rise | Stone Thud | Mark Glow |
| Room 201 | C Tape Rewind | Needle Tick | Star Twinkle |

All shipped in src/ui/vfx-reel/reel-fx.js (FINALE). Streaks and milestones still use the shared effects.

## Dreamware 2004 (overhaul)

Theme direction A, Media Player (https://claude.ai/artifact/2iAsibmAM2S1u54pFKhpPZ, round two built from
Rui's references). Effects designed by Claude without a pick round, at Rui's request, for testing in game:
rows Seek Bar, columns Bubble Rise, board Now Playing (equaliser), placement Sparkle Click, idle Bubble Drift.
