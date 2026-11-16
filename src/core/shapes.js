// Shape collection: 27 fixed orientations. Pieces never rotate, so each
// orientation is its own entry with equal base opportunity in generation.

function fromRows(rows) {
  const cells = [];
  rows.forEach((row, r) => {
    [...row].forEach((ch, c) => { if (ch === '#') cells.push([r, c]); });
  });
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  return { cells, w, h };
}

const DEFS = [
  ['single', 'single', ['#']],
  ['pair-h', 'pair', ['##']],
  ['pair-v', 'pair', ['#', '#']],
  ['line3-h', 'line3', ['###']],
  ['line3-v', 'line3', ['#', '#', '#']],
  ['line4-h', 'line4', ['####']],
  ['line4-v', 'line4', ['#', '#', '#', '#']],
  ['line5-h', 'line5', ['#####']],
  ['line5-v', 'line5', ['#', '#', '#', '#', '#']],
  ['square2', 'square2', ['##', '##']],
  ['square3', 'square3', ['###', '###', '###']],
  ['corner-a', 'corner', ['##', '#.']],
  ['corner-b', 'corner', ['##', '.#']],
  ['corner-c', 'corner', ['#.', '##']],
  ['corner-d', 'corner', ['.#', '##']],
  ['l-a', 'l4', ['#.', '#.', '##']],
  ['l-b', 'l4', ['###', '#..']],
  ['l-c', 'l4', ['##', '.#', '.#']],
  ['l-d', 'l4', ['..#', '###']],
  ['t-down', 't', ['###', '.#.']],
  ['t-up', 't', ['.#.', '###']],
  ['t-right', 't', ['#.', '##', '#.']],
  ['t-left', 't', ['.#', '##', '.#']],
  ['zig-h', 'zigzag', ['.##', '##.']],
  ['zig-v', 'zigzag', ['#.', '##', '.#']],
  ['rect-h', 'rect23', ['###', '###']],
  ['rect-v', 'rect23', ['##', '##', '##']],
];

export const SHAPES = DEFS.map(([id, family, rows], index) => ({
  id, family, index, ...fromRows(rows), size: rows.join('').split('').filter((c) => c === '#').length,
}));

export const SHAPE_BY_ID = Object.fromEntries(SHAPES.map((s) => [s.id, s]));
export const SHAPE_IDS = SHAPES.map((s) => s.id);

export function getShape(id) {
  const s = SHAPE_BY_ID[id];
  if (!s) throw new Error('Unknown shape ' + id);
  return s;
}
