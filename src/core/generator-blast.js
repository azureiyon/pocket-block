// "Blast" tray generator: quick, frequent, chunky clears.
//
// Where the rhythm generator paces build-up and tension, this one is built
// for a steady stream of clears and long combo streaks:
//
// 1. Shape weights lean towards pieces that finish lines (4- and 5-long
//    bars, 2x2, 2x3, 3x3) and away from awkward ones (zigzags, T's), with
//    light recency damping so trays still vary. Twins are common.
// 2. About 16 candidate trays are drafted: weighted random draws, twins,
//    "tiling" trays whose spans add up to the board's 8 cells, and, when
//    lines are close to full, trays built around pieces that finish them.
// 3. Every candidate must be whole-tray placeable (findSequence, with real
//    clears between moves). A beam search over orders and placements then
//    measures the best plan: total lines, how many separate moves clear
//    (that is what keeps a combo streak alive), whether the first piece can
//    clear immediately, and how open the board is afterwards.
// 4. Candidates are scored for clear cadence and openness and picked by
//    softmax, with a small share of random picks. If the combo streak is
//    about to break, trays that can clear on the very first move are
//    strongly preferred.
// 5. Generosity eases off slowly over a long game (by tray count, not
//    score), so a run does eventually end. Nothing guarantees a clear.

import { SHAPE_IDS, getShape } from './shapes.js';
import { placementsOf, fits, applyPlacement, findSequence, popcount } from './rules.js';
import { features, quality, contact } from './boardeval.js';
import { generateTray, RECENT_LIMIT } from './generator.js';
import { viableFirstMoves } from './generator-rhythm.js';

export const BLAST_PALETTE = 5;
const RANDOM_DRAFTS = 8;
const BEAM = 16;
const RANDOM_PICK = 0.08;
const TEMPERATURE = 0.65;
const WARMUP_TRAYS = 3;
const EASE_TRAYS = 70; // generosity eases towards its floor over this many trays
const EASE_FLOOR = 0.55;

// Per-family appeal for fast clearing.
export const FAMILY_WEIGHT = {
  single: 0.45, pair: 0.9, line3: 1.1, line4: 1.55, line5: 1.5, square2: 1.35, square3: 1.05,
  corner: 0.85, l4: 0.75, t: 0.5, zigzag: 0.35, rect23: 1.3,
};
const CHUNKY = new Set(['line4', 'line5', 'square2', 'square3', 'rect23']);

const SPAN = {
  h: { 'pair-h': 2, 'line3-h': 3, 'line4-h': 4, 'line5-h': 5, square2: 2, square3: 3, 'rect-h': 3 },
  v: { 'pair-v': 2, 'line3-v': 3, 'line4-v': 4, 'line5-v': 5, square2: 2, square3: 3, 'rect-v': 3 },
};
// Two- and three-piece sets of solid pieces whose spans add up to 8.
export const TILINGS = (() => {
  const out = [];
  for (const axis of ['h', 'v']) {
    const ids = Object.keys(SPAN[axis]);
    for (const a of ids) for (const b of ids) {
      if (a <= b && SPAN[axis][a] + SPAN[axis][b] === 8) out.push([a, b]);
      for (const c of ids) if (a <= b && b <= c && SPAN[axis][a] + SPAN[axis][b] + SPAN[axis][c] === 8) out.push([a, b, c]);
    }
  }
  return out;
})();

function weightedPick(weights, rng) {
  let total = 0; for (const w of weights) total += w;
  let x = rng() * total;
  for (let i = 0; i < weights.length; i++) { x -= weights[i]; if (x < 0) return i; }
  return weights.length - 1;
}

/** 0 (open board) .. 1 (crowded or fragmented). */
export function boardPressure(f) {
  return Math.min(1, Math.max(0, (f.filled - 18) / 24) + Math.min(0.4, (f.isolated + 0.5 * f.oneWay) / 12));
}

export function blastWeights(recent, pressure = 0) {
  const last = recent.slice(-3);
  return SHAPE_IDS.map((id) => {
    const s = getShape(id);
    let base = FAMILY_WEIGHT[s.family] || 1;
    // On a crowded board, bulky pieces are what end runs: lean smaller.
    if (s.size >= 5) base *= 1 - 0.55 * pressure;
    else if (s.size <= 3) base *= 1 + 0.6 * pressure;
    return base * (last.includes(id) ? 0.6 : recent.includes(id) ? 0.85 : 1);
  });
}

/** Penalty for pieces that barely fit anywhere on this board. */
function roomPenalty(lo, hi, ids) {
  let pen = 0;
  for (const id of ids) {
    const s = getShape(id);
    if (s.size < 4 && Math.max(s.w, s.h) < 4) continue;
    let n = 0;
    for (const p of placementsOf(id)) if (fits(lo, hi, p) && ++n >= 4) break;
    pen += n >= 4 ? 0 : n === 3 ? 0.4 : n === 2 ? 1 : 2;
  }
  return pen;
}

/** For each shape that can finish a line right now: how many lines at most, and which. */
export function completers(lo, hi) {
  const out = [];
  for (const id of SHAPE_IDS) {
    let best = null;
    for (const p of placementsOf(id)) {
      if (!fits(lo, hi, p)) continue;
      const r = applyPlacement(lo, hi, p);
      if (r.lines.length && (!best || r.lines.length > best.n)) best = { id, n: r.lines.length, line: r.lines[0] };
    }
    if (best) out.push(best);
  }
  return out;
}

function draft(lo, hi, recent, rng, f, pressure) {
  const w = blastWeights(recent, pressure);
  const draw = () => SHAPE_IDS[weightedPick(w, rng)];
  const wOf = (id) => w[SHAPE_IDS.indexOf(id)];
  const drafts = [];
  for (let k = 0; k < RANDOM_DRAFTS; k++) drafts.push({ ids: [draw(), draw(), draw()], kind: 'random' });
  const twin = draw();
  drafts.push({ ids: [twin, twin, draw()], kind: 'twin' });
  const chunky = SHAPE_IDS.filter((id) => CHUNKY.has(getShape(id).family));
  const ct = chunky[weightedPick(chunky.map(wOf), rng)];
  drafts.push({ ids: [ct, ct, draw()], kind: 'twin' });
  for (let k = 0; k < 2; k++) {
    const tray = TILINGS[Math.floor(rng() * TILINGS.length)].slice();
    while (tray.length < 3) tray.push(draw());
    drafts.push({ ids: tray, kind: 'tiling' });
  }
  if (f.near > 0) {
    const opts = completers(lo, hi);
    if (opts.length) {
      const pick = (list) => list[weightedPick(list.map((o) => wOf(o.id) * o.n), rng)];
      const one = pick(opts);
      drafts.push({ ids: [one.id, draw(), draw()], kind: 'completer' });
      drafts.push({ ids: [pick(opts).id, draw(), draw()], kind: 'completer' });
      const other = opts.filter((o) => o.line !== one.line);
      if (other.length) drafts.push({ ids: [one.id, pick(other).id, draw()], kind: 'double' });
      const multi = opts.filter((o) => o.n >= 2);
      if (multi.length) drafts.push({ ids: [pick(multi).id, draw(), draw()], kind: 'multi' });
    }
  }
  for (const d of drafts) for (let i = 2; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [d.ids[i], d.ids[j]] = [d.ids[j], d.ids[i]]; }
  return drafts;
}

/**
 * Beam search over orders and placements (with clears). Returns the best
 * reachable: total lines, number of clearing moves, final board quality and
 * fill, and whether any first move clears. Null if the tray cannot be placed.
 */
export function evaluateBlast(lo, hi, ids) {
  let frontier = [{ lo, hi, used: 0, lines: 0, clears: 0, first: false }];
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
          const n = r.lines.length;
          const lines = node.lines + n; const clears = node.clears + (n ? 1 : 0);
          children.push({
            lo: r.lo, hi: r.hi, used: node.used | (1 << i), lines, clears,
            first: depth === 0 ? n > 0 : node.first,
            h: 10 * lines + 6 * clears + contact(node.lo, node.hi, p) - 0.08 * popcount(r.lo, r.hi),
          });
        }
      }
    }
    if (!children.length) return null;
    children.sort((a, b) => b.h - a.h);
    const seen = new Set(); frontier = [];
    for (const c of children) {
      const key = c.lo + ':' + c.hi + ':' + c.used;
      if (seen.has(key)) continue;
      seen.add(key); frontier.push(c);
      if (frontier.length >= BEAM) break;
    }
  }
  let bestLines = 0; let bestClears = 0; let bestQ = -Infinity; let minFilled = 64; let first = false;
  for (const leaf of frontier) {
    const f = features(leaf.lo, leaf.hi);
    bestLines = Math.max(bestLines, leaf.lines);
    bestClears = Math.max(bestClears, leaf.clears);
    bestQ = Math.max(bestQ, quality(f));
    minFilled = Math.min(minFilled, f.filled);
    if (leaf.first) first = true;
  }
  return { bestLines, bestClears, bestQ, minFilled, first };
}

/** Can some single piece of the tray clear a line on the current board? */
export function immediateClear(lo, hi, ids) {
  for (const id of new Set(ids)) for (const p of placementsOf(id)) {
    if (fits(lo, hi, p) && applyPlacement(lo, hi, p).lines.length) return true;
  }
  return false;
}

export function generosity(trayIndex = 0) {
  const t = Math.min(1, Math.max(0, trayIndex) / EASE_TRAYS);
  return 1 - (1 - EASE_FLOOR) * t;
}

export function blastScore(e, d, base, g, danger, warmup) {
  const dq = e.bestQ - base.q;
  const families = d.ids.map((id) => getShape(id).family);
  const chunky = families.filter((fam) => CHUNKY.has(fam)).length;
  let s = g * (1.6 * Math.min(e.bestLines, 4) + 1.3 * Math.min(e.bestClears, 3))
    + 0.05 * dq
    - 0.04 * e.minFilled;
  if (e.first) s += 0.9 * g; // instant gratification
  if (danger) s += e.first ? 3 * g : -1.5 * g; // keep the streak alive
  if (warmup) s += 0.5 * chunky;
  // Fairness: razor-thin trays and pieces with nowhere to go end runs.
  const v = e.viable ?? 99;
  s -= v <= 2 ? 5 : v <= 4 ? 1.5 : v <= 6 ? 0.4 : 0;
  s -= 1.2 * (e.room || 0);
  return s;
}

/**
 * Generate a tray. Same contract as the other generators, plus `kind`,
 * `generosity` and `eval` describing the decision.
 */
export function generateBlastTray(lo, hi, recentIn, rng, ctx = {}) {
  lo >>>= 0; hi >>>= 0;
  const recent = (recentIn || []).slice(-RECENT_LIMIT);
  const f = features(lo, hi);
  const base = { q: quality(f) };
  const trayIndex = ctx.trayIndex || 0;
  const g = generosity(trayIndex);
  const warmup = trayIndex < WARMUP_TRAYS;
  // A live streak with no clear yet this tray is one tray from breaking.
  const danger = (ctx.combo || 0) > 0 && (ctx.movesSinceClear || 0) >= 1;
  const pressure = boardPressure(f);
  const crowded = f.filled >= 16;

  const scored = [];
  for (const d of draft(lo, hi, recent, rng, f, pressure)) {
    const sequence = findSequence(lo, hi, d.ids);
    if (!sequence) continue;
    const e = evaluateBlast(lo, hi, d.ids);
    if (!e) continue;
    e.viable = crowded ? viableFirstMoves(lo, hi, d.ids, 8) : 99;
    e.room = crowded ? roomPenalty(lo, hi, d.ids) : 0;
    scored.push({ ...d, sequence, e, s: blastScore(e, d, base, g, danger, warmup) });
  }
  if (!scored.length) {
    const t = generateTray(lo, hi, recent, rng);
    return { ...t, colors: t.ids.map(() => 1 + Math.floor(rng() * BLAST_PALETTE)), kind: 'fallback', generosity: g };
  }
  let chosen;
  if (rng() < RANDOM_PICK * (2 - g)) chosen = scored[Math.floor(rng() * scored.length)];
  else {
    const max = Math.max(...scored.map((c) => c.s));
    const w = scored.map((c) => Math.exp((c.s - max) / TEMPERATURE));
    chosen = scored[weightedPick(w, rng)];
  }
  const ids = chosen.ids;
  return {
    ids,
    colors: ids.map(() => 1 + Math.floor(rng() * BLAST_PALETTE)),
    sequence: chosen.sequence, attempts: scored.length, fallback: false,
    recent: [...recent, ...ids].slice(-RECENT_LIMIT),
    kind: chosen.kind, generosity: g, danger, pressure,
    eval: { bestLines: chosen.e.bestLines, bestClears: chosen.e.bestClears, first: chosen.e.first },
  };
}
