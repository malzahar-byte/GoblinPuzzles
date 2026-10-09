// Nurikabe tests: generator uniqueness, the rule check, link round-trip and decrypt.
// The generator is the risky part: it must never ship a board whose clues have a second
// solution, because the secret message is locked against the solution (AGENTS.md invariant 4).
import { CELL, generate, solve, isSolved, encodeFromMessage, encodeSeededLink, parseLink, decryptMessage } from '../js/nurikabe-logic.js';

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let bad = 0;
const check = (name, ok) => { if (!ok) { bad++; console.log('FAIL', name); } };

// ---- the rule check itself (against a real generated board) ----
{
    const p = generate(6, 6, mulberry32(11), { tries: 400 });
    check('rule-check board generated', !!p);
    if (p) {
        const { W, H, clues, solution } = p;
        check('a solved board passes the rule check', isSolved(W, H, clues, solution));
        const unknown = solution.slice();
        const firstIsland = unknown.indexOf(CELL.ISLAND);
        unknown[firstIsland] = 0;   // neither black nor white: the UI cannot make this, the check must still refuse it
        check('a cell that is neither black nor white fails the rule check', !isSolved(W, H, clues, unknown));
        const shrunk = solution.slice();
        shrunk[firstIsland] = CELL.SEA;
        check('an island of the wrong size fails', !isSolved(W, H, clues, shrunk));
        // force a 2x2 sea block: pick a 2x2 that holds at least one island cell and flood it
        let blocky = null;
        for (let r = 0; r + 1 < H && !blocky; r++) for (let c = 0; c + 1 < W && !blocky; c++) {
            const quad = [r * W + c, r * W + c + 1, (r + 1) * W + c, (r + 1) * W + c + 1];
            if (quad.some(i => solution[i] === CELL.ISLAND)) {
                blocky = solution.slice();
                for (const i of quad) blocky[i] = CELL.SEA;
            }
        }
        check('a 2x2 sea block fails', !!blocky && !isSolved(W, H, clues, blocky));
    }
}

// ---- generation across sizes ----
for (const [W, H] of [[6, 6], [8, 8], [10, 10]]) {
    const before = Date.now();
    const p = generate(W, H, mulberry32(700 + W), { tries: 400 });
    const took = Date.now() - before;
    check(`${W}x${H} generated a puzzle`, !!p);
    if (!p) continue;
    const res = solve(W, H, p.clues, 2);
    check(`${W}x${H} clues have exactly one solution`, res.count === 1 && !res.aborted);
    check(`${W}x${H} solution satisfies every rule`, isSolved(W, H, p.clues, p.solution));
    check(`${W}x${H} has at least two islands`, p.clues.filter(Boolean).length >= 2);
    const msg = 'Nuri ' + W;
    const q = parseLink(encodeFromMessage(W, H, msg, 0));
    check(`${W}x${H} seeded link round-trips`, q.W === W && q.H === H && q.version === 2);
    const re = solve(q.W, q.H, q.clues, 2);
    // solve() must hand back the player vocabulary (ISLAND/SEA), not its internal group ids:
    // the browser's board, the rule check and the message lock all read that state directly.
    check(`${W}x${H} solve() state satisfies every rule`, isSolved(q.W, q.H, q.clues, re.state));
    check(`${W}x${H} decrypts the message`, decryptMessage(q.enc, q.msgType, re.state) === msg);
    console.log(`${W}x${H}: attempts ${p.attempts}, islands ${p.clues.filter(Boolean).length}, ${took} ms`);
    check(`${W}x${H} generated under 5 s`, took < 5000);
}

// ---- seeded links: same message + size gives the same puzzle and the same link ----
const idA = encodeFromMessage(6, 6, 'Cloud Logic 1', 0);
const idB = encodeFromMessage(6, 6, 'Cloud Logic 1', 0);
check('seeded: same message + size gives the same link', idA === idB);
const pA = parseLink(idA);
check('seeded: link version is 2', pA.version === 2 && pA.W === 6 && pA.H === 6);
const sA = solve(pA.W, pA.H, pA.clues, 2);
check('seeded: unique solution', sA.count === 1 && !sA.aborted);
check('seeded: message decrypts with the solution', decryptMessage(pA.enc, pA.msgType, sA.state) === 'Cloud Logic 1');
check('seeded: a different message gives a different link', encodeFromMessage(6, 6, 'Another secret', 0) !== idA);
const pSeed = parseLink(encodeSeededLink(6, 6, 12345, 'Pinned seed', 0));
check('seeded: pinned seed round-trips', pSeed.seed === 12345 && pSeed.clues.length === 36);

// ---- old link versions are retired, not kept readable (invariant 2) ----
let rejected = false;
try { parseLink('-g-g--ccFqi-s-qa-kE----Ea-agEpEgio-olaK-_E-qQ------Eca--d-IcdacF-g-uF-Fg---'); } catch (e) { rejected = true; }
check('v1 link is rejected (no legacy decoder)', rejected);

console.log(bad ? `${bad} Nurikabe check(s) FAILED` : 'Nurikabe checks: all ok');
process.exit(bad ? 1 : 0);
