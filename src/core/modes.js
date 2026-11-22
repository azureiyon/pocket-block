// Game modes. A mode decides scoring, how long a combo streak survives,
// which tray generator is used and how many colours pieces come in.
//
//   classic  The original rules: 5 per block + 80 x lines^2. Any move that
//            clears nothing ends the combo, and combos never add points.
//   blast    Fast, generous and loud. A combo streak survives up to
//            STREAK_WINDOW moves without a clear, and every clear is
//            multiplied by the streak. Wiping the last blocks of a colour
//            and clearing the whole board pay bonuses. Trays come from the
//            clear-hungry "blast" generator.
//   flow     Blast's scoring and streaks with the "flow" director: a larger
//            piece pool, rescue pieces when the board gets crowded, and a
//            difficulty ramp by score that ends long runs.

import { scoreFor } from './rules.js';

export const BLAST_STREAK_WINDOW = 3;
// Clear value by lines in one move (before the combo multiplier).
export const BLAST_LINE_POINTS = [0, 20, 60, 120, 200, 300, 420];
export const BLAST_WIPE_POINTS = 50;
export const BLAST_ALL_CLEAR_POINTS = 300;

export const MODES = {
  classic: {
    id: 'classic',
    name: 'Classic',
    generator: null, // the default generator
    palette: 7,
    streakWindow: 1,
    openings: true,
    score: ({ blocks, lines }) => ({ points: scoreFor(blocks, lines), parts: null }),
  },
  blast: {
    id: 'blast',
    name: 'Blast',
    arcade: true,
    generator: 'blast',
    palette: 5, // fewer colours, so colour wipes actually happen
    streakWindow: BLAST_STREAK_WINDOW,
    openings: false, // always an empty board: straight into chunky clears
    score({ blocks, lines, combo, wiped, allClear }) {
      const mult = Math.max(1, combo);
      const base = lines ? BLAST_LINE_POINTS[Math.min(lines, BLAST_LINE_POINTS.length - 1)] : 0;
      const clear = base * mult;
      const wipe = lines ? wiped * BLAST_WIPE_POINTS * mult : 0;
      const board = allClear ? BLAST_ALL_CLEAR_POINTS * mult : 0;
      return { points: blocks + clear + wipe + board, parts: { blocks, clear, wipe, board, mult } };
    },
  },
};

MODES.flow = { ...MODES.blast, id: 'flow', name: 'Flow', generator: 'flow', scoreAware: true };

export const MODE_IDS = Object.keys(MODES);
export const DEFAULT_MODE = 'classic';

export function getMode(id) { return MODES[id] || MODES[DEFAULT_MODE]; }

/** Settings key for a mode's high score; classic keeps the original key. */
export function bestKey(modeId) { return modeId === 'blast' ? 'bestBlast' : modeId === 'flow' ? 'bestFlow' : 'best'; }

/**
 * Colours whose every block was removed by this clear. Only colours that were
 * already on the board before the move count, so a fresh piece vanishing
 * inside its own line is not a "wipe".
 */
export function wipedColors(before, after, clearedCells) {
  if (!clearedCells.length) return [];
  const had = new Set();
  for (const v of before) if (v) had.add(v);
  const still = new Set();
  for (const v of after) if (v) still.add(v);
  const out = [];
  for (const color of new Set(clearedCells.map((x) => x.color))) if (had.has(color) && !still.has(color)) out.push(color);
  return out.sort((a, b) => a - b);
}
