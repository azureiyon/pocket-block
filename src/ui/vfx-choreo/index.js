// Themes with their own hand-directed choreography. Every other theme keeps
// the shared recipe effects (src/ui/vfx-recipes.js) until its batch.
// Batch 1 — Soft & Dreamy.
import pastel from './pastel.js';
import jelly from './jelly.js';
import cloud from './cloud.js';
import soda from './soda.js';
import patisserie from './patisserie.js';

export const CHOREO = { pastel, jelly, cloud, soda, patisserie };

export function getChoreo(id) { return (id && CHOREO[id]) || null; }
