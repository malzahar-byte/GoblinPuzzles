// Nurikabe adapter for the shared board shell. Board chrome comes from shared
// resolveChrome(); geometry, drawing and every click are this puzzle's own.
//
// Look follows the same convention as Akari's walls: the sea is drawn in the palette's ink and
// islands keep the palette's surface, so the board reads correctly in every theme and style.
import { CELL, ACTION_TYPE, isSolved as ruleSolved } from './nurikabe-logic.js?v=13.0.13logic';

const CS = 40, M = 6;

export function createNurikabeAdapter({ W, H, clues, getGrid, getChrome, getSurface }) {
    const cells = new Array(W * H).fill(CELL.UNKNOWN);
    const cx = (c) => M + c * CS + CS / 2;
    const cy = (r) => M + r * CS + CS / 2;
    const cellAt = (pt) => {
        const col = Math.floor((pt.x - M) / CS), row = Math.floor((pt.y - M) / CS);
        return col >= 0 && col < W && row >= 0 && row < H ? { row, col } : null;
    };
    // Left click cycles unknown → island → sea → unknown; right click clears a cell.
    const nextState = (from, button) => {
        if (button === 'right') return CELL.UNKNOWN;
        if (from === CELL.UNKNOWN) return CELL.ISLAND;
        if (from === CELL.ISLAND) return CELL.SEA;
        return CELL.UNKNOWN;
    };

    return {
        world: () => ({ width: W * CS + 2 * M, height: H * CS + 2 * M }),

        render() {
            const chrome = getChrome ? getChrome() : null;
            const surface = chrome ? chrome.surface : 'var(--gdp-panel)';
            const ink = chrome ? chrome.ink : 'var(--gdp-fg)';
            const grid = chrome ? chrome.grid : 'var(--gdp-grid)';
            let out = (getSurface && !getSurface()) ? '' : `<rect x="0" y="0" width="100%" height="100%" fill="${surface}"/>`;
            for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
                const i = r * W + c;
                if (cells[i] === CELL.SEA) out += `<rect x="${M + c * CS}" y="${M + r * CS}" width="${CS}" height="${CS}" fill="${ink}"/>`;
            }
            // clue numbers sit on their island cell, so they are drawn after the sea
            for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
                const i = r * W + c;
                if (clues[i] > 0 && cells[i] !== CELL.SEA) {
                    const size = clues[i] < 10 ? 20 : 15;
                    out += `<text x="${cx(c)}" y="${cy(r) + 6}" text-anchor="middle" font-size="${size}" font-weight="700" fill="${ink}">${clues[i]}</text>`;
                }
            }
            if (getGrid && getGrid()) {
                for (let c = 0; c <= W; c++) out += `<line x1="${M + c * CS}" y1="${M}" x2="${M + c * CS}" y2="${M + H * CS}" stroke="${grid}"/>`;
                for (let r = 0; r <= H; r++) out += `<line x1="${M}" y1="${M + r * CS}" x2="${M + W * CS}" y2="${M + r * CS}" stroke="${grid}"/>`;
            }
            return out;
        },

        hover(_world, pt) {
            const cell = cellAt(pt);
            if (!cell) return '';
            const chrome = getChrome ? getChrome() : null;
            return `<rect x="${M + cell.col * CS}" y="${M + cell.row * CS}" width="${CS}" height="${CS}" fill="${chrome ? chrome.over : 'var(--gdp-muted)'}" opacity="0.18"/>`;
        },

        hitTest(pt, phase) {
            if (phase !== 'down') return null;
            const cell = cellAt(pt);
            if (!cell) return null;
            const i = cell.row * W + cell.col;
            const to = nextState(cells[i], pt.button);
            return to === cells[i] ? null : { type: ACTION_TYPE.CELL, i, from: cells[i], to };
        },

        // Test hook (dev-tools/browser-checks/click-solve.mjs): a click cycle per cell, computed
        // from the solution (island = one click from unknown, sea = two).
        solverClicks(solution) {
            const out = [];
            for (let i = 0; i < W * H; i++) {
                const want = solution[i] === CELL.ISLAND ? CELL.ISLAND : CELL.SEA;
                let cur = cells[i];
                let guard = 0;
                while (cur !== want && guard++ < 4) {
                    out.push({ x: cx(i % W), y: cy((i / W) | 0), button: 'left' });
                    cur = nextState(cur, 'left');
                }
            }
            return out;
        },

        apply: (a) => { cells[a.i] = a.to; },
        unapply: (a) => { cells[a.i] = a.from; },
        isSolved: () => ruleSolved(W, H, clues, cells),
        encodeState: () => cells.join(''),
        decodeState: (s) => { for (let i = 0; i < cells.length; i++) cells[i] = (s.charCodeAt(i) - 48) || 0; },
        hasAny: () => cells.some((v) => v !== CELL.UNKNOWN),
        reset: () => cells.fill(CELL.UNKNOWN),
        grid: () => cells.slice()
    };
}
