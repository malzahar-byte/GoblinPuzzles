// Pictogram's adapter for the shared board shell. Supplies only what is nonogram-specific:
// the board geometry, the SVG drawing, and what a click or drag means. Fit, zoom, panning,
// pointer routing, drag painting, undo/redo and keyboard all come from shared/gdp-board.js.
//
// Drawing is a line-for-line port of the original p5 draw code in player.js: same cell colours,
// same checker index, same X/dot marks, same thin/thick grid lines, same hint placement, same
// hover highlight. Colours come from the shared palettes (js/util/board-styles.js).

import { CELL_MARK, ACTION_TYPE } from './nonogram-model.js';

const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
const rgba = (c) => `rgba(${c[0]},${c[1]},${c[2]},${(c[3] ?? 255) / 255})`;

export function createNonogramAdapter({ model, getPalette, getMarkStyle }) {
    const MARGIN = 12;
    const CELL = 30;
    const CROSS = CELL / 6;

    const maxHor = Math.max(1, ...model.horHints.map(h => h.length));
    const maxVer = Math.max(1, ...model.verHints.map(h => h.length));

    const gridX = MARGIN + maxHor * CELL;   // board x of the grid's left edge
    const gridY = MARGIN + maxVer * CELL;   // board y of the grid's top edge

    function cellAt(pt) {
        return {
            col: Math.floor((pt.x - MARGIN) / CELL) - maxHor,
            row: Math.floor((pt.y - MARGIN) / CELL) - maxVer
        };
    }

    function zones(col, row) {
        return {
            inGridX: col >= 0 && col < model.numCols,
            inHintsX: col < 0 && col > (-1 - maxHor),
            inGridY: row >= 0 && row < model.numRows,
            inHintsY: row < 0 && row > (-1 - maxVer)
        };
    }

    function drawCells(palette) {
        let out = '';
        for (let row = 0; row < model.numRows; row++) {
            for (let col = 0; col < model.numCols; col++) {
                const v = model.grid[row][col];
                const checker = 2 * ((Math.floor(row / 5) + Math.floor(col / 5)) % 2) + (row + col) % 2;
                out += `<rect x="${gridX + col * CELL}" y="${gridY + row * CELL}" width="${CELL}" height="${CELL}" fill="${rgb(palette.cellFill[checker][v])}"/>`;
            }
        }
        return out;
    }

    function drawMarks(palette) {
        const dot = getMarkStyle() === 'dot';
        let out = '';
        for (let row = 0; row < model.numRows; row++) {
            for (let col = 0; col < model.numCols; col++) {
                if (model.grid[row][col] !== CELL_MARK.WHITE) continue;
                const cx = gridX + (col + 0.5) * CELL;
                const cy = gridY + (row + 0.5) * CELL;
                if (dot) {
                    out += `<circle cx="${cx}" cy="${cy}" r="${CELL * 0.12}" fill="${rgb(palette.markColor)}"/>`;
                } else {
                    out += `<line x1="${cx - CROSS}" y1="${cy - CROSS}" x2="${cx + CROSS}" y2="${cy + CROSS}" stroke="${rgb(palette.markColor)}" stroke-width="2" stroke-linecap="butt"/>`;
                    out += `<line x1="${cx - CROSS}" y1="${cy + CROSS}" x2="${cx + CROSS}" y2="${cy - CROSS}" stroke="${rgb(palette.markColor)}" stroke-width="2" stroke-linecap="butt"/>`;
                }
            }
        }
        return out;
    }

    function drawLines(palette) {
        let out = '';
        for (let row = 0; row <= model.numRows; row++) {
            const thick = row === model.numRows || row % 5 === 0;
            const y = gridY + row * CELL;
            out += `<line x1="${MARGIN}" y1="${y}" x2="${gridX + model.numCols * CELL}" y2="${y}" stroke="${rgb(thick ? palette.lineThick : palette.lineThin)}" stroke-width="${thick ? 3 : 1}"/>`;
        }
        for (let col = 0; col <= model.numCols; col++) {
            const thick = col === model.numCols || col % 5 === 0;
            const x = gridX + col * CELL;
            out += `<line x1="${x}" y1="${MARGIN}" x2="${x}" y2="${gridY + model.numRows * CELL}" stroke="${rgb(thick ? palette.lineThick : palette.lineThin)}" stroke-width="${thick ? 3 : 1}"/>`;
        }
        return out;
    }

    function drawHints(palette) {
        let out = '';
        for (let row = 0; row < model.numRows; row++) {
            const hints = model.horHints[row];
            const y = gridY + (row + 0.5) * CELL + 2;
            if (hints.length === 0) {
                out += `<text x="${gridX - 0.5 * CELL}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="${CELL * 0.9}" fill="${rgb(palette.textMuted)}">0</text>`;
            }
            for (let i = 0; i < hints.length; i++) {
                const checked = model.gridHorHints[row][i] === 1;
                const size = hints[i] < 10 ? CELL * 0.9 : CELL * 0.7;
                out += `<text x="${gridX - (hints.length - i - 0.5) * CELL}" y="${y}" text-anchor="middle" dominant-baseline="middle" font-size="${size}" fill="${rgb(checked ? palette.textMuted : palette.text)}">${hints[i]}</text>`;
            }
        }
        for (let col = 0; col < model.numCols; col++) {
            const hints = model.verHints[col];
            const x = gridX + (col + 0.5) * CELL;
            if (hints.length === 0) {
                out += `<text x="${x}" y="${gridY - 0.5 * CELL + 2}" text-anchor="middle" dominant-baseline="middle" font-size="${CELL * 0.9}" fill="${rgb(palette.textMuted)}">0</text>`;
            }
            for (let i = 0; i < hints.length; i++) {
                const checked = model.gridVerHints[col][i] === 1;
                const size = hints[i] < 10 ? CELL * 0.9 : CELL * 0.7;
                out += `<text x="${x}" y="${gridY - (hints.length - i - 0.5) * CELL + 2}" text-anchor="middle" dominant-baseline="middle" font-size="${size}" fill="${rgb(checked ? palette.textMuted : palette.text)}">${hints[i]}</text>`;
            }
        }
        return out;
    }

    return {
        world: () => ({
            width: 2 * MARGIN + (maxHor + model.numCols) * CELL,
            height: 2 * MARGIN + (maxVer + model.numRows) * CELL
        }),

        render() {
            const palette = getPalette();
            const bg = rgb(model.ended ? palette.solvedBg : palette.bg);
            return `<rect x="0" y="0" width="100%" height="100%" fill="${bg}"/>`
                + drawCells(palette) + drawMarks(palette) + drawLines(palette) + drawHints(palette);
        },

        hover(_world, pt) {
            const palette = getPalette();
            const { col, row } = cellAt(pt);
            const { inGridX, inHintsX, inGridY, inHintsY } = zones(col, row);
            const fill = rgba(palette.hover);
            let out = '';
            if (inGridY && (inGridX || inHintsX)) {
                out += `<rect x="${gridX - maxHor * CELL - 1}" y="${gridY + row * CELL - 1}" width="${(maxHor + model.numCols) * CELL + 2}" height="${CELL + 2}" fill="${fill}"/>`;
            }
            if (inGridX && (inGridY || inHintsY)) {
                out += `<rect x="${gridX + col * CELL - 1}" y="${gridY - maxVer * CELL - 1}" width="${CELL + 2}" height="${(maxVer + model.numRows) * CELL + 2}" fill="${fill}"/>`;
            }
            return out;
        },

        hitTest(pt, phase, gesture) {
            const { col, row } = cellAt(pt);
            const { inGridX, inHintsX, inGridY, inHintsY } = zones(col, row);

            if (phase === 'down') {
                if (inGridX && inGridY) return model.markCellAction(row, col, pt.button);
                if (inGridX && inHintsY) return model.verHintAction(col, row);
                if (inHintsX && inGridY) return model.horHintAction(row, col);
                return null;
            }

            if (!gesture) return null;

            if (gesture.type === ACTION_TYPE.MARK_CELL) {
                if (!inGridX || !inGridY) return null;
                const curr = model.grid[row][col];
                const ok = (pt.button === 'touch' && curr !== gesture.to)
                    || (gesture.from === CELL_MARK.EMPTY && curr === CELL_MARK.EMPTY)
                    || (gesture.to === CELL_MARK.EMPTY && curr === gesture.from)
                    || (gesture.from !== CELL_MARK.EMPTY && gesture.to !== CELL_MARK.EMPTY && curr !== gesture.to);
                return ok ? { type: ACTION_TYPE.MARK_CELL, row, col, from: curr, to: gesture.to } : null;
            }

            if (gesture.type === ACTION_TYPE.TOGGLE_HOR_HINT) {
                if (!inGridY || !inHintsX || row !== gesture.row) return null;
                const hints = model.gridHorHints[row];
                const index = hints.length - (-1 - col) - 1;
                return (index >= 0 && index < hints.length && hints[index] === gesture.from)
                    ? { type: ACTION_TYPE.TOGGLE_HOR_HINT, row, index, from: hints[index] } : null;
            }

            if (gesture.type === ACTION_TYPE.TOGGLE_VER_HINT) {
                if (!inGridX || !inHintsY || col !== gesture.col) return null;
                const hints = model.gridVerHints[col];
                const index = hints.length - (-1 - row) - 1;
                return (index >= 0 && index < hints.length && hints[index] === gesture.from)
                    ? { type: ACTION_TYPE.TOGGLE_VER_HINT, col, index, from: hints[index] } : null;
            }

            return null;
        },

        // Test hook (dev-tools/browser-checks/click-solve.mjs): board-pixel centre of every black
        // solution cell. A left click fills EMPTY/WHITE -> BLACK, so one click per black cell.
        solverClicks(solution) {
            const out = [];
            for (let row = 0; row < model.numRows; row++)
                for (let col = 0; col < model.numCols; col++)
                    if (solution[row][col] === 1)
                        out.push({ x: gridX + (col + 0.5) * CELL, y: gridY + (row + 0.5) * CELL, button: 'left' });
            return out;
        },

        apply: (a) => model.apply(a),
        unapply: (a) => model.unapply(a),
        isSolved: () => model.isSolved()
    };
}
