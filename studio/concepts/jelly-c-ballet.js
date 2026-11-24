// Concept C — Candy Ballet.
// Inspiration: magical-girl ensemble poses and wind-up toy chorus lines. The
// blocks themselves are the dancers: a crouch ripples down the row, they hop
// and pirouette in canon, hold an arched pose together, tilt as one, then
// leave in a follow-the-leader line along a looping path, trailing ribbons of
// their own colour, and vanish with a wink and a little heart.
// Motif: character and rhythm. No particles carry the story; the blocks do.

import { TAU, mix, rgba, easeOut, easeIn, easeInOut, easeOutBack, sine, spring, seg, env, lerp, rng, jellyBlock, sparkle, spriteOf, drawSprite, INK } from '../art/jelly-art.js';

export const params = [
  { key: 'stagger', label: 'Canon stagger', unit: 'ms', min: 20, max: 90, step: 5, def: 45 },
  { key: 'crouch', label: 'Crouch depth', min: 0, max: 0.35, step: 0.01, def: 0.22 },
  { key: 'hop', label: 'Hop height', unit: '× cell', min: 0.4, max: 2.2, step: 0.05, def: 1.05 },
  { key: 'turns', label: 'Pirouette turns', min: 0, max: 2, step: 0.25, def: 1 },
  { key: 'arch', label: 'Arch formation', min: 0, max: 1.2, step: 0.05, def: 0.55 },
  { key: 'trail', label: 'Trail length', unit: '× cell', min: 0, max: 5, step: 0.25, def: 2.5 },
  { key: 'trailW', label: 'Trail width', min: 0.1, max: 0.7, step: 0.02, def: 0.42 },
  { key: 'sparkles', label: 'Sparkle density', min: 0, max: 2, step: 0.1, def: 1 },
  { key: 'faces', label: 'Little faces', min: 0, max: 1, step: 1, def: 1 },
  { key: 'speed', label: 'Overall pace', min: 0.6, max: 1.5, step: 0.05, def: 1 },
];
export const presets = {
  Default: {},
  'Prima ballerina': { stagger: 60, hop: 1.4, turns: 1, arch: 0.8, trail: 3.2, trailW: 0.24, speed: 1.15 },
  'Chorus line': { stagger: 30, crouch: 0.28, hop: 0.85, turns: 0.5, arch: 0.2, trail: 1.8, speed: 0.9 },
  'No faces': { faces: 0 },
};

function timing(P) {
  const k = P.speed;
  const T = { crouch: 120 * k, hop: 300 * k, spinEnd: 360 * k, pose: 150 * k, gap: 80 * k, depart: 760 * k, finale: 360 * k };
  T.allApex = 7 * P.stagger + T.crouch + T.hop;
  T.tilt = T.allApex + 40 * k;
  T.departAt = T.tilt + T.pose;
  T.end = T.departAt + T.depart + 7 * T.gap * 0 + T.finale;
  return T;
}
export const duration = (P) => timing(P).end;
export const keyframes = (P) => {
  const T = timing(P); const st = P.stagger;
  return [
    { t: 2 * st + T.crouch * 0.8, label: 'Anticipation', note: 'A crouch ripples down the row like a chorus line.' },
    { t: 3 * st + T.crouch + T.hop * 0.4, label: 'Hop', note: 'They spring up in canon, stretching tall.' },
    { t: 5 * st + T.crouch + T.hop * 0.7, label: 'Pirouette', note: 'Each one spins as it rises.' },
    { t: T.tilt + T.pose * 0.6, label: 'Pose', note: 'All eight hold an arch together and tilt as one.' },
    { t: T.departAt + T.depart * 0.32, label: 'Climax', note: 'Follow the leader: they leave in a line, trailing ribbons.' },
    { t: T.departAt + T.depart * 0.72, label: 'Follow-through', note: 'The line loops up and away off the board.' },
    { t: T.departAt + T.depart + T.finale * 0.35, label: 'Settle', note: 'A wink and a tiny glossy heart close the show.' },
  ];
};

/** Polyline path sampler with cumulative length. */
function sampler(pts) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = cum[cum.length - 1];
  return {
    total,
    at(d) {
      d = Math.max(0, Math.min(total, d));
      let i = 1; while (i < cum.length - 1 && cum[i] < d) i++;
      const u = (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
      const a = pts[i - 1]; const b = pts[i];
      return { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
    },
  };
}

function bez(p0, p1, p2, p3, n) {
  const out = [];
  for (let i = 1; i <= n; i++) { const t = i / n; const u = 1 - t; out.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); }
  return out;
}

function heartSprite() {
  return spriteOf('ballet-heart', 96, (ctx) => {
    const c = 48; const R = 34;
    ctx.beginPath(); ctx.moveTo(c, c + R * 0.9); ctx.bezierCurveTo(c - R * 1.25, c + R * 0.05, c - R * 0.75, c - R * 0.95, c, c - R * 0.35); ctx.bezierCurveTo(c + R * 0.75, c - R * 0.95, c + R * 1.25, c + R * 0.05, c, c + R * 0.9); ctx.closePath();
    const g = ctx.createLinearGradient(c - R, c - R, c + R, c + R); g.addColorStop(0, '#ffc2d6'); g.addColorStop(0.5, '#ff6f91'); g.addColorStop(1, '#d9466e');
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#c23d63'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.ellipse(c - R * 0.4, c - R * 0.25, R * 0.2, R * 0.1, -0.8, 0, TAU); ctx.fill();
  });
}

function face(ctx, x, y, s, rot, sx, sy, happy, alpha) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sx, sy); ctx.globalAlpha = alpha * 0.85;
  ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineWidth = Math.max(1.2, s * 0.045); ctx.lineCap = 'round';
  const ex = s * 0.15; const ey = s * 0.04;
  if (happy) { for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(d * ex, ey + s * 0.03, s * 0.055, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); } }
  else { for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(d * ex, ey, s * 0.035, 0, TAU); ctx.fill(); } }
  ctx.beginPath(); ctx.arc(0, ey + s * 0.1, s * 0.05, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  ctx.globalAlpha = alpha * 0.4; ctx.fillStyle = '#ff5c8a';
  for (const d of [-1, 1]) { ctx.beginPath(); ctx.ellipse(d * s * 0.25, ey + s * 0.1, s * 0.07, s * 0.04, 0, 0, TAU); ctx.fill(); }
  ctx.restore();
}

export function prepare(scene, P) {
  const line = scene.lines[0]; const s = line.s; const T = timing(P); const r = rng(41);
  const horiz = line.axis === 'h';
  const apexOf = (k) => { const u = (k - 3.5) / 3.5; return s * P.hop * (1 + P.arch * (1 - u * u)); };
  const apex = line.cells.map((c, k) => (horiz ? [c.x, c.y - apexOf(k)] : [c.x - apexOf(k), c.y]));
  // The shared path: through the arch of apex positions, then a looping exit swoop off the top right.
  const last = apex[7]; const B = scene.bounds;
  const exitEnd = [B.x1 + s * 0.2, B.y0 - s * 1.8];
  const loop = bez(last, [last[0] + s * 2.2, last[1] - s * 0.2], [last[0] + s * 1.4, last[1] - s * 2.8], [last[0] - s * 0.2, last[1] - s * 2.1], 18)
    .concat(bez([last[0] - s * 0.2, last[1] - s * 2.1], [last[0] - s * 1.2, last[1] - s * 1.6], [last[0] + s * 0.4, last[1] - s * 3.6], exitEnd, 18));
  const path = sampler([...apex, ...loop]);
  const startD = apex.map((_, k) => sampler(apex.slice(0, k + 1)).total);
  const travel = path.total - startD[0];
  const sparks = Array.from({ length: Math.round(24 * P.sparkles) }, () => ({ d: startD[7] + r() * (path.total - startD[7]), off: (r() - 0.5) * s * 0.5, size: 0.12 + r() * 0.14, life: 260 + r() * 260 }));
  return { line, T, apex, path, startD, travel, sparks, horiz, apexOf };
}

export function render(ctx, t, st, scene, P) {
  const { line, T, path, startD, travel, horiz } = st; const s = line.s;
  const departP = easeIn(seg(t, T.departAt, T.departAt + T.depart)) * 0.86 + 0.14 * seg(t, T.departAt, T.departAt + T.depart);
  const dTravel = departP * travel;
  // Trails first (behind the dancers): tapered ribbons following each dancer's path.
  if (t > T.departAt && P.trail > 0) {
    for (let k = 7; k >= 0; k--) {
      const c = line.cells[k]; const head = startD[k] + dTravel; if (head > path.total + s * P.trail) continue;
      const tail = Math.max(startD[k], head - s * P.trail * (0.4 + 0.6 * departP));
      const N = 18; const fade = 1 - seg(head, path.total - s * 0.5, path.total + s * P.trail);
      ctx.lineCap = 'round';
      for (let i = 0; i < N; i++) {
        const d0 = lerp(tail, Math.min(head, path.total), i / N); const d1 = lerp(tail, Math.min(head, path.total), (i + 1) / N);
        const a = path.at(d0); const b = path.at(d1); const w = (i + 1) / N;
        ctx.globalAlpha = 0.9 * Math.sqrt(w) * fade; ctx.strokeStyle = mix(c.color, '#ffffff', 0.15); ctx.lineWidth = s * P.trailW * w;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        ctx.globalAlpha = 0.9 * w * fade; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = s * P.trailW * w * 0.3;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
    // Sparkles left along the loop after the leader passes.
    const lead = startD[7] + dTravel;
    for (const sp of st.sparks) {
      const age = (lead - sp.d) / (s * 0.9) * 140; // ms-ish after the leader passed
      const a = age > 0 ? env(age, 0, 60, 90, sp.life) : 0;
      if (a > 0) { const q = path.at(sp.d); sparkle(ctx, q.x - Math.sin(q.ang) * sp.off, q.y + Math.cos(q.ang) * sp.off, s * sp.size * 1.2, a); }
    }
  }
  // Dancers.
  for (let k = 7; k >= 0; k--) {
    const c = line.cells[k];
    const L = t - k * P.stagger;
    let x = c.x; let y = c.y; let sx = 1; let sy = 1; let rot = 0; let alpha = 1; let scale = 1; let happy = false;
    const up = st.apexOf(k);
    if (L > 0 && L <= T.crouch) {
      const e = easeOut(L / T.crouch); sx = 1 + P.crouch * 0.75 * e; sy = 1 - P.crouch * e;
      if (horiz) y += s * P.crouch * 0.5 * e; else x += s * P.crouch * 0.5 * e;
    } else if (L > T.crouch && t < T.departAt) {
      const hp = seg(L, T.crouch, T.crouch + T.hop); const e = easeOutBack(hp, 1.3);
      // Stretch on take-off relaxing to round at the apex, then a gentle hover bob.
      const stretch = Math.max(0, 1 - hp * 1.6);
      sx = 1 - 0.14 * stretch + P.crouch * 0.75 * (1 - Math.min(1, hp * 4)); sy = 1 + 0.18 * stretch - P.crouch * (1 - Math.min(1, hp * 4));
      const bob = hp >= 1 ? Math.sin(((L - T.crouch - T.hop) / 1000) * 7) * s * 0.03 : 0;
      if (horiz) y = c.y - up * e + bob; else x = c.x - up * e + bob;
      rot = (k % 2 ? 1 : -1) * TAU * P.turns * easeInOut(seg(L, T.crouch, T.crouch + T.spinEnd));
      happy = hp > 0.3;
      // The shared pose: all tilt together toward the exit, with a small overshoot.
      const tilt = easeOutBack(seg(t, T.tilt, T.tilt + T.pose), 2);
      rot += -0.22 * tilt;
      const breath = Math.sin(seg(t, T.tilt, T.tilt + T.pose) * Math.PI) * 0.06; sx *= 1 + breath; sy *= 1 - breath;
    } else if (t >= T.departAt) {
      const d = startD[k] + dTravel; const q = path.at(d);
      x = q.x; y = q.y; happy = true;
      const beyond = seg(d, path.total - s * 2.2, path.total);
      scale = 1 - 0.75 * beyond; alpha = 1 - seg(d, path.total - s * 0.6, path.total);
      rot = -0.22 * (1 - seg(t, T.departAt, T.departAt + 200)) + Math.sin((q.ang)) * 0.25 * seg(t, T.departAt, T.departAt + 200);
      const sp = Math.min(1, departP * 2); sx = 1 + 0.12 * sp; sy = 1 - 0.1 * sp; // speed squash along the path
    }
    if (alpha <= 0.01) continue;
    // Cast shadow on the board beneath an airborne dancer: it shrinks and fades with height.
    if (t < T.departAt + 120) {
      const lift = horiz ? c.y - y : c.x - x; const hN = Math.max(0, Math.min(1, lift / (s * 2)));
      const fadeOut = 1 - seg(t, T.departAt, T.departAt + 120);
      if (lift > 2) { ctx.globalAlpha = 0.22 * (1 - hN * 0.6) * fadeOut; ctx.fillStyle = '#c0507a'; ctx.beginPath(); ctx.ellipse(horiz ? x : c.x + s * 0.3, horiz ? c.y + s * 0.32 : y, s * 0.42 * (1 - hN * 0.4), s * 0.1, 0, 0, TAU); ctx.fill(); }
    }
    const air = t > T.departAt ? 1.06 : 1 + 0.06 * Math.min(1, Math.max(0, (horiz ? c.y - y : c.x - x) / s));
    jellyBlock(ctx, x, y, s * scale * air, c.color, { sx, sy, rot, alpha, shadow: 1 });
    if (P.faces >= 0.5) face(ctx, x, y, s * scale, rot, sx, sy, happy, alpha);
  }
  // Finale: as each dancer leaves, a wink sparkle; after the last, a glossy little heart.
  const endP = st.path.at(st.path.total);
  for (let k = 0; k < 8; k++) {
    const arrive = (st.path.total - startD[k]) / travel; // fraction of travel when this dancer exits
    const tt = t - (T.departAt + T.depart * Math.min(1, Math.pow(arrive, 0.62)));
    const a = env(tt, 0, 60, 90, 260);
    if (a > 0) sparkle(ctx, endP.x + (k - 3.5) * s * 0.12, endP.y + (k % 2 ? -1 : 1) * s * 0.2, s * 0.45 * a, a, '#ffffff', 0.2);
  }
  const h = seg(t, T.departAt + T.depart - 40, T.end);
  if (h > 0 && h < 1) {
    const pop = h < 0.3 ? easeOutBack(h / 0.3, 2.4) : 1;
    const a = 1 - seg(h, 0.65, 1);
    drawSprite(ctx, heartSprite(), endP.x - s * 0.3, endP.y + s * 0.4 - easeOut(h) * s * 0.5, s * 0.9 * pop, { rot: -0.15 + Math.sin(h * 9) * 0.08 * (1 - h), alpha: a });
    sparkle(ctx, endP.x + s * 0.15, endP.y + s * 0.05 - h * s * 0.4, s * 0.35 * env(h, 0.15, 0.3, 0.4, 0.7), env(h, 0.15, 0.3, 0.4, 0.7));
  }
  ctx.globalAlpha = 1;
}

export default { id: 'jelly-c', label: 'C · Candy Ballet', kind: 'concept', supports: ['single'], params, presets, duration, keyframes, prepare, render };
