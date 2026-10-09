// Nurikabe adapter for the shared board shell. Board chrome comes from shared
// resolveChrome(); geometry, drawing and every click are this puzzle's own.
//
// **Nurikabe has TWO states, not three** (owner, 2026-10-09, with `puzzle-nurikabe.com` as the
// reference: "Left click on a square to make it black. Right click to mark with dot."). A cell is
// white (island) or black (sea); white is the DEFAULT, so the player only ever marks black. The old
// version cycled unknown → island → sea, which invented a third state and drew an unset cell exactly
// like an island — a solved board then never registered, because a cell the player never clicked was
// still "unknown".
//
//   left click   toggle black ↔ white
//   right click  toggle the dot mark on a cell the player has worked out is white (pencil mark only;
//                marks never enter the link or the message lock — invariant 4)
//
// The look follows Akari's walls: the sea is drawn in the palette's ink and islands keep the palette's
// surface, so the board reads correctly in every theme and style.
import { CELL, ACTION_TYPE, isSolved as ruleSolved } from './nurikabe-logic.js?v=13.0.26logic';

const CS = 40, M = 6;

export function createNurikabeAdapter({ W, H, clues, getGrid, getChrome, getSurface }) {
    const cells = new Array(W * H).fill(CELL.ISLAND);   // white by default: white is "not sea"
    const marks = new Array(W * H).fill(0);             // 1 = dotted by the player as white
    const cx = (c) => M + c * CS + CS / 2;
    const cy = (r) => M + r * CS + CS / 2;
    const cellAt = (pt) => {
        const col = Math.floor((pt.x - M) / CS), row = Math.floor((pt.y - M) / CS);
        return col >= 0 && col < W && row >= 0 && row < H ? { row, col } : null;
    };
    const nextState = (from) => (from === CELL.SEA ? CELL.ISLAND : CELL.SEA);

    return {
        world: () => ({ width: W * CS + 2 * M, height: H * CS + 2 * M }),

        render() {
            const chrome = getChrome ? getChrome() : null;
            const surface = chrome ? chrome.surface : 'var(--gdp-panel)';
            const ink = chrome ? chrome.ink : 'var(--gdp-fg)';
            const grid = chrome ? chrome.grid : 'var(--gdp-grid)';
            const markInk = chrome ? chrome.markCandidate : 'var(--gdp-muted)';
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
            // the player's own dots: a small mark on a white cell they have worked out
            for (let i = 0; i < cells.length; i++) {
                if (!marks[i] || cells[i] === CELL.SEA) continue;
                out += `<circle cx="${cx(i % W)}" cy="${cy((i / W) | 0)}" r="4" fill="${markInk}"/>`;
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
            if (pt.button === 'right') return { type: ACTION_TYPE.MARK, i, from: marks[i], to: marks[i] ? 0 : 1 };
            const to = nextState(cells[i]);
            return { type: ACTION_TYPE.CELL, i, from: cells[i], to };
        },

        // Test hook (dev-tools/browser-checks/click-solve.mjs): every sea cell starts white, so the
        // plan is one left click per sea cell.
        solverClicks(solution) {
            const out = [];
            for (let i = 0; i < W * H; i++) {
                if (solution[i] !== CELL.SEA || cells[i] === CELL.SEA) continue;
                out.push({ x: cx(i % W), y: cy((i / W) | 0), button: 'left' });
            }
            return out;
        },

        apply: (a) => { if (a.type === ACTION_TYPE.MARK) marks[a.i] = a.to; else cells[a.i] = a.to; },
        unapply: (a) => { if (a.type === ACTION_TYPE.MARK) marks[a.i] = a.from; else cells[a.i] = a.from; },
        isSolved: () => ruleSolved(W, H, clues, cells),
        // White is the default, so only the black cells need storing; marks are the player's own
        // scribbles and deliberately do not travel (invariant 4).
        encodeState: () => cells.map((c) => (c === CELL.SEA ? 'S' : 'I')).join(''),
        decodeState: (s) => { for (let i = 0; i < cells.length; i++) cells[i] = s[i] === 'S' ? CELL.SEA : CELL.ISLAND; },
        hasAny: () => cells.some((c) => c === CELL.SEA) || marks.some(Boolean),
        reset: () => { cells.fill(CELL.ISLAND); marks.fill(0); },
        grid: () => cells.slice()
    };
}
