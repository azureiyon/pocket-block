// Cream Soda Pop art kit (Studio only until a concept is approved).
// sodaBlock() matches the production .m-soda material: a soda-glass body
// (24% top / 30% bottom corners) with a glassy highlight band on the left, a
// scalloped cream foam cap, a darker bottom bevel and three small bubbles.
// The board is pale mint on cream, so bubbles are drawn with a saturated rim
// in their soda's colour plus white highlights: white-only bubbles would
// vanish. Bubbles are pre-rendered sprites per tint (no live blur).

import { TAU, clamp, mix, seg, env, lerp, rng, premium, expoOut, quadIn, vivid, glint, drawSprite, frame } from '../../src/ui/vfx-classic/light-kit.js';
import { spriteOf } from '../../src/ui/vfx-jelly/jelly-art.js';

export const CREAM = '#fffaf0';
export const FOAM_SHADE = '#f3dcc0';
export const WHITE = '#ffffff';

/** Rounded rect with different top and bottom corner radii, centred at the origin. */
export function glassPath(ctx, w, h, rt, rb) {
  const x0 = -w / 2; const y0 = -h / 2; const x1 = w / 2; const y1 = h / 2;
  ctx.beginPath();
  ctx.moveTo(x0 + rt, y0); ctx.lineTo(x1 - rt, y0); ctx.quadraticCurveTo(x1, y0, x1, y0 + rt);
  ctx.lineTo(x1, y1 - rb); ctx.quadraticCurveTo(x1, y1, x1 - rb, y1);
  ctx.lineTo(x0 + rb, y1); ctx.quadraticCurveTo(x0, y1, x0, y1 - rb);
  ctx.lineTo(x0, y0 + rt); ctx.quadraticCurveTo(x0, y0, x0 + rt, y0); ctx.closePath();
}

/**
 * Production soda block, centred at (x, y).
 * clear: translucency of the soda body (0 opaque .. 1 glass-clear, keeping its rim and highlight).
 * foam: foam cap amount (0..1). lift: vertical offset of the foam cap (a breath).
 */
export function sodaBlock(ctx, x, y, s, color, { alpha = 1, clear = 0, foam = 1, sx = 1, sy = 1, rot = 0, foamLift = 0, bubbles = 1 } = {}) {
  if (alpha <= 0.005) return;
  const w = s * sx; const h = s * sy;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  // Soft shadow under the glass.
  ctx.save(); ctx.translate(0, Math.max(1, s * 0.04)); glassPath(ctx, w, h, w * 0.24, w * 0.3);
  ctx.globalAlpha = alpha * 0.15 * (1 - clear * 0.7); ctx.fillStyle = '#782828'; ctx.fill(); ctx.restore();
  glassPath(ctx, w, h, w * 0.24, w * 0.3);
  ctx.save(); ctx.clip();
  // Body: the soda, thinning to a tinted glass as it clears.
  ctx.globalAlpha = alpha * (1 - clear * 0.82); ctx.fillStyle = color; ctx.fillRect(-w / 2, -h / 2, w, h);
  if (clear > 0) { ctx.globalAlpha = alpha * clear * 0.22; ctx.fillStyle = mix(color, WHITE, 0.5); ctx.fillRect(-w / 2, -h / 2, w, h); }
  // Glass highlight bands (left strong, right faint).
  const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0);
  g.addColorStop(0, 'rgba(255,255,255,.4)'); g.addColorStop(0.12, 'rgba(255,255,255,.4)'); g.addColorStop(0.26, 'rgba(255,255,255,0)');
  g.addColorStop(0.78, 'rgba(255,255,255,0)'); g.addColorStop(0.9, 'rgba(255,255,255,.22)'); g.addColorStop(1, 'rgba(255,255,255,.1)');
  ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
  // Bottom bevel.
  ctx.globalAlpha = alpha * 0.14 * (1 - clear * 0.5); ctx.fillStyle = '#000'; ctx.fillRect(-w / 2, h / 2 - Math.max(2, h * 0.07), w, h);
  // Foam cap: a cream band with three scallops along its lower edge.
  if (foam > 0) {
    const fy = -h / 2 - h * 0.06 - foamLift; const fh = h * 0.34 * foam;
    ctx.globalAlpha = alpha * Math.min(1, foam * 1.5);
    const fg = ctx.createLinearGradient(0, fy, 0, fy + fh * 0.55); fg.addColorStop(0, CREAM); fg.addColorStop(1, '#fff3dc');
    ctx.fillStyle = fg; ctx.fillRect(-w / 2 - 1, fy, w + 2, fh * 0.55);
    ctx.fillStyle = CREAM;
    for (const [cx, rr] of [[0.18, 0.3], [0.5, 0.34], [0.82, 0.3]]) { ctx.beginPath(); ctx.arc(-w / 2 + w * cx, fy + fh * 0.7, fh * rr * 1.25, 0, TAU); ctx.fill(); }
  }
  // Three little bubbles in the soda.
  if (bubbles > 0) {
    ctx.globalAlpha = alpha * bubbles * 0.7; ctx.fillStyle = WHITE;
    for (const [bx, by, br] of [[0.3, 0.7, 0.05], [0.62, 0.52, 0.04], [0.72, 0.82, 0.03]]) { ctx.beginPath(); ctx.arc(-w / 2 + w * bx, -h / 2 + h * by, Math.max(0.6, w * br), 0, TAU); ctx.fill(); }
  }
  ctx.restore();
  ctx.restore();
}

/** Rim colour for bubbles and droplets: the soda's hue, saturated and a touch deeper (reads on pale mint). */
export const rimOf = (color) => vivid(color);

/** A transparent bubble sprite: tinted rim, faint tinted body, white crescent and a specular dot. */
export function bubbleSprite(tint) {
  return spriteOf('sodabub|' + tint, 64, (g) => {
    const c = 32; const r = 27;
    g.fillStyle = mix(tint, WHITE, 0.75); g.globalAlpha = 0.28; g.beginPath(); g.arc(c, c, r, 0, TAU); g.fill();
    g.globalAlpha = 1; g.lineWidth = 3.2; g.strokeStyle = tint; g.beginPath(); g.arc(c, c, r, 0, TAU); g.stroke();
    g.lineWidth = 3.4; g.strokeStyle = WHITE; g.lineCap = 'round'; g.globalAlpha = 0.95;
    g.beginPath(); g.arc(c, c, r - 6, Math.PI * 1.08, Math.PI * 1.5); g.stroke();
    g.globalAlpha = 1; g.fillStyle = WHITE; g.beginPath(); g.arc(c + r * 0.38, c + r * 0.4, 2.6, 0, TAU); g.fill();
  });
}

/** Draw a bubble of radius r (wobble squashes it a little). */
export function bubble(ctx, x, y, r, tint, alpha, wob = 0) {
  if (alpha <= 0.01 || r < 0.4) return;
  drawSprite(ctx, bubbleSprite(tint), x, y, r * 2.37, { alpha, sx: 1 + wob, sy: 1 - wob });
}

/** A fine fizz bubble (tiny): tinted ring with a white centre. */
export function fizz(ctx, x, y, r, tint, alpha) {
  if (alpha <= 0.01) return;
  ctx.globalAlpha = alpha; ctx.lineWidth = Math.max(0.8, r * 0.55); ctx.strokeStyle = tint;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  ctx.fillStyle = WHITE; ctx.beginPath(); ctx.arc(x - r * 0.25, y - r * 0.25, Math.max(0.5, r * 0.45), 0, TAU); ctx.fill();
}

/** A small droplet (teardrop pointing up), tinted, with a white highlight. */
export function droplet(ctx, x, y, r, tint, alpha, rot = 0) {
  if (alpha <= 0.01 || r < 0.4) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = alpha;
  ctx.beginPath(); ctx.moveTo(0, -r * 1.7); ctx.bezierCurveTo(r * 0.9, -r * 0.5, r, r * 0.4, 0, r); ctx.bezierCurveTo(-r, r * 0.4, -r * 0.9, -r * 0.5, 0, -r * 1.7); ctx.closePath();
  ctx.fillStyle = tint; ctx.fill();
  ctx.fillStyle = WHITE; ctx.globalAlpha = alpha * 0.9; ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.1, r * 0.3, 0, TAU); ctx.fill();
  ctx.restore();
}

/** A tiny pop: a thin tinted ring that expands and fades. */
export function pop(ctx, x, y, r, tint, u) {
  if (u <= 0 || u >= 1) return;
  ctx.globalAlpha = (1 - u) * 0.9; ctx.lineWidth = 1.2 * (1 - u) + 0.4; ctx.strokeStyle = tint;
  ctx.beginPath(); ctx.arc(x, y, r * (1 + 0.8 * expoOut(u)), 0, TAU); ctx.stroke();
}

export { TAU, clamp, mix, seg, env, lerp, rng, premium, expoOut, quadIn, vivid, glint, drawSprite, frame };
