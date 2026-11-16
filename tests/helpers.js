// Shared test helpers: board builders, scripted generation services, replay.
import { CELLS, occFromCells, placeOnCells, findSequence } from '../src/core/rules.js';
import { getShape } from '../src/core/shapes.js';

export function boardFrom(rows) {
  const cells = new Uint8Array(CELLS);
  rows.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === '#') cells[r * 8 + c] = 1; }));
  return cells;
}

export function count(cells) { let n = 0; for (const v of cells) if (v) n++; return n; }

/** Replay a sequence on a copy of the board; returns final cells or null. */
export function replay(cells, ids, sequence) {
  let cur = Uint8Array.from(cells);
  const used = new Set();
  for (const step of sequence) {
    if (used.has(step.piece)) return null;
    used.add(step.piece);
    const res = placeOnCells(cur, ids[step.piece], step.r, step.c, 1);
    if (!res) return null;
    cur = res.cells;
  }
  return used.size === ids.length ? cur : null;
}

export function solvable(cells, ids) {
  const { lo, hi } = occFromCells(cells);
  return !!findSequence(lo, hi, ids);
}

/** Generation service returning scripted openings/trays (optionally deferred). */
export function scriptedGen({ cells = new Uint8Array(CELLS), trays = [], deferred = false } = {}) {
  let k = 0;
  const pending = [];
  const nextTray = () => {
    const ids = trays[Math.min(k, trays.length - 1)];
    k++;
    return { ids, colors: ids.map((_, i) => 1 + i), sequence: null, attempts: 1, fallback: false, recent: ids.slice() };
  };
  const gen = {
    mode: 'scripted',
    opening: () => Promise.resolve({ cells: Uint8Array.from(cells), tray: nextTray(), variant: null, special: false, reason: 'test', stats: {} }),
    tray: () => {
      const t = nextTray();
      if (!deferred) return Promise.resolve(t);
      return new Promise((resolve) => pending.push(() => resolve(t)));
    },
    flush() { while (pending.length) pending.shift()(); },
    pending,
  };
  return gen;
}

export function memoryStorage(initial = {}) {
  const m = new Map(Object.entries(initial));
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    dump: () => Object.fromEntries(m),
  };
}

export const tick = () => new Promise((r) => setTimeout(r, 0));

export function shapeCells(id) { return getShape(id).cells.length; }
