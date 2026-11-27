// Concept A — Champagne Fizz.
// Feeling: the first crack of a cold bottle; crisp, bright, refreshing.
// Nucleation sites wake inside each soda (tiny bubbles shimmering at fixed
// points), the soda clears to tinted glass, and from every site a fine
// stream of carbonation lifts straight up. The bubbles accelerate as they
// rise (buoyancy), grow a little, wobble, shimmer and pop one by one at
// different heights. A few larger transparent bubbles rise more slowly
// alongside for contrast and pop with a tiny splash of droplets.
// Primary: the coordinated vertical streams. Secondary: the soda clearing
// and its foam cap thinning. Ambient: individual pops and the odd droplet.
// Direction: straight up, accelerating (Cloud's motes decelerate and drift;
// these are buoyant bubbles that speed up and pop).

import { TAU, mix, seg, env, lerp, rng, premium, expoOut, quadIn, sodaBlock, rimOf, bubble, fizz, droplet, pop, WHITE } from '../art/soda-art.js';

export const params = [
  { key: 'streams', label: 'Streams per block', min: 1, max: 4, step: 1, def: 2 },
  { key: 'density', label: 'Bubbles per stream', min: 4, max: 18, step: 1, def: 12 },
  { key: 'rise', label: 'Rise height', unit: '× cell', min: 1, max: 4, step: 0.1, def: 2.8 },
  { key: 'big', label: 'Large bubbles (whole line)', min: 0, max: 8, step: 1, def: 4 },
  { key: 'stagger', label: 'Centre-out stagger', unit: 'ms', min: 0, max: 50, step: 2, def: 20 },
  { key: 'speed', label: 'Overall pace', min: 0.6, max: 1.5, step: 0.05, def: 1 },
];
export const presets = { Default: {}, 'Fine bead': { streams: 3, density: 12, big: 2, rise: 2.8 }, 'Pop!': { streams: 1, density: 6, big: 6, speed: 0.85 } };

function timing(P) {
  const k = P.speed;
  const T = { wake: 120 * k, clear: 260 * k, emit: 340 * k, life: 560 * k };
  T.lastRel = T.wake + 3.5 * P.stagger * k;
  T.end = T.lastRel + T.emit + T.life + 120 * k;
  return T;
}
export const duration = (P) => timing(P).end;
export const keyframes = (P) => {
  const T = timing(P); const k = P.speed;
  return [
    [T.wake * 0.8, 'Nucleation', 'Tiny bubbles wake and shimmer at points inside each soda.'],
    [T.wake + 110 * k, 'Release', 'The soda clears to glass; fine streams lift off, centre first.'],
    [T.wake + 260 * k, 'Streams', 'Every block streams carbonation straight up, accelerating.'],
    [T.lastRel + T.emit * 0.9, 'Climax', 'A curtain of fizz over the line; larger bubbles rise among it.'],
    [T.lastRel + T.emit + T.life * 0.4, 'Pops', 'Bubbles pop one by one at different heights.'],
    [T.lastRel + T.emit + T.life * 0.8, 'Splash', 'The large bubbles pop with a tiny splash of droplets.'],
    [T.end - 30, 'Settle', 'A clean, refreshed line.'],
  ].map(([t, label, note]) => ({ t, label, note }));
};

export function prepare(scene, P) {
  const line = scene.lines[0]; const r = rng(97); const s = line.s; const T = timing(P); const k = P.speed;
  const blocks = line.cells.map((c, i) => ({ ...c, rel: T.wake + Math.abs(i - 3.5) * P.stagger * k, rim: rimOf(c.color) }));
  const sites = []; const fine = []; const big = [];
  for (const b of blocks) for (let j = 0; j < P.streams; j++) {
    const sx = b.x + ((j + 0.5) / P.streams - 0.5) * s * 0.62 + (r() - 0.5) * s * 0.08; const sy = b.y + s * (0.15 + r() * 0.2);
    sites.push({ x: sx, y: sy, rim: b.rim, rel: b.rel, ph: r() * TAU });
    for (let n = 0; n < P.density; n++) {
      fine.push({ x: sx, y: sy, born: b.rel + (n / P.density) * T.emit + r() * 20 * k, h: s * P.rise * (0.55 + r() * 0.6), life: T.life * (0.8 + r() * 0.45), r0: 1.5 + r() * 1.1, wob: (r() - 0.5) * s * 0.06, ph: r() * TAU, rim: b.rim, popAt: 0.72 + r() * 0.25 });
    }
  }
  for (let n = 0; n < P.big; n++) {
    const b = blocks[Math.floor(((n + 0.5) / P.big) * 8)];
    big.push({ x: b.x + (r() - 0.5) * s * 0.3, y: b.y, born: b.rel + 80 * k + r() * 120 * k, h: s * P.rise * (0.45 + r() * 0.3), life: T.life * 1.3, r: s * (0.16 + r() * 0.08), ph: r() * TAU, rim: b.rim, drops: Array.from({ length: 3 }, (_, i) => ({ a: -Math.PI / 2 + (i - 1) * 0.7 + (r() - 0.5) * 0.3, v: s * (0.25 + r() * 0.2) })) });
  }
  return { line, T, blocks, sites, fine, big };
}

export function render(ctx, t, st, scene, P) {
  const { line, T, blocks, sites, fine, big } = st; const s = line.s; const k = P.speed;
  // Secondary: the sodas clear to tinted glass while their foam thins.
  for (const b of blocks) {
    const u = premium(seg(t, b.rel, b.rel + T.clear)); const gone = seg(t, b.rel + T.clear * 0.5, b.rel + T.clear + 120 * k);
    if (gone >= 1) continue;
    sodaBlock(ctx, b.x, b.y, s, b.color, { clear: u, foam: 1 - u, alpha: 1 - premium(gone), bubbles: 1 - u });
  }
  // Nucleation sites shimmer before and while they stream.
  for (const n of sites) {
    const a = env(t, n.rel - 90 * k, n.rel, n.rel + T.emit * 0.8, n.rel + T.emit);
    if (a > 0.01) fizz(ctx, n.x, n.y, 1.6 + Math.sin(t / (40 * k) + n.ph) * 0.5, n.rim, a);
  }
  // Primary: fine bubbles accelerate upward, grow, wobble and pop individually.
  for (const f of fine) {
    const a = (t - f.born) / f.life; if (a < 0) continue;
    if (a > f.popAt) { pop(ctx, f.x + Math.sin(f.popAt * 9 + f.ph) * f.wob, f.y - f.h * quadIn(f.popAt) * 0.85 - f.h * f.popAt * 0.15, f.r0 + 1, f.rim, (a - f.popAt) / 0.12); continue; }
    const e = quadIn(a) * 0.85 + a * 0.15; // buoyant: speeds up
    const x = f.x + Math.sin(a * 9 + f.ph) * f.wob; const y = f.y - f.h * e;
    const tw = 0.75 + 0.25 * Math.sin(a * 30 + f.ph);
    fizz(ctx, x, y, f.r0 * (1 + a * 0.6), f.rim, seg(a, 0, 0.06) * tw);
  }
  // Contrast: a few larger transparent bubbles rise slower, wobbling, then pop with droplets.
  for (const b of big) {
    const a = (t - b.born) / b.life; if (a < 0) continue;
    const popA = 0.82; const e = quadIn(Math.min(a, popA)) * 0.7 + Math.min(a, popA) * 0.3;
    const x = b.x + Math.sin(Math.min(a, popA) * 6 + b.ph) * s * 0.06; const y = b.y - b.h * e;
    if (a < popA) bubble(ctx, x, y, b.r * (0.6 + 0.4 * seg(a, 0, 0.2)), b.rim, seg(a, 0, 0.1), Math.sin(a * 14 + b.ph) * 0.06);
    else {
      const u = (a - popA) / 0.18; if (u >= 1) continue;
      pop(ctx, x, y, b.r, b.rim, u);
      for (const d of b.drops) { const dx = Math.cos(d.a) * d.v * u; const dy = Math.sin(d.a) * d.v * u + s * 0.5 * u * u; droplet(ctx, x + dx, y + dy, 2.2, b.rim, 1 - u, Math.atan2(dy, dx) + Math.PI / 2); }
    }
  }
  ctx.globalAlpha = 1;
}

export default { id: 'soda-a', label: 'A · Champagne Fizz', kind: 'concept', supports: ['single'], params, presets, duration, keyframes, prepare, render };
