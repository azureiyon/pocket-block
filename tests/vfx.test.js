import { test, assert, eq, report } from './harness.js';
import { Vfx, MAX_VFX_PARTICLES, SPRITE_KINDS } from '../src/ui/vfx.js';
import { RECIPES, getRecipe } from '../src/ui/vfx-recipes.js';
import { THEMES } from '../src/themes/themes.js';

// A canvas 2D context that accepts every call and counts draws.
function fakeCtx(stats) {
  const grad = { addColorStop() {} };
  return new Proxy({}, {
    get(target, k) {
      if (k in target) return target[k];
      if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => grad;
      if (k === 'drawImage' || k === 'stroke' || k === 'fill' || k === 'fillRect') return () => { stats.draws++; };
      return () => {};
    },
    set(target, k, v) { target[k] = v; return true; },
  });
}
function fakeDoc(stats) {
  return {
    createElement() { const el = { style: {}, width: 0, height: 0, className: '', getContext: () => fakeCtx(stats) }; stats.canvases++; return el; },
  };
}
function setup(themeId = 'witch', enabled = true) {
  const stats = { draws: 0, canvases: 0 };
  const queue = []; let t = 0;
  const layer = { clientWidth: 360, clientHeight: 360, prepend() {} };
  const board = { cellBox: (i) => ({ x: (i % 8) * 45, y: Math.floor(i / 8) * 45, w: 42, h: 42 }) };
  const theme = THEMES.find((x) => x.id === themeId);
  const v = new Vfx({ layer, board, getTheme: () => theme, enabled: () => enabled, doc: fakeDoc(stats), raf: (fn) => queue.push(fn), now: () => t });
  const run = (ms) => { const end = t + ms; while (queue.length && t < end) { t += 16; queue.shift()(t); } };
  return { v, stats, queue, run };
}
const move = (over = {}) => ({ placed: [27, 28], rows: [3], cols: [4], lines: 2, combo: 6, clearedCells: Array.from({ length: 15 }, (_, k) => ({ i: k < 8 ? 24 + k : 4 + (k - 8) * 8 })), wiped: [2], ...over });

test('vfx: every theme has a complete spell recipe', () => {
  const circles = ['star', 'tri', 'rose', 'flower', 'ticks', 'gear', 'square', 'pixel', 'ring'];
  const sigs = ['slash', 'vortex', 'constellation', 'ribbon', 'ripple', 'glitch', 'pillar', 'rays', 'rise', 'fall'];
  for (const t of THEMES) {
    assert(RECIPES[t.id], `recipe for ${t.id}`);
    const r = getRecipe(t);
    assert(SPRITE_KINDS.includes(r.sprite) && SPRITE_KINDS.includes(r.sprite2), `${t.id} sprites`);
    assert(circles.includes(r.circle), `${t.id} circle ${r.circle}`);
    assert(sigs.includes(r.sig), `${t.id} signature ${r.sig}`);
    assert(r.colors.length >= 2, `${t.id} colours`);
  }
});

test('vfx: place, clear, combo and board clear draw, then the loop stops by itself', () => {
  const { v, stats, queue, run } = setup();
  v.place(move());
  v.clear(move());
  v.combo(move());
  v.allClear();
  assert(v.particles.length > 0 && v.items.length > 0, 'effects queued');
  assert(v.particles.length <= MAX_VFX_PARTICLES, 'particle budget');
  run(400);
  assert(stats.draws > 50, 'drew frames');
  run(4000);
  eq([v.items.length, v.particles.length, v.running, queue.length], [0, 0, false, 0], 'idle once everything has faded');
  report(`vfx: ${stats.draws} draw calls for one big turn, ${stats.canvases} canvases (layer + cached sprites)`);
});

test('vfx: every signature runs for every theme without errors', () => {
  for (const t of THEMES) {
    const { v, run } = setup(t.id);
    v.place(move()); v.clear(move()); v.combo(move({ combo: 8 })); v.allClear(); v.milestone({ n: 1 }); v.idleBeat();
    run(6000);
    eq(v.running, false, t.id);
  }
});

test('vfx: particle budget holds under a burst of turns', () => {
  const { v, run } = setup('mahjong');
  for (let k = 0; k < 12; k++) { v.clear(move({ lines: 4, rows: [1, 2, 3, 4] })); v.combo(move()); v.allClear(); }
  assert(v.particles.length <= MAX_VFX_PARTICLES, `${v.particles.length} <= ${MAX_VFX_PARTICLES}`);
  run(5000);
});

test('vfx: turned off (or reduced motion) means no canvas and no work', () => {
  const { v, stats, queue } = setup('witch', false);
  v.place(move()); v.clear(move()); v.combo(move()); v.allClear();
  eq([stats.canvases, queue.length, v.particles.length], [0, 0, 0]);
});

// ---------- batch 1 choreography ----------
import { CHOREO } from '../src/ui/vfx-choreo/index.js';
import { seedVfx } from '../src/ui/vfx.js';
import { LAB_MOVES } from '../src/ui/vfx-lab.js';

test('vfx batch 1: only the five Soft & Dreamy themes have custom choreography', () => {
  eq(Object.keys(CHOREO).sort(), ['cloud', 'jelly', 'pastel', 'patisserie', 'soda']);
  for (const [id, ch] of Object.entries(CHOREO)) for (const k of ['place', 'clear', 'streak', 'milestone', 'boardClear', 'idle', 'idleBeat']) assert(typeof ch[k] === 'function', `${id}.${k}`);
});

test('vfx batch 1: every feedback type runs, draws and goes idle', () => {
  for (const id of Object.keys(CHOREO)) {
    const { v, stats, run } = setup(id);
    for (const [k, mk] of Object.entries(LAB_MOVES)) {
      const m = mk();
      v.place(m); if (m.lines) v.clear(m); if (m.combo >= 2) v.combo(m); if (m.allClear) v.allClear();
      run(60);
    }
    v.milestone({ n: 1 }); v.idleBeat();
    run(200);
    assert(stats.draws > 100, `${id} drew (${stats.draws})`);
    run(8000);
    eq([v.items.length, v.particles.length, v.running], [0, 0, false], `${id} idle after effects`);
  }
});

test('vfx batch 1: seeded replays produce identical drawing', () => {
  const trace = (id) => {
    const { v, run } = setup(id);
    const calls = [];
    const orig = v.add.bind(v);
    v.add = (it) => { calls.push(it.life, it.delay || 0); orig(it); };
    seedVfx(42); const m = LAB_MOVES.multi(); v.place(m); v.clear(m); v.combo({ ...m, combo: 4 }); seedVfx(null);
    run(500);
    return JSON.stringify([calls, v.particles.map((q) => [q.x.toFixed(2), q.y.toFixed(2)])]);
  };
  for (const id of Object.keys(CHOREO)) eq(trace(id), trace(id), id);
});

test('vfx batch 1: switching theme tears down timers, idle life and everything on screen', () => {
  const { v, run } = setup('jelly');
  v.board.cells = [];
  v.setTheme();
  const m = LAB_MOVES.multi(); v.clear(m); v.combo({ ...m, combo: 5 });
  assert(v.items.length > 0 && v.timers.size > 0, 'busy');
  v.teardown();
  eq([v.items.length, v.particles.length, v.timers.size, v.idleStop], [0, 0, 0, null]);
  run(100);
});

test('vfx batch 1: intensity scales particle counts', () => {
  const count = (level) => { const { v } = setup('soda'); v.levelFn = () => level; v.place(LAB_MOVES.place()); return v.particles.length; };
  assert(count(0.25) < count(1), `${count(0.25)} < ${count(1)}`);
});
