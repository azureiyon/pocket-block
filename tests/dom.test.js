// Browser-only tests: rendering, effects cleanup, environments, layout on
// small phone viewports and every theme x starting-variant combination.
import { test, assert, eq, report } from './harness.js';
import { BoardView } from '../src/ui/render.js';
import { Effects, MAX_PARTICLES } from '../src/ui/effects.js';
import { EnvironmentManager, ENVIRONMENTS } from '../src/ui/environments.js';
import { THEMES, getTheme } from '../src/themes/themes.js';
import { OPENING_VARIANTS } from '../src/core/openings.js';
import { placeOnCells } from '../src/core/rules.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function sandbox() {
  const host = document.createElement('div');
  host.style.cssText = 'position:fixed;left:-2000px;top:0;width:360px;height:360px;--bsize:320px';
  host.innerHTML = '<div class="board-wrap" style="position:relative;width:320px;height:320px"><div class="board"></div><div class="fx"></div></div>';
  document.body.appendChild(host);
  return { host, board: host.querySelector('.board'), fx: host.querySelector('.fx') };
}

test('dom: board redraw keeps existing block elements (animations survive)', () => {
  const { host, board } = sandbox();
  const view = new BoardView(board); view.setTheme(getTheme('jelly'));
  let cells = new Uint8Array(64);
  cells = placeOnCells(cells, 'square2', 0, 0, 3).cells;
  view.render(cells, [0, 1, 8, 9]);
  const el = board.children[0].querySelector('.blk');
  assert(el.classList.contains('fx-place'), 'placement animation applied');
  cells = placeOnCells(cells, 'single', 5, 5, 2).cells;
  view.render(cells, [45]);
  assert(board.children[0].querySelector('.blk') === el, 'same element kept');
  assert(el.classList.contains('fx-place'), 'animation not erased by later redraw');
  eq(board.querySelectorAll('.blk').length, 5, 'no phantom blocks');
  host.remove();
});

test('dom: effects respond to real move data, stay bounded and clean up', async () => {
  const { host, board, fx } = sandbox();
  const view = new BoardView(board);
  for (const theme of THEMES) {
    view.setTheme(theme);
    const effects = new Effects({ layer: fx, board: view, getTheme: () => theme });
    let cells = new Uint8Array(64);
    for (let c = 0; c < 7; c++) cells[c] = 1;
    for (let r = 1; r < 8; r++) cells[r * 8 + 7] = 2;
    view.render(cells);
    const res = placeOnCells(cells, 'single', 0, 7, 4);
    const move = { ...res, color: 4, combo: 3, allClear: res.empty };
    view.render(res.cells, res.placed);
    effects.place(move); effects.clear(move); effects.combo(move); effects.allClear(); effects.invalid(); effects.gameOver();
    assert(fx.querySelectorAll('.clear-ghost').length === 15, `${theme.id}: ghost per cleared cell`);
    assert(fx.querySelectorAll('.sweep').length === 2, `${theme.id}: row and column sweeps`);
    assert(fx.querySelector('.fx-label.combo') && fx.querySelector('.fx-label.allclear'), 'labels shown');
    await sleep(120);
    assert(effects.particles.size > 0 && effects.particles.size <= MAX_PARTICLES, `${theme.id}: particles bounded`);
    assert(fx.querySelector('.pt-' + theme.particle), `${theme.id}: themed particles`);
    assert(board.classList.contains('is-over'));
    effects.reset();
    eq(fx.children.length, 0, `${theme.id}: reset removes all nodes`);
    eq(effects.timers.size, 0, 'timers cleared');
    assert(!board.classList.contains('is-over'));
  }
  host.remove();
});

test('dom: environments build motifs, honour toggles, pause and clean up', () => {
  const root = document.createElement('div');
  document.body.appendChild(root);
  let reduced = false;
  const env = new EnvironmentManager(root, { reducedMotion: () => reduced });
  for (const t of THEMES) {
    env.set(t.env, true);
    const animated = root.children.length;
    assert(root.classList.contains('animated'), t.env + ' animated');
    assert(ENVIRONMENTS[t.env].motion, t.env + ' has motion motifs');
    env.set(t.env, false);
    assert(root.classList.contains('still'));
    assert(root.children.length < animated, `${t.env}: motion nodes removed when off`);
  }
  env.set('pond', true); reduced = true; env.build();
  assert(root.classList.contains('still'), 'reduced motion disables animation');
  assert(!root.querySelector('.e-koi'), 'no swimming fish under reduced motion');
  env.destroy();
  eq(root.children.length, 0);
  root.remove();
  report('environments: 14 environments built animated and still');
});

async function loadGame(width, height, query = '') {
  const frame = document.createElement('iframe');
  frame.style.cssText = `width:${width}px;height:${height}px;border:0;position:fixed;left:-3000px;top:0`;
  frame.src = '../index.html?seed=5' + query;
  document.body.appendChild(frame);
  await new Promise((r) => frame.addEventListener('load', r, { once: true }));
  for (let k = 0; k < 50 && !(frame.contentWindow.PocketBlocks && frame.contentWindow.PocketBlocks.app.game.tray.length); k++) await sleep(50);
  return frame;
}

test('dom: small-phone layouts keep score, board and tray visible', async () => {
  for (const [w, h] of [[320, 568], [375, 667], [390, 844], [430, 932], [568, 320]]) {
    const frame = await loadGame(w, h);
    const d = frame.contentDocument;
    await sleep(150);
    const r = (sel) => d.querySelector(sel).getBoundingClientRect();
    const board = r('#board'); const tray = r('#tray'); const score = r('#score');
    const ok = board.top >= 0 && board.bottom <= h && tray.bottom <= h + 0.5 && score.top >= 0 && board.width >= Math.min(220, h * 0.5);
    report(`${w}x${h}: board ${Math.round(board.width)}px, tray bottom ${Math.round(tray.bottom)}/${h}`);
    assert(ok, `${w}x${h} layout fits`);
    assert(d.documentElement.scrollWidth <= w, 'no horizontal overflow');
    const slots = d.querySelectorAll('.slot');
    for (const s of slots) assert(s.getBoundingClientRect().height >= 44, 'touch-sized tray slots');
    frame.remove();
  }
});

test('dom: every theme x starting variant combination starts cleanly', async () => {
  const frame = await loadGame(390, 844);
  const w = frame.contentWindow; const app = w.PocketBlocks.app;
  const errors = [];
  w.addEventListener('error', (e) => errors.push(e.message));
  let combos = 0; let special = 0;
  for (const t of THEMES) {
    app.themes.preview(t.id);
    for (const v of OPENING_VARIANTS) {
      app.settings.set('opening', { mode: 'always', variant: v.id });
      await app.newGame();
      const g = app.game;
      const rendered = w.document.querySelectorAll('#board .blk').length;
      eq(rendered, g.cells.filter((x) => x).length, `${t.id}/${v.id}: rendered blocks match state`);
      eq(w.document.querySelectorAll('#tray .piece').length, 3, 'three tray pieces');
      eq(g.score, 0);
      if (g.opening.special) special++;
      // Play one legal move to exercise effects with starting blocks.
      outer: for (let s = 0; s < 3; s++) for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (g.canPlace(s, r, c)) { g.place(s, r, c); break outer; }
      combos++;
    }
  }
  app.themes.cancelPreview();
  app.settings.set('opening', { mode: 'random', variant: 'any' });
  eq(errors, [], 'no runtime errors');
  report(`theme x variant: ${combos} combinations started, ${special} with accepted special openings`);
  frame.remove();
});

test('dom: restart confirmation, game over dialog and View Board', async () => {
  const frame = await loadGame(390, 844);
  const w = frame.contentWindow; const d = frame.contentDocument; const app = w.PocketBlocks.app; const g = app.game;
  outer: for (let s = 0; s < 3; s++) for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (g.canPlace(s, r, c)) { g.place(s, r, c); break outer; }
  d.getElementById('btn-restart').click();
  assert(!d.getElementById('m-confirm').hidden, 'active game asks for confirmation');
  d.getElementById('btn-keep').click();
  assert(d.getElementById('m-confirm').hidden && g.moves === 1, 'keep playing preserves game');
  // Force a game over and check the dialog.
  while (!g.over) {
    if (g.busy) { await sleep(10); continue; }
    let moved = false;
    for (let s = 0; s < 3 && !moved; s++) for (let r = 0; r < 8 && !moved; r++) for (let c = 0; c < 8 && !moved; c++) if (g.canPlace(s, r, c)) { g.place(s, r, c); moved = true; }
    await sleep(5);
  }
  await sleep(1100);
  assert(!d.getElementById('m-over').hidden, 'game over dialog');
  assert(d.getElementById('m-over').textContent.includes('No more moves!'));
  d.getElementById('btn-view').click();
  assert(d.getElementById('m-over').hidden && !d.getElementById('over-bar').hidden, 'View Board shows the final board');
  d.getElementById('btn-again-bar').click();
  await sleep(100);
  assert(!g.over && g.score === 0, 'Play Again starts fresh');
  frame.remove();
});
