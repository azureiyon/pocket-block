// Line-clear effects for themes 06–30, chosen by Rui in the FX Reel (studio/fx-reel-picks.md).
// GENERATED from the reel mockups (scratch build, not hand-edited): each concept is the approved
// mockup's own drawing code. Rows and columns can use different concepts. On a column, a concept
// that travels along its line runs in a rotated frame (rot: true); others use real coordinates.
// A concept moves real block elements (ghosts of the cleared cells) through X() and draws on the
// effect canvas through the shared helpers below.
/* eslint-disable */
// ---------- maths ----------
const cl = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const seg = (t, a, b) => cl((t - a) / (b - a));
const env = (t, a, b, c, d) => (t <= a || t >= d ? 0 : t < b ? (t - a) / (b - a) : t <= c ? 1 : (d - t) / (d - c));
const lerp = (a, b, u) => a + (b - a) * u;
const eo = (t) => 1 - Math.pow(1 - cl(t), 3);
const ei = (t) => Math.pow(cl(t), 3);
const eio = (t) => { t = cl(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const back = (t) => { t = cl(t); const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const expo = (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * cl(t)));
const TAU = Math.PI * 2;
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function hexRgb(h) { const n = parseInt(h.slice(1, 7), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
const rgba = (h, a) => { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; };
function mix(a, b, u) { const A = hexRgb(a); const B = hexRgb(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], u)).toString(16).padStart(2, '0')).join(''); }

// ---------- DOM block motion ----------
/**
 * Move/shape a real block element. o: x,y (px), r (deg), sx, sy (or s), kx/ky (skew deg), o (opacity), f (filter), clip, og (origin), br (radius).
 * Concepts are written for a row. On a column, concepts that travel along the line run in a rotated frame
 * (ROT = true): their offsets, scales, clips and origins are turned a quarter turn here so the blocks follow
 * the rotated canvas, while each block's own artwork stays upright.
 */
let ROT = false;
function insetRot(c) {
  return c.replace(/inset\(([^)]*)\)/, (m, body) => {
    const v = body.trim().split(/\s+/); const [T, R, B, L] = v.length === 1 ? [v[0], v[0], v[0], v[0]] : v.length === 2 ? [v[0], v[1], v[0], v[1]] : v.length === 3 ? [v[0], v[1], v[2], v[1]] : v;
    return `inset(${L} ${T} ${R} ${B})`;
  });
}
function ogRot(og) { const [a, b] = og.split(/\s+/).map((x) => parseFloat(x)); return `${100 - b}% ${a}%`; }
function X(b, o = {}) {
  const st = b.el.style;
  let x = o.x || 0; let y = o.y || 0; let sx = o.sx ?? o.s ?? 1; let sy = o.sy ?? o.s ?? 1; let kx = o.kx || 0; let ky = o.ky || 0; let clip = o.clip || ''; let og = o.og || '50% 50%';
  if (ROT) { [x, y] = [-y, x]; [sx, sy] = [sy, sx]; [kx, ky] = [ky, kx]; if (clip) clip = insetRot(clip); if (o.og) og = ogRot(og); }
  st.transform = `translate(${x.toFixed(2)}px,${y.toFixed(2)}px) rotate(${(o.r || 0).toFixed(2)}deg) scale(${sx.toFixed(3)},${sy.toFixed(3)})${kx ? ` skewX(${kx.toFixed(2)}deg)` : ''}${ky ? ` skewY(${ky.toFixed(2)}deg)` : ''}`;
  st.opacity = String(o.o ?? 1);
  st.filter = o.f || '';
  st.clipPath = clip;
  st.transformOrigin = og;
  st.borderRadius = o.br || '';
}

// ---------- canvas helpers (ctx is set per card) ----------
let ctx = null;
export function setCtx(c) { ctx = c; }
export function setRot(r) { ROT = r; }
const glowCache = new Map();
function glowImg(color) {
  let c = glowCache.get(color);
  if (!c) {
    if (typeof document === 'undefined') return { width: 64, height: 64 }; // headless tests
    c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, rgba(color, 1)); r.addColorStop(0.3, rgba(color, 0.55)); r.addColorStop(1, rgba(color, 0));
    g.fillStyle = r; g.fillRect(0, 0, 64, 64); glowCache.set(color, c);
  }
  return c;
}
function glow(x, y, r, color, a = 1) { if (a <= 0.01 || r <= 0.5) return; ctx.globalAlpha = a; ctx.drawImage(glowImg(color), x - r, y - r, r * 2, r * 2); }
function circ(x, y, r, color, a = 1) { if (a <= 0.01 || r <= 0) return; ctx.globalAlpha = a; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
function ring(x, y, r, color, w = 1.5, a = 1, a0 = 0, a1 = TAU) { if (a <= 0.01 || r <= 0) return; ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.arc(x, y, r, a0, a1); ctx.stroke(); }
function ell(x, y, rx, ry, color, w = 1.5, a = 1) { if (a <= 0.01) return; ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, TAU); ctx.stroke(); }
function line(x0, y0, x1, y1, color, w = 1.5, a = 1, cap = 'round') { if (a <= 0.01) return; ctx.globalAlpha = a; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = cap; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
function poly(pts, color, a = 1, stroke = null, w = 1) { if (a <= 0.01) return; ctx.globalAlpha = a; ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); if (color) { ctx.fillStyle = color; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = w; ctx.stroke(); } }
function rr(x, y, w, h, r) { r = Math.max(0, Math.min(r, w / 2, h / 2)); ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function box(x, y, w, h, r, fill, a = 1, stroke = null, sw = 1) { if (a <= 0.01) return; ctx.globalAlpha = a; rr(x, y, w, h, r); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sw; ctx.stroke(); } }
function star4(x, y, r, color, a = 1) { if (a <= 0.01 || r < 0.4) return; ctx.globalAlpha = a; ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.2, y - r * 0.2); ctx.lineTo(x + r, y); ctx.lineTo(x + r * 0.2, y + r * 0.2); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.2, y + r * 0.2); ctx.lineTo(x - r, y); ctx.lineTo(x - r * 0.2, y - r * 0.2); ctx.closePath(); ctx.fill(); }
function starN(x, y, r, n, inner, color, a = 1, rot = 0) { if (a <= 0.01 || r < 0.4) return; ctx.globalAlpha = a; ctx.fillStyle = color; ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const ang = rot - Math.PI / 2 + (i * Math.PI) / n; const rad = i % 2 ? r * inner : r; ctx.lineTo(x + Math.cos(ang) * rad, y + Math.sin(ang) * rad); } ctx.closePath(); ctx.fill(); }
function puff(x, y, r, a = 1, tint = '#ffffff') { glow(x, y, r * 1.5, tint, a * 0.55); circ(x, y, r * 0.75, tint, a * 0.55); }
function txt(s, x, y, size, color, a = 1, font = '600 ' + size + 'px ui-monospace, monospace', align = 'center') { if (a <= 0.01) return; ctx.globalAlpha = a; ctx.fillStyle = color; ctx.font = font; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillText(s, x, y); }
const order = (i, mode) => (mode === 'c' ? Math.abs(i - 3.5) : mode === 'r' ? 7 - i : i);


// Round-two helpers.
const SF_PAPER = ['#ffffff', '#ffe7a8', '#ffc2d9', '#c7e3ff'];
function petal5(x, y, r, color, a, rot) { starN(x, y, r, 5, 0.55, color, a, rot); circ(x, y, r * 0.22, '#fff8e6', a); ring(x, y, r * 1.04, '#ffffff', Math.max(1, r * 0.12), a * 0.9, 0, TAU); }
const GOLD = '#e9c46a';
const glyphOf = (b) => (b.el.querySelector('i') || {}).textContent || '✦';

export const REEL = {
  steam: {
    row: { name: "Steam Vent", dur: 1100, rot: false,
    init(S) { const r = rng(6); return S.b.map((b) => Array.from({ length: 5 }, (_, j) => ({ t0: 150 + j * 45 + r() * 30, dx: (r() - 0.5) * b.s * 0.5, h: b.s * (1.2 + r() * 1.1), sz: b.s * (0.18 + r() * 0.12) }))); },
    draw(S, t, P) {
      S.b.forEach((b, i) => {
        const L = t - i * 45; const shud = env(L, 0, 30, 120, 170);
        const lift = ei(seg(L, 170, 560));
        X(b, { x: Math.sin(L * 0.25) * 1.6 * shud, y: -b.s * 1.5 * lift, r: (i % 2 ? 4 : -4) * lift, o: 1 - seg(L, 380, 560) });
        for (const p of P[i]) { const u = seg(L, p.t0, p.t0 + 600); if (u <= 0 || u >= 1) continue; puff(b.x + p.dx * u, b.y - b.s * 0.3 - p.h * eo(u), p.sz * (0.6 + 1.6 * u), (1 - u) * 0.9, '#f4efe6'); }
        if (shud > 0) { circ(b.x - b.s * 0.36 - shud * 4, b.y - b.s * 0.36, 1.6, '#e1b25a', shud); circ(b.x + b.s * 0.36 + shud * 4, b.y - b.s * 0.36, 1.6, '#e1b25a', shud); }
      });
    } },
    col: { name: "Gear Train", dur: 1250, rot: true,
    draw(S, t) {
      S.b.forEach((b, i) => {
        const L = t - i * 30; const m = seg(L, 60, 240); const roll = ei(seg(t, 650, 1150));
        X(b, { s: 1 - 0.3 * m, r: 90 * m * (i % 2 ? 1 : -1), o: 1 - m });
        if (m <= 0) return;
        const x = b.x + roll * S.W * 0.9; const rot = (i % 2 ? 1 : -1) * (t / 260) + (i % 2 ? Math.PI / 8 : 0);
        const R = b.s * 0.5; const n = 8; const col = mix(b.c, '#c9953f', 0.45);
        ctx.globalAlpha = m * (1 - seg(t, 1000, 1200)); ctx.fillStyle = col; ctx.beginPath();
        for (let k = 0; k < n * 4; k++) { const ang = rot + (k / (n * 4)) * TAU; const rad = (k % 4 < 2) ? R : R * 0.78; ctx.lineTo(x + Math.cos(ang) * rad, b.y + Math.sin(ang) * rad); }
        ctx.closePath(); ctx.fill(); ctx.strokeStyle = mix(col, '#3a2410', 0.5); ctx.lineWidth = 1.2; ctx.stroke();
        circ(x, b.y, R * 0.28, mix(col, '#3a2410', 0.5), ctx.globalAlpha); circ(x - R * 0.1, b.y - R * 0.1, R * 0.08, '#fff3d0', ctx.globalAlpha);
      });
    } },
  },
  koi: {
    row: { name: "Koi Pass", dur: 1300, rot: false,
    draw(S, t) {
      const u = eio(seg(t, 0, 1000)); const x0 = S.b[0].x - S.s * 1.4; const x1 = S.b[7].x + S.s * 1.6;
      const hx = lerp(x0, x1, u); const hy = S.y + Math.sin(u * 9) * S.s * 0.12;
      S.b.forEach((b) => { const v = seg(hx - b.x, -S.s * 0.2, S.s * 0.8); X(b, { s: 1 - 0.35 * v, y: b.s * 0.1 * v, o: 1 - v, f: `brightness(${1 - 0.5 * v})` }); if (v > 0 && v < 1) ell(b.x, b.y + b.s * 0.1, b.s * (0.3 + 0.8 * v), b.s * (0.12 + 0.3 * v), '#dfe8ff', 1.2, (1 - v) * 0.7); });
      const a = env(t, 0, 80, 950, 1100); if (a <= 0) return;
      const L = S.s * 1.25; const ang = Math.cos(u * 9) * 0.25; const tail = Math.sin(t / 60) * 0.5;
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang); ctx.globalAlpha = a;
      ctx.fillStyle = '#ff7a2e'; ctx.beginPath(); ctx.ellipse(-L * 0.35, 0, L * 0.45, L * 0.17, 0, 0, TAU); ctx.fill();
      ctx.save(); ctx.translate(-L * 0.78, 0); ctx.rotate(tail); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-L * 0.32, -L * 0.17); ctx.lineTo(-L * 0.25, 0); ctx.lineTo(-L * 0.32, L * 0.17); ctx.closePath(); ctx.fillStyle = 'rgba(255,170,120,.85)'; ctx.fill(); ctx.restore();
      ctx.fillStyle = '#fff6ea'; ctx.beginPath(); ctx.ellipse(-L * 0.25, -L * 0.03, L * 0.15, L * 0.08, 0.3, 0, TAU); ctx.fill();
      ctx.restore();
      glow(hx - L * 0.3, hy, L * 0.9, '#ffb070', a * 0.25);
    } },
    col: { name: "Koi Pass", dur: 1300, rot: true,
    draw(S, t) {
      const u = eio(seg(t, 0, 1000)); const x0 = S.b[0].x - S.s * 1.4; const x1 = S.b[7].x + S.s * 1.6;
      const hx = lerp(x0, x1, u); const hy = S.y + Math.sin(u * 9) * S.s * 0.12;
      S.b.forEach((b) => { const v = seg(hx - b.x, -S.s * 0.2, S.s * 0.8); X(b, { s: 1 - 0.35 * v, y: b.s * 0.1 * v, o: 1 - v, f: `brightness(${1 - 0.5 * v})` }); if (v > 0 && v < 1) ell(b.x, b.y + b.s * 0.1, b.s * (0.3 + 0.8 * v), b.s * (0.12 + 0.3 * v), '#dfe8ff', 1.2, (1 - v) * 0.7); });
      const a = env(t, 0, 80, 950, 1100); if (a <= 0) return;
      const L = S.s * 1.25; const ang = Math.cos(u * 9) * 0.25; const tail = Math.sin(t / 60) * 0.5;
      ctx.save(); ctx.translate(hx, hy); ctx.rotate(ang); ctx.globalAlpha = a;
      ctx.fillStyle = '#ff7a2e'; ctx.beginPath(); ctx.ellipse(-L * 0.35, 0, L * 0.45, L * 0.17, 0, 0, TAU); ctx.fill();
      ctx.save(); ctx.translate(-L * 0.78, 0); ctx.rotate(tail); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-L * 0.32, -L * 0.17); ctx.lineTo(-L * 0.25, 0); ctx.lineTo(-L * 0.32, L * 0.17); ctx.closePath(); ctx.fillStyle = 'rgba(255,170,120,.85)'; ctx.fill(); ctx.restore();
      ctx.fillStyle = '#fff6ea'; ctx.beginPath(); ctx.ellipse(-L * 0.25, -L * 0.03, L * 0.15, L * 0.08, 0.3, 0, TAU); ctx.fill();
      ctx.restore();
      glow(hx - L * 0.3, hy, L * 0.9, '#ffb070', a * 0.25);
    } },
  },
  witch: {
    row: { name: "Rune Seal", dur: 1250, rot: false,
    draw(S, t) {
      S.b.forEach((b, i) => {
        const L = t - i * 60; const d = eio(seg(L, 0, 280)); const col = mix(b.c, '#ffffff', 0.45); const R = b.s * 0.62;
        X(b, { o: 1 - seg(L, 240, 420), s: 1 - 0.2 * seg(L, 240, 420) });
        const fade = 1 - seg(L, 520, 780); const grow = 1 + 0.25 * seg(L, 420, 780);
        if (d > 0) ring(b.x, b.y, R * grow, col, 1.6, fade, -Math.PI / 2, -Math.PI / 2 + d * TAU);
        if (d >= 1) { for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + (k / 3) * TAU; const a2 = a + (TAU / 3); line(b.x + Math.cos(a) * R * 0.75 * grow, b.y + Math.sin(a) * R * 0.75 * grow, b.x + Math.cos(a2) * R * 0.75 * grow, b.y + Math.sin(a2) * R * 0.75 * grow, col, 1.2, fade * 0.9); } }
        const fl = env(L, 380, 420, 440, 600); if (fl > 0) { glow(b.x, b.y, b.s * 0.9, b.c, fl * 0.8); star4(b.x, b.y, b.s * 0.35 * fl, '#ffffff', fl); }
      });
    } },
    col: { name: "Rune Seal", dur: 1250, rot: false,
    draw(S, t) {
      S.b.forEach((b, i) => {
        const L = t - i * 60; const d = eio(seg(L, 0, 280)); const col = mix(b.c, '#ffffff', 0.45); const R = b.s * 0.62;
        X(b, { o: 1 - seg(L, 240, 420), s: 1 - 0.2 * seg(L, 240, 420) });
        const fade = 1 - seg(L, 520, 780); const grow = 1 + 0.25 * seg(L, 420, 780);
        if (d > 0) ring(b.x, b.y, R * grow, col, 1.6, fade, -Math.PI / 2, -Math.PI / 2 + d * TAU);
        if (d >= 1) { for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + (k / 3) * TAU; const a2 = a + (TAU / 3); line(b.x + Math.cos(a) * R * 0.75 * grow, b.y + Math.sin(a) * R * 0.75 * grow, b.x + Math.cos(a2) * R * 0.75 * grow, b.y + Math.sin(a2) * R * 0.75 * grow, col, 1.2, fade * 0.9); } }
        const fl = env(L, 380, 420, 440, 600); if (fl > 0) { glow(b.x, b.y, b.s * 0.9, b.c, fl * 0.8); star4(b.x, b.y, b.s * 0.35 * fl, '#ffffff', fl); }
      });
    } },
  },
  patisserie: {
    row: { name: "Piped Ribbon", dur: 1300, rot: false,
    draw(S, t) {
      const x0 = S.b[0].x - S.s * 0.55; const x1 = S.b[7].x + S.s * 0.55; const hx = lerp(x0, x1, eio(seg(t, 0, 600)));
      const fade = 1 - seg(t, 850, 1250); const sc = S.s * 0.32;
      S.b.forEach((b) => { const v = seg(hx - b.x, -S.s * 0.3, S.s * 0.3); X(b, { o: 1 - v, s: 1 - 0.1 * v }); });
      for (let x = x0; x < hx; x += sc * 0.55) { const k = (x - x0) / (sc * 0.55); const y = S.y + Math.sin(k * 1.2) * sc * 0.25; circ(x, y + 2, sc, '#d98f9a', fade * 0.35); circ(x, y, sc, '#fff4f2', fade); circ(x - sc * 0.3, y - sc * 0.35, sc * 0.3, '#ffffff', fade); }
      const na = env(t, 0, 60, 580, 700); if (na > 0) { poly([[hx - 8, S.y - S.s * 0.55], [hx + 8, S.y - S.s * 0.55], [hx, S.y - S.s * 0.25]], '#c8ccd6', na, '#8d93a3', 1); box(hx - 12, S.y - S.s * 1.2, 24, S.s * 0.65, 8, '#f2c6cc', na); }
    } },
    col: { name: "Piped Ribbon", dur: 1300, rot: true,
    draw(S, t) {
      const x0 = S.b[0].x - S.s * 0.55; const x1 = S.b[7].x + S.s * 0.55; const hx = lerp(x0, x1, eio(seg(t, 0, 600)));
      const fade = 1 - seg(t, 850, 1250); const sc = S.s * 0.32;
      S.b.forEach((b) => { const v = seg(hx - b.x, -S.s * 0.3, S.s * 0.3); X(b, { o: 1 - v, s: 1 - 0.1 * v }); });
      for (let x = x0; x < hx; x += sc * 0.55) { const k = (x - x0) / (sc * 0.55); const y = S.y + Math.sin(k * 1.2) * sc * 0.25; circ(x, y + 2, sc, '#d98f9a', fade * 0.35); circ(x, y, sc, '#fff4f2', fade); circ(x - sc * 0.3, y - sc * 0.35, sc * 0.3, '#ffffff', fade); }
      const na = env(t, 0, 60, 580, 700); if (na > 0) { poly([[hx - 8, S.y - S.s * 0.55], [hx + 8, S.y - S.s * 0.55], [hx, S.y - S.s * 0.25]], '#c8ccd6', na, '#8d93a3', 1); box(hx - 12, S.y - S.s * 1.2, 24, S.s * 0.65, 8, '#f2c6cc', na); }
    } },
  },
  abyss: {
    row: { name: "Lumen Pulse", dur: 1350, rot: false,
    init(S) { const r = rng(10); return S.b.map(() => Array.from({ length: 4 }, () => ({ dx: (r() - 0.5) * 0.8, h: 0.8 + r() * 1.2, ph: r() * TAU, t0: r() * 200 }))); },
    draw(S, t, P) {
      S.b.forEach((b, i) => {
        const L = t - i * 60; const f = env(L, 0, 60, 120, 380);
        X(b, { f: `brightness(${1 + 1.4 * f - 0.8 * seg(L, 200, 480)})`, o: 1 - seg(L, 380, 560) });
        if (f > 0) glow(b.x, b.y, b.s * 1.2, '#5ff3ff', f * 0.7);
        for (const p of P[i]) { const u = seg(L, 300 + p.t0, 1000 + p.t0); if (u <= 0 || u >= 1) continue; const tw = 0.6 + 0.4 * Math.sin(L / 50 + p.ph); const x = b.x + p.dx * b.s + Math.sin(u * 5 + p.ph) * 5; const y = b.y - u * b.s * p.h; glow(x, y, 6, '#7ff7e6', (1 - u) * tw); circ(x, y, 1.3, '#e6fffb', (1 - u) * tw); }
      });
    } },
    col: { name: "Lumen Pulse", dur: 1350, rot: false,
    init(S) { const r = rng(10); return S.b.map(() => Array.from({ length: 4 }, () => ({ dx: (r() - 0.5) * 0.8, h: 0.8 + r() * 1.2, ph: r() * TAU, t0: r() * 200 }))); },
    draw(S, t, P) {
      S.b.forEach((b, i) => {
        const L = t - i * 60; const f = env(L, 0, 60, 120, 380);
        X(b, { f: `brightness(${1 + 1.4 * f - 0.8 * seg(L, 200, 480)})`, o: 1 - seg(L, 380, 560) });
        if (f > 0) glow(b.x, b.y, b.s * 1.2, '#5ff3ff', f * 0.7);
        for (const p of P[i]) { const u = seg(L, 300 + p.t0, 1000 + p.t0); if (u <= 0 || u >= 1) continue; const tw = 0.6 + 0.4 * Math.sin(L / 50 + p.ph); const x = b.x + p.dx * b.s + Math.sin(u * 5 + p.ph) * 5; const y = b.y - u * b.s * p.h; glow(x, y, 6, '#7ff7e6', (1 - u) * tw); circ(x, y, 1.3, '#e6fffb', (1 - u) * tw); }
      });
    } },
  },
  toybox: {
    row: { name: "Domino Topple", dur: 1300, rot: false,
    draw(S, t) {
      S.b.forEach((b, i) => {
        const t0 = 60 + i * 75; const v = ei(seg(t, t0, t0 + 170)) ;
        X(b, { r: 90 * v, og: '100% 100%', o: 1 - seg(t, t0 + 450, t0 + 650) });
        const land = seg(t, t0 + 170, t0 + 480); if (land > 0 && land < 1) for (let k = 0; k < 3; k++) puff(b.x + b.s * 0.9 + (k - 1) * 5, b.y + b.s * 0.45 - land * 8, 3 + 5 * land, (1 - land) * 0.7, '#e9d6b5');
      });
    } },
    col: { name: "Domino Topple", dur: 1300, rot: false,
    draw(S, t) {
      S.b.forEach((b, i) => {
        const t0 = 60 + i * 75; const v = ei(seg(t, t0, t0 + 170)) ;
        X(b, { r: 90 * v, og: '100% 100%', o: 1 - seg(t, t0 + 450, t0 + 650) });
        const land = seg(t, t0 + 170, t0 + 480); if (land > 0 && land < 1) for (let k = 0; k < 3; k++) puff(b.x + b.s * 0.9 + (k - 1) * 5, b.y + b.s * 0.45 - land * 8, 3 + 5 * land, (1 - land) * 0.7, '#e9d6b5');
      });
    } },
  },
  glass: {
    row: { name: "Sunbeam Through", dur: 1350, rot: false,
    draw(S, t) {
      const bx = lerp(S.b[0].x - S.s * 1.5, S.b[7].x + S.s * 1.5, eio(seg(t, 0, 750)));
      const ba = env(t, 0, 80, 700, 820);
      if (ba > 0) { ctx.save(); ctx.globalAlpha = ba * 0.35; const g = ctx.createLinearGradient(bx - 40, 0, bx + 40, 0); g.addColorStop(0, 'rgba(255,240,200,0)'); g.addColorStop(0.5, 'rgba(255,240,200,1)'); g.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = g; ctx.transform(1, 0, -0.4, 1, 0, 0); ctx.fillRect(bx - 40 + S.y * 0.4, 0, 80, S.H); ctx.restore(); }
      S.b.forEach((b) => {
        const v = seg(bx - b.x, -S.s * 0.3, S.s * 0.6); const L = v > 0 ? 1 : 0; const out = seg(bx - b.x, S.s * 0.8, S.s * 3.5);
        X(b, { f: `brightness(${1 + 0.9 * env(v, 0, 0.5, 0.7, 1)})`, o: 1 - out });
        const sh = env(bx - b.x, -S.s * 0.2, S.s * 0.6, S.s * 2.5, S.s * 5); if (sh > 0) { ctx.save(); ctx.globalAlpha = sh * 0.45; const g = ctx.createLinearGradient(0, b.y + b.s / 2, 0, b.y + b.s * 2.6); g.addColorStop(0, rgba(b.c, 0.9)); g.addColorStop(1, rgba(b.c, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(b.x - b.s * 0.45, b.y + b.s / 2); ctx.lineTo(b.x + b.s * 0.45, b.y + b.s / 2); ctx.lineTo(b.x + b.s * 0.9, b.y + b.s * 2.6); ctx.lineTo(b.x - b.s * 0.1, b.y + b.s * 2.6); ctx.closePath(); ctx.fill(); ctx.restore(); }
        if (L) void 0;
      });
    } },
    col: { name: "Sunbeam Through", dur: 1350, rot: true,
    draw(S, t) {
      const bx = lerp(S.b[0].x - S.s * 1.5, S.b[7].x + S.s * 1.5, eio(seg(t, 0, 750)));
      const ba = env(t, 0, 80, 700, 820);
      if (ba > 0) { ctx.save(); ctx.globalAlpha = ba * 0.35; const g = ctx.createLinearGradient(bx - 40, 0, bx + 40, 0); g.addColorStop(0, 'rgba(255,240,200,0)'); g.addColorStop(0.5, 'rgba(255,240,200,1)'); g.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = g; ctx.transform(1, 0, -0.4, 1, 0, 0); ctx.fillRect(bx - 40 + S.y * 0.4, 0, 80, S.H); ctx.restore(); }
      S.b.forEach((b) => {
        const v = seg(bx - b.x, -S.s * 0.3, S.s * 0.6); const L = v > 0 ? 1 : 0; const out = seg(bx - b.x, S.s * 0.8, S.s * 3.5);
        X(b, { f: `brightness(${1 + 0.9 * env(v, 0, 0.5, 0.7, 1)})`, o: 1 - out });
        const sh = env(bx - b.x, -S.s * 0.2, S.s * 0.6, S.s * 2.5, S.s * 5); if (sh > 0) { ctx.save(); ctx.globalAlpha = sh * 0.45; const g = ctx.createLinearGradient(0, b.y + b.s / 2, 0, b.y + b.s * 2.6); g.addColorStop(0, rgba(b.c, 0.9)); g.addColorStop(1, rgba(b.c, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(b.x - b.s * 0.45, b.y + b.s / 2); ctx.lineTo(b.x + b.s * 0.45, b.y + b.s / 2); ctx.lineTo(b.x + b.s * 0.9, b.y + b.s * 2.6); ctx.lineTo(b.x - b.s * 0.1, b.y + b.s * 2.6); ctx.closePath(); ctx.fill(); ctx.restore(); }
        if (L) void 0;
      });
    } },
  },
  mahjong: {
    row: { name: "Tile Flip", dur: 1300, rot: false,
    draw(S, t) {
      const slide = ei(seg(t, 820, 1150));
      S.b.forEach((b, i) => {
        const L = t - i * 55; const a = seg(L, 0, 110); const c = seg(L, 110, 220);
        const sx = L < 110 ? 1 - a : c;
        X(b, { sx: L < 110 ? Math.max(0.02, 1 - a) : 0.02, o: L < 110 ? 1 : 0 });
        if (L >= 110) { const w = b.s * Math.max(0.02, c); const x = b.x + slide * S.W * 0.8; ctx.globalAlpha = 1 - slide; box(x - w / 2, b.y - b.s / 2, w, b.s, b.s * 0.12, '#f4ead8', 1 - slide); box(x - w / 2 + 2, b.y - b.s / 2 + 2, Math.max(0, w - 4), b.s - 6, b.s * 0.1, '#2e8a62', 1 - slide); void sx; }
      });
    } },
    col: { name: "Tile Flip", dur: 1300, rot: true,
    draw(S, t) {
      const slide = ei(seg(t, 820, 1150));
      S.b.forEach((b, i) => {
        const L = t - i * 55; const a = seg(L, 0, 110); const c = seg(L, 110, 220);
        const sx = L < 110 ? 1 - a : c;
        X(b, { sx: L < 110 ? Math.max(0.02, 1 - a) : 0.02, o: L < 110 ? 1 : 0 });
        if (L >= 110) { const w = b.s * Math.max(0.02, c); const x = b.x + slide * S.W * 0.8; ctx.globalAlpha = 1 - slide; box(x - w / 2, b.y - b.s / 2, w, b.s, b.s * 0.12, '#f4ead8', 1 - slide); box(x - w / 2 + 2, b.y - b.s / 2 + 2, Math.max(0, w - 4), b.s - 6, b.s * 0.1, '#2e8a62', 1 - slide); void sx; }
      });
    } },
  },
  starflower: {
    row: { name: "Firework Bloom", dur: 1500, rot: false,
    init(S) { const r = rng(153); return S.b.map(() => ({ h: 1.3 + r() * 1.0, n: 8, c2: SF_PAPER[Math.floor(r() * 4)] })); },
    draw(S, t, P) {
      S.b.forEach((b, i) => {
        const L = t - i * 45; const pinch = ei(seg(L, 0, 140)); const bloom = back(seg(L, 140, 360)); const up = seg(L, 420 + (i % 3) * 60, 760 + (i % 3) * 60); const pop = seg(L, 760 + (i % 3) * 60, 1150 + (i % 3) * 60);
        X(b, { s: 1 - pinch, o: 1 - pinch });
        if (L < 140) return;
        const y = b.y - b.s * P[i].h * eo(up);
        if (pop <= 0) { petal5(b.x, y, b.s * 0.6 * bloom * (1 - 0.45 * up), b.c, 1, up * 4); if (up > 0) line(b.x, y + b.s * 0.3, b.x, y + b.s * (0.3 + 0.9 * up), '#ffffff', 2, 0.7 * (1 - up)); }
        else if (pop < 1) { for (let k = 0; k < P[i].n; k++) { const a = (k / P[i].n) * TAU; const d = b.s * 0.85 * expo(pop); starN(b.x + Math.cos(a) * d, y + Math.sin(a) * d + b.s * 0.3 * pop * pop, 4 * (1 - pop * 0.5), 5, 0.45, k % 2 ? b.c : P[i].c2, 1 - pop, pop * 3); } glow(b.x, y, b.s * 0.7, b.c, (1 - pop) * 0.6); }
      });
    } },
    col: { name: "Firework Bloom", dur: 1500, rot: false,
    init(S) { const r = rng(153); return S.b.map(() => ({ h: 1.3 + r() * 1.0, n: 8, c2: SF_PAPER[Math.floor(r() * 4)] })); },
    draw(S, t, P) {
      S.b.forEach((b, i) => {
        const L = t - i * 45; const pinch = ei(seg(L, 0, 140)); const bloom = back(seg(L, 140, 360)); const up = seg(L, 420 + (i % 3) * 60, 760 + (i % 3) * 60); const pop = seg(L, 760 + (i % 3) * 60, 1150 + (i % 3) * 60);
        X(b, { s: 1 - pinch, o: 1 - pinch });
        if (L < 140) return;
        const y = b.y - b.s * P[i].h * eo(up);
        if (pop <= 0) { petal5(b.x, y, b.s * 0.6 * bloom * (1 - 0.45 * up), b.c, 1, up * 4); if (up > 0) line(b.x, y + b.s * 0.3, b.x, y + b.s * (0.3 + 0.9 * up), '#ffffff', 2, 0.7 * (1 - up)); }
        else if (pop < 1) { for (let k = 0; k < P[i].n; k++) { const a = (k / P[i].n) * TAU; const d = b.s * 0.85 * expo(pop); starN(b.x + Math.cos(a) * d, y + Math.sin(a) * d + b.s * 0.3 * pop * pop, 4 * (1 - pop * 0.5), 5, 0.45, k % 2 ? b.c : P[i].c2, 1 - pop, pop * 3); } glow(b.x, y, b.s * 0.7, b.c, (1 - pop) * 0.6); }
      });
    } },
  },
  moonside: {
    row: { name: "Orbit", dur: 1500, rot: false,
    draw(S, t) {
      const form = eio(seg(t, 0, 380)); const spin = t / 380; const fall = ei(seg(t, 900, 1300));
      const rx = (S.b[7].x - S.b[0].x) / 2 * (1 - fall); const ry = S.s * 0.55 * (1 - fall);
      S.b.forEach((b, i) => {
        const a = (i / 8) * TAU + spin; const ox = S.cx + Math.cos(a) * rx; const oy = S.y + Math.sin(a) * ry; const depth = 0.75 + 0.25 * Math.sin(a);
        X(b, { x: (ox - b.x) * form, y: (oy - b.y) * form, s: 1 - (0.62 - 0.12 * Math.sin(a)) * form, br: `${22 + 28 * form}%`, f: `brightness(${1 - 0.35 * (1 - depth) * form})`, o: 1 - seg(t, 1150, 1320) });
      });
      ell(S.cx, S.y, rx, ry, '#b9c3d6', 1, form * 0.35 * (1 - fall)); const g = env(t, 1150, 1250, 1300, 1450); if (g > 0) { glow(S.cx, S.y, S.s * 0.8, '#dfe6f5', g * 0.7); star4(S.cx, S.y, S.s * 0.5 * g, '#ffffff', g); }
    } },
    col: { name: "Phase Wane", dur: 1350, rot: false,
    draw(S, t) {
      S.b.forEach((b, i) => {
        const L = t - i * 60; const u = eio(seg(L, 0, 520)); const h = b.s / 2;
        X(b, { o: 1 - seg(L, 480, 560) });
        if (u <= 0 || L > 560) return;
        ctx.save(); ctx.beginPath(); ctx.rect(b.x - h, b.y - h, b.s, b.s); ctx.clip(); circ(b.x - b.s * 1.5 + b.s * 1.5 * u, b.y, b.s * 0.78, S.theme.vars['--cell'] || '#0b0d18', 0.97); ctx.restore();
        const g = env(L, 380, 450, 480, 560); if (g > 0) star4(b.x + h * 0.6, b.y - h * 0.6, 7 * g, '#ffffff', g);
      });
    } },
  },
  pixel: {
    row: { name: "Bounce Drop", dur: 1100, rot: false,
    draw(S, t) {
      S.b.forEach((b, i) => {
        const L = t - order(i, 'c') * 40; const q = Math.floor(L / 60) * 60; const u = seg(q, 0, 420); const bounce = seg(q, 420, 660);
        const step = b.s / 4; const y = Math.round((b.s * 1.4 * u * u - Math.sin(bounce * Math.PI) * b.s * 0.5 + b.s * 0.3 * bounce) / step) * step;
        const blink = q >= 660 ? (Math.floor(q / 60) % 2) : 1;
        X(b, { y, o: q > 840 ? 0 : blink });
      });
    } },
    col: { name: "Downsample", dur: 1000, rot: false,
    draw(S, t) {
      S.b.forEach((b, i) => {
        const n = Math.floor((t - i * 30) / 80); X(b, { o: n < 0 ? 1 : 0 }); if (n < 0) return;
        const G = [4, 2, 1, 1, 1][n] || 0; if (!G || (n >= 3 && n % 2 === 0)) return; const h = b.s / 2; const p = b.s / G;
        for (let a = 0; a < G; a++) for (let c = 0; c < G; c++) { const tone = ((a + c) % 2) * 0.18 + (a === 0 && c === 0 ? 0.25 : 0); box(b.x - h + c * p + 0.5, b.y - h + a * p + 0.5, p - 1, p - 1, 0, mix(b.c, '#ffffff', tone), 1); }
      });
    } },
  },
  capsule: {
    row: { name: "Capsule Pop", dur: 1250, rot: false,
    draw(S, t) {
      S.b.forEach((b, i) => {
        const L = t - i * 60; const tw = env(L, 0, 60, 100, 140); const open = eo(seg(L, 120, 420)); const gone = seg(L, 450, 700);
        X(b, { r: 8 * Math.sin(L / 20) * tw, clip: open > 0 ? 'inset(50% 0 0 0)' : '', o: 1 - gone });
        if (open <= 0) return;
        ctx.save(); ctx.translate(b.x - b.s * 0.25 * open, b.y - b.s * 0.25 - b.s * 0.55 * open); ctx.rotate(-0.9 * open); box(-b.s / 2, -b.s * 0.25, b.s, b.s * 0.5, b.s * 0.25, mix(b.c, '#ffffff', 0.2), 1 - gone); ctx.restore();
        const f = env(L, 120, 180, 220, 420); if (f > 0) { glow(b.x, b.y - b.s * 0.1, b.s * 0.8, '#fff4c8', f * 0.8); for (let k = 0; k < 2; k++) star4(b.x + (k ? 1 : -1) * b.s * 0.3 * open, b.y - b.s * (0.5 + 0.6 * open) - k * 6, 6 * f, '#ffffff', f); }
      });
    } },
    col: { name: "Capsule Pop", dur: 1250, rot: false,
    draw(S, t) {
      S.b.forEach((b, i) => {
        const L = t - i * 60; const tw = env(L, 0, 60, 100, 140); const open = eo(seg(L, 120, 420)); const gone = seg(L, 450, 700);
        X(b, { r: 8 * Math.sin(L / 20) * tw, clip: open > 0 ? 'inset(50% 0 0 0)' : '', o: 1 - gone });
        if (open <= 0) return;
        ctx.save(); ctx.translate(b.x - b.s * 0.25 * open, b.y - b.s * 0.25 - b.s * 0.55 * open); ctx.rotate(-0.9 * open); box(-b.s / 2, -b.s * 0.25, b.s, b.s * 0.5, b.s * 0.25, mix(b.c, '#ffffff', 0.2), 1 - gone); ctx.restore();
        const f = env(L, 120, 180, 220, 420); if (f > 0) { glow(b.x, b.y - b.s * 0.1, b.s * 0.8, '#fff4c8', f * 0.8); for (let k = 0; k < 2; k++) star4(b.x + (k ? 1 : -1) * b.s * 0.3 * open, b.y - b.s * (0.5 + 0.6 * open) - k * 6, 6 * f, '#ffffff', f); }
      });
    } },
  },
  wonderland: {
    row: { name: "Card Fan", dur: 1450, rot: false,
    draw(S, t) {
      const g = eio(seg(t, 0, 420)); const flip = seg(t, 650, 850); const fly = ei(seg(t, 850, 1250));
      S.b.forEach((b, i) => {
        const tx = S.cx + (i - 3.5) * b.s * 0.32;
        X(b, { og: '50% 110%', x: (tx - b.x) * g + fly * S.W * 0.9, y: (S.y - b.y) * g - b.s * 0.25 * g - fly * b.s, r: (i - 3.5) * 11 * g + fly * 40, sx: flip < 0.5 ? 1 - flip * 2 : 0.02, o: flip < 0.5 ? 1 : 0 });
        if (flip >= 0.5) { const w = b.s * Math.max(0.02, (flip - 0.5) * 2); ctx.save(); ctx.translate(b.x + (tx - b.x) * g + fly * S.W * 0.9, lerp(b.y, S.y, g) + b.s * 0.6 - b.s * 0.25 * g - fly * b.s); ctx.rotate(((i - 3.5) * 11 + fly * 40) * Math.PI / 180); box(-w / 2, -b.s * 1.1, w, b.s, 4, '#c8242f', 1 - seg(fly, 0.6, 1), '#ffffff', 1.5); ctx.restore(); }
      });
    } },
    col: { name: "Riffle", dur: 1250, rot: true,
    draw(S, t) {
      const lift = ei(seg(t, 850, 1150));
      S.b.forEach((b, i) => {
        const left = i < 4; const k = left ? i : i - 4; const L = t - (left ? k : k + 0.5) * 70; const v = eio(seg(L, 0, 380));
        const slot = left ? k * 2 : k * 2 + 1;
        X(b, { x: (S.cx - b.x) * v + (slot - 3.5) * 1.5 * v, y: -slot * 1.2 * v - lift * b.s * 1.5, r: (left ? -1 : 1) * 12 * Math.sin(v * Math.PI), o: 1 - seg(t, 1000, 1180) });
      });
    } },
  },
  papersky: {
    row: { name: "Paper Plane", dur: 1450, rot: false,
    draw(S, t) {
      S.b.forEach((b, i) => {
        const L = t - i * 70; const fold = eio(seg(L, 0, 220)); const fly = seg(L, 220, 1000);
        X(b, { sx: 1 - fold, sy: 1 - 0.5 * fold, o: 1 - fold });
        if (fold <= 0) return;
        const px = b.x + b.s * 3 * eo(fly) + b.s * 0.3 * fly; const py = b.y - b.s * 1.8 * eo(fly) + Math.sin(fly * 6) * 4; const a = 1 - seg(fly, 0.7, 1); const L2 = b.s * 0.55 * fold;
        ctx.save(); ctx.setLineDash([3, 4]); ctx.globalAlpha = a * 0.6; ctx.strokeStyle = '#8f9bc4'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.quadraticCurveTo(b.x + b.s * 1.2 * eo(fly), b.y, px, py); ctx.stroke(); ctx.restore();
        ctx.save(); ctx.translate(px, py); ctx.rotate(-0.45); poly([[L2, 0], [-L2, -L2 * 0.5], [-L2 * 0.6, 0]], '#ffffff', a, '#b8c0dc', 1); poly([[L2, 0], [-L2 * 0.6, 0], [-L2, L2 * 0.35]], mix(b.c, '#ffffff', 0.4), a, '#b8c0dc', 1); ctx.restore();
      });
    } },
    col: { name: "Paper Plane", dur: 1450, rot: false,
    draw(S, t) {
      S.b.forEach((b, i) => {
        const L = t - i * 70; const fold = eio(seg(L, 0, 220)); const fly = seg(L, 220, 1000);
        X(b, { sx: 1 - fold, sy: 1 - 0.5 * fold, o: 1 - fold });
        if (fold <= 0) return;
        const px = b.x + b.s * 3 * eo(fly) + b.s * 0.3 * fly; const py = b.y - b.s * 1.8 * eo(fly) + Math.sin(fly * 6) * 4; const a = 1 - seg(fly, 0.7, 1); const L2 = b.s * 0.55 * fold;
        ctx.save(); ctx.setLineDash([3, 4]); ctx.globalAlpha = a * 0.6; ctx.strokeStyle = '#8f9bc4'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.quadraticCurveTo(b.x + b.s * 1.2 * eo(fly), b.y, px, py); ctx.stroke(); ctx.restore();
        ctx.save(); ctx.translate(px, py); ctx.rotate(-0.45); poly([[L2, 0], [-L2, -L2 * 0.5], [-L2 * 0.6, 0]], '#ffffff', a, '#b8c0dc', 1); poly([[L2, 0], [-L2 * 0.6, 0], [-L2, L2 * 0.35]], mix(b.c, '#ffffff', 0.4), a, '#b8c0dc', 1); ctx.restore();
      });
    } },
  },
  prism: {
    row: { name: "Widget Dismiss", dur: 1150, rot: false,
    draw(S, t) {
      S.b.forEach((b, i) => {
        const L = t - i * 50; const lift = eo(seg(L, 0, 120)); const go = ei(seg(L, 120, 480));
        X(b, { y: -b.s * 0.08 * lift - b.s * 2 * go, s: 1 + 0.04 * lift - 0.1 * go, o: 1 - seg(go, 0.5, 1), f: `drop-shadow(0 ${3 + 5 * lift}px ${4 + 4 * lift}px rgba(40,60,90,${0.25 * lift}))` });
      });
    } },
    col: { name: "Widget Dismiss", dur: 1150, rot: false,
    draw(S, t) {
      S.b.forEach((b, i) => {
        const L = t - i * 50; const lift = eo(seg(L, 0, 120)); const go = ei(seg(L, 120, 480));
        X(b, { y: -b.s * 0.08 * lift - b.s * 2 * go, s: 1 + 0.04 * lift - 0.1 * go, o: 1 - seg(go, 0.5, 1), f: `drop-shadow(0 ${3 + 5 * lift}px ${4 + 4 * lift}px rgba(40,60,90,${0.25 * lift}))` });
      });
    } },
  },
  reliquary: {
    row: { name: "Gilded Ascension", dur: 1600, rot: false,
    draw(S, t) {
      const R = S.s * 1.25; const hx = S.cx; const hy = S.vert ? S.y : S.y - S.s * 1.55; const kx = S.vert ? 0.42 : 1; const ky = S.vert ? 1.5 : 0.32; const turn = eio(seg(t, 900, 1300)) * 0.9; const fl = env(t, 1200, 1280, 1300, 1550); const fade = 1 - seg(t, 1250, 1560);
      ell(hx, hy, R * kx * seg(t, 650, 950), R * ky * seg(t, 650, 950), GOLD, 1.4, 0.7 * fade);
      S.b.forEach((b, i) => {
        const L = t - order(i, 'c') * 55; const lift = seg(L, 80, 700); const e = eio(lift);
        X(b, { o: 1 - seg(L, 100, 400), f: `brightness(${1 - 0.6 * seg(L, 100, 400)})` });
        if (L < 60) return;
        const a = Math.PI + ((i + 0.5) / 8) * TAU * 0.999 + turn; const tx = hx + Math.cos(a) * R * kx; const ty = hy + Math.sin(a) * R * ky;
        const x = lerp(b.x, tx, e); const y = lerp(b.y, ty, e) - Math.sin(e * Math.PI) * S.s * 0.25;
        glow(x, y, S.s * 0.45, GOLD, 0.55 * fade);
        txt(glyphOf(b), x, y, S.s * (0.5 - 0.15 * e), '#fff1c8', fade * seg(L, 60, 200), `${Math.round(S.s * (0.5 - 0.15 * e))}px serif`);
      });
      if (fl > 0) { glow(hx, hy, S.s * 2.2, '#fff3c9', fl * 0.7); star4(hx, hy - R * ky, S.s * 0.6 * fl, '#ffffff', fl); }
    } },
    col: { name: "Bell Toll", dur: 1500, rot: false,
    draw(S, t) {
      const tolls = [0, 380, 760];
      const archAt = (r, a) => { ctx.globalAlpha = a; ctx.strokeStyle = GOLD; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(S.cx - r, S.y + r * 0.35); ctx.lineTo(S.cx - r, S.y - r * 0.15); ctx.quadraticCurveTo(S.cx - r, S.y - r * 0.85, S.cx, S.y - r * 1.15); ctx.quadraticCurveTo(S.cx + r, S.y - r * 0.85, S.cx + r, S.y - r * 0.15); ctx.lineTo(S.cx + r, S.y + r * 0.35); ctx.stroke(); };
      let pulse = 0;
      tolls.forEach((t0, k) => { const u = seg(t, t0, t0 + 900); if (u > 0 && u < 1) archAt(S.s * (0.6 + 4.2 * eo(u)), (1 - u) * 0.9); pulse = Math.max(pulse, env(t, t0, t0 + 50, t0 + 90, t0 + 320)); });
      S.b.forEach((b) => { X(b, { s: 1 + 0.08 * pulse, f: `brightness(${1 + 0.9 * pulse}) sepia(${0.5 * pulse})`, o: 1 - seg(t, 760, 1150) }); if (pulse > 0) glow(b.x, b.y, b.s * 0.7, GOLD, pulse * 0.45 * (1 - seg(t, 760, 1150))); });
      const clap = env(t, 0, 30, 60, 200); if (clap > 0) star4(S.cx, S.y - S.s * 0.6, S.s * 0.5 * clap, '#fff6da', clap);
    } },
  },
  starry: {
    row: { name: "Zodiac Wheel", dur: 1550, rot: false,
    draw(S, t) {
      const R = (S.b[7].x - S.b[0].x) / 2 + S.s * 0.1; const d = eio(seg(t, 0, 450)); const form = eio(seg(t, 300, 650)); const turn = eio(seg(t, 650, 1200)) * 1.2; const fade = 1 - seg(t, 1100, 1450);
      ell(S.cx, S.y, R, R * 0.42, '#d8b25a', 2, fade * d); ell(S.cx, S.y, R * 0.86, R * 0.36, '#d8b25a', 1, fade * d * 0.6);
      for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU + turn; line(S.cx + Math.cos(a) * R * 0.86, S.y + Math.sin(a) * R * 0.36, S.cx + Math.cos(a) * R, S.y + Math.sin(a) * R * 0.42, '#d8b25a', 1, fade * d * 0.7); }
      S.b.forEach((b, i) => { const a0 = Math.PI + (i / 7) * Math.PI * 0.999; const a = a0 + turn; const ox = S.cx + Math.cos(a) * R; const oy = S.y + Math.sin(a) * R * 0.42; X(b, { x: (ox - b.x) * form, y: (oy - b.y) * form, s: 1 - 0.85 * form, o: 1 - form }); if (form > 0) { const x = lerp(b.x, ox, form); const y = lerp(b.y, oy, form); glow(x, y, S.s * 0.35, b.c, form * fade * 0.7); starN(x, y, S.s * 0.2 * form, 4, 0.35, '#fff3c2', form * fade); } });
    } },
    col: { name: "Painted Stars", dur: 1450, rot: false,
    draw(S, t) {
      S.b.forEach((b, i) => {
        const L = t - order(i, 'r') * 55; const m = eo(seg(L, 0, 260)); const fade = 1 - seg(L, 700, 1050);
        X(b, { s: 1 - 0.6 * m, o: 1 - m, br: `${22 + 28 * m}%` });
        if (m <= 0) return;
        for (let k = 0; k < 2; k++) { const v = seg(L, 120 + k * 120, 700 + k * 120); if (v <= 0) continue; ring(b.x, b.y, b.s * (0.28 + 0.4 * eo(v) + k * 0.12), k ? '#f6d36a' : mix(b.c, '#fff2b0', 0.4), b.s * 0.1 * (1 - v * 0.5), fade * (1 - v * 0.6)); }
        glow(b.x, b.y, b.s * 0.6, '#ffe58a', fade * m * 0.8); circ(b.x, b.y, b.s * 0.12 * m, '#fffbe8', fade); const tw = 0.6 + 0.4 * Math.sin(L / 60 + i); star4(b.x, b.y, b.s * 0.45 * m * tw, '#fffbe8', fade * 0.8);
      });
    } },
  },
  garden: {
    row: { name: "Tear Stub", dur: 1300, rot: false,
    draw(S, t) {
      const perf = seg(t, 0, 250); const py = S.y + S.s * 0.1;
      S.b.forEach((b, i) => {
        const L = t - 250 - i * 45; const tear = eo(seg(L, 0, 500)); const h = b.s / 2;
        X(b, { clip: L > 0 ? `inset(${(b.s * 0.6).toFixed(1)}px 0 0 0)` : '', o: 1 - seg(t, 900, 1200) });
        if (L > 0) { ctx.save(); ctx.translate(b.x + b.s * 0.3 * tear, b.y - h * 0.4 - b.s * 1.2 * tear); ctx.rotate((i % 2 ? 0.5 : -0.4) * tear + Math.sin(L / 80) * 0.15 * tear); box(-h, -h * 0.6, b.s, b.s * 0.6, b.s * 0.08, b.c, 1 - seg(tear, 0.6, 1)); ctx.restore(); }
      });
      if (perf > 0) { ctx.save(); ctx.setLineDash([4, 4]); line(S.b[0].x - S.s / 2, py, lerp(S.b[0].x - S.s / 2, S.b[7].x + S.s / 2, perf), py, '#8a7a6a', 1.4, 1 - seg(t, 600, 900), 'butt'); ctx.restore(); }
    } },
    col: { name: "Tear Stub", dur: 1300, rot: true,
    draw(S, t) {
      const perf = seg(t, 0, 250); const py = S.y + S.s * 0.1;
      S.b.forEach((b, i) => {
        const L = t - 250 - i * 45; const tear = eo(seg(L, 0, 500)); const h = b.s / 2;
        X(b, { clip: L > 0 ? `inset(${(b.s * 0.6).toFixed(1)}px 0 0 0)` : '', o: 1 - seg(t, 900, 1200) });
        if (L > 0) { ctx.save(); ctx.translate(b.x + b.s * 0.3 * tear, b.y - h * 0.4 - b.s * 1.2 * tear); ctx.rotate((i % 2 ? 0.5 : -0.4) * tear + Math.sin(L / 80) * 0.15 * tear); box(-h, -h * 0.6, b.s, b.s * 0.6, b.s * 0.08, b.c, 1 - seg(tear, 0.6, 1)); ctx.restore(); }
      });
      if (perf > 0) { ctx.save(); ctx.setLineDash([4, 4]); line(S.b[0].x - S.s / 2, py, lerp(S.b[0].x - S.s / 2, S.b[7].x + S.s / 2, perf), py, '#8a7a6a', 1.4, 1 - seg(t, 600, 900), 'butt'); ctx.restore(); }
    } },
  },
  endworld: {
    row: { name: "Halftone Dissolve", dur: 1300, rot: false,
    draw(S, t) {
      S.b.forEach((b, i) => {
        const L = t - i * 45; const on = seg(L, 0, 100); X(b, { o: 1 - on }); if (on <= 0) return;
        const G = 5; const h = b.s / 2; const p = b.s / G;
        for (let a = 0; a < G; a++) for (let c = 0; c < G; c++) { const w = seg(L, 100 + (a + c) * 45, 400 + (a + c) * 45); const r = p * 0.55 * (1 - w) * (0.7 + 0.3 * on); if (r > 0.3) circ(b.x - h + (c + 0.5) * p, b.y - h + (a + 0.5) * p, r, b.c, 1); }
      });
    } },
    col: { name: "Halftone Dissolve", dur: 1300, rot: false,
    draw(S, t) {
      S.b.forEach((b, i) => {
        const L = t - i * 45; const on = seg(L, 0, 100); X(b, { o: 1 - on }); if (on <= 0) return;
        const G = 5; const h = b.s / 2; const p = b.s / G;
        for (let a = 0; a < G; a++) for (let c = 0; c < G; c++) { const w = seg(L, 100 + (a + c) * 45, 400 + (a + c) * 45); const r = p * 0.55 * (1 - w) * (0.7 + 0.3 * on); if (r > 0.3) circ(b.x - h + (c + 0.5) * p, b.y - h + (a + 0.5) * p, r, b.c, 1); }
      });
    } },
  },
  doors: {
    row: { name: "Doors Open", dur: 1400, rot: false,
    draw(S, t) {
      S.b.forEach((b, i) => {
        const L = t - i * 55; const o = eio(seg(L, 0, 420)); const h = b.s / 2; const fade = 1 - seg(L, 650, 950);
        X(b, { og: '0% 50%', sx: 1 - 0.85 * o, ky: -14 * o, f: `brightness(${1 - 0.15 * o})`, o: fade });
        if (o > 0) { ctx.save(); ctx.globalAlpha = o * fade; rr(b.x - h + 2, b.y - h + 2, b.s - 4, b.s - 4, 3); ctx.clip(); const g = ctx.createLinearGradient(0, b.y - h, 0, b.y + h); g.addColorStop(0, '#fff6d2'); g.addColorStop(0.6, '#ffe9a8'); g.addColorStop(0.61, '#8fc46b'); g.addColorStop(1, '#5f9a4a'); ctx.fillStyle = g; ctx.fillRect(b.x - h, b.y - h, b.s, b.s); ctx.restore(); glow(b.x, b.y, b.s * 0.7, '#fff2b8', o * fade * 0.4); }
      });
    } },
    col: { name: "Sliding Panels", dur: 1350, rot: false,
    draw(S, t) {
      S.b.forEach((b, i) => {
        const L = t - i * 70; const u = eio(seg(L, 0, 380)); const fade = 1 - seg(L, 600, 880); const h = b.s / 2;
        X(b, { o: L > 0 ? 0 : 1 });
        if (L <= 0) return;
        ctx.save(); ctx.globalAlpha = fade; rr(b.x - h, b.y - h, b.s, b.s, b.s * 0.08); ctx.clip();
        const g = ctx.createLinearGradient(0, b.y - h, 0, b.y + h); g.addColorStop(0, '#cdeeff'); g.addColorStop(0.6, '#fff2c4'); g.addColorStop(0.61, '#9fd273'); g.addColorStop(1, '#68a64f'); ctx.fillStyle = g; ctx.fillRect(b.x - h, b.y - h, b.s, b.s);
        const off = h * 1.02 * u;
        for (const side of [-1, 1]) { const px = b.x + side * (h / 2 + off) - h / 2; box(px, b.y - h, h, b.s, 2, mix(b.c, '#ffffff', 0.15), 1, mix(b.c, '#000000', 0.25), 1); line(px + h * (side < 0 ? 0.8 : 0.2), b.y - 3, px + h * (side < 0 ? 0.8 : 0.2), b.y + 3, '#d9b45a', 2, 1); }
        ctx.restore();
        if (u > 0.3) glow(b.x, b.y, b.s * 0.6, '#fff1b8', (u - 0.3) * fade * 0.6);
      });
    } },
  },
  heaven: {
    row: { name: "Rainbow Glitch", dur: 1300, rot: false,
    draw(S, t) {
      const step = Math.floor(t / 130); const r = rng(step * 7 + 3); const g = env(t, 0, 160, 650, 950);
      const spec = ['#ff8fa3', '#ffc98a', '#fff1a0', '#a8eab0', '#9dd8ff', '#cdb4ff'];
      S.b.forEach((b, i) => { const off = (r() - 0.5) * 8 * g; X(b, { x: off, o: 1 - seg(t, 450 + i * 40, 750 + i * 40) }); });
      if (g > 0) for (let k = 0; k < 3; k++) { const y = S.y - S.s / 2 + r() * S.s; const hh = 3 + r() * 4; const dx = (r() - 0.5) * 16; const c = spec[Math.floor(r() * spec.length)]; box(S.b[0].x - S.s / 2 + dx, y, S.b[7].x - S.b[0].x + S.s, hh, 0, c, g * 0.45); }
    } },
    col: { name: "Error Cascade", dur: 1450, rot: false,
    draw(S, t) {
      S.b.forEach((b, i) => {
        const L = t - i * 60; const pop = back(seg(L, 0, 160)); const close = seg(t, 900 + (7 - i) * 45, 1000 + (7 - i) * 45);
        X(b, { o: 1 - seg(L, 60, 200) });
        const sc = pop * (1 - close); if (sc <= 0.02) return; const w = S.s * 1.3 * sc; const hh = S.s * 0.85 * sc; const x = b.x - w / 2 + i * 2; const y = b.y - hh / 2 - S.s * 0.6 + i * 3;
        box(x + 2, y + 2, w, hh, 3, 'rgba(40,40,80,.25)', 1); box(x, y, w, hh, 3, '#f4f6fb', 1, '#7a86b8', 1); box(x, y, w, hh * 0.24, 3, '#3b6fd8', 1); circ(x + w * 0.22, y + hh * 0.6, hh * 0.16, '#e8b923', 1); txt('!', x + w * 0.22, y + hh * 0.61, Math.max(6, hh * 0.24), '#3a2a00', 1); box(x + w * 0.45, y + hh * 0.48, w * 0.42, hh * 0.08, 1, '#9aa3c4', 1); box(x + w * 0.45, y + hh * 0.66, w * 0.3, hh * 0.08, 1, '#9aa3c4', 1);
      });
    } },
  },
  surveil: {
    row: { name: "Target Lock", dur: 1300, rot: false,
    draw(S, t) {
      const red = '#e0241f';
      S.b.forEach((b, i) => {
        const L = t - i * 60; const s = eo(seg(L, 0, 200)); const sz = b.s * (1.6 - 0.55 * s); const a = env(L, 0, 40, 650, 800); const h = sz / 2; const c = sz * 0.25;
        const blink = L > 300 && L < 520 ? (Math.floor(L / 55) % 2) : 1; X(b, { o: L > 520 ? 0 : blink });
        if (a <= 0) return; ctx.globalAlpha = a; ctx.strokeStyle = red; ctx.lineWidth = 1.6; ctx.beginPath();
        for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.moveTo(b.x + sx * h, b.y + sy * h - sy * c); ctx.lineTo(b.x + sx * h, b.y + sy * h); ctx.lineTo(b.x + sx * h - sx * c, b.y + sy * h); } ctx.stroke();
        if (s >= 1) { if (S.vert) txt('LOCK', b.x + h + 4, b.y, 7, red, a, undefined, 'left'); else txt('LOCK', b.x, b.y - h - 6, 7, red, a); }
      });
    } },
    col: { name: "Target Lock", dur: 1300, rot: false,
    draw(S, t) {
      const red = '#e0241f';
      S.b.forEach((b, i) => {
        const L = t - i * 60; const s = eo(seg(L, 0, 200)); const sz = b.s * (1.6 - 0.55 * s); const a = env(L, 0, 40, 650, 800); const h = sz / 2; const c = sz * 0.25;
        const blink = L > 300 && L < 520 ? (Math.floor(L / 55) % 2) : 1; X(b, { o: L > 520 ? 0 : blink });
        if (a <= 0) return; ctx.globalAlpha = a; ctx.strokeStyle = red; ctx.lineWidth = 1.6; ctx.beginPath();
        for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.moveTo(b.x + sx * h, b.y + sy * h - sy * c); ctx.lineTo(b.x + sx * h, b.y + sy * h); ctx.lineTo(b.x + sx * h - sx * c, b.y + sy * h); } ctx.stroke();
        if (s >= 1) { if (S.vert) txt('LOCK', b.x + h + 4, b.y, 7, red, a, undefined, 'left'); else txt('LOCK', b.x, b.y - h - 6, 7, red, a); }
      });
    } },
  },
  totality: {
    row: { name: "Monolith Sink", dur: 1400, rot: false,
    draw(S, t) {
      S.b.forEach((b, i) => {
        const L = t - order(i, 'c') * 60; const u = eio(seg(L, 0, 750)); const h = b.s / 2;
        X(b, { y: b.s * u, clip: `inset(0 0 ${(u * 100).toFixed(1)}% 0)`, f: `brightness(${1 + 0.6 * seg(u, 0.4, 0.8)})`, o: u >= 1 ? 0 : 1 });
        const d = env(u, 0, 0.1, 0.8, 1); if (d > 0) for (let k = 0; k < 3; k++) puff(b.x + (k - 1) * b.s * 0.35, b.y + h - 2, 4 + 4 * u, d * 0.5, '#bdb3a2');
        line(b.x - h - 2, b.y + h, b.x + h + 2, b.y + h, '#8f8676', 1.2, d * 0.7);
      });
    } },
    col: { name: "Monolith Sink", dur: 1400, rot: false,
    draw(S, t) {
      S.b.forEach((b, i) => {
        const L = t - order(i, 'c') * 60; const u = eio(seg(L, 0, 750)); const h = b.s / 2;
        X(b, { y: b.s * u, clip: `inset(0 0 ${(u * 100).toFixed(1)}% 0)`, f: `brightness(${1 + 0.6 * seg(u, 0.4, 0.8)})`, o: u >= 1 ? 0 : 1 });
        const d = env(u, 0, 0.1, 0.8, 1); if (d > 0) for (let k = 0; k < 3; k++) puff(b.x + (k - 1) * b.s * 0.35, b.y + h - 2, 4 + 4 * u, d * 0.5, '#bdb3a2');
        line(b.x - h - 2, b.y + h, b.x + h + 2, b.y + h, '#8f8676', 1.2, d * 0.7);
      });
    } },
  },
  room201: {
    row: { name: "Teal Grain", dur: 1300, rot: false,
    draw(S, t) {
      const g = env(t, 0, 250, 600, 1000); const r = rng(Math.floor(t / 45) * 13 + 1);
      S.b.forEach((b) => { X(b, { o: t < 650 ? (r() < 0.25 * g ? 0.4 : 1 - 0.3 * g) * (1 - seg(t, 400, 650)) : 0 }); });
      if (g <= 0) return; const x0 = S.b[0].x - S.s * 0.6; const W = S.b[7].x - S.b[0].x + S.s * 1.2;
      for (let k = 0; k < 260; k++) { const x = x0 + r() * W; const y = S.y - S.s * 0.6 + r() * S.s * 1.2; box(x, y, 1.6, 1.6, 0, r() < 0.5 ? '#2e8f8a' : '#bfe9e3', g * (0.4 + 0.6 * r())); }
      if (r() < 0.4) line(x0, S.y - S.s * 0.6 + r() * S.s * 1.2, x0 + W, S.y - S.s * 0.6 + r() * S.s * 1.2, '#e4fffb', 1, g * 0.4);
    } },
    col: { name: "Teal Grain", dur: 1300, rot: true,
    draw(S, t) {
      const g = env(t, 0, 250, 600, 1000); const r = rng(Math.floor(t / 45) * 13 + 1);
      S.b.forEach((b) => { X(b, { o: t < 650 ? (r() < 0.25 * g ? 0.4 : 1 - 0.3 * g) * (1 - seg(t, 400, 650)) : 0 }); });
      if (g <= 0) return; const x0 = S.b[0].x - S.s * 0.6; const W = S.b[7].x - S.b[0].x + S.s * 1.2;
      for (let k = 0; k < 260; k++) { const x = x0 + r() * W; const y = S.y - S.s * 0.6 + r() * S.s * 1.2; box(x, y, 1.6, 1.6, 0, r() < 0.5 ? '#2e8f8a' : '#bfe9e3', g * (0.4 + 0.6 * r())); }
      if (r() < 0.4) line(x0, S.y - S.s * 0.6 + r() * S.s * 1.2, x0 + W, S.y - S.s * 0.6 + r() * S.s * 1.2, '#e4fffb', 1, g * 0.4);
    } },
  },
};
