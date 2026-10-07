// Loads a Pictogram puzzle link in headless Chromium and checks a few things no Node test can:
// board size display, instructions text, no page errors, and that "Clear saved progress" only
// clears progress-prefixed keys, never settings. See README.md in this folder for usage and
// for the environment-path caveat.
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const PLAYWRIGHT_PATH = process.env.PLAYWRIGHT_PATH || '/home/claude/.npm-global/lib/node_modules/playwright/index.mjs';
const CHROMIUM_PATH = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const { chromium } = await import(PLAYWRIGHT_PATH);

const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.ico': 'image/x-icon' };
function serve(root, port) {
    return new Promise(res => {
        const s = http.createServer((req, rs) => {
            const u = decodeURIComponent(req.url.split('?')[0]);
            const f = path.join(root, u);
            if (!f.startsWith(root) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rs.writeHead(404); rs.end('nf'); return; }
            rs.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'text/plain' });
            fs.createReadStream(f).pipe(rs);
        }).listen(port, () => res(s));
    });
}

const [root, port, id] = [process.argv[2], process.argv[3], process.argv[4]];
if (!root || !port || !id) {
    console.error('Usage: node smoke-player.mjs <repo-root-abs-path> <port> <puzzle-id>');
    process.exit(1);
}
const stubPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'p5stub.js');
const stub = fs.readFileSync(stubPath, 'utf8');

const server = await serve(root, +port);
const browser = await chromium.launch({ executablePath: CHROMIUM_PATH, args: ['--no-sandbox'] });
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(e.message));
page.on('dialog', d => d.accept()); // the "Clear saved progress?" confirm()

await page.route(/cdnjs\.cloudflare\.com.*p5/, r => r.fulfill({ contentType: 'text/javascript', body: stub }));
await page.route(/cdn\.jsdelivr\.net/, r => r.abort()); // Bootstrap CSS/JS unavailable in this sandbox — see notes/testing.md

await page.goto(`http://localhost:${port}/Pictogram/index.html?id=${id}`);
await page.waitForTimeout(600);

const out = {};
out.size = await page.evaluate(() => document.getElementById('sizeDiv')?.textContent?.trim() ?? '(no sizeDiv)');
out.instructions = await page.evaluate(() => document.getElementById('instructions').innerText);

// "Clear saved progress" must remove progress-prefixed keys but leave settings untouched.
await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('gdp-pictogram-settings', JSON.stringify({ board: 'ocean', mark: 'dot' }));
    localStorage.setItem('gdp-pictogram:someid', 'progress');
});
await page.click('#clearProgressBtn');
await page.waitForTimeout(100);
out.afterClear = await page.evaluate(() => ({
    settings: localStorage.getItem('gdp-pictogram-settings'),
    progress: localStorage.getItem('gdp-pictogram:someid') // should be null — this key WAS prefixed and should be cleared
}));
out.errors = errors;

console.log(JSON.stringify(out, null, 1));
await browser.close();
server.close();
process.exit(0);
