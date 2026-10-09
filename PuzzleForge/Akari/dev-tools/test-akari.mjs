// Akari logic tests: generation uniqueness, solved check, link round-trip, secret decrypt.
// Run from the repo root: node Akari/dev-tools/test-akari.mjs
import * as akari from '../js/akari-logic.js';

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let fails = 0;
const check = (name, ok) => { if (!ok) { fails++; console.log('FAIL:', name); } };

const R = 7, C = 7, N = 20;
let made = 0;
for (let i = 0; i < N; i++) {
  const p = akari.generate(R, C, mulberry32(1000 + i), { tries: 400 });
  if (!p) { console.log('generate() returned null for seed', i); continue; }
  made++;
  const res = akari.solve(p.R, p.C, p.walls, p.nums, 2);
  check('unique solution #' + i, res.count === 1 && !res.aborted);
  check('solution satisfies rules #' + i, akari.isSolved(p.R, p.C, p.walls, p.nums, p.solution));
}
// ---- version-2 links: the same message, size and options must give the same puzzle and link ----
const MSG = 'Cloud Logic 1';
const idA = akari.encodeFromMessage(7, 7, MSG, 0);
const idB = akari.encodeFromMessage(7, 7, MSG, 0);
check('seeded: same message + size gives the same link', idA === idB);
const pA = akari.parseLink(idA);
check('seeded: link version is 2', pA.version === 2);
check('seeded: size survives', pA.R === 7 && pA.C === 7);
const solA = akari.solve(pA.R, pA.C, pA.walls, pA.nums, 2);
check('seeded: unique solution', solA.count === 1 && !solA.aborted);
check('seeded: message decrypts with the solution', akari.decryptMessage(pA.enc, pA.msgType, solA.lamps) === MSG);
check('seeded: a different message gives a different link', akari.encodeFromMessage(7, 7, 'Another secret', 0) !== idA);
const g1 = akari.generateFromSeed(7, 7, 12345), g2 = akari.generateFromSeed(7, 7, 12345);
check('seeded: generator is deterministic for a seed', !!g1 && !!g2 && g1.walls.join('') === g2.walls.join(''));
const idSeed = akari.encodeSeededLink(7, 7, 12345, 'Pinned seed', 0);
const pSeed = akari.parseLink(idSeed);
const solSeed = akari.solve(pSeed.R, pSeed.C, pSeed.walls, pSeed.nums, 2);
check('seeded: pinned seed round-trips to the same board',
  pSeed.version === 2 && pSeed.seed === 12345 && pSeed.walls.join('') === g1.walls.join(''));
check('seeded: pinned-seed message decrypts', akari.decryptMessage(pSeed.enc, pSeed.msgType, solSeed.lamps) === 'Pinned seed');

// ---- old link versions are retired, not kept readable (invariant 2) ----
let rejected = false;
try { akari.parseLink('ooAqM4-kPW8e--eiYWs-1Iwg-_dEkY2WW--'); } catch (e) { rejected = true; }
check('v1 link is rejected (no legacy decoder)', rejected);
console.log(`generated ${made}/${N} puzzles`);
console.log(fails === 0 ? 'All Akari checks passed.' : `${fails} failure(s).`);
process.exit(fails === 0 ? 0 : 1);
