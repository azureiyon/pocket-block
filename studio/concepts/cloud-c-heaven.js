// Concept C — Opening Heaven.
// Feeling: a held breath, then revelation. A thin bank of evening cloud
// glides across the completed line and settles over it; it parts from the
// centre outward, and through the opening falls a crisp shaft of warm
// sunlight. Each pearl, as the light reaches it, warms, lifts slightly and is
// gone inside the beam. The shaft narrows away upward and a restrained few
// celestial sparks twinkle where the line was.
// Primary: the shaft of light (crisp edges, inner rays, warm core). Secondary:
// the parting cloud halves. Ambient: the sparks. The cloud stays thin and
// leaves quickly: the light is the subject.
// Direction: across the line, then opening outward from the centre, light
// falling downward (no other theme brings light down from above).

import { TAU, mix, seg, env, lerp, rng, premium, expoOut, quadIn, glowSprite, glint, drawSprite, frame, pearlBlock, cloudShape, drawCloud, easeOutCubic, CHAMPAGNE, WARM_WHITE, GOLD, LAVENDER } from '../../src/ui/vfx-cloud/cloud-art.js';

export const params = [
  { key: 'drift', label: 'Cloud glide in', unit: 'ms', min: 160, max: 520, step: 20, def: 280 },
  { key: 'part', label: 'Parting time', unit: 'ms', min: 240, max: 700, step: 20, def: 400 },
  { key: 'cloud', label: 'Cloud density', min: 0.4, max: 1, step: 0.05, def: 1 },
  { key: 'beam', label: 'Sunlight strength', min: 0.3, max: 1, step: 0.05, def: 0.7 },
  { key: 'rays', label: 'Inner rays', min: 0, max: 5, step: 1, def: 3 },
  { key: 'sparks', label: 'Celestial sparks', min: 0, max: 16, step: 1, def: 9 },
  { key: 'speed', label: 'Overall pace', min: 0.6, max: 1.5, step: 0.05, def: 1 },
];
export const presets = { Default: {}, 'Brisk': { drift: 200, part: 300, sparks: 6, speed: 0.85 }, 'Grand': { drift: 400, part: 600, rays: 5, sparks: 13, speed: 1.15 } };

// Cloud halves in cells, origin at the line centre; they meet (and overlap) at x = 0.
// Few, broad lobes with a flat underside: a stylised evening cloud, not a fuzzy mass.
const LEFT = [[-4.0, 0.18, 0.34], [-3.2, 0.0, 0.52], [-2.1, -0.18, 0.72], [-1.0, 0.04, 0.55], [-0.1, 0.16, 0.4], [-2.9, 0.22, 0.4], [-1.5, 0.22, 0.42]];
const RIGHT = [[0.1, 0.16, 0.38], [0.9, -0.06, 0.58], [2.0, -0.16, 0.68], [3.05, 0.04, 0.5], [3.95, 0.18, 0.34], [1.5, 0.22, 0.42], [2.8, 0.22, 0.4]];

// Short horizontal pieces for columns (clouds always lie level with the horizon).
const SHORT_L = [[-1.15, 0.16, 0.3], [-0.6, -0.08, 0.46], [-0.05, 0.12, 0.34]];
const SHORT_R = [[0.05, 0.1, 0.32], [0.6, -0.1, 0.44], [1.1, 0.16, 0.3]];

function timing(P) {
  const k = P.speed;
  const T = { in: P.drift * k };
  T.hold = T.in + 50 * k; T.partEnd = T.hold + P.part * k;
  T.beamPeak = T.hold + P.part * k * 0.6; T.beamOut = T.partEnd + 200 * k; T.beamEnd = T.beamOut + 260 * k;
  T.end = T.beamEnd + 260 * k;
  return T;
}
export const duration = (P) => timing(P).end;
export const keyframes = (P) => {
  const T = timing(P); const k = P.speed;
  return [
    [T.in * 0.55, 'Cloud', 'A thin bank of evening cloud glides across the line.'],
    [T.hold, 'Hold', 'It settles over the line for a breath.'],
    [T.hold + P.part * k * 0.25, 'Parting', 'It parts at the centre; a crisp shaft of sunlight falls through.'],
    [T.beamPeak, 'Climax', 'The shaft spans the opening; pearls warm and vanish inside it.'],
    [T.partEnd, 'Open', 'The clouds slip away; the last pearls go at the ends.'],
    [T.beamOut + 130 * k, 'Follow-through', 'The light narrows upward; celestial sparks twinkle.'],
    [T.end - 30, 'Settle', 'A clear sky over a clear line.'],
  ].map(([t, label, note]) => ({ t, label, note }));
};

export function prepare(scene, P) {
  const line = scene.lines[0]; const F = frame(line); const r = rng(71); const s = line.s; const T = timing(P); const k = P.speed;
  const half = line.len / 2 + s * 0.5;
  const gapAt = (t) => premium(seg(t, T.hold, T.partEnd)) * (half + s * 0.2); // opening half-width along the line
  const blocks = line.cells.map((c, i) => {
    const x = F.xOf(i); const reach = Math.abs(x) - s * 0.3; // the light reaches this pearl
    let lo = T.hold; let hi = T.partEnd; for (let n = 0; n < 16; n++) { const m = (lo + hi) / 2; if (gapAt(m) < reach) lo = m; else hi = m; }
    return { ...c, lx: x, lit: lo };
  });
  const sparks = Array.from({ length: P.sparks }, () => {
    const b = blocks[Math.floor(r() * 8)];
    return { x: b.x + (r() - 0.5) * s * 0.8, y: b.y + (r() - 0.5) * s * 0.6, born: b.lit + (120 + r() * 220) * k, life: (420 + r() * 300) * k, dy: -s * (0.2 + r() * 0.45), dx: (r() - 0.5) * s * 0.4, size: 0.18 + r() * 0.14, col: r() < 0.5 ? WARM_WHITE : CHAMPAGNE };
  });
  const rays = Array.from({ length: P.rays }, (_, i) => ({ f: (i + 0.5) / P.rays - 0.5 + (r() - 0.5) * 0.12, w: 0.6 + r() * 1.2, ph: r() * TAU }));
  return { line, F, T, half, gapAt, blocks, sparks, rays, left: cloudShape('heaven-l', LEFT), right: cloudShape('heaven-r', RIGHT), sl: cloudShape('heaven-sl', SHORT_L), sr: cloudShape('heaven-sr', SHORT_R), pieces: [-2.6, -0.9, 0.9, 2.6].map((c, i) => ({ c, dir: i % 2 ? 1 : -1 })) };
}

/** The light's footprint on the board: the opened part of the line, widened across it. */
function footprint(line, g, s) {
  const across = s * 0.62;
  return line.axis === 'h'
    ? { x0: line.cx - g, x1: line.cx + g, y0: line.cy - across, y1: line.cy + across }
    : { x0: line.cx - across, x1: line.cx + across, y0: line.cy - g, y1: line.cy + g };
}

function shaft(ctx, st, t, P) {
  const { line, T, gapAt, rays } = st; const s = line.s; const k = P.speed;
  const on = env(t, T.hold, T.beamPeak, T.beamOut, T.beamEnd) * P.beam;
  if (on <= 0.01) return;
  const g = Math.max(s * 0.25, gapAt(t));
  const narrow = seg(t, T.beamOut, T.beamEnd); // after the peak the shaft draws up and narrows
  const fp = footprint(line, g * (1 - 0.6 * narrow), s);
  const cx = (fp.x0 + fp.x1) / 2; const w = fp.x1 - fp.x0;
  const src = { x: cx + s * 0.7, y: Math.min(fp.y0, line.cy - s * 0.6) - s * 2.6 };
  const sw = w * 0.32 + s * 0.15;
  const bottom = lerp(fp.y1, fp.y0 - s * 0.5, quadIn(narrow));
  ctx.save();
  ctx.beginPath(); ctx.moveTo(src.x - sw / 2, src.y); ctx.lineTo(src.x + sw / 2, src.y); ctx.lineTo(fp.x1, fp.y0); ctx.lineTo(fp.x1, bottom); ctx.lineTo(fp.x0, bottom); ctx.lineTo(fp.x0, fp.y0); ctx.closePath();
  const gr = ctx.createLinearGradient(0, src.y, 0, bottom);
  gr.addColorStop(0, 'rgba(255,214,150,0)'); gr.addColorStop(0.55, 'rgba(255,214,150,.09)'); gr.addColorStop(0.9, 'rgba(255,224,170,.3)'); gr.addColorStop(1, 'rgba(255,224,170,0)');
  ctx.globalAlpha = on; ctx.fillStyle = gr; ctx.fill();
  ctx.clip();
  // Inner rays: thin brighter streaks, drifting slowly sideways.
  for (const r of rays) {
    const bx = cx + r.f * w + Math.sin(t / (520 * k) + r.ph) * s * 0.08; const tx = src.x + r.f * sw;
    const mx = lerp(tx, bx, 0.4); const my = lerp(src.y, bottom, 0.4);
    const rg = ctx.createLinearGradient(mx, my, bx, bottom); rg.addColorStop(0, 'rgba(255,247,230,0)'); rg.addColorStop(0.7, 'rgba(255,247,230,.6)'); rg.addColorStop(1, 'rgba(255,247,230,0)');
    ctx.globalAlpha = on * 0.6; ctx.strokeStyle = rg; ctx.lineWidth = r.w;
    ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(bx, bottom); ctx.stroke();
  }
  ctx.restore();
  // Crisp golden edges.
  ctx.globalAlpha = on * 0.7; ctx.strokeStyle = GOLD; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
  for (const [a, b] of [[[src.x - sw / 2, src.y], [fp.x0, fp.y0]], [[src.x + sw / 2, src.y], [fp.x1, fp.y0]]]) {
    const eg = ctx.createLinearGradient(a[0], a[1], b[0], b[1]); eg.addColorStop(0, 'rgba(232,187,88,0)'); eg.addColorStop(1, GOLD);
    ctx.strokeStyle = eg; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  }
  // Where the light lands: a thin warm line along the opening.
  ctx.globalAlpha = on * 0.8; ctx.fillStyle = CHAMPAGNE;
  if (line.axis === 'h') ctx.fillRect(fp.x0, line.cy - 1, w, 2); else ctx.fillRect(line.cx - 1, fp.y0, 2, fp.y1 - fp.y0);
}

export function render(ctx, t, st, scene, P) {
  const { line, F, T, blocks, sparks } = st; const s = line.s; const k = P.speed;
  // Pearls: under the cloud, then warmed and lifted into the light.
  for (const b of blocks) {
    const u = seg(t, b.lit, b.lit + 240 * k); if (u >= 1) continue;
    const warm = env(t, b.lit - 60 * k, b.lit, b.lit + 140 * k, b.lit + 240 * k);
    pearlBlock(ctx, b.x, b.y, s, b.color, { glow: Math.max(warm, u), clear: premium(u), lift: s * 0.14 * premium(u), size: s * (1 - 0.12 * u), alpha: 1 - premium(seg(u, 0.4, 0.85)) });
  }
  shaft(ctx, st, t, P);
  // The cloud bank: glides in from the left, holds, then its halves part outward and lift away.
  const inU = premium(seg(t, 0, T.in));
  const part = premium(seg(t, T.hold, T.partEnd));
  const out = seg(t, T.hold + P.part * k * 0.35, T.partEnd + 120 * k);
  const a = P.cloud * Math.min(1, inU * 1.6) * (1 - premium(seg(out, 0.1, 0.7)));
  if (a > 0.01 && line.axis === 'h') {
    F.enter(ctx);
    const slide = lerp(-(line.len + s * 3), 0, inU);
    const spread = part * (st.half + s * 1.4);
    const rise = -s * 0.35 * part;
    drawCloud(ctx, st.left, slide - spread, rise, s, a);
    drawCloud(ctx, st.right, slide + spread, rise * 0.8, s, a);
    // Warm rim light on the parting edges, where the sun catches them.
    const rim = env(part, 0, 0.15, 0.6, 1) * a;
    if (rim > 0.01) for (const sx of [-1, 1]) drawSprite(ctx, glowSprite(CHAMPAGNE, 0.2), slide + sx * (spread + s * 0.35), rise, s * 1.1, { alpha: rim * 0.45, sx: 0.5 });
    F.leave(ctx);
  } else if (line.axis === 'v') {
    // Column: short level clouds stacked along it, gliding in alternately from each side;
    // each parts sideways when the opening light reaches it (centre first).
    const pitch = line.len / 7;
    for (const pc of st.pieces) {
      const y = line.cy + pc.c * pitch;
      const pin = premium(seg(t, Math.abs(pc.c) * 18 * k, T.in));
      const reach = Math.abs(pc.c * pitch) - pitch * 0.4;
      let lo = T.hold; let hi = T.partEnd; for (let n = 0; n < 14; n++) { const m = (lo + hi) / 2; if (st.gapAt(m) < reach) lo = m; else hi = m; }
      const pp = premium(seg(t, lo - 60 * k, lo + 260 * k));
      const pa = P.cloud * Math.min(1, pin * 1.6) * (1 - premium(seg(pp, 0.25, 0.75)));
      if (pa <= 0.01) continue;
      const x = line.cx + pc.dir * lerp(s * 2.6, 0, pin); const spread = pp * s * 1.5; const rise = -s * 0.45 * pp;
      drawCloud(ctx, st.sl, x - spread, y + rise, s, pa);
      drawCloud(ctx, st.sr, x + spread, y + rise, s, pa);
    }
  }
  // Ambient: a restrained few celestial sparks, twinkling as they drift.
  for (const sp of sparks) {
    const u = (t - sp.born) / sp.life; if (u < 0 || u > 1) continue;
    const e = easeOutCubic(u); const tw = env(u, 0, 0.2, 0.45, 1) * (0.75 + 0.25 * Math.sin(u * 18));
    glint(ctx, sp.x + sp.dx * e, sp.y + sp.dy * e, s * sp.size * (0.6 + 0.4 * tw), sp.col, tw);
    ctx.globalAlpha = tw; ctx.fillStyle = WARM_WHITE; ctx.beginPath(); ctx.arc(sp.x + sp.dx * e, sp.y + sp.dy * e, 1, 0, TAU); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export default { id: 'cloud-c', label: 'C · Opening Heaven', kind: 'concept', supports: ['single'], params, presets, duration, keyframes, prepare, render };
