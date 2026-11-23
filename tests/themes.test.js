import { test, assert, eq } from './harness.js';
import { memoryStorage, scriptedGen, boardFrom } from './helpers.js';
import { THEMES, ThemeController, shouldAutoSwitch, nextThemeId, registerTheme, THEME_BY_ID } from '../src/themes/themes.js';
import { KITS } from '../src/audio/kits.js';
import { ENVIRONMENTS } from '../src/ui/environments.js';
import { PARTICLE_KINDS } from '../src/ui/effects.js';
import { Settings } from '../src/core/settings.js';
import { Game } from '../src/core/game.js';

const EVENTS = ['place', 'invalid', 'clear', 'combo', 'allClear', 'gameOver', 'ui'];

test('themes: thirty complete, distinct themes in the registry', () => {
  eq(THEMES.length, 30);
  eq(THEMES.map((t) => t.name), ['Classic Pastel', 'Neon Arcade', 'Jelly Pop', 'Cloud Palace', 'Cream Soda Pop', 'Nostalgic Steampunk', 'Moonlit Koi Pond', 'Little Witch’s Apothecary', 'Strawberry Patisserie', 'Abyssal Aquarium', 'Clockwork Toybox', 'Stained Glass Reverie', 'Dreamware 2004', 'Mahjong Parlor', 'Starflower Post', 'Moonside Mechanism', 'Pixel Crush', 'Capsule Field Notes', 'Queen’s Tea Party', 'Paper Sky Daydream', 'Prism Desk', 'Lily Reliquary', 'Starry Alchemy', 'Garden Ticket', 'End of the World', 'Garden of Doors', 'Heaven 404', 'Surveil', 'Totality', 'Room 201']);
  for (const key of ['id', 'material', 'env', 'sound']) eq(new Set(THEMES.map((t) => t[key])).size, 30, `unique ${key}`);
  eq(new Set(THEMES.map((t) => t.particle)).size, 30, 'unique particle kinds');
    for (const t of THEMES.filter((x) => x.marks)) {
      eq(t.marks.length, 7, t.id + ' marks per colour');
      eq(new Set(t.marks).size, 7, t.id + ' every colour has its own mark');
      for (const m of t.marks) assert(t.glyphs[m], `${t.id} glyph for ${m}`);
    }
  for (const t of THEMES) {
    eq(t.palette.length, 7, t.id + ' palette');
    for (const v of ['--bg', '--ink', '--panel', '--board', '--cell', '--accent', '--ok', '--bad', '--sweep']) assert(t.vars[v], `${t.id} ${v}`);
    assert(ENVIRONMENTS[t.env], `${t.id} environment exists`);
    assert(PARTICLE_KINDS.includes(t.particle), `${t.id} particle kind exists`);
    const kit = KITS[t.sound];
    assert(kit, `${t.id} sound kit`);
    for (const e of EVENTS) assert(typeof kit[e] === 'function', `${t.id} sound ${e}`);
  }
});

test('themes: every material and environment has CSS (no unused names)', async () => {
  let materials; let envs; let effects;
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    const fs = await import('node:fs');
    const read = (p) => fs.readFileSync(new URL('../styles/' + p, import.meta.url), 'utf8');
    materials = read('materials.css'); envs = read('environments.css'); effects = read('effects.css');
  } else {
    const get = (p) => fetch(new URL('../styles/' + p, import.meta.url)).then((r) => r.text());
    [materials, envs, effects] = await Promise.all([get('materials.css'), get('environments.css'), get('effects.css')]);
  }
  for (const t of THEMES) {
    assert(materials.includes(`.m-${t.material} {`) || materials.includes(`.m-${t.material}{`), `material CSS for ${t.material}`);
    assert(effects.includes(`.m-${t.material}.fx-place`) || t.material === 'enamel', `placement animation for ${t.material}`);
    assert(effects.includes(`.clear-ghost.m-${t.material}`) || t.material === 'enamel', `clear animation for ${t.material}`);
    assert(envs.includes(`.env-${t.env}`), `environment CSS for ${t.env}`);
    assert(effects.includes(`.pt-${t.particle}`), `particle CSS for ${t.particle}`);
  }
});

test('themes: preview, cancel restores saved, commit persists', () => {
  const settings = new Settings(memoryStorage());
  const applied = [];
  const tc = new ThemeController({ settings, apply: (t) => applied.push(t.id) });
  tc.init();
  eq(tc.current, 'pastel');
  tc.preview('koi'); eq(tc.current, 'koi'); assert(tc.previewing);
  eq(settings.get('theme'), 'pastel', 'preview not persisted');
  tc.cancelPreview(); eq(tc.current, 'pastel'); eq(applied.at(-1), 'pastel', 'saved theme restored');
  tc.preview('mahjong'); tc.commit();
  eq(settings.get('theme'), 'mahjong');
  const tc2 = new ThemeController({ settings: new Settings(settings.store), apply: () => {} });
  eq(tc2.saved, 'mahjong', 'selection persists');
});

test('themes: switching never changes gameplay state', async () => {
  const cells = boardFrom(['###.....', '.#......']);
  const g = new Game({ gen: scriptedGen({ cells, trays: [['l-a', 'single', 'pair-v']] }) });
  await g.newGame({ seed: 9 });
  g.place(1, 7, 7);
  const snap = () => JSON.stringify({ cells: [...g.cells], tray: g.tray, score: g.score, combo: g.combo, best: g.best, over: g.over, batch: g.batch });
  const before = snap();
  const settings = new Settings(memoryStorage());
  const tc = new ThemeController({ settings, apply: () => {} });
  for (const t of THEMES) { tc.preview(t.id); tc.commit(); }
  tc.preview('neon'); tc.cancelPreview();
  eq(snap(), before);
});

test('themes: auto-switch only on a clearing move that empties the board', async () => {
  const settings = new Settings(memoryStorage());
  const tc = new ThemeController({ settings, apply: () => {} });
  tc.init();
  const ordinary = { lines: 1, allClear: false };
  const emptyNoClear = { lines: 0, allClear: false };
  const allClear = { lines: 2, allClear: true };
  assert(!tc.handleMove(allClear), 'disabled by default');
  eq(settings.get('autoSwitch'), false);
  settings.set('autoSwitch', true);
  assert(!tc.handleMove(ordinary), 'ordinary clear does not switch');
  assert(!tc.handleMove(emptyNoClear), 'non-clearing move does not switch');
  assert(tc.handleMove(allClear), 'all clear switches');
  eq(tc.current, nextThemeId('pastel')); eq(settings.get('theme'), 'neon');
  assert(!shouldAutoSwitch(null, true));
  // Integration: an initial empty board and restarts do not switch.
  const g = new Game({ gen: scriptedGen({ trays: [['single', 'single', 'single']] }) });
  let switches = 0;
  g.on('place', (m) => { if (tc.handleMove(m)) switches++; });
  await g.newGame({ seed: 1 }); await g.newGame({ seed: 2 });
  eq(switches, 0);
  g.place(0, 0, 0);
  eq(switches, 0, 'placing on empty board without a clear');
  // Board clear by a real move.
  const g2 = new Game({ gen: scriptedGen({ cells: boardFrom(['#######.']), trays: [['single', 'pair-h', 'pair-h']] }) });
  g2.on('place', (m) => { if (tc.handleMove(m)) switches++; });
  await g2.newGame({ seed: 3 });
  g2.place(0, 0, 7);
  eq(switches, 1); eq(tc.current, 'jelly');
  // Wraps around the registry.
  settings.set('theme', THEMES.at(-1).id);
  const tc3 = new ThemeController({ settings, apply: () => {} });
  tc3.handleMove(allClear); eq(tc3.current, THEMES[0].id);
});

test('themes: registry is extensible and validates entries', () => {
  let threw = false;
  try { registerTheme({ id: 'x' }); } catch (e) { threw = true; }
  assert(threw, 'incomplete theme rejected');
  const t = { ...THEMES[0], id: 'test-theme', name: 'Test' };
  registerTheme(t);
  assert(THEME_BY_ID['test-theme']);
  THEMES.splice(THEMES.indexOf(t), 1); delete THEME_BY_ID['test-theme'];
  eq(THEMES.length, 30);
});

test('themes: new sound kits fit every event inside the voice limit', async () => {
  const { MAX_VOICES } = await import('../src/audio/engine.js');
  let n = 0;
  const api = { rand: (a, b) => (a + b) / 2, tone: (o) => { n += 1 + (o.vib ? 1 : 0); }, noise: () => { n++; }, modal: (o) => { n += (o.ratios || [1]).length; }, drop: () => { n++; } };
  const events = [['place', {}], ['invalid', {}], ['clear', { lines: 1 }], ['clear', { lines: 5 }], ['combo', { n: 12 }], ['allClear', {}], ['gameOver', {}], ['ui', {}]];
  // Kits from the first 14 themes predate this budget check.
  for (const t of THEMES.slice(14)) {
    for (const [e, p] of events) { n = 0; KITS[t.sound][e](api, p); assert(n <= MAX_VOICES, `${t.sound}.${e} uses ${n} voices (limit ${MAX_VOICES})`); }
  }
});
