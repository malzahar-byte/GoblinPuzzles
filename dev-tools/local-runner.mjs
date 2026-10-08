// GoblinPuzzles - local runner, started by Run-Local.cmd at the folder root.
//
// Local-only tooling: it never changes the version and is not part of the published site.
//
// What it does:
//   - serves this folder on 127.0.0.1 and opens Chrome at the Forge,
//   - injects a small heartbeat into every page it serves, so it can tell when the browser is
//     closed and stop itself (the run window closes with it); it never stops mid-job,
//   - runs the jobs behind the "Local tests" buttons on the Forge page:
//       quick   -> node dev-tools/check-all.mjs                                    (the fast gate)
//       full    -> the gate, then the two slow Pictogram sweeps run directly with no time limit
//                  (those are the ones that cannot finish in the agents' sandbox)
//       browser -> node dev-tools/browser-checks/click-solve.mjs <folder> <port>   (all 8 puzzles)
//   - writes TEST-RESULTS.md at the folder root: newest run first, raw output included, so the
//     file can be copied back to the agents as the result.
//
// The browser job needs two things once: `npm install` for playwright-core (done by Run-Local.cmd)
// and a Chrome to drive (auto-detected, or point CHROMIUM_PATH at chrome.exe). The other jobs need
// nothing at all.
//
// Usage: node dev-tools/local-runner.mjs [--port N] [--no-open]

import fs from 'fs';
import http from 'http';
import net from 'net';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARGV = process.argv.slice(2);
const NO_OPEN = ARGV.includes('--no-open');
const portIdx = ARGV.indexOf('--port');
const START_PORT = portIdx >= 0 && Number(ARGV[portIdx + 1]) ? Number(ARGV[portIdx + 1]) : 8791;

const PING_INTERVAL_MS = 5000;   // how often a served page says "still here"
const BYE_GRACE_MS = 8000;       // after the page says "closed", wait this long for another page
const IDLE_GRACE_MS = 20000;     // no ping at all, after at least one was seen
const MAX_OUTPUT = 200 * 1024;   // per-job captured output kept (tail)
const KEEP_RUNS = 4;             // run sections kept in TEST-RESULTS.md
const RESULTS_FILE = path.join(ROOT, 'TEST-RESULTS.md');
const RESULTS_MARK = '<!-- runs -->';
const JOB_PORT_START = 8861;     // click-solve serves its own copy; keep it off our port

const TYPES = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript',
    '.css': 'text/css', '.json': 'application/json', '.md': 'text/markdown; charset=utf-8',
    '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff',
    '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8', '.map': 'application/json'
};

// Injected into every served page: pings while the page is open, says "bye" when it closes or
// navigates away. That is how the runner knows the browser is gone.
const HEARTBEAT = '<script>/* GoblinPuzzles local runner */\n'
    + '(function(){if(window.__gdpLocalPing)return;window.__gdpLocalPing=1;'
    + 'setInterval(function(){fetch(\'/__ping\',{cache:\'no-store\'}).catch(function(){})},' + PING_INTERVAL_MS + ');'
    + 'addEventListener(\'pagehide\',function(){try{navigator.sendBeacon(\'/__bye\',\'1\')}catch(e){}})})();'
    + '</script>';

// Find a browser to drive. Windows first: Chrome in the usual places (using the environment's
// program dirs, so a user- or drive-relocated install is still found), then Edge, which every
// Windows 10/11 machine has and which speaks the same protocol. The runner only needs one. 
// CHROMIUM_PATH always wins, and the last entries cover the agents' Linux sandbox.
function findChrome() {
    const env = process.env;
    const candidates = [env.CHROMIUM_PATH || ''];
    const programDirs = [env.ProgramFiles, env['ProgramFiles(x86)'], env.ProgramW6432, env.LOCALAPPDATA].filter(Boolean);
    for (const dir of programDirs) candidates.push(path.join(dir, 'Google', 'Chrome', 'Application', 'chrome.exe'));
    // The same spots on every other drive letter, in case the install is not on C:.
    for (const d of 'CDEFGHIJKLMNOPQRSTUVWXYZ') {
        candidates.push(d + ':\\Program Files\\Google\\Chrome\\Application\\chrome.exe');
        candidates.push(d + ':\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe');
    }
    for (const dir of programDirs) candidates.push(path.join(dir, 'Microsoft', 'Edge', 'Application', 'msedge.exe'));
    candidates.push('C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe');
    candidates.push('C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe');
    candidates.push('/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser');
    for (const c of candidates) {
        try { if (c && fs.existsSync(c)) return c; } catch (e) { /* unreadable path: try the next */ }
    }
    return '';
}

function readBuild() {
    try {
        const s = fs.readFileSync(path.join(ROOT, 'shared', 'gdp-fresh.js'), 'utf8');
        const m = s.match(/GDP_BUILD\s*=\s*'([^']+)'/);
        return m ? m[1] : 'unknown';
    } catch (e) { return 'unknown'; }
}

function json(res, obj) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify(obj));
}

// Listen, climbing to the next port if one is taken (so a second window never just dies).
function listenFree(server, start) {
    let port = start;
    return new Promise((resolve, reject) => {
        const attempt = () => {
            const onOk = () => { server.removeListener('error', onErr); resolve(port); };
            const onErr = err => {
                server.removeListener('listening', onOk);
                if (err.code === 'EADDRINUSE' && port < start + 30) { port += 1; attempt(); }
                else reject(err);
            };
            server.once('listening', onOk);
            server.once('error', onErr);
            server.listen(port, '127.0.0.1');
        };
        attempt();
    });
}

// A free port to hand to click-solve (it serves its own copy of the files).
function probeFreePort(start) {
    return new Promise(resolve => {
        let port = start;
        const attempt = () => {
            const s = net.createServer();
            s.once('error', () => { if (port < start + 30) { port += 1; attempt(); } else resolve(0); });
            s.once('listening', () => s.close(() => resolve(port)));
            s.listen(port, '127.0.0.1');
        };
        attempt();
    });
}

// ---------------------------------------------------------------------------
// Jobs

const JOBS = {
    quick: {
        label: 'Quick tests',
        steps: [
            { file: 'dev-tools/check-all.mjs', args: [], cmdline: 'node dev-tools/check-all.mjs' }
        ]
    },
    full: {
        label: 'Full tests - the gate, then the two slow Pictogram sweeps with no time limit',
        steps: [
            { file: 'dev-tools/check-all.mjs', args: [], cmdline: 'node dev-tools/check-all.mjs' },
            { file: 'PuzzleForge/Pictogram/dev-tools/test-image.mjs', args: [], cmdline: 'node PuzzleForge/Pictogram/dev-tools/test-image.mjs' },
            { file: 'PuzzleForge/Pictogram/dev-tools/test-roundtrip.mjs', args: [], cmdline: 'node PuzzleForge/Pictogram/dev-tools/test-roundtrip.mjs' }
        ]
    },
    browser: {
        label: 'Browser tests - all 8 puzzles, solved by real clicks in Chrome',
        steps: [
            { file: 'dev-tools/browser-checks/click-solve.mjs', args: [], cmdline: 'node dev-tools/browser-checks/click-solve.mjs' }
        ]
    }
};

let current = null; // the newest job: { name, state, startedAt, finishedAt, exit, output }

function runStep(step, env, entry) {
    return new Promise(resolve => {
        const child = spawn(process.execPath, [path.join(ROOT, step.file), ...step.args], { cwd: ROOT, env, windowsHide: true });
        const onData = d => {
            entry.output += d.toString();
            if (entry.output.length > MAX_OUTPUT) entry.output = entry.output.slice(-MAX_OUTPUT);
        };
        child.stdout.on('data', onData);
        child.stderr.on('data', onData);
        child.on('error', err => { entry.output += '\n' + String((err && err.message) || err); resolve(2); });
        child.on('close', code => resolve(code == null ? 1 : code));
    });
}

function finishJob(name, entry, code, note) {
    if (entry.state !== 'running') return { started: true };
    if (note) entry.output += (entry.output && !entry.output.endsWith('\n') ? '\n' : '') + note;
    entry.exit = code;
    entry.state = 'done';
    entry.finishedAt = new Date().toISOString();
    writeResult(name, entry);
    console.log('[job ' + name + '] ' + (code === 0 ? 'PASS' : 'FAIL') + ' (exit ' + code + ') -> TEST-RESULTS.md');
    return { started: true };
}

function writeResult(name, entry) {
    const spec = JOBS[name];
    const when = (entry.finishedAt || entry.startedAt).replace('T', ' ').slice(0, 19);
    const section = [
        '## ' + when + ' - ' + spec.label,
        '',
        '**' + (entry.exit === 0 ? 'PASS' : 'FAIL') + '** (exit ' + entry.exit + ') - build ' + readBuild() + ' - ' + process.platform,
        '',
        'Command: `' + (spec.cmdline || spec.steps.map(s => s.cmdline).join(' ; ')) + '`',
        '',
        '```',
        (entry.output || '(no output)').trim(),
        '```'
    ].join('\n');

    let body = '';
    try {
        const text = fs.readFileSync(RESULTS_FILE, 'utf8');
        const i = text.indexOf(RESULTS_MARK);
        body = i >= 0 ? text.slice(i + RESULTS_MARK.length) : text;
    } catch (e) { /* first run: no file yet */ }

    const sections = body.split('\n\n---\n\n').map(s => s.trim()).filter(Boolean);
    sections.unshift(section);
    const head = '# GoblinPuzzles - local test results\n\n'
        + 'Newest run first. Written by Run-Local.cmd / dev-tools/local-runner.mjs.\n'
        + 'Copy this file back to the agents when results need reporting.\n\n';
    fs.writeFileSync(RESULTS_FILE, head + RESULTS_MARK + '\n\n' + sections.slice(0, KEEP_RUNS).join('\n\n---\n\n') + '\n');
}

// Start a job and return straight away; the page polls /__status for progress.
function runJob(name) {
    if (current && current.state === 'running') return { error: 'a test is already running' };
    const spec = JOBS[name];
    if (!spec) return { error: 'unknown job: ' + name };
    const entry = { name, state: 'running', startedAt: new Date().toISOString(), finishedAt: '', exit: null, output: '' };
    current = entry;

    (async () => {
        const env = { ...process.env };
        let steps = spec.steps;
        if (name === 'browser') {
            const chrome = findChrome();
            if (!chrome) return finishJob(name, entry, 2, 'No Chrome or Edge found. Install Google Chrome (Edge already comes with Windows), then run again.');
            env.CHROMIUM_PATH = chrome;
            const p = await probeFreePort(JOB_PORT_START);
            if (!p) return finishJob(name, entry, 2, 'No free port found near ' + JOB_PORT_START + '.');
            entry.output = 'Chrome: ' + chrome + '\n';
            steps = [{ file: spec.steps[0].file, args: [ROOT, String(p)], cmdline: 'node dev-tools/browser-checks/click-solve.mjs <folder> ' + p }];
        }
        console.log('[job ' + name + '] started');
        let overall = 0;
        for (const step of steps) {
            entry.output += (entry.output && !entry.output.endsWith('\n') ? '\n' : '') + '===== ' + step.cmdline + ' =====\n';
            const code = await runStep(step, env, entry);
            entry.output += '\n(exit ' + code + ')\n';
            if (code !== 0) overall = 1;
        }
        finishJob(name, entry, overall, '');
    })().catch(err => finishJob(name, entry, 2, String((err && err.message) || err)));

    return { started: true };
}

// ---------------------------------------------------------------------------
// Serving, heartbeat, shutdown

function serveFile(req, res) {
    const u = new URL(req.url, 'http://127.0.0.1');
    let file = path.join(ROOT, decodeURIComponent(u.pathname));
    try {
        if (!file.startsWith(ROOT)) throw new Error('outside the folder');
        if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
        if (!fs.existsSync(file)) throw new Error('missing');
        const ext = path.extname(file).toLowerCase();
        if (ext === '.html') {
            let html = fs.readFileSync(file, 'utf8');
            const i = html.toLowerCase().lastIndexOf('</body>');
            html = i >= 0 ? html.slice(0, i) + HEARTBEAT + html.slice(i) : html + HEARTBEAT;
            res.writeHead(200, { 'Content-Type': TYPES['.html'], 'Cache-Control': 'no-store' });
            res.end(html);
            return;
        }
        res.writeHead(200, { 'Content-Type': TYPES[ext] || 'application/octet-stream' });
        fs.createReadStream(file).pipe(res);
    } catch (e) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Not found: ' + u.pathname);
    }
}

let sawPing = false;
let lastSeen = 0;
let byeAt = 0;
let shuttingDown = false;

function shutdown(reason) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log('\n' + reason + ' - stopping the local server.');
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 3000).unref();
}

const server = http.createServer(async (req, res) => {
    const u = new URL(req.url, 'http://127.0.0.1');
    if (u.pathname === '/__ping') { sawPing = true; lastSeen = Date.now(); byeAt = 0; res.writeHead(204); res.end(); return; }
    if (u.pathname === '/__bye') { sawPing = true; lastSeen = Date.now(); byeAt = Date.now(); res.writeHead(204); res.end(); return; }
    if (u.pathname === '/__status') {
        const addr = server.address();
        json(res, {
            local: true,
            port: addr && addr.port,
            build: readBuild(),
            job: current ? { name: current.name, state: current.state, exit: current.exit, output: current.output.slice(-4000) } : null
        });
        return;
    }
    if (u.pathname === '/__run') { json(res, runJob(u.searchParams.get('job'))); return; }
    serveFile(req, res);
});

setInterval(() => {
    if (shuttingDown) return;
    if (current && current.state === 'running') return;   // never stop in the middle of a job
    const now = Date.now();
    if (byeAt && now - byeAt > BYE_GRACE_MS) shutdown('Browser closed');
    else if (sawPing && now - lastSeen > IDLE_GRACE_MS) shutdown('Browser stopped responding');
}, 2000);

function openBrowser(url) {
    try {
        const chrome = findChrome();
        if (chrome) { spawn(chrome, [url], { detached: true, stdio: 'ignore' }).unref(); return; }
        if (process.platform === 'win32') { spawn('cmd', ['/c', 'start', '', url], { detached: true, stdio: 'ignore' }).unref(); return; }
        if (process.platform === 'darwin') { spawn('open', [url], { detached: true, stdio: 'ignore' }).unref(); return; }
        spawn('xdg-open', [url], { detached: true, stdio: 'ignore' }).unref();
    } catch (e) {
        console.log('Could not open a browser automatically. Open this address by hand: ' + url);
    }
}

const port = await listenFree(server, START_PORT);
const url = 'http://127.0.0.1:' + port + '/PuzzleForge/';
const chrome = findChrome();

console.log('GoblinPuzzles - local runner');
console.log('Serving:  ' + url);
console.log('Tests:    use the buttons in the "Local tests" section of the page.');
console.log('Results:  TEST-RESULTS.md, in this folder (linked on the page too).');
console.log('Browser:  ' + (chrome || 'no Chrome or Edge found - the Browser tests button will not work until one is installed'));
console.log('This window closes by itself when you close the browser.\n');

if (!NO_OPEN) openBrowser(url);
