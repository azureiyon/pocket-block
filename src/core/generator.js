// Fair tray generation. Every offered tray has at least one verified
// sequence placing all three pieces on the actual current board.

import { SHAPE_IDS } from './shapes.js';
import { shuffle } from './rng.js';
import { findSequence, placementsOf, fits, applyPlacement } from './rules.js';

export const RECENT_LIMIT = 9;
export const DISTINCT_ATTEMPTS = 12;
export const TOTAL_ATTEMPTS = 28;
export const PALETTE_SIZE = 7;

/** Shuffle, then move recently offered ids toward the end (stable). */
export function orderedCollection(recent, rng) {
  const order = shuffle(SHAPE_IDS, rng);
  const recentSet = new Set(recent);
  const fresh = order.filter((id) => !recentSet.has(id));
  // Older recent entries come before newer ones, so the newest sit last.
  const stale = recent.filter((id, i) => recent.lastIndexOf(id) === i && order.includes(id));
  return [...fresh, ...stale];
}

export function freshPrefixLength(recent) {
  return Math.max(10, SHAPE_IDS.length - recent.length);
}

function drawDistinct(prefix, rng) {
  const pool = prefix.slice();
  const out = [];
  for (let k = 0; k < 3; k++) out.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  return out;
}

function drawWithReplacement(rng) {
  return [0, 1, 2].map(() => SHAPE_IDS[Math.floor(rng() * SHAPE_IDS.length)]);
}

/**
 * Complete constructive fallback: depth-first over every shape and legal
 * placement (with clears) for a three-piece sequence. Shapes are tried in a
 * shuffled order so the fallback still varies. Returns {ids, sequence} or null.
 */
export function constructiveFallback(lo, hi, rng) {
  const order = shuffle(SHAPE_IDS, rng);
  const seq = [];
  const ids = [];
  const seen = new Set();
  function dfs(clo, chi, depth) {
    if (depth === 3) return true;
    const key = clo + ',' + chi + ',' + depth;
    if (seen.has(key)) return false;
    seen.add(key);
    // Exhaustive over every shape and placement (memoised by state).
    for (const id of order) {
      for (const p of placementsOf(id)) {
        if (!fits(clo, chi, p)) continue;
        const res = applyPlacement(clo, chi, p);
        ids.push(id); seq.push({ piece: depth, r: p.r, c: p.c });
        if (dfs(res.lo, res.hi, depth + 1)) return true;
        ids.pop(); seq.pop();
      }
    }
    return false;
  }
  return dfs(lo >>> 0, hi >>> 0, 0) ? { ids: ids.slice(), sequence: seq.slice() } : null;
}

/**
 * Generate a tray for occupancy {lo, hi}.
 * Returns { ids, colors, sequence, attempts, fallback, recent } where recent
 * is the updated last-nine list. `sequence` is a verified full placement.
 */
export function generateTray(lo, hi, recentIn, rng) {
  const recent = (recentIn || []).slice(-RECENT_LIMIT);
  const ordered = orderedCollection(recent, rng);
  const prefix = ordered.slice(0, freshPrefixLength(recent));
  let ids = null; let sequence = null; let attempts = 0; let fallback = false;

  for (attempts = 1; attempts <= TOTAL_ATTEMPTS; attempts++) {
    const proposal = attempts <= DISTINCT_ATTEMPTS ? drawDistinct(prefix, rng) : drawWithReplacement(rng);
    const seq = findSequence(lo, hi, proposal);
    if (seq) { ids = proposal; sequence = seq; break; }
  }
  if (!ids) {
    attempts = TOTAL_ATTEMPTS;
    const fb = constructiveFallback(lo, hi, rng);
    if (fb) { ids = fb.ids; sequence = fb.sequence; fallback = true; } else {
      // No three-piece sequence exists anywhere: offer an ordinary draw; the
      // game-over check then decides honestly.
      ids = drawWithReplacement(rng); sequence = null; fallback = true;
    }
  }
  const colors = ids.map(() => 1 + Math.floor(rng() * PALETTE_SIZE));
  const nextRecent = [...recent, ...ids].slice(-RECENT_LIMIT);
  return { ids, colors, sequence, attempts, fallback, recent: nextRecent };
}
