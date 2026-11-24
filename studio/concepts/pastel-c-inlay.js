// Concept C — Opalescent Inlay.
// Inspiration: mother-of-pearl inlay on a lacquered music box, Art Nouveau
// marquetry. A travelling highlight passes along the row and reveals each
// block as a piece of polished nacre. Its surface separates into three thin
// iridescent layers that fan like cards, then the pieces resolve into an
// ornamental mosaic: diamonds of four tiles with pearl dots between them.
// A second sweep of light travels back the other way and each tile flips
// edge-on and vanishes as it passes.
// Motif: craft and precision. Light sweeps sideways; pieces rotate in place.

import { TAU, mix, seg, env, lerp, easeOut, easeIn, easeInOut, easeOutBack, sine, rng, sparkle, enamelBlock, frame, nacre, roundRectPath, INK, PEARL } from '../../src/ui/vfx-classic/pastel-art.js';

export const params = [
  { key: 'sweep', label: 'Reveal sweep time', unit: 'ms', min: 180, max: 600, step: 20, def: 320 },
  { key: 'band', label: 'Highlight width', unit: '× cell', min: 0.3, max: 1.5, step: 0.05, def: 0.7 },
  { key: 'fan', label: 'Layer fan', unit: '× cell', min: 0, max: 0.35, step: 0.01, def: 0.16 },
  { key: 'iris', label: 'Iridescence', min: 0, max: 1, step: 0.05, def: 0.75 },
  { key: 'mosaic', label: 'Mosaic turn', unit: '°', min: 0, max: 90, step: 5, def: 45 },
  { key: 'grout', label: 'Tile gap', unit: '× cell', min: 0, max: 0.12, step: 0.01, def: 0.05 },
  { key: 'dots', label: 'Pearl dots', min: 0, max: 1, step: 1, def: 1 },
  { key: 'speed', label: 'Overall pace', min: 0.6, max: 1.5, step: 0.05, def: 1 },
];
export const presets = { Default: {}, 'Square marquetry': { mosaic: 0, grout: 0.07 }, 'Slow & lustrous': { sweep: 480, band: 1, iris: 1, speed: 1.2 } };

function timing(P) {
  const k = P.speed;
  const T = { reveal: P.sweep * k };
  T.layers = T.reveal + 40 * k; T.layersEnd = T.layers + 260 * k;
  T.mosaic = T.layersEnd; T.mosaicEnd = T.mosaic + 300 * k;
  T.hold = T.mosaicEnd + 120 * k;
  T.back = T.hold; T.backEnd = T.back + 420 * k;
  T.end = T.backEnd + 220 * k;
  return T;
}
export const duration = (P) => timing(P).end;
export const keyframes = (P) => {
  const T = timing(P);
  return [
    [T.reveal * 0.35, 'Anticipation', 'A slanted highlight starts along the row.'],
    [T.reveal * 0.85, 'Reveal', 'Behind it, each block shows as polished mother-of-pearl.'],
    [lerp(T.layers, T.layersEnd, 0.7), 'Layers', 'Each piece separates into three iridescent layers, fanned like cards.'],
    [lerp(T.mosaic, T.mosaicEnd, 0.7), 'Climax', 'They resolve into an ornamental mosaic of diamonds and pearl dots.'],
    [lerp(T.back, T.backEnd, 0.35), 'Return sweep', 'A second highlight travels back; tiles flip edge-on as it passes.'],
    [lerp(T.back, T.backEnd, 0.8), 'Follow-through', 'The last tiles turn away with a glint.'],
    [T.backEnd + 120 * P.speed, 'Settle', 'A faint line of pearl dots fades.'],
  ].map(([t, label, note]) => ({ t, label, note }));
};

export function prepare(scene, P) {
  const line = scene.lines[0]; const F = frame(line); const r = rng(29);
  return { line, F, T: timing(P), phases: line.cells.map(() => r()), half: line.len / 2 + line.s * 0.6 };
}

/** One nacre plate (rounded square) with defined edge and a small specular bar. */
function plate(ctx, s, color, phase, iris, alpha) {
  if (alpha <= 0.01) return;
  ctx.globalAlpha = alpha;
  roundRectPath(ctx, s, s, s * 0.22);
  ctx.fillStyle = iris > 0 ? nacre(ctx, -s / 2, -s / 2, s / 2, s / 2, mix(color, '#ffffff', 0.08 * (1 - iris)), phase) : color;
  ctx.fill();
  ctx.lineWidth = 1.2; ctx.strokeStyle = mix(color, INK, 0.4); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fillRect(-s * 0.32, -s * 0.36, s * 0.3, Math.max(1.2, s * 0.06));
}

/** Quadrant triangle (0 top, 1 right, 2 bottom, 3 left) of a square of size s, centred. */
function tri(ctx, q, s) {
  const h = s / 2; const pts = [[[-h, -h], [h, -h]], [[h, -h], [h, h]], [[h, h], [-h, h]], [[-h, h], [-h, -h]]][q];
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); ctx.closePath();
}

export function render(ctx, t, st, scene, P) {
  const { line, F, T, phases, half } = st; const s = line.s;
  const sweepX = lerp(-half - s, half + s, easeInOut(seg(t, 0, T.reveal)));
  const backX = lerp(half + s, -half - s, easeInOut(seg(t, T.back, T.backEnd)));
  const iris = P.iris;
  F.enter(ctx);
  line.cells.forEach((c, k) => {
    const x = F.xOf(k); const ph = phases[k];
    const revealed = seg(sweepX - x, -s * 0.3, s * 0.3);
    const stagger = k * 18 * P.speed;
    const lay = easeOutBack(seg(t, T.layers + stagger, T.layersEnd + stagger), 1.4) * (1 - easeInOut(seg(t, T.mosaic + stagger, T.mosaic + stagger + 160 * P.speed)));
    const mos = easeInOut(seg(t, T.mosaic + stagger, T.mosaicEnd + stagger));
    const flip = seg(x - backX, -s * 0.4, s * 0.4); // 0 before the return sweep, 1 after
    ctx.save(); ctx.translate(x, 0); F.upright(ctx);
    if (mos <= 0) {
      if (revealed < 1) enamelBlock(ctx, 0, 0, s, c.color, { alpha: 1 - revealed });
      if (revealed > 0) {
        // Three layers fanned diagonally, back to front, each its own lustre.
        for (let l = 2; l >= 0; l--) {
          const d = (l - 1) * s * P.fan * lay;
          ctx.save(); ctx.translate(d, -d * 0.6); ctx.rotate((l - 1) * 0.08 * lay);
          plate(ctx, s * (1 - l * 0.06 * lay), c.color, ph + l * 0.23, iris, revealed * (l === 0 ? 1 : lay));
          ctx.restore();
        }
      }
    } else if (flip < 1) {
      // Mosaic: four tiles turn into a diamond with grout between them; each flips edge-on on the return sweep.
      const rot = (P.mosaic * Math.PI / 180) * mos; const sc = 1 - 0.22 * mos; const gap = s * P.grout * mos;
      ctx.rotate(rot);
      for (let q = 0; q < 4; q++) {
        const fq = seg(flip, q * 0.12, q * 0.12 + 0.6); const sx = Math.cos(fq * Math.PI / 2);
        if (sx <= 0.02) continue;
        const ox = [0, 1, 0, -1][q] * gap; const oy = [-1, 0, 1, 0][q] * gap;
        ctx.save(); ctx.translate(ox, oy); ctx.scale(q % 2 ? sx : 1, q % 2 ? 1 : sx);
        tri(ctx, q, s * sc);
        ctx.globalAlpha = 1; ctx.fillStyle = nacre(ctx, -s / 2, -s / 2, s / 2, s / 2, c.color, ph + q * 0.2); ctx.fill();
        ctx.lineWidth = 1.1; ctx.strokeStyle = mix(c.color, INK, 0.42); ctx.stroke();
        ctx.restore();
      }
      if (P.dots && sx_dotAlpha(flip) > 0) {
        ctx.rotate(-rot);
        ctx.globalAlpha = sx_dotAlpha(flip) * mos; ctx.fillStyle = '#fff3e0'; ctx.strokeStyle = mix(c.color, INK, 0.45); ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(0, 0, s * 0.1, 0, TAU); ctx.fill(); ctx.stroke();
      }
    }
    // A glint as each tile turns away.
    const g = env(flip, 0.25, 0.45, 0.55, 0.9);
    if (g > 0) { ctx.globalAlpha = 1; sparkle(ctx, 0, -s * 0.1, s * 0.36 * g, g, '#ffffff', 0); }
    ctx.restore();
  });
  // Pearl dots between the diamonds (the inlay's connecting ornament).
  if (P.dots) for (let k = 0; k < 7; k++) {
    const x = (F.xOf(k) + F.xOf(k + 1)) / 2; const mos = easeInOut(seg(t, T.mosaic + k * 18 * P.speed, T.mosaicEnd + k * 18 * P.speed));
    const a = mos * (1 - seg(x - backX, -s * 0.2, s * 0.4) * 0.6) * (1 - seg(t, T.backEnd, T.end));
    if (a <= 0.01) continue;
    ctx.globalAlpha = a; ctx.fillStyle = mix(PEARL[k % PEARL.length], line.cells[k].color, 0.35); ctx.strokeStyle = mix(line.cells[k].color, INK, 0.4); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, 0, s * 0.1, 0, TAU); ctx.fill(); ctx.stroke();
  }
  // The travelling highlights: narrow slanted bands of pearl light, not a white bloom.
  for (const [bx, on] of [[sweepX, env(t, 0, 40, T.reveal - 40, T.reveal + 40)], [backX, env(t, T.back, T.back + 40, T.backEnd - 40, T.backEnd + 40)]]) {
    if (on <= 0) continue;
    ctx.save(); ctx.translate(bx, 0); ctx.transform(1, 0, -0.45, 1, 0, 0);
    const w = s * P.band * 0.5; const g = ctx.createLinearGradient(-w, 0, w, 0);
    g.addColorStop(0, 'rgba(255,246,232,0)'); g.addColorStop(0.5, 'rgba(255,246,232,.75)'); g.addColorStop(1, 'rgba(255,246,232,0)');
    ctx.globalAlpha = on; ctx.fillStyle = g; ctx.fillRect(-w, -s * 0.62, w * 2, s * 1.24);
    ctx.restore();
  }
  F.leave(ctx);
  ctx.globalAlpha = 1;
}

function sx_dotAlpha(flip) { return 1 - seg(flip, 0, 0.5); }

export default { id: 'pastel-c', label: 'Rejected · C · Opalescent Inlay', kind: 'concept', supports: ['single'], params, presets, duration, keyframes, prepare, render };
