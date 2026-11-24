// Concept A — Satin Ribbon Waltz.
// Inspiration: a sash of iridescent satin drawn through a gift box; luxury
// stationery ribbon catching the light as it turns. Each block bows (a small
// lift), then flattens into its own fold of satin. The folds join into one
// multicoloured ribbon that waltzes along the line in three-beat twists,
// showing lit and shaded faces in turn, and sweeps away to the right with
// threadlike trails and four-point glints.
// Motif: unfurling fabric. The ribbon is a single continuous actor.

import { TAU, mix, seg, env, lerp, easeOut, easeIn, easeInOut, sine, rng, sparkle, enamelBlock, frame, colorAt, INK } from '../../src/ui/vfx-classic/pastel-art.js';
import { PLUM } from '../../src/ui/vfx-classic/pastel-art.js';

export const params = [
  { key: 'stagger', label: 'Fold stagger', unit: 'ms', min: 15, max: 60, step: 5, def: 28 },
  { key: 'width', label: 'Ribbon width', unit: '× cell', min: 0.2, max: 0.6, step: 0.02, def: 0.66 },
  { key: 'twists', label: 'Twists along line', min: 0.5, max: 3, step: 0.25, def: 1.25 },
  { key: 'waltz', label: 'Waltz lift', unit: '× cell', min: 0, max: 0.8, step: 0.05, def: 0.38 },
  { key: 'shade', label: 'Shaded face depth', min: 0.05, max: 0.45, step: 0.01, def: 0.24 },
  { key: 'threads', label: 'Thread trails', min: 0, max: 4, step: 1, def: 3 },
  { key: 'glints', label: 'Glints', min: 0, max: 2, step: 0.1, def: 1 },
  { key: 'speed', label: 'Overall pace', min: 0.6, max: 1.5, step: 0.05, def: 1 },
];
export const presets = { Default: {}, 'Slow waltz': { twists: 1, waltz: 0.5, speed: 1.25 }, 'Crisp & quick': { stagger: 20, twists: 2, waltz: 0.25, speed: 0.85 } };

function timing(P) {
  const k = P.speed;
  const T = { bow: 90 * k, fold: 140 * k };
  T.foldEnd = 7 * P.stagger + T.bow + T.fold;
  T.join = T.foldEnd; T.joinEnd = T.join + 120 * k;
  T.waltzEnd = T.joinEnd + 420 * k;
  T.sweepEnd = T.waltzEnd + 420 * k;
  T.end = T.sweepEnd + 260 * k;
  return T;
}
export const duration = (P) => timing(P).end;
export const keyframes = (P) => {
  const T = timing(P); const st = P.stagger;
  return [
    [2 * st + T.bow * 0.8, 'Anticipation', 'Each block bows: a small lift, left to right.'],
    [4 * st + T.bow + T.fold * 0.7, 'Folding', 'Blocks flatten into folds of satin, lit above, shaded below.'],
    [T.join + 70 * P.speed, 'Joining', 'The folds join into one multicoloured ribbon.'],
    [lerp(T.joinEnd, T.waltzEnd, 0.45), 'Climax', 'The ribbon waltzes, twisting to show lit and shaded faces.'],
    [lerp(T.waltzEnd, T.sweepEnd, 0.4), 'Sweep', 'It sweeps away to the right, its tail thinning into threads.'],
    [lerp(T.waltzEnd, T.sweepEnd, 0.85), 'Follow-through', 'Threadlike trails curl after it.'],
    [T.sweepEnd + 140 * P.speed, 'Settle', 'A few four-point glints where the ribbon passed.'],
  ].map(([t, label, note]) => ({ t, label, note }));
};

export function prepare(scene, P) {
  const line = scene.lines[0]; const F = frame(line); const r = rng(11);
  const glints = Array.from({ length: Math.round(5 * P.glints) }, () => ({ u: r(), at: r(), dy: (r() - 0.5) * line.s * 0.9 }));
  const threads = Array.from({ length: P.threads }, (_, i) => ({ ph: r() * TAU, amp: line.s * (0.12 + r() * 0.18), off: (i - (P.threads - 1) / 2) * line.s * 0.12, col: line.cells[Math.floor(r() * 8)].color }));
  return { line, F, T: timing(P), glints, threads };
}

/** One ribbon pass: a centreline, a half-width and a twist per sample; faces alternate lit and shaded. */
function drawRibbon(ctx, pts, P, s, alpha) {
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]; const b = pts[i];
    const ca = Math.cos(a.tw); const cb = Math.cos(b.tw);
    const wa = a.w * (0.3 + 0.7 * Math.abs(ca)); const wb = b.w * (0.3 + 0.7 * Math.abs(cb));
    const front = ca + cb > 0;
    const face = front ? mix(a.col, '#ffffff', 0.12) : mix(a.col, PLUM, P.shade);
    ctx.globalAlpha = alpha; ctx.fillStyle = face; ctx.strokeStyle = face; ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y - wa); ctx.lineTo(b.x, b.y - wb); ctx.lineTo(b.x, b.y + wb); ctx.lineTo(a.x, a.y + wa); ctx.closePath();
    ctx.fill(); ctx.stroke();
    // Defined silhouette: ink-tinted edges.
    ctx.strokeStyle = mix(a.col, PLUM, 0.5); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(a.x, a.y - wa); ctx.lineTo(b.x, b.y - wb); ctx.moveTo(a.x, a.y + wa); ctx.lineTo(b.x, b.y + wb); ctx.stroke();
    // Satin sheen: a crisp highlight riding the lit face where it faces us most.
    if (front && Math.abs(ca) > 0.6) {
      ctx.globalAlpha = alpha * (Math.abs(ca) - 0.6) * 2.2; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(1, wa * 0.22);
      ctx.beginPath(); ctx.moveTo(a.x, a.y - wa * 0.35); ctx.lineTo(b.x, b.y - wb * 0.35); ctx.stroke();
    }
  }
}

export function render(ctx, t, st, scene, P) {
  const { line, F, T } = st; const s = line.s; const half = line.len / 2 + s * 0.5;
  F.enter(ctx);
  const joined = seg(t, T.join, T.joinEnd);
  // Folding blocks (until the ribbon has fully formed).
  if (joined < 1) {
    line.cells.forEach((c, k) => {
      const L = t - k * P.stagger; let sx = 1; let sy = 1; let lift = 0;
      if (L > 0 && L <= T.bow) { const e = sine(L / T.bow); lift = s * 0.08 * e; sx = 1 - 0.04 * e; sy = 1 + 0.05 * e; }
      else if (L > T.bow) { const e = easeInOut(seg(L, T.bow, T.bow + T.fold)); lift = s * 0.08 * (1 - e); sx = 1 + 0.13 * e; sy = 1 + 0.05 - (0.05 + 0.72 * e); }
      const x = F.xOf(k);
      ctx.save(); ctx.translate(x, -lift); F.upright(ctx);
      if (sy > 0.45) enamelBlock(ctx, 0, 0, s, c.color, { sx: F.vert ? sy : sx, sy: F.vert ? sx : sy, alpha: 1 - joined });
      ctx.restore();
      // A fold of satin: lit upper half, shaded lower half, defined edge.
      if (L > T.bow && sy < 0.7) {
        const w = s * sx; const h = s * sy; const a = (1 - joined) * seg(sy, 0.7, 0.45);
        ctx.globalAlpha = a; ctx.fillStyle = mix(c.color, '#ffffff', 0.18); ctx.fillRect(x - w / 2, -h / 2, w, h / 2);
        ctx.fillStyle = mix(c.color, PLUM, P.shade); ctx.fillRect(x - w / 2, 0, w, h / 2);
        ctx.strokeStyle = mix(c.color, PLUM, 0.5); ctx.lineWidth = 1; ctx.strokeRect(x - w / 2, -h / 2, w, h);
      }
    });
  }
  if (joined > 0) {
    const waltz = seg(t, T.joinEnd, T.waltzEnd); const sweep = easeIn(seg(t, T.waltzEnd, T.sweepEnd));
    const fade = 1 - seg(t, T.sweepEnd - 120 * P.speed, T.sweepEnd + 120 * P.speed);
    const N = 36; const pts = [];
    const shift = sweep * (line.len + s * 4);
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      // The tail (left end) thins and catches up as the ribbon sweeps away.
      const tailCut = sweep * 0.9;
      if (u < tailCut) continue;
      const x = -half + u * half * 2 + shift * (0.55 + 0.45 * u);
      const beat = sine(waltz) * (1 - sweep * 0.5);
      const y = -Math.sin(u * Math.PI * 2 + waltz * Math.PI * 1.5) * s * P.waltz * beat - sweep * sweep * s * 1.2 * u;
      const tw = u * TAU * P.twists * 0.5 + (waltz + sweep) * Math.PI * 1.5 - Math.PI * 0.25;
      const w = s * P.width * 0.5 * Math.min(1, joined * 1.4) * (u - tailCut < 0.12 ? (u - tailCut) / 0.12 : 1);
      pts.push({ x, y, tw, w, col: colorAt(line, u) });
    }
    if (pts.length > 1) drawRibbon(ctx, pts, P, s, fade);
    // Threadlike trails from the thinning tail.
    if (sweep > 0 && pts.length) {
      const tail = pts[0]; const len = s * 3 * Math.min(1, sweep * 2);
      for (const th of st.threads) {
        ctx.globalAlpha = 0.85 * fade * (1 - seg(t, T.sweepEnd, T.end)); ctx.strokeStyle = mix(th.col, INK, 0.25); ctx.lineWidth = 1.1; ctx.lineCap = 'round';
        ctx.beginPath();
        for (let j = 0; j <= 14; j++) { const q = j / 14; const x = tail.x - q * len; const y = tail.y + th.off + Math.sin(q * 7 + th.ph + t / 120) * th.amp * q; if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
        ctx.stroke();
      }
    }
  }
  // Four-point glints where the ribbon passed.
  for (const g of st.glints) {
    const at = lerp(T.waltzEnd, T.end - 80, g.at); const a = env(t, at, at + 60, at + 90, at + 260);
    if (a > 0) sparkle(ctx, -half + g.u * half * 2, g.dy * 0.6, s * 0.3 * a, a, mix(colorAt(line, g.u), '#ffffff', 0.55), 0);
  }
  F.leave(ctx);
  ctx.globalAlpha = 1;
}

export default { id: 'pastel-a', label: 'Rejected · A · Satin Ribbon Waltz', kind: 'concept', supports: ['single'], params, presets, duration, keyframes, prepare, render };
