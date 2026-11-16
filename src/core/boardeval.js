// Fast bitboard board-shape features, used by the board-aware tray
// generator. Boards are {lo, hi} 32-bit halves exactly as in rules.js.

import { popcount, LINE_MASKS, placementsOf, fits } from './rules.js';

const FULL = 0xffffffff;
const NOT_COL0 = (~0x01010101) >>> 0;
const NOT_COL7 = (~0x80808080) >>> 0;

// Directional shifts. "south(x)" moves every cell one row down, so bit i of
// the result is set when cell i-8 (the cell above) was set.
export const south = (lo, hi, out) => { out.lo = (lo << 8) >>> 0; out.hi = ((hi << 8) | (lo >>> 24)) >>> 0; return out; };
export const north = (lo, hi, out) => { out.lo = ((lo >>> 8) | (hi << 24)) >>> 0; out.hi = hi >>> 8; return out; };
export const east = (lo, hi, out) => { out.lo = ((lo << 1) & NOT_COL0) >>> 0; out.hi = (((hi << 1) | (lo >>> 31)) & NOT_COL0) >>> 0; return out; };
export const west = (lo, hi, out) => { out.lo = (((lo >>> 1) | (hi << 31)) & NOT_COL7) >>> 0; out.hi = ((hi >>> 1) & NOT_COL7) >>> 0; return out; };

const tN = { lo: 0, hi: 0 }; const tS = { lo: 0, hi: 0 }; const tE = { lo: 0, hi: 0 }; const tW = { lo: 0, hi: 0 };

/**
 * Board features for an occupancy {lo, hi}.
 *  filled       occupied cells
 *  isolated     empty cells with no empty neighbour (only a single fits)
 *  oneWay       empty cells usable only by horizontal-only or vertical-only placements
 *  edges        empty-to-filled/wall contacts (roughness; lower is smoother)
 *  fit3         placements of a 3x3 square that fit (0..36)
 *  fit5         placements of 5-long lines that fit, both orientations (0..64)
 *  fit2         placements of a 2x2 square that fit (0..49)
 *  near         lines with 6 or 7 filled cells (setup potential)
 *  near7        lines with exactly 7 filled cells
 */
export function features(lo, hi) {
  lo >>>= 0; hi >>>= 0;
  const elo = (~lo) >>> 0; const ehi = (~hi) >>> 0;
  south(elo, ehi, tS); north(elo, ehi, tN); east(elo, ehi, tE); west(elo, ehi, tW);
  const hNbrLo = (tE.lo | tW.lo) >>> 0; const hNbrHi = (tE.hi | tW.hi) >>> 0;
  const vNbrLo = (tN.lo | tS.lo) >>> 0; const vNbrHi = (tN.hi | tS.hi) >>> 0;
  const hDeadLo = (elo & ~hNbrLo) >>> 0; const hDeadHi = (ehi & ~hNbrHi) >>> 0;
  const vDeadLo = (elo & ~vNbrLo) >>> 0; const vDeadHi = (ehi & ~vNbrHi) >>> 0;
  const isolated = popcount(hDeadLo & vDeadLo, hDeadHi & vDeadHi);
  const oneWay = popcount(hDeadLo, hDeadHi) + popcount(vDeadLo, vDeadHi) - 2 * isolated;
  const edges = popcount(elo & ~tN.lo, ehi & ~tN.hi) + popcount(elo & ~tS.lo, ehi & ~tS.hi)
    + popcount(elo & ~tE.lo, ehi & ~tE.hi) + popcount(elo & ~tW.lo, ehi & ~tW.hi);
  let fit3 = 0; for (const p of placementsOf('square3')) if (fits(lo, hi, p)) fit3++;
  let fit2 = 0; for (const p of placementsOf('square2')) if (fits(lo, hi, p)) fit2++;
  let fit5 = 0;
  for (const p of placementsOf('line5-h')) if (fits(lo, hi, p)) fit5++;
  for (const p of placementsOf('line5-v')) if (fits(lo, hi, p)) fit5++;
  let near = 0; let near7 = 0;
  for (let k = 0; k < 16; k++) {
    const m = LINE_MASKS[k];
    const n = popcount(lo & m.lo, hi & m.hi);
    if (n >= 6 && n < 8) { near++; if (n === 7) near7++; }
  }
  return { filled: popcount(lo, hi), isolated, oneWay, edges, fit3, fit2, fit5, near, near7 };
}

/**
 * Scalar "how healthy is this board" score: higher means more open,
 * less fragmented space. Calibrated so an empty board is about 0 and a
 * badly fragmented half-full board is strongly negative.
 */
export function quality(f) {
  return -0.9 * f.filled
    - 7 * f.isolated
    - 2.2 * f.oneWay
    - 0.45 * Math.max(0, f.edges - 32)
    + 2.5 * Math.min(f.fit3, 4)
    + 1.2 * Math.min(f.fit5, 6)
    + 0.35 * Math.min(f.fit2, 12)
    + 1.5 * f.near;
}

export function boardQuality(lo, hi) { return quality(features(lo, hi)); }

/** Cheap contact score of a placement: filled neighbours + walls touched. */
export function contact(lo, hi, p) {
  south(p.lo, p.hi, tS); north(p.lo, p.hi, tN); east(p.lo, p.hi, tE); west(p.lo, p.hi, tW);
  const nlo = ((tS.lo | tN.lo | tE.lo | tW.lo) & ~p.lo) >>> 0;
  const nhi = ((tS.hi | tN.hi | tE.hi | tW.hi) & ~p.hi) >>> 0;
  const touching = popcount(nlo & lo, nhi & hi);
  // Wall contacts: piece cells on the border.
  const border = popcount(p.lo & 0x818181ff, p.hi & 0xff818181);
  return touching + border * 0.8;
}

export { FULL };
