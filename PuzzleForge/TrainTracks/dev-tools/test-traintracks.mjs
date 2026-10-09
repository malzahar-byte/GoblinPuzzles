// Train Tracks tests: the rule check, generator uniqueness, seeded link round-trip and decrypt.
// The generator is the risky part: it must never ship a board whose clues have a second loop,
// because the secret message is locked against the solution (AGENTS.md invariant 4).
import * as tt from '../js/traintracks-logic.js';
import { DIR } from '../js/traintracks-logic.js';

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let bad = 0;
const check = (name, ok) => { if (!ok) { bad++; console.log('FAIL', name); } };

// ---- the rule check on the smallest possible loop (a 2x2 ring) ----
{
    const ring = [DIR.S | DIR.E, DIR.S | DIR.W, DIR.N | DIR.E, DIR.N | DIR.W];
    const { rowClue, colClue } = tt.deriveClues(2, 2, ring);
    check('2x2 ring passes the rule check', tt.isSolved(2, 2, rowClue, colClue, ring, ring));
    check('2x2 ring clues have exactly one solution', tt.solve(2, 2, rowClue, colClue, ring, 2).count === 1);
    const glued = ring.slice();
    glued[0] = DIR.N | DIR.S; // breaks the ring into a line
    check('an unmatched side fails the rule check', !tt.isSolved(2, 2, rowClue, colClue, glued, glued));
}

// ---- generation across sizes ----
for (const [W, H] of [[4, 4], [6, 6], [8, 8], [10, 10]]) {
    const before = Date.now();
    const p = tt.generate(W, H, mulberry32(700 + W), { tries: 40 });
    const took = Date.now() - before;
    check(`${W}x${H} generated a puzzle`, !!p);
    if (!p) continue;
    const track = p.solution.filter(Boolean).length;
    const res = tt.solve(W, H, p.rowClue, p.colClue, p.givens, 2);
    check(`${W}x${H} clues have exactly one solution`, res.count === 1 && !res.aborted);
    check(`${W}x${H} solution satisfies every rule`, tt.isSolved(W, H, p.rowClue, p.colClue, p.givens, p.solution));
    check(`${W}x${H} has a real loop (>= 4 cells)`, track >= 4);
    check(`${W}x${H} pieces all join exactly two sides`, p.solution.every(q => q === 0 || [3, 5, 6, 9, 10, 12].includes(q)));
    console.log(`${W}x${H}: attempts ${p.attempts}, track ${track}, hidden clues ${[...p.rowClue, ...p.colClue].filter(v => v < 0).length}, ${took} ms`);
    check(`${W}x${H} generated under 5 s`, took < 5000);
}

// ---- seeded links: same message + size gives the same puzzle and the same link ----
const idA = tt.encodeFromMessage(6, 6, 'Well done!', 0);
const idB = tt.encodeFromMessage(6, 6, 'Well done!', 0);
check('seeded: same message + size gives the same link', idA === idB);
const pA = tt.parseLink(idA);
check('seeded: link version is 2', pA.version === 2 && pA.W === 6 && pA.H === 6);
const sA = tt.solve(pA.W, pA.H, pA.rowClue, pA.colClue, pA.givens, 2);
check('seeded: unique solution', sA.count === 1 && !sA.aborted);
check('seeded: message decrypts with the solution', tt.decryptMessage(pA.enc, pA.msgType, sA.pieces) === 'Well done!');
check('seeded: a different message gives a different link', tt.encodeFromMessage(6, 6, 'Another secret', 0) !== idA);
const pSeed = tt.parseLink(tt.encodeSeededLink(6, 6, 12345, 'Pinned seed', 0));
check('seeded: pinned seed round-trips', pSeed.seed === 12345 && pSeed.rowClue.length === 6);
check('seeded: generation is deterministic for a seed', JSON.stringify(tt.generateFromSeed(6, 6, 12345)) === JSON.stringify(tt.generateFromSeed(6, 6, 12345)));

console.log(bad ? `${bad} Train Tracks check(s) FAILED` : 'Train Tracks checks: all ok');
process.exit(bad ? 1 : 0);
