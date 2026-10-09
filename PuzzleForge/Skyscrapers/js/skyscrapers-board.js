// Skyscrapers adapter for the shared board shell. Board chrome comes from shared
// resolveChrome(); geometry, drawing and every click are this puzzle's own.
//
// One extra move over the other grid puzzles: clicking a row/column number (a clue in the
// margin) ticks that whole line as done, the same way a nonogram hint is struck through. The
// ticks are cosmetic — they never affect the solved check — and they are saved with progress.
import { ACTION_TYPE, isSolved as ruleSolved } from './skyscrapers-logic.js?v=13.0.10logic';

const CS = 40, M = 28;

export function createSkyscrapersAdapter({ N, givens, clues, getGrid, getChrome, getSurface }) {
    const cells = new Array(N * N).fill(0);
    for (let i = 0; i < N * N; i++) cells[i] = givens[i] || 0;
    const rowDone = new Array(N).fill(0);
    const colDone = new Array(N).fill(0);

    const cx = (c) => M + c * CS + CS / 2;
    const cy = (r) => M + r * CS + CS / 2;
    const cellAt = (pt) => {
        const col = Math.floor((pt.x - M) / CS), row = Math.floor((pt.y - M) / CS);
        return col >= 0 && col < N && row >= 0 && row < N ? { row, col } : null;
    };
    // The clue bands in the margins, so a number can be clicked. A point inside the grid is
    // never a clue, and a corner point is neither.
    function clueAt(pt) {
        const gridX0 = M, gridX1 = M + N * CS, gridY0 = M, gridY1 = M + N * CS;
        const inGridY = pt.y >= gridY0 && pt.y < gridY1;
        const inGridX = pt.x >= gridX0 && pt.x < gridX1;
        if (inGridY && pt.x < gridX0) return { axis: 'row', index: Math.floor((pt.y - gridY0) / CS) };
        if (inGridY && pt.x >= gridX1) return { axis: 'row', index: Math.floor((pt.y - gridY0) / CS) };
        if (inGridX && pt.y < gridY0) return { axis: 'col', index: Math.floor((pt.x - gridX0) / CS) };
        if (inGridX && pt.y >= gridY1) return { axis: 'col', index: Math.floor((pt.x - gridX0) / CS) };
        return null;
    }
    const doneOf = (axis, index) => (axis === 'row' ? rowDone[index] : colDone[index]);
    const setDone = (axis, index, v) => { if (axis === 'row') rowDone[index] = v; else colDone[index] = v; };
    const nextState = (from, button) => button === 'right' ? 0 : (from + 1) % (N + 1);

    return {
        world: () => ({ width: N * CS + 2 * M, height: N * CS + 2 * M }),

        render() {
            const chrome = getChrome ? getChrome() : null;
            const ink = chrome ? chrome.ink : 'var(--gdp-fg)';
            const grid = chrome ? chrome.grid : 'var(--gdp-grid)';
            const surface = chrome ? chrome.surface : 'var(--gdp-panel)';
            const strike = chrome ? chrome.over : 'var(--gdp-muted)';
            let out = (getSurface && !getSurface()) ? '' : `<rect x="0" y="0" width="100%" height="100%" fill="${surface}"/>`;

            for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
                const v = cells[r * N + c];
                if (v) out += `<text x="${cx(c)}" y="${cy(r) + 6}" text-anchor="middle" font-size="22" font-weight="700" fill="${ink}">${v}</text>`;
            }

            // Clue numbers; a ticked line draws its numbers dimmed with a line through them.
            const clue = (x, y, v, axis, index, anchor) => {
                if (!v) return '';
                const ticked = doneOf(axis, index);
                const size = 16;
                out += `<text x="${x}" y="${y}" text-anchor="${anchor}" font-size="${size}" fill="${ink}"`
                    + (ticked ? ` opacity="0.35"` : '') + `>${v}</text>`;
                if (ticked) out += `<line x1="${x - size * 0.75}" y1="${y - 5}" x2="${x + size * 0.75}" y2="${y - 5}" stroke="${strike}" stroke-width="2"/>`;
            };
            for (let c = 0; c < N; c++) {
                if (clues.top[c]) clue(cx(c), 14, clues.top[c], 'col', c, 'middle');
                if (clues.bottom[c]) clue(cx(c), M + N * CS + 22, clues.bottom[c], 'col', c, 'middle');
            }
            for (let r = 0; r < N; r++) {
                if (clues.left[r]) clue(10, cy(r) + 5, clues.left[r], 'row', r, 'middle');
                if (clues.right[r]) clue(M + N * CS + 18, cy(r) + 5, clues.right[r], 'row', r, 'middle');
            }

            if (getGrid && getGrid()) {
                for (let c = 0; c <= N; c++) out += `<line x1="${M + c * CS}" y1="${M}" x2="${M + c * CS}" y2="${M + N * CS}" stroke="${grid}"/>`;
                for (let r = 0; r <= N; r++) out += `<line x1="${M}" y1="${M + r * CS}" x2="${M + N * CS}" y2="${M + r * CS}" stroke="${grid}"/>`;
            }
            return out;
        },

        hover(_world, pt) {
            const chrome = getChrome ? getChrome() : null;
            const fill = chrome ? chrome.over : 'var(--gdp-muted)';
            const cell = cellAt(pt);
            if (cell) {
                if (givens[cell.row * N + cell.col]) return '';
                return `<rect x="${M + cell.col * CS}" y="${M + cell.row * CS}" width="${CS}" height="${CS}" fill="${fill}" opacity="0.18"/>`;
            }
            const c = clueAt(pt);
            if (!c) return '';
            if (c.axis === 'row') return `<rect x="0" y="${M + c.index * CS}" width="${M + N * CS + 2 * M}" height="${CS}" fill="${fill}" opacity="0.10"/>`;
            return `<rect x="${M + c.index * CS}" y="0" width="${CS}" height="${N * CS + 2 * M}" fill="${fill}" opacity="0.10"/>`;
        },

        hitTest(pt, phase) {
            if (phase !== 'down') return null;
            const c = clueAt(pt);
            if (c) {
                const from = doneOf(c.axis, c.index);
                return { type: ACTION_TYPE.LINE, axis: c.axis, index: c.index, from, to: from ? 0 : 1 };
            }
            const cell = cellAt(pt);
            if (!cell) return null;
            const i = cell.row * N + cell.col;
            if (givens[i]) return null;
            const to = nextState(cells[i], pt.button);
            return to === cells[i] ? null : { type: ACTION_TYPE.CELL, i, from: cells[i], to };
        },

        // Test hook (dev-tools/browser-checks/click-solve.mjs): centre of every non-given cell
        // that still needs a different value, clicked until it matches the solution.
        solverClicks(solution) {
            const out = [];
            for (let i = 0; i < N * N; i++) {
                if (givens[i] || cells[i] === solution[i]) continue;
                const need = (solution[i] - cells[i] + (N + 1)) % (N + 1);
                for (let k = 0; k < need; k++) out.push({ x: M + (i % N) * CS + CS / 2, y: M + ((i / N) | 0) * CS + CS / 2, button: 'left' });
            }
            return out;
        },

        apply: (a) => {
            if (a.type === ACTION_TYPE.LINE) setDone(a.axis, a.index, a.to);
            else cells[a.i] = a.to;
        },
        unapply: (a) => {
            if (a.type === ACTION_TYPE.LINE) setDone(a.axis, a.index, a.from);
            else cells[a.i] = a.from;
        },
        isSolved: () => ruleSolved(N, givens, clues, cells),
        // Progress string: cell values, then the row/col ticks. Older saved progress (values
        // only) still decodes — the tick part is optional.
        encodeState: () => cells.join('') + '|' + rowDone.join('') + colDone.join(''),
        decodeState: (s) => {
            const [values, marks] = String(s).split('|');
            for (let i = 0; i < cells.length; i++) cells[i] = (values.charCodeAt(i) - 48) || 0;
            for (let i = 0; i < N; i++) {
                rowDone[i] = marks ? ((marks.charCodeAt(i) - 48) || 0) : 0;
                colDone[i] = marks ? ((marks.charCodeAt(N + i) - 48) || 0) : 0;
            }
        },
        hasAny: () => cells.some((v, i) => !givens[i] && v) || rowDone.some(Boolean) || colDone.some(Boolean),
        reset: () => {
            for (let i = 0; i < cells.length; i++) cells[i] = givens[i] || 0;
            rowDone.fill(0); colDone.fill(0);
        },
        grid: () => cells.slice()
    };
}
