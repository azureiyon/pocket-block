// Jelly Pop art kit for the VFX Studio. Everything here is drawn to match the
// production .m-gel material (styles/materials.css): rounded 34% corners, a
// translucent pastel body, a soft top-left gloss and a small bottom-right dot.
// Sprites are rendered once per shape x colour and reused every frame.

import { TAU, mix, rgba, clamp } from '../vfx-kit.js';

export const INK = '#7a3a55';

// ---------- easing (motion-design skill: Playful, elastic material) ----------
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const easeIn = (t) => Math.pow(clamp(t), 3);
export const easeInOut = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const easeOutBack = (t, s = 1.70158) => { t = clamp(t); const c = s + 1; return 1 + c * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2); };
export const sine = (t) => -(Math.cos(Math.PI * clamp(t)) - 1) / 2;
/** Damped spring settle from 1 (start offset) to 0, for follow-through. */
export const spring = (t, freq = 3, damp = 5) => (t <= 0 ? 1 : Math.exp(-damp * t) * Math.cos(TAU * freq * t));
export const seg = (t, a, b) => clamp((t - a) / (b - a));
export const env = (t, a, b, c, d) => (t <= a || t >= d ? 0 : t < b ? sine((t - a) / (b - a)) : t <= c ? 1 : 1 - sine((t - c) / (d - c)));
export const lerp = (a, b, t) => a + (b - a) * t;

/** Deterministic RNG so every replay, scrub and storyboard frame is identical. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// ---------- paths ----------
export function roundRectPath(ctx, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(-w / 2 + r, -h / 2); ctx.arcTo(w / 2, -h / 2, w / 2, h / 2, r); ctx.arcTo(w / 2, h / 2, -w / 2, h / 2, r);
  ctx.arcTo(-w / 2, h / 2, -w / 2, -h / 2, r); ctx.arcTo(-w / 2, -h / 2, w / 2, -h / 2, r); ctx.closePath();
}

/** The production jelly block, drawn on canvas (snapshot of a cleared cell). */
export function jellyBlock(ctx, x, y, s, color, { sx = 1, sy = 1, rot = 0, glow = 0, alpha = 1, shadow = 0 } = {}) {
  if (alpha <= 0.005) return;
  const w = s * sx; const h = s * sy; const r = Math.min(w, h) * 0.34;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = alpha;
  if (shadow > 0) { ctx.save(); ctx.globalAlpha = alpha * 0.18 * shadow; ctx.fillStyle = '#c0507a'; ctx.translate(0, h * 0.08); roundRectPath(ctx, w * 0.96, h * 0.96, r); ctx.fill(); ctx.restore(); ctx.globalAlpha = alpha; }
  roundRectPath(ctx, w, h, r);
  const base = glow ? mix(color, '#ffffff', clamp(glow)) : color;
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
  g.addColorStop(0, mix(base, '#ffffff', 0.22)); g.addColorStop(0.55, base); g.addColorStop(1, mix(base, INK, 0.14));
  ctx.fillStyle = g; ctx.fill();
  // Inner top light and bottom shade, like the CSS inset shadows.
  ctx.save(); ctx.clip();
  const top = ctx.createLinearGradient(0, -h / 2, 0, -h * 0.1); top.addColorStop(0, 'rgba(255,255,255,.5)'); top.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = top; ctx.fillRect(-w / 2, -h / 2, w, h * 0.4);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  ctx.beginPath(); ctx.ellipse(-w * 0.2, -h * 0.23, w * 0.12, h * 0.075, -0.55, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.beginPath(); ctx.arc(w * 0.25, h * 0.25, Math.min(w, h) * 0.085, 0, TAU); ctx.fill();
  ctx.restore();
}

/** Crisp four-point sparkle (never a blurred dot). */
export function sparkle(ctx, x, y, r, alpha, color = '#ffffff', rot = 0) {
  if (alpha <= 0.01 || r <= 0.2) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = alpha; ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * 0.12, -r * 0.12, r * 0.62, 0); ctx.quadraticCurveTo(r * 0.12, r * 0.12, 0, r);
  ctx.quadraticCurveTo(-r * 0.12, r * 0.12, -r * 0.62, 0); ctx.quadraticCurveTo(-r * 0.12, -r * 0.12, 0, -r);
  ctx.fill();
  ctx.restore();
}

// ---------- sprite cache ----------
const cache = new Map();
export function spriteOf(key, size, paint) {
  let c = cache.get(key);
  if (!c) {
    if (typeof document === 'undefined') return { width: size, height: size }; // headless tests
    c = document.createElement('canvas'); c.width = c.height = size; paint(c.getContext('2d'), size); cache.set(key, c);
  }
  return c;
}
export function drawSprite(ctx, img, x, y, size, { rot = 0, sx = 1, sy = 1, alpha = 1 } = {}) {
  if (alpha <= 0.005) return;
  ctx.save(); ctx.globalAlpha = alpha; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sx, sy);
  ctx.drawImage(img, -size / 2, -size / 2, size, size); ctx.restore();
}

export { TAU, mix, rgba, clamp };
