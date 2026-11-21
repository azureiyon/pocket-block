// Bootstrap: generation worker (with synchronous fallback), app, offline SW.
import { App } from './ui/app.js';
import { createWorkerGen } from './gen/service.js';

const gen = createWorkerGen(new URL('./gen/worker.js', import.meta.url));
// ?gen=classic plays with the original tray generator (comparison/rollback).
const params = new URLSearchParams(location.search);
const generator = params.get('gen') || undefined;
// ?mode=blast switches to Blast mode (and remembers it); ?mode=classic switches back.
const mode = params.get('mode') || undefined;
const app = new App({ gen, generator, mode });
app.start();

// Small debugging/testing hook (seeded games: ?seed=123).
window.PocketBlocks = { app, newGame: (seed) => app.newGame(seed) };

if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => { /* offline support unavailable */ });
  });
}
