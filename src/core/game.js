// Game state controller. No DOM: rendering, effects, audio and input
// subscribe to its events. All moves go through rules.placeOnCells.

import { CELLS, occFromCells, placeOnCells, canPlaceOnCells, anyFits } from './rules.js';
import { createRng, randomSeed } from './rng.js';

export class Game {
  constructor({ gen, settings } = {}) {
    if (!gen) throw new Error('Game needs a generation service');
    this.gen = gen;
    this.settings = settings || null;
    this.listeners = {};
    this.gameId = 0;
    this.best = settings ? settings.get('best') : 0;
    this.resetState();
  }

  on(type, fn) { (this.listeners[type] ||= []).push(fn); return () => this.off(type, fn); }
  off(type, fn) { this.listeners[type] = (this.listeners[type] || []).filter((f) => f !== fn); }
  emit(type, data) { for (const fn of (this.listeners[type] || []).slice()) fn(data, this); }

  resetState() {
    this.cells = new Uint8Array(CELLS);
    this.tray = [];
    this.score = 0;
    this.combo = 0;
    this.moves = 0;
    this.batch = 0;
    this.recent = [];
    this.over = false;
    this.busy = true;
    this.opening = null;
    this.lastSequence = null;
  }

  get remaining() { return this.tray.filter((p) => !p.placed); }
  get isEmpty() { return this.cells.every((v) => v === 0); }

  /** Start a new game. Resolves to true when it became the current game. */
  async newGame({ seed, opening } = {}) {
    const id = ++this.gameId;
    this.seed = (seed === undefined || seed === null) ? randomSeed() : seed >>> 0;
    this.rng = createRng(this.seed);
    this.resetState();
    this.bestAtStart = this.best;
    this.emit('reset', { seed: this.seed });
    const prefs = opening || (this.settings ? this.settings.get('opening') : { mode: 'off', variant: 'any' });
    const plan = await this.gen.opening(prefs, this.rng.u32(), []);
    if (id !== this.gameId) return false; // a newer restart superseded this one
    this.cells = Uint8Array.from(plan.cells);
    this.opening = { variant: plan.variant, special: plan.special, reason: plan.reason, stats: plan.stats, meta: plan.meta || null, clearSequence: plan.clearSequence || null };
    this.setTray(plan.tray);
    this.busy = false;
    this.emit('start', { opening: this.opening });
    this.checkGameOver();
    return true;
  }

  setTray(tray) {
    this.batch++;
    this.recent = tray.recent;
    this.lastSequence = tray.sequence;
    this.tray = tray.ids.map((shapeId, slot) => ({ slot, shapeId, color: tray.colors[slot], placed: false, uid: this.batch * 10 + slot }));
    this.emit('tray', { tray: this.tray, batch: this.batch, fallback: tray.fallback, attempts: tray.attempts });
  }

  canPlace(slot, r, c) {
    if (this.over || this.busy) return false;
    const piece = this.tray[slot];
    if (!piece || piece.placed) return false;
    return canPlaceOnCells(this.cells, piece.shapeId, r, c);
  }

  pieceFits(slot) {
    const piece = this.tray[slot];
    if (!piece || piece.placed) return false;
    const { lo, hi } = occFromCells(this.cells);
    return anyFits(lo, hi, piece.shapeId);
  }

  /** Place a tray piece with its top-left at (r, c). Returns the move or null. */
  place(slot, r, c) {
    if (this.over || this.busy) return null;
    const piece = this.tray[slot];
    if (!piece || piece.placed) return null;
    const res = placeOnCells(this.cells, piece.shapeId, r, c, piece.color);
    if (!res) { this.emit('invalid', { slot, r, c }); return null; }
    piece.placed = true;
    this.cells = res.cells;
    this.moves++;
    this.score += res.points;
    const prevCombo = this.combo;
    this.combo = res.lines > 0 ? this.combo + 1 : 0;
    let newBest = false;
    if (this.score > this.best) {
      this.best = this.score; newBest = true;
      if (this.settings) this.settings.set('best', this.best);
    }
    const move = {
      slot, r, c, shapeId: piece.shapeId, color: piece.color,
      placed: res.placed, rows: res.rows, cols: res.cols, lines: res.lines,
      clearedCells: res.clearedCells, points: res.points, combo: this.combo, prevCombo,
      allClear: res.lines > 0 && res.empty, score: this.score, best: this.best, newBest,
      batch: this.batch, gameId: this.gameId,
    };
    this.emit('place', move);
    if (this.remaining.length === 0) this.refill();
    else this.checkGameOver();
    return move;
  }

  async refill() {
    this.busy = true;
    const id = this.gameId; const batch = this.batch;
    const { lo, hi } = occFromCells(this.cells);
    this.emit('busy', true);
    const tray = await this.gen.tray(lo, hi, this.recent, this.rng.u32());
    if (id !== this.gameId || batch !== this.batch) return; // stale result after restart
    this.setTray(tray);
    this.busy = false;
    this.emit('busy', false);
    this.checkGameOver();
  }

  checkGameOver() {
    if (this.over || this.busy) return this.over;
    const remaining = this.remaining;
    if (!remaining.length) return false;
    const { lo, hi } = occFromCells(this.cells);
    if (remaining.some((p) => anyFits(lo, hi, p.shapeId))) return false;
    this.over = true;
    this.emit('gameover', { score: this.score, best: this.best, newBest: this.score > (this.bestAtStart || 0) });
    return true;
  }

  /** True when a restart should ask for confirmation. */
  get isActive() { return !this.over && (this.moves > 0); }
}
