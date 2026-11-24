// PROPOSAL (studio only): "Classic", a monochrome rework of Classic Pastel so
// the coloured light effects pop. Registered only on the studio page.
import { registerTheme, THEME_BY_ID } from '../../src/themes/themes.js';

const base = THEME_BY_ID.pastel;
const font = base.vars['--font'];
export const CLASSIC = [
  { id: 'classic-dark', name: 'Proposal · Classic (dark)', dark: true,
    vars: { '--bg': '#111114', '--bg2': '#1a1a1e', '--ink': '#f1f1f4', '--ink-soft': '#9a9aa3', '--panel': '#1c1c21', '--panel-edge': '#33333a', '--accent': '#ff8fa3', '--accent-ink': '#111114',
      '--board': '#19191d', '--board-edge': '#2c2c33', '--cell': '#222227', '--cell-edge': '#121215', '--ok': '#7cc98a', '--bad': '#ef6b6b', '--sweep': 'rgba(255,255,255,.95)', '--glow': '#ffd966', '--font': font, '--radius': '22%' } },
  { id: 'classic-light', name: 'Proposal · Classic (light)', dark: false,
    vars: { '--bg': '#f3f3f5', '--bg2': '#e8e8ec', '--ink': '#25252b', '--ink-soft': '#86868f', '--panel': '#ffffff', '--panel-edge': '#dadadf', '--accent': '#25252b', '--accent-ink': '#ffffff',
      '--board': '#e6e6ea', '--board-edge': '#d2d2d8', '--cell': '#f7f7f9', '--cell-edge': '#dfdfe4', '--ok': '#7cc98a', '--bad': '#ef6b6b', '--sweep': 'rgba(255,255,255,.95)', '--glow': '#ffd966', '--font': font, '--radius': '22%' } },
];
for (const t of CLASSIC) if (!THEME_BY_ID[t.id]) registerTheme({ ...base, ...t, blurb: 'Monochrome board, coloured light' });
