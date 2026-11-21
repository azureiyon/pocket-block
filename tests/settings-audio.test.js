import { test, assert, eq } from './harness.js';
import { memoryStorage } from './helpers.js';
import { Settings, DEFAULTS } from '../src/core/settings.js';
import { AudioEngine, MAX_VOICES, MAX_CACHED_BUFFERS } from '../src/audio/engine.js';
import { KITS } from '../src/audio/kits.js';

test('settings: defaults, persistence and independent keys', () => {
  const storage = memoryStorage();
  const s = new Settings(storage);
  eq(s.get('opening'), { mode: 'random', variant: 'any' }, 'Random is the default opening mode');
  eq(s.get('autoSwitch'), false); eq(s.get('animBg'), true); eq(s.get('theme'), 'pastel');
  s.set('theme', 'koi'); s.set('animBg', false); s.set('sound', { enabled: false, volume: 0.3 });
  s.update('opening', { mode: 'always', variant: 'almost' }); s.set('autoSwitch', true); s.set('best', 990);
  const r = new Settings(storage);
  eq([r.get('theme'), r.get('animBg'), r.get('sound'), r.get('opening'), r.get('autoSwitch'), r.get('best')],
    ['koi', false, { enabled: false, volume: 0.3 }, { mode: 'always', variant: 'almost' }, true, 990]);
  const keys = Object.keys(storage.dump());
  eq(keys.length, 6, 'one storage key per preference group');
  // Changing one group leaves others intact.
  r.set('theme', 'neon');
  eq(new Settings(storage).get('opening'), { mode: 'always', variant: 'almost' });
});

test('settings: corrupt values fall back to defaults', () => {
  const storage = memoryStorage({ 'pocketBlocks.sound': '{"enabled":"yes"}', 'pocketBlocks.best': 'not json', 'pocketBlocks.opening': '{"mode":"sometimes","variant":"any"}' });
  const s = new Settings(storage);
  eq(s.get('sound'), DEFAULTS.sound); eq(s.get('best'), 0); eq(s.get('opening'), DEFAULTS.opening);
  assert(!s.set('opening', { mode: 'bad' }), 'invalid write rejected');
});

test('settings: unavailable storage is handled gracefully', () => {
  const throwing = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('quota'); }, removeItem() { throw new Error('x'); } };
  const s = new Settings(throwing);
  s.set('theme', 'glass');
  eq(s.get('theme'), 'glass', 'kept in memory');
  const none = new Settings(null);
  none.set('best', 5); eq(none.get('best'), 5);
  assert(!none.persistent);
});

// ---------- audio with a fake Web Audio implementation ----------

class FakeParam {
  constructor(v = 0) { this.value = v; this.events = 0; }
  setValueAtTime() { this.events++; } linearRampToValueAtTime() { this.events++; } exponentialRampToValueAtTime() { this.events++; } setTargetAtTime(v) { this.value = v; }
}
class FakeNode {
  constructor(ctx) { this.ctx = ctx; this.connected = 0; ctx.nodes++; }
  connect(n) { this.connected++; return n; } disconnect() { this.connected = 0; }
}
class FakeSource extends FakeNode {
  constructor(ctx) { super(ctx); this.frequency = new FakeParam(440); this.started = false; this.stopped = false; ctx.sources.push(this); }
  start() { this.started = true; this.ctx.started++; } stop() { this.stopped = true; }
}
class FakeAudioContext {
  constructor() {
    this.state = 'suspended'; this.currentTime = 0; this.sampleRate = 8000; this.nodes = 0; this.started = 0; this.sources = [];
    this.destination = new FakeNode(this); FakeAudioContext.instances.push(this);
  }
  resume() { this.state = 'running'; return Promise.resolve(); }
  suspend() { this.state = 'suspended'; return Promise.resolve(); }
  close() { this.state = 'closed'; return Promise.resolve(); }
  createGain() { const n = new FakeNode(this); n.gain = new FakeParam(1); return n; }
  createOscillator() { return new FakeSource(this); }
  createBufferSource() { return new FakeSource(this); }
  createBiquadFilter() { const n = new FakeNode(this); n.frequency = new FakeParam(); n.Q = new FakeParam(); return n; }
  createDynamicsCompressor() { const n = new FakeNode(this); for (const k of ['threshold', 'knee', 'ratio', 'attack', 'release']) n[k] = new FakeParam(); return n; }
  createBuffer(ch, len) { const data = new Float32Array(len); return { getChannelData: () => data, length: len }; }
}
FakeAudioContext.instances = [];

function fakeTarget() {
  const l = new Map();
  return {
    addEventListener(t, f) { l.set(t, (l.get(t) || 0) + 1); },
    removeEventListener(t) { l.set(t, (l.get(t) || 0) - 1); },
    active() { return [...l.values()].reduce((a, b) => a + b, 0); },
  };
}

test('audio: unlock on gesture, sounds dropped (not queued) while suspended', () => {
  const settings = new Settings(memoryStorage());
  const doc = { hidden: false, ...fakeTarget() };
  const a = new AudioEngine({ settings, AudioContextClass: FakeAudioContext, doc });
  eq(a.play('place'), false, 'no context before a user gesture');
  a.unlock();
  const ctx = a.ctx;
  assert(ctx.state === 'running', 'resumed inside gesture');
  assert(a.play('place'), 'plays when running');
  const startedBefore = ctx.started;
  ctx.state = 'suspended'; // e.g. app switch / interruption
  eq(a.play('clear', { lines: 2 }), false, 'dropped while suspended');
  ctx.state = 'running';
  eq(ctx.started, startedBefore, 'nothing stale replayed after resuming');
  ctx.state = 'interrupted'; a.recover(); eq(ctx.state, 'running', 'recovers interrupted context');
  ctx.state = 'closed'; a.recover(); eq(a.ctx, null, 'closed context discarded');
  a.unlock(); assert(a.ctx && a.ctx !== ctx && a.ctx.state === 'running', 'new context created on next gesture');
});

// Safari-like context: resume() settles later, and state changes fire onstatechange.
class SlowAudioContext extends FakeAudioContext {
  resume() { return new Promise((r) => setTimeout(() => { this.state = 'running'; if (this.onstatechange) this.onstatechange(); r(); }, 20)); }
}

test('audio (Safari): the gesture that wakes the context still makes its sound', async () => {
  const a = new AudioEngine({ settings: new Settings(memoryStorage()), AudioContextClass: SlowAudioContext, doc: { hidden: false, ...fakeTarget() } });
  a.unlock(); // pointerdown: resume requested, not running yet
  const ctx = a.ctx;
  eq(ctx.state, 'suspended');
  a.play('place'); // the drop happens in the same gesture
  eq(ctx.sources.filter((x) => x.started).length, 1, 'only the silent unlock buffer so far');
  await new Promise((r) => setTimeout(r, 40));
  assert(ctx.sources.filter((x) => x.started).length > 1, 'held sound played once running');
  eq(a.held.length, 0);
});

test('audio (Safari): sounds are not held without a fresh resume, and stale ones are dropped', async () => {
  const a = new AudioEngine({ settings: new Settings(memoryStorage()), AudioContextClass: SlowAudioContext, doc: { hidden: false, ...fakeTarget() } });
  a.unlock();
  await new Promise((r) => setTimeout(r, 40));
  const ctx = a.ctx; const started = ctx.started;
  ctx.state = 'suspended'; // suspended with no gesture in flight
  a.play('clear', { lines: 2 });
  eq(a.held.length, 0, 'nothing queued without an in-flight resume');
  ctx.state = 'running'; ctx.onstatechange();
  eq(ctx.started, started, 'nothing stale replayed');
});

test('audio (Safari): after the page was hidden or interrupted, the next gesture builds a fresh context', async () => {
  const doc = { hidden: false, ...fakeTarget() };
  const a = new AudioEngine({ settings: new Settings(memoryStorage()), AudioContextClass: FakeAudioContext, doc });
  a.unlock();
  const first = a.ctx;
  doc.hidden = true; a.suspend(); doc.hidden = false; a.recover();
  a.unlock();
  assert(a.ctx !== first && first.state === 'closed', 'hidden -> fresh context');
  assert(a.ctx.state === 'running' && a.play('place'), 'fresh context plays');
  const second = a.ctx;
  second.state = 'interrupted'; second.onstatechange();
  a.unlock();
  assert(a.ctx !== second && a.ctx.state === 'running', 'interrupted -> fresh context');
  a.unlock(); const third = a.ctx; a.unlock();
  assert(a.ctx === third, 'repeated gesture events keep a healthy context');
});

test('audio (Safari): a running context whose clock has stopped is replaced', () => {
  const a = new AudioEngine({ settings: new Settings(memoryStorage()), AudioContextClass: FakeAudioContext, doc: { hidden: false, ...fakeTarget() } });
  a.unlock();
  const ctx = a.ctx;
  a.probe = { wall: a.probe.wall - 1000, t: ctx.currentTime }; // a second ago, clock unchanged
  a.unlock();
  assert(a.ctx !== ctx, 'stuck context replaced');
  const fresh = a.ctx;
  fresh.currentTime = 5; a.probe = { wall: a.probe.wall - 1000, t: 1 };
  a.unlock();
  assert(a.ctx === fresh, 'a moving clock is healthy');
});

test('audio: every kit plays every event within voice limits', () => {
  const a = new AudioEngine({ settings: new Settings(memoryStorage()), AudioContextClass: FakeAudioContext, doc: { hidden: false, ...fakeTarget() } });
  a.unlock();
  for (const id of Object.keys(KITS)) {
    a.setKit(id);
    for (const [ev, p] of [['place', {}], ['invalid', {}], ['clear', { lines: 1 }], ['clear', { lines: 3 }], ['combo', { n: 2 }], ['combo', { n: 9 }], ['allClear', {}], ['gameOver', {}], ['ui', {}]]) {
      const before = a.ctx.started;
      assert(a.play(ev, p), `${id}.${ev} played`);
      assert(a.ctx.started > before, `${id}.${ev} produced sound`);
      assert(a.voices.length <= MAX_VOICES, 'voice limit respected');
    }
  }
  assert(a.buffers.size <= MAX_CACHED_BUFFERS, 'bounded buffer cache');
  eq(a.buffers.size, 3, 'noise buffers reused across events (white/pink/brown)');
});

test('audio: mute and volume persist across themes and sessions', () => {
  const storage = memoryStorage();
  const a = new AudioEngine({ settings: new Settings(storage), AudioContextClass: FakeAudioContext, doc: { hidden: false, ...fakeTarget() } });
  a.setVolume(0.25); a.setEnabled(false); a.setKit('mahjong'); a.setKit('neon');
  const b = new AudioEngine({ settings: new Settings(storage), AudioContextClass: FakeAudioContext });
  eq([b.enabled, b.volume], [false, 0.25]);
  b.unlock(); eq(b.play('place'), false, 'muted engine stays silent');
});

test('audio: cleanup removes listeners, voices and context', () => {
  const win = fakeTarget(); const doc = { hidden: false, ...fakeTarget() };
  const a = new AudioEngine({ settings: new Settings(memoryStorage()), AudioContextClass: FakeAudioContext, doc });
  a.attach(win);
  assert(win.active() > 0 && doc.active() > 0);
  a.unlock(); a.play('allClear');
  const ctx = a.ctx;
  doc.hidden = true; a.suspend(); eq(a.voices.length, 0, 'voices stopped when hidden');
  a.dispose();
  eq(win.active(), 0); eq(doc.active(), 0); eq(ctx.state, 'closed'); eq(a.ctx, null);
});
