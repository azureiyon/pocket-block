// Classic Pastel — Light suite (Studio). Approved: single = Luminous Sweep (A),
// multi-line = Resonance (C). The rest extend the same abstract-light
// language, each with its own choreography rather than more particles:
//   place   a crisp coloured rim flashes outward from the placed piece
//   idle    a specular glint slides across one block now and then
//   streak  the sweep, then a band of light runs once around the board frame
//   board   the sweep, then light washes over every cell in rings from the
//           centre while two lights circle the frame and meet with a flare
// Milestones are opt-in (not designed unless asked).

import { TAU, mix, seg, env, lerp, rng, premium, expoOut, quadIn, vivid, glowSprite, spark, glint, drawSprite, roundRectPath, enamelBlock } from '../art/light-kit.js';
import sweep, * as S1 from './pastel-l1-sweep.js';
import reso, * as S3 from './pastel-l3-resonance.js';

const defaults = (params) => Object.fromEntries(params.map((p) => [p.key, p.def]));
const P1 = (P) => ({ ...defaults(S1.params), speed: P.speed });
const P3 = (P) => ({ ...defaults(S3.params), speed: P.speed, cascade: 0 });

export const params = [
  { key: 'speed', label: 'Overall pace', min: 0.6, max: 1.5, step: 0.05, def: 1 },
  { key: 'combo', label: 'Streak level (streak only)', min: 2, max: 8, step: 1, def: 4 },
  { key: 'frame', label: 'Frame light brightness', min: 0.3, max: 1.2, step: 0.05, def: 0.85 },
  { key: 'rim', label: 'Placement rim', min: 0, max: 1, step: 0.05, def: 0.8 },
];
export const presets = { Default: {} };

// ---------- helpers ----------
/** Rounded-rectangle loop around the board, sampled by fraction (0 = top centre, clockwise). */
function framePath(B, s) {
  const pad = s * 0.28; const x0 = B.x0 - pad; const y0 = B.y0 - pad; const x1 = B.x1 + pad; const y1 = B.y1 + pad; const r = s * 0.6;
  const pts = []; const cx = (x0 + x1) / 2;
  const arc = (ax, ay, a0) => { for (let i = 0; i <= 6; i++) { const a = a0 + (i / 6) * (Math.PI / 2); pts.push([ax + Math.cos(a) * r, ay + Math.sin(a) * r]); } };
  pts.push([cx, y0]); arc(x1 - r, y0 + r, -Math.PI / 2); arc(x1 - r, y1 - r, 0); arc(x0 + r, y1 - r, Math.PI / 2); arc(x0 + r, y0 + r, Math.PI); pts.push([cx, y0]);
  const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = cum[cum.length - 1];
  return (u) => { let d = (((u % 1) + 1) % 1) * total; let i = 1; while (i < cum.length - 1 && cum[i] < d) i++; const k = (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1); const a = pts[i - 1]; const b = pts[i]; return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k }; };
}

/** A band of coloured light travelling the frame: head at `head`, length `len` (fractions). */
function frameLight(ctx, at, head, len, colors, s, alpha, dir = 1) {
  const N = 26;
  for (let i = 0; i < N; i++) {
    const u0 = head - dir * len * (1 - i / N); const u1 = head - dir * len * (1 - (i + 1) / N);
    const a = at(u0); const b = at(u1); const w = (i + 1) / N;
    const col = colors[Math.floor(w * (colors.length - 1))];
    ctx.lineCap = 'round';
    ctx.globalAlpha = alpha * w; ctx.strokeStyle = col; ctx.lineWidth = s * 0.12 * w + 1;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    if (w > 0.6) { ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1; ctx.globalAlpha = alpha * w * 0.9; ctx.stroke(); }
  }
  const h = at(head);
  drawSprite(ctx, glowSprite(colors[colors.length - 1], 0.3), h.x, h.y, s * 1.3, { alpha: alpha * 0.55 });
}

const lineColors = (line) => line.cells.map((c) => vivid(c.color));

// ---------- events ----------
const EV = {};

EV.single = { duration: (P) => sweep.duration(P1(P)), keyframes: (P) => sweep.keyframes(P1(P)), prepare: (sc, P) => sweep.prepare(sc, P1(P)), render: (ctx, t, st, sc, P) => sweep.render(ctx, t, st, sc, P1(P)) };

// Multi-line: Resonance on each line together, a bright release where they cross, and one shared grid answer.
EV.multi = {
  duration: (P) => reso.duration({ ...P3(P), cascade: 3 }) + 60,
  keyframes: (P) => reso.keyframes({ ...P3(P), cascade: 3 }).map((k) => ({ ...k, note: k.label === 'Release' ? 'Both lines release together; the crossing flares.' : k.note })),
  prepare(scene, P) {
    const per = scene.lines.map((l) => ({ line: l, st: reso.prepare({ ...scene, lines: [l] }, { ...P3(P), sparks: 1 }) }));
    const row = scene.lines.find((l) => l.axis === 'h'); const col = scene.lines.find((l) => l.axis === 'v');
    const cross = row && col ? scene.cell(row.idx * 8 + col.idx) : null;
    const near = [];
    for (let i = 0; i < 64; i++) {
      const rr = Math.floor(i / 8); const cc = i % 8;
      const d = Math.min(...scene.lines.map((l) => (l.axis === 'h' ? Math.abs(rr - l.idx) : Math.abs(cc - l.idx))));
      if (d >= 1 && d <= 2 && !scene.fx.after[i]) near.push({ i, d, ...scene.cell(i), towards: scene.lines.reduce((best, l) => { const dd = l.axis === 'h' ? Math.abs(rr - l.idx) : Math.abs(cc - l.idx); return dd === d ? l : best; }, null) });
    }
    return { per, cross, near, T: S3.params && null };
  },
  render(ctx, t, st, scene, P) {
    const PP = P3(P); const releaseAt = (PP.inhale + 90) * P.speed; const step = PP.cascadeStep * P.speed;
    for (const n of st.near) {
      const at = releaseAt + n.d * step; const a = env(t, at, at + 60 * P.speed, at + 90 * P.speed, at + 360 * P.speed) * (1 - (n.d - 1) / 4);
      if (a <= 0.01) continue;
      const l = n.towards; const tone = vivid(l.cells[3].color);
      ctx.save(); ctx.translate(n.x, n.y); roundRectPath(ctx, n.s, n.s, n.s * 0.22);
      // Multi-line keeps the grid answer to a soft coloured lift: the two lines carry the detail.
      ctx.globalAlpha = a * 0.14; ctx.fillStyle = tone; ctx.fill();
      ctx.restore();
    }
    for (const p of st.per) reso.render(ctx, t, p.st, { ...scene, lines: [p.line] }, { ...PP, sparks: 1 });
    if (st.cross) {
      const u = seg(t, releaseAt, releaseAt + 260 * P.speed);
      if (u > 0 && u < 1) {
        const c = st.cross; const col = vivid(st.per[0].line.cells[3].color);
        drawSprite(ctx, glowSprite(col, 0.25), c.x, c.y, c.s * (1 + 2 * expoOut(u)), { alpha: (1 - u) * 0.6 });
        glint(ctx, c.x, c.y, c.s * 0.9 * (1 - u * 0.6), '#ffffff', 1 - u);
        for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU + Math.PI / 8; const d = c.s * (0.3 + 1.2 * expoOut(u)); spark(ctx, c.x + Math.cos(a) * d, c.y + Math.sin(a) * d, Math.cos(a), Math.sin(a), c.s * 0.35 * (1 - u), 1.4, col, 1 - u); }
      }
    }
  },
};

// Placement: a crisp coloured rim flashes outward from each placed block, the piece's top-left glints.
EV.place = {
  duration: (P) => 360 * P.speed,
  keyframes: (P) => [[40, 'Contact', 'The piece lands; a coloured rim appears at its edge.'], [130, 'Rim', 'The rim lifts outward and thins.'], [240, 'Settle', 'It fades; a small glint at the piece corner.']].map(([t, label, note]) => ({ t: t * P.speed, label, note })),
  prepare(scene) { const pal = scene.theme.palette; return { cells: scene.fx.placed.map((i) => ({ ...scene.cell(i), col: vivid(pal[(scene.fx.after[i] - 1) % pal.length]) })) }; },
  render(ctx, t, st, scene, P) {
    const u = seg(t, 0, 300 * P.speed); const e = expoOut(u);
    for (const c of st.cells) {
      const sz = c.s * (1 + 0.22 * e);
      ctx.save(); ctx.translate(c.x, c.y); roundRectPath(ctx, sz, sz, sz * 0.22);
      ctx.globalAlpha = (1 - u) * P.rim; ctx.strokeStyle = c.col; ctx.lineWidth = 2.4 * (1 - u) + 0.5; ctx.stroke();
      ctx.restore();
    }
    const tl = st.cells.reduce((a, c) => (c.y < a.y - 1 || (Math.abs(c.y - a.y) < 1 && c.x < a.x) ? c : a), st.cells[0]);
    const g = env(t, 60 * P.speed, 120 * P.speed, 150 * P.speed, 330 * P.speed);
    if (g > 0) glint(ctx, tl.x - tl.s * 0.36, tl.y - tl.s * 0.36, tl.s * 0.32 * g, '#ffffff', g);
  },
};

// Idle: now and then a specular glint slides across one block's face.
EV.idle = {
  duration: (P) => 760 * P.speed,
  keyframes: (P) => [[150, 'Glint enters', 'A narrow highlight starts across one block.'], [380, 'Crossing', 'It slides diagonally over the enamel.'], [620, 'Twinkle', 'A tiny glint as it leaves.']].map(([t, label, note]) => ({ t: t * P.speed, label, note })),
  prepare(scene) {
    const filled = []; for (let i = 0; i < 64; i++) if (scene.fx.after[i]) filled.push(i);
    const i = filled[Math.floor(filled.length * 0.6)] ?? 27; const pal = scene.theme.palette;
    return { c: { ...scene.cell(i), col: vivid(pal[((scene.fx.after[i] || 1) - 1) % pal.length]) } };
  },
  render(ctx, t, st, scene, P) {
    const c = st.c; const u = premium(seg(t, 80 * P.speed, 560 * P.speed));
    if (u > 0 && u < 1) {
      ctx.save(); ctx.translate(c.x, c.y); roundRectPath(ctx, c.s, c.s, c.s * 0.22); ctx.clip();
      const x = lerp(-c.s * 1.1, c.s * 1.1, u); ctx.transform(1, 0, -0.6, 1, 0, 0);
      const g = ctx.createLinearGradient(x - c.s * 0.2, 0, x + c.s * 0.2, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,.7)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(x - c.s * 0.2, -c.s, c.s * 0.4, c.s * 2);
      ctx.restore();
    }
    const g = env(t, 520 * P.speed, 580 * P.speed, 600 * P.speed, 740 * P.speed);
    if (g > 0) glint(ctx, c.x + c.s * 0.38, c.y + c.s * 0.3, c.s * 0.28 * g, '#ffffff', g);
  },
};

// Streak: the approved sweep, then a band of light runs once around the board frame.
EV.streak = {
  duration: (P) => sweep.duration(P1(P)) * 0.55 + (700 + 40 * P.combo) * P.speed + 200,
  keyframes: (P) => { const s0 = sweep.duration(P1(P)) * 0.55; const L = (700 + 40 * P.combo) * P.speed; return [[s0 * 0.6, 'Sweep', 'The same sweep as a single clear.'], [s0 + L * 0.15, 'Into the frame', 'The light leaves the line and enters the board frame.'], [s0 + L * 0.5, 'Circuit', 'A coloured band races once around the board.'], [s0 + L * 0.85, 'Return', 'It closes the loop and flares.'], [s0 + L + 120, 'Settle', 'The frame is quiet again.']].map(([t, label, note]) => ({ t, label, note })); },
  prepare(scene, P) { const st = sweep.prepare(scene, P1(P)); return { st, at: framePath(scene.bounds, scene.lines[0].s), cols: lineColors(scene.lines[0]), s: scene.lines[0].s }; },
  render(ctx, t, st, scene, P) {
    sweep.render(ctx, t, st.st, scene, P1(P));
    const t0 = sweep.duration(P1(P)) * 0.55; const L = (700 + 40 * P.combo) * P.speed; const u = seg(t, t0, t0 + L);
    if (u <= 0) return;
    const head = 0.08 + premium(u) * 1.0; const len = 0.12 + 0.03 * Math.min(P.combo, 8);
    const a = P.frame * (1 - seg(u, 0.9, 1));
    frameLight(ctx, st.at, head, len * Math.min(1, u * 4), st.cols, st.s, a);
    const fl = seg(t, t0 + L * 0.95, t0 + L + 200); if (fl > 0 && fl < 1) { const h = st.at(0.08); glint(ctx, h.x, h.y, st.s * 0.7 * (1 - fl), '#ffffff', 1 - fl); }
  },
};

// Board clear: the sweep, light washes over every cell in rings from the centre, two frame lights meet and flare.
EV.board = {
  duration: (P) => sweep.duration(P1(P)) * 0.5 + 1250 * P.speed,
  keyframes: (P) => { const s0 = sweep.duration(P1(P)) * 0.5; return [[s0 * 0.7, 'Last sweep', 'The final line sweeps clear.'], [s0 + 150 * P.speed, 'Wash', 'Light washes over the empty board, ring by ring from the centre.'], [s0 + 420 * P.speed, 'Frame', 'Two lights race round the frame in opposite directions.'], [s0 + 820 * P.speed, 'Meet', 'They meet at the top and flare.'], [s0 + 1150 * P.speed, 'Settle', 'A clean, quiet board.']].map(([t, label, note]) => ({ t, label, note })); },
  prepare(scene, P) {
    const st = sweep.prepare(scene, P1(P)); const cells = [];
    for (let i = 0; i < 64; i++) { const r = Math.floor(i / 8); const c = i % 8; cells.push({ ...scene.cell(i), ring: Math.max(Math.abs(r - 3.5), Math.abs(c - 3.5)) - 0.5, col: vivid(scene.theme.palette[(r + c) % 7]) }); }
    return { st, cells, at: framePath(scene.bounds, scene.lines[0].s), cols: lineColors(scene.lines[0]), s: scene.lines[0].s };
  },
  render(ctx, t, st, scene, P) {
    sweep.render(ctx, t, st.st, scene, P1(P));
    const t0 = sweep.duration(P1(P)) * 0.5; const k = P.speed;
    for (const c of st.cells) {
      const at = t0 + c.ring * 80 * k; const a = env(t, at, at + 50 * k, at + 70 * k, at + 260 * k); if (a <= 0.01) continue;
      ctx.save(); ctx.translate(c.x, c.y); roundRectPath(ctx, c.s * 0.94, c.s * 0.94, c.s * 0.2);
      ctx.globalAlpha = a * 0.16; ctx.fillStyle = c.col; ctx.fill();
      ctx.globalAlpha = a * 0.85; ctx.lineWidth = 1.4; ctx.strokeStyle = c.col; ctx.stroke(); ctx.restore();
    }
    const u = seg(t, t0 + 250 * k, t0 + 850 * k);
    if (u > 0 && u < 1) {
      const e = premium(u); const a = P.frame * (1 - seg(u, 0.85, 1));
      frameLight(ctx, st.at, 0.5 + e * 0.5, 0.2, st.cols, st.s, a, 1);
      frameLight(ctx, st.at, 0.5 - e * 0.5, 0.2, st.cols.slice().reverse(), st.s, a, -1);
    }
    const fl = seg(t, t0 + 800 * k, t0 + 1100 * k);
    if (fl > 0 && fl < 1) { const h = st.at(0); drawSprite(ctx, glowSprite(st.cols[3], 0.25), h.x, h.y, st.s * (1.5 + 3 * expoOut(fl)), { alpha: (1 - fl) * 0.6 }); glint(ctx, h.x, h.y, st.s * 1.1 * (1 - fl * 0.5), '#ffffff', 1 - fl); }
  },
};

const pick = (ev) => EV[ev] || EV.single;
export default {
  id: 'pastel-light', label: 'Light suite (A single · C multi)', kind: 'concept', supports: ['single', 'multi', 'place', 'idle', 'streak', 'board'], params, presets,
  duration: (P, ev) => pick(ev).duration(P), keyframes: (P, ev) => pick(ev).keyframes(P), prepare: (sc, P, ev) => pick(ev).prepare(sc, P), render: (ctx, t, st, sc, P, ev) => pick(ev).render(ctx, t, st, sc, P),
};
