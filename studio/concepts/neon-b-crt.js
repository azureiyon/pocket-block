// Concept B — Power Down.
// Feeling: an old arcade screen switching off; nostalgic, decisive, a little
// cinematic. The line flickers and its colour channels split (cyan and
// magenta fringes), then it collapses across its width into one white-hot
// bar, the bar draws in along the line to a single bright dot, and the dot
// blinks out. A faint phosphor afterimage of the line lingers and fades.
// Primary: the collapse (squash to a bar, bar to a dot). Secondary: the RGB
// split and white-hot shift. Ambient: scanline banding and the phosphor ghost.
// Direction: inward on both axes, to the centre (no travel, no particles).

import { TAU, mix, seg, env, lerp, rng, premium, expoOut, quadIn, glint, drawSprite, frame, circuitBlock, haloSprite, rgbaOf, WHITE, CYAN, MAGENTA } from '../art/neon-art.js';

export const params = [
  { key: 'split', label: 'Colour split', unit: 'px', min: 0, max: 6, step: 0.5, def: 3 },
  { key: 'squash', label: 'Squash time', unit: 'ms', min: 120, max: 400, step: 10, def: 220 },
  { key: 'collapse', label: 'Collapse time', unit: 'ms', min: 120, max: 400, step: 10, def: 200 },
  { key: 'scan', label: 'Scanlines', min: 0, max: 1, step: 0.05, def: 0.6 },
  { key: 'ghost', label: 'Phosphor ghost', min: 0, max: 1, step: 0.05, def: 0.6 },
  { key: 'speed', label: 'Overall pace', min: 0.6, max: 1.5, step: 0.05, def: 1 },
];
export const presets = { Default: {}, 'Snap off': { squash: 150, collapse: 140, ghost: 0.4, speed: 0.85 }, 'Old set': { split: 5, squash: 320, collapse: 300, scan: 1, ghost: 0.9, speed: 1.15 } };

function timing(P) {
  const k = P.speed;
  const T = { flick: 100 * k };
  T.sqEnd = T.flick + P.squash * k; T.colEnd = T.sqEnd + P.collapse * k;
  T.dotEnd = T.colEnd + 130 * k; T.end = T.dotEnd + 320 * k;
  return T;
}
export const duration = (P) => timing(P).end;
export const keyframes = (P) => {
  const T = timing(P); const k = P.speed;
  return [
    [T.flick * 0.7, 'Flicker', 'The line flickers and its colours split into cyan and magenta fringes.'],
    [lerp(T.flick, T.sqEnd, 0.45), 'Squash', 'It collapses across its width, glowing hotter.'],
    [T.sqEnd + 10 * k, 'Bar', 'One white-hot bar the length of the line.'],
    [lerp(T.sqEnd, T.colEnd, 0.65), 'Collapse', 'The bar draws in to the centre.'],
    [T.colEnd + 30 * k, 'Climax', 'A single bright dot.'],
    [T.dotEnd + 60 * k, 'Afterimage', 'The dot blinks out; a phosphor ghost of the line remains.'],
    [T.end - 20, 'Settle', 'The ghost fades.'],
  ].map(([t, label, note]) => ({ t, label, note }));
};

export function prepare(scene, P) {
  const line = scene.lines[0]; const F = frame(line);
  return { line, F, T: timing(P), blocks: line.cells.map((c, k) => ({ ...c, lx: F.xOf(k), ci: c.ci || 1, o: Math.abs(k - 3.5) * 10 * P.speed })), half: line.len / 2 + line.s / 2 };
}

/** The colours of the line as a horizontal gradient across [-half, half]. */
function lineGradient(ctx, st, alphaMul = 1, toWhite = 0) {
  const g = ctx.createLinearGradient(-st.half, 0, st.half, 0);
  st.blocks.forEach((b, k) => g.addColorStop((k + 0.5) / 8, rgbaOf(mix(b.color, WHITE, toWhite), alphaMul)));
  return g;
}

export function render(ctx, t, st, scene, P) {
  const { line, F, T, blocks, half } = st; const s = line.s; const k = P.speed;
  F.enter(ctx);
  const flick = env(t, 0, T.flick * 0.4, T.flick * 0.6, T.sqEnd);
  const split = P.split * Math.min(1, t / T.flick) * (1 - seg(t, T.sqEnd, T.colEnd));
  // Ambient: scanline banding over the line while it collapses.
  const sc = env(t, T.flick * 0.5, T.flick, T.colEnd, T.dotEnd) * P.scan;
  if (sc > 0.01) { ctx.globalAlpha = sc * 0.18; ctx.fillStyle = WHITE; for (let y = -s * 0.6; y < s * 0.6; y += 3) ctx.fillRect(-half, y, half * 2, 1); }
  // Primary 1: blocks flicker, split and squash across the line.
  for (const b of blocks) {
    const q = premium(seg(t, T.flick + b.o, T.sqEnd)); if (q >= 0.98) continue;
    const thin = 1 - q * 0.94; const hot = Math.max(flick * 0.5, q);
    const fl = t < T.flick && Math.floor(t / (30 * k)) % 2 ? 0.8 : 1; // two-frame flicker
    const dims = F.vert ? { sx: thin } : { sy: thin };
    ctx.save(); ctx.translate(b.lx, 0);
    if (split > 0.2) { // colour fringes, offset along the line
      ctx.save(); ctx.translate(-split, 0); F.upright(ctx); circuitBlock(ctx, 0, 0, s, b.color, b.ci, { ...dims, tint: CYAN, face: 0.3, alpha: 0.45 * fl, glyphA: 0 }); ctx.restore();
      ctx.save(); ctx.translate(split, 0); F.upright(ctx); circuitBlock(ctx, 0, 0, s, b.color, b.ci, { ...dims, tint: MAGENTA, face: 0.3, alpha: 0.45 * fl, glyphA: 0 }); ctx.restore();
    }
    F.upright(ctx); circuitBlock(ctx, 0, 0, s, b.color, b.ci, { ...dims, power: hot, alpha: fl * (1 - seg(q, 0.75, 0.98)) });
    ctx.restore();
  }
  // Primary 2: the white-hot bar, then its collapse along the line to a dot.
  const barIn = seg(t, lerp(T.flick, T.sqEnd, 0.6), T.sqEnd);
  if (barIn > 0 && t < T.colEnd + 20 * k) {
    const c = premium(seg(t, T.sqEnd, T.colEnd)); const w = half * (1 - c); const h = lerp(s * 0.12, 2.5, Math.max(seg(t, T.sqEnd - 30 * k, T.sqEnd + 40 * k), c));
    ctx.globalAlpha = barIn * 0.5; ctx.fillStyle = lineGradient(ctx, st, 1, c * 0.6); ctx.fillRect(-w, -h * 2.2, w * 2, h * 4.4);
    ctx.globalAlpha = barIn; ctx.fillStyle = CYAN; ctx.fillRect(-w, -h / 2 - 1.5, w * 2, 1.2);
    ctx.fillStyle = MAGENTA; ctx.fillRect(-w, h / 2 + 0.3, w * 2, 1.2);
    ctx.fillStyle = WHITE; ctx.fillRect(-w, -h / 2, w * 2, h);
  }
  // Climax: the dot, then it blinks out.
  const d = env(t, T.colEnd - 30 * k, T.colEnd, T.colEnd + 40 * k, T.dotEnd);
  if (d > 0) {
    drawSprite(ctx, haloSprite(CYAN), 0, 0, s * 1.1 * d, { alpha: d * 0.8 });
    glint(ctx, 0, 0, s * 0.4 * d, WHITE, d);
    ctx.globalAlpha = d; ctx.fillStyle = WHITE; ctx.beginPath(); ctx.arc(0, 0, 3 * d, 0, TAU); ctx.fill();
  }
  // Ambient: phosphor afterimage of the whole line, in its own colours.
  const gh = env(t, T.sqEnd, T.colEnd, T.dotEnd, T.end) * P.ghost;
  if (gh > 0.01) {
    ctx.globalAlpha = gh * 0.28; ctx.fillStyle = lineGradient(ctx, st, 1, 0);
    ctx.fillRect(-half + s * 0.08, -s * 0.06, half * 2 - s * 0.16, s * 0.12);
  }
  F.leave(ctx);
  ctx.globalAlpha = 1;
}

export default { id: 'neon-b', label: 'B · Power Down', kind: 'concept', supports: ['single'], params, presets, duration, keyframes, prepare, render };
