// Hashi tests: solver counts, generator, and the full create -> link -> parse -> solve -> decrypt round trip.
import { solve, generate, encodeFromMessage, encodeSeededLink, parseLink, decryptMessage } from '../js/hashi-logic.js';
let bad = 0;
const check = (name, ok) => { if (!ok) { bad++; console.log('FAIL', name); } };
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// hand-made cases: a ring of four 2s is unique; an impossible clue has no solution
const ring = [{ r: 0, c: 0, n: 2 }, { r: 0, c: 3, n: 2 }, { r: 3, c: 0, n: 2 }, { r: 3, c: 3, n: 2 }];
check('ring has exactly 1 solution', solve(4, 4, ring).count === 1);
check('impossible puzzle has 0 solutions', solve(4, 4, [{ r: 0, c: 0, n: 1 }, { r: 0, c: 2, n: 2 }]).count === 0);
// two pairs that share no row or column can't be joined: every clue is met but the islands split in two
check('two separate groups are rejected', solve(8, 5, [{ r: 0, c: 0, n: 2 }, { r: 0, c: 2, n: 2 }, { r: 3, c: 4, n: 2 }, { r: 3, c: 6, n: 2 }]).count === 0);

let made = 0, failed = 0, wanted = 0;
for (const [W, H] of [[7, 7], [9, 9], [11, 8]]) for (let k = 0; k < 4; k++) {
    wanted++;
    const p = generate(W, H, rnd);
    if (!p) { failed++; continue; }
    made++;
    const msg = 'Secret ' + k + '!';
    const id = encodeFromMessage(W, H, msg);
    const info = parseLink(id);
    const s = solve(info.W, info.H, info.islands);
    check(`seeded round trip ${W}x${H} #${k}`, s.count === 1 && info.W === W && info.H === H &&
        info.version === 2 && decryptMessage(info.enc, s.values) === msg);
}
console.log(`generated ${made} of ${wanted} puzzles (${failed} gave up after the try limit; not counted as failures)`);
check('generator produced at least half of the requested puzzles', made >= wanted / 2);

// ---- seeded links: same message + size gives the same puzzle and the same link ----
const idA = encodeFromMessage(7, 7, 'Well done!');
const idB = encodeFromMessage(7, 7, 'Well done!');
check('seeded: same message + size gives the same link', idA === idB);
const pA = parseLink(idA);
check('seeded: link version is 2', pA.version === 2 && pA.W === 7 && pA.H === 7);
const sA = solve(pA.W, pA.H, pA.islands);
check('seeded: unique solution', sA.count === 1 && !sA.aborted);
check('seeded: message decrypts with the solution', decryptMessage(pA.enc, sA.values) === 'Well done!');
check('seeded: a different message gives a different link', encodeFromMessage(7, 7, 'Another secret') !== idA);
const idSeed = encodeSeededLink(7, 7, 12345, 'Pinned seed');
const pSeed = parseLink(idSeed);
check('seeded: pinned seed round-trips', pSeed.seed === 12345 && pSeed.islands.length > 0);

// ---- old link versions are retired, not kept readable (invariant 2) ----
let rejected = false;
try { parseLink('-Xrybal-KMq-okrX60hypwGl'); } catch (e) { rejected = true; }
check('v1 link is rejected (no legacy decoder)', rejected);
console.log(bad ? `${bad} Hashi check(s) FAILED` : 'Hashi checks: all ok');
process.exit(bad ? 1 : 0);
