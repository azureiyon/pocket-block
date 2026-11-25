// Neon Arcade art kit (Studio only until a concept is approved).
// circuitBlock() matches the production .m-circuit material: 14% corners, a
// dark tinted face, a 2 px neon rim with inner and outer glow, and the inner
// circuit glyph (two traces and a white node) whose orientation follows the
// colour index exactly like the CSS (2,5 mirrored; 3,6 rotated). Glows are
// pre-rendered sprites; nothing uses live blur.

import { TAU, clamp, mix, seg, env, lerp, rng, premium, expoOut, quadIn, glowSprite, spark, glint, drawSprite, roundRectPath, frame } from '../../src/ui/vfx-classic/light-kit.js';
import { spriteOf } from '../../src/ui/vfx-jelly/jelly-art.js';

export const WHITE = '#ffffff';
export const CYAN = '#28e1ff';
export const MAGENTA = '#ff4fd8';

const rgbOf = (hex) => { const n = parseInt(hex.slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
export const rgbaOf = (hex, a) => { const [r, g, b] = rgbOf(hex); return `rgba(${r},${g},${b},${a})`; };

/** Square neon halo (rounded), the CSS `0 0 7px` outer glow, pre-rendered per colour. */
export function haloSprite(color) {
  return spriteOf('neonhalo|' + color, 96, (g) => {
    const r = g.createRadialGradient(48, 48, 14, 48, 48, 48);
    r.addColorStop(0, rgbaOf(color, 0.55)); r.addColorStop(0.55, rgbaOf(color, 0.18)); r.addColorStop(1, rgbaOf(color, 0));
    g.fillStyle = r; g.fillRect(0, 0, 96, 96);
  });
}

/** The inner circuit glyph, in a box of side s centred at the origin. */
export function glyph(ctx, s, color, ci, alpha = 1, width = 2) {
  if (alpha <= 0.01) return;
  const b = s * 0.56; const x0 = -b / 2; const y0 = -b / 2;
  ctx.save();
  if (ci === 2 || ci === 5) ctx.scale(-1, 1);
  if (ci === 3 || ci === 6) ctx.rotate(Math.PI / 2);
  ctx.globalAlpha = alpha * 0.85; ctx.fillStyle = color;
  ctx.fillRect(x0, y0 + 0.3 * (b - width), b * 0.55, width); // top-left trace
  ctx.fillRect(x0 + 0.52 * (b - width), y0 + 0.3 * b * 0.3, width, b * 0.7); // vertical trace
  ctx.fillRect(x0 + b * 0.5, y0 + b - width, b * 0.5, width); // bottom-right trace
  ctx.globalAlpha = alpha; ctx.fillStyle = WHITE;
  ctx.beginPath(); ctx.arc(x0 + 0.54 * b, y0 + 0.32 * b, b * 0.1, 0, TAU); ctx.fill();
  ctx.restore();
}

/**
 * Production circuit block, centred at (x, y).
 * power: extra brightness (0 normal, 1 overdriven). face: opacity of the dark face (0 = outline only).
 * rimPart: fraction of the rim still drawn (1 full; less = consumed from the top-left corner, clockwise).
 */
export function circuitBlock(ctx, x, y, s, color, ci, { alpha = 1, power = 0, face = 1, rimPart = 1, glyphA = 1, sx = 1, sy = 1, tint = null } = {}) {
  if (alpha <= 0.005) return;
  const w = s * sx; const h = s * sy; const r = Math.min(w, h) * 0.14;
  const col = tint || color;
  ctx.save(); ctx.translate(x, y);
  // Outer glow.
  drawSprite(ctx, haloSprite(col), 0, 0, Math.max(w, h) * 1.45, { alpha: alpha * (0.55 + 0.45 * power), sx: w / Math.max(w, h), sy: h / Math.max(w, h) });
  // Face: the colour under a dark diagonal tint.
  if (face > 0) {
    roundRectPath(ctx, w, h, r);
    ctx.globalAlpha = alpha * face; ctx.fillStyle = col; ctx.fill();
    const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
    g.addColorStop(0, `rgba(0,0,0,${0.42 * (1 - power * 0.6)})`); g.addColorStop(1, `rgba(0,0,0,${0.72 * (1 - power * 0.5)})`);
    ctx.fillStyle = g; ctx.fill();
    // Inner glow along the rim.
    ctx.save(); ctx.clip(); ctx.globalAlpha = alpha * face * (0.5 + 0.5 * power); ctx.strokeStyle = col; ctx.lineWidth = Math.min(w, h) * 0.22;
    roundRectPath(ctx, w, h, r); ctx.stroke(); ctx.restore();
  }
  // Rim (possibly partly consumed).
  if (rimPart > 0.001) {
    ctx.globalAlpha = alpha; ctx.strokeStyle = power > 0.5 ? mix(col, WHITE, (power - 0.5) * 1.2) : col; ctx.lineWidth = 2;
    if (rimPart >= 0.999) { roundRectPath(ctx, w - 2, h - 2, Math.max(0, r - 1)); ctx.stroke(); }
    else {
      const per = 2 * (w + h - 4); ctx.setLineDash([per * rimPart, per]); ctx.lineDashOffset = 0;
      roundRectPath(ctx, w - 2, h - 2, Math.max(0, r - 1)); ctx.stroke(); ctx.setLineDash([]);
    }
  }
  if (glyphA > 0 && sx > 0.5 && sy > 0.5) glyph(ctx, Math.min(w, h), power > 0.6 ? mix(col, WHITE, 0.5) : col, ci, alpha * glyphA);
  ctx.restore();
}

export { TAU, clamp, mix, seg, env, lerp, rng, premium, expoOut, quadIn, glowSprite, spark, glint, drawSprite, roundRectPath, frame };
