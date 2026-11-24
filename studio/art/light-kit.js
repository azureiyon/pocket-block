// Abstract light kit for premium puzzle-game VFX (Studio only until approved).
// Readability on cream comes from *coloured* light: each pastel is pushed to a
// vivid, slightly deeper hue for cores and sparks, with only thin white
// filaments as highlights. Soft glows are pre-rendered sprites (no live blur).

import { TAU, clamp, mix, seg, env, lerp, rng, spriteOf, drawSprite, roundRectPath } from '../../src/ui/vfx-jelly/jelly-art.js';
import { enamelBlock, frame, colorAt } from './pastel-art.js';

/** Premium signature curve, cubic-bezier(0.4, 0, 0.2, 1), solved numerically. */
export function premium(t) {
  t = clamp(t);
  const x1 = 0.4; const y1 = 0; const x2 = 0.2; const y2 = 1;
  const bx = (u) => 3 * x1 * u * (1 - u) * (1 - u) + 3 * x2 * u * u * (1 - u) + u * u * u;
  const by = (u) => 3 * y1 * u * (1 - u) * (1 - u) + 3 * y2 * u * u * (1 - u) + u * u * u;
  let lo = 0; let hi = 1;
  for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (bx(m) < t) lo = m; else hi = m; }
  return by((lo + hi) / 2);
}
export const expoOut = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(t)));
export const quadIn = (t) => clamp(t) * clamp(t);

// ---------- colour ----------
function toHsl(hex) {
  const n = parseInt(hex.slice(1, 7), 16); const r = ((n >> 16) & 255) / 255; const g = ((n >> 8) & 255) / 255; const b = (n & 255) / 255;
  const mx = Math.max(r, g, b); const mn = Math.min(r, g, b); const l = (mx + mn) / 2; let h = 0; let s = 0;
  if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
  return [h, s, l];
}
function fromHsl(h, s, l) {
  const f = (p, q, t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s; const p = 2 * l - q;
  return '#' + [f(p, q, h + 1 / 3), f(p, q, h), f(p, q, h - 1 / 3)].map((v) => Math.round(clamp(v) * 255).toString(16).padStart(2, '0')).join('');
}
const vividCache = new Map();
/** The same hue as a pastel, saturated and a little deeper: readable light on cream. */
export function vivid(hex, deep = 0) {
  const key = hex + deep; let v = vividCache.get(key);
  if (!v) { const [h, s, l] = toHsl(hex); v = fromHsl(h, Math.min(1, s * 0.5 + 0.55), clamp(Math.min(l, 0.6) - 0.06 - deep)); vividCache.set(key, v); }
  return v;
}
export const transparentOf = (hex) => { const n = parseInt(hex.slice(1, 7), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},0)`; };

// ---------- sprites ----------
/** Soft coloured glow: saturated core falling off to the same hue at zero alpha (never grey). */
export function glowSprite(color, core = 0.35) {
  return spriteOf('lglow|' + color + '|' + core, 96, (ctx) => {
    const g = ctx.createRadialGradient(48, 48, 0, 48, 48, 48);
    g.addColorStop(0, color); g.addColorStop(core, color.length === 7 ? color + 'aa' : color); g.addColorStop(1, transparentOf(color));
    ctx.fillStyle = g; ctx.fillRect(0, 0, 96, 96);
  });
}

/** A velocity-aligned spark: coloured streak with a thin bright filament. */
export function spark(ctx, x, y, vx, vy, len, width, color, alpha) {
  if (alpha <= 0.01) return;
  const sp = Math.hypot(vx, vy) || 1; const ux = vx / sp; const uy = vy / sp;
  const tx = x - ux * len; const ty = y - uy * len;
  ctx.globalAlpha = alpha; ctx.lineCap = 'round';
  ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(x, y); ctx.stroke();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(0.6, width * 0.35); ctx.globalAlpha = alpha * 0.9;
  ctx.beginPath(); ctx.moveTo(x - ux * len * 0.4, y - uy * len * 0.4); ctx.lineTo(x, y); ctx.stroke();
}

/** Tiny crisp four-point glint. */
export function glint(ctx, x, y, r, color, alpha) {
  if (alpha <= 0.01 || r < 0.4) return;
  ctx.globalAlpha = alpha; ctx.fillStyle = color;
  ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.18, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.18, y); ctx.closePath();
  ctx.moveTo(x - r * 0.7, y); ctx.lineTo(x, y - r * 0.14); ctx.lineTo(x + r * 0.7, y); ctx.lineTo(x, y + r * 0.14); ctx.closePath(); ctx.fill();
}

export { TAU, clamp, mix, seg, env, lerp, rng, drawSprite, roundRectPath, enamelBlock, frame, colorAt };
