import { test, assert, eq, report } from './harness.js';
import { boardFrom, count, replay, scriptedGen, memoryStorage, tick, shapeCells } from './helpers.js';
import { Game } from '../src/core/game.js';
import { Settings } from '../src/core/settings.js';
import { createSyncGen } from '../src/gen/service.js';
import { occFromCells, findSequence, scoreFor } from '../src/core/rules.js';
import { DragController } from '../src/ui/drag.js';

function firstLegal(game) {
  for (let s = 0; s < 3; s++) {
    const p = game.tray[s];
    if (!p || p.placed) continue;
    for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (game.canPlace(s, r, c)) return [s, r, c];
  }
  return null;
}

test('game: scoring, combo feedback without multiplier, high score persistence', async () => {
  const storage = memoryStorage();
  const settings = new Settings(storage);
  const cells = boardFrom(['#######.', '#######.', '........', '........', '........', '........', '........', '........']);
  const gen = scriptedGen({ cells, trays: [['line3-v', 'single', 'pair-h'], ['single', 'single', 'single']] });
  const g = new Game({ gen, settings });
  await g.newGame({ seed: 1 });
  eq(g.score, 0, 'pre-placed blocks award zero');
  const m1 = g.place(0, 0, 7); // completes rows 0 and 1
  eq(m1.lines, 2); eq(m1.points, scoreFor(3, 2)); eq(m1.combo, 1);
  const m2 = g.place(1, 7, 0); eq(m2.lines, 0); eq(g.combo, 0, 'combo resets on non-clearing move');
  eq(g.score, 15 + 320 + 5);
  eq(settings.get('best'), g.score, 'best persisted');
  eq(new Settings(storage).get('best'), g.score, 'best survives reload');
});

test('game: combo counts consecutive clears and never multiplies score', async () => {
  const cells = boardFrom(['#######.', '........', '#######.', '........', '........', '........', '........', '........']);
  const gen = scriptedGen({ cells, trays: [['single', 'single', 'pair-v']] });
  const g = new Game({ gen });
  await g.newGame({ seed: 1 });
  const a = g.place(0, 0, 7); const b = g.place(1, 2, 7);
  eq([a.combo, b.combo], [1, 2]);
  eq(b.points, scoreFor(1, 1), 'combo does not change points');
});

test('game: pre-placed blocks are ordinary removable cells', async () => {
  const cells = boardFrom(['####....', '........', '........', '........', '........', '........', '........', '........']);
  const g = new Game({ gen: scriptedGen({ cells, trays: [['line4-h', 'single', 'single']] }) });
  await g.newGame({ seed: 2 });
  eq(count(g.cells), 4);
  const m = g.place(0, 0, 4);
  eq(m.lines, 1); eq(m.points, 5 * 4 + 80); eq(count(g.cells), 0); assert(m.allClear, 'all clear');
  eq(m.clearedCells.length, 8);
});

test('game: refill only after all three pieces, game over when none fit', async () => {
  const cells = boardFrom(['#.#.#.#.', '.#.#.#.#', '#.#.#.#.', '.#.#.#.#', '#.#.#.#.', '.#.#.#.#', '#.#.#.#.', '........']);
  const gen = scriptedGen({ cells, trays: [['single', 'pair-h', 'square2'], ['square3', 'square3', 'square3']] });
  const g = new Game({ gen });
  let overs = 0; g.on('gameover', () => overs++);
  await g.newGame({ seed: 3 });
  assert(!g.over, 'pair-h fits in the bottom row');
  g.place(0, 0, 1); eq(g.batch, 1, 'no refill after one');
  g.place(1, 7, 0); eq(g.batch, 1, 'no refill after two');
  assert(g.over, 'square2 cannot fit: game over');
  eq(overs, 1);
  eq(g.place(2, 0, 0), null, 'no moves after game over');
  eq(g.tray.filter((p) => !p.placed).length, 1, 'remaining piece is never replaced');
});

test('game: duplicate inputs and busy refill cannot double-place', async () => {
  const gen = scriptedGen({ trays: [['single', 'single', 'single'], ['pair-h', 'pair-h', 'pair-h']], deferred: true });
  const g = new Game({ gen });
  await g.newGame({ seed: 4 });
  assert(g.place(0, 0, 0)); eq(g.place(0, 0, 1), null, 'same slot twice rejected');
  assert(g.place(1, 0, 1)); assert(g.place(2, 0, 2));
  assert(g.busy, 'busy while next tray generates');
  eq(g.place(0, 1, 0), null, 'input ignored while busy');
  eq(count(g.cells), 3);
  gen.flush(); await tick();
  assert(!g.busy); eq(g.batch, 2); eq(g.tray[0].shapeId, 'pair-h');
});

test('game: stale generation results after restart are discarded', async () => {
  const gen = scriptedGen({ trays: [['single', 'single', 'single'], ['line5-h', 'line5-h', 'line5-h'], ['square2', 'square2', 'square2']], deferred: true });
  const g = new Game({ gen });
  await g.newGame({ seed: 5 });
  g.place(0, 0, 0); g.place(1, 0, 1); g.place(2, 0, 2);
  assert(g.busy);
  const restart = g.newGame({ seed: 6 });
  await restart;
  const trayAfterRestart = g.tray.map((p) => p.shapeId).join();
  eq(trayAfterRestart, 'square2,square2,square2');
  const batch = g.batch;
  gen.flush(); await tick();
  eq(g.batch, batch, 'no extra batch from the stale result');
  eq(g.tray.map((p) => p.shapeId).join(), trayAfterRestart, 'old refill ignored');
  eq(count(g.cells), 0, 'board from the old game not resurrected');
  eq(g.score, 0);
});

test('game: many successive batches stay valid (sync generator, greedy bot)', async () => {
  let batches = 0; let moves = 0; let clears = 0; let games = 0; let allClears = 0;
  for (let seed = 1; seed <= 12; seed++) {
    const g = new Game({ gen: createSyncGen() });
    let lastBatch = 0;
    g.on('tray', ({ tray }) => {
      // Every tray offered must be whole-tray solvable on the actual board.
      const { lo, hi } = occFromCells(g.cells);
      assert(findSequence(lo, hi, tray.map((p) => p.shapeId)), 'offered tray solvable');
      assert(g.lastSequence && replay(g.cells, tray.map((p) => p.shapeId), g.lastSequence), 'sequence replays');
      batches++;
    });
    await g.newGame({ seed: seed * 31, opening: { mode: 'random', variant: 'any' } });
    games++;
    let guard = 0;
    while (!g.over && guard++ < 400) {
      if (g.busy) { await tick(); continue; }
      const mv = firstLegal(g);
      if (!mv) break;
      const before = count(g.cells); const scoreBefore = g.score; const b = g.batch;
      const m = g.place(...mv);
      assert(m, 'legal move accepted');
      eq(count(g.cells), before + m.placed.length - m.clearedCells.length, 'no phantom or lost cells');
      eq(g.score - scoreBefore, shapeCells(m.shapeId) * 5 + 80 * m.lines * m.lines, 'scoring');
      if (m.lines) clears++;
      if (m.allClear) allClears++;
      moves++;
      if (b !== lastBatch) lastBatch = b;
      await tick();
    }
    assert(g.over || guard >= 400, 'game ended by game over');
  }
  report(`simulated ${games} games: ${moves} moves, ${batches} trays, ${clears} clearing moves, ${allClears} board clears`);
  assert(batches > 50);
});

test('game: seeded games reproduce; restarts vary', async () => {
  const opening = { mode: 'always', variant: 'any' };
  const a = new Game({ gen: createSyncGen() }); await a.newGame({ seed: 123, opening });
  const b = new Game({ gen: createSyncGen() }); await b.newGame({ seed: 123, opening });
  eq([...a.cells], [...b.cells]); eq(a.tray.map((p) => p.shapeId), b.tray.map((p) => p.shapeId));
  const layouts = new Set();
  for (let k = 0; k < 8; k++) { await a.newGame({ opening }); layouts.add([...a.cells].join('') + a.tray.map((p) => p.shapeId).join()); }
  assert(layouts.size === 8, 'every restart is fresh');
});

// ---------- drag controller (touch + mouse) ----------

function dragSetup(trays = [['single', 'pair-h', 'square2']], cells) {
  const g = new Game({ gen: scriptedGen({ trays, cells }) });
  const calls = [];
  const hooks = new Proxy({}, { get: (_, name) => (...args) => calls.push([name, ...args]) });
  const geometry = () => ({ left: 0, top: 0, pitch: 40, size: 36 });
  const d = new DragController({ game: g, geometry, hooks });
  return { g, d, calls };
}

test('drag: touch drag floats piece above finger and places at mapped cell', async () => {
  const { g, d, calls } = dragSetup();
  await g.newGame({ seed: 1 });
  // single: ghost top-left = (x - 20, y - 40 - lift 50). Target r=2, c=3 => x=140, y=80+90=170.
  assert(d.down({ slot: 0, x: 100, y: 500, pointerType: 'touch', id: 7 }));
  d.move({ x: 103, y: 502, id: 7 });
  assert(!d.dragging, 'below threshold is not a drag');
  d.move({ x: 140, y: 170, id: 7 });
  assert(d.dragging);
  eq(d.ghost, { left: 120, top: 80 }, 'ghost lifted above the finger');
  eq([d.target.r, d.target.c, d.target.valid], [2, 3, true]);
  const move = d.up({ x: 140, y: 170, id: 7 });
  assert(move && move.r === 2 && move.c === 3);
  eq(g.cells[2 * 8 + 3], g.tray[0].color);
  assert(calls.some((c) => c[0] === 'hideGhost'));
  eq(d.up({ x: 140, y: 170, id: 7 }), null, 'second pointerup ignored');
  eq(count(g.cells), 1, 'no duplicate placement');
});

test('drag: mouse drag centres piece on cursor', async () => {
  const { g, d } = dragSetup();
  await g.newGame({ seed: 1 });
  d.down({ slot: 2, x: 0, y: 600, pointerType: 'mouse' });
  d.move({ x: 200, y: 200 }); // square2 80x80 -> top-left (160,160) => r=4,c=4
  eq([d.target.r, d.target.c], [4, 4]);
  d.up({ x: 200, y: 200 });
  assert(g.tray[2].placed);
});

test('drag: pointer cancel and interruptions return the piece', async () => {
  const { g, d, calls } = dragSetup();
  await g.newGame({ seed: 1 });
  d.down({ slot: 1, x: 100, y: 500, pointerType: 'touch', id: 3 });
  d.move({ x: 150, y: 200, id: 3 });
  assert(d.dragging);
  assert(d.cancel('pointercancel'));
  assert(!d.active && !d.dragging);
  eq(d.up({ x: 150, y: 200, id: 3 }), null, 'up after cancel ignored');
  assert(!g.tray[1].placed, 'piece not lost');
  eq(count(g.cells), 0, 'nothing placed');
  assert(calls.some((c) => c[0] === 'cancelled'));
  // Second finger is ignored while dragging.
  d.down({ slot: 0, x: 0, y: 500, pointerType: 'touch', id: 1 });
  eq(d.down({ slot: 2, x: 0, y: 500, pointerType: 'touch', id: 2 }), false);
  d.move({ x: 200, y: 200, id: 2 });
  assert(!d.dragging, 'other pointer ignored');
  d.cancel('orientation');
});

test('drag: invalid drop and off-board drop place nothing', async () => {
  const cells = boardFrom(['#.......']);
  const { g, d, calls } = dragSetup([['single', 'pair-h', 'square2']], cells);
  await g.newGame({ seed: 1 });
  d.down({ slot: 0, x: 0, y: 600, pointerType: 'mouse' });
  d.move({ x: 20, y: 20 });
  eq(d.target.valid, false, 'occupied cell previewed as invalid');
  d.up({ x: 20, y: 20 });
  assert(calls.some((c) => c[0] === 'invalid'));
  d.down({ slot: 0, x: 0, y: 600, pointerType: 'mouse' });
  d.move({ x: 900, y: 900 });
  eq(d.target, null);
  d.up({ x: 900, y: 900 });
  eq(count(g.cells), 1);
  assert(!g.tray[0].placed);
});

test('drag: tap selects and tap again deselects', async () => {
  const { g, d } = dragSetup();
  await g.newGame({ seed: 1 });
  d.down({ slot: 1, x: 10, y: 600, pointerType: 'touch' }); d.up({ x: 11, y: 601 });
  eq(d.selected, 1);
  d.down({ slot: 1, x: 10, y: 600, pointerType: 'touch' }); d.up({ x: 10, y: 600 });
  eq(d.selected, null);
});
