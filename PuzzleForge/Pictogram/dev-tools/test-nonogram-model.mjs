// Pictogram's puzzle-model tests (the gap the backlog describes): what the PLAYER does.
//   node PuzzleForge/Pictogram/dev-tools/test-nonogram-model.mjs
// Pure, DOM-free: clicking turns a cell black, right-click marks it, touch cycles, dragging
// paints, a hint number can be checked off, and the model reports solved exactly when every
// run matches its numbers. This file covers js/nonogram-model.js only — the picture→grid side
// already has test-image.mjs / test-roundtrip.mjs.
import { createModel, CELL_MARK, ACTION_TYPE } from '../js/nonogram-model.js';

let bad = 0;
const check = (name, ok) => { if (!ok) { bad++; console.log('FAIL', name); } };
const mark = (model, r, c, to) => model.apply({ type: ACTION_TYPE.MARK_CELL, row: r, col: c, from: model.grid[r][c], to });
const runs = (line) => {
    const out = []; let n = 0;
    for (const v of line) { if (v === CELL_MARK.BLACK) n++; else if (n) { out.push(n); n = 0; } }
    if (n) out.push(n);
    return out;
};

// --- a 1x3 grid, hints [[1]] x [[1,1]]-style small cases ---
{
    const m = createModel({ numRows: 1, numCols: 3, horHints: [[1, 1]], verHints: [[1], [], [1]] }); // an empty line is [], the '0' is display-only
    check('nextCellValue left: empty->black', m.nextCellValue(0, 0, 'left') === CELL_MARK.BLACK);
    m.apply(m.markCellAction(0, 0, 'left'));
    check('left click filled cell 0', m.grid[0][0] === CELL_MARK.BLACK);
    check('nextCellValue left again: black->empty', m.nextCellValue(0, 0, 'left') === CELL_MARK.EMPTY);
    m.apply(m.markCellAction(0, 2, 'left'));
    check('row solved', m.isSolved());
    // markCellAction is the click cycle, not a guard: on a BLACK cell left-click offers EMPTY back.
    const back = m.markCellAction(0, 0, 'left');
    check('click on a filled cell offers to empty it', back !== null && back.to === CELL_MARK.EMPTY && back.from === CELL_MARK.BLACK);
}

// --- right-click cycles empty -> WHITE -> empty, and never BLACK ---
{
    const m = createModel({ numRows: 1, numCols: 2, horHints: [[1]], verHints: [[1], []] });
    check('right: empty->white', m.nextCellValue(0, 0, 'right') === CELL_MARK.WHITE);
    m.apply(m.markCellAction(0, 0, 'right'));
    check('right click marked cell 0', m.grid[0][0] === CELL_MARK.WHITE);
    check('right: white->empty', m.nextCellValue(0, 0, 'right') === CELL_MARK.EMPTY);
    check('right never blacks a white cell', m.nextCellValue(0, 0, 'right') !== CELL_MARK.BLACK);
}

// --- touch cycles empty -> black -> white -> empty ---
{
    const m = createModel({ numRows: 1, numCols: 1, horHints: [[1]], verHints: [[1]] });
    const seq = [CELL_MARK.BLACK, CELL_MARK.WHITE, CELL_MARK.EMPTY];
    for (let i = 0; i < 3; i++) {
        check(`touch step ${i}`, m.nextCellValue(0, 0, 'touch') === seq[i]);
        m.apply(m.markCellAction(0, 0, 'touch'));
    }
    check('touch returns to empty', m.grid[0][0] === CELL_MARK.EMPTY);
}

// --- dragging paints a run: the adapter builds one action per cell; the model just applies ---
{
    const m = createModel({ numRows: 1, numCols: 4, horHints: [[4]], verHints: [[1], [1], [1], [1]] });
    for (let c = 0; c < 4; c++) m.apply(m.markCellAction(0, c, 'left'));
    check('dragged run fills 4', runs(m.grid[0]).join(',') === '4');
    check('4-run row solved', m.isSolved());
}

// --- hint check-off toggles, and drag along a hint row toggles only cells that exist ---
{
    const m = createModel({ numRows: 2, numCols: 2, horHints: [[1], [1, 1]], verHints: [[1], [1]] });
    // Column -1 is the hint cell next to the grid (the LAST hint); -2 is one further left.
    check('col -1 maps to the last hint', m.horHintAction(1, -1).index === 1);
    check('col -2 maps to the first hint', m.horHintAction(1, -2).index === 0);
    m.apply(m.horHintAction(1, -2));
    check('hor hint toggled on', m.gridHorHints[1][0] === 1);
    m.apply(m.horHintAction(1, -2));
    check('hor hint toggled off', m.gridHorHints[1][0] === 0);
    check('hor hint action outside range is null', m.horHintAction(0, -9) === null);
    m.apply(m.verHintAction(0, -1));
    check('ver hint toggled on', m.gridVerHints[0][0] === 1);
    check('ver hint action outside range is null', m.verHintAction(0, -9) === null);
}

// --- undo restores exactly the previous cell value ---
{
    const m = createModel({ numRows: 1, numCols: 2, horHints: [[2]], verHints: [[1], [1]] });
    const a = m.markCellAction(0, 0, 'left');
    m.apply(a); m.unapply(a);
    check('unapply restores empty', m.grid[0][0] === CELL_MARK.EMPTY);
}

// --- solved is exact: a wrong extra run or wrong length fails; white marks never count ---
{
    const m = createModel({ numRows: 1, numCols: 5, horHints: [[2, 2]], verHints: [[1], [1], [], [1], [1]] });
    mark(m, 0, 0, CELL_MARK.BLACK); mark(m, 0, 1, CELL_MARK.BLACK); mark(m, 0, 3, CELL_MARK.BLACK);
    check('partial is not solved', !m.isSolved());
    mark(m, 0, 2, CELL_MARK.BLACK);
    check('wrong gap fails', !m.isSolved());
    mark(m, 0, 2, CELL_MARK.EMPTY); mark(m, 0, 4, CELL_MARK.BLACK);
    check('exact runs solve', m.isSolved());
    // marks (WHITE) must not break the run match
    const m2 = createModel({ numRows: 1, numCols: 2, horHints: [[2]], verHints: [[1], [1]] });
    mark(m2, 0, 0, CELL_MARK.BLACK); mark(m2, 0, 1, CELL_MARK.WHITE);
    check('white marks do not count as black', !m2.isSolved());
}

// --- encodeState / decodeState keep marks and check-offs ---
{
    const m = createModel({ numRows: 2, numCols: 2, horHints: [[1], [1]], verHints: [[1], [1]] });
    mark(m, 0, 0, CELL_MARK.BLACK); mark(m, 1, 1, CELL_MARK.WHITE); m.apply(m.horHintAction(0, -1));
    const m2 = createModel({ numRows: 2, numCols: 2, horHints: [[1], [1]], verHints: [[1], [1]] });
    m2.decodeState(m.encodeState());
    check('grid survives state round trip', m2.grid[0][0] === CELL_MARK.BLACK && m2.grid[1][1] === CELL_MARK.WHITE);
    check('hint check-off survives state round trip', m2.gridHorHints[0][0] === 1);
}

// --- resetGrid empties everything, including check-offs ---
{
    const m = createModel({ numRows: 1, numCols: 1, horHints: [[1]], verHints: [[1]] });
    mark(m, 0, 0, CELL_MARK.BLACK); m.apply(m.horHintAction(0, -1));
    m.resetGrid();
    check('reset clears grid', m.grid[0][0] === CELL_MARK.EMPTY);
    check('reset clears check-offs', m.gridHorHints[0][0] === 0);
    check('reset clears ended', m.ended === false);
}

console.log(bad ? `${bad} model check(s) FAILED` : 'nonogram-model checks: all ok');
process.exit(bad ? 1 : 0);
