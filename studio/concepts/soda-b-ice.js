// Concept B — Ice and Refraction.
// Feeling: ice clinking in a cold glass; cool, clear, delicate. Each soda
// turns translucent and a narrow refracted highlight (with faint cyan and
// pink fringes) slides across the line. Then each block separates into a few
// small rounded ice pieces in its own soda tint. They drift apart, turning
// slowly, each catching a glint of light at its own moment, then soften,
// round off and melt into delicate droplets that fall a little and fade.
// Primary: the ice pieces turning and catching light. Secondary: the
// refraction sweep and the clearing soda. Ambient: droplets.
// Rounded, soft-cornered and tinted like soda ice, never faceted gems.

import { TAU, mix, seg, env, lerp, rng, premium, expoOut, quadIn, glint, sodaBlock, rimOf, droplet, WHITE } from '../art/soda-art.js';

export const params = [
  { key: 'pieces', label: 'Ice pieces per block', min: 3, max: 6, step: 1, def: 4 },
  { key: 'drift', label: 'Drift apart', unit: '× cell', min: 0.05, max: 0.6, step: 0.05, def: 0.28 },
  { key: 'turn', label: 'Turn', unit: 'rad', min: 0, max: 1.5, step: 0.05, def: 0.7 },
  { key: 'refract', label: 'Refraction sweep', min: 0, max: 1, step: 0.05, def: 0.85 },
  { key: 'drops', label: 'Droplets per piece', min: 0, max: 2, step: 1, def: 1 },
  { key: 'speed', label: 'Overall pace', min: 0.6, max: 1.5, step: 0.05, def: 1 },
];
export const presets = { Default: {}, 'Crushed ice': { pieces: 6, drift: 0.2, turn: 1 }, 'Big cubes': { pieces: 3, drift: 0.38, turn: 0.45 } };

function timing(P) {
  const k = P.speed;
  const T = { frost: 150 * k, sweepA: 70 * k, sweepB: 330 * k, crack: 300 * k, sep: 280 * k, melt: 280 * k, drop: 300 * k };
  T.meltA = T.crack + T.sep * 0.75; T.meltB = T.meltA + T.melt;
  T.end = 3.5 * 16 * k + T.meltB + T.drop + 40 * k;
  return T;
}
export const duration = (P) => timing(P).end;
export const keyframes = (P) => {
  const T = timing(P); const k = P.speed;
  return [
    [T.frost * 0.8, 'Frost', 'The sodas turn translucent and cool.'],
    [lerp(T.sweepA, T.sweepB, 0.55), 'Refraction', 'A refracted highlight with faint colour fringes slides across.'],
    [T.crack + T.sep * 0.35, 'Separate', 'Each block parts into small rounded ice pieces.'],
    [T.crack + T.sep * 0.8, 'Climax', 'The pieces drift apart, turning, each catching a glint.'],
    [lerp(T.meltA, T.meltB, 0.6), 'Melt', 'They soften and round off.'],
    [T.meltB + T.drop * 0.45, 'Droplets', 'They melt into droplets that fall a little.'],
    [T.end - 30, 'Settle', 'The last droplets fade.'],
  ].map(([t, label, note]) => ({ t, label, note }));
};

/** Split a block of side s into n rounded pieces (rects in block-local units), deterministic. */
function pieces(n, r) {
  const cut = 0.42 + r() * 0.16; const out = [];
  const L = Math.ceil(n / 2); const R = n - L;
  const col = (x0, x1, m) => { let y = -0.5; for (let i = 0; i < m; i++) { const y1 = i === m - 1 ? 0.5 : -0.5 + ((i + 1) / m) + (r() - 0.5) * 0.12; out.push({ x0, x1, y0: y, y1 }); y = y1; } };
  col(-0.5, cut - 0.5, L); col(cut - 0.5, 0.5, R);
  return out;
}

export function prepare(scene, P) {
  const line = scene.lines[0]; const r = rng(53); const s = line.s; const k = P.speed;
  const blocks = line.cells.map((c, i) => {
    const o = Math.abs(i - 3.5) * 16 * k; const rim = rimOf(c.color); // ice reads lighter than the soda
    const ps = pieces(P.pieces, r).map((p) => {
      const cx = (p.x0 + p.x1) / 2; const cy = (p.y0 + p.y1) / 2; const len = Math.hypot(cx, cy) || 0.1;
      // Pieces drift mostly outward along the line, barely across it, so the line stays one line.
      return { ...p, cx: cx * 0.85, cy: cy * 0.55, w: (p.x1 - p.x0) * 0.86, h: (p.y1 - p.y0) * 0.8, dx: cx / len, dy: (cy / len) * 0.3, spin: (r() - 0.5) * 2 * P.turn, glintAt: 0.35 + r() * 0.5, lag: r() * 50 * k,
        drops: Array.from({ length: P.drops }, () => ({ ox: (r() - 0.5) * 0.2, fall: 0.35 + r() * 0.4 })) };
    });
    return { ...c, o, rim, ice: mix(c.color, WHITE, 0.4), ps };
  });
  return { line, T: timing(P), blocks };
}

export function render(ctx, t, st, scene, P) {
  const { line, T, blocks } = st; const s = line.s; const k = P.speed;
  for (const b of blocks) {
    const L = t - b.o;
    // Frost: the soda clears before it parts.
    if (L < T.crack + 40 * k) {
      const f = premium(seg(L, 0, T.frost));
      sodaBlock(ctx, b.x, b.y, s, b.color, { clear: f * 0.75, foam: 1 - f * 0.8, bubbles: 1 - f, alpha: 1 - seg(L, T.crack - 20 * k, T.crack + 40 * k) });
      // Refraction: a narrow slanted highlight with cyan and pink fringes, passing along the line.
      const u = seg(t, T.sweepA, T.sweepB); const lineU = (b.x - line.cells[0].x + (b.y - line.cells[0].y)) / (line.len || 1);
      const local = (u * 1.4 - 0.2 - lineU) * 3; // -1..1 while the highlight crosses this block
      if (P.refract > 0 && local > -1 && local < 1) {
        ctx.save(); ctx.translate(b.x, b.y); ctx.beginPath(); ctx.rect(-s / 2, -s / 2, s, s); ctx.clip(); ctx.transform(1, 0, -0.5, 1, 0, 0);
        const x = local * s * 0.7; const a = (1 - Math.abs(local)) * P.refract;
        ctx.globalAlpha = a * 0.5; ctx.fillStyle = '#7fe8ff'; ctx.fillRect(x - s * 0.13, -s, s * 0.04, s * 2);
        ctx.fillStyle = '#ffb3d9'; ctx.fillRect(x + s * 0.09, -s, s * 0.04, s * 2);
        ctx.globalAlpha = a * 0.85; ctx.fillStyle = WHITE; ctx.fillRect(x - s * 0.08, -s, s * 0.16, s * 2);
        ctx.restore();
      }
    }
    // Ice pieces: part, drift and turn, glint, then soften and melt into droplets.
    const sep = seg(L, T.crack, T.crack + T.sep); if (sep <= 0) continue;
    for (const p of b.ps) {
      const e = expoOut(sep); const m = premium(seg(L, T.meltA + p.lag, T.meltB + p.lag));
      const px = b.x + (p.cx + p.dx * P.drift * e) * s; const py = b.y + (p.cy + p.dy * P.drift * e) * s + s * 0.12 * m;
      if (m < 1) {
        const w = p.w * s * (1 - 0.65 * m); const h = p.h * s * (1 - 0.65 * m); const rr = Math.min(w, h) * (0.28 + 0.22 * m);
        ctx.save(); ctx.translate(px, py); ctx.rotate(p.spin * e);
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(-w / 2, -h / 2, w, h, rr) : ctx.rect(-w / 2, -h / 2, w, h);
        // Solid soda-tinted ice: a tinted body brighter at the top, a fine rim in the soda's hue.
        // Clear and frosty at the top, the soda's tint gathering towards the bottom (ice, not gummy candy).
        const ig = ctx.createLinearGradient(0, -h / 2, 0, h / 2); ig.addColorStop(0, 'rgba(255,255,255,.85)'); ig.addColorStop(0.55, mix(b.ice, WHITE, 0.55)); ig.addColorStop(1, b.ice);
        ctx.globalAlpha = (1 - m * 0.4) * 0.72; ctx.fillStyle = ig; ctx.fill();
        ctx.globalAlpha = (1 - m * 0.5) * 0.85; ctx.lineWidth = 1; ctx.strokeStyle = b.rim; ctx.stroke();
        // A soft white highlight on the upper-left edge (clear ice, not facets).
        ctx.globalAlpha = (1 - m) * 0.9; ctx.strokeStyle = WHITE; ctx.lineWidth = Math.max(1, Math.min(w, h) * 0.12); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-w / 2 + rr * 0.9, -h / 2 + h * 0.22); ctx.lineTo(-w / 2 + rr * 0.9, -h / 2 + rr * 0.9); ctx.lineTo(-w / 2 + w * 0.45, -h / 2 + rr * 0.9); ctx.stroke();
        ctx.restore();
        // Each piece catches the light once as it turns.
        const g = env(e, p.glintAt - 0.12, p.glintAt, p.glintAt + 0.04, p.glintAt + 0.22) * (1 - m);
        if (g > 0) glint(ctx, px + w * 0.25, py - h * 0.25, s * 0.2 * g, WHITE, g);
      }
      // Droplets: as the piece finishes melting it falls a little as a drop and fades.
      for (const d of p.drops) {
        const u = seg(L, T.meltA + p.lag + T.melt * 0.7, T.meltB + p.lag + T.drop); if (u <= 0 || u >= 1) continue;
        droplet(ctx, px + d.ox * s, py + s * d.fall * quadIn(u), 2.4 * (1 - u * 0.3), b.rim, (1 - quadIn(u)) * seg(u, 0, 0.15) * 0.95);
      }
    }
  }
  ctx.globalAlpha = 1;
}

export default { id: 'soda-b', label: 'B · Ice and Refraction', kind: 'concept', supports: ['single'], params, presets, duration, keyframes, prepare, render };
