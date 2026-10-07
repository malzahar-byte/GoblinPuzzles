// Binairo tests: solver counts, generator uniqueness, link round-trip, decrypt.
// The 8x8 case MUST finish quickly now — the old column-only-at-the-leaf check made it time out.
import { solve, generate, encodeLink, parseLink, decryptMessage, isSolved, CELL } from '../js/binairo-logic.js';

let bad = 0;
const check = (name, ok) => { if (!ok) { bad++; console.log('FAIL', name); } };
const t0 = Date.now();

// A hand-made 6x6 with a unique solution (classic Binairo pattern).
const N6 = 6;
const givens6 = new Array(N6 * N6).fill(-1);
// row0: 1 1 0 0 0 1 -> not balanced; build a known-valid grid instead:
const grid6 = [
    [1, 1, 0, 1, 0, 0],
    [0, 0, 1, 0, 1, 1],
    [1, 0, 0, 1, 1, 0],
    [0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 1, 0],
    [0, 1, 1, 0, 0, 1]
];
for (let r = 0; r < N6; r++) for (let c = 0; c < N6; c++) givens6[r * N6 + c] = grid6[r][c];
check('full 6x6 grid is a valid solution', isSolved(N6, givens6, grid6.flat().map(v => v === 1 ? CELL.ONE : CELL.ZERO)));
check('full 6x6 grid solves uniquely', solve(N6, givens6, 2).count === 1);

// Generation across sizes; the 8x8 one is the regression.
for (const N of [6, 8, 10]) {
    const before = Date.now();
    const p = generate(N);
    const took = Date.now() - before;
    check(`generate ${N}x${N} returned a puzzle`, !!p);
    if (!p) continue;
    const res = solve(N, p.givens, 2);
    check(`${N}x${N} puzzle has exactly one solution`, res.count === 1 && !res.aborted);
    const msg = 'Secret ' + N + '!';
    const id = encodeLink(N, p.givens, msg);
    const info = parseLink(id);
    const re = solve(info.N, info.givens, 2);
    check(`${N}x${N} link round-trips`, re.count === 1 && info.N === N && JSON.stringify(info.givens) === JSON.stringify(p.givens));
    const solvedCells = re.rows.flat().map(v => v === 1 ? CELL.ONE : CELL.ZERO);
    check(`${N}x${N} decrypts the message`, decryptMessage(info.enc, info.msgType, solvedCells) === msg);
    console.log(`${N}x${N}: generated in ${took} ms`);
    check(`${N}x${N} generated under 5 s`, took < 5000);
}

const total = Date.now() - t0;
console.log(`total ${total} ms`);
console.log(bad ? `${bad} Binairo check(s) FAILED` : 'Binairo checks: all ok');
process.exit(bad ? 1 : 0);
