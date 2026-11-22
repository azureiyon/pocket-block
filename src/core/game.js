// Game state controller. No DOM: rendering, effects, audio and input
// subscribe to its events. All moves go through rules.placeOnCells.

import { CELLS, occFromCells, placeOnCells, canPlaceOnCells, anyFits } from './rules.js';
import { createRng, randomSeed } from './rng.js';
import { DEFAULT_GENERATOR } from './generators.js';
import { getMode, bestKey, wipedColors, DEFAULT_MODE } from './modes.js';

export class Game {
  constructor({ gen, settings, generator, mode } = {}) {
    if (!gen) throw new Error('Game needs a generation service');
    this.gen = gen;
    this.settings = settings || null;
    // An explicit generator id (?gen=...) overrides the mode's own generator.
    this.forcedGenerator = generator || null;
    this.listeners = {};
    this.gameId = 0;
    this.bests = {}; // per-mode high scores when there is no settings store
    this.setMode(mode || (settings ? settings.get('mode') : DEFAULT_MODE));
    this.resetState();
  }

  /** Switch rules for the next game (scoring, streaks, generator, best score). */
  setMode(id) {
    this.mode = getMode(id);
    this.modeId = this.mode.id;
    // Tray generator id for refills ('rhythm' board-aware, 'classic' original, 'blast', 'flow').
    this.generator = this.forcedGenerator || this.mode.generator || DEFAULT_GENERATOR;
    this.best = this.settings ? this.settings.get(bestKey(this.modeId)) : (this.bests[this.modeId] || 0);
  }

  /** Moves left before the current combo streak breaks (0 when no streak). */
  get streakLeft() { return this.combo > 0 ? Math.max(0, this.mode.streakWindow - this.movesSinceClear) : 0; }

  on(type, fn) { (this.listeners[type] ||= []).push(fn); return () => this.off(type, fn); }
  off(type, fn) { this.listeners[type] = (this.listeners[type] || []).filter((f) => f !== fn); }
  emit(type, data) { for (const fn of (this.listeners[type] || []).slice()) fn(data, this); }

  resetState() {
    this.cells = new Uint8Array(CELLS);
    this.tray = [];
    this.score = 0;
    this.combo = 0;
    this.movesSinceClear = 0;
    this.moves = 0;
    this.batch = 0;
    this.recent = [];
    this.over = false;
    this.busy = true;
    this.opening = null;
    this.lastSequence = null;
    // Clear history for the generator's director (board/clear based, never score).
    this.trayLines = 0;
    this.traysSinceClear = 0;
    this.lastTrayLines = 0;
  }

  get remaining() { return this.tray.filter((p) => !p.placed); }
  get isEmpty() { return this.cells.every((v) => v === 0); }

  /** Start a new game. Resolves to true when it became the current game. */
  async newGame({ seed, opening, mode } = {}) {
    const id = ++this.gameId;
    if (mode) this.setMode(mode);
    this.seed = (seed === undefined || seed === null) ? randomSeed() : seed >>> 0;
    this.rng = createRng(this.seed);
    this.resetState();
    this.bestAtStart = this.best;
    this.emit('reset', { seed: this.seed });
    let prefs = opening || (this.settings ? this.settings.get('opening') : { mode: 'off', variant: 'any' });
    if (!this.mode.openings) prefs = { mode: 'off', variant: 'any' };
    const plan = await this.gen.opening(prefs, this.rng.u32(), [], this.generator);
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
    const before = this.cells;
    this.cells = res.cells;
    this.moves++;
    const prevCombo = this.combo;
    // A streak survives up to streakWindow moves without a clear (classic: 1,
    // so any move that clears nothing ends it).
    if (res.lines > 0) { this.combo++; this.movesSinceClear = 0; } else {
      this.movesSinceClear++;
      if (this.movesSinceClear >= this.mode.streakWindow) this.combo = 0;
    }
    const allClear = res.lines > 0 && res.empty;
    const wiped = res.lines > 0 ? wipedColors(before, res.cells, res.clearedCells) : [];
    const scored = this.mode.score({ blocks: res.placed.length, lines: res.lines, combo: this.combo, wiped: wiped.length, allClear });
    this.score += scored.points;
    this.trayLines += res.lines;
    let newBest = false;
    if (this.score > this.best) {
      this.best = this.score; newBest = true;
      this.bests[this.modeId] = this.best;
      if (this.settings) this.settings.set(bestKey(this.modeId), this.best);
    }
    const move = {
      slot, r, c, shapeId: piece.shapeId, color: piece.color,
      placed: res.placed, rows: res.rows, cols: res.cols, lines: res.lines,
      clearedCells: res.clearedCells, points: scored.points, parts: scored.parts, combo: this.combo, prevCombo,
      streakLeft: this.streakLeft, wiped, mode: this.modeId, arcade: !!this.mode.arcade,
      allClear, score: this.score, best: this.best, newBest,
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
    this.traysSinceClear = this.trayLines ? 0 : this.traysSinceClear + 1;
    this.lastTrayLines = this.trayLines;
    this.trayLines = 0;
    const ctx = { traysSinceClear: this.traysSinceClear, lastTrayLines: this.lastTrayLines, combo: this.combo, movesSinceClear: this.movesSinceClear, trayIndex: this.batch, mode: this.modeId };
    // Only score-aware modes (Flow's difficulty ramp) get to see the score.
    if (this.mode.scoreAware) ctx.score = this.score;
    const tray = await this.gen.tray(lo, hi, this.recent, this.rng.u32(), ctx, this.generator);
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
