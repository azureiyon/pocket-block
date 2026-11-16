// Central theme registry. A theme supplies data only: CSS variables, a
// seven-colour block palette, a block material (CSS class m-<material>),
// an environment id, a particle kind, a clear animation and a sound kit id.
// The interface and game logic are shared by every theme.

export const THEMES = [
  {
    id: 'pastel', name: 'Classic Pastel', blurb: 'Enamel blocks on cream paper',
    material: 'enamel', env: 'paper', particle: 'confetti', sound: 'pastel', dark: false,
    palette: ['#ff8fa3', '#ffb86b', '#ffd966', '#8fd694', '#6ec6e8', '#a78bfa', '#f49ac1'],
    vars: {
      '--bg': '#fbf3e4', '--bg2': '#f6e7cf', '--ink': '#5a4636', '--ink-soft': '#9a8572',
      '--panel': '#fffaf1', '--panel-edge': '#ead8bd', '--accent': '#ff8fa3', '--accent-ink': '#ffffff',
      '--board': '#f3e3c8', '--board-edge': '#e3cba6', '--cell': '#fbf1df', '--cell-edge': '#ead6b6',
      '--ok': '#7cc98a', '--bad': '#ef6b6b', '--sweep': 'rgba(255,255,255,.95)', '--glow': '#ffd966',
      '--font': 'ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif', '--radius': '22%',
    },
  },
  {
    id: 'neon', name: 'Neon Arcade', blurb: 'Glowing circuit edges and scan lines',
    material: 'circuit', env: 'neon', particle: 'spark', sound: 'neon', dark: true,
    palette: ['#ff4fd8', '#28e1ff', '#a259ff', '#5cff9d', '#ffd23f', '#ff6b6b', '#4f8bff'],
    vars: {
      '--bg': '#0b0e2c', '--bg2': '#161a4a', '--ink': '#e9ecff', '--ink-soft': '#8d93d6',
      '--panel': '#141842', '--panel-edge': '#3a3f99', '--accent': '#28e1ff', '--accent-ink': '#071022',
      '--board': '#0a0c26', '--board-edge': '#7a4dff', '--cell': '#121641', '--cell-edge': '#252a6b',
      '--ok': '#5cff9d', '--bad': '#ff4f6d', '--sweep': 'rgba(40,225,255,.95)', '--glow': '#ff4fd8',
      '--font': '"Avenir Next", "Segoe UI", system-ui, sans-serif', '--radius': '14%',
    },
  },
  {
    id: 'jelly', name: 'Jelly Pop', blurb: 'Squishy translucent gel candies',
    material: 'gel', env: 'jelly', particle: 'bubble', sound: 'jelly', dark: false,
    palette: ['#ff6f91', '#ffa36c', '#5fd6a4', '#ff9ecd', '#7cc8ff', '#c7a0ff', '#ffcf5a'],
    vars: {
      '--bg': '#ffe6ee', '--bg2': '#ffd9c7', '--ink': '#7a3a55', '--ink-soft': '#c07b98',
      '--panel': '#fff5f8', '--panel-edge': '#ffc4d6', '--accent': '#ff6f91', '--accent-ink': '#ffffff',
      '--board': '#ffd3e1', '--board-edge': '#ffb0c8', '--cell': '#ffeaf1', '--cell-edge': '#ffc9da',
      '--ok': '#5fd6a4', '--bad': '#ff5c7a', '--sweep': 'rgba(255,255,255,.9)', '--glow': '#ff9ecd',
      '--font': 'ui-rounded, "SF Pro Rounded", "Nunito", system-ui, sans-serif', '--radius': '34%',
    },
  },
  {
    id: 'cloud', name: 'Cloud Palace', blurb: 'Pearl cushions in a gilded sky',
    material: 'pearl', env: 'clouds', particle: 'mist', sound: 'cloud', dark: false,
    palette: ['#f6cfe2', '#ddd0ff', '#ffe7a8', '#cdeee9', '#ffd6c2', '#d5e0ff', '#f3e2b0'],
    vars: {
      '--bg': '#f7f1ff', '--bg2': '#fff4dc', '--ink': '#6a5577', '--ink-soft': '#a796b3',
      '--panel': '#fffcf6', '--panel-edge': '#e9d39b', '--accent': '#c9a24b', '--accent-ink': '#ffffff',
      '--board': '#efe5f7', '--board-edge': '#d4b062', '--cell': '#e3d8ef', '--cell-edge': '#d3c4e2',
      '--ok': '#9fd8c8', '--bad': '#e58aa0', '--sweep': 'rgba(255,250,230,.95)', '--glow': '#ffe7a8',
      '--font': '"Palatino", "Book Antiqua", Georgia, serif', '--radius': '40%',
    },
  },
  {
    id: 'soda', name: 'Cream Soda Pop', blurb: 'Retro cafe soda glass and foam',
    material: 'soda', env: 'soda', particle: 'fizz', sound: 'soda', dark: false,
    palette: ['#e8394d', '#5ccfb0', '#f2cf9b', '#ff8a5b', '#8fdc5a', '#f59bbb', '#d9a52a'],
    vars: {
      '--bg': '#fff2dc', '--bg2': '#ffe0e0', '--ink': '#6b2a2a', '--ink-soft': '#b07a6a',
      '--panel': '#fffaf0', '--panel-edge': '#f0c9b0', '--accent': '#e8394d', '--accent-ink': '#fffaf0',
      '--board': '#cfeee5', '--board-edge': '#e8394d', '--cell': '#e9f8f2', '--cell-edge': '#bfe4d8',
      '--ok': '#5ccfb0', '--bad': '#e8394d', '--sweep': 'rgba(255,255,240,.95)', '--glow': '#fff1c7',
      '--font': '"Cooper Black", "Georgia", ui-rounded, serif', '--radius': '26%',
    },
  },
  {
    id: 'steam', name: 'Nostalgic Steampunk', blurb: 'Riveted brass plates and turning gears',
    material: 'brass', env: 'gears', particle: 'cog', sound: 'steam', dark: false,
    palette: ['#c9962e', '#c0703f', '#5f9584', '#8d8b84', '#9c4f2a', '#d8b445', '#6f7d55'],
    vars: {
      '--bg': '#e7d8b8', '--bg2': '#d6c095', '--ink': '#3e2c1a', '--ink-soft': '#7a6347',
      '--panel': '#f2e6cb', '--panel-edge': '#a07a3c', '--accent': '#9c6a26', '--accent-ink': '#fff6df',
      '--board': '#4a3a28', '--board-edge': '#a07a3c', '--cell': '#5b4832', '--cell-edge': '#3c2d1d',
      '--ok': '#9bc28a', '--bad': '#d0583c', '--sweep': 'rgba(255,220,140,.95)', '--glow': '#f6c35a',
      '--font': 'Georgia, "Times New Roman", serif', '--radius': '10%',
    },
  },
  {
    id: 'koi', name: 'Moonlit Koi Pond', blurb: 'River stones under moonlight',
    material: 'stone', env: 'pond', particle: 'droplet', sound: 'koi', dark: true,
    palette: ['#8a97a5', '#b3a593', '#6a7b84', '#cfc4ad', '#8fa08d', '#d98a5a', '#a7b2bf'],
    vars: {
      '--bg': '#081729', '--bg2': '#10304a', '--ink': '#e5eef7', '--ink-soft': '#8aa3bb',
      '--panel': '#0f2338', '--panel-edge': '#2e5577', '--accent': '#f2c27a', '--accent-ink': '#16202c',
      '--board': '#0b2236', '--board-edge': '#29506f', '--cell': '#11304a', '--cell-edge': '#0a1f31',
      '--ok': '#8fe0d0', '--bad': '#ff8a7a', '--sweep': 'rgba(220,240,255,.9)', '--glow': '#f5e6b8',
      '--font': '"Hiragino Sans", "Avenir Next", system-ui, sans-serif', '--radius': '42%',
    },
  },
  {
    id: 'witch', name: 'Little Witch’s Apothecary', blurb: 'Cork-topped elixirs and curling vapor',
    material: 'elixir', env: 'apothecary', particle: 'vapor', sound: 'witch', dark: true,
    palette: ['#9b5cff', '#3ddc97', '#ff5c8a', '#ffb547', '#4cc9f0', '#d9ef5f', '#ff7b54'],
    vars: {
      '--bg': '#24143a', '--bg2': '#3a1f55', '--ink': '#f3e9ff', '--ink-soft': '#b59ad6',
      '--panel': '#2d1a46', '--panel-edge': '#6b4a8f', '--accent': '#b98cff', '--accent-ink': '#1c0f2c',
      '--board': '#1c1030', '--board-edge': '#7a5a3a', '--cell': '#2a1942', '--cell-edge': '#160c26',
      '--ok': '#3ddc97', '--bad': '#ff5c8a', '--sweep': 'rgba(220,190,255,.9)', '--glow': '#d9ef5f',
      '--font': 'Georgia, "Palatino", serif', '--radius': '20%',
    },
  },
  {
    id: 'patisserie', name: 'Strawberry Patisserie', blurb: 'Layer cakes, gingham and lace',
    material: 'cake', env: 'patisserie', particle: 'crumb', sound: 'patisserie', dark: false,
    palette: ['#ff8fab', '#fbe8c8', '#9a5a3a', '#b9de96', '#ffc796', '#d6b3f0', '#ff6b81'],
    vars: {
      '--bg': '#ffe6ec', '--bg2': '#fff6ee', '--ink': '#8a3b4f', '--ink-soft': '#c88b9a',
      '--panel': '#fffaf6', '--panel-edge': '#f7c1cf', '--accent': '#ff6b81', '--accent-ink': '#ffffff',
      '--board': '#fff7f0', '--board-edge': '#f4a7b9', '--cell': '#ffeef2', '--cell-edge': '#f8d3dc',
      '--ok': '#9ed39a', '--bad': '#ff6b81', '--sweep': 'rgba(255,255,255,.95)', '--glow': '#ffd1dc',
      '--font': '"Snell Roundhand", "Georgia", ui-rounded, serif', '--radius': '18%',
    },
  },
  {
    id: 'abyss', name: 'Abyssal Aquarium', blurb: 'Bioluminescent glass in deep water',
    material: 'abyss', env: 'abyss', particle: 'glow', sound: 'abyss', dark: true,
    palette: ['#2ef2d0', '#3fa9f5', '#b46cff', '#58ffa3', '#ff6ec7', '#ffe66d', '#1fd1f9'],
    vars: {
      '--bg': '#021c22', '--bg2': '#053842', '--ink': '#d8fbf6', '--ink-soft': '#6fb3ac',
      '--panel': '#06272e', '--panel-edge': '#11605f', '--accent': '#2ef2d0', '--accent-ink': '#02171b',
      '--board': '#031d23', '--board-edge': '#0f6a6a', '--cell': '#06303a', '--cell-edge': '#021418',
      '--ok': '#58ffa3', '--bad': '#ff6e8a', '--sweep': 'rgba(46,242,208,.9)', '--glow': '#2ef2d0',
      '--font': '"Avenir Next", system-ui, sans-serif', '--radius': '30%',
    },
  },
  {
    id: 'toybox', name: 'Clockwork Toybox', blurb: 'Painted wood blocks and winding keys',
    material: 'wood', env: 'toybox', particle: 'chip', sound: 'toybox', dark: false,
    palette: ['#d94b3f', '#2f6fb3', '#f2b134', '#3f9e5a', '#e2cfa6', '#8a4fbf', '#ef7d2b'],
    vars: {
      '--bg': '#f1dcb4', '--bg2': '#e3c38f', '--ink': '#4a2f1c', '--ink-soft': '#8a6a4c',
      '--panel': '#faecd0', '--panel-edge': '#b98a55', '--accent': '#d94b3f', '--accent-ink': '#fff6e6',
      '--board': '#c99a62', '--board-edge': '#8f6436', '--cell': '#dcb784', '--cell-edge': '#b48a57',
      '--ok': '#3f9e5a', '--bad': '#d94b3f', '--sweep': 'rgba(255,240,200,.95)', '--glow': '#f2b134',
      '--font': '"Trebuchet MS", ui-rounded, system-ui, sans-serif', '--radius': '12%',
    },
  },
  {
    id: 'glass', name: 'Stained Glass Reverie', blurb: 'Jewel panes in leaded seams',
    material: 'glass', env: 'cathedral', particle: 'shard', sound: 'glass', dark: true,
    palette: ['#c0182c', '#1f5fbf', '#1d9a5b', '#e0a31b', '#7b2fa8', '#e05a1b', '#14a3a3'],
    vars: {
      '--bg': '#18121f', '--bg2': '#2a2033', '--ink': '#f4eadb', '--ink-soft': '#a99a87',
      '--panel': '#221a2a', '--panel-edge': '#5a4a3a', '--accent': '#e0a31b', '--accent-ink': '#1a1208',
      '--board': '#1a1a1c', '--board-edge': '#3a3a3e', '--cell': '#2a2630', '--cell-edge': '#101012',
      '--ok': '#7fd99b', '--bad': '#ff6a5a', '--sweep': 'rgba(255,240,200,.85)', '--glow': '#ffe2a0',
      '--font': '"Optima", "Candara", Georgia, serif', '--radius': '6%',
    },
  },
  {
    id: 'aero', name: 'Dreamware 2004', blurb: 'Glossy aqua glass and floating orbs',
    material: 'aero', env: 'aero', particle: 'orb', sound: 'aero', dark: false,
    palette: ['#2fa8ff', '#47cf5f', '#00bdb4', '#6fd0ff', '#98dd5c', '#5b8cff', '#2fd69c'],
    vars: {
      '--bg': '#c4ecff', '--bg2': '#e9fff0', '--ink': '#0d4c6e', '--ink-soft': '#4f88a6',
      '--panel': 'rgba(255,255,255,.82)', '--panel-edge': '#9ed8f5', '--accent': '#1e9bf0', '--accent-ink': '#ffffff',
      '--board': 'rgba(255,255,255,.45)', '--board-edge': '#86cdf0', '--cell': 'rgba(255,255,255,.55)', '--cell-edge': 'rgba(120,190,230,.5)',
      '--ok': '#47cf5f', '--bad': '#ff6060', '--sweep': 'rgba(255,255,255,.95)', '--glow': '#bff3ff',
      '--font': '"Segoe UI", "Lucida Grande", "Trebuchet MS", system-ui, sans-serif', '--radius': '24%',
    },
  },
  {
    id: 'mahjong', name: 'Mahjong Parlor', blurb: 'Ivory tiles on lacquered wood',
    material: 'mahjong', env: 'parlor', particle: 'tile', sound: 'mahjong', dark: true,
    palette: ['#1f7a4a', '#b8322a', '#1f4e9e', '#2b8a5a', '#a82c2c', '#24508f', '#b8860b'],
    vars: {
      '--bg': '#3a1410', '--bg2': '#5a1f18', '--ink': '#f6ead2', '--ink-soft': '#c9a98a',
      '--panel': '#43181290', '--panel-edge': '#c9a24b', '--accent': '#c9a24b', '--accent-ink': '#2a0d09',
      '--board': '#1d4d36', '--board-edge': '#7a2a1a', '--cell': '#245c41', '--cell-edge': '#173e2b',
      '--ok': '#9be0a8', '--bad': '#ff7a6a', '--sweep': 'rgba(255,230,170,.9)', '--glow': '#e8c46a',
      '--font': '"Songti SC", "STSong", Georgia, serif', '--radius': '12%',
    },
  },
];

// Mahjong markings: dots, bamboo and character-like glyphs per palette slot.
export const MAHJONG_MARKS = ['bamboo', 'char', 'dots', 'bamboo', 'char', 'dots', 'dragon'];
export const MAHJONG_GLYPHS = { char: '萬', dragon: '中' };

export const THEME_BY_ID = Object.fromEntries(THEMES.map((t) => [t.id, t]));
export const DEFAULT_THEME = 'pastel';

export function getTheme(id) { return THEME_BY_ID[id] || THEME_BY_ID[DEFAULT_THEME]; }

export function nextThemeId(id) {
  const i = THEMES.findIndex((t) => t.id === id);
  return THEMES[(i + 1) % THEMES.length].id;
}

export function registerTheme(theme) {
  const required = ['id', 'name', 'material', 'env', 'particle', 'sound', 'palette', 'vars'];
  for (const k of required) if (!(k in theme)) throw new Error('Theme missing ' + k);
  if (theme.palette.length !== 7) throw new Error('Theme palette needs 7 colours');
  if (THEME_BY_ID[theme.id]) throw new Error('Duplicate theme ' + theme.id);
  THEMES.push(theme);
  THEME_BY_ID[theme.id] = theme;
}

/** Decide auto-switching: only a clearing move that leaves the board empty. */
export function shouldAutoSwitch(move, autoSwitchEnabled) {
  return !!(autoSwitchEnabled && move && move.lines > 0 && move.allClear);
}

/**
 * Theme controller (DOM-agnostic): tracks the saved theme, an uncommitted
 * preview and applies themes through an injected apply function. It never
 * touches the game state.
 */
export class ThemeController {
  constructor({ settings, apply }) {
    this.settings = settings;
    this.applyFn = apply || (() => {});
    this.saved = getTheme(settings.get('theme')).id;
    this.current = this.saved;
    this.previewing = false;
    this.listeners = new Set();
  }
  onChange(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  apply(id) {
    this.current = getTheme(id).id;
    this.applyFn(getTheme(this.current));
    for (const fn of this.listeners) fn(this.current);
  }
  init() { this.apply(this.saved); }
  preview(id) { this.previewing = id !== this.saved; this.apply(id); }
  commit() { this.saved = this.current; this.previewing = false; this.settings.set('theme', this.saved); }
  cancelPreview() { if (this.current !== this.saved) this.apply(this.saved); this.previewing = false; }
  /** Called for every placement; returns true if it advanced the theme. */
  handleMove(move) {
    if (!shouldAutoSwitch(move, this.settings.get('autoSwitch'))) return false;
    const next = nextThemeId(this.saved);
    this.saved = next; this.previewing = false;
    this.settings.set('theme', next);
    this.apply(next);
    return true;
  }
}
