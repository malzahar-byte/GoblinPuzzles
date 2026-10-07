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
  const id = sky.encodeLink(p.N, p.givens, p.clues, 'Sky ' + i, 0);
  const q = sky.parseLink(id);
  check('roundtrip N #' + i, q.N === p.N);
  check('roundtrip givens #' + i, q.givens.join(',') === p.givens.join(','));
  check('roundtrip clues #' + i, ['top','bottom','left','right'].every(d => q.clues[d].join(',') === p.clues[d].join(',')));
  check('decrypt #' + i, sky.decryptMessage(q.enc, q.msgType, p.solution) === 'Sky ' + i);
}
console.log(`generated ${made}/${M} Skyscrapers puzzles`);
console.log(fails === 0 ? 'All Skyscrapers checks passed.' : `${fails} failure(s).`);
process.exit(fails === 0 ? 0 : 1);
