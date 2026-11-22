// DOM rendering for board, tray pieces and blocks. Board cells are
// persistent; only changed cells are touched so running animations survive
// ordinary redraws.

import { SIZE, CELLS, placementAt, occFromCells, applyPlacement, fits } from '../core/rules.js';
import { getShape } from '../core/shapes.js';
import { MAHJONG_MARKS, MAHJONG_GLYPHS } from '../themes/themes.js';

export function decorateBlock(el, theme, colorIndex) {
  el.className = 'blk m-' + theme.material;
  el.dataset.c = String(colorIndex);
  el.style.setProperty('--c', theme.palette[(colorIndex - 1) % theme.palette.length]);
  let inner = el.firstElementChild;
  if (!inner) { inner = document.createElement('i'); el.appendChild(inner); }
  if (theme.material === 'mahjong') {
    const mark = MAHJONG_MARKS[(colorIndex - 1) % MAHJONG_MARKS.length];
    el.dataset.mark = mark;
    inner.textContent = MAHJONG_GLYPHS[mark] || '';
  } else if (theme.marks) {
    // Per-colour marks (card suits, emblems): shape coding on top of colour.
    const mark = theme.marks[(colorIndex - 1) % theme.marks.length];
    el.dataset.mark = mark;
    inner.textContent = (theme.glyphs && theme.glyphs[mark]) || '';
  } else {
    delete el.dataset.mark;
    inner.textContent = '';
  }
  return el;
}

export function makeBlock(theme, colorIndex) {
  return decorateBlock(document.createElement('div'), theme, colorIndex);
}

/** Render a shape as a small grid of blocks (tray, ghost, demos). */
export function makePiece(theme, shapeId, colorIndex, cls = 'piece') {
  const s = getShape(shapeId);
  const el = document.createElement('div');
  el.className = cls;
  el.style.setProperty('--w', s.w);
  el.style.setProperty('--h', s.h);
  const filled = new Set(s.cells.map(([r, c]) => r * s.w + c));
  for (let k = 0; k < s.w * s.h; k++) {
    if (filled.has(k)) el.appendChild(makeBlock(theme, colorIndex));
    else { const sp = document.createElement('div'); sp.className = 'sp'; el.appendChild(sp); }
  }
  el.dataset.shape = shapeId;
  return el;
}

export class BoardView {
  constructor(el) {
    this.el = el;
    this.cells = [];
    this.state = new Int16Array(CELLS).fill(-1);
    this.theme = null;
    this.previewIdx = [];
    el.innerHTML = '';
    for (let i = 0; i < CELLS; i++) {
      const c = document.createElement('div');
      c.className = 'cell';
      c.dataset.i = String(i);
      c.style.setProperty('--i', String(i));
      el.appendChild(c);
      this.cells.push(c);
    }
  }

  setTheme(theme) { this.theme = theme; this.state.fill(-1); }

  render(cells, placed = null) {
    const placedSet = placed ? new Set(placed) : null;
    for (let i = 0; i < CELLS; i++) {
      const v = cells[i];
      if (v === this.state[i]) continue;
      this.state[i] = v;
      const cell = this.cells[i];
      let blk = cell.querySelector(':scope > .blk');
      if (!v) { if (blk) blk.remove(); continue; }
      if (!blk) { blk = document.createElement('div'); cell.appendChild(blk); }
      decorateBlock(blk, this.theme, v);
      if (placedSet && placedSet.has(i)) {
        blk.style.setProperty('--d', ((placedSet.size > 1 ? [...placedSet].indexOf(i) : 0) * 18) + 'ms');
        blk.classList.add('fx-place');
      }
    }
  }

  clearPreview() {
    for (const i of this.previewIdx) this.cells[i].classList.remove('pv', 'pv-ok', 'pv-bad', 'pv-line');
    this.previewIdx = [];
  }

  /** Show where a piece would land; valid/invalid look clearly different. */
  preview(cells, shapeId, r, c, colorIndex) {
    this.clearPreview();
    const s = getShape(shapeId);
    const p = placementAt(shapeId, r, c);
    const occ = occFromCells(cells);
    const valid = !!p && fits(occ.lo, occ.hi, p);
    const color = this.theme.palette[(colorIndex - 1) % 7];
    for (const [dr, dc] of s.cells) {
      const rr = r + dr; const cc = c + dc;
      if (rr < 0 || cc < 0 || rr >= SIZE || cc >= SIZE) continue;
      const i = rr * SIZE + cc;
      const cell = this.cells[i];
      cell.classList.add('pv', valid ? 'pv-ok' : 'pv-bad');
      cell.style.setProperty('--pc', color);
      this.previewIdx.push(i);
    }
    if (valid) {
      // Highlight lines that this placement would clear.
      const res = applyPlacement(occ.lo, occ.hi, p);
      for (const k of res.lines) {
        for (let j = 0; j < SIZE; j++) {
          const i = k < 8 ? k * SIZE + j : j * SIZE + (k - 8);
          this.cells[i].classList.add('pv-line');
          this.previewIdx.push(i);
        }
      }
    }
    return valid;
  }

  /** Geometry in client coordinates for drag mapping. */
  geometry() {
    const a = this.cells[0].getBoundingClientRect();
    const b = this.cells[1].getBoundingClientRect();
    return { left: a.left, top: a.top, pitch: b.left - a.left, size: a.width };
  }

  cellIndexAt(x, y) {
    const g = this.geometry();
    const c = Math.floor((x - g.left) / g.pitch);
    const r = Math.floor((y - g.top) / g.pitch);
    if (r < 0 || c < 0 || r >= SIZE || c >= SIZE) return -1;
    return r * SIZE + c;
  }

  /** Cell rect relative to a container element. */
  cellBox(i, container) {
    const cr = this.cells[i].getBoundingClientRect();
    const br = container.getBoundingClientRect();
    return { x: cr.left - br.left, y: cr.top - br.top, w: cr.width, h: cr.height };
  }
}

export class TrayView {
  constructor(el, { onRender } = {}) {
    this.el = el;
    this.slots = [];
    this.onRender = onRender;
    el.innerHTML = '';
    for (let k = 0; k < 3; k++) {
      const s = document.createElement('button');
      s.type = 'button';
      s.className = 'slot';
      s.dataset.slot = String(k);
      s.setAttribute('aria-label', 'Piece ' + (k + 1));
      el.appendChild(s);
      this.slots.push(s);
    }
  }

  render(theme, tray, { selected = null, dragging = null, fitsFn = () => true, busy = false } = {}) {
    this.slots.forEach((s, k) => {
      const piece = tray[k];
      const key = piece ? [theme.id, piece.uid, piece.placed].join(':') : 'none';
      if (s.dataset.key !== key) {
        s.dataset.key = key;
        s.innerHTML = '';
        if (piece && !piece.placed) {
          s.appendChild(makePiece(theme, piece.shapeId, piece.color));
          s.classList.add('fresh');
          setTimeout(() => s.classList.remove('fresh'), 400);
        }
      }
      const has = piece && !piece.placed;
      s.classList.toggle('empty', !has);
      s.classList.toggle('sel', has && selected === k);
      s.classList.toggle('lifted', has && dragging === k);
      s.classList.toggle('nofit', has && !fitsFn(k));
      s.disabled = !has || busy;
      s.setAttribute('aria-label', has ? `Piece ${k + 1}: ${piece.shapeId}${selected === k ? ', selected' : ''}` : `Piece ${k + 1}: placed`);
    });
  }
}
