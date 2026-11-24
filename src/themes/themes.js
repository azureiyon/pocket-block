// Central theme registry. A theme supplies data only: CSS variables, a
// seven-colour block palette, a block material (CSS class m-<material>),
// an environment id, a particle kind, a clear animation and a sound kit id.
// The interface and game logic are shared by every theme.

export const THEMES = [
  {
    id: 'pastel', name: 'Classic', blurb: 'Enamel blocks on a midnight board',
    material: 'enamel', env: 'paper', particle: 'confetti', sound: 'pastel', dark: true,
    palette: ['#eb778c', '#eeab43', '#f2ce3c', '#82da76', '#22c3ef', '#7436f9', '#ec82b8'],
    vars: {
      '--bg': '#06050f', '--bg2': '#0c0b1c', '--ink': '#eeeefa', '--ink-soft': '#8e8cb0',
      '--panel': '#12112a', '--panel-edge': '#26244a', '--accent': '#eb778c', '--accent-ink': '#06050f',
      '--board': '#0a0917', '--board-edge': '#1b1a33', '--cell': '#100f21', '--cell-edge': '#05040e',
      '--ok': '#7cc98a', '--bad': '#ef6b6b', '--sweep': 'rgba(255,255,255,.95)', '--glow': '#f2ce3c',
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
  {
    id: 'starflower', name: 'Starflower Post', blurb: 'Gouache stickers, star flowers and airmail',
    material: 'gouache', env: 'starflower', particle: 'starbloom', sound: 'starflower', dark: false,
    palette: ['#4b5ee0', '#8fd3f2', '#a99cf0', '#2f8f9a', '#e9a6cf', '#6f7fd8', '#bfe3ff'],
    vars: {
      '--bg': '#b9bcf0', '--bg2': '#a7abe8', '--ink': '#2b2f7a', '--ink-soft': '#5d62a8',
      '--panel': '#eef0ff', '--panel-edge': '#c3c7f5', '--accent': '#4b5ee0', '--accent-ink': '#ffffff',
      '--board': '#d7daf8', '--board-edge': '#9da3e6', '--cell': '#c8ccf3', '--cell-edge': '#b2b7ec',
      '--ok': '#7fd6e0', '--bad': '#e87aa8', '--sweep': 'rgba(255,255,255,.95)', '--glow': '#ffffff',
      '--font': '"Chalkboard SE", "Comic Neue", ui-rounded, system-ui, sans-serif', '--radius': '30%',
    },
  },
  {
    id: 'moonside', name: 'Moonside Mechanism', blurb: 'Chrome bezels and moon phases on the far side',
    material: 'chrome', env: 'orrery', particle: 'star8', sound: 'moonside', dark: true,
    palette: ['#3f63d6', '#a29cf0', '#c9d3a2', '#bfe0f2', '#d9bc76', '#e7b6d8', '#5b6aa0'],
    vars: {
      '--bg': '#0f1430', '--bg2': '#1b2350', '--ink': '#e6e9f6', '--ink-soft': '#8f97c4',
      '--panel': '#171d40', '--panel-edge': '#3c4680', '--accent': '#b8c4ff', '--accent-ink': '#0f1430',
      '--board': '#141a3a', '--board-edge': '#c9ccd6', '--cell': '#1d2550', '--cell-edge': '#0c1029',
      '--ok': '#b9f0e6', '--bad': '#f39ab8', '--sweep': 'rgba(210,225,255,.9)', '--glow': '#dfe6ff',
      '--font': '"Didot", "Bodoni 72", "Bodoni MT", Georgia, serif', '--radius': '18%',
    },
  },
  {
    id: 'pixel', name: 'Pixel Crush', blurb: 'Bubblegum pixels on a handheld screen',
    material: 'pixel', env: 'desktop', particle: 'pixel', sound: 'chiptune', dark: false,
    palette: ['#ff6fae', '#4fd6ec', '#ff3d86', '#b98cff', '#ffa8cf', '#6ee8c0', '#ff8a8a'],
    vars: {
      '--bg': '#ffe3f1', '--bg2': '#ffd0e7', '--ink': '#b0306e', '--ink-soft': '#e07aab',
      '--panel': '#fff4fa', '--panel-edge': '#ff9cc8', '--accent': '#ff4f9a', '--accent-ink': '#ffffff',
      '--board': '#fff0f7', '--board-edge': '#ff8dbf', '--cell': '#ffe0ef', '--cell-edge': '#ffc4df',
      '--ok': '#4fd6ec', '--bad': '#ff3d6e', '--sweep': 'rgba(255,255,255,.95)', '--glow': '#8ff2ff',
      '--font': 'ui-monospace, "SF Mono", Menlo, "Courier New", monospace', '--radius': '0%',
    },
  },
  {
    id: 'capsule', name: 'Capsule Field Notes', blurb: 'Two-tone capsules in a creature notebook',
    material: 'capsule', env: 'notebook', particle: 'powder', sound: 'capsule', dark: false,
    palette: ['#d8473a', '#e6a43a', '#8daf76', '#3e7c95', '#e79b95', '#7b7e3a', '#a3533a'],
    vars: {
      '--bg': '#f5e6cf', '--bg2': '#ecd6b4', '--ink': '#6b3b26', '--ink-soft': '#a5785c',
      '--panel': '#fbf2e2', '--panel-edge': '#c99e74', '--accent': '#d8473a', '--accent-ink': '#fff6e8',
      '--board': '#f8ecd7', '--board-edge': '#8a5a3c', '--cell': '#f1e1c4', '--cell-edge': '#dcc39d',
      '--ok': '#8daf76', '--bad': '#d8473a', '--sweep': 'rgba(255,240,210,.95)', '--glow': '#f7c75a',
      '--font': '"Marker Felt", "Chalkboard SE", "Comic Neue", ui-rounded, sans-serif', '--radius': '44%',
    },
  },
  {
    id: 'wonderland', name: 'Queen’s Tea Party', blurb: 'Playing cards, roses and a red argyle stage',
    material: 'card', env: 'stage', particle: 'cardlet', sound: 'wonderland', dark: false,
    palette: ['#c41f3b', '#231a1f', '#e8603a', '#5a2a6e', '#b98a2c', '#de7f9a', '#7a1424'],
    marks: ['heart', 'spade', 'diamond', 'club', 'crown', 'rose', 'bow'],
    glyphs: { heart: '♥︎', spade: '♠︎', diamond: '♦︎', club: '♣︎', crown: '♛', rose: '✿', bow: '❦' },
    vars: {
      '--bg': '#fbeee0', '--bg2': '#f6dccb', '--ink': '#5e1220', '--ink-soft': '#a5636c',
      '--panel': '#fff8ef', '--panel-edge': '#d9a6a0', '--accent': '#c41f3b', '--accent-ink': '#fff8ef',
      '--board': '#a3263a', '--board-edge': '#5e1220', '--cell': '#8e1f31', '--cell-edge': '#6a1625',
      '--ok': '#f2d28a', '--bad': '#231a1f', '--sweep': 'rgba(255,240,220,.95)', '--glow': '#f2d28a',
      '--font': '"Baskerville", "Baskerville Old Face", Georgia, serif', '--radius': '14%',
    },
  },
  {
    id: 'papersky', name: 'Paper Sky Daydream', blurb: 'Folded paper, pencils and clouds you can climb',
    material: 'paper', env: 'papersky', particle: 'plane', sound: 'papersky', dark: false,
    palette: ['#8e9be6', '#9fcdf0', '#c3aef0', '#f0b6d2', '#ade0cf', '#f1df9c', '#6f72cf'],
    vars: {
      '--bg': '#dfe3fb', '--bg2': '#c9d2f6', '--ink': '#3d3f8a', '--ink-soft': '#7d80bd',
      '--panel': '#f7f8ff', '--panel-edge': '#c8cdf2', '--accent': '#7f86e0', '--accent-ink': '#ffffff',
      '--board': '#f4f5fd', '--board-edge': '#c3c9ef', '--cell': '#e6e9f8', '--cell-edge': '#d3d8f1',
      '--ok': '#ade0cf', '--bad': '#ef8fb5', '--sweep': 'rgba(255,255,255,.95)', '--glow': '#fff4c2',
      '--font': '"Iowan Old Style", "Palatino", "Book Antiqua", Georgia, serif', '--radius': '6%',
    },
  },
  {
    id: 'prism', name: 'Prism Desk', blurb: 'Frosted glass widgets in afternoon light',
    material: 'frost', env: 'desk', particle: 'flare', sound: 'prism', dark: false,
    palette: ['#3f7f90', '#2f3d5c', '#7fa58c', '#e0ad5c', '#c4663a', '#8e88b4', '#d0858d'],
    vars: {
      '--bg': '#dcdcd6', '--bg2': '#c9c7bf', '--ink': '#1f2a3a', '--ink-soft': '#6a7382',
      '--panel': 'rgba(255,255,255,.78)', '--panel-edge': 'rgba(255,255,255,.95)', '--accent': '#2f3d5c', '--accent-ink': '#ffffff',
      '--board': 'rgba(255,255,255,.42)', '--board-edge': 'rgba(255,255,255,.9)', '--cell': 'rgba(255,255,255,.38)', '--cell-edge': 'rgba(150,160,175,.35)',
      '--ok': '#7fa58c', '--bad': '#c4663a', '--sweep': 'rgba(255,255,255,.95)', '--glow': '#ffe2a8',
      '--font': '"Futura", "Avenir Next Condensed", "Avenir Next", system-ui, sans-serif', '--radius': '20%',
    },
  },
  {
    id: 'reliquary', name: 'Lily Reliquary', blurb: 'Gold-foil emblems, wax seals and embers',
    material: 'foil', env: 'sanctum', particle: 'ember', sound: 'reliquary', dark: true,
    palette: ['#cdb27a', '#e6dfcf', '#c21f32', '#a2783f', '#efe0ad', '#8c7a58', '#bdb8ae'],
    marks: ['lily', 'star', 'seal', 'cross', 'rose', 'drop', 'leaf'],
    glyphs: { lily: '⚜︎', star: '✦', seal: '✠', cross: '✙', rose: '❦', drop: '✧', leaf: '❧' },
    vars: {
      '--bg': '#141210', '--bg2': '#221d17', '--ink': '#efe6d0', '--ink-soft': '#a69878',
      '--panel': '#1d1914', '--panel-edge': '#6b5a3a', '--accent': '#cdb27a', '--accent-ink': '#141210',
      '--board': '#0e0d0b', '--board-edge': '#8a7448', '--cell': '#1b1813', '--cell-edge': '#070605',
      '--ok': '#d9c690', '--bad': '#c21f32', '--sweep': 'rgba(240,220,170,.85)', '--glow': '#e8d39a',
      '--font': '"Cochin", "Baskerville", "Garamond", Georgia, serif', '--radius': '8%',
    },
  },
  {
    id: 'starry', name: 'Starry Alchemy', blurb: 'Impasto swirls, gold frames and a zodiac wheel',
    material: 'impasto', env: 'starrynight', particle: 'goldleaf', sound: 'alchemy', dark: true,
    palette: ['#2346c8', '#f2c230', '#4a7fe8', '#14246e', '#e39a1c', '#7fb0f5', '#c9d84a'],
    vars: {
      '--bg': '#070b2a', '--bg2': '#101a55', '--ink': '#f6e7a6', '--ink-soft': '#9aa6d8',
      '--panel': '#0d1442', '--panel-edge': '#c9a23a', '--accent': '#f2c230', '--accent-ink': '#0a0f33',
      '--board': '#0a1240', '--board-edge': '#c9a23a', '--cell': '#121c5a', '--cell-edge': '#070c30',
      '--ok': '#c9d84a', '--bad': '#ff6a3d', '--sweep': 'rgba(255,225,120,.9)', '--glow': '#ffd84a',
      '--font': '"Herculanum", "Copperplate", "Papyrus", Georgia, serif', '--radius': '14%',
    },
  },
  {
    id: 'garden', name: 'Garden Ticket', blurb: 'Travel-log ticket stubs from a flower garden',
    material: 'ticket', env: 'argyle', particle: 'petal', sound: 'garden', dark: false,
    palette: ['#f0919f', '#8fb37c', '#ec7f6e', '#557f55', '#f0c95f', '#c8a6dc', '#e9b7a1'],
    vars: {
      '--bg': '#e3ebd8', '--bg2': '#d3dfc4', '--ink': '#3f5a3c', '--ink-soft': '#7f9677',
      '--panel': '#fbf8ee', '--panel-edge': '#c4d4b2', '--accent': '#ec7f6e', '--accent-ink': '#ffffff',
      '--board': '#fbf5e6', '--board-edge': '#9db68a', '--cell': '#eff0de', '--cell-edge': '#d9dfc6',
      '--ok': '#8fb37c', '--bad': '#ec7f6e', '--sweep': 'rgba(255,255,240,.95)', '--glow': '#fff1b8',
      '--font': '"Noteworthy", "Bradley Hand", ui-rounded, system-ui, sans-serif', '--radius': '8%',
    },
  },
  {
    id: 'endworld', name: 'End of the World', blurb: 'Halftone collage, moon phases and a flock of birds',
    material: 'halftone', env: 'endworld', particle: 'bird', sound: 'endworld', dark: false,
    palette: ['#2f9a90', '#cf3338', '#1c1c1e', '#8f8f8c', '#94d2c8', '#8a3b2b', '#c4c4bf'],
    vars: {
      '--bg': '#ecece8', '--bg2': '#dcdcd7', '--ink': '#1c1c1e', '--ink-soft': '#7b7b78',
      '--panel': '#f7f7f4', '--panel-edge': '#c8c8c3', '--accent': '#cf3338', '--accent-ink': '#ffffff',
      '--board': '#f5f5f2', '--board-edge': '#1c1c1e', '--cell': '#e6e6e2', '--cell-edge': '#d2d2cd',
      '--ok': '#2f9a90', '--bad': '#cf3338', '--sweep': 'rgba(255,255,255,.95)', '--glow': '#94d2c8',
      '--font': '"DIN Condensed", "Avenir Next Condensed", "Arial Narrow", system-ui, sans-serif', '--radius': '3%',
    },
  },
  {
    id: 'doors', name: 'Garden of Doors', blurb: 'White doors opening onto a sunlit garden',
    material: 'door', env: 'doorgarden', particle: 'blossom', sound: 'doors', dark: false,
    palette: ['#5fc0d2', '#4c9446', '#e0533c', '#efb13a', '#9c86d6', '#2c5c3a', '#3b8cc0'],
    vars: {
      '--bg': '#dfeee6', '--bg2': '#c7e0d2', '--ink': '#24402e', '--ink-soft': '#6d8a75',
      '--panel': '#fbfcf9', '--panel-edge': '#c9d9cd', '--accent': '#2c5c3a', '--accent-ink': '#ffffff',
      '--board': '#f4f6f1', '--board-edge': '#b9cdbf', '--cell': '#e5ece5', '--cell-edge': '#d0dcd2',
      '--ok': '#4c9446', '--bad': '#e0533c', '--sweep': 'rgba(255,255,255,.95)', '--glow': '#fff6c4',
      '--font': '"Avenir Next", "Segoe UI", system-ui, sans-serif', '--radius': '4%',
    },
  },
  {
    id: 'heaven', name: 'Heaven 404', blurb: 'Error dialogs, goldfish and rainbow glitches',
    material: 'dialog', env: 'heaven', particle: 'goldfish', sound: 'heaven', dark: false,
    palette: ['#ff7a1a', '#ff3fb4', '#16cfe8', '#7fe23a', '#7a4cff', '#ffd93a', '#2f6bff'],
    vars: {
      '--bg': '#bcd2ff', '--bg2': '#e6c8ff', '--ink': '#25165c', '--ink-soft': '#6a5aa8',
      '--panel': '#f4f3ee', '--panel-edge': '#8f9bd8', '--accent': '#2f6bff', '--accent-ink': '#ffffff',
      '--board': '#e9ecf8', '--board-edge': '#6a74c8', '--cell': '#d9def4', '--cell-edge': '#c3cbee',
      '--ok': '#7fe23a', '--bad': '#ff3b4a', '--sweep': 'rgba(255,255,255,.95)', '--glow': '#ffe96a',
      '--font': '"Tahoma", "Verdana", "Segoe UI", system-ui, sans-serif', '--radius': '6%',
    },
  },
  {
    id: 'surveil', name: 'Surveil', blurb: 'Grainy city photos and red tracking boxes',
    material: 'scan', env: 'surveil', particle: 'node', sound: 'surveil', dark: true,
    palette: ['#d9201f', '#e8e8e5', '#8e8e8b', '#3c3c3c', '#bcbcb7', '#626260', '#1d1d1d'],
    marks: ['target', 'box', 'tri', 'cross', 'plus', 'diamond', 'dot'],
    glyphs: { target: '◎', box: '□', tri: '△', cross: '✕', plus: '+', diamond: '◇', dot: '●' },
    vars: {
      '--bg': '#141414', '--bg2': '#262626', '--ink': '#efefec', '--ink-soft': '#9a9a96',
      '--panel': '#1d1d1d', '--panel-edge': '#4a4a48', '--accent': '#e0241f', '--accent-ink': '#ffffff',
      '--board': '#101010', '--board-edge': '#e0241f', '--cell': '#1f1f1f', '--cell-edge': '#0a0a0a',
      '--ok': '#efefec', '--bad': '#e0241f', '--sweep': 'rgba(230,40,35,.85)', '--glow': '#ff3b30',
      '--font': '"Helvetica Neue", "Arial Narrow", Arial, system-ui, sans-serif', '--radius': '2%',
    },
  },
  {
    id: 'totality', name: 'Totality', blurb: 'Stone monoliths and sacred geometry under a dome',
    material: 'monolith', env: 'logos', particle: 'glint', sound: 'logos', dark: true,
    palette: ['#d9d9dd', '#8c3b2a', '#3d49b0', '#6e7079', '#a9abb4', '#2b2c33', '#cbbba1'],
    marks: ['star', 'sun', 'ring', 'tri', 'eye', 'down', 'cross'],
    glyphs: { star: '✧', sun: '☉', ring: '◯', tri: '△', eye: '◬', down: '▽', cross: '✛' },
    vars: {
      '--bg': '#16171c', '--bg2': '#24252d', '--ink': '#e7e7ea', '--ink-soft': '#8d8f99',
      '--panel': '#1d1e24', '--panel-edge': '#4a4c57', '--accent': '#c9cbd4', '--accent-ink': '#16171c',
      '--board': '#121318', '--board-edge': '#6e7079', '--cell': '#1c1d23', '--cell-edge': '#0b0b0e',
      '--ok': '#c9cbd4', '--bad': '#b0442e', '--sweep': 'rgba(235,235,245,.85)', '--glow': '#ffffff',
      '--font': '"Trajan Pro", "Optima", "Cochin", Georgia, serif', '--radius': '6%',
    },
  },
  {
    id: 'room201', name: 'Room 201', blurb: 'Teal grain, eye records and pink stars in an old hotel',
    material: 'vinyl', env: 'hotel', particle: 'sparkle', sound: 'vinyl', dark: false,
    palette: ['#2f8f8a', '#e85a7a', '#f1f1ec', '#1e1e1e', '#d4a39c', '#7fcfc6', '#949490'],
    vars: {
      '--bg': '#e6e7e3', '--bg2': '#d6d8d3', '--ink': '#1e2b2a', '--ink-soft': '#6f7c7a',
      '--panel': '#f4f4f0', '--panel-edge': '#b9bfbc', '--accent': '#e85a7a', '--accent-ink': '#ffffff',
      '--board': '#232524', '--board-edge': '#1e1e1e', '--cell': '#2f3231', '--cell-edge': '#1a1c1b',
      '--ok': '#7fcfc6', '--bad': '#e85a7a', '--sweep': 'rgba(255,255,255,.9)', '--glow': '#ff8aa6',
      '--font': '"DIN Alternate", "Avenir Next Condensed", "Arial Narrow", system-ui, sans-serif', '--radius': '8%',
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
