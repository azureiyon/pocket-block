// Concept A — Power Trace.
// Feeling: a circuit completing; crisp, electric, satisfying. A spark enters
// at the line's start and runs along a right-angle circuit trace that routes
// through every block (along the top edge, dipping through each glyph's node).
// As the current reaches a block, the block shorts out: its face flickers off
// in two hard frames, its glyph flashes white, and its glowing outline is
// pulled into the wire (consumed around the rim). At the far end the trace
// lands on a solder pad that flashes. Then the wire cools from start to end.
// Primary: the travelling current (white head, coloured wire). Secondary: the
// blocks shorting out. Ambient: tiny right-angle sparks and the cooling wire.
// Direction: along the line in hard right-angle steps (Classic's sweep is a
// smooth soft edge; this is digital routing with flicker).

import { TAU, mix, seg, env, lerp, rng, premium, expoOut, quadIn, glint, drawSprite, frame, circuitBlock, haloSprite, rgbaOf, WHITE, ciOf } from '../../src/ui/vfx-neon/neon-art.js';

export const params = [
  { key: 'run', label: 'Current run time', unit: 'ms', min: 200, max: 700, step: 20, def: 420 },
  { key: 'flicker', label: 'Short-out flicker', min: 0, max: 1, step: 0.05, def: 0.8 },
  { key: 'dip', label: 'Trace dip into blocks', min: 0, max: 1, step: 0.05, def: 1 },
  { key: 'pad', label: 'Solder pad flash', min: 0, max: 1, step: 0.05, def: 0.85 },
  { key: 'sparks', label: 'Right-angle sparks', min: 0, max: 6, step: 1, def: 2 },
  { key: 'speed', label: 'Overall pace', min: 0.6, max: 1.5, step: 0.05, def: 1 },
];
export const presets = { Default: {}, 'Overclocked': { run: 280, sparks: 3, speed: 0.85 }, 'Slow current': { run: 600, flicker: 1, speed: 1.15 } };

function timing(P) {
  const k = P.speed;
  const T = { charge: 110 * k, run: P.run * k };
  T.runEnd = T.charge + T.run; T.cool = T.runEnd + 80 * k; T.end = T.runEnd + 420 * k;
  return T;
}
export const duration = (P) => timing(P).end;
export const keyframes = (P) => {
  const T = timing(P); const k = P.speed;
  return [
    [T.charge * 0.7, 'Charge', 'The glyph nodes brighten; a spark appears at the start of the line.'],
    [T.charge + T.run * 0.2, 'Current', 'The current routes along the trace in right-angle steps.'],
    [T.charge + T.run * 0.55, 'Short out', 'Each block flickers off and its outline is pulled into the wire.'],
    [T.runEnd - 10 * k, 'Climax', 'The current reaches the far end.'],
    [T.runEnd + 60 * k, 'Pad', 'It lands on a solder pad that flashes.'],
    [T.runEnd + 220 * k, 'Cooling', 'The wire cools from start to end, white to colour to dark.'],
    [T.end - 20, 'Settle', 'A clean line.'],
  ].map(([t, label, note]) => ({ t, label, note }));
};

export function prepare(scene, P) {
  const line = scene.lines[0]; const F = frame(line); const r = rng(83); const s = line.s; const T = timing(P);
  // The trace in line-local coordinates: enter at the left, run along y = -0.3s, dip down through each
  // block's centre (a right-angle notch), and finish on a pad past the last block.
  const top = -s * 0.32; const dipY = s * 0.06 * P.dip;
  const pts = [{ x: F.xOf(0) - s * 0.75, y: top }];
  line.cells.forEach((c, k) => {
    const x = F.xOf(k);
    pts.push({ x: x - s * 0.18, y: top }, { x: x - s * 0.18, y: dipY }, { x: x + s * 0.18, y: dipY }, { x: x + s * 0.18, y: top });
  });
  const padP = { x: F.xOf(7) + s * 0.72, y: top };
  pts.push(padP);
  const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.abs(pts[i].x - pts[i - 1].x) + Math.abs(pts[i].y - pts[i - 1].y));
  const total = cum[cum.length - 1];
  const at = (d) => { d = Math.max(0, Math.min(total, d)); let i = 1; while (i < cum.length - 1 && cum[i] < d) i++; const u = (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1); return { x: lerp(pts[i - 1].x, pts[i].x, u), y: lerp(pts[i - 1].y, pts[i].y, u), i }; };
  // Constant-speed current with a soft start (ease-in for the first 15%).
  const distAt = (t) => { const u = seg(t, T.charge, T.runEnd); return total * (u < 0.15 ? (u * u) / 0.3 : (u - 0.075) / 0.925); };
  const blocks = line.cells.map((c, k) => {
    const dCentre = cum[1 + k * 4 + 1]; // where the trace dips into this block
    let lo = T.charge; let hi = T.runEnd; for (let n = 0; n < 16; n++) { const m = (lo + hi) / 2; if (distAt(m) < dCentre) lo = m; else hi = m; }
    return { ...c, lx: F.xOf(k), hit: lo, ci: ciOf(c, scene.theme.palette) };
  });
  const sparks = [];
  for (const b of blocks) for (let j = 0; j < P.sparks; j++) {
    const dir = [[0, -1], [1, 0], [0, 1], [-1, 0]][Math.floor(r() * 4)];
    sparks.push({ x: b.lx + (r() - 0.5) * s * 0.3, y: top + (r() - 0.5) * s * 0.2, t0: b.hit + r() * 50, life: 120 + r() * 120, dir, turn: r() < 0.5 ? 1 : -1, len: s * (0.25 + r() * 0.3), col: b.color });
  }
  return { line, F, T, pts, cum, total, at, distAt, blocks, sparks, padP, top };
}

/** Stroke the trace between distances d0 and d1. */
function traceSeg(ctx, st, d0, d1) {
  if (d1 <= d0) return;
  const a = st.at(d0); const b = st.at(d1);
  ctx.beginPath(); ctx.moveTo(a.x, a.y);
  for (let i = a.i; i < b.i; i++) ctx.lineTo(st.pts[i].x, st.pts[i].y);
  ctx.lineTo(b.x, b.y); ctx.stroke();
}

export function render(ctx, t, st, scene, P) {
  const { line, F, T, blocks, total, distAt } = st; const s = line.s; const k = P.speed;
  const head = distAt(t);
  F.enter(ctx);
  // Secondary: blocks charge, then short out and are pulled into the wire.
  for (const b of blocks) {
    const charge = env(t, 0, T.charge, b.hit - 40 * k, b.hit);
    const u = seg(t, b.hit, b.hit + 200 * k); if (u >= 1) continue;
    // Two hard flicker frames, then the face is dark.
    const fl = P.flicker > 0 ? ((t - b.hit) < 33 * k ? 0 : (t - b.hit) < 66 * k ? 1 : (t - b.hit) < 99 * k ? 0.15 : 0) : 1 - u;
    const face = u <= 0 ? 1 : lerp(1 - u, fl, P.flicker);
    ctx.save(); ctx.translate(b.lx, 0); F.upright(ctx);
    circuitBlock(ctx, 0, 0, s, b.color, b.ci, { power: Math.max(charge * 0.4, u > 0 ? 1 - u : 0), face, rimPart: 1 - premium(seg(u, 0.25, 1)), glyphA: u > 0 ? 1 - seg(u, 0, 0.4) : 1, alpha: 1 });
    ctx.restore();
  }
  // Primary: the wire behind the current, then cooling from start to end.
  ctx.lineCap = 'square'; ctx.lineJoin = 'miter';
  const coolHead = total * premium(seg(t, T.cool, T.end - 60 * k));
  if (head > 0) {
    // Wire colour follows the block it passes; draw per block span.
    const spans = [[0, st.cum[1]], ...blocks.map((b, i) => [st.cum[1 + i * 4], st.cum[1 + i * 4 + 4]]), [st.cum[st.cum.length - 2], total]];
    spans.forEach(([d0, d1], i) => {
      const b = blocks[Math.max(0, Math.min(7, i - 1))]; const from = Math.max(d0, coolHead); const to = Math.min(d1, head);
      if (to <= from) return;
      ctx.globalAlpha = 0.35; ctx.strokeStyle = b.color; ctx.lineWidth = 6; traceSeg(ctx, st, from, to);
      ctx.globalAlpha = 1; ctx.lineWidth = 2; traceSeg(ctx, st, from, to);
    });
    // The hottest stretch just behind the head is white.
    if (t < T.runEnd + 40 * k) { ctx.globalAlpha = 1; ctx.strokeStyle = WHITE; ctx.lineWidth = 1.4; traceSeg(ctx, st, Math.max(0, head - s * 0.9), head); }
    // Cooling front: a dim afterglow segment fading out.
    if (coolHead > 0 && coolHead < total) { ctx.globalAlpha = 0.25; ctx.strokeStyle = WHITE; ctx.lineWidth = 1; traceSeg(ctx, st, Math.max(0, coolHead - s * 0.6), coolHead); }
  }
  // The current's head.
  const on = env(t, T.charge - 40 * k, T.charge, T.runEnd, T.runEnd + 30 * k);
  if (on > 0) {
    const p = st.at(head); const b = blocks[Math.max(0, Math.min(7, Math.floor((p.i - 1) / 4)))];
    drawSprite(ctx, haloSprite(b.color), p.x, p.y, s * 0.9, { alpha: on });
    glint(ctx, p.x, p.y, s * 0.28, WHITE, on);
    ctx.globalAlpha = on; ctx.fillStyle = WHITE; ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
  }
  // Ambient: tiny right-angle sparks thrown off where blocks short out.
  for (const sp of st.sparks) {
    const u = (t - sp.t0) / sp.life; if (u < 0 || u > 1) continue;
    const e = expoOut(u); const l1 = sp.len * 0.6 * Math.min(1, e * 1.6); const l2 = sp.len * 0.4 * seg(e, 0.5, 1);
    const x1 = sp.x + sp.dir[0] * l1; const y1 = sp.y + sp.dir[1] * l1;
    const x2 = x1 - sp.dir[1] * sp.turn * l2; const y2 = y1 + sp.dir[0] * sp.turn * l2;
    ctx.globalAlpha = 1 - u; ctx.strokeStyle = mix(sp.col, WHITE, 0.4); ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(sp.x, sp.y); ctx.lineTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  // Climax: the solder pad at the far end flashes.
  const pu = seg(t, T.runEnd - 20 * k, T.runEnd + 300 * k);
  if (pu > 0 && pu < 1) {
    const p = st.padP; const col = blocks[7].color; const a = (1 - pu) * P.pad;
    drawSprite(ctx, haloSprite(col), p.x, p.y, s * (0.8 + 1.4 * expoOut(pu)), { alpha: a });
    ctx.globalAlpha = a; ctx.strokeStyle = WHITE; ctx.lineWidth = 2;
    const z = s * (0.18 + 0.12 * expoOut(pu)); ctx.strokeRect(p.x - z, p.y - z, z * 2, z * 2);
    ctx.fillStyle = col; ctx.fillRect(p.x - s * 0.08, p.y - s * 0.08, s * 0.16, s * 0.16);
    glint(ctx, p.x, p.y, s * 0.55 * (1 - pu), WHITE, a);
  }
  F.leave(ctx);
  ctx.globalAlpha = 1;
}

export default { id: 'neon-a', label: 'A · Power Trace', kind: 'concept', supports: ['single'], params, presets, duration, keyframes, prepare, render };
