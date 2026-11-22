// Per-theme sound kits. Each kit maps game events to short synthesised
// gestures built from materials (partials, envelopes, friction noise) and
// rhythms, not just pitch changes. Gains are kept modest; combo intensity is
// capped so streaks never spike.
//
// Events: place, invalid, clear({lines}), combo({n}), allClear, gameOver, ui({kind}).

const cap = (n, m) => Math.min(Math.max(1, n | 0), m);
const NOTE = (semi, base = 523.25) => base * Math.pow(2, semi / 12);
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];

// ---- shared material gestures ----
function bell(a, f, t, g, decay = 0.5, lp = 5200) {
  a.modal({ f, t, g, lp, ratios: [1, 2.0, 3.01, 4.2], decays: [decay, decay * 0.5, decay * 0.25, decay * 0.12], gains: [1, 0.22, 0.08, 0.03] });
}
function glass(a, f, t, g, decay = 0.18, lp = 3600) {
  a.modal({ f, t, g, lp, ratios: [1, 2.32, 4.25, 6.63], decays: [decay, decay * 0.55, decay * 0.3, decay * 0.18], gains: [1, 0.45, 0.2, 0.08] });
}
function wood(a, f, t, g) {
  a.modal({ f, t, g, ratios: [1, 2.57, 4.21], decays: [0.07, 0.035, 0.018], gains: [1, 0.4, 0.15] });
  a.noise({ t, d: 0.018, g: g * 0.5, type: 'bandpass', f: f * 2, q: 1.5 });
}
function metal(a, f, t, g, decay = 0.05) {
  a.modal({ f, t, g, ratios: [1, 1.71, 2.93, 4.07], decays: [decay, decay * 0.7, decay * 0.5, decay * 0.35], gains: [1, 0.55, 0.35, 0.2] });
}
function thud(a, t, g, f = 150) {
  a.tone({ f, f2: f * 0.65, t, d: 0.08, g });
  a.noise({ t, d: 0.05, g: g * 0.5, type: 'lowpass', f: 500, color: 'brown' });
}

// ---- Mahjong: tactile ceramic tiles, no beeps ----
function clack(a, t, g = 0.5, pitch = 1, body = true) {
  const f = 2350 * pitch * a.rand(0.95, 1.05);
  a.modal({ f, t, g: g * 0.42, ratios: [1, 1.47, 2.09, 2.76], decays: [0.045, 0.03, 0.022, 0.015], gains: [1, 0.6, 0.38, 0.22] });
  a.noise({ t, d: 0.014, g: g * 0.55, type: 'highpass', f: 3200, q: 0.7 });
  a.noise({ t, d: 0.03, g: g * 0.3, type: 'bandpass', f: 1200 * pitch, q: 2.5 });
  if (body) { a.tone({ f: 150 * a.rand(0.92, 1.08), f2: 105, t, d: 0.1, g: g * 0.32 }); a.noise({ t, d: 0.07, g: g * 0.22, type: 'lowpass', f: 520, color: 'brown' }); }
}
function shuffleStroke(a, t, g) {
  a.noise({ t, a: 0.012, d: 0.09, g, type: 'bandpass', f: a.rand(1700, 2600), q: 1.1, color: 'pink' });
}

// ---- shared gestures for themes 15–24 ----
function twinkle(a, f, t, g) { a.tone({ f, t, a: 0.002, d: 0.28, g }); a.tone({ f: f * 2.01, t, a: 0.002, d: 0.12, g: g * 0.35 }); }
function porcelain(a, f, t, g) { a.modal({ f, t, g, lp: 7000, ratios: [1, 2.76, 5.4], decays: [0.32, 0.18, 0.09], gains: [1, 0.5, 0.25] }); }
function piano(a, f, t, g, d = 0.9) { a.modal({ f, t, g, lp: 3800, a: 0.003, ratios: [1, 2, 3, 4.01], decays: [d, d * 0.7, d * 0.45, d * 0.3], gains: [1, 0.42, 0.18, 0.08] }); }
function churchBell(a, f, t, g, d = 1.6) {
  // Hum, prime, minor tierce, quint, nominal: the inharmonic recipe of a cast bell.
  a.modal({ f, t, g, lp: 4200, ratios: [0.5, 1, 1.183, 1.506, 2, 2.5], decays: [d, d * 0.85, d * 0.7, d * 0.55, d * 0.45, d * 0.3], gains: [0.7, 1, 0.55, 0.3, 0.42, 0.18] });
}
function flap(a, t, g, f = 1600) { a.noise({ t, a: 0.004, d: 0.035, g, type: 'bandpass', f: f * a.rand(0.8, 1.25), q: 0.9, color: 'pink' }); }
function riffle(a, t, n, g) { for (let i = 0; i < n; i++) a.noise({ t: t + i * a.rand(0.011, 0.019), d: 0.009, g, type: 'bandpass', f: a.rand(1800, 3400), q: 1.4 }); }
function plastic(a, t, g) { a.tone({ f: a.rand(2900, 4300), t, a: 0.001, d: 0.014, g, type: 'triangle' }); a.noise({ t, d: 0.004, g: g * 0.6, type: 'highpass', f: 5000 }); }
function tick(a, f, t, g) { a.tone({ f, t, a: 0.001, d: 0.012, g, type: 'triangle' }); a.noise({ t, d: 0.004, g: g * 1.2, type: 'highpass', f: 6000 }); }
function stamp(a, t, g) { a.tone({ f: 130, f2: 70, t, d: 0.1, g }); a.noise({ t, d: 0.05, g: g * 0.5, type: 'lowpass', f: 450, color: 'brown' }); a.noise({ t, d: 0.012, g: g * 0.3, type: 'bandpass', f: 1200, q: 1 }); }
function shutter(a, t, g) {
  a.noise({ t, d: 0.007, g, type: 'bandpass', f: 3200, q: 1.6 }); a.tone({ f: 4300, t, a: 0.001, d: 0.015, g: g * 0.2, type: 'triangle' });
  a.noise({ t: t + 0.012, a: 0.008, d: 0.035, g: g * 0.2, type: 'bandpass', f: 900, q: 4 });
  a.noise({ t: t + 0.055, d: 0.011, g: g * 0.85, type: 'bandpass', f: 1900, q: 1.4 }); a.tone({ f: 3100, t: t + 0.055, a: 0.001, d: 0.02, g: g * 0.18, type: 'triangle' });
}
function chirp(a, t, g, base = 3200) {
  a.tone({ f: base * a.rand(0.92, 1.08), f2: base * a.rand(1.35, 1.6), glide: 0.045, t, a: 0.004, d: 0.055, g, vib: { rate: 38, depth: 90 } });
  a.tone({ f: base * a.rand(1.2, 1.35), f2: base * a.rand(0.9, 1.0), glide: 0.04, t: t + 0.075, a: 0.004, d: 0.05, g: g * 0.8 });
}
function shing(a, t, g, up = true) {
  a.noise({ t, a: 0.02, d: 0.26, g, type: 'bandpass', f: up ? 1800 : 7000, f2: up ? 7500 : 1500, q: 7, sweep: 0.26 });
  a.modal({ f: 1870, t: t + 0.05, g: g * 0.8, lp: 9000, ratios: [1, 2.76, 5.4, 8.9], decays: [0.9, 0.45, 0.22, 0.1], gains: [1, 0.45, 0.2, 0.08] });
}

export const KITS = {
  pastel: {
    place(a) {
      a.tone({ f: 320, f2: 150, d: 0.09, g: 0.42 });
      a.tone({ f: 640, f2: 320, d: 0.04, g: 0.1, type: 'triangle' });
      a.noise({ d: 0.02, g: 0.12, type: 'lowpass', f: 2200 });
    },
    invalid(a) { a.tone({ f: 210, f2: 160, d: 0.1, g: 0.25, type: 'triangle', lp: 900 }); a.noise({ d: 0.03, g: 0.08, type: 'lowpass', f: 600 }); },
    clear(a, { lines = 1 }) {
      const notes = lines > 1 ? [0, 4, 7, 12, 16].slice(0, 3 + Math.min(lines, 2)) : [0, 4, 7];
      notes.forEach((s, i) => bell(a, NOTE(s, 1046.5), i * 0.055, 0.16, 0.55));
      a.tone({ f: 260, f2: 130, d: 0.08, g: 0.25 });
    },
    combo(a, { n = 2 }) {
      const k = cap(n, 6);
      for (let i = 0; i < 2 + Math.min(k, 4); i++) bell(a, NOTE(PENTA[i + k - 1] ?? 21, 784), i * 0.06, 0.08 + 0.006 * k, 0.35);
    },
    allClear(a) {
      [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => bell(a, NOTE(s, 784), i * 0.07, 0.13, 0.8));
      a.tone({ f: 330, f2: 160, d: 0.12, g: 0.3 });
    },
    gameOver(a) { [7, 4, 0].forEach((s, i) => a.tone({ f: NOTE(s, 392), t: i * 0.22, d: 0.4, g: 0.16, type: 'triangle', lp: 2000 })); },
    ui(a) { a.tone({ f: 520, f2: 380, d: 0.04, g: 0.14 }); },
  },

  neon: {
    place(a) {
      a.noise({ d: 0.022, g: 0.22, type: 'highpass', f: 4200 });
      a.tone({ f: 900, f2: 220, d: 0.05, g: 0.08, type: 'square', lp: 3200 });
      a.tone({ f: 110, d: 0.06, g: 0.16, type: 'sine' });
    },
    invalid(a) { a.tone({ f: 98, d: 0.12, g: 0.1, type: 'square', lp: 700 }); a.noise({ d: 0.04, g: 0.06, type: 'bandpass', f: 300, q: 3 }); },
    clear(a, { lines = 1 }) {
      const notes = lines > 1 ? [0, 7, 12, 19] : [0, 7];
      notes.forEach((s, i) => a.tone({ f: NOTE(s, 220), t: i * 0.012, d: 0.32 + lines * 0.05, g: 0.06, type: 'sawtooth', lp: 1600 + lines * 500 }));
      a.noise({ d: 0.3, g: 0.06, type: 'bandpass', f: 500, f2: 5000, q: 4, sweep: 0.3 });
      a.noise({ d: 0.02, g: 0.16, type: 'highpass', f: 5000 });
    },
    combo(a, { n = 2 }) {
      const k = cap(n, 6);
      for (let i = 0; i < 2 + Math.min(k, 5); i++) a.tone({ f: NOTE(PENTA[i] + k, 440), t: i * 0.055, d: 0.06, g: 0.05, type: 'square', lp: 2600 });
    },
    allClear(a) {
      a.noise({ d: 0.7, a: 0.05, g: 0.08, type: 'bandpass', f: 300, f2: 7000, q: 5, sweep: 0.7 });
      [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => a.tone({ f: NOTE(s, 330), t: i * 0.06, d: 0.18, g: 0.05, type: 'sawtooth', lp: 3000 }));
    },
    gameOver(a) { a.tone({ f: 440, f2: 70, glide: 0.9, d: 1.0, g: 0.09, type: 'sawtooth', lp: 1200 }); },
    ui(a) { a.tone({ f: 1500, d: 0.025, g: 0.05, type: 'square', lp: 4000 }); },
  },

  jelly: {
    place(a) {
      a.tone({ f: 240, f2: 130, glide: 0.04, d: 0.06, g: 0.32, lp: 1400 });
      a.tone({ f: 150, f2: 290, t: 0.035, glide: 0.06, d: 0.08, g: 0.2, lp: 1400 });
      a.noise({ d: 0.05, g: 0.08, type: 'lowpass', f: 500, color: 'pink' });
    },
    invalid(a) { a.tone({ f: 160, f2: 120, d: 0.12, g: 0.2, lp: 600, vib: { rate: 22, depth: 12 } }); },
    clear(a, { lines = 1 }) {
      const pops = Math.min(3 + lines * 2, 9);
      for (let i = 0; i < pops; i++) a.drop({ f: a.rand(380, 720), t: i * a.rand(0.035, 0.06), g: 0.17, d: 0.05 });
      a.noise({ d: 0.12, g: 0.07, type: 'lowpass', f: 900, color: 'pink' });
    },
    combo(a, { n = 2 }) {
      const k = cap(n, 6);
      for (let i = 0; i < 2 + Math.min(k, 3); i++) a.tone({ f: 200 + i * 40 + k * 15, f2: 420 + k * 20, glide: 0.07, t: i * 0.08, d: 0.09, g: 0.14, lp: 1800 });
    },
    allClear(a) {
      for (let i = 0; i < 12; i++) a.drop({ f: a.rand(350, 900), t: i * 0.045, g: 0.13, d: 0.06 });
      a.tone({ f: 180, f2: 520, glide: 0.4, d: 0.45, g: 0.15, lp: 1600 });
    },
    gameOver(a) { a.tone({ f: 320, f2: 80, glide: 0.9, d: 1.0, g: 0.18, lp: 900, vib: { rate: 7, depth: 10 } }); },
    ui(a) { a.tone({ f: 260, f2: 420, glide: 0.04, d: 0.05, g: 0.12, lp: 1500 }); },
  },

  cloud: {
    place(a) {
      a.noise({ a: 0.015, d: 0.16, g: 0.1, type: 'bandpass', f: 1300, q: 0.6, color: 'pink' });
      a.tone({ f: 1760, d: 0.22, g: 0.05 }); a.tone({ f: 880, d: 0.26, g: 0.06 });
      a.tone({ f: 220, f2: 180, d: 0.08, g: 0.12 });
    },
    invalid(a) { a.noise({ a: 0.01, d: 0.1, g: 0.08, type: 'lowpass', f: 700, color: 'pink' }); },
    clear(a, { lines = 1 }) {
      a.noise({ a: 0.12, d: 0.6, g: 0.12, type: 'bandpass', f: 600, f2: 2600, q: 0.8, color: 'pink', sweep: 0.6 });
      const notes = lines > 1 ? [0, 7, 11, 14] : [0, 7, 11];
      notes.forEach((s, i) => a.tone({ f: NOTE(s, 1318), t: 0.05 + i * 0.08, a: 0.03, d: 0.6, g: 0.035, type: 'triangle', lp: 4200 }));
    },
    combo(a, { n = 2 }) {
      const k = cap(n, 6);
      for (let i = 0; i < 3; i++) a.tone({ f: NOTE(PENTA[i + k], 988), t: i * 0.09, a: 0.02, d: 0.4, g: 0.035, type: 'triangle' });
      a.noise({ a: 0.08, d: 0.3, g: 0.05, type: 'bandpass', f: 2000, q: 0.7, color: 'pink' });
    },
    allClear(a) {
      a.noise({ a: 0.3, d: 1.2, g: 0.13, type: 'bandpass', f: 400, f2: 3200, q: 0.7, color: 'pink', sweep: 1.2 });
      [0, 4, 7, 11, 14, 19].forEach((s, i) => a.tone({ f: NOTE(s, 659), t: 0.15 + i * 0.1, a: 0.04, d: 1.0, g: 0.035, type: 'triangle', lp: 4000 }));
    },
    gameOver(a) { [7, 3, 0].forEach((s, i) => a.tone({ f: NOTE(s, 523), t: i * 0.25, a: 0.05, d: 0.7, g: 0.05, type: 'triangle', lp: 2400 })); },
    ui(a) { a.tone({ f: 1320, a: 0.01, d: 0.12, g: 0.04 }); },
  },

  soda: {
    place(a) {
      a.tone({ f: 620, f2: 170, glide: 0.04, d: 0.05, g: 0.3 });
      a.noise({ d: 0.02, g: 0.14, type: 'bandpass', f: 1600, q: 1.2 });
      for (let i = 0; i < 3; i++) a.noise({ t: 0.03 + i * a.rand(0.02, 0.04), d: 0.01, g: 0.025, type: 'bandpass', f: a.rand(3000, 4500), q: 2 });
    },
    invalid(a) { glass(a, 700, 0, 0.1, 0.06, 1400); },
    clear(a, { lines = 1 }) {
      a.tone({ f: 260, f2: 560, glide: 0.06, d: 0.08, g: 0.26 });
      const fizz = Math.min(10 + lines * 5, 24);
      for (let i = 0; i < fizz; i++) a.noise({ t: 0.05 + Math.random() * 0.45, d: 0.008, g: 0.03, type: 'bandpass', f: a.rand(2500, 4800), q: 2.5 });
      for (let i = 0; i < 2 + lines; i++) a.drop({ f: a.rand(700, 1100), t: 0.08 + i * 0.07, g: 0.08 });
    },
    combo(a, { n = 2 }) {
      const k = cap(n, 6);
      a.tone({ f: 560, f2: 180, glide: 0.04, d: 0.05, g: 0.22 });
      for (let i = 0; i < 2 + Math.min(k, 4); i++) a.drop({ f: 600 + i * 90 + k * 20, t: 0.05 + i * 0.06, g: 0.08 });
    },
    allClear(a) {
      [0, 0.14, 0.28].forEach((t, i) => a.tone({ f: 640 - i * 60, f2: 180, glide: 0.04, t, d: 0.06, g: 0.24 }));
      for (let i = 0; i < 26; i++) a.noise({ t: 0.1 + Math.random() * 0.8, d: 0.008, g: 0.028, type: 'bandpass', f: a.rand(2400, 4600), q: 2.5 });
    },
    gameOver(a) { a.noise({ a: 0.05, d: 0.8, g: 0.05, type: 'bandpass', f: 3000, f2: 900, q: 1.5 }); a.tone({ f: 300, f2: 120, t: 0.3, d: 0.15, g: 0.2 }); },
    ui(a) { a.tone({ f: 700, f2: 300, glide: 0.03, d: 0.04, g: 0.13 }); },
  },

  steam: {
    place(a) {
      metal(a, 3100, 0, 0.13, 0.035);
      a.noise({ d: 0.008, g: 0.16, type: 'highpass', f: 5000 });
      thud(a, 0, 0.22, 130);
    },
    invalid(a) { metal(a, 900, 0, 0.08, 0.03); a.noise({ d: 0.03, g: 0.06, type: 'lowpass', f: 700 }); },
    clear(a, { lines = 1 }) {
      const ticks = Math.min(6 + lines * 3, 15);
      for (let i = 0; i < ticks; i++) { metal(a, i % 2 ? 2600 : 3300, i * 0.034, 0.07, 0.025); a.noise({ t: i * 0.034, d: 0.006, g: 0.08, type: 'highpass', f: 4000 }); }
      metal(a, 880, ticks * 0.034 + 0.02, 0.12, 0.25);
    },
    combo(a, { n = 2 }) {
      const k = cap(n, 6); const step = 0.05 - k * 0.004;
      for (let i = 0; i < 4 + k; i++) metal(a, 2800 + (i % 3) * 300, i * step, 0.06, 0.02);
      a.noise({ t: 0.05, a: 0.03, d: 0.25, g: 0.03 + k * 0.004, type: 'highpass', f: 2600 });
    },
    allClear(a) {
      for (let i = 0; i < 14; i++) metal(a, 2600 + (i % 2) * 500, i * 0.03, 0.06, 0.02);
      metal(a, 1180, 0.48, 0.16, 0.9);
      a.noise({ t: 0.45, a: 0.08, d: 0.5, g: 0.04, type: 'highpass', f: 3000 });
    },
    gameOver(a) { [0, 0.18, 0.42, 0.75].forEach((t) => metal(a, 2700, t, 0.07, 0.03)); thud(a, 1.0, 0.25, 90); },
    ui(a) { metal(a, 3400, 0, 0.06, 0.02); },
  },

  koi: {
    place(a) { a.drop({ f: a.rand(850, 1200), g: 0.26 }); a.tone({ f: 180, f2: 120, d: 0.08, g: 0.12 }); },
    invalid(a) { a.noise({ d: 0.05, g: 0.1, type: 'lowpass', f: 500, color: 'brown' }); },
    clear(a, { lines = 1 }) {
      a.noise({ a: 0.01, d: 0.3 + lines * 0.08, g: 0.15, type: 'lowpass', f: 2200, f2: 500, color: 'pink' });
      for (let i = 0; i < 2 + lines * 2 && i < 8; i++) a.drop({ f: a.rand(700, 1500), t: 0.05 + i * a.rand(0.05, 0.09), g: 0.1 });
    },
    combo(a, { n = 2 }) {
      const k = cap(n, 6);
      for (let i = 0; i < 2 + Math.min(k, 4); i++) a.drop({ f: NOTE(PENTA[i + 1], 700 + k * 30), t: i * 0.08, g: 0.1 });
    },
    allClear(a) {
      a.noise({ a: 0.02, d: 0.8, g: 0.17, type: 'lowpass', f: 2600, f2: 400, color: 'pink' });
      for (let i = 0; i < 10; i++) a.drop({ f: a.rand(600, 1600), t: 0.1 + i * 0.07, g: 0.09 });
    },
    gameOver(a) { [0, 0.35, 0.8].forEach((t, i) => a.drop({ f: 900 - i * 150, t, g: 0.12, d: 0.09 })); },
    ui(a) { a.drop({ f: 1300, g: 0.1, d: 0.05 }); },
  },

  witch: {
    place(a) {
      glass(a, 1350, 0, 0.09, 0.16, 3200);
      a.tone({ f: 260, f2: 190, d: 0.06, g: 0.22 });
      a.noise({ d: 0.025, g: 0.08, type: 'lowpass', f: 900 });
    },
    invalid(a) { a.tone({ f: 240, f2: 200, d: 0.05, g: 0.14, lp: 700 }); },
    clear(a, { lines = 1 }) {
      for (let i = 0; i < Math.min(3 + lines, 6); i++) a.tone({ f: 170 + i * 10, f2: 330, glide: 0.07, t: i * 0.09, d: 0.08, g: 0.16, lp: 900 });
      [0, 5, 9].forEach((s, i) => glass(a, NOTE(s, 1175), 0.1 + i * 0.07, 0.04, 0.3, 4000));
    },
    combo(a, { n = 2 }) {
      const k = cap(n, 6);
      for (let i = 0; i < 2 + Math.min(k, 4); i++) a.tone({ f: NOTE(PENTA[i + k - 1], 880), t: i * 0.06, a: 0.01, d: 0.25, g: 0.04, type: 'triangle' });
      a.tone({ f: 190, f2: 340, glide: 0.07, d: 0.08, g: 0.14, lp: 900 });
    },
    allClear(a) {
      for (let i = 0; i < 9; i++) a.tone({ f: a.rand(140, 220), f2: a.rand(280, 380), glide: 0.06, t: i * 0.06, d: 0.07, g: 0.11, lp: 800 });
      [0, 4, 7, 11, 14].forEach((s, i) => glass(a, NOTE(s, 1046), 0.4 + i * 0.08, 0.045, 0.45, 4200));
    },
    gameOver(a) { [0, 0.25, 0.55].forEach((t, i) => a.tone({ f: 260 - i * 40, f2: 150 - i * 20, glide: 0.1, t, d: 0.14, g: 0.15, lp: 700 })); },
    ui(a) { glass(a, 1600, 0, 0.05, 0.08, 3000); },
  },

  patisserie: {
    place(a) {
      a.noise({ d: 0.05, g: 0.08, type: 'bandpass', f: 3000, q: 0.8, color: 'pink' });
      a.noise({ t: 0.02, d: 0.04, g: 0.05, type: 'bandpass', f: 2400, q: 0.8, color: 'pink' });
      a.tone({ f: 1900, d: 0.05, g: 0.05 });
      a.tone({ f: 210, f2: 160, d: 0.06, g: 0.15 });
    },
    invalid(a) { a.noise({ d: 0.04, g: 0.07, type: 'lowpass', f: 1200, color: 'pink' }); },
    clear(a, { lines = 1 }) {
      a.noise({ a: 0.02, d: 0.25, g: 0.08, type: 'bandpass', f: 1500, f2: 4000, q: 0.9, color: 'pink' });
      const notes = lines > 1 ? [0, 4, 7, 12] : [0, 4, 7];
      notes.forEach((s, i) => bell(a, NOTE(s, 1568), 0.04 + i * 0.07, 0.06, 0.35, 6000));
      for (let i = 0; i < 5; i++) a.noise({ t: 0.1 + Math.random() * 0.25, d: 0.006, g: 0.03, type: 'lowpass', f: 2000 });
    },
    combo(a, { n = 2 }) {
      const k = cap(n, 6);
      for (let i = 0; i < 3 + Math.min(k, 3); i++) bell(a, NOTE(PENTA[(i * 2 + k) % 10], 1046), i * 0.08, 0.05, 0.4, 5500);
    },
    allClear(a) {
      [0, 4, 7, 12, 7, 12, 16, 19].forEach((s, i) => bell(a, NOTE(s, 1046), i * 0.09, 0.055, 0.5, 6000));
      a.noise({ a: 0.05, d: 0.5, g: 0.06, type: 'bandpass', f: 1200, f2: 4200, q: 0.8, color: 'pink' });
    },
    gameOver(a) { [12, 7, 4, 0].forEach((s, i) => bell(a, NOTE(s, 784), i * 0.2, 0.06, 0.5, 5000)); },
    ui(a) { a.noise({ d: 0.03, g: 0.05, type: 'bandpass', f: 3200, q: 0.8, color: 'pink' }); },
  },

  abyss: {
    place(a) {
      a.tone({ f: 140, f2: 300, glide: 0.06, d: 0.09, g: 0.28, lp: 900 });
      a.tone({ f: 88, a: 0.02, d: 0.4, g: 0.07 });
    },
    invalid(a) { a.tone({ f: 90, f2: 70, d: 0.1, g: 0.18, lp: 400 }); },
    clear(a, { lines = 1 }) {
      a.noise({ a: 0.04, d: 0.6, g: 0.1, type: 'bandpass', f: 280, f2: 900, q: 6, color: 'pink' });
      for (let i = 0; i < Math.min(2 + lines * 2, 8); i++) a.tone({ f: a.rand(150, 260), f2: a.rand(380, 520), glide: 0.05, t: i * 0.07, d: 0.07, g: 0.14, lp: 1000 });
      a.tone({ f: 110, a: 0.05, d: 0.7, g: 0.06 });
    },
    combo(a, { n = 2 }) {
      const k = cap(n, 6);
      for (let i = 0; i < 2 + Math.min(k, 3); i++) a.tone({ f: NOTE(PENTA[i], 330 + k * 20), t: i * 0.1, a: 0.02, d: 0.35, g: 0.05, lp: 1200 });
    },
    allClear(a) {
      a.noise({ a: 0.2, d: 1.1, g: 0.12, type: 'bandpass', f: 180, f2: 1400, q: 4, color: 'pink', sweep: 1.1 });
      [0, 7, 12, 16].forEach((s, i) => a.tone({ f: NOTE(s, 110), t: 0.1 + i * 0.12, a: 0.1, d: 1.0, g: 0.06, lp: 900 }));
    },
    gameOver(a) { a.tone({ f: 220, f2: 55, glide: 1.2, a: 0.05, d: 1.3, g: 0.12, lp: 500 }); },
    ui(a) { a.tone({ f: 200, f2: 360, glide: 0.04, d: 0.06, g: 0.12, lp: 900 }); },
  },

  toybox: {
    place(a) { wood(a, 720, 0, 0.32); thud(a, 0, 0.12, 170); },
    invalid(a) { wood(a, 320, 0, 0.16); },
    clear(a, { lines = 1 }) {
      const n = Math.min(5 + lines * 3, 13);
      for (let i = 0; i < n; i++) {
        if (i % 3 === 2) metal(a, 2500, i * 0.05, 0.05, 0.04); else wood(a, i % 2 ? 900 : 760, i * 0.05, 0.14);
      }
    },
    combo(a, { n = 2 }) {
      const k = cap(n, 6);
      const pattern = [1, 0, 1, 1, 0, 1, 1, 1];
      for (let i = 0; i < 4 + k; i++) if (pattern[i % 8]) wood(a, i % 2 ? 1050 : 820, i * 0.06, 0.12);
      metal(a, 2900, (4 + k) * 0.06, 0.05, 0.08);
    },
    allClear(a) {
      for (let i = 0; i < 12; i++) a.noise({ t: i * 0.04, d: 0.01, g: 0.08, type: 'bandpass', f: 1800, q: 3 });
      metal(a, 2200, 0.52, 0.1, 0.5); wood(a, 880, 0.52, 0.25);
    },
    gameOver(a) { [0, 0.12, 0.27, 0.46, 0.72].forEach((t, i) => wood(a, 800 - i * 70, t, 0.12)); },
    ui(a) { wood(a, 1100, 0, 0.12); },
  },

  glass: {
    place(a) { glass(a, 1500, 0, 0.1, 0.12, 3000); thud(a, 0, 0.12, 180); },
    invalid(a) { glass(a, 620, 0, 0.07, 0.05, 1000); },
    clear(a, { lines = 1 }) {
      const notes = lines > 1 ? [0, 3, 7, 10, 14] : [0, 3, 7];
      notes.forEach((s, i) => glass(a, NOTE(s, 1046), i * 0.06, 0.06, 0.35, 3800));
      a.noise({ a: 0.05, d: 0.3, g: 0.025, type: 'highpass', f: 6000 });
    },
    combo(a, { n = 2 }) {
      const k = cap(n, 6);
      for (let i = 0; i < 2 + Math.min(k, 4); i++) glass(a, NOTE(PENTA[i + k - 1], 988), i * 0.07, 0.05, 0.3, 3800);
    },
    allClear(a) {
      [0, 3, 7, 10, 14, 17, 21].forEach((s, i) => glass(a, NOTE(s, 784), i * 0.06, 0.055, 0.6, 3800));
      a.noise({ a: 0.2, d: 0.7, g: 0.04, type: 'bandpass', f: 1500, f2: 5000, q: 0.6 });
    },
    gameOver(a) { [7, 3, 0].forEach((s, i) => glass(a, NOTE(s, 659), i * 0.25, 0.06, 0.5, 2600)); },
    ui(a) { glass(a, 1800, 0, 0.05, 0.08, 3200); },
  },

  aero: {
    place(a) {
      a.tone({ f: 480, f2: 900, glide: 0.04, d: 0.06, g: 0.22, lp: 2600 });
      a.noise({ d: 0.01, g: 0.06, type: 'highpass', f: 3500 });
    },
    invalid(a) { a.tone({ f: 300, f2: 220, d: 0.08, g: 0.16, lp: 1200 }); },
    clear(a, { lines = 1 }) {
      a.noise({ a: 0.05, d: 0.35, g: 0.1, type: 'bandpass', f: 700, f2: 3200, q: 0.8, color: 'pink' });
      (lines > 1 ? [0, 7, 12, 16] : [0, 7, 12]).forEach((s, i) => a.tone({ f: NOTE(s, 880), t: 0.04 + i * 0.06, a: 0.005, d: 0.3, g: 0.05, lp: 5000 }));
    },
    combo(a, { n = 2 }) {
      const k = cap(n, 6);
      for (let i = 0; i < 2 + Math.min(k, 4); i++) a.tone({ f: 420 + i * 70 + k * 25, f2: 820 + i * 90 + k * 25, glide: 0.04, t: i * 0.07, d: 0.06, g: 0.13, lp: 2800 });
    },
    allClear(a) {
      a.noise({ a: 0.15, d: 0.9, g: 0.11, type: 'bandpass', f: 500, f2: 4000, q: 0.7, color: 'pink', sweep: 0.9 });
      [0, 4, 7, 11, 14, 19].forEach((s, i) => a.tone({ f: NOTE(s, 660), t: 0.1 + i * 0.07, a: 0.01, d: 0.5, g: 0.045, lp: 5000 }));
    },
    gameOver(a) { [0, 0.2, 0.42].forEach((t, i) => a.tone({ f: 600 - i * 120, f2: 300 - i * 50, glide: 0.08, t, d: 0.12, g: 0.15, lp: 2000 })); },
    ui(a) { a.tone({ f: 700, f2: 1100, glide: 0.03, d: 0.04, g: 0.1, lp: 3000 }); },
  },

  mahjong: {
    place(a) { clack(a, 0, 0.72, 1, true); },
    invalid(a) {
      a.noise({ d: 0.025, g: 0.16, type: 'lowpass', f: 900 });
      a.tone({ f: 380, f2: 290, d: 0.035, g: 0.08, lp: 1000 });
    },
    clear(a, { lines = 1 }) {
      if (lines <= 1) {
        let t = 0;
        for (let i = 0; i < 5; i++) { clack(a, t, a.rand(0.32, 0.5), a.rand(0.85, 1.18), i === 0 || i === 3); t += a.rand(0.03, 0.075); }
      } else {
        const n = Math.min(7 + lines * 3, 15); let t = 0;
        for (let i = 0; i < n; i++) { clack(a, t, a.rand(0.24, 0.4), a.rand(0.82, 1.22), i % 4 === 0); t += a.rand(0.014, 0.04); }
        shuffleStroke(a, 0.02, 0.05);
      }
    },
    combo(a, { n = 2 }) {
      const k = cap(n, 6);
      const strokes = 2 + Math.min(k, 5);
      const step = 0.085 - k * 0.006;
      for (let i = 0; i < strokes; i++) shuffleStroke(a, i * step, 0.045 + k * 0.004);
      for (let i = 0; i < 3 + Math.min(k, 4); i++) clack(a, 0.03 + i * step * 0.8, 0.18 + k * 0.01, 1.1 + (i % 2) * 0.12, false);
    },
    allClear(a) {
      let t = 0; let gap = 0.09;
      for (let i = 0; i < 18; i++) { clack(a, t, 0.18 + i * 0.012, a.rand(0.85, 1.2), i % 5 === 0); t += gap; gap = Math.max(0.018, gap * 0.86); }
      shuffleStroke(a, 0.1, 0.05); shuffleStroke(a, 0.35, 0.05);
      clack(a, t + 0.14, 0.85, 1.12, true);
    },
    gameOver(a) {
      [0, 0.3, 0.62].forEach((t, i) => clack(a, t, 0.32, 0.95 - i * 0.08, true));
      a.tone({ f: 95, f2: 70, t: 0.95, d: 0.25, g: 0.2 });
      a.noise({ t: 0.95, d: 0.18, g: 0.12, type: 'lowpass', f: 400, color: 'brown' });
    },
    ui(a) { clack(a, 0, 0.22, 1.15, false); },
  },
  // 15 Starflower Post: sticker press, sticker peel, twinkling stars
  starflower: {
    place(a) {
      a.tone({ f: 210, f2: 120, d: 0.06, g: 0.26, lp: 900 });
      a.noise({ d: 0.03, g: 0.13, type: 'bandpass', f: 1800, q: 0.8, color: 'pink' });
      a.noise({ t: 0.012, d: 0.005, g: 0.05, type: 'highpass', f: 5200 });
    },
    invalid(a) { a.noise({ d: 0.04, g: 0.1, type: 'lowpass', f: 700, color: 'pink' }); a.tone({ f: 180, f2: 150, d: 0.06, g: 0.1, lp: 600 }); },
    clear(a, { lines = 1 }) {
      a.noise({ a: 0.02, d: 0.16, g: 0.11, type: 'bandpass', f: 800, f2: 4400, q: 2.2, sweep: 0.16 });
      const n = Math.min(3 + lines * 2, 9);
      for (let i = 0; i < n; i++) twinkle(a, NOTE(PENTA[i], 1568), 0.15 + i * 0.055, 0.045);
    },
    combo(a, { n = 2 }) {
      const k = cap(n, 6);
      for (let i = 0; i < 3 + Math.min(k, 4); i++) twinkle(a, NOTE(PENTA[i + k - 1] ?? 21, 1318), i * 0.05, 0.04);
      a.noise({ a: 0.05, d: 0.25, g: 0.03, type: 'highpass', f: 6000 });
    },
    allClear(a) {
      a.noise({ a: 0.05, d: 0.35, g: 0.12, type: 'bandpass', f: 600, f2: 5000, q: 2, sweep: 0.35 });
      for (let i = 0; i < 12; i++) twinkle(a, NOTE(PENTA[9 - (i % 10)], 1318), 0.25 + i * 0.07, 0.045);
    },
    gameOver(a) { [9, 7, 4, 0].forEach((s, i) => twinkle(a, NOTE(PENTA[s] ?? 0, 784), i * 0.24, 0.04)); a.tone({ f: 160, f2: 110, t: 0.95, d: 0.2, g: 0.12, lp: 600 }); },
    ui(a) { twinkle(a, 2093, 0, 0.035); },
  },

  // 16 Moonside Mechanism: quartz tick with a chrome hum, reverse swell into a minor lunar chime
  moonside: {
    place(a) {
      metal(a, 5200, 0, 0.07, 0.012);
      a.noise({ d: 0.004, g: 0.1, type: 'highpass', f: 6500 });
      a.tone({ f: 92, d: 0.12, g: 0.2 });
      glass(a, 1760, 0.01, 0.025, 0.45, 6000);
    },
    invalid(a) { metal(a, 1500, 0, 0.05, 0.02); metal(a, 1300, 0.07, 0.04, 0.02); },
    clear(a, { lines = 1 }) {
      a.noise({ a: 0.22, d: 0.04, g: 0.09, type: 'bandpass', f: 400, f2: 3200, q: 1.2, sweep: 0.24 });
      const notes = lines > 1 ? [0, 3, 7, 10, 14] : [0, 3, 7];
      notes.forEach((s, i) => bell(a, NOTE(s, 659.25), 0.24 + i * 0.07, 0.07, 0.9, 6000));
      a.tone({ f: 110, f2: 55, t: 0.24, glide: 0.5, d: 0.5, g: 0.16 });
    },
    combo(a, { n = 2 }) {
      const k = cap(n, 6); const step = 0.07 - k * 0.007;
      for (let i = 0; i < 4 + k; i++) tick(a, i % 2 ? 4700 : 5300, i * step, 0.05);
      bell(a, NOTE(PENTA[k] + 3, 880), (4 + k) * step, 0.06, 0.7, 6000);
    },
    allClear(a) {
      a.noise({ a: 0.4, d: 0.05, g: 0.1, type: 'bandpass', f: 300, f2: 4000, q: 1, sweep: 0.42 });
      [0, 7, 3, 10].forEach((s, i) => bell(a, NOTE(s, 330), 0.45 + i * 0.32, 0.09, 1.4, 5000));
    },
    gameOver(a) { [0, 0.16, 0.36, 0.62, 0.95].forEach((t) => tick(a, 5000, t, 0.05)); bell(a, 196, 1.2, 0.09, 1.6, 3000); },
    ui(a) { metal(a, 5600, 0, 0.05, 0.01); },
  },

  // 17 Pixel Crush: 8-bit square-wave blips, coin pickups and a 1-up jingle
  chiptune: {
    place(a) {
      a.tone({ f: 784, d: 0.03, g: 0.065, type: 'square', a: 0.001 });
      a.tone({ f: 1046.5, t: 0.03, d: 0.04, g: 0.055, type: 'square', a: 0.001 });
      a.tone({ f: 131, d: 0.06, g: 0.13, type: 'triangle', a: 0.001 });
    },
    invalid(a) { a.tone({ f: 110, d: 0.12, g: 0.07, type: 'square', a: 0.001 }); a.noise({ d: 0.05, g: 0.06, type: 'lowpass', f: 1200 }); },
    clear(a, { lines = 1 }) {
      a.tone({ f: 988, d: 0.055, g: 0.06, type: 'square', a: 0.001 });
      a.tone({ f: 1318.5, t: 0.06, d: 0.2, g: 0.06, type: 'square', a: 0.001 });
      if (lines > 1) [0, 4, 7, 12].forEach((s, i) => a.tone({ f: NOTE(s, 1046.5), t: 0.14 + i * 0.045, d: 0.05, g: 0.05, type: 'square', a: 0.001 }));
      a.noise({ d: 0.06, g: 0.05, type: 'highpass', f: 3000 });
    },
    combo(a, { n = 2 }) {
      const k = cap(n, 6);
      for (let i = 0; i < 3 + k; i++) a.tone({ f: NOTE([0, 4, 7, 12, 16, 19, 24, 28, 31][i] ?? 31, 523.25 + k * 30), t: i * 0.04, d: 0.04, g: 0.05, type: 'square', a: 0.001 });
    },
    allClear(a) {
      [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => a.tone({ f: NOTE(s, 523.25), t: i * 0.075, d: 0.07, g: 0.055, type: 'square', a: 0.001 }));
      [0, 7, 12].forEach((s, i) => a.tone({ f: NOTE(s, 130.8), t: i * 0.17, d: 0.15, g: 0.12, type: 'triangle', a: 0.001 }));
    },
    gameOver(a) { [7, 6, 5, 4, 3, 2, 1, 0].forEach((s, i) => a.tone({ f: NOTE(s, 392), t: i * 0.09, d: 0.08, g: 0.055, type: 'square', a: 0.001 })); a.tone({ f: 98, t: 0.75, d: 0.4, g: 0.12, type: 'triangle' }); },
    ui(a) { a.tone({ f: 1568, d: 0.025, g: 0.045, type: 'square', a: 0.001 }); },
  },

  // 18 Capsule Field Notes: pill rattle, capsule snap and powder hiss, rubber stamp
  capsule: {
    place(a) {
      for (let i = 0; i < 3; i++) plastic(a, i * a.rand(0.018, 0.03), 0.09 - i * 0.02);
      a.tone({ f: 170, f2: 120, d: 0.05, g: 0.14, lp: 700 });
    },
    invalid(a) { a.noise({ d: 0.03, g: 0.1, type: 'lowpass', f: 800 }); plastic(a, 0, 0.04); },
    clear(a, { lines = 1 }) {
      a.noise({ d: 0.012, g: 0.28, type: 'bandpass', f: 2500, q: 3 });
      a.modal({ f: 1800, g: 0.08, ratios: [1, 2.2], decays: [0.03, 0.015], gains: [1, 0.4] });
      a.noise({ t: 0.01, a: 0.02, d: 0.22 + lines * 0.05, g: 0.05, type: 'highpass', f: 3200, color: 'pink' });
      stamp(a, 0.2, 0.26);
      if (lines > 1) stamp(a, 0.34, 0.2);
    },
    combo(a, { n = 2 }) {
      const k = cap(n, 6);
      const clicks = Math.min(6 + k * 2, 14);
      for (let i = 0; i < clicks; i++) plastic(a, i * 0.022 + a.rand(0, 0.01), 0.05);
      stamp(a, clicks * 0.022 + 0.04, 0.2);
    },
    allClear(a) {
      for (let i = 0; i < 14; i++) plastic(a, i * 0.026, 0.05);
      a.noise({ t: 0.42, a: 0.04, d: 0.25, g: 0.07, type: 'bandpass', f: 900, f2: 2600, q: 0.9, color: 'pink' });
      stamp(a, 0.7, 0.32);
    },
    gameOver(a) { [0, 0.12, 0.26, 0.42].forEach((t) => plastic(a, t, 0.06)); stamp(a, 0.7, 0.24); },
    ui(a) { plastic(a, 0, 0.07); },
  },

  // 19 Queen's Tea Party: card snapped on felt, riffle shuffle and a teacup clink
  wonderland: {
    place(a) {
      a.noise({ d: 0.025, g: 0.3, type: 'bandpass', f: 1300, q: 0.9 });
      a.noise({ d: 0.008, g: 0.1, type: 'highpass', f: 4200 });
      a.tone({ f: 230, f2: 140, d: 0.035, g: 0.09 });
    },
    invalid(a) { a.noise({ d: 0.06, g: 0.1, type: 'lowpass', f: 900, color: 'pink' }); },
    clear(a, { lines = 1 }) {
      const n = Math.min(10 + lines * 4, 22);
      riffle(a, 0, n, 0.06);
      const t = n * 0.015 + 0.03;
      porcelain(a, 2850, t, 0.09); porcelain(a, 2920, t + 0.012, 0.05);
      if (lines > 1) porcelain(a, 3500, t + 0.14, 0.06);
    },
    combo(a, { n = 2 }) {
      const k = cap(n, 6);
      a.noise({ a: 0.03, d: 0.12, g: 0.07, type: 'bandpass', f: 1500, f2: 3500, q: 0.8, color: 'pink' });
      for (let i = 0; i < 1 + Math.min(k, 4); i++) porcelain(a, 3000 + i * 260, 0.1 + i * 0.09, 0.06);
    },
    allClear(a) {
      riffle(a, 0, 12, 0.055); riffle(a, 0.3, 12, 0.055);
      [0, 0.14, 0.26].forEach((t, i) => porcelain(a, 3300 + (i % 2) * 140, 0.62 + t, 0.06));
    },
    gameOver(a) { let t = 0; let gap = 0.03; for (let i = 0; i < 10; i++) { a.noise({ t, d: 0.02, g: 0.12, type: 'bandpass', f: a.rand(900, 1600), q: 0.9 }); t += gap; gap *= 1.3; } porcelain(a, 2200, t + 0.1, 0.06); },
    ui(a) { a.noise({ d: 0.012, g: 0.14, type: 'bandpass', f: 2200, q: 1.1 }); },
  },

  // 20 Paper Sky Daydream: paper tap and pencil tick; pages flutter, a paper plane, soft piano
  papersky: {
    place(a) {
      a.noise({ d: 0.04, g: 0.14, type: 'bandpass', f: 2200, q: 0.7, color: 'pink' });
      a.tone({ f: 180, d: 0.05, g: 0.1, lp: 700 });
      a.noise({ t: 0.02, d: 0.003, g: 0.05, type: 'highpass', f: 5200 });
    },
    invalid(a) { for (let i = 0; i < 4; i++) a.noise({ t: i * 0.02, d: 0.015, g: 0.06, type: 'lowpass', f: 1500, color: 'pink' }); },
    clear(a, { lines = 1 }) {
      const flaps = Math.min(4 + lines * 2, 10);
      for (let i = 0; i < flaps; i++) flap(a, i * 0.045, 0.07);
      a.noise({ a: 0.1, d: 0.3, g: 0.06, type: 'bandpass', f: 500, f2: 2600, q: 1.2, color: 'pink', sweep: 0.4 });
      (lines > 1 ? [0, 7, 16, 19] : [0, 7, 16]).forEach((s, i) => piano(a, NOTE(s, 523.25), 0.1 + i * 0.09, 0.06));
    },
    combo(a, { n = 2 }) {
      const k = cap(n, 6);
      for (let i = 0; i < 2 + Math.min(k, 4); i++) piano(a, NOTE([0, 4, 7, 11, 14, 16, 19][i], 659.25), i * 0.08, 0.05, 0.6);
      flap(a, 0, 0.05); flap(a, 0.06, 0.05);
    },
    allClear(a) {
      for (let i = 0; i < 9; i++) flap(a, i * 0.05, 0.06);
      a.noise({ a: 0.2, d: 0.6, g: 0.07, type: 'bandpass', f: 400, f2: 3000, q: 1, color: 'pink', sweep: 0.8 });
      [0, 4, 7, 11, 14, 19].forEach((s, i) => piano(a, NOTE(s, 523.25), 0.2 + i * 0.1, 0.055, 1.1));
    },
    gameOver(a) { [7, 4, 2, 0].forEach((s, i) => piano(a, NOTE(s, 392), i * 0.28, 0.06, 1.0)); flap(a, 1.2, 0.05, 900); },
    ui(a) { piano(a, 1568, 0, 0.035, 0.4); },
  },

  // 21 Prism Desk: glass UI tap; camera shutter and a lens shimmer
  prism: {
    place(a) {
      a.tone({ f: 2400, d: 0.015, g: 0.045 });
      a.noise({ d: 0.004, g: 0.06, type: 'highpass', f: 6000 });
      a.tone({ f: 320, f2: 180, d: 0.03, g: 0.13 });
    },
    invalid(a) { a.tone({ f: 260, f2: 200, d: 0.05, g: 0.1, lp: 900 }); a.tone({ f: 240, f2: 190, t: 0.07, d: 0.05, g: 0.08, lp: 900 }); },
    clear(a, { lines = 1 }) {
      shutter(a, 0, 0.26);
      const notes = lines > 1 ? [0, 4, 7, 11, 14] : [0, 7, 11];
      notes.forEach((s, i) => glass(a, NOTE(s, 2093), 0.1 + i * 0.035, 0.028, 0.35, 8000));
    },
    combo(a, { n = 2 }) {
      const k = cap(n, 6);
      for (let i = 0; i < 1 + Math.min(k, 4); i++) shutter(a, i * 0.11, 0.18);
    },
    allClear(a) {
      shutter(a, 0, 0.26);
      for (let i = 0; i < 8; i++) a.noise({ t: 0.15 + i * 0.035, d: 0.006, g: 0.08, type: 'bandpass', f: 2600, q: 2 });
      thud(a, 0.48, 0.18, 120);
      [0, 4, 7, 11].forEach((s, i) => glass(a, NOTE(s, 1760), 0.55 + i * 0.06, 0.03, 0.5, 8000));
    },
    gameOver(a) { thud(a, 0, 0.2, 110); a.tone({ f: 620, f2: 70, glide: 0.8, t: 0.05, d: 0.85, g: 0.07, type: 'triangle', lp: 1400 }); },
    ui(a) { a.tone({ f: 2600, d: 0.012, g: 0.04 }); a.tone({ f: 300, f2: 200, d: 0.02, g: 0.06 }); },
  },

  // 22 Lily Reliquary: wax seal press and signet; a cast church bell and ember crackle
  reliquary: {
    place(a) {
      a.tone({ f: 110, f2: 78, d: 0.1, g: 0.26 });
      a.noise({ d: 0.05, g: 0.12, type: 'lowpass', f: 900, color: 'brown' });
      metal(a, 2600, 0.02, 0.04, 0.06);
    },
    invalid(a) { a.noise({ d: 0.05, g: 0.1, type: 'lowpass', f: 500, color: 'brown' }); },
    clear(a, { lines = 1 }) {
      churchBell(a, 233, 0, 0.11, 1.1 + lines * 0.15);
      if (lines > 1) churchBell(a, 311, 0.28, 0.08, 1.0);
      for (let i = 0; i < 4 + lines * 2; i++) a.noise({ t: 0.05 + Math.random() * 0.5, d: 0.006, g: 0.05, type: 'highpass', f: a.rand(2500, 5000) });
    },
    combo(a, { n = 2 }) {
      const k = cap(n, 4);
      [0, -2, -4, -5, -7].slice(0, 1 + k).forEach((s, i) => churchBell(a, NOTE(s, 466), i * 0.15, 0.06, 0.8));
    },
    allClear(a) {
      [0, 7, 12, 15].forEach((s) => a.tone({ f: NOTE(s, 220) * a.rand(0.997, 1.003), a: 0.35, d: 1.4, g: 0.022, type: 'sawtooth', lp: 1300 }));
      churchBell(a, 116.5, 0.2, 0.14, 2.2);
      for (let i = 0; i < 12; i++) a.noise({ t: 0.2 + Math.random() * 1.2, d: 0.006, g: 0.045, type: 'highpass', f: a.rand(2500, 5000) });
    },
    gameOver(a) { churchBell(a, 98, 0, 0.13, 2.4); for (let i = 0; i < 6; i++) a.noise({ t: 0.4 + i * 0.25, d: 0.006, g: 0.03, type: 'highpass', f: 3000 }); },
    ui(a) { bell(a, 1760, 0, 0.04, 0.25); },
  },

  // 23 Gilt & Ink: ink brush dab and gold-foil crinkle; a sword drawn and its ringing blade
  gilt: {
    place(a) {
      a.noise({ a: 0.006, d: 0.06, g: 0.14, type: 'bandpass', f: 700, q: 0.6, color: 'pink' });
      for (let i = 0; i < 3; i++) a.noise({ t: 0.02 + i * a.rand(0.012, 0.025), d: 0.004, g: 0.04, type: 'highpass', f: a.rand(5000, 8000) });
      glass(a, 3500, 0.01, 0.018, 0.2, 9000);
    },
    invalid(a) { a.noise({ d: 0.05, g: 0.1, type: 'lowpass', f: 600, color: 'pink' }); },
    clear(a, { lines = 1 }) {
      shing(a, 0, 0.09);
      metal(a, 2800, 0.32, 0.05, 0.02); metal(a, 2500, 0.38, 0.04, 0.02);
      if (lines > 1) shing(a, 0.2, 0.06);
    },
    combo(a, { n = 2 }) {
      const k = cap(n, 6);
      for (let i = 0; i < 1 + Math.min(k, 3); i++) a.modal({ f: 1870 * Math.pow(2, (PENTA[i + 1] ?? 12) / 12), t: i * 0.09, g: 0.05, ratios: [1, 2.76, 5.4], decays: [0.6, 0.3, 0.15], gains: [1, 0.4, 0.15] });
    },
    allClear(a) {
      shing(a, 0, 0.1);
      [0, 4, 7].forEach((s, i) => a.modal({ f: NOTE(s, 1245), t: 0.3 + i * 0.06, g: 0.05, ratios: [1, 2.76, 5.4], decays: [1.2, 0.6, 0.3], gains: [1, 0.4, 0.15] }));
      a.modal({ f: 98, t: 0.3, g: 0.12, ratios: [1, 1.48, 2.1, 2.9], decays: [2, 1.5, 1.1, 0.8], gains: [1, 0.6, 0.4, 0.2] });
    },
    gameOver(a) { shing(a, 0, 0.07, false); thud(a, 0.3, 0.2, 100); },
    ui(a) { a.noise({ d: 0.005, g: 0.06, type: 'highpass', f: 6500 }); glass(a, 3200, 0, 0.015, 0.15, 9000); },
  },

  // 24 Garden Ticket: ticket punch; birdsong and rustling petals
  garden: {
    place(a) {
      a.noise({ d: 0.012, g: 0.22, type: 'bandpass', f: 3000, q: 2 });
      metal(a, 2200, 0, 0.04, 0.02);
      a.tone({ f: 200, f2: 140, d: 0.03, g: 0.1 });
    },
    invalid(a) { a.noise({ d: 0.04, g: 0.08, type: 'lowpass', f: 900, color: 'pink' }); },
    clear(a, { lines = 1 }) {
      const n = Math.min(2 + lines, 6);
      for (let i = 0; i < n; i++) chirp(a, 0.03 + i * a.rand(0.16, 0.22), 0.045, a.rand(2800, 3600));
      a.noise({ a: 0.03, d: 0.25, g: 0.035, type: 'bandpass', f: 3200, q: 0.8, color: 'pink' });
    },
    combo(a, { n = 2 }) {
      const k = cap(n, 6);
      a.tone({ f: 3600 + k * 120, d: 0.28, g: 0.035, vib: { rate: 26, depth: 260 } });
      chirp(a, 0.3, 0.04, 3800);
    },
    allClear(a) {
      for (let i = 0; i < 8; i++) chirp(a, Math.random() * 1.1, 0.035, a.rand(2600, 4200));
      bell(a, 2349, 0.15, 0.05, 0.6, 8000); bell(a, 2349, 0.38, 0.05, 0.6, 8000);
    },
    gameOver(a) { a.tone({ f: 3400, f2: 1800, glide: 0.5, d: 0.5, g: 0.035 }); bell(a, 1175, 0.6, 0.05, 0.9); },
    ui(a) { a.tone({ f: 3800, f2: 4600, glide: 0.03, d: 0.04, g: 0.03 }); },
  },
};

export const KIT_IDS = Object.keys(KITS);
