// Classic — the abstract light suite (approved in the VFX Studio). This file
// only adapts real game moves into the studio's scenes; the drawing and timing
// live in src/ui/vfx-classic/, shared with the studio so the shipped effect is
// the one that was approved, frame for frame.
//
// Event mapping (one routine per move, chosen by what the move achieved):
//   board clear > multi-line (row + column) > streak (combo >= 2) > single line
// Placement (a coloured rim) plays only when the move cleared nothing. Idle is
// a specular glint across one block now and then. No milestone effect.

import suite, { params } from '../vfx-classic/suite.js';
import { linesOf } from '../vfx-kit.js';

/** The frame-light circuit runs just outside the board, so keep a modest margin. */
export const pad = 0.24;
const EMPTY = new Int16Array(64);

function defaults(v, extra = {}) {
  const P = Object.fromEntries(params.map((p) => [p.key, p.def]));
  P.frame *= Math.min(1, 0.4 + 0.6 * v.level); // effect intensity
  P.rim *= Math.min(1, 0.4 + 0.6 * v.level);
  return { ...P, ...extra };
}

/** The studio's scene shape, built from the live board. */
function sceneOf(v, theme, lines, extra = {}) {
  const a = v.cell(0); const z = v.cell(63);
  const after = Array.from(v.board.state || EMPTY, (x) => Math.max(0, x));
  return {
    lines, cell: (i) => v.cell(i), theme,
    bounds: { x0: a.x - a.s / 2, y0: a.y - a.s / 2, x1: z.x + z.s / 2, y1: z.y + z.s / 2 },
    fx: { after, placed: [], ...extra },
  };
}

/** Play one suite event as a single engine item, drawn exactly as in the studio (no additive blend). */
function play(v, ev, scene, P, guardCells = null) {
  const st = suite.prepare(scene, P, ev);
  const life = suite.duration(P, ev);
  const stateOf = (vv) => vv.board.state || EMPTY;
  const snap = guardCells ? guardCells.map((i) => stateOf(v)[i]) : null;
  v.add({
    life, blend: 'source-over',
    draw(ctx, it, p, vv, age) {
      if (it.dead) return;
      // Idle and placement light blocks that are still on the board: stop if any of them changes.
      if (snap && guardCells.some((i, k) => stateOf(vv)[i] !== snap[k])) { it.dead = true; return; }
      suite.render(ctx, age, st, scene, P, ev);
    },
  });
}

export default {
  pad,

  place(v, move, theme) {
    if (move.lines) return; // the clear's choreography carries this move
    const state = v.board.state || EMPTY;
    if (!move.placed.length || !move.placed.every((i) => state[i] > 0)) return; // board not rendered yet
    play(v, 'place', sceneOf(v, theme, [], { placed: move.placed }), defaults(v), move.placed);
  },

  clear(v, move, theme) {
    const lines = linesOf(v, move, theme);
    if (!lines.length) return;
    if (move.allClear) { play(v, 'board', sceneOf(v, theme, [lines[0]]), defaults(v)); for (const l of lines.slice(1)) play(v, 'single', sceneOf(v, theme, [l]), defaults(v)); return; }
    const row = lines.find((l) => l.axis === 'h'); const col = lines.find((l) => l.axis === 'v');
    if (row && col) {
      play(v, 'multi', sceneOf(v, theme, [row, col]), defaults(v));
      for (const l of lines) if (l !== row && l !== col) play(v, 'single', sceneOf(v, theme, [l]), defaults(v));
      return;
    }
    const ev = move.combo >= 2 ? 'streak' : 'single';
    lines.forEach((l, k) => play(v, k === 0 ? ev : 'single', sceneOf(v, theme, [l]), defaults(v, { combo: Math.max(2, move.combo || 2) })));
  },

  // Handled inside clear(); present so the shared defaults never run for this theme.
  streak() {},
  boardClear() {},
  milestone() {},

  // Idle: now and then a specular glint slides across one block.
  idle(v) {
    const loop = () => { this.idleBeat(v, null, v.getTheme()); v.later(loop, v.r(6000, 11000)); };
    v.later(loop, v.r(3000, 5000));
    return () => {};
  },
  idleBeat(v, _x, theme) {
    if (v.running && v.items.length) return; // never during another effect
    const state = v.board.state || EMPTY;
    const filled = []; for (let i = 0; i < 64; i++) if (state[i] > 0) filled.push(i);
    if (!filled.length) return;
    v.ensureCanvas();
    const scene = sceneOf(v, theme || v.getTheme(), []);
    const i = filled[Math.floor(filled.length * 0.6)];
    play(v, 'idle', scene, defaults(v), [i]);
  },
};
