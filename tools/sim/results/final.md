# Simulation: classic vs rhythm

6000 games, 750 seeds per generator × strategy, move cap 600, 93s.

## Strategy: random

| Metric | classic | rhythm |
|---|---|---|
| Games (capped at move limit) | 750 (0) | 750 (0) |
| Moves per game: mean / median | 14 / 13 | 17.8 / 16 |
| Moves per game: p10 / p90 | 8 / 22 | 8 / 29 |
| Pieces between clears: mean / median / p90 | 5.7 / 4 / 11 | 4.9 / 4 / 11 |
| Longest dry spell per game (mean) | 6.1 | 7.4 |
| Moves that clear | 11.0% | 15.5% |
| Trays where the player cleared | 27.2% | 40.1% |
| Multi-line share of clears | 12.9% | 16.0% |
| Multi-line clears per 100 moves | 1.4 | 2.5 |
| Board clears per game | 0 | 0 |
| Mean occupancy (cells of 64) | 23.6 | 25.9 |
| Tension cycles per 100 moves (<=16 -> >=32 -> <=16) | 0 | 0 |
| High-occupancy episodes (>=36) per game | 0.8 | 0.9 |
| Recovered from >=36 to <=22 | 1.3% | 3.7% |
| Trays with <=4 viable first moves | 12.2% | 4.4% |
| Trays where a clear was possible | 88.2% | 93.8% |
| Trays with a repeated shape | 0.0% | 24.6% |
| Shape entropy (1 = uniform) | 0.999 | 0.989 |
| Max per-shape deviation from uniform | 24.4% | 73.1% |
| Piece sizes 1-2 / 3 / 4 / 5-9 cells | 12.4% / 23.1% / 48.1% / 16.4% | 18.1% / 25.0% / 39.8% / 17.1% |
| Distinct three-piece combinations | 2082 | 2403 |
| Combination entropy (bits) | 10.84 | 10.93 |
| Game-over causes | crowded 339, fragmented 241, bulky-piece 138, other 32 | crowded 368, fragmented 230, bulky-piece 118, other 34 |
| Occupancy at game over (mean) | 38.2 | 38.9 |
| Deaths after placing 0 / 1 / 2 pieces of the last tray | 0 / 112 / 638 | 0 / 69 / 681 |
| Final tray: viable first moves at offer (mean) / deaths from trays with <=4 | 9.5 / 318 | 13.3 / 128 |
| Deaths where a 5+ cell piece was stuck | 385 | 338 |
| Tray moods | – | reward 2085, recovery 1288, build 869, tension 474 |

## Strategy: greedy

| Metric | classic | rhythm |
|---|---|---|
| Games (capped at move limit) | 750 (0) | 750 (0) |
| Moves per game: mean / median | 23.9 / 20 | 34.3 / 26 |
| Moves per game: p10 / p90 | 11 / 41 | 11 / 68 |
| Pieces between clears: mean / median / p90 | 3.2 / 3 / 7 | 2.9 / 3 / 6 |
| Longest dry spell per game (mean) | 6.9 | 6.8 |
| Moves that clear | 27.4% | 31.8% |
| Trays where the player cleared | 60.6% | 68.6% |
| Multi-line share of clears | 4.3% | 5.9% |
| Multi-line clears per 100 moves | 1.2 | 1.9 |
| Board clears per game | 0 | 0.02 |
| Mean occupancy (cells of 64) | 22.9 | 23.2 |
| Tension cycles per 100 moves (<=16 -> >=32 -> <=16) | 0.2 | 0.4 |
| High-occupancy episodes (>=36) per game | 0.8 | 1 |
| Recovered from >=36 to <=22 | 20.8% | 48.6% |
| Trays with <=4 viable first moves | 13.0% | 5.2% |
| Trays where a clear was possible | 91.4% | 94.8% |
| Trays with a repeated shape | 0.0% | 25.1% |
| Shape entropy (1 = uniform) | 0.999 | 0.992 |
| Max per-shape deviation from uniform | 36.5% | 55.2% |
| Piece sizes 1-2 / 3 / 4 / 5-9 cells | 12.5% / 23.2% / 48.3% / 16.0% | 16.5% / 25.0% / 41.6% / 16.9% |
| Distinct three-piece combinations | 2560 | 3145 |
| Combination entropy (bits) | 11.11 | 11.28 |
| Game-over causes | fragmented 354, bulky-piece 212, crowded 145, other 39 | fragmented 369, bulky-piece 259, crowded 88, other 34 |
| Occupancy at game over (mean) | 34.6 | 33.3 |
| Deaths after placing 0 / 1 / 2 pieces of the last tray | 0 / 25 / 725 | 0 / 24 / 726 |
| Final tray: viable first moves at offer (mean) / deaths from trays with <=4 | 8.9 / 338 | 11 / 187 |
| Deaths where a 5+ cell piece was stuck | 460 | 480 |
| Tray moods | – | reward 2744, tension 1829, recovery 2149, build 2118, fallback 1 |

## Strategy: space

| Metric | classic | rhythm |
|---|---|---|
| Games (capped at move limit) | 750 (0) | 750 (0) |
| Moves per game: mean / median | 47.9 / 38 | 67.6 / 50 |
| Moves per game: p10 / p90 | 14 / 98 | 17 / 143 |
| Pieces between clears: mean / median / p90 | 2.6 / 2 / 5 | 2.6 / 2 / 5 |
| Longest dry spell per game (mean) | 7.5 | 7.2 |
| Moves that clear | 36.3% | 37.4% |
| Trays where the player cleared | 73.5% | 76.1% |
| Multi-line share of clears | 7.4% | 9.3% |
| Multi-line clears per 100 moves | 2.7 | 3.5 |
| Board clears per game | 0 | 0.02 |
| Mean occupancy (cells of 64) | 24.2 | 23.9 |
| Tension cycles per 100 moves (<=16 -> >=32 -> <=16) | 0.7 | 1.2 |
| High-occupancy episodes (>=36) per game | 1.5 | 2 |
| Recovered from >=36 to <=22 | 60.4% | 78.3% |
| Trays with <=4 viable first moves | 11.1% | 4.7% |
| Trays where a clear was possible | 95.4% | 96.5% |
| Trays with a repeated shape | 0.0% | 24.8% |
| Shape entropy (1 = uniform) | 1.000 | 0.995 |
| Max per-shape deviation from uniform | 23.3% | 37.6% |
| Piece sizes 1-2 / 3 / 4 / 5-9 cells | 11.5% / 22.8% / 48.4% / 17.2% | 14.5% / 24.7% / 42.9% / 17.9% |
| Distinct three-piece combinations | 2880 | 3567 |
| Combination entropy (bits) | 11.33 | 11.51 |
| Game-over causes | bulky-piece 515, crowded 91, other 87, fragmented 57 | bulky-piece 570, other 80, crowded 55, fragmented 45 |
| Occupancy at game over (mean) | 33.4 | 32.6 |
| Deaths after placing 0 / 1 / 2 pieces of the last tray | 0 / 9 / 741 | 0 / 4 / 746 |
| Final tray: viable first moves at offer (mean) / deaths from trays with <=4 | 6.6 / 419 | 8.8 / 259 |
| Deaths where a 5+ cell piece was stuck | 575 | 610 |
| Tray moods | – | reward 4457, build 4202, recovery 4145, tension 4341 |

## Strategy: lookahead

| Metric | classic | rhythm |
|---|---|---|
| Games (capped at move limit) | 750 (345) | 750 (386) |
| Moves per game: mean / median | 415.6 / 539 | 440.6 / 600 |
| Moves per game: p10 / p90 | 86 / 600 | 110 / 600 |
| Pieces between clears: mean / median / p90 | 2.3 / 2 / 4 | 2.3 / 2 / 4 |
| Longest dry spell per game (mean) | 6.6 | 6.7 |
| Moves that clear | 43.7% | 43.7% |
| Trays where the player cleared | 92.7% | 91.3% |
| Multi-line share of clears | 9.1% | 10.2% |
| Multi-line clears per 100 moves | 4 | 4.5 |
| Board clears per game | 0.01 | 0.07 |
| Mean occupancy (cells of 64) | 24 | 23.8 |
| Tension cycles per 100 moves (<=16 -> >=32 -> <=16) | 1.7 | 2 |
| High-occupancy episodes (>=36) per game | 6.6 | 8.4 |
| Recovered from >=36 to <=22 | 96.8% | 98.1% |
| Trays with <=4 viable first moves | 4.2% | 3.2% |
| Trays where a clear was possible | 97.7% | 96.5% |
| Trays with a repeated shape | 0.0% | 27.0% |
| Shape entropy (1 = uniform) | 1.000 | 0.996 |
| Max per-shape deviation from uniform | 14.1% | 25.3% |
| Piece sizes 1-2 / 3 / 4 / 5-9 cells | 11.4% / 22.5% / 48.4% / 17.7% | 12.7% / 23.0% / 43.7% / 20.6% |
| Distinct three-piece combinations | 2925 | 3654 |
| Combination entropy (bits) | 11.49 | 11.64 |
| Game-over causes | bulky-piece 365, other 18, fragmented 16, crowded 6 | bulky-piece 348, other 10, fragmented 6 |
| Occupancy at game over (mean) | 29.1 | 29.4 |
| Deaths after placing 0 / 1 / 2 pieces of the last tray | 0 / 0 / 405 | 0 / 0 / 364 |
| Final tray: viable first moves at offer (mean) / deaths from trays with <=4 | 3.3 / 337 | 5.7 / 218 |
| Deaths where a 5+ cell piece was stuck | 380 | 352 |
| Tray moods | – | reward 17621, build 38769, tension 39027, recovery 14842 |
