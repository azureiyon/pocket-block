// Cloud Palace — Pearl of Dawn suite (shipped). Approved single clear: Pearl
// of Dawn. The other events speak the same language (inner light, gold
// contour glints, compact points of light, thin gold halo rings), each with
// its own choreography rather than more particles:
//   place   the placed pearls' gold rims light in quick succession, one glint
//   idle    a single gold glint makes one lap of one pearl's contour
//   multi   both lines dissolve in a wave from the crossing; each pearl's gold
//           contour ripples outward as it melts, so ripples travel along the cross
//   streak  the points of light gather to the line's centre into one pearl of
//           light, which releases a thin gold halo ring (two for big streaks)
//   board   the last line dissolves, two glints race round the gilt board
//           frame and meet; the frame glows and light washes inward over the
//           empty cells' contours, edge to middle
// Milestones are opt-in (not designed unless asked).

import dawn, * as B from './dawn.js';
import { TAU, mix, seg, env, lerp, premium, expoOut, glint, drawSprite, roundRectPath, contourPoint, lightSprite, easeOutCubic, CHAMPAGNE, WARM_WHITE, GOLD, LAVENDER } from './cloud-art.js';

const defaults = (params) => Object.fromEntries(params.map((p) => [p.key, p.def]));
const PB = (P) => ({ ...defaults(B.params), speed: P.speed });

export const params = [
  { key: 'speed', label: 'Overall pace', min: 0.6, max: 1.5, step: 0.05, def: 1.12 },
  { key: 'combo', label: 'Streak level (streak only)', min: 2, max: 8, step: 1, def: 4 },
  { key: 'halo', label: 'Halo ring brightness', min: 0.3, max: 1.2, step: 0.05, def: 0.85 },
  { key: 'rim', label: 'Placement rim light', min: 0, max: 1, step: 0.05, def: 0.85 },
];
export const presets = { Default: {} };

// ---------- shared pieces ----------
/** Thin gold halo ring: crisp line with a faint inner warm band, never a filled disc. */
function haloRing(ctx, x, y, r, alpha, width = 1.6) {
  if (alpha <= 0.01 || r <= 0.5) return;
  ctx.globalAlpha = alpha * 0.35; ctx.strokeStyle = CHAMPAGNE; ctx.lineWidth = width * 3.2;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
  ctx.globalAlpha = alpha; ctx.strokeStyle = GOLD; ctx.lineWidth = width;
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke();
}

/** A glint riding a rounded-square contour (side w, corner r, centred at x, y), with a short trail of gold dust. */
function contourGlint(ctx, x, y, w, r, u, dir, s, alpha, trail = 6, step = 0.018) {
  if (alpha <= 0.01) return;
  for (let j = trail; j >= 1; j--) {
    const p = contourPoint(w, r, u - dir * j * step);
    ctx.globalAlpha = alpha * (1 - j / (trail + 1)) * 0.8; ctx.fillStyle = GOLD;
    ctx.beginPath(); ctx.arc(x + p.x, y + p.y, 1.1, 0, TAU); ctx.fill();
  }
  const p = contourPoint(w, r, u);
  glint(ctx, x + p.x, y + p.y, s * 0.2, WARM_WHITE, alpha);
  ctx.globalAlpha = alpha; ctx.fillStyle = WARM_WHITE; ctx.beginPath(); ctx.arc(x + p.x, y + p.y, 1.5, 0, TAU); ctx.fill();
}

/** Stroke part of a rounded-square contour, from u0 to u1 (fractions, may wrap). */
function contourArc(ctx, x, y, w, r, u0, u1, n = 60) {
  ctx.beginPath();
  for (let i = 0; i <= n; i++) { const p = contourPoint(w, r, lerp(u0, u1, i / n)); if (i) ctx.lineTo(x + p.x, y + p.y); else ctx.moveTo(x + p.x, y + p.y); }
  ctx.stroke();
}

/** When the single clear's last point of light has gone (all blocks). */
const settleOf = (P, st) => st.T.disEnd + Math.max(...st.blocks.map((b) => b.o));

// ---------- events ----------
const EV = {};

EV.single = { duration: (P) => dawn.duration(PB(P)), keyframes: (P) => dawn.keyframes(PB(P)), prepare: (sc, P) => dawn.prepare(sc, PB(P)), render: (ctx, t, st, sc, P) => dawn.render(ctx, t, st, sc, PB(P)) };

// Multi-line: one wave spreading from the crossing along both lines.
EV.multi = {
  duration: (P) => { const Q = PB(P); return dawn.duration(Q) + 4 * Q.stagger * Q.speed * 0.8 + 120; },
  keyframes: (P) => { const Q = PB(P); const k = Q.speed; return [[90 * k, 'Kindle', 'Light wakes at the crossing and spreads along both lines.'], [300 * k, 'Dissolve', 'Pearls draw inward, gold glints running round each.'], [470 * k, 'Crossing', 'The crossing melts first into a bright point; its gold contour ripples outward twice.'], [650 * k, 'Climax', 'Pearl-shaped ripples travel out along both arms of the cross.'], [850 * k, 'Last lights', 'The far ends wink out.'], [EV.multi.duration(P) - 30, 'Settle', 'Two clear lines.']].map(([t, label, note]) => ({ t, label, note })); },
  prepare(scene, P) {
    const Q = PB(P); const k = Q.speed;
    const row = scene.lines.find((l) => l.axis === 'h'); const col = scene.lines.find((l) => l.axis === 'v');
    if (!row || !col) return { per: scene.lines.map((l) => ({ line: l, st: dawn.prepare({ ...scene, lines: [l] }, Q) })), cross: null };
    const crossI = row.idx * 8 + col.idx;
    const per = [row, col].map((l) => {
      const st = dawn.prepare({ ...scene, lines: [l] }, Q);
      const ci = l.cells.findIndex((c) => c.i === crossI);
      st.blocks.forEach((b, i) => { b.o = Math.abs(i - ci) * Q.stagger * k * 0.8; });
      if (l === col) st.blocks = st.blocks.filter((b) => b.i !== crossI); // the crossing is drawn once
      return { line: l, st };
    });
    return { per, cross: { ...scene.cell(crossI), row, col } };
  },
  render(ctx, t, st, scene, P) {
    const Q = PB(P); const k = Q.speed;
    for (const p of st.per) dawn.render(ctx, t, p.st, { ...scene, lines: [p.line] }, Q);
    if (!st.cross) return;
    const c = st.cross; const T = st.per[0].st.T; const at = T.disEnd - 20 * k;
    // A brighter point at the crossing.
    const pt = env(t, at - 60 * k, at, at + 40 * k, at + 260 * k);
    if (pt > 0) { drawSprite(ctx, lightSprite(GOLD), c.x, c.y, c.s * 0.95 * pt, { alpha: pt }); glint(ctx, c.x, c.y, c.s * 0.42 * pt, WARM_WHITE, pt); }
    // Pearl-shaped ripples: as each pearl melts into its point of light, its gold contour lifts
    // off and expands outward. The wave starts at the crossing, so the ripples travel out along
    // both arms of the cross. (No light runs along paths here: that gesture belongs to the board clear.)
    for (const p of st.per) for (const b of p.st.blocks) {
      const isCross = b.x === c.x && b.y === c.y;
      const at0 = T.disEnd + b.o - 30 * k;
      for (let n = 0; n < (isCross ? 2 : 1); n++) {
        const u = seg(t, at0 + n * 90 * k, at0 + n * 90 * k + (isCross ? 520 : 320) * k); if (u <= 0 || u >= 1) continue;
        const grow = isCross ? 1.3 - n * 0.35 : 0.42; const sz = c.s * (0.9 + grow * expoOut(u)); const r = sz * 0.4;
        const a = (1 - premium(u)) * (isCross ? 1 : 0.8);
        ctx.save(); ctx.translate(b.x, b.y);
        roundRectPath(ctx, sz, sz, r);
        ctx.globalAlpha = a * 0.3; ctx.strokeStyle = CHAMPAGNE; ctx.lineWidth = 4 * (1 - u) + 1; ctx.stroke();
        ctx.globalAlpha = a; ctx.strokeStyle = GOLD; ctx.lineWidth = 1.6 * (1 - u) + 0.5; ctx.stroke();
        ctx.restore();
      }
    }
  },
};

// Placement: the placed pearls' gold rims light in quick succession with a touch of inner light.
EV.place = {
  duration: (P) => 460 * P.speed,
  keyframes: (P) => [[60, 'Touch', 'The first placed pearl’s rim lights gold.'], [150, 'Succession', 'The rim light passes pearl to pearl.'], [300, 'Glint', 'A glint on the last pearl.'], [420, 'Settle', 'Rims return to rest.']].map(([t, label, note]) => ({ t: t * P.speed, label, note })),
  prepare(scene) { return { cells: scene.fx.placed.map((i) => scene.cell(i)) }; },
  render(ctx, t, st, scene, P) {
    const k = P.speed;
    st.cells.forEach((c, n) => {
      const t0 = n * 45 * k; const a = env(t, t0, t0 + 70 * k, t0 + 120 * k, t0 + 330 * k) * P.rim;
      if (a <= 0.01) return;
      ctx.save(); ctx.translate(c.x, c.y);
      roundRectPath(ctx, c.s, c.s, c.s * 0.4); ctx.save(); ctx.clip();
      drawSprite(ctx, lightSprite(GOLD), 0, -c.s * 0.05, c.s * 0.9, { alpha: a * 0.28 }); ctx.restore();
      roundRectPath(ctx, c.s - 1.5, c.s - 1.5, c.s * 0.4 - 0.75);
      ctx.globalAlpha = a * 0.5; ctx.strokeStyle = CHAMPAGNE; ctx.lineWidth = 4; ctx.stroke();
      ctx.globalAlpha = a; ctx.strokeStyle = GOLD; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.restore();
    });
    const last = st.cells[st.cells.length - 1]; if (!last) return;
    const t1 = (st.cells.length - 1) * 45 * k + 110 * k; const g = env(t, t1, t1 + 50 * k, t1 + 80 * k, t1 + 240 * k);
    if (g > 0) glint(ctx, last.x + last.s * 0.32, last.y - last.s * 0.32, last.s * 0.3 * g, WARM_WHITE, g);
  },
};

// Idle: a single gold glint makes one lap of one pearl's contour.
EV.idle = {
  duration: (P) => 980 * P.speed,
  keyframes: (P) => [[120, 'Wake', 'One pearl’s rim warms.'], [450, 'Lap', 'A gold glint runs once around its contour.'], [850, 'Rest', 'It fades back to rest.']].map(([t, label, note]) => ({ t: t * P.speed, label, note })),
  prepare(scene) {
    const filled = []; for (let i = 0; i < 64; i++) if (scene.fx.after[i]) filled.push(i);
    const i = filled[Math.floor(filled.length * 0.6)] ?? 27;
    return { c: scene.cell(i), i };
  },
  render(ctx, t, st, scene, P) {
    const c = st.c; const k = P.speed; const w = c.s - 1.5; const r = c.s * 0.4 - 0.75;
    const on = env(t, 0, 160 * k, 760 * k, 960 * k);
    ctx.save(); ctx.translate(c.x, c.y);
    roundRectPath(ctx, w, w, r); ctx.globalAlpha = on * 0.7; ctx.strokeStyle = GOLD; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.restore();
    const u = premium(seg(t, 120 * k, 860 * k));
    if (u > 0 && u < 1) contourGlint(ctx, c.x, c.y, w, r, 0.875 + u, 1, c.s * 0.95, on * env(u, 0, 0.08, 0.85, 1));
  },
};

// Streak: the points of light gather into one pearl of light at the line's centre, which releases halo rings.
EV.streak = {
  duration: (P) => { const Q = PB(P); return dawn.duration(Q) + 520 * Q.speed; },
  keyframes: (P) => { const Q = PB(P); const k = Q.speed; const g = 860 * k; return [[260 * k, 'Dissolve', 'The same dissolve as a single clear.'], [g - 180 * k, 'Gather', 'The points of light drift together to the centre of the line.'], [g, 'Pearl of light', 'They merge into one bright pearl of light.'], [g + 160 * k, 'Halo', 'It releases a thin gold halo ring (two for big streaks).'], [g + 380 * k, 'Rise', 'The light lifts a little and fades.'], [EV.streak.duration(P) - 30, 'Settle', 'A quiet sky.']].map(([t, label, note]) => ({ t, label, note })); },
  prepare(scene, P) {
    const Q = PB(P); const st = dawn.prepare(scene, { ...Q, point: 0.55, motes: 0 });
    return { st, line: scene.lines[0] };
  },
  render(ctx, t, S, scene, P) {
    const Q = PB(P); const k = Q.speed; const { st, line } = S; const s = line.s;
    dawn.render(ctx, t, st, scene, { ...Q, point: 0.55, motes: 0 });
    const T = st.T; const G = settleOf(Q, st) + 100 * k; // gathering moment
    // Each pearl's light leaves as it winks out and arcs to the centre.
    for (const b of st.blocks) {
      const t0 = T.disEnd + b.o - 10 * k; const u = seg(t, t0, G); if (u <= 0 || u >= 1) continue;
      const e = premium(u); const x = lerp(b.x, line.cx, e); const y = lerp(b.y, line.cy, e) - Math.sin(Math.PI * e) * s * 0.35;
      drawSprite(ctx, lightSprite(b.tint), x, y, s * 0.42, { alpha: 0.95 });
      ctx.globalAlpha = 0.9; ctx.fillStyle = WARM_WHITE; ctx.beginPath(); ctx.arc(x, y, 1.6, 0, TAU); ctx.fill();
    }
    // The pearl of light and its halo rings.
    const rise = s * 0.3 * easeOutCubic(seg(t, G, G + 500 * k)); const cx = line.cx; const cy = line.cy - rise;
    const pl = env(t, G - 60 * k, G, G + 120 * k, G + 480 * k);
    if (pl > 0) { drawSprite(ctx, lightSprite(GOLD), cx, cy, s * (0.9 + 0.3 * pl), { alpha: pl }); glint(ctx, cx, cy, s * 0.5 * pl, WARM_WHITE, pl); }
    const rings = P.combo >= 4 ? 2 : 1; const reach = s * (1.8 + 0.25 * Math.min(P.combo, 8));
    for (let i = 0; i < rings; i++) {
      const u = seg(t, G + 40 * k + i * 110 * k, G + 520 * k + i * 110 * k); if (u <= 0 || u >= 1) continue;
      haloRing(ctx, cx, cy, s * 0.4 + reach * expoOut(u), (1 - u) * P.halo, 1.6 - i * 0.4);
    }
  },
};

// Board clear: glints race round the gilt frame, meet, the frame glows, a halo opens from the centre.
EV.board = {
  duration: (P) => { const Q = PB(P); return dawn.duration(Q) * 0.85 + 1150 * Q.speed; },
  keyframes: (P) => { const Q = PB(P); const k = Q.speed; const t0 = dawn.duration(Q) * 0.62; return [[260 * k, 'Last line', 'The final line dissolves into points of light.'], [t0 + 120 * k, 'Frame', 'Two gold glints set off round the gilt frame in opposite directions.'], [t0 + 420 * k, 'Race', 'They trace the frame, lighting it as they go.'], [t0 + 640 * k, 'Meet', 'They meet at the bottom; the whole frame glows once.'], [t0 + 900 * k, 'Wash', 'Light washes inward from the frame, lighting each cell\u2019s gold contour ring by ring.'], [EV.board.duration(P) - 30, 'Settle', 'A clear board at dawn.']].map(([t, label, note]) => ({ t, label, note })); },
  prepare(scene, P) {
    const Q = PB(P); const st = dawn.prepare(scene, Q); const B0 = scene.bounds; const s = scene.lines[0].s;
    // On the gilt ring: the board's padding is 0.026 x board size (= 0.24 cell), its corners 0.045 x board size (= 0.41 cell).
    const pad = s * 0.24 + 1; const w = Math.max(B0.x1 - B0.x0, B0.y1 - B0.y0) + pad * 2;
    const cells = Array.from({ length: 64 }, (_, i) => { const rr = Math.floor(i / 8); const cc = i % 8; return { ...scene.cell(i), ring: Math.min(rr, cc, 7 - rr, 7 - cc) }; });
    return { st, fx: (B0.x0 + B0.x1) / 2, fy: (B0.y0 + B0.y1) / 2, w, r: s * 0.41 + 1, s, cells };
  },
  render(ctx, t, S, scene, P) {
    const Q = PB(P); const k = Q.speed; const { st, fx, fy, w, r, s } = S;
    dawn.render(ctx, t, st, scene, Q);
    const t0 = dawn.duration(Q) * 0.62; const run = seg(t, t0, t0 + 640 * k); const e = premium(run);
    // Lit frame behind the glints, then a single glow of the whole frame when they meet.
    const meet = t0 + 640 * k; const glow = env(t, meet - 40 * k, meet + 60 * k, meet + 140 * k, meet + 520 * k);
    const fade = 1 - seg(t, meet, meet + 500 * k);
    if (run > 0) {
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.75 * fade; ctx.strokeStyle = GOLD; ctx.lineWidth = 1.6;
      contourArc(ctx, fx, fy, w, r, 0, 0.5 * e); contourArc(ctx, fx, fy, w, r, 0, -0.5 * e);
    }
    if (glow > 0) {
      ctx.globalAlpha = glow * 0.4; ctx.strokeStyle = CHAMPAGNE; ctx.lineWidth = 5;
      ctx.save(); ctx.translate(fx, fy); roundRectPath(ctx, w, w, r); ctx.stroke();
      ctx.globalAlpha = glow; ctx.strokeStyle = GOLD; ctx.lineWidth = 2; ctx.stroke(); ctx.restore();
    }
    if (run > 0 && run < 1) {
      const a = env(run, 0, 0.06, 0.92, 1);
      contourGlint(ctx, fx, fy, w, r, 0.5 * e, 1, s, a, 8, 0.006);
      contourGlint(ctx, fx, fy, w, r, -0.5 * e, -1, s, a, 8, 0.006);
    }
    // The meeting flare at the bottom centre.
    const fl = env(t, meet - 20 * k, meet + 10 * k, meet + 40 * k, meet + 260 * k);
    if (fl > 0) { const p = contourPoint(w, r, 0.5); drawSprite(ctx, lightSprite(GOLD), fx + p.x, fy + p.y, s * 1.1 * fl, { alpha: fl }); glint(ctx, fx + p.x, fy + p.y, s * 0.6 * fl, WARM_WHITE, fl); }
    // The light washes inward from the frame: every empty cell's gold contour lights, ring by ring
    // from the edge to the middle. (No point or halo: that ending belongs to the streak.)
    for (const c of S.cells) {
      const at = meet + 40 * k + c.ring * 95 * k;
      const a = env(t, at, at + 70 * k, at + 120 * k, at + 420 * k); if (a <= 0.01) continue;
      const w0 = c.s * 0.94; const r0 = w0 * 0.4;
      ctx.save(); ctx.translate(c.x, c.y); roundRectPath(ctx, w0, w0, r0);
      ctx.globalAlpha = a * 0.25; ctx.strokeStyle = CHAMPAGNE; ctx.lineWidth = 3.5; ctx.stroke();
      ctx.globalAlpha = a * 0.85; ctx.strokeStyle = GOLD; ctx.lineWidth = 1.3; ctx.stroke();
      ctx.restore();
    }
  },
};

const pick = (ev) => EV[ev] || EV.single;
export default {
  id: 'cloud-dawn', label: 'Pearl of Dawn suite', kind: 'concept', supports: ['single', 'multi', 'place', 'idle', 'streak', 'board'], params, presets,
  duration: (P, ev) => pick(ev).duration(P), keyframes: (P, ev) => pick(ev).keyframes(P), prepare: (sc, P, ev) => pick(ev).prepare(sc, P), render: (ctx, t, st, sc, P, ev) => pick(ev).render(ctx, t, st, sc, P),
};

export { pearlWarmJobs } from './cloud-art.js';
