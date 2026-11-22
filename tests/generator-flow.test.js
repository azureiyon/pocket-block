import { test, assert, eq, report } from './harness.js';
import { boardFrom, replay, scriptedGen, memoryStorage, tick } from './helpers.js';
import { generateFlowTray, analyzeBoard, progression, tierOf, rescueStrength, flowWeights, waveOrders, needsClear, solveOrder, FLOW_PALETTE } from '../src/core/generator-flow.js';
import { FLOW_SHAPE_IDS, SHAPE_IDS, getShape } from '../src/core/shapes.js';
import { GENERATORS } from '../src/core/generators.js';
import { MODES, bestKey } from '../src/core/modes.js';
import { createRng } from '../src/core/rng.js';
import { occFromCells, findSequence } from '../src/core/rules.js';
import { Game } from '../src/core/game.js';
import { Settings } from '../src/core/settings.js';
import { createSyncGen } from '../src/gen/service.js';

const occ = (rows) => occFromCells(boardFrom(rows));

test('flow: catalog has every requested orientation, and other modes keep the classic 27', () => {
  eq(SHAPE_IDS.length, 27, 'classic pool unchanged');
  eq(FLOW_SHAPE_IDS.length, 41);
  const fam = {};
  for (const id of FLOW_SHAPE_IDS) { const f = getShape(id).family; fam[f] = (fam[f] || 0) + 1; }
  eq([fam.single, fam.pair, fam.diag2, fam.line3, fam.diag3, fam.square2, fam.corner, fam.line4, fam.t, fam.zigzag, fam.l4, fam.rect23, fam.line5, fam.square3, fam.bigl],
    [1, 2, 2, 2, 2, 1, 4, 2, 4, 4, 8, 2, 2, 1, 4], 'dot, dominoes, diagonals, small L x4, T x4, S/Z x4, L/J x8, big L x4');
  eq(new Set(FLOW_SHAPE_IDS.map((id) => JSON.stringify(getShape(id).cells))).size, 41, 'distinct geometry');
  assert(GENERATORS.flow, 'registered');
});

test('flow: progression tiers follow the score thresholds', () => {
  eq([tierOf(0), tierOf(1999), tierOf(2000), tierOf(5999), tierOf(6000), tierOf(12000), tierOf(99999)], [1, 1, 2, 2, 3, 4, 4]);
  eq(progression(4000), 1.5);
  assert(rescueStrength(0) > rescueStrength(1.5) && rescueStrength(1.5) > rescueStrength(3), 'rescue decays with tier');
  assert(rescueStrength(3) < 2 && rescueStrength(3) >= 1, 'towards 1.0');
});

test('flow: analyzer finds density, near-complete lines with their cells, and combo urgency', () => {
  const { lo, hi } = occ(['#######.', '#####...', '........', '........', '........', '........', '........', '#.......']);
  const a = analyzeBoard(lo, hi, { combo: 3, movesSinceClear: 2, score: 7000 });
  eq(a.filled, 13); eq(a.density, 13 / 64);
  const row0 = a.lines.find((l) => l.line === 0); eq(row0.missing, 1); eq(row0.need.lo, 1 << 7, 'the exact missing cell');
  assert(a.lines.find((l) => l.line === 1 && l.missing === 3), 'row missing 3');
  eq(a.urgency, 'critical'); eq(a.tier, 3);
  eq(analyzeBoard(lo, hi, { combo: 0, movesSinceClear: 2 }).urgency, 'none');
});

test('flow: rescue boost favours line completers when crowded, and fades at high scores', () => {
  const rows = ['###.####', '########'.replace(/#$/, '.'), '#####.##', '####.###', '##.#####', '###.####', '##.#####', '.#######'];
  const { lo, hi } = occ(rows);
  const share = (score) => {
    const a = analyzeBoard(lo, hi, { score });
    const { weights, comp } = flowWeights(lo, hi, a);
    const tot = weights.reduce((x, y) => x + y, 0);
    return FLOW_SHAPE_IDS.reduce((s, id, i) => s + (comp[id] > 0 ? weights[i] : 0), 0) / tot;
  };
  const early = share(0); const late = share(20000);
  report(`flow: line-completer weight share on a crowded board ${(early * 100).toFixed(0)}% early, ${(late * 100).toFixed(0)}% at tier 4`);
  assert(early > 0.5 && early > late, 'completers dominate early, less so later');
});

test('flow: wave lookahead counts placement orders with clears between pieces', () => {
  // Only the 1x1 completes row 0; the 3x3 fits only after the 1x5 clears its row.
  const { lo, hi } = occ(['#######.', '#####...', '########', '###.....', '###.....', '###.....', '########', '########']);
  assert(solveOrder(lo, hi, ['single', 'line3-h', 'pair-h'], [0, 1, 2]), 'simple order');
  const o = waveOrders(lo, hi, ['single', 'single', 'single']);
  eq(o.total, 1, 'identical pieces have one distinct order');
  // Isolated holes only: the 1x1 must go first; its clear opens a full row for the 1x5 and 1x3.
  const DIAG = ['#######.', '.#######', '#.######', '##.#####', '###.####', '####.###', '#####.##', '######.#'];
  const tight = occ(DIAG);
  const ids = ['line5-h', 'line3-h', 'single'];
  const w = waveOrders(tight.lo, tight.hi, ids);
  eq([w.count, w.total], [2, 6], 'only the two orders that start with the 1x1');
  assert(replay(boardFrom(DIAG), ids, w.sequence), 'sequence replays');
  assert(needsClear(tight.lo, tight.hi, ids), 'only fits because lines clear');
  eq(needsClear(0, 0, ['square3', 'line5-h', 'single']), false, 'an empty board needs no clears');
});

test('flow: every dealt wave is solvable, except deliberate punish waves at tier 3+', () => {
  const rng = createRng(11);
  let punish = 0; let dealt = 0; let triples = 0;
  for (let k = 0; k < 400; k++) {
    const cells = new Uint8Array(64);
    const d = rng() * 0.6;
    for (let i = 0; i < 64; i++) if (rng() < d) cells[i] = 1;
    const { lo, hi } = occFromCells(cells);
    const score = [0, 3000, 8000, 15000][k % 4];
    const t = generateFlowTray(lo, hi, [], createRng(k), { score, trayIndex: 9, combo: k % 3, movesSinceClear: k % 3 });
    for (const c of t.colors) assert(c >= 1 && c <= FLOW_PALETTE);
    if (t.ids[0] === t.ids[1] && t.ids[1] === t.ids[2] && !String(t.kind).startsWith('clutch')) triples++;
    if (t.kind === 'punish') {
      punish++;
      assert(tierOf(score) >= 3, 'punish only at high tiers');
      assert(findSequence(lo, hi, t.ids.slice(0, 2)), 'P1 and P2 fit');
      assert(!findSequence(lo, hi, t.ids), 'but not all three');
      continue;
    }
    if (!findSequence(lo, hi, t.ids)) { assert(t.fallback && t.sequence === null, 'unsolvable only when nothing is'); continue; }
    dealt++;
    assert(replay(cells, t.ids, t.sequence), 'verified sequence replays');
  }
  report(`flow: ${dealt} solvable waves, ${punish} punish waves (tier 3+ only), ${triples} accidental triples`);
  eq(triples, 0, 'no three identical pieces outside clutch waves');
});

test('flow: tight clutch waves appear at tier 2+, never at tier 1', () => {
  const { lo, hi } = occ(['#######.', '.#######', '#.######', '##.#####', '###.####', '####.###', '#####.##', '######.#']);
  const kinds = (score) => { const out = {}; for (let k = 0; k < 150; k++) { const t = generateFlowTray(lo, hi, [], createRng(k), { score }); out[t.kind] = (out[t.kind] || 0) + 1; } return out; };
  const t1 = kinds(0); const t4 = kinds(15000);
  report(`flow: tray kinds at tier 1 ${JSON.stringify(t1)}, tier 4 ${JSON.stringify(t4)}`);
  assert(!t1.clutch && !t1['clutch-clear'], 'no clutch at tier 1');
  assert((t4.clutch || 0) + (t4['clutch-clear'] || 0) > 0, 'clutch waves at tier 4');
});

test('flow mode: Blast scoring and streaks, own best score, score passed only to Flow', async () => {
  eq(MODES.flow.generator, 'flow'); eq(MODES.flow.streakWindow, MODES.blast.streakWindow); assert(MODES.flow.arcade);
  eq(bestKey('flow'), 'bestFlow');
  const calls = [];
  const gen = scriptedGen({ trays: [['single', 'single', 'single']] });
  const tray = gen.tray; gen.tray = (...args) => { calls.push(args[4]); return tray(); };
  const settings = new Settings(memoryStorage());
  const g = new Game({ gen, settings, mode: 'flow' });
  await g.newGame({ seed: 1 });
  eq(g.generator, 'flow');
  g.place(0, 0, 0); g.place(1, 0, 1); g.place(2, 0, 2); await tick();
  eq(calls[0].score, g.score, 'flow sees the score');
  eq(settings.get('bestFlow'), g.score); eq(settings.get('bestBlast'), 0);
});

test('flow mode: full games with the real generator run and end', async () => {
  const g = new Game({ gen: createSyncGen(), mode: 'flow' });
  let moves = 0; let ended = 0;
  for (let seed = 1; seed <= 4; seed++) {
    await g.newGame({ seed });
    while (!g.over && g.moves < 150) {
      if (g.busy) { await tick(); continue; }
      let done = false;
      for (let s = 0; s < 3 && !done; s++) for (let r = 0; r < 8 && !done; r++) for (let c = 0; c < 8 && !done; c++) if (g.canPlace(s, r, c)) { g.place(s, r, c); moves++; done = true; }
      if (!done) break;
    }
    if (g.over) ended++;
  }
  report(`flow: 4 naive games, ${moves} moves, ${ended} ended in game over`);
  assert(moves > 20);
});
