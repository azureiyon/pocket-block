// Concept A — Ascending Light.
// Feeling: weightless, an exhale. The line takes a small breath down, then
// each pearl lifts and turns into light, releasing a fine upward stream of
// champagne motes and a few narrow light threads. Motes rise on slow
// decelerating paths, sway more the higher they go, cool from champagne to
// lavender and thin out into the sky. Released centre-first.
// Primary: the rising threads and motes. Secondary: the pearls lifting and
// fading into light. Ambient: a faint lavender haze that drifts up after them.
// Direction: straight up in screen space, slow and decelerating (Soda's
// bubbles wobble and pop; these are fine streaks of light that dissolve).

import { TAU, mix, seg, env, lerp, rng, premium, expoOut, glowSprite, glint, drawSprite, pearlBlock, easeOutCubic, CHAMPAGNE, WARM_WHITE, LAVENDER, LAV_DEEP } from '../art/cloud-art.js';

export const params = [
  { key: 'stagger', label: 'Centre-out stagger', unit: 'ms', min: 0, max: 60, step: 2, def: 26 },
  { key: 'motes', label: 'Motes per block', min: 4, max: 24, step: 1, def: 13 },
  { key: 'threads', label: 'Light threads per block', min: 0, max: 4, step: 1, def: 2 },
  { key: 'rise', label: 'Rise height', unit: '× cell', min: 1, max: 4, step: 0.1, def: 2.4 },
  { key: 'sway', label: 'Sway', min: 0, max: 1, step: 0.05, def: 0.5 },
  { key: 'haze', label: 'Lavender haze', min: 0, max: 1, step: 0.05, def: 0.5 },
  { key: 'speed', label: 'Overall pace', min: 0.6, max: 1.5, step: 0.05, def: 1 },
];
export const presets = { Default: {}, 'Fine and quick': { motes: 9, threads: 1, rise: 1.8, speed: 0.8 }, 'Long ascent': { motes: 18, threads: 3, rise: 3.4, sway: 0.7, speed: 1.2 } };

function timing(P) {
  const k = P.speed;
  const T = { dip: 110 * k, lift: 300 * k, emit: 240 * k, life: 760 * k };
  T.lastRelease = T.dip + 3.5 * P.stagger * k;
  T.end = T.lastRelease + T.emit + T.life * 1.15 + 40;
  return T;
}
export const duration = (P) => timing(P).end;
export const keyframes = (P) => {
  const T = timing(P); const k = P.speed;
  return [
    [T.dip * 0.75, 'Breath', 'The line sinks a touch and its gold rims warm.'],
    [T.dip + 90 * k, 'Release', 'Centre pearls lift and kindle; the first threads of light shoot up.'],
    [T.dip + 200 * k, 'Stream', 'Every pearl is streaming fine champagne motes upward.'],
    [T.lastRelease + T.lift * 0.85, 'Climax', 'The pearls are gone: a curtain of rising light over the line.'],
    [T.lastRelease + T.emit + T.life * 0.35, 'Drift', 'Motes slow, sway wider and cool towards lavender.'],
    [T.lastRelease + T.emit + T.life * 0.7, 'Disperse', 'They thin out into the sky with a last few twinkles.'],
    [T.end - 30, 'Settle', 'A clear line and a quiet board.'],
  ].map(([t, label, note]) => ({ t, label, note }));
};

export function prepare(scene, P) {
  const line = scene.lines[0]; const r = rng(31); const s = line.s; const T = timing(P); const k = P.speed;
  const blocks = line.cells.map((c, i) => ({ ...c, rel: T.dip + Math.abs(i - 3.5) * P.stagger * k, out: Math.sign(i - 3.5) || (r() < 0.5 ? -1 : 1) }));
  const motes = []; const threads = [];
  for (const b of blocks) {
    for (let j = 0; j < P.motes; j++) {
      const born = b.rel + 30 * k + (j / P.motes) * T.emit + r() * 30 * k;
      motes.push({
        x: b.x + (r() - 0.5) * s * 0.7, y: b.y + (r() - 0.3) * s * 0.5, born, life: T.life * (0.65 + r() * 0.5),
        h: s * P.rise * (0.55 + r() * 0.65), drift: b.out * s * (0.05 + r() * 0.35), ph: r() * TAU, sw: 0.6 + r() * 0.8,
        size: 0.8 + r() * 1.3, col: mix(CHAMPAGNE, b.color, r() * 0.35), tw: r() < 0.18,
      });
    }
    for (let j = 0; j < P.threads; j++) {
      threads.push({ x: b.x + (r() - 0.5) * s * 0.6, y: b.y - s * 0.1, born: b.rel + (20 + r() * 140) * k, life: (380 + r() * 220) * k, h: s * P.rise * (0.45 + r() * 0.6), col: mix(CHAMPAGNE, b.color, 0.2) });
    }
  }
  return { line, T, blocks, motes, threads };
}

/** Mote position at local age a (0..1): decelerating rise, sway that widens with height. */
function motePos(m, a, P) {
  const e = easeOutCubic(a) * 0.8 + a * 0.2;
  const sway = Math.sin(a * Math.PI * 1.6 * m.sw + m.ph) * m.h * 0.12 * P.sway * e;
  return { x: m.x + m.drift * e + sway, y: m.y - m.h * e };
}

export function render(ctx, t, st, scene, P) {
  const { line, T, blocks, motes, threads } = st; const s = line.s; const k = P.speed;
  // Ambient: lavender haze rising behind everything (shadow to the warm light).
  if (P.haze > 0) for (const b of blocks) {
    const u = seg(t, b.rel, b.rel + T.life); const a = env(t, b.rel, b.rel + 160 * k, b.rel + 300 * k, b.rel + T.life) * P.haze;
    if (a > 0.01) drawSprite(ctx, glowSprite(LAVENDER, 0.2), b.x, b.y - s * 1.6 * easeOutCubic(u), s * 1.9, { alpha: a * 0.22 });
  }
  // Secondary: pearls breathe down, then lift and kindle into light.
  for (const b of blocks) {
    const breath = env(t, 0, T.dip * 0.6, T.dip * 0.8, b.rel + 60 * k);
    const u = seg(t, b.rel, b.rel + T.lift); if (u >= 1) continue;
    const lift = s * (0.3 * premium(u)) - s * 0.05 * breath;
    const glow = Math.max(breath * 0.35, Math.min(1, u * 2.2));
    pearlBlock(ctx, b.x, b.y, s, b.color, { lift, glow, clear: premium(u), size: s * (1 - 0.32 * premium(u)), alpha: 1 - premium(seg(u, 0.35, 0.9)), rim: 1 });
    // The kindling light at its core.
    const kc = env(u, 0.15, 0.45, 0.6, 1);
    if (kc > 0) drawSprite(ctx, glowSprite(CHAMPAGNE, 0.35), b.x, b.y - lift, s * 0.9, { alpha: kc * 0.6 });
  }
  // Primary 1: narrow light threads shooting up and detaching.
  ctx.lineCap = 'round';
  for (const th of threads) {
    const a = (t - th.born) / th.life; if (a < 0 || a > 1) continue;
    const head = th.y - th.h * expoOut(a); const tail = th.y - th.h * expoOut(Math.max(0, a - 0.16)) * 0.98;
    const fade = 1 - seg(a, 0.55, 1);
    const g = ctx.createLinearGradient(0, tail, 0, head);
    g.addColorStop(0, 'rgba(165,142,226,0)'); g.addColorStop(0.55, th.col); g.addColorStop(1, WARM_WHITE);
    ctx.globalAlpha = fade * 0.9; ctx.strokeStyle = g; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(th.x, tail); ctx.lineTo(th.x, head); ctx.stroke();
    ctx.globalAlpha = fade; ctx.fillStyle = WARM_WHITE; ctx.beginPath(); ctx.arc(th.x, head, 1.3, 0, TAU); ctx.fill();
  }
  // Primary 2: fine motes with short trails, champagne heads cooling to lavender tails.
  for (const m of motes) {
    const a = (t - m.born) / m.life; if (a < 0 || a > 1) continue;
    const p = motePos(m, a, P); const q = motePos(m, Math.max(0, a - 0.07), P);
    const fade = seg(a, 0, 0.08) * (1 - seg(a, 0.45, 1));
    const col = mix(m.col, LAVENDER, seg(a, 0.35, 1) * 0.75);
    const g = ctx.createLinearGradient(q.x, q.y, p.x, p.y);
    g.addColorStop(0, 'rgba(95,76,159,0)'); g.addColorStop(1, col);
    ctx.globalAlpha = fade * 0.75; ctx.strokeStyle = g; ctx.lineWidth = m.size;
    ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    ctx.globalAlpha = fade; ctx.fillStyle = a < 0.4 ? mix(WARM_WHITE, col, a * 1.5) : col;
    ctx.beginPath(); ctx.arc(p.x, p.y, m.size * (1 - a * 0.3), 0, TAU); ctx.fill();
    if (m.tw) { const tw = env(a, 0.5, 0.62, 0.7, 0.85); if (tw > 0) glint(ctx, p.x, p.y, s * 0.16 * tw, WARM_WHITE, tw); }
  }
  ctx.globalAlpha = 1;
}

export default { id: 'cloud-a', label: 'A · Ascending Light', kind: 'concept', supports: ['single'], params, presets, duration, keyframes, prepare, render };
