#!/usr/bin/env node
// Palette contract check — is a palette fit to draw a puzzle on?
//
// The palettes were invented by successive agents with no contract, so some of them draw things a
// player cannot see (owner report, 2026-10-09: "Show board background does not seem to work in many
// styles"). This file turns "does it look right" into numbers: for every palette in both themes it
// measures the pairs a puzzle actually draws, against the thresholds in `decisions/0006`.
//
// Two tiers:
//   - **enforced** pairs fail the gate (exit 1). Today that is the board-vs-page rule, which is the
//     defect the owner reported.
//   - **reported** pairs are the wider contract. They print as a worklist and do not fail the gate
//     until the palettes are tuned to them (the tuning pass lands with the given/mark/error roles).
//     `--strict` enforces every pair, which is how this file will run once that pass is done.
//
// Run from the gate (`dev-tools/check-all.mjs`) and by hand: `node dev-tools/check-palettes.mjs`.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PALETTES, resolveChrome } from '../shared/gdp-palettes.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const STRICT = process.argv.includes('--strict');

const css = fs.readFileSync(path.join(ROOT, 'shared', 'gdp-theme.css'), 'utf8');
const pageBg = {};
for (const m of css.matchAll(/html\[data-bs-theme="(dark|light)"\][^}]*?--gdp-bg:\s*([^;]+);/g)) {
    pageBg[m[1]] = m[2].trim();
}
if (!pageBg.dark || !pageBg.light) {
    console.error('check-palettes: could not read --gdp-bg for both themes from shared/gdp-theme.css');
    process.exit(1);
}

const parse = (s) => {
    if (Array.isArray(s)) return s;
    const hex = String(s).match(/^#([0-9a-f]{6})$/i);
    if (hex) { const n = parseInt(hex[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    const rgb = String(s).match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    return rgb ? [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])] : null;
};
const distance = (a, b) => Math.round((Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])) / 3);
const lin = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const ratio = (a, b) => { const x = lum(a), y = lum(b); const [hi, lo] = x > y ? [x, y] : [y, x]; return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100; };
const over = (fg, bg) => { const a = (fg[3] ?? 255) / 255; return [0, 1, 2].map((i) => Math.round(fg[i] * a + bg[i] * (1 - a))); };

// The contract (thresholds and reasons: decisions/0006-palette-roles-and-contrast.md).
const CONTRACT = [
    { role: 'board vs page background', min: 12, kind: 'distance', enforce: true,
      why: 'a board that matches the page is a board nobody can see',
      get: (p, ch, page) => [parse(ch.surface), parse(page)] },
    { role: 'ink on board', min: 4.5, kind: 'ratio', enforce: false,
      why: 'numbers and clues are text on the board',
      get: (p, ch) => [parse(ch.ink), parse(ch.surface)] },
    { role: 'muted ink on board', min: 3, kind: 'ratio', enforce: false,
      why: 'muted labels and hint numbers are still read',
      get: (p, ch) => [parse(p.textMuted), parse(ch.surface)] },
    { role: 'thin grid on board', min: 1.6, kind: 'ratio', enforce: false,
      why: '"Show grid" must show a grid',
      get: (p, ch) => [parse(p.lineThin), parse(ch.surface)] },
    { role: 'thick grid on board', min: 3, kind: 'ratio', enforce: false,
      why: 'block separators and the frame',
      get: (p, ch) => [parse(p.lineThick), parse(ch.surface)] },
    { role: 'accent on board', min: 4.5, kind: 'ratio', enforce: false,
      why: 'a filled marker (lamp, sea, node) must be visible on the board',
      get: (p, ch) => [parse(ch.accent), parse(ch.surface)] },
    { role: 'accent ink on accent', min: 4.5, kind: 'ratio', enforce: false,
      why: 'anything drawn on top of an accent marker',
      get: (p, ch) => [parse(ch.accentInk), parse(ch.accent)] },
    { role: 'mark colour on board', min: 4.5, kind: 'ratio', enforce: false,
      why: 'x / dot marks and the excluded state',
      get: (p, ch) => [parse(p.excludedColor), parse(ch.surface)] },
    { role: 'hover vs board', min: 8, kind: 'distance', enforce: false,
      why: 'the pointer highlight must be noticeable',
      get: (p, ch) => [over(parse(p.hover), parse(ch.surface)), parse(ch.surface)] },
    { role: 'cell base vs board', min: 10, kind: 'distance', enforce: false,
      why: 'an unfilled cell must still read as a cell (Pictogram/Nonogram)',
      get: (p, ch) => [parse(p.cells[0]), parse(ch.surface)] }
];

let enforcedFailures = 0, contractFailures = 0;
const worklist = new Map();   // role -> how many palette/theme pairs fail it
const rows = [];
for (const id of Object.keys(PALETTES)) {
    for (const theme of ['light', 'dark']) {
        const palette = PALETTES[id].both || PALETTES[id][theme] || PALETTES[id].dark;
        const ch = resolveChrome(id, theme);
        const failed = [];
        for (const c of CONTRACT) {
            const [a, b] = c.get(palette, ch, pageBg[theme]);
            if (!a || !b) { failed.push(c.role + ' (unparsable colour)'); enforcedFailures++; continue; }
            const value = c.kind === 'ratio' ? ratio(a, b) : distance(a, b);
            if (value >= c.min) continue;
            failed.push(`${c.role} ${value} < ${c.min}`);
            contractFailures++;
            worklist.set(c.role, (worklist.get(c.role) || 0) + 1);
            if (c.enforce) enforcedFailures++;
        }
        rows.push({ id, theme, failed });
    }
}

console.log('palette contract — board visibility (enforced) + the wider contract (reported)');
console.log(`thresholds: decisions/0006   ·   ${Object.keys(PALETTES).length} palettes × 2 themes\n`);
for (const r of rows) {
    if (!r.failed.length) { console.log(`  ${r.id.padEnd(12)} ${r.theme.padEnd(6)} ok`); continue; }
    console.log(`  ${r.id.padEnd(12)} ${r.theme.padEnd(6)} ${r.failed.join('; ')}`);
}
console.log('');
if (contractFailures) {
    console.log('worklist (below the contract, to be tuned with the given/mark/error roles):');
    for (const [role, n] of [...worklist.entries()].sort((a, b) => b[1] - a[1])) {
        console.log(`  ${String(n).padStart(3)} pair(s)  ${role}`);
    }
    console.log('');
}
if (enforcedFailures) {
    console.log(`${enforcedFailures} enforced failure(s): a board that cannot be told apart from the page.`);
} else if (contractFailures && !STRICT) {
    console.log(`no enforced failures; ${contractFailures} pair(s) on the worklist (run with --strict to fail on them).`);
} else if (contractFailures) {
    console.log(`${contractFailures} pair(s) below the contract (--strict).`);
} else {
    console.log(`all ${rows.length} palette/theme pairs meet the contract.`);
}
process.exit(enforcedFailures || (STRICT && contractFailures) ? 1 : 0);

