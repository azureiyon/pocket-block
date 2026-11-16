// Drag controller: pure logic, no DOM. The DOM layer feeds it pointer
// coordinates and supplies board geometry; tests drive it directly.
//
// While dragging, the whole piece floats above the finger (touch) or is
// centred on the cursor (mouse). Its top-left maps to the nearest board cell.

import { getShape } from '../core/shapes.js';
import { SIZE } from '../core/rules.js';

export const DRAG_THRESHOLD = 6;

export class DragController {
  constructor({ game, geometry, hooks = {} }) {
    this.game = game;
    this.geometry = geometry; // () => {left, top, pitch}
    this.hooks = hooks;       // showGhost, moveGhost, hideGhost, preview, clearPreview, select, commit, invalid, cancelled
    this.reset();
    this.selected = null;
  }

  reset() {
    this.active = false;
    this.dragging = false;
    this.slot = null;
    this.pointerId = null;
    this.pointerType = 'mouse';
    this.start = null;
    this.ghost = null;
    this.target = null;
  }

  call(name, ...args) { const fn = this.hooks[name]; return fn ? fn(...args) : undefined; }

  down({ slot, x, y, pointerType = 'mouse', id = 1 }) {
    if (this.active) return false; // ignore second finger
    const piece = this.game.tray[slot];
    if (!piece || piece.placed || this.game.over || this.game.busy) return false;
    this.active = true;
    this.slot = slot;
    this.pointerId = id;
    this.pointerType = pointerType;
    this.start = { x, y };
    return true;
  }

  ghostOrigin(x, y) {
    const g = this.geometry();
    const s = getShape(this.game.tray[this.slot].shapeId);
    const w = s.w * g.pitch; const h = s.h * g.pitch;
    const lift = this.pointerType === 'touch' || this.pointerType === 'pen' ? Math.max(48, g.pitch * 1.25) : 0;
    const left = x - w / 2;
    const top = this.pointerType === 'mouse' ? y - h / 2 : y - h - lift;
    return { left, top, w, h, g, s };
  }

  targetFor(left, top, g, s) {
    let c = Math.round((left - g.left) / g.pitch);
    let r = Math.round((top - g.top) / g.pitch);
    // Allow a small overshoot at the edges, then clamp.
    if (r < -1 || c < -1 || r > SIZE - s.h + 1 || c > SIZE - s.w + 1) return null;
    r = Math.min(Math.max(r, 0), SIZE - s.h);
    c = Math.min(Math.max(c, 0), SIZE - s.w);
    return { r, c };
  }

  move({ x, y, id = 1 }) {
    if (!this.active || id !== this.pointerId) return;
    if (!this.dragging) {
      if (Math.hypot(x - this.start.x, y - this.start.y) < DRAG_THRESHOLD) return;
      this.dragging = true;
      this.call('showGhost', this.slot);
    }
    const o = this.ghostOrigin(x, y);
    this.ghost = { left: o.left, top: o.top };
    this.call('moveGhost', o.left, o.top);
    const t = this.targetFor(o.left, o.top, o.g, o.s);
    if (!t) {
      if (this.target) this.call('clearPreview');
      this.target = null;
      return;
    }
    if (!this.target || this.target.r !== t.r || this.target.c !== t.c) {
      const valid = this.game.canPlace(this.slot, t.r, t.c);
      this.target = { ...t, valid };
      this.call('preview', this.slot, t.r, t.c, valid);
    }
  }

  up({ x, y, id = 1 }) {
    if (!this.active || id !== this.pointerId) return null;
    if (!this.dragging) {
      // A tap toggles selection for tap-to-place.
      const slot = this.slot;
      this.reset();
      this.selected = this.selected === slot ? null : slot;
      this.call('select', this.selected);
      return null;
    }
    this.move({ x, y, id });
    const { slot, target } = this;
    this.reset(); // reset before committing: no duplicate placement
    this.call('hideGhost');
    this.call('clearPreview');
    if (target && target.valid) {
      const move = this.game.place(slot, target.r, target.c);
      if (move) {
        if (this.selected === slot) { this.selected = null; this.call('select', null); }
        this.call('commit', move);
        return move;
      }
    }
    this.call(target ? 'invalid' : 'cancelled', slot);
    return null;
  }

  /** Pointer cancel, app switch, orientation change: return piece safely. */
  cancel(reason = 'cancel') {
    if (!this.active) return false;
    const { slot, dragging } = this;
    this.reset();
    if (dragging) { this.call('hideGhost'); this.call('clearPreview'); this.call('cancelled', slot, reason); }
    return true;
  }

  deselect() {
    if (this.selected !== null) { this.selected = null; this.call('select', null); }
  }
}
