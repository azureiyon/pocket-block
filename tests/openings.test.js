import { test, assert, eq, report } from './harness.js';
import { count, replay } from './helpers.js';
import {
  OPENING_VARIANTS, OPENING_BY_ID, planOpening, generateLayout, validateOpening, components, isolatedGaps,
  emptyWindows, hasFullLine, lineCells, registerOpeningVariant, GEOMETRY_ATTEMPTS,
} from '../src/core/openings.js';
import { generateTray } from '../src/core/generator.js';
import { createRng } from '../src/core/rng.js';
import { occFromCells, occFromIndices, countPlacements, anyShapePlaceable, findSequence, placeOnCells } from '../src/core/rules.js';

const setOf = (cells) => { const s = new Set(); cells.forEach((v, i) => { if (v) s.add(i); }); return s; };

function checkCommon(plan, def) {
  const set = setOf(plan.cells);
  const [min, max] = def.cellRange;
  assert(set.size >= min && set.size <= max, `${def.id}: ${set.size} cells outside ${min}-${max}`);
  assert(!hasFullLine(set), 'no pre-completed rows or columns');
  eq(isolatedGaps(set), [], 'no isolated one-cell gaps');
  assert(emptyWindows(set, 3) >= 2, 'two empty 3x3 windows');
  assert(emptyWindows(set, 2) >= 6, 'six empty 2x2 windows');
  const { lo, hi } = occFromCells(plan.cells);
  assert(anyShapePlaceable(lo, hi, plan.tray.ids), 'no immediate game over');
  let total = 0;
  for (const id of plan.tray.ids) { const n = countPlacements(lo, hi, id); assert(n >= 2, 'each piece has two placements'); total += n; }
  assert(total >= 24, 'at least 24 placements across the tray');
  assert(plan.tray.sequence && replay(plan.cells, plan.tray.ids, plan.tray.sequence), 'verified full three-piece sequence');
  return set;
}

for (const def of OPENING_VARIANTS.slice(0, 3)) {
  test(`openings: 100 accepted seeded boards for ${def.name}`, () => {
    let accepted = 0; let pairRejected = 0; let layoutFailed = 0; let geoAccepted = 0; let geoRejected = 0; let seed = 0;
    const reasons = {};
    const layouts = new Set();
    while (accepted < 100 && seed < 1000) {
      seed++;
      const plan = planOpening({ mode: 'always', variant: def.id }, createRng(seed * 7919));
      geoAccepted += plan.stats.accepted; geoRejected += plan.stats.rejected;
      eq(plan.stats.trayDraws, 1, 'tray drawn exactly once');
      assert(plan.stats.accepted + plan.stats.rejected <= GEOMETRY_ATTEMPTS, 'bounded geometry retries');
      if (!plan.special) {
        if (plan.reason === 'layout-failed') layoutFailed++; else pairRejected++;
        reasons[plan.reason] = (reasons[plan.reason] || 0) + 1;
        eq(count(plan.cells), 0, 'fallback is an empty board');
        assert(plan.tray.sequence && replay(plan.cells, plan.tray.ids, plan.tray.sequence), 'fallback tray sequence recomputed for empty board');
        continue;
      }
      accepted++;
      const set = checkCommon(plan, def);
      layouts.add([...set].sort((a, b) => a - b).join(','));
      if (def.id === 'scattered') {
        const comps = components(set);
        assert(comps.length >= 3 && comps.length <= 5, 'three to five groups');
        assert(comps.every((g) => g.length >= 2 && g.length <= 5), 'groups of two to five');
        // Spread: groups' centres are not all in one quadrant.
        const quads = new Set(comps.map((g) => { const r = g.reduce((a, i) => a + Math.floor(i / 8), 0) / g.length; const c = g.reduce((a, i) => a + (i % 8), 0) / g.length; return (r < 4 ? 0 : 2) + (c < 4 ? 0 : 1); }));
        assert(quads.size >= 2, 'groups spread across the board');
      }
      if (def.id === 'almost') {
        const targets = plan.meta.targets;
        assert(targets.length === 1 || targets.length === 2, 'one or two target lines');
        for (const t of targets) {
          const line = lineCells(t);
          const filled = line.map((i) => set.has(i));
          eq(filled.filter(Boolean).length, 5, 'five of eight filled');
          const gapStart = filled.indexOf(false);
          eq(filled.slice(gapStart, gapStart + 3), [false, false, false], 'gap of three consecutive cells');
        }
        // Verified early-clear sequence actually clears a target line.
        let cur = Uint8Array.from(plan.cells); let cleared = false;
        for (const step of plan.clearSequence) {
          const res = placeOnCells(cur, plan.tray.ids[step.piece], step.r, step.c, 1);
          assert(res, 'clear sequence legal');
          if ([...res.rows, ...res.cols.map((c) => c + 8)].some((k) => targets.includes(k))) cleared = true;
          cur = res.cells;
        }
        assert(cleared, 'early clear of a target line');
        eq(plan.clearSequence.length, 3, 'and still places all three pieces');
      }
      if (def.id === 'corners') {
        for (let r = 2; r <= 5; r++) for (let c = 2; c <= 5; c++) assert(!set.has(r * 8 + c), 'central 4x4 empty');
        const comps = components(set);
        assert(comps.length === 3 || comps.length === 4, 'three or four clusters');
        const corners = new Set(comps.map((g) => { const i = g[0]; return (Math.floor(i / 8) < 4 ? 0 : 2) + (i % 8 < 4 ? 0 : 1); }));
        eq(corners.size, comps.length, 'each cluster near a different corner');
      }
    }
    eq(accepted, 100, `${def.name} reached 100 accepted`);
    assert(layouts.size >= 95, 'layouts vary');
    report(`${def.name}: 100 accepted special openings from ${seed} candidates; ${pairRejected} board/tray pairs rejected -> empty board ${JSON.stringify(reasons)}; geometry candidates accepted ${geoAccepted}, rejected ${geoRejected}`);
  });
}

test('openings: Off mode preserves ordinary empty-board generation', () => {
  for (let s = 1; s <= 50; s++) {
    const plan = planOpening({ mode: 'off', variant: 'corners' }, createRng(s));
    const plain = generateTray(0, 0, [], createRng(s));
    eq(count(plan.cells), 0);
    eq(plan.tray.ids, plain.ids, 'same tray as normal generator');
    eq(plan.tray.colors, plain.colors);
    assert(!plan.special);
  }
});

test('openings: Random mode gives roughly 25% special openings', () => {
  let special = 0; let requested = 0;
  for (let s = 1; s <= 2000; s++) {
    const plan = planOpening({ mode: 'random', variant: 'any' }, createRng(s));
    if (plan.reason !== 'random-empty') requested++;
    if (plan.special) special++;
  }
  report(`Random mode: ${requested}/2000 games requested a special opening, ${special} accepted`);
  assert(requested > 420 && requested < 580, 'about one in four');
});

test('openings: failed validation keeps the same tray (no reroll of helpful shapes)', () => {
  let checked = 0;
  for (const def of OPENING_VARIANTS.slice(0, 3)) {
    for (let s = 1; s <= 600 && checked < 12; s++) {
      const plan = planOpening({ mode: 'always', variant: def.id }, createRng(s));
      if (!plan.reason.startsWith('validation:')) continue;
      // Replay the exact draw: same layout attempts, then one tray.
      const rng = createRng(s);
      const layout = generateLayout(OPENING_BY_ID[def.id], rng);
      const { lo, hi } = occFromIndices(layout.cells);
      const tray = generateTray(lo, hi, [], rng);
      eq(plan.tray.ids, tray.ids, 'tray retained after falling back to empty');
      eq(plan.tray.colors, tray.colors);
      eq(count(plan.cells), 0);
      assert(replay(plan.cells, plan.tray.ids, plan.tray.sequence), 'sequence recomputed on empty board');
      checked++;
    }
  }
  report(`validation fallbacks examined: ${checked}`);
  assert(checked >= 3, 'found fallback cases to check');
});

test('openings: layout failure before a tray exists gives an ordinary empty start', () => {
  const def = { id: 'test-never', name: 'Never', cellRange: [1, 2], generate: () => null };
  registerOpeningVariant(def);
  try {
    const plan = planOpening({ mode: 'always', variant: 'test-never' }, createRng(1));
    eq(plan.reason, 'layout-failed'); eq(count(plan.cells), 0); eq(plan.stats.rejected, GEOMETRY_ATTEMPTS);
    assert(findSequence(0, 0, plan.tray.ids));
  } finally {
    OPENING_VARIANTS.splice(OPENING_VARIANTS.indexOf(def), 1);
    delete OPENING_BY_ID['test-never'];
  }
});

test('openings: validateOpening rejects trapping boards', () => {
  const set = new Set();
  for (let i = 0; i < 64; i++) if (i % 3) set.add(i);
  const res = validateOpening(set, ['square3', 'rect-h', 'line5-h'], OPENING_BY_ID.scattered, {});
  assert(!res.ok);
});

test('openings: seed reproducibility and fresh geometry each game', () => {
  const a = planOpening({ mode: 'always', variant: 'any' }, createRng(4242));
  const b = planOpening({ mode: 'always', variant: 'any' }, createRng(4242));
  eq([...a.cells], [...b.cells]); eq(a.tray.ids, b.tray.ids);
  const seen = new Set();
  for (let s = 0; s < 30; s++) {
    const p = planOpening({ mode: 'always', variant: 'scattered' }, createRng(50000 + s));
    seen.add([...p.cells].map((v) => (v ? 1 : 0)).join(''));
  }
  assert(seen.size >= 29, 'restarts produce fresh layouts');
});
