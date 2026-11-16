# Gameplay feel & tray generation report

This report compares the original generator (`classic`) with the board-aware generator (`rhythm`, now the default). Full numbers are in [`results/final.md`](results/final.md). That run was 6,000 simulated games: the same 750 seeds for each generator, played by four strategies.

## 1. What was wrong with the original generator

**Verified by simulation** (2,000-game baseline, `results/baseline-classic.md`):

- **Thin trays decide the run.** The only quality gate was "some order of the three pieces fits". Many offered trays allow just 1–4 opening moves that keep the rest of the tray placeable.
  - For the planning bot only 4.2% of trays were that thin, but they caused 83% of its game-overs (231/277).
  - Those game-overs came at only about 29 of 64 cells filled. The board was half empty and a 3×3 or 5-long piece had nowhere to go.
  - This is the "the generator decides whether I win" feeling.
- **The generator never looks at the board beyond legality.** It doesn't know which lines are nearly complete or how fragmented the board is. Clear opportunities are incidental.
- **Repeated shapes never happen.** 0.0% of trays contained a duplicate. Attempts 1–12 draw three distinct shapes, and the first attempt almost always succeeds.
- **Recovery from crowded boards is poor.** Getting from 36+ filled cells back down to 22 or fewer happened 1% of the time for random play, 21% for greedy and 60% for 1-ply play.
- **Big rewards are rare.** Multi-line clears are 4–13% of clears, and a full board clear happened in about 1 in 100 strong games.

**Hypotheses that didn't hold up:**

- *"Trays often allow no clear at all."* Not really: a clear was possible in 88–98% of trays. The problem is tray *composition* and narrowness, not missing clears.
- *"The shape weights are the main problem."* No. The size mix (48% four-cell pieces) is unremarkable. Board-blindness and thin trays matter far more.

**Reference footage** (Block Blast, two games, about 60 stills reviewed by eye; these are observations, not measurements):

- Openings are chunky and rewarding: 3×3, 2×3, 5-long and 2×2 pieces lock together into multi-line clears and combos within the first minute.
- Tray pieces often complement each other across the 8-wide board (3+5, 3+3+2).
- Identical pieces appear often: about 5 of 9 fully visible trays.
- Later trays are smaller and more irregular. I did **not** copy that as a time-based ramp, since difficulty here should respond to the board, not to time or score.

## 2. What changed

Two new files:
- `src/core/generator-rhythm.js`: the generator.
- `src/core/boardeval.js`: fast bitboard board features: isolated cells, one-way cells, roughness, room for 3×3 and 5-long pieces, and nearly complete lines.

The registry in `src/core/generators.js` keeps `classic` available: set `DEFAULT_GENERATOR = 'classic'` or open the game with `?gen=classic`.

For each tray, the new generator does four things:

1. **Picks a mood** from board pressure (filled cells plus fragmentation) and how many trays have passed without a clear. It never looks at the score.
   - *build*: spacious board. Variety and setups; multi-line freebies are discouraged.
   - *tension*: awkward, bulkier pieces with moderate breadth, but never razor-thin.
   - *reward*: more likely the longer you go without clearing, and on boards with nearly complete lines.
   - *recovery*: weighted by pressure squared, so it's occasional, not constant.
   - *warm-up*: the first 4 trays of a game lean towards reward, like Block Blast's chunky openings.
2. **Drafts about 12 candidate trays**, all from the existing 27-shape pool:
   - 7 random draws using the original uniform per-orientation weights, with repeats allowed and light damping for the last few shapes
   - 2 twin trays
   - 1 "tiling" tray (rectangular pieces whose spans add to 8)
   - 1 lighter tray
   - when the board has nearly complete lines: single, double and multi-line "completer" trays
3. **Simulates every candidate.** Each must pass the shared `findSequence` check (the whole tray placeable, with real clears between moves). A beam search over piece orders and placements then measures the best reachable lines, the board's health after the best plan, and the number of viable first moves.
4. **Picks by softmax** over the mood's score, plus 12% purely random picks. It doesn't always pick the best tray, and nothing guarantees a clear or survival.

Fairness rule shared by every mood: trays with 2 or fewer viable opening moves are heavily penalised, and trays with 3–4 mildly.

Ordinary empty-board starts use the active generator. Special starting layouts (Scattered, Almost There, Corner Trouble) still draw their tray with the classic generator, so their validation behaves exactly as before.

**Unchanged:** scoring, combos, rules, board size, themes, animations, audio, input and starting-board variants.

## 3. Before and after (750 seeds per strategy, classic → rhythm)

| | random | greedy | space (1-ply) | lookahead |
|---|---|---|---|---|
| Moves per game, median | 13 → 16 | 20 → 26 | 38 → 50 | 539 → 600 (cap) |
| Moves that clear | 11.0% → 15.5% | 27.4% → 31.8% | 36.3% → 37.4% | 43.7% → 43.7% |
| Multi-line clears per 100 moves | 1.4 → 2.5 | 1.2 → 1.9 | 2.7 → 3.5 | 4.0 → 4.5 |
| Full-board clears per game | 0 → 0 | 0 → 0.02 | 0 → 0.02 | 0.01 → 0.07 |
| Recovered from ≥36 to ≤22 filled | 1% → 4% | 21% → 49% | 60% → 78% | 97% → 98% |
| Trays with ≤4 viable first moves | 12.2% → 4.4% | 13.0% → 5.2% | 11.1% → 4.7% | 4.2% → 3.2% |
| Game-overs from such trays | 318 → 128 | 338 → 187 | 419 → 259 | 337 → 218 |
| Tension cycles per 100 moves | 0 → 0 | 0.2 → 0.4 | 0.7 → 1.2 | 1.7 → 2.0 |
| A clear was possible in the tray | 88% → 94% | 91% → 95% | 95% → 97% | 98% → 97% |
| Trays with a repeated shape | 0% → 25% | 0% → 25% | 0% → 25% | 0% → 27% |
| Distinct 3-piece combinations | 2082 → 2403 | 2560 → 3145 | 2880 → 3567 | 2925 → 3654 |

How to read this:

- The fairness gain is large: thin trays are about 60% rarer.
- Games are longer, but modestly. Classic was already near the 600-move cap for the planning bot. Rhythm caps 51% of its games (vs 46%), so strong players still lose, mostly to bulky pieces at around 29 cells filled.
- Most of the gain is in feel, not length:
  - more clearing moves and multi-line clears
  - real recovery from crowded boards
  - more full build → crowd → clear cycles
  - more variety and repeats
- Whether a clear was *possible* barely changed, so the generator isn't handing out clears. It offers better-composed trays that the player still has to use well.

A cross-check of the real `Game` controller (`tools/sim/game-check.js`, 600 games each) matches the harness: classic 14.4 moves and an 11.6% clear rate, rhythm 17.5 moves and a 15.0% clear rate.

## 4. Remaining concerns

- **Bots aren't people.** These strategies don't plan combos the way a human does, and humans may find the tension moods harsher or softer than the numbers suggest. Real play-testing should decide the final tuning: mood weights in `chooseMood`, scores in `moodScore`, and `RANDOM_PICK`/`TEMPERATURE`.
- **Rubber-banding risk for weak players.** On boards where the player keeps failing to clear, the *reward* mood fires on about 44% of trays. It improves feel for the random bot, but a perceptive player might notice "help" arriving after dry spells.
- **Small pieces are more frequent for weak players.** Pieces of 1–2 cells went from 12% to 18%. Pairs and the single block appear 1.6–1.7× their uniform rate, and zig-zags about 0.65×. For strong players every shape is within 0.8–1.25× of uniform.
- **Ending a run is still mostly about bulky pieces** at mid occupancy. That's intended difficulty (keep room for 3×3 and 5-long pieces), but it's the main way runs end.
- **The footage was reviewed by eye** from about 60 stills, not measured frame by frame.
- **No physical-device testing** was done for this change. Desktop browser and Node only.

## Reproduce

```
node tools/sim/simulate.js --games 750 --gens classic,rhythm --label final
node tools/sim/game-check.js 600
node tests/run.js
```
