// Concept B (light) — Stardust Dissolve.
// The blocks kindle from within, then dissolve into fine luminous dust. Each
// block is a 5x5 field of grains released by a front that runs diagonally
// across it (top-left first) and along the line from the centre outward, so
// the dissolution is coordinated, not random. Released grains share one gentle
// flow (up and outward, curling slightly) with varied size, brightness and
// depth: most are small coloured motes, a few are crisp glints, and a soft
// coloured haze carries the atmosphere. Short trails fade behind the brightest.

import { TAU, mix, seg, env, lerp, rng, premium, expoOut, vivid, glowSprite, spark, glint, drawSprite, roundRectPath, enamelBlock, frame } from '../art/light-kit.js';

const G = 6; // grains per side

export const params = [
  { key: 'kindle', label: 'Inner light', min: 0, max: 1.2, step: 0.05, def: 0.85 },
  { key: 'front', label: 'Dissolve front time', unit: 'ms', min: 120, max: 400, step: 10, def: 220 },
  { key: 'spread', label: 'Centre-out stagger', unit: 'ms', min: 0, max: 50, step: 2, def: 22 },
  { key: 'rise', label: 'Drift distance', unit: '× cell', min: 0.4, max: 2.5, step: 0.1, def: 1.3 },
  { key: 'curl', label: 'Flow curl', min: 0, max: 1, step: 0.05, def: 0.45 },
  { key: 'glints', label: 'Sharp glints', min: 0, max: 0.4, step: 0.02, def: 0.14 },
  { key: 'haze', label: 'Soft haze', min: 0, max: 1, step: 0.05, def: 0.55 },
  { key: 'trails', label: 'Trails', min: 0, max: 1, step: 0.05, def: 0.6 },
  { key: 'speed', label: 'Overall pace', min: 0.6, max: 1.5, step: 0.05, def: 1 },
];
export const presets = { Default: {}, 'Quick shimmer': { front: 150, spread: 14, rise: 0.9, haze: 0.35, speed: 0.85 }, 'Slow nebula': { front: 320, rise: 2, curl: 0.8, haze: 0.85, speed: 1.2 } };

function timing(P) {
  const k = P.speed;
  const T = { kindle: 110 * k, front: P.front * k, life: 520 * k };
  T.lastStart = T.kindle + 3.5 * P.spread * k;
  T.end = T.lastStart + T.front + T.life + 60 * k;
  return T;
}
export const duration = (P) => timing(P).end;
export const keyframes = (P) => { const T = timing(P); return [[T.kindle * 0.8, 'Kindle', 'The blocks light up from within.'], [T.kindle + T.front * 0.35, 'Dissolve', 'A diagonal front releases them as fine dust, centre first.'], [T.kindle + T.front * 0.85, 'Lift', 'The dust rises in one shared flow.'], [T.lastStart + T.front + T.life * 0.3, 'Disperse', 'Grains of different size and depth spread and curl.'], [T.lastStart + T.front + T.life * 0.65, 'Trails', 'Glints and short trails fade.'], [T.end - 40, 'Settle', 'Nothing left but a faint haze.']].map(([t, label, note]) => ({ t, label, note })); };

export function prepare(scene, P) {
  const line = scene.lines[0]; const F = frame(line); const r = rng(13); const s = line.s; const T = timing(P);
  const grains = []; const blocks = [];
  line.cells.forEach((c, k) => {
    const x0 = F.xOf(k); const start = T.kindle + Math.abs(k - 3.5) * P.spread * P.speed;
    const out = Math.sign(k - 3.5) || 1; // flow leans away from the centre
    blocks.push({ c, x: x0, start });
    for (let gy = 0; gy < G; gy++) for (let gx = 0; gx < G; gx++) {
      const u = (gx + 0.5) / G - 0.5; const v = (gy + 0.5) / G - 0.5;
      const front = (u + v + 1) / 2; // matches the straight diagonal front (0 at top-left)
      const kind = r() < P.glints ? 'glint' : 'mote';
      grains.push({
        k, gx, gy, x: x0 + u * s, y: v * s, at: start + front * T.front + r() * 25,
        dx: out * s * (0.15 + r() * 0.5) * P.rise, dy: -s * (0.5 + r() * 0.9) * P.rise, ph: r() * TAU,
        size: s / G * (kind === 'glint' ? 1.9 : 0.4 + r() * 0.6), depth: 0.55 + r() * 0.45, kind,
        col: mix(vivid(c.color), '#ffffff', r() * 0.35), life: T.life * (0.75 + r() * 0.5),
      });
    }
  });
  return { line, F, T, grains, blocks };
}

/** Grain position along its flow at local age a (0..1): ease-out drift, gentle sideways curl. */
function grainPos(g, a, P) {
  const e = expoOut(a) * 0.65 + a * 0.35;
  return { x: g.x + g.dx * e + Math.sin(a * 4 + g.ph) * 4 * P.curl, y: g.y + g.dy * e };
}

export function render(ctx, t, st, scene, P) {
  const { line, F, T, grains, blocks } = st; const s = line.s; const cell = s / G;
  F.enter(ctx);
  // Blocks, clipped to the grains not yet released; their light grows from the centre.
  for (const b of blocks) {
    // A straight diagonal front (top-left to bottom-right) eats the block; its edge glows in the block's colour.
    const f = seg(t, b.start, b.start + T.front); if (f >= 1) continue;
    const kin = seg(t, 0, T.kindle) * P.kindle;
    const d = lerp(-s, s, f); // front position along the diagonal (x + y)
    ctx.save(); ctx.translate(b.x, 0); F.upright(ctx);
    ctx.save(); ctx.beginPath(); ctx.moveTo(d + s, -s); ctx.lineTo(s * 2, -s); ctx.lineTo(s * 2, s * 2); ctx.lineTo(-s, s * 2); ctx.lineTo(-s, d + s); ctx.closePath(); ctx.clip();
    enamelBlock(ctx, 0, 0, s, mix(b.c.color, '#ffffff', 0.12 * kin), {});
    if (kin > 0) { ctx.globalAlpha = 1; drawSprite(ctx, glowSprite(mix(vivid(b.c.color), '#ffffff', 0.45), 0.25), 0, 0, s * 1.1 * (0.6 + 0.4 * kin), { alpha: 0.85 * kin }); }
    ctx.restore();
    if (f > 0) { // the lit edge of the front, clipped to the block
      ctx.save(); roundRectPath(ctx, s, s, s * 0.22); ctx.clip();
      ctx.globalAlpha = 1; ctx.lineCap = 'round'; ctx.strokeStyle = vivid(b.c.color); ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(d - s * 0.5 - s, s * 0.5 + s); ctx.lineTo(d + s * 0.5 + s, -s * 0.5 - s); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
    }
    ctx.restore();
  }
  // Ambient haze: one soft coloured glow per block that blooms with its release and fades.
  if (P.haze > 0) for (const b of blocks) {
    const a = env(t, b.start, b.start + T.front * 0.6, b.start + T.front, b.start + T.front + T.life);
    if (a > 0) drawSprite(ctx, glowSprite(vivid(b.c.color), 0.15), b.x, -s * 0.35 * seg(t, b.start, b.start + T.front + T.life), s * 1.9, { alpha: a * 0.32 * P.haze });
  }
  // Released grains: back (dimmer, smaller) to front.
  for (const g of grains) {
    const a = (t - g.at) / g.life; if (a < 0 || a > 1) continue;
    const p = grainPos(g, a, P);
    const fade = (a < 0.08 ? a / 0.08 : 1) * (1 - a) * g.depth;
    if (g.kind === 'glint') {
      const tw = 0.6 + 0.4 * Math.sin(a * 20 + g.ph);
      glint(ctx, p.x, p.y, g.size * tw * (1 - a * 0.5), '#ffffff', fade);
      glint(ctx, p.x, p.y, g.size * 0.55 * tw, g.col, fade);
    } else {
      if (P.trails > 0 && g.depth > 0.8) { const q = grainPos(g, Math.max(0, a - 0.12), P); spark(ctx, p.x, p.y, p.x - q.x, p.y - q.y, Math.hypot(p.x - q.x, p.y - q.y), g.size * 0.9, g.col, fade * P.trails * 0.8); }
      ctx.globalAlpha = fade; ctx.fillStyle = g.col;
      const z = g.size * (1 - a * 0.6); ctx.beginPath(); ctx.arc(p.x, p.y, z / 2, 0, Math.PI * 2); ctx.fill();
    }
  }
  F.leave(ctx);
  ctx.globalAlpha = 1;
}

export default { id: 'pastel-l2', label: 'B · Stardust Dissolve', kind: 'concept', supports: ['single'], params, presets, duration, keyframes, prepare, render };
