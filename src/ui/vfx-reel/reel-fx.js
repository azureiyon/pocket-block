// Line clears, board clears, placement and idle for themes 06–30, chosen by Rui in the FX Reel (studio/fx-reel-picks.md).
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

// Round-three helpers.
// ===== Round three: board clears, placement, idle =====
// S for these stages: S.cells[64] {x, y, s, r, c, ring, d}, S.cx/S.cy board centre, S.bw board width,
// S.s cell size, S.board bounds, S.b the last line's blocks (board clears), S.p placed blocks,
// S.k the idle block, S.blocks every filled block. Board finales start once the line is mostly gone.
/** Fade/tint every cell by a per-cell envelope: fn(cell) -> [alpha, colour] or null. */
function eachCell(S, fn) { for (const c of S.cells) { const v = fn(c); if (v) v(); } }
function cellBox(c, color, a, inset = 0.06, stroke = null, sw = 1.4) { const w = c.s * (1 - inset * 2); box(c.x - w / 2, c.y - w / 2, w, w, w * 0.2, color, a, stroke, sw); }
/** A wave value for a cell: from the centre outward (rings) at `step` ms per ring. */
const ringT = (c, step) => c.ring * step;
const PAL = (S, i) => S.theme.palette[((i % 7) + 7) % 7];
function frameRect(S, pad, r, color, w, a, part = 1) { const B = S.board; ctx.save(); ctx.setLineDash(part >= 1 ? [] : [2 * (B.x1 - B.x0 + B.y1 - B.y0 + 4 * pad) * part, 1e5]); box(B.x0 - pad, B.y0 - pad, B.x1 - B.x0 + pad * 2, B.y1 - B.y0 + pad * 2, r, null, a, color, w); ctx.restore(); }
const SF5 = (x, y, r, col, a, rot = 0) => { starN(x, y, r, 5, 0.55, col, a, rot); circ(x, y, r * 0.22, '#fff8e6', a); };

export const FINALE = {
  abyss: {
    board: { name: "The Lure", dur: 1700,
    draw(S, t) {
      const dark = env(t, 0, 250, 1100, 1500); const B = S.board; ctx.globalAlpha = dark * 0.7; ctx.fillStyle = '#020611'; ctx.fillRect(B.x0 - S.s, B.y0 - S.s, S.bw + 2 * S.s, S.bw + 2 * S.s);
      const u = eio(seg(t, 200, 1200)); const x = lerp(B.x0 - S.s, B.x1 + S.s, u); const y = S.cy + Math.sin(u * 6) * S.s * 1.2;
      for (const c of S.cells) { const passed = x > c.x; const a = passed ? env(t, 0, 0, 1, 1) * (1 - seg(t, 1100, 1600)) * 0.6 : 0; if (a > 0 && Math.abs(c.y - y) < S.s * 2.5) glow(c.x, c.y, c.s * 0.6, '#6ff0ff', a * (1 - Math.abs(c.y - y) / (S.s * 2.5))); }
      const la = env(t, 200, 300, 1150, 1300); glow(x, y, S.s * 1.3, '#bff9ff', la * 0.8); circ(x, y, 3.5, '#ffffff', la); line(x, y, x - S.s * 0.6, y + S.s * 0.4, 'rgba(160,220,255,.4)', 1, la);
    } },
    place: { name: "Glow Settle", dur: 600,
    draw(S, t) { const f = env(t, 0, 60, 120, 420); for (const b of S.p) { X(b, { f: `brightness(${1 + 0.6 * f})` }); glow(b.x, b.y, b.s * 0.8, '#5ff3ff', f * 0.4); } const c = S.pc; for (let k = 0; k < 2; k++) { const u = seg(t, 80 + k * 100, 560); if (u > 0 && u < 1) ring(c.x + (k ? 6 : -6), c.y - c.s * 0.5 - u * c.s * 1.2, 2.5 + u * 1.5, '#cffbff', 1, 1 - u); } } },
    idle: { name: "Bobbing", dur: 2400,
    draw(S, t) { const a = env(t, 0, 400, 2000, 2400); S.blocks.forEach((b, k) => { if (k % 2) return; X(b, { y: Math.sin(t / 380 + k * 1.3) * b.s * 0.06 * a, r: Math.sin(t / 520 + k) * 2 * a }); }); } },
  },
  capsule: {
    board: { name: "Capsule Shower", dur: 1600,
    init(S) { const r = rng(181); return Array.from({ length: 12 }, () => ({ x: r(), t0: r() * 400, pop: 0.45 + r() * 0.3, c: Math.floor(r() * 7), rot: (r() - 0.5) * 6 })); },
    draw(S, t, P) { for (const p of P) { const u = seg(t, p.t0, p.t0 + 1000); if (u <= 0 || u >= 1) continue; const x = S.board.x0 + p.x * S.bw; const y = S.board.y0 - S.s + S.bw * u; const col = PAL(S, p.c); if (u < p.pop) { ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot * u); box(-S.s * 0.3, -S.s * 0.15, S.s * 0.3, S.s * 0.3, S.s * 0.15, col, 1); box(0, -S.s * 0.15, S.s * 0.3, S.s * 0.3, S.s * 0.15, '#fbf6ec', 1, 'rgba(0,0,0,.15)', 1); ctx.restore(); } else { const v = (u - p.pop) / (1 - p.pop); glow(x, y, S.s * 0.6, '#fff4c8', (1 - v) * 0.7); for (let k = 0; k < 4; k++) star4(x + Math.cos(k * 1.6) * S.s * 0.6 * v, y + Math.sin(k * 1.6) * S.s * 0.6 * v, 5 * (1 - v), '#ffffff', 1 - v); } } } },
    place: { name: "Pencil Tick", dur: 500,
    draw(S, t) { const c = S.p[S.p.length - 1]; const u = eo(seg(t, 40, 300)); const a = 1 - seg(t, 300, 480); if (u <= 0) return; ctx.globalAlpha = a; ctx.strokeStyle = '#4a4a52'; ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.beginPath(); const x = c.x + c.s * 0.6; ctx.moveTo(x, c.y); ctx.lineTo(x + 3 * Math.min(1, u * 2), c.y + 3 * Math.min(1, u * 2)); if (u > 0.5) ctx.lineTo(x + 3 + 6 * (u - 0.5) * 2, c.y + 3 - 8 * (u - 0.5) * 2); ctx.stroke(); } },
    idle: { name: "Capsule Wobble", dur: 800,
    draw(S, t) { X(S.k, { r: Math.sin(t / 45) * 10 * env(t, 0, 80, 400, 700) }); } },
  },
  doors: {
    board: { name: "Grand Doors", dur: 1800,
    draw(S, t) { const B = S.board; const close = eio(seg(t, 0, 400)); const open = eio(seg(t, 600, 1100)); const fade = 1 - seg(t, 1350, 1750);
      if (open > 0) { ctx.save(); ctx.globalAlpha = fade; rr(B.x0, B.y0, S.bw, S.bw, 6); ctx.clip(); const g = ctx.createLinearGradient(0, B.y0, 0, B.y1); g.addColorStop(0, '#bfe6ff'); g.addColorStop(0.55, '#fff2c4'); g.addColorStop(0.65, '#a9d97c'); g.addColorStop(1, '#5f9a4a'); ctx.fillStyle = g; ctx.fillRect(B.x0, B.y0, S.bw, S.bw); for (let k = 0; k < 14; k++) circ(B.x0 + ((k * 0.37) % 1) * S.bw, B.y0 + S.bw * (0.7 + ((k * 0.53) % 0.28)), 3, ['#ff8fb0', '#fff', '#ffd25c'][k % 3], 1); ctx.restore(); glow(S.cx, B.y0 + S.bw * 0.45, S.bw * 0.6, '#fff1b8', open * fade * 0.5); }
      const k = close; for (const side of [-1, 1]) { const w = (S.bw / 2) * k * (1 - open * 0.92); const x = side < 0 ? B.x0 : B.x1 - w; if (w < 1) continue; box(x, B.y0, w, S.bw, 3, '#f7f5ef', fade, '#d9d4c4', 1.5); box(x + w * 0.15, B.y0 + S.bw * 0.08, w * 0.7, S.bw * 0.38, 2, null, fade, '#e2ddcc', 1); box(x + w * 0.15, B.y0 + S.bw * 0.54, w * 0.7, S.bw * 0.38, 2, null, fade, '#e2ddcc', 1); circ(side < 0 ? x + w - 6 : x + 6, S.cy, 2.5, '#d9b45a', fade); } } },
    place: { name: "Latch Click", dur: 450,
    draw(S, t) { const sq = env(t, 0, 50, 80, 160); for (const b of S.p) X(b, { sx: 1 - 0.05 * sq }); const c = S.p[0]; const a = env(t, 60, 110, 150, 400); star4(c.x + c.s * 0.35, c.y, c.s * 0.25 * a, '#ffe08a', a); } },
    idle: { name: "Door Ajar", dur: 1500,
    draw(S, t) { const o = Math.sin(seg(t, 0, 1300) * Math.PI); X(S.k, { og: '0% 50%', sx: 1 - 0.3 * o, ky: -5 * o }); glow(S.k.x + S.k.s * 0.3, S.k.y, S.k.s * 0.5, '#fff1b8', o * 0.6); } },
  },
  endworld: {
    board: { name: "Last Moon", dur: 1700,
    draw(S, t) { const n = 5; const a = env(t, 0, 200, 1300, 1650); const slide = (1 - eo(seg(t, 0, 500))) * S.bw; for (let k = 0; k < n; k++) { const x = S.board.x0 + S.bw * ((k + 0.5) / n) + slide; const r = S.s * 0.6; circ(x, S.cy, r, '#f3ead8', a); ctx.save(); ctx.beginPath(); ctx.arc(x, S.cy, r, 0, TAU); ctx.clip(); for (let q = 0; q < 8; q++) for (let w = 0; w < 8; w++) circ(x - r + (w + 0.5) * r / 4, S.cy - r + (q + 0.5) * r / 4, 1.2, '#1b1b1b', a * 0.25); circ(x + r * 2 * (1 - k / (n - 1)) - r * 2 * 0, S.cy, r * 1.02, '#1b1b1b', a * (k / (n - 1)) * 0.9); ctx.restore(); }
      const bu = seg(t, 600, 1400); if (bu > 0 && bu < 1) { const x = lerp(S.board.x0 - S.s, S.board.x1 + S.s, bu); const y = S.cy - S.s * 0.5 - Math.sin(bu * Math.PI) * S.s; const w = S.s * 0.35; const flap = Math.sin(t / 45) * 0.7; ctx.globalAlpha = 1; ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(x - w, y - w * flap); ctx.quadraticCurveTo(x - w * 0.4, y - w * 0.2, x, y); ctx.quadraticCurveTo(x + w * 0.4, y - w * 0.2, x + w, y - w * flap); ctx.stroke(); } } },
    place: { name: "Dot Pop", dur: 450,
    draw(S, t) { const c = S.pc; const u = seg(t, 0, 400); if (u <= 0 || u >= 1) return; for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU; const d = c.s * (0.8 + 0.7 * eo(u)); circ(c.x + Math.cos(a) * d, c.y + Math.sin(a) * d, 2.5 * (1 - u), k % 2 ? '#d93a32' : '#1b1b1b', 1 - u); } } },
    idle: { name: "Passing Bird", dur: 1800,
    draw(S, t) { const u = seg(t, 0, 1600); const x = lerp(S.board.x0 - S.s, S.board.x1 + S.s, u); const y = S.board.y0 + S.s * 0.8 + Math.sin(u * 4) * S.s * 0.3; const w = S.s * 0.3; const flap = Math.sin(t / 50) * 0.7; ctx.globalAlpha = 1; ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - w, y - w * flap); ctx.quadraticCurveTo(x - w * 0.4, y - w * 0.2, x, y); ctx.quadraticCurveTo(x + w * 0.4, y - w * 0.2, x + w, y - w * flap); ctx.stroke(); } },
  },
  garden: {
    board: { name: "Garden Sprouts", dur: 1700,
    draw(S, t) { for (const c of S.cells) { if ((c.r * 3 + c.c) % 3) continue; const t0 = (7 - c.r) * 90 + c.c * 10; const g = eo(seg(t, t0, t0 + 400)); const a = 1 - seg(t, 1250, 1650); if (g <= 0) continue; const h = c.s * 0.6 * g; const sw = Math.sin(t / 200 + c.c) * 3 * g; line(c.x, c.y + c.s * 0.35, c.x + sw, c.y + c.s * 0.35 - h, '#5f9a4a', 1.6, a); ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#7fbf5a'; ctx.beginPath(); ctx.ellipse(c.x - 4, c.y + c.s * 0.1, 4 * g, 2 * g, -0.6, 0, TAU); ctx.ellipse(c.x + 4, c.y + c.s * 0.05, 4 * g, 2 * g, 0.6, 0, TAU); ctx.fill(); ctx.restore(); for (let p = 0; p < 5; p++) { const ang = (p / 5) * TAU; circ(c.x + sw + Math.cos(ang) * 3.5 * g, c.y + c.s * 0.35 - h + Math.sin(ang) * 3.5 * g, 2.6 * g, PAL(S, c.r + c.c), a); } circ(c.x + sw, c.y + c.s * 0.35 - h, 2 * g, '#ffe27a', a); } } },
    place: { name: "Perforation Stitch", dur: 480,
    draw(S, t) { for (const b of S.p) { const u = seg(t, 0, 300); const a = 1 - seg(t, 300, 460); for (let k = 0; k < 6 * u; k++) circ(b.x - b.s * 0.4 + k * b.s * 0.16, b.y, 1.2, '#8a7a6a', a); } } },
    idle: { name: "Ticket Flutter", dur: 1000,
    draw(S, t) { const u = env(t, 0, 150, 600, 900); X(S.k, { kx: Math.sin(t / 50) * 6 * u, og: '0% 100%' }); } },
  },
  glass: {
    board: { name: "Morning Light", dur: 1600,
    draw(S, t) { const x = lerp(S.board.x0 - S.s * 2, S.board.x1 + S.s * 2, eio(seg(t, 0, 1000))); for (const c of S.cells) { const a = env(x - c.x, 0, S.s, S.s * 2.5, S.s * 6) * (1 - seg(t, 1200, 1600)); if (a <= 0) continue; ctx.save(); ctx.globalAlpha = a * 0.4; ctx.fillStyle = PAL(S, c.r * 3 + c.c); ctx.beginPath(); ctx.moveTo(c.x - c.s * 0.4, c.y - c.s * 0.4); ctx.lineTo(c.x + c.s * 0.4, c.y - c.s * 0.4); ctx.lineTo(c.x + c.s * 0.9, c.y + c.s * 0.6); ctx.lineTo(c.x + c.s * 0.1, c.y + c.s * 0.6); ctx.closePath(); ctx.fill(); ctx.restore(); } } },
    place: { name: "Pane Glint", dur: 500,
    draw(S, t) { for (const b of S.p) { const u = seg(t, 0, 400); if (u <= 0 || u >= 1) continue; ctx.save(); ctx.beginPath(); ctx.rect(b.x - b.s / 2, b.y - b.s / 2, b.s, b.s); ctx.clip(); const x = lerp(b.x - b.s, b.x + b.s, u); line(x - b.s * 0.5, b.y + b.s * 0.5, x + b.s * 0.5, b.y - b.s * 0.5, '#ffffff', b.s * 0.12, 0.8); ctx.restore(); } } },
    idle: { name: "Pane Glint", dur: 700,
    draw(S, t) { const b = S.k; const u = seg(t, 0, 500); if (u <= 0 || u >= 1) return; ctx.save(); ctx.beginPath(); ctx.rect(b.x - b.s / 2, b.y - b.s / 2, b.s, b.s); ctx.clip(); const x = lerp(b.x - b.s, b.x + b.s, u); line(x - b.s * 0.5, b.y + b.s * 0.5, x + b.s * 0.5, b.y - b.s * 0.5, '#ffffff', b.s * 0.12, 0.8); ctx.restore(); } },
  },
  heaven: {
    board: { name: "Goldfish Bowl", dur: 1800,
    draw(S, t) { for (let k = 0; k < 3; k++) { const u = seg(t, k * 150, k * 150 + 1500); if (u <= 0 || u >= 1) continue; const ang = u * TAU * 0.9 + k * 2; const x = S.cx + Math.cos(ang) * S.bw * (0.2 + k * 0.08); const y = S.cy + Math.sin(ang * 1.3) * S.bw * 0.25; const L = S.s * 0.8; const dir = Math.atan2(Math.cos(ang * 1.3) * 1.3 * 0.25, -Math.sin(ang) * (0.2 + k * 0.08)); const a = Math.sin(u * Math.PI) * 1.4; ctx.save(); ctx.translate(x, y); ctx.rotate(dir); ctx.globalAlpha = Math.min(1, a); ctx.fillStyle = '#ff9a2a'; ctx.beginPath(); ctx.ellipse(0, 0, L * 0.4, L * 0.25, 0, 0, TAU); ctx.fill(); ctx.save(); ctx.translate(-L * 0.35, 0); ctx.rotate(Math.sin(t / 60 + k) * 0.5); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-L * 0.35, -L * 0.28); ctx.lineTo(-L * 0.35, L * 0.28); ctx.closePath(); ctx.fill(); ctx.restore(); circ(L * 0.2, -L * 0.06, 2, '#1a1a1a', Math.min(1, a)); ctx.restore(); for (let q = 1; q <= 3; q++) { const b = u - q * 0.04; ring(S.cx + Math.cos(b * TAU * 0.9 + k * 2) * S.bw * (0.2 + k * 0.08), S.cy + Math.sin((b * TAU * 0.9 + k * 2) * 1.3) * S.bw * 0.25 - q * 6, 2 + q * 0.6, '#cfe8ff', 1, Math.min(1, a) * (1 - q / 4)); } } } },
    place: { name: "Window Pop", dur: 380,
    draw(S, t) { const s = back(seg(t, 0, 260)); for (const b of S.p) X(b, { s: 0.6 + 0.4 * s }); } },
    idle: { name: "Blinking Cursor", dur: 1200,
    draw(S, t) { const b = S.k; const on = Math.floor(t / 250) % 2 === 0 && t < 1000; if (on) box(b.x + b.s * 0.6, b.y - b.s * 0.3, 2, b.s * 0.6, 0, '#2a3050', 0.8); } },
  },
  koi: {
    board: { name: "Koi Circle", dur: 1600,
    draw(S, t) {
      const u = eio(seg(t, 0, 1300)); const R = S.bw * 0.33; const a = env(t, 0, 120, 1250, 1550);
      for (const [off, col] of [[0, '#ff7a2e'], [Math.PI, '#f6f2ea']]) { const ang = off + u * TAU * 1.1; const x = S.cx + Math.cos(ang) * R; const y = S.cy + Math.sin(ang) * R; const L = S.s * 1.0; ctx.save(); ctx.translate(x, y); ctx.rotate(ang + Math.PI / 2); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, L * 0.45, L * 0.17, 0, 0, TAU); ctx.fill(); ctx.save(); ctx.translate(-L * 0.45, 0); ctx.rotate(Math.sin(t / 60) * 0.5); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-L * 0.3, -L * 0.16); ctx.lineTo(-L * 0.3, L * 0.16); ctx.closePath(); ctx.fill(); ctx.restore(); ctx.restore(); for (let k = 1; k < 6; k++) { const b = ang - k * 0.25; ell(S.cx + Math.cos(b) * R, S.cy + Math.sin(b) * R, S.s * 0.2 * k * 0.4, S.s * 0.08 * k * 0.4, '#dfe8ff', 1, a * (1 - k / 6) * 0.6); } }
      const fin = seg(t, 1100, 1550); if (fin > 0 && fin < 1) ell(S.cx, S.cy, R * (1 + 0.5 * fin), R * (1 + 0.5 * fin), '#dfe8ff', 1.5, 1 - fin);
    } },
    place: { name: "Settle Ripple", dur: 520,
    draw(S, t) { const sq = env(t, 0, 60, 90, 180); for (const b of S.p) X(b, { sy: 1 - 0.08 * sq, sx: 1 + 0.05 * sq, y: b.s * 0.04 * sq }); const u = seg(t, 60, 500); const c = S.pc; if (u > 0 && u < 1) ell(c.x, c.y + c.s * 0.2, c.s * (0.7 + 1.0 * eo(u)), c.s * (0.25 + 0.35 * eo(u)), '#dfe8ff', 1.4, (1 - u) * 0.8); } },
    idle: { name: "Nibble", dur: 1200,
    draw(S, t) { const c = S.e; for (let k = 0; k < 2; k++) { const u = seg(t, k * 220, k * 220 + 900); if (u > 0 && u < 1) ell(c.x, c.y, c.s * (0.1 + 0.6 * eo(u)), c.s * (0.05 + 0.25 * eo(u)), '#dfe8ff', 1.2, (1 - u) * 0.8); } } },
  },
  mahjong: {
    board: { name: "Shuffle", dur: 1500,
    init(S) { const r = rng(141); return Array.from({ length: 22 }, () => ({ a: r() * TAU, r: r(), sp: (r() - 0.5) * 4, rot: r() * TAU })); },
    draw(S, t, P) { const gather = eio(seg(t, 800, 1150)); const sink = seg(t, 1150, 1450); for (const p of P) { const ang = p.a + t / 400 * p.sp; const rr = S.bw * 0.4 * p.r * (1 - gather); const x = S.cx + Math.cos(ang) * rr; const y = S.cy + Math.sin(ang) * rr - gather * 0; const a = env(t, 0, 150, 1150, 1450); ctx.save(); ctx.translate(x, y + sink * S.s * 0.5); ctx.rotate((p.rot + t / 300 * p.sp) * (1 - gather)); box(-S.s * 0.22, -S.s * 0.3, S.s * 0.44, S.s * 0.6, 3, '#2e8a62', a, '#f4ead8', 1.5); ctx.restore(); } } },
    place: { name: "Clack", dur: 420,
    draw(S, t) { const d = ei(seg(t, 0, 90)); for (const b of S.p) X(b, { y: -6 * (1 - d) }); const c = S.pc; const u = seg(t, 90, 380); if (u > 0 && u < 1) { const w = c.s * (1 + 0.6 * eo(u)); line(c.x - w, c.y + c.s * 0.7, c.x - w * 0.6, c.y + c.s * 0.7, '#fff7e6', 2, 1 - u); line(c.x + w * 0.6, c.y + c.s * 0.7, c.x + w, c.y + c.s * 0.7, '#fff7e6', 2, 1 - u); } } },
    idle: null,
  },
  moonside: {
    board: { name: "Orrery Rings", dur: 1700,
    draw(S, t) { const open = eio(seg(t, 0, 500)); const close = ei(seg(t, 1150, 1550)); const k0 = open * (1 - close); for (let k = 1; k <= 4; k++) { const R = S.bw * 0.11 * k * k0; ell(S.cx, S.cy, R, R * 0.45, '#b9c3d6', 1.4, k0 * 0.8); const a = t / (200 + k * 150) + k; circ(S.cx + Math.cos(a) * R, S.cy + Math.sin(a) * R * 0.45, S.s * 0.14, PAL(S, k * 2), k0); } glow(S.cx, S.cy, S.s, '#f5f0d8', k0 * 0.6); circ(S.cx, S.cy, S.s * 0.25 * k0, '#fff4d0', k0); } },
    place: { name: "Bezel Glint", dur: 480,
    draw(S, t) { for (const b of S.p) { const u = eio(seg(t, 0, 420)); if (u <= 0 || u >= 1) continue; const a = -Math.PI / 2 + u * TAU; ring(b.x, b.y, b.s * 0.42, '#ffffff', 2, Math.sin(u * Math.PI), a - 0.6, a); } } },
    idle: { name: "Phase Shift", dur: 1400,
    draw(S, t) { const b = S.k; const u = eio(seg(t, 0, 1200)); ctx.save(); ctx.beginPath(); ctx.rect(b.x - b.s / 2, b.y - b.s / 2, b.s, b.s); ctx.clip(); circ(b.x - b.s * 1.3 + b.s * 2.6 * u, b.y, b.s * 0.6, '#05060f', 0.45 * Math.sin(u * Math.PI)); ctx.restore(); } },
  },
  papersky: {
    board: { name: "Paper Flock", dur: 1700,
    draw(S, t) { for (let k = 0; k < 7; k++) { const u = seg(t, k * 60, k * 60 + 1200); if (u <= 0 || u >= 1) continue; const ang = u * TAU; const x = lerp(S.board.x0 - S.s * 2, S.board.x1 + S.s * 2, u) + Math.sin(ang) * S.s * 1.5; const y = S.cy + (k - 3) * S.s * 0.5 - Math.sin(ang) * S.s * 1.6 + (1 - Math.cos(ang)) * S.s * 0.2; const dir = Math.atan2(-Math.cos(ang) * 1.6, 1 + Math.cos(ang) * 1.5) ; const L = S.s * 0.45; ctx.save(); ctx.translate(x, y); ctx.rotate(dir); poly([[L, 0], [-L, -L * 0.5], [-L * 0.6, 0]], '#ffffff', 1, '#b8c0dc', 1); poly([[L, 0], [-L * 0.6, 0], [-L, L * 0.35]], mix(PAL(S, k), '#ffffff', 0.4), 1, '#b8c0dc', 1); ctx.restore(); } } },
    place: { name: "Crease Flash", dur: 450,
    draw(S, t) { for (const b of S.p) { const a = env(t, 30, 80, 120, 380); line(b.x - b.s * 0.45, b.y - b.s * 0.45, b.x + b.s * 0.45, b.y + b.s * 0.45, '#ffffff', 1.6, a); X(b, { f: `brightness(${1 + 0.15 * a})` }); } } },
    idle: { name: "Passing Plane", dur: 1800,
    draw(S, t) { const u = seg(t, 0, 1600); const x = lerp(S.board.x0 - S.s, S.board.x1 + S.s, u); const y = S.board.y0 + S.s * 1.5 + Math.sin(u * 5) * S.s * 0.3; const L = S.s * 0.3; ctx.save(); ctx.setLineDash([3, 4]); line(S.board.x0 - S.s, S.board.y0 + S.s * 1.5, x, y, '#8f9bc4', 1, 0.5 * (1 - u)); ctx.restore(); ctx.save(); ctx.translate(x, y); poly([[L, 0], [-L, -L * 0.5], [-L * 0.6, 0]], '#ffffff', 1, '#b8c0dc', 1); ctx.restore(); } },
  },
  pixel: {
    board: { name: "Screen Wipe", dur: 1300,
    draw(S, t) { const n = Math.floor(t / 50); for (const c of S.cells) { const d = c.r + c.c; const a = n - d; if (a < 0 || a > 6) continue; const col = a < 3 ? PAL(S, d) : '#ffffff'; const z = c.s * (a < 3 ? 1 : 1 - (a - 3) / 3); box(c.x - z / 2, c.y - z / 2, z, z, 0, col, 1); } } },
    place: { name: "Two-Frame Flash", dur: 300,
    draw(S, t) { const n = Math.floor(t / 50); for (const b of S.p) X(b, { f: n === 1 || n === 3 ? 'brightness(2.2)' : '' }); } },
    idle: null,
  },
  prism: {
    board: { name: "All Clear Widget", dur: 1600,
    draw(S, t) { const inn = back(seg(t, 0, 350)); const out = ei(seg(t, 1100, 1450)); const w = S.bw * 0.7; const h = S.s * 1.3; const y = lerp(S.board.y0 - h * 2, S.cy - h / 2, inn) - out * S.bw; const a = 1 - seg(out, 0.6, 1); box(S.cx - w / 2 + 2, y + 4, w, h, 14, 'rgba(40,60,90,.15)', a); box(S.cx - w / 2, y, w, h, 14, 'rgba(255,255,255,.85)', a, 'rgba(255,255,255,1)', 1.5); circ(S.cx - w / 2 + h / 2, y + h / 2, h * 0.28, '#5fd38a', a); ctx.globalAlpha = a; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.beginPath(); const cx = S.cx - w / 2 + h / 2; ctx.moveTo(cx - 6, y + h / 2); ctx.lineTo(cx - 1, y + h / 2 + 5); ctx.lineTo(cx + 7, y + h / 2 - 5); ctx.stroke(); txt('All clear', S.cx + h * 0.2, y + h / 2, Math.round(S.s * 0.42), '#3a4558', a, `600 ${Math.round(S.s * 0.42)}px system-ui, sans-serif`); } },
    place: { name: "Frosted Lift", dur: 450,
    draw(S, t) { const l = 1 - eo(seg(t, 0, 360)); for (const b of S.p) X(b, { y: -4 * l, f: `drop-shadow(0 ${2 + 4 * l}px ${3 + 4 * l}px rgba(40,60,90,${0.25 * (1 - l) + 0.1}))` }); } },
    idle: { name: "Refraction Spark", dur: 1100,
    draw(S, t) { const b = S.k; const u = seg(t, 0, 900); if (u <= 0 || u >= 1) return; const x = lerp(b.x - b.s / 2, b.x + b.s / 2, u); const y = b.y - b.s * 0.2 + u * b.s * 0.3; ['#ff8a8a', '#fff08a', '#8ac8ff'].forEach((c, k) => circ(x - k * 3, y, 1.6, c, Math.sin(u * Math.PI))); star4(x, y, 5 * Math.sin(u * Math.PI), '#ffffff', Math.sin(u * Math.PI)); } },
  },
  reliquary: {
    board: { name: "Sanctum Doors", dur: 1700,
    draw(S, t) { const B = S.board; const close = eio(seg(t, 0, 500)); const open = eio(seg(t, 900, 1400)); const k = close * (1 - open); const a = 1 - seg(t, 1350, 1650); if (k <= 0) return; const w = (S.bw / 2) * k; for (const side of [-1, 1]) { const x = side < 0 ? B.x0 : B.x1 - w; box(x, B.y0, w, S.bw, 4, '#3a2a14', a, '#e9c46a', 2); box(x + w * 0.15, B.y0 + S.bw * 0.1, w * 0.7, S.bw * 0.8, 3, null, a, '#b8923e', 1.2); } if (k > 0.95) { line(S.cx, B.y0, S.cx, B.y1, '#fff1c8', 3, a); glow(S.cx, S.cy, S.s * 1.4, '#e9c46a', a * 0.5); starN(S.cx, S.cy, S.s * 0.3, 4, 0.4, '#e9c46a', a); } } },
    place: { name: "Foil Gleam", dur: 500,
    draw(S, t) { for (const b of S.p) { const u = seg(t, 0, 420); X(b, { f: `brightness(${1 + 0.5 * Math.sin(u * Math.PI)}) sepia(${0.3 * Math.sin(u * Math.PI)})` }); } } },
    idle: { name: "Drifting Ember", dur: 1600,
    draw(S, t) { const b = S.k; const u = seg(t, 0, 1400); if (u <= 0 || u >= 1) return; const x = b.x + Math.sin(u * 6) * b.s * 0.3; const y = b.y + b.s * 0.4 - u * b.s * 1.8; glow(x, y, 6, '#ff9a3c', Math.sin(u * Math.PI)); circ(x, y, 1.3, '#ffe2b0', Math.sin(u * Math.PI)); } },
  },
  room201: {
    board: { name: "Tape Rewind", dur: 1500,
    draw(S, t) { const B = S.board; const g = env(t, 0, 200, 1000, 1400); const r = rng(Math.floor(t / 50) * 17 + 3); for (let k = 0; k < 4; k++) { const y = B.y1 - ((t / 2 + k * S.bw / 4) % S.bw); const h = S.s * (0.3 + r() * 0.4); box(B.x0 + (r() - 0.5) * 10, y, S.bw, h, 0, k % 2 ? 'rgba(46,143,138,.5)' : 'rgba(228,255,251,.35)', g); } for (let k = 0; k < 120; k++) box(B.x0 + r() * S.bw, B.y0 + r() * S.bw, 1.6, 1.6, 0, r() < 0.5 ? '#2e8f8a' : '#bfe9e3', g * 0.5); if (g > 0.5) txt('◀◀', B.x0 + S.s * 0.8, B.y0 + S.s * 0.6, Math.round(S.s * 0.4), '#e4fffb', g, `700 ${Math.round(S.s * 0.4)}px ui-monospace, monospace`); } },
    place: { name: "Needle Tick", dur: 420,
    draw(S, t) { const c = S.p[0]; const a = env(t, 30, 80, 120, 380); star4(c.x - c.s * 0.45, c.y - c.s * 0.45, c.s * 0.3 * a, '#ff7fb3', a); line(c.x - c.s * 0.75, c.y - c.s * 0.2, c.x - c.s * 0.55, c.y - c.s * 0.1, '#e4fffb', 1.5, a); } },
    idle: { name: "Star Twinkle", dur: 1100,
    draw(S, t) { const b = S.k; const a = Math.sin(seg(t, 0, 900) * Math.PI); star4(b.x + b.s * 0.4, b.y - b.s * 0.4, b.s * 0.3 * a, '#ff7fb3', a); star4(b.x + b.s * 0.4, b.y - b.s * 0.4, b.s * 0.12 * a, '#ffffff', a); } },
  },
  starflower: {
    board: { name: "Star Fireworks", dur: 1700,
    draw(S, t) { const B = S.board; for (let k = 0; k < 5; k++) { const t0 = k * 160; const x = B.x0 + S.bw * (0.15 + 0.175 * k); const h = S.bw * (0.45 + ((k * 3) % 5) * 0.08); const up = seg(t, t0, t0 + 400); const pop = seg(t, t0 + 400, t0 + 1000); const y = B.y1 - h * eo(up); const col = PAL(S, k * 2);
      if (pop <= 0) { if (up > 0) { line(x, y, x, y + S.s * 0.8, '#ffffff', 2, 0.7); SF5(x, y, S.s * 0.25, col, 1, up * 5); } } else if (pop < 1) { for (let q = 0; q < 10; q++) { const a = (q / 10) * TAU; const d = S.s * 1.6 * expo(pop); starN(x + Math.cos(a) * d, y + Math.sin(a) * d + S.s * 0.6 * pop * pop, 5 * (1 - pop * 0.5), 5, 0.45, q % 2 ? col : '#ffffff', 1 - pop, pop * 4); } glow(x, y, S.s * 1.2, col, (1 - pop) * 0.5); } } } },
    place: { name: "Sticker Press", dur: 450,
    draw(S, t) { const sq = env(t, 0, 60, 100, 220); for (const b of S.p) X(b, { s: 1 - 0.06 * sq }); const c = S.p[S.p.length - 1]; const a = env(t, 80, 140, 180, 420); starN(c.x + c.s * 0.45, c.y - c.s * 0.45, c.s * 0.3 * a, 5, 0.45, '#fff4c2', a); } },
    idle: null,
  },
  starry: {
    board: { name: "Shooting Stars", dur: 1700,
    draw(S, t) { const B = S.board; for (let k = 0; k < 5; k++) { const u = eio(seg(t, k * 180, k * 180 + 650)); if (u <= 0 || u >= 1) continue; const x0 = B.x0 + S.bw * (0.2 + 0.18 * k) - S.bw * 0.4; const y0 = B.y0 - S.s; const x = x0 + S.bw * 0.8 * u; const y = y0 + S.bw * 0.8 * u; ctx.globalAlpha = 1 - u * 0.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#f2c94c'; ctx.lineWidth = S.s * 0.14; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - S.s * 1.6, y - S.s * 1.6); ctx.stroke(); ctx.strokeStyle = '#fff6d0'; ctx.lineWidth = S.s * 0.05; ctx.stroke(); starN(x, y, S.s * 0.25, 5, 0.45, '#fff6d0', 1); } const sp = env(t, 1100, 1200, 1300, 1650); if (sp > 0) star4(S.cx, S.cy, S.s * 0.8 * sp, '#fff6d0', sp); } },
    place: { name: "Swirl Brushed In", dur: 520,
    draw(S, t) { for (const [k, b] of S.p.entries()) { const u = eo(seg(t, k * 40, k * 40 + 340)); const a = 1 - seg(t, 380 + k * 40, 520); if (u <= 0) continue; ctx.save(); ctx.globalAlpha = a; ctx.lineCap = 'round'; for (const [w, col] of [[b.s * 0.12, '#f2c94c'], [b.s * 0.04, '#fff6d0']]) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); for (let q = 0; q <= 24 * u; q++) { const v = q / 24; const ang = v * 4.2; const r = b.s * 0.36 * (1 - v * 0.8); const x = b.x + Math.cos(ang) * r; const y = b.y + Math.sin(ang) * r; if (q) ctx.lineTo(x, y); else ctx.moveTo(x, y); } ctx.stroke(); } ctx.restore(); } } },
    idle: { name: "Twinkle", dur: 1000,
    draw(S, t) { const b = S.k; const a = Math.sin(seg(t, 0, 900) * Math.PI); glow(b.x + b.s * 0.3, b.y - b.s * 0.3, b.s * 0.4, '#ffe27a', a * 0.6); starN(b.x + b.s * 0.3, b.y - b.s * 0.3, b.s * 0.25 * a, 4, 0.35, '#fff6d0', a, t / 400); } },
  },
  steam: {
    board: { name: "Great Gear", dur: 1500,
    draw(S, t) {
      const a = env(t, 0, 200, 1100, 1450); const rot = t / 900;
      if (a > 0) { const R = S.bw * 0.48; ctx.globalAlpha = a * 0.5; ctx.fillStyle = '#b8893c'; ctx.beginPath(); for (let k = 0; k < 64; k++) { const ang = rot + (k / 64) * TAU; const rad = k % 4 < 2 ? R : R * 0.92; ctx.lineTo(S.cx + Math.cos(ang) * rad, S.cy + Math.sin(ang) * rad); } ctx.closePath(); ctx.fill(); circ(S.cx, S.cy, R * 0.3, '#3a2410', a * 0.6); }
      for (const c of S.cells) { const u = seg(t, 200 + c.ring * 110, 420 + c.ring * 110); const fl = env(u, 0, 0.3, 0.6, 1); if (fl <= 0) continue; ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(eio(u) * Math.PI / 2); box(-c.s * 0.42, -c.s * 0.42, c.s * 0.84, c.s * 0.84, 3, null, fl, '#e8b85a', 2); ctx.restore(); }
    } },
    place: { name: "Rivet Set", dur: 450,
    draw(S, t) { for (const b of S.p) { X(b, { s: 1 + 0.08 * env(t, 0, 40, 80, 160) }); const a = env(t, 40, 80, 120, 360); for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const x = b.x + sx * b.s * 0.36; const y = b.y + sy * b.s * 0.36; glow(x, y, 6, '#ffd27a', a); circ(x, y, 1.8, '#fff4d6', a); } } const p = S.p[0]; const a = env(t, 60, 90, 140, 320); line(p.x - p.s * 0.7, p.y - p.s * 0.7, p.x - p.s * 0.9, p.y - p.s * 0.9, '#e8c27a', 2, a); line(p.x - p.s * 0.55, p.y - p.s * 0.8, p.x - p.s * 0.6, p.y - p.s * 1.05, '#e8c27a', 2, a); } },
    idle: { name: "Seam Wisp", dur: 1300,
    draw(S, t) { const b = S.k; for (let k = 0; k < 6; k++) { const u = seg(t, k * 90, k * 90 + 800); if (u <= 0 || u >= 1) continue; puff(b.x + b.s * 0.5 + Math.sin(u * 5 + k) * 4, b.y - b.s * 0.2 - u * b.s * 1.2, b.s * (0.1 + 0.15 * u), (1 - u) * 0.6, '#f4efe6'); } } },
  },
  surveil: {
    board: { name: "Area Secured", dur: 1600,
    draw(S, t) { const B = S.board; const red = '#e0241f'; const y = lerp(B.y0, B.y1, eio(seg(t, 0, 600))); const sa = env(t, 0, 60, 560, 660); if (sa > 0) { line(B.x0 - 6, y, B.x1 + 6, y, '#ff3b30', 2, sa); glow(S.cx, y, S.s, '#ff3b30', sa * 0.3); }
      const lk = eo(seg(t, 600, 800)); const a = env(t, 600, 650, 1250, 1550); const m = S.s * (1.2 - 0.9 * lk); const c = S.s * 0.8; if (a > 0) { ctx.globalAlpha = a; ctx.strokeStyle = red; ctx.lineWidth = 2; ctx.beginPath(); for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const x = sx < 0 ? B.x0 - m : B.x1 + m; const yy = sy < 0 ? B.y0 - m : B.y1 + m; ctx.moveTo(x, yy - sy * c); ctx.lineTo(x, yy); ctx.lineTo(x - sx * c, yy); } ctx.stroke(); }
      const bl = t > 850 && t < 1350 && Math.floor(t / 120) % 2 === 0; if (bl) { box(S.cx - S.s * 2, S.cy - S.s * 0.35, S.s * 4, S.s * 0.7, 0, 'rgba(0,0,0,.6)', 1); txt('AREA SECURED', S.cx, S.cy, Math.round(S.s * 0.36), red, 1, `700 ${Math.round(S.s * 0.36)}px ui-monospace, monospace`); } } },
    place: { name: "Bracket Snap", dur: 420,
    draw(S, t) { const xs = S.p.map((b) => b.x); const ys = S.p.map((b) => b.y); const s = S.p[0].s; const x0 = Math.min(...xs) - s * 0.6; const x1 = Math.max(...xs) + s * 0.6; const y0 = Math.min(...ys) - s * 0.6; const y1 = Math.max(...ys) + s * 0.6; const k = eo(seg(t, 0, 120)); const a = env(t, 0, 40, 220, 400); const m = s * 0.4 * (1 - k); const q = s * 0.35; ctx.globalAlpha = a; ctx.strokeStyle = '#e0241f'; ctx.lineWidth = 1.8; ctx.beginPath(); for (const [x, y, sx, sy] of [[x0 - m, y0 - m, 1, 1], [x1 + m, y0 - m, -1, 1], [x1 + m, y1 + m, -1, -1], [x0 - m, y1 + m, 1, -1]]) { ctx.moveTo(x, y + sy * q); ctx.lineTo(x, y); ctx.lineTo(x + sx * q, y); } ctx.stroke(); } },
    idle: { name: "Hunting Box", dur: 1600,
    draw(S, t) { const b = S.k; const u = eio(seg(t, 0, 1400)); const x = lerp(b.x - b.s * 2, b.x + b.s * 2, u) + (Math.abs(u - 0.5) < 0.1 ? 0 : 0); const y = b.y + Math.sin(u * 5) * b.s * 0.3; const h = b.s * 0.6; const q = h * 0.35; ctx.globalAlpha = Math.sin(u * Math.PI); ctx.strokeStyle = '#e0241f'; ctx.lineWidth = 1.5; ctx.beginPath(); for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.moveTo(x + sx * h, y + sy * h - sy * q); ctx.lineTo(x + sx * h, y + sy * h); ctx.lineTo(x + sx * h - sx * q, y + sy * h); } ctx.stroke(); } },
  },
  totality: {
    board: { name: "Monoliths Rise", dur: 1800,
    draw(S, t) { [-1, 0, 1].forEach((k, n) => { const up = eo(seg(t, n * 120, n * 120 + 500)) * (1 - ei(seg(t, 1200 + n * 80, 1650))); if (up <= 0) return; const x = S.cx + k * S.s * 2; const base = S.cy + S.s * 1.6; const h = S.s * (2.6 + (k === 0 ? 0.6 : 0)) * up; box(x - S.s * 0.5, base - h, S.s, h, 3, '#6f6a60', 1, '#9a948a', 1.2); const gl = env(t, 600 + n * 150, 700 + n * 150, 800 + n * 150, 1100 + n * 150); txt(['△', '☉', '▽'][n], x, base - h * 0.6, Math.round(S.s * 0.5), mix('#cfc6b4', '#fff1c8', gl), 1, `${Math.round(S.s * 0.5)}px serif`); if (gl > 0) glow(x, base - h * 0.6, S.s * 0.6, '#fff1c8', gl * 0.6); const d = env(up, 0, 0.1, 0.8, 1); for (let q = 0; q < 3; q++) puff(x + (q - 1) * S.s * 0.4, base, 4 + 3 * up, d * 0.4, '#bdb3a2'); }); } },
    place: { name: "Stone Thud", dur: 480,
    draw(S, t) { const sq = env(t, 0, 40, 70, 180); for (const b of S.p) X(b, { sy: 1 - 0.06 * sq, og: '50% 100%' }); const d = seg(t, 30, 450); if (d > 0 && d < 1) for (const b of S.p) puff(b.x, b.y + b.s * 0.5, 3 + 4 * d, (1 - d) * 0.4, '#bdb3a2'); } },
    idle: { name: "Mark Glow", dur: 1400,
    draw(S, t) { const g = Math.sin(seg(t, 0, 1200) * Math.PI); X(S.k, { f: `brightness(${1 + 0.4 * g})` }); glow(S.k.x, S.k.y, S.k.s * 0.6, '#fff1c8', g * 0.4); } },
  },
  toybox: {
    board: { name: "Toy Parade", dur: 1700,
    draw(S, t) { const B = S.board; const per = 2 * (B.x1 - B.x0 + B.y1 - B.y0); const at = (d) => { d = ((d % per) + per) % per; const W = B.x1 - B.x0; const H = B.y1 - B.y0; const m = S.s * 0.55; if (d < W) return [B.x0 + d, B.y0 - m]; d -= W; if (d < H) return [B.x1 + m, B.y0 + d]; d -= H; if (d < W) return [B.x1 - d, B.y1 + m]; d -= W; return [B.x0 - m, B.y1 - d]; };
      const head = per * eio(seg(t, 0, 1500)); for (let k = 0; k < 8; k++) { const d = head - k * S.s * 0.9; if (d < 0) continue; const [x, y] = at(d); const bob = Math.abs(Math.sin(t / 70 + k)) * 4; const a = 1 - seg(t, 1350, 1650); box(x - S.s * 0.3, y - S.s * 0.3 - bob, S.s * 0.6, S.s * 0.6, 3, PAL(S, k), a, 'rgba(0,0,0,.2)', 1); } } },
    place: { name: "Wooden Bounce", dur: 480,
    draw(S, t) { const y = -Math.sin(seg(t, 0, 260) * Math.PI) * 6 * (1 - seg(t, 0, 260)); const sq = env(t, 230, 250, 270, 330); for (const b of S.p) X(b, { y, sx: 1 + 0.1 * sq, sy: 1 - 0.1 * sq, og: '50% 100%' }); const c = S.pc; const a = env(t, 240, 260, 280, 460); line(c.x - c.s * 0.9, c.y + c.s * 0.7, c.x + c.s * 0.9, c.y + c.s * 0.7, '#a0784a', 2, a); } },
    idle: { name: "Wind Wiggle", dur: 900,
    draw(S, t) { X(S.k, { r: Math.sin(t / 35) * 8 * env(t, 0, 100, 500, 800) }); } },
  },
  witch: {
    board: { name: "Grand Circle", dur: 1600,
    draw(S, t) {
      const R = S.bw * 0.47; const d = eio(seg(t, 0, 600)); const fl = env(t, 650, 720, 760, 1000); const fade = 1 - seg(t, 1100, 1550); const col = '#e9d8ff'; const up = -S.s * 0.6 * seg(t, 1000, 1550);
      ring(S.cx, S.cy + up, R, col, 2, fade, -Math.PI / 2, -Math.PI / 2 + d * TAU); ring(S.cx, S.cy + up, R * 0.9, col, 1, fade * 0.6, -Math.PI / 2, -Math.PI / 2 + d * TAU);
      const pts = Array.from({ length: 5 }, (_, k) => [S.cx + Math.cos(-Math.PI / 2 + k * TAU / 5) * R * 0.9, S.cy + up + Math.sin(-Math.PI / 2 + k * TAU / 5) * R * 0.9]);
      for (let k = 0; k < 5; k++) { const u = seg(t, 300 + k * 60, 520 + k * 60); if (u <= 0) continue; const [x0, y0] = pts[k]; const [x1, y1] = pts[(k + 2) % 5]; line(x0, y0, lerp(x0, x1, u), lerp(y0, y1, u), col, 1.4, fade); star4(x0, y0, 6 * u, '#fff4c2', fade); }
      if (fl > 0) { glow(S.cx, S.cy, S.bw * 0.6, '#c9a8ff', fl * 0.6); }
    } },
    place: { name: "Sparkle Pop", dur: 480,
    draw(S, t) { for (const b of S.p) { X(b, { s: 1 + 0.07 * env(t, 0, 50, 90, 200) }); const u = seg(t, 40, 420); for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + (k - 1) * 0.7; star4(b.x + Math.cos(a) * b.s * 0.6 * eo(u), b.y - b.s * 0.45 + Math.sin(a) * b.s * 0.5 * eo(u), 4 * (1 - u), mix(b.c, '#ffffff', 0.5), 1 - u); } } } },
    idle: { name: "Rune Wink", dur: 900,
    draw(S, t) { const b = S.k; const d = eio(seg(t, 0, 350)); const a = 1 - seg(t, 450, 850); const col = mix(b.c, '#ffffff', 0.45); ring(b.x, b.y, b.s * 0.6, col, 1.4, a, -Math.PI / 2, -Math.PI / 2 + d * TAU); const s = env(t, 330, 380, 420, 700); if (s > 0) star4(b.x + b.s * 0.42, b.y - b.s * 0.42, b.s * 0.25 * s, '#fff4c2', s); } },
  },
  wonderland: {
    board: { name: "Card Shower", dur: 1700,
    init(S) { const r = rng(191); return Array.from({ length: 16 }, () => ({ x: r(), t0: r() * 500, sw: r() * TAU, s: (r() - 0.5) * 4 })); },
    draw(S, t, P) { const suits = ['♥', '♠', '♦', '♣']; P.forEach((p, k) => { const u = seg(t, p.t0, p.t0 + 1100); if (u <= 0 || u >= 1) return; const x = S.board.x0 + p.x * S.bw + Math.sin(u * 5 + p.sw) * S.s * 0.6; const y = S.board.y0 - S.s + S.bw * 1.1 * u; const flip = Math.cos(t / 120 + p.sw); ctx.save(); ctx.translate(x, y); ctx.rotate(p.s * u); ctx.scale(Math.abs(flip), 1); const face = flip > 0; box(-S.s * 0.3, -S.s * 0.42, S.s * 0.6, S.s * 0.84, 3, face ? '#fffaf0' : '#c8242f', 1 - seg(u, 0.85, 1), face ? '#d8cbb8' : '#ffffff', 1); if (face) txt(suits[k % 4], 0, 0, Math.round(S.s * 0.4), k % 2 ? '#1b1b1b' : '#c8242f', 1 - seg(u, 0.85, 1), `${Math.round(S.s * 0.4)}px serif`); ctx.restore(); }); } },
    place: { name: "Card Snap", dur: 420,
    draw(S, t) { const u = eio(seg(t, 0, 220)); for (const b of S.p) X(b, { sx: Math.max(0.05, Math.abs(Math.cos((1 - u) * Math.PI / 2 * 1.0))), sy: 1 }); } },
    idle: { name: "Suit Pulse", dur: 900,
    draw(S, t) { const p = env(t, 0, 80, 120, 260) + env(t, 260, 340, 380, 560) * 0.7; X(S.k, { s: 1 + 0.08 * p }); } },
  },
};
