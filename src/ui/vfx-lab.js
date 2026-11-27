// Development-only VFX lab: open the game with ?vfxlab. Replays each feedback
// type deterministically (seeded) on a fixture board, at 1x, 1/2x or 1/4x,
// without touching the real game state. Closing restores the real board.

import { seedVfx } from './vfx.js';
import { THEMES } from '../themes/themes.js';
import { CHOREO } from './vfx-choreo/index.js';

const SEED = 20261124;

/** Fixture board: a few scattered blocks, plus the cells each preview needs. */
function fixture() {
  const cells = new Uint8Array(64);
  const put = (i, c) => { cells[i] = c; };
  [0, 1, 9, 14, 15, 22, 31, 33, 39, 48, 54, 57, 62, 63].forEach((i, k) => put(i, 1 + (k % 7)));
  return cells;
}
const row = (r) => Array.from({ length: 8 }, (_, c) => r * 8 + c);
const col = (c) => Array.from({ length: 8 }, (_, r) => r * 8 + c);
const cleared = (idx) => idx.map((i, k) => ({ i, color: 1 + ((i * 3 + k) % 7) }));

export const LAB_MOVES = {
  place: () => ({ placed: [18, 19, 20, 27], rows: [], cols: [], lines: 0, combo: 0, clearedCells: [], wiped: [] }),
  single: () => ({ placed: [44, 45], rows: [5], cols: [], lines: 1, combo: 1, clearedCells: cleared(row(5)), wiped: [] }),
  multi: () => { const set = [...new Set([...row(5), ...col(2)])]; return { placed: [42, 50], rows: [5], cols: [2], lines: 2, combo: 1, clearedCells: cleared(set), wiped: [3] }; },
  streak: () => ({ placed: [26, 27], rows: [3], cols: [], lines: 1, combo: 5, clearedCells: cleared(row(3)), wiped: [] }),
  board: () => ({ placed: [27, 28], rows: [3], cols: [], lines: 1, combo: 2, clearedCells: cleared(row(3)), wiped: [], allClear: true }),
};

export function playLab(app, kind) {
  const v = app.vfx;
  seedVfx(SEED);
  v.reset();
  const cells = fixture();
  const m = LAB_MOVES[kind === 'idle' || kind === 'milestone' ? 'place' : kind]();
  if (kind === 'place') { for (const i of m.placed) cells[i] = 3; app.boardView.render(cells, m.placed); } else app.boardView.render(kind === 'board' ? new Uint8Array(64) : cells);
  if (kind === 'place') v.place(m);
  else if (kind === 'idle') v.idleBeat();
  else if (kind === 'milestone') v.milestone({ n: 1, every: 1000 });
  else {
    v.place(m);
    v.clear(m);
    if (m.combo >= 2) v.combo(m);
    if (m.allClear) v.allClear();
  }
  seedVfx(null);
}

export function openVfxLab(app) {
  const doc = document;
  if (doc.getElementById('vfx-lab')) return;
  const el = doc.createElement('div');
  el.id = 'vfx-lab';
  el.innerHTML = `
    <style>
      #vfx-lab { position: fixed; left: 8px; bottom: 8px; z-index: 50; width: 220px; padding: 10px; border-radius: 12px; background: rgba(20,20,28,.92); color: #f2f2f5; font: 12px/1.35 system-ui, sans-serif; box-shadow: 0 8px 24px rgba(0,0,0,.35); }
      #vfx-lab h4 { margin: 0 0 6px; font-size: 12px; font-weight: 700; }
      #vfx-lab select, #vfx-lab button { font: inherit; color: inherit; background: #2c2c38; border: 1px solid #4a4a5c; border-radius: 6px; padding: 4px 6px; }
      #vfx-lab select { width: 100%; margin-bottom: 6px; }
      #vfx-lab .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
      #vfx-lab .row { display: flex; gap: 4px; margin-top: 6px; }
      #vfx-lab .row button { flex: 1; }
      #vfx-lab button.on { background: #5b5bd6; border-color: #8a8af0; }
      #vfx-lab p { margin: 6px 0 0; color: #a9a9b8; }
    </style>
    <h4>VFX lab</h4>
    <select id="lab-theme">${THEMES.map((t) => `<option value="${t.id}">${CHOREO[t.id] ? '★ ' : ''}${t.name}</option>`).join('')}</select>
    <div class="grid">
      <button data-k="idle">Idle beat</button><button data-k="place">Place</button>
      <button data-k="single">Single line</button><button data-k="multi">Multi line</button>
      <button data-k="streak">Streak ×5</button><button data-k="milestone">Milestone</button>
      <button data-k="board">Board clear</button><button data-k="all">Play all</button>
    </div>
    <div class="row"><button data-s="1" class="on">1×</button><button data-s="0.5">½×</button><button data-s="0.25">¼×</button></div>
    <div class="row"><button id="lab-close">Close lab</button></div>
    <p>★ = custom choreography. Replays are seeded and identical every time. The real game is untouched.</p>`;
  doc.body.appendChild(el);
  const sel = el.querySelector('#lab-theme');
  sel.value = app.theme.id;
  sel.addEventListener('change', () => { app.themes.preview(sel.value); });
  let queue = [];
  el.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => {
    queue.forEach(clearTimeout); queue = [];
    if (b.dataset.k !== 'all') { playLab(app, b.dataset.k); return; }
    const order = ['idle', 'place', 'single', 'multi', 'streak', 'milestone', 'board'];
    const gap = 2600 / (app.vfx.timeScale || 1);
    order.forEach((k, n) => queue.push(setTimeout(() => playLab(app, k), n * gap)));
  }));
  el.querySelectorAll('[data-s]').forEach((b) => b.addEventListener('click', () => {
    app.vfx.timeScale = Number(b.dataset.s);
    el.querySelectorAll('[data-s]').forEach((x) => x.classList.toggle('on', x === b));
  }));
  el.querySelector('#lab-close').addEventListener('click', () => {
    queue.forEach(clearTimeout); app.vfx.timeScale = 1; app.vfx.reset();
    app.boardView.render(app.game.cells); el.remove();
  });
  window.PocketBlocksLab = { play: (k) => playLab(app, k) };
}
