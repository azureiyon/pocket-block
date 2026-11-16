// Seeded randomness. mulberry32 is small, fast and good enough for games.
// Ordinary play seeds from crypto; tests pass explicit seeds for reproducibility.

export function createRng(seed) {
  let a = (seed >>> 0) || 0x9e3779b9;
  const rng = function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  rng.seed = seed >>> 0;
  rng.int = (n) => Math.floor(rng() * n);
  rng.range = (lo, hi) => lo + Math.floor(rng() * (hi - lo + 1));
  rng.pick = (arr) => arr[Math.floor(rng() * arr.length)];
  rng.chance = (p) => rng() < p;
  rng.u32 = () => Math.floor(rng() * 4294967296) >>> 0;
  return rng;
}

export function shuffle(arr, rng) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function randomSeed() {
  try {
    const buf = new Uint32Array(1);
    (globalThis.crypto || {}).getRandomValues(buf);
    if (buf[0]) return buf[0];
  } catch (e) { /* fall through */ }
  return (Math.floor(Math.random() * 4294967296) ^ Date.now()) >>> 0;
}
