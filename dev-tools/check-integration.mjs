#!/usr/bin/env node
// Goblin Does Puzzles — mechanical check that puzzles are actually wired into shared/ correctly,
// instead of each one reimplementing settings/theme or drifting out of sync. Run from the repo
// root: `node dev-tools/check-integration.mjs`. No deps, no network, no browser — just the
// filesystem. Exits non-zero if anything fails.
//
// This does NOT replace reading AGENTS.md, and it is not a test suite to run on every task —
// see AGENTS.md R9. It only catches the specific mistakes this tool was built to catch (listed in
// README.md next to this file), nothing broader.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// fileURLToPath, not new URL(...).pathname: the latter yields /C:/... on Windows, which
// path.resolve then turns into a broken \C:\... root.
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'notes', 'original-upstream', 'puzzle-template']);

function walk(dir, exts) {
    const out = [];
    for (const name of fs.readdirSync(dir)) {
        if (SKIP_DIRS.has(name)) continue;
        const full = path.join(dir, name);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) out.push(...walk(full, exts));
        else if (exts.some(e => name.endsWith(e))) out.push(full);
    }
    return out;
}

const allFiles = walk(ROOT, ['.js', '.mjs', '.html']);
const jsHtmlFiles = allFiles; // same set, kept as one list for the checks below
const failures = [];
const warnings = [];

// ---------- Check 1: every relative import resolves to a real file ----------
{
    const importRe = /(?:from|import)\s+['"](\.\.?\/[^'"]+)['"]/g;
    for (const file of jsHtmlFiles) {
        const text = fs.readFileSync(file, 'utf8');
        let m;
        while ((m = importRe.exec(text))) {
            const spec = m[1].split('?')[0].split('#')[0];
            const target = path.normalize(path.join(path.dirname(file), spec));
            if (!fs.existsSync(target)) {
                failures.push(`[broken import] ${path.relative(ROOT, file)} imports '${m[1]}' -> not found at ${path.relative(ROOT, target)}`);
            }
        }
    }
}

// ---------- Check 2: a settings-key string literal must appear in exactly one DEFINING file,
// plus it's allowed (not ideal, but allowed) to be repeated inside an inline pre-paint <script>
// in an .html page, because that snippet must run before ES modules load and can't import. Any
// other repeat — a second JS file, or an .html occurrence that isn't the pre-paint pattern — is
// a real failure, since it means the key can drift out of sync silently. ----------
{
    const keyRe = /gdp-[a-z0-9-]+-settings/g;
    const definesKeyRe = (key) => new RegExp(`const\\s+KEY\\s*=\\s*['"]${key}['"]`);
    const prebootRe = (key) => new RegExp(`localStorage\\.getItem\\(['"]${key}['"]\\)`);

    // dev-tools/ scripts (Node tests, browser-check fixtures) legitimately reference a real
    // settings-key string as test data without importing the app's settings module — that's not
    // the "drifted out of sync" bug this check is for, so they're excluded from it specifically
    // (Check 1's import-resolution check still runs on them, just not this one).
    const isToolingFile = (f) => path.relative(ROOT, f).split(path.sep)[0] === 'dev-tools';

    const byKey = new Map(); // key -> Set(files)
    for (const file of jsHtmlFiles) {
        if (isToolingFile(file)) continue;
        const text = fs.readFileSync(file, 'utf8');
        const found = new Set(text.match(keyRe) || []);
        for (const key of found) {
            if (!byKey.has(key)) byKey.set(key, new Set());
            byKey.get(key).add(file);
        }
    }

    for (const [key, files] of byKey) {
        const defining = [...files].filter(f => f.endsWith('settings.js') && definesKeyRe(key).test(fs.readFileSync(f, 'utf8')));
        const rest = [...files].filter(f => !defining.includes(f));

        if (defining.length === 0) {
            failures.push(`[settings key has no home] '${key}' is used but no settings.js defines it with 'const KEY = ...' — every key needs exactly one defining file.`);
            continue;
        }
        if (defining.length > 1) {
            failures.push(`[settings key defined twice] '${key}' is defined as KEY in ${defining.length} different settings.js files: ${defining.map(f => path.relative(ROOT, f)).join(', ')}`);
        }

        const illegitimate = rest.filter(f => !(f.endsWith('.html') && prebootRe(key).test(fs.readFileSync(f, 'utf8'))));
        if (illegitimate.length) {
            const list = illegitimate.map(f => path.relative(ROOT, f)).join(', ');
            failures.push(`[settings key hardcoded elsewhere] '${key}' appears outside its settings.js (and outside a valid pre-paint snippet) in: ${list} — import SETTINGS_KEY instead of retyping the string.`);
        }
    }
}

// ---------- Check 3: every real page is wired to shared settings/theme ----------
{
    // "a real page": an .html file with an <html ...> tag, outside shared/ itself.
    const pages = jsHtmlFiles.filter(f => f.endsWith('.html') && !path.relative(ROOT, f).startsWith('shared' + path.sep))
        .filter(f => !path.relative(ROOT, f).startsWith('dev-tools' + path.sep + 'browser-checks' + path.sep))
        .filter(f => /<html[\s>]/i.test(fs.readFileSync(f, 'utf8')));

    // Collect every file reachable from a page: itself, any <script src="...">/<link href="...">
    // it loads, and (recursively, relative imports only) anything THOSE files import.
    function reachableFrom(startFile) {
        const seen = new Set();
        const queue = [startFile];
        while (queue.length) {
            const file = queue.shift();
            if (seen.has(file) || !fs.existsSync(file)) continue;
            seen.add(file);
            const text = fs.readFileSync(file, 'utf8');
            const refs = [];
            for (const m of text.matchAll(/<(?:script|link)[^>]+(?:src|href)=["']([^"']+)["']/g)) refs.push(m[1]);
            for (const m of text.matchAll(/(?:from|import)\s+['"](\.\.?\/[^'"]+)['"]/g)) refs.push(m[1]);
            for (const ref of refs) {
                if (/^https?:\/\//.test(ref)) continue; // external, not ours to check
                const spec = ref.split('?')[0].split('#')[0];
                const target = path.normalize(path.join(path.dirname(file), spec));
                if (!seen.has(target)) queue.push(target);
            }
        }
        return seen;
    }

    for (const page of pages) {
        const reached = reachableFrom(page);
        const names = [...reached].map(f => path.basename(f));
        const hasSettings = names.includes('gdp-settings.js');
        const hasThemeCss = names.includes('gdp-theme.css');
        const inlineText = fs.readFileSync(page, 'utf8');
        const hasPreboot = /localStorage\.getItem\(['"]gdp-[a-z0-9-]+-settings['"]\)/.test(inlineText);

        const rel = path.relative(ROOT, page);
        if (!hasSettings) failures.push(`[no shared settings] ${rel} never reaches shared/gdp-settings.js (checked its own <script>/<link> tags and their imports, up to full depth)`);
        if (!hasThemeCss) warnings.push(`[no shared theme CSS] ${rel} does not link shared/gdp-theme.css`);
        if (!hasPreboot) warnings.push(`[no pre-paint snippet] ${rel} has no inline pre-paint theme script (see shared/puzzle-template/preboot-snippet.html) — it will flash the wrong theme on load`);
    }
}

// ---------- Report ----------
console.log(`Checked ${jsHtmlFiles.length} files.\n`);

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
