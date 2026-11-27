// Jelly Pop — Candy Ballet (approved in the VFX Studio). This file only adapts
// real game moves into the studio's scenes; the drawing and timing live in
// src/ui/vfx-jelly/ballet*.js, shared with the studio so the shipped effect is
// the one that was approved, frame for frame.
//
// Event mapping (one routine per move, chosen by what the move achieved):
//   board clear > multi-line (row + column) > streak (combo >= 2) > single line
// Placement plays only when the move cleared nothing. No milestone effect:
// the animated background is enough for this theme (decided in review).

import ballet, { params } from '../vfx-jelly/ballet.js';
import { linesOf } from '../vfx-kit.js';

/** Ballet exits loop well above the board, so this theme needs a deeper canvas margin. */
export const pad = 0.34;
const EMPTY = new Int16Array(64);

function defaults(v, extra = {}) {
  const P = Object.fromEntries(params.map((p) => [p.key, p.def]));
  P.sparkles *= v.level; // effect intensity
  return { ...P, ...extra };
}

/** The studio's scene shape, built from the live board. */
function sceneOf(v, theme, lines, extra = {}) {
  const a = v.cell(0); const z = v.cell(63);
  const after = Array.from(v.board.state || new Int16Array(64), (x) => Math.max(0, x));
  return {
    lines, cell: (i) => v.cell(i), theme,
    bounds: { x0: a.x - a.s / 2, y0: a.y - a.s / 2, x1: z.x + z.s / 2, y1: z.y + z.s / 2 },
    fx: { after, placed: [], ...extra },
  };
}

/** Hide DOM blocks the canvas is animating, and restore them however the effect ends. */
function hideCells(v, indices, ms) {
  const cells = (v.board.cells || []).filter((c, i) => indices.includes(i));
  for (const c of cells) c.classList.add('vfx-hide');
  const restore = () => { for (const c of cells) c.classList.remove('vfx-hide'); off(); };
  const off = v.onCleanup(restore);
  v.later(restore, ms);
  return restore;
}

/** Play one ballet event as a single engine item. `guard` cells abort it if the board changes under it. */
function play(v, ev, scene, P) {
  const st = ballet.prepare(scene, P, ev);
  const life = ballet.duration(P, ev);
  // Placement and idle animate blocks that are still on the board: stop if any of them changes.
  const guard = (ev === 'place' || ev === 'idle') && st.hidden ? st.hidden : null;
  const stateOf = (vv) => vv.board.state || EMPTY;
  const snap = guard ? guard.map((i) => stateOf(v)[i]) : null;
  let restore = null;
  if (st.hidden && st.hidden.length) restore = hideCells(v, st.hidden, life);
  v.add({
    life,
    draw(ctx, it, p, vv, age) {
      if (it.dead) return;
      if (snap && guard.some((i, k) => stateOf(vv)[i] !== snap[k])) { it.dead = true; if (restore) restore(); return; }
      ballet.render(ctx, age, st, scene, P, ev);
    },
  });
}

export default {
  pad,

  place(v, move, theme) {
    if (move.lines) return; // the clear's choreography carries this move
    const state = v.board.state || EMPTY;
    if (!move.placed.every((i) => state[i] > 0)) return; // board not rendered yet
    const scene = sceneOf(v, theme, [], { placed: move.placed });
    play(v, 'place', scene, defaults(v));
  },

  clear(v, move, theme) {
    const lines = linesOf(v, move, theme);
    if (!lines.length) return;
    if (move.allClear) { play(v, 'board', sceneOf(v, theme, lines), defaults(v)); return; }
    const row = lines.find((l) => l.axis === 'h'); const col = lines.find((l) => l.axis === 'v');
    if (row && col) {
      play(v, 'multi', sceneOf(v, theme, [row, col]), defaults(v));
      // Any further lines dance their own single clear alongside.
      for (const l of lines) if (l !== row && l !== col) play(v, 'single', sceneOf(v, theme, [l]), defaults(v));
      return;
    }
    const ev = move.combo >= 2 ? 'streak' : 'single';
    lines.forEach((l, k) => play(v, k === 0 ? ev : 'single', sceneOf(v, theme, [l]), defaults(v, { combo: move.combo })));
  },

  // Handled inside clear(); present so the shared defaults never run for this theme.
  streak() {},
  boardClear() {},
  milestone() {},

  // Idle: now and then a few neighbours do a tiny warm-up bounce.
  idle(v) {
    const loop = () => { this.idleBeat(v, null, v.getTheme()); v.later(loop, v.r(6000, 11000)); };
    v.later(loop, v.r(3000, 5000));
    return () => { for (const c of v.board.cells || []) c.classList.remove('vfx-hide'); };
  },
  idleBeat(v, _x, theme) {
    if (v.running && v.items.length) return; // never during another effect
    const filled = Array.from(v.board.state || []).filter((x) => x > 0).length;
    if (filled < 2) return;
    v.ensureCanvas();
    play(v, 'idle', sceneOf(v, theme || v.getTheme(), []), defaults(v));
  },
};
