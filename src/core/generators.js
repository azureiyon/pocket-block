// Tray generator registry. Every generator has the signature
//   (lo, hi, recent, rng, context) -> { ids, colors, sequence, attempts, fallback, recent, ... }
// and must only ever offer trays with a verified full three-piece sequence.
// "classic" is the original generator, kept for comparison and rollback.

import { generateTray } from './generator.js';
import { generateRhythmTray } from './generator-rhythm.js';
import { generateBlastTray } from './generator-blast.js';
import { generateFlowTray } from './generator-flow.js';

export const GENERATORS = {
  classic: (lo, hi, recent, rng) => generateTray(lo, hi, recent, rng),
  rhythm: (lo, hi, recent, rng, ctx) => generateRhythmTray(lo, hi, recent, rng, ctx),
  // Blast mode: clear-hungry trays for quick streaks (see generator-blast.js).
  blast: (lo, hi, recent, rng, ctx) => generateBlastTray(lo, hi, recent, rng, ctx),
  // Flow mode: board-aware difficulty director (see generator-flow.js). Its
  // deliberate 'punish' waves are the one exception to the solvability rule.
  flow: (lo, hi, recent, rng, ctx) => generateFlowTray(lo, hi, recent, rng, ctx),
};

// Rollback: set this to 'classic' (or open the game with ?gen=classic).
export const DEFAULT_GENERATOR = 'rhythm';

export function getGenerator(id) {
  return GENERATORS[id] || GENERATORS[DEFAULT_GENERATOR];
}

export function registerGenerator(id, fn) { GENERATORS[id] = fn; }
