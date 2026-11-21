# Simulation: rhythm vs blast

2400 games, 300 seeds per generator × strategy, move cap 600, 267s.

## Strategy: random

| Metric | rhythm | blast |
|---|---|---|
| Games (capped at move limit) | 300 (0) | 300 (0) |
| Moves per game: mean / median | 18.2 / 17 | 23.5 / 20 |
| Moves per game: p10 / p90 | 8 / 31 | 8 / 44 |
| Pieces between clears: mean / median / p90 | 4.8 / 4 / 10 | 4.1 / 3 / 8 |
| Longest dry spell per game (mean) | 7.4 | 7.4 |
| Moves that clear | 16.0% | 20.7% |
| Trays where the player cleared | 41.0% | 54.6% |
| Multi-line share of clears | 17.4% | 19.2% |
| Multi-line clears per 100 moves | 2.8 | 4 |
| Board clears per game | 0 | 0 |
| Mean occupancy (cells of 64) | 26 | 27.9 |
| Tension cycles per 100 moves (<=16 -> >=32 -> <=16) | 0 | 0 |
| High-occupancy episodes (>=36) per game | 0.9 | 1 |
| Recovered from >=36 to <=22 | 3.4% | 12.6% |
| Trays with <=4 viable first moves | 4.1% | 3.3% |
| Trays where a clear was possible | 94.4% | 99.8% |
| Trays with a repeated shape | 24.2% | 29.2% |
| Shape entropy (1 = uniform) | 0.990 | 0.944 |
| Max per-shape deviation from uniform | 59.8% | 111.9% |
| Piece sizes 1-2 / 3 / 4 / 5-9 cells | 17.4% / 24.9% / 40.8% / 16.9% | 16.7% / 33.7% / 31.7% / 17.9% |
| Distinct three-piece combinations | 1390 | 1250 |
| Combination entropy (bits) | 10.26 | 9.81 |
| Game-over causes | crowded 147, fragmented 97, bulky-piece 43, other 13 | crowded 166, fragmented 65, bulky-piece 63, other 6 |
| Occupancy at game over (mean) | 39 | 39.5 |
| Deaths after placing 0 / 1 / 2 pieces of the last tray | 0 / 25 / 275 | 0 / 23 / 277 |
| Final tray: viable first moves at offer (mean) / deaths from trays with <=4 | 13.3 / 47 | 14 / 40 |
| Deaths where a 5+ cell piece was stuck | 126 | 119 |
| Blast-rules score per game (median) | 126 | 253 |
| Longest combo streak per game (mean, Blast rules) | 1.8 | 2.5 |
| Clears made at streak 3+ | 19.1% | 24.4% |
| Move of the first clear (median) | 11 | 9 |
| Tray moods | reward 853, recovery 535, build 349, tension 195 | – |

## Strategy: greedy

| Metric | rhythm | blast |
|---|---|---|
| Games (capped at move limit) | 300 (0) | 300 (0) |
| Moves per game: mean / median | 32.8 / 26 | 89.7 / 71 |
| Moves per game: p10 / p90 | 11 / 65 | 20 / 194 |
| Pieces between clears: mean / median / p90 | 2.9 / 3 / 6 | 2.5 / 2 / 5 |
| Longest dry spell per game (mean) | 6.8 | 6.4 |
| Moves that clear | 31.6% | 38.2% |
| Trays where the player cleared | 68.5% | 80.6% |
| Multi-line share of clears | 6.0% | 4.0% |
| Multi-line clears per 100 moves | 1.9 | 1.5 |
| Board clears per game | 0.01 | 0.1 |
| Mean occupancy (cells of 64) | 23.1 | 23.5 |
| Tension cycles per 100 moves (<=16 -> >=32 -> <=16) | 0.3 | 0.9 |
| High-occupancy episodes (>=36) per game | 1 | 1.8 |
| Recovered from >=36 to <=22 | 47.3% | 76.6% |
| Trays with <=4 viable first moves | 5.5% | 1.8% |
| Trays where a clear was possible | 94.8% | 99.5% |
| Trays with a repeated shape | 24.6% | 25.2% |
| Shape entropy (1 = uniform) | 0.992 | 0.949 |
| Max per-shape deviation from uniform | 50.7% | 96.5% |
| Piece sizes 1-2 / 3 / 4 / 5-9 cells | 16.0% / 24.4% / 42.5% / 17.1% | 16.9% / 33.9% / 34.6% / 14.5% |
| Distinct three-piece combinations | 2049 | 2455 |
| Combination entropy (bits) | 10.76 | 10.64 |
| Game-over causes | fragmented 156, bulky-piece 107, crowded 27, other 10 | fragmented 154, bulky-piece 107, crowded 26, other 13 |
| Occupancy at game over (mean) | 33.1 | 32.6 |
| Deaths after placing 0 / 1 / 2 pieces of the last tray | 0 / 7 / 293 | 0 / 5 / 295 |
| Final tray: viable first moves at offer (mean) / deaths from trays with <=4 | 11.1 / 72 | 15.1 / 39 |
| Deaths where a 5+ cell piece was stuck | 198 | 175 |
| Blast-rules score per game (median) | 514 | 2649 |
| Longest combo streak per game (mean, Blast rules) | 5.2 | 10.5 |
| Clears made at streak 3+ | 49.8% | 64.8% |
| Move of the first clear (median) | 6 | 4 |
| Tray moods | reward 1101, build 807, recovery 783, tension 694, fallback 1 | – |

## Strategy: space

| Metric | rhythm | blast |
|---|---|---|
| Games (capped at move limit) | 300 (0) | 300 (38) |
| Moves per game: mean / median | 70.6 / 53 | 244 / 194 |
| Moves per game: p10 / p90 | 17 / 146 | 35 / 600 |
| Pieces between clears: mean / median / p90 | 2.6 / 2 / 5 | 2.4 / 2 / 4 |
| Longest dry spell per game (mean) | 7.2 | 6.8 |
| Moves that clear | 37.6% | 41.8% |
| Trays where the player cleared | 75.9% | 84.2% |
| Multi-line share of clears | 9.2% | 5.5% |
| Multi-line clears per 100 moves | 3.5 | 2.3 |
| Board clears per game | 0.01 | 0.1 |
| Mean occupancy (cells of 64) | 24 | 22.4 |
| Tension cycles per 100 moves (<=16 -> >=32 -> <=16) | 1.2 | 2 |
| High-occupancy episodes (>=36) per game | 2.3 | 2.9 |
| Recovered from >=36 to <=22 | 78.9% | 93.0% |
| Trays with <=4 viable first moves | 4.7% | 0.6% |
| Trays where a clear was possible | 96.5% | 99.8% |
| Trays with a repeated shape | 24.8% | 22.9% |
| Shape entropy (1 = uniform) | 0.994 | 0.958 |
| Max per-shape deviation from uniform | 41.7% | 89.8% |
| Piece sizes 1-2 / 3 / 4 / 5-9 cells | 14.6% / 24.8% / 43.1% / 17.6% | 13.8% / 32.0% / 38.7% / 15.6% |
| Distinct three-piece combinations | 2971 | 3262 |
| Combination entropy (bits) | 11.24 | 11.00 |
| Game-over causes | bulky-piece 226, other 27, crowded 24, fragmented 23 | bulky-piece 236, other 13, fragmented 7, crowded 6 |
| Occupancy at game over (mean) | 32.5 | 30.4 |
| Deaths after placing 0 / 1 / 2 pieces of the last tray | 0 / 1 / 299 | 0 / 1 / 261 |
| Final tray: viable first moves at offer (mean) / deaths from trays with <=4 | 8.4 / 118 | 13.5 / 51 |
| Deaths where a 5+ cell piece was stuck | 242 | 235 |
| Blast-rules score per game (median) | 1854 | 10468 |
| Longest combo streak per game (mean, Blast rules) | 8.2 | 16.5 |
| Clears made at streak 3+ | 59.5% | 71.0% |
| Move of the first clear (median) | 7 | 4 |
| Tray moods | reward 1820, recovery 1763, tension 1803, build 1774 | – |

## Strategy: lookahead

| Metric | rhythm | blast |
|---|---|---|
| Games (capped at move limit) | 300 (155) | 300 (258) |
| Moves per game: mean / median | 438.9 / 600 | 560.6 / 600 |
| Moves per game: p10 / p90 | 101 / 600 | 482 / 600 |
| Pieces between clears: mean / median / p90 | 2.3 / 2 / 4 | 2.2 / 2 / 3 |
| Longest dry spell per game (mean) | 6.7 | 6.3 |
| Moves that clear | 43.7% | 45.5% |
| Trays where the player cleared | 91.3% | 93.6% |
| Multi-line share of clears | 10.1% | 8.3% |
| Multi-line clears per 100 moves | 4.4 | 3.8 |
| Board clears per game | 0.06 | 0.33 |
| Mean occupancy (cells of 64) | 23.8 | 18.9 |
| Tension cycles per 100 moves (<=16 -> >=32 -> <=16) | 2 | 0.8 |
| High-occupancy episodes (>=36) per game | 8.4 | 0.9 |
| Recovered from >=36 to <=22 | 98.2% | 98.8% |
| Trays with <=4 viable first moves | 3.1% | 0.1% |
| Trays where a clear was possible | 96.6% | 99.6% |
| Trays with a repeated shape | 26.9% | 26.2% |
| Shape entropy (1 = uniform) | 0.997 | 0.962 |
| Max per-shape deviation from uniform | 25.7% | 89.4% |
| Piece sizes 1-2 / 3 / 4 / 5-9 cells | 12.7% / 23.0% / 43.8% / 20.5% | 11.0% / 26.0% / 39.1% / 24.0% |
| Distinct three-piece combinations | 3654 | 3570 |
| Combination entropy (bits) | 11.60 | 11.06 |
| Game-over causes | bulky-piece 139, other 4, fragmented 2 | bulky-piece 42 |
| Occupancy at game over (mean) | 29.4 | 27.7 |
| Deaths after placing 0 / 1 / 2 pieces of the last tray | 0 / 0 / 145 | 0 / 0 / 42 |
| Final tray: viable first moves at offer (mean) / deaths from trays with <=4 | 5.8 / 87 | 14.5 / 7 |
| Deaths where a 5+ cell piece was stuck | 139 | 42 |
| Blast-rules score per game (median) | 35920 | 53626 |
| Longest combo streak per game (mean, Blast rules) | 22.9 | 33.4 |
| Clears made at streak 3+ | 73.6% | 80.2% |
| Move of the first clear (median) | 4 | 3 |
| Tray moods | reward 7091, build 15649, tension 15437, recovery 5758 | – |
