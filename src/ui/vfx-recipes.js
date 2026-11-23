// Per-theme spell recipes for the canvas effect layer (src/ui/vfx.js).
//   sprite / sprite2  particle sprites (see SPRITE_KINDS)
//   circle            magic-circle style for multi-line clears and board clears
//   sig               signature effect for combos: slash, vortex, constellation,
//                     ribbon, ripple, glitch, pillar, rays, rise, fall
//   colors            glow colours, brightest first
//   gravity           + falls, - rises; spin, wob (sideways sway), trail (ribbons)
//   core              colour of the beam's hot core

export const RECIPES = {
  pastel: { sprite: 'star5', sprite2: 'glow', circle: 'flower', sig: 'ribbon', colors: ['#ff8fa3', '#ffd966', '#6ec6e8', '#a78bfa'], gravity: 60, spin: 3 },
  neon: { sprite: 'star4', sprite2: 'ember', circle: 'ticks', sig: 'glitch', colors: ['#28e1ff', '#ff4fd8', '#a259ff', '#5cff9d'], gravity: 0, trail: true },
  jelly: { sprite: 'bubble', sprite2: 'glow', circle: 'flower', sig: 'ripple', colors: ['#ff6f91', '#ff9ecd', '#7cc8ff', '#ffcf5a'], gravity: -40, wob: 30 },
  cloud: { sprite: 'star5', sprite2: 'glow', circle: 'star', sig: 'rise', colors: ['#f2c86b', '#f6cfe2', '#ddd0ff', '#ffffff'], gravity: -30, wob: 30, core: '#fff6d8' },
  soda: { sprite: 'bubble', sprite2: 'glow', circle: 'flower', sig: 'rise', colors: ['#e8394d', '#5ccfb0', '#ffd27a', '#ffffff'], gravity: -120, wob: 40 },
  steam: { sprite: 'ember', sprite2: 'star4', circle: 'gear', sig: 'rays', colors: ['#f6c35a', '#ffdf9a', '#ff8a3a', '#fff1c8'], gravity: 160, core: '#fff4d0' },
  koi: { sprite: 'glow', sprite2: 'petal', circle: 'flower', sig: 'ripple', colors: ['#bfe6ff', '#f2c27a', '#8fe0d0', '#ffffff'], gravity: 0, wob: 20 },
  witch: { sprite: 'star4', sprite2: 'glow', circle: 'star', sig: 'vortex', colors: ['#b98cff', '#3ddc97', '#ff5c8a', '#d9ef5f'], gravity: -50, wob: 40, trail: true },
  patisserie: { sprite: 'heart', sprite2: 'star5', circle: 'flower', sig: 'ribbon', colors: ['#ff6b81', '#ffd1dc', '#ffc796', '#d6b3f0'], gravity: 70, spin: 2 },
  abyss: { sprite: 'glow', sprite2: 'bubble', circle: 'ticks', sig: 'ripple', colors: ['#2ef2d0', '#3fa9f5', '#b46cff', '#58ffa3'], gravity: -30, wob: 40 },
  toybox: { sprite: 'star5', sprite2: 'square', circle: 'gear', sig: 'fall', colors: ['#f2b134', '#d94b3f', '#2f6fb3', '#3f9e5a'], gravity: 200, spin: 6 },
  glass: { sprite: 'shard', sprite2: 'star4', circle: 'rose', sig: 'slash', colors: ['#ffe2a0', '#c0182c', '#1f5fbf', '#1d9a5b'], gravity: 120, spin: 5 },
  aero: { sprite: 'bubble', sprite2: 'glow', circle: 'flower', sig: 'ripple', colors: ['#2fa8ff', '#47cf5f', '#bff3ff', '#ffffff'], gravity: -60, wob: 30 },
  mahjong: { sprite: 'coin', sprite2: 'star4', circle: 'flower', sig: 'rise', colors: ['#e8c46a', '#ffdf8a', '#b8322a', '#fff4c8'], gravity: -60, spin: 4, core: '#fff8dc' },
  starflower: { sprite: 'star5', sprite2: 'star4', circle: 'star', sig: 'ribbon', colors: ['#4b5ee0', '#8fd3f2', '#ffffff', '#a99cf0'], gravity: 30, spin: 2, trail: true },
  moonside: { sprite: 'star4', sprite2: 'glow', circle: 'ticks', sig: 'slash', colors: ['#b8c4ff', '#f2dc9a', '#a29cf0', '#ffffff'], gravity: 0, core: '#fffbe8' },
  pixel: { sprite: 'square', sprite2: 'heart', circle: 'pixel', sig: 'glitch', colors: ['#ff4f9a', '#4fd6ec', '#ffb1d3', '#b98cff'], gravity: 220 },
  capsule: { sprite: 'glow', sprite2: 'square', circle: 'ticks', sig: 'fall', colors: ['#d8473a', '#e6a43a', '#8daf76', '#3e7c95'], gravity: 60, wob: 30 },
  wonderland: { sprite: 'card', sprite2: 'petal', circle: 'rose', sig: 'ribbon', colors: ['#c41f3b', '#f2d28a', '#231a1f', '#de7f9a'], gravity: 150, spin: 7, core: '#fff8ef' },
  papersky: { sprite: 'plane', sprite2: 'star5', circle: 'flower', sig: 'ribbon', colors: ['#7f86e0', '#f0b6d2', '#9fcdf0', '#fff4c2'], gravity: -20, wob: 40, trail: true },
  prism: { sprite: 'hex', sprite2: 'star4', circle: 'tri', sig: 'rays', colors: ['#ff9a9a', '#ffe08a', '#8affc8', '#9ab8ff'], gravity: 0, core: '#ffffff' },
  reliquary: { sprite: 'ember', sprite2: 'star4', circle: 'rose', sig: 'pillar', colors: ['#e8d39a', '#ff5a2a', '#c21f32', '#fff2cc'], gravity: -70, wob: 30, core: '#fff6dc' },
  starry: { sprite: 'star4', sprite2: 'glow', circle: 'ticks', sig: 'vortex', colors: ['#ffd84a', '#7fb0f5', '#2346c8', '#fff1a8'], gravity: 0, wob: 50, trail: true, core: '#fff8d0' },
  garden: { sprite: 'petal', sprite2: 'bubble', circle: 'flower', sig: 'fall', colors: ['#f0919f', '#8fb37c', '#f0c95f', '#ffffff'], gravity: 90, spin: 4, wob: 40 },
  endworld: { sprite: 'bird', sprite2: 'shard', circle: 'ticks', sig: 'slash', colors: ['#2f9a90', '#cf3338', '#1c1c1e', '#94d2c8'], gravity: -40, wob: 30 },
  doors: { sprite: 'shard', sprite2: 'petal', circle: 'flower', sig: 'rays', colors: ['#5fc0d2', '#efb13a', '#e0533c', '#ffffff'], gravity: 140, spin: 6 },
  heaven: { sprite: 'square', sprite2: 'bubble', circle: 'pixel', sig: 'glitch', colors: ['#ff3fb4', '#16cfe8', '#ffd93a', '#7fe23a', '#ff7a1a'], gravity: 80 },
  surveil: { sprite: 'square', sprite2: 'glow', circle: 'square', sig: 'constellation', colors: ['#ff3b30', '#ffffff', '#ff8a80'], gravity: 0, core: '#ffffff' },
  totality: { sprite: 'star4', sprite2: 'glow', circle: 'tri', sig: 'pillar', colors: ['#ffffff', '#c9cbd4', '#6a78e8', '#d26a4e'], gravity: -20, core: '#ffffff' },
  room201: { sprite: 'star4', sprite2: 'bubble', circle: 'ticks', sig: 'ripple', colors: ['#e85a7a', '#7fcfc6', '#ffffff', '#2f8f8a'], gravity: 0, spin: 2 },
};

const FALLBACK = { sprite: 'star4', sprite2: 'glow', circle: 'star', sig: 'ribbon', gravity: 40 };

export function getRecipe(theme) {
  const base = (theme && RECIPES[theme.id]) || FALLBACK;
  const colors = base.colors || (theme ? [theme.vars['--glow'], theme.vars['--accent'], ...theme.palette.slice(0, 3)] : ['#ffffff']);
  return { spin: 0, wob: 0, trail: false, core: '#ffffff', ...base, colors };
}
