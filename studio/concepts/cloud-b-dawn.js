// Concept B — Pearl of Dawn.
// Feeling: first light on a pearl; serene, precious, inward. Each pearl
// kindles from within (champagne light, the iridescent sheen slowly turning),
// becomes translucent while keeping its tint, then dissolves from its edges
// inward: its outline draws in while fine gold glints run along the contour,
// and the last of the pearl melts into a compact point of light (near-white
// core, short saturated falloff: never a pale haze, which reads as fog on the
// twilight sky) that winks out. A wave from the centre outward, ~1 s.
// Primary: the contour drawing inward with its travelling glints. Secondary:
// the inner glow and turning sheen. Ambient: a
// few gold motes that settle upward. No travel across the board: this is the
// one concept that stays in place (inward, not up or along).

import { TAU, mix, seg, env, lerp, rng, premium, expoOut, glowSprite, glint, drawSprite, roundRectPath, pearlBlock, contourPoint, lightSprite, CHAMPAGNE, WARM_WHITE, GOLD, GOLD_DEEP, LAVENDER } from '../art/cloud-art.js';
import { vivid as vividOf } from '../../src/ui/vfx-classic/light-kit.js';

export const params = [
  { key: 'stagger', label: 'Centre-out wave', unit: 'ms', min: 0, max: 70, step: 2, def: 30 },
  { key: 'kindle', label: 'Inner glow', min: 0, max: 1, step: 0.05, def: 0.8 },
  { key: 'clear', label: 'Translucency', min: 0, max: 1, step: 0.05, def: 0.6 },
  { key: 'dissolve', label: 'Dissolve time', unit: 'ms', min: 240, max: 700, step: 20, def: 380 },
  { key: 'glints', label: 'Contour glints', min: 0, max: 4, step: 1, def: 2 },
  { key: 'feather', label: 'Edge feather', min: 0, max: 1, step: 0.05, def: 0.5 },
  { key: 'point', label: 'Point of light', min: 0, max: 1, step: 0.05, def: 0.75 },
  { key: 'motes', label: 'Gold motes', min: 0, max: 6, step: 1, def: 3 },
  { key: 'speed', label: 'Overall pace', min: 0.6, max: 1.5, step: 0.05, def: 1 },
];
export const presets = { Default: {}, 'Quick dawn': { stagger: 22, dissolve: 300, motes: 2, speed: 0.85 }, 'Slow pearl': { stagger: 48, dissolve: 600, glints: 3, speed: 1.2 } };

function timing(P) {
  const k = P.speed;
  const T = { glow: 150 * k, clearA: 60 * k, clearB: 260 * k, dis: 220 * k };
  T.disEnd = T.dis + P.dissolve * k;
  T.end = 3.5 * P.stagger * k + T.disEnd + 270 * k;
  return T;
}
export const duration = (P) => timing(P).end;
export const keyframes = (P) => {
  const T = timing(P); const k = P.speed; const o = 3.5 * P.stagger * k;
  return [
    [T.glow * 0.7, 'Kindle', 'Light wakes inside the centre pearls; the wave spreads outward.'],
    [T.clearB * 0.85, 'Translucent', 'The pearls glow like lit mother-of-pearl, keeping their tints; the sheen turns.'],
    [T.dis + P.dissolve * k * 0.3, 'Dissolve', 'Edges draw inward; gold glints run along each contour.'],
    [T.dis + P.dissolve * k * 0.7 + o * 0.5, 'Climax', 'The centre pearls melt into points of tinted light; the outer ones follow.'],
    [T.disEnd + o * 0.6, 'Point', 'The outer pearls close to points of light and wink out.'],
    [T.disEnd + o + 140 * k, 'Follow-through', 'A few gold motes drift up from where they were.'],
    [T.end - 30, 'Settle', 'The last motes fade; a clear line.'],
  ].map(([t, label, note]) => ({ t, label, note }));
};

export function prepare(scene, P) {
  const line = scene.lines[0]; const r = rng(47); const s = line.s; const k = P.speed;
  const blocks = line.cells.map((c, i) => ({
    ...c, o: Math.abs(i - 3.5) * P.stagger * k, ph: r(), tint: mix(GOLD, vividOf(c.color), 0.35),
    glints: Array.from({ length: P.glints }, (_, j) => ({ u0: j / Math.max(1, P.glints) + r() * 0.2, dir: j % 2 ? -1 : 1, spd: 0.9 + r() * 0.5 })),
    motes: Array.from({ length: P.motes }, () => ({ dx: (r() - 0.5) * s * 0.6, h: s * (0.45 + r() * 0.6), lag: r() * 60 * k, size: 0.8 + r() * 0.9 })),
  }));
  return { line, T: timing(P), blocks };
}

export function render(ctx, t, st, scene, P) {
  const { line, T, blocks } = st; const s = line.s; const k = P.speed;
  for (const b of blocks) {
    const L = t - b.o; if (L < 0) { pearlBlock(ctx, b.x, b.y, s, b.color, {}); continue; }
    const glow = premium(seg(L, 0, T.glow)) * P.kindle;
    const clear = premium(seg(L, T.clearA, T.clearB)) * P.clear;
    const d = premium(seg(L, T.dis, T.disEnd)); // 0 → 1: the edge draws in
    const phase = seg(L, 0, T.disEnd) * 0.35 + b.ph;
    // Ambient: a soft pearlescent halo while it glows.
    const halo = glow * (1 - d);
    // (No wide halo: a pale glow over the indigo sky reads as fog. The light lives inside the pearl.)
    if (d < 1) {
      const size = s * (1 - 0.78 * d);
      // Feathered edge: thin outer rings of the pearl, fainter the further out.
      if (P.feather > 0 && d > 0) for (let i = 3; i >= 1; i--) {
        const fs = Math.min(s, size + s * 0.07 * i);
        pearlBlock(ctx, b.x, b.y, s, b.color, { size: fs, glow: 1, clear: Math.min(1, clear + 0.15 * i), phase, alpha: P.feather * (1 - d) * (0.26 - i * 0.07), rim: 0 });
      }
      pearlBlock(ctx, b.x, b.y, s, b.color, { size, glow: Math.min(1, glow + d * 0.8), clear: clear * (1 - d * 0.5), phase, rim: 1 - seg(d, 0.62, 0.85), alpha: 1 - premium(seg(d, 0.8, 1)) });
      // Primary: gold contour light riding the shrinking edge, with glints running round it.
      const on = env(d, 0, 0.08, 0.7, 0.9);
      if (on > 0 && size > 2) {
        const r = size * 0.4;
        ctx.save(); ctx.translate(b.x, b.y);
        roundRectPath(ctx, size, size, r); ctx.globalAlpha = on; ctx.lineWidth = 1.6; ctx.strokeStyle = GOLD; ctx.stroke();
        for (const g of b.glints) {
          const u = g.u0 + g.dir * g.spd * seg(L, T.dis, T.disEnd) * 0.9;
          for (let j = 5; j >= 0; j--) { // short trail of gold dust behind the glint
            const p = contourPoint(size, r, u - g.dir * j * 0.018);
            ctx.globalAlpha = on * (1 - j / 6) * 0.8; ctx.fillStyle = j ? GOLD : WARM_WHITE;
            ctx.beginPath(); ctx.arc(p.x, p.y, j ? 1.1 : 1.6, 0, TAU); ctx.fill();
          }
          const p = contourPoint(size, r, u);
          glint(ctx, p.x, p.y, s * 0.17 * on, WARM_WHITE, on);
        }
        ctx.restore();
      }
    }
    // Climax: the last of the pearl closes to a point of light and winks out.
    // The pearl melts into warm light (starting while it is still shrinking, so there is no grey gap),
    // which then closes to a single point and winks out.
    const D = P.dissolve * k;
    const melt = env(L, T.dis + D * 0.35, T.dis + D * 0.72, T.disEnd, T.disEnd + 170 * k) * P.point;
    const pt = env(L, T.disEnd - D * 0.22, T.disEnd - 10 * k, T.disEnd + 10 * k, T.disEnd + 170 * k) * P.point;
    if (melt > 0) drawSprite(ctx, lightSprite(b.tint), b.x, b.y, s * lerp(0.62, 0.36, seg(L, T.dis + D * 0.6, T.disEnd + 170 * k)), { alpha: melt });
    if (pt > 0) glint(ctx, b.x, b.y, s * (0.16 + 0.08 * b.ph) * pt, WARM_WHITE, Math.min(1, pt * 1.3));
    // Follow-through: a few gold motes rise a little from where the pearl was.
    for (const m of b.motes) {
      const a = seg(L, T.disEnd - 40 * k + m.lag, T.disEnd + 220 * k + m.lag); if (a <= 0 || a >= 1) continue;
      const e = expoOut(a);
      ctx.globalAlpha = (1 - a) * 0.9; ctx.fillStyle = a < 0.3 ? WARM_WHITE : mix(GOLD, LAVENDER, a * 0.5);
      ctx.beginPath(); ctx.arc(b.x + m.dx * e, b.y - m.h * e, m.size, 0, TAU); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

export default { id: 'cloud-b', label: 'B · Pearl of Dawn', kind: 'concept', supports: ['single'], params, presets, duration, keyframes, prepare, render };
