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
  const id = akari.encodeLink(p.R, p.C, p.walls, p.nums, 'Hello ' + i, 0);
  const parsed = akari.parseLink(id);
  check('roundtrip size #' + i, parsed.R === p.R && parsed.C === p.C);
  check('roundtrip walls #' + i, parsed.walls.join('') === p.walls.join(''));
  check('roundtrip nums #' + i, parsed.nums.join(',') === p.nums.join(','));
  check('message decrypts #' + i, akari.decryptMessage(parsed.enc, parsed.msgType, p.solution) === 'Hello ' + i);
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

// ---- version-1 links (the board stored in the URL) keep working forever ----
const oldP = akari.generate(6, 6, mulberry32(7), { tries: 400 });
if (oldP) {
  const back = akari.parseLink(akari.encodeLink(oldP.R, oldP.C, oldP.walls, oldP.nums, 'old link', 0));
  check('v1: board link still parses', back.version === 1 && back.walls.join('') === oldP.walls.join(''));
  check('v1: nums survive', back.nums.join(',') === oldP.nums.join(','));
}
console.log(`generated ${made}/${N} puzzles`);
console.log(fails === 0 ? 'All Akari checks passed.' : `${fails} failure(s).`);
process.exit(fails === 0 ? 0 : 1);
