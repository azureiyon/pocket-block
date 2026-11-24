// Jelly Pop — glossy fruit jelly and gummy candy. Think Japanese fruit-jelly
// adverts and glass beads: each block keeps its shape, squashes and swells on
// its own beat, then pops into a few translucent jelly beads with an inner
// gradient, rim light and a bright specular. Tiny white diamond glints
// twinkle around them. Trajectories are buoyant arcs, never a scatter, and
// nothing ever joins into a mass.

import { random } from '../vfx.js';
import { TAU, seg, easeOut, easeInOut, envelope, mix, rgba, linesOf, perimeter } from '../vfx-kit.js';

const BEAD = 96; // sprite resolution

// ---------- glossy bead sprites (rendered once per colour) ----------
const beadCache = new Map();
function beadSprite(v, color) {
  let s = beadCache.get(color);
  if (s) return s;
  s = v.doc.createElement('canvas'); s.width = s.height = BEAD;
  const c = s.getContext('2d'); const R = BEAD * 0.42; const o = BEAD / 2;
  // Body: light, almost clear centre deepening to a saturated edge (translucent jelly).
  const body = c.createRadialGradient(o - R * 0.25, o - R * 0.3, R * 0.05, o, o, R);
  body.addColorStop(0, rgba(mix(color, '#ffffff', 0.75), 0.75));
  body.addColorStop(0.55, rgba(mix(color, '#ffffff', 0.25), 0.72));
  body.addColorStop(0.9, rgba(color, 0.92));
  body.addColorStop(1, rgba(mix(color, '#7a3a55', 0.25), 0.95));
  c.fillStyle = body; c.beginPath(); c.arc(o, o, R, 0, TAU); c.fill();
  // Caustic: light focused through the jelly onto its lower inside.
  const caus = c.createRadialGradient(o + R * 0.2, o + R * 0.45, 0, o + R * 0.2, o + R * 0.45, R * 0.5);
  caus.addColorStop(0, 'rgba(255,255,255,.55)'); caus.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = caus; c.beginPath(); c.arc(o, o, R, 0, TAU); c.fill();
  // Rim light: a thin bright crescent on the lower right edge.
  c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = BEAD * 0.025; c.lineCap = 'round';
  c.beginPath(); c.arc(o, o, R * 0.9, 0.15, 1.45); c.stroke();
  // Specular highlight plus a small secondary dot.
  c.fillStyle = 'rgba(255,255,255,.95)';
  c.beginPath(); c.ellipse(o - R * 0.36, o - R * 0.42, R * 0.26, R * 0.15, -0.6, 0, TAU); c.fill();
  c.beginPath(); c.arc(o - R * 0.05, o - R * 0.62, R * 0.07, 0, TAU); c.fill();
  beadCache.set(color, s);
  return s;
}

function drawBead(ctx, img, x, y, r, alpha, sx = 1, sy = 1) {
  const d = (r * 2) / 0.84; // sprite radius is 0.42 of its size
  ctx.globalAlpha = alpha;
  if (sx === 1 && sy === 1) { ctx.drawImage(img, x - d / 2, y - d / 2, d, d); return; }
  ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy); ctx.drawImage(img, -d / 2, -d / 2, d, d); ctx.restore();
}

/** Tiny white diamond glint, rising and falling in a quarter second. */
function glint(ctx, x, y, size, a) {
  if (a <= 0) return;
  ctx.globalAlpha = a; ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x, y - size); ctx.lineTo(x + size * 0.32, y); ctx.lineTo(x, y + size); ctx.lineTo(x - size * 0.32, y); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - size * 0.6, y); ctx.lineTo(x, y - size * 0.14); ctx.lineTo(x + size * 0.6, y); ctx.lineTo(x, y + size * 0.14); ctx.closePath(); ctx.fill();
}

/** A jelly block drawn like the CSS material: translucent body, soft bottom shade, top-left gloss and a small dot. */
function jellyBlock(ctx, x, y, s, color, { sx = 1, sy = 1, glow = 0 } = {}) {
  const w = s * sx; const h = s * sy; const r = Math.min(w, h) * 0.34;
  const base = glow ? mix(color, '#ffffff', glow) : color;
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.moveTo(-w / 2 + r, -h / 2); ctx.arcTo(w / 2, -h / 2, w / 2, h / 2, r); ctx.arcTo(w / 2, h / 2, -w / 2, h / 2, r); ctx.arcTo(-w / 2, h / 2, -w / 2, -h / 2, r); ctx.arcTo(-w / 2, -h / 2, w / 2, -h / 2, r); ctx.closePath();
  const g = ctx.createRadialGradient(-w * 0.2, -h * 0.26, 0, 0, 0, Math.max(w, h) * 0.72);
  g.addColorStop(0, mix(base, '#ffffff', 0.45)); g.addColorStop(0.6, base); g.addColorStop(1, mix(base, '#7a3a55', 0.18));
  ctx.fillStyle = g; ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.88)';
  ctx.beginPath(); ctx.ellipse(-w * 0.2, -h * 0.22, w * 0.13, h * 0.08, -0.55, 0, TAU); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.55)';
  ctx.beginPath(); ctx.arc(w * 0.25, h * 0.25, Math.min(w, h) * 0.08, 0, TAU); ctx.fill();
  ctx.restore();
}

// ---------- beads in flight ----------
/**
 * Beads follow closed-form buoyant arcs: a soft launch, light gravity and air
 * drag, so they float up, crest and drift down. A slight squash at launch
 * relaxes to perfectly round within a fifth of a second.
 */
function makeBeads(v, x, y, s, color, t0, count, fan = 0) {
  const out = [];
  for (let k = 0; k < count; k++) {
    const spread = (k - (count - 1) / 2) / Math.max(1, count - 1); // -0.5..0.5, evenly fanned
    const ang = -Math.PI / 2 + fan + spread * 1.5 + v.r(-0.12, 0.12);
    const sp = v.r(140, 210) * (k === 0 ? 0.9 : 1.05);
    out.push({
      x, y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, t0,
      r: s * (k === 0 ? v.r(0.3, 0.34) : v.r(0.19, 0.25)), color,
      life: v.r(0.95, 1.25), glints: [v.r(0.25, 0.45), v.r(0.6, 0.85)], gx: v.r(-1, 1), gy: v.r(-1, 1),
    });
  }
  return out;
}

const G = 260; const K = 2.2; // gentle gravity and drag
function beadAt(b, t) {
  const tt = t - b.t0; if (tt < 0 || tt > b.life) return null;
  const e = Math.exp(-K * tt);
  const x = b.x + (b.vx / K) * (1 - e);
  const y = b.y + ((b.vy + G / K) / K) * (1 - e) - (G / K) * tt;
  return { x, y, u: tt / b.life, tt };
}

function drawBeads(v, ctx, beads, t) {
  for (const b of beads) {
    const q = beadAt(b, t); if (!q) continue;
    const pop = Math.max(0, 1 - q.tt / 0.18); // squash relaxing to round
    const a = envelope(q.u, 0, 0.06, 0.72, 1);
    const shrink = 1 - 0.35 * seg(q.u, 0.7, 1);
    drawBead(ctx, beadSprite(v, b.color), q.x, q.y, b.r * shrink, a, 1 + pop * 0.22, 1 - pop * 0.18);
    for (const g of b.glints) {
      const ga = envelope(q.u, g, g + 0.06, g + 0.08, g + 0.16);
      glint(ctx, q.x + b.gx * b.r * 1.3, q.y + b.gy * b.r * 1.1 - b.r * 0.9, b.r * 1.1 * ga, ga);
    }
  }
}

// ---------- one block's pop ----------
/** Squash, stretch, swell (shape intact), then a soft pop ring. Returns nothing; drawn inline. */
function drawBlockPop(ctx, c, s, local) {
  // 0..0.18 squash, 0.18..0.36 stretch, 0.36..0.62 swell & brighten, 0.62 pop.
  let sx = 1; let sy = 1; let glow = 0;
  if (local < 0.18) { const e = easeOut(local / 0.18); sx = 1 + 0.14 * e; sy = 1 - 0.16 * e; }
  else if (local < 0.36) { const e = easeInOut((local - 0.18) / 0.18); sx = 1.14 - 0.24 * e; sy = 0.84 + 0.3 * e; }
  else if (local < 0.62) { const e = easeOut((local - 0.36) / 0.26); sx = 0.9 + 0.3 * e; sy = 1.14 + 0.06 * e; glow = 0.45 * e; }
  if (local < 0.62) jellyBlock(ctx, c.x, c.y, s, c.color, { sx, sy, glow });
  // The pop: a quick thin ring and a white bloom, gone in a moment.
  const r = seg(local, 0.62, 0.86);
  if (r > 0 && r < 1) {
    ctx.globalAlpha = (1 - r) * 0.9; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2 * (1 - r) + 0.5;
    ctx.beginPath(); ctx.arc(c.x, c.y, s * (0.4 + r * 0.45), 0, TAU); ctx.stroke();
    ctx.globalAlpha = (1 - r) * 0.5; ctx.fillStyle = rgba(mix(c.color, '#ffffff', 0.7), 1);
    ctx.beginPath(); ctx.arc(c.x, c.y, s * 0.42 * (1 - r), 0, TAU); ctx.fill();
  }
}

const STEP = 0.055; // seconds between neighbouring blocks: the popping rhythm
const BLOCK = 0.42; // seconds for one block's squash -> pop

/** A line pops block by block, outward from `origin` (index 0..7, or -1 for left-to-right). */
function popLine(v, line, delay, origin = -1, beadsPer = 3) {
  const s = line.s; const order = line.cells.map((c, k) => (origin < 0 ? k : Math.abs(k - origin)));
  const beads = [];
  line.cells.forEach((c, k) => {
    const t0 = order[k] * STEP + BLOCK * 0.62;
    const fan = line.axis === 'v' ? (k % 2 ? 0.35 : -0.35) : 0;
    beads.push(...makeBeads(v, c.x, c.y, s, c.color, t0, k % 2 ? beadsPer - 1 : beadsPer, fan));
  });
  const total = (Math.max(...order) * STEP + BLOCK * 0.62 + 1.3) * 1000;
  v.add({
    life: total, delay,
    draw(ctx, it, p, vv, age) {
      const t = age / 1000;
      line.cells.forEach((c, k) => { const local = (t - order[k] * STEP) / BLOCK; if (local < 0) jellyBlock(ctx, c.x, c.y, s, c.color); else if (local < 1) drawBlockPop(ctx, c, s, local); });
      drawBeads(vv, ctx, beads, t);
    },
  });
}

/** Pearlescent afterglow: a soft iridescent sheen that blooms behind the board and fades. */
function afterglow(v, life = 1800, delay = 0, strength = 1) {
  const per = perimeter(v, -0.3);
  v.add({
    back: true, life, delay,
    draw(ctx, it, p, vv, age) {
      const a = envelope(p, 0, 0.2, 0.45, 1) * strength;
      if (a <= 0) return;
      const shift = age / 1000;
      const cols = ['#ffd6e7', '#d9e8ff', '#e6fff4', '#fff3d1', '#f0dcff'];
      const g = ctx.createLinearGradient(per.x0 - per.w * 0.3 + shift * 60, per.y0, per.x1 + per.w * 0.3 + shift * 60, per.y1);
      cols.forEach((c, k) => g.addColorStop(k / (cols.length - 1), rgba(c, 0.85)));
      ctx.globalAlpha = a * 0.75; ctx.fillStyle = g;
      const pad = per.w * 0.06;
      ctx.beginPath();
      const r = per.w * 0.08; const x = per.x0 - pad; const y = per.y0 - pad; const w = per.w + pad * 2; const h = per.h + pad * 2;
      ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); ctx.fill();
    },
  });
}

/** A row of candy beads arcing over the board, popping one after another in palette order. */
function candyCascade(v, theme, count, life = 2000, delay = 0, yLift = 0.9) {
  const per = perimeter(v, -0.3); const s = v.cell(0).s;
  const pts = Array.from({ length: count }, (_, k) => {
    const u = count === 1 ? 0.5 : k / (count - 1);
    const a = Math.PI + u * Math.PI;
    return { x: per.cx + Math.cos(a) * per.w * 0.46, y: per.y0 - s * yLift + Math.sin(a) * s * 1.1 + s * 1.1, color: theme.palette[k % theme.palette.length], at: 0.05 + u * 0.4 };
  });
  const beads = [];
  for (const q of pts) beads.push(...makeBeads(v, q.x, q.y, s * 1.2, q.color, (life / 1000) * (q.at + 0.12), 3));
  v.add({
    life, delay,
    draw(ctx, it, p, vv, age) {
      const t = age / 1000;
      for (const q of pts) {
        // Each candy drops into place, bounces once, swells and pops.
        const appear = seg(p, q.at - 0.05, q.at);
        const pop = seg(p, q.at + 0.1, q.at + 0.12);
        if (appear <= 0 || pop >= 1) continue;
        const bounce = 1 + Math.sin(appear * Math.PI) * 0.25;
        const swell = 1 + 0.25 * seg(p, q.at, q.at + 0.1);
        drawBead(ctx, beadSprite(vv, q.color), q.x, q.y - (1 - appear) * s * 0.6, s * 0.34 * swell, appear, bounce * swell / swell, 1 / bounce);
      }
      drawBeads(vv, ctx, beads, t);
    },
  });
}

export default {
  place(v, move, theme) {
    // The DOM block squashes on impact (CSS); neighbours answer with a tiny wobble; one glint winks.
    const cells = v.board.cells || [];
    const placed = new Set(move.placed);
    const touched = new Set();
    for (const i of move.placed) {
      const r = Math.floor(i / 8); const c = i % 8;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const rr = r + dr; const cc = c + dc; if (rr < 0 || rr > 7 || cc < 0 || cc > 7) continue;
        const j = rr * 8 + cc; if (placed.has(j)) continue;
        const blk = cells[j] && cells[j].firstElementChild;
        if (blk && blk.classList) touched.add(blk);
      }
    }
    for (const blk of touched) {
      blk.classList.remove('jelly-nudge'); void blk.offsetWidth; blk.classList.add('jelly-nudge');
      v.later(() => blk.classList.remove('jelly-nudge'), 600);
    }
    const top = move.placed.reduce((a, i) => (i < a ? i : a), 64); const c = v.cell(top);
    v.add({ life: 520, delay: 120, draw(ctx, it, p) { const a = envelope(p, 0, 0.3, 0.4, 1); glint(ctx, c.x - c.s * 0.28, c.y - c.s * 0.3, c.s * 0.3 * a, a); } });
  },

  clear(v, move, theme) {
    const lines = linesOf(v, move, theme);
    const h = lines.find((l) => l.axis === 'h'); const w = lines.find((l) => l.axis === 'v');
    // Lines pop outward from where they cross, or from the placed piece, so the rhythm reads as one wave.
    const pc = v.centerOf(move.placed);
    lines.forEach((line) => {
      let origin;
      if (h && w) origin = line.axis === 'h' ? w.idx : h.idx;
      else { const near = line.cells.reduce((best, c, k) => (Math.hypot(c.x - pc.x, c.y - pc.y) < Math.hypot(line.cells[best].x - pc.x, line.cells[best].y - pc.y) ? k : best), 0); origin = near; }
      popLine(v, line, 0, origin, lines.length > 2 ? 2 : 3);
    });
    if (lines.length >= 2) afterglow(v, 1500, 350, 0.7);
  },

  streak(v, move, theme) {
    const k = Math.min(move.combo, 8);
    candyCascade(v, theme, 3 + k, 1900);
    afterglow(v, 2000, 300, 0.6 + k * 0.05);
  },

  milestone(v, info, theme) {
    candyCascade(v, theme, 12, 2300, 0, 1.2);
    afterglow(v, 2400, 500, 1);
  },

  boardClear(v, move, theme) {
    // Every square pops in a diagonal sweep: a whole board of candy, then the pearlescent glow.
    const beads = [];
    const s = v.cell(0).s;
    for (let i = 0; i < 64; i++) {
      const c = v.cell(i); const d = Math.floor(i / 8) + (i % 8);
      beads.push(...makeBeads(v, c.x, c.y, s * 0.9, theme.palette[d % theme.palette.length], d * 0.045, 1));
    }
    v.add({ life: 2400, draw(ctx, it, p, vv, age) { drawBeads(vv, ctx, beads, age / 1000); } });
    afterglow(v, 2600, 200, 1);
    candyCascade(v, theme, 9, 2200, 500);
  },

  // Idle: gloss lives in the blocks (CSS highlight drift); a glint winks on a random block now and then.
  idle(v) {
    const loop = () => { this.idleBeat(v); v.later(loop, v.r(2200, 4200)); };
    v.later(loop, 1500);
    return () => { for (const c of v.board.cells || []) { const b = c.firstElementChild; if (b && b.classList) b.classList.remove('jelly-nudge'); } };
  },
  idleBeat(v) {
    const filled = (v.board.cells || []).map((c, i) => (c.firstElementChild ? i : -1)).filter((i) => i >= 0);
    const i = filled.length ? filled[Math.floor(random() * filled.length)] : Math.floor(random() * 64);
    const c = v.cell(i);
    v.add({ life: 700, draw(ctx, it, p) { const a = envelope(p, 0, 0.35, 0.45, 1); glint(ctx, c.x - c.s * 0.25, c.y - c.s * 0.28, c.s * 0.32 * a, a); } });
  },
};
