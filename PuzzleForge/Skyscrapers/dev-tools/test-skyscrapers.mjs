import * as sky from '../js/skyscrapers-logic.js';
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let fails = 0; const check = (n, ok) => { if (!ok) { fails++; console.log('FAIL:', n); } };
const N = 6, M = 15;
let made = 0;
for (let i = 0; i < M; i++) {
  const p = sky.generate(N, mulberry32(200 + i), { tries: 120 });
  if (!p) { console.log('generate() null for seed', i); continue; }
  made++;
  const res = sky.solve(p.N, p.givens, p.clues, 2);
  check('unique #' + i, res.count === 1 && !res.aborted);
  check('solution valid #' + i, sky.isSolved(p.N, p.givens, p.clues, p.solution));
  const msg = 'Sky ' + i;
  const q = sky.parseLink(sky.encodeFromMessage(N, msg, 0));
  const sol = sky.solve(q.N, q.givens, q.clues, 2);
  check('seeded N #' + i, q.N === N && q.version === 2);
  check('seeded unique #' + i, sol.count === 1 && !sol.aborted);
  check('decrypt #' + i, sky.decryptMessage(q.enc, q.msgType, sol.grid) === msg);
  // Every generated board keeps a few given numbers so a player has a starting point
  // (owner report 2026-10-08: a 4x4 with no numbers at all felt unreasonably hard).
  check('givens floor #' + i, p.givens.filter(Boolean).length >= Math.max(2, Math.round(N * N * 0.12)));
}
console.log(`generated ${made}/${M} Skyscrapers puzzles`);

// ---- seeded links: same message + size gives the same puzzle and the same link ----
const idA = sky.encodeFromMessage(5, 'Nice work!', 0);
const idB = sky.encodeFromMessage(5, 'Nice work!', 0);
check('seeded: same message + size gives the same link', idA === idB);
const sA = sky.parseLink(idA);
check('seeded: link version is 2', sA.version === 2 && sA.N === 5);
const solA = sky.solve(sA.N, sA.givens, sA.clues, 2);
check('seeded: unique solution', solA.count === 1 && !solA.aborted);
check('seeded: message decrypts with the solution', sky.decryptMessage(sA.enc, sA.msgType, solA.grid) === 'Nice work!');
check('seeded: a different message gives a different link', sky.encodeFromMessage(5, 'Another secret', 0) !== idA);
const pSeed = sky.parseLink(sky.encodeSeededLink(5, 12345, 'Pinned seed', 0));
check('seeded: pinned seed round-trips', pSeed.seed === 12345 && pSeed.givens.length === 25);

// ---- old link versions are retired, not kept readable (invariant 2) ----
let rejected = false;
try { sky.parseLink('_GkduhIEGcUqE-d-sFF-j-Ehwh--aeaUka-fyxo'); } catch (e) { rejected = true; }
check('v1 link is rejected (no legacy decoder)', rejected);

console.log(fails === 0 ? 'All Skyscrapers checks passed.' : `${fails} failure(s).`);
process.exit(fails === 0 ? 0 : 1);
