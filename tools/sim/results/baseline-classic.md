# Simulation: classic

2000 games, 500 seeds per generator × strategy, move cap 600, 13s.

## Strategy: random

| Metric | classic |
|---|---|
| Games (capped at move limit) | 500 (0) |
| Moves per game: mean / median | 14 / 13 |
| Moves per game: p10 / p90 | 8 / 22 |
| Pieces between clears: mean / median / p90 | 5.6 / 4 / 11 |
| Longest dry spell per game (mean) | 6.1 |
| Moves that clear | 11.1% |
| Trays where the player cleared | 26.9% |
| Multi-line share of clears | 12.8% |
| Multi-line clears per 100 moves | 1.4 |
| Board clears per game | 0 |
| Mean occupancy (cells of 64) | 23.7 |
| Tension cycles per 100 moves (<=16 -> >=32 -> <=16) | 0 |
| High-occupancy episodes (>=36) per game | 0.8 |
| Recovered from >=36 to <=22 | 1.2% |
| Trays with <=4 viable first moves | 12.5% |
| Trays where a clear was possible | 88.3% |
| Trays with a repeated shape | 0.0% |
| Shape entropy (1 = uniform) | 0.999 |
| Max per-shape deviation from uniform | 26.7% |
| Piece sizes 1-2 / 3 / 4 / 5-9 cells | 12.4% / 22.8% / 48.4% / 16.4% |
| Distinct three-piece combinations | 1681 |
| Combination entropy (bits) | 10.56 |
| Game-over causes | crowded 220, fragmented 158, bulky-piece 96, other 26 |
| Occupancy at game over (mean) | 38.2 |
| Deaths after placing 0 / 1 / 2 pieces of the last tray | 0 / 73 / 427 |
| Final tray: viable first moves at offer (mean) / deaths from trays with <=4 | 9.5 / 217 |
| Deaths where a 5+ cell piece was stuck | 256 |
| Tray moods | – |

## Strategy: greedy

| Metric | classic |
|---|---|
| Games (capped at move limit) | 500 (0) |
| Moves per game: mean / median | 23.7 / 20 |
| Moves per game: p10 / p90 | 11 / 41 |
| Pieces between clears: mean / median / p90 | 3.2 / 3 / 7 |
| Longest dry spell per game (mean) | 6.9 |
| Moves that clear | 27.3% |
| Trays where the player cleared | 60.3% |
| Multi-line share of clears | 4.4% |
| Multi-line clears per 100 moves | 1.2 |
| Board clears per game | 0 |
| Mean occupancy (cells of 64) | 22.8 |
| Tension cycles per 100 moves (<=16 -> >=32 -> <=16) | 0.2 |
| High-occupancy episodes (>=36) per game | 0.8 |
| Recovered from >=36 to <=22 | 19.7% |
| Trays with <=4 viable first moves | 12.9% |
| Trays where a clear was possible | 91.3% |
| Trays with a repeated shape | 0.0% |
| Shape entropy (1 = uniform) | 0.999 |
| Max per-shape deviation from uniform | 36.0% |
| Piece sizes 1-2 / 3 / 4 / 5-9 cells | 12.5% / 22.9% / 48.5% / 16.1% |
| Distinct three-piece combinations | 2183 |
| Combination entropy (bits) | 10.89 |
| Game-over causes | fragmented 244, bulky-piece 139, crowded 95, other 22 |
| Occupancy at game over (mean) | 34.5 |
| Deaths after placing 0 / 1 / 2 pieces of the last tray | 0 / 16 / 484 |
| Final tray: viable first moves at offer (mean) / deaths from trays with <=4 | 9.1 / 221 |
| Deaths where a 5+ cell piece was stuck | 305 |
| Tray moods | – |

## Strategy: space

| Metric | classic |
|---|---|
| Games (capped at move limit) | 500 (0) |
| Moves per game: mean / median | 48.6 / 38 |
| Moves per game: p10 / p90 | 14 / 98 |
| Pieces between clears: mean / median / p90 | 2.6 / 2 / 5 |
| Longest dry spell per game (mean) | 7.5 |
| Moves that clear | 36.3% |
| Trays where the player cleared | 73.5% |
| Multi-line share of clears | 7.6% |
| Multi-line clears per 100 moves | 2.8 |
| Board clears per game | 0 |
| Mean occupancy (cells of 64) | 24.2 |
| Tension cycles per 100 moves (<=16 -> >=32 -> <=16) | 0.8 |
| High-occupancy episodes (>=36) per game | 1.5 |
| Recovered from >=36 to <=22 | 61.7% |
| Trays with <=4 viable first moves | 11.2% |
| Trays where a clear was possible | 95.3% |
| Trays with a repeated shape | 0.0% |
| Shape entropy (1 = uniform) | 1.000 |
| Max per-shape deviation from uniform | 23.7% |
| Piece sizes 1-2 / 3 / 4 / 5-9 cells | 11.5% / 22.6% / 48.7% / 17.3% |
| Distinct three-piece combinations | 2754 |
| Combination entropy (bits) | 11.23 |
| Game-over causes | bulky-piece 348, crowded 61, other 57, fragmented 34 |
| Occupancy at game over (mean) | 33.5 |
| Deaths after placing 0 / 1 / 2 pieces of the last tray | 0 / 8 / 492 |
| Final tray: viable first moves at offer (mean) / deaths from trays with <=4 | 6.7 / 274 |
| Deaths where a 5+ cell piece was stuck | 383 |
| Tray moods | – |

## Strategy: lookahead

| Metric | classic |
|---|---|
| Games (capped at move limit) | 500 (223) |
| Moves per game: mean / median | 409.2 / 512 |
| Moves per game: p10 / p90 | 83 / 600 |
| Pieces between clears: mean / median / p90 | 2.3 / 2 / 4 |
| Longest dry spell per game (mean) | 6.6 |
| Moves that clear | 43.7% |
| Trays where the player cleared | 92.8% |
| Multi-line share of clears | 9.0% |
| Multi-line clears per 100 moves | 3.9 |
| Board clears per game | 0.01 |
| Mean occupancy (cells of 64) | 24 |
| Tension cycles per 100 moves (<=16 -> >=32 -> <=16) | 1.7 |
| High-occupancy episodes (>=36) per game | 6.5 |
| Recovered from >=36 to <=22 | 96.9% |
| Trays with <=4 viable first moves | 4.2% |
| Trays where a clear was possible | 97.7% |
| Trays with a repeated shape | 0.0% |
| Shape entropy (1 = uniform) | 1.000 |
| Max per-shape deviation from uniform | 13.5% |
| Piece sizes 1-2 / 3 / 4 / 5-9 cells | 11.4% / 22.5% / 48.3% / 17.7% |
| Distinct three-piece combinations | 2925 |
| Combination entropy (bits) | 11.48 |
| Game-over causes | bulky-piece 248, other 16, fragmented 10, crowded 3 |
| Occupancy at game over (mean) | 29.1 |
| Deaths after placing 0 / 1 / 2 pieces of the last tray | 0 / 0 / 277 |
| Final tray: viable first moves at offer (mean) / deaths from trays with <=4 | 3.4 / 231 |
| Deaths where a 5+ cell piece was stuck | 255 |
| Tray moods | – |
