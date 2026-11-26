// Line clears for themes 06–30 (picked in the FX Reel, see studio/fx-reel-picks.md).
// Each theme has a row concept and a column concept from src/ui/vfx-reel/reel-fx.js.
// The cleared cells come back as ghost block elements (the real material, so they look
// identical) in a layer under the effect canvas; the concept moves them and draws over them.
// Multi-line clears play the row concept on rows and the column concept on columns together.
// Board clears play the theme's finale once the last line is mostly gone; placement and idle
// animate ghosts over the real blocks (which hide meanwhile) and stop if those cells change.
// Streaks and milestones keep the shared effects for now.

import { REEL, FINALE, setCtx, setRot } from '../vfx-reel/reel-fx.js';
import { linesOf } from '../vfx-kit.js';
import { makeBlock } from '../render.js';

const EMPTY = new Int16Array(64);

/** A ghost layer matching the effect canvas, created once per engine. */
function ghostLayer(v) {
  if (!v.canvas || !v.canvas.parentNode || typeof v.canvas.parentNode.insertBefore !== 'function') return null;
  let g = v.reelGhosts;
  if (!g || !g.isConnected) {
    g = v.doc.createElement('div'); g.className = 'vfx-ghosts';
    v.canvas.parentNode.insertBefore(g, v.canvas); v.reelGhosts = g;
  }
  const cs = v.canvas.style; Object.assign(g.style, { position: 'absolute', left: cs.left, top: cs.top, width: cs.width, height: cs.height, pointerEvents: 'none', overflow: 'visible' });
  return g;
}

/** Ghost blocks for one cleared line, in canvas coordinates. */
function ghostsFor(v, line, theme) {
  const layer = ghostLayer(v);
  return line.cells.map((c) => {
    let el;
    if (layer && typeof document !== 'undefined') {
      el = makeBlock(theme, c.ci); el.classList.add('vfx-ghost');
      Object.assign(el.style, { position: 'absolute', left: (c.x - c.s / 2) + 'px', top: (c.y - c.s / 2) + 'px', width: c.s + 'px', height: c.s + 'px' });
      layer.appendChild(el);
    } else {
      el = { style: {}, querySelector: () => null, remove() {} }; // headless tests
    }
    return { el, x: c.x, y: c.y, s: c.s, c: c.color, i: c.i };
  });
}

/** Ghost blocks for board cells (placement, idle), hiding the real ones until `restore` runs. */
function ghostCells(v, theme, indices) {
  const layer = ghostLayer(v); const state = v.board.state || EMPTY; const real = v.board.cells || [];
  const out = indices.map((i) => {
    const c = v.cell(i); const ci = Math.max(1, state[i] || 1);
    let el;
    if (layer && typeof document !== 'undefined') {
      el = makeBlock(theme, ci); el.classList.add('vfx-ghost');
      Object.assign(el.style, { position: 'absolute', left: (c.x - c.s / 2) + 'px', top: (c.y - c.s / 2) + 'px', width: c.s + 'px', height: c.s + 'px' });
      layer.appendChild(el);
    } else el = { style: {}, querySelector: () => null, remove() {} };
    if (real[i] && real[i].classList) real[i].classList.add('vfx-hide');
    return { el, x: c.x, y: c.y, s: c.s, c: theme.palette[(ci - 1) % theme.palette.length], i };
  });
  const restore = () => { for (const g of out) { if (g.el.remove) g.el.remove(); const r = real[g.i]; if (r && r.classList) r.classList.remove('vfx-hide'); } };
  return { blocks: out, restore };
}

/** The whole-board scene shape used by finales, placement and idle. */
function boardScene(v, theme) {
  const a = v.cell(0); const z = v.cell(63);
  const cells = Array.from({ length: 64 }, (_, i) => { const c = v.cell(i); const r = Math.floor(i / 8); const cc = i % 8; return { x: c.x, y: c.y, s: c.s, r, c: cc, ring: Math.max(Math.abs(r - 3.5), Math.abs(cc - 3.5)) - 0.5 }; });
  const board = { x0: a.x - a.s / 2, y0: a.y - a.s / 2, x1: z.x + z.s / 2, y1: z.y + z.s / 2 };
  const cx = (board.x0 + board.x1) / 2; const cy = (board.y0 + board.y1) / 2;
  return { theme, cells, board, cx, cy, y: cy, s: a.s, bw: board.x1 - board.x0, W: v.w + v.pad * 2, H: v.h + v.pad * 2, b: [], p: [], blocks: [] };
}

/** Play a board-wide concept (finale, placement or idle) as one engine item. */
function playBoard(v, fx, S, { delay = 0, guard = null, restore = null } = {}) {
  const P = fx.init ? fx.init(S) : null;
  const state = (vv) => vv.board.state || EMPTY;
  const snap = guard ? guard.map((i) => state(v)[i]) : null;
  let ended = false;
  const end = () => { if (ended) return; ended = true; if (restore) restore(); off(); };
  const off = v.onCleanup(end);
  v.later(end, delay + fx.dur);
  v.add({
    life: fx.dur, delay, blend: 'source-over',
    draw(ctx, it, p, vv, age) {
      if (it.dead) return;
      if (snap && guard.some((i, k) => state(vv)[i] !== snap[k])) { it.dead = true; end(); return; }
      setCtx(ctx); setRot(false); ctx.save();
      try { fx.draw(S, Math.min(age, fx.dur), P); } finally { ctx.restore(); ctx.globalAlpha = 1; }
    },
  });
}

/** Play one concept on one line as a single engine item. */
function playLine(v, theme, line, fx, extra) {
  const vert = line.axis === 'v'; const rot = vert && fx.rot;
  const b = ghostsFor(v, line, theme);
  const a = v.cell(0); const z = v.cell(63);
  const cx = (b[0].x + b[7].x) / 2; const cy = (b[0].y + b[7].y) / 2;
  const S = { b, theme, vert, seed: Math.floor(v.r(0, 1e9)), s: b[0].s, cx, y: cy, W: v.w + v.pad * 2, H: v.h + v.pad * 2,
    board: { x0: a.x - a.s / 2, y0: a.y - a.s / 2, x1: z.x + z.s / 2, y1: z.y + z.s / 2 } };
  if (rot) {
    for (const g of b) { g.x = cx + (g.y - cy); g.y = cy; }
    [S.W, S.H] = [S.H, S.W];
    const hw = (S.board.x1 - S.board.x0) / 2; const hh = (S.board.y1 - S.board.y0) / 2;
    S.board = { x0: cx - hh, y0: cy - hw, x1: cx + hh, y1: cy + hw };
  }
  const P = fx.init ? fx.init(S) : null;
  const done = () => { for (const g of b) if (g.el.remove) g.el.remove(); off(); };
  const off = v.onCleanup(done);
  v.later(done, fx.dur);
  v.add({
    life: fx.dur, blend: 'source-over',
    draw(ctx, it, p, vv, age) {
      setCtx(ctx); setRot(rot);
      ctx.save();
      if (rot) { ctx.translate(cx, cy); ctx.rotate(Math.PI / 2); ctx.translate(-cx, -cy); }
      try { fx.draw(S, Math.min(age, fx.dur), P); if (extra) extra(S, age, P); } finally { ctx.restore(); setRot(false); ctx.globalAlpha = 1; }
    },
  });
}

// ---------- Strawberry Patisserie: toppings on the piped ribbon (Rui's note) ----------
function rand(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const SPRINKLES = ['#ff6f91', '#ffd166', '#7bd389', '#6ec6ff', '#c3a1ff', '#ffffff'];
function toppings(S, t) {
  const ctx = S._ctx; if (!ctx) return;
  const r = rand(S.seed); const x0 = S.b[0].x - S.s * 0.55; const x1 = S.b[7].x + S.s * 0.55; const fade = 1 - Math.min(1, Math.max(0, (t - 850) / 400));
  const kind = Math.floor(r() * 3); // one topping per clear: strawberries, sprinkles or chocolate drizzle
  const drop = (t0) => { const u = Math.min(1, Math.max(0, (t - t0) / 220)); return 1 - Math.pow(1 - u, 3); };
  if (kind === 2) { // chocolate drizzle, piped back along the ribbon
    const u = Math.min(1, Math.max(0, (t - 520) / 300)); if (u <= 0) return;
    ctx.save(); ctx.globalAlpha = fade; ctx.strokeStyle = '#6b3b22'; ctx.lineWidth = Math.max(2, S.s * 0.08); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
    for (let k = 0; k <= 40 * u; k++) { const x = x1 - (x1 - x0) * (k / 40); const y = S.y + (k % 2 ? -1 : 1) * S.s * 0.18; if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.stroke(); ctx.restore(); return;
  }
  const n = kind === 0 ? 5 : 22;
  for (let k = 0; k < n; k++) {
    const x = x0 + (x1 - x0) * ((k + 0.5) / n) + (r() - 0.5) * S.s * 0.3; const y = S.y + (r() - 0.5) * S.s * 0.35; const t0 = 480 + (k / n) * 260 + r() * 60; const d = drop(t0);
    if (d <= 0) continue; const yy = y - S.s * 0.9 * (1 - d);
    ctx.save(); ctx.globalAlpha = fade; ctx.translate(x, yy);
    if (kind === 0) { // a strawberry with a leaf cap
      const R = S.s * 0.2; ctx.rotate((r() - 0.5) * 0.6);
      ctx.fillStyle = '#e8384f'; ctx.beginPath(); ctx.moveTo(0, R * 1.2); ctx.bezierCurveTo(R * 1.2, R * 0.4, R, -R * 0.8, 0, -R * 0.6); ctx.bezierCurveTo(-R, -R * 0.8, -R * 1.2, R * 0.4, 0, R * 1.2); ctx.fill();
      ctx.fillStyle = '#ffe2a8'; for (let q = 0; q < 4; q++) { ctx.beginPath(); ctx.arc((q % 2 ? 1 : -1) * R * 0.35, -R * 0.1 + q * R * 0.25, 1, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = '#4caf50'; ctx.beginPath(); ctx.ellipse(-R * 0.3, -R * 0.75, R * 0.35, R * 0.15, -0.4, 0, Math.PI * 2); ctx.ellipse(R * 0.3, -R * 0.75, R * 0.35, R * 0.15, 0.4, 0, Math.PI * 2); ctx.fill();
    } else { // a sprinkle
      ctx.rotate(r() * Math.PI); ctx.fillStyle = SPRINKLES[Math.floor(r() * SPRINKLES.length)]; const L = S.s * 0.14; const W = Math.max(1.6, S.s * 0.05);
      ctx.beginPath(); ctx.moveTo(-L / 2 + W / 2, -W / 2); ctx.lineTo(L / 2 - W / 2, -W / 2); ctx.arc(L / 2 - W / 2, 0, W / 2, -Math.PI / 2, Math.PI / 2); ctx.lineTo(-L / 2 + W / 2, W / 2); ctx.arc(-L / 2 + W / 2, 0, W / 2, Math.PI / 2, -Math.PI / 2); ctx.fill();
    }
    ctx.restore();
  }
}
const EXTRA = { patisserie: (S, t) => toppings(S, t) };

/** Build the choreography for one theme. */
export function reelChoreo(id) {
  const pair = REEL[id]; const fin = FINALE[id];
  const ch = {
    pad: 0.24,
    clear(v, move, theme) {
      const lines = linesOf(v, move, theme);
      if (!lines.length) return;
      let longest = 0;
      for (const line of lines) {
        const fx = line.axis === 'v' ? pair.col : pair.row; longest = Math.max(longest, fx.dur);
        const ex = EXTRA[id];
        playLine(v, theme, line, fx, ex ? (S, age) => { S._ctx = v.ctx; ex(S, age); } : null);
      }
      // The board-clear finale starts once the last line is mostly gone.
      if (move.allClear && fin) playBoard(v, fin.board, boardScene(v, theme), { delay: Math.round(longest * 0.55) });
    },
  };
  if (fin) {
    ch.boardClear = () => {}; // played inside clear()
    if (fin.place) ch.place = (v, move, theme) => {
      if (move.lines) return; // the clear carries this move
      const state = v.board.state || EMPTY;
      if (!move.placed || !move.placed.length || !move.placed.every((i) => state[i] > 0)) return;
      const S = boardScene(v, theme); const g = ghostCells(v, theme, move.placed);
      S.p = g.blocks; S.pc = { x: S.p.reduce((a, b) => a + b.x, 0) / S.p.length, y: S.p.reduce((a, b) => a + b.y, 0) / S.p.length, s: S.s };
      playBoard(v, fin.place, S, { guard: move.placed, restore: g.restore });
    };
    if (fin.idle) {
      const idleFx = fin.idle; const many = /S\.blocks/.test(idleFx.draw.toString());
      ch.idle = function idle(v) {
        const loop = () => { ch.idleBeat(v, null, v.getTheme()); v.later(loop, v.r(6000, 11000)); };
        v.later(loop, v.r(3000, 5000));
        return () => { for (const c of v.board.cells || []) if (c.classList) c.classList.remove('vfx-hide'); };
      };
      ch.idleBeat = (v, _x, theme) => {
        if (v.running && v.items.length) return; // never during another effect
        const state = v.board.state || EMPTY; const filled = []; const empty = [];
        for (let i = 0; i < 64; i++) (state[i] > 0 ? filled : empty).push(i);
        if (!filled.length) return;
        v.ensureCanvas();
        const th = theme || v.getTheme(); const S = boardScene(v, th);
        const k = filled[Math.floor(filled.length * 0.6)];
        const pick = many ? filled.filter((_, n) => n % 2 === 0) : [k];
        const g = ghostCells(v, th, pick);
        S.blocks = g.blocks; S.k = g.blocks.find((b) => b.i === k) || g.blocks[0];
        S.e = S.cells[empty.length ? empty[Math.floor(empty.length / 2)] : 35];
        playBoard(v, idleFx, S, { guard: pick, restore: g.restore });
      };
    }
  }
  return ch;
}

export const REEL_IDS = Object.keys(REEL);
