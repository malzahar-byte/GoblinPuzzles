// Nonogram player. The rules, model and look live in Pictogram's pure modules, re-exported
// through ../js/nonogram-logic.js and nonogram-board.js; this file is the wire-up, adapted from
// Pictogram/js/player.js (timer, save points, toolbar, settings, message — all same behaviour).
//
// Key differences from Pictogram's player are only:
//  - empty id -> generate a RANDOM nonogram here and stay on THIS page (Pictogram keeps its
//    picture-creator flow; Random mode lives in Nonogram — notes/backlog.md);
//  - settings/progress keys are Nonogram's own (gdp-nonogram-*), so progress never mixes;
//  - "Create" returns to the Forge, and the build label is Nonogram's.

import * as nono from './nonogram-logic.js';
import { BOARD_STYLES, buildPalette } from './nonogram-board.js';
import { loadSettings, saveSettings, currentTheme, applyTheme, setupThemeButton, PROGRESS_PREFIX } from './util/settings.js';
import { setupSettingsDock, setupTooltips } from '../../../shared/gdp-ui.js';
import { mountBoard } from '../../../shared/gdp-board.js';
import { setupFreshButton } from '../../../shared/gdp-fresh.js';
import { createModel } from './nonogram-logic.js';
import { createNonogramAdapter } from './nonogram-board.js';

let id = new URLSearchParams(window.location.search).get('id');

// ----- puzzle -----

const RANDOM_MIN = 4;    // Pictogram's creator used the same bounds for Random mode
const RANDOM_MAX = 25;

function loadPuzzle() {
    if (!id) {
        id = nono.generateNonogram(10, 10, null, 0);
        window.history.pushState({}, '', `${window.location.pathname}?id=${id}`);
    }
    const infos = nono.parseId(id);
    const [horHints, verHints] = nono.getPuzzleFromInfos(infos);
    return { numRows: infos.numRows, numCols: infos.numCols, horHints, verHints, enc: infos.enc, msgType: infos.msgType };
}
const puzzle = loadPuzzle();
const model = createModel(puzzle);
let palette = null;
let markStyle = 'x';
let board = null;

// ----- settings -----

function applyPalette() { palette = buildPalette(loadSettings().board, currentTheme()); }
const getPalette = () => palette;
const getMarkStyle = () => markStyle;

function setupSettings() {
    const settings = loadSettings();
    markStyle = settings.mark === 'dot' ? 'dot' : 'x';

    const boardSelect = document.getElementById('boardSelect');
    for (const [key, style] of Object.entries(BOARD_STYLES)) {
        const option = document.createElement('option');
        option.value = key; option.textContent = style.label;
        boardSelect.appendChild(option);
    }
    boardSelect.value = BOARD_STYLES[settings.board] ? settings.board : 'classic';
    boardSelect.addEventListener('change', () => { saveSettings({ board: boardSelect.value }); applyPalette(); board.render(); });

    const markSelect = document.getElementById('markSelect');
    markSelect.value = markStyle;
    markSelect.addEventListener('change', () => { markStyle = markSelect.value; saveSettings({ mark: markStyle }); board.render(); });

    const showTimerCheck = document.getElementById('showTimerCheck');
    showTimerCheck.checked = settings.showTimer !== false;
    showTimerCheck.addEventListener('change', () => { saveSettings({ showTimer: showTimerCheck.checked }); renderTimer(); });

    applyTheme();
    setupThemeButton(document.getElementById('themeBtn'), () => { applyPalette(); board.render(); });
    applyPalette();

    setupSettingsDock(document.getElementById('settingsDock'));
    setupTooltips();
}

// ----- progress storage (keys all start with PROGRESS_PREFIX) -----

const progressKey = (suffix = '') => PROGRESS_PREFIX + id + suffix;
const checkpointKey = () => progressKey('#checkpoint');

function saveState() {
    if (model.ended) return;
    try { localStorage.setItem(progressKey(), model.encodeState()); } catch (e) { /* storage blocked */ }
}
function deleteState() { localStorage.removeItem(progressKey()); }

function loadState() {
    const encoded = localStorage.getItem(progressKey());
    if (encoded) {
        try { model.decodeState(encoded); } catch (e) { /* ignore corrupt state */ }
    }
    loadTimer();
    if (model.isSolved()) { model.ended = true; displaySecretMessage(); }
}

function updateCheckpointButton() {
    const loadBtn = document.getElementById('loadBtn');
    if (loadBtn) loadBtn.disabled = !localStorage.getItem(checkpointKey());
}
function showPointStatus(text) {
    const el = document.getElementById('pointStatus');
    if (!el) return;
    el.textContent = text;
    clearTimeout(showPointStatus.timer);
    showPointStatus.timer = setTimeout(() => { el.textContent = ''; }, 2500);
}
function saveCheckpoint() {
    if (model.ended) return;
    try {
        localStorage.setItem(checkpointKey(), JSON.stringify({ state: model.encodeState(), time: Math.round(timerElapsed), started: timerStarted }));
    } catch (e) { /* storage blocked */ }
    updateCheckpointButton();
    showPointStatus('Save point saved.');
}
function loadCheckpoint() {
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(checkpointKey()) || 'null'); } catch (e) { saved = null; }
    if (!saved) return;

    model.resetGrid();
    model.decodeState(saved.state);
    timerElapsed = saved.time || 0;
    timerStarted = !!saved.started;
    timerLast = performance.now();
    saveTimer(); saveState();
    board.clearHistory();
    board.render();
    renderTimer();
    if (model.isSolved()) { model.ended = true; displaySecretMessage(); }
    showPointStatus('Save point loaded.');
}

// ----- timer (same rule as Pictogram: counts only while the tab is visible AND focused) -----

let timerStarted = false, timerElapsed = 0, timerLast = 0, timerSavedAt = 0;
const windowActive = () => !document.hidden && document.hasFocus();

function formatTime(ms) {
    const total = Math.floor(ms / 1000), h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
    return (h > 0 ? h + ':' : '') + (h > 0 ? String(m).padStart(2, '0') : String(m)) + ':' + String(s).padStart(2, '0');
}
function renderTimer() {
    const el = document.getElementById('timerDiv');
    if (!el) return;
    if (loadSettings().showTimer === false) { el.textContent = ''; return; }
    if (model.ended) el.textContent = 'Solved in ' + formatTime(timerElapsed);
    else if (!timerStarted) el.textContent = 'Time 0:00 (starts with your first square)';
    else el.textContent = 'Time ' + formatTime(timerElapsed) + (windowActive() ? '' : ' (paused)');
}
function startTimer() {
    if (timerStarted || model.ended) return;
    timerStarted = true; timerLast = performance.now(); saveTimer();
}
function saveTimer() {
    timerSavedAt = performance.now();
    try { localStorage.setItem(progressKey('#time'), JSON.stringify({ e: Math.round(timerElapsed), s: timerStarted ? 1 : 0 })); } catch (e) {}
}
function loadTimer() {
    timerStarted = false; timerElapsed = 0;
    try {
        const saved = JSON.parse(localStorage.getItem(progressKey('#time')) || 'null');
        if (saved) { timerElapsed = saved.e || 0; timerStarted = saved.s == 1; }
    } catch (e) {}
    if (!timerStarted && model.hasAnyBlack()) timerStarted = true;   // older progress had no timer
    timerLast = performance.now();
}
function resetTimer() {
    timerStarted = false; timerElapsed = 0; timerLast = performance.now();
    localStorage.removeItem(progressKey('#time'));
    renderTimer();
}
function tickTimer() {
    const now = performance.now();
    if (timerStarted && !model.ended && windowActive()) timerElapsed += now - timerLast;
    timerLast = now;
    renderTimer();
    if (timerStarted && now - timerSavedAt > 3000) saveTimer();
}
function setupTimer() {
    timerLast = performance.now();
    setInterval(tickTimer, 250);
    window.addEventListener('blur', tickTimer);
    window.addEventListener('focus', tickTimer);
    document.addEventListener('visibilitychange', tickTimer);
    window.addEventListener('beforeunload', () => { tickTimer(); saveTimer(); });
    tickTimer();
}

// ----- secret message -----

function displaySecretMessage() {
    const code = nono.decryptWithGrid(puzzle.enc, puzzle.msgType, model.grid);
    const msgDiv = document.getElementById('msgDiv');
    msgDiv.textContent = '';
    if (puzzle.msgType == 0) msgDiv.textContent = code;
    else {
        const a = document.createElement('a');
        a.setAttribute('href', nono.getSteamGiftsURL(code));
        a.setAttribute('target', '_blank');
        a.textContent = nono.getSteamGiftsURL(code);
        msgDiv.appendChild(a);
    }
    msgDiv.style.display = 'block';
}
function hideMessage() {
    const msgDiv = document.getElementById('msgDiv');
    msgDiv.textContent = ''; msgDiv.style.display = 'none';
}

// ----- toolbar -----

function reset() {
    model.resetGrid();
    deleteState();
    hideMessage();
    resetTimer();
    board.clearHistory();
    board.render();
}
function clearNonogramProgress() {
    const ok = confirm('Clear saved progress?\n\nThis deletes your progress, timers and save points for ALL Nonogram puzzles on this device. Your settings are kept. This cannot be undone.');
    if (!ok) return;
    for (const key of Object.keys(localStorage)) if (key.startsWith(PROGRESS_PREFIX)) localStorage.removeItem(key);
    reset();
    updateCheckpointButton();
    showPointStatus('Saved progress cleared.');
}
function setupButtons() {
    document.getElementById('undoBtn').addEventListener('click', () => board.undo());
    document.getElementById('redoBtn').addEventListener('click', () => board.redo());
    document.getElementById('zoomInBtn').addEventListener('click', () => board.zoomIn());
    document.getElementById('zoomOutBtn').addEventListener('click', () => board.zoomOut());
    document.getElementById('resetBtn').addEventListener('click', reset);
    document.getElementById('clearProgressBtn').addEventListener('click', clearNonogramProgress);
    document.getElementById('saveBtn').addEventListener('click', saveCheckpoint);
    document.getElementById('loadBtn').addEventListener('click', loadCheckpoint);
    updateCheckpointButton();
}

function showBoardSize() {
    const el = document.getElementById('sizeValue');
    if (el) { el.textContent = puzzle.numCols + ' × ' + puzzle.numRows; document.getElementById('sizeDiv').hidden = false; }
}

// ----- start -----

document.addEventListener('DOMContentLoaded', () => {
    setupSettings();

    loadState();
    showBoardSize();

    const adapter = createNonogramAdapter({ model, getPalette, getMarkStyle });
    // Click-solve test hook (dev-tools/browser-checks/click-solve.mjs): centre of each black cell.
    window.__gdpSolverClicks = () => adapter.solverClicks(nono.solveNonogram(puzzle.horHints, puzzle.verHints));
    board = mountBoard(document.getElementById('nonoDiv'), adapter, {
        onChange: () => { if (!model.ended && model.hasAnyBlack()) startTimer(); saveState(); },
        onHistoryChange: (u, r) => {
            document.getElementById('undoBtn').disabled = u === 0;
            document.getElementById('redoBtn').disabled = r === 0;
        },
        onKey: (ev) => {
            if (ev.key === 'S' && ev.shiftKey) saveCheckpoint();
            else if (ev.key === 'L' && ev.shiftKey) loadCheckpoint();
            else if (ev.key === 'R' && ev.shiftKey) reset();
        },
        onSolved: () => {
            // Runs before model.ended is set, so saveState() still records the finished grid.
            saveState();
            model.ended = true;
            displaySecretMessage();
            renderTimer();
        }
    });

    setupTimer();
    setupButtons();
    setupFreshButton(document.getElementById('freshBtn'));
});

document.getElementById('nonoDiv').addEventListener('mousedown', (e) => e.preventDefault());
document.getElementById('nonoDiv').addEventListener('contextmenu', (e) => e.preventDefault());
// Navigation convenience: one generic route to build any puzzle.
document.getElementById('createBtn').addEventListener('click', () => window.open('../index.html', '_blank'));
