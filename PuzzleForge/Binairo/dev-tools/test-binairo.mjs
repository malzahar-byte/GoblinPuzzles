// Binairo tests: solver counts, generator uniqueness, link round-trip, decrypt.
// The 8x8 case MUST finish quickly now — the old column-only-at-the-leaf check made it time out.
import { solve, generate, encodeFromMessage, encodeSeededLink, parseLink, decryptMessage, isSolved, logicSolvable, CELL } from '../js/binairo-logic.js';

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

// The 2026-10-08 "are our 6x6 boards just too hard?" report, kept as plain givens (it used to be
// a link; old link versions are retired, invariant 2). Unique, but NOT finishable with the three
// player rules — the generator no longer ships boards like it.
{
    const hard = [-1,-1,1,-1,-1,-1,0,-1,-1,-1,-1,0,-1,-1,-1,-1,1,1,-1,-1,-1,-1,-1,-1,0,-1,-1,0,-1,-1,-1,-1,-1,0,-1,-1];
    check('fixture 6x6 is unique', solve(6, hard, 2).count === 1);
    check('fixture 6x6 is NOT hand-solvable (the report)', logicSolvable(6, hard) === false);
}

// Generation across sizes; the 8x8 one is the regression.
for (const N of [6, 8, 10]) {
    const before = Date.now();
    const p = generate(N);
    const took = Date.now() - before;
    check(`generate ${N}x${N} returned a puzzle`, !!p);
    if (!p) continue;
    const res = solve(N, p.givens, 2);
    check(`${N}x${N} puzzle has exactly one solution`, res.count === 1 && !res.aborted);
    // Every shipped board must be finishable with the three rules a player uses; uniqueness
    // alone allowed boards that need a guess.
    check(`${N}x${N} puzzle is hand-solvable`, logicSolvable(N, p.givens) === true);
    const msg = 'Secret ' + N + '!';
    const info = parseLink(encodeFromMessage(N, msg));
    const re = solve(info.N, info.givens, 2);
    check(`${N}x${N} seeded round-trips`, re.count === 1 && info.N === N && info.version === 2);
    const solvedCells = re.rows.flat().map(v => v === 1 ? CELL.ONE : CELL.ZERO);
    check(`${N}x${N} decrypts the message`, decryptMessage(info.enc, info.msgType, solvedCells) === msg);
    console.log(`${N}x${N}: generated in ${took} ms`);
    check(`${N}x${N} generated under 5 s`, took < 5000);
}

// ---- seeded links: same message + size gives the same puzzle and the same link ----
const idA = encodeFromMessage(6, 'Nice work!');
const idB = encodeFromMessage(6, 'Nice work!');
check('seeded: same message + size gives the same link', idA === idB);
const pA = parseLink(idA);
check('seeded: link version is 2', pA.version === 2 && pA.N === 6);
const sA = solve(pA.N, pA.givens, 2);
check('seeded: unique solution', sA.count === 1 && !sA.aborted);
check('seeded: hand-solvable', logicSolvable(pA.N, pA.givens));
const cellsA = sA.rows.flat().map(v => v === 1 ? CELL.ONE : CELL.ZERO);
check('seeded: message decrypts with the solution', decryptMessage(pA.enc, pA.msgType, cellsA) === 'Nice work!');
check('seeded: a different message gives a different link', encodeFromMessage(6, 'Another secret') !== idA);
const pSeed = parseLink(encodeSeededLink(6, 12345, 'Pinned seed'));
check('seeded: pinned seed round-trips', pSeed.seed === 12345 && pSeed.givens.length === 36);

// ---- old link versions are retired, not kept readable (invariant 2) ----
let rejected = false;
try { parseLink('IeqUb-UsJEgNoQQGcb_XI-Eskk-c'); } catch (e) { rejected = true; }
check('v1 link is rejected (no legacy decoder)', rejected);

const total = Date.now() - t0;
console.log(`total ${total} ms`);
console.log(bad ? `${bad} Binairo check(s) FAILED` : 'Binairo checks: all ok');
process.exit(bad ? 1 : 0);
