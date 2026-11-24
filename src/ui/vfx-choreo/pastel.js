// Classic Pastel — satin ribbons. Luxury stationery and flowing silk:
// minimal, precise, never plain. Everything here is a ribbon, a strip of
// light or a single glint; no bursts, no confetti.

import { TAU, seg, easeOut, easeIn, easeInOut, envelope, mix, rgba, star4, linesOf, along, contour, pathSampler, perimeter, paintBlock } from '../vfx-kit.js';

const SHEEN = '#ffffff';

/**
 * Draw a twisting satin ribbon through centreline samples. Width follows
 * |cos(twist)|, and the face colour flips between the lit front and the
 * slightly darker back, which is what makes a flat band read as satin.
 */
function satin(ctx, pts, width, colorAt, twist, alpha) {
  // Soft shadow under the whole ribbon so a pale band still reads on cream paper.
  ctx.save(); ctx.translate(0, 2); ctx.globalAlpha = alpha * 0.12; ctx.strokeStyle = '#8a6a5a'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.lineWidth = width(Math.floor(pts.length / 2)) * 1.3;
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke(); ctx.restore();
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]; const b = pts[i];
    const dx = b.x - a.x; const dy = b.y - a.y; const l = Math.hypot(dx, dy) || 1;
    const nx = -dy / l; const ny = dx / l;
    const ta = Math.cos(twist(i - 1)); const tb = Math.cos(twist(i));
    const wa = width(i - 1) * (0.18 + 0.82 * Math.abs(ta)); const wb = width(i) * (0.18 + 0.82 * Math.abs(tb));
    const u = i / (pts.length - 1); const base = colorAt(u);
    const front = ta + tb > 0;
    ctx.globalAlpha = alpha;
    // Front face: pale and lustrous; back face: the same hue a step deeper, never brown.
    const face = front ? mix(base, SHEEN, 0.55) : mix(base, SHEEN, 0.18);
    ctx.fillStyle = face; ctx.strokeStyle = face; ctx.lineWidth = 0.8; ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(a.x + nx * wa, a.y + ny * wa); ctx.lineTo(b.x + nx * wb, b.y + ny * wb);
    ctx.lineTo(b.x - nx * wb, b.y - ny * wb); ctx.lineTo(a.x - nx * wa, a.y - ny * wa);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    if (front && Math.abs(ta) > 0.75) {
      // Specular sheen riding the crest of the lit face.
      ctx.globalAlpha = alpha * 0.8 * (Math.abs(ta) - 0.75) * 4;
      ctx.strokeStyle = SHEEN; ctx.lineWidth = Math.max(1, wa * 0.25);
      ctx.beginPath(); ctx.moveTo(a.x + nx * wa * 0.35, a.y + ny * wa * 0.35); ctx.lineTo(b.x + nx * wb * 0.35, b.y + ny * wb * 0.35); ctx.stroke();
    }
  }
}

function strokePath(ctx, pts, color, width, alpha) {
  ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y); ctx.stroke();
}

/** A ribbon unfurling along a cleared line, with its blocks compressing into strips that weave through it. */
function lineRibbon(v, line, theme, delay, lift) {
  const N = 22; const s = line.s;
  const cA = line.cells[0].color; const cB = line.cells[7].color;
  const phase = v.r(0, TAU);
  v.add({
    life: 1650, delay,
    draw(ctx, it, p, vv, age) {
      const t = age / 1000;
      const unfurl = easeOut(seg(p, 0.08, 0.42));
      const squash = easeInOut(seg(p, 0.12, 0.38));
      const sweep = easeIn(seg(p, 0.46, 0.78));
      const fade = 1 - seg(p, 0.6, 0.8);
      const amp = s * 0.34 * (0.4 + 0.6 * unfurl) * (1 + sweep * 1.4);
      // Centreline of the ribbon, travelling away along the line and lifting on the normal.
      const head = unfurl;
      const pts = [];
      for (let i = 0; i <= N; i++) {
        const u = (i / N) * head;
        const o = along(line, u);
        const wave = Math.sin(u * TAU * 1.5 + phase + t * 2.2) * amp;
        const drift = sweep * line.len * 0.9;
        const curl = -sweep * sweep * s * 2.2 * lift;
        pts.push({ x: o.x + o.nx * (wave + curl) + o.tx * drift, y: o.y + o.ny * (wave + curl) + o.ty * drift });
      }
      // Blocks: a breath of anticipation, then they flatten into luminous strips riding the ribbon's wave.
      const breathe = envelope(p, 0, 0.06, 0.08, 0.14) * 0.07;
      for (let k = 0; k < 8; k++) {
        const c = line.cells[k]; const u = k / 7;
        const wave = Math.sin(u * TAU * 1.5 + phase + Math.PI + t * 2.2) * amp * squash * 0.7;
        const drift = sweep * line.len * 0.9; const curl = -sweep * sweep * s * 2.2 * lift;
        const off = wave + curl;
        const x = c.x + (line.axis === 'v' ? off : drift); const y = c.y + (line.axis === 'h' ? off : drift);
        const thin = 1 - squash * 0.84;
        paintBlock(ctx, 'enamel', x, y, s, c.color, {
          sx: line.axis === 'h' ? 1 + breathe + squash * 0.08 : thin + breathe,
          sy: line.axis === 'h' ? thin + breathe : 1 + breathe + squash * 0.08,
          glow: 0.15 + squash * 0.7, alpha: fade * (1 - seg(p, 0.5, 0.72)) * 0.98,
        });
      }
      if (head > 0.02 && fade > 0) satin(ctx, pts, () => s * 0.24, (u) => { const x = u * 7; const k = Math.min(6, Math.floor(x)); return mix(line.cells[k].color, line.cells[k + 1].color, x - k); }, (i) => (i / N) * head * TAU * 2.2 + t * 3, fade * 0.95);
      // The fine curved afterimage the ribbon leaves behind.
      if (p > 0.42) {
        if (!it.ghost) it.ghost = pts.map((q) => ({ x: q.x, y: q.y }));
        const g = envelope(p, 0.42, 0.5, 0.82, 1);
        strokePath(ctx, it.ghost, mix(cA, SHEEN, 0.5), 1.2, g * 0.55);
        const gl = pathSampler(it.ghost, false).at(seg(p, 0.5, 0.98));
        star4(ctx, gl.x, gl.y, s * 0.28 * g, SHEEN, g);
      }
    },
  });
}

/** Lemniscate flourish: a ribbon drawn as a figure of eight, used to tie lines together. */
function flourish(v, x, y, size, colors, delay = 0, life = 1400) {
  const N = 48;
  v.add({
    life, delay,
    draw(ctx, it, p, vv, age) {
      const draw = easeOut(seg(p, 0, 0.45)); const fade = 1 - seg(p, 0.7, 1);
      const n = Math.max(2, Math.round(N * draw));
      const pts = [];
      for (let i = 0; i <= n; i++) { const a = (i / N) * TAU; const d = 1 + Math.sin(a) ** 2; pts.push({ x: x + (size * Math.cos(a)) / d, y: y + (size * Math.sin(a) * Math.cos(a)) / d }); }
      satin(ctx, pts, () => size * 0.11, (u) => mix(colors[0], colors[1] || colors[0], u), (i) => i * 0.32 + age / 300, fade * 0.95);
      if (draw >= 1) star4(ctx, x, y, size * 0.35 * envelope(p, 0.45, 0.55, 0.65, 0.9), SHEEN, 1);
    },
  });
}

/** Several ribbons braiding around the board, then unravelling outwards. */
function braid(v, theme, count, life = 1900, delay = 0) {
  const per = perimeter(v, -0.42); const s = v.cell(0).s;
  const cols = theme.palette.slice(0, 5);
  const N = 30;
  v.add({
    life, delay,
    draw(ctx, it, p, vv, age) {
      const t = age / 1000;
      const travel = easeInOut(seg(p, 0, 0.72));
      const unravel = easeIn(seg(p, 0.62, 1));
      const fade = 1 - seg(p, 0.78, 1);
      const span = 0.36 + 0.3 * travel;
      for (let k = 0; k < count; k++) {
        const pts = [];
        const head = 0.125 + travel * 1.05 + k * 0.004;
        for (let i = 0; i <= N; i++) {
          const u = head - span * (1 - i / N);
          const q = per.at(u);
          const nx = -q.dy; const ny = q.dx;
          const off = Math.sin(u * TAU * 4 + (k / count) * TAU) * s * 0.34 * (1 + unravel * 2.5) + unravel * s * 1.4 * (k % 2 ? 1 : -1) * (i / N);
          pts.push({ x: q.x + nx * off, y: q.y + ny * off });
        }
        satin(ctx, pts, (i) => s * 0.2 * Math.pow(Math.sin((i / N) * Math.PI), 0.6), () => cols[k % cols.length], (i) => i * 0.22 + t * 3 + k * 1.7, fade * 0.95);
      }
    },
  });
}

export default {
  place(v, move, theme) {
    const pts = contour(v, move.placed);
    if (pts.length < 3) return;
    const path = pathSampler(pts, true); const s = v.cell(move.placed[0]).s;
    const tint = mix(theme.palette[(move.color - 1) % theme.palette.length] || theme.palette[0], '#5a4636', 0.25);
    v.add({
      life: 820,
      draw(ctx, it, p) {
        const head = easeInOut(seg(p, 0, 0.62));
        const fade = 1 - seg(p, 0.7, 1);
        // A thin travelling highlight: eight tapering segments behind the head.
        for (let k = 0; k < 8; k++) {
          const a = path.at(head - (k + 1) * 0.035); const b = path.at(head - k * 0.035);
          if (head - (k + 1) * 0.035 < 0) break;
          ctx.lineCap = 'round';
          ctx.globalAlpha = (1 - k / 8) * 0.45 * fade; ctx.strokeStyle = tint; ctx.lineWidth = 5 - k * 0.45;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          ctx.globalAlpha = (1 - k / 8) * fade; ctx.strokeStyle = SHEEN; ctx.lineWidth = 2.8 - k * 0.25; ctx.stroke();
        }
        const end = path.at(head);
        const g = envelope(p, 0.55, 0.68, 0.72, 1);
        if (g > 0) { star4(ctx, end.x, end.y, s * 0.5 * g, tint, g * 0.5); star4(ctx, end.x, end.y, s * 0.42 * g, SHEEN, g); }
      },
    });
  },

  clear(v, move, theme) {
    const lines = linesOf(v, move, theme);
    lines.forEach((line, n) => lineRibbon(v, line, theme, n * 95, n % 2 ? -1 : 1));
    if (lines.length >= 2) {
      // Multiple lines are tied together with a satin bow-knot at their meeting point.
      const h = lines.find((l) => l.axis === 'h'); const w = lines.find((l) => l.axis === 'v');
      const x = h && w ? w.cx : lines.reduce((a, l) => a + l.cx, 0) / lines.length;
      const y = h && w ? h.cy : lines.reduce((a, l) => a + l.cy, 0) / lines.length;
      flourish(v, x, y, lines[0].s * (1.1 + lines.length * 0.25), [lines[0].cells[3].color, lines[1].cells[4].color], 260);
    }
  },

  streak(v, move, theme) {
    braid(v, theme, Math.min(2 + Math.floor(move.combo / 3), 3));
  },

  milestone(v, info, theme) {
    const b = v.boardCenter();
    flourish(v, b.x, b.y - b.size * 0.08, b.size * 0.3, [theme.palette[0], theme.palette[4]], 0, 1800);
  },

  boardClear(v, move, theme) {
    const b = v.boardCenter();
    braid(v, theme, 3, 2300);
    flourish(v, b.x, b.y, b.size * 0.22, [theme.palette[0], theme.palette[5]], 200, 2000);
    flourish(v, b.x, b.y, b.size * 0.34, [theme.palette[2], theme.palette[4]], 420, 1900);
  },

  // Idle: pearlescent light passes over the satin backdrop now and then.
  idle(v) {
    const loop = () => { this.idleBeat(v); v.later(loop, v.r(7000, 12000)); };
    v.later(loop, v.r(2500, 5000));
    return () => { const env = v.doc && v.doc.querySelector && v.doc.querySelector('.env'); if (env) env.classList.remove('sheen'); };
  },
  idleBeat(v) {
    const env = v.doc && v.doc.querySelector && v.doc.querySelector('.env');
    if (!env) return;
    env.classList.remove('sheen'); void env.offsetWidth; env.classList.add('sheen');
    v.later(() => env.classList.remove('sheen'), 3200);
  },
};
