// App wiring: connects the Game controller to rendering, effects, audio,
// environments, input and the settings/dialog UI.

import { Game } from '../core/game.js';
import { Settings } from '../core/settings.js';
import { OPENING_VARIANTS } from '../core/openings.js';
import { placeOnCells, CELLS } from '../core/rules.js';
import { THEMES, getTheme, ThemeController } from '../themes/themes.js';
import { AudioEngine } from '../audio/engine.js';
import { BoardView, TrayView, makeBlock } from './render.js';
import { Effects } from './effects.js';
import { EnvironmentManager } from './environments.js';
import { bindInput } from './input.js';

const $ = (id) => document.getElementById(id);

export class App {
  constructor({ gen, storage, generator } = {}) {
    this.settings = new Settings(storage);
    this.game = new Game({ gen, settings: this.settings, generator });
    this.reduceMQ = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
    this.reducedMotion = () => !!this.reduceMQ.matches;

    this.playEl = $('play');
    this.boardEl = $('board');
    this.trayEl = $('tray');
    this.ghostEl = $('ghost');
    this.boardView = new BoardView(this.boardEl);
    this.trayView = new TrayView(this.trayEl);
    this.effects = new Effects({ layer: $('fx'), board: this.boardView, getTheme: () => this.theme, reducedMotion: this.reducedMotion });
    this.env = new EnvironmentManager($('env'), { reducedMotion: this.reducedMotion });
    this.audio = new AudioEngine({ settings: this.settings });
    this.audio.attach(window);

    this.themes = new ThemeController({ settings: this.settings, apply: (t) => this.applyTheme(t) });
    this.timers = new Set();
  }

  start() {
    this.themes.init();
    this.input = bindInput(this);
    this.bindGame();
    this.bindUi();
    this.layout();
    const ro = window.ResizeObserver ? new ResizeObserver(() => this.layout()) : null;
    if (ro) ro.observe($('board-area')); else window.addEventListener('resize', () => this.layout());
    if (window.visualViewport) window.visualViewport.addEventListener('resize', () => this.layout());
    if (this.reduceMQ.addEventListener) this.reduceMQ.addEventListener('change', () => this.env.build());
    const params = new URLSearchParams(location.search);
    const seed = params.has('seed') ? Number(params.get('seed')) : undefined;
    this.newGame(seed);
  }

  later(fn, ms) { const id = setTimeout(() => { this.timers.delete(id); fn(); }, ms); this.timers.add(id); return id; }
  clearTimers() { for (const id of this.timers) clearTimeout(id); this.timers.clear(); }

  // ---------- theme ----------
  applyTheme(theme) {
    this.theme = theme;
    const root = document.documentElement;
    for (const [k, v] of Object.entries(theme.vars)) root.style.setProperty(k, v);
    root.dataset.theme = theme.id;
    root.dataset.mat = theme.material;
    root.classList.toggle('dark', !!theme.dark);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme.vars['--bg']);
    this.boardView.setTheme(theme);
    this.boardView.render(this.game.cells);
    this.renderTray(true);
    this.env.set(theme.env, this.settings.get('animBg'));
    this.audio.setKit(theme.sound);
    if (this.demo) this.demo.setTheme(theme);
    if (this.input) this.input.refreshAim();
  }

  // ---------- layout ----------
  layout() {
    const area = $('board-area');
    const w = area.clientWidth; const h = area.clientHeight;
    const size = Math.max(200, Math.floor(Math.min(w, h, 560)));
    document.documentElement.style.setProperty('--bsize', size + 'px');
    const trayW = this.trayEl.clientWidth || size;
    const boardCell = size / 8.4;
    const tcs = Math.min(boardCell * 0.62, (trayW / 3 - 16) / 5.2);
    document.documentElement.style.setProperty('--tcs', Math.max(10, tcs).toFixed(1) + 'px');
    // A real board-size change invalidates drag geometry: return the piece.
    if (this.input && this.lastBoardSize && Math.abs(this.lastBoardSize - size) > 24) this.input.drag.cancel('layout');
    this.lastBoardSize = size;
  }

  // ---------- game ----------
  async newGame(seed) {
    this.clearTimers();
    this.effects.reset();
    if (this.input) this.input.reset();
    this.closeModal('m-over');
    $('over-bar').hidden = true;
    this.trayEl.hidden = false;
    await this.game.newGame({ seed });
  }

  bindGame() {
    const g = this.game;
    g.on('reset', () => { this.boardView.render(g.cells); this.renderTray(); this.renderScore(); });
    g.on('start', () => {
      this.boardView.render(g.cells);
      this.renderTray(); this.renderScore();
      if (g.opening && g.opening.special) this.toast(OPENING_VARIANTS.find((v) => v.id === g.opening.variant)?.name || 'Special start');
    });
    g.on('tray', () => this.renderTray());
    g.on('busy', () => this.renderTray());
    g.on('invalid', () => this.onInvalid());
    g.on('place', (move) => this.onMove(move));
    g.on('gameover', (info) => {
      const id = g.gameId;
      this.effects.gameOver();
      this.later(() => this.audio.play('gameOver'), 250);
      this.later(() => { if (g.gameId === id && g.over) this.showGameOver(info); }, 900);
      this.renderTray();
    });
  }

  onMove(move) {
    // Board updates first so geometry is exact; cosmetic ghosts animate over it.
    this.boardView.render(this.game.cells, move.placed.filter((i) => this.game.cells[i]));
    this.renderScore(move.newBest);
    this.renderTray();
    this.effects.place(move);
    this.audio.play('place', { size: move.placed.length });
    if (move.lines > 0) {
      this.effects.clear(move);
      if (move.allClear) {
        this.effects.allClear();
        this.audio.play('allClear');
      } else {
        this.audio.play('clear', { lines: move.lines });
      }
      if (move.combo >= 2) {
        this.effects.combo(move);
        this.later(() => this.audio.play('combo', { n: move.combo }), 140);
      }
    }
    if (this.themes.handleMove(move)) {
      this.later(() => this.toast('Theme: ' + this.theme.name), 600);
      this.refreshThemeList();
    }
  }

  onInvalid() {
    this.effects.invalid();
    this.audio.play('invalid');
  }

  renderScore(pulse) {
    $('score').textContent = String(this.game.score);
    $('best').textContent = String(this.game.best);
    if (pulse) { const b = $('best'); b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
  }

  renderTray() {
    if (!this.theme) return;
    const g = this.game;
    const drag = this.input ? this.input.drag : null;
    this.trayView.render(this.theme, g.tray, {
      selected: drag ? drag.selected : null,
      dragging: drag && drag.dragging ? drag.slot : null,
      fitsFn: (k) => g.pieceFits(k),
      busy: g.busy || g.over,
    });
    const left = g.remaining.length;
    $('tray-left').textContent = g.busy ? '' : g.over ? 'No more moves!' : `${left} piece${left === 1 ? '' : 's'} left`;
  }

  showGameOver(info) {
    $('over-score').textContent = String(info.score);
    $('over-best').textContent = String(info.best);
    $('over-newbest').hidden = !(info.newBest && info.score > 0);
    this.openModal('m-over');
  }

  // ---------- dialogs ----------
  modalOpen() { return !!document.querySelector('.modal-back:not([hidden])'); }
  openModal(id) {
    const m = $(id); m.hidden = false;
    void m.offsetWidth; // commit the hidden state so the fade-in transition runs
    m.classList.add('show');
    const f = m.querySelector('.btn.primary, .btn, button'); if (f) f.focus({ preventScroll: true });
  }
  closeModal(id) { const m = $(id); if (!m || m.hidden) return; m.classList.remove('show'); m.hidden = true; }
  closeTopModal() {
    if (!$('m-settings').hidden) return this.closeSettings();
    for (const id of ['m-confirm', 'm-help']) if (!$(id).hidden) return this.closeModal(id);
    if (!$('m-over').hidden) return this.viewBoard();
  }

  toast(text) {
    const t = $('toast');
    t.textContent = text;
    t.classList.remove('show'); void t.offsetWidth; t.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => t.classList.remove('show'), 1800);
  }

  viewBoard() {
    this.closeModal('m-over');
    this.trayEl.hidden = true;
    $('over-bar').hidden = false;
  }

  requestRestart() {
    this.audio.play('ui');
    if (this.game.isActive) this.openModal('m-confirm');
    else this.newGame();
  }

  bindUi() {
    $('btn-restart').addEventListener('click', () => this.requestRestart());
    $('btn-help').addEventListener('click', () => { this.audio.play('ui'); this.openModal('m-help'); });
    $('btn-settings').addEventListener('click', () => this.openSettings());
    $('btn-keep').addEventListener('click', () => { this.audio.play('ui'); this.closeModal('m-confirm'); });
    $('btn-confirm-restart').addEventListener('click', () => { this.closeModal('m-confirm'); this.newGame(); });
    $('btn-again').addEventListener('click', () => this.newGame());
    $('btn-again-bar').addEventListener('click', () => this.newGame());
    $('btn-view').addEventListener('click', () => this.viewBoard());
    document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => { this.audio.play('ui'); this.closeModal(b.closest('.modal-back').id); }));
    document.querySelectorAll('.modal-back').forEach((m) => m.addEventListener('pointerdown', (e) => {
      if (e.target !== m) return;
      if (m.id === 'm-settings') this.closeSettings();
      else if (m.id === 'm-help' || m.id === 'm-confirm') this.closeModal(m.id);
    }));
    this.bindSettings();
  }

  // ---------- settings ----------
  openSettings() {
    this.audio.play('ui');
    if (this.input) this.input.reset();
    this.refreshThemeList();
    this.syncSettingsUi();
    this.openModal('m-settings');
  }

  closeSettings() {
    this.themes.cancelPreview(); // uncommitted previews revert to the saved theme
    if (this.demo) this.demo.stop();
    this.refreshThemeList();
    this.closeModal('m-settings');
  }

  bindSettings() {
    document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => {
      this.audio.play('ui');
      document.querySelectorAll('.tab').forEach((x) => { x.classList.toggle('on', x === t); x.setAttribute('aria-selected', String(x === t)); });
      document.querySelectorAll('.pane').forEach((p) => { p.hidden = p.dataset.pane !== t.dataset.tab; });
    }));
    $('btn-settings-done').addEventListener('click', () => { this.audio.play('ui'); this.closeSettings(); });

    // Theme catalog
    const list = $('theme-list');
    for (const t of THEMES) {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'theme-card'; b.dataset.id = t.id; b.setAttribute('role', 'option');
      const sw = document.createElement('span'); sw.className = 'swatch';
      for (const v of t.vars ? Object.entries(t.vars) : []) if (['--board', '--cell', '--bg'].includes(v[0])) sw.style.setProperty(v[0], v[1]);
      [1, 2, 3].forEach((c) => sw.appendChild(makeBlock(t, c)));
      const name = document.createElement('span'); name.className = 'name'; name.textContent = t.name;
      const tag = document.createElement('span'); tag.className = 'tag';
      b.append(sw, name, tag);
      b.addEventListener('click', () => { this.themes.preview(t.id); this.audio.play('ui'); this.refreshThemeList(); });
      list.appendChild(b);
    }
    $('btn-theme-use').addEventListener('click', () => { this.themes.commit(); this.audio.play('ui'); this.refreshThemeList(); this.toast(this.theme.name + ' selected'); });
    $('btn-theme-cancel').addEventListener('click', () => { this.themes.cancelPreview(); this.audio.play('ui'); this.refreshThemeList(); });
    $('btn-demo').addEventListener('click', () => { this.ensureDemo(); this.demo.run(); });

    $('opt-auto').addEventListener('change', (e) => this.settings.set('autoSwitch', e.target.checked));
    $('opt-bg').addEventListener('change', (e) => { this.settings.set('animBg', e.target.checked); this.env.set(this.theme.env, e.target.checked); });

    // Sound
    $('opt-sound').addEventListener('change', (e) => { this.audio.setEnabled(e.target.checked); if (e.target.checked) this.audio.play('ui'); });
    $('opt-volume').addEventListener('input', (e) => { this.audio.setVolume(e.target.value / 100); $('vol-out').textContent = e.target.value + '%'; });
    $('opt-volume').addEventListener('change', () => this.audio.play('place'));
    $('btn-test-sound').addEventListener('click', () => {
      this.audio.unlock();
      this.audio.play('place');
      this.later(() => this.audio.play('clear', { lines: 1 }), 350);
      this.later(() => this.audio.play('combo', { n: 2 }), 950);
    });

    // Game
    const sel = $('opt-variant');
    sel.innerHTML = '<option value="any">Any variant</option>' + OPENING_VARIANTS.map((v) => `<option value="${v.id}">${v.name}</option>`).join('');
    $('opt-mode').addEventListener('click', (e) => {
      const b = e.target.closest('[data-mode]'); if (!b) return;
      this.settings.update('opening', { mode: b.dataset.mode }); this.audio.play('ui'); this.syncSettingsUi();
    });
    sel.addEventListener('change', () => {
      const patch = { variant: sel.value };
      if (sel.value !== 'any') patch.mode = 'always'; // convenient shortcut
      this.settings.update('opening', patch); this.syncSettingsUi();
    });
  }

  syncSettingsUi() {
    $('opt-auto').checked = this.settings.get('autoSwitch');
    $('opt-bg').checked = this.settings.get('animBg');
    const s = this.settings.get('sound');
    $('opt-sound').checked = s.enabled;
    $('opt-volume').value = String(Math.round(s.volume * 100));
    $('vol-out').textContent = Math.round(s.volume * 100) + '%';
    const o = this.settings.get('opening');
    document.querySelectorAll('#opt-mode [data-mode]').forEach((b) => { const on = b.dataset.mode === o.mode; b.classList.toggle('on', on); b.setAttribute('aria-checked', String(on)); });
    $('opt-variant').value = o.variant;
    $('opt-variant').disabled = o.mode === 'off';
    $('mode-note').textContent = { off: 'Off: every game starts with an empty board.', random: 'Random: about one game in four starts with some blocks already on the board.', always: 'Always: every game starts with some blocks on the board.' }[o.mode];
  }

  refreshThemeList() {
    const saved = this.themes.saved; const cur = this.themes.current;
    document.querySelectorAll('.theme-card').forEach((b) => {
      const id = b.dataset.id;
      b.classList.toggle('in-use', id === saved);
      b.classList.toggle('previewing', id === cur && id !== saved);
      b.setAttribute('aria-selected', String(id === cur));
      b.querySelector('.tag').textContent = id === saved ? 'In use' : id === cur ? 'Preview' : '';
    });
    const previewing = cur !== saved;
    $('btn-theme-use').disabled = !previewing;
    $('btn-theme-cancel').hidden = !previewing;
    $('theme-status').textContent = previewing ? `Previewing ${getTheme(cur).name}` : `${getTheme(saved).name} is in use`;
  }

  ensureDemo() {
    if (!this.demo) this.demo = new EffectsDemo(this);
    this.demo.setTheme(this.theme);
  }
}

/**
 * Isolated effects preview: its own small board, effects layer and cells.
 * It never touches the live game.
 */
class EffectsDemo {
  constructor(app) {
    this.app = app;
    this.view = new BoardView($('demo-board'));
    this.fx = new Effects({ layer: $('demo-fx'), board: this.view, getTheme: () => this.theme, reducedMotion: app.reducedMotion });
    this.cells = new Uint8Array(CELLS);
    this.timers = [];
  }
  setTheme(t) { this.theme = t; this.view.setTheme(t); this.view.render(this.cells); }
  stop() { this.timers.forEach(clearTimeout); this.timers = []; this.fx.reset(); this.view.clearPreview(); }
  at(ms, fn) { this.timers.push(setTimeout(fn, ms)); }
  fill(list) { this.cells = new Uint8Array(CELLS); for (const [i, c] of list) this.cells[i] = c; this.view.render(this.cells); }
  move(shape, r, c, color, combo) {
    const res = placeOnCells(this.cells, shape, r, c, color);
    if (!res) return;
    this.cells = res.cells;
    const move = { ...res, combo, color, allClear: res.lines > 0 && res.empty };
    this.view.render(this.cells, res.placed.filter((i) => this.cells[i]));
    this.fx.place(move);
    this.app.audio.play('place');
    if (move.lines) {
      this.fx.clear(move);
      if (move.allClear) { this.fx.allClear(); this.app.audio.play('allClear'); } else this.app.audio.play('clear', { lines: move.lines });
      if (combo >= 2) { this.fx.combo(move); setTimeout(() => this.app.audio.play('combo', { n: combo }), 140); }
    }
  }
  run() {
    this.stop();
    const row = (r, cols, color) => cols.map((c) => [r * 8 + c, color]);
    this.fill([...row(7, [0, 1, 2, 3, 4], 2), ...row(6, [0, 1], 5)]);
    this.at(200, () => this.view.preview(this.cells, 'line3-h', 7, 5, 4));
    this.at(900, () => { this.view.clearPreview(); this.move('line3-h', 7, 5, 4, 1); });
    this.at(2000, () => this.fill([...row(5, [0, 1, 2, 3, 4, 5], 1), ...row(6, [0, 1, 2, 3, 4, 5], 3), ...row(2, [2, 3], 6)]));
    this.at(2300, () => this.view.preview(this.cells, 'square2', 5, 6, 7));
    this.at(2900, () => { this.view.clearPreview(); this.move('square2', 5, 6, 7, 2); });
    this.at(4200, () => this.fill([...row(0, [3, 4, 5, 6, 7], 4)]));
    this.at(4500, () => this.view.preview(this.cells, 'line3-h', 0, 0, 1));
    this.at(5100, () => { this.view.clearPreview(); this.move('line3-h', 0, 0, 1, 3); });
    this.at(7000, () => { this.fill(Array.from({ length: 64 }, (_, i) => [i, 1 + (i % 7)]).filter(([i]) => (i * 7) % 5 !== 0 && (i % 9) !== 4)); this.fx.gameOver(); this.app.audio.play('gameOver'); });
    this.at(9000, () => { this.fx.reset(); this.fill([]); });
  }
}
