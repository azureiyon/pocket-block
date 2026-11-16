// Cross-check: plays the real Game controller (as used by the app) with a
// uniformly random legal-move player, to confirm the integration matches the
// standalone simulator. node tools/sim/game-check.js [games]
import { Game } from '../../src/core/game.js';
import { createSyncGen } from '../../src/gen/service.js';
import { createRng } from '../../src/core/rng.js';

const N = Number(process.argv[2] || 600);
for (const generator of ['classic', 'rhythm']) {
  const lens = []; let clears = 0; let moves = 0; let dup = 0; let trays = 0;
  for (let i = 0; i < N; i++) {
    const g = new Game({ gen: createSyncGen(), generator });
    const rng = createRng(7000 + i);
    g.on('tray', ({ tray }) => { trays++; if (new Set(tray.map((p) => p.shapeId)).size < 3) dup++; });
    await g.newGame({ seed: 5000 + i, opening: { mode: 'off', variant: 'any' } });
    let n = 0;
    while (!g.over && n < 600) {
      if (g.busy) { await new Promise((r) => setImmediate(r)); continue; }
      const legal = [];
      for (let s = 0; s < 3; s++) for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++) if (g.canPlace(s, r, c)) legal.push([s, r, c]);
      const m = g.place(...legal[Math.floor(rng() * legal.length)]);
      n++; moves++; if (m.lines) clears++;
    }
    lens.push(n);
  }
  lens.sort((a, b) => a - b);
  console.log(generator, { games: N, mean: +(lens.reduce((a, b) => a + b, 0) / N).toFixed(1), median: lens[N >> 1], clearRate: +(clears / moves).toFixed(3), dupTrays: +(dup / trays).toFixed(3) });
}
