// Concept B — Sugar Crystal Transformation.
// Inspiration: luxury Japanese kohakutou (crystal candy) and magical-girl
// transformation sequences. The jelly kindles from inside, sugar frost
// crystallises across its surface, and each block becomes a faceted candy
// crystal. A beam of light passes through the facets one by one, and the
// crystals dissolve from the top into fine sugar that drifts down, leaving
// a shimmering trace. Motif: light and facets. Nothing pops or bounces.

import { TAU, mix, rgba, clamp, easeOut, easeIn, easeInOut, sine, seg, env, lerp, rng, jellyBlock, sparkle, spriteOf, drawSprite, roundRectPath, INK } from '../../src/ui/vfx-jelly/jelly-art.js';

const SP = 128;

/** Faceted candy crystal: table, crown facets in three tones, crisp edges, frost. */
function crystalSprite(color, contrast) {
  return spriteOf(`crystal|${color}|${contrast}`, SP, (ctx) => {
    const c = SP / 2; const R = SP * 0.4;
    const oct = (r, rot = Math.PI / 8) => Array.from({ length: 8 }, (_, i) => { const a = rot + (i / 8) * TAU; return [c + Math.cos(a) * r, c + Math.sin(a) * r]; });
    const outer = oct(R); const inner = oct(R * 0.52);
    const tone = (k) => mix(color, k > 0 ? '#ffffff' : INK, Math.abs(k) * contrast);
    // Crown facets: alternate light and shade around the table, lit from top-left.
    for (let i = 0; i < 8; i++) {
      const a = outer[i]; const b = outer[(i + 1) % 8]; const p = inner[(i + 1) % 8]; const q = inner[i];
      const ang = Math.PI / 8 + ((i + 0.5) / 8) * TAU;
      const lit = Math.cos(ang - (-Math.PI * 0.75)); // facing the top-left light
      ctx.fillStyle = tone(lit > 0 ? 0.15 + lit * 0.45 : lit * 0.32);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.closePath(); ctx.fill();
    }
    // Table: lighter, slightly translucent.
    const tg = ctx.createLinearGradient(c - R * 0.5, c - R * 0.5, c + R * 0.5, c + R * 0.5);
    tg.addColorStop(0, tone(0.65)); tg.addColorStop(1, tone(0.15));
    ctx.fillStyle = tg; ctx.beginPath(); inner.forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](p[0], p[1])); ctx.closePath(); ctx.fill();
    // Crisp facet edges.
    ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1.4;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) { ctx.moveTo(outer[i][0], outer[i][1]); ctx.lineTo(inner[i][0], inner[i][1]); }
    inner.forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](p[0], p[1])); ctx.closePath(); ctx.stroke();
    ctx.strokeStyle = mix(color, INK, 0.35); ctx.lineWidth = 2;
    ctx.beginPath(); outer.forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](p[0], p[1])); ctx.closePath(); ctx.stroke();
    // Frosted sugar grains on the crown.
    const r = rng(color.charCodeAt(2) * 31);
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    for (let k = 0; k < 22; k++) { const a = r() * TAU; const d = R * (0.55 + r() * 0.38); const s = 1 + r() * 1.6; ctx.fillRect(c + Math.cos(a) * d, c + Math.sin(a) * d, s, s); }
    // Specular glint on the upper-left crown facet.
    ctx.fillStyle = '#ffffff'; ctx.globalAlpha = 0.95;
    ctx.beginPath(); ctx.moveTo(c - R * 0.62, c - R * 0.34); ctx.lineTo(c - R * 0.34, c - R * 0.62); ctx.lineTo(c - R * 0.24, c - R * 0.55); ctx.lineTo(c - R * 0.55, c - R * 0.24); ctx.closePath(); ctx.fill();
  });
}

/** Sugar frost lattice drawn over a block, revealed progressively (crystal growth). */
function frostLattice(r, density) {
  const lines = [];
  const n = Math.round(5 + 6 * density);
  for (let k = 0; k < n; k++) {
    const x = r() - 0.5; const y = r() - 0.5; const a = (Math.floor(r() * 6) / 6) * Math.PI; const l = 0.18 + r() * 0.3;
    lines.push({ x, y, dx: Math.cos(a) * l, dy: Math.sin(a) * l, at: r() });
    // Short branches at 60 degrees, like real sugar crystal growth.
    lines.push({ x: x + Math.cos(a) * l * 0.5, y: y + Math.sin(a) * l * 0.5, dx: Math.cos(a + Math.PI / 3) * l * 0.4, dy: Math.sin(a + Math.PI / 3) * l * 0.4, at: Math.min(1, r() + 0.2) });
  }
  return lines;
}

export const params = [
  { key: 'glow', label: 'Inner glow', min: 0, max: 1.5, step: 0.05, def: 1 },
  { key: 'frost', label: 'Frost density', min: 0, max: 2, step: 0.1, def: 1 },
  { key: 'contrast', label: 'Facet contrast', min: 0.4, max: 1.4, step: 0.05, def: 0.9 },
  { key: 'sweep', label: 'Light sweep width', unit: '× cell', min: 0.6, max: 3, step: 0.1, def: 1.4 },
  { key: 'sweepTime', label: 'Light sweep time', unit: 'ms', min: 200, max: 900, step: 20, def: 460 },
  { key: 'dust', label: 'Sugar dust density', min: 0, max: 2, step: 0.1, def: 1 },
  { key: 'drift', label: 'Dust drift', min: 0, max: 2, step: 0.1, def: 1 },
  { key: 'linger', label: 'Lingering trace', min: 0, max: 1.5, step: 0.05, def: 1 },
  { key: 'speed', label: 'Overall pace', min: 0.6, max: 1.5, step: 0.05, def: 1 },
];
export const presets = {
  Default: {},
  'Quiet luxury': { glow: 0.7, frost: 0.6, contrast: 0.7, sweepTime: 620, dust: 0.6, speed: 1.25 },
  'Magical-girl sparkle': { glow: 1.4, frost: 1.6, contrast: 1.2, sweep: 1.8, dust: 1.7, drift: 1.4, speed: 0.9 },
};

function timing(P) {
  const k = P.speed;
  const T = { stag: 30 * k, glow: 280 * k, frost: 320 * k, morph: 200 * k };
  T.frostAt = 140 * k; T.morphAt = T.frostAt + T.frost * 0.75; T.crystal = T.morphAt + T.morph + 4 * T.stag;
  T.sweepAt = T.crystal + 60 * k; T.sweepEnd = T.sweepAt + P.sweepTime * k;
  T.dissolveAt = T.sweepEnd - 80 * k; T.dissolve = 380 * k; T.dStag = 40 * k;
  T.dustLife = 900 * k; T.lingerAt = T.dissolveAt + 8 * T.dStag + T.dissolve * 0.6;
  T.end = T.lingerAt + 700 * k * Math.max(0.4, P.linger);
  return T;
}
export const duration = (P) => timing(P).end;
export const keyframes = (P) => {
  const T = timing(P);
  return [
    { t: T.frostAt + 40, label: 'Anticipation', note: 'The jelly kindles from inside, centre cells first.' },
    { t: T.frostAt + T.frost * 0.7, label: 'Frost', note: 'Sugar crystals grow across the surface.' },
    { t: T.crystal + 20, label: 'Transformation', note: 'Each block resolves into a faceted candy crystal.' },
    { t: lerp(T.sweepAt, T.sweepEnd, 0.5), label: 'Climax', note: 'A beam of light passes through the facets one by one.' },
    { t: T.dissolveAt + 4 * T.dStag + T.dissolve * 0.55, label: 'Follow-through', note: 'Crystals dissolve from the top into falling sugar.' },
    { t: T.lingerAt + 120, label: 'Drift', note: 'Fine sugar settles and twinkles.' },
    { t: T.lingerAt + 420 * P.speed, label: 'Settle', note: 'A faint shimmering trace lingers on the row.' },
  ];
};

export function prepare(scene, P) {
  const line = scene.lines[0]; const s = line.s; const r = rng(23); const T = timing(P);
  const blocks = line.cells.map((c, k) => {
    const centre = Math.abs(k - 3.5); // centre-out kindling
    const grains = Array.from({ length: Math.round(16 * P.dust) }, () => ({ x: (r() - 0.5) * s * 0.85, y: (r() - 0.5) * s * 0.85, vy: s * (0.5 + r() * 0.9), drift: (r() - 0.5) * s * 0.4 * P.drift, ph: r() * TAU, size: 1.1 + r() * 1.6, tint: r() < 0.4 }));
    return { ...c, k, kindle: centre * T.stag, lattice: frostLattice(r, P.frost), grains, tilt: (r() - 0.5) * 0.18, glints: [r(), r()].map((u) => ({ u, x: (r() - 0.5) * s * 0.8 })), dAt: T.dissolveAt + k * T.dStag };
  });
  const trace = Array.from({ length: 22 }, (_, i) => ({ u: (i + 0.5) / 22, ph: r() }));
  return { line, T, blocks, trace };
}

export function render(ctx, t, st, scene, P) {
  const { line, T, blocks } = st; const s = line.s; const horiz = line.axis === 'h';
  const sweepPos = lerp(-0.25, 1.25, easeInOut(seg(t, T.sweepAt, T.sweepEnd)));
  // The light beam itself: a slanted shaft travelling along the row (drawn behind the crystals).
  const beamA = env(t, T.sweepAt - 40, T.sweepAt + 80, T.sweepEnd - 80, T.sweepEnd + 60);
  if (beamA > 0) {
    const bx = horiz ? lerp(line.a.x - s * 0.5, line.b.x + s * 0.5, (sweepPos + 0.25) / 1.5) : line.cx; const by = horiz ? line.cy : lerp(line.a.y - s * 0.5, line.b.y + s * 0.5, (sweepPos + 0.25) / 1.5);
    ctx.save(); ctx.translate(bx, by); ctx.rotate(horiz ? 0.35 : Math.PI / 2 + 0.35);
    const bw = s * P.sweep * 0.5; const g = ctx.createLinearGradient(-bw, 0, bw, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,253,240,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = beamA * 0.8; ctx.fillStyle = g; ctx.fillRect(-bw, -s * 1.3, bw * 2, s * 2.6); ctx.restore();
  }
  for (const b of blocks) {
    const L = t - b.kindle;
    const g = seg(L, 0, T.glow) * P.glow;
    const frost = seg(t - b.kindle, T.frostAt, T.frostAt + T.frost);
    const morph = easeInOut(seg(t - b.kindle * 0.5, T.morphAt, T.morphAt + T.morph));
    const lift = easeOut(seg(t, T.morphAt, T.crystal + 200)) * s * 0.08;
    const rot = b.tilt * sine(seg(t, T.morphAt, T.sweepEnd));
    const dis = seg(t, b.dAt, b.dAt + T.dissolve);
    const y = b.y - lift;
    // Clip away from the top as the crystal dissolves.
    ctx.save();
    if (dis > 0) { ctx.beginPath(); ctx.rect(b.x - s, y - s * 0.6 + s * 1.2 * easeIn(dis), s * 2, s * 2); ctx.clip(); }
    if (morph < 1) {
      jellyBlock(ctx, b.x, y, s, b.color, { glow: 0.35 * g, alpha: 1 - morph, rot, sx: 1 - 0.06 * morph, sy: 1 - 0.06 * morph });
      if (g > 0 && morph < 1) {
        // Luminous core: light kindling inside the jelly.
        ctx.save(); ctx.translate(b.x, y); ctx.rotate(rot); roundRectPath(ctx, s, s, s * 0.34); ctx.clip();
        const core = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.62);
        core.addColorStop(0, rgba('#ffffff', 0.9 * g * (1 - morph))); core.addColorStop(0.55, rgba('#ffffff', 0.35 * g * (1 - morph))); core.addColorStop(1, rgba(b.color, 0));
        ctx.globalAlpha = 1; ctx.fillStyle = core; ctx.fillRect(-s, -s, s * 2, s * 2); ctx.restore();
      }
      if (frost > 0) {
        ctx.save(); ctx.translate(b.x, y); ctx.rotate(rot); roundRectPath(ctx, s, s, s * 0.34); ctx.clip();
        ctx.strokeStyle = '#ffffff'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.4, s * 0.05); ctx.globalAlpha = 0.95 * (1 - morph * 0.8);
        ctx.beginPath();
        for (const l of b.lattice) { const p = seg(frost, l.at * 0.6, l.at * 0.6 + 0.4); if (p <= 0) continue; ctx.moveTo(l.x * s, l.y * s); ctx.lineTo((l.x + l.dx * p) * s, (l.y + l.dy * p) * s); }
        ctx.stroke(); ctx.restore();
      }
    }
    if (morph > 0) {
      const img = crystalSprite(b.color, P.contrast);
      const size = (s * (0.92 + 0.1 * morph)) / 0.8;
      drawSprite(ctx, img, b.x, y, size, { rot: rot + Math.PI / 8 * (1 - morph) * 0, alpha: morph });
      // Light sweep: facets flash as the beam passes.
      const u = (b.k + 0.5) / 8; const d = Math.abs(u - sweepPos) * 8 / P.sweep;
      const hit = Math.max(0, 1 - d) * morph;
      if (hit > 0.02) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawSprite(ctx, img, b.x, y, size, { rot, alpha: hit * 0.55 }); ctx.restore();
        sparkle(ctx, b.x - s * 0.22, y - s * 0.24, s * 0.95 * hit * hit, hit, '#ffffff', 0.35);
        sparkle(ctx, b.x + s * 0.2, y + s * 0.12, s * 0.4 * hit * hit, hit * 0.8, '#ffffff', 0);
      }
    }
    ctx.restore();
    // Sugar dust released at the dissolving edge, falling gently with a sway.
    if (dis > 0) {
      const edge = -s * 0.6 + s * 1.2 * easeIn(dis);
      for (const q of b.grains) {
        const rel = (q.y + s * 0.5) / s; const tr = b.dAt + T.dissolve * Math.min(1, rel * 1.05);
        const age = (t - tr) / T.dustLife; if (age < 0 || age > 1 || q.y < edge - s * 0.55) continue;
        const gx = b.x + q.x + Math.sin(age * 5 + q.ph) * q.drift * age;
        const gy = y + q.y + q.vy * age * age * 1.4 + q.vy * age * 0.3;
        const a = (1 - age) * (age < 0.1 ? age / 0.1 : 1);
        // Sugar grains carry the crystal's colour so they read on the pale board; a few pure white catch the light.
        const gs = q.size * 1.5;
        ctx.save(); ctx.translate(gx, gy); ctx.rotate(Math.PI / 4 + age * 3); ctx.globalAlpha = a; ctx.fillStyle = q.tint ? '#ffffff' : mix(b.color, INK, 0.08);
        ctx.fillRect(-gs / 2, -gs / 2, gs, gs); ctx.restore();
      }
      for (const gl of b.glints) { const a = env(dis, gl.u * 0.7, gl.u * 0.7 + 0.12, gl.u * 0.7 + 0.16, gl.u * 0.7 + 0.32); if (a > 0) sparkle(ctx, b.x + gl.x, y + s * 0.2, s * 0.26 * a, a); }
    }
  }
  // Lingering trace: a fine row of sugar glints that twinkle and fade along the line.
  const lg = env(t, T.lingerAt, T.lingerAt + 160, T.end - 300, T.end) * P.linger;
  if (lg > 0) for (const p of st.trace) {
    const x = horiz ? lerp(line.a.x - s * 0.4, line.b.x + s * 0.4, p.u) : line.cx; const y = horiz ? line.cy + s * 0.3 : lerp(line.a.y - s * 0.4, line.b.y + s * 0.4, p.u);
    const tw = 0.5 + 0.5 * Math.sin((t / 1000) * 9 + p.ph * TAU);
    const col = line.cells[Math.min(7, Math.floor(p.u * 8))].color;
    sparkle(ctx, x, y, s * 0.2 * (0.5 + tw * 0.6) * Math.min(1, lg), Math.min(1, lg) * (0.45 + tw * 0.55), tw > 0.6 ? '#ffffff' : col);
  }
  ctx.globalAlpha = 1;
}

export default { id: 'jelly-b', label: 'B · Sugar Crystal Transformation', kind: 'concept', supports: ['single'], params, presets, duration, keyframes, prepare, render };
