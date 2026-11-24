// VFX Studio runtime. Every concept is a pure function of time
// (render(ctx, t, state, scene, params)), so pausing, scrubbing, stepping,
// looping and side-by-side comparison are exact and repeatable. Production
// effects run through the real engine on a simulated clock (variants/production.js).
//
// URL options (also used for automated storyboard capture):
//   ?theme=jelly&variants=jelly-a,jelly-b,jelly-c&event=single&fixture=row-mid
//   &device=390&t=800&paused=1&storyboard=jelly-a

import { THEMES, getTheme } from '../src/themes/themes.js';
import { BoardView } from '../src/ui/render.js';
import { EnvironmentManager } from '../src/ui/environments.js';
import { jellyBlock, roundRectPath } from '../src/ui/vfx-jelly/jelly-art.js';
import conceptA from './concepts/jelly-a-jewel.js';
import conceptB from './concepts/jelly-b-crystal.js';
import conceptC from '../src/ui/vfx-jelly/ballet.js';
import { PRODUCTION } from './variants/production.js';
import pastelA from './concepts/pastel-a-waltz.js';
import pastelB from './concepts/pastel-b-petal.js';
import pastelC from './concepts/pastel-c-inlay.js';
import lightA from '../src/ui/vfx-classic/sweep.js';
import lightB from './concepts/pastel-l2-stardust.js';
import lightC from '../src/ui/vfx-classic/resonance.js';
import lightSuite from '../src/ui/vfx-classic/suite.js';
import cloudA from './concepts/cloud-a-ascend.js';
import cloudB from './concepts/cloud-b-dawn.js';
import cloudC from './concepts/cloud-c-heaven.js';

const $ = (id) => document.getElementById(id);
const FRAME = 1000 / 60;
const LOOP_GAP = 500; // ms of stillness between loops (motion-design: leave 100-200ms+ after resolution)

// ---------- registry ----------
const CONCEPTS = { jelly: [conceptA, conceptB, conceptC], pastel: [lightSuite, lightA, lightB, lightC, pastelA, pastelB, pastelC], cloud: [cloudA, cloudB, cloudC] };
const variantsFor = (themeId) => [...(CONCEPTS[themeId] || []), ...PRODUCTION.filter((v) => v.id !== 'prod-original' || themeId === 'jelly')];
const variantById = (themeId, id) => variantsFor(themeId).find((v) => v.id === id) || variantsFor(themeId)[0];

const EVENTS = [['idle', 'Idle'], ['place', 'Placement'], ['single', 'Single line'], ['multi', 'Multi line'], ['streak', 'Streak'], ['milestone', 'Milestone'], ['board', 'Board clear']];

// ---------- deterministic fixture boards ----------
const SCATTER = [0, 1, 9, 14, 15, 22, 31, 33, 39, 48, 54, 57, 62, 63];
const colourOf = (i) => 1 + ((i * 3 + (i >> 3)) % 7);
function fixture(id) {
  const before = new Uint8Array(64);
  const set = (list) => list.forEach((i) => { before[i] = colourOf(i); });
  let rows = []; let cols = []; let placed = [];
  if (id === 'row-top') { set(SCATTER.filter((i) => i > 15)); rows = [1]; placed = [10, 11, 3]; }
  else if (id === 'crowded') { set([...SCATTER, 16, 17, 24, 25, 26, 40, 41, 42, 46, 47, 55, 56, 58, 59, 60, 61]); rows = [6]; placed = [52, 53, 45]; }
  else if (id === 'column') { set(SCATTER); cols = [2]; placed = [26, 34, 35]; }
  else if (id === 'multi') { set(SCATTER); rows = [5]; cols = [2]; placed = [42, 43, 50]; }
  else if (id === 'place') { set([...SCATTER, 19, 20, 26, 29, 36]); placed = [27, 28, 35]; }
  else if (id === 'boardclear') { rows = [5]; placed = [44, 45, 46]; }
  else { set(SCATTER); rows = [5]; placed = [44, 45, 36]; }
  const lineCells = [...rows.flatMap((r) => Array.from({ length: 8 }, (_, c) => r * 8 + c)), ...cols.flatMap((c) => Array.from({ length: 8 }, (_, r) => r * 8 + c))];
  set([...lineCells, ...placed]);
  const cleared = [...new Set(lineCells)];
  const after = Uint8Array.from(before); for (const i of cleared) after[i] = 0;
  return { before, after, rows, cols, placed, cleared };
}
// Each event opens on the board that shows it best (you can still change it).
const EVENT_FIXTURE = { idle: 'crowded', place: 'place', single: 'row-mid', multi: 'multi', streak: 'row-mid', milestone: 'row-mid', board: 'boardclear' };
const FIXTURES = [['place', 'Placement board'], ['boardclear', 'Last row on the board'], ['row-mid', 'Row 6, light board'], ['row-top', 'Row 2, near the top'], ['crowded', 'Row 7, crowded board'], ['column', 'Column 3'], ['multi', 'Row + column']];

function moveFor(fx, event) {
  const clearedCells = fx.cleared.map((i) => ({ i, color: fx.before[i] }));
  const base = { placed: fx.placed, rows: fx.rows, cols: fx.cols, lines: fx.rows.length + fx.cols.length, combo: 1, clearedCells, wiped: [], color: 3, mode: 'blast', arcade: true };
  if (event === 'place') return { ...base, rows: [], cols: [], lines: 0, clearedCells: [], combo: 0 };
  if (event === 'streak') return { ...base, combo: 5 };
  if (event === 'board') return { ...base, allClear: true };
  return base;
}

// ---------- state ----------
const url = new URLSearchParams(location.search);
const S = {
  theme: url.get('theme') || 'jelly',
  fixture: url.get('fixture') || null,
  device: Number(url.get('device') || 390),
  event: url.get('event') || 'single',
  t: Number(url.get('t') || 0),
  playing: url.get('paused') !== '1',
  speed: 1, loop: true, focus: 0, blocks: url.get('blocks') || 'matched',
  panels: [], storyboard: url.get('storyboard') || null,
};
const initialVariants = (url.get('variants') || '').split(',').filter(Boolean);
if (!S.fixture) S.fixture = EVENT_FIXTURE[S.event] || 'row-mid';

// ---------- params & presets ----------
const userPresetsKey = (vid) => 'pbStudio.presets.' + vid;
function userPresets(vid) { try { return JSON.parse(localStorage.getItem(userPresetsKey(vid)) || '{}'); } catch (e) { return {}; } }
function saveUserPresets(vid, obj) { try { localStorage.setItem(userPresetsKey(vid), JSON.stringify(obj)); } catch (e) { /* private mode */ } }
function defaults(variant) { return Object.fromEntries(variant.params.map((p) => [p.key, p.def])); }
function presetValues(variant, name) {
  const all = { ...variant.presets, ...userPresets(variant.id) };
  return { ...defaults(variant), ...(all[name] || {}) };
}

// ---------- panels ----------
class Panel {
  constructor(index, variantId, fixedT = null, caption = null) {
    this.index = index; this.fixedT = fixedT;
    this.el = document.createElement('section'); this.el.className = 'panel' + (fixedT !== null ? ' frame' : '');
    this.el.innerHTML = `
      ${fixedT === null ? '<header><select class="v"></select></header>' : ''}
      <div class="phone"><div class="board-wrap"><div class="board"></div><div class="fx"></div></div></div>
      ${caption ? `<div class="caption"><b>${caption.label}</b><span>${caption.note}</span></div>` : '<footer><span class="name"></span><span class="tt"></span></footer>'}`;
    this.wrap = this.el.querySelector('.board-wrap'); this.fx = this.el.querySelector('.fx');
    this.boardView = new BoardView(this.el.querySelector('.board'));
    this.canvas = document.createElement('canvas'); this.canvas.className = 'concept'; this.fx.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    const sel = this.el.querySelector('select.v');
    if (sel) sel.addEventListener('change', () => { this.setVariant(sel.value); focus(this.index); renderParams(); draw(); });
    this.el.querySelector('.phone').addEventListener('click', () => { if (fixedT === null) { focus(this.index); renderParams(); } });
    this.setVariant(variantId);
  }
  get theme() { return getTheme(S.theme); }
  setVariant(id) {
    if (this.sim) { this.sim.dispose(); this.sim = null; }
    this.variant = variantById(S.theme, id);
    this.preset = 'Default'; this.P = defaults(this.variant);
    const sel = this.el.querySelector('select.v');
    if (sel) { sel.innerHTML = variantsFor(S.theme).map((v) => `<option value="${v.id}">${v.label}</option>`).join(''); sel.value = this.variant.id; }
    const name = this.el.querySelector('.name'); if (name) name.textContent = this.variant.kind === 'concept' ? 'Concept prototype' : 'Engine playback';
    this.dirty = true;
  }
  layout() {
    const b = Math.min(S.device - 24, 520);
    this.el.querySelector('.phone').style.width = S.device + 'px';
    this.wrap.style.setProperty('--bsize', b + 'px');
    this.wrap.style.width = this.wrap.style.height = b + 'px';
    this.pad = Math.round(b * 0.32);
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    Object.assign(this.canvas.style, { left: -this.pad + 'px', top: -this.pad + 'px', width: b + this.pad * 2 + 'px', height: b + this.pad * 2 + 'px' });
    this.canvas.width = Math.round((b + this.pad * 2) * this.dpr); this.canvas.height = Math.round((b + this.pad * 2) * this.dpr);
    this.boardView.setTheme(this.theme);
    this.dirty = true;
  }
  scene() {
    const fx = fixture(S.fixture); const pal = this.theme.palette;
    const cell = (i) => { const b = this.boardView.cellBox(i, this.wrap); return { x: b.x + b.w / 2 + this.pad, y: b.y + b.h / 2 + this.pad, s: b.w }; };
    const mk = (axis, idx, list) => { const cells = list.map((i) => ({ i, ...cell(i), color: pal[(fx.before[i] - 1) % pal.length] })); const a = cells[0]; const z = cells[7]; return { axis, idx, cells, a, b: z, cx: (a.x + z.x) / 2, cy: (a.y + z.y) / 2, len: Math.hypot(z.x - a.x, z.y - a.y), s: a.s }; };
    const lines = [...fx.rows.map((r) => mk('h', r, Array.from({ length: 8 }, (_, c) => r * 8 + c))), ...fx.cols.map((c) => mk('v', c, Array.from({ length: 8 }, (_, r) => r * 8 + c)))];
    const a = cell(0); const z = cell(63);
    return { fx, lines, cell, theme: this.theme, bounds: { x0: a.x - a.s / 2, y0: a.y - a.s / 2, x1: z.x + z.s / 2, y1: z.y + z.s / 2 } };
  }
  supports() { return this.variant.supports.includes(S.event); }
  duration() { return this.variant.duration(this.P, S.event); }
  localT(t) {
    if (this.fixedT !== null) return this.fixedT;
    const d = this.duration();
    return S.loop ? t % (d + LOOP_GAP) : Math.min(t, d);
  }
  draw(t) {
    const fx = fixture(S.fixture);
    const na = this.el.querySelector('.na');
    if (!this.supports()) {
      this.boardView.render(fx.before);
      this.ctx.setTransform(1, 0, 0, 1, 0, 0); this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      if (!na) { const d = document.createElement('div'); d.className = 'na'; d.textContent = 'Not designed yet: this concept only covers the single-line clear until its direction is approved.'; this.el.querySelector('.phone').appendChild(d); }
      return;
    }
    if (na) na.remove();
    const lt = this.localT(t);
    // The logical board updates at once (as in the game); effects draw snapshots on top.
    // Cells the concept animates itself (idle, placement) are hidden on the DOM board while it plays.
    const hide = !this.variant.simulated && this.state && this.state.hidden && lt < this.duration() ? new Set(this.state.hidden) : null;
    this.boardView.render(hide ? fx.after.map((v, i) => (hide.has(i) ? 0 : v)) : fx.after);
    const tt = this.el.querySelector('.tt'); if (tt) tt.textContent = `${Math.round(lt)} / ${Math.round(this.duration())} ms`;
    if (this.variant.simulated) {
      this.canvas.style.display = 'none';
      if (!this.sim) this.sim = this.variant.makeSim(this);
      if (this.dirty) { this.sim.t = -1; this.dirty = false; }
      this.sim.seek(lt, S.event, moveFor(fx, S.event));
      return;
    }
    this.canvas.style.display = '';
    if (this.dirty || !this.state) { this.sceneData = this.scene(); this.state = this.variant.prepare(this.sceneData, this.P, S.event); this.dirty = false; }
    const ctx = this.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.variant.render(ctx, lt, this.state, this.sceneData, this.P, S.event);
  }
  dispose() { if (this.sim) this.sim.dispose(); this.el.remove(); }
}

// ---------- composition / capture ----------
/** Rasterise a panel (board + effect layers) into a canvas for saving. */
function composite(panel) {
  const b = Math.min(S.device - 24, 520); const pad = panel.pad; const dpr = panel.dpr;
  const out = document.createElement('canvas'); out.width = (b + pad * 2) * dpr; out.height = (b + pad * 2) * dpr;
  const c = out.getContext('2d'); c.scale(dpr, dpr);
  const cs = getComputedStyle(document.documentElement);
  c.fillStyle = cs.getPropertyValue('--bg').trim() || '#fff'; c.fillRect(0, 0, b + pad * 2, b + pad * 2);
  c.save(); c.translate(pad + b / 2, pad + b / 2); roundRectPath(c, b, b, b * 0.08); c.fillStyle = cs.getPropertyValue('--board').trim(); c.fill(); c.restore();
  const fx = fixture(S.fixture); const pal = panel.theme.palette;
  for (let i = 0; i < 64; i++) {
    const box = panel.boardView.cellBox(i, panel.wrap); const x = box.x + box.w / 2 + pad; const y = box.y + box.h / 2 + pad;
    c.save(); c.translate(x, y); roundRectPath(c, box.w, box.h, box.w * 0.34); c.fillStyle = cs.getPropertyValue('--cell').trim(); c.fill(); c.restore();
    const v = fx.after[i]; if (!v) continue;
    if (S.theme === 'jelly') jellyBlock(c, x, y, box.w, pal[(v - 1) % pal.length]);
    else { c.save(); c.translate(x, y); roundRectPath(c, box.w, box.h, box.w * 0.22); c.fillStyle = pal[(v - 1) % pal.length]; c.fill(); c.restore(); }
  }
  c.setTransform(1, 0, 0, 1, 0, 0);
  const layers = panel.variant.simulated ? [panel.sim && panel.sim.v.back, panel.sim && panel.sim.v.canvas] : [panel.canvas];
  for (const l of layers) if (l) c.drawImage(l, 0, 0, out.width, out.height);
  return out;
}
function download(canvas, name) {
  const a = document.createElement('a'); a.download = name; a.href = canvas.toDataURL('image/png'); a.click();
}

// ---------- UI ----------
let panels = [];
function focus(i) { S.focus = i; panels.forEach((p, k) => p.el.classList.toggle('focus', k === i)); }
function rebuild() {
  panels.forEach((p) => p.dispose()); panels = [];
  const stage = $('stage'); stage.innerHTML = '';
  if (S.storyboard) {
    const v = variantById(S.theme, S.storyboard); const P = defaults(v);
    v.keyframes(P, S.event).forEach((kf, k) => {
      const p = new Panel(k, v.id, kf.t, { label: `${k + 1}. ${kf.label} · ${Math.round(kf.t)} ms`, note: kf.note });
      stage.appendChild(p.el); panels.push(p);
    });
  } else {
    const n = Number($('s-count').value);
    const list = variantsFor(S.theme);
    for (let k = 0; k < n; k++) {
      const id = initialVariants[k] || (list[k] || list[0]).id;
      const p = new Panel(k, id); stage.appendChild(p.el); panels.push(p);
    }
  }
  panels.forEach((p) => p.layout());
  focus(Math.min(S.focus, panels.length - 1)); renderParams(); draw();
}
function applyTheme() {
  const theme = getTheme(S.theme); const root = document.documentElement;
  for (const [k, v] of Object.entries(theme.vars)) root.style.setProperty(k, v);
  root.dataset.theme = theme.id; root.dataset.mat = theme.material; root.classList.toggle('dark', !!theme.dark);
  envMgr.set(theme.env, $('s-animbg').checked);
}
function maxDuration() { return Math.max(1, ...panels.filter((p) => p.supports()).map((p) => p.duration())); }
function draw() {
  const D = maxDuration();
  $('s-scrub').max = String(Math.round(S.loop ? D + LOOP_GAP : D));
  $('s-scrub').value = String(Math.round(S.loop ? S.t % (D + LOOP_GAP) : Math.min(S.t, D)));
  $('s-time').textContent = `${Math.round(S.t % (S.loop ? D + LOOP_GAP : Infinity))} ms`;
  $('s-frame').textContent = `frame ${Math.round(S.t / FRAME)}`;
  $('s-play').textContent = S.playing ? '❚❚' : '▶︎';
  panels.forEach((p) => p.draw(S.t));
}
function renderParams() {
  const p = panels[S.focus]; if (!p) return;
  const v = p.variant;
  $('p-title').textContent = v.label;
  $('p-note').textContent = v.note || (v.kind === 'concept' ? 'Concept prototype. Parameters are specific to this design.' : '');
  const names = [...Object.keys(v.presets), ...Object.keys(userPresets(v.id)).map((n) => n)];
  $('p-preset').innerHTML = [...new Set(names)].map((n) => `<option>${n}</option>`).join('');
  $('p-preset').value = p.preset;
  const list = $('p-list'); list.innerHTML = '';
  for (const spec of v.params) {
    const row = document.createElement('div'); row.className = 'param';
    row.innerHTML = `<div class="top"><span>${spec.label}</span><output>${p.P[spec.key]}${spec.unit ? ' ' + spec.unit : ''}</output></div><input type="range" min="${spec.min}" max="${spec.max}" step="${spec.step}" value="${p.P[spec.key]}" aria-label="${spec.label}">`;
    const input = row.querySelector('input'); const out = row.querySelector('output');
    input.addEventListener('input', () => { p.P[spec.key] = Number(input.value); out.textContent = input.value + (spec.unit ? ' ' + spec.unit : ''); p.dirty = true; draw(); });
    list.appendChild(row);
  }
  if (!v.params.length) list.innerHTML = '<p class="hint">Engine playback has no exposed parameters.</p>';
}

// ---------- transport ----------
let last = performance.now();
function tick(now) {
  const dt = Math.min(64, now - last); last = now;
  if (S.playing) {
    S.t += dt * S.speed;
    if (!S.loop && S.t >= maxDuration()) { S.t = maxDuration(); S.playing = false; }
    draw();
  }
  requestAnimationFrame(tick);
}
function step(frames) { S.playing = false; S.t = Math.max(0, S.t + frames * FRAME); draw(); }

const envMgr = new EnvironmentManager($('env'), { reducedMotion: () => false });
function init() {
  $('s-theme').innerHTML = THEMES.map((t) => `<option value="${t.id}">${CONCEPTS[t.id] ? '★ ' : ''}${t.name}</option>`).join('');
  $('s-theme').value = S.theme;
  $('s-fixture').innerHTML = FIXTURES.map(([id, n]) => `<option value="${id}">${n}</option>`).join('');
  $('s-fixture').value = S.fixture;
  $('s-device').value = String(S.device);
  $('s-events').innerHTML = EVENTS.map(([id, n]) => `<button data-e="${id}" class="${id === S.event ? 'on' : ''}">${n}</button>`).join('');
  if (initialVariants.length) $('s-count').value = String(Math.min(3, Math.max(1, initialVariants.length)));
  applyTheme(); rebuild();

  $('s-theme').addEventListener('change', (e) => { S.theme = e.target.value; initialVariants.length = 0; applyTheme(); rebuild(); });
  $('s-fixture').addEventListener('change', (e) => { S.fixture = e.target.value; panels.forEach((p) => { p.dirty = true; }); draw(); });
  $('s-device').addEventListener('change', (e) => { S.device = Number(e.target.value); panels.forEach((p) => p.layout()); draw(); });
  $('s-animbg').addEventListener('change', applyTheme);
  $('s-events').addEventListener('click', (e) => { const b = e.target.closest('[data-e]'); if (!b) return; S.event = b.dataset.e; if (EVENT_FIXTURE[S.event]) { S.fixture = EVENT_FIXTURE[S.event]; $('s-fixture').value = S.fixture; } $('s-events').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); panels.forEach((p) => { p.dirty = true; }); S.t = 0; draw(); });
  $('s-count').addEventListener('change', rebuild);
  $('s-play').addEventListener('click', () => { S.playing = !S.playing; draw(); });
  $('s-replay').addEventListener('click', () => { S.t = 0; S.playing = true; panels.forEach((p) => { if (p.sim) p.sim.t = -1; }); draw(); });
  $('s-back').addEventListener('click', () => step(-1));
  $('s-fwd').addEventListener('click', () => step(1));
  $('s-scrub').addEventListener('input', (e) => { S.playing = false; S.t = Number(e.target.value); draw(); });
  $('s-speed').addEventListener('change', (e) => { S.speed = Number(e.target.value); });
  $('s-loop').addEventListener('change', (e) => { S.loop = e.target.checked; draw(); });
  $('s-shot').addEventListener('click', () => { const p = panels[S.focus]; download(composite(p), `${p.variant.id}-${Math.round(p.localT(S.t))}ms.png`); });
  $('s-strip').addEventListener('click', () => saveStrip(panels[S.focus]));
  $('s-board').addEventListener('click', () => { S.storyboard = S.storyboard ? null : panels[S.focus].variant.id; $('s-board').classList.toggle('on', !!S.storyboard); rebuild(); });
  $('p-preset').addEventListener('change', (e) => { const p = panels[S.focus]; p.preset = e.target.value; p.P = presetValues(p.variant, p.preset); p.dirty = true; renderParams(); draw(); });
  $('p-save').addEventListener('click', () => { const p = panels[S.focus]; const name = prompt('Preset name'); if (!name) return; const all = userPresets(p.variant.id); all[name] = { ...p.P }; saveUserPresets(p.variant.id, all); p.preset = name; renderParams(); });
  $('p-delete').addEventListener('click', () => { const p = panels[S.focus]; const all = userPresets(p.variant.id); if (!(p.preset in all)) return; delete all[p.preset]; saveUserPresets(p.variant.id, all); p.preset = 'Default'; p.P = defaults(p.variant); p.dirty = true; renderParams(); draw(); });
  $('p-reset').addEventListener('click', () => { const p = panels[S.focus]; p.P = presetValues(p.variant, p.preset); p.dirty = true; renderParams(); draw(); });
  $('p-copy').addEventListener('click', () => { const p = panels[S.focus]; const json = JSON.stringify({ variant: p.variant.id, params: p.P }, null, 1); if (navigator.clipboard) navigator.clipboard.writeText(json).catch(() => {}); console.log(json); });
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('input, select')) return;
    if (e.key === ' ') { e.preventDefault(); S.playing = !S.playing; draw(); }
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'r' || e.key === 'R') { S.t = 0; S.playing = true; draw(); }
  });
  requestAnimationFrame(tick);
}

/** A storyboard strip: the focused variant at each of its keyframes, tiled with labels. */
function saveStrip(p) {
  const kfs = p.variant.keyframes(p.P, S.event);
  const tiles = kfs.map((kf) => { const keep = p.fixedT; p.fixedT = kf.t; p.dirty = p.dirty || false; p.draw(kf.t); const c = composite(p); p.fixedT = keep; return { c, kf }; });
  const w = tiles[0].c.width; const h = tiles[0].c.height; const lab = 56 * p.dpr;
  const out = document.createElement('canvas'); out.width = w * tiles.length; out.height = h + lab;
  const c = out.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, out.width, out.height);
  tiles.forEach(({ c: img, kf }, k) => {
    c.drawImage(img, k * w, 0);
    c.fillStyle = '#24242c'; c.font = `${14 * p.dpr}px system-ui`; c.fillText(`${k + 1}. ${kf.label} · ${Math.round(kf.t)} ms`, k * w + 10 * p.dpr, h + 22 * p.dpr);
    c.fillStyle = '#55556a'; c.font = `${11 * p.dpr}px system-ui`; c.fillText(kf.note.slice(0, 60), k * w + 10 * p.dpr, h + 42 * p.dpr);
  });
  download(out, `${p.variant.id}-storyboard.png`);
  draw();
}

window.studio = { S, panels: () => panels, draw, setTime(t) { S.playing = false; S.t = t; draw(); }, rebuild };
init();
