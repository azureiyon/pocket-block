// Cloud Palace art kit (Studio only until a concept is approved).
// Twilight palette: warm champagne light against lavender shadow, on the
// dusk board. pearlBlock() matches the production .m-pearl material (40%
// corners, iridescent sheen, top-left specular, gold rim, gold centre dot).
// Soft light comes from pre-rendered sprites; nothing uses live blur.

import { TAU, clamp, mix, seg, env, lerp, rng, premium, expoOut, quadIn, glowSprite, spark, glint, drawSprite, roundRectPath, frame } from '../../src/ui/vfx-classic/light-kit.js';
import { spriteOf } from '../../src/ui/vfx-jelly/jelly-art.js';

export const CHAMPAGNE = '#ffe6ad';
export const WARM_WHITE = '#fff7e6';
export const GOLD = '#e8bb58';
export const GOLD_DEEP = '#b98a2c';
export const LAVENDER = '#a58ee2';
export const LAV_DEEP = '#5f4c9f';

export const easeOutCubic = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const sineInOut = (t) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(t));

/**
 * Production pearl block, centred at (x, y).
 * glow: champagne light inside the pearl (0..1). clear: translucency (0..1).
 * phase: turns the iridescent sheen. size: drawn size (defaults to s).
 */
export function pearlBlock(ctx, x, y, s, color, { alpha = 1, glow = 0, clear = 0, phase = 0, size = s, lift = 0, rim = 1 } = {}) {
  if (alpha <= 0.005 || size < 0.5) return;
  const w = size; const r = w * 0.4;
  ctx.save(); ctx.translate(x, y - lift);
  // Drop shadow (fades as the pearl turns to light).
  ctx.save(); ctx.translate(0, Math.max(0.5, w * 0.05)); roundRectPath(ctx, w, w, r);
  ctx.globalAlpha = alpha * 0.35 * (1 - Math.max(clear, glow)) * Math.min(1, w / s); ctx.fillStyle = '#08041e'; ctx.fill(); ctx.restore();
  roundRectPath(ctx, w, w, r);
  ctx.save(); ctx.clip();
  // Body: the block colour, thinning as it becomes translucent.
  // Translucent here means lit from within: the body thins towards warm light, never towards the dark board.
  ctx.globalAlpha = alpha * (1 - clear * 0.25); ctx.fillStyle = mix(color, CHAMPAGNE, clear * 0.22); ctx.fillRect(-w / 2, -w / 2, w, w);
  // Iridescent sheen.
  if (ctx.createConicGradient) {
    const g = ctx.createConicGradient((210 / 180) * Math.PI + phase * TAU, w * 0.1, w * 0.1);
    const st = ['rgba(255,190,235,.55)', 'rgba(190,225,255,.55)', 'rgba(255,250,200,.55)', 'rgba(220,200,255,.55)', 'rgba(255,190,235,.55)'];
    st.forEach((c, i) => g.addColorStop(i / 4, c));
    ctx.globalAlpha = alpha * (1 - clear * 0.2); ctx.fillStyle = g; ctx.fillRect(-w / 2, -w / 2, w, w);
  }
  // Lavender underside.
  const sh = ctx.createLinearGradient(0, w * 0.1, 0, w / 2);
  sh.addColorStop(0, 'rgba(120,90,170,0)'); sh.addColorStop(1, 'rgba(120,90,170,.28)');
  ctx.globalAlpha = alpha * (1 - clear * 0.8); ctx.fillStyle = sh; ctx.fillRect(-w / 2, -w / 2, w, w);
  // Inner champagne light.
  const lit = Math.min(1, glow + clear * 0.5);
  if (lit > 0) drawSprite(ctx, glowSprite(mix(WARM_WHITE, color, 0.3), 0.3), 0, 0, w * 1.2, { alpha: alpha * lit * 0.8 });
  // Specular.
  const sp = ctx.createRadialGradient(-w * 0.16, -w * 0.22, 0, -w * 0.16, -w * 0.22, w * 0.44);
  sp.addColorStop(0, 'rgba(255,255,255,1)'); sp.addColorStop(0.2, 'rgba(255,255,255,.85)'); sp.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.globalAlpha = alpha * (0.9 - clear * 0.3); ctx.fillStyle = sp; ctx.fillRect(-w / 2, -w / 2, w, w);
  ctx.restore();
  // Gold rim and centre dot.
  if (rim > 0 && w > 4) {
    roundRectPath(ctx, w - 1.5, w - 1.5, Math.max(0, r - 0.75));
    ctx.globalAlpha = alpha * rim; ctx.lineWidth = 1.5; ctx.strokeStyle = mix('#d4b062', CHAMPAGNE, glow * 0.6); ctx.stroke();
  }
  const d = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.07);
  d.addColorStop(0, '#fff3c4'); d.addColorStop(1, '#c9a24b');
  ctx.globalAlpha = alpha * (1 - clear * 0.5); ctx.fillStyle = d; ctx.beginPath(); ctx.arc(0, 0, w * 0.07, 0, TAU); ctx.fill();
  ctx.restore();
}

/**
 * A compact point of warm light for dark skies: near-white core, a short
 * saturated gold falloff (saturated light reads as light on indigo; a wide
 * pale falloff reads as fog). Draw it small.
 */
export function lightSprite(tint = GOLD) {
  return spriteOf('cloudlight|' + tint, 96, (g) => {
    const r = g.createRadialGradient(48, 48, 0, 48, 48, 48);
    r.addColorStop(0, 'rgba(255,251,242,1)'); r.addColorStop(0.16, 'rgba(255,240,205,.95)');
    const n = parseInt(tint.slice(1), 16); const c = `${(n >> 16) & 255},${(n >> 8) & 255},${n & 255}`;
    r.addColorStop(0.36, `rgba(${c},.5)`); r.addColorStop(0.65, `rgba(${c},.12)`); r.addColorStop(1, `rgba(${c},0)`);
    g.fillStyle = r; g.fillRect(0, 0, 96, 96);
  });
}

/** Point on a rounded square's outline (side w, corner r), u in [0,1) clockwise from top centre. Returns {x, y, tx, ty}. */
export function contourPoint(w, r, u) {
  const h = w / 2; const straight = w - 2 * r; const arc = (Math.PI / 2) * r;
  const total = 4 * straight + 4 * arc;
  let d = (((u % 1) + 1) % 1) * total;
  // Segments clockwise: top-right half, TR corner, right, BR corner, bottom, BL corner, left, TL corner, top-left half.
  const segs = [
    ['line', straight / 2, 0, -h, 1, 0],
    ['arc', arc, h - r, -h + r, -Math.PI / 2],
    ['line', straight, h, -h + r, 0, 1],
    ['arc', arc, h - r, h - r, 0],
    ['line', straight, h - r, h, -1, 0],
    ['arc', arc, -h + r, h - r, Math.PI / 2],
    ['line', straight, -h, h - r, 0, -1],
    ['arc', arc, -h + r, -h + r, Math.PI],
    ['line', straight / 2, -h + r, -h, 1, 0],
  ];
  for (const sg of segs) {
    if (d <= sg[1] || sg === segs[segs.length - 1]) {
      if (sg[0] === 'line') return { x: sg[2] + sg[4] * d, y: sg[3] + sg[5] * d, tx: sg[4], ty: sg[5] };
      const a = sg[4] + d / r; return { x: sg[2] + Math.cos(a) * r, y: sg[3] + Math.sin(a) * r, tx: -Math.sin(a), ty: Math.cos(a) };
    }
    d -= sg[1];
  }
  return { x: 0, y: -h, tx: 1, ty: 0 };
}

// ---------- clouds ----------
const cloudCache = new Map();
const UNIT = 48; // sprite pixels per cell

/**
 * A soft-edged cloud bank built as one union of circles (no overlap seams),
 * lit warm on top and shaded lavender below. `circles` are [x, y, r] in cells.
 * Returns { img, x0, y0, w, h } in cells, or null when headless.
 */
export function cloudShape(key, circles) {
  let c = cloudCache.get(key);
  if (c !== undefined) return c;
  if (typeof document === 'undefined') { cloudCache.set(key, null); return null; }
  const pad = 0.15;
  const x0 = Math.min(...circles.map((q) => q[0] - q[2])) - pad; const x1 = Math.max(...circles.map((q) => q[0] + q[2])) + pad;
  const y0 = Math.min(...circles.map((q) => q[1] - q[2])) - pad; const y1 = Math.max(...circles.map((q) => q[1] + q[2])) + pad;
  const cv = document.createElement('canvas'); cv.width = Math.ceil((x1 - x0) * UNIT); cv.height = Math.ceil((y1 - y0) * UNIT);
  const g = cv.getContext('2d');
  const path = () => { g.beginPath(); for (const [x, y, r] of circles) { g.moveTo((x - x0 + r) * UNIT, (y - y0) * UNIT); g.arc((x - x0) * UNIT, (y - y0) * UNIT, r * UNIT, 0, TAU); } };
  const flat = (y1 - pad - 0.12 - y0) * UNIT; // flattened underside
  const fill = (alpha, grow) => {
    g.save(); g.beginPath(); g.rect(0, 0, cv.width, flat + grow); g.clip();
    const gr = g.createLinearGradient(0, 0, 0, cv.height);
    gr.addColorStop(0, '#fdf7ff'); gr.addColorStop(0.45, '#e6dbfb'); gr.addColorStop(1, '#9d88d4');
    g.globalAlpha = alpha; g.fillStyle = gr; path(); g.fill();
    if (grow) { g.lineWidth = grow * 2; g.lineJoin = 'round'; g.strokeStyle = gr; g.stroke(); }
    g.restore();
  };
  fill(0.3, 1.5);
  // Warm light caught along the top edge: stroke the outline, then cover its inner half with the body.
  g.save(); g.beginPath(); g.rect(0, 0, cv.width, (0.05 - y0) * UNIT); g.clip(); path();
  g.lineWidth = 3.2; g.strokeStyle = 'rgba(255,230,173,.95)'; g.stroke(); g.restore();
  fill(1, 0);
  c = { img: cv, x0, y0, w: x1 - x0, h: y1 - y0 };
  cloudCache.set(key, c);
  return c;
}

/** Draw a cloudShape at (x, y) (its circles' origin), cell size s. */
export function drawCloud(ctx, cs, x, y, s, alpha) {
  if (!cs || alpha <= 0.005) return;
  ctx.globalAlpha = alpha;
  ctx.drawImage(cs.img, x + cs.x0 * s, y + cs.y0 * s, cs.w * s, cs.h * s);
}

export { TAU, clamp, mix, seg, env, lerp, rng, premium, expoOut, quadIn, glowSprite, spark, glint, drawSprite, roundRectPath, frame };
