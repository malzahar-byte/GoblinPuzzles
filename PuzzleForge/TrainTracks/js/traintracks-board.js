// Train Tracks adapter for the shared board shell. Board chrome comes from shared
// resolveChrome(); geometry, drawing and every click are this puzzle's own.
//
// A piece joins exactly two sides; the player cycles a cell through the seven states
// (empty → ─ → │ → ┌ → ┐ → ┘ → └ → empty). Cells the puzzle pre-filled are locked.
// Row and column counts sit in the margins; a hidden count is simply not drawn.
import { DIR, PIECES, UNKNOWN, ACTION_TYPE, isSolved as ruleSolved } from './traintracks-logic.js?v=13.0.13logic';

const CS = 40, PAD = 6, ML = 30, MT = 30;
const N = DIR.N, E = DIR.E, S = DIR.S, W = DIR.W;
// click order: empty, straight, straight, then the four corners
const CYCLE = [0, E | W, N | S, N | E, N | W, S | W, S | E];

export function createTrainTracksAdapter({ W: width, H: height, rowClue, colClue, givens, getGrid, getChrome, getSurface }) {
    const cells = new Array(width * height).fill(0);
    for (let i = 0; i < cells.length; i++) cells[i] = givens[i] === UNKNOWN ? 0 : givens[i];
    const initial = cells.slice();
    const locked = (i) => givens[i] !== UNKNOWN;
    const cx = (c) => ML + c * CS + CS / 2;
    const cy = (r) => MT + r * CS + CS / 2;
    const cellAt = (pt) => {
        const col = Math.floor((pt.x - ML) / CS), row = Math.floor((pt.y - MT) / CS);
        return col >= 0 && col < width && row >= 0 && row < height ? { row, col } : null;
    };
    const nextPiece = (from) => {
        const k = CYCLE.indexOf(from);
        return CYCLE[(k + 1) % CYCLE.length];
    };
    const pieceSvg = (i, p, ink) => {
        const r = (i / width) | 0, c = i % width;
        const x = cx(c), y = cy(r), half = CS / 2;
        let lines = '';
        if (p & N) lines += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y - half}"/>`;
        if (p & S) lines += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + half}"/>`;
        if (p & W) lines += `<line x1="${x}" y1="${y}" x2="${x - half}" y2="${y}"/>`;
        if (p & E) lines += `<line x1="${x}" y1="${y}" x2="${x + half}" y2="${y}"/>`;
        return `<g stroke="${ink}" stroke-width="7" stroke-linecap="round">${lines}</g>`;
    };

    return {
        world: () => ({ width: ML + width * CS + PAD, height: MT + height * CS + PAD }),

        render() {
            const chrome = getChrome ? getChrome() : null;
            const surface = chrome ? chrome.surface : 'var(--gdp-panel)';
            const ink = chrome ? chrome.ink : 'var(--gdp-fg)';
            const grid = chrome ? chrome.grid : 'var(--gdp-grid)';
            let out = (getSurface && !getSurface()) ? '' : `<rect x="0" y="0" width="100%" height="100%" fill="${surface}"/>`;
            for (let r = 0; r < height; r++) for (let c = 0; c < width; c++) {
                const i = r * width + c;
                if (cells[i]) out += pieceSvg(i, cells[i], ink);
            }
            if (getGrid && getGrid()) {
                for (let c = 0; c <= width; c++) out += `<line x1="${ML + c * CS}" y1="${MT}" x2="${ML + c * CS}" y2="${MT + height * CS}" stroke="${grid}"/>`;
                for (let r = 0; r <= height; r++) out += `<line x1="${ML}" y1="${MT + r * CS}" x2="${ML + width * CS}" y2="${MT + r * CS}" stroke="${grid}"/>`;
            }
            // counts in the margins (drawn last so the grid never covers them)
            for (let r = 0; r < height; r++) if (rowClue[r] >= 0)
                out += `<text x="${ML - 9}" y="${cy(r) + 6}" text-anchor="end" font-size="17" font-weight="700" fill="${ink}">${rowClue[r]}</text>`;
            for (let c = 0; c < width; c++) if (colClue[c] >= 0)
                out += `<text x="${cx(c)}" y="${MT - 9}" text-anchor="middle" font-size="17" font-weight="700" fill="${ink}">${colClue[c]}</text>`;
            return out;
        },

        hover(_world, pt) {
            const cell = cellAt(pt);
            if (!cell || locked(cell.row * width + cell.col)) return '';
            const chrome = getChrome ? getChrome() : null;
            return `<rect x="${ML + cell.col * CS}" y="${MT + cell.row * CS}" width="${CS}" height="${CS}" fill="${chrome ? chrome.over : 'var(--gdp-muted)'}" opacity="0.18"/>`;
        },

        hitTest(pt, phase) {
            if (phase !== 'down') return null;
            const cell = cellAt(pt);
            if (!cell) return null;
            const i = cell.row * width + cell.col;
            if (locked(i)) return null;
            const to = pt.button === 'right' ? 0 : nextPiece(cells[i]);
            return to === cells[i] ? null : { type: ACTION_TYPE.CELL, i, from: cells[i], to };
        },

        // Test hook (dev-tools/browser-checks/click-solve.mjs): clicks per cell from the solution.
        solverClicks(solution) {
            const out = [];
            for (let i = 0; i < width * height; i++) {
                if (locked(i)) continue;
                const want = solution[i];
                let cur = cells[i], guard = 0;
                while (cur !== want && guard++ < CYCLE.length) {
                    out.push({ x: cx(i % width), y: cy((i / width) | 0), button: 'left' });
                    cur = nextPiece(cur);
                }
            }
            return out;
        },

        apply: (a) => { cells[a.i] = a.to; },
        unapply: (a) => { cells[a.i] = a.from; },
        isSolved: () => ruleSolved(width, height, rowClue, colClue, givens, cells),
        encodeState: () => cells.map((p) => String.fromCharCode(48 + PIECES.indexOf(p))).join(''),
        decodeState: (s) => { for (let i = 0; i < cells.length; i++) cells[i] = PIECES[(s.charCodeAt(i) - 48) | 0] || 0; },
        hasAny: () => cells.some((v, i) => v !== initial[i]),
        reset: () => { for (let i = 0; i < cells.length; i++) cells[i] = initial[i]; },
        grid: () => cells.slice()
    };
}
