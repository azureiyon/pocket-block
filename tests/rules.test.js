import { test, assert, eq } from './harness.js';
import { boardFrom, count, replay, solvable } from './helpers.js';
import { SHAPES } from '../src/core/shapes.js';
import {
  placeOnCells, canPlaceOnCells, occFromCells, findSequence, anyFits, scoreFor, anyShapePlaceable, fullLines,
} from '../src/core/rules.js';

test('shapes: 27 fixed orientations with expected families', () => {
  eq(SHAPES.length, 27, 'shape count');
  eq(new Set(SHAPES.map((s) => s.id)).size, 27, 'unique ids');
  const fam = {};
  for (const s of SHAPES) fam[s.family] = (fam[s.family] || 0) + 1;
  eq(fam, { single: 1, pair: 2, line3: 2, line4: 2, line5: 2, square2: 1, square3: 1, corner: 4, l4: 4, t: 4, zigzag: 2, rect23: 2 }, 'families');
  // All orientations distinct.
  const keys = SHAPES.map((s) => JSON.stringify(s.cells));
  eq(new Set(keys).size, 27, 'distinct geometry');
  eq(SHAPES.find((s) => s.id === 'corner-a').size, 3);
  eq(SHAPES.find((s) => s.id === 'l-a').size, 4);
});

test('rules: collision and bounds', () => {
  const cells = boardFrom(['#.......']);
  assert(!canPlaceOnCells(cells, 'single', 0, 0), 'overlap rejected');
  assert(canPlaceOnCells(cells, 'single', 0, 1), 'free cell accepted');
  assert(!canPlaceOnCells(cells, 'line5-h', 0, 4), 'extends past right edge');
  assert(!canPlaceOnCells(cells, 'line5-v', 4, 0), 'extends past bottom');
  assert(!canPlaceOnCells(cells, 'single', -1, 0), 'negative row');
  assert(!canPlaceOnCells(cells, 'single', 0, 8), 'col 8');
  eq(placeOnCells(cells, 'pair-h', 0, 0, 2), null, 'illegal placement returns null');
  assert(canPlaceOnCells(new Uint8Array(64), 'line5-h', 0, 3), 'fits exactly at right edge');
});

test('rules: simultaneous row and column clearing counts intersection once', () => {
  const rows = Array.from({ length: 8 }, (_, r) => (r === 3 ? '###.####' : '...#....'));
  const cells = boardFrom(rows);
  const res = placeOnCells(cells, 'single', 3, 3, 4);
  eq(res.rows, [3]); eq(res.cols, [3]); eq(res.lines, 2);
  eq(res.clearedCells.length, 15, 'row 8 + col 8 - intersection');
  eq(count(res.cells), 0, 'board empty after clear');
  eq(res.points, 5 * 1 + 80 * 4, 'scoring 5*blocks + 80*lines^2');
  assert(res.empty, 'all clear flag');
});

test('rules: scoring formula examples', () => {
  eq(scoreFor(3, 0), 15);
  eq(scoreFor(1, 1), 85);
  eq(scoreFor(4, 2), 20 + 320, 'two lines = 320 line points');
  eq(scoreFor(9, 3), 45 + 720);
});

test('rules: clearing three rows and two columns at once', () => {
  const rows = ['##..####', '##..####', '##..####', '..##....', '..##....', '..##....', '..##....', '..##....'];
  const cells = boardFrom(rows);
  eq(fullLines(occFromCells(cells).lo, occFromCells(cells).hi), [], 'nothing full before');
  const res = placeOnCells(cells, 'rect-v', 0, 2, 1);
  eq(res.rows, [0, 1, 2]); eq(res.cols, [2, 3]); eq(res.lines, 5);
  eq(res.clearedCells.length, 24 + 16 - 6, 'intersections removed once');
  eq(res.points, 5 * 6 + 80 * 25);
  eq(count(res.cells), 0);
});

test('solver: pieces that fit individually but not together are rejected', () => {
  // Only a 3x3 hole top-left plus isolated single holes that prevent clears.
  const rows = [
    '...#.###',
    '...###.#',
    '...##.##',
    '########',
    '.#######',
    '##.#####',
    '#.#.####',
    '########',
  ];
  const cells = boardFrom(rows);
  // Use a board without full lines for the real check.
  const fixed = boardFrom(rows.map((r, i) => (i === 3 ? '#######.' : i === 7 ? '.#######' : r)));
  const { lo, hi } = occFromCells(fixed);
  eq(fullLines(lo, hi), [], 'no full lines');
  const ids = ['square3', 'square3', 'square2'];
  for (const id of ids) assert(anyFits(lo, hi, id), id + ' fits individually');
  eq(findSequence(lo, hi, ids), null, 'whole tray unsolvable');
  // A solvable alternative is found and replays correctly.
  const ok = ['square3', 'single', 'single'];
  const seq = findSequence(lo, hi, ok);
  assert(seq, 'solvable tray');
  assert(replay(fixed, ok, seq), 'sequence replays');
});

test('solver: uses clears between simulated moves', () => {
  // Only row 0 has room for a line3; clearing it opens space for line5-h.
  const rows = ['...#####', '.#######', '#.####.#', '##.#####', '###.####', '####.###', '#####.##', '#######.'];
  const cells = boardFrom(rows);
  const { lo, hi } = occFromCells(cells);
  eq(fullLines(lo, hi), [], 'no pre-full lines');
  // line3-h at (0,0) clears row 0 -> then a line5-h fits in row 0.
  const ids = ['line5-h', 'line3-h', 'single'];
  assert(!anyFits(lo, hi, 'line5-h'), 'line5-h does not fit initially');
  const seq = findSequence(lo, hi, ids);
  assert(seq, 'sequence exists only thanks to clearing');
  assert(replay(cells, ids, seq), 'replays with real rules');
  eq(seq[0].piece, 1, 'line3 placed first');
});

test('game over detection helper', () => {
  const full = boardFrom(Array(8).fill('#.#.#.#.'));
  const { lo, hi } = occFromCells(full);
  assert(!anyShapePlaceable(lo, hi, ['pair-h', 'square2', 'line3-h']), 'no horizontal pieces fit');
  assert(anyShapePlaceable(lo, hi, ['pair-h', 'pair-v']), 'vertical pair fits');
  assert(solvable(new Uint8Array(64), ['square3', 'square3', 'rect-h']), 'empty board solvable');
});
