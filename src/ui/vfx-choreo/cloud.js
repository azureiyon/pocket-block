// Cloud Palace — celestial silk and vapour. Every clear is a miniature
// sunrise: a thin sunbeam travels the line, blocks lose their edges and
// become lit wisps that curl upward on S-shaped paths. Big moments happen
// behind the board (a golden arch, a rising sun, ornamental stars).

import { TAU, seg, easeOut, easeInOut, envelope, mix, rgba, linesOf, contour, paintBlock, perimeter } from '../vfx-kit.js';

const GOLD = '#f2c86b';
const SUN = '#fff1c4';

function wisp(ctx, img, x, y, size, alpha) {
  ctx.globalAlpha = alpha; ctx.drawImage(img, x - size / 2, y - size / 2, size, size);
}

/** Thin ornamental eight-point star outline, like the gilt piping of the palace. */
function ornament(ctx, x, y, r, alpha, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = alpha;
  ctx.strokeStyle = '#c9a24b'; ctx.lineWidth = 1.6; ctx.beginPath();
  for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; const rr = i % 2 ? r * 0.28 : i % 4 ? r * 0.62 : r; ctx[i ? 'lineTo' : 'moveTo'](Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath(); ctx.stroke();
  ctx.fillStyle = SUN; ctx.beginPath(); ctx.arc(0, 0, r * 0.12, 0, TAU); ctx.fill();
  ctx.restore();
}

function clearLine(v, line, theme, delay) {
  const s = line.s;
  const puff = (c) => v.sprite('puff', mix(c, '#ffffff', 0.7));
  const shade = v.sprite('puff', '#b9a6cf');
  const gold = v.sprite('glow', GOLD);
  // Four wisps per block with their own S-curve parameters (deterministic per replay).
  const wisps = line.cells.flatMap((c, k) => Array.from({ length: 3 }, (_, j) => ({
    k, x: c.x + v.r(-s * 0.3, s * 0.3), y: c.y + v.r(-s * 0.3, s * 0.3), img: puff(c.color),
    amp: v.r(s * 0.25, s * 0.6), freq: v.r(3.2, 5), ph: v.r(0, TAU), rise: v.r(s * 2.4, s * 4), size: v.r(s * 0.55, s * 0.8), lag: j * 0.03,
  })));
  v.add({
    life: 2000, delay,
    draw(ctx, it, p) {
      const beam = easeInOut(seg(p, 0, 0.3));
      // The sunbeam: a thin warm line growing along the cleared line, brightest at its head.
      const hx = line.a.x + (line.b.x - line.a.x) * beam; const hy = line.a.y + (line.b.y - line.a.y) * beam;
      const bf = 1 - seg(p, 0.3, 0.5);
      if (bf > 0) {
        const g = ctx.createLinearGradient(line.a.x, line.a.y, hx + 0.01, hy + 0.01);
        g.addColorStop(0, rgba(GOLD, 0)); g.addColorStop(1, rgba('#ffd77a', 1));
        ctx.globalAlpha = bf; ctx.strokeStyle = g; ctx.lineWidth = s * 0.22; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(line.a.x, line.a.y); ctx.lineTo(hx, hy); ctx.stroke();
        wisp(ctx, gold, hx, hy, s * 1.6, bf * (beam < 1 ? 1 : 0.6));
      }
      // Blocks: when the light reaches one it softens and lifts away as vapour.
      for (const c of line.cells) {
        const lit = seg(p, 0.03 + (c === line.cells[0] ? 0 : 0.3 * (line.cells.indexOf(c) / 7)), 0.2 + 0.3 * (line.cells.indexOf(c) / 7));
        paintBlock(ctx, 'pearl', c.x, c.y - lit * s * 0.08, s, c.color, { alpha: 1 - easeOut(lit), glow: lit * 0.7, sx: 1 + lit * 0.12, sy: 1 + lit * 0.12 });
      }
      for (const w of wisps) {
        const start = 0.08 + 0.3 * (w.k / 7) + w.lag;
        const tt = seg(p, start, 1);
        if (tt <= 0) continue;
        const e = easeOut(tt);
        const x = w.x + Math.sin(tt * w.freq + w.ph) * w.amp * (0.4 + tt);
        const y = w.y - w.rise * e;
        const size = w.size * (0.8 + tt * 1.4);
        const a = envelope(tt, 0, 0.12, 0.4, 1) * 0.95;
        wisp(ctx, shade, x + size * 0.06, y + size * 0.14, size * 0.92, a * 0.35);
        wisp(ctx, w.img, x, y, size, a);
        // Sunlit rim on the upper side of each wisp.
        wisp(ctx, gold, x, y - size * 0.18, size * 0.55, a * 0.35);
      }
    },
  });
}

function sunrise(v, x, y, r, life = 1900, delay = 0) {
  const halo = v.sprite('glow', SUN);
  v.add({
    back: true, life, delay,
    draw(ctx, it, p, vv, age) {
      const up = easeOut(seg(p, 0, 0.5)); const fade = 1 - seg(p, 0.6, 1);
      const cy = y + r * 1.6 * (1 - up);
      ctx.globalAlpha = fade * 0.9; ctx.drawImage(halo, x - r * 3, cy - r * 3, r * 6, r * 6);
      // Long soft rays fanning above the horizon.
      ctx.globalAlpha = fade * 0.35; ctx.strokeStyle = GOLD; ctx.lineCap = 'round';
      for (let k = 0; k < 9; k++) {
        const a = Math.PI + (k + 0.5) * (Math.PI / 9) + Math.sin(age / 900 + k) * 0.03;
        ctx.lineWidth = k % 2 ? 1 : 2.5;
        ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 1.4, cy + Math.sin(a) * r * 1.4); ctx.lineTo(x + Math.cos(a) * r * (3 + (k % 3)), cy + Math.sin(a) * r * (3 + (k % 3))); ctx.stroke();
      }
      ctx.globalAlpha = fade; ctx.fillStyle = SUN; ctx.beginPath(); ctx.arc(x, cy, r, 0, TAU); ctx.fill();
    },
  });
}

/** A celestial arch of golden light unfolding behind the board while the clouds part. */
function arch(v, theme, life = 2600, stars = 7) {
  const per = perimeter(v, -0.2);
  const cx = per.cx; const cy = per.cy + per.h * 0.08; const R = per.w * 0.62;
  const env = v.doc && v.doc.querySelector && v.doc.querySelector('.env');
  if (env) { env.classList.add('parted'); v.later(() => env.classList.remove('parted'), life); }
  const spots = Array.from({ length: stars }, (_, k) => {
    const a = Math.PI + ((k + 0.5) / stars) * Math.PI;
    return { x: cx + Math.cos(a) * R * v.r(1.08, 1.3), y: cy + Math.sin(a) * R * v.r(1.08, 1.3), r: v.r(5, 11), at: 0.3 + (k / stars) * 0.3, rot: v.r(0, 1) };
  });
  v.add({
    back: true, life,
    draw(ctx, it, p) {
      const open = easeInOut(seg(p, 0, 0.45)); const fade = 1 - seg(p, 0.72, 1);
      const a0 = Math.PI; const a1 = Math.PI + Math.PI * open;
      for (const [w, al, col] of [[34, 0.22, GOLD], [14, 0.4, GOLD], [4, 1, '#fff6dc']]) {
        ctx.globalAlpha = al * fade; ctx.strokeStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(cx, cy, R, a0, a1); ctx.stroke();
      }
      ctx.globalAlpha = 0.8 * fade; ctx.lineWidth = 1.5; ctx.strokeStyle = '#c9a24b';
      ctx.beginPath(); ctx.arc(cx, cy, R * 0.9, a0, a1); ctx.stroke();
      for (const s of spots) { const e = envelope(p, s.at, s.at + 0.1, 0.75, 1); if (e > 0) ornament(ctx, s.x, s.y, s.r * (0.6 + 0.4 * e), e, s.rot + p); }
    },
  });
}

export default {
  place(v, move) {
    // A small halo of vapour curls off the piece's outline.
    const pts = contour(v, move.placed); if (!pts.length) return;
    const c = v.centerOf(move.placed);
    for (let k = 0; k < pts.length; k += Math.max(1, Math.floor(pts.length / 6))) {
      const q = pts[k]; const a = Math.atan2(q.y - c.y, q.x - c.x);
      v.burst(q.x, q.y, { n: 2, sprite: 'puff', colors: ['#ffffff', '#fff6e4'], speed: [26, 52], angle: a, spread: 0.3, life: [0.7, 1], size: [c.s * 0.3, c.s * 0.45], grow: 2.2, curl: 3.4, drag: 0.97, alpha: 0.95 });
    }
  },

  clear(v, move, theme) {
    const lines = linesOf(v, move, theme);
    lines.forEach((line, n) => clearLine(v, line, theme, n * 110));
    if (lines.length >= 2) {
      const per = perimeter(v, -0.2);
      sunrise(v, per.cx, per.y0, per.w * 0.07, 1900, 180);
    }
  },

  streak(v, move, theme) { arch(v, theme, 2400 + Math.min(move.combo, 6) * 120, 4 + Math.min(move.combo, 6)); },

  milestone(v, info, theme) {
    const per = perimeter(v, -0.2);
    sunrise(v, per.cx, per.y0, per.w * 0.1, 2400);
  },

  boardClear(v, move, theme) {
    const per = perimeter(v, -0.2);
    arch(v, theme, 3000, 11);
    sunrise(v, per.cx, per.y0, per.w * 0.12, 2800, 300);
  },

  // Idle: cloud layers drift (CSS) and golden light filters through the gaps now and then.
  idle(v) {
    const loop = () => { this.idleBeat(v); v.later(loop, v.r(6000, 11000)); };
    v.later(loop, 3000);
    return () => { const env = v.doc && v.doc.querySelector && v.doc.querySelector('.env'); if (env) env.classList.remove('gleam', 'parted'); };
  },
  idleBeat(v) {
    const env = v.doc && v.doc.querySelector && v.doc.querySelector('.env'); if (!env) return;
    env.classList.remove('gleam'); void env.offsetWidth; env.classList.add('gleam');
    v.later(() => env.classList.remove('gleam'), 4200);
  },
};
