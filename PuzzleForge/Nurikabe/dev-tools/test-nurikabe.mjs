// Nurikabe tests: generator uniqueness, the rule check, link round-trip and decrypt.
// The generator is the risky part: it must never ship a board whose clues have a second
// solution, because the secret message is locked against the solution (AGENTS.md invariant 4).
import { CELL, generate, solve, isSolved, encodeLink, parseLink, decryptMessage } from '../js/nurikabe-logic.js';

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
        unknown[firstIsland] = CELL.UNKNOWN;
        check('an unknown cell fails the rule check', !isSolved(W, H, clues, unknown));
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
    const id = encodeLink(W, H, p.clues, msg, 0);
    const q = parseLink(id);
    check(`${W}x${H} link round-trips`, q.W === W && q.H === H && q.clues.join(',') === p.clues.join(','));
    const re = solve(q.W, q.H, q.clues, 2);
    // solve() must hand back the player vocabulary (ISLAND/SEA), not its internal group ids:
    // the browser's board, the rule check and the message lock all read that state directly.
    check(`${W}x${H} solve() state satisfies every rule`, isSolved(q.W, q.H, q.clues, re.state));
    check(`${W}x${H} decrypts the message`, decryptMessage(q.enc, q.msgType, re.state) === msg);
    console.log(`${W}x${H}: attempts ${p.attempts}, islands ${p.clues.filter(Boolean).length}, ${took} ms`);
    check(`${W}x${H} generated under 5 s`, took < 5000);
}

console.log(bad ? `${bad} Nurikabe check(s) FAILED` : 'Nurikabe checks: all ok');
process.exit(bad ? 1 : 0);
