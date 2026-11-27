// Themes with their own hand-directed choreography. Every other theme keeps
// the shared recipe effects (src/ui/vfx-recipes.js) until its batch.
// Batch 1 — Soft & Dreamy.
import pastel from './pastel.js';
import jelly from './jelly.js';
import cloud from './cloud.js';
import soda from './soda.js';
import patisserie from './patisserie.js';
// Neon Arcade (shipped ahead of its batch).
import neon from './neon.js';
// Themes 06–30: line clears picked in the FX Reel.
import { reelChoreo, REEL_IDS } from './reel.js';

export const CHOREO = { pastel, jelly, cloud, soda, patisserie, neon };
for (const id of REEL_IDS) {
  const reel = reelChoreo(id);
  // A theme that already has full choreography keeps it and only takes its new line clear.
  CHOREO[id] = CHOREO[id] ? { ...CHOREO[id], clear: reel.clear, pad: Math.max(CHOREO[id].pad || 0, reel.pad) } : reel;
}


export function getChoreo(id) { return (id && CHOREO[id]) || null; }
