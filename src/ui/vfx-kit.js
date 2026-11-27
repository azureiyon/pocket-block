// Shared drawing toolkit for per-theme choreography (src/ui/vfx-choreo/*).
// Only tools live here: easing, colour, geometry of lines and piece outlines,
// and a block painter that can redraw a cleared block as a snapshot so its
// animation continues after the logical board has already moved on.

export const TAU = Math.PI * 2;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
/** Local progress of p inside [a, b], clamped to 0..1. */
export const seg = (p, a, b) => clamp((p - a) / (b - a));
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeIn = (t) => t * t * t;
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutBack = (t, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2);
export const smooth = (t) => t * t * (3 - 2 * t);
/** Rises over [a, b], holds, then falls over [c, d]. */
export const envelope = (p, a, b, c, d) => (p < a || p > d ? 0 : p < b ? smooth(seg(p, a, b)) : p <= c ? 1 : 1 - smooth(seg(p, c, d)));

// ---------- colour ----------
const cache = new Map();
export function rgb(hex) {
  let v = cache.get(hex);
  if (!v) {
    const h = hex.replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h.slice(0, 6), 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    cache.set(hex, v);
  }
  return v;
}
export const rgba = (hex, a) => { const [r, g, b] = rgb(hex); return `rgba(${r},${g},${b},${clamp(a)})`; };
export function mix(a, b, t) {
  const x = rgb(a); const y = rgb(b);
  const c = x.map((v, i) => Math.round(v + (y[i] - v) * t));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}

// ---------- shapes ----------
export function roundRect(ctx, x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function star4(ctx, x, y, r, color, alpha = 1) {
  ctx.globalAlpha = alpha; ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU - Math.PI / 2; const rr = i % 2 ? r * 0.16 : r; ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
  ctx.closePath(); ctx.fill();
}

// ---------- board geometry ----------
/** Cleared lines of a move, with their cells (in order) and snapshot colours. */
export function linesOf(v, move, theme) {
  const colorOf = new Map((move.clearedCells || []).map((x) => [x.i, x.color]));
  const pal = theme.palette;
  const out = [];
  const make = (axis, idx, list) => {
    const cells = list.map((i) => { const c = v.cell(i); return { i, x: c.x, y: c.y, s: c.s, color: pal[((colorOf.get(i) || 1) - 1) % pal.length], ci: colorOf.get(i) || 1 }; });
    const a = cells[0]; const b = cells[cells.length - 1];
    out.push({ axis, idx, cells, a, b, cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, len: Math.hypot(b.x - a.x, b.y - a.y), s: a.s, pitch: Math.hypot(b.x - a.x, b.y - a.y) / 7 });
  };
  for (const r of move.rows || []) make('h', r, Array.from({ length: 8 }, (_, c) => r * 8 + c));
  for (const c of move.cols || []) make('v', c, Array.from({ length: 8 }, (_, r) => r * 8 + c));
  return out;
}

/** Point on a line at t (0..1) plus the unit normal, for laying paths along it. */
export function along(line, t) {
  const x = lerp(line.a.x, line.b.x, t); const y = lerp(line.a.y, line.b.y, t);
  return line.axis === 'h' ? { x, y, nx: 0, ny: 1, tx: 1, ty: 0 } : { x, y, nx: 1, ny: 0, tx: 0, ty: 1 };
}

/**
 * Outer contour of a set of cells (a placed piece) as one closed polyline in
 * canvas pixels, following the cells' outer edges. Returns [{x, y}].
 */
export function contour(v, indices) {
  const set = new Set(indices);
  const p0 = v.cell(0); const p1 = v.cell(1); const p8 = v.cell(8);
  const pitchX = p1.x - p0.x; const pitchY = p8.y - p0.y; const half = p0.s / 2;
  const edges = new Map(); // "r,c" grid corner -> next corner, walking clockwise
  const key = (r, c) => r + ',' + c;
  for (const i of indices) {
    const r = Math.floor(i / 8); const c = i % 8;
    if (!set.has(i - 8) || r === 0) edges.set(key(r, c), [r, c + 1]);
    if (!set.has(i + 1) || c === 7) edges.set(key(r, c + 1), [r + 1, c + 1]);
    if (!set.has(i + 8) || r === 7) edges.set(key(r + 1, c + 1), [r + 1, c]);
    if (!set.has(i - 1) || c === 0) edges.set(key(r + 1, c), [r, c]);
  }
  if (!edges.size) return [];
  const start = edges.keys().next().value;
  const pts = []; let k = start; let guard = 0;
  do {
    const [r, c] = k.split(',').map(Number);
    // Grid corners sit halfway into the gap between cells.
    pts.push({ x: p0.x - half - (pitchX - p0.s) / 2 + c * pitchX, y: p0.y - half - (pitchY - p0.s) / 2 + r * pitchY });
    const nxt = edges.get(k); if (!nxt) break;
    k = key(nxt[0], nxt[1]);
  } while (k !== start && ++guard < 200);
  // Drop collinear points so travelling highlights move smoothly.
  return pts.filter((p, i) => {
    const a = pts[(i - 1 + pts.length) % pts.length]; const b = pts[(i + 1) % pts.length];
    return Math.abs((p.x - a.x) * (b.y - p.y) - (p.y - a.y) * (b.x - p.x)) > 0.01;
  });
}

/** Length-parameterised sampling of a closed or open polyline. */
export function pathSampler(pts, closed = true) {
  const segs = []; let total = 0;
  const n = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < n; i++) { const a = pts[i]; const b = pts[(i + 1) % pts.length]; const l = Math.hypot(b.x - a.x, b.y - a.y); segs.push({ a, b, l, s: total }); total += l; }
  return {
    total,
    at(t) {
      let d = ((t % 1) + 1) % 1 * total;
      for (const sg of segs) { if (d <= sg.l) { const u = sg.l ? d / sg.l : 0; return { x: lerp(sg.a.x, sg.b.x, u), y: lerp(sg.a.y, sg.b.y, u), dx: (sg.b.x - sg.a.x) / (sg.l || 1), dy: (sg.b.y - sg.a.y) / (sg.l || 1) }; } d -= sg.l; }
      const last = segs[segs.length - 1]; return { x: last.b.x, y: last.b.y, dx: 1, dy: 0 };
    },
  };
}

/** Rounded-rectangle loop just outside the board, as a sampler (for perimeter choreography). */
export function perimeter(v, inset = -0.35) {
  const a = v.cell(0); const z = v.cell(63);
  const pad = a.s * -inset; const x0 = a.x - a.s / 2 - pad; const y0 = a.y - a.s / 2 - pad; const x1 = z.x + z.s / 2 + pad; const y1 = z.y + z.s / 2 + pad;
  const r = a.s * 0.9; const pts = [];
  const corner = (cx, cy, a0) => { for (let k = 0; k <= 6; k++) { const a = a0 + (k / 6) * (Math.PI / 2); pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r }); } };
  corner(x1 - r, y0 + r, -Math.PI / 2); corner(x1 - r, y1 - r, 0); corner(x0 + r, y1 - r, Math.PI / 2); corner(x0 + r, y0 + r, Math.PI);
  return Object.assign(pathSampler(pts, true), { x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: x1 - x0, h: y1 - y0 });
}

// ---------- block snapshots ----------
/**
 * Paint one block of a material at (x, y) centre with size s. sx/sy squash,
 * glow brightens towards white, alpha fades. Close to the CSS materials,
 * cheap enough to draw dozens per frame.
 */
export function paintBlock(ctx, material, x, y, s, color, { sx = 1, sy = 1, alpha = 1, glow = 0, rot = 0 } = {}) {
  if (alpha <= 0.01) return;
  const w = s * sx; const h = s * sy;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y); if (rot) ctx.rotate(rot);
  const base = glow ? mix(color, '#ffffff', clamp(glow)) : color;
  switch (material) {
    case 'gel': {
      roundRect(ctx, -w / 2, -h / 2, w, h, Math.min(w, h) * 0.34);
      ctx.fillStyle = rgba(base, 0.88); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.beginPath(); ctx.ellipse(-w * 0.18, -h * 0.22, w * 0.14, h * 0.1, -0.5, 0, TAU); ctx.fill();
      break;
    }
    case 'pearl': {
      roundRect(ctx, -w / 2, -h / 2, w, h, Math.min(w, h) * 0.4);
      const g = ctx.createRadialGradient(-w * 0.2, -h * 0.25, 0, 0, 0, Math.max(w, h) * 0.75);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.45, base); g.addColorStop(1, mix(base, '#c9a24b', 0.25));
      ctx.fillStyle = g; ctx.fill();
      break;
    }
    case 'soda': {
      roundRect(ctx, -w / 2, -h / 2, w, h, Math.min(w, h) * 0.26);
      const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      g.addColorStop(0, '#fffaf0'); g.addColorStop(0.24, '#fffaf0'); g.addColorStop(0.26, base); g.addColorStop(1, mix(base, '#000000', 0.12));
      ctx.fillStyle = g; ctx.fill();
      break;
    }
    case 'cake': {
      roundRect(ctx, -w / 2, -h / 2, w, h, Math.min(w, h) * 0.18);
      const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      g.addColorStop(0, '#fff6ee'); g.addColorStop(0.28, '#fff6ee'); g.addColorStop(0.3, base); g.addColorStop(0.55, base); g.addColorStop(0.57, '#fbe8c8'); g.addColorStop(0.7, '#fbe8c8'); g.addColorStop(0.72, base); g.addColorStop(1, mix(base, '#8a3b4f', 0.2));
      ctx.fillStyle = g; ctx.fill();
      break;
    }
    case 'enamel':
    default: {
      roundRect(ctx, -w / 2, -h / 2, w, h, Math.min(w, h) * 0.22);
      ctx.fillStyle = base; ctx.fill();
      const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      g.addColorStop(0, 'rgba(255,255,255,.45)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.08)');
      ctx.fillStyle = g; ctx.fill();
    }
  }
  ctx.restore();
}
