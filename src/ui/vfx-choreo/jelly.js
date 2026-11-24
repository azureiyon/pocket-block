// Jelly Pop — living gelatin. Viscosity, elasticity and surface tension:
// masses that stretch and neck, droplets that deform along their motion and
// wobble back to round, waves that merge and split. No rigid circles.

import { random } from '../vfx.js';
import { TAU, clamp, seg, easeOut, easeInOut, envelope, mix, rgba, linesOf, paintBlock } from '../vfx-kit.js';

const G = 900; // px/s^2

/** One gel droplet: a deforming body with decaying wobble, able to merge with others. */
function makeDrop(x, y, vx, vy, r, color) {
  return { x, y, vx, vy, r, color, wob: 0.55, wt: 0, born: 0, alive: true, seed: random() * TAU };
}

function stepDrops(drops, dt, floorY) {
  for (const d of drops) {
    if (!d.alive) continue;
    d.vy += G * dt; d.vx *= 0.995;
    d.x += d.vx * dt; d.y += d.vy * dt;
    d.wt += dt; d.wob *= Math.exp(-3.2 * dt);
    if (floorY && d.y > floorY && d.vy > 0) { d.vy *= -0.35; d.y = floorY; d.wob = Math.min(0.6, d.wob + 0.35); d.wt = 0; }
  }
  // Surface tension: touching droplets coalesce into one bigger body.
  for (let i = 0; i < drops.length; i++) {
    const a = drops[i]; if (!a.alive) continue;
    for (let j = i + 1; j < drops.length; j++) {
      const b = drops[j]; if (!b.alive) continue;
      const dx = b.x - a.x; const dy = b.y - a.y;
      if (dx * dx + dy * dy < ((a.r + b.r) * 0.72) ** 2) {
        const ma = a.r * a.r; const mb = b.r * b.r; const m = ma + mb;
        a.x = (a.x * ma + b.x * mb) / m; a.y = (a.y * ma + b.y * mb) / m;
        a.vx = (a.vx * ma + b.vx * mb) / m; a.vy = (a.vy * ma + b.vy * mb) / m;
        a.r = Math.sqrt(m); if (mb > ma) a.color = b.color; a.wob = 0.7; a.wt = 0;
        b.alive = false;
      }
    }
  }
}

function drawDrop(ctx, d, alpha) {
  const sp = Math.hypot(d.vx, d.vy);
  const stretch = 1 + clamp(sp / 1400, 0, 0.45);
  const w = Math.sin(d.wt * 19) * d.wob;
  const sx = stretch * (1 + w * 0.35); const sy = (1 / stretch) * (1 - w * 0.35);
  const ang = Math.atan2(d.vy, d.vx);
  ctx.save(); ctx.translate(d.x, d.y); ctx.rotate(ang);
  ctx.globalAlpha = alpha;
  // Living outline: low harmonics ripple around the surface as the wobble decays.
  ctx.beginPath();
  const ph = d.wt * 7 + (d.seed || 0);
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * TAU;
    const rr = d.r * (1 + d.wob * 0.22 * Math.sin(a * 3 + ph) + 0.035 * Math.sin(a * 2 - ph * 0.7));
    const x = Math.cos(a) * rr * sx; const y = Math.sin(a) * rr * sy;
    if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = rgba(d.color, 0.82); ctx.fill();
  ctx.lineWidth = 1.2; ctx.strokeStyle = rgba(mix(d.color, '#7a3a55', 0.35), 0.5); ctx.stroke();
  ctx.rotate(-ang);
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  ctx.beginPath(); ctx.ellipse(-d.r * 0.32, -d.r * 0.34, d.r * 0.24, d.r * 0.15, -0.6, 0, TAU); ctx.fill();
  ctx.restore();
}

/**
 * A line of jelly: swell, fuse into one mass, neck into four lobes through
 * thinning elastic strands, then let the lobes go as droplets.
 */
function massShape(ctx, line, p, wave, t) {
  const s = line.s; const N = 44;
  const fuse = easeOut(seg(p, 0.1, 0.28));
  const pinch = easeInOut(seg(p, 0.28, 0.56));
  const stretch = 1 + 0.08 * pinch;
  const half = (u) => {
    const neck = 0.5 + 0.5 * Math.cos(u * TAU * 4);
    const end = Math.min(1, Math.sin(Math.PI * u) * 3.2);
    return s * 0.52 * end * (1 + 0.06 * (1 - pinch)) * (1 - pinch * 0.96 * neck);
  };
  const top = []; const bot = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const along = (u - 0.5) * line.len * stretch + 0;
    const sway = wave(u, t) * (1 - pinch * 0.5);
    const h = half(u) * (0.8 + 0.2 * fuse);
    if (line.axis === 'h') { top.push([line.cx + along, line.cy + sway - h]); bot.push([line.cx + along, line.cy + sway + h]); }
    else { top.push([line.cx + sway - h, line.cy + along]); bot.push([line.cx + sway + h, line.cy + along]); }
  }
  ctx.beginPath(); ctx.moveTo(top[0][0], top[0][1]);
  for (const q of top) ctx.lineTo(q[0], q[1]);
  for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]);
  ctx.closePath();
  return { top, bot };
}

function lineMass(v, line, delay, waveFrom, drops) {
  const s = line.s;
  const g = (x) => line.cells[Math.min(7, Math.round(x * 7))].color;
  v.add({
    life: 760, delay,
    draw(ctx, it, p, vv, age) {
      const t = age / 1000;
      const swell = envelope(p, 0, 0.1, 0.14, 0.26) * 0.12;
      const fuse = easeOut(seg(p, 0.1, 0.3));
      // Snapshot blocks swell and soften into the mass.
      for (const c of line.cells) paintBlock(ctx, 'gel', c.x, c.y, s, c.color, { sx: 1 + swell, sy: 1 + swell, alpha: 1 - fuse });
      if (fuse <= 0) return;
      const wave = (u, tt) => (waveFrom ? Math.sin(Math.abs(u - waveFrom.u) * TAU * 1.4 - tt * 16) * s * 0.22 * Math.exp(-Math.abs(u - waveFrom.u) * 1.5) : Math.sin(u * TAU + tt * 6) * s * 0.06);
      const shape = massShape(ctx, line, p, wave, t);
      const grad = line.axis === 'h' ? ctx.createLinearGradient(line.a.x, 0, line.b.x, 0) : ctx.createLinearGradient(0, line.a.y, 0, line.b.y);
      for (let k = 0; k < 8; k++) grad.addColorStop(k / 7, rgba(line.cells[k].color, 0.86));
      ctx.globalAlpha = fuse; ctx.fillStyle = grad; ctx.fill();
      ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(122,58,85,.35)'; ctx.stroke();
      // Gloss riding along the upper surface.
      ctx.globalAlpha = fuse * 0.7; ctx.strokeStyle = 'rgba(255,255,255,.9)'; ctx.lineWidth = s * 0.08; ctx.lineCap = 'round';
      ctx.beginPath();
      shape.top.forEach((q, i) => { const o = line.axis === 'h' ? [q[0], q[1] + s * 0.14] : [q[0] + s * 0.14, q[1]]; if (i % 2) return; if (i === 0) ctx.moveTo(o[0], o[1]); else ctx.lineTo(o[0], o[1]); });
      ctx.stroke();
      // At full pinch the lobes let go as droplets.
      if (p >= 0.56 && !it.released) {
        it.released = true;
        for (let k = 0; k < 4; k++) {
          const u = 0.125 + k * 0.25; const along = (u - 0.5) * line.len * 1.08;
          const x = line.axis === 'h' ? line.cx + along : line.cx; const y = line.axis === 'h' ? line.cy : line.cy + along;
          const side = k % 2 ? 1 : -1; const out = (u - 0.5) * 2;
          const vx = line.axis === 'h' ? out * 160 + vv.r(-30, 30) : side * vv.r(120, 220);
          const vy = line.axis === 'h' ? -vv.r(260, 420) : out * 160 - vv.r(120, 260);
          drops.push(makeDrop(x, y, vx, vy, s * 0.5, g(u)));
        }
      }
    },
  });
}

/** Owns every droplet of one event, so drops from different lines can meet and merge. */
function dropSystem(v, drops, life = 1500, delay = 0) {
  const floor = v.cell(63).y + v.cell(63).s * 0.6;
  v.add({
    life, delay,
    draw(ctx, it, p, vv) {
      stepDrops(drops, vv.dt || 0.016, floor);
      const fade = 1 - seg(p, 0.75, 1);
      for (const d of drops) if (d.alive) drawDrop(ctx, d, fade);
    },
  });
}

/** A rolling wave of translucent jelly crossing the board; two waves meet and fuse. */
function jellyWave(v, theme, from, delay, drops, release) {
  const a = v.cell(0); const z = v.cell(63); const s = a.s;
  const x0 = a.x - s * 0.6; const x1 = z.x + s * 0.6; const y0 = a.y - s * 0.6; const y1 = z.y + s * 0.6;
  const col = theme.palette[from === 'top' ? 0 : 3];
  v.add({
    life: 1250, delay,
    draw(ctx, it, p, vv, age) {
      const t = age / 1000;
      const travel = easeInOut(seg(p, 0, 0.6));
      const mid = (y0 + y1) / 2;
      const y = from === 'top' ? y0 + (mid - y0) * travel : y1 - (y1 - mid) * travel;
      const th = s * (0.55 + 0.35 * Math.sin(Math.PI * travel));
      const fade = 1 - seg(p, 0.72, 1);
      ctx.globalAlpha = fade * 0.75;
      ctx.beginPath();
      const N = 36;
      for (let i = 0; i <= N; i++) { const x = x0 + ((x1 - x0) * i) / N; const yy = y - th / 2 + Math.sin(i * 0.7 + t * 9) * s * 0.18 * (1 - seg(p, 0.6, 1)); if (i) ctx.lineTo(x, yy); else ctx.moveTo(x, yy); }
      for (let i = N; i >= 0; i--) { const x = x0 + ((x1 - x0) * i) / N; ctx.lineTo(x, y + th / 2 + Math.sin(i * 0.9 - t * 7) * s * 0.14); }
      ctx.closePath(); ctx.fillStyle = rgba(col, 0.5); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 2; ctx.stroke();
      if (release && p > 0.58 && !it.split) {
        it.split = true;
        for (let k = 0; k < 6; k++) drops.push(makeDrop(x0 + ((x1 - x0) * (k + 0.5)) / 6, mid, vv.r(-80, 80), -vv.r(300, 480), s * 0.42, theme.palette[k % 5]));
      }
    },
  });
}

export default {
  place(v, move) {
    // The DOM block squashes on impact (CSS); its neighbours answer with a smaller wobble.
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
  },

  clear(v, move, theme) {
    const lines = linesOf(v, move, theme);
    const drops = [];
    // With several lines, each mass ripples outward from where the lines cross.
    const h = lines.find((l) => l.axis === 'h'); const w = lines.find((l) => l.axis === 'v');
    lines.forEach((line, n) => {
      let waveFrom = null;
      if (lines.length > 1) {
        const other = line.axis === 'h' ? w : h;
        waveFrom = { u: other ? other.idx / 7 : 0.5 };
      }
      lineMass(v, line, n * 80, waveFrom, drops);
    });
    dropSystem(v, drops, 1700, 0);
  },

  streak(v, move, theme) {
    const drops = [];
    const two = move.combo >= 4;
    jellyWave(v, theme, 'top', 0, drops, !two);
    if (two) jellyWave(v, theme, 'bottom', 0, drops, true);
    dropSystem(v, drops, 2200, 0);
  },

  milestone(v, info, theme) {
    // A big blob drops in, squashes, wobbles and buds off droplets.
    const b = v.boardCenter(); const s = b.s; const drops = [];
    v.add({
      life: 1500,
      draw(ctx, it, p, vv, age) {
        const fall = easeOut(seg(p, 0, 0.25));
        const y = b.y - b.size * 0.55 + b.size * 0.55 * fall;
        const land = seg(p, 0.22, 1);
        const wob = Math.exp(-land * 5) * Math.sin(land * 26) * (p > 0.22 ? 1 : 0);
        const r = s * 1.5;
        const fade = 1 - seg(p, 0.55, 0.7);
        drawDrop(ctx, { x: b.x, y, vx: 0, vy: 0, r, color: theme.palette[0], wob: 0.15 + Math.abs(wob) * 1.6, wt: age / 1000, seed: 1 }, fade);
        if (p > 0.55 && !it.bud) { it.bud = true; for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * 0.5; drops.push(makeDrop(b.x, y, Math.cos(a) * 320, Math.sin(a) * 420, s * 0.55, theme.palette[k % 5])); } }
      },
    });
    dropSystem(v, drops, 2200, 0);
  },

  boardClear(v, move, theme) {
    const drops = [];
    jellyWave(v, theme, 'top', 0, drops, false);
    jellyWave(v, theme, 'bottom', 0, drops, true);
    const b = v.boardCenter();
    v.add({ life: 700, delay: 900, draw(ctx, it, p) { if (!it.done) { it.done = true; for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU; drops.push(makeDrop(b.x, b.y, Math.cos(a) * 420, Math.sin(a) * 420 - 200, b.s * 0.38, theme.palette[k % 6])); } } } });
    dropSystem(v, drops, 2800, 0);
  },

  // Idle: microscopic wobbles in random blocks, and highlights drifting inside the gel (CSS).
  idle(v) {
    const loop = () => { this.idleBeat(v); v.later(loop, v.r(1600, 3600)); };
    v.later(loop, 1200);
    return () => { for (const c of v.board.cells || []) { const b = c.firstElementChild; if (b && b.classList) b.classList.remove('jelly-idle', 'jelly-nudge'); } };
  },
  idleBeat(v) {
    const cells = (v.board.cells || []).filter((c) => c.firstElementChild);
    for (let k = 0; k < 2 && cells.length; k++) {
      const blk = cells[Math.floor(v.r(0, cells.length))].firstElementChild;
      blk.classList.remove('jelly-idle'); void blk.offsetWidth; blk.classList.add('jelly-idle');
      v.later(() => blk.classList.remove('jelly-idle'), 1300);
    }
  },
};
