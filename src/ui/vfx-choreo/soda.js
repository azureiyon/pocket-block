// Cream Soda Pop — effervescent liquid. Recognisable bubble physics: lines
// turn into a translucent liquid band, carbonation nucleates inside, then
// bubbles detach, accelerate upward with a wobble and pop into droplets.
// Nothing here stretches or merges like jelly; liquid drains and fizzes.

import { TAU, seg, easeOut, easeIn, easeInOut, envelope, mix, rgba, linesOf, contour, paintBlock, pathSampler, perimeter } from '../vfx-kit.js';

const CREAM = '#fffaf0';
const RISE = 380; // px/s^2 buoyancy

/** One bubble's whole life in closed form: nucleate, grow, rise, wobble, pop. */
function bubbleAt(b, t) {
  const tt = t - b.t0;
  if (tt < 0) return null;
  const grow = Math.min(1, tt / 0.18);
  const rt = Math.max(0, tt - b.hold);
  const x = b.x + Math.sin(rt * b.wf + b.ph) * b.wa * Math.min(1, rt * 3);
  const y = b.y - (b.v0 * rt + 0.5 * RISE * rt * rt);
  return { x, y, r: b.r * (0.35 + 0.65 * grow) * (1 + rt * 0.25), rt, popped: rt > b.pop, pt: rt - b.pop };
}

function drawBubble(ctx, q, color, alpha) {
  ctx.globalAlpha = alpha * 0.9;
  ctx.fillStyle = rgba(mix(color, '#ffffff', 0.6), 0.25);
  ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, TAU); ctx.fill();
  ctx.lineWidth = Math.max(1, q.r * 0.16); ctx.strokeStyle = rgba(mix(color, '#ffffff', 0.25), 0.9); ctx.stroke();
  // Refracted colour on the lower rim, window highlight on the upper.
  ctx.lineWidth = Math.max(1, q.r * 0.22); ctx.strokeStyle = rgba(color, 0.7);
  ctx.beginPath(); ctx.arc(q.x, q.y, q.r * 0.82, 0.3, 1.9); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.95)';
  ctx.beginPath(); ctx.arc(q.x - q.r * 0.35, q.y - q.r * 0.38, Math.max(0.8, q.r * 0.22), 0, TAU); ctx.fill();
}

function drawPop(ctx, q, color, alpha) {
  const t = q.pt; const k = Math.min(1, t / 0.22);
  ctx.globalAlpha = alpha * (1 - k);
  ctx.strokeStyle = rgba(mix(color, '#ffffff', 0.4), 1); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(q.x, q.y, q.r * (1 + k * 1.6), 0, TAU); ctx.stroke();
  ctx.fillStyle = rgba(color, 0.9);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + 0.4; const d = q.r * (1 + k * 2.4);
    ctx.beginPath(); ctx.arc(q.x + Math.cos(a) * d, q.y + Math.sin(a) * d + k * k * q.r * 2, Math.max(0.6, q.r * 0.18 * (1 - k)), 0, TAU); ctx.fill();
  }
}

function makeBubbles(v, n, area, color, t0, hold) {
  return Array.from({ length: n }, () => ({
    x: area.x + v.r(0, area.w), y: area.y + v.r(0, area.h), r: v.r(2.2, 5.2), t0: t0 + v.r(0, 0.32), hold: hold + v.r(0, 0.25),
    v0: v.r(10, 40), wa: v.r(2, 6), wf: v.r(8, 13), ph: v.r(0, TAU), pop: v.r(0.45, 1.1), color: typeof color === 'function' ? color() : color,
  }));
}

function lineFizz(v, line, delay) {
  const s = line.s; const T = 2.1;
  const box = line.axis === 'h' ? { x: line.a.x - s / 2, y: line.cy - s * 0.4, w: line.len + s, h: s * 0.8 } : { x: line.cx - s * 0.4, y: line.a.y - s / 2, w: s * 0.8, h: line.len + s };
  const colorNear = (b) => { const u = line.axis === 'h' ? (b.x - line.a.x) / line.len : (b.y - line.a.y) / line.len; return line.cells[Math.max(0, Math.min(7, Math.round(u * 7)))].color; };
  const bubbles = makeBubbles(v, Math.round(22 * v.level), box, '#fff', 0.2, 0.32);
  for (const b of bubbles) b.color = colorNear(b);
  v.add({
    life: T * 1000, delay,
    draw(ctx, it, p, vv, age) {
      const t = age / 1000;
      const liquefy = easeOut(seg(p, 0, 0.12));
      const drain = easeIn(seg(p, 0.24, 0.44));
      // Blocks melt into the liquid band.
      for (const c of line.cells) paintBlock(ctx, 'soda', c.x, c.y, s, c.color, { alpha: 1 - liquefy * 0.85 - drain * 0.15, glow: liquefy * 0.25 });
      // The band: translucent soda with a gently moving meniscus, draining toward its centre line.
      const th = s * 0.98 * (1 - drain);
      if (th > 0.5) {
        const N = 30; const top = []; const bot = [];
        for (let i = 0; i <= N; i++) {
          const u = i / N; const w1 = Math.sin(u * 14 + t * 7) * s * 0.05; const w2 = Math.sin(u * 11 - t * 6) * s * 0.04;
          if (line.axis === 'h') { const x = line.a.x - s / 2 + (line.len + s) * u; top.push([x, line.cy - th / 2 + w1]); bot.push([x, line.cy + th / 2 + w2]); }
          else { const y = line.a.y - s / 2 + (line.len + s) * u; top.push([line.cx - th / 2 + w1, y]); bot.push([line.cx + th / 2 + w2, y]); }
        }
        ctx.beginPath(); ctx.moveTo(top[0][0], top[0][1]); for (const q of top) ctx.lineTo(q[0], q[1]); for (let i = bot.length - 1; i >= 0; i--) ctx.lineTo(bot[i][0], bot[i][1]); ctx.closePath();
        const g = line.axis === 'h' ? ctx.createLinearGradient(line.a.x, 0, line.b.x, 0) : ctx.createLinearGradient(0, line.a.y, 0, line.b.y);
        for (let k = 0; k < 8; k++) g.addColorStop(k / 7, rgba(line.cells[k].color, 0.5));
        ctx.globalAlpha = liquefy; ctx.fillStyle = g; ctx.fill();
        ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.stroke();
      }
      for (const b of bubbles) {
        const q = bubbleAt(b, t); if (!q) continue;
        const fade = 1 - seg(p, 0.85, 1);
        if (q.popped) { if (q.pt < 0.25) drawPop(ctx, q, b.color, fade); } else drawBubble(ctx, q, b.color, fade * Math.min(1, (t - b.t0) * 6));
      }
    },
  });
}

/** A rolling wave of cream foam around the board edge, then a rising curtain of carbonation. */
function foamWave(v, theme, life = 2400) {
  const per = perimeter(v, -0.3); const s = v.cell(0).s;
  const lumps = Array.from({ length: 22 }, (_, k) => ({ o: k / 22, r: v.r(0.45, 0.8), ph: v.r(0, TAU) }));
  const curtain = makeBubbles(v, Math.round(40 * v.level), { x: per.x0, y: per.y1 - s * 0.5, w: per.w, h: s * 0.5 }, () => theme.palette[Math.floor(v.r(0, 4))], 1.05, 0);
  v.add({
    life,
    draw(ctx, it, p, vv, age) {
      const t = age / 1000;
      const head = easeInOut(seg(p, 0, 0.45));
      const fade = 1 - seg(p, 0.42, 0.6);
      if (fade > 0) {
        ctx.fillStyle = CREAM;
        for (const l of lumps) {
          const u = 0.125 + head * 1.0 - l.o * 0.42;
          if (u < 0.125) continue;
          const q = per.at(u);
          const r = s * l.r * (0.8 + 0.2 * Math.sin(t * 8 + l.ph)) * fade;
          ctx.globalAlpha = 0.95; ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, TAU); ctx.fill();
          ctx.globalAlpha = 0.25; ctx.fillStyle = '#e8c9a0'; ctx.beginPath(); ctx.arc(q.x + r * 0.2, q.y + r * 0.25, r * 0.7, 0, TAU); ctx.fill(); ctx.fillStyle = CREAM;
        }
      }
      for (const b of curtain) {
        const q = bubbleAt(b, t); if (!q) continue;
        if (q.popped) { if (q.pt < 0.25) drawPop(ctx, q, b.color, 1 - seg(p, 0.9, 1)); } else drawBubble(ctx, q, b.color, (1 - seg(p, 0.9, 1)) * Math.min(1, (t - b.t0) * 6));
      }
    },
  });
}

function bigBubble(v, theme, life = 2200) {
  const per = perimeter(v, -0.2);
  const b = { x: per.cx, y: per.y1, r: per.w * 0.09, t0: 0, hold: 0.1, v0: 30, wa: 10, wf: 4, ph: 0, pop: 1.25, color: theme.palette[1] };
  v.add({
    life,
    draw(ctx, it, p, vv, age) {
      const q = bubbleAt(b, age / 1000); if (!q) return;
      if (q.popped) {
        if (q.pt < 0.5) {
          drawPop(ctx, { ...q, r: q.r * 1.4, pt: q.pt * 0.6 }, b.color, 1);
          drawPop(ctx, { ...q, r: q.r * 0.8, pt: q.pt * 0.5 }, theme.palette[0], 1);
        }
      } else {
        // Wobbling surface: squash with the rise.
        ctx.save(); ctx.translate(q.x, q.y); ctx.scale(1 + Math.sin(age / 90) * 0.05, 1 - Math.sin(age / 90) * 0.05);
        drawBubble(ctx, { ...q, x: 0, y: 0 }, b.color, 1); ctx.restore();
      }
    },
  });
}

export default {
  place(v, move) {
    const pts = contour(v, move.placed); if (pts.length < 3) return;
    const path = pathSampler(pts, true); const c = v.centerOf(move.placed); const s = c.s;
    v.add({
      life: 780,
      draw(ctx, it, p, vv, age) {
        // A fizzy meniscus: a thin rippling line hugging the piece, rising and settling.
        const a = envelope(p, 0, 0.15, 0.5, 1);
        ctx.globalAlpha = a * 0.9; ctx.strokeStyle = CREAM; ctx.lineWidth = 2; ctx.lineJoin = 'round';
        ctx.beginPath();
        for (let i = 0; i <= 60; i++) { const q = path.at(i / 60); const dx = q.x - c.x; const dy = q.y - c.y; const l = Math.hypot(dx, dy) || 1; const off = 2 + Math.sin(i * 1.3 + age / 40) * 1.6; const x = q.x + (dx / l) * off; const y = q.y + (dy / l) * off; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
        ctx.closePath(); ctx.stroke();
      },
    });
    // Tiny bubbles escape from the top edge.
    const top = Math.min(...pts.map((q) => q.y));
    const tops = pts.filter((q) => q.y < top + 1);
    const x0 = Math.min(...tops.map((q) => q.x)); const x1 = Math.max(...tops.map((q) => q.x));
    v.burst((x0 + x1) / 2, top, { n: 9, sprite: 'bubble', colors: ['#ffffff', '#5ccfb0', '#ffd27a'], speed: [10, 40], angle: -Math.PI / 2, spread: 0.5, life: [0.6, 0.9], size: [s * 0.14, s * 0.26], shrink: false, g: -260, wob: 30, jitter: (x1 - x0) / 2, drag: 0.98 });
  },

  clear(v, move, theme) {
    const lines = linesOf(v, move, theme);
    lines.forEach((line, n) => lineFizz(v, line, n * 90));
    const h = lines.find((l) => l.axis === 'h'); const w = lines.find((l) => l.axis === 'v');
    if (lines.length >= 2) {
      // Where liquid bands meet, the carbonation pools into one larger bubble that rises slowly.
      const x = w ? w.cx : lines[0].cx; const y = h ? h.cy : lines[0].cy;
      const b = { x, y, r: lines[0].s * 0.42, t0: 0.3, hold: 0.35, v0: 15, wa: 6, wf: 6, ph: 0, pop: 1.0, color: lines[0].cells[3].color };
      v.add({ life: 2400, draw(ctx, it, p, vv, age) { const q = bubbleAt(b, age / 1000); if (!q) return; if (q.popped) { if (q.pt < 0.3) drawPop(ctx, { ...q, r: q.r * 1.3 }, b.color, 1); } else drawBubble(ctx, q, b.color, Math.min(1, (age / 1000 - b.t0) * 4)); } });
    }
  },

  streak(v, move, theme) { foamWave(v, theme, 2300 + Math.min(move.combo, 6) * 60); },

  milestone(v, info, theme) { bigBubble(v, theme); },

  boardClear(v, move, theme) {
    const per = perimeter(v, -0.1); const s = v.cell(0).s;
    // The whole board fills with soda from the bottom, fizzes, then the foam rolls away.
    const fizz = makeBubbles(v, Math.round(46 * v.level), { x: per.x0, y: per.y0, w: per.w, h: per.h }, () => theme.palette[Math.floor(v.r(0, 5))], 0.35, 0.3);
    v.add({
      life: 2600,
      draw(ctx, it, p, vv, age) {
        const t = age / 1000;
        const fill = easeOut(seg(p, 0, 0.3)); const drain = easeIn(seg(p, 0.35, 0.6));
        const level = per.y1 - per.h * fill * (1 - drain);
        if (fill > 0 && drain < 1) {
          ctx.globalAlpha = 0.4; ctx.fillStyle = theme.palette[1];
          ctx.beginPath(); ctx.moveTo(per.x0, per.y1);
          for (let i = 0; i <= 24; i++) ctx.lineTo(per.x0 + (per.w * i) / 24, level + Math.sin(i * 0.8 + t * 6) * s * 0.12);
          ctx.lineTo(per.x1, per.y1); ctx.closePath(); ctx.fill();
          ctx.globalAlpha = 0.9; ctx.strokeStyle = CREAM; ctx.lineWidth = 3; ctx.stroke();
        }
        for (const b of fizz) { const q = bubbleAt(b, t); if (!q) continue; if (q.popped) { if (q.pt < 0.25) drawPop(ctx, q, b.color, 1 - seg(p, 0.9, 1)); } else drawBubble(ctx, q, b.color, 1 - seg(p, 0.9, 1)); }
      },
    });
    v.later(() => foamWave(v, theme, 2200), 900);
  },

  // Idle: bubbles drift up beside the glass and sometimes merge (CSS), plus an occasional pair drawn here.
  idle(v) {
    const loop = () => { this.idleBeat(v); v.later(loop, v.r(5000, 9000)); };
    v.later(loop, 2500);
    return null;
  },
  idleBeat(v) {
    // Two bubbles rising beside the board drift together and merge into one.
    const per = perimeter(v, -0.25); const side = v.r(0, 1) < 0.5 ? per.x0 : per.x1;
    v.add({
      back: true, life: 3200,
      draw(ctx, it, p) {
        const y = per.y1 - per.h * easeIn(p) * 1.1;
        const join = easeInOut(seg(p, 0.2, 0.55));
        const gap = 16 * (1 - join);
        const a = 1 - seg(p, 0.85, 1);
        if (join < 1) { drawBubble(ctx, { x: side - gap, y, r: 6 }, '#5ccfb0', a); drawBubble(ctx, { x: side + gap, y: y + 6, r: 4.5 }, '#e8394d', a); }
        else drawBubble(ctx, { x: side, y, r: 7.5 * (1 + Math.sin(p * 40) * 0.04 * (1 - seg(p, 0.55, 0.8))) }, '#ffd27a', a);
      },
    });
  },
};
