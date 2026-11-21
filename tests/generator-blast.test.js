import { test, assert, eq, report } from './harness.js';
import { boardFrom, replay, scriptedGen, memoryStorage } from './helpers.js';
import { generateBlastTray, evaluateBlast, immediateClear, generosity, BLAST_PALETTE, TILINGS, blastWeights } from '../src/core/generator-blast.js';
import { GENERATORS } from '../src/core/generators.js';
import { MODES, getMode, wipedColors, bestKey, BLAST_LINE_POINTS, BLAST_STREAK_WINDOW } from '../src/core/modes.js';
import { createRng } from '../src/core/rng.js';
import { occFromCells, findSequence } from '../src/core/rules.js';
import { SHAPE_IDS, getShape } from '../src/core/shapes.js';
import { Game } from '../src/core/game.js';
import { Settings } from '../src/core/settings.js';
import { createSyncGen } from '../src/gen/service.js';

function randomBoard(rng, density) {
  const cells = new Uint8Array(64);
  for (let i = 0; i < 64; i++) if (rng() < density) cells[i] = 1;
  for (let r = 0; r < 8; r++) cells[r * 8 + Math.floor(rng() * 8)] = 0;
  for (let c = 0; c < 8; c++) cells[Math.floor(rng() * 8) * 8 + c] = 0;
  return cells;
}

test('blast: registered, and every tiling spans exactly 8 cells', () => {
  assert(GENERATORS.blast, 'blast generator registered');
  eq(getMode('blast').generator, 'blast');
  eq(getMode('nope').id, 'classic', 'unknown mode falls back to classic');
  assert(TILINGS.length > 10);
  for (const t of TILINGS) {
    const h = t.every((id) => getShape(id).h === 1 || id.startsWith('square') || id === 'rect-h');
    const span = t.reduce((a, id) => a + (h ? getShape(id).w : getShape(id).h), 0);
    eq(span, 8, 'tiling ' + t.join('+'));
  }
});

test('blast: every offered tray is whole-tray solvable and replays on the real board', () => {
  const rng = createRng(77);
  let offered = 0; let fallbacks = 0;
  for (let k = 0; k < 250; k++) {
    const cells = randomBoard(rng, rng() * 0.55);
    const { lo, hi } = occFromCells(cells);
    const t = generateBlastTray(lo, hi, [], createRng(1000 + k), { trayIndex: k % 40 });
    if (t.kind === 'fallback') fallbacks++;
    if (!findSequence(lo, hi, t.ids)) { assert(t.sequence === null, 'unsolvable trays only when no sequence exists'); continue; }
    offered++;
    assert(t.sequence, 'sequence attached');
    assert(replay(cells, t.ids, t.sequence), 'sequence replays');
    for (const c of t.colors) assert(c >= 1 && c <= BLAST_PALETTE, 'colour in blast palette');
    eq(t.recent.length <= 9, true);
  }
  report(`blast: ${offered}/250 random boards got a verified tray, ${fallbacks} used the classic fallback`);
});

test('blast: seeded generation is reproducible', () => {
  const cells = boardFrom(['#######.', '######..', '........', '........', '........', '........', '........', '........']);
  const { lo, hi } = occFromCells(cells);
  const a = generateBlastTray(lo, hi, [], createRng(5), { trayIndex: 3 });
  const b = generateBlastTray(lo, hi, [], createRng(5), { trayIndex: 3 });
  eq(a.ids, b.ids); eq(a.colors, b.colors);
});

test('blast: favours clears far more than the rhythm generator on near-complete boards', () => {
  const cells = boardFrom(['###.####', '###.####', '........', '........', '.......#', '.......#', '........', '........']);
  const { lo, hi } = occFromCells(cells);
  let blastClear = 0; let rhythmClear = 0; let blastMulti = 0; let rhythmMulti = 0;
  for (let k = 0; k < 120; k++) {
    const b = generateBlastTray(lo, hi, [], createRng(k), { trayIndex: 10 });
    const r = GENERATORS.rhythm(lo, hi, [], createRng(k), { trayIndex: 10 });
    if (immediateClear(lo, hi, b.ids)) blastClear++;
    if (immediateClear(lo, hi, r.ids)) rhythmClear++;
    if (evaluateBlast(lo, hi, b.ids).bestLines >= 3) blastMulti++;
    if (evaluateBlast(lo, hi, r.ids).bestLines >= 3) rhythmMulti++;
  }
  report(`blast: first-move clear offered in ${blastClear}/120 trays (rhythm ${rhythmClear}/120); 3+ lines reachable ${blastMulti}/120 (rhythm ${rhythmMulti}/120)`);
  assert(blastClear >= 100, 'blast nearly always offers a clear here');
  assert(blastClear > rhythmClear && blastMulti > rhythmMulti, 'more often than rhythm');
});

test('blast: streak in danger prefers trays that can clear on the first move', () => {
  const rng = createRng(9);
  let withDanger = 0; let without = 0; let n = 0;
  for (let k = 0; k < 160; k++) {
    const cells = randomBoard(rng, 0.35);
    const { lo, hi } = occFromCells(cells);
    const probe = generateBlastTray(lo, hi, [], createRng(k), { trayIndex: 20 });
    if (!probe.sequence) continue;
    n++;
    const d = generateBlastTray(lo, hi, [], createRng(k), { trayIndex: 20, combo: 4, movesSinceClear: 2 });
    const s = generateBlastTray(lo, hi, [], createRng(k), { trayIndex: 20, combo: 0, movesSinceClear: 0 });
    if (immediateClear(lo, hi, d.ids)) withDanger++;
    if (immediateClear(lo, hi, s.ids)) without++;
  }
  report(`blast: first-move clear with streak in danger ${withDanger}/${n}, without ${without}/${n}`);
  assert(withDanger >= without, 'danger never lowers the chance of an immediate clear');
});

test('blast: shape weights lean chunky on open boards and smaller under pressure', () => {
  const open = blastWeights([], 0); const tight = blastWeights([], 1);
  const w = (arr, id) => arr[SHAPE_IDS.indexOf(id)];
  assert(w(open, 'line5-h') > w(open, 'zig-h') * 3, 'bars beat zigzags');
  assert(w(tight, 'square3') < w(open, 'square3'), '3x3 rarer under pressure');
  assert(w(tight, 'pair-h') > w(open, 'pair-h'), 'small pieces commoner under pressure');
  assert(generosity(0) === 1 && generosity(1000) < generosity(10), 'generosity eases off over a long game');
});

test('blast: evaluateBlast counts lines, clearing moves and first-move clears', () => {
  const cells = boardFrom(['####....', '........', '........', '........', '........', '........', '........', '........']);
  const { lo, hi } = occFromCells(cells);
  const e = evaluateBlast(lo, hi, ['line4-h', 'line5-h', 'line3-h']);
  assert(e.bestLines >= 2, 'line4 then line5+line3 clear two rows');
  assert(e.first, 'line4 clears row 0 immediately');
  eq(evaluateBlast(lo, hi, ['square3', 'square3', 'square3']).first, false);
});

test('modes: blast scoring multiplies clears, wipes and board clears by the streak', () => {
  const s = MODES.blast.score;
  eq(s({ blocks: 3, lines: 0, combo: 0, wiped: 0, allClear: false }).points, 3);
  eq(s({ blocks: 4, lines: 1, combo: 1, wiped: 0, allClear: false }).points, 4 + BLAST_LINE_POINTS[1]);
  eq(s({ blocks: 4, lines: 2, combo: 3, wiped: 0, allClear: false }).points, 4 + 60 * 3);
  eq(s({ blocks: 1, lines: 1, combo: 2, wiped: 2, allClear: true }).points, 1 + 20 * 2 + 2 * 50 * 2 + 300 * 2);
  eq(MODES.classic.score({ blocks: 3, lines: 2, combo: 4 }).points, 15 + 320, 'classic unchanged');
  eq(bestKey('blast'), 'bestBlast'); eq(bestKey('classic'), 'best');
});

test('modes: colour wipes only count colours that were on the board before', () => {
  const before = new Uint8Array(64); before[0] = 2; before[1] = 3; before[9] = 3;
  const after = new Uint8Array(64); after[9] = 3;
  const cleared = [{ i: 0, color: 2 }, { i: 1, color: 3 }, { i: 2, color: 4 }];
  eq(wipedColors(before, after, cleared), [2], 'colour 2 gone; 3 survives; 4 was the new piece');
  eq(wipedColors(before, after, []), []);
});

test('game: blast streak survives misses, multiplies points and keeps its own best', async () => {
  const storage = memoryStorage();
  const settings = new Settings(storage);
  settings.set('best', 999);
  const cells = boardFrom(['#######.', '........', '#######.', '........', '........', '........', '#######.', '........']);
  const trays = [['single', 'single', 'single'], ['single', 'single', 'single'], ['single', 'single', 'single']];
  const g = new Game({ gen: scriptedGen({ cells, trays }), settings, mode: 'blast' });
  await g.newGame({ seed: 1 });
  eq(g.modeId, 'blast'); eq(g.best, 0, 'blast best starts separately');
  const a = g.place(0, 0, 7); eq([a.lines, a.combo, a.points], [1, 1, 1 + 20]);
  const b = g.place(1, 4, 0); eq([b.lines, b.combo, g.streakLeft], [0, 1, BLAST_STREAK_WINDOW - 1], 'one miss keeps the streak');
  const c = g.place(2, 2, 7); eq([c.lines, c.combo], [1, 2]); eq(c.points, 1 + 20 * 2, 'multiplied by streak');
  eq(g.streakLeft, BLAST_STREAK_WINDOW);
  await new Promise((r) => setTimeout(r, 0));
  g.place(0, 4, 1); g.place(1, 4, 2); const miss3 = g.place(2, 4, 3);
  eq(miss3.combo, 0, 'three misses end the streak'); eq(miss3.prevCombo, 2);
  eq(settings.get('bestBlast'), g.score); eq(settings.get('best'), 999, 'classic best untouched');
});

test('game: blast reports colour wipes and ignores starting-board settings', async () => {
  const cells = new Uint8Array(64);
  for (let c = 0; c < 7; c++) cells[c] = 4; // row 0, one colour
  cells[20] = 2;
  const gen = scriptedGen({ cells, trays: [['single', 'single', 'single']] });
  let prefsSeen = null;
  const open = gen.opening; gen.opening = (prefs, ...rest) => { prefsSeen = prefs; return open(prefs, ...rest); };
  const g = new Game({ gen, mode: 'blast' });
  await g.newGame({ seed: 2, opening: { mode: 'always', variant: 'any' } });
  eq(prefsSeen.mode, 'off', 'blast always starts empty');
  const m = g.place(0, 0, 7); // piece colour 1 completes row 0
  eq(m.wiped, [4]); eq(m.points, 1 + 20 + 50);
});

test('game: classic mode behaves exactly as before', async () => {
  const cells = boardFrom(['#######.', '........', '#######.', '........', '........', '........', '........', '........']);
  const g = new Game({ gen: scriptedGen({ cells, trays: [['single', 'single', 'pair-v']] }) });
  await g.newGame({ seed: 1 });
  eq(g.modeId, 'classic');
  const a = g.place(0, 0, 7); const miss = g.place(2, 4, 0);
  eq([a.combo, miss.combo], [1, 0], 'a miss resets the combo in classic');
  eq(a.points, 5 + 80);
});

test('game: blast full games with the real generator stay solvable at refill', async () => {
  const g = new Game({ gen: createSyncGen(), mode: 'blast' });
  let moves = 0; let clears = 0; let maxCombo = 0; let unsolvable = 0;
  for (let seed = 1; seed <= 6; seed++) {
    await g.newGame({ seed });
    while (!g.over && g.moves < 120) {
      if (g.busy) { await new Promise((r) => setTimeout(r, 0)); continue; }
      if (g.remaining.length === 3 && !findSequence(...Object.values(occFromCells(g.cells)), g.remaining.map((p) => p.shapeId))) unsolvable++;
      let done = false;
      for (let s = 0; s < 3 && !done; s++) for (let r = 0; r < 8 && !done; r++) for (let c = 0; c < 8 && !done; c++) {
        if (g.canPlace(s, r, c)) { const m = g.place(s, r, c); moves++; if (m.lines) clears++; maxCombo = Math.max(maxCombo, m.combo); done = true; }
      }
      if (!done) break;
    }
  }
  report(`blast: 6 naive games, ${moves} moves, ${clears} clearing moves, longest streak ${maxCombo}, ${unsolvable} unsolvable trays`);
  eq(unsolvable, 0);
});
