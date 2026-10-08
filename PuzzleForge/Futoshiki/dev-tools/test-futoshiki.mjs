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
  const id = fut.encodeLink(p.N, p.givens, p.ineqH, p.ineqV, 'Fut ' + i, 0);
  const q = fut.parseLink(id);
  check('roundtrip N #' + i, q.N === p.N);
  check('roundtrip givens #' + i, q.givens.join(',') === p.givens.join(','));
  check('roundtrip ineqH #' + i, q.ineqH.join(',') === p.ineqH.join(','));
  check('roundtrip ineqV #' + i, q.ineqV.join(',') === p.ineqV.join(','));
  check('decrypt #' + i, fut.decryptMessage(q.enc, q.msgType, p.solution) === 'Fut ' + i);
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
console.log(fails === 0 ? 'All Futoshiki checks passed.' : `${fails} failure(s).`);
process.exit(fails === 0 ? 0 : 1);
