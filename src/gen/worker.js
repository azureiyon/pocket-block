// Module worker for expensive generation (tray validation search and
// starting-board planning). Results are plain structured-clone data.
import { runJob } from './service.js';

self.onmessage = (e) => {
  const { id, job } = e.data || {};
  try {
    self.postMessage({ id, result: runJob(job) });
  } catch (err) {
    self.postMessage({ id, error: String(err && err.message || err) });
  }
};
