#!/usr/bin/env node
// GoblinPuzzles — mechanical check that notes/ obeys the documentation contract.
// Run from the repo root: `node dev-tools/check-docs.mjs`. No deps, no network, no browser.
// Exits non-zero if anything fails.
//
// Checks the SHAPE of the documentation, not whether its content is true — that is the agent's job
// (notes/AGENTS.md R5/R9). This catches mechanical drift: a required document or subfolder missing,
// the top-level cap broken, a decision reference or local link pointing at nothing, the return-report
// block gone from AGENTS.md, or a decisions/ entry left orphaned outside its list in README.md.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// fileURLToPath, not new URL(...).pathname: the latter yields /C:/... on Windows, which
// path.resolve then turns into a broken \C:\... root.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NOTES = path.join(ROOT, 'notes');
const failures = [];
const warnings = [];
const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const read = (p) => fs.readFileSync(p, 'utf8');
const isArchive = (p) => rel(p).startsWith('notes/archive/');

function walk(dir, exts) {
    const out = [];
    if (!fs.existsSync(dir)) return out;
    for (const name of fs.readdirSync(dir)) {
        if (name === 'node_modules' || name === '.git') continue;
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) out.push(...walk(full, exts));
        else if (exts.some(e => name.endsWith(e))) out.push(full);
    }
    return out;
}

// ---------- Check 1: the required documents exist ----------
const REQUIRED = ['AGENTS.md', 'README.md', 'state.md', 'testing.md', 'backlog.md', 'history.md'];
for (const name of REQUIRED) {
    if (!fs.existsSync(path.join(NOTES, name))) {
        failures.push(`[missing document] notes/${name} is required and does not exist`);
    }
}

// ---------- Check 2: the top-level document cap (R12) ----------
{
    const CAP = 7;
    if (fs.existsSync(NOTES)) {
        const docs = fs.readdirSync(NOTES, { withFileTypes: true })
            .filter(d => d.isFile() && d.name.endsWith('.md')).map(d => d.name).sort();
        if (docs.length > CAP) {
            failures.push(`[document cap] notes/ has ${docs.length} top-level .md files (${docs.join(', ')}); the cap is ${CAP} (R12). Merge or retire one.`);
        }
    }
}

// ---------- Check 3: required subfolders and their entry files ----------
{
    const subs = [
        ['interfaces', 'interfaces/README.md'],
        ['tracks', 'tracks/_template.md'],
        ['decisions', 'decisions'],
    ];
    for (const [dir, entry] of subs) {
        if (!fs.existsSync(path.join(NOTES, dir))) {
            failures.push(`[missing subfolder] notes/${dir}/ is required`);
            continue;
        }
        if (entry.endsWith('.md') && !fs.existsSync(path.join(NOTES, entry))) {
            failures.push(`[missing document] notes/${entry} is required`);
        }
    }
}

// ---------- Check 4: every decisions/<file> reference resolves ----------
{
    const refRe = /decisions\/([0-9A-Za-z._-]+\.md)/g;
    for (const file of walk(NOTES, ['.md'])) {
        if (isArchive(file)) continue;
        const text = read(file);
        let m;
        while ((m = refRe.exec(text))) {
            if (!fs.existsSync(path.join(NOTES, 'decisions', m[1]))) {
                failures.push(`[dead decision reference] ${rel(file)} points at decisions/${m[1]} -> not found`);
            }
        }
    }
}

// ---------- Check 5: relative markdown links resolve ----------
{
    const linkRe = /\[[^\]]*\]\(([^)]+)\)/g;
    for (const file of walk(NOTES, ['.md'])) {
        if (isArchive(file)) continue;
        const text = read(file);
        let m;
        while ((m = linkRe.exec(text))) {
            const raw = m[1].trim();
            if (/^(https?:|mailto:|#)/.test(raw)) continue;
            const target = path.normalize(path.join(path.dirname(file), raw.split('#')[0]));
            if (!fs.existsSync(target)) {
                failures.push(`[dead link] ${rel(file)} links to '${raw}' -> not found`);
            }
        }
    }
}

// ---------- Check 6: no live pointer to a retired document ----------
// overview.md was split (v8); notes/research/ moved into decisions/ + archive/. history.md is
// append-only and archive/ is a frozen record, so both may still name them.
{
    const RETIRED = [/overview\.md/g, /notes\/research\//g];
    const allowed = new Set([
        rel(path.join(NOTES, 'history.md')),
        'dev-tools/check-docs.mjs',
    ]);
    for (const file of walk(ROOT, ['.md', '.mjs', '.js', '.html'])) {
        const r = rel(file);
        if (isArchive(file) || allowed.has(r)) continue;
        const text = read(file);
        for (const re of RETIRED) {
            let m;
            while ((m = re.exec(text))) {
                failures.push(`[stale pointer] ${r} still refers to '${m[0]}' — retired in the v8 split`);
            }
        }
    }
}

// ---------- Check 7: AGENTS.md keeps the return-report block (R14) ----------
{
    const agents = path.join(NOTES, 'AGENTS.md');
    if (fs.existsSync(agents) && !/^##\s+Return report\s*$/m.test(read(agents))) {
        failures.push('[missing shape] notes/AGENTS.md has no "## Return report" section (R14)');
    }
}

// ---------- Check 8: README.md decisions are nested under their list ----------
// The v11 list was structurally broken: 0002–0004 sat unindented, after the archive entry and the
// cap line. Every decision entry line in README.md must be indented under the decisions/ bullet.
{
    const readme = path.join(NOTES, 'README.md');
    if (fs.existsSync(readme)) {
        for (const line of read(readme).split('\n')) {
            if (/^\s*-\s+`?\d{4}[A-Za-z0-9._-]*\.md/.test(line) && !/^\s{2,}/.test(line)) {
                failures.push(`[shape] notes/README.md decision entry not indented under decisions/: "${line.trim()}"`);
            }
        }
    }
}

// ---------- Report ----------
console.log('Checked notes/ documentation.\n');
if (warnings.length) {
    console.log(`WARNINGS (${warnings.length}):`);
    for (const w of warnings) console.log('  ' + w);
    console.log('');
}
if (failures.length) {
    console.log(`FAILURES (${failures.length}):`);
    for (const f of failures) console.log('  ' + f);
    process.exit(1);
} else {
    console.log('No failures.');
    process.exit(0);
}
