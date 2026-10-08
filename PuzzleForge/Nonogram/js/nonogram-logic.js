// Nonogram's own logic layer: random-seed nonogram generation only (picture mode stays in
// Pictogram — notes/backlog.md "Random mode leaves Pictogram"). No DOM, no drawing.
//
// The model itself (grid, hint check-offs, move rules, solved check) is Pictogram's
// nonogram-model.js, reused by relative path — one home per fact (AGENTS.md R2), and the two
// players then behave identically on rules. Same for the generator and codec:
// util/nono-utils.js + util/id-parser.js already hold generateNonogram / hints / v1-v3 parsing.
// This file only re-exports what the player and creator need, so Nonogram's code never
// edits Pictogram's working files and Pictogram's own page is untouched by this split.
export {
    CELL_MARK, ACTION_TYPE, createModel
} from '../../Pictogram/js/nonogram-model.js';
export {
    solveNonogram, getPuzzle, getPuzzleFromInfos, generateNonogram, generateHints,
    generateGrid, getEmptyGrid, encodeGameState, decodeGameState,
    decryptWithGrid, getSteamGiftsURL, getPageURL, SG_REGEX, classifySecret
} from '../../Pictogram/js/util/nono-utils.js';
export { parseId, generateId } from '../../Pictogram/js/util/id-parser.js';
