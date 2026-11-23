// Node test runner: `node tests/run.js [filter]` (or `npm test`).
import { runAll } from './harness.js';
import './rules.test.js';
import './generator.test.js';
import './generator-rhythm.test.js';
import './generator-blast.test.js';
import './generator-flow.test.js';
import './openings.test.js';
import './game.test.js';
import './themes.test.js';
import './settings-audio.test.js';
import './vfx.test.js';

const filter = process.argv[2] || null;
const t0 = Date.now();
const { fail } = await runAll({ filter });
console.log(`(${((Date.now() - t0) / 1000).toFixed(1)}s, Node ${process.version})`);
process.exit(fail ? 1 : 0);
