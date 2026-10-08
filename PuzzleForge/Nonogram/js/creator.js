// Nonogram creator — the old Pictogram "Random" mode as its own page (notes/backlog.md
// "Random mode leaves Pictogram"). Random-seed generation only; picture puzzles stay in
// Pictogram's creator. Rules, generation and link format come from ../js/nonogram-logic.js
// (Pictogram's nono-utils.js + id-parser.js re-exported), so links open in either player.
import * as nono from './nonogram-logic.js';
import * as mathUtils from '../../../shared/gdp-math-utils.js';
import { applyTheme, setupThemeButton } from './util/settings.js';
import { setupFreshButton } from '../../../shared/gdp-fresh.js';

const MIN_GRID = 4;
const MAX_GRID = 25;
const $ = (id) => document.getElementById(id);

document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    setupThemeButton($('themeBtn'));
    setupFreshButton($('freshBtn'));
    $('createBtn').addEventListener('click', createNonogram);
    $('copyBtn').addEventListener('click', copyLink);
    $('secretText').addEventListener('input', updateSecretStatus);
    updateSecretStatus();
});

function showError(msg) {
    const div = $('errorDiv');
    div.textContent = msg || '';
    div.style.display = msg ? 'block' : 'none';
}

function updateSecretStatus() {
    const el = $('secretStatus');
    const text = $('secretText').value;
    const secret = nono.classifySecret(text);
    let msg = '', cls = 'text-info';
    if (!text) {
        msg = '';
    } else if (secret.kind === 'steamgifts') {
        msg = `SteamGifts link detected. Only the giveaway code (${secret.code}) is stored; the game name and any other text are dropped. Solvers will see a clickable link to this giveaway.`;
        cls = 'text-success';
    } else if (secret.kind === 'steamgifts-malformed') {
        msg = "This mentions SteamGifts but isn't a giveaway link in the form steamgifts.com/giveaway/XXXXX/ (the slash after the 5-character code is needed), so it will be stored as plain text and won't be clickable.";
        cls = 'text-warning';
    } else if (secret.kind === 'link') {
        msg = 'This looks like a web link, but only SteamGifts giveaway links become clickable. It will be shown as plain text.';
        cls = 'text-warning';
    } else {
        msg = 'Stored as plain text.';
        cls = 'gdp-muted';
    }
    el.textContent = msg;
    el.className = 'form-text ' + cls;
}

function createNonogram() {
    showError('');
    let secretText = $('secretText').value;
    if (!secretText) { showError('Please enter a secret message.'); return; }

    let msgType = 0;
    const secret = nono.classifySecret(secretText);
    if (secret.kind === 'steamgifts') {
        msgType = 1;
        secretText = secret.code;
    } else {
        const unsupported = Array.from(secretText).filter((ch) => !mathUtils.CHAR_TO_NUM.has(ch));
        if (unsupported.length > 0) {
            showError(`These characters aren't supported in the secret: ${Array.from(new Set(unsupported)).join(' ')}  (letters without accents, digits, punctuation and common French/Spanish accents are OK)`);
            return;
        }
    }

    let numRows = parseInt($('numRows').value, 10);
    let numCols = parseInt($('numCols').value, 10);
    if (isNaN(numRows) || numRows < MIN_GRID || numRows > MAX_GRID) numRows = 10;
    if (isNaN(numCols) || numCols < MIN_GRID || numCols > MAX_GRID) numCols = 10;

    const btn = $('createBtn');
    btn.disabled = true;
    btn.textContent = 'Building…';
    // let the button repaint before the synchronous uniqueness search runs
    setTimeout(() => {
        let id;
        try {
            id = nono.generateNonogram(numRows, numCols, secretText, msgType);
        } catch (e) {
            btn.disabled = false;
            btn.textContent = 'Create!';
            showError('Could not build a puzzle at this size. Try a smaller grid.');
            return;
        }
        btn.disabled = false;
        btn.textContent = 'Create!';

        const linkCmp = $('link');
        const link = nono.getPageURL(id);
        linkCmp.setAttribute('href', link);
        linkCmp.textContent = link;
        $('copyBtn').textContent = 'Copy link';
        $('linkDiv').style.display = 'block';
    }, 0);
}

function copyLink() {
    const link = $('link').textContent;
    const done = () => { $('copyBtn').textContent = 'Copied!'; };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(link).then(done, () => {});
    else {
        const ta = document.createElement('textarea');
        ta.value = link;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        done();
    }
}
