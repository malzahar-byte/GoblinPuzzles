#!/usr/bin/env node
// Palette contract check — is a palette fit to draw a puzzle on?
//
// The palettes were written by successive agents with no statement of what they must do, and several
// of their values drew things a player cannot see (owner report, 2026-10-09: "Show board background
// does not seem to work in many styles"). `decisions/0006` fixes the contract; this file measures it.
//
// Every role `resolveChrome()` returns is measured against the floor for what it is used for:
// text needs 4.5:1, a graphic or a large label 3:1 (WCAG 1.4.11), the thin grid 1.6:1 (a line, not
// text), and things that merely have to look *different* (board vs page, a given cell vs the board)
// need a distance of 8-12. A failure here is a colour a player cannot see — so it fails the build.
//
// Usage: node dev-tools/check-palettes.mjs            (enforce; this is the gate row)
//        node dev-tools/check-palettes.mjs --report   (print the table, exit 0 — for colour work)
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PALETTES, resolveChrome, buildCellFill } from '../shared/gdp-palettes.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REPORT_ONLY = process.argv.includes('--report');

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

// role -> [what it draws, the floor, how it is measured]
const CONTRACT = [
    ['board vs page background', 'the board itself', 12, 'distance', (p, ch, page) => [ch.surface, page]],
    ['ink on board', 'numbers, clues, letters', 4.5, 'ratio', (p, ch) => [ch.ink, ch.surface]],
    ['muted ink on board', 'secondary labels, hint numbers', 3, 'ratio', (p, ch) => [ch.muted, ch.surface]],
    ['thin grid on board', 'the "Show grid" lines', 1.6, 'ratio', (p, ch) => [ch.grid, ch.surface]],
    ['thick grid on board', 'block separators, the frame', 3, 'ratio', (p, ch) => [ch.gridThick, ch.surface]],
    ['accent on board', 'a filled marker (lamp, sea, tower)', 3, 'ratio', (p, ch) => [ch.accent, ch.surface]],
    ['accent ink on accent', 'anything drawn on an accent marker', 4.5, 'ratio', (p, ch) => [ch.accentInk, ch.accent]],
    ['mark on board', 'x / dot on an excluded cell', 3, 'ratio', (p, ch) => [ch.mark, ch.surface]],
    ['candidate mark on board', 'the "(?)" pencil mark', 3, 'ratio', (p, ch) => [ch.markCandidate, ch.surface]],
    ['given vs board', 'a pre-filled cell wash', 12, 'distance', (p, ch) => [ch.given, ch.surface]],
    ['given vs accent', 'a pre-filled cell must not read as a chosen one', 12, 'distance', (p, ch) => [ch.given, ch.accent]],
    ['error on board', 'a cell/line that breaks a rule', 3, 'ratio', (p, ch) => [ch.error, ch.surface]],
    ['satisfied on board', 'a row/column count that is met', 3, 'ratio', (p, ch) => [ch.satisfied, ch.surface]],
    ['hover vs board', 'the pointer highlight', 8, 'distance', (p, ch) => [ch.over, ch.surface]],
    ['cell base vs board', 'an unfilled cell (Pictogram/Nonogram)', 10, 'distance', (p, ch) => [buildCellFill(p, [])[0][0], ch.surface]],
    ['solved vs board', 'the solved background', 1.6, 'ratio', (p, ch) => [ch.solved, ch.surface]]
];

const failures = [];
const rows = [];
for (const id of Object.keys(PALETTES)) {
    for (const theme of ['light', 'dark']) {
        const palette = PALETTES[id].both || PALETTES[id][theme] || PALETTES[id].dark;
        const ch = resolveChrome(id, theme);
        const failed = [];
        for (const [role, use, min, kind, get] of CONTRACT) {
            const [a, b] = get(palette, ch, pageBg[theme]).map(parse);
            if (!a || !b) { failed.push(`${role} (unparsable)`); failures.push({ id, theme, role }); continue; }
            const value = kind === 'ratio' ? ratio(a, b) : distance(a, b);
            if (value >= min) continue;
            failed.push(`${role} ${value} < ${min}`);
            failures.push({ id, theme, role, value, min });
        }
        rows.push({ id, theme, failed });
    }
}

console.log(`palette contract (decisions/0006) — ${Object.keys(PALETTES).length} palettes × 2 themes, ${CONTRACT.length} checks each\n`);
for (const r of rows) {
    console.log(`  ${r.id.padEnd(12)} ${r.theme.padEnd(6)} ${r.failed.length ? r.failed.join('; ') : 'ok'}`);
}
console.log('');
if (!failures.length) {
    console.log(`all ${rows.length * CONTRACT.length} checks pass: every role is visible in every style.`);
} else {
    const byRole = new Map();
    for (const f of failures) byRole.set(f.role, (byRole.get(f.role) || 0) + 1);
    console.log(`${failures.length} failure(s) — a colour a player cannot see:`);
    for (const [role, n] of [...byRole.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(3)} pair(s)  ${role}`);
}
process.exit(failures.length && !REPORT_ONLY ? 1 : 0);
