// The single rules implementation shared by real moves, the generator's
// validation search, opening validation and tests.
//
// Occupancy is a 64-bit bitboard split into two unsigned 32-bit numbers:
// lo = rows 0..3, hi = rows 4..7, bit index = row * 8 + col (minus 32 for hi).

import { ALL_SHAPES, getShape } from './shapes.js';

export const SIZE = 8;
export const CELLS = SIZE * SIZE;

export const ROW_MASKS = [];
export const COL_MASKS = [];
for (let r = 0; r < SIZE; r++) {
  ROW_MASKS.push(r < 4 ? { lo: (0xff << (r * 8)) >>> 0, hi: 0 } : { lo: 0, hi: (0xff << ((r - 4) * 8)) >>> 0 });
}
for (let c = 0; c < SIZE; c++) {
  const m = (0x01010101 << c) >>> 0;
  COL_MASKS.push({ lo: m, hi: m });
}
// Line index 0..7 = rows, 8..15 = columns.
export const LINE_MASKS = [...ROW_MASKS, ...COL_MASKS];

export function bitOf(i) {
  return i < 32 ? { lo: (1 << i) >>> 0, hi: 0 } : { lo: 0, hi: (1 << (i - 32)) >>> 0 };
}

export function isSet(lo, hi, i) {
  return i < 32 ? ((lo >>> i) & 1) === 1 : ((hi >>> (i - 32)) & 1) === 1;
}

export function popcount32(x) {
  x = x - ((x >>> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  return (Math.imul((x + (x >>> 4)) & 0x0f0f0f0f, 0x01010101) >>> 24);
}
export function popcount(lo, hi) { return popcount32(lo >>> 0) + popcount32(hi >>> 0); }

// Precomputed legal-in-bounds placements for each shape.
const PLACEMENTS = {};
for (const s of ALL_SHAPES) {
  const list = [];
  for (let r = 0; r + s.h <= SIZE; r++) {
    for (let c = 0; c + s.w <= SIZE; c++) {
      let lo = 0; let hi = 0;
      const idx = [];
      for (const [dr, dc] of s.cells) {
        const i = (r + dr) * SIZE + (c + dc);
        idx.push(i);
        if (i < 32) lo = (lo | (1 << i)) >>> 0; else hi = (hi | (1 << (i - 32))) >>> 0;
      }
      list.push({ r, c, lo, hi, idx });
    }
  }
  PLACEMENTS[s.id] = list;
}
export function placementsOf(shapeId) { return PLACEMENTS[shapeId]; }

export function occFromCells(cells) {
  let lo = 0; let hi = 0;
  for (let i = 0; i < CELLS; i++) {
    if (cells[i]) { if (i < 32) lo = (lo | (1 << i)) >>> 0; else hi = (hi | (1 << (i - 32))) >>> 0; }
  }
  return { lo, hi };
}

export function occFromIndices(indices) {
  let lo = 0; let hi = 0;
  for (const i of indices) { if (i < 32) lo = (lo | (1 << i)) >>> 0; else hi = (hi | (1 << (i - 32))) >>> 0; }
  return { lo, hi };
}

export function inBounds(shapeId, r, c) {
  const s = getShape(shapeId);
  return r >= 0 && c >= 0 && r + s.h <= SIZE && c + s.w <= SIZE;
}

export function placementAt(shapeId, r, c) {
  if (!inBounds(shapeId, r, c)) return null;
  const s = getShape(shapeId);
  return PLACEMENTS[shapeId][r * (SIZE - s.w + 1) + c];
}

export function fits(lo, hi, p) {
  return (lo & p.lo) === 0 && (hi & p.hi) === 0;
}

/** Lines (0..15) that are completely filled. */
export function fullLines(lo, hi) {
  const out = [];
  for (let k = 0; k < 16; k++) {
    const m = LINE_MASKS[k];
    if (((lo & m.lo) >>> 0) === m.lo && ((hi & m.hi) >>> 0) === m.hi) out.push(k);
  }
  return out;
}

/** Place p and simultaneously clear all completed rows and columns. */
export function applyPlacement(lo, hi, p) {
  let nlo = (lo | p.lo) >>> 0;
  let nhi = (hi | p.hi) >>> 0;
  const lines = fullLines(nlo, nhi);
  if (lines.length) {
    let clo = 0; let chi = 0;
    for (const k of lines) { clo = (clo | LINE_MASKS[k].lo) >>> 0; chi = (chi | LINE_MASKS[k].hi) >>> 0; }
    nlo = (nlo & ~clo) >>> 0;
    nhi = (nhi & ~chi) >>> 0;
  }
  return { lo: nlo, hi: nhi, lines };
}

export function legalPlacements(lo, hi, shapeId) {
  return PLACEMENTS[shapeId].filter((p) => fits(lo, hi, p));
}
export function countPlacements(lo, hi, shapeId) {
  let n = 0;
  for (const p of PLACEMENTS[shapeId]) if (fits(lo, hi, p)) n++;
  return n;
}
export function anyFits(lo, hi, shapeId) {
  for (const p of PLACEMENTS[shapeId]) if (fits(lo, hi, p)) return true;
  return false;
}

/**
 * Search piece orders and legal placements (with real clearing between
 * moves) for a sequence placing every shape. Returns [{piece, r, c}] or null.
 * options.needClear: array of line indices; at least one must be cleared
 * during the sequence. options.maxNodes bounds the search (returns null when
 * exhausted, with result.exhausted = true on the stats object).
 */
export function findSequence(lo, hi, shapeIds, options = {}) {
  const n = shapeIds.length;
  const needClear = options.needClear || null;
  const maxNodes = options.maxNodes || Infinity;
  const stats = options.stats || { nodes: 0, exhausted: false };
  const seen = new Set();
  const path = [];
  const fullMask = (1 << n) - 1;

  function dfs(clo, chi, used, clearedTarget) {
    if (used === fullMask) return !needClear || clearedTarget;
    if (++stats.nodes > maxNodes) { stats.exhausted = true; return false; }
    const key = clo + ',' + chi + ',' + used + ',' + (clearedTarget ? 1 : 0);
    if (seen.has(key)) return false;
    seen.add(key);
    const tried = new Set();
    for (let i = 0; i < n; i++) {
      if (used & (1 << i)) continue;
      const id = shapeIds[i];
      if (tried.has(id)) continue;
      tried.add(id);
      const remainingAfter = used | (1 << i);
      const last = remainingAfter === fullMask;
      for (const p of PLACEMENTS[id]) {
        if ((clo & p.lo) !== 0 || (chi & p.hi) !== 0) continue;
        const res = applyPlacement(clo, chi, p);
        let ct = clearedTarget;
        if (needClear && !ct) for (const k of res.lines) if (needClear.includes(k)) { ct = true; break; }
        path.push({ piece: i, r: p.r, c: p.c });
        if (last) {
          if (!needClear || ct) return true;
        } else if (dfs(res.lo, res.hi, remainingAfter, ct)) return true;
        path.pop();
        if (stats.exhausted) return false;
      }
    }
    return false;
  }
  if (n === 0) return [];
  return dfs(lo >>> 0, hi >>> 0, 0, false) ? path.slice() : null;
}

/** True if at least one of the given shapes can be placed. */
export function anyShapePlaceable(lo, hi, shapeIds) {
  return shapeIds.some((id) => anyFits(lo, hi, id));
}

export function scoreFor(blocks, lines) {
  return 5 * blocks + 80 * lines * lines;
}

// ---- Cell-array operations used by the real game ----

export function canPlaceOnCells(cells, shapeId, r, c) {
  const p = placementAt(shapeId, r, c);
  if (!p) return false;
  const { lo, hi } = occFromCells(cells);
  return fits(lo, hi, p);
}

/**
 * Apply a real move on a colour array. Returns null when illegal.
 * Result describes placed cells, cleared rows/cols (simultaneous, an
 * intersection counted once) and the next colour array.
 */
export function placeOnCells(cells, shapeId, r, c, color) {
  const p = placementAt(shapeId, r, c);
  if (!p) return null;
  const occ = occFromCells(cells);
  if (!fits(occ.lo, occ.hi, p)) return null;
  const next = Uint8Array.from(cells);
  for (const i of p.idx) next[i] = color;
  const after = applyPlacement(occ.lo, occ.hi, p);
  const rows = after.lines.filter((k) => k < 8);
  const cols = after.lines.filter((k) => k >= 8).map((k) => k - 8);
  const cleared = new Set();
  for (const row of rows) for (let cc = 0; cc < SIZE; cc++) cleared.add(row * SIZE + cc);
  for (const col of cols) for (let rr = 0; rr < SIZE; rr++) cleared.add(rr * SIZE + col);
  const clearedCells = [...cleared].sort((a, b) => a - b).map((i) => ({ i, color: next[i] }));
  for (const i of cleared) next[i] = 0;
  const lines = rows.length + cols.length;
  return {
    cells: next,
    placed: p.idx.slice(),
    rows, cols, lines,
    clearedCells,
    points: scoreFor(p.idx.length, lines),
    empty: next.every((v) => v === 0),
  };
}
