// Concept C — Derez.
// Feeling: an arcade sprite getting zapped; punchy, playful, unmistakably
// 8-bit. Time here moves in hard steps (~18 fps, no tweening), the way old
// arcade sprites animate. A wave runs along the line: each block flashes
// white, breaks into a 4x4 pixel lattice, and the lattice spreads and climbs
// in jumps, keeping its grid formation while it blinks between its colour
// and a bright version of it and thins out in a checkerboard, until the last pixels pop as tiny
// plus-shaped sparks.
// Primary: the pixel lattices (structured formations, never loose confetti).
// Secondary: the white flash and colour cycling. Ambient: a soft glow under
// each lattice and the plus-sparks. The stepped timing is the signature:
// every other theme moves smoothly.

import { TAU, mix, seg, env, lerp, rng, drawSprite, circuitBlock, haloSprite, WHITE, ciOf } from '../art/neon-art.js';

export const params = [
  { key: 'step', label: 'Frame step', unit: 'ms', min: 33, max: 100, step: 1, def: 55 },
  { key: 'wave', label: 'Wave delay per block', unit: 'steps', min: 0, max: 1.5, step: 0.25, def: 0.5 },
  { key: 'grid', label: 'Pixels per side', min: 3, max: 6, step: 1, def: 4 },
  { key: 'climb', label: 'Climb per step', unit: '× cell', min: 0, max: 0.6, step: 0.05, def: 0.16 },
  { key: 'spread', label: 'Spread per step', min: 0, max: 0.6, step: 0.05, def: 0.1 },
  { key: 'cycle', label: 'Palette cycling (else blink)', min: 0, max: 1, step: 1, def: 0 },
];
export const presets = { Default: {}, 'Fast zap': { step: 40, wave: 0.25, climb: 0.22 }, 'Chunky': { step: 70, grid: 3, spread: 0.4 } };

const STEPS = 9; // flash, lattice, 5 climbs, sparks, gone
function timing(P) { const T = { step: P.step, o: P.wave * P.step }; T.end = 7 * T.o + (STEPS + 1) * T.step + 160; return T; }
export const duration = (P) => timing(P).end;
export const keyframes = (P) => {
  const T = timing(P); const at = (blk, n) => blk * T.o + (n + 0.5) * T.step;
  return [
    [at(1, 0), 'Flash', 'The wave starts: each block flashes white in turn.'],
    [at(2, 1), 'Lattice', 'Blocks break into a 4x4 pixel lattice.'],
    [at(3, 3), 'Climb', 'Lattices jump upward and spread, holding formation.'],
    [at(5, 4), 'Climax', 'A staircase of blinking lattices along the line, each in its own lane.'],
    [at(5, 6), 'Thin', 'The formations thin in a checkerboard.'],
    [at(7, 7), 'Sparks', 'The last pixels pop as tiny plus-shaped sparks.'],
    [T.end - 20, 'Settle', 'Gone.'],
  ].map(([t, label, note]) => ({ t, label, note }));
};

export function prepare(scene, P) {
  const line = scene.lines[0]; const pal = scene.theme.palette;
  return { line, T: timing(P), pal, blocks: line.cells.map((c, k) => ({ ...c, ci: ciOf(c, pal), o: k * timing(P).o,
    // Rows climb up; on a column, lattices step out sideways (alternating) so each keeps its own lane.
    dir: line.axis === 'v' ? [k % 2 ? 1 : -1, 0] : [0, -1] })) };
}

export function render(ctx, t, st, scene, P) {
  const { line, T, blocks, pal } = st; const s = line.s; const G = P.grid;
  for (const b of blocks) {
    const n = Math.floor((t - b.o) / T.step); // the block's current frame (stepped: no in-between)
    if (n < 0) { circuitBlock(ctx, b.x, b.y, s, b.color, b.ci, { power: n === -1 ? 0.5 : 0 }); continue; }
    if (n === 0) { circuitBlock(ctx, b.x, b.y, s, b.color, b.ci, { power: 1, tint: mix(b.color, WHITE, 0.7) }); continue; }
    if (n >= STEPS) continue;
    const m = n - 1; // 0 = lattice just formed
    const cx = b.x + b.dir[0] * s * P.climb * m; const cy = b.y + b.dir[1] * s * P.climb * m;
    const gap = 1 + P.spread * m; const px = (s / G) * Math.max(0.3, 1 - 0.14 * m) - 1;
    const col = P.cycle ? pal[(b.ci - 1 + m) % pal.length] : (m % 2 ? mix(b.color, WHITE, 0.45) : b.color); // each lattice keeps its own colour, blinking
    drawSprite(ctx, haloSprite(b.color), cx, cy, s * (1.15 + 0.1 * m), { alpha: Math.max(0, 0.45 - 0.06 * m) });
    if (n === STEPS - 1) { // plus-shaped sparks where the outermost pixels were
      ctx.globalAlpha = 1; ctx.fillStyle = WHITE;
      for (const [i, j] of [[0, 0], [G - 1, 0], [0, G - 1], [G - 1, G - 1]]) {
        const x = cx + (i - (G - 1) / 2) * (s / G) * gap; const y = cy + (j - (G - 1) / 2) * (s / G) * gap;
        ctx.fillRect(x - 3, y - 1, 6, 2); ctx.fillRect(x - 1, y - 3, 2, 6);
      }
      continue;
    }
    for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
      if (m >= 4 && (i + j) % 2 === 0) continue; // checkerboard thinning
      if (m >= 5 && (i + 2 * j) % 3 === 0) continue;
      const x = cx + (i - (G - 1) / 2) * (s / G) * gap; const y = cy + (j - (G - 1) / 2) * (s / G) * gap;
      ctx.globalAlpha = 1; ctx.fillStyle = col; ctx.fillRect(Math.round(x - px / 2), Math.round(y - px / 2), Math.round(px), Math.round(px));
      ctx.fillStyle = mix(col, WHITE, 0.6); ctx.fillRect(Math.round(x - px / 2), Math.round(y - px / 2), Math.max(1, Math.round(px * 0.35)), Math.max(1, Math.round(px * 0.35)));
    }
  }
  ctx.globalAlpha = 1;
}

export default { id: 'neon-c', label: 'C · Derez', kind: 'concept', supports: ['single'], params, presets, duration, keyframes, prepare, render };
