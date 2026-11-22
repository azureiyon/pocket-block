// "Flow" tray generator: a board-aware difficulty director.
//
// Spec (from a friend's request, followed closely):
//  1. Pool: the 27 classic orientations plus 2- and 3-tile diagonals, Z and J
//     tetrominoes and the 5-tile big L, 41 orientations in all (no rotation).
//  2. Analyzer: board density D, lines missing 1–4 cells (and which cells),
//     combo urgency U (critical when a streak is one miss from breaking),
//     and a progression tier T from the score (<2k, 2k–6k, 6k–12k, 12k+).
//  3. Weights: a rescue boost multiplies shapes that fit now AND complete a
//     row or column, when D > 0.6, U is critical, or lines are 1–3 cells
//     from full (half strength). The boost decays towards 1 as T rises,
//     while bulky/awkward shapes (3x3, 1x5, big L, 3-tile diagonals) gain
//     weight. Three identical pieces are never dealt except as a clutch or
//     punish wave.
//  4. Lookahead: every candidate wave is checked against all distinct
//     placement orders (up to 3! = 6), with real line clears after each
//     piece. Waves with no solvable order are re-sampled (falling back to
//     small fillers, then a complete constructive search). From T2, tight
//     "clutch" waves solvable in only 1–2 orders are preferred some of the
//     time, ideally ones that need a clear to fit. From T3, on a fragmented
//     board, a "punish" wave may be dealt on purpose: P1 and P2 fit, but
//     there is no way to place P3 as well, so a long run ends naturally.
//
// Unlike the other generators, a punish wave is deliberately unsolvable;
// its `sequence` is null and `kind` is 'punish'.

import { FLOW_SHAPE_IDS, getShape } from './shapes.js';
import { placementsOf, fits, applyPlacement, findSequence, popcount, LINE_MASKS, anyFits } from './rules.js';
import { features } from './boardeval.js';
import { constructiveFallback, RECENT_LIMIT } from './generator.js';

export const FLOW_PALETTE = 5;
export const TIER_SCORES = [0, 2000, 6000, 12000];
const MAX_ATTEMPTS = 40;
const WANT_VALID = 6;
const FILLER_ATTEMPTS = 20;
const PUNISH_ATTEMPTS = 30;

const SMALL = new Set(['single', 'pair', 'diag2']);
const BULKY = new Set(['square3', 'line5', 'bigl', 'rect23']);
const AWKWARD = new Set(['square3', 'line5', 'bigl', 'diag3']);
const FILLERS = FLOW_SHAPE_IDS.filter((id) => ['single', 'pair', 'diag2', 'line3', 'corner'].includes(getShape(id).family));
const PUNISHERS = FLOW_SHAPE_IDS.filter((id) => ['square3', 'line5', 'bigl'].includes(getShape(id).family));

function weightedPick(weights, rng) {
  let total = 0; for (const w of weights) total += w;
  let x = rng() * total;
  for (let i = 0; i < weights.length; i++) { x -= weights[i]; if (x < 0) return i; }
  return weights.length - 1;
}

// ---------- 2. analyzer ----------

/** Smooth progression: 0 at 0 points, 1 at 2k, 2 at 6k, 3 at 12k and beyond. */
export function progression(score = 0) {
  const s = Math.max(0, score);
  for (let k = 1; k < TIER_SCORES.length; k++) {
    if (s < TIER_SCORES[k]) return k - 1 + (s - TIER_SCORES[k - 1]) / (TIER_SCORES[k] - TIER_SCORES[k - 1]);
  }
  return 3;
}
export function tierOf(score = 0) { return Math.min(4, 1 + Math.floor(progression(score))); }

export function analyzeBoard(lo, hi, ctx = {}) {
  lo >>>= 0; hi >>>= 0;
  const filled = popcount(lo, hi);
  const lines = [];
  for (let k = 0; k < 16; k++) {
    const m = LINE_MASKS[k];
    const missing = 8 - popcount(lo & m.lo, hi & m.hi);
    if (missing >= 1 && missing <= 4) lines.push({ line: k, missing, need: { lo: (m.lo & ~lo) >>> 0, hi: (m.hi & ~hi) >>> 0 } });
  }
  const combo = ctx.combo || 0; const since = ctx.movesSinceClear || 0;
  const urgency = combo > 0 ? (since >= 2 ? 'critical' : since === 1 ? 'warning' : 'safe') : 'none';
  const f = features(lo, hi);
  return {
    density: filled / 64, filled, lines,
    near3: lines.filter((l) => l.missing <= 3).length,
    urgency, progress: progression(ctx.score), tier: tierOf(ctx.score),
    fragmentation: f.isolated + 0.5 * f.oneWay,
  };
}

// ---------- 3. weights ----------

/** Rescue multiplier: strong early, decaying towards 1 as the tier rises. */
export function rescueStrength(progress) {
  const decay = [1, 0.6, 0.3, 0.1];
  const i = Math.min(2, Math.floor(progress)); const t = Math.min(1, progress - i);
  const d = progress >= 3 ? decay[3] : decay[i] + (decay[i + 1] - decay[i]) * t;
  return 1 + 5 * d;
}

/** For each shape, the most lines one placement completes right now (0 if none, -1 if it does not fit). */
export function completions(lo, hi) {
  const out = {};
  for (const id of FLOW_SHAPE_IDS) {
    let best = -1;
    for (const p of placementsOf(id)) {
      if (!fits(lo, hi, p)) continue;
      const n = applyPlacement(lo, hi, p).lines.length;
      if (n > best) best = n;
    }
    out[id] = best;
  }
  return out;
}

export function flowWeights(lo, hi, a, recent = []) {
  const comp = completions(lo, hi);
  const B = rescueStrength(a.progress);
  const full = a.density > 0.6 || a.urgency === 'critical';
  const boost = full ? B : a.near3 > 0 ? 1 + (B - 1) * 0.5 : 1;
  const last = recent.slice(-3);
  const weights = FLOW_SHAPE_IDS.map((id) => {
    const s = getShape(id);
    let w = SMALL.has(s.family) ? (s.family === 'single' ? 0.7 : s.family === 'diag2' ? 0.6 : 0.9) : BULKY.has(s.family) ? 0.55 : s.family === 'diag3' ? 0.4 : 1;
    if (AWKWARD.has(s.family)) w *= 1 + 0.4 * a.progress; // difficulty ramps with score
    if (comp[id] > 0 && boost > 1) w *= boost * (1 + 0.3 * (comp[id] - 1)) * (s.size <= 3 ? 1.2 : 1);
    if (comp[id] < 0) w *= 0.35; // cannot fit at all right now
    if (last.includes(id)) w *= 0.6;
    return w;
  });
  return { weights, comp, boost };
}

// ---------- 4. lookahead ----------

function permutations(ids) {
  const idx = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
  const seen = new Set(); const out = [];
  for (const o of idx) { const key = o.map((i) => ids[i]).join(','); if (!seen.has(key)) { seen.add(key); out.push(o); } }
  return out;
}

/** Is the wave placeable in this exact order (clears applied after each piece)? Returns the path or null. */
export function solveOrder(lo, hi, ids, order, clears = true) {
  const memo = new Set(); const path = [];
  function go(clo, chi, k) {
    if (k === order.length) return true;
    const key = clo + ':' + chi + ':' + k;
    if (memo.has(key)) return false;
    memo.add(key);
    const piece = order[k];
    for (const p of placementsOf(ids[piece])) {
      if ((clo & p.lo) !== 0 || (chi & p.hi) !== 0) continue;
      let nlo; let nhi;
      if (clears) { const r = applyPlacement(clo, chi, p); nlo = r.lo; nhi = r.hi; } else { nlo = (clo | p.lo) >>> 0; nhi = (chi | p.hi) >>> 0; }
      path.push({ piece, r: p.r, c: p.c });
      if (go(nlo, nhi, k + 1)) return true;
      path.pop();
    }
    return false;
  }
  return go(lo >>> 0, hi >>> 0, 0) ? path.slice() : null;
}

/** Solvable distinct orders of a wave, plus one verified sequence. */
export function waveOrders(lo, hi, ids) {
  let count = 0; let sequence = null; let total = 0;
  for (const order of permutations(ids)) {
    total++;
    const path = solveOrder(lo, hi, ids, order);
    if (path) { count++; if (!sequence) sequence = path; }
  }
  return { count, total, sequence };
}

/** True when the wave only fits because lines clear along the way. */
export function needsClear(lo, hi, ids) {
  return !permutations(ids).some((o) => solveOrder(lo, hi, ids, o, false));
}

// ---------- director ----------

const CLUTCH_CHANCE = [0, 0, 0.3, 0.45, 0.55]; // by tier
const PUNISH_CHANCE = [0, 0, 0, 0.2, 0.4];

function finish(ids, sequence, recent, rng, extra) {
  return {
    ids, sequence, fallback: false, attempts: extra.attempts || 0,
    colors: ids.map(() => 1 + Math.floor(rng() * FLOW_PALETTE)),
    recent: [...recent, ...ids].slice(-RECENT_LIMIT),
    ...extra,
  };
}

export function generateFlowTray(loIn, hiIn, recentIn, rng, ctx = {}) {
  const lo = loIn >>> 0; const hi = hiIn >>> 0;
  const recent = (recentIn || []).slice(-RECENT_LIMIT);
  const a = analyzeBoard(lo, hi, ctx);
  const { weights, boost, comp } = flowWeights(lo, hi, a, recent);
  const info = { tier: a.tier, density: +a.density.toFixed(2), urgency: a.urgency, rescue: +boost.toFixed(2) };
  const draw = () => FLOW_SHAPE_IDS[weightedPick(weights, rng)];

  // Intentional fail-state: high score and a fragmented board.
  if (a.tier >= 3 && (a.fragmentation >= 4 || a.density > 0.55) && rng() < PUNISH_CHANCE[a.tier]) {
    for (let k = 0; k < PUNISH_ATTEMPTS; k++) {
      const p3 = PUNISHERS[Math.floor(rng() * PUNISHERS.length)];
      const pair = [draw(), draw()];
      if (!findSequence(lo, hi, pair)) continue;
      const ids = [...pair, p3];
      if (findSequence(lo, hi, ids, { maxNodes: 40000 })) continue;
      return finish(ids, null, recent, rng, { ...info, kind: 'punish', orders: 0, attempts: k + 1 });
    }
  }

  const clutch = rng() < CLUTCH_CHANCE[a.tier];
  const valid = [];
  let attempts = 0;
  for (; attempts < MAX_ATTEMPTS && valid.length < WANT_VALID; attempts++) {
    const ids = [draw(), draw(), draw()];
    if (ids[0] === ids[1] && ids[1] === ids[2] && !clutch) continue; // anti-duplicate
    const o = waveOrders(lo, hi, ids);
    if (o.count) valid.push({ ids, ...o });
  }
  if (valid.length) {
    let pick = null;
    if (clutch) {
      const tight = valid.filter((v) => v.count <= 2);
      if (tight.length) {
        const forced = tight.filter((v) => needsClear(lo, hi, v.ids));
        const pool = forced.length ? forced : tight;
        pick = { ...pool[Math.floor(rng() * pool.length)], kind: forced.length ? 'clutch-clear' : 'clutch' };
      }
    }
    if (!pick && boost > 1) {
      // Rescue: prefer waves with line-completing pieces that fit the most ways.
      const score = (v) => v.ids.filter((id) => comp[id] > 0).length + v.count / v.total;
      valid.sort((x, y) => score(y) - score(x));
      pick = { ...valid[0], kind: 'rescue' };
    }
    if (!pick) {
      // Flow: early on, lean towards waves with more ways in and more pieces
      // that can clear right now; the lean fades as the score climbs.
      const lean = Math.max(0, 1 - a.progress / 2.5);
      if (rng() < 0.35 + 0.55 * lean) {
        const score = (v) => v.count / v.total + lean * 0.6 * v.ids.filter((id) => comp[id] > 0).length;
        valid.sort((x, y) => score(y) - score(x));
        pick = { ...valid[0], kind: 'flow' };
      } else pick = { ...valid[Math.floor(rng() * valid.length)], kind: 'flow' };
    }
    return finish(pick.ids, pick.sequence, recent, rng, { ...info, kind: pick.kind, orders: pick.count, attempts });
  }

  // Board too tight: small fillers, then a complete constructive search.
  for (let k = 0; k < FILLER_ATTEMPTS; k++) {
    const ids = [0, 1, 2].map(() => FILLERS[Math.floor(rng() * FILLERS.length)]);
    const o = waveOrders(lo, hi, ids);
    if (o.count) return finish(ids, o.sequence, recent, rng, { ...info, kind: 'filler', orders: o.count, attempts: attempts + k + 1 });
  }
  const fb = constructiveFallback(lo, hi, rng);
  if (fb) return { ...finish(fb.ids, fb.sequence, recent, rng, { ...info, kind: 'fallback', attempts }), fallback: true };
  // Nothing fits three times over: deal whatever fits at all; game over decides honestly.
  const ids = [0, 1, 2].map(() => { const ok = FILLERS.filter((id) => anyFits(lo, hi, id)); return (ok.length ? ok : FILLERS)[Math.floor(rng() * (ok.length || FILLERS.length))]; });
  return { ...finish(ids, null, recent, rng, { ...info, kind: 'fallback', attempts }), fallback: true };
}
