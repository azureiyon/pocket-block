// Gameplay simulation harness.
//   node tools/sim/simulate.js --games 300 --gens classic,rhythm --strategies random,greedy,space,lookahead
// Runs games in parallel worker threads with identical seeds per generator,
// aggregates feel/difficulty/variety metrics, and writes JSON + Markdown
// reports to tools/sim/results/.
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { cpus } from 'node:os';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { playGame } from './play.js';
import { SHAPE_IDS, getShape } from '../../src/core/shapes.js';

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 ? process.argv[i + 1] : def;
}

async function main() {
  const games = Number(arg('games', 200));
  const gens = arg('gens', 'classic').split(',');
  const strategies = arg('strategies', 'random,greedy,space,lookahead').split(',');
  const cap = Number(arg('cap', 600));
  const seed0 = Number(arg('seed', 1));
  const label = arg('label', gens.join('-vs-'));
  const threads = Number(arg('threads', Math.max(1, cpus().length - 1)));
  const setup = new URL('./setup.js', import.meta.url).href;

  const jobs = [];
  for (const strategy of strategies) for (let s = 0; s < games; s++) for (const gen of gens) jobs.push({ gen, strategy, seed: seed0 + s, cap });
  const results = [];
  const t0 = Date.now();
  await new Promise((resolve) => {
    let next = 0; let done = 0;
    const pool = Array.from({ length: Math.min(threads, jobs.length) }, () => new Worker(fileURLToPath(import.meta.url), { workerData: { setup } }));
    const feed = (w) => { if (next < jobs.length) w.postMessage(jobs[next++]); else w.postMessage('exit'); };
    for (const w of pool) {
      w.on('message', (r) => {
        results.push(r); done++;
        if (done % 200 === 0) process.stderr.write(`  ${done}/${jobs.length} games (${((Date.now() - t0) / 1000).toFixed(0)}s)\n`);
        if (done === jobs.length) resolve();
        feed(w);
      });
      w.on('error', (e) => { console.error(e); process.exit(1); });
      feed(w);
    }
  });
  const report = aggregate(results, gens, strategies);
  report.meta = { games, cap, seed0, threads, seconds: (Date.now() - t0) / 1000, totalGames: results.length };
  const dir = new URL('./results/', import.meta.url);
  mkdirSync(dir, { recursive: true });
  writeFileSync(new URL(`${label}.json`, dir), JSON.stringify(report, null, 1));
  const md = toMarkdown(report, gens, strategies);
  writeFileSync(new URL(`${label}.md`, dir), md);
  console.log(md);
}

const mean = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0);
const pct = (a, p) => { if (!a.length) return 0; const s = a.slice().sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const entropy = (counts) => { const tot = counts.reduce((a, b) => a + b, 0); let h = 0; for (const c of counts) if (c) { const p = c / tot; h -= p * Math.log2(p); } return h; };

function aggregate(results, gens, strategies) {
  const out = {};
  for (const gen of gens) {
    out[gen] = {};
    for (const strategy of strategies) {
      const rs = results.filter((r) => r.gen === gen && r.strategy === strategy);
      const moves = rs.map((r) => r.moves);
      const gaps = rs.flatMap((r) => r.gaps);
      const longest = rs.map((r) => Math.max(0, ...r.gaps));
      const totalMoves = moves.reduce((a, b) => a + b, 0);
      const clearMoves = rs.reduce((a, r) => a + r.clearMoves, 0);
      const multi = rs.reduce((a, r) => a + r.multiMoves, 0);
      const trays = rs.reduce((a, r) => a + r.trays, 0);
      const shapes = {}; const triples = {}; const moods = {}; const kinds = {}; const deaths = {}; const trayLines = [0, 0, 0, 0];
      for (const r of rs) {
        for (const [k, v] of Object.entries(r.shapes)) shapes[k] = (shapes[k] || 0) + v;
        for (const [k, v] of Object.entries(r.triples)) triples[k] = (triples[k] || 0) + v;
        for (const [k, v] of Object.entries(r.moods)) moods[k] = (moods[k] || 0) + v;
        for (const [k, v] of Object.entries(r.kinds || {})) kinds[k] = (kinds[k] || 0) + v;
        if (r.death) deaths[r.death.cause] = (deaths[r.death.cause] || 0) + 1;
        r.trayLinesHist.forEach((v, i) => { trayLines[i] += v; });
      }
      const shapeTotal = Object.values(shapes).reduce((a, b) => a + b, 0);
      const shapeShare = Object.fromEntries(SHAPE_IDS.map((id) => [id, (shapes[id] || 0) / shapeTotal]));
      const bySize = {};
      for (const id of SHAPE_IDS) { const s = getShape(id).size; const k = s <= 2 ? '1-2' : s <= 3 ? '3' : s === 4 ? '4' : '5-9'; bySize[k] = (bySize[k] || 0) + shapeShare[id]; }
      const occHist = [0, 0, 0, 0, 0, 0, 0, 0];
      for (const r of rs) r.occHist.forEach((v, i) => { occHist[i] += v; });
      const occTot = occHist.reduce((a, b) => a + b, 0);
      const tripleCounts = Object.values(triples);
      const highEp = rs.reduce((a, r) => a + r.highEpisodes, 0);
      const rec = rs.reduce((a, r) => a + r.recovered, 0);
      const deathFilled = rs.filter((r) => r.death).map((r) => r.death.filled);
      out[gen][strategy] = {
        games: rs.length,
        capped: rs.filter((r) => r.capped).length,
        movesMean: mean(moves), movesMedian: pct(moves, 0.5), movesP10: pct(moves, 0.1), movesP90: pct(moves, 0.9),
        gapMean: mean(gaps), gapMedian: pct(gaps, 0.5), gapP90: pct(gaps, 0.9), longestGapMean: mean(longest),
        clearMoveRate: clearMoves / Math.max(1, totalMoves),
        multiShare: multi / Math.max(1, clearMoves),
        multiPer100: (100 * multi) / Math.max(1, totalMoves),
        allClearsPerGame: rs.reduce((a, r) => a + r.allClears, 0) / Math.max(1, rs.length),
        traysWithClear: (trayLines[1] + trayLines[2] + trayLines[3]) / Math.max(1, trayLines.reduce((a, b) => a + b, 0)),
        occMean: mean(rs.map((r) => r.occMean)),
        occHist: occHist.map((v) => v / Math.max(1, occTot)),
        cyclesPer100: (100 * rs.reduce((a, r) => a + r.cycles, 0)) / Math.max(1, totalMoves),
        highEpisodesPerGame: highEp / Math.max(1, rs.length),
        recoveryRate: highEp ? rec / highEp : null,
        limitedTrayRate: rs.reduce((a, r) => a + r.limitedTrays, 0) / Math.max(1, trays),
        clearAvailableRate: rs.reduce((a, r) => a + r.clearAvailTrays, 0) / Math.max(1, trays),
        dupTrayRate: rs.reduce((a, r) => a + r.dupTrays, 0) / Math.max(1, trays),
        shapeEntropy: entropy(Object.values(shapes)) / Math.log2(27),
        shapeMaxDev: Math.max(...SHAPE_IDS.map((id) => Math.abs(shapeShare[id] * 27 - 1))),
        sizeShare: bySize,
        shapeShare,
        distinctTriples: tripleCounts.length,
        tripleEntropyBits: entropy(tripleCounts),
        deaths,
        deathFilledMean: mean(deathFilled),
        deathPlaced: [0, 1, 2].map((k) => rs.filter((r) => r.death && r.death.placedFromTray === k).length),
        deathViable: mean(rs.filter((r) => r.death).map((r) => r.death.viableAtOffer)),
        deathViableLow: rs.filter((r) => r.death && r.death.viableAtOffer <= 4).length,
        stuckBig: rs.filter((r) => r.death && r.death.stuck.some((id) => getShape(id).size >= 5)).length,
        moods, kinds,
        blastScoreMedian: pct(rs.map((r) => r.blastScore), 0.5),
        maxStreakMean: mean(rs.map((r) => r.maxStreak)),
        streakClearShare: rs.reduce((a, r) => a + r.streakClears, 0) / Math.max(1, clearMoves),
        firstClearMedian: pct(rs.map((r) => (r.firstClearMove === null ? 999 : r.firstClearMove)), 0.5),
      };
    }
  }
  return out;
}

const f1 = (x) => (x === null || x === undefined ? '–' : (Math.round(x * 10) / 10).toString());
const pc = (x) => (x === null || x === undefined ? '–' : (100 * x).toFixed(1) + '%');

function toMarkdown(rep, gens, strategies) {
  const rows = [
    ['Games (capped at move limit)', (s) => `${s.games} (${s.capped})`],
    ['Moves per game: mean / median', (s) => `${f1(s.movesMean)} / ${s.movesMedian}`],
    ['Moves per game: p10 / p90', (s) => `${s.movesP10} / ${s.movesP90}`],
    ['Pieces between clears: mean / median / p90', (s) => `${f1(s.gapMean)} / ${s.gapMedian} / ${s.gapP90}`],
    ['Longest dry spell per game (mean)', (s) => f1(s.longestGapMean)],
    ['Moves that clear', (s) => pc(s.clearMoveRate)],
    ['Trays where the player cleared', (s) => pc(s.traysWithClear)],
    ['Multi-line share of clears', (s) => pc(s.multiShare)],
    ['Multi-line clears per 100 moves', (s) => f1(s.multiPer100)],
    ['Board clears per game', (s) => (Math.round(s.allClearsPerGame * 100) / 100).toString()],
    ['Mean occupancy (cells of 64)', (s) => f1(s.occMean)],
    ['Tension cycles per 100 moves (<=16 -> >=32 -> <=16)', (s) => f1(s.cyclesPer100)],
    ['High-occupancy episodes (>=36) per game', (s) => f1(s.highEpisodesPerGame)],
    ['Recovered from >=36 to <=22', (s) => pc(s.recoveryRate)],
    ['Trays with <=4 viable first moves', (s) => pc(s.limitedTrayRate)],
    ['Trays where a clear was possible', (s) => pc(s.clearAvailableRate)],
    ['Trays with a repeated shape', (s) => pc(s.dupTrayRate)],
    ['Shape entropy (1 = uniform)', (s) => s.shapeEntropy.toFixed(3)],
    ['Max per-shape deviation from uniform', (s) => pc(s.shapeMaxDev)],
    ['Piece sizes 1-2 / 3 / 4 / 5-9 cells', (s) => ['1-2', '3', '4', '5-9'].map((k) => pc(s.sizeShare[k] || 0)).join(' / ')],
    ['Distinct three-piece combinations', (s) => String(s.distinctTriples)],
    ['Combination entropy (bits)', (s) => s.tripleEntropyBits.toFixed(2)],
    ['Game-over causes', (s) => Object.entries(s.deaths).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ') || '–'],
    ['Occupancy at game over (mean)', (s) => f1(s.deathFilledMean)],
    ['Deaths after placing 0 / 1 / 2 pieces of the last tray', (s) => s.deathPlaced.join(' / ')],
    ['Final tray: viable first moves at offer (mean) / deaths from trays with <=4', (s) => f1(s.deathViable) + ' / ' + s.deathViableLow],
    ['Deaths where a 5+ cell piece was stuck', (s) => String(s.stuckBig)],
    ['Blast-rules score per game (median)', (s) => String(s.blastScoreMedian)],
    ['Longest combo streak per game (mean, Blast rules)', (s) => f1(s.maxStreakMean)],
    ['Clears made at streak 3+', (s) => pc(s.streakClearShare)],
    ['Move of the first clear (median)', (s) => String(s.firstClearMedian)],
    ['Tray kinds (flow/blast)', (s) => Object.entries(s.kinds || {}).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ') || '–'],
    ['Tray moods', (s) => Object.entries(s.moods).map(([k, v]) => `${k} ${v}`).join(', ') || '–'],
  ];
  let md = `# Simulation: ${gens.join(' vs ')}\n\n${rep.meta.totalGames} games, ${rep.meta.games} seeds per generator × strategy, move cap ${rep.meta.cap}, ${rep.meta.seconds.toFixed(0)}s.\n`;
  for (const strategy of strategies) {
    md += `\n## Strategy: ${strategy}\n\n| Metric | ${gens.join(' | ')} |\n|---|${gens.map(() => '---').join('|')}|\n`;
    for (const [name, fn] of rows) md += `| ${name} | ${gens.map((g) => fn(rep[g][strategy])).join(' | ')} |\n`;
  }
  return md;
}

if (!isMainThread) {
  if (workerData && workerData.setup) await import(workerData.setup);
  parentPort.on('message', (job) => {
    if (job === 'exit') process.exit(0);
    parentPort.postMessage(playGame(job));
  });
} else {
  await main();
}

