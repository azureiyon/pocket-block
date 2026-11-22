# Simulation: blast vs flow

1600 games, 200 seeds per generator × strategy, move cap 600, 131s.

## Strategy: random

| Metric | blast | flow |
|---|---|---|
| Games (capped at move limit) | 200 (0) | 200 (0) |
| Moves per game: mean / median | 23.9 / 20 | 23.9 / 20 |
| Moves per game: p10 / p90 | 8 / 44 | 11 / 44 |
| Pieces between clears: mean / median / p90 | 4.1 / 3 / 8 | 4.2 / 3 / 10 |
| Longest dry spell per game (mean) | 7.6 | 8.6 |
| Moves that clear | 20.6% | 20.3% |
| Trays where the player cleared | 54.4% | 52.8% |
| Multi-line share of clears | 19.7% | 12.2% |
| Multi-line clears per 100 moves | 4.1 | 2.5 |
| Board clears per game | 0 | 0 |
| Mean occupancy (cells of 64) | 28.1 | 26.5 |
| Tension cycles per 100 moves (<=16 -> >=32 -> <=16) | 0 | 0 |
| High-occupancy episodes (>=36) per game | 1 | 0.9 |
| Recovered from >=36 to <=22 | 13.5% | 2.9% |
| Trays with <=4 viable first moves | 3.2% | 6.5% |
| Trays where a clear was possible | 99.8% | 92.5% |
| Trays with a repeated shape | 28.3% | 16.1% |
| Shape entropy (1 = uniform) | 0.943 | 1.097 |
| Max per-shape deviation from uniform | 118.9% | 83.8% |
| Piece sizes 1-2 / 3 / 4 / 5-9 cells | 16.5% / 34.3% / 31.7% / 17.6% | 13.1% / 22.5% / 32.9% / 5.0% |
| Distinct three-piece combinations | 990 | 1473 |
| Combination entropy (bits) | 9.58 | 10.46 |
| Game-over causes | crowded 111, fragmented 47, bulky-piece 37, other 5 | fragmented 92, crowded 87, bulky-piece 12, other 9 |
| Occupancy at game over (mean) | 39.8 | 38.5 |
| Deaths after placing 0 / 1 / 2 pieces of the last tray | 0 / 14 / 186 | 0 / 12 / 188 |
| Final tray: viable first moves at offer (mean) / deaths from trays with <=4 | 14 / 26 | 12.3 / 37 |
| Deaths where a 5+ cell piece was stuck | 80 | 67 |
| Blast-rules score per game (median) | 239 | 208 |
| Longest combo streak per game (mean, Blast rules) | 2.5 | 2.6 |
| Clears made at streak 3+ | 23.0% | 30.3% |
| Move of the first clear (median) | 8 | 11 |
| Tray kinds (flow/blast) | random 803, tiling 242, completer 214, twin 171, double 160, multi 75 | rescue 1327, flow 337 |
| Tray moods | – | – |

## Strategy: greedy

| Metric | blast | flow |
|---|---|---|
| Games (capped at move limit) | 200 (0) | 200 (0) |
| Moves per game: mean / median | 86 / 71 | 50.8 / 47 |
| Moves per game: p10 / p90 | 22 / 170 | 11 / 95 |
| Pieces between clears: mean / median / p90 | 2.5 / 2 / 5 | 2.7 / 3 / 5 |
| Longest dry spell per game (mean) | 6.4 | 6.9 |
| Moves that clear | 38.2% | 35.0% |
| Trays where the player cleared | 80.7% | 78.4% |
| Multi-line share of clears | 4.3% | 4.5% |
| Multi-line clears per 100 moves | 1.6 | 1.6 |
| Board clears per game | 0.09 | 0.01 |
| Mean occupancy (cells of 64) | 23.6 | 23.8 |
| Tension cycles per 100 moves (<=16 -> >=32 -> <=16) | 0.9 | 0.5 |
| High-occupancy episodes (>=36) per game | 1.7 | 1.2 |
| Recovered from >=36 to <=22 | 74.0% | 59.4% |
| Trays with <=4 viable first moves | 1.8% | 6.0% |
| Trays where a clear was possible | 99.6% | 94.4% |
| Trays with a repeated shape | 25.5% | 17.6% |
| Shape entropy (1 = uniform) | 0.950 | 1.106 |
| Max per-shape deviation from uniform | 94.7% | 84.1% |
| Piece sizes 1-2 / 3 / 4 / 5-9 cells | 16.8% / 33.3% / 35.0% / 14.9% | 10.8% / 20.9% / 33.8% / 7.5% |
| Distinct three-piece combinations | 2086 | 2846 |
| Combination entropy (bits) | 10.49 | 11.38 |
| Game-over causes | fragmented 103, bulky-piece 71, crowded 17, other 9 | fragmented 122, bulky-piece 49, crowded 16, other 13 |
| Occupancy at game over (mean) | 32.5 | 32.7 |
| Deaths after placing 0 / 1 / 2 pieces of the last tray | 0 / 4 / 196 | 0 / 8 / 192 |
| Final tray: viable first moves at offer (mean) / deaths from trays with <=4 | 15.3 / 31 | 10.3 / 57 |
| Deaths where a 5+ cell piece was stuck | 115 | 101 |
| Blast-rules score per game (median) | 2659 | 1819 |
| Longest combo streak per game (mean, Blast rules) | 10.6 | 9.7 |
| Clears made at streak 3+ | 65.1% | 67.8% |
| Move of the first clear (median) | 4 | 7 |
| Tray kinds (flow/blast) | random 3299, completer 963, twin 586, tiling 576, double 326, multi 48 | rescue 3015, flow 379, clutch-clear 50, punish 9, clutch 1 |
| Tray moods | – | – |

## Strategy: space

| Metric | blast | flow |
|---|---|---|
| Games (capped at move limit) | 200 (23) | 200 (0) |
| Moves per game: mean / median | 245.2 / 197 | 79.9 / 80 |
| Moves per game: p10 / p90 | 35 / 600 | 29 / 134 |
| Pieces between clears: mean / median / p90 | 2.4 / 2 / 4 | 2.5 / 2 / 4 |
| Longest dry spell per game (mean) | 6.8 | 7 |
| Moves that clear | 41.8% | 39.0% |
| Trays where the player cleared | 84.0% | 82.9% |
| Multi-line share of clears | 5.5% | 5.7% |
| Multi-line clears per 100 moves | 2.3 | 2.2 |
| Board clears per game | 0.1 | 0.01 |
| Mean occupancy (cells of 64) | 22.4 | 23.4 |
| Tension cycles per 100 moves (<=16 -> >=32 -> <=16) | 2 | 1.2 |
| High-occupancy episodes (>=36) per game | 2.9 | 1.3 |
| Recovered from >=36 to <=22 | 92.3% | 73.0% |
| Trays with <=4 viable first moves | 0.6% | 4.8% |
| Trays where a clear was possible | 99.8% | 95.7% |
| Trays with a repeated shape | 23.0% | 15.6% |
| Shape entropy (1 = uniform) | 0.958 | 1.112 |
| Max per-shape deviation from uniform | 90.5% | 72.5% |
| Piece sizes 1-2 / 3 / 4 / 5-9 cells | 13.8% / 32.2% / 38.7% / 15.3% | 9.3% / 20.1% / 34.0% / 9.2% |
| Distinct three-piece combinations | 3061 | 4106 |
| Combination entropy (bits) | 10.95 | 11.87 |
| Game-over causes | bulky-piece 155, other 11, crowded 6, fragmented 5 | bulky-piece 148, other 27, fragmented 16, crowded 9 |
| Occupancy at game over (mean) | 30.5 | 31.8 |
| Deaths after placing 0 / 1 / 2 pieces of the last tray | 0 / 1 / 176 | 0 / 3 / 197 |
| Final tray: viable first moves at offer (mean) / deaths from trays with <=4 | 14.1 / 35 | 6 / 113 |
| Deaths where a 5+ cell piece was stuck | 156 | 166 |
| Blast-rules score per game (median) | 10500 | 4693 |
| Longest combo streak per game (mean, Blast rules) | 16.3 | 14.1 |
| Clears made at streak 3+ | 70.8% | 74.6% |
| Move of the first clear (median) | 4 | 7 |
| Tray kinds (flow/blast) | random 9558, completer 2515, twin 1556, tiling 1521, double 1057, multi 198 | rescue 4823, flow 418, clutch-clear 88, punish 62, clutch 3 |
| Tray moods | – | – |

## Strategy: lookahead

| Metric | blast | flow |
|---|---|---|
| Games (capped at move limit) | 200 (181) | 200 (0) |
| Moves per game: mean / median | 579.9 / 600 | 133.8 / 131 |
| Moves per game: p10 / p90 | 600 / 600 | 89 / 176 |
| Pieces between clears: mean / median / p90 | 2.2 / 2 / 3 | 2.3 / 2 / 4 |
| Longest dry spell per game (mean) | 6.4 | 6.2 |
| Moves that clear | 45.5% | 42.7% |
| Trays where the player cleared | 93.6% | 90.8% |
| Multi-line share of clears | 8.2% | 6.7% |
| Multi-line clears per 100 moves | 3.7 | 2.9 |
| Board clears per game | 0.4 | 0.01 |
| Mean occupancy (cells of 64) | 18.9 | 22 |
| Tension cycles per 100 moves (<=16 -> >=32 -> <=16) | 0.7 | 1.3 |
| High-occupancy episodes (>=36) per game | 0.8 | 1.1 |
| Recovered from >=36 to <=22 | 98.2% | 78.8% |
| Trays with <=4 viable first moves | 0.1% | 3.9% |
| Trays where a clear was possible | 99.7% | 94.7% |
| Trays with a repeated shape | 26.2% | 12.5% |
| Shape entropy (1 = uniform) | 0.962 | 1.118 |
| Max per-shape deviation from uniform | 88.7% | 65.5% |
| Piece sizes 1-2 / 3 / 4 / 5-9 cells | 11.0% / 26.0% / 39.0% / 23.9% | 7.0% / 17.4% / 34.4% / 11.8% |
| Distinct three-piece combinations | 3493 | 6039 |
| Combination entropy (bits) | 11.04 | 12.40 |
| Game-over causes | bulky-piece 19 | bulky-piece 176, fragmented 16, crowded 7, other 1 |
| Occupancy at game over (mean) | 28.2 | 30.4 |
| Deaths after placing 0 / 1 / 2 pieces of the last tray | 0 / 0 / 19 | 0 / 0 / 200 |
| Final tray: viable first moves at offer (mean) / deaths from trays with <=4 | 13.6 / 1 | 0.5 / 196 |
| Deaths where a 5+ cell piece was stuck | 19 | 198 |
| Blast-rules score per game (median) | 54916 | 7780 |
| Longest combo streak per game (mean, Blast rules) | 34.6 | 18.5 |
| Clears made at streak 3+ | 80.2% | 73.1% |
| Move of the first clear (median) | 3 | 5 |
| Tray kinds (flow/blast) | random 25281, tiling 5069, twin 4747, completer 2696, double 773, multi 98 | rescue 7374, flow 1318, punish 190, clutch-clear 91, clutch 11 |
| Tray moods | – | – |
