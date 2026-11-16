// Procedural audio engine (Web Audio). No samples are bundled: every sound
// is synthesised from short cached noise buffers, oscillators and modal
// resonator partials. Sounds are only ever scheduled "now" on a running
// context, so nothing stale is queued while the context is suspended.

import { KITS } from './kits.js';

export const MAX_VOICES = 36;
export const MAX_CACHED_BUFFERS = 12;

export class AudioEngine {
  constructor({ settings, AudioContextClass, doc } = {}) {
    this.settings = settings;
    this.AC = AudioContextClass || (typeof window !== 'undefined' ? (window.AudioContext || window.webkitAudioContext) : null);
    this.doc = doc || (typeof document !== 'undefined' ? document : null);
    const prefs = settings ? settings.get('sound') : { enabled: true, volume: 0.7 };
    this.enabled = prefs.enabled;
    this.volume = prefs.volume;
    this.kitId = 'pastel';
    this.ctx = null;
    this.master = null;
    this.voices = [];
    this.buffers = new Map();
    this.played = 0;
    this.dropped = 0;
    this.cleanup = [];
  }

  /** Attach unlock/recovery listeners. Returns a disposer. */
  attach(target) {
    const t = target || (typeof window !== 'undefined' ? window : null);
    if (!t) return () => {};
    const unlock = () => this.unlock();
    const vis = () => {
      if (!this.doc) return;
      if (this.doc.hidden) this.suspend(); else this.recover();
    };
    const opts = { capture: true, passive: true };
    ['pointerdown', 'touchend', 'keydown', 'click'].forEach((ev) => t.addEventListener(ev, unlock, opts));
    if (this.doc) this.doc.addEventListener('visibilitychange', vis);
    t.addEventListener('pageshow', vis);
    t.addEventListener('focus', vis);
    this.cleanup.push(() => {
      ['pointerdown', 'touchend', 'keydown', 'click'].forEach((ev) => t.removeEventListener(ev, unlock, opts));
      if (this.doc) this.doc.removeEventListener('visibilitychange', vis);
      t.removeEventListener('pageshow', vis);
      t.removeEventListener('focus', vis);
    });
    return () => this.dispose();
  }

  createContext() {
    if (!this.AC) return null;
    try {
      const ctx = new this.AC({ latencyHint: 'interactive' });
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16; comp.knee.value = 14; comp.ratio.value = 4;
      comp.attack.value = 0.003; comp.release.value = 0.18;
      const master = ctx.createGain();
      master.gain.value = this.effectiveGain();
      master.connect(comp); comp.connect(ctx.destination);
      this.ctx = ctx; this.master = master; this.buffers.clear(); this.voices = [];
      return ctx;
    } catch (e) { this.ctx = null; return null; }
  }

  effectiveGain() { return this.enabled ? this.volume * 0.85 : 0; }

  /** Must run inside a user gesture on iOS Safari. */
  unlock() {
    if (!this.ctx || this.ctx.state === 'closed') this.createContext();
    const ctx = this.ctx;
    if (!ctx) return;
    if (ctx.state !== 'running') { try { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ } }
    if (!this.unlockedOnce) {
      try {
        const b = ctx.createBuffer(1, 1, 22050);
        const s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0);
        this.unlockedOnce = true;
      } catch (e) { /* ignore */ }
    }
  }

  suspend() {
    this.stopAll();
    if (this.ctx && this.ctx.state === 'running') { try { this.ctx.suspend(); } catch (e) { /* ignore */ } }
  }

  recover() {
    if (!this.ctx) return;
    if (this.ctx.state === 'closed') { this.ctx = null; return; } // recreated on next gesture
    if (this.ctx.state !== 'running') { try { const p = this.ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ } }
  }

  setKit(id) { this.kitId = KITS[id] ? id : 'pastel'; }
  setEnabled(on) { this.enabled = !!on; this.persist(); this.applyGain(); if (!on) this.stopAll(); }
  setVolume(v) { this.volume = Math.min(1, Math.max(0, +v || 0)); this.persist(); this.applyGain(); }
  persist() { if (this.settings) this.settings.set('sound', { enabled: this.enabled, volume: this.volume }); }
  applyGain() {
    if (this.master && this.ctx) {
      try { this.master.gain.setTargetAtTime(this.effectiveGain(), this.ctx.currentTime, 0.02); } catch (e) { this.master.gain.value = this.effectiveGain(); }
    }
  }

  /** Play a named event for the current theme kit. Dropped when not ready. */
  play(event, params = {}, kitOverride) {
    if (!this.enabled || this.volume <= 0) return false;
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') { this.dropped++; this.recover(); return false; }
    const kit = KITS[kitOverride || this.kitId] || KITS.pastel;
    const fn = kit[event] || KITS.pastel[event];
    if (!fn) return false;
    this.pruneVoices();
    const bus = ctx.createGain();
    bus.gain.value = 1;
    bus.connect(this.master);
    const api = this.makeApi(ctx, bus, ctx.currentTime + 0.004);
    try { fn(api, params); } catch (e) { /* never break gameplay for audio */ }
    this.played++;
    return true;
  }

  stopAll() {
    for (const v of this.voices) { try { v.node.stop(); } catch (e) { /* ignore */ } }
    this.voices = [];
  }

  pruneVoices() {
    const now = this.ctx ? this.ctx.currentTime : 0;
    this.voices = this.voices.filter((v) => v.end > now);
  }

  registerVoice(node, end) {
    this.voices.push({ node, end });
    node.onended = () => { this.voices = this.voices.filter((v) => v.node !== node); try { node.disconnect(); } catch (e) { /* ignore */ } };
    while (this.voices.length > MAX_VOICES) {
      const old = this.voices.shift();
      try { old.node.stop(); } catch (e) { /* ignore */ }
    }
  }

  noiseBuffer(color = 'white') {
    const key = 'noise:' + color;
    if (this.buffers.has(key)) {
      const b = this.buffers.get(key); this.buffers.delete(key); this.buffers.set(key, b); return b;
    }
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * 0.8);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let b0 = 0; let b1 = 0; let b2 = 0; let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (color === 'pink') { b0 = 0.997 * b0 + w * 0.029591; b1 = 0.985 * b1 + w * 0.032534; b2 = 0.95 * b2 + w * 0.048056; d[i] = (b0 + b1 + b2 + w * 0.1) * 0.9; } else if (color === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.2; } else d[i] = w * 0.7;
    }
    this.buffers.set(key, buf);
    while (this.buffers.size > MAX_CACHED_BUFFERS) this.buffers.delete(this.buffers.keys().next().value);
    return buf;
  }

  makeApi(ctx, bus, t0) {
    const eng = this;
    const env = (g, t, a, d, peak) => {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(peak, t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
    };
    const filt = (type, f, q) => { const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; if (q) fl.Q.value = q; return fl; };
    const chain = (src, nodes) => { let n = src; for (const x of nodes) { n.connect(x); n = x; } n.connect(bus); };
    const api = {
      rand: (a, b) => a + Math.random() * (b - a),
      /** Oscillator with optional glide and filter. */
      tone({ f = 440, f2, type = 'sine', t = 0, a = 0.003, d = 0.2, g = 0.2, lp, hp, glide, vib }) {
        const st = t0 + t;
        const o = ctx.createOscillator(); o.type = type;
        o.frequency.setValueAtTime(Math.max(20, f), st);
        if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(20, f2), st + (glide || a + d * 0.6));
        if (vib) {
          const lfo = ctx.createOscillator(); const lg = ctx.createGain();
          lfo.frequency.value = vib.rate; lg.gain.value = vib.depth; lfo.connect(lg); lg.connect(o.frequency);
          lfo.start(st); lfo.stop(st + a + d + 0.05); eng.registerVoice(lfo, st + a + d + 0.05);
        }
        const gn = ctx.createGain(); env(gn, st, a, d, g);
        const nodes = [];
        if (hp) nodes.push(filt('highpass', hp)); if (lp) nodes.push(filt('lowpass', lp));
        nodes.push(gn); chain(o, nodes);
        o.start(st); o.stop(st + a + d + 0.05); eng.registerVoice(o, st + a + d + 0.05);
      },
      /** Filtered noise burst with optional sweep. */
      noise({ t = 0, a = 0.002, d = 0.08, g = 0.2, type = 'bandpass', f = 1000, f2, q = 1, color = 'white', sweep }) {
        const st = t0 + t;
        const s = ctx.createBufferSource(); s.buffer = eng.noiseBuffer(color);
        const fl = filt(type, f, q);
        if (f2) fl.frequency.exponentialRampToValueAtTime(Math.max(30, f2), st + (sweep || a + d));
        const gn = ctx.createGain(); env(gn, st, a, d, g);
        chain(s, [fl, gn]);
        const offset = Math.random() * 0.5;
        s.start(st, offset); s.stop(st + a + d + 0.05); eng.registerVoice(s, st + a + d + 0.05);
      },
      /** Modal resonator: inharmonic partials for ceramic, glass, wood, metal. */
      modal({ f = 1000, ratios = [1], decays = [0.2], gains = [1], t = 0, g = 0.2, lp, a = 0.001 }) {
        const st = t0 + t;
        const out = ctx.createGain(); out.gain.value = g;
        if (lp) { const fl = filt('lowpass', lp, 0.5); out.connect(fl); fl.connect(bus); } else out.connect(bus);
        ratios.forEach((r, k) => {
          const fr = f * r; if (fr > 16000) return;
          const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = fr;
          const gn = ctx.createGain(); const d = decays[k] ?? decays[decays.length - 1];
          env(gn, st, a, d, gains[k] ?? 0.3);
          o.connect(gn); gn.connect(out);
          o.start(st); o.stop(st + a + d + 0.05); eng.registerVoice(o, st + a + d + 0.05);
        });
      },
      /** Water droplet: sine with fast upward pitch sweep. */
      drop({ f = 900, t = 0, g = 0.2, d = 0.07 }) {
        api.tone({ f, f2: f * 2.3, glide: d * 0.7, t, a: 0.002, d, g, type: 'sine' });
      },
    };
    return api;
  }

  dispose() {
    for (const fn of this.cleanup) fn();
    this.cleanup = [];
    this.stopAll();
    this.buffers.clear();
    if (this.ctx && this.ctx.close) { try { this.ctx.close(); } catch (e) { /* ignore */ } }
    this.ctx = null;
  }
}
