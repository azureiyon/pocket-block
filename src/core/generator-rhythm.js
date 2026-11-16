// Board-aware "rhythm" tray generator.
//
// 1. A small director picks a mood for this tray from the board state and
//    recent clear history (never the score):
//      build    spacious board: variety and setups, big clears not handed out
//      tension  allow awkward pieces, but never razor-thin trays
//      reward   prefer trays whose best play can clear (ideally several) lines
//      recovery crowded/fragmented board: prefer trays with realistic ways out
// 2. It drafts candidate trays from the existing 27-shape pool with the
//    existing uniform per-orientation weights (repeats allowed, mild recency
//    damping), plus a few board-informed drafts.
// 3. Every candidate is checked with the shared rules (findSequence) and then
//    simulated with a beam search over piece orders and placements, applying
//    real clears between moves, to measure how good the best plans are.
// 4. A candidate is picked by softmax over the mood's score, with a share of
//    purely random picks, so the player still gets imperfect and surprising
//    trays. Nothing guarantees a clear or survival.

import { SHAPE_IDS, getShape } from './shapes.js';
import { placementsOf, fits, applyPlacement, findSequence, popcount } from './rules.js';
import { features, quality, contact } from './boardeval.js';
import { generateTray, RECENT_LIMIT, PALETTE_SIZE } from './generator.js';

export const MOODS = ['build', 'tension', 'reward', 'recovery'];
const RANDOM_DRAFTS = 7;
const BEAM = 20;
const VIABLE_CAP = 14;
const RANDOM_PICK = 0.12;
const TEMPERATURE = 0.9;
const WARMUP_TRAYS = 4;

// ---------- drafting ----------

function weightedPick(weights, rng) {
  let total = 0; for (const w of weights) total += w;
  let x = rng() * total;
  for (let i = 0; i < weights.length; i++) { x -= weights[i]; if (x < 0) return i; }
  return weights.length - 1;
}

// Solid rectangular pieces and the tilings of an 8-wide line they can form.
const RECT_SHAPES = ['pair-h', 'pair-v', 'line3-h', 'line3-v', 'line4-h', 'line4-v', 'line5-h', 'line5-v', 'square2', 'square3', 'rect-h', 'rect-v'];
const TILINGS = (() => {
  const span = { h: { 'pair-h': 2, 'line3-h': 3, 'line4-h': 4, 'line5-h': 5, square2: 2, square3: 3, 'rect-h': 3 }, v: { 'pair-v': 2, 'line3-v': 3, 'line4-v': 4, 'line5-v': 5, square2: 2, square3: 3, 'rect-v': 3 } };
  const out = [];
  for (const axis of ['h', 'v']) {
    const ids = Object.keys(span[axis]);
    for (const a of ids) for (const b of ids) {
      if (span[axis][a] + span[axis][b] === 8) out.push([a, b]);
      for (const c of ids) if (span[axis][a] + span[axis][b] + span[axis][c] === 8 && a <= b && b <= c) out.push([a, b, c]);
    }
  }
  return out;
})();

function shapeWeights(recent) {
  // Uniform per orientation (as before), lightly damped for very recent
  // shapes so the same piece does not dominate, but repeats stay possible.
  const last = recent.slice(-3);
  return SHAPE_IDS.map((id) => (last.includes(id) ? 0.55 : recent.includes(id) ? 0.85 : 1));
}

function draw(weights, rng) { return SHAPE_IDS[weightedPick(weights, rng)]; }

function draftCandidates(lo, hi, recent, rng, f) {
  const w = shapeWeights(recent);
  const drafts = [];
  for (let k = 0; k < RANDOM_DRAFTS; k++) drafts.push({ ids: [draw(w, rng), draw(w, rng), draw(w, rng)], kind: 'random' });
  // Twins: reference footage shows identical pieces in a tray very often.
  const twin = draw(w, rng);
  drafts.push({ ids: [twin, twin, draw(w, rng)], kind: 'twin' });
  const rectTwin = RECT_SHAPES[weightedPick(RECT_SHAPES.map((id) => w[SHAPE_IDS.indexOf(id)]), rng)];
  drafts.push({ ids: [rectTwin, rectTwin, draw(w, rng)], kind: 'twin' });
  // Tiling: solid rectangular pieces whose widths (or heights) add up to the
  // board's 8 cells, so they can lock together into complete lines.
  const tiles = TILINGS[Math.floor(rng() * TILINGS.length)];
  const tray = tiles.slice();
  while (tray.length < 3) tray.push(draw(w, rng));
  drafts.push({ ids: tray, kind: 'tiling' });
  // Completers: shapes that can finish lines right now. Used for a single-
  // line draft, a two-completer draft and, when available, a multi-line draft.
  if (f.near > 0) {
    const best = new Map(); // shape -> {n, lines}
    for (const id of SHAPE_IDS) {
      for (const p of placementsOf(id)) {
        if (!fits(lo, hi, p)) continue;
        const r = applyPlacement(lo, hi, p);
        const n = r.lines.length;
        if (n && (!best.has(id) || n > best.get(id).n)) best.set(id, { n, line: r.lines[0] });
      }
    }
    const options = [...best.entries()].map(([id, o]) => ({ id, ...o }));
    if (options.length) {
      const wOf = (o) => w[SHAPE_IDS.indexOf(o.id)];
      const one = options[weightedPick(options.map(wOf), rng)];
      drafts.push({ ids: [one.id, draw(w, rng), draw(w, rng)], kind: 'completer' });
      const other = options.filter((o) => o.line !== one.line);
      if (other.length) drafts.push({ ids: [one.id, other[weightedPick(other.map(wOf), rng)].id, draw(w, rng)], kind: 'double' });
      const multi = options.filter((o) => o.n >= 2);
      if (multi.length) drafts.push({ ids: [multi[weightedPick(multi.map(wOf), rng)].id, draw(w, rng), draw(w, rng)], kind: 'multi' });
    }
  }
  // A lighter tray: one small piece (1-3 cells) with two ordinary draws.
  const small = SHAPE_IDS.filter((id) => getShape(id).size <= 3);
  drafts.push({ ids: [small[Math.floor(rng() * small.length)], draw(w, rng), draw(w, rng)], kind: 'light' });
  // Shuffle each tray's order so slot positions carry no meaning.
  for (const d of drafts) for (let i = 2; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [d.ids[i], d.ids[j]] = [d.ids[j], d.ids[i]]; }
  return drafts;
}

// ---------- evaluation ----------

/**
 * Beam search over orders and placements with real clears. Returns the best
 * reachable outcomes: most lines, best final board quality, and the best
 * final quality among plans that clear something.
 */
export function evaluateTray(lo, hi, ids) {
  let frontier = [{ lo, hi, used: 0, lines: 0 }];
  for (let depth = 0; depth < ids.length; depth++) {
    const children = [];
    for (const node of frontier) {
      const tried = new Set();
      for (let i = 0; i < ids.length; i++) {
        if (node.used & (1 << i) || tried.has(ids[i])) continue;
        tried.add(ids[i]);
        for (const p of placementsOf(ids[i])) {
          if ((node.lo & p.lo) !== 0 || (node.hi & p.hi) !== 0) continue;
          const r = applyPlacement(node.lo, node.hi, p);
          const lines = node.lines + r.lines.length;
          children.push({ lo: r.lo, hi: r.hi, used: node.used | (1 << i), lines, h: 9 * lines + contact(node.lo, node.hi, p) - 0.05 * popcount(r.lo, r.hi) });
        }
      }
    }
    if (!children.length) return null;
    children.sort((a, b) => b.h - a.h);
    // Deduplicate transpositions (same board, same pieces used).
    const seen = new Set(); frontier = [];
    for (const c of children) {
      const key = c.lo + ':' + c.hi + ':' + c.used;
      if (seen.has(key)) continue;
      seen.add(key); frontier.push(c);
      if (frontier.length >= BEAM) break;
    }
  }
  let bestLines = 0; let bestQ = -Infinity; let bestClearQ = -Infinity; let bestNear = 0;
  for (const leaf of frontier) {
    const f = features(leaf.lo, leaf.hi);
    const q = quality(f);
    if (leaf.lines > bestLines) bestLines = leaf.lines;
    if (q > bestQ) { bestQ = q; bestNear = f.near; }
    if (leaf.lines > 0 && q > bestClearQ) bestClearQ = q;
  }
  return { bestLines, bestQ, bestClearQ, bestNear };
}

/** Distinct first moves that still leave the rest of the tray placeable. */
export function viableFirstMoves(lo, hi, ids, cap = VIABLE_CAP) {
  let n = 0; const seen = new Set();
  for (let i = 0; i < ids.length; i++) {
    if (seen.has(ids[i])) continue; seen.add(ids[i]);
    const rest = ids.filter((_, j) => j !== i);
    for (const p of placementsOf(ids[i])) {
      if (!fits(lo, hi, p)) continue;
      const r = applyPlacement(lo, hi, p);
      if (findSequence(r.lo, r.hi, rest, { maxNodes: 4000 })) { n++; if (n >= cap) return n; }
    }
  }
  return n;
}

// ---------- director ----------

export function chooseMood(f, ctx, rng) {
  const dry = Math.min(3, (ctx && ctx.traysSinceClear) || 0);
  const pressure = Math.min(1, Math.max(0, (f.filled - 22) / 22) + Math.min(0.35, (f.isolated + 0.5 * f.oneWay) / 14));
  const weights = {
    build: (1 - pressure) * (dry === 0 ? 1 : 0.6),
    tension: 0.75 * Math.sqrt(1 - pressure) * (dry <= 1 ? 1 : 0.4),
    reward: 0.12 + 0.25 * dry + (f.near ? 0.12 : 0),
    recovery: 0.9 * pressure * pressure * (dry >= 1 ? 1.2 : 0.7),
  };
  // Warm-up: the first few trays of a game lean towards satisfying, chunky
  // clears (as in the reference footage) rather than awkward tension.
  if (ctx && ctx.trayIndex !== undefined && ctx.trayIndex < WARMUP_TRAYS) { weights.reward += 0.6; weights.tension *= 0.3; }
  const i = weightedPick(MOODS.map((m) => weights[m]), rng);
  return { mood: MOODS[i], pressure, weights };
}

function moodScore(mood, e, base) {
  const dq = e.bestQ - base.q;                   // board health after best play
  const v = e.viable;                            // breadth of good openings
  const thin = v <= 2 ? -4 : v <= 4 ? -1.2 : 0;  // razor-thin trays are what end runs unfairly
  switch (mood) {
    case 'build':
      return 0.06 * dq + 0.08 * v + 0.3 * Math.min(e.bestLines, 1) - 0.6 * Math.max(0, e.bestLines - 1) + 0.4 * (e.bestNear - base.near) + thin;
    case 'tension':
      // Awkward but fair: bulkier pieces and real board damage, moderate
      // breadth, never razor-thin.
      return -0.3 * Math.abs(Math.min(v, 10) - 5) - 0.04 * Math.abs(dq + 16) + 0.12 * (e.size - 11) - 0.5 * Math.max(0, e.bestLines - 1) + (v <= 2 ? -5 : 0);
    case 'reward':
      return 1.1 * Math.min(e.bestLines, 1) + 1.4 * Math.min(Math.max(0, e.bestLines - 1), 2) + 0.03 * (e.bestClearQ > -Infinity ? e.bestClearQ - base.q : -20) + 0.06 * v + thin;
    case 'recovery':
      return 0.08 * dq + 0.8 * Math.min(e.bestLines, 2) + 0.12 * v + thin;
    default:
      return 0;
  }
}

/**
 * Generate a tray. Same contract as the classic generator, plus `mood` and
 * `scores` describing the decision (for testing and simulation).
 */
export function generateRhythmTray(lo, hi, recentIn, rng, ctx = {}) {
  lo >>>= 0; hi >>>= 0;
  const recent = (recentIn || []).slice(-RECENT_LIMIT);
  const f = features(lo, hi);
  const { mood, pressure } = chooseMood(f, ctx, rng);
  const base = { q: quality(f), near: f.near };
  const drafts = draftCandidates(lo, hi, recent, rng, f);

  const scored = [];
  const crowded = f.filled >= 16;
  for (const d of drafts) {
    const sequence = findSequence(lo, hi, d.ids);
    if (!sequence) continue; // every offered tray stays whole-tray solvable
    const e = evaluateTray(lo, hi, d.ids);
    if (!e) continue;
    e.viable = crowded ? viableFirstMoves(lo, hi, d.ids) : VIABLE_CAP;
    e.size = d.ids.reduce((a, id) => a + getShape(id).size, 0);
    scored.push({ ...d, sequence, e, s: moodScore(mood, e, base) });
  }

  if (!scored.length) {
    // Nothing drafted fits: defer to the classic generator, whose attempts and
    // complete constructive fallback find a valid tray whenever one exists.
    const t = generateTray(lo, hi, recent, rng);
    return { ...t, mood: 'fallback', pressure };
  }

  let chosen;
  if (rng() < RANDOM_PICK) chosen = scored[Math.floor(rng() * scored.length)];
  else {
    const max = Math.max(...scored.map((c) => c.s));
    const w = scored.map((c) => Math.exp((c.s - max) / TEMPERATURE));
    chosen = scored[weightedPick(w, rng)];
  }
  const ids = chosen.ids;
  const colors = ids.map(() => 1 + Math.floor(rng() * PALETTE_SIZE));
  return {
    ids, colors, sequence: chosen.sequence, attempts: scored.length, fallback: false,
    recent: [...recent, ...ids].slice(-RECENT_LIMIT),
    mood, pressure, kind: chosen.kind,
    eval: { bestLines: chosen.e.bestLines, viable: chosen.e.viable, dq: Math.round(chosen.e.bestQ - base.q) },
  };
}
