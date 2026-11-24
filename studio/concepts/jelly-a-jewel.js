// Concept A — Gummy Jewel Cascade.
// Inspiration: luxury fruit-gummy adverts where candies tumble into a neat
// row on a glossy shelf. Each block crouches, springs up with a twist, and
// splits into three faceted gummy jewels (heart, soft star, cabochon, drop)
// that arc over in a cascade and land, bouncing, into a jewel strand along
// the line. A glint sweeps the strand, then the jewels wink out in order.
// Motif: weight and landing. Things fall *down* and settle; nothing floats.

import { TAU, mix, rgba, easeOut, easeIn, easeInOut, easeOutBack, spring, seg, env, lerp, rng, jellyBlock, sparkle, spriteOf, drawSprite, INK } from '../art/jelly-art.js';

const SHAPES = ['heart', 'star', 'gem', 'drop'];
const SP = 128; // sprite px

function shapePath(ctx, shape, c, R) {
  ctx.beginPath();
  if (shape === 'heart') {
    ctx.moveTo(c, c + R * 0.92);
    ctx.bezierCurveTo(c - R * 1.25, c + R * 0.05, c - R * 0.75, c - R * 0.95, c, c - R * 0.38);
    ctx.bezierCurveTo(c + R * 0.75, c - R * 0.95, c + R * 1.25, c + R * 0.05, c, c + R * 0.92);
  } else if (shape === 'star') {
    // Soft five-point star: rounded tips and inner curves, like a gummy mould.
    const pts = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * TAU; const r = i % 2 ? R * 0.55 : R * 1.02; pts.push([c + Math.cos(a) * r, c + Math.sin(a) * r * 0.97 + R * 0.05]); }
    ctx.moveTo((pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2);
    for (let i = 1; i <= 10; i++) { const p = pts[i % 10]; const q = pts[(i + 1) % 10]; ctx.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
  } else if (shape === 'gem') {
    // Rounded hexagonal cabochon.
    const pts = []; for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i / 6) * TAU; pts.push([c + Math.cos(a) * R, c + Math.sin(a) * R]); }
    ctx.moveTo((pts[5][0] + pts[0][0]) / 2, (pts[5][1] + pts[0][1]) / 2);
    for (let i = 0; i < 6; i++) { const p = pts[i]; const q = pts[(i + 1) % 6]; ctx.arcTo(p[0], p[1], q[0], q[1], R * 0.28); }
  } else {
    // Drop: round base, soft point.
    ctx.moveTo(c, c - R * 1.05);
    ctx.bezierCurveTo(c + R * 0.35, c - R * 0.5, c + R * 0.92, c - R * 0.05, c + R * 0.88, c + R * 0.32);
    ctx.bezierCurveTo(c + R * 0.8, c + R * 0.98, c - R * 0.8, c + R * 0.98, c - R * 0.88, c + R * 0.32);
    ctx.bezierCurveTo(c - R * 0.92, c - R * 0.05, c - R * 0.35, c - R * 0.5, c, c - R * 1.05);
  }
  ctx.closePath();
}

/** A faceted, sugar-dusted gummy jewel. Crisp facets and a hard specular; no blur. */
function jewelSprite(shape, color) {
  return spriteOf(`jewel|${shape}|${color}`, SP, (ctx) => {
    const c = SP / 2; const R = SP * 0.36;
    shapePath(ctx, shape, c, R);
    const body = ctx.createLinearGradient(c - R, c - R, c + R, c + R);
    body.addColorStop(0, mix(color, '#ffffff', 0.5)); body.addColorStop(0.45, color); body.addColorStop(1, mix(color, INK, 0.28));
    ctx.globalAlpha = 0.94; ctx.fillStyle = body; ctx.fill();
    ctx.save(); ctx.clip();
    // Light passing through the gummy pools at the lower right.
    const glow = ctx.createRadialGradient(c + R * 0.35, c + R * 0.45, 0, c + R * 0.35, c + R * 0.45, R * 0.8);
    glow.addColorStop(0, 'rgba(255,255,255,.55)'); glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = 1; ctx.fillStyle = glow; ctx.fillRect(0, 0, SP, SP);
    // A crisp top-left facet plane.
    ctx.fillStyle = 'rgba(255,255,255,.32)';
    ctx.beginPath(); ctx.moveTo(c - R * 1.2, c - R * 0.15); ctx.lineTo(c - R * 0.1, c - R * 1.2); ctx.lineTo(c + R * 0.25, c - R * 1.2); ctx.lineTo(c - R * 1.2, c + R * 0.3); ctx.closePath(); ctx.fill();
    // Sugar coating: tiny crisp crystals.
    const r = rng(shape.length * 97 + color.charCodeAt(1));
    ctx.fillStyle = 'rgba(255,255,255,.8)';
    for (let k = 0; k < 14; k++) { const x = c + (r() - 0.5) * R * 1.5; const y = c + (r() - 0.5) * R * 1.5; const s = 1.2 + r() * 1.6; ctx.save(); ctx.translate(x, y); ctx.rotate(r() * TAU); ctx.fillRect(-s / 2, -s / 2, s, s); ctx.restore(); }
    ctx.restore();
    // Inner bevel line and coloured rim give it volume like a moulded candy.
    ctx.save(); ctx.translate(c, c); ctx.scale(0.8, 0.8); ctx.translate(-c, -c); shapePath(ctx, shape, c, R); ctx.restore();
    ctx.globalAlpha = 0.45; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = R * 0.06; ctx.stroke();
    shapePath(ctx, shape, c, R); ctx.globalAlpha = 0.7; ctx.strokeStyle = mix(color, INK, 0.35); ctx.lineWidth = R * 0.05; ctx.stroke();
    // Hard specular: a curved streak and a pin-point.
    ctx.globalAlpha = 0.95; ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(c - R * 0.38, c - R * 0.36, R * 0.24, R * 0.09, -0.75, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(c - R * 0.02, c - R * 0.62, R * 0.06, 0, TAU); ctx.fill();
  });
}

export const params = [
  { key: 'stagger', label: 'Cascade stagger', unit: 'ms', min: 20, max: 80, step: 5, def: 45 },
  { key: 'squash', label: 'Crouch squash', min: 0, max: 0.3, step: 0.01, def: 0.16 },
  { key: 'hop', label: 'Jewel arc height', unit: '× cell', min: 0.5, max: 3, step: 0.1, def: 1.8 },
  { key: 'tumble', label: 'Tumble', unit: '°', min: 0, max: 540, step: 10, def: 240 },
  { key: 'size', label: 'Jewel size', unit: '× cell', min: 0.3, max: 0.9, step: 0.02, def: 0.68 },
  { key: 'per', label: 'Jewels per block', min: 1, max: 3, step: 1, def: 2 },
  { key: 'bounce', label: 'Landing bounce', min: 0, max: 0.5, step: 0.02, def: 0.26 },
  { key: 'glint', label: 'Strand glint', min: 0, max: 1.5, step: 0.05, def: 1 },
  { key: 'sparkles', label: 'Sparkle density', min: 0, max: 2, step: 0.1, def: 1 },
  { key: 'speed', label: 'Overall pace', min: 0.6, max: 1.5, step: 0.05, def: 1 },
];
export const presets = {
  Default: {},
  'Gentle & neat': { stagger: 60, hop: 1.1, tumble: 120, bounce: 0.16, speed: 1.2 },
  'Bouncy & lively': { stagger: 35, hop: 2.2, tumble: 380, bounce: 0.4, speed: 0.85 },
};

function timing(P) {
  const k = P.speed;
  const T = { crouch: 90 * k, rebound: 130 * k, split: 40 * k, fly: 560 * k, jewelGap: 28 * k, hold: 360 * k, exitGap: 32 * k, exit: 260 * k };
  T.flyStart = T.crouch + T.rebound + T.split; // per block, relative
  T.landAll = 7 * P.stagger + T.flyStart + (P.per - 1) * T.jewelGap + T.fly;
  T.sweep = T.landAll + 40 * k;
  T.exitStart = T.landAll + T.hold;
  T.end = T.exitStart + 8 * P.per * T.exitGap + T.exit + 120 * k;
  return T;
}
export const duration = (P) => timing(P).end;
export const keyframes = (P) => {
  const T = timing(P); const st = P.stagger;
  return [
    { t: 3 * st + T.crouch * 0.8, label: 'Anticipation', note: 'The row crouches in a rippling cascade, left to right.' },
    { t: 3 * st + T.crouch + T.rebound * 0.8, label: 'Rebound', note: 'Each gummy springs up, stretching and twisting.' },
    { t: 4 * st + T.flyStart + 20 * P.speed, label: 'Split', note: 'A crisp sparkle: each block becomes three gummy jewels.' },
    { t: 7 * st + T.flyStart + T.fly * 0.42, label: 'Climax', note: 'Jewels tumble over in a cascading arc.' },
    { t: T.landAll + 70 * P.speed, label: 'Follow-through', note: 'They land with a squash and settle into a strand.' },
    { t: T.sweep + 200 * P.speed, label: 'Glint', note: 'A glint runs along the jewel strand.' },
    { t: T.exitStart + 8 * P.per * T.exitGap * 0.55, label: 'Settle', note: 'Jewels wink out one by one, leaving sparkles.' },
  ];
};

export function prepare(scene, P) {
  const line = scene.lines[0]; const s = line.s; const n = P.per; const r = rng(7);
  const T = timing(P);
  const horiz = line.axis === 'h';
  const total = 8 * n;
  const span = line.len + s * 0.7;
  const jewels = [];
  line.cells.forEach((c, k) => {
    for (let j = 0; j < n; j++) {
      const idx = k * n + j;
      const u = (idx + 0.5) / total;
      const tx = horiz ? line.a.x - s * 0.35 + span * u : line.cx;
      const ty = horiz ? line.cy + s * 0.12 : line.a.y - s * 0.35 + span * u;
      const start = k * P.stagger + T.flyStart + j * T.jewelGap;
      jewels.push({
        k, j, idx, color: c.color, shape: SHAPES[(k + j * 2) % SHAPES.length],
        ox: c.x + (j - (n - 1) / 2) * s * 0.3, oy: c.y - s * 0.1, tx, ty,
        start, end: start + T.fly * (0.92 + r() * 0.16),
        h: s * P.hop * (0.8 + r() * 0.4), spin: (P.tumble * Math.PI / 180) * (r() < 0.5 ? -1 : 1) * (0.8 + r() * 0.4),
        rest: (r() - 0.5) * 0.35, size: s * P.size * (j === 0 ? 1.08 : 0.92 + r() * 0.1),
        exit: T.exitStart + idx * T.exitGap,
        glints: Array.from({ length: Math.round(P.sparkles * 1.5) }, () => ({ at: T.sweep + r() * T.hold * 0.8, dx: (r() - 0.5) * s * 0.7, dy: -s * (0.2 + r() * 0.4) })),
      });
    }
  });
  return { line, T, jewels, horiz };
}

export function render(ctx, t, st, scene, P) {
  const { line, T, jewels } = st; const s = line.s;
  // Ambient: a soft pastel shelf glow under the strand while it holds.
  const shelf = env(t, T.landAll - 200, T.landAll, T.exitStart, T.end - 100);
  if (shelf > 0) {
    const g = ctx.createLinearGradient(0, line.cy - s * 0.6, 0, line.cy + s * 0.7);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.6, rgba('#ffd1e1', 0.6 * shelf)); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(line.a.x - s * 0.8, line.cy - s * 0.6, line.len + s * 1.6, s * 1.3);
  }
  // Blocks: crouch, rebound and twist, then give way to their jewels.
  line.cells.forEach((c, k) => {
    const L = t - k * P.stagger;
    if (L >= T.flyStart) return;
    let sx = 1; let sy = 1; let y = c.y; let rot = 0; let glow = 0;
    if (L > 0 && L <= T.crouch) { const e = easeOut(L / T.crouch); sx = 1 + P.squash * 0.85 * e; sy = 1 - P.squash * e; y += s * P.squash * 0.5 * e; }
    else if (L > T.crouch) {
      const e = easeOutBack(seg(L, T.crouch, T.crouch + T.rebound), 2.2);
      sx = 1 + P.squash * 0.85 - (P.squash * 0.85 + 0.12) * e; sy = 1 - P.squash + (P.squash + 0.14) * e;
      y = c.y + s * P.squash * 0.5 - s * 0.32 * e; rot = (k % 2 ? 1 : -1) * 0.18 * e;
      glow = 0.4 * seg(L, T.crouch + T.rebound, T.flyStart);
    }
    jellyBlock(ctx, c.x, y, s, c.color, { sx, sy, rot, glow, shadow: 1 });
  });
  // Split sparkles (crisp four-point, never a circle).
  line.cells.forEach((c, k) => {
    const L = t - k * P.stagger - T.flyStart;
    const a = env(L, -20, 10, 30, 160);
    if (a > 0) { sparkle(ctx, c.x, c.y - s * 0.3, s * 0.8 * a, a, '#ffffff', 0.2); sparkle(ctx, c.x + s * 0.3, c.y - s * 0.55, s * 0.35 * a, a * 0.8, '#ffffff', 0.7); }
  });
  // Contact shadows first, then jewels.
  for (const jw of jewels) {
    if (t < jw.start) continue;
    const landed = t >= jw.end; const p = seg(t, jw.start, jw.end);
    const h = landed ? 0 : 4 * jw.h * p * (1 - p);
    const near = 1 - Math.min(1, h / (s * 1.2));
    const out = t > jw.exit ? seg(t, jw.exit, jw.exit + T.exit) : 0;
    const x = lerp(jw.ox, jw.tx, easeInOut(p));
    const baseY = lerp(jw.oy, jw.ty, easeInOut(p));
    if (near > 0 && out < 1) { ctx.globalAlpha = 0.18 * near * (1 - out); ctx.fillStyle = '#c0507a'; ctx.beginPath(); ctx.ellipse(x, jw.ty + jw.size * 0.42, jw.size * 0.38 * (0.6 + 0.4 * near), jw.size * 0.08, 0, 0, TAU); ctx.fill(); }
    jw._x = x; jw._y = baseY - h; jw._out = out; jw._p = p; jw._landed = landed;
  }
  for (const jw of jewels) {
    if (t < jw.start || jw._out >= 1) continue;
    const tl = (t - jw.end) / 1000;
    let sx = 1; let sy = 1; let rot;
    if (!jw._landed) { rot = jw.spin * easeOut(jw._p); if (jw._p > 0.999) rot = jw.spin; const stretch = 0.12 * Math.sin(Math.PI * jw._p); sx = 1 - stretch * 0.6; sy = 1 + stretch; }
    else {
      const sq = P.bounce * spring(tl, 2.6, 7); sx = 1 + sq; sy = 1 - sq;
      // Land on the nearest upright-ish angle, then settle to a slight resting tilt.
      const land = Math.atan2(Math.sin(jw.spin), Math.cos(jw.spin));
      rot = jw.rest + (land - jw.rest) * spring(tl, 1.4, 8);
    }
    const pop = jw._out > 0 ? (jw._out < 0.25 ? 1 + 0.18 * easeOut(jw._out / 0.25) : 1.18 * (1 - easeIn((jw._out - 0.25) / 0.75))) : 1;
    const img = jewelSprite(jw.shape, jw.color);
    const size = jw.size * pop / 0.72;
    drawSprite(ctx, img, jw._x, jw._y - (jw._landed ? jw.size * 0.5 * (1 - sy) : 0) - jw._out * s * 0.25, size, { rot, sx, sy, alpha: 1 });
    // Glint sweep: the strand catches light as a highlight travels along it.
    if (P.glint > 0) {
      const sweepX = lerp(st.line.a.x - s, st.line.b.x + s, seg(t, T.sweep, T.sweep + 420 * P.speed));
      const d = Math.abs((st.horiz ? jw._x : jw._y) - (st.horiz ? sweepX : lerp(st.line.a.y - s, st.line.b.y + s, seg(t, T.sweep, T.sweep + 420 * P.speed))));
      const hit = Math.max(0, 1 - d / (s * 0.7)) * P.glint * (jw._landed ? 1 : 0) * (1 - jw._out);
      if (hit > 0.05) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; drawSprite(ctx, img, jw._x, jw._y, size, { rot, sx, sy, alpha: hit * 0.45 }); ctx.restore(); if (hit > 0.75) sparkle(ctx, jw._x - jw.size * 0.15, jw._y - jw.size * 0.3, jw.size * 0.5 * hit, hit, '#ffffff', 0.3); }
    }
    for (const g of jw.glints) { const a = env(t, g.at, g.at + 70, g.at + 90, g.at + 230); if (a > 0) sparkle(ctx, jw._x + g.dx * 0.5, jw._y + g.dy * 0.6, s * 0.16 * a, a); }
    // Wink out: a final sparkle where each jewel was.
    if (jw._out > 0.25) { const a = env(jw._out, 0.25, 0.45, 0.6, 1); sparkle(ctx, jw._x, jw._y - s * 0.25 * jw._out, jw.size * 0.7 * a, a, '#ffffff', 0.4); }
  }
  ctx.globalAlpha = 1;
}

export default { id: 'jelly-a', label: 'A · Gummy Jewel Cascade', kind: 'concept', supports: ['single'], params, presets, duration, keyframes, prepare, render };
