// Animated backgrounds. Each theme names an environment that builds a
// static backdrop plus (when allowed) a few lightweight motif elements animated
// by CSS. Motion is omitted when the setting is off or reduced motion is
// requested, and paused while the document is hidden.

const R = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(R(a, b + 1));

function gearPath(teeth, ro, ri, hole) {
  const pts = [];
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = (i / (teeth * 2)) * Math.PI * 2;
    const a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2;
    const r = i % 2 ? ri : ro;
    pts.push([Math.cos(a0) * r, Math.sin(a0) * r], [Math.cos(a1 - 0.05) * r, Math.sin(a1 - 0.05) * r]);
  }
  const d = 'M' + pts.map((p) => p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('L') + 'Z';
  return `${d} M${hole},0 A${hole},${hole} 0 1,0 ${-hole},0 A${hole},${hole} 0 1,0 ${hole},0Z`;
}

const vars = (o) => Object.entries(o).map(([k, v]) => `--${k}:${v}`).join(';');
const repeat = (n, fn) => Array.from({ length: n }, (_, i) => fn(i)).join('');

const KOI = '<svg viewBox="0 0 120 40" class="koi-svg"><path d="M4 20 C20 4 60 2 84 14 L104 6 L98 20 L104 34 L84 26 C60 38 20 36 4 20Z"/><path class="fin" d="M44 10 L56 0 L60 12Z M44 30 L56 40 L60 28Z"/></svg>';
const JELLY = '<svg viewBox="0 0 60 90" class="jelly-svg"><path class="bell" d="M4 30 C4 8 56 8 56 30 C50 34 44 30 38 34 C32 30 28 30 22 34 C16 30 10 34 4 30Z"/><path class="ten" d="M14 34 C10 50 18 60 12 80 M24 34 C22 52 30 62 26 86 M36 34 C38 52 30 64 34 84 M46 34 C50 50 42 60 48 78"/></svg>';
const RIBBON = '<svg viewBox="0 0 80 60" class="ribbon-svg"><path d="M40 22 C30 6 8 4 6 16 C4 28 26 30 40 24 C54 30 76 28 74 16 C72 4 50 6 40 22Z"/><path d="M38 26 L26 58 L34 54 L40 28 M42 26 L54 58 L46 54 L40 28"/><circle cx="40" cy="24" r="5"/></svg>';
const BAMBOO = (h) => `<svg viewBox="0 0 40 ${h}" preserveAspectRatio="none" class="bamboo-svg">${repeat(Math.floor(h / 60), (i) => `<rect x="14" y="${i * 60 + 2}" width="12" height="56" rx="5"/><rect class="node" x="12" y="${i * 60 + 56}" width="16" height="6" rx="3"/>`)}<path class="leaf" d="M26 40 C46 30 54 34 62 26 C50 44 40 44 26 44Z"/><path class="leaf" d="M14 130 C-6 120 -14 124 -22 116 C-10 134 0 134 14 134Z"/></svg>`;
const KEY = '<svg viewBox="0 0 80 80" class="key-svg"><rect x="36" y="34" width="8" height="40" rx="3"/><path d="M40 36 C18 36 8 22 14 12 C20 2 34 8 40 20 C46 8 60 2 66 12 C72 22 62 36 40 36Z"/></svg>';
const WINDOW = '<svg viewBox="0 0 100 160" class="window-svg"><path class="frame" d="M6 160 V60 A44 44 0 0 1 94 60 V160Z"/><path class="pane a" d="M12 156 V62 A38 38 0 0 1 50 24 V156Z"/><path class="pane b" d="M50 24 A38 38 0 0 1 88 62 V156 H50Z"/><circle class="rose" cx="50" cy="62" r="18"/><path class="lead" d="M50 24 V156 M12 100 H88 M32 62 V156 M68 62 V156 M12 128 H88"/></svg>';

export const ENVIRONMENTS = {
  paper: {
    motion: () => repeat(7, () => `<span class="e-paper s${rint(0, 2)}" style="${vars({ x: R(2, 92) + '%', y: R(4, 90) + '%', d: R(14, 26).toFixed(1) + 's', dl: -R(0, 20).toFixed(1) + 's', h: rint(0, 6) })}"></span>`),
  },
  neon: {
    static: () => '<div class="e-floor"></div><div class="e-scan"></div>',
    motion: () => `<div class="e-orbit o1"></div><div class="e-orbit o2"></div>
      <svg class="e-circuit" viewBox="0 0 400 800" preserveAspectRatio="none"><path d="M0 120 H120 L160 160 H400 M0 640 H90 L130 600 H260 L300 640 H400 M40 0 V60 L80 100 V300 M360 800 V700 L320 660 V480"/></svg>`,
  },
  jelly: {
    motion: () => repeat(3, (i) => `<span class="e-blob" style="${vars({ x: [8, 70, 30][i] + '%', y: [10, 60, 85][i] + '%', d: R(9, 14).toFixed(1) + 's' })}"></span>`)
      + repeat(8, () => `<span class="e-bub" style="${vars({ x: R(3, 95) + '%', s: R(8, 22).toFixed(0) + 'px', d: R(9, 16).toFixed(1) + 's', dl: -R(0, 16).toFixed(1) + 's' })}"></span>`),
  },
  clouds: {
    static: () => '<div class="e-halo h1"></div><div class="e-halo h2"></div>',
    motion: () => repeat(5, (i) => `<span class="e-cloud" style="${vars({ y: (6 + i * 19) + '%', s: R(0.6, 1.2).toFixed(2), d: R(40, 70).toFixed(0) + 's', dl: -R(0, 60).toFixed(0) + 's' })}"></span>`),
  },
  soda: {
    static: () => '<div class="e-stripes"></div>',
    motion: () => repeat(14, (i) => `<span class="e-sbub" style="${vars({ x: ([8, 12, 88, 92][i % 4] + R(-3, 3)) + '%', s: R(4, 10).toFixed(0) + 'px', d: R(4, 8).toFixed(1) + 's', dl: -R(0, 8).toFixed(1) + 's' })}"></span>`),
  },
  gears: {
    static: () => '<div class="e-gauge"><div class="e-needle"></div></div>',
    motion: () => [[-30, 8, 70, 14, 1, 40], [78, 70, 90, 18, -1, 55], [70, -6, 50, 10, -1, 30], [6, 78, 40, 9, 1, 24]].map(([x, y, s, t, dir, dur]) => `<svg class="e-gear" viewBox="-50 -50 100 100" style="${vars({ x: x + '%', y: y + '%', s: s + 'vmin', d: dur + 's', dir })}"><path d="${gearPath(t, 48, 40, 12)}"/></svg>`).join(''),
  },
  pond: {
    static: () => '<div class="e-moon"></div><div class="e-pad p1"></div><div class="e-pad p2"></div>',
    motion: () => `<div class="e-koi k1">${KOI}</div><div class="e-koi k2">${KOI}</div>`
      + repeat(4, () => `<span class="e-ripple" style="${vars({ x: R(5, 90) + '%', y: R(5, 92) + '%', d: R(5, 9).toFixed(1) + 's', dl: -R(0, 8).toFixed(1) + 's' })}"></span>`),
  },
  apothecary: {
    static: () => '<div class="e-shelf s1"></div><div class="e-shelf s2"></div>',
    motion: () => repeat(3, (i) => `<span class="e-herb" style="${vars({ x: (10 + i * 38) + '%', d: R(5, 8).toFixed(1) + 's' })}"></span>`)
      + repeat(5, () => `<span class="e-vapor" style="${vars({ x: R(5, 92) + '%', d: R(8, 13).toFixed(1) + 's', dl: -R(0, 12).toFixed(1) + 's' })}"></span>`)
      + repeat(8, () => `<span class="e-mote" style="${vars({ x: R(2, 96) + '%', y: R(4, 94) + '%', d: R(3, 6).toFixed(1) + 's', dl: -R(0, 5).toFixed(1) + 's' })}"></span>`),
  },
  patisserie: {
    static: () => '<div class="e-lace top"></div><div class="e-lace bottom"></div>',
    motion: () => `<div class="e-ribbon r1">${RIBBON}</div><div class="e-ribbon r2">${RIBBON}</div>`
      + repeat(6, () => `<span class="e-sugar" style="${vars({ x: R(3, 95) + '%', d: R(12, 20).toFixed(1) + 's', dl: -R(0, 20).toFixed(1) + 's' })}"></span>`),
  },
  abyss: {
    static: () => '<div class="e-rays"></div>',
    motion: () => repeat(3, (i) => `<div class="e-jelly" style="${vars({ x: [8, 74, 40][i] + '%', d: R(22, 34).toFixed(0) + 's', dl: -R(0, 30).toFixed(0) + 's', s: R(0.7, 1.2).toFixed(2) })}">${JELLY}</div>`)
      + repeat(6, () => `<span class="e-fishlight" style="${vars({ y: R(8, 92) + '%', d: R(14, 24).toFixed(0) + 's', dl: -R(0, 24).toFixed(0) + 's' })}"></span>`)
      + repeat(3, (i) => `<span class="e-current" style="${vars({ y: (20 + i * 28) + '%', d: R(9, 14).toFixed(1) + 's' })}"></span>`),
  },
  toybox: {
    static: () => '<div class="e-checker top"></div><div class="e-checker bottom"></div>',
    motion: () => `<div class="e-key k1">${KEY}</div><div class="e-key k2">${KEY}</div><div class="e-top"></div>`,
  },
  cathedral: {
    static: () => `<div class="e-window w1">${WINDOW}</div><div class="e-window w2">${WINDOW}</div>`,
    motion: () => repeat(3, (i) => `<span class="e-shaft" style="${vars({ x: (10 + i * 30) + '%', d: R(12, 18).toFixed(1) + 's', dl: -R(0, 12).toFixed(1) + 's' })}"></span>`)
      + repeat(8, () => `<span class="e-mote" style="${vars({ x: R(2, 96) + '%', y: R(4, 94) + '%', d: R(4, 7).toFixed(1) + 's', dl: -R(0, 6).toFixed(1) + 's' })}"></span>`),
  },
  aero: {
    static: () => '<svg class="e-wave w0" viewBox="0 0 800 100" preserveAspectRatio="none"><path d="M0 50 Q100 10 200 50 T400 50 T600 50 T800 50 V100 H0Z"/></svg>',
    motion: () => '<svg class="e-wave w1" viewBox="0 0 800 100" preserveAspectRatio="none"><path d="M0 50 Q100 10 200 50 T400 50 T600 50 T800 50 V100 H0Z"/></svg>'
      + repeat(7, () => `<span class="e-orb" style="${vars({ x: R(3, 92) + '%', s: R(14, 40).toFixed(0) + 'px', d: R(12, 22).toFixed(1) + 's', dl: -R(0, 20).toFixed(1) + 's' })}"></span>`),
  },
  parlor: {
    static: () => '<div class="e-lattice"></div><div class="e-lantern l1"></div><div class="e-lantern l2"></div>',
    motion: () => `<div class="e-bamboo b1">${BAMBOO(360)}</div><div class="e-bamboo b2">${BAMBOO(300)}</div>`,
  },
};

export class EnvironmentManager {
  constructor(root, { reducedMotion = () => false, doc = document } = {}) {
    this.root = root;
    this.doc = doc;
    this.reducedMotion = reducedMotion;
    this.envId = null;
    this.enabled = true;
    this.onVis = () => this.root.classList.toggle('paused', !!this.doc.hidden);
    this.doc.addEventListener('visibilitychange', this.onVis);
  }

  get animated() { return this.enabled && !this.reducedMotion(); }

  set(envId, enabled = this.enabled) {
    this.enabled = enabled;
    this.envId = envId;
    this.build();
  }

  build() {
    const env = ENVIRONMENTS[this.envId] || ENVIRONMENTS.paper;
    this.root.className = 'env env-' + (this.envId || 'paper') + (this.animated ? ' animated' : ' still') + (this.doc.hidden ? ' paused' : '');
    this.root.innerHTML = (env.static ? env.static() : '') + (this.animated && env.motion ? env.motion() : '');
  }

  motionCount() { return this.root.querySelectorAll('[class*="e-"]').length; }

  destroy() {
    this.doc.removeEventListener('visibilitychange', this.onVis);
    this.root.innerHTML = '';
    this.root.className = 'env';
  }
}
