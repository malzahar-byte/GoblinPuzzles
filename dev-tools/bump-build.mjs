// GoblinPuzzles - step GDP_BUILD (and every ?v=) by one patch, per AGENTS.md R7.
//
// Every commit - save points included - ships a new build string, so the GitHub Pages cache and
// the modules it imports can never hand back an old copy. This tool is the whole version bump:
// it changes shared/gdp-fresh.js and re-points every ?v=<build> in the first-party assets in the
// same pass.
//
// Usage:
//   node dev-tools/bump-build.mjs              # 13.0.0logic -> 13.0.1logic
//   node dev-tools/bump-build.mjs minor        # 13.0.1logic -> 13.1.0logic
//   node dev-tools/bump-build.mjs major        # 13.1.0logic -> 14.0.0logic
//   node dev-tools/bump-build.mjs --set 13.1.0logic   # owner calls a big version
//
// Docs (notes/) are never rewritten here: old builds named in history.md are history. state.md is
// updated by hand when it names the current build.

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FRESH = path.join(ROOT, 'shared', 'gdp-fresh.js');
const SKIP_DIRS = new Set(['.git', 'node_modules', 'notes', 'dev-tools']);
const EXT = new Set(['.html', '.js', '.mjs', '.css']);

const argv = process.argv.slice(2);
const setIdx = argv.indexOf('--set');
const how = setIdx >= 0 ? null : (argv[0] === 'major' || argv[0] === 'minor' ? argv[0] : 'patch');

const fresh = fs.readFileSync(FRESH, 'utf8');
const m = fresh.match(/GDP_BUILD\s*=\s*'([^']+)'/);
if (!m) { console.error('bump-build: no GDP_BUILD found in shared/gdp-fresh.js'); process.exit(1); }
const oldBuild = m[1];

let next;
if (setIdx >= 0) {
    next = argv[setIdx + 1];
    if (!next) { console.error('bump-build: --set needs a version, e.g. --set 13.1.0logic'); process.exit(1); }
} else {
    const v = oldBuild.match(/^(\d+)\.(\d+)\.(\d+)(.*)$/);
    if (!v) { console.error('bump-build: cannot parse build "' + oldBuild + '" (use --set)'); process.exit(1); }
    let [maj, min, pat] = [Number(v[1]), Number(v[2]), Number(v[3])];
    if (how === 'major') { maj++; min = 0; pat = 0; }
    else if (how === 'minor') { min++; pat = 0; }
    else pat++;
    next = maj + '.' + min + '.' + pat + v[4];
}
if (next === oldBuild) { console.error('bump-build: build is already ' + oldBuild); process.exit(1); }

fs.writeFileSync(FRESH, fresh.replace(m[0], "GDP_BUILD = '" + next + "'"));

const urlOld = '?v=' + oldBuild, urlNew = '?v=' + next;
let files = 0, urls = 0;
const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.name.startsWith('.')) continue;
        const p = path.join(dir, e.name);
        if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(p); continue; }
        if (!EXT.has(path.extname(e.name))) continue;
        const s = fs.readFileSync(p, 'utf8');
        const n = s.split(urlOld).length - 1;
        if (!n) continue;
        fs.writeFileSync(p, s.split(urlOld).join(urlNew));
        files++; urls += n;
    }
};
walk(ROOT);
if (!urls) { console.error('bump-build: no "' + urlOld + '" found - is the tree already stepped?'); process.exit(1); }
console.log('bump-build: ' + oldBuild + ' -> ' + next + ' (' + urls + ' URLs in ' + files + ' files)');
