// Concept B — Porcelain Petalwork.
// Inspiration: hand-painted porcelain flowers and kintsugi seams; a
// stationer's pressed-flower border. Each block gives a small press, fine
// luminous seams run across its glaze, and it opens into overlapping glazed
// porcelain petals, one flower after another along the line. The finished row
// holds for a beat as a floral border, then the petals part and drift down,
// turning slowly, with a fine pearlescent dust.
// Motif: opening outward in place (a bloom), then a slow downward drift.

import { TAU, mix, seg, env, lerp, easeOut, easeIn, easeInOut, easeOutBack, rng, sparkle, enamelBlock, frame, INK, PEARL } from '../art/pastel-art.js';

export const params = [
  { key: 'stagger', label: 'Bloom stagger', unit: 'ms', min: 20, max: 80, step: 5, def: 42 },
  { key: 'petals', label: 'Petals per flower', min: 4, max: 6, step: 1, def: 5 },
  { key: 'size', label: 'Petal length', unit: '× cell', min: 0.35, max: 0.8, step: 0.02, def: 0.58 },
  { key: 'layers', label: 'Back petal layer', min: 0, max: 1, step: 1, def: 1 },
  { key: 'glaze', label: 'Glaze highlight', min: 0, max: 1, step: 0.05, def: 0.85 },
  { key: 'drift', label: 'Drift distance', unit: '× cell', min: 0.3, max: 2, step: 0.1, def: 1.1 },
  { key: 'dust', label: 'Pearl dust', min: 0, max: 2, step: 0.1, def: 1 },
  { key: 'speed', label: 'Overall pace', min: 0.6, max: 1.5, step: 0.05, def: 1 },
];
export const presets = { Default: {}, 'Camellia': { petals: 6, size: 0.66, drift: 0.8, speed: 1.15 }, 'Quick blossoms': { stagger: 28, petals: 4, drift: 0.7, speed: 0.85 } };

function timing(P) {
  const k = P.speed;
  const T = { press: 90 * k, seam: 170 * k, open: 230 * k };
  T.bloomed = 7 * P.stagger + T.press + T.seam + T.open;
  T.hold = T.bloomed + 140 * k;
  T.part = T.hold + 520 * k;
  T.end = T.part + 160 * k;
  return T;
}
export const duration = (P) => timing(P).end;
export const keyframes = (P) => {
  const T = timing(P); const st = P.stagger;
  return [
    [2 * st + T.press * 0.8, 'Anticipation', 'A gentle press runs along the row.'],
    [3 * st + T.press + T.seam * 0.8, 'Seams', 'Fine luminous seams cross each block’s glaze.'],
    [4 * st + T.press + T.seam + T.open * 0.6, 'Unfurling', 'Blocks open into glazed porcelain petals, one after another.'],
    [T.bloomed + 60 * P.speed, 'Climax', 'The row becomes a pastel floral border.'],
    [lerp(T.hold, T.part, 0.35), 'Parting', 'The petals part and begin to drift, turning slowly.'],
    [lerp(T.hold, T.part, 0.75), 'Follow-through', 'They settle downward with a fine pearl dust.'],
    [T.part + 90 * P.speed, 'Settle', 'The last fragments fade.'],
  ].map(([t, label, note]) => ({ t, label, note }));
};

/** Glazed porcelain petal pointing along +x from the origin. */
function petal(ctx, len, wid, color, glaze, alpha) {
  if (alpha <= 0.01 || len <= 0.5) return;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(len * 0.25, -wid, len * 0.8, -wid * 0.95, len, 0);
  ctx.bezierCurveTo(len * 0.8, wid * 0.95, len * 0.25, wid, 0, 0);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, 0, len, 0);
  g.addColorStop(0, mix(color, INK, 0.16)); g.addColorStop(0.45, color); g.addColorStop(1, mix(color, '#ffffff', 0.38));
  ctx.fillStyle = g; ctx.fill();
  ctx.lineWidth = 1; ctx.strokeStyle = mix(color, INK, 0.42); ctx.stroke();
  // Painted midrib and a crisp glaze streak.
  ctx.strokeStyle = mix(color, INK, 0.3); ctx.lineWidth = 0.8; ctx.globalAlpha = alpha * 0.6;
  ctx.beginPath(); ctx.moveTo(len * 0.12, 0); ctx.quadraticCurveTo(len * 0.5, wid * 0.08, len * 0.82, 0); ctx.stroke();
  if (glaze > 0) {
    ctx.globalAlpha = alpha * glaze; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, wid * 0.22); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(len * 0.35, -wid * 0.45); ctx.quadraticCurveTo(len * 0.62, -wid * 0.6, len * 0.82, -wid * 0.3); ctx.stroke();
  }
}

export function prepare(scene, P) {
  const line = scene.lines[0]; const F = frame(line); const r = rng(19); const s = line.s;
  const flowers = line.cells.map((c, k) => ({
    ...c, k, x: F.xOf(k), spin: (k % 2 ? 1 : -1) * 0.25 + (r() - 0.5) * 0.2,
    petals: Array.from({ length: P.petals }, (_, i) => ({ a: -Math.PI / 2 + (i / P.petals) * TAU, vx: (r() - 0.5) * s * 0.6, fall: s * P.drift * (0.7 + r() * 0.5), turn: (r() - 0.5) * 2.4, lag: r() * 0.25 })),
    seams: Array.from({ length: 3 }, () => ({ a: r() * TAU, l: 0.35 + r() * 0.12, bend: (r() - 0.5) * 0.4 })),
    dust: Array.from({ length: Math.round(6 * P.dust) }, () => ({ x: (r() - 0.5) * s, y: (r() - 0.5) * s * 0.6, vy: s * (0.4 + r() * 0.6), col: PEARL[Math.floor(r() * PEARL.length)] })),
  }));
  return { line, F, T: timing(P), flowers };
}

export function render(ctx, t, st, scene, P) {
  const { line, F, T, flowers } = st; const s = line.s;
  F.enter(ctx);
  for (const f of flowers) {
    const L = t - f.k * P.stagger;
    const press = env(L, 0, T.press * 0.6, T.press * 0.7, T.press);
    const seam = seg(L, T.press, T.press + T.seam);
    const open = seg(L, T.press + T.seam, T.press + T.seam + T.open);
    const part = seg(t, T.hold + f.k * 18, T.part);
    // The block: presses, takes seams, then gives way to its petals.
    if (open < 1) {
      ctx.save(); ctx.translate(f.x, 0); F.upright(ctx);
      enamelBlock(ctx, 0, 0, s, f.color, { sx: 1 + press * 0.05, sy: 1 - press * 0.07, alpha: 1 - easeIn(open) });
      if (seam > 0) {
        ctx.globalAlpha = 1 - open; ctx.lineCap = 'round';
        for (const sm of f.seams) {
          const l = s * sm.l * easeOut(seam);
          const ex = Math.cos(sm.a) * l; const ey = Math.sin(sm.a) * l; const mx = Math.cos(sm.a + sm.bend) * l * 0.5; const my = Math.sin(sm.a + sm.bend) * l * 0.5;
          ctx.strokeStyle = mix(f.color, INK, 0.4); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(mx, my, ex, ey); ctx.stroke();
          ctx.strokeStyle = '#fffaf0'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(mx, my, ex, ey); ctx.stroke();
        }
      }
      ctx.restore();
    }
    if (open <= 0) continue;
    const e = easeOutBack(open, 1.2);
    const len = s * P.size * e; const wid = len * 0.42;
    const alphaAll = 1 - seg(part, 0.75, 1);
    // Back layer: offset petals, a shade deeper, slightly larger (overlap gives depth).
    const layers = P.layers ? [[Math.PI / P.petals, 1.08, mix(f.color, INK, 0.1)], [0, 1, f.color]] : [[0, 1, f.color]];
    for (const [off, scale, col] of layers) {
      for (const p of f.petals) {
        const pe = easeIn(seg(part, p.lag, 1));
        const a = p.a + off + f.spin * (1 - open) * 2 + p.turn * pe;
        const px = f.x + Math.cos(p.a + off) * len * 0.15 * pe * 4 + p.vx * pe;
        const py = Math.sin(p.a + off) * len * 0.15 * pe * 4 + p.fall * pe;
        ctx.save(); ctx.translate(px, py); F.upright(ctx); ctx.rotate(a);
        petal(ctx, len * scale * (1 - 0.35 * pe), wid * scale * (1 - 0.35 * pe), col, P.glaze, alphaAll * (1 - pe * 0.6));
        ctx.restore();
      }
    }
    // Pearl centre.
    const cA = alphaAll * (1 - seg(part, 0, 0.4));
    if (cA > 0) {
      ctx.globalAlpha = cA; ctx.fillStyle = '#fff6e6'; ctx.strokeStyle = mix(f.color, INK, 0.4); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(f.x, 0, s * 0.11 * e, 0, TAU); ctx.fill(); ctx.stroke();
      ctx.fillStyle = mix(PEARL[f.k % PEARL.length], f.color, 0.3); ctx.beginPath(); ctx.arc(f.x + s * 0.02, s * 0.02, s * 0.06 * e, 0, TAU); ctx.fill();
    }
    // Fine pearlescent dust as the petals part.
    if (part > 0) for (const d of f.dust) {
      const a = env(part, 0, 0.15, 0.6, 1) * alphaAll;
      ctx.globalAlpha = a; ctx.fillStyle = mix(d.col, INK, 0.12);
      ctx.fillRect(f.x + d.x - 1.2, d.y + d.vy * part - 1.2, 2.4, 2.4);
    }
  }
  // A single glint as the border completes.
  const g = env(t, T.bloomed - 40, T.bloomed + 40, T.bloomed + 80, T.bloomed + 260);
  if (g > 0) sparkle(ctx, F.xOf(5) + s * 0.25, -s * 0.35, s * 0.42 * g, g, '#ffffff', 0);
  F.leave(ctx);
  ctx.globalAlpha = 1;
}

export default { id: 'pastel-b', label: 'B · Porcelain Petalwork', kind: 'concept', supports: ['single'], params, presets, duration, keyframes, prepare, render };
