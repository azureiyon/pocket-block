// Candy Ballet — the rest of the suite, built on the approved single-line
// clear. Same vocabulary everywhere (crouch, hop, pirouette, pose together,
// leave follow-the-leader with ribbon trails); each event gets its own
// choreography instead of more particles:
//   idle       a small group warms up with a tiny canon bounce
//   place      the piece drops in, squashes; its neighbours hop to greet it
//   multi      two troupes; the block at the crossing is the prima (higher,
//              double pirouette); the troupes leave in mirrored loops
//   streak     the troupe paints a ribbon heart before leaving (combo ≥ 4)
//   milestone  a curtain call: a little troupe hops on above the board, bows, exits
//   board      grand finale: arch, gather into a carousel ring, pinwheel out, heart

import { TAU, mix, easeOut, easeIn, easeInOut, easeOutBack, sine, seg, env, lerp, sparkle, drawSprite } from '../art/jelly-art.js';
import { sampler, bez, heartPts, heartSprite, hop, landing, dancer, trail, trailSparkles } from '../art/ballet-kit.js';

const K = (P) => P.speed;
const beats = (P) => ({ crouch: 90 * K(P), hopT: 240 * K(P), spinT: 290 * K(P), pose: 110 * K(P) });

// ---------- shared troupe engine ----------
/**
 * A troupe of dancers: each has a cue, hops along `up`, the whole troupe holds
 * an arch, tilts toward its exit, then follows one path in a line.
 */
function troupe(cells, { cues, up, heights, turns, exitPts, P, s, departAt, tiltDir = -1, travelT }) {
  const apex = cells.map((c, k) => [c.x + up[0] * heights[k], c.y + up[1] * heights[k]]);
  const path = sampler([...apex, ...exitPts(apex[apex.length - 1])]);
  const startD = apex.map((_, k) => sampler(apex.slice(0, k + 1)).total);
  const travel = path.total - startD[0];
  const B = beats(P);
  return {
    cells, apex, path, startD, travel, departAt, travelT,
    pose(k, t) {
      const c = cells[k];
      if (t < departAt) {
        const h = hop(t - cues[k], { crouch: B.crouch, hopT: B.hopT, spinT: B.spinT, depth: P.crouch, height: heights[k], turns: turns[k], dir: k % 2 ? 1 : -1 }, s);
        const tiltAt = departAt - B.pose;
        const tilt = easeOutBack(seg(t, tiltAt, departAt), 2); const breath = Math.sin(seg(t, tiltAt, departAt) * Math.PI) * 0.06;
        return { x: c.x + up[0] * h.off, y: c.y + up[1] * h.off, sx: h.sx * (1 + breath), sy: h.sy * (1 - breath), rot: h.rot + tiltDir * 0.22 * tilt, alpha: 1, air: h.air, lift: h.off };
      }
      const u = seg(t, departAt, departAt + travelT);
      const dp = easeIn(u) * 0.86 + 0.14 * u;
      const d = startD[k] + dp * travel; const q = path.at(d);
      const beyond = seg(d, path.total - s * 2.2, path.total);
      const sp = Math.min(1, dp * 2);
      return { x: q.x, y: q.y, sx: 1 + 0.12 * sp, sy: 1 - 0.1 * sp, rot: tiltDir * 0.22 * (1 - seg(t, departAt, departAt + 200)) + Math.sin(q.ang) * 0.25 * seg(t, departAt, departAt + 200), alpha: 1 - seg(d, path.total - s * 0.6, path.total), scale: 1 - 0.75 * beyond, air: 1, lift: s * 2, out: d >= path.total };
    },
  };
}

function exitLoop(side, B, s) {
  return (L) => {
    const end = side > 0 ? [B.x1 + s * 0.2, B.y0 - s * 1.8] : [B.x0 - s * 0.2, B.y0 - s * 1.8];
    const m = [L[0] - side * s * 0.2, L[1] - s * 2.1];
    return bez(L, [L[0] + side * s * 2.2, L[1] - s * 0.2], [L[0] + side * s * 1.4, L[1] - s * 2.8], m, 18)
      .concat(bez(m, [m[0] - side * s * 1.0, m[1] + s * 0.5], [L[0] + side * s * 0.4, L[1] - s * 3.6], end, 18));
  };
}

function drawTroupe(ctx, tr, t, s, P, { shadowOn = true, seed = 0 } = {}) {
  // Trails behind everyone, then dancers back to front (leader on top).
  if (t > tr.departAt && P.trail > 0) {
    for (let k = tr.cells.length - 1; k >= 0; k--) {
      const poseAt = (tt) => tr.pose(k, tt);
      trail(ctx, poseAt, t, tr.departAt, tr.cells[k].color, s, { len: 120 * P.trail, width: P.trailW, alpha: 1 - seg(t, tr.departAt + tr.travelT * 0.9, tr.departAt + tr.travelT * 1.25) });
      if (k === tr.cells.length - 1) trailSparkles(ctx, poseAt, t, tr.departAt, s, seed + k, P.sparkles);
    }
  }
  for (let k = tr.cells.length - 1; k >= 0; k--) {
    const d = tr.pose(k, t); if (d.out) continue;
    const c = tr.cells[k];
    const sh = shadowOn && t < tr.departAt + 120 && d.lift > 2 ? { x: c.x, y: c.y + s * 0.32, h: d.lift, fade: 1 - seg(t, tr.departAt, tr.departAt + 120) } : null;
    dancer(ctx, d, s, c.color, sh);
  }
}

function exitFinale(ctx, t, at, pos, s, withHeart) {
  const a = env(t - at, 0, 60, 90, 280);
  if (a > 0) { sparkle(ctx, pos.x, pos.y, s * 0.5 * a, a, '#ffffff', 0.2); sparkle(ctx, pos.x + s * 0.35, pos.y + s * 0.25, s * 0.25 * a, a, '#ffffff', 0.6); }
  if (!withHeart) return;
  const h = seg(t, at, at + 360);
  if (h > 0 && h < 1) drawSprite(ctx, heartSprite(), pos.x - s * 0.3, pos.y + s * 0.4 - easeOut(h) * s * 0.5, s * 0.9 * (h < 0.3 ? easeOutBack(h / 0.3, 2.4) : 1), { rot: -0.15 + Math.sin(h * 9) * 0.08 * (1 - h), alpha: 1 - seg(h, 0.65, 1) });
}

const archHeights = (n, s, P, bonusAt = -1) => Array.from({ length: n }, (_, k) => { const u = n > 1 ? (k - (n - 1) / 2) / ((n - 1) / 2) : 0; return s * P.hop * (1 + P.arch * (1 - u * u)) * (k === bonusAt ? 1.35 : 1); });

// ---------- events ----------
const EV = {};

// Idle: a small cluster does a tiny canon bounce, like dancers warming up backstage.
EV.idle = {
  duration: (P) => 1250 * K(P),
  keyframes: (P) => [[120, 'Warm-up crouch', 'A small group of neighbours crouches in canon.'], [330, 'Little bounce', 'A tiny hop: a fifth of a cell, no spin.'], [620, 'Land', 'Each lands with a soft squash.'], [1000, 'Settle', 'Back to rest; the board stays readable throughout.']].map(([t, label, note]) => ({ t: t * K(P), label, note })),
  prepare(scene, P) {
    const { fx, cell, theme } = scene; const filled = (i) => i >= 0 && i < 64 && fx.after[i];
    const nb = (i) => [i - 8, i + 8, i % 8 ? i - 1 : -1, i % 8 < 7 ? i + 1 : -1].filter(filled);
    let best = -1; for (let i = 0; i < 64; i++) if (filled(i) && (best < 0 || nb(i).length > nb(best).length)) best = i;
    const group = [best, ...nb(best)].slice(0, 4).sort((a, b) => (a % 8) - (b % 8) || a - b);
    const cells = group.map((i) => ({ i, ...cell(i), color: theme.palette[(fx.after[i] - 1) % theme.palette.length] }));
    return { cells, hidden: group };
  },
  render(ctx, t, st, scene, P) {
    const s = st.cells[0].s; const stag = 70 * K(P); const cr = 110 * K(P); const up = 200 * K(P); const fall = 180 * K(P);
    st.cells.forEach((c, k) => {
      const L = t - k * stag; let off = 0; let sx = 1; let sy = 1;
      if (L < cr + up) { const h = hop(L, { crouch: cr, hopT: up, spinT: up, depth: 0.1, height: s * 0.2, turns: 0, bobAmp: 0 }, s); off = h.off; sx = h.sx; sy = h.sy; }
      else if (L < cr + up + fall) { off = s * 0.2 * (1 - easeIn(seg(L, cr + up, cr + up + fall))); }
      else { const l = landing((L - cr - up - fall) / 1000, 0.12); sx = l.sx; sy = l.sy; off = -s * (1 - sy) * 0.5; }
      dancer(ctx, { x: c.x, y: c.y - off, sx, sy, rot: 0, alpha: 1, air: off / s }, s, c.color, off > 1 ? { x: c.x, y: c.y + s * 0.32, h: off } : null);
      const g = env(L, cr + up * 0.6, cr + up, cr + up + 20, cr + up + 200);
      if (k === Math.floor(st.cells.length / 2) && g > 0) sparkle(ctx, c.x - s * 0.22, c.y - off - s * 0.3, s * 0.3 * g, g);
    });
  },
};

// Placement: the piece drops in with a stretch, squashes on landing; neighbours hop to greet it.
EV.place = {
  duration: (P) => 900 * K(P),
  keyframes: (P) => [[70, 'Drop', 'The piece falls the last half cell, stretched.'], [150, 'Impact', 'It lands with a squash and a sparkle.'], [300, 'Greeting', 'Neighbours hop in turn around it.'], [520, 'Ripple', 'The greeting travels round the piece.'], [800, 'Settle', 'Everything springs back to round.']].map(([t, label, note]) => ({ t: t * K(P), label, note })),
  prepare(scene, P) {
    const { fx, cell, theme } = scene; const pal = theme.palette;
    const piece = fx.placed.map((i) => ({ i, ...cell(i), color: pal[(fx.after[i] - 1) % pal.length] }));
    const set = new Set(fx.placed);
    const cx = piece.reduce((a, c) => a + c.x, 0) / piece.length; const cy = piece.reduce((a, c) => a + c.y, 0) / piece.length;
    const nbs = new Set();
    for (const i of fx.placed) for (const j of [i - 8, i + 8, i % 8 ? i - 1 : -1, i % 8 < 7 ? i + 1 : -1]) if (j >= 0 && j < 64 && fx.after[j] && !set.has(j)) nbs.add(j);
    const neighbours = [...nbs].map((i) => ({ i, ...cell(i), color: pal[(fx.after[i] - 1) % pal.length] }))
      .sort((a, b) => Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx));
    return { piece, neighbours, cx, cy, hidden: [...fx.placed, ...nbs] };
  },
  render(ctx, t, st, scene, P) {
    const s = st.piece[0].s; const drop = 130 * K(P);
    // The piece moves as one unit.
    let off; let sx; let sy;
    if (t < drop) { const e = easeIn(t / drop); off = s * 0.55 * (1 - e); sx = 0.92; sy = 1.1; }
    else { const l = landing((t - drop) / 1000, 0.18); sx = l.sx; sy = l.sy; off = -s * (1 - sy) * 0.5; }
    for (const c of st.piece) dancer(ctx, { x: c.x, y: c.y - off, sx, sy, rot: 0, alpha: 1 }, s, c.color, null);
    const sp = env(t, drop - 10, drop + 20, drop + 40, drop + 220);
    if (sp > 0) { const tl = st.piece.reduce((a, c) => (c.y < a.y || (c.y === a.y && c.x < a.x) ? c : a), st.piece[0]); sparkle(ctx, tl.x - s * 0.45, tl.y - s * 0.45, s * 0.5 * sp, sp, '#ffffff', 0.2); }
    // Greeting hops, cued round the piece.
    st.neighbours.forEach((c, k) => {
      const cue = drop + 40 * K(P) + k * 45 * K(P); const L = t - cue;
      const cr = 80 * K(P); const up = 150 * K(P); const fall = 140 * K(P); const H = s * 0.16;
      let o = 0; let nx = 1; let ny = 1;
      if (L > 0 && L < cr + up) { const h = hop(L, { crouch: cr, hopT: up, spinT: up, depth: 0.1, height: H, turns: 0, bobAmp: 0 }, s); o = h.off; nx = h.sx; ny = h.sy; }
      else if (L >= cr + up && L < cr + up + fall) o = H * (1 - easeIn(seg(L, cr + up, cr + up + fall)));
      else if (L >= cr + up + fall) { const l = landing((L - cr - up - fall) / 1000, 0.1); nx = l.sx; ny = l.sy; o = -s * (1 - ny) * 0.5; }
      const lean = Math.sign(c.x - st.cx || 1) * 0.12 * env(L, 0, cr, cr + up, cr + up + fall);
      dancer(ctx, { x: c.x, y: c.y - o, sx: nx, sy: ny, rot: lean, alpha: 1, air: o / s }, s, c.color, o > 1 ? { x: c.x, y: c.y + s * 0.32, h: o } : null);
    });
  },
};

// Multi-line: two troupes; the crossing block is the prima; mirrored exits.
EV.multi = {
  duration: (P) => { const B = beats(P); return 7 * P.stagger + B.crouch + B.hopT + 40 + B.pose + 640 * K(P) + 380 * K(P); },
  keyframes: (P) => { const B = beats(P); const dep = 7 * P.stagger + B.crouch + B.hopT + 40 + B.pose; return [[B.crouch * 0.8, 'Prima cue', 'The block where the lines cross crouches first.'], [B.crouch + 2 * P.stagger + B.hopT * 0.4, 'Canon outward', 'Both lines hop outward from the crossing.'], [B.crouch + B.hopT * 0.8, 'Prima pirouette', 'The prima flies highest with a double spin.'], [dep - B.pose * 0.4, 'Two troupes pose', 'The row arches up; the column arches aside.'], [dep + 640 * K(P) * 0.35, 'Mirrored exits', 'The troupes leave in opposite loops, ribbons crossing.'], [dep + 640 * K(P) * 0.75, 'Follow-through', 'Loops curl off both top corners.'], [dep + 640 * K(P) + 160 * K(P), 'Settle', 'Sparkles at both exits, one heart between them.']].map(([t, label, note]) => ({ t, label, note })); },
  prepare(scene, P) {
    const s = scene.lines[0].s; const B = scene.bounds; const BT = beats(P);
    const row = scene.lines.find((l) => l.axis === 'h'); const col = scene.lines.find((l) => l.axis === 'v');
    const crossCol = col.idx; const crossRow = row.idx;
    const rowCells = row.cells; const colCells = col.cells.filter((c) => Math.floor(c.i / 8) !== crossRow).reverse(); // bottom to top
    const rowCues = rowCells.map((c, k) => Math.abs(k - crossCol) * P.stagger);
    const colCues = colCells.map((c) => (Math.abs(Math.floor(c.i / 8) - crossRow) + 0.5) * P.stagger);
    const departAt = Math.max(...rowCues, ...colCues) + BT.crouch + BT.hopT + 40 + BT.pose;
    const travelT = 640 * K(P);
    const rowT = troupe(rowCells, { cues: rowCues, up: [0, -1], heights: archHeights(8, s, P, crossCol), turns: rowCells.map((_, k) => (k === crossCol ? 2 : P.turns)), exitPts: exitLoop(1, B, s), P, s, departAt, travelT });
    const colT = troupe(colCells, { cues: colCues, up: [1, 0], heights: archHeights(colCells.length, s, P).map((h) => h * 0.8), turns: colCells.map(() => P.turns), exitPts: exitLoop(-1, B, s), P, s, departAt, tiltDir: 1, travelT });
    return { rowT, colT, departAt, travelT, s, B };
  },
  render(ctx, t, st, scene, P) {
    drawTroupe(ctx, st.colT, t, st.s, P, { seed: 3 });
    drawTroupe(ctx, st.rowT, t, st.s, P, { seed: 7 });
    const end = st.departAt + st.travelT;
    exitFinale(ctx, t, end - 60, st.rowT.path.at(st.rowT.path.total), st.s, false);
    exitFinale(ctx, t, end - 40, st.colT.path.at(st.colT.path.total), st.s, false);
    exitFinale(ctx, t, end, { x: (st.B.x0 + st.B.x1) / 2, y: st.B.y0 - st.s * 1.2 }, st.s, true);
  },
};

// Streak: the troupe paints a ribbon heart before it leaves (combo 4+); smaller streaks get a double loop.
EV.streak = {
  duration: (P) => { const B = beats(P); return 7 * P.stagger + B.crouch + B.hopT + 40 + B.pose + (P.combo >= 4 ? 1250 : 900) * K(P) + 450 * K(P); },
  keyframes: (P) => { const B = beats(P); const dep = 7 * P.stagger + B.crouch + B.hopT + 40 + B.pose; const tr = (P.combo >= 4 ? 1250 : 900) * K(P); return [[B.crouch + 3 * P.stagger, 'Same opening', 'The approved crouch and canon hop.'], [dep - B.pose * 0.3, 'Pose', 'The arch holds a beat.'], [dep + tr * 0.28, 'Drawing the heart', 'The leader sweeps into a heart above the board.'], [dep + tr * 0.55, 'Heart in ribbon', 'Every dancer traces it; the ribbon stays.'], [dep + tr * 0.85, 'Exit', 'The line leaves from the heart tip.'], [dep + tr + 220 * K(P), 'Settle', 'The ribbon heart fades with a wink.']].map(([t, label, note]) => ({ t, label, note })); },
  prepare(scene, P) {
    const line = scene.lines[0]; const s = line.s; const B = scene.bounds; const BT = beats(P);
    const cues = line.cells.map((_, k) => k * P.stagger);
    const departAt = 7 * P.stagger + BT.crouch + BT.hopT + 40 + BT.pose;
    const heartW = s * (3.8 + Math.min(P.combo, 8) * 0.15); const cx = (B.x0 + B.x1) / 2; const cy = B.y0 + s * 2.5;
    const heart = heartPts(cx, cy, heartW, 56); const tip = heart[0];
    const exitPts = P.combo >= 4
      ? (L) => [...bez(L, [L[0] + s * 1.4, L[1] + s * 0.2], [tip[0] + s * 2.4, tip[1] + s * 1.0], tip, 14), ...heart.slice(1), ...bez(tip, [tip[0] + s * 2.2, tip[1] + s * 0.6], [B.x1 + s * 0.9, cy], [B.x1 + s * 0.2, B.y0 - s * 1.8], 16)]
      : (L) => { const a = exitLoop(1, B, s)(L); const m = a[17]; return [...a.slice(0, 18), ...bez(m, [m[0] - s * 1.6, m[1] + s * 0.4], [m[0] - s * 1.2, m[1] - s * 1.6], m, 16), ...a.slice(18)]; };
    const travelT = (P.combo >= 4 ? 1250 : 900) * K(P);
    const tr = troupe(line.cells, { cues, up: [0, -1], heights: archHeights(8, s, P), turns: line.cells.map(() => P.turns), exitPts, P, s, departAt, travelT });
    // Where the heart sits along the path, so its ribbon can be painted as the leader passes.
    let h0 = 0; let h1 = 0; let best0 = Infinity; let best1 = -1;
    const N = 400; for (let i = 0; i <= N; i++) { const d = (tr.path.total * i) / N; const q = tr.path.at(d); const dd = Math.hypot(q.x - tip[0], q.y - tip[1]); if (dd < s * 0.05) { if (d < best0) { best0 = d; h0 = d; } if (d > best1) { best1 = d; h1 = d; } } }
    return { tr, s, B, heart: P.combo >= 4 ? { h0, h1 } : null, cells: line.cells };
  },
  render(ctx, t, st, scene, P) {
    const { tr, s } = st;
    if (st.heart && t > tr.departAt) {
      // The painted heart: a ribbon revealed behind the leader, in the troupe's colours, then fading.
      const lead = tr.startD[7] + (easeIn(seg(t, tr.departAt, tr.departAt + tr.travelT)) * 0.86 + 0.14 * seg(t, tr.departAt, tr.departAt + tr.travelT)) * tr.travel;
      const upto = Math.min(lead, st.heart.h1); const fade = 1 - seg(t, tr.departAt + tr.travelT * 0.8, tr.departAt + tr.travelT + 450 * K(P));
      if (upto > st.heart.h0 && fade > 0) {
        const n = 60; ctx.lineCap = 'round';
        for (let i = 0; i < n; i++) {
          const d0 = lerp(st.heart.h0, upto, i / n); const d1 = lerp(st.heart.h0, upto, (i + 1) / n);
          const a = tr.path.at(d0); const b = tr.path.at(d1); const col = st.cells[Math.floor((i / n) * 8)].color;
          ctx.globalAlpha = 0.85 * fade; ctx.strokeStyle = mix(col, '#ffffff', 0.2); ctx.lineWidth = s * 0.2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          ctx.globalAlpha = 0.95 * fade; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = s * 0.06; ctx.stroke();
        }
      }
    }
    drawTroupe(ctx, tr, t, s, P, { seed: 5 });
    exitFinale(ctx, t, tr.departAt + tr.travelT - 40, tr.path.at(tr.path.total), s, true);
  },
};

// Milestone: a curtain call above the board: a little troupe hops on, bows together, exits.
EV.milestone = {
  duration: (P) => 2350 * K(P),
  keyframes: (P) => [[260, 'Entrance', 'A little troupe hops on from the left, above the board.'], [640, 'Take places', 'Each lands on its mark in turn.'], [1010, 'Bow', 'All seven bow together.'], [1250, 'Rise', 'They straighten up with a sparkle.'], [1650, 'Exit', 'Follow the leader, off to the right with ribbons.'], [2050, 'Settle', 'A wink where they left.']].map(([t, label, note]) => ({ t: t * K(P), label, note })),
  prepare(scene, P) {
    const B = scene.bounds; const s0 = scene.cell(0).s; const s = s0 * 0.85; const pal = scene.theme.palette;
    const y = B.y0 - s * 0.7; const n = 6;
    const spots = Array.from({ length: n }, (_, k) => [B.x0 + ((k + 0.5) / n) * (B.x1 - B.x0), y]);
    const path = sampler([...spots, ...bez(spots[n - 1], [spots[n - 1][0] + s * 1.6, y + s * 0.2], [B.x1 + s * 1.2, y - s * 1.6], [B.x1 + s * 1.6, y - s * 2.6], 16)]);
    const startD = spots.map((_, k) => sampler(spots.slice(0, k + 1)).total);
    return { s, y, B, spots, path, startD, colors: pal.slice(0, n), n };
  },
  render(ctx, t, st, scene, P) {
    const { s, y, spots, path, startD, n } = st; const k1 = K(P);
    const enter = 620 * k1; const gap = 70 * k1; const bowAt = (n - 1) * gap + enter + 80 * k1; const bowT = 300 * k1; const exitAt = bowAt + bowT + 120 * k1; const exitT = 700 * k1;
    const startX = st.B.x0 - s * 2;
    const poseAt = (k, tt) => {
      if (tt < exitAt) {
        const u = seg(tt, (n - 1 - k) * gap, (n - 1 - k) * gap + enter); if (u <= 0) return null;
        const x = lerp(startX, spots[k][0], easeInOut(u));
        const hopsN = 3; const ph = u * hopsN; const f = ph % 1; const arc = Math.sin(Math.PI * f);
        let yy = y - arc * s * 0.55 * (u < 1 ? 1 : 0); let sx = 1; let sy = 1;
        if (u < 1) { const contact = 1 - Math.min(1, arc * 4); sx = 1 + 0.14 * contact; sy = 1 - 0.16 * contact; }
        else { const l = landing((tt - (n - 1 - k) * gap - enter) / 1000, 0.14); sx = l.sx; sy = l.sy; }
        // The bow: all lean forward and dip together, then straighten.
        const b = Math.sin(Math.PI * seg(tt, bowAt, bowAt + bowT));
        return { x, y: yy + b * s * 0.08, sx: sx * (1 + 0.06 * b), sy: sy * (1 - 0.12 * b), rot: 0.38 * b, alpha: Math.min(1, u * 4), scale: 1 };
      }
      const u = seg(tt, exitAt, exitAt + exitT); const dp = easeIn(u) * 0.86 + 0.14 * u;
      const d = startD[k] + dp * (path.total - startD[0]); const q = path.at(d);
      return { x: q.x, y: q.y, sx: 1.1, sy: 0.92, rot: Math.sin(q.ang) * 0.25, alpha: 1 - seg(d, path.total - s * 0.6, path.total), scale: 1 - 0.6 * seg(d, path.total - s * 2, path.total), out: d >= path.total };
    };
    if (t > exitAt) for (let k = n - 1; k >= 0; k--) { trail(ctx, (tt) => poseAt(k, tt), t, exitAt, st.colors[k], s, { len: 110 * P.trail, width: P.trailW * 0.9 }); }
    for (let k = n - 1; k >= 0; k--) { const d = poseAt(k, t); if (!d || d.out) continue; dancer(ctx, d, s, st.colors[k], null); }
    const g = env(t, bowAt + bowT * 0.6, bowAt + bowT * 0.8, bowAt + bowT, bowAt + bowT + 220);
    if (g > 0) spots.forEach(([x], k) => { if (k % 2 === 0) sparkle(ctx, x + s * 0.3, y - s * 0.7, s * 0.4 * g, g); });
    exitFinale(ctx, t, exitAt + exitT - 50, path.at(path.total), s, false);
  },
};

// Board clear: the grand finale: arch, gather into a carousel ring, pinwheel out, a heart rises.
EV.board = {
  duration: (P) => { const B = beats(P); return 7 * P.stagger + B.crouch + B.hopT + 40 + (480 + 760 + 680 + 700) * K(P); },
  keyframes: (P) => { const B = beats(P); const g = 7 * P.stagger + B.crouch + B.hopT + 40; const k = K(P); return [[B.crouch + 4 * P.stagger, 'Opening', 'The same crouch-and-hop, on an empty board.'], [g + 240 * k, 'Gather', 'The dancers sweep into a ring in the middle.'], [g + 480 + 300 * k, 'Carousel', 'The ring turns, rising and breathing.'], [g + (480 + 700) * k, 'Peak', 'The carousel at full spin, ribbons circling.'], [g + (480 + 760 + 300) * k, 'Pinwheel', 'They spiral out to every side.'], [g + (480 + 760 + 680 + 250) * k, 'Heart', 'A big glossy heart rises from the centre.'], [g + (480 + 760 + 680 + 620) * k, 'Settle', 'Sparkles fade on a clean board.']].map(([t, label, note]) => ({ t, label, note })); },
  prepare(scene, P) {
    const line = scene.lines[0]; const s = line.s; const B = scene.bounds; const BT = beats(P); const k = K(P);
    const cues = line.cells.map((_, i) => i * P.stagger);
    const heights = archHeights(8, s, P);
    const gatherAt = 7 * P.stagger + BT.crouch + BT.hopT + 40;
    const T = { gatherAt, gather: 480 * k, spin: 760 * k, out: 680 * k, heart: 700 * k };
    T.spinAt = gatherAt + T.gather; T.outAt = T.spinAt + T.spin; T.heartAt = T.outAt + 120 * k;
    return { line, s, B, cues, heights, T, cx: (B.x0 + B.x1) / 2, cy: (B.y0 + B.y1) / 2, R: s * 2.5 };
  },
  render(ctx, t, st, scene, P) {
    const { line, s, cues, heights, T, cx, cy, R } = st; const BT = beats(P);
    const omega = (tt) => { const a = seg(tt, T.gatherAt, T.outAt + T.out); return a * a * 7.5; }; // accelerating turn (radians)
    const ringAt = (k, tt) => { const th = -Math.PI / 2 + (k / 8) * TAU + omega(tt); const rise = -s * 0.3 * sine(seg(tt, T.spinAt, T.outAt)); return [cx + Math.cos(th) * R, cy + rise + Math.sin(th) * R * 0.9, th]; };
    const poseAt = (k, tt) => {
      const c = line.cells[k];
      if (tt < T.gatherAt) { const h = hop(tt - cues[k], { crouch: BT.crouch, hopT: BT.hopT, spinT: BT.spinT, depth: P.crouch, height: heights[k], turns: P.turns, dir: k % 2 ? 1 : -1 }, s); return { x: c.x, y: c.y - h.off, sx: h.sx, sy: h.sy, rot: h.rot, alpha: 1, air: h.air, lift: h.off }; }
      const ax = c.x; const ay = c.y - heights[k];
      if (tt < T.spinAt) { const e = easeInOut(seg(tt, T.gatherAt, T.spinAt)); const [rx, ry] = ringAt(k, tt); const arc = Math.sin(Math.PI * e) * s * 0.6; return { x: lerp(ax, rx, e), y: lerp(ay, ry, e) - arc, sx: 1, sy: 1, rot: 0.3 * Math.sin(Math.PI * e), alpha: 1, air: 1 }; }
      const [rx, ry, th] = ringAt(k, tt);
      if (tt < T.outAt) { const br = Math.sin((tt - T.spinAt) / 1000 * 12 + k) * 0.05; return { x: rx, y: ry, sx: 1 + br, sy: 1 - br, rot: th + Math.PI / 2, alpha: 1, air: 1 }; }
      const u = seg(tt, T.outAt, T.outAt + T.out); const r = 1 + 3.2 * easeIn(u);
      return { x: cx + (rx - cx) * r, y: cy + (ry - cy) * r, sx: 1.08, sy: 0.94, rot: th + Math.PI / 2, alpha: 1 - seg(u, 0.7, 1), scale: 1 - 0.5 * u, air: 1, out: u >= 1 };
    };
    if (t > T.gatherAt) for (let k = 7; k >= 0; k--) trail(ctx, (tt) => poseAt(k, tt), t, T.gatherAt, line.cells[k].color, s, { len: 150 * P.trail, width: P.trailW, alpha: 1 - seg(t, T.outAt + T.out * 0.7, T.outAt + T.out * 1.1), steps: 18 });
    // Centre glints while the carousel turns.
    const cg = env(t, T.spinAt, T.spinAt + 200, T.outAt, T.outAt + 300);
    if (cg > 0) for (let j = 0; j < 6; j++) { const a = (j / 6) * TAU + t / 500; sparkle(ctx, cx + Math.cos(a) * s * 0.9, cy - s * 0.2 + Math.sin(a) * s * 0.8, s * 0.22 * cg * (0.6 + 0.4 * Math.sin(t / 90 + j)), cg); }
    for (let k = 7; k >= 0; k--) { const d = poseAt(k, t); if (d.out) continue; const c = line.cells[k]; dancer(ctx, d, s, c.color, t < T.gatherAt && d.lift > 2 ? { x: c.x, y: c.y + s * 0.32, h: d.lift } : null); }
    // The finale heart rises from the centre.
    const h = seg(t, T.heartAt, T.heartAt + T.heart);
    if (h > 0 && h < 1) {
      drawSprite(ctx, heartSprite(), cx, cy - easeOut(h) * s * 0.9, s * 2 * (h < 0.25 ? easeOutBack(h / 0.25, 2.2) : 1), { rot: Math.sin(h * 8) * 0.06 * (1 - h), alpha: 1 - seg(h, 0.7, 1) });
      for (let j = 0; j < 8; j++) { const a = (j / 8) * TAU; const e = easeOut(seg(h, 0, 0.6)); const g = env(h, 0, 0.1, 0.45, 0.8); sparkle(ctx, cx + Math.cos(a) * s * (0.6 + 1.8 * e), cy - s * 0.6 + Math.sin(a) * s * (0.6 + 1.5 * e), s * 0.28 * g, g, '#ffffff', a); }
    }
  },
};

export const SUITE = EV;
