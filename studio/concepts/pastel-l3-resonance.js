// Concept C (light) — Resonance.
// The board answers the player. The cleared blocks inhale together (a small
// synchronised swell and brighten), contract into luminous outlines, then
// release: outlines and a contour around the whole line expand crisply and
// fade, a softer secondary wave follows, and a highlight cascades outward
// across the neighbouring rows of the grid. Primary: the outlines' release.
// Secondary: the line contour and second wave. Ambient: the grid cascade.

import { TAU, mix, seg, env, lerp, rng, premium, expoOut, quadIn, vivid, glowSprite, spark, glint, drawSprite, roundRectPath, enamelBlock, frame } from '../art/light-kit.js';

export const params = [
  { key: 'inhale', label: 'Inhale (anticipation)', unit: 'ms', min: 60, max: 180, step: 10, def: 110 },
  { key: 'swell', label: 'Swell', min: 0, max: 0.12, step: 0.01, def: 0.06 },
  { key: 'release', label: 'Release size', unit: '× cell', min: 0.2, max: 1.2, step: 0.05, def: 0.55 },
  { key: 'contour', label: 'Line contour reach', unit: '× cell', min: 0.3, max: 2.5, step: 0.1, def: 0.9 },
  { key: 'wave2', label: 'Second wave', min: 0, max: 1, step: 0.05, def: 0.55 },
  { key: 'cascade', label: 'Grid cascade rows', min: 0, max: 7, step: 1, def: 3 },
  { key: 'cascadeStep', label: 'Cascade step', unit: 'ms', min: 20, max: 90, step: 5, def: 45 },
  { key: 'sparks', label: 'Sparks per block', min: 0, max: 4, step: 1, def: 2 },
  { key: 'speed', label: 'Overall pace', min: 0.6, max: 1.5, step: 0.05, def: 1 },
];
export const presets = { Default: {}, 'Quiet pulse': { swell: 0.04, release: 0.35, contour: 0.9, wave2: 0.3, cascade: 2, sparks: 0 }, 'Deep resonance': { release: 0.8, contour: 2.2, wave2: 0.9, cascade: 7, cascadeStep: 55 } };

function timing(P) {
  const k = P.speed;
  const T = { inhale: P.inhale * k, contract: 90 * k, release: 340 * k };
  T.releaseAt = T.inhale + T.contract; T.releaseEnd = T.releaseAt + T.release;
  T.wave2At = T.releaseAt + 90 * k;
  T.end = Math.max(T.releaseEnd, T.releaseAt + P.cascade * P.cascadeStep * k + 360 * k) + 60 * k;
  return T;
}
export const duration = (P) => timing(P).end;
export const keyframes = (P) => { const T = timing(P); return [[T.inhale * 0.85, 'Inhale', 'The blocks swell and brighten together.'], [T.inhale + T.contract * 0.7, 'Contract', 'They tighten into luminous outlines.'], [T.releaseAt + 40 * P.speed, 'Release', 'A crisp release: outlines and a line contour expand.'], [T.wave2At + 80 * P.speed, 'Second wave', 'A softer wave follows; the grid starts to answer.'], [T.releaseAt + P.cascadeStep * P.speed * 2.5, 'Cascade', 'A highlight ripples outward across neighbouring rows.'], [T.end - 60, 'Settle', 'The board is still again.']].map(([t, label, note]) => ({ t, label, note })); };

export function prepare(scene, P) {
  const line = scene.lines[0]; const F = frame(line); const r = rng(37); const T = timing(P);
  // Neighbouring grid cells by distance from the line (in rows for a row, columns for a column).
  const near = [];
  for (let i = 0; i < 64; i++) {
    const rr = Math.floor(i / 8); const cc = i % 8;
    const d = line.axis === 'h' ? Math.abs(rr - line.idx) : Math.abs(cc - line.idx);
    if (d >= 1 && d <= P.cascade) near.push({ i, d, ...scene.cell(i) });
  }
  const sparks = line.cells.flatMap((c, k) => Array.from({ length: P.sparks }, (_, j) => ({ x: F.xOf(k) + (r() - 0.5) * line.s * 0.6, side: j % 2 ? 1 : -1, v: 220 + r() * 200, a: (r() - 0.5) * 0.5, col: vivid(c.color), w: 1 + r() })));
  return { line, F, T, near, sparks };
}

export function render(ctx, t, st, scene, P) {
  const { line, F, T, near } = st; const s = line.s;
  // Ambient: the grid answers, row by row outward, with a soft coloured lift on each cell.
  if (P.cascade > 0) {
    const tone = vivid(line.cells[3].color);
    for (const n of near) {
      const at = T.releaseAt + n.d * P.cascadeStep * P.speed;
      const a = env(t, at, at + 60 * P.speed, at + 90 * P.speed, at + 360 * P.speed) * (1 - (n.d - 1) / (P.cascade + 1));
      if (a <= 0.01) continue;
      ctx.save(); ctx.translate(n.x, n.y); roundRectPath(ctx, n.s, n.s, n.s * 0.22);
      // Just the cell's edge catches the light: a fine coloured line on the side facing the line.
      ctx.globalAlpha = a * 0.08; ctx.fillStyle = tone; ctx.fill();
      ctx.globalAlpha = a * 0.9; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.strokeStyle = tone;
      const towards = line.axis === 'h' ? Math.sign(line.cy - n.y) : Math.sign(line.cx - n.x); const e = n.s * 0.5 - 1;
      ctx.beginPath(); if (line.axis === 'h') { ctx.moveTo(-e * 0.6, towards * e); ctx.lineTo(e * 0.6, towards * e); } else { ctx.moveTo(towards * e, -e * 0.6); ctx.lineTo(towards * e, e * 0.6); } ctx.stroke();
      ctx.restore();
    }
  }
  F.enter(ctx);
  const inhale = premium(seg(t, 0, T.inhale));
  const contract = premium(seg(t, T.inhale, T.releaseAt));
  const rel = seg(t, T.releaseAt, T.releaseEnd); const relE = expoOut(rel);
  // Secondary: a contour around the whole line expands crisply, then a softer second wave.
  for (const [at, strength, w] of [[T.releaseAt, 1, 2], [T.wave2At, P.wave2, 1.2]]) {
    const u = seg(t, at, at + T.release); if (u <= 0 || u >= 1 || strength <= 0) continue;
    const e = expoOut(u); const grow = s * P.contour * e;
    // Two fine contour lines parting above and below the line, tapering at their ends.
    const hh = s * 0.55 + grow; const hw = line.len / 2 + s * 0.4;
    ctx.lineCap = 'round';
    for (const side of [-1, 1]) {
      const g = ctx.createLinearGradient(-hw, 0, hw, 0);
      line.cells.forEach((c, k) => g.addColorStop(k / 7, vivid(c.color)));
      ctx.globalAlpha = (1 - u) * strength; ctx.strokeStyle = g; ctx.lineWidth = w * (1 - u * 0.5);
      ctx.beginPath(); ctx.moveTo(-hw * (1 - 0.15 * u), side * hh); ctx.lineTo(hw * (1 - 0.15 * u), side * hh); ctx.stroke();
    }
  }
  // Primary: blocks swell, contract to outlines, release.
  line.cells.forEach((c, k) => {
    const x = F.xOf(k); const col = vivid(c.color);
    ctx.save(); ctx.translate(x, 0); F.upright(ctx);
    if (t < T.releaseAt) {
      const sc = 1 + P.swell * inhale - 0.18 * contract;
      enamelBlock(ctx, 0, 0, s * sc, mix(c.color, '#ffffff', 0.08 * inhale), { alpha: 1 - contract });
      if (contract > 0) { // the outline it contracts into
        ctx.globalAlpha = contract; ctx.strokeStyle = col; ctx.lineWidth = 2.2; roundRectPath(ctx, s * sc, s * sc, s * sc * 0.22); ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.8; ctx.stroke();
      }
    } else if (rel < 1) {
      const sz = s * (0.82 + P.release * relE);
      ctx.globalAlpha = Math.pow(1 - rel, 1.3); ctx.strokeStyle = col; ctx.lineWidth = 2.2 * (1 - rel) + 0.6;
      roundRectPath(ctx, sz, sz, sz * 0.22); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.8; ctx.globalAlpha = Math.pow(1 - rel, 2); ctx.stroke();
    }
    ctx.restore();
  });
  // Sparks released perpendicular to the line.
  for (const sp of st.sparks) {
    const dt = (t - T.releaseAt) / 1000; if (dt < 0 || dt > 0.32) continue;
    const dr = 1 - Math.exp(-8 * dt); const vy = sp.side * sp.v; const vx = sp.v * sp.a;
    const x = sp.x + (vx / 8) * dr; const y = sp.side * s * 0.62 + (vy / 8) * dr; const spd = Math.exp(-8 * dt);
    spark(ctx, x, y, vx * spd, vy * spd, Math.min(3 + 12 * spd, 4 + (vy / 8) * dr * sp.side), sp.w, sp.col, 1 - dt / 0.32);
  }
  F.leave(ctx);
  ctx.globalAlpha = 1;
}

function roundRectPathAt(ctx, x, y, w, h, r) { ctx.save(); ctx.translate(x, y); roundRectPath(ctx, w, h, r); ctx.restore(); }

export default { id: 'pastel-l3', label: 'C · Resonance', kind: 'concept', supports: ['single'], params, presets, duration, keyframes, prepare, render };
