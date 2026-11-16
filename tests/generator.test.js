import { test, assert, eq, report } from './harness.js';
import { boardFrom, replay } from './helpers.js';
import { generateTray, orderedCollection, freshPrefixLength, constructiveFallback, RECENT_LIMIT } from '../src/core/generator.js';
import { createRng } from '../src/core/rng.js';
import { occFromCells, findSequence } from '../src/core/rules.js';
import { SHAPE_IDS } from '../src/core/shapes.js';

test('generator: recent ids move to the end and prefix length follows max(10, 27 - recent)', () => {
  const recent = ['single', 'pair-h', 'square3'];
  const order = orderedCollection(recent, createRng(5));
  eq(order.length, 27);
  eq(order.slice(-3), recent, 'recent at the end, newest last');
  eq(freshPrefixLength([]), 27); eq(freshPrefixLength(recent), 24);
  eq(freshPrefixLength(SHAPE_IDS.slice(0, 9)), 18);
  eq(freshPrefixLength(SHAPE_IDS.slice(0, 20)), 10);
});

test('generator: first attempts draw three distinct shapes from the fresh prefix', () => {
  let distinctTrays = 0;
  for (let s = 1; s <= 300; s++) {
    const t = generateTray(0, 0, [], createRng(s));
    eq(t.attempts, 1, 'empty board accepts first proposal');
    if (new Set(t.ids).size === 3) distinctTrays++;
  }
  eq(distinctTrays, 300, 'distinct on empty board');
  // Recent pieces avoided while the prefix excludes them.
  const recent = SHAPE_IDS.slice(0, 9);
  for (let s = 1; s <= 100; s++) {
    const t = generateTray(0, 0, recent, createRng(s));
    assert(t.ids.every((id) => !recent.includes(id)), 'recent ids not in fresh prefix');
  }
});

test('generator: uniform opportunity per orientation (not per family)', () => {
  const counts = Object.fromEntries(SHAPE_IDS.map((id) => [id, 0]));
  let recent = [];
  const rng = createRng(99);
  const N = 4000;
  for (let k = 0; k < N; k++) { const t = generateTray(0, 0, recent, rng); recent = t.recent; t.ids.forEach((id) => counts[id]++); }
  const expected = (N * 3) / 27;
  const dev = Math.max(...Object.values(counts).map((c) => Math.abs(c - expected) / expected));
  report(`orientation frequency on empty board: max deviation ${(dev * 100).toFixed(1)}% from uniform (${N} trays)`);
  assert(dev < 0.15, 'each orientation near uniform; single and lines not weighted by family');
  eq(recent.length, RECENT_LIMIT, 'tracks the last nine');
});

test('generator: every offered tray is whole-tray solvable on the actual board', () => {
  const rng = createRng(2024);
  let fallbacks = 0; let late = 0;
  for (let k = 0; k < 400; k++) {
    // Random crowded boards without full lines.
    const cells = new Uint8Array(64);
    const density = 0.35 + rng() * 0.35;
    for (let i = 0; i < 64; i++) if (rng() < density) cells[i] = 1;
    for (let r = 0; r < 8; r++) cells[r * 8 + Math.floor(rng() * 8)] = 0;
    for (let c = 0; c < 8; c++) cells[Math.floor(rng() * 8) * 8 + c] = 0;
    const { lo, hi } = occFromCells(cells);
    const t = generateTray(lo, hi, [], rng);
    if (t.fallback) fallbacks++;
    if (t.attempts > 12) late++;
    if (t.sequence) assert(replay(cells, t.ids, t.sequence), 'verified sequence replays with real rules');
    else assert(!constructiveFallback(lo, hi, createRng(1)), 'no tray only when no 3-piece sequence exists at all');
  }
  report(`crowded boards: ${late} trays needed replacement draws (attempts 13-28), ${fallbacks} used the constructive fallback (of 400)`);
});

test('generator: constructive fallback is complete when random proposals fail', () => {
  // 16 isolated holes, two per row and column: only singles fit and no
  // single can complete a line, so random proposals essentially never work.
  const cells = new Uint8Array(64).fill(1);
  for (let r = 0; r < 8; r++) { cells[r * 8 + r] = 0; cells[r * 8 + ((r + 4) % 8)] = 0; }
  const { lo, hi } = occFromCells(cells);
  assert(boardFrom, 'helper loaded');
  const fb = constructiveFallback(lo, hi, createRng(3));
  assert(fb, 'fallback finds a sequence');
  eq(fb.ids[0], 'single', 'only singles fit first');
  assert(replay(cells, fb.ids, fb.sequence), 'fallback sequence replays');
  let fallbacks = 0;
  for (let s = 1; s <= 30; s++) {
    const t = generateTray(lo, hi, [], createRng(s));
    assert(t.sequence && replay(cells, t.ids, t.sequence), 'tray from generator is valid');
    if (t.fallback) fallbacks++;
  }
  report('single-hole board: ' + fallbacks + '/30 trays came from the constructive fallback');
  assert(fallbacks > 0, 'fallback path exercised');
});

test('generator: seeded reproducibility and variety', () => {
  const a = generateTray(0, 0, [], createRng(77));
  const b = generateTray(0, 0, [], createRng(77));
  eq(a, b, 'same seed same tray');
  const seen = new Set();
  for (let s = 0; s < 50; s++) seen.add(generateTray(0, 0, [], createRng(1000 + s)).ids.join());
  assert(seen.size > 40, 'different seeds vary');
  assert(findSequence(0, 0, a.ids), 'solvable');
});
