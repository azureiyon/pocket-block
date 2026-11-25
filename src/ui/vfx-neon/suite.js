// Neon Arcade — Power Down suite (shipped). Approved single clear: Power
// Down (CRT switch-off). The other events speak the same screen language
// (flicker, RGB split, squash and collapse, phosphor afterglow, scanlines),
// each with its own ending gesture:
//   place   a bright scan line refreshes down over the placed piece; rims flare behind it
//   idle    now and then one block glitches: a two-frame RGB-split jitter and a tear
//   multi   the row squashes to a bar that implodes into the crossing while the column
//           derezzes outward from it; the dot fires one horizontal scan flash
// Rows power down like a CRT; columns derez (stepped pixel lattices), since a TV
// only switches off horizontally.
//   streak  the single power-down, then a bright band rolls down the board (vertical hold)
//   board   the last line powers down, then the whole board switches off like a TV
//           (bar, dot) and powers back on from the centre with scanlines
// Milestones are opt-in (not designed unless asked).

import crt, * as B from './crt.js';
import derez, * as C from './derez.js';
import { TAU, mix, seg, env, lerp, premium, expoOut, quadIn, glint, drawSprite, roundRectPath, circuitBlock, haloSprite, rgbaOf, WHITE, CYAN, MAGENTA, ciOf } from './neon-art.js';

const defaults = (params) => Object.fromEntries(params.map((p) => [p.key, p.def]));
const PB = (P) => ({ ...defaults(B.params), speed: P.speed });
const PC = (Q) => { const d = defaults(C.params); return { ...d, step: d.step * Q.speed }; };

/**
 * A line clear by direction: rows power down like a CRT (a TV only switches off
 * horizontally); columns derez into stepped pixel lattices that zig-zag out sideways.
 */
const lineFx = {
  duration: (Q) => Math.max(crt.duration(Q), derez.duration(PC(Q))),
  prepare: (scene, Q) => (scene.lines[0].axis === 'v' ? { v: true, st: derez.prepare(scene, PC(Q)) } : { v: false, st: crt.prepare(scene, Q) }),
  render: (ctx, t, L, scene, Q) => (L.v ? derez.render(ctx, t, L.st, scene, PC(Q)) : crt.render(ctx, t, L.st, scene, Q)),
};

export const params = [
  { key: 'speed', label: 'Overall pace', min: 0.6, max: 1.5, step: 0.05, def: 1 },
  { key: 'combo', label: 'Streak level (streak only)', min: 2, max: 8, step: 1, def: 4 },
  { key: 'flash', label: 'Flash brightness', min: 0.3, max: 1.2, step: 0.05, def: 0.9 },
  { key: 'scan', label: 'Placement scan', min: 0, max: 1, step: 0.05, def: 0.85 },
];
export const presets = { Default: {} };

// ---------- shared pieces ----------
/** A thin bright CRT line from (x0, y0) to (x1, y1): white core with cyan and magenta fringes. */
function crtLine(ctx, x0, y0, x1, y1, alpha, core = 2) {
  if (alpha <= 0.01) return;
  const horiz = Math.abs(y1 - y0) < Math.abs(x1 - x0);
  const ox = horiz ? 0 : 1.6; const oy = horiz ? 1.6 : 0;
  ctx.lineCap = 'butt';
  ctx.globalAlpha = alpha * 0.8; ctx.lineWidth = 1.2;
  ctx.strokeStyle = CYAN; ctx.beginPath(); ctx.moveTo(x0 - ox, y0 - oy); ctx.lineTo(x1 - ox, y1 - oy); ctx.stroke();
  ctx.strokeStyle = MAGENTA; ctx.beginPath(); ctx.moveTo(x0 + ox, y0 + oy); ctx.lineTo(x1 + ox, y1 + oy); ctx.stroke();
  ctx.globalAlpha = alpha; ctx.strokeStyle = WHITE; ctx.lineWidth = core;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
}

/** Scanline texture over a rectangle. */
function scanlines(ctx, x, y, w, h, alpha) {
  if (alpha <= 0.01) return;
  ctx.globalAlpha = alpha; ctx.fillStyle = WHITE;
  for (let yy = y; yy < y + h; yy += 3) ctx.fillRect(x, yy, w, 1);
}

const colorOf = (scene, i) => scene.theme.palette[((scene.fx.after[i] || 1) - 1) % scene.theme.palette.length];

// ---------- events ----------
const EV = {};

EV.single = { duration: (P) => lineFx.duration(PB(P)), keyframes: (P) => crt.keyframes(PB(P)), prepare: (sc, P) => lineFx.prepare(sc, PB(P)), render: (ctx, t, st, sc, P) => lineFx.render(ctx, t, st, sc, PB(P)) };

// Multi-line: the row squashes to a bar that implodes into the crossing while the column derezzes
// outward from the crossing in stepped pixel lattices; the crossing dot fires one horizontal scan flash.
EV.multi = {
  duration: (P) => 960 * P.speed,
  keyframes: (P) => [[70, 'Flicker', 'The row flickers and splits; the column\u2019s blocks flash white from the crossing out.'], [220, 'Squash and derez', 'The row squashes to a bar; the column breaks into pixel lattices.'], [400, 'Implode', 'The bar draws in from both ends to the crossing; lattices zig-zag outward.'], [480, 'Dot', 'A bright dot at the crossing.'], [570, 'Scan flash', 'It fires one horizontal scan flash across the board.'], [820, 'Settle', 'The last pixels pop; a faint phosphor line fades.']].map(([t, label, note]) => ({ t: t * P.speed, label, note })),
  prepare(scene, P) {
    const row = scene.lines.find((l) => l.axis === 'h'); const col = scene.lines.find((l) => l.axis === 'v');
    if (!row || !col) return { fallback: scene.lines.map((l) => ({ l, st: lineFx.prepare({ ...scene, lines: [l] }, PB(P)) })) };
    const crossI = row.idx * 8 + col.idx; const c = scene.cell(crossI); const pitch = row.len / 7;
    const blocks = row.cells.map((b) => ({ ...b, ci: ciOf(b, scene.theme.palette), d: Math.abs(b.x - c.x) / pitch }));
    // The column derezzes in a wave outward from the crossing (both directions at once).
    const Qc = PC(PB(P)); const cst = derez.prepare({ ...scene, lines: [col] }, Qc);
    const ck = col.cells.findIndex((x) => x.i === crossI);
    cst.blocks = cst.blocks.filter((x) => x.i !== crossI).map((x) => ({ ...x, o: 60 * P.speed + Math.abs(col.cells.findIndex((y) => y.i === x.i) - ck) * cst.T.o }));
    return { row, col, c, blocks, cst, Qc };
  },
  render(ctx, t, st, scene, P) {
    if (st.fallback) { for (const f of st.fallback) lineFx.render(ctx, t, f.st, { ...scene, lines: [f.l] }, PB(P)); return; }
    const k = P.speed; const { row, col, c, blocks } = st; const s = row.s;
    const fl = 100 * k; const sqEnd = 300 * k; const colEnd = 470 * k; const dotEnd = 570 * k;
    const fstep = Math.floor(t / (33 * k));
    // The column: stepped pixel lattices.
    derez.render(ctx, t, st.cst, { ...scene, lines: [col] }, st.Qc);
    // The row: flicker, split and squash.
    for (const b of blocks) {
      const q = premium(seg(t, fl + b.d * 8 * k, sqEnd)); if (q >= 0.98) continue;
      const thin = 1 - q * 0.94; const a = (t < fl ? [1, 0.55, 1, 0.8][fstep % 4] : 1) * (1 - seg(q, 0.75, 0.98));
      const split = 4 * Math.min(1, t / fl) * (1 - q);
      if (split > 0.3) { circuitBlock(ctx, b.x - split, b.y, s, b.color, b.ci, { sy: thin, tint: CYAN, face: 0.35, alpha: 0.6 * a, glyphA: 0 }); circuitBlock(ctx, b.x + split, b.y, s, b.color, b.ci, { sy: thin, tint: MAGENTA, face: 0.35, alpha: 0.6 * a, glyphA: 0 }); }
      circuitBlock(ctx, b.x, b.y, s, b.color, b.ci, { sy: thin, power: Math.max(q, t < fl ? [0.9, 0.2, 0.7, 0.4][fstep % 4] : 0), alpha: a });
    }
    // The row's bar implodes into the crossing.
    const barIn = seg(t, lerp(fl, sqEnd, 0.6), sqEnd);
    if (barIn > 0 && t < colEnd + 20 * k) {
      const u = premium(seg(t, sqEnd, colEnd)); const L = row.a.x - s / 2; const R = row.b.x + s / 2;
      crtLine(ctx, lerp(L, c.x, u), c.y, lerp(R, c.x, u), c.y, barIn, 2.4);
    }
    // The dot at the crossing.
    const d = env(t, colEnd - 30 * k, colEnd, colEnd + 40 * k, dotEnd);
    if (d > 0) { drawSprite(ctx, haloSprite(CYAN), c.x, c.y, s * 1.3 * d, { alpha: d * 0.85 }); glint(ctx, c.x, c.y, s * 0.45 * d, WHITE, d); }
    // Ending: one horizontal scan flash across the whole board from the dot.
    const pu = seg(t, dotEnd - 30 * k, dotEnd + 300 * k);
    if (pu > 0 && pu < 1) {
      const e = expoOut(seg(pu, 0, 0.45)); const a = (1 - quadIn(pu)) * P.flash; const B = scene.bounds; const m = s * 0.2;
      crtLine(ctx, lerp(c.x, B.x0 - m, e), c.y, lerp(c.x, B.x1 + m, e), c.y, a, 1.8);
    }
    // Phosphor afterglow of the row.
    const gh = env(t, sqEnd, colEnd, dotEnd, 900 * k);
    if (gh > 0.01) { ctx.globalAlpha = gh * 0.22; ctx.fillStyle = rgbaOf(row.cells[3].color, 1); ctx.fillRect(row.a.x - s * 0.4, c.y - s * 0.06, row.len + s * 0.8, s * 0.12); }
  },
};

// Placement: a scan line refreshes down over the placed piece; rims flare as it passes.
EV.place = {
  duration: (P) => 340 * P.speed,
  keyframes: (P) => [[40, 'Scan in', 'A bright scan line appears at the top of the piece.'], [140, 'Refresh', 'It sweeps down; each block’s rim flares as it passes.'], [280, 'Settle', 'The rims settle back.']].map(([t, label, note]) => ({ t: t * P.speed, label, note })),
  prepare(scene) {
    const cells = scene.fx.placed.map((i) => ({ ...scene.cell(i), color: colorOf(scene, i) }));
    const s = cells[0] ? cells[0].s : 40;
    const y0 = Math.min(...cells.map((c) => c.y)) - s * 0.6; const y1 = Math.max(...cells.map((c) => c.y)) + s * 0.6;
    const x0 = Math.min(...cells.map((c) => c.x)) - s * 0.6; const x1 = Math.max(...cells.map((c) => c.x)) + s * 0.6;
    return { cells, y0, y1, x0, x1, s };
  },
  render(ctx, t, st, scene, P) {
    const k = P.speed; const { cells, y0, y1, x0, x1, s } = st;
    const u = premium(seg(t, 20 * k, 230 * k)); const y = lerp(y0, y1, u);
    for (const c of cells) {
      const pass = (c.y - y0) / (y1 - y0); const a = env(u, pass - 0.25, pass, pass + 0.05, pass + 0.55) * P.scan;
      if (a <= 0.01) continue;
      drawSprite(ctx, haloSprite(c.color), c.x, c.y, s * 1.5, { alpha: a * 0.7 });
      ctx.save(); ctx.translate(c.x, c.y); roundRectPath(ctx, s - 2, s - 2, s * 0.14 - 1);
      ctx.globalAlpha = a; ctx.strokeStyle = mix(c.color, WHITE, 0.55); ctx.lineWidth = 2.2; ctx.stroke(); ctx.restore();
    }
    const on = env(t, 0, 30 * k, 210 * k, 260 * k) * P.scan;
    if (on > 0.01) { crtLine(ctx, x0, y, x1, y, on, 1.6); scanlines(ctx, x0, Math.max(y0, y - s * 0.5), x1 - x0, Math.min(s * 0.5, y - y0), on * 0.12); }
  },
};

// Idle: now and then one block glitches (stepped RGB-split jitter and a tear).
EV.idle = {
  duration: (P) => 220 * P.speed,
  keyframes: (P) => [[16, 'Glitch', 'One block’s colours jump apart.'], [70, 'Tear', 'A thin slice of it tears sideways.'], [140, 'Snap back', 'It snaps back into place.']].map(([t, label, note]) => ({ t: t * P.speed, label, note })),
  prepare(scene) {
    const filled = []; for (let i = 0; i < 64; i++) if (scene.fx.after[i]) filled.push(i);
    const i = filled[Math.floor(filled.length * 0.6)] ?? 27;
    return { c: { ...scene.cell(i), color: colorOf(scene, i), ci: scene.fx.after[i] || 1 }, i };
  },
  render(ctx, t, st, scene, P) {
    const k = P.speed; const { c } = st; const s = c.s;
    const n = Math.floor(t / (33 * k)); // stepped frames
    const off = [3.5, -2.5, 1.5, 0, 0, 0, 0][n] ?? 0; const tear = [0, 4, -3, 2, 0, 0, 0][n] ?? 0;
    if (off) {
      circuitBlock(ctx, c.x - off, c.y, s, c.color, c.ci, { tint: CYAN, face: 0.3, alpha: 0.55, glyphA: 0 });
      circuitBlock(ctx, c.x + off, c.y, s, c.color, c.ci, { tint: MAGENTA, face: 0.3, alpha: 0.55, glyphA: 0 });
    }
    if (tear) {
      ctx.save(); ctx.beginPath(); ctx.rect(c.x - s, c.y + s * 0.05, s * 2, s * 0.16); ctx.clip();
      circuitBlock(ctx, c.x + tear, c.y, s, c.color, c.ci, { power: 0.6 }); ctx.restore();
    }
  },
};

// Streak: the single power-down, then a bright band rolls down the board (vertical hold).
EV.streak = {
  duration: (P) => { const Q = PB(P); return lineFx.duration(Q) + 360 * P.speed; },
  keyframes: (P) => { const Q = PB(P); const k = P.speed; const r0 = lineFx.duration(Q) - 280 * k; return [[200 * k, 'Power down', 'The same switch-off as a single clear.'], [r0 - 60 * k, 'Dot', 'The dot blinks out.'], [r0 + 120 * k, 'Roll', 'A bright band rolls down the whole board, like a TV losing vertical hold.'], [r0 + 300 * k, 'Second roll', 'Big streaks send a second, thinner band.'], [r0 + 520 * k, 'Settle', 'The board is steady again.']].map(([t, label, note]) => ({ t, label, note })); },
  prepare(scene, P) { return { st: lineFx.prepare(scene, PB(P)) }; },
  render(ctx, t, S, scene, P) {
    const Q = PB(P); const k = P.speed; lineFx.render(ctx, t, S.st, scene, Q);
    const B = scene.bounds; const s = scene.lines[0].s; const r0 = lineFx.duration(Q) - 280 * k; const m = s * 0.24;
    const bands = P.combo >= 4 ? 2 : 1;
    ctx.save(); ctx.beginPath(); ctx.rect(B.x0 - m, B.y0 - m, B.x1 - B.x0 + 2 * m, B.y1 - B.y0 + 2 * m); ctx.clip();
    for (let i = 0; i < bands; i++) {
      const u = seg(t, r0 + i * 150 * k, r0 + i * 150 * k + (520 - 60 * Math.min(P.combo, 8) * 0.5) * k); if (u <= 0 || u >= 1) continue;
      const h = s * (1.1 - i * 0.45); const y = lerp(B.y0 - m - h, B.y1 + m + h, premium(u)); const a = env(u, 0, 0.12, 0.8, 1) * P.flash;
      const g = ctx.createLinearGradient(0, y - h, 0, y + h);
      g.addColorStop(0, 'rgba(40,225,255,0)'); g.addColorStop(0.42, 'rgba(40,225,255,.22)'); g.addColorStop(0.5, 'rgba(255,255,255,.35)'); g.addColorStop(0.58, 'rgba(255,79,216,.22)'); g.addColorStop(1, 'rgba(255,79,216,0)');
      ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(B.x0 - m, y - h, B.x1 - B.x0 + 2 * m, h * 2);
      scanlines(ctx, B.x0 - m, y - h * 0.6, B.x1 - B.x0 + 2 * m, h * 1.2, a * 0.14);
      crtLine(ctx, B.x0 - m, y, B.x1 + m, y, a * 0.8, 1.2);
    }
    ctx.restore();
  },
};

// Board clear: the last line powers down, then the whole board switches off like a TV and powers back on.
EV.board = {
  duration: (P) => { const Q = PB(P); return lineFx.duration(Q) * 0.75 + 900 * P.speed; },
  keyframes: (P) => { const Q = PB(P); const k = P.speed; const o = lineFx.duration(Q) * 0.75; return [[200 * k, 'Last line', 'The final line powers down.'], [o + 120 * k, 'Board off', 'The whole board collapses to a bright bar, like a TV switching off.'], [o + 285 * k, 'Dot', 'The bar shrinks to a dot and blinks out.'], [o + 370 * k, 'Dark', 'A short beat of darkness.'], [o + 520 * k, 'Power on', 'A bar flicks out from the centre and opens back into the board.'], [o + 720 * k, 'Scanlines', 'Scanlines over the fresh board fade.'], [o + 880 * k, 'Settle', 'A clean, empty board.']].map(([t, label, note]) => ({ t, label, note })); },
  prepare(scene, P) {
    const st = lineFx.prepare(scene, PB(P)); const B = scene.bounds; const s = scene.lines[0].s; const m = s * 0.24 + 2;
    return { st, x0: B.x0 - m, y0: B.y0 - m, w: B.x1 - B.x0 + 2 * m, h: B.y1 - B.y0 + 2 * m, r: s * 0.41, s };
  },
  render(ctx, t, S, scene, P) {
    const Q = PB(P); const k = P.speed; lineFx.render(ctx, t, S.st, scene, Q);
    const { x0, y0, w, h, r, s } = S; const cx = x0 + w / 2; const cy = y0 + h / 2; const o = lineFx.duration(Q) * 0.75;
    const offA = o; const offB = o + 160 * k; const offC = o + 270 * k; const dot = o + 340 * k; const onA = o + 400 * k; const onB = o + 500 * k; const onC = o + 680 * k; const end = o + 880 * k;
    if (t < offA || t > end) return;
    const cover = (vh, vw) => { // dark over the board except a centred window vw x vh
      ctx.save(); ctx.translate(x0 + w / 2, y0 + h / 2); roundRectPath(ctx, w, h, r); ctx.clip(); ctx.translate(-(x0 + w / 2), -(y0 + h / 2));
      ctx.globalAlpha = 0.74; ctx.fillStyle = '#04051a'; // the grid still shows faintly: a screen switched off, not a missing board
      ctx.beginPath(); ctx.rect(x0, y0, w, h); ctx.rect(cx + vw / 2, cy - vh / 2, -vw, vh); ctx.fill('evenodd');
      ctx.clip('evenodd'); scanlines(ctx, x0, y0, w, h, 0.05); // dead-screen texture
      ctx.restore();
    };
    if (t < offC) { // switch off: the window narrows vertically to a bar, then the bar draws in
      const a = premium(seg(t, offA, offB)); const b = premium(seg(t, offB, offC));
      const vh = lerp(h, 3, a); const vw = lerp(w, 0, b);
      cover(vh, vw);
      ctx.globalAlpha = 0.35 * a; ctx.fillStyle = WHITE; ctx.fillRect(cx - vw / 2, cy - vh / 2, vw, vh); // the image going white-hot
      if (a > 0.7) crtLine(ctx, cx - vw / 2, cy, cx + vw / 2, cy, P.flash * seg(a, 0.7, 1), 2.4);
    } else if (t < onA) { // dot, then darkness
      cover(0, 0);
      const d = env(t, offC - 20 * k, offC + 20 * k, offC + 50 * k, dot);
      if (d > 0) { drawSprite(ctx, haloSprite(CYAN), cx, cy, s * 1.2 * d, { alpha: d }); glint(ctx, cx, cy, s * 0.5 * d, WHITE, d); }
    } else { // power on: a bar flicks out horizontally, then opens vertically
      const a = expoOut(seg(t, onA, onB)); const b = premium(seg(t, onB, onC)); const fade = 1 - seg(t, onC, end);
      const vw = lerp(0, w, a); const vh = lerp(3, h, b);
      ctx.globalAlpha = 1; cover(vh, vw);
      if (b < 1) crtLine(ctx, cx - vw / 2, cy - vh / 2, cx + vw / 2, cy - vh / 2, P.flash * (1 - b * 0.5), 1.8);
      if (b > 0 && b < 1) crtLine(ctx, cx - vw / 2, cy + vh / 2, cx + vw / 2, cy + vh / 2, P.flash * (1 - b * 0.5), 1.8);
      if (b > 0) { ctx.save(); ctx.translate(cx, cy); roundRectPath(ctx, w, h, r); ctx.clip(); ctx.translate(-cx, -cy); scanlines(ctx, cx - vw / 2, cy - vh / 2, vw, vh, 0.12 * fade); ctx.globalAlpha = 0.1 * fade; ctx.fillStyle = CYAN; ctx.fillRect(cx - vw / 2, cy - vh / 2, vw, vh); ctx.restore(); }
    }
  },
};

const pick = (ev) => EV[ev] || EV.single;
export default {
  id: 'neon-crt', label: 'Power Down suite', kind: 'concept', supports: ['single', 'multi', 'place', 'idle', 'streak', 'board'], params, presets,
  duration: (P, ev) => pick(ev).duration(P), keyframes: (P, ev) => pick(ev).keyframes(P), prepare: (sc, P, ev) => pick(ev).prepare(sc, P), render: (ctx, t, st, sc, P, ev) => pick(ev).render(ctx, t, st, sc, P),
};

export { neonWarmJobs } from './neon-art.js';
