// Plays one simulated game and returns raw per-game metrics.
import { createRng } from '../../src/core/rng.js';
import { getGenerator } from '../../src/core/generators.js';
import { placementsOf, fits, applyPlacement, anyFits, findSequence, popcount } from '../../src/core/rules.js';
import { getShape } from '../../src/core/shapes.js';
import { features } from '../../src/core/boardeval.js';
import { STRATEGIES, regions } from './bots.js';
import { MODES, BLAST_STREAK_WINDOW } from '../../src/core/modes.js';

const ALL_LINES = Array.from({ length: 16 }, (_, k) => k);
const VIABLE_CAP = 30;

/** Distinct first moves after which the rest of the tray can still be placed. */
export function viableFirstMoves(lo, hi, ids) {
  let n = 0;
  const seen = new Set();
  for (let i = 0; i < ids.length; i++) {
    if (seen.has(ids[i])) continue; seen.add(ids[i]);
    const rest = ids.filter((_, j) => j !== i);
    for (const p of placementsOf(ids[i])) {
      if (!fits(lo, hi, p)) continue;
      const r = applyPlacement(lo, hi, p);
      if (findSequence(r.lo, r.hi, rest)) { n++; if (n >= VIABLE_CAP) return n; }
    }
  }
  return n;
}

export function playGame({ gen, strategy, seed, cap = 600 }) {
  const generate = getGenerator(gen);
  const bot = STRATEGIES[strategy];
  const genRng = createRng((Math.imul(seed, 2654435761) ^ 0x51ed27) >>> 0);
  const botRng = createRng((Math.imul(seed, 40503) ^ 0xbeef) >>> 0);
  let lo = 0; let hi = 0; let recent = [];
  const ctx = { traysSinceClear: 0, lastTrayLines: 0, movesSinceClear: 0, combo: 0 };
  // Streaks are measured under Blast rules for every generator, so the
  // numbers compare like with like. Colours are not simulated (no wipes).
  let streak = 0; let streakGap = 0;
  const m = {
    gen, strategy, seed, moves: 0, trays: 0, score: 0, clearMoves: 0, lines: 0, multiMoves: 0, allClears: 0,
    gaps: [], occ: [], shapes: {}, triples: {}, dupTrays: 0, limitedTrays: 0, clearAvailTrays: 0,
    viable: [], moods: {}, kinds: {}, blastScore: 0, maxStreak: 0, streakClears: 0, streaks: [], firstClearMove: null, highEpisodes: 0, recovered: 0, capped: false, death: null, trayLinesHist: [0, 0, 0, 0],
  };
  let sinceClear = 0; let inHigh = false;
  while (true) {
    const tray = generate(lo, hi, recent, genRng, { ...ctx, trayIndex: m.trays, ...(gen === 'flow' ? { score: m.blastScore } : {}) });
    if (tray.kind) m.kinds[tray.kind] = (m.kinds[tray.kind] || 0) + 1;
    recent = tray.recent;
    m.trays++;
    if (tray.mood) m.moods[tray.mood] = (m.moods[tray.mood] || 0) + 1;
    for (const id of tray.ids) m.shapes[id] = (m.shapes[id] || 0) + 1;
    const key = tray.ids.slice().sort().join('+');
    m.triples[key] = (m.triples[key] || 0) + 1;
    if (new Set(tray.ids).size < 3) m.dupTrays++;
    const filled = popcount(lo, hi);
    const v = filled < 16 ? VIABLE_CAP : viableFirstMoves(lo, hi, tray.ids);
    m.viable.push(v);
    if (v <= 4) m.limitedTrays++;
    if (findSequence(lo, hi, tray.ids, { needClear: ALL_LINES, maxNodes: 30000 })) m.clearAvailTrays++;

    const pieces = tray.ids.map((shapeId) => ({ shapeId, placed: false }));
    let trayLines = 0; let placedThisTray = 0;
    for (let k = 0; k < 3; k++) {
      if (!pieces.some((p) => !p.placed && anyFits(lo, hi, p.shapeId))) {
        const f = features(lo, hi);
        const stuck = pieces.filter((p) => !p.placed).map((p) => p.shapeId);
        const bigStuck = stuck.some((id) => getShape(id).size >= 5 || Math.max(getShape(id).w, getShape(id).h) >= 4);
        const smallRegions = regions(lo, hi).filter((n) => n <= 3).reduce((a, b) => a + b, 0);
        m.death = {
          filled: f.filled, isolated: f.isolated, smallRegions, stuck, placedFromTray: placedThisTray,
          viableAtOffer: m.viable[m.viable.length - 1], cause: f.filled >= 40 ? 'crowded' : (f.isolated + smallRegions >= 6 ? 'fragmented' : (bigStuck ? 'bulky-piece' : 'other')),
        };
        return finish(m);
      }
      const mv = bot(lo, hi, pieces, botRng);
      const r = applyPlacement(lo, hi, mv.pl);
      const blocks = popcount(mv.pl.lo, mv.pl.hi);
      pieces[mv.slot].placed = true;
      lo = r.lo; hi = r.hi;
      m.moves++; placedThisTray++;
      const lines = r.lines.length;
      m.score += 5 * blocks + 80 * lines * lines;
      sinceClear++;
      if (lines) { streak++; streakGap = 0; if (m.firstClearMove === null) m.firstClearMove = m.moves; } else if (++streakGap >= BLAST_STREAK_WINDOW && streak) { m.streaks.push(streak); streak = 0; }
      if (lines && streak >= 3) m.streakClears++;
      m.maxStreak = Math.max(m.maxStreak, streak);
      m.blastScore += MODES.blast.score({ blocks, lines, combo: streak, wiped: 0, allClear: lines > 0 && lo === 0 && hi === 0 }).points;
      ctx.combo = streak; ctx.movesSinceClear = streakGap;
      if (lines) {
        m.clearMoves++; m.lines += lines; trayLines += lines;
        if (lines >= 2) m.multiMoves++;
        if (lo === 0 && hi === 0) m.allClears++;
        m.gaps.push(sinceClear); sinceClear = 0;
      }
      const occ = popcount(lo, hi);
      m.occ.push(occ);
      if (!inHigh && occ >= 36) { inHigh = true; m.highEpisodes++; }
      if (inHigh && occ <= 22) { inHigh = false; m.recovered++; }
      if (m.moves >= cap) { m.capped = true; return finish(m); }
    }
    m.trayLinesHist[Math.min(trayLines, 3)]++;
    ctx.traysSinceClear = trayLines ? 0 : ctx.traysSinceClear + 1;
    ctx.lastTrayLines = trayLines;
    ctx.movesSinceClear = sinceClear;
  }
}

function finish(m) {
  if (m.streaks) m.streakMean = m.streaks.length ? m.streaks.reduce((a, b) => a + b, 0) / m.streaks.length : 0;
  delete m.streaks;
  // Keep payloads small: summarise occupancy.
  const occ = m.occ;
  m.occMean = occ.length ? occ.reduce((a, b) => a + b, 0) / occ.length : 0;
  m.occHist = [0, 0, 0, 0, 0, 0, 0, 0];
  for (const o of occ) m.occHist[Math.min(7, o >> 3)]++;
  // Tension cycles: low (<=16 filled) -> high (>=32) -> low.
  let state = 'low'; let cycles = 0;
  for (const o of occ) {
    if (state === 'low' && o >= 32) state = 'high';
    else if (state === 'high' && o <= 16) { state = 'low'; cycles++; }
  }
  m.cycles = cycles;
  delete m.occ;
  return m;
}
