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
};

export const KIT_IDS = Object.keys(KITS);
