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

const STARFLOWER = '<svg viewBox="0 0 40 40" class="sf-svg"><path class="petals" d="M20 2 C24 10 30 10 38 14 C31 19 32 25 32 36 C26 30 20 31 20 31 C20 31 14 30 8 36 C8 25 9 19 2 14 C10 10 16 10 20 2Z"/><path class="eye" d="M20 13 L22 18 L27 18 L23 21 L25 26 L20 23 L15 26 L17 21 L13 18 L18 18Z"/></svg>';
const SPARK4 = '<svg viewBox="0 0 20 20" class="spark-svg"><path d="M10 0 C11 7 13 9 20 10 C13 11 11 13 10 20 C9 13 7 11 0 10 C7 9 9 7 10 0Z"/></svg>';
const ROMAN = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
const CLOCKFACE = `<svg viewBox="-100 -100 200 200" class="clock-svg"><circle r="96" class="rim"/><circle r="78" class="rim thin"/>${ROMAN.map((n, i) => { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; return `<text x="${(Math.cos(a) * 87).toFixed(1)}" y="${(Math.sin(a) * 87 + 3.5).toFixed(1)}">${n}</text>`; }).join('')}${repeat(60, (i) => { const a = (i / 60) * Math.PI * 2; const r0 = i % 5 ? 74 : 70; return `<line x1="${(Math.cos(a) * r0).toFixed(1)}" y1="${(Math.sin(a) * r0).toFixed(1)}" x2="${(Math.cos(a) * 77).toFixed(1)}" y2="${(Math.sin(a) * 77).toFixed(1)}"/>`; })}</svg>`;
const PIXEL_HEART = '<svg viewBox="0 0 7 6" class="ph-svg" shape-rendering="crispEdges"><path d="M1 0H3V1H4V0H6V1H7V3H6V4H5V5H4V6H3V5H2V4H1V3H0V1H1Z"/></svg>';
const PILL = '<svg viewBox="0 0 60 26" class="pill-svg"><rect x="1.5" y="1.5" width="57" height="23" rx="11.5" class="shell"/><path d="M30 1.5 H13 A11.5 11.5 0 0 0 13 24.5 H30Z" class="half"/><path d="M8 7 Q14 4 22 5" class="shine"/></svg>';
const CARD = (g) => `<svg viewBox="0 0 40 56" class="card-svg"><rect x="1" y="1" width="38" height="54" rx="4" class="face"/><rect x="4" y="4" width="32" height="48" rx="2" class="frame"/><text x="20" y="35">${g}</text></svg>`;
const ROSE = '<svg viewBox="0 0 40 40" class="rose-svg"><circle cx="20" cy="20" r="14" class="bloom"/><path d="M20 10 C26 12 28 18 22 22 C16 26 12 20 16 16 C19 13 23 16 21 19" class="curl"/><path d="M8 30 C2 28 0 34 6 36 C10 34 10 32 8 30Z M32 30 C38 28 40 34 34 36 C30 34 30 32 32 30Z" class="leaf"/></svg>';
const WATCH = '<svg viewBox="0 0 60 90" class="watch-svg"><path d="M30 0 V18" class="chain"/><circle cx="30" cy="24" r="6" class="ring"/><circle cx="30" cy="56" r="26" class="case"/><circle cx="30" cy="56" r="21" class="dial"/><path d="M30 56 V40 M30 56 L41 62" class="hands"/></svg>';
const PLANE = '<svg viewBox="0 0 60 30" class="plane-svg"><path d="M2 14 L58 2 L24 18Z" class="top"/><path d="M24 18 L58 2 L30 28Z" class="side"/></svg>';
const LILY = '<svg viewBox="0 0 60 60" class="lily-svg"><path d="M30 4 L35 22 L52 14 L40 30 L56 38 L37 38 L30 56 L23 38 L4 38 L20 30 L8 14 L25 22Z"/><circle cx="30" cy="30" r="5" class="eye"/></svg>';
const ARCH = '<svg viewBox="0 0 100 200" preserveAspectRatio="none" class="arch-svg"><path d="M0 200 V70 Q0 8 50 0 Q100 8 100 70 V200 H86 V74 Q86 22 50 14 Q14 22 14 74 V200Z"/></svg>';
const TULIP = '<svg viewBox="0 0 40 70" class="tulip-svg"><path d="M20 30 V70" class="stem"/><path d="M20 52 C8 44 4 52 6 60 C12 56 16 56 20 58Z" class="leaf"/><path d="M8 10 C8 26 14 32 20 32 C26 32 32 26 32 10 L26 16 L20 6 L14 16Z" class="bloom"/></svg>';

const ZODIAC = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'];
const ZODIAC_WHEEL = `<svg viewBox="-100 -100 200 200" class="zodiac-svg"><circle r="96" class="r"/><circle r="74" class="r"/><circle r="40" class="r"/>${ZODIAC.map((z, i) => { const a = (i / 12) * Math.PI * 2; return `<text x="${(Math.cos(a) * 85).toFixed(1)}" y="${(Math.sin(a) * 85 + 4).toFixed(1)}">${z}︎</text><line x1="${(Math.cos(a + 0.26) * 74).toFixed(1)}" y1="${(Math.sin(a + 0.26) * 74).toFixed(1)}" x2="${(Math.cos(a + 0.26) * 96).toFixed(1)}" y2="${(Math.sin(a + 0.26) * 96).toFixed(1)}" class="r"/>`; }).join('')}${repeat(8, (i) => { const a = (i / 8) * Math.PI * 2; return `<circle cx="${(Math.cos(a) * 57).toFixed(1)}" cy="${(Math.sin(a) * 57).toFixed(1)}" r="7" class="moon m${i}"/>`; })}</svg>`;
const BIRD = '<svg viewBox="0 0 40 20" class="bird-svg"><path d="M0 6 C8 2 14 6 20 14 C26 6 32 2 40 6 C32 6 26 10 20 18 C14 10 8 6 0 6Z"/></svg>';
const DOOR = '<svg viewBox="0 0 60 110" class="door-svg"><rect x="2" y="2" width="44" height="106" class="frame"/><rect x="6" y="6" width="36" height="102" class="view"/><path d="M42 6 L58 12 L58 104 L42 108Z" class="leaf"/></svg>';
const FISH = '<svg viewBox="0 0 60 30" class="fish-svg"><path d="M10 15 C16 3 34 3 42 13 L56 4 L52 15 L56 26 L42 17 C34 27 16 27 10 15Z" class="body"/><path d="M24 6 L30 0 L34 7Z M26 24 L32 30 L34 23Z" class="fin"/><circle cx="17" cy="13" r="1.8" class="eye"/></svg>';
const DIALOG = (t) => `<div class="e-dlg"><b>${t}</b><p>Brain not found.</p><i>OK</i></div>`;

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
  starflower: {
    static: () => '<div class="e-stamp s1"></div><div class="e-stamp s2"></div><div class="e-postmark"></div>',
    motion: () => repeat(6, () => `<span class="e-sf" style="${vars({ x: R(2, 90) + '%', y: R(4, 88) + '%', s: R(22, 46).toFixed(0) + 'px', d: R(12, 22).toFixed(1) + 's', dl: -R(0, 20).toFixed(1) + 's' })}">${STARFLOWER}</span>`)
      + repeat(10, () => `<span class="e-twinkle" style="${vars({ x: R(2, 96) + '%', y: R(2, 96) + '%', s: R(8, 18).toFixed(0) + 'px', d: R(2, 4.5).toFixed(1) + 's', dl: -R(0, 4).toFixed(1) + 's' })}">${SPARK4}</span>`),
  },
  orrery: {
    static: () => `<div class="e-clock">${CLOCKFACE}</div><div class="e-lunar"></div>`,
    motion: () => '<div class="e-ring r1"></div><div class="e-ring r2"></div><div class="e-ring r3"></div><div class="e-hand"></div>'
      + repeat(9, () => `<span class="e-twinkle" style="${vars({ x: R(2, 96) + '%', y: R(2, 96) + '%', s: R(8, 20).toFixed(0) + 'px', d: R(2.5, 5).toFixed(1) + 's', dl: -R(0, 5).toFixed(1) + 's' })}">${SPARK4}</span>`),
  },
  desktop: {
    static: () => '<div class="e-window w1"><b>LOADING...</b><i></i></div><div class="e-window w2"><b>OOPS... PAGE NOT FOUND</b></div>',
    motion: () => repeat(8, () => `<span class="e-ph" style="${vars({ x: R(2, 94) + '%', s: (rint(2, 5) * 6) + 'px', d: R(9, 16).toFixed(1) + 's', dl: -R(0, 16).toFixed(1) + 's', h: rint(0, 1) })}">${PIXEL_HEART}</span>`)
      + '<span class="e-cursor"></span>',
  },
  notebook: {
    static: () => '<div class="e-rings"></div><div class="e-tabs"><i></i><i></i><i></i><i></i></div><div class="e-hazard">HAZARDOUS<br>WASTE</div>',
    motion: () => repeat(5, () => `<span class="e-pill" style="${vars({ x: R(8, 86) + '%', y: R(6, 90) + '%', r: R(-40, 40).toFixed(0) + 'deg', d: R(6, 10).toFixed(1) + 's', dl: -R(0, 8).toFixed(1) + 's', h: rint(0, 3) })}">${PILL}</span>`),
  },
  stage: {
    static: () => '<div class="e-floorargyle"></div><div class="e-curtain left"></div><div class="e-curtain right"></div><div class="e-swag"></div><div class="e-bulbs"></div>',
    motion: () => repeat(6, (i) => `<span class="e-fallcard" style="${vars({ x: R(4, 92) + '%', d: R(10, 18).toFixed(1) + 's', dl: -R(0, 18).toFixed(1) + 's' })}">${CARD(['♥︎', '♠︎', '♦︎', '♣︎'][i % 4])}</span>`)
      + `<span class="e-rose r1">${ROSE}</span><span class="e-rose r2">${ROSE}</span><span class="e-watch">${WATCH}</span>`,
  },
  papersky: {
    static: () => '<div class="e-cloudbank"></div><div class="e-rainbow"></div>',
    motion: () => repeat(4, () => `<span class="e-plane" style="${vars({ y: R(6, 70) + '%', d: R(14, 24).toFixed(1) + 's', dl: -R(0, 24).toFixed(1) + 's', s: R(0.7, 1.3).toFixed(2) })}">${PLANE}</span>`)
      + repeat(5, () => `<span class="e-drops" style="${vars({ x: R(3, 95) + '%', h: R(60, 160).toFixed(0) + 'px', d: R(4, 7).toFixed(1) + 's', dl: -R(0, 6).toFixed(1) + 's' })}"></span>`),
  },
  desk: {
    static: () => '<div class="e-leak warm"></div><div class="e-widget clock"><b>09:00</b><i></i></div><div class="e-widget weather"><b>27°</b></div><div class="e-eucalyptus"></div>',
    motion: () => '<div class="e-streak"></div><div class="e-leak rainbow"></div>'
      + repeat(6, () => `<span class="e-bokeh" style="${vars({ x: R(2, 92) + '%', y: R(4, 92) + '%', s: R(20, 60).toFixed(0) + 'px', d: R(10, 18).toFixed(1) + 's', dl: -R(0, 18).toFixed(1) + 's' })}"></span>`),
  },
  sanctum: {
    static: () => `<div class="e-arch a1">${ARCH}</div><div class="e-arch a2">${ARCH}</div><div class="e-banner"></div><div class="e-emblem">${LILY}</div>`,
    motion: () => repeat(12, () => `<span class="e-ember" style="${vars({ x: R(2, 96) + '%', d: R(5, 10).toFixed(1) + 's', dl: -R(0, 10).toFixed(1) + 's', w: R(-30, 30).toFixed(0) + 'px' })}"></span>`)
      + repeat(5, () => `<span class="e-twinkle gold" style="${vars({ x: R(2, 96) + '%', y: R(2, 96) + '%', s: R(10, 22).toFixed(0) + 'px', d: R(3, 6).toFixed(1) + 's', dl: -R(0, 5).toFixed(1) + 's' })}">${SPARK4}</span>`),
  },
  argyle: {
    static: () => `<div class="e-bouquet b1">${TULIP}${TULIP}</div><div class="e-bouquet b2">${TULIP}</div>`,
    motion: () => repeat(9, () => `<span class="e-petal" style="${vars({ x: R(2, 96) + '%', d: R(9, 16).toFixed(1) + 's', dl: -R(0, 16).toFixed(1) + 's', h: rint(0, 1) })}"></span>`)
      + repeat(5, () => `<span class="e-dew" style="${vars({ x: R(3, 95) + '%', y: R(4, 94) + '%', d: R(3, 6).toFixed(1) + 's', dl: -R(0, 5).toFixed(1) + 's' })}"></span>`),
  },
  starrynight: {
    static: () => `<div class="e-wheel">${ZODIAC_WHEEL}</div><div class="e-frame"></div>`,
    motion: () => repeat(5, (i) => `<span class="e-swirl" style="${vars({ x: R(-10, 80) + '%', y: R(-5, 85) + '%', s: R(24, 46).toFixed(0) + 'vmin', d: R(18, 30).toFixed(0) + 's', dir: i % 2 ? 1 : -1 })}"></span>`)
      + repeat(8, () => `<span class="e-twinkle gold" style="${vars({ x: R(2, 96) + '%', y: R(2, 96) + '%', s: R(10, 24).toFixed(0) + 'px', d: R(2.5, 5).toFixed(1) + 's', dl: -R(0, 5).toFixed(1) + 's' })}">${SPARK4}</span>`),
  },
  endworld: {
    static: () => '<div class="e-orbitdots o1"></div><div class="e-orbitdots o2"></div><div class="e-phases"></div><div class="e-burst"></div>',
    motion: () => repeat(7, () => `<span class="e-bird" style="${vars({ y: R(4, 80) + '%', s: R(0.5, 1.2).toFixed(2), d: R(14, 26).toFixed(1) + 's', dl: -R(0, 26).toFixed(1) + 's' })}">${BIRD}</span>`)
      + repeat(4, () => `<span class="e-shard" style="${vars({ x: R(0, 90) + '%', y: R(0, 90) + '%', r: R(-40, 40).toFixed(0) + 'deg', d: R(6, 10).toFixed(1) + 's', dl: -R(0, 8).toFixed(1) + 's' })}"></span>`),
  },
  doorgarden: {
    static: () => `<div class="e-door d1">${DOOR}</div><div class="e-door d2">${DOOR}</div><div class="e-meadow"></div>`,
    motion: () => repeat(10, () => `<span class="e-bloom" style="${vars({ x: R(2, 96) + '%', d: R(9, 16).toFixed(1) + 's', dl: -R(0, 16).toFixed(1) + 's', h: rint(0, 2) })}"></span>`)
      + repeat(3, () => `<span class="e-ray" style="${vars({ x: R(10, 80) + '%', d: R(8, 14).toFixed(1) + 's', dl: -R(0, 10).toFixed(1) + 's' })}"></span>`),
  },
  heaven: {
    static: () => '<div class="e-rainbowarc"></div>' + DIALOG('ERROR 404'),
    motion: () => repeat(5, () => `<span class="e-fish" style="${vars({ y: R(4, 88) + '%', s: R(0.6, 1.3).toFixed(2), d: R(12, 22).toFixed(1) + 's', dl: -R(0, 22).toFixed(1) + 's' })}">${FISH}</span>`)
      + repeat(3, () => `<span class="e-glitch" style="${vars({ y: R(5, 90) + '%', d: R(3, 6).toFixed(1) + 's', dl: -R(0, 5).toFixed(1) + 's' })}"></span>`),
  },
  surveil: {
    static: () => '<div class="e-skyline"></div><div class="e-tag t1">Are you alone ?</div><svg class="e-web" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M8 12 L60 4 L92 30 M8 12 L30 60 L92 30 M30 60 L70 88 L92 30 M60 4 L70 88"/><circle cx="8" cy="12" r="1"/><circle cx="60" cy="4" r="1"/><circle cx="92" cy="30" r="1"/><circle cx="30" cy="60" r="1"/><circle cx="70" cy="88" r="1"/></svg>',
    motion: () => '<div class="e-scanbox b1"><i>Human #1</i></div><div class="e-scanbox b2"><i>Human #2</i></div><div class="e-scanline"></div>',
  },
  logos: {
    static: () => '<div class="e-dome"></div><div class="e-sun"></div><svg class="e-sigil" viewBox="-50 -50 100 100"><circle r="44" class="l"/><circle r="30" class="l blue"/><path d="M0 -40 L35 20 L-35 20Z M0 40 L35 -20 L-35 -20Z" class="l"/><path d="M-50 0 H50 M0 -50 V50" class="l thin"/></svg>',
    motion: () => repeat(6, () => `<span class="e-twinkle white" style="${vars({ x: R(2, 96) + '%', y: R(2, 70) + '%', s: R(12, 30).toFixed(0) + 'px', d: R(3, 6).toFixed(1) + 's', dl: -R(0, 5).toFixed(1) + 's' })}">${SPARK4}</span>`)
      + '<span class="e-dust"></span>',
  },
  hotel: {
    static: () => '<div class="e-cornice top"></div><div class="e-cornice bottom"></div><div class="e-stripe"></div>' + ['201', '100', '102', '331', '244'].map((n, i) => `<span class="e-num n${i}">${n}</span>`).join(''),
    motion: () => repeat(4, (i) => `<span class="e-eye" style="${vars({ x: [6, 78, 14, 84][i] + '%', y: [12, 22, 74, 66][i] + '%', s: R(10, 18).toFixed(0) + 'vmin', d: R(6, 12).toFixed(1) + 's' })}"></span>`)
      + repeat(8, () => `<span class="e-pstar" style="${vars({ x: R(2, 96) + '%', y: R(30, 70) + '%', d: R(2, 4).toFixed(1) + 's', dl: -R(0, 4).toFixed(1) + 's' })}"></span>`),
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
