// Concept A (light) — Luminous Sweep.
// One crisp edge of light travels the line and erases the blocks as it
// passes. Primary: the leading edge (narrow, coloured, white filament core).
// Secondary: directional sparks shed backward from the edge, and a coloured
// trail band behind it. Ambient: a thin afterglow that lingers on the line.
// Pace: a short gather, an accelerating pass, a soft flare at the far end.

import { TAU, mix, seg, env, lerp, rng, premium, expoOut, quadIn, vivid, glowSprite, spark, glint, drawSprite, enamelBlock, frame, colorAt } from './light-kit.js';

export const params = [
  { key: 'pass', label: 'Pass time', unit: 'ms', min: 180, max: 520, step: 20, def: 300 },
  { key: 'accel', label: 'Acceleration', min: 0, max: 1, step: 0.05, def: 0.55 },
  { key: 'edge', label: 'Edge brightness', min: 0.3, max: 1.2, step: 0.05, def: 0.9 },
  { key: 'trail', label: 'Trail length', unit: '× cell', min: 0.5, max: 4, step: 0.25, def: 2.25 },
  { key: 'sparks', label: 'Sparks per block', min: 0, max: 8, step: 1, def: 4 },
  { key: 'afterglow', label: 'Afterglow', min: 0, max: 1, step: 0.05, def: 0.6 },
  { key: 'speed', label: 'Overall pace', min: 0.6, max: 1.5, step: 0.05, def: 1 },
];
export const presets = { Default: {}, 'Snappy': { pass: 220, accel: 0.8, trail: 1.5, afterglow: 0.4 }, 'Long light': { pass: 420, trail: 3.5, sparks: 6, afterglow: 0.9 } };

function timing(P) {
  const k = P.speed;
  const T = { gather: 70 * k, pass: P.pass * k };
  T.passEnd = T.gather + T.pass; T.flare = T.passEnd + 140 * k; T.end = T.passEnd + 420 * k;
  return T;
}
export const duration = (P) => timing(P).end;
export const keyframes = (P) => { const T = timing(P); return [[T.gather * 0.8, 'Gather', 'The line brightens for a beat.'], [T.gather + T.pass * 0.25, 'Edge', 'A crisp edge of light starts across.'], [T.gather + T.pass * 0.6, 'Erase', 'Blocks vanish as the edge passes, shedding sparks.'], [T.passEnd - 10, 'Finish', 'The edge reaches the end at full speed.'], [T.passEnd + 90 * P.speed, 'Flare', 'A soft flare and the last sparks.'], [T.passEnd + 260 * P.speed, 'Afterglow', 'A thin line of coloured light lingers.']].map(([t, label, note]) => ({ t, label, note })); };

export function prepare(scene, P) {
  const line = scene.lines[0]; const F = frame(line); const r = rng(5); const s = line.s; const T = timing(P);
  const half = line.len / 2 + s * 0.55;
  // Position of the edge over time: an accelerating pass that eases in at the very end.
  const posAt = (t) => { const u = seg(t, T.gather, T.passEnd); const e = lerp(premium(u), quadIn(u) * 0.8 + u * 0.2, P.accel); return lerp(-half, half, e); };
  const sparks = [];
  line.cells.forEach((c, k) => {
    const x = F.xOf(k);
    // The time the edge crosses this block, found by bisection on posAt.
    let lo = T.gather; let hi = T.passEnd; for (let i = 0; i < 16; i++) { const m = (lo + hi) / 2; if (posAt(m) < x) lo = m; else hi = m; }
    c.cross = lo;
    for (let j = 0; j < P.sparks; j++) {
      // Shed behind the edge in a narrow cone, at uneven angles and speeds so no pattern repeats.
      const a = Math.PI + (r() - 0.5) * 1.1 + (r() - 0.5) * 0.4; const v = 120 + r() * 300;
      sparks.push({ x: x + (r() - 0.5) * s * 0.6, y: (r() - 0.5) * s * 0.7, t0: c.cross + r() * 40, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7, life: 200 + r() * 260, col: vivid(c.color), w: 0.9 + r() * 1.3, len: 0.4 + r() * 0.8 });
    }
  });
  return { line, F, T, half, posAt, sparks };
}

export function render(ctx, t, st, scene, P) {
  const { line, F, T, half, posAt } = st; const s = line.s;
  F.enter(ctx);
  const head = posAt(t); const passing = t >= T.gather && t <= T.passEnd;
  const headCol = vivid(colorAt(line, (head + half) / (half * 2)));
  // Blocks: a short gather (brighten), then each is erased the moment the edge reaches it.
  line.cells.forEach((c, k) => {
    const x = F.xOf(k);
    const gather = env(t, 0, T.gather * 0.7, T.gather, c.cross);
    const gone = seg(t, c.cross - 10, c.cross + 50);
    if (gone >= 1) return;
    ctx.save(); ctx.translate(x, 0); F.upright(ctx);
    enamelBlock(ctx, 0, 0, s, mix(c.color, '#ffffff', 0.18 * gather + 0.35 * gone), { sx: F.vert ? 1 : 1 - 0.35 * gone, sy: F.vert ? 1 - 0.35 * gone : 1, alpha: 1 - gone });
    ctx.restore();
  });
  // Trail: a coloured band behind the edge, tapering in height and opacity.
  if (t >= T.gather) {
    const tailLen = s * P.trail * (passing ? 1 : 1 - seg(t, T.passEnd, T.flare));
    const x1 = Math.min(head, half); const x0 = Math.max(-half, x1 - tailLen);
    if (x1 - x0 > 1) {
      const g = ctx.createLinearGradient(x0, 0, x1, 0);
      g.addColorStop(0, mix(vivid(colorAt(line, (x0 + half) / (half * 2))), '#ffffff', 0).slice(0, 7) + '00');
      g.addColorStop(0.7, vivid(colorAt(line, (lerp(x0, x1, 0.7) + half) / (half * 2))) + '66');
      g.addColorStop(1, headCol + 'cc');
      ctx.globalAlpha = 1; ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(x0, 0); ctx.quadraticCurveTo(lerp(x0, x1, 0.6), -s * 0.2, x1, -s * 0.42); ctx.lineTo(x1, s * 0.42); ctx.quadraticCurveTo(lerp(x0, x1, 0.6), s * 0.2, x0, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = headCol; ctx.globalAlpha = 0.9; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(lerp(x0, x1, 0.25), 0); ctx.lineTo(x1, 0); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lerp(x0, x1, 0.5), 0); ctx.lineTo(x1, 0); ctx.stroke();
    }
  }
  // Secondary: sparks shed backward from the edge.
  for (const sp of st.sparks) {
    const a = (t - sp.t0) / sp.life; if (a < 0 || a > 1) continue;
    const dt = (t - sp.t0) / 1000; const drag = 1 - Math.exp(-6 * dt);
    const x = sp.x + (sp.vx / 6) * drag; const y = sp.y + (sp.vy / 6) * drag;
    const spd = Math.exp(-6 * dt);
    spark(ctx, x, y, sp.vx * spd, sp.vy * spd, (3 + 16 * spd) * sp.len, sp.w, sp.col, 1 - a);
  }
  // Primary: the leading edge itself, brilliant but controlled.
  const on = env(t, T.gather - 30, T.gather + 30, T.passEnd, T.flare);
  if (on > 0) {
    const flare = seg(t, T.passEnd, T.flare); const hx = Math.min(head, half);
    drawSprite(ctx, glowSprite(headCol, 0.3), hx, 0, s * (1.5 + flare * 1.4), { alpha: on * 0.5 * P.edge });
    const h = s * (0.62 + 0.2 * flare); const w = s * 0.08 * (1 - flare * 0.5);
    ctx.globalAlpha = on * P.edge; ctx.fillStyle = headCol;
    ctx.beginPath(); ctx.ellipse(hx, 0, w, h, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.ellipse(hx, 0, w * 0.35, h * 0.85, 0, 0, TAU); ctx.fill();
    if (flare > 0) glint(ctx, hx, 0, s * 0.55 * (1 - flare), '#ffffff', 1 - flare);
  }
  // Ambient: a thin afterglow along the line, fading from the start of the line onward.
  if (P.afterglow > 0 && t > T.gather) {
    for (let k = 0; k < 8; k++) {
      const c = line.cells[k]; const x = F.xOf(k);
      const a = env(t, c.cross, c.cross + 40, c.cross + 120, c.cross + 380) * P.afterglow;
      if (a <= 0) continue;
      ctx.globalAlpha = a; ctx.fillStyle = vivid(c.color);
      ctx.fillRect(x - st.F.pitch / 2, -1.2, st.F.pitch + 0.5, 2.4);
    }
  }
  F.leave(ctx);
  ctx.globalAlpha = 1;
}

export default { id: 'pastel-l1', label: 'A · Luminous Sweep', kind: 'concept', supports: ['single'], params, presets, duration, keyframes, prepare, render };
