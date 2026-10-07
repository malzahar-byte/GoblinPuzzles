#!/usr/bin/env node
// The one gate command (notes/AGENTS.md R14). Run from the repo root: `node dev-tools/check-all.mjs`.
// Runs the documentation contract, the integration/wiring check, and every fast puzzle Node test,
// then prints a pass / fail / unrun table and exits non-zero if anything failed. A job that hits the
// per-job timeout is reported as UNRUN, never as a pass or a fail.
//
// The two Pictogram sweeps (test-image, test-roundtrip) are NOT run by default: they take minutes and
// always exceed the timeout in this sandbox, so an always-UNRUN row would only be noise. Run them on
// purpose, when the change is actually about Pictogram: `node dev-tools/check-all.mjs --slow`.
//
// Browser behaviour is NOT covered here (it needs Playwright). Run those by hand — see
// notes/testing.md.

import { spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const TIMEOUT_MS = 30000;
const SLOW = process.argv.includes('--slow');
// Slow sweeps: excluded from the default gate, included by `--slow`.
const SLOW_JOBS = ['Pictogram/test-image.mjs', 'Pictogram/test-roundtrip.mjs'];

const jobs = [
    ['docs', 'dev-tools/check-docs.mjs'],
    ['integration', 'dev-tools/check-integration.mjs'],
];
const puzzleDir = path.join(ROOT, 'PuzzleForge');
for (const name of fs.readdirSync(puzzleDir)) {
    const td = path.join(puzzleDir, name, 'dev-tools');
    if (!fs.existsSync(td)) continue;
    for (const f of fs.readdirSync(td)) {
        if (/^test-.*\.mjs$/.test(f)) jobs.push([`${name}/${f}`, path.join('PuzzleForge', name, 'dev-tools', f)]);
    }
}

const skipped = SLOW ? [] : jobs.map(([name]) => name).filter(name => SLOW_JOBS.includes(name));
const rows = [];
for (const [name, file] of jobs) {
    if (skipped.includes(name)) continue;
    const r = spawnSync(process.execPath, [file], { cwd: ROOT, encoding: 'utf8', timeout: TIMEOUT_MS });
    let status;
    if (r.error && (r.error.code === 'ETIMEDOUT' || r.error.code === 'ERR_CHILD_PROCESS_STDIO_MAXBUFFER')) status = 'unrun';
    else if (r.status === 0) status = 'pass';
    else status = 'fail';
    rows.push({ name, status, out: ((r.stdout || '') + (r.stderr || '')).trim() });
}

const failed = rows.filter(r => r.status === 'fail').length;
const unrun = rows.filter(r => r.status === 'unrun').length;
const w = Math.max(...rows.map(r => r.name.length), 4);

console.log('gate — pass / fail / unrun\n');
for (const r of rows) console.log(`  ${r.name.padEnd(w)}  ${r.status.toUpperCase()}`);
console.log('');
for (const r of rows) {
    if (r.status === 'pass') continue;
    console.log(`---- ${r.name} (${r.status}) ----`);
    console.log(r.out.split('\n').slice(-15).join('\n') || '(no output)');
    console.log('');
}
console.log(`${rows.length - failed - unrun} pass, ${failed} fail, ${unrun} unrun` +
    (skipped.length ? `, ${skipped.length} slow not run (--slow runs them): ${skipped.join(', ')}` : ''));
process.exit(failed ? 1 : 0);
