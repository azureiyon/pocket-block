// Generation service: runs tray/opening generation in a local module Web
// Worker when possible, with a synchronous fallback. Each request carries a
// sub-seed so worker and fallback produce identical results.

import { generateTray } from '../core/generator.js';
import { planOpening } from '../core/openings.js';
import { createRng } from '../core/rng.js';

export function runJob(job) {
  if (job.kind === 'tray') return generateTray(job.lo, job.hi, job.recent, createRng(job.seed));
  if (job.kind === 'opening') return planOpening(job.prefs, createRng(job.seed), job.recent);
  throw new Error('Unknown job ' + job.kind);
}

export function createSyncGen() {
  return {
    mode: 'sync',
    tray: (lo, hi, recent, seed) => Promise.resolve(runJob({ kind: 'tray', lo, hi, recent, seed })),
    opening: (prefs, seed, recent) => Promise.resolve(runJob({ kind: 'opening', prefs, seed, recent })),
    dispose() {},
  };
}

export function createWorkerGen(workerUrl, { timeoutMs = 2500 } = {}) {
  let worker = null;
  let nextId = 1;
  const pending = new Map();
  const svc = { mode: 'worker' };

  function fallbackAll() {
    svc.mode = 'sync';
    if (worker) { try { worker.terminate(); } catch (e) { /* ignore */ } }
    worker = null;
    for (const [id, p] of pending) { pending.delete(id); clearTimeout(p.timer); p.resolve(runJob(p.job)); }
  }

  try {
    if (typeof Worker === 'undefined') throw new Error('no worker');
    worker = new Worker(workerUrl, { type: 'module' });
    worker.onmessage = (e) => {
      const { id, result, error } = e.data || {};
      const p = pending.get(id);
      if (!p) return; // already resolved by timeout fallback; drop
      pending.delete(id); clearTimeout(p.timer);
      if (error) p.resolve(runJob(p.job)); else p.resolve(result);
    };
    worker.onerror = (ev) => { if (ev && ev.preventDefault) ev.preventDefault(); fallbackAll(); };
  } catch (e) {
    worker = null; svc.mode = 'sync';
  }

  function request(job) {
    if (!worker) return Promise.resolve(runJob(job));
    return new Promise((resolve) => {
      const id = nextId++;
      const timer = setTimeout(() => {
        if (!pending.has(id)) return;
        pending.delete(id);
        resolve(runJob(job));
      }, timeoutMs);
      pending.set(id, { resolve, job, timer });
      try { worker.postMessage({ id, job }); } catch (err) { pending.delete(id); clearTimeout(timer); resolve(runJob(job)); }
    });
  }

  svc.tray = (lo, hi, recent, seed) => request({ kind: 'tray', lo, hi, recent, seed });
  svc.opening = (prefs, seed, recent) => request({ kind: 'opening', prefs, seed, recent });
  svc.dispose = () => { if (worker) worker.terminate(); worker = null; };
  return svc;
}
