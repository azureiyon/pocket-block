// Classic Pastel art kit (Studio only until a concept is approved).
// Matches the production .m-enamel material: 22% corners, a top-down sheen,
// a darker bottom bevel and a soft top highlight bar. Pastel effects use
// richer pastel shading and defined ink-tinted outlines instead of white glow,
// so they stay readable on the cream paper background.

import { TAU, mix, rgba, clamp, seg, env, lerp, easeOut, easeIn, easeInOut, easeOutBack, sine, rng, sparkle, roundRectPath } from '../../src/ui/vfx-jelly/jelly-art.js';

export const INK = '#5a4636';
export const PEARL = ['#f9d3df', '#e3d6fb', '#d3eef0', '#e2f4d8', '#fbe7cc'];
/** Shade for pastels: a deep plum, so shadows read rich rather than muddy grey-brown. */
export const PLUM = '#6d4c7d';

/** Production enamel block (canvas snapshot of a cleared cell). */
export function enamelBlock(ctx, x, y, s, color, { sx = 1, sy = 1, rot = 0, alpha = 1, lift = 0 } = {}) {
  if (alpha <= 0.005) return;
  const w = s * sx; const h = s * sy; const r = Math.min(w, h) * 0.22;
  ctx.save(); ctx.translate(x, y - lift); ctx.rotate(rot); ctx.globalAlpha = alpha;
  ctx.save(); ctx.translate(0, Math.max(1, s * 0.04)); roundRectPath(ctx, w, h, r); ctx.fillStyle = 'rgba(90,60,40,.12)'; ctx.fill(); ctx.restore();
  roundRectPath(ctx, w, h, r);
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, mix(color, '#ffffff', 0.3)); g.addColorStop(0.48, color); g.addColorStop(1, mix(color, INK, 0.1));
  ctx.fillStyle = g; ctx.fill();
  ctx.save(); ctx.clip();
  ctx.fillStyle = mix(color, INK, 0.2); ctx.fillRect(-w / 2, h / 2 - Math.max(1.5, h * 0.07), w, h);
  ctx.restore();
  // Soft top highlight bar (the CSS `> i` layer).
  ctx.save(); ctx.translate(0, -h * 0.23); roundRectPath(ctx, w * 0.72, h * 0.3, Math.min(w, h) * 0.13);
  const hg = ctx.createLinearGradient(0, -h * 0.15, 0, h * 0.15); hg.addColorStop(0, 'rgba(255,255,255,.75)'); hg.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = hg; ctx.fill(); ctx.restore();
  ctx.restore();
}

/**
 * Line-local frame: the cleared line runs along local +x, centred on the line,
 * with local +y pointing "down" for rows (right for columns). Returns helpers.
 */
export function frame(line) {
  const vert = line.axis === 'v';
  const pitch = line.len / 7;
  return {
    pitch, s: line.s, vert,
    xOf: (k) => (k - 3.5) * pitch,
    enter(ctx) { ctx.save(); ctx.translate(line.cx, line.cy); if (vert) ctx.rotate(Math.PI / 2); },
    leave(ctx) { ctx.restore(); },
    /** Counter-rotate inside the frame so lighting stays top-left on columns. */
    upright(ctx) { if (vert) ctx.rotate(-Math.PI / 2); },
  };
}

/** Colour along the line at u (0..1), interpolating the cleared blocks' colours. */
export function colorAt(line, u) {
  const x = clamp(u) * 7; const k = Math.min(6, Math.floor(x));
  return mix(line.cells[k].color, line.cells[k + 1].color, x - k);
}

/** Mother-of-pearl fill: the block's colour carried through a band of pastel hues. */
export function nacre(ctx, x0, y0, x1, y1, color, phase = 0) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  const n = PEARL.length;
  for (let i = 0; i <= 5; i++) {
    const hue = PEARL[(i + Math.floor(phase * n)) % n];
    g.addColorStop(i / 5, mix(mix(hue, color, 0.68), i % 2 ? '#ffffff' : PLUM, i % 2 ? 0.28 : 0.06));
  }
  return g;
}

export { TAU, mix, rgba, clamp, seg, env, lerp, easeOut, easeIn, easeInOut, easeOutBack, sine, rng, sparkle, roundRectPath };
