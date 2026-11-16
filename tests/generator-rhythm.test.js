import { test, assert, eq, report } from './harness.js';
import { replay, scriptedGen, tick } from './helpers.js';
import { generateRhythmTray, chooseMood, evaluateTray, MOODS } from '../src/core/generator-rhythm.js';
import { features } from '../src/core/boardeval.js';
import { GENERATORS, DEFAULT_GENERATOR, getGenerator } from '../src/core/generators.js';
import { createRng } from '../src/core/rng.js';
import { occFromCells, findSequence } from '../src/core/rules.js';
import { SHAPE_IDS } from '../src/core/shapes.js';
import { Game } from '../src/core/game.js';
import { createSyncGen } from '../src/gen/service.js';

function randomBoard(rng, density) {
  const cells = new Uint8Array(64);
  for (let i = 0; i < 64; i++) if (rng() < density) cells[i] = 1;
  for (let r = 0; r < 8; r++) cells[r * 8 + Math.floor(rng() * 8)] = 0;
  for (let c = 0; c < 8; c++) cells[Math.floor(rng() * 8) * 8 + c] = 0;
  return cells;
}

test('boardeval: bitboard features match a naive cell-by-cell count', () => {
  const rng = createRng(31);
  for (let k = 0; k < 300; k++) {
    const cells = randomBoard(rng, rng() * 0.8);
    const { lo, hi } = occFromCells(cells);
    const f = features(lo, hi);
    const empty = (r, c) => r >= 0 && c >= 0 && r < 8 && c < 8 && !cells[r * 8 + c];
    let isolated = 0; let oneWay = 0; let edges = 0; let filled = 0;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) {
      if (!empty(r, c)) { filled++; continue; }
      const h = empty(r, c - 1) || empty(r, c + 1); const v = empty(r - 1, c) || empty(r + 1, c);
      if (!h && !v) isolated++; else if (!h || !v) oneWay++;
      edges += [[0, 1], [0, -1], [1, 0], [-1, 0]].filter(([dr, dc]) => !empty(r + dr, c + dc)).length;
    }
    eq([f.filled, f.isolated, f.oneWay, f.edges], [filled, isolated, oneWay, edges], 'features');
  }
});

test('rhythm: rollback switch keeps the classic generator available', () => {
  eq(DEFAULT_GENERATOR, 'rhythm');
  assert(GENERATORS.classic && GENERATORS.rhythm);
  const a = getGenerator('classic')(0, 0, [], createRng(5));
  assert(!a.mood, 'classic output unchanged');
});

test('rhythm: every tray is whole-tray solvable on the actual board', () => {
  const rng = createRng(77);
  const moods = {};
  for (let k = 0; k < 400; k++) {
    const cells = randomBoard(rng, 0.2 + rng() * 0.5);
    const { lo, hi } = occFromCells(cells);
    const t = generateRhythmTray(lo, hi, [], rng, { traysSinceClear: k % 4 });
    moods[t.mood] = (moods[t.mood] || 0) + 1;
    if (t.sequence) assert(replay(cells, t.ids, t.sequence), 'verified sequence replays');
    else assert(!findSequence(lo, hi, t.ids) && t.mood === 'fallback', 'only a hopeless board lacks a sequence');
    eq(t.ids.length, 3); eq(t.colors.length, 3);
  }
  report('rhythm moods on 400 random boards: ' + JSON.stringify(moods));
  for (const m of MOODS) assert(moods[m] > 0, m + ' used');
});

test('rhythm: seeded reproducibility, repeats allowed, no score input', () => {
  const rng = createRng(3);
  const cells = randomBoard(rng, 0.4);
  const { lo, hi } = occFromCells(cells);
  const a = generateRhythmTray(lo, hi, ['single'], createRng(9), { traysSinceClear: 2 });
  const b = generateRhythmTray(lo, hi, ['single'], createRng(9), { traysSinceClear: 2, score: 999999 });
  eq(a.ids, b.ids, 'same seed, same tray; score in context is ignored');
  let dup = 0; let recent = [];
  const r2 = createRng(4);
  for (let k = 0; k < 400; k++) { const t = generateRhythmTray(0, 0, recent, r2, {}); recent = t.recent; if (new Set(t.ids).size < 3) dup++; }
  report(`rhythm: ${dup}/400 empty-board trays repeat a shape`);
  assert(dup > 20 && dup < 160, 'identical pieces appear sometimes, not constantly');
});

test('rhythm: approximate shape frequencies are preserved', () => {
  const counts = Object.fromEntries(SHAPE_IDS.map((id) => [id, 0]));
  const rng = createRng(12); let recent = [];
  for (let k = 0; k < 1500; k++) {
    const cells = randomBoard(rng, rng() * 0.45);
    const { lo, hi } = occFromCells(cells);
    const t = generateRhythmTray(lo, hi, recent, rng, { traysSinceClear: k % 3 });
    recent = t.recent; t.ids.forEach((id) => counts[id]++);
  }
  const exp = (1500 * 3) / 27;
  const dev = Math.max(...Object.values(counts).map((c) => Math.abs(c - exp) / exp));
  report(`rhythm shape frequency over mixed boards: max deviation ${(dev * 100).toFixed(0)}% from uniform`);
  assert(dev < 0.8, 'no shape is starved or flooded');
  assert(Object.values(counts).every((c) => c > exp * 0.35), 'every orientation still appears');
});

test('rhythm: clears are not guaranteed and rescues are not constant', () => {
  const rng = createRng(21);
  let noClear = 0; let recovery = 0; const N = 300;
  for (let k = 0; k < N; k++) {
    const cells = randomBoard(rng, 0.45 + rng() * 0.15);
    const { lo, hi } = occFromCells(cells);
    const t = generateRhythmTray(lo, hi, [], rng, { traysSinceClear: 0 });
    if (t.mood === 'recovery') recovery++;
    const e = evaluateTray(lo, hi, t.ids);
    if (e && e.bestLines === 0) noClear++;
  }
  report(`crowded boards: ${noClear}/${N} trays offered no clear for best play, ${recovery}/${N} chose recovery mood`);
  assert(noClear > 0, 'some trays give no clear');
  assert(recovery < N * 0.7, 'recovery is not the default even on crowded boards');
});

test('rhythm: director reacts to pressure and dry spells', () => {
  const empty = features(0, 0);
  const rng = createRng(1);
  const tally = (f, dry) => { const c = {}; for (let k = 0; k < 2000; k++) { const m = chooseMood(f, { traysSinceClear: dry }, rng).mood; c[m] = (c[m] || 0) + 1; } return c; };
  const calm = tally(empty, 0);
  const dryCalm = tally(empty, 3);
  assert((calm.recovery || 0) === 0, 'no recovery on an empty board');
  assert(dryCalm.reward > calm.reward * 2, 'reward becomes likelier after trays without clears');
  const crowded = features(0xffffffff & 0x7f7f7f7f, 0x7f7f7f7f & 0x00ffffff);
  const c = tally(crowded, 1);
  assert(c.recovery > 300 && c.recovery < 1700, 'crowded boards favour recovery but not always');
});

test('rhythm: game passes clear history to the generator', async () => {
  const calls = [];
  const gen = scriptedGen({ trays: [['single', 'single', 'single']] });
  const tray = gen.tray;
  gen.tray = (...args) => { calls.push(args[4]); return tray(); };
  const g = new Game({ gen });
  await g.newGame({ seed: 1 });
  g.place(0, 0, 0); g.place(1, 0, 1); g.place(2, 0, 2); await tick();
  g.place(0, 1, 0); g.place(1, 1, 1); g.place(2, 1, 2); await tick();
  eq(calls.map((c) => c.traysSinceClear), [1, 2]);
  assert(!('score' in calls[0]), 'score is never passed');
  // Real generator through the game.
  const g2 = new Game({ gen: createSyncGen() });
  eq(g2.generator, 'rhythm');
  await g2.newGame({ seed: 4, opening: { mode: 'off', variant: 'any' } });
});
