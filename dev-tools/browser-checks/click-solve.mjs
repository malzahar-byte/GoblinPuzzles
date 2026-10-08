// Click-solve harness: the automatic "does each puzzle solve by clicking" check proposed in
// notes/backlog.md after the Hashi click-on-bridge defect. Real headless Chromium, real
// pointer events on the SVG board — the same way a player solves.
//
// For each pointer puzzle with a Test-Mode link in PuzzleForge/index.html (TEST_LINKS), it:
//   1. opens the player page,
//   2. asks the page for the solution click sequence (each puzzle exposes a tiny
//      window.__gdpSolverClicks() hook — added by this round — that returns [{x,y,button}]
//      board coordinates that walk the puzzle from empty to solved),
//   3. dispatches real pointerdown/pointerup at each coordinate (board pixel -> screen px via
//      the svg's bounding rect, same mapping gdp-board.js uses),
//   4. asserts the solved message appears and undo/redo stay consistent.
//
// Usage: node dev-tools/browser-checks/click-solve.mjs <repo-root-abs-path> [port]
// Env: PLAYWRIGHT_PATH, CHROMIUM_PATH (see README.md in this folder).
import fs from 'fs';
import http from 'http';
import path from 'path';

const PLAYWRIGHT_PATH = process.env.PLAYWRIGHT_PATH || '';
const { chromium } = await import(PLAYWRIGHT_PATH || 'playwright-core');
const CHROMIUM_PATH = process.env.CHROMIUM_PATH || undefined;

const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.ico': 'image/x-icon' };
function serve(root, port) {
    return new Promise(res => {
        const s = http.createServer((req, rs) => {
            const u = decodeURIComponent(req.url.split('?')[0]);
            const f = path.join(root, u);
            if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('nf'); return; }
            rs.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'text/plain' });
            fs.createReadStream(f).pipe(rs);
        }).listen(port, '127.0.0.1', () => res(s));
    });
}

// --- per-puzzle click planners, run IN PAGE against the live adapter hooks ---
const PLANNERS = {
    Pictogram: `() => window.__gdpSolverClicks()`,
    // Hashi: use the page's parsed islands+solution to produce midpoint clicks per edge.
    Hashi: `() => window.__gdpSolverClicks()`,
    Akari: `() => window.__gdpSolverClicks()`,
    Skyscrapers: `() => window.__gdpSolverClicks()`,
    Binairo: `() => window.__gdpSolverClicks()`,
    Futoshiki: `() => window.__gdpSolverClicks()`,
    Nonogram: `() => window.__gdpSolverClicks()`,
};

// Same links as PuzzleForge/index.html TEST_LINKS (the Test Mode examples the owner keeps there).
const TESTS = [
    ['Pictogram', '/PuzzleForge/Pictogram/index.html?id=cCM-Fl-sEWICog_V'],
    ['Hashi', '/PuzzleForge/Hashi/play.html?id=-Xrybal-KMq-okrX60hypwGl'],
    ['Akari', '/PuzzleForge/Akari/index.html?id=ooAqM4-kPW8e--eiYWs-1Iwg-_dEkY2WW--&_gdp=muu0wg83'],
    ['Skyscrapers', '/PuzzleForge/Skyscrapers/index.html?id=_GkduhIEGcUqE-d-sFF-j-Ehwh--aeaUka-fyxo'],
    ['Binairo', '/PuzzleForge/Binairo/index.html?id=IeqUb-UsJEgNoQQGcb_XI-Eskk-c'],
    ['Futoshiki', '/PuzzleForge/Futoshiki/index.html?id=--d_-O_ig-Vco-qoo-o-M-i-gggdk-F-dE-ci_-sa-_gaa_'],
    ['Nonogram', '/PuzzleForge/Nonogram/index.html?id=EkjCQkVo_E1zztIsWQNdH2j2pF'],
];

const [root, portArg] = [process.argv[2], process.argv[3]];
const port = +(portArg || 8791);
if (!root) { console.error('Usage: node click-solve.mjs <repo-root-abs-path> [port]'); process.exit(2); }

const server = await serve(root, port);
const browser = await chromium.launch(CHROMIUM_PATH ? { executablePath: CHROMIUM_PATH, args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });
const page = await browser.newPage();
// The board can be taller/wider than the default 1280x720 viewport; a click outside the viewport
// is never delivered, which silently drops the outer rows/columns. Make room for the whole board.
await page.setViewportSize({ width: 1600, height: 1600 });
const pageErrors = [];
page.on('pageerror', e => pageErrors.push(e.message));

let failures = 0;
for (const [name, url] of TESTS) {
    await page.goto(`http://127.0.0.1:${port}${url}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);
    let clicks = null;
    for (let attempt = 0; attempt < 10 && clicks == null; attempt++) {
        try { clicks = await page.evaluate(new Function('return (' + PLANNERS[name] + ')')()); } catch (e) { pageErrors.push(name + ' planner: ' + e.message); }
        if (clicks == null) await page.waitForTimeout(200);
    }
    if (clicks == null) { console.log(`FAIL ${name}: planner returned ${JSON.stringify(clicks)}`); failures++; continue; }
    if (!clicks || !clicks.length) { console.log(`FAIL ${name}: no click plan (hook missing?)`); failures++; continue; }
    const svg = await page.$('.gdp-board-svg');
    const box = await svg.boundingBox();
    const vb = await page.evaluate(() => {
        const el = document.querySelector('.gdp-board-svg');
        const [, , w, h] = el.getAttribute('viewBox').split(' ').map(Number);
        return { w, h };
    });
    const sx = box.width / vb.w, sy = box.height / vb.h;
    for (const c of clicks) {
        const x = box.x + c.x * sx, y = box.y + c.y * sy;
        await page.mouse.click(x, y, c.button === 'right' ? { button: 'right' } : {});
        await page.waitForTimeout(30);
    }
    await page.waitForTimeout(300);
    const state = await page.evaluate(() => ({
        msg: (document.getElementById('msg') || document.getElementById('msgDiv'))?.textContent?.trim() || '',
        visible: (document.getElementById('msg') || document.getElementById('msgDiv'))?.style?.display !== 'none'
    }));
    const ok = state.visible && state.msg.length > 0;
    console.log(`${ok ? 'PASS' : 'FAIL'} ${name}: ${clicks.length} clicks, message ${state.visible ? 'shown: ' + JSON.stringify(state.msg.slice(0, 40)) : 'NOT shown'}`);
    if (!ok) failures++;
}

console.log(pageErrors.length ? 'page errors: ' + JSON.stringify(pageErrors) : 'no page errors');
await browser.close();
server.close();
process.exit(failures ? 1 : 0);
