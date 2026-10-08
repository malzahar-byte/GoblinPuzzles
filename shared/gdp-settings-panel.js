// Goblin Does Puzzles — the standard player-page settings panel.
//
// Every player page offers the same six controls, in the same order:
//   Theme · Board style · Show board background · Show grid · Show timer · Clear saved progress
// This module is the one home for their wiring (notes/backlog.md: the panels had drifted, so a
// puzzle was missing "Show board background" and its board style barely showed). A page keeps
// its own settings store (js/util/settings.js), its own markup (same ids everywhere) and its
// own render callback; everything else lives here.
//
//   setupBoardSettingsPanel({
//     load, save,                 // the puzzle's store functions
//     applyTheme, setupThemeButton,
//     render,                     // re-render the board after an appearance change
//     renderTimer,                // re-render the clock after the timer toggle
//     clearProgress,              // the page's own "delete progress" routine (confirm + wipe)
//     styles, styleKey            // PALETTES + 'boardStyle' by default
//   });
//
// Ids used (all optional — a missing element is simply skipped):
//   themeBtn, boardStyleSelect, surfaceCheck, gridCheck, showTimerCheck, clearProgressBtn.
import { PALETTES } from './gdp-palettes.js';

const IDS = {
    theme: 'themeBtn',
    style: 'boardStyleSelect',
    surface: 'surfaceCheck',
    grid: 'gridCheck',
    timer: 'showTimerCheck',
    clear: 'clearProgressBtn'
};

export function setupBoardSettingsPanel(opts = {}) {
    const { load, save, applyTheme, setupThemeButton, render, renderTimer, clearProgress } = opts;
    const styles = opts.styles || PALETTES;
    const styleKey = opts.styleKey || 'boardStyle';
    const fallbackStyle = Object.keys(styles)[0];
    const $ = id => document.getElementById(id);

    if (applyTheme) applyTheme();

    if (setupThemeButton) {
        setupThemeButton($(IDS.theme), () => { if (applyTheme) applyTheme(); if (render) render(); });
    }

    const styleSelect = $(IDS.style);
    if (styleSelect) {
        for (const [key, style] of Object.entries(styles)) {
            const option = document.createElement('option');
            option.value = key; option.textContent = style.label;
            styleSelect.appendChild(option);
        }
        const saved = load()[styleKey];
        styleSelect.value = styles[saved] ? saved : fallbackStyle;
        styleSelect.addEventListener('change', () => { save({ [styleKey]: styleSelect.value }); if (render) render(); });
    }

    const surfaceCheck = $(IDS.surface);
    if (surfaceCheck) {
        surfaceCheck.checked = load().surface !== false;
        surfaceCheck.addEventListener('change', () => { save({ surface: surfaceCheck.checked }); if (render) render(); });
    }

    const gridCheck = $(IDS.grid);
    if (gridCheck) {
        gridCheck.checked = load().grid !== false;
        gridCheck.addEventListener('change', () => { save({ grid: gridCheck.checked }); if (render) render(); });
    }

    const timerCheck = $(IDS.timer);
    if (timerCheck) {
        timerCheck.checked = load().showTimer !== false;
        timerCheck.addEventListener('change', () => { save({ showTimer: timerCheck.checked }); if (renderTimer) renderTimer(); });
    }

    const clearBtn = $(IDS.clear);
    if (clearBtn && clearProgress) clearBtn.addEventListener('click', clearProgress);

    return { styleSelect, surfaceCheck, gridCheck, timerCheck };
}
