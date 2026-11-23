// Gameplay effects layer: placement, line clears, combos, full-board clears,
// game over and labels. Cleared cells are copied into an overlay as ghosts,
// so the real board updates immediately (accurate geometry) while cosmetic
// animations play on top. Particle counts and timers are bounded and cleaned.

import { makeBlock } from './render.js';

export const MAX_PARTICLES = 90;

const R = (a, b) => a + Math.random() * (b - a);

// Blast mode praise by lines in one move, and for long streaks.
const PRAISE = [null, null, 'Great!', 'Amazing!', 'Unreal!', 'Legendary!'];
const STREAK_PRAISE = ['On Fire!', 'Unstoppable!', 'Godlike!'];

// Particle kinds: element styling + trajectory. Each theme names one kind.
const KINDS = {
  confetti: { dur: [700, 1000], make: (el, col) => { el.style.background = col; el.style.width = R(5, 9) + 'px'; el.style.height = R(4, 6) + 'px'; }, motion: () => ({ dx: R(-70, 70), dy: R(-70, -20), g: 120, rot: R(-540, 540), s0: 1, s1: 0.8 }) },
  spark: { dur: [350, 550], make: (el, col) => { el.style.background = col; el.style.boxShadow = `0 0 6px ${col}`; }, motion: () => { const a = R(0, Math.PI * 2); const d = R(30, 80); return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, g: 0, rot: a * 57.3, fixedRot: true, s0: 1, s1: 0.3 }; } },
  bubble: { dur: [700, 1000], make: (el, col) => { const s = R(7, 15); el.style.width = el.style.height = s + 'px'; el.style.borderColor = col; }, motion: () => ({ dx: R(-30, 30), dy: R(-110, -50), g: 0, rot: 0, s0: 0.6, s1: 1.4, wobble: R(6, 14) }) },
  mist: { dur: [900, 1300], make: (el, col) => { const s = R(24, 44); el.style.width = el.style.height = s + 'px'; el.style.background = `radial-gradient(circle, #fff 0%, ${col} 45%, transparent 70%)`; }, motion: () => ({ dx: R(-40, 40), dy: R(-50, -10), g: 0, rot: 0, s0: 0.6, s1: 2.2 }) },
  fizz: { dur: [500, 800], make: (el) => { const s = R(2.5, 5); el.style.width = el.style.height = s + 'px'; }, motion: () => ({ dx: R(-14, 14), dy: R(-140, -70), g: 0, rot: 0, s0: 1, s1: 0.6, wobble: 5 }) },
  cog: { dur: [700, 1000], make: (el, col) => { const s = R(9, 14); el.style.width = el.style.height = s + 'px'; el.style.setProperty('--pc', col); }, motion: () => ({ dx: R(-70, 70), dy: R(-60, -20), g: 140, rot: R(-400, 400), s0: 1, s1: 0.9 }) },
  droplet: { dur: [600, 850], make: (el, col) => { el.style.background = `linear-gradient(${col}, #e8f6ff)`; }, motion: () => ({ dx: R(-40, 40), dy: R(-90, -40), g: 190, rot: 0, s0: 1, s1: 0.7 }) },
  vapor: { dur: [1000, 1400], make: (el, col) => { el.style.background = `radial-gradient(ellipse, ${col}cc, transparent 70%)`; el.style.width = R(18, 30) + 'px'; el.style.height = R(26, 40) + 'px'; }, motion: () => ({ dx: R(-30, 30), dy: R(-120, -60), g: 0, rot: R(-60, 60), s0: 0.5, s1: 1.8, wobble: R(10, 20) }) },
  crumb: { dur: [650, 950], make: (el, col) => { const s = R(3, 6); el.style.width = s + 'px'; el.style.height = R(3, 6) + 'px'; el.style.background = Math.random() < 0.4 ? col : (Math.random() < 0.5 ? '#f6dfb8' : '#c98a5a'); el.style.borderRadius = `${R(20, 50)}% ${R(20, 50)}% ${R(20, 50)}% ${R(20, 50)}%`; }, motion: () => ({ dx: R(-50, 50), dy: R(-40, -5), g: 200, rot: R(-200, 200), s0: 1, s1: 1 }) },
  glow: { dur: [1100, 1600], make: (el, col) => { const s = R(3, 7); el.style.width = el.style.height = s + 'px'; el.style.background = col; el.style.boxShadow = `0 0 10px 3px ${col}`; }, motion: () => ({ dx: R(-40, 40), dy: R(-90, -30), g: 0, rot: 0, s0: 0.4, s1: 1, wobble: 12, pulse: true }) },
  chip: { dur: [600, 850], make: (el, col) => { el.style.background = Math.random() < 0.25 ? 'linear-gradient(#f4f4f4,#9aa)' : col; el.style.width = R(3, 5) + 'px'; el.style.height = R(6, 9) + 'px'; }, motion: () => ({ dx: R(-70, 70), dy: R(-80, -30), g: 230, rot: R(-600, 600), s0: 1, s1: 1 }) },
  shard: { dur: [600, 900], make: (el, col) => { el.style.background = `linear-gradient(135deg, #fff8, ${col}, #fff4)`; const s = R(8, 14); el.style.width = s + 'px'; el.style.height = s * 1.3 + 'px'; }, motion: () => { const a = R(0, Math.PI * 2); const d = R(40, 90); return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, g: 40, rot: R(-300, 300), s0: 1, s1: 0.5 }; } },
  orb: { dur: [900, 1300], make: (el, col) => { const s = R(8, 16); el.style.width = el.style.height = s + 'px'; el.style.setProperty('--pc', col); }, motion: () => ({ dx: R(-35, 35), dy: R(-100, -40), g: 0, rot: 0, s0: 0.5, s1: 1.1, wobble: 8 }) },
  tile: { dur: [700, 1000], make: (el) => { el.style.width = '9px'; el.style.height = '12px'; }, motion: () => ({ dx: R(-80, 80), dy: R(-70, -30), g: 220, rot: R(-360, 360), s0: 1, s1: 0.9, flip: true }) },
  starbloom: { dur: [800, 1200], make: (el, col) => { el.style.setProperty('--pc', col); }, motion: () => ({ dx: R(-50, 50), dy: R(-100, -40), g: 30, rot: R(-120, 120), s0: 0.6, s1: 1.1, wobble: R(6, 12) }) },
  star8: { dur: [700, 1100], make: (el, col) => { el.style.setProperty('--pc', col); const s = R(8, 16); el.style.width = el.style.height = s + 'px'; }, motion: () => { const a = R(0, Math.PI * 2); const d = R(25, 70); return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, g: 0, rot: 45, fixedRot: true, s0: 0.3, s1: 1.2, pulse: true }; } },
  pixel: { dur: [450, 700], make: (el, col) => { el.style.background = col; const s = Math.random() < 0.5 ? 6 : 4; el.style.width = el.style.height = s + 'px'; }, motion: () => ({ dx: Math.round(R(-6, 6)) * 10, dy: Math.round(R(-8, -3)) * 10, g: 160, rot: 0, fixedRot: true, s0: 1, s1: 1 }) },
  powder: { dur: [700, 1100], make: (el, col) => { el.style.background = col; const s = R(4, 9); el.style.width = el.style.height = s + 'px'; }, motion: () => ({ dx: R(-45, 45), dy: R(-35, 10), g: 20, rot: 0, s0: 0.6, s1: 2.4 }) },
  cardlet: { dur: [700, 1000], make: (el, col) => { el.style.setProperty('--pc', col); }, motion: () => ({ dx: R(-80, 80), dy: R(-80, -30), g: 210, rot: R(-400, 400), s0: 1, s1: 0.9, flip: true }) },
  plane: { dur: [800, 1100], make: (el, col) => { el.style.setProperty('--pc', col); }, motion: () => ({ dx: R(50, 110), dy: R(-90, -40), g: 0, rot: -25, fixedRot: true, s0: 0.8, s1: 1.1, wobble: 6 }) },
  flare: { dur: [700, 1000], make: (el) => { const s = R(10, 26); el.style.width = el.style.height = s + 'px'; }, motion: () => ({ dx: R(-40, 40), dy: R(-40, 20), g: 0, rot: 0, fixedRot: true, s0: 0.3, s1: 1.6 }) },
  ember: { dur: [900, 1400], make: (el, col) => { const hot = Math.random() < 0.6 ? '#ff5a2a' : col; const s = R(2.5, 5); el.style.width = el.style.height = s + 'px'; el.style.background = hot; el.style.boxShadow = `0 0 6px 2px ${hot}`; }, motion: () => ({ dx: R(-25, 25), dy: R(-120, -60), g: 0, rot: 0, s0: 1, s1: 0.4, wobble: R(6, 14), pulse: true }) },
  goldleaf: { dur: [900, 1300], make: (el) => { const s = R(6, 11); el.style.width = s + 'px'; el.style.height = s * 0.8 + 'px'; }, motion: () => ({ dx: R(-50, 50), dy: R(-60, -20), g: 140, rot: R(-300, 300), s0: 1, s1: 0.9, flip: true, wobble: 10 }) },
  petal: { dur: [900, 1300], make: (el, col) => { el.style.background = `linear-gradient(135deg, #fff, ${col})`; el.style.width = R(6, 10) + 'px'; el.style.height = R(5, 8) + 'px'; }, motion: () => ({ dx: R(-60, 60), dy: R(-60, -15), g: 120, rot: R(-260, 260), s0: 1, s1: 0.9, wobble: 12 }) },
  bird: { dur: [900, 1300], make: (el, col) => { el.style.setProperty('--pc', Math.random() < 0.6 ? '#1c1c1e' : col); }, motion: () => ({ dx: R(40, 110) * (Math.random() < 0.5 ? -1 : 1), dy: R(-110, -50), g: 0, rot: R(-20, 20), fixedRot: true, s0: 0.6, s1: 1.1, wobble: 8 }) },
  blossom: { dur: [800, 1200], make: (el, col) => { el.style.setProperty('--pc', Math.random() < 0.5 ? '#ffffff' : col); }, motion: () => ({ dx: R(-60, 60), dy: R(-70, -20), g: 110, rot: R(-200, 200), s0: 1, s1: 0.8, wobble: 6 }) },
  goldfish: { dur: [1000, 1400], make: () => {}, motion: () => { const dir = Math.random() < 0.5 ? -1 : 1; return { dx: dir * R(60, 120), dy: R(-50, 10), g: 0, rot: dir < 0 ? 0 : 180, fixedRot: true, s0: 0.7, s1: 1.1, wobble: 10 }; } },
  node: { dur: [500, 800], make: () => {}, motion: () => ({ dx: Math.round(R(-6, 6)) * 12, dy: Math.round(R(-6, 3)) * 12, g: 0, rot: 0, fixedRot: true, s0: 1.4, s1: 0.4, pulse: true }) },
  glint: { dur: [800, 1200], make: (el) => { const s = R(8, 18); el.style.width = el.style.height = s + 'px'; }, motion: () => ({ dx: R(-20, 20), dy: R(-90, -40), g: 0, rot: 0, fixedRot: true, s0: 0.3, s1: 1.2, pulse: true }) },
  sparkle: { dur: [700, 1000], make: (el, col) => { el.style.setProperty('--pc', Math.random() < 0.6 ? '#e85a7a' : col); }, motion: () => { const a = R(0, Math.PI * 2); const d = R(30, 80); return { dx: Math.cos(a) * d, dy: Math.sin(a) * d, g: 40, rot: R(-180, 180), s0: 1, s1: 0.4 }; } },
};
export const PARTICLE_KINDS = Object.keys(KINDS);

function keyframes(m) {
  const frames = [];
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    const x = m.dx * t + (m.wobble ? Math.sin(t * Math.PI * 3) * m.wobble : 0);
    const y = m.dy * t + m.g * t * t;
    const s = m.s0 + (m.s1 - m.s0) * t;
    const rot = m.fixedRot ? m.rot : m.rot * t;
    const flip = m.flip ? ` rotateX(${t * 540}deg)` : '';
    frames.push({
      transform: `translate(-50%,-50%) translate(${x}px,${y}px) rotate(${rot}deg)${flip} scale(${s})`,
      opacity: m.pulse ? (t < 1 ? 0.5 + 0.5 * Math.abs(Math.sin(t * 9)) : 0) : (t < 0.6 ? 1 : 1 - (t - 0.6) / 0.4),
    });
  }
  return frames;
}

export class Effects {
  constructor({ layer, board, getTheme, reducedMotion = () => false }) {
    this.layer = layer;
    this.board = board; // BoardView
    this.getTheme = getTheme;
    this.reducedMotion = reducedMotion;
    this.particles = new Set();
    this.timers = new Set();
    this.nodes = new Set();
  }

  later(fn, ms) {
    const id = setTimeout(() => { this.timers.delete(id); fn(); }, ms);
    this.timers.add(id);
    return id;
  }

  track(node, ms) {
    this.layer.appendChild(node);
    this.nodes.add(node);
    this.later(() => { node.remove(); this.nodes.delete(node); }, ms);
    return node;
  }

  /** Remove every live effect (restart, theme preview close). */
  reset() {
    for (const id of this.timers) clearTimeout(id);
    this.timers.clear();
    for (const n of this.nodes) n.remove();
    this.nodes.clear();
    for (const p of this.particles) p.remove();
    this.particles.clear();
    this.board.el.classList.remove('is-over', 'shake', 'squish', 'celebrate', 'pulse');
  }

  spawn(x, y, count, colors) {
    if (this.reducedMotion()) return 0;
    const theme = this.getTheme();
    const kind = KINDS[theme.particle] || KINDS.confetti;
    let made = 0;
    for (let k = 0; k < count; k++) {
      if (this.particles.size >= MAX_PARTICLES) break;
      const el = document.createElement('div');
      el.className = 'pt pt-' + theme.particle;
      const col = colors[k % colors.length];
      kind.make(el, col);
      el.style.left = x + R(-10, 10) + 'px';
      el.style.top = y + R(-10, 10) + 'px';
      this.layer.appendChild(el);
      this.particles.add(el);
      const dur = R(kind.dur[0], kind.dur[1]);
      const done = () => { el.remove(); this.particles.delete(el); };
      if (el.animate) {
        const anim = el.animate(keyframes(kind.motion()), { duration: dur, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
        anim.onfinish = done; anim.oncancel = done;
      }
      this.later(done, dur + 100); // safety net
      made++;
    }
    return made;
  }

  centerOf(indices) {
    let x = 0; let y = 0;
    for (const i of indices) { const b = this.board.cellBox(i, this.layer); x += b.x + b.w / 2; y += b.y + b.h / 2; }
    return { x: x / indices.length, y: y / indices.length };
  }

  label(text, cls = '', at = null, ms = 1100) {
    const el = document.createElement('div');
    el.className = 'fx-label ' + cls;
    el.textContent = text;
    if (at) { el.style.left = at.x + 'px'; el.style.top = at.y + 'px'; }
    return this.track(el, ms);
  }

  // ----- event handlers -----

  place(move) {
    const theme = this.getTheme();
    const c = this.centerOf(move.placed);
    const col = theme.palette[(move.color - 1) % 7];
    this.spawn(c.x, c.y, move.lines ? 3 : 5, [col]);
    this.board.el.classList.remove('squish');
    void this.board.el.offsetWidth;
    this.board.el.classList.add('squish');
    this.later(() => this.board.el.classList.remove('squish'), 320);
    // Blast clears get their own big score pop (see blast()).
    if (!(move.arcade && move.lines)) this.label('+' + move.points, 'pts', { x: c.x, y: c.y - 10 }, 800);
  }

  clear(move) {
    const theme = this.getTheme();
    const origin = this.centerOf(move.placed);
    const multi = move.lines > 1;
    // Ghost copies of cleared blocks animate out over the live board.
    for (const { i, color } of move.clearedCells) {
      const b = this.board.cellBox(i, this.layer);
      const g = makeBlock(theme, color);
      g.classList.add('clear-ghost');
      if (multi) g.classList.add('multi');
      const dist = Math.hypot(b.x + b.w / 2 - origin.x, b.y + b.h / 2 - origin.y);
      g.style.cssText += `;left:${b.x}px;top:${b.y}px;width:${b.w}px;height:${b.h}px;--delay:${Math.round(dist * 0.9)}ms`;
      this.track(g, 900 + dist * 0.9);
    }
    // Line sweeps.
    const sweep = (k, vertical) => {
      const first = vertical ? k : k * 8;
      const last = vertical ? 56 + k : k * 8 + 7;
      const a = this.board.cellBox(first, this.layer); const z = this.board.cellBox(last, this.layer);
      const el = document.createElement('div');
      el.className = 'sweep ' + (vertical ? 'v' : 'h');
      el.style.cssText = `left:${a.x}px;top:${a.y}px;width:${z.x + z.w - a.x}px;height:${z.y + z.h - a.y}px`;
      this.track(el, 700);
    };
    move.rows.forEach((r) => sweep(r, false));
    move.cols.forEach((c) => sweep(c, true));
    // Particles along cleared lines (bounded).
    const colors = [...new Set(move.clearedCells.map((x) => theme.palette[(x.color - 1) % 7]))];
    const perLine = multi ? 9 : 7;
    const pts = [...move.rows.map((r) => r * 8 + 3), ...move.cols.map((c) => 24 + c)];
    for (const i of pts) { const b = this.board.cellBox(i, this.layer); this.later(() => this.spawn(b.x + b.w, b.y + b.h / 2, perLine, colors), 60); }
    if (multi) {
      if (!move.arcade) this.label(move.lines + ' Lines!', 'multi');
      this.board.el.classList.remove('shake'); void this.board.el.offsetWidth;
      this.board.el.classList.add('pulse');
      this.later(() => this.board.el.classList.remove('pulse'), 500);
    }
  }

  combo(move) {
    const c = this.centerOf(move.placed);
    const cap = move.arcade ? 8 : 5;
    this.label('Combo ×' + move.combo, 'combo lvl' + Math.min(move.combo, cap), { x: c.x, y: c.y - 44 }, 1200);
  }

  /** Blast mode: big multiplied score pop, praise, colour wipes. */
  blast(move) {
    if (!move.lines || !move.parts) return;
    const theme = this.getTheme();
    const c = this.centerOf(move.placed);
    const p = move.parts;
    const gained = p.clear + p.wipe + p.board;
    const el = this.label('+' + gained, 'blast-pts' + (gained >= 500 ? ' big' : ''), { x: c.x, y: c.y + 22 }, 1000);
    if (p.mult > 1) { const m = document.createElement('small'); m.textContent = '×' + p.mult; el.appendChild(m); }
    const praise = move.allClear ? null : PRAISE[Math.min(move.lines, PRAISE.length - 1)] || (move.combo >= 5 ? STREAK_PRAISE[Math.min(Math.floor(move.combo / 5) - 1, STREAK_PRAISE.length - 1)] : null);
    if (praise && (move.lines >= 2 || move.combo % 5 === 0)) this.label(praise, 'praise lvl' + Math.min(move.lines + 1, 4), null, 1300);
    if (move.wiped && move.wiped.length) {
      const n = move.wiped.length;
      this.later(() => {
        this.label(n > 1 ? n + ' Colours Wiped!' : 'Colour Wipe!', 'wipe', null, 1400);
        this.board.el.classList.remove('wipe'); void this.board.el.offsetWidth;
        this.board.el.classList.add('wipe');
        this.later(() => this.board.el.classList.remove('wipe'), 650);
        const box = this.layer.getBoundingClientRect();
        this.spawn(box.width / 2, box.height * 0.58, 10 + 6 * n, move.wiped.map((col) => theme.palette[(col - 1) % 7]));
      }, 220);
    }
  }

  streakEnd(n) {
    if (n < 3) return;
    this.label('Streak ×' + n + ' ended', 'streak-end', null, 1200);
  }

  allClear() {
    const theme = this.getTheme();
    const box = this.layer.getBoundingClientRect();
    const cx = box.width / 2; const cy = box.height / 2;
    const ring = document.createElement('div');
    ring.className = 'celebrate-ring';
    this.track(ring, 1400);
    this.board.el.classList.add('celebrate');
    this.later(() => this.board.el.classList.remove('celebrate'), 1400);
    this.label('Board Clear!', 'allclear', null, 1700);
    for (let w = 0; w < 3; w++) this.later(() => this.spawn(cx + R(-60, 60), cy + R(-60, 60), 14, theme.palette), w * 160);
  }

  invalid() {
    this.board.el.classList.remove('shake'); void this.board.el.offsetWidth;
    this.board.el.classList.add('shake');
    this.later(() => this.board.el.classList.remove('shake'), 400);
  }

  gameOver() {
    this.board.el.classList.add('is-over');
  }

  clearGameOver() { this.board.el.classList.remove('is-over'); }
}
