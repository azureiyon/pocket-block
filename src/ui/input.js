// DOM input bindings: pointer drag (mouse/touch/pen), tap-to-select and
// tap-to-place, hover aim, and keyboard controls. All placement goes through
// the DragController / Game guards so duplicate inputs cannot double-place.

import { DragController } from './drag.js';
import { makePiece } from './render.js';
import { getShape } from '../core/shapes.js';
import { SIZE, occFromCells, legalPlacements } from '../core/rules.js';

export function bindInput(app) {
  const { game, boardView, trayEl, boardEl, ghostEl } = app;
  const listeners = [];
  const on = (t, ev, fn, opts) => { t.addEventListener(ev, fn, opts); listeners.push(() => t.removeEventListener(ev, fn, opts)); };
  let aim = null; // keyboard / hover aim {r, c}

  const drag = new DragController({
    game,
    geometry: () => boardView.geometry(),
    hooks: {
      showGhost(slot) {
        const piece = game.tray[slot];
        const g = boardView.geometry();
        ghostEl.innerHTML = '';
        const p = makePiece(app.theme, piece.shapeId, piece.color, 'piece ghost-piece');
        ghostEl.style.setProperty('--cs', g.size + 'px');
        ghostEl.style.setProperty('--gap', (g.pitch - g.size) + 'px');
        ghostEl.appendChild(p);
        ghostEl.classList.add('on');
        app.renderTray();
        app.audio.play('ui', { kind: 'pick' });
      },
      moveGhost(left, top) { ghostEl.style.transform = `translate3d(${left}px,${top}px,0)`; },
      hideGhost() { ghostEl.classList.remove('on'); ghostEl.innerHTML = ''; app.renderTray(); },
      preview(slot, r, c) { const p = game.tray[slot]; boardView.preview(game.cells, p.shapeId, r, c, p.color); ghostEl.classList.toggle('snapped', game.canPlace(slot, r, c)); },
      clearPreview() { boardView.clearPreview(); ghostEl.classList.remove('snapped'); },
      select(slot) { aim = null; boardView.clearPreview(); app.renderTray(); if (slot !== null) { app.audio.play('ui', { kind: 'select' }); initAim(); } },
      commit() { aim = null; },
      invalid() { app.onInvalid(); app.renderTray(); },
      cancelled() { app.renderTray(); },
    },
  });
  app.drag = drag;

  function initAim() {
    const slot = drag.selected;
    if (slot === null || !game.tray[slot]) return;
    const { lo, hi } = occFromCells(game.cells);
    const legal = legalPlacements(lo, hi, game.tray[slot].shapeId);
    aim = legal.length ? { r: legal[0].r, c: legal[0].c } : { r: 0, c: 0 };
    showAim();
  }

  function showAim() {
    const slot = drag.selected;
    if (slot === null || !aim || !game.tray[slot] || game.tray[slot].placed) { boardView.clearPreview(); return; }
    const p = game.tray[slot];
    boardView.preview(game.cells, p.shapeId, aim.r, aim.c, p.color);
  }

  function placeSelected(r, c) {
    const slot = drag.selected;
    if (slot === null || drag.active) return;
    const move = game.place(slot, r, c);
    if (move) { drag.selected = null; aim = null; boardView.clearPreview(); app.renderTray(); } else app.onInvalid();
  }

  // ---- tray ----
  on(trayEl, 'pointerdown', (e) => {
    const slotEl = e.target.closest('.slot');
    if (!slotEl || app.modalOpen()) return;
    e.preventDefault();
    const slot = +slotEl.dataset.slot;
    if (drag.down({ slot, x: e.clientX, y: e.clientY, pointerType: e.pointerType, id: e.pointerId })) {
      try { slotEl.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    }
  });
  on(document, 'pointermove', (e) => {
    if (drag.active) { e.preventDefault(); drag.move({ x: e.clientX, y: e.clientY, id: e.pointerId }); return; }
    // Hover aim for a selected piece (mouse only).
    if (e.pointerType === 'mouse' && drag.selected !== null && !app.modalOpen()) {
      const i = boardView.cellIndexAt(e.clientX, e.clientY);
      if (i >= 0) {
        const s = getShape(game.tray[drag.selected].shapeId);
        aim = { r: Math.min(Math.floor(i / SIZE), SIZE - s.h), c: Math.min(i % SIZE, SIZE - s.w) };
        showAim();
      }
    }
  }, { passive: false });
  on(document, 'pointerup', (e) => { if (drag.active) drag.up({ x: e.clientX, y: e.clientY, id: e.pointerId }); });
  on(document, 'pointercancel', (e) => { if (drag.active && e.pointerId === drag.pointerId) drag.cancel('pointercancel'); });

  // ---- board tap-to-place ----
  let boardDown = null;
  on(boardEl, 'pointerdown', (e) => {
    if (drag.active || drag.selected === null) return;
    e.preventDefault();
    boardDown = { x: e.clientX, y: e.clientY, id: e.pointerId };
  });
  on(boardEl, 'pointerup', (e) => {
    if (!boardDown || boardDown.id !== e.pointerId) return;
    const moved = Math.hypot(e.clientX - boardDown.x, e.clientY - boardDown.y);
    boardDown = null;
    if (moved > 12) return;
    const i = boardView.cellIndexAt(e.clientX, e.clientY);
    if (i < 0) return;
    placeSelected(Math.floor(i / SIZE), i % SIZE); // tapped cell is the intended top-left
  });

  // ---- interruptions ----
  const interrupt = (reason) => () => { drag.cancel(reason); boardDown = null; };
  on(window, 'blur', interrupt('blur'));
  on(window, 'orientationchange', interrupt('orientation'));
  // Only real size changes (rotation, split view) cancel a drag; small
  // viewport jitter such as Safari toolbar changes does not.
  let lastSize = [window.innerWidth, window.innerHeight];
  on(window, 'resize', () => {
    const [w, h] = [window.innerWidth, window.innerHeight];
    if (Math.abs(w - lastSize[0]) > 40 || Math.abs(h - lastSize[1]) > 140) interrupt('resize')();
    lastSize = [w, h];
  });
  on(window, 'pagehide', interrupt('pagehide'));
  on(document, 'visibilitychange', () => { if (document.hidden) interrupt('hidden')(); });
  // Stop iOS rubber-band scrolling and long-press selection on the play area.
  on(app.playEl, 'touchmove', (e) => { if (!e.target.closest('.scrollable')) e.preventDefault(); }, { passive: false });
  on(app.playEl, 'contextmenu', (e) => e.preventDefault());

  // ---- keyboard ----
  on(window, 'keydown', (e) => {
    if (app.modalOpen()) { if (e.key === 'Escape') app.closeTopModal(); return; }
    if (e.target && /input|select|textarea/i.test(e.target.tagName)) return;
    if (['1', '2', '3'].includes(e.key)) {
      const slot = +e.key - 1;
      const p = game.tray[slot];
      if (p && !p.placed && !game.over && !game.busy) {
        drag.selected = slot; app.renderTray(); app.audio.play('ui', { kind: 'select' }); initAim();
      }
      e.preventDefault();
      return;
    }
    if (e.key.startsWith('Arrow')) {
      if (drag.selected === null) return;
      e.preventDefault();
      const s = getShape(game.tray[drag.selected].shapeId);
      if (!aim) aim = { r: 0, c: 0 };
      if (e.key === 'ArrowUp') aim.r = Math.max(0, aim.r - 1);
      if (e.key === 'ArrowDown') aim.r = Math.min(SIZE - s.h, aim.r + 1);
      if (e.key === 'ArrowLeft') aim.c = Math.max(0, aim.c - 1);
      if (e.key === 'ArrowRight') aim.c = Math.min(SIZE - s.w, aim.c + 1);
      showAim();
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      if (drag.selected === null || !aim) return;
      e.preventDefault();
      if (e.repeat) return; // held key must not double-place
      placeSelected(aim.r, aim.c);
      return;
    }
    if (e.key === 'Escape') { drag.cancel('escape'); drag.deselect(); aim = null; boardView.clearPreview(); }
  });

  return {
    drag,
    refreshAim: showAim,
    reset() { drag.cancel('reset'); drag.selected = null; aim = null; boardView.clearPreview(); ghostEl.classList.remove('on'); ghostEl.innerHTML = ''; },
    dispose() { listeners.forEach((f) => f()); },
  };
}
