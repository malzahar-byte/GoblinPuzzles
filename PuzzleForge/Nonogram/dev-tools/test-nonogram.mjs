// Nonogram (the random-seed split from Pictogram) tests, run from the repo root:
//   node PuzzleForge/Nonogram/dev-tools/test-nonogram.mjs
// Covers: the re-export seam points at the real Pictogram modules; generation -> link -> parse ->
// hints -> unique solution -> solve -> decrypt round trip; empty-grid model edge cases.
import * as nono from '../js/nonogram-logic.js';
import { createModel, CELL_MARK } from '../js/nonogram-logic.js';

let bad = 0;
const check = (name, ok) => { if (!ok) { bad++; console.log('FAIL', name); } };

// The seam must be Pictogram's real code, not a copy that can drift.
const seam = await import('../../Pictogram/js/nonogram-model.js');
check('createModel is Pictogram\'s own export', nono.createModel === seam.createModel);
check('CELL_MARK is Pictogram\'s own export', nono.CELL_MARK === seam.CELL_MARK);

// Full round trip at three sizes (the same call the player page makes when no id is given).
for (const [rows, cols] of [[6, 6], [10, 10], [15, 12]]) {
    const id = nono.generateNonogram(rows, cols, 'Test msg ' + rows + 'x' + cols, 0);
    const infos = nono.parseId(id);
    check(`v${rows}x${cols} parse keeps size`, infos.numRows === rows && infos.numCols === cols);
    const [horHints, verHints] = nono.getPuzzleFromInfos(infos);
    check(`v${rows}x${cols} hints shape`, horHints.length === rows && verHints.length === cols);
    const solved = nono.solveNonogram(horHints, verHints);
    check(`v${rows}x${cols} has exactly one solution`, solved !== null);
    if (!solved) continue;
    const model = createModel({ numRows: rows, numCols: cols, horHints, verHints });
    // fill the player grid to the solution, then the model must report solved and decrypt
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (solved[r][c] === 1) model.apply({ type: nono.ACTION_TYPE.MARK_CELL, row: r, col: c, from: CELL_MARK.EMPTY, to: CELL_MARK.BLACK });
    }
    check(`v${rows}x${cols} model reports solved`, model.isSolved());
    const msg = nono.decryptWithGrid(infos.enc, infos.msgType, model.grid);
    check(`v${rows}x${cols} message decrypts`, msg === 'Test msg ' + rows + 'x' + cols);
}

// A model with no marks is never solved, even with empty hint lines present elsewhere.
{
    const id = nono.generateNonogram(8, 8, 'Edge case', 0);
    const infos = nono.parseId(id);
    const [horHints, verHints] = nono.getPuzzleFromInfos(infos);
    const model = createModel({ numRows: 8, numCols: 8, horHints, verHints });
    check('fresh model is not solved', !model.isSolved());
    const saved = model.encodeState();
    model.decodeState(saved);
    check('state round trip keeps freshness', !model.isSolved());
}

console.log(bad ? `${bad} Nonogram check(s) FAILED` : 'Nonogram checks: all ok');
process.exit(bad ? 1 : 0);
