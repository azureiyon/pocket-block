// Player strategies for the simulation harness. Their board heuristic is
// intentionally independent of src/core/boardeval.js (flood-fill regions and
// "how many of the 27 shapes still fit"), so the generator is not judged by
// the same yardstick it optimises.

import { SHAPE_IDS } from '../../src/core/shapes.js';
import { placementsOf, fits, applyPlacement, anyFits } from '../../src/core/rules.js';

const isSet = (lo, hi, i) => (i < 32 ? (lo >>> i) & 1 : (hi >>> (i - 32)) & 1);

/** Empty-region analysis by flood fill. */
export function regions(lo, hi) {
  const seen = new Uint8Array(64); const sizes = [];
  for (let s = 0; s < 64; s++) {
    if (seen[s] || isSet(lo, hi, s)) continue;
    let n = 0; const stack = [s]; seen[s] = 1;
    while (stack.length) {
      const i = stack.pop(); n++;
      const r = i >> 3; const c = i & 7;
      if (r > 0 && !seen[i - 8] && !isSet(lo, hi, i - 8)) { seen[i - 8] = 1; stack.push(i - 8); }
      if (r < 7 && !seen[i + 8] && !isSet(lo, hi, i + 8)) { seen[i + 8] = 1; stack.push(i + 8); }
      if (c > 0 && !seen[i - 1] && !isSet(lo, hi, i - 1)) { seen[i - 1] = 1; stack.push(i - 1); }
      if (c < 7 && !seen[i + 1] && !isSet(lo, hi, i + 1)) { seen[i + 1] = 1; stack.push(i + 1); }
    }
    sizes.push(n);
  }
  return sizes;
}

export function botHeuristic(lo, hi) {
  let fitting = 0;
  for (const id of SHAPE_IDS) if (anyFits(lo, hi, id)) fitting++;
  let small = 0; let empty = 0;
  for (const n of regions(lo, hi)) { empty += n; if (n <= 3) small += n; }
  return 2.2 * fitting - 3 * small + 0.6 * empty;
}

function legalMoves(lo, hi, tray) {
  const out = [];
  tray.forEach((p, slot) => {
    if (p.placed) return;
    for (const pl of placementsOf(p.shapeId)) if (fits(lo, hi, pl)) out.push({ slot, pl });
  });
  return out;
}

function pickBest(moves, score, rng) {
  let best = null; let bestV = -Infinity;
  for (const m of moves) {
    const v = score(m) + rng() * 1e-3;
    if (v > bestV) { bestV = v; best = m; }
  }
  return best;
}

export const STRATEGIES = {
  random(lo, hi, tray, rng) {
    const moves = legalMoves(lo, hi, tray);
    return moves.length ? moves[Math.floor(rng() * moves.length)] : null;
  },
  greedy(lo, hi, tray, rng) {
    const moves = legalMoves(lo, hi, tray);
    return pickBest(moves, (m) => applyPlacement(lo, hi, m.pl).lines.length, rng);
  },
  space(lo, hi, tray, rng) {
    const moves = legalMoves(lo, hi, tray);
    return pickBest(moves, (m) => { const r = applyPlacement(lo, hi, m.pl); return 12 * r.lines.length + botHeuristic(r.lo, r.hi); }, rng);
  },
  lookahead(lo, hi, tray, rng) {
    // Plan the rest of the tray (orders and placements, with clears) using a
    // beam, then play the first move of the best plan.
    const BEAM = 5;
    const remaining = tray.map((p, slot) => ({ slot, id: p.shapeId, placed: p.placed })).filter((p) => !p.placed);
    function search(clo, chi, left, depth) {
      if (!left.length) return { v: botHeuristic(clo, chi), first: null };
      const cands = [];
      const tried = new Set();
      for (const p of left) {
        if (tried.has(p.id)) continue; tried.add(p.id);
        for (const pl of placementsOf(p.id)) {
          if (!fits(clo, chi, pl)) continue;
          const r = applyPlacement(clo, chi, pl);
          cands.push({ p, pl, r, h: 12 * r.lines.length + botHeuristic(r.lo, r.hi) });
        }
      }
      if (!cands.length) return { v: -1000 * left.length + botHeuristic(clo, chi), first: null };
      cands.sort((a, b) => b.h - a.h);
      let best = { v: -Infinity, first: null };
      for (const c of cands.slice(0, depth === 0 ? BEAM + 2 : BEAM)) {
        const rest = left.filter((q) => q !== c.p);
        const sub = search(c.r.lo, c.r.hi, rest, depth + 1);
        const v = sub.v + 12 * c.r.lines.length + rng() * 1e-3;
        if (v > best.v) best = { v, first: { slot: c.p.slot, pl: c.pl } };
      }
      return best;
    }
    return search(lo, hi, remaining, 0).first;
  },
};
