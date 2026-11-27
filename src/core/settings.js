// Persistent preferences. Each preference group has its own storage key so
// theme, sound, background and starting-board settings persist independently.
// Storage failures (private mode, quota, disabled) fall back to memory.

const PREFIX = 'pocketBlocks.';

export const DEFAULTS = {
  best: 0,
  bestBlast: 0,
  bestFlow: 0,
  mode: 'classic',
  theme: 'pastel',
  autoSwitch: false,
  animBg: true,
  vfx: true,
  vfxLevel: 1,
  sound: { enabled: true, volume: 0.7 },
  opening: { mode: 'random', variant: 'any' },
};

const VALIDATORS = {
  best: (v) => (Number.isFinite(v) && v >= 0 ? Math.floor(v) : undefined),
  bestBlast: (v) => (Number.isFinite(v) && v >= 0 ? Math.floor(v) : undefined),
  bestFlow: (v) => (Number.isFinite(v) && v >= 0 ? Math.floor(v) : undefined),
  mode: (v) => (v === 'classic' || v === 'blast' || v === 'flow' ? v : undefined),
  theme: (v) => (typeof v === 'string' && v.length < 40 ? v : undefined),
  autoSwitch: (v) => (typeof v === 'boolean' ? v : undefined),
  animBg: (v) => (typeof v === 'boolean' ? v : undefined),
  vfx: (v) => (typeof v === 'boolean' ? v : undefined),
  vfxLevel: (v) => (Number.isFinite(v) ? Math.min(1, Math.max(0.25, v)) : undefined),
  sound: (v) => (v && typeof v === 'object' && typeof v.enabled === 'boolean' && Number.isFinite(v.volume)
    ? { enabled: v.enabled, volume: Math.min(1, Math.max(0, v.volume)) } : undefined),
  opening: (v) => (v && ['off', 'random', 'always'].includes(v.mode) && typeof v.variant === 'string'
    ? { mode: v.mode, variant: v.variant } : undefined),
};

export function safeStorage(candidate) {
  const memory = new Map();
  const mem = {
    getItem: (k) => (memory.has(k) ? memory.get(k) : null),
    setItem: (k, v) => { memory.set(k, String(v)); },
    removeItem: (k) => { memory.delete(k); },
  };
  let real = candidate;
  if (real === undefined) { try { real = globalThis.localStorage; } catch (e) { real = null; } }
  if (!real) return { store: mem, persistent: false };
  return {
    persistent: true,
    store: {
      getItem(k) { try { return real.getItem(k); } catch (e) { return mem.getItem(k); } },
      setItem(k, v) { mem.setItem(k, v); try { real.setItem(k, v); } catch (e) { /* keep in memory */ } },
      removeItem(k) { mem.removeItem(k); try { real.removeItem(k); } catch (e) { /* ignore */ } },
    },
  };
}

export class Settings {
  constructor(storage) {
    const s = safeStorage(storage);
    this.store = s.store;
    this.persistent = s.persistent;
    this.cache = {};
    this.listeners = new Set();
  }

  get(key) {
    if (!(key in DEFAULTS)) throw new Error('Unknown setting ' + key);
    if (key in this.cache) return clone(this.cache[key]);
    let value;
    try {
      const raw = this.store.getItem(PREFIX + key);
      if (raw !== null && raw !== undefined) value = VALIDATORS[key](JSON.parse(raw));
    } catch (e) { value = undefined; }
    if (value === undefined) value = clone(DEFAULTS[key]);
    this.cache[key] = value;
    return clone(value);
  }

  set(key, value) {
    const v = VALIDATORS[key](value);
    if (v === undefined) return false;
    this.cache[key] = v;
    try { this.store.setItem(PREFIX + key, JSON.stringify(v)); } catch (e) { /* memory only */ }
    for (const fn of this.listeners) fn(key, clone(v));
    return true;
  }

  update(key, patch) { return this.set(key, { ...this.get(key), ...patch }); }
  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
}

function clone(v) { return v && typeof v === 'object' ? JSON.parse(JSON.stringify(v)) : v; }
