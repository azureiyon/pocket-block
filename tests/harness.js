// Tiny dependency-free test harness usable from Node and the browser.
export const tests = [];
export const reports = [];

export function test(name, fn) { tests.push({ name, fn }); }
export function report(line) { reports.push(line); }

export class AssertionError extends Error {}
export function assert(cond, msg = 'assertion failed') { if (!cond) throw new AssertionError(msg); }
export function eq(a, b, msg = '') {
  const sa = JSON.stringify(a); const sb = JSON.stringify(b);
  if (sa !== sb) throw new AssertionError(`${msg} expected ${sb} got ${sa}`);
}

export async function runAll({ filter = null, log = console.log } = {}) {
  let pass = 0; let fail = 0; const failures = [];
  for (const t of tests) {
    if (filter && !t.name.includes(filter)) continue;
    const t0 = Date.now();
    try {
      await t.fn();
      pass++;
      log(`  ok   ${t.name} (${Date.now() - t0}ms)`);
    } catch (e) {
      fail++;
      failures.push({ name: t.name, error: e });
      log(`  FAIL ${t.name}\n       ${e && e.stack ? e.stack.split('\n').slice(0, 3).join('\n       ') : e}`);
    }
  }
  if (reports.length) { log('\nReports:'); for (const r of reports) log('  ' + r); }
  log(`\n${pass} passed, ${fail} failed`);
  return { pass, fail, failures };
}
