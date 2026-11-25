// Concept C — Soda Fountain.
// Feeling: a soda-fountain jet catching the light; joyful, airy, composed.
// The foam caps press down for a beat, then each soda launches a jet of
// transparent bubbles on clean parabolic arcs. Jets lean outward from the
// line's centre (a symmetric fan; on a column they alternate left and right,
// a braided fan), so the whole effect has the silhouette of a fountain crown.
// Tiny droplets trail the bubbles, a soft cream highlight sweeps through the
// crown, and the bubbles pop one by one on the way down.
// Primary: the composed arcs. Secondary: the sodas pressing and emptying into
// their jets. Ambient: droplets, the cream sweep, pops.
// Direction: up and outward on arcs, then down (a shape no other theme uses).

import { TAU, mix, seg, env, lerp, rng, premium, expoOut, quadIn, glint, sodaBlock, rimOf, bubble, droplet, pop, CREAM, WHITE } from '../art/soda-art.js';

export const params = [
  { key: 'jets', label: 'Bubbles per jet', min: 3, max: 12, step: 1, def: 8 },
  { key: 'trail', label: 'Arc trails', min: 0, max: 1, step: 0.05, def: 0.6 },
  { key: 'height', label: 'Crown height', unit: '× cell', min: 1, max: 3.5, step: 0.1, def: 2.2 },
  { key: 'fan', label: 'Fan spread', min: 0, max: 1, step: 0.05, def: 0.45 },
  { key: 'size', label: 'Bubble size', unit: '× cell', min: 0.06, max: 0.2, step: 0.01, def: 0.13 },
  { key: 'sweep', label: 'Cream highlight sweep', min: 0, max: 1, step: 0.05, def: 0.7 },
  { key: 'speed', label: 'Overall pace', min: 0.6, max: 1.5, step: 0.05, def: 1 },
];
export const presets = { Default: {}, 'Tall jet': { height: 3, fan: 0.35, jets: 6 }, 'Wide crown': { height: 1.7, fan: 0.95, size: 0.09 } };

function timing(P) {
  const k = P.speed;
  const T = { press: 110 * k, emit: 220 * k, flight: 720 * k, stagger: 24 * k };
  T.lastLaunch = T.press + 3.5 * T.stagger + T.emit;
  T.end = T.lastLaunch + T.flight + 60 * k;
  return T;
}
export const duration = (P) => timing(P).end;
export const keyframes = (P) => {
  const T = timing(P); const k = P.speed;
  return [
    [T.press * 0.75, 'Press', 'The foam caps press down for a beat.'],
    [T.press + 90 * k, 'Launch', 'The centre sodas launch jets of bubbles; the outer ones follow.'],
    [T.press + 260 * k, 'Fan', 'Jets lean outward from the centre into a fan.'],
    [T.lastLaunch + 120 * k, 'Climax', 'A full fountain crown; a soft cream highlight sweeps through it.'],
    [T.lastLaunch + T.flight * 0.5, 'Fall', 'Bubbles arc over and fall, trailing droplets.'],
    [T.lastLaunch + T.flight * 0.8, 'Pops', 'They pop one by one on the way down.'],
    [T.end - 30, 'Settle', 'A clear line.'],
  ].map(([t, label, note]) => ({ t, label, note }));
};

export function prepare(scene, P) {
  const line = scene.lines[0]; const r = rng(61); const s = line.s; const T = timing(P); const k = P.speed;
  const vert = line.axis === 'v';
  const blocks = line.cells.map((c, i) => {
    const off = (i - 3.5) / 3.5; // -1 .. 1 along the line
    const lean = vert ? (i % 2 ? 1 : -1) * (0.35 + 0.25 * Math.abs(off)) * P.fan : off * 0.9 * P.fan; // radians from vertical
    return { ...c, launch: T.press + Math.abs(i - 3.5) * T.stagger, lean, apex: s * P.height * (vert ? 0.6 : 1 - 0.35 * Math.abs(off)) /* lower on columns so the top jets stay near the board */, rim: rimOf(c.color), jet: null };
  });
  const bubbles = [];
  for (const b of blocks) for (let j = 0; j < P.jets; j++) {
    const born = b.launch + (j / P.jets) * T.emit + r() * 20 * k;
    const lean = b.lean + (r() - 0.5) * 0.16; const apex = b.apex * (0.8 + r() * 0.3);
    const tUp = T.flight * 0.42; // time to apex
    const vy = (2 * apex) / tUp; const g = vy / tUp; const vx = Math.tan(lean) * vy * 0.9;
    bubbles.push({ x: b.x + (r() - 0.5) * s * 0.3, y: b.y - s * 0.2, born, vx, vy, g, r: s * P.size * (0.7 + r() * 0.6), rim: b.rim, popAt: 0.62 + r() * 0.3, life: T.flight * (0.85 + r() * 0.2), ph: r() * TAU });
  }
  // One clean centre arc per jet (the composed trajectory, drawn as a thin fading trail).
  for (const b of blocks) { const tUp = T.flight * 0.42; const vy = (2 * b.apex) / tUp; const g = vy / tUp; b.jet = { x: b.x, y: b.y - s * 0.2, vx: Math.tan(b.lean) * vy * 0.9, vy, g }; }
  // Bounds of the crown for the cream sweep.
  const xs = blocks.map((b) => b.x); const ys = blocks.map((b) => b.y);
  const fx0 = Math.min(...xs) - s * 2; const fx1 = Math.max(...xs) + s * 2; const fy0 = Math.min(...ys) - s * P.height * 1.25; const fy1 = Math.max(...ys) + s * 0.5;
  return { line, T, blocks, bubbles, crown: { fx0, fx1, fy0, fy1 } };
}

const posOf = (b, tau) => ({ x: b.x + b.vx * tau, y: b.y - b.vy * tau + 0.5 * b.g * tau * tau });

export function render(ctx, t, st, scene, P) {
  const { line, T, blocks, bubbles, crown } = st; const s = line.s; const k = P.speed;
  // Secondary: sodas press (foam squashes down), then empty into their jets.
  for (const b of blocks) {
    const press = env(t, 0, T.press * 0.7, T.press, b.launch + 60 * k);
    const out = premium(seg(t, b.launch, b.launch + T.emit + 60 * k)); if (out >= 1) continue;
    sodaBlock(ctx, b.x, b.y + s * 0.03 * press, s, b.color, { sy: 1 - 0.08 * press, foamLift: -s * 0.05 * press, clear: out * 0.8, foam: 1 - out, bubbles: 1 - out, alpha: 1 - seg(out, 0.5, 1) });
  }
  // The cream highlight: where it is, for the sweep and for brightening bubbles.
  const su = seg(t, T.lastLaunch - 80 * k, T.lastLaunch + 360 * k); const sx = lerp(crown.fx0, crown.fx1, premium(su)); const sOn = env(su, 0, 0.15, 0.8, 1) * P.sweep;
  if (sOn > 0.01) {
    ctx.save(); ctx.beginPath(); ctx.rect(crown.fx0, crown.fy0, crown.fx1 - crown.fx0, crown.fy1 - crown.fy0); ctx.clip(); ctx.transform(1, 0, -0.35, 1, 0, 0);
    const w = s * 0.9; const g = ctx.createLinearGradient(sx - w, 0, sx + w, 0);
    g.addColorStop(0, 'rgba(255,250,240,0)'); g.addColorStop(0.5, 'rgba(255,250,240,.38)'); g.addColorStop(1, 'rgba(255,250,240,0)');
    ctx.globalAlpha = sOn; ctx.fillStyle = g; ctx.fillRect(sx - w, crown.fy0 - s, w * 2, crown.fy1 - crown.fy0 + s * 2);
    ctx.restore();
  }
  // The arcs themselves: a thin tinted trail that draws out behind each jet's leading bubble, then fades.
  if (P.trail > 0) for (const b of blocks) {
    const tau = t - b.launch; if (tau <= 0) continue; const fade = 1 - seg(tau, T.flight * 0.55, T.flight * 0.95); if (fade <= 0) continue;
    const head = Math.min(tau, T.flight * 0.8); const tail = Math.max(0, head - T.flight * 0.45);
    ctx.globalAlpha = 0.45 * fade * P.trail; ctx.strokeStyle = b.rim; ctx.lineWidth = 1.4; ctx.lineCap = 'round'; ctx.beginPath();
    for (let n = 0; n <= 16; n++) { const p = posOf(b.jet, lerp(tail, head, n / 16)); if (n) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }
    ctx.stroke();
  }
  // Primary: bubbles on their arcs, with a trailing droplet; pop on the way down.
  for (const b of bubbles) {
    const tau = (t - b.born); if (tau < 0) continue; const a = tau / b.life;
    if (a > b.popAt) { const p = posOf(b, b.popAt * b.life); pop(ctx, p.x, p.y, b.r, b.rim, (a - b.popAt) / 0.14); continue; }
    const p = posOf(b, tau); const q = posOf(b, Math.max(0, tau - 70 * k));
    droplet(ctx, q.x, q.y, Math.max(1.2, b.r * 0.32), b.rim, 0.8 * seg(a, 0.04, 0.12), Math.atan2(p.y - q.y, p.x - q.x) + Math.PI / 2);
    bubble(ctx, p.x, p.y, b.r * (0.5 + 0.5 * seg(a, 0, 0.12)), b.rim, seg(a, 0, 0.06), Math.sin(a * 16 + b.ph) * 0.05);
    const near = sOn * (1 - Math.min(1, Math.abs(p.x - sx) / (s * 0.8)));
    if (near > 0.05) glint(ctx, p.x - b.r * 0.35, p.y - b.r * 0.35, b.r * 1.1 * near, WHITE, near);
  }
  ctx.globalAlpha = 1;
}

export default { id: 'soda-c', label: 'C · Soda Fountain', kind: 'concept', supports: ['single'], params, presets, duration, keyframes, prepare, render };
