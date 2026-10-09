import * as fut from '../js/futoshiki-logic.js';
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
let fails = 0; const check = (n, ok) => { if (!ok) { fails++; console.log('FAIL:', n); } };
const N = 5, M = 15;
let made = 0;
for (let i = 0; i < M; i++) {
  const p = fut.generate(N, mulberry32(400 + i), { tries: 120 });
  if (!p) { console.log('generate() null for seed', i); continue; }
  made++;
  const res = fut.solve(p.N, p.givens, p.ineqH, p.ineqV, 2);
  check('unique #' + i, res.count === 1 && !res.aborted);
  check('solution valid #' + i, fut.isSolved(p.N, p.givens, p.ineqH, p.ineqV, p.solution));
  const msg = 'Fut ' + i;
  const q = fut.parseLink(fut.encodeFromMessage(N, msg, 0));
  const sol = fut.solve(q.N, q.givens, q.ineqH, q.ineqV, 2);
  check('seeded N #' + i, q.N === N && q.version === 2);
  check('seeded unique #' + i, sol.count === 1 && !sol.aborted);
  check('decrypt #' + i, fut.decryptMessage(q.enc, q.msgType, sol.grid) === msg);
  // A published Futoshiki shows a sparse set of signs, not one between every neighbouring pair
  // (owner report, 2026-10-08), and no single sign may be droppable (the generator's dedupe).
  const signs = p.ineqH.filter(Boolean).length + p.ineqV.filter(Boolean).length;
  check('signs are sparse #' + i + ' (' + signs + '/' + (2 * N * (N - 1)) + ')', signs <= N * (N - 1));
  const redundant = (t, k) => {
    const save = t[k]; t[k] = 0;
    const r = fut.solve(p.N, p.givens, p.ineqH, p.ineqV, 2);
    t[k] = save;
    return !r.aborted && r.count === 1;
  };
  check('no redundant H sign #' + i, !p.ineqH.some((v, k) => v && redundant(p.ineqH, k)));
  check('no redundant V sign #' + i, !p.ineqV.some((v, k) => v && redundant(p.ineqV, k)));
}
console.log(`generated ${made}/${M} Futoshiki puzzles`);

// ---- seeded links: same message + size gives the same puzzle and the same link ----
const idA = fut.encodeFromMessage(5, 'Nice work!', 0);
const idB = fut.encodeFromMessage(5, 'Nice work!', 0);
check('seeded: same message + size gives the same link', idA === idB);
const pA = fut.parseLink(idA);
check('seeded: link version is 2', pA.version === 2 && pA.N === 5);
const sA = fut.solve(pA.N, pA.givens, pA.ineqH, pA.ineqV, 2);
check('seeded: unique solution', sA.count === 1 && !sA.aborted);
check('seeded: message decrypts with the solution', fut.decryptMessage(pA.enc, pA.msgType, sA.grid) === 'Nice work!');
check('seeded: a different message gives a different link', fut.encodeFromMessage(5, 'Another secret', 0) !== idA);
const pSeed = fut.parseLink(fut.encodeSeededLink(5, 12345, 'Pinned seed', 0));
check('seeded: pinned seed round-trips', pSeed.seed === 12345 && pSeed.givens.length === 25);
check('seeded: generation is deterministic for a seed', JSON.stringify(fut.generateFromSeed(5, 12345)) === JSON.stringify(fut.generateFromSeed(5, 12345)));

// ---- old link versions are retired, not kept readable (invariant 2) ----
let rejected = false;
try { fut.parseLink('--d_-O_ig-Vco-qoo-o-M-i-gggdk-F-dE-ci_-sa-_gaa_'); } catch (e) { rejected = true; }
check('v1 link is rejected (no legacy decoder)', rejected);

console.log(fails === 0 ? 'All Futoshiki checks passed.' : `${fails} failure(s).`);
process.exit(fails === 0 ? 0 : 1);
