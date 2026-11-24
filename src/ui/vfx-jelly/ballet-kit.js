// Shared vocabulary for the Candy Ballet suite: paths, curves, the glossy
// heart, the dancer's hop kinematics, and trails sampled from a dancer's own
// motion (so every effect's ribbons follow its real choreography).

import { TAU, mix, easeOut, easeInOut, easeOutBack, seg, jellyBlock, sparkle, spriteOf } from './jelly-art.js';

/** Polyline path sampler with cumulative length. */
export function sampler(pts) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = cum[cum.length - 1];
  return {
    total, pts,
    at(d) {
      d = Math.max(0, Math.min(total, d));
      let i = 1; while (i < cum.length - 1 && cum[i] < d) i++;
      const u = (d - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
      const a = pts[i - 1]; const b = pts[i];
      return { x: a[0] + (b[0] - a[0]) * u, y: a[1] + (b[1] - a[1]) * u, ang: Math.atan2(b[1] - a[1], b[0] - a[0]) };
    },
  };
}

export function bez(p0, p1, p2, p3, n) {
  const out = [];
  for (let i = 1; i <= n; i++) { const t = i / n; const u = 1 - t; out.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); }
  return out;
}

/** Heart outline (the classic parametric heart), starting and ending at the bottom tip. */
export function heartPts(cx, cy, w, n = 48) {
  const k = w / 32; const out = [];
  for (let i = 0; i <= n; i++) {
    const t = Math.PI + (i / n) * TAU;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    out.push([cx + x * k, cy - y * k]);
  }
  return out;
}

export function heartSprite() {
  return spriteOf('ballet-heart', 96, (ctx) => {
    const c = 48; const R = 34;
    ctx.beginPath(); ctx.moveTo(c, c + R * 0.9); ctx.bezierCurveTo(c - R * 1.25, c + R * 0.05, c - R * 0.75, c - R * 0.95, c, c - R * 0.35); ctx.bezierCurveTo(c + R * 0.75, c - R * 0.95, c + R * 1.25, c + R * 0.05, c, c + R * 0.9); ctx.closePath();
    const g = ctx.createLinearGradient(c - R, c - R, c + R, c + R); g.addColorStop(0, '#ffc2d6'); g.addColorStop(0.5, '#ff6f91'); g.addColorStop(1, '#d9466e');
    ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#c23d63'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.beginPath(); ctx.ellipse(c - R * 0.4, c - R * 0.25, R * 0.2, R * 0.1, -0.8, 0, TAU); ctx.fill();
  });
}

/**
 * The dancer's signature move, shared by every event: crouch (anticipation),
 * spring up with a stretch that relaxes to round, pirouette, then hover.
 * L is local time since this dancer's cue. Returns an offset along "up" plus deformation.
 */
export function hop(L, { crouch, hopT, spinT, depth, height, turns, dir = 1, bobAmp = 0.03 }, s) {
  if (L <= 0) return { off: 0, sx: 1, sy: 1, rot: 0, air: 0 };
  if (L <= crouch) { const e = easeOut(L / crouch); return { off: -s * depth * 0.5 * e, sx: 1 + depth * 0.75 * e, sy: 1 - depth * e, rot: 0, air: 0 }; }
  const hp = seg(L, crouch, crouch + hopT); const e = easeOutBack(hp, 1.3);
  const stretch = Math.max(0, 1 - hp * 1.6); const settle = 1 - Math.min(1, hp * 4);
  const bob = hp >= 1 ? Math.sin(((L - crouch - hopT) / 1000) * 7) * s * bobAmp : 0;
  return {
    off: height * e + bob,
    sx: 1 - 0.14 * stretch + depth * 0.75 * settle, sy: 1 + 0.18 * stretch - depth * settle,
    rot: dir * TAU * turns * easeInOut(seg(L, crouch, crouch + spinT)), air: Math.min(1, (height * e) / s),
  };
}

/** A small landing: squash on impact and a damped spring back to round. */
export function landing(tl, amount = 0.16) {
  if (tl < 0) return { sx: 1, sy: 1 };
  const k = Math.exp(-7 * tl) * Math.cos(TAU * 2.4 * tl) * amount;
  return { sx: 1 + k, sy: 1 - k };
}

/** Draw a dancer: the real jelly block, a touch larger in the air, with a soft cast shadow on the board. */
export function dancer(ctx, d, s, color, shadowAt) {
  if (d.alpha <= 0.01) return;
  if (shadowAt) {
    const h = Math.max(0, Math.min(1, shadowAt.h / (s * 2)));
    ctx.globalAlpha = 0.22 * (1 - h * 0.6) * (shadowAt.fade ?? 1) * d.alpha; ctx.fillStyle = '#c0507a';
    ctx.beginPath(); ctx.ellipse(shadowAt.x, shadowAt.y, s * 0.42 * (1 - h * 0.4) * (d.scale ?? 1), s * 0.1, 0, 0, TAU); ctx.fill();
  }
  const air = 1 + 0.06 * (d.air || 0);
  jellyBlock(ctx, d.x, d.y, s * (d.scale ?? 1) * air, color, { sx: d.sx, sy: d.sy, rot: d.rot, alpha: d.alpha, shadow: 1 });
}

/**
 * Tapered ribbon trail sampled from a dancer's own motion function, from
 * `since` up to now: colour body with a white core, thickest at the dancer.
 */
export function trail(ctx, poseAt, t, since, color, s, { len = 260, width = 0.42, alpha = 1, steps = 16 } = {}) {
  const t0 = Math.max(since, t - len); if (t - t0 < 8) return;
  ctx.lineCap = 'round';
  let prev = poseAt(t0);
  for (let i = 1; i <= steps; i++) {
    const tt = t0 + ((t - t0) * i) / steps; const q = poseAt(tt); const w = i / steps;
    if (!q || !prev) { prev = q; continue; }
    ctx.globalAlpha = 0.9 * Math.sqrt(w) * alpha; ctx.strokeStyle = mix(color, '#ffffff', 0.15); ctx.lineWidth = s * width * w * (q.scale ?? 1);
    ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(q.x, q.y); ctx.stroke();
    ctx.globalAlpha = 0.9 * w * alpha; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = s * width * w * 0.3 * (q.scale ?? 1);
    ctx.beginPath(); ctx.moveTo(prev.x, prev.y); ctx.lineTo(q.x, q.y); ctx.stroke();
    prev = q;
  }
}

/** Sparkles left behind along a trail: deterministic per dancer, they twinkle once and fade. */
export function trailSparkles(ctx, poseAt, t, since, s, seed, density = 1, every = 70) {
  const n = Math.floor((t - since) / every);
  for (let j = Math.max(0, n - 6); j <= n; j++) {
    if (((j * 7 + seed * 13) % 5) > 2 * density) continue;
    const at = since + j * every; const age = t - at; if (age < 0) continue;
    const q = poseAt(at); if (!q) continue;
    const a = age < 60 ? age / 60 : Math.max(0, 1 - (age - 60) / 300);
    const off = (((j * 31 + seed * 17) % 11) / 11 - 0.5) * s * 0.5;
    sparkle(ctx, q.x + off * 0.6, q.y + off, s * 0.16 * a, a);
  }
}

export { sparkle };
