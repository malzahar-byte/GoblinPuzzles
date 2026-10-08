// Nonogram's board: re-uses Pictogram's adapter unchanged (same moves, same drawing rules, same
// look), so both players are guaranteed identical behaviour. One home per fact (AGENTS.md R2);
// if the board ever needs to differ, this re-export is the single seam to change.
export { createNonogramAdapter } from '../../Pictogram/js/nonogram-board.js';
export { BOARD_STYLES, buildPalette } from '../../Pictogram/js/util/board-styles.js';
