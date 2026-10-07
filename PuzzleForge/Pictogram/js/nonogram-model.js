// Pictogram's puzzle model: the grid, the hint check-offs, the move rules and the solved check.
// Pure data + functions — no DOM, no drawing. This is the "model" half of the model/view split in
// notes/decisions/0001-svg-board-migration.md. Drawing lives in nonogram-board.js.
//
// Ported unchanged from the original Pictogram/js/player.js (p5 version). Cell values and rule
// checks are identical, so link formats, saved progress and the secret-message key are unaffected.

import * as nono from './util/nono-utils.js';

export const CELL_MARK = { EMPTY: 0, BLACK: 1, WHITE: 2 };

export const ACTION_TYPE = {
    MARK_CELL: 0,
    TOGGLE_HOR_HINT: 1,
    TOGGLE_VER_HINT: 2
};

export function createModel({ numRows, numCols, horHints, verHints }) {
    const model = {
        numRows, numCols, horHints, verHints,
        grid: nono.getEmptyGrid(numRows, numCols),
        gridHorHints: horHints.map(h => Array(h.length).fill(0)),
        gridVerHints: verHints.map(h => Array(h.length).fill(0)),
        ended: false
    };

    // The value a left click / right click / tap would put in this cell.
    model.nextCellValue = (row, col, button) => {
        const curr = model.grid[row][col];
        if (button === 'touch') return (curr + 1) % 3;
        if (button === 'right') return curr === CELL_MARK.WHITE ? CELL_MARK.EMPTY : CELL_MARK.WHITE;
        return curr === CELL_MARK.BLACK ? CELL_MARK.EMPTY : CELL_MARK.BLACK;
    };

    model.markCellAction = (row, col, button) => {
        const from = model.grid[row][col];
        const to = model.nextCellValue(row, col, button);
        return from === to ? null : { type: ACTION_TYPE.MARK_CELL, row, col, from, to };
    };

    model.horHintAction = (row, col) => {
        const hints = model.gridHorHints[row];
        const index = hints.length - (-1 - col) - 1;
        if (index < 0 || index >= hints.length) return null;
        return { type: ACTION_TYPE.TOGGLE_HOR_HINT, row, index, from: hints[index] };
    };

    model.verHintAction = (col, row) => {
        const hints = model.gridVerHints[col];
        const index = hints.length - (-1 - row) - 1;
        if (index < 0 || index >= hints.length) return null;
        return { type: ACTION_TYPE.TOGGLE_VER_HINT, col, index, from: hints[index] };
    };

    model.apply = (action) => {
        if (action.type === ACTION_TYPE.MARK_CELL) {
            model.grid[action.row][action.col] = action.to;
        } else if (action.type === ACTION_TYPE.TOGGLE_HOR_HINT) {
            const h = model.gridHorHints[action.row];
            h[action.index] = 1 - h[action.index];
        } else if (action.type === ACTION_TYPE.TOGGLE_VER_HINT) {
            const h = model.gridVerHints[action.col];
            h[action.index] = 1 - h[action.index];
        }
    };

    model.unapply = (action) => {
        if (action.type === ACTION_TYPE.MARK_CELL) {
            model.grid[action.row][action.col] = action.from;
        } else if (action.type === ACTION_TYPE.TOGGLE_HOR_HINT) {
            const h = model.gridHorHints[action.row];
            h[action.index] = 1 - h[action.index];
        } else if (action.type === ACTION_TYPE.TOGGLE_VER_HINT) {
            const h = model.gridVerHints[action.col];
            h[action.index] = 1 - h[action.index];
        }
    };

    model.isSolved = () => {
        const runsMatch = (values, hints) => {
            let group = 0, count = 0;
            for (let i = 0; i <= values.length; i++) {
                if (i === values.length || values[i] !== CELL_MARK.BLACK) {
                    if (count > 0) {
                        if (group >= hints.length || hints[group] !== count) return false;
                        count = 0; group++;
                    }
                } else count++;
            }
            return group === hints.length;
        };

        for (let row = 0; row < model.numRows; row++) {
            const line = [];
            for (let col = 0; col < model.numCols; col++) line.push(model.grid[row][col]);
            if (!runsMatch(line, model.horHints[row])) return false;
        }
        for (let col = 0; col < model.numCols; col++) {
            const line = [];
            for (let row = 0; row < model.numRows; row++) line.push(model.grid[row][col]);
            if (!runsMatch(line, model.verHints[col])) return false;
        }
        return true;
    };

    model.resetGrid = () => {
        model.grid = nono.getEmptyGrid(numRows, numCols);
        model.gridHorHints = horHints.map(h => Array(h.length).fill(0));
        model.gridVerHints = verHints.map(h => Array(h.length).fill(0));
        model.ended = false;
    };

    model.encodeState = () => nono.encodeGameState(model.grid, model.gridHorHints, model.gridVerHints);

    model.decodeState = (encoded) => nono.decodeGameState(model.grid, model.gridHorHints, model.gridVerHints, encoded);

    model.hasAnyBlack = () => model.grid.some(row => row.some(v => v === CELL_MARK.BLACK));

    return model;
}
