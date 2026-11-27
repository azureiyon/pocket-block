// Production effects as Studio variants. They run through the real Vfx engine
// on a simulated clock, so they can be paused, scrubbed and stepped exactly
// like the concepts. Seeking backwards re-simulates from zero (deterministic).

import { Vfx, seedVfx } from '../../src/ui/vfx.js';
import { getChoreo } from '../../src/ui/vfx-choreo/index.js';
import original from './jelly-original.js';

const STEP = 1000 / 60;

class Sim {
  constructor(panel, choreo) {
    this.panel = panel; this.queue = []; this.clock = 0;
    this.v = new Vfx({
      layer: panel.fx, board: panel.boardView, getTheme: () => panel.theme,
      enabled: () => true, reducedMotion: () => false, level: () => 1,
      raf: (fn) => this.queue.push(fn), now: () => this.clock,
    });
    if (choreo) { this.v.choreo = () => choreo; this.v.hasChoreo = () => true; }
    this.t = -1;
  }
  start(event, move) {
    const v = this.v;
    this.queue = []; this.clock = 0; v.reset(); v.running = false; v.time = 0; v.lastReal = 0;
    seedVfx(1234);
    if (event === 'place') v.place(move);
    else if (event === 'milestone') v.milestone({ n: 1, every: 2500 });
    else if (event === 'board') { v.place(move); v.clear(move); v.allClear(); }
    else { v.place(move); v.clear(move); if (move.combo >= 2) v.combo(move); }
    seedVfx(null);
    this.t = 0;
  }
  seek(t, event, move) {
    if (t < this.t || this.t < 0) this.start(event, move);
    while (this.t + STEP <= t) {
      this.t += STEP; this.clock = this.t;
      const q = this.queue; this.queue = [];
      for (const fn of q) fn(this.clock);
    }
    if (!this.v.running && this.v.ctx) this.v.reset();
  }
  dispose() { this.v.teardown(); if (this.v.canvas) this.v.canvas.remove(); if (this.v.back) this.v.back.remove(); }
}

function productionVariant(id, label, choreoOf, note) {
  return {
    id, label, kind: 'production', note,
    supports: ['place', 'single', 'multi', 'streak', 'milestone', 'board'],
    params: [], presets: { Default: {} },
    duration: () => 2600,
    keyframes: () => [300, 600, 900, 1300, 1800, 2300].map((t) => ({ t, label: `${t} ms`, note: '' })),
    simulated: true,
    makeSim: (panel) => new Sim(panel, choreoOf(panel)),
  };
}

export const PRODUCTION = [
  productionVariant('prod-current', 'Production · current (jelly beads)', (panel) => getChoreo(panel.theme.id), 'What ships on the batch-1 branch today.'),
  productionVariant('prod-original', 'Archive · original (gelatin masses)', () => original, 'The rejected first version, for reference.'),
];
