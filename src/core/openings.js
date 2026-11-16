// Randomized starting boards: a registry of opening variants plus the
// shared validation pipeline. Starting blocks are ordinary removable cells.

import { SIZE, CELLS, occFromIndices, fullLines, countPlacements, anyShapePlaceable, findSequence, LINE_MASKS } from './rules.js';
import { generateTray, PALETTE_SIZE } from './generator.js';
import { shuffle } from './rng.js';

export const GEOMETRY_ATTEMPTS = 12;
export const CLEAR_SEARCH_NODES = 40000;
export const RANDOM_SPECIAL_CHANCE = 0.25;

const rc = (i) => [Math.floor(i / SIZE), i % SIZE];
const idx = (r, c) => r * SIZE + c;
const inside = (r, c) => r >= 0 && c >= 0 && r < SIZE && c < SIZE;
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const N8 = [...N4, [1, 1], [1, -1], [-1, 1], [-1, -1]];

function neighbors(i, dirs = N4) {
  const [r, c] = rc(i);
  const out = [];
  for (const [dr, dc] of dirs) if (inside(r + dr, c + dc)) out.push(idx(r + dr, c + dc));
  return out;
}

// ---------- geometry helpers (exported for tests) ----------

export function components(set) {
  const seen = new Set(); const groups = [];
  for (const start of set) {
    if (seen.has(start)) continue;
    const g = []; const stack = [start]; seen.add(start);
    while (stack.length) {
      const i = stack.pop(); g.push(i);
      for (const n of neighbors(i)) if (set.has(n) && !seen.has(n)) { seen.add(n); stack.push(n); }
    }
    groups.push(g);
  }
  return groups;
}

/** Empty cells with no empty orthogonal neighbour. */
export function isolatedGaps(set) {
  const out = [];
  for (let i = 0; i < CELLS; i++) {
    if (set.has(i)) continue;
    if (neighbors(i).every((n) => set.has(n))) out.push(i);
  }
  return out;
}

export function emptyWindows(set, k) {
  let n = 0;
  for (let r = 0; r + k <= SIZE; r++) {
    for (let c = 0; c + k <= SIZE; c++) {
      let ok = true;
      for (let dr = 0; dr < k && ok; dr++) for (let dc = 0; dc < k; dc++) if (set.has(idx(r + dr, c + dc))) { ok = false; break; }
      if (ok) n++;
    }
  }
  return n;
}

export function hasFullLine(set) {
  const { lo, hi } = occFromIndices(set);
  return fullLines(lo, hi).length > 0;
}

export function lineCells(line) {
  const out = [];
  for (let k = 0; k < SIZE; k++) out.push(line < 8 ? idx(line, k) : idx(k, line - 8));
  return out;
}

export function commonGeometryProblems(set, def) {
  const problems = [];
  const [min, max] = def.cellRange;
  if (set.size < min || set.size > max) problems.push('cell-count');
  if (hasFullLine(set)) problems.push('full-line');
  if (isolatedGaps(set).length) problems.push('isolated-gap');
  if (emptyWindows(set, 3) < 2) problems.push('3x3-windows');
  if (emptyWindows(set, 2) < 6) problems.push('2x2-windows');
  return problems;
}

// Grow a compact group from `seed` inside `allowed(i)`, avoiding `blocked`.
function growGroup(rng, seed, size, allowed, blocked, compact = 0.6) {
  const g = new Set([seed]);
  let guard = 0;
  while (g.size < size && guard++ < 60) {
    const frontier = [];
    for (const i of g) for (const n of neighbors(i)) if (!g.has(n) && allowed(n) && !blocked.has(n)) frontier.push(n);
    if (!frontier.length) return null;
    let pick;
    if (rng() < compact) {
      // Prefer cells touching several group cells (compact shapes).
      const score = (n) => neighbors(n).filter((m) => g.has(m)).length;
      const best = Math.max(...frontier.map(score));
      const tops = frontier.filter((n) => score(n) === best);
      pick = tops[Math.floor(rng() * tops.length)];
    } else pick = frontier[Math.floor(rng() * frontier.length)];
    g.add(pick);
  }
  return g.size === size ? g : null;
}

function buffer(set) {
  const b = new Set(set);
  for (const i of set) for (const n of neighbors(i, N8)) b.add(n);
  return b;
}

// ---------- variants ----------

const scattered = {
  id: 'scattered',
  name: 'Scattered Start',
  description: 'A few small block groups spread around the board.',
  cellRange: [10, 18],
  generate(rng) {
    const k = rng.range(3, 5);
    const sizes = Array.from({ length: k }, () => rng.range(2, 5));
    let total = sizes.reduce((a, b) => a + b, 0);
    while (total < 10) { const j = rng.int(k); if (sizes[j] < 5) { sizes[j]++; total++; } }
    while (total > 18) { const j = rng.int(k); if (sizes[j] > 2) { sizes[j]--; total--; } }
    // Spread seeds across a 3x3 sector grid.
    const bands = [[0, 2], [3, 4], [5, 7]];
    const sectors = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8], rng).slice(0, k);
    const cells = new Set(); const groups = [];
    for (let g = 0; g < k; g++) {
      const [r0, r1] = bands[Math.floor(sectors[g] / 3)];
      const [c0, c1] = bands[sectors[g] % 3];
      const blocked = buffer(cells);
      let grown = null;
      for (let t = 0; t < 8 && !grown; t++) {
        const seed = idx(rng.range(r0, r1), rng.range(c0, c1));
        if (blocked.has(seed)) continue;
        grown = growGroup(rng, seed, sizes[g], () => true, blocked, 0.45);
      }
      if (!grown) return null;
      for (const i of grown) cells.add(i);
      groups.push([...grown]);
    }
    return { cells, meta: { groups: groups.length } };
  },
  check(set) {
    const comps = components(set);
    if (comps.length < 3 || comps.length > 5) return ['group-count'];
    if (comps.some((g) => g.length < 2 || g.length > 5)) return ['group-size'];
    return [];
  },
};

const almostThere = {
  id: 'almost',
  name: 'Almost There',
  description: 'One or two nearly finished lines waiting to be cleared.',
  cellRange: [7, 14],
  generate(rng) {
    const count = rng.chance(0.55) ? 1 : 2;
    const first = rng.int(16);
    const targets = [first];
    if (count === 2) {
      const perpendicular = rng.chance(0.5);
      const pool = [];
      for (let k = 0; k < 16; k++) {
        if (k === first) continue;
        const sameAxis = (k < 8) === (first < 8);
        if (perpendicular ? !sameAxis : (sameAxis && Math.abs(k - first) >= 2)) pool.push(k);
      }
      targets.push(rng.pick(pool));
    }
    const cells = new Set(); const gaps = new Set();
    for (const t of targets) {
      const line = lineCells(t);
      const g = rng.range(0, SIZE - 3);
      line.forEach((cell, k) => { if (k >= g && k < g + 3) gaps.add(cell); });
    }
    for (const t of targets) for (const cell of lineCells(t)) if (!gaps.has(cell)) cells.add(cell);
    // Each target must keep exactly a three-cell gap.
    for (const t of targets) if (lineCells(t).filter((c) => cells.has(c)).length !== 5) return null;
    // Small randomized surrounding cluster attached to a target line.
    const clusterSize = count === 1 ? rng.range(2, 5) : rng.range(0, 3);
    if (clusterSize > 0) {
      const lineSet = new Set(targets.flatMap(lineCells));
      const anchors = [...cells].flatMap((i) => neighbors(i)).filter((n) => !cells.has(n) && !gaps.has(n) && !lineSet.has(n));
      if (!anchors.length) return null;
      const seed = rng.pick(anchors);
      const grown = growGroup(rng, seed, clusterSize, (n) => !gaps.has(n) && !lineSet.has(n), cells, 0.5);
      if (!grown) return null;
      for (const i of grown) cells.add(i);
    }
    return { cells, meta: { targets } };
  },
  check(set, meta) {
    for (const t of meta.targets) if (lineCells(t).filter((c) => set.has(c)).length !== 5) return ['target-line'];
    return [];
  },
  // Extra opening requirement: an actual sequence of the first tray clears a target.
  needsClear(meta) { return meta.targets; },
};

const CENTER = new Set();
for (let r = 2; r <= 5; r++) for (let c = 2; c <= 5; c++) CENTER.add(idx(r, c));

const cornerTrouble = {
  id: 'corners',
  name: 'Corner Trouble',
  description: 'Compact clusters crowding several corners.',
  cellRange: [9, 16],
  generate(rng) {
    const n = rng.chance(0.5) ? 3 : 4;
    const corners = shuffle([[0, 0], [0, 1], [1, 0], [1, 1]], rng).slice(0, n);
    const sizes = corners.map(() => (n === 3 ? rng.range(3, 5) : rng.range(2, 4)));
    let total = sizes.reduce((a, b) => a + b, 0);
    while (total < 9) { const j = rng.int(n); if (sizes[j] < 5) { sizes[j]++; total++; } }
    const cells = new Set();
    for (let k = 0; k < n; k++) {
      const [vr, vc] = corners[k];
      const zone = (i) => {
        const [r, c] = rc(i);
        const inR = vr ? r >= 4 : r <= 3; const inC = vc ? c >= 4 : c <= 3;
        return inR && inC && !CENTER.has(i);
      };
      const near = (v) => (v ? SIZE - 1 - rng.range(0, 2) : rng.range(0, 2));
      let grown = null;
      const blocked = buffer(cells); // keep corner clusters separate
      for (let t = 0; t < 6 && !grown; t++) {
        const seed = idx(near(vr), near(vc));
        if (!zone(seed) || blocked.has(seed)) continue;
        grown = growGroup(rng, seed, sizes[k], zone, blocked, 0.75);
      }
      if (!grown) return null;
      for (const i of grown) cells.add(i);
    }
    return { cells, meta: { corners: n } };
  },
  check(set, meta) {
    for (const i of CENTER) if (set.has(i)) return ['center'];
    if (components(set).length !== meta.corners) return ['clusters'];
    return [];
  },
};

export const OPENING_VARIANTS = [scattered, almostThere, cornerTrouble];
export const OPENING_BY_ID = Object.fromEntries(OPENING_VARIANTS.map((v) => [v.id, v]));
export const OPENING_MODES = ['off', 'random', 'always'];
export const DEFAULT_OPENING_PREFS = { mode: 'random', variant: 'any' };

export function registerOpeningVariant(def) {
  if (!def || !def.id || typeof def.generate !== 'function' || !def.cellRange) throw new Error('Invalid opening variant');
  if (OPENING_BY_ID[def.id]) throw new Error('Duplicate opening variant ' + def.id);
  OPENING_VARIANTS.push(def);
  OPENING_BY_ID[def.id] = def;
}

/** Generate one layout with bounded geometry retries. */
export function generateLayout(def, rng, stats = { accepted: 0, rejected: 0 }) {
  for (let a = 0; a < GEOMETRY_ATTEMPTS; a++) {
    const cand = def.generate(rng);
    if (!cand) { stats.rejected++; continue; }
    const problems = [...commonGeometryProblems(cand.cells, def), ...(def.check ? def.check(cand.cells, cand.meta) : [])];
    if (problems.length) { stats.rejected++; continue; }
    stats.accepted++;
    return cand;
  }
  return null;
}

/** Validate a board/tray pair for an accepted special opening. */
export function validateOpening(set, ids, def, meta) {
  const { lo, hi } = occFromIndices(set);
  if (fullLines(lo, hi).length) return { ok: false, reason: 'full-line' };
  if (isolatedGaps(set).length) return { ok: false, reason: 'isolated-gap' };
  if (emptyWindows(set, 3) < 2 || emptyWindows(set, 2) < 6) return { ok: false, reason: 'windows' };
  if (!anyShapePlaceable(lo, hi, ids)) return { ok: false, reason: 'game-over' };
  let total = 0;
  for (const id of ids) {
    const n = countPlacements(lo, hi, id);
    if (n < 2) return { ok: false, reason: 'piece-placements' };
    total += n;
  }
  if (total < 24) return { ok: false, reason: 'tray-placements' };
  const sequence = findSequence(lo, hi, ids);
  if (!sequence) return { ok: false, reason: 'no-sequence' };
  let clearSequence = null;
  if (def.needsClear) {
    clearSequence = findSequence(lo, hi, ids, { needClear: def.needsClear(meta), maxNodes: CLEAR_SEARCH_NODES });
    if (!clearSequence) return { ok: false, reason: 'no-early-clear' };
  }
  return { ok: true, sequence, clearSequence };
}

/**
 * Plan a new game's board and first tray.
 * prefs: {mode: 'off'|'random'|'always', variant: 'any'|<id>}
 * Returns { cells: Uint8Array, tray, variant, special, reason, stats }.
 */
export function planOpening(prefs, rng, recent = []) {
  const mode = OPENING_MODES.includes(prefs && prefs.mode) ? prefs.mode : DEFAULT_OPENING_PREFS.mode;
  const stats = { accepted: 0, rejected: 0, trayDraws: 0 };
  const empty = () => new Uint8Array(CELLS);
  const plain = (reason, variant = null) => {
    const tray = generateTray(0, 0, recent, rng); stats.trayDraws++;
    return { cells: empty(), tray, variant, special: false, reason, stats };
  };
  if (mode === 'off') return plain('off');
  if (mode === 'random' && rng() >= RANDOM_SPECIAL_CHANCE) return plain('random-empty');

  const wanted = prefs.variant && OPENING_BY_ID[prefs.variant] ? OPENING_BY_ID[prefs.variant] : rng.pick(OPENING_VARIANTS);
  const layout = generateLayout(wanted, rng, stats);
  if (!layout) return plain('layout-failed', wanted.id);

  const { lo, hi } = occFromIndices(layout.cells);
  const tray = generateTray(lo, hi, recent, rng); stats.trayDraws++;
  const check = validateOpening(layout.cells, tray.ids, wanted, layout.meta);
  if (!check.ok) {
    // Keep the same tray; fall back to an empty board and recompute its sequence.
    const sequence = findSequence(0, 0, tray.ids);
    return { cells: empty(), tray: { ...tray, sequence, fallback: tray.fallback }, variant: wanted.id, special: false, reason: 'validation:' + check.reason, stats };
  }
  const cells = empty();
  for (const i of layout.cells) cells[i] = 1 + Math.floor(rng() * PALETTE_SIZE);
  return {
    cells, tray: { ...tray, sequence: check.sequence }, variant: wanted.id, special: true,
    reason: 'ok', meta: layout.meta, clearSequence: check.clearSequence, stats,
  };
}

export { LINE_MASKS };
