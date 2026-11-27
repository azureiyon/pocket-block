// Strawberry Patisserie — decorated confectionery. Frosting is genuinely
// piped: a nozzle travels an animated path leaving a three-layer stroke
// (shadow, body, gloss) in scallops and rosettes. Cakes crumble into layered
// fragments, crumbs and powdered sugar; sugar crystals catch the light.

import { TAU, seg, easeOut, easeIn, easeInOut, envelope, mix, rgba, star4, linesOf, contour, paintBlock, perimeter, pathSampler } from '../vfx-kit.js';

const ICING = '#fff3f6';
const PINK = '#ff9fb4';
const SPONGE = '#fbe8c8';
const CREAMY = '#fff6ee';

/** Stroke a piped frosting rope through points: soft shadow, body, glossy highlight. */
function pipe(ctx, pts, w, alpha, tint = PINK) {
  if (pts.length < 2) return;
  const path = () => { ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y); };
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.save(); ctx.translate(0, w * 0.16); ctx.globalAlpha = alpha * 0.35; ctx.strokeStyle = mix(tint, '#8a3b4f', 0.45); ctx.lineWidth = w * 1.05; path(); ctx.stroke(); ctx.restore();
  ctx.globalAlpha = alpha; ctx.strokeStyle = mix(ICING, tint, 0.55); ctx.lineWidth = w; path(); ctx.stroke();
  ctx.strokeStyle = ICING; ctx.lineWidth = w * 0.55; path(); ctx.stroke();
  ctx.save(); ctx.translate(-w * 0.12, -w * 0.16); ctx.globalAlpha = alpha * 0.9; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = w * 0.18; path(); ctx.stroke(); ctx.restore();
}

/** The piping bag's star nozzle at the head of the rope. */
function nozzle(ctx, x, y, s, alpha) {
  ctx.save(); ctx.translate(x, y - s * 0.55); ctx.globalAlpha = alpha;
  ctx.fillStyle = '#e9e2e4'; ctx.strokeStyle = '#b9a9ae'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-s * 0.22, -s * 0.42); ctx.lineTo(s * 0.22, -s * 0.42); ctx.lineTo(s * 0.08, 0); ctx.lineTo(-s * 0.08, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.globalAlpha = alpha * 0.8; ctx.fillRect(-s * 0.14, -s * 0.38, s * 0.05, s * 0.3);
  ctx.restore();
}

/** Scalloped piping path along a line: a looping prolate cycloid, sampled up to `head`. */
function scallopPts(line, head, droop) {
  const s = line.s; const loops = 7; const N = Math.max(2, Math.round(140 * head));
  const R = (line.len + s * 0.6) / (TAU * loops); const k = 1.9;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const th = (i / 140) * TAU * loops;
    const along = R * (th - k * Math.sin(th)) - s * 0.3;
    const across = -R * (1 - k * Math.cos(th)) * 0.62 + R * 0.9 + droop * (1 + Math.sin(th * 0.5)) * 0.5;
    if (line.axis === 'h') pts.push({ x: line.a.x + along, y: line.cy + across });
    else pts.push({ x: line.cx + across, y: line.a.y + along });
  }
  return pts;
}

/** Rosette: a spiral piped from the centre outwards with a star-tip ripple. */
function rosettePts(x, y, r, head) {
  const N = Math.max(2, Math.round(80 * head)); const pts = [];
  for (let i = 0; i <= N; i++) { const t = i / 80; const th = t * TAU * 2.6; const rr = r * (0.15 + 0.85 * t) * (1 + 0.12 * Math.sin(th * 4)); pts.push({ x: x + Math.cos(th) * rr, y: y + Math.sin(th) * rr }); }
  return pts;
}

function strawberry(ctx, x, y, r, alpha, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = alpha;
  ctx.beginPath(); ctx.moveTo(0, r * 1.1); ctx.bezierCurveTo(-r * 1.2, r * 0.3, -r * 0.9, -r * 0.8, 0, -r * 0.6); ctx.bezierCurveTo(r * 0.9, -r * 0.8, r * 1.2, r * 0.3, 0, r * 1.1);
  const g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, '#ff6b81'); g.addColorStop(1, '#d93a55');
  ctx.fillStyle = g; ctx.fill();
  ctx.fillStyle = '#ffe9a8';
  for (const [sx, sy] of [[-0.35, -0.1], [0.3, -0.15], [0, 0.2], [-0.25, 0.45], [0.25, 0.42], [0.05, -0.35]]) { ctx.beginPath(); ctx.ellipse(sx * r, sy * r, r * 0.06, r * 0.09, 0, 0, TAU); ctx.fill(); }
  ctx.fillStyle = '#7cc07a';
  ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + ((i - 4.5) / 10) * 2.4; const rr = i % 2 ? r * 0.25 : r * 0.55; ctx.lineTo(Math.cos(a) * rr * 1.1, -r * 0.62 + Math.sin(a) * rr * 0.5); } ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.ellipse(-r * 0.35, -r * 0.2, r * 0.12, r * 0.22, -0.4, 0, TAU); ctx.fill();
  ctx.restore();
}

/** A layered cake fragment (sponge, cream, berry) falling and tumbling. */
function crumbs(v, line, t0) {
  const s = line.s; const out = [];
  for (const c of line.cells) {
    for (let k = 0; k < 4; k++) {
      out.push({ kind: 'frag', x: c.x + (k % 2 ? 1 : -1) * s * 0.22, y: c.y + (k < 2 ? -1 : 1) * s * 0.22, vx: v.r(-60, 60), vy: v.r(-160, -40), rot: v.r(-0.4, 0.4), vr: v.r(-6, 6), w: s * v.r(0.36, 0.5), h: s * v.r(0.32, 0.46), color: c.color, t0: t0 + v.r(0, 0.08) });
    }
    for (let k = 0; k < 3; k++) out.push({ kind: 'crumb', x: c.x + v.r(-s * 0.4, s * 0.4), y: c.y + v.r(-s * 0.3, s * 0.3), vx: v.r(-90, 90), vy: v.r(-200, -60), r: v.r(1.4, 2.8), color: k ? SPONGE : c.color, t0 });
    out.push({ kind: 'sugar', x: c.x + v.r(-s * 0.4, s * 0.4), y: c.y, vx: v.r(-20, 20), vy: v.r(-40, -10), r: v.r(1, 1.8), color: '#ffffff', t0: t0 + 0.05 });
  }
  return out;
}

function drawCrumbs(ctx, list, t, alpha) {
  for (const q of list) {
    const tt = t - q.t0; if (tt < 0) continue;
    const g = q.kind === 'sugar' ? 60 : 900;
    const x = q.x + q.vx * tt; const y = q.y + q.vy * tt + 0.5 * g * tt * tt;
    ctx.globalAlpha = alpha * (q.kind === 'sugar' ? 0.9 : 1);
    if (q.kind === 'frag') {
      ctx.save(); ctx.translate(x, y); ctx.rotate(q.rot + q.vr * tt);
      // Sponge / cream / berry layers, like a slice seen from the side.
      ctx.fillStyle = SPONGE; ctx.fillRect(-q.w / 2, -q.h / 2, q.w, q.h);
      ctx.fillStyle = CREAMY; ctx.fillRect(-q.w / 2, -q.h * 0.12, q.w, q.h * 0.22);
      ctx.fillStyle = q.color; ctx.fillRect(-q.w / 2, -q.h / 2, q.w, q.h * 0.2);
      ctx.restore();
    } else { ctx.fillStyle = q.color; ctx.beginPath(); ctx.arc(x, y, q.r, 0, TAU); ctx.fill(); }
  }
}

function pipeLine(v, line, delay) {
  const s = line.s; const pieces = crumbs(v, line, 0.82);
  const glints = Array.from({ length: 5 }, (_, k) => ({ u: (k + v.r(0.2, 0.8)) / 5, at: v.r(0.7, 0.86), dy: v.r(-s * 0.4, s * 0.5) }));
  v.add({
    life: 2100, delay,
    draw(ctx, it, p, vv, age) {
      const t = age / 1000;
      const head = easeInOut(seg(p, 0, 0.36));
      const crumble = seg(p, 0.38, 0.42);
      const sag = easeIn(seg(p, 0.42, 0.85));
      // Cake blocks stay until the frosting is complete, settle a touch, then give way.
      const settle = envelope(p, 0.34, 0.37, 0.38, 0.4) * 0.06;
      for (const c of line.cells) paintBlock(ctx, 'cake', c.x, c.y, s, c.color, { sx: 1 + settle, sy: 1 - settle, alpha: 1 - crumble });
      if (p > 0.38) drawCrumbs(ctx, pieces, t - 0.38 * 2.1, 1 - seg(p, 0.75, 0.92));
      const pts = scallopPts(line, head, sag * s * 0.5);
      const fade = 1 - seg(p, 0.6, 0.88);
      pipe(ctx, pts, s * 0.3 * (1 - sag * 0.35), fade);
      if (head < 1 && pts.length) { const q = pts[pts.length - 1]; nozzle(ctx, q.x, q.y, s, 1 - seg(p, 0.33, 0.37)); }
      // Sugar crystals glinting as they settle.
      for (const gl of glints) {
        const a = envelope(p, gl.at, gl.at + 0.04, gl.at + 0.06, gl.at + 0.13);
        if (a <= 0) continue;
        const x = line.axis === 'h' ? line.a.x + gl.u * line.len : line.cx + gl.dy; const y = line.axis === 'h' ? line.cy + gl.dy : line.a.y + gl.u * line.len;
        star4(ctx, x, y + seg(p, gl.at, gl.at + 0.13) * s * 0.3, s * 0.22 * a, '#ffffff', a);
      }
    },
  });
}

function rosette(v, x, y, r, delay, berry, life = 2000) {
  v.add({
    life, delay,
    draw(ctx, it, p) {
      const head = easeOut(seg(p, 0, 0.32)); const fade = 1 - seg(p, 0.72, 1);
      pipe(ctx, rosettePts(x, y, r, head), r * 0.38, fade);
      if (berry) {
        const pop = seg(p, 0.34, 0.48); const sc = pop < 1 ? 1.35 * Math.sin(pop * Math.PI * 0.75) : 1;
        if (pop > 0) strawberry(ctx, x, y - r * 0.15, r * 0.55 * sc, fade, 0.15);
      }
    },
  });
}

/** Piped scallop border travelling around the board, with rosettes and strawberries at the corners. */
function border(v, life = 2600, corners = true) {
  const per = perimeter(v, -0.36); const s = v.cell(0).s;
  v.add({
    life,
    draw(ctx, it, p, vv, age) {
      const head = easeInOut(seg(p, 0, 0.5)); const fade = 1 - seg(p, 0.7, 0.95);
      const N = Math.round(220 * head); const pts = [];
      for (let i = 0; i <= N; i++) {
        const u = 0.125 + i / 220; const q = per.at(u); const th = (i / 220) * TAU * 34;
        const off = Math.sin(th) * s * 0.16; pts.push({ x: q.x - q.dy * off, y: q.y + q.dx * off });
      }
      pipe(ctx, pts, s * 0.26, fade);
      if (head < 1 && pts.length) { const q = pts[pts.length - 1]; nozzle(ctx, q.x, q.y, s, 1); }
    },
  });
  if (corners) [[per.x0, per.y0], [per.x1, per.y0], [per.x1, per.y1], [per.x0, per.y1]].forEach(([x, y], k) => rosette(v, x, y, s * 0.7, 300 + k * 330, true, life - 200));
}

export default {
  place(v, move) {
    // A soft settle (CSS) and a tiny puff of powdered sugar from the base.
    const pts = contour(v, move.placed); if (!pts.length) return;
    const c = v.centerOf(move.placed);
    const bottom = Math.max(...pts.map((q) => q.y));
    v.burst(c.x, bottom, { n: 12, sprite: 'puff', colors: ['#ffffff', '#fff6ee'], speed: [30, 90], angle: -Math.PI / 2, spread: 1.4, life: [0.6, 1], size: [c.s * 0.16, c.s * 0.3], grow: 1.8, g: 50, drag: 0.92, jitter: c.s * 0.6, alpha: 0.85 });
  },

  clear(v, move, theme) {
    const lines = linesOf(v, move, theme);
    lines.forEach((line, n) => pipeLine(v, line, n * 170));
    const h = lines.filter((l) => l.axis === 'h'); const w = lines.filter((l) => l.axis === 'v');
    // Rosettes are piped where lines cross, or between parallel lines.
    if (h.length && w.length) for (const a of h) for (const b of w) rosette(v, b.cx, a.cy, a.s * 0.62, 420, true);
    else if (lines.length >= 2) rosette(v, lines.reduce((x, l) => x + l.cx, 0) / lines.length, lines.reduce((y, l) => y + l.cy, 0) / lines.length, lines[0].s * 0.7, 420, true);
  },

  streak(v, move) { border(v, 2400 + Math.min(move.combo, 6) * 80, move.combo >= 3); },

  milestone(v) {
    const per = perimeter(v, -0.36); const s = v.cell(0).s;
    // Above the board, never over the top row.
    const y = per.y0 - s * 0.85;
    rosette(v, per.cx, y, s * 0.8, 0, true, 2400);
    rosette(v, per.cx - s * 1.5, y + s * 0.15, s * 0.5, 260, false, 2200);
    rosette(v, per.cx + s * 1.5, y + s * 0.15, s * 0.5, 380, false, 2200);
  },

  boardClear(v) {
    border(v, 3000, true);
    const b = v.boardCenter();
    // A gentle fall of powdered sugar over the whole board.
    v.burst(b.x, b.y - b.size * 0.5, { n: 60, exact: false, sprite: 'puff', colors: ['#ffffff'], speed: [5, 30], angle: Math.PI / 2, spread: 0.6, life: [1.6, 2.4], size: [b.s * 0.1, b.s * 0.2], g: 40, wob: 30, jitter: b.size * 0.5, stagger: 600, delay: 400, alpha: 0.9 });
  },

  // Idle: sugar motes and gloss on the ribbons (CSS); a sugar crystal catches the light now and then.
  idle(v) {
    const loop = () => { this.idleBeat(v); v.later(loop, v.r(4000, 8000)); };
    v.later(loop, 2000);
    return null;
  },
  idleBeat(v) {
    const per = perimeter(v, -0.38);
    const q = per.at(v.r(0, 1));
    v.add({ life: 900, draw(ctx, it, p) { const a = envelope(p, 0, 0.3, 0.4, 1); star4(ctx, q.x, q.y, 7 * a, '#ffffff', a); } });
  },
};
