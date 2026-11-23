// Spell-effect layer: one <canvas> over the board, drawn with pre-rendered
// glow sprites (no live blur or shadowBlur, which are slow in Safari), a
// pooled particle budget and a render loop that only runs while something
// is on screen. Each theme picks from a shared vocabulary of effects through
// a small recipe (src/ui/vfx-recipes.js):
//
//   burst         particles, optionally with ribbon trails
//   beam          a light sweep along a cleared row or column
//   ring          an expanding shockwave
//   magicCircle   rotating rings with a theme glyph (rose window, star,
//                 hexagram, clock ticks, gear, lotus, square sights, pixels)
//   slash         crescent arcs, more of them as the combo grows
//   vortex        spiral arms swirling inwards
//   constellation stars joined by lines across the cleared cells
//   pillar        a column of light
//   rays          a starburst
//   glitch        flickering offset blocks
//
// Placing is quiet, clearing is bright, combos bring the theme's signature
// and a full board clear brings everything.

import { getRecipe } from './vfx-recipes.js';

export const MAX_VFX_PARTICLES = 520;
const SPRITE = 64;
const TAU = Math.PI * 2;
const R = (a, b) => a + Math.random() * (b - a);
const ease = (t) => 1 - Math.pow(1 - t, 3);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ---------- sprites ----------

function star(ctx, cx, cy, points, r0, r1, rot = -Math.PI / 2) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? r1 : r0; const a = rot + (i / (points * 2)) * TAU;
    ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
}

function glowDisc(ctx, color, r = 30, core = 0.15) {
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, r);
  g.addColorStop(0, '#ffffff'); g.addColorStop(core, color); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, SPRITE, SPRITE);
}

const SPRITES = {
  glow(ctx, c) { glowDisc(ctx, c, 30, 0.12); },
  ember(ctx, c) { glowDisc(ctx, c, 18, 0.3); },
  star4(ctx, c) { glowDisc(ctx, c, 22, 0.05); ctx.globalAlpha = 1; star(ctx, 32, 32, 4, 30, 3.5); ctx.fillStyle = '#ffffff'; ctx.fill(); },
  star5(ctx, c) { glowDisc(ctx, c, 26, 0.2); star(ctx, 32, 32, 5, 20, 9); ctx.fillStyle = c; ctx.fill(); star(ctx, 32, 32, 5, 10, 4.5); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.fill(); },
  petal(ctx, c) { ctx.translate(32, 32); ctx.rotate(0.6); ctx.beginPath(); ctx.ellipse(0, 0, 18, 9, 0, 0, TAU); const g = ctx.createLinearGradient(-18, 0, 18, 0); g.addColorStop(0, '#ffffff'); g.addColorStop(1, c); ctx.fillStyle = g; ctx.fill(); },
  shard(ctx, c) { ctx.beginPath(); ctx.moveTo(32, 4); ctx.lineTo(40, 34); ctx.lineTo(32, 60); ctx.lineTo(25, 30); ctx.closePath(); const g = ctx.createLinearGradient(25, 4, 40, 60); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, c); g.addColorStop(1, 'rgba(255,255,255,.4)'); ctx.fillStyle = g; ctx.fill(); },
  flake(ctx, c) { glowDisc(ctx, c, 20, 0.1); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; ctx.beginPath(); ctx.moveTo(32, 32); ctx.lineTo(32 + Math.cos(a) * 24, 32 + Math.sin(a) * 24); ctx.stroke(); } },
  square(ctx, c) { ctx.fillStyle = c; ctx.fillRect(16, 16, 32, 32); ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.fillRect(16, 16, 32, 6); ctx.fillRect(16, 16, 6, 32); },
  heart(ctx, c) { glowDisc(ctx, c, 28, 0.25); ctx.beginPath(); ctx.moveTo(32, 48); ctx.bezierCurveTo(8, 32, 14, 12, 32, 22); ctx.bezierCurveTo(50, 12, 56, 32, 32, 48); ctx.fillStyle = c; ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(24, 26, 4, 0, TAU); ctx.fill(); },
  coin(ctx, c) { glowDisc(ctx, c, 28, 0.3); ctx.beginPath(); ctx.arc(32, 32, 13, 0, TAU); ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 2.5; ctx.stroke(); ctx.fillStyle = 'rgba(80,50,0,.5)'; ctx.fillRect(28, 28, 8, 8); },
  bubble(ctx, c) { ctx.beginPath(); ctx.arc(32, 32, 20, 0, TAU); ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.arc(25, 24, 4.5, 0, TAU); ctx.fill(); },
  bird(ctx, c) { ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(8, 26); ctx.quadraticCurveTo(22, 20, 32, 36); ctx.quadraticCurveTo(42, 20, 56, 26); ctx.stroke(); },
  plane(ctx, c) { ctx.beginPath(); ctx.moveTo(6, 36); ctx.lineTo(58, 18); ctx.lineTo(28, 44); ctx.closePath(); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.beginPath(); ctx.moveTo(28, 44); ctx.lineTo(58, 18); ctx.lineTo(34, 56); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); },
  hex(ctx, c) { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; ctx[i ? 'lineTo' : 'moveTo'](32 + Math.cos(a) * 24, 32 + Math.sin(a) * 24); } ctx.closePath(); const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 26); g.addColorStop(0, 'rgba(255,255,255,.55)'); g.addColorStop(1, c); ctx.globalAlpha = 0.6; ctx.fillStyle = g; ctx.fill(); },
  card(ctx, c) { ctx.fillStyle = '#fbf2e2'; ctx.fillRect(18, 10, 28, 42); ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.strokeRect(21, 13, 22, 36); ctx.fillStyle = c; star(ctx, 32, 31, 4, 8, 3, 0); ctx.fill(); },
};
export const SPRITE_KINDS = Object.keys(SPRITES);

// ---------- engine ----------

export class Vfx {
  constructor({ layer, board, getTheme, reducedMotion = () => false, enabled = () => true, doc = typeof document !== 'undefined' ? document : null, raf, now } = {}) {
    this.layer = layer; this.board = board; this.getTheme = getTheme;
    this.reducedMotion = reducedMotion; this.enabledFn = enabled; this.doc = doc;
    this.raf = raf || ((fn) => requestAnimationFrame(fn));
    this.now = now || (() => performance.now());
    this.items = []; this.particles = []; this.sprites = new Map();
    this.running = false; this.canvas = null; this.ctx = null; this.pad = 0; this.dpr = 1;
  }

  get active() { return !!(this.enabledFn() && !this.reducedMotion() && this.doc); }

  ensureCanvas() {
    if (!this.canvas) {
      this.canvas = this.doc.createElement('canvas');
      this.canvas.className = 'vfx';
      this.layer.prepend(this.canvas);
      this.ctx = this.canvas.getContext('2d');
    }
    const w = this.layer.clientWidth || 300; const h = this.layer.clientHeight || 300;
    const pad = Math.round(Math.max(w, h) * 0.16);
    // Glows are soft, so 1.5x is plenty and saves ~45% of the fill work on 3x phones.
    const dpr = Math.min(1.5, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
    const key = w + 'x' + h + '@' + dpr;
    if (key !== this.sizeKey) {
      this.sizeKey = key; this.pad = pad; this.dpr = dpr; this.w = w; this.h = h;
      Object.assign(this.canvas.style, { left: -pad + 'px', top: -pad + 'px', width: w + pad * 2 + 'px', height: h + pad * 2 + 'px' });
      this.canvas.width = Math.round((w + pad * 2) * dpr); this.canvas.height = Math.round((h + pad * 2) * dpr);
    }
    return this.ctx;
  }

  sprite(kind, color) {
    const key = kind + '|' + color;
    let s = this.sprites.get(key);
    if (!s) {
      s = this.doc.createElement('canvas'); s.width = s.height = SPRITE;
      const c = s.getContext('2d');
      (SPRITES[kind] || SPRITES.glow)(c, color);
      this.sprites.set(key, s);
      if (this.sprites.size > 160) this.sprites.delete(this.sprites.keys().next().value);
    }
    return s;
  }

  pillarSprite(color) {
    const key = 'pillar|' + color;
    let s = this.sprites.get(key);
    if (!s) {
      s = this.doc.createElement('canvas'); s.width = 32; s.height = 256;
      const c = s.getContext('2d');
      const gx = c.createLinearGradient(0, 0, 32, 0);
      gx.addColorStop(0, 'rgba(0,0,0,0)'); gx.addColorStop(0.32, color); gx.addColorStop(0.5, '#ffffff'); gx.addColorStop(0.68, color); gx.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = gx; c.fillRect(0, 0, 32, 256);
      c.globalCompositeOperation = 'destination-in';
      const gy = c.createLinearGradient(0, 0, 0, 256);
      gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(0.25, '#000'); gy.addColorStop(0.75, '#000'); gy.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = gy; c.fillRect(0, 0, 32, 256);
      this.sprites.set(key, s);
    }
    return s;
  }

  // ----- geometry (canvas CSS pixels, origin at the canvas corner) -----
  cell(i) { const b = this.board.cellBox(i, this.layer); return { x: b.x + b.w / 2 + this.pad, y: b.y + b.h / 2 + this.pad, s: b.w }; }
  centerOf(indices) { let x = 0; let y = 0; let s = 0; for (const i of indices) { const c = this.cell(i); x += c.x; y += c.y; s = c.s; } return { x: x / indices.length, y: y / indices.length, s }; }
  boardCenter() { const a = this.cell(0); const z = this.cell(63); return { x: (a.x + z.x) / 2, y: (a.y + z.y) / 2, s: a.s, size: z.x - a.x + a.s }; }

  add(item) {
    item.t0 = this.now() + (item.delay || 0);
    const th = this.getTheme(); item.lw = th && th.dark ? 1 : 1.7;
    this.items.push(item);
    this.start();
  }

  start() {
    if (this.running) return;
    this.running = true; this.last = this.now();
    this.raf((t) => this.frame(t));
  }

  /** Remove everything on screen (restart, setting turned off). */
  reset() {
    this.items = []; this.particles = [];
    if (this.ctx && this.canvas) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  frame() {
    const now = this.now();
    const t0 = typeof performance !== 'undefined' ? performance.now() : 0;
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    const ctx = this.ctx;
    if (!ctx) { this.running = false; return; }
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const theme = this.getTheme();
    const blend = theme && theme.dark ? 'lighter' : 'source-over';
    // Light backgrounds swallow thin glows: heavier lines there.
    this.lw = theme && theme.dark ? 1 : 1.7;
    // Shapes (circles, beams, slashes...).
    const keep = [];
    for (const it of this.items) {
      const age = now - it.t0;
      if (age < 0) { keep.push(it); continue; }
      const p = age / it.life;
      if (p >= 1) continue;
      ctx.save(); ctx.globalCompositeOperation = it.blend || blend;
      DRAW[it.type](ctx, it, p, this);
      ctx.restore();
      keep.push(it);
    }
    this.items = keep;
    // Particles.
    ctx.globalCompositeOperation = blend;
    const alive = [];
    for (const q of this.particles) {
      if (now < q.born) { alive.push(q); continue; }
      q.age += dt;
      const p = q.age / q.life;
      if (p >= 1) continue;
      q.vx *= q.drag; q.vy = q.vy * q.drag + q.g * dt;
      q.x += q.vx * dt + (q.wob ? Math.cos(q.age * 9 + q.phase) * q.wob * dt : 0); q.y += q.vy * dt;
      q.rot += q.vr * dt;
      const a = (p < 0.15 ? p / 0.15 : 1 - (p - 0.15) / 0.85) * q.alpha;
      if (q.trail) {
        // One stroke per ribbon: a thin long tail plus a thicker short head.
        q.trail.push(q.x, q.y); if (q.trail.length > 16) q.trail.splice(0, 2);
        const n = q.trail.length;
        if (n >= 4) {
          ctx.globalAlpha = a * 0.35; ctx.strokeStyle = q.color; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.lineWidth = q.size * 0.14;
          ctx.beginPath(); ctx.moveTo(q.trail[0], q.trail[1]); for (let k = 2; k < n; k += 2) ctx.lineTo(q.trail[k], q.trail[k + 1]); ctx.stroke();
          ctx.globalAlpha = a * 0.6; ctx.lineWidth = q.size * 0.3;
          const h = Math.max(0, n - 6);
          ctx.beginPath(); ctx.moveTo(q.trail[h], q.trail[h + 1]); for (let k = h + 2; k < n; k += 2) ctx.lineTo(q.trail[k], q.trail[k + 1]); ctx.stroke();
        }
      }
      const s = q.size + (q.size1 - q.size) * p;
      ctx.globalAlpha = Math.max(0, a);
      if (q.rot) { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.rot); ctx.drawImage(q.img, -s / 2, -s / 2, s, s); ctx.restore(); } else ctx.drawImage(q.img, q.x - s / 2, q.y - s / 2, s, s);
      alive.push(q);
    }
    this.particles = alive;
    ctx.globalAlpha = 1;
    if (typeof performance !== 'undefined') this.cost = performance.now() - t0; // draw time of the last frame (ms)
    if (this.items.length || this.particles.length) this.raf((t) => this.frame(t));
    else { this.running = false; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }
  }

  // ----- primitives -----
  burst(x, y, o) {
    const n = Math.min(o.n || 12, MAX_VFX_PARTICLES - this.particles.length);
    const t = this.now() + (o.delay || 0);
    for (let k = 0; k < n; k++) {
      const a = o.angle !== undefined ? o.angle + R(-(o.spread || 0.5), o.spread || 0.5) : R(0, TAU);
      const sp = R(o.speed[0], o.speed[1]);
      const color = pick(o.colors);
      this.particles.push({
        x: x + R(-(o.jitter || 0), o.jitter || 0), y: y + R(-(o.jitter || 0), o.jitter || 0),
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, g: o.g || 0, drag: o.drag || 0.94,
        life: R(o.life[0], o.life[1]), age: 0, born: t + R(0, o.stagger || 0),
        size: R(o.size[0], o.size[1]), size1: o.shrink === false ? R(o.size[0], o.size[1]) : R(o.size[0], o.size[1]) * 0.3,
        rot: o.spin ? R(0, TAU) : 0, vr: o.spin ? R(-o.spin, o.spin) : 0, wob: o.wob || 0, phase: R(0, TAU),
        img: this.sprite(o.sprite, color), color, alpha: o.alpha || 1, trail: o.trail ? [] : null,
      });
    }
  }
  ring(x, y, o) { this.add({ type: 'ring', x, y, ...o }); }
  circle(x, y, o) { this.add({ type: 'circle', x, y, ...o }); }
  beam(a, b, o) { this.add({ type: 'beam', a, b, ...o }); }
  slash(x, y, o) { this.add({ type: 'slash', x, y, ...o }); }
  vortex(x, y, o) { this.add({ type: 'vortex', x, y, ...o }); }
  constellation(pts, o) { this.add({ type: 'constellation', pts, ...o }); }
  pillar(x, y, o) { this.add({ type: 'pillar', x, y, ...o }); }
  rays(x, y, o) { this.add({ type: 'rays', x, y, angles: Array.from({ length: o.n || 14 }, () => [R(0, TAU), R(0.5, 1)]), ...o }); }
  glitch(x, y, o) { this.add({ type: 'glitch', x, y, ...o }); }

  // ----- game events -----
  recipe() { return getRecipe(this.getTheme()); }

  /** Pre-render a theme's sprites so the first spell does not stall a frame. */
  warm(theme) {
    if (!this.doc || !this.active) return;
    const r = getRecipe(theme);
    for (const c of r.colors) { this.sprite(r.sprite, c); this.sprite(r.sprite2 || r.sprite, c); this.sprite('star4', c); this.pillarSprite(c); }
  }

  place(move) {
    if (!this.active || !move.placed || !move.placed.length) return;
    this.ensureCanvas();
    const r = this.recipe(); const c = this.centerOf(move.placed);
    this.ring(c.x, c.y, { r0: c.s * 0.4, r1: c.s * 1.6, color: r.colors[0], width: 2, life: 420 });
    this.burst(c.x, c.y, { n: 8, sprite: r.sprite2 || r.sprite, colors: r.colors, speed: [30, 110], life: [0.35, 0.6], size: [c.s * 0.25, c.s * 0.5], g: r.gravity * 0.5, spin: r.spin, jitter: c.s * 0.6 });
  }

  clear(move) {
    if (!this.active || !move.lines) return;
    this.ensureCanvas();
    const r = this.recipe(); const origin = this.centerOf(move.placed);
    const lines = [...move.rows.map((k) => [k * 8, k * 8 + 7]), ...move.cols.map((k) => [k, 56 + k])];
    lines.forEach(([i0, i1], n) => {
      const a = this.cell(i0); const b = this.cell(i1);
      this.beam(a, b, { color: r.colors[0], core: r.core, width: a.s, life: 520, delay: n * 60 });
      const per = Math.min(14, Math.floor((MAX_VFX_PARTICLES - this.particles.length) / Math.max(1, lines.length)));
      for (let k = 0; k < 8; k += 2) {
        const p = this.cell(i0 + (i1 - i0) * (k / 7));
        this.burst(p.x, p.y, { n: Math.ceil(per / 4), sprite: r.sprite, colors: r.colors, speed: [40, 170], life: [0.5, 0.95], size: [a.s * 0.3, a.s * 0.7], g: r.gravity, spin: r.spin, wob: r.wob, trail: r.trail, delay: n * 60 + k * 18, jitter: a.s * 0.4 });
      }
    });
    if (move.lines >= 2) {
      this.circle(origin.x, origin.y, { kind: r.circle, r: origin.s * (1.8 + move.lines * 0.5), color: r.colors[0], color2: r.colors[1] || '#ffffff', life: 1100, spin: 0.8 });
      this.rays(origin.x, origin.y, { n: 10 + move.lines * 3, len: origin.s * 3.4, color: r.colors[1] || r.colors[0], life: 600 });
    }
    if (move.wiped && move.wiped.length) this.ring(origin.x, origin.y, { r0: origin.s, r1: origin.s * 5, color: r.colors[1] || '#fff', width: 4, life: 800, delay: 200 });
  }

  combo(move) {
    if (!this.active || move.combo < 2) return;
    this.ensureCanvas();
    const r = this.recipe(); const c = this.centerOf(move.placed); const k = Math.min(move.combo, 8);
    signature(this, r, r.sig, c, k, move);
    if (k >= 5) this.circle(c.x, c.y, { kind: r.circle, r: c.s * 2.6, color: r.colors[1] || r.colors[0], color2: '#ffffff', life: 900, spin: -1.2, delay: 120 });
  }

  allClear() {
    if (!this.active) return;
    this.ensureCanvas();
    const r = this.recipe(); const b = this.boardCenter();
    // The theme's signature leads at full-board scale; the shared parts stay supporting.
    this.add({ type: 'flash', color: r.colors[0], life: 500 });
    this.circle(b.x, b.y, { kind: r.circle, r: b.size * 0.62, color: r.colors[0], color2: r.colors[1] || '#fff', life: 1900, spin: 0.5 });
    if (['pillar', 'rays', 'rise'].includes(r.sig)) this.pillar(b.x, b.y, { width: b.s * 2.2, color: r.colors[0], life: 1300, delay: 120 });
    this.burst(b.x, b.y, { n: 50, sprite: r.sprite, colors: r.colors, speed: [80, 300], life: [0.8, 1.5], size: [b.s * 0.35, b.s * 0.8], g: r.gravity, spin: r.spin, trail: r.trail, wob: r.wob, delay: 150 });
    const big = { x: b.x, y: b.y, s: b.s * 2.1 };
    signature(this, r, r.sig, big, 8, null);
    signature(this, r, r.sig, { ...big, s: b.s * 1.3 }, 6, null);
  }
}

// ---------- signatures ----------

function signature(v, r, sig, c, k, move) {
  const cells = move ? move.clearedCells.map((x) => x.i) : [];
  switch (sig) {
    case 'slash':
      for (let i = 0; i < Math.min(k, 5); i++) v.slash(c.x, c.y, { r: c.s * (1.6 + i * 0.45), a0: R(0, TAU), sweep: R(2.2, 3.4), color: r.colors[i % r.colors.length], life: 650, delay: i * 70, dir: i % 2 ? 1 : -1 });
      break;
    case 'vortex':
      v.vortex(c.x, c.y, { r: c.s * (2 + k * 0.3), arms: 3 + Math.min(k, 4), color: r.colors[0], color2: r.colors[1] || '#fff', life: 1000 });
      v.burst(c.x, c.y, { n: 10 + k * 3, sprite: r.sprite, colors: r.colors, speed: [60, 160], life: [0.6, 1], size: [c.s * 0.3, c.s * 0.6], spin: 3, wob: 40, delay: 200 });
      break;
    case 'constellation': {
      const src = cells.length ? cells : Array.from({ length: 12 }, () => Math.floor(Math.random() * 64));
      const pts = []; for (let i = 0; i < Math.min(4 + k, 10); i++) pts.push(v.cell(src[Math.floor(Math.random() * src.length)]));
      pts.sort((a, b) => a.x - b.x);
      v.constellation(pts, { color: r.colors[0], color2: r.colors[1] || '#fff', life: 1200, sprite: v.sprite('star4', r.colors[1] || r.colors[0]) });
      break;
    }
    case 'ribbon':
      v.burst(c.x, c.y, { n: 6 + k * 2, sprite: r.sprite, colors: r.colors, speed: [160, 300], life: [0.7, 1.1], size: [c.s * 0.4, c.s * 0.7], trail: true, drag: 0.95, wob: 90, spin: 2 });
      break;
    case 'ripple':
      for (let i = 0; i < 2 + Math.min(k, 4); i++) v.ring(c.x, c.y, { r0: c.s * 0.3, r1: c.s * (2.4 + i * 0.7), color: r.colors[i % r.colors.length], width: 2.5, life: 900, delay: i * 120 });
      break;
    case 'glitch':
      v.glitch(c.x, c.y, { size: c.s * (2 + k * 0.4), colors: r.colors, life: 450 + k * 40 });
      break;
    case 'pillar':
      v.pillar(c.x, c.y, { width: c.s * (1 + k * 0.15), color: r.colors[0], life: 900 });
      v.burst(c.x, c.y, { n: 8 + k * 2, sprite: r.sprite, colors: r.colors, speed: [30, 80], angle: -Math.PI / 2, spread: 0.4, life: [0.8, 1.2], size: [c.s * 0.3, c.s * 0.6], g: -40 });
      break;
    case 'rays':
      v.rays(c.x, c.y, { n: 14 + k * 2, len: c.s * (3 + k * 0.4), color: r.colors[1] || r.colors[0], life: 650 });
      break;
    case 'rise':
      v.burst(c.x, c.y, { n: 10 + k * 3, sprite: r.sprite, colors: r.colors, speed: [40, 110], angle: -Math.PI / 2, spread: 0.9, life: [0.9, 1.4], size: [c.s * 0.3, c.s * 0.7], g: -90, wob: 50, jitter: c.s });
      break;
    case 'fall':
    default:
      v.burst(c.x, c.y - c.s * 2, { n: 10 + k * 3, sprite: r.sprite, colors: r.colors, speed: [20, 90], life: [1, 1.5], size: [c.s * 0.35, c.s * 0.6], g: 140, wob: 70, spin: 4, jitter: c.s * 2.5 });
  }
}

// ---------- shape renderers ----------

function polygon(ctx, n, r, rot, step = 1) {
  ctx.beginPath();
  for (let i = 0; i <= n; i++) { const a = rot + ((i * step) / n) * TAU; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); }
  ctx.closePath();
}

const DRAW = {
  ring(ctx, it, p) {
    const e = ease(p);
    ctx.globalAlpha = (1 - p) * 0.9; ctx.strokeStyle = it.color; ctx.lineWidth = it.width * (1 - p * 0.6) * (it.lw || 1);
    ctx.beginPath(); ctx.arc(it.x, it.y, it.r0 + (it.r1 - it.r0) * e, 0, TAU); ctx.stroke();
  },
  beam(ctx, it, p, v) {
    const { a, b } = it;
    const reveal = Math.min(1, p * 3); const fade = p < 0.4 ? 1 : 1 - (p - 0.4) / 0.6;
    const ext = it.width * 0.6; const dx = b.x - a.x; const dy = b.y - a.y; const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len; const uy = dy / len;
    const sx = a.x - ux * ext; const sy = a.y - uy * ext;
    const ex = sx + (dx + ux * ext * 2) * reveal; const ey = sy + (dy + uy * ext * 2) * reveal;
    ctx.lineCap = 'round';
    ctx.globalAlpha = 0.28 * fade; ctx.strokeStyle = it.color; ctx.lineWidth = it.width * 1.1;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.globalAlpha = 0.55 * fade; ctx.lineWidth = it.width * 0.45; ctx.stroke();
    ctx.globalAlpha = 0.95 * fade; ctx.strokeStyle = it.core || '#ffffff'; ctx.lineWidth = Math.max(2, it.width * 0.12); ctx.stroke();
    // Leading flare.
    if (reveal < 1) { const img = v.sprite('star4', it.color); const s = it.width * 2.4; ctx.globalAlpha = 1; ctx.drawImage(img, ex - s / 2, ey - s / 2, s, s); }
  },
  circle(ctx, it, p, v) {
    const lw = v.lw || 1;
    const open = ease(Math.min(1, p * 2.2)); const fade = p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
    const r = it.r * (0.55 + 0.45 * open); const rot = it.spin * p * 2;
    ctx.translate(it.x, it.y); ctx.rotate(rot);
    ctx.globalAlpha = Math.min(1, 0.9 * lw) * fade * open; ctx.strokeStyle = it.color; ctx.lineWidth = 2 * lw;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.stroke();
    ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(0, 0, r * 0.86, 0, TAU); ctx.stroke();
    ctx.strokeStyle = lw > 1 ? it.color : it.color2; ctx.lineWidth = 1.5 * lw;
    const kind = it.kind;
    if (kind === 'star') { polygon(ctx, 8, r * 0.84, 0, 3); ctx.stroke(); }
    else if (kind === 'tri') { polygon(ctx, 3, r * 0.84, -Math.PI / 2); ctx.stroke(); polygon(ctx, 3, r * 0.84, Math.PI / 2); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, TAU); ctx.stroke(); }
    else if (kind === 'rose') { ctx.beginPath(); for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; const x = Math.cos(a) * r * 0.55; const y = Math.sin(a) * r * 0.55; ctx.moveTo(x + r * 0.3, y); ctx.arc(x, y, r * 0.3, 0, TAU); } ctx.stroke(); }
    else if (kind === 'flower') { ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; const x = Math.cos(a) * r * 0.45; const y = Math.sin(a) * r * 0.45; ctx.moveTo(x + Math.cos(a) * r * 0.38, y + Math.sin(a) * r * 0.38); ctx.ellipse(x, y, r * 0.38, r * 0.14, a, 0, TAU); } ctx.stroke(); }
    else if (kind === 'ticks') { ctx.beginPath(); for (let i = 0; i < 48; i++) { const a = (i / 48) * TAU; const r0 = i % 4 ? r * 0.78 : r * 0.68; ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.85); } ctx.moveTo(0, 0); ctx.lineTo(0, -r * 0.6); ctx.moveTo(0, 0); ctx.lineTo(r * 0.4, 0); ctx.stroke(); }
    else if (kind === 'gear') { polygon(ctx, 24, r * 0.78, 0); ctx.stroke(); ctx.beginPath(); for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; ctx.moveTo(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78); ctx.lineTo(Math.cos(a) * r * 0.9, Math.sin(a) * r * 0.9); } ctx.moveTo(r * 0.25, 0); ctx.arc(0, 0, r * 0.25, 0, TAU); ctx.lineWidth = 3; ctx.stroke(); }
    else if (kind === 'square') { ctx.rotate(Math.PI / 4); ctx.strokeRect(-r * 0.6, -r * 0.6, r * 1.2, r * 1.2); ctx.rotate(-Math.PI / 4); ctx.strokeRect(-r * 0.45, -r * 0.45, r * 0.9, r * 0.9); ctx.beginPath(); ctx.moveTo(-r, 0); ctx.lineTo(r, 0); ctx.moveTo(0, -r); ctx.lineTo(0, r); ctx.stroke(); }
    else if (kind === 'pixel') { ctx.setLineDash([r * 0.08, r * 0.06]); ctx.strokeRect(-r * 0.7, -r * 0.7, r * 1.4, r * 1.4); ctx.strokeRect(-r * 0.45, -r * 0.45, r * 0.9, r * 0.9); ctx.setLineDash([]); }
    else if (kind === 'ring') { ctx.beginPath(); ctx.arc(0, 0, r * 0.6, 0, TAU); ctx.stroke(); }
    ctx.globalAlpha = fade * open; ctx.fillStyle = it.color2; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; const x = Math.cos(a) * r * 0.93; const y = Math.sin(a) * r * 0.93; ctx.moveTo(x + 2.2, y); ctx.arc(x, y, 2.2, 0, TAU); } ctx.fill();
  },
  slash(ctx, it, p) {
    const grow = ease(Math.min(1, p * 2.5)); const fade = p < 0.45 ? 1 : 1 - (p - 0.45) / 0.55;
    const a0 = it.a0; const a1 = a0 + it.sweep * grow * it.dir;
    ctx.translate(it.x, it.y);
    ctx.globalAlpha = fade;
    const g = ctx.createRadialGradient(0, 0, it.r * 0.7, 0, 0, it.r * 1.05);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.6, it.color); g.addColorStop(1, '#ffffff');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, it.r, a0, a1, it.dir < 0);
    ctx.arc(it.r * 0.12 * Math.cos((a0 + a1) / 2), it.r * 0.12 * Math.sin((a0 + a1) / 2), it.r * 0.9, a1, a0, it.dir > 0);
    ctx.closePath(); ctx.fill();
  },
  vortex(ctx, it, p) {
    const fade = p < 0.3 ? p / 0.3 : 1 - (p - 0.3) / 0.7;
    ctx.translate(it.x, it.y); ctx.rotate(p * 5);
    for (let i = 0; i < it.arms; i++) {
      ctx.save(); ctx.rotate((i / it.arms) * TAU);
      const rr = it.r * (1 - p * 0.55);
      ctx.globalAlpha = fade * 0.85; ctx.strokeStyle = i % 2 ? it.color2 : it.color; ctx.lineCap = 'round';
      ctx.lineWidth = Math.max(1.5, it.r * 0.07);
      ctx.beginPath(); ctx.arc(rr * 0.25, 0, rr * 0.75, -0.2, 2.1); ctx.stroke();
      ctx.restore();
    }
  },
  constellation(ctx, it, p, v) {
    const reveal = Math.min(1, p * 2.4); const fade = p < 0.55 ? 1 : 1 - (p - 0.55) / 0.45;
    const pts = it.pts; const shown = reveal * (pts.length - 1);
    ctx.globalAlpha = 0.85 * fade; ctx.strokeStyle = it.color; ctx.lineWidth = 1.5 * (v.lw || 1);
    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      if (i - 1 > shown) break;
      const t = Math.min(1, shown - (i - 1));
      ctx.lineTo(pts[i - 1].x + (pts[i].x - pts[i - 1].x) * t, pts[i - 1].y + (pts[i].y - pts[i - 1].y) * t);
    }
    ctx.stroke();
    for (let i = 0; i <= Math.floor(shown) && i < pts.length; i++) { const s = pts[i].s * (0.9 + 0.3 * Math.sin(p * 20 + i)); ctx.globalAlpha = fade; ctx.drawImage(it.sprite, pts[i].x - s / 2, pts[i].y - s / 2, s, s); }
  },
  pillar(ctx, it, p, v) {
    // A pre-rendered column of light that fades out at both ends.
    const w = it.width * Math.sin(Math.PI * Math.min(1, p * 1.1));
    const h = v.h + v.pad * 1.6;
    ctx.globalAlpha = 0.85 * (1 - p * 0.6);
    ctx.drawImage(v.pillarSprite(it.color), it.x - w / 2, it.y - h / 2, w, h);
  },
  rays(ctx, it, p, v) {
    const e = ease(Math.min(1, p * 2)); const fade = 1 - p; const lw = v.lw || 1;
    ctx.translate(it.x, it.y); ctx.strokeStyle = it.color; ctx.lineCap = 'round';
    ctx.globalAlpha = fade * 0.8; ctx.lineWidth = (2 * fade + 0.5) * lw;
    ctx.beginPath();
    for (const [a, l] of it.angles) {
      const r0 = it.len * 0.15 * e; const r1 = it.len * l * e;
      ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
    }
    ctx.stroke();
  },
  glitch(ctx, it, p) {
    ctx.globalAlpha = (1 - p) * 0.75;
    for (let i = 0; i < 9; i++) {
      ctx.fillStyle = it.colors[i % it.colors.length];
      const w = R(0.3, 1.2) * it.size; const h = R(0.04, 0.14) * it.size;
      ctx.fillRect(it.x + R(-0.8, 0.8) * it.size - w / 2, it.y + R(-0.8, 0.8) * it.size, w, h);
    }
  },
  flash(ctx, it, p, v) {
    const cx = v.w / 2 + v.pad; const cy = v.h / 2 + v.pad; const r = Math.max(v.w, v.h) * (0.5 + p * 0.4);
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    g.addColorStop(0, it.color); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.globalAlpha = (1 - p) * (it.blend === 'source-over' || ctx.globalCompositeOperation === 'source-over' ? 0.18 : 0.45); ctx.fillStyle = g;
    ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  },
};
