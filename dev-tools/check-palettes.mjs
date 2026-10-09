#!/usr/bin/env node
// Palette contrast check — is a puzzle's board actually visible in every style?
//
// The owner's report (2026-10-09): "Show board background does not seem to work in many styles — it
// seems invisible for a lot of styles." The cause was that the board surface came from the palette's
// first *cell* colour instead of the palette's `bg`, and several of those sit within a few RGB steps
// of the page background, so the board was drawn in a colour indistinguishable from the page.
//
// This check makes that measurable instead of a matter of opinion: for every palette, in both
// themes, it compares the board surface `resolveChrome()` returns against the page background
// `--gdp-bg` from `shared/gdp-theme.css`, and fails below MIN_DISTANCE. A style that fails here will
// look like a page with no board, which is exactly the owner's complaint.
//
// Run from the gate (`dev-tools/check-all.mjs`) and by hand: `node dev-tools/check-palettes.mjs`.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PALETTES, resolveChrome } from '../shared/gdp-palettes.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// How far apart two colours must be, as the average per-channel distance (0..255). 12 is roughly
// "you can see the edge without looking for it"; raise it if the owner still cannot see a board.
const MIN_DISTANCE = 12;

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
    const hex = s.match(/^#([0-9a-f]{6})$/i);
    if (hex) {
        const n = parseInt(hex[1], 16);
        return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    }
    const rgb = s.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
    if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
    return null;
};
const distance = (a, b) => Math.round((Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])) / 3);

let failures = 0;
const rows = [];
for (const id of Object.keys(PALETTES)) {
    for (const theme of ['light', 'dark']) {
        const surface = parse(resolveChrome(id, theme).surface);
        const page = parse(pageBg[theme]);
        if (!surface || !page) { console.log(`  ${id} ${theme}: could not parse a colour`); failures++; continue; }
        const d = distance(surface, page);
        const ok = d >= MIN_DISTANCE;
        if (!ok) failures++;
        rows.push({ id, theme, d, ok, surface: resolveChrome(id, theme).surface, page: pageBg[theme] });
    }
}

const w = Math.max(...rows.map((r) => r.id.length), 4);
console.log(`palette contrast — board surface vs --gdp-bg (minimum ${MIN_DISTANCE})\n`);
for (const r of rows) {
    console.log(`  ${r.id.padEnd(w)}  ${r.theme.padEnd(6)}  ${String(r.d).padStart(3)}  ${r.surface} on ${r.page}  ${r.ok ? 'ok' : 'TOO CLOSE'}`);
}
console.log('');
console.log(failures
    ? `${failures} palette/theme pair(s) too close to the page background — a board there looks invisible.`
    : `all ${rows.length} palette/theme pairs are visibly distinct from the page background.`);
process.exit(failures ? 1 : 0);
