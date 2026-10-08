// Futoshiki logic. No DOM. Latin square 1..N + adjacent inequalities (0 = none, 1 = '<', 2 = '>').
// ineqH[r*(N-1)+c] is between (r,c) and (r,c+1); ineqV[r*N+c] between (r,c) and (r+1,c).
// Player grid: 0 = empty, 1..N = value.
import { BitSeq } from '../../../shared/gdp-bitseq.js?v=13.0.0logic';
import { bitsFrom, lockMessage, unlockMessage } from '../../../shared/gdp-secret.js?v=13.0.0logic';

export const ACTION_TYPE = { CELL: 0 };
export const MAXN = 15;
const idx = (N, r, c) => r * N + c;

export function isSolved(N, givens, ineqH, ineqV, grid) {
  for (let i = 0; i < N * N; i++) { const v = grid[i]; if (v < 1 || v > N) return false; if (givens[i] && v !== givens[i]) return false; }
  for (let r = 0; r < N; r++) { const s = new Set(); for (let c = 0; c < N; c++) s.add(grid[idx(N, r, c)]); if (s.size !== N) return false; }
  for (let c = 0; c < N; c++) { const s = new Set(); for (let r = 0; r < N; r++) s.add(grid[idx(N, r, c)]); if (s.size !== N) return false; }
  for (let r = 0; r < N; r++) for (let c = 0; c + 1 < N; c++) { const t = ineqH[r * (N - 1) + c]; if (!t) continue; const a = grid[idx(N, r, c)], b = grid[idx(N, r, c + 1)]; if (t === 1 && !(a < b)) return false; if (t === 2 && !(a > b)) return false; }
  for (let r = 0; r + 1 < N; r++) for (let c = 0; c < N; c++) { const t = ineqV[r * N + c]; if (!t) continue; const a = grid[idx(N, r, c)], b = grid[idx(N, r + 1, c)]; if (t === 1 && !(a < b)) return false; if (t === 2 && !(a > b)) return false; }
  return true;
}

export function solve(N, givens, ineqH, ineqV, limit = 2, maxNodes = 400000) {
  const grid = new Array(N * N).fill(0);
  const rowUsed = Array.from({ length: N }, () => new Set());
  const colUsed = Array.from({ length: N }, () => new Set());
  let count = 0, first = null, nodes = 0, aborted = false;
  const ineqOk = (i) => {
    const r = (i / N) | 0, c = i % N, v = grid[i];
    if (c + 1 < N) { const w = grid[idx(N, r, c + 1)], t = ineqH[r * (N - 1) + c]; if (w && t) { if (t === 1 && !(v < w)) return false; if (t === 2 && !(v > w)) return false; } }
    if (c - 1 >= 0) { const w = grid[idx(N, r, c - 1)], t = ineqH[r * (N - 1) + (c - 1)]; if (w && t) { if (t === 1 && !(w < v)) return false; if (t === 2 && !(w > v)) return false; } }
    if (r + 1 < N) { const w = grid[idx(N, r + 1, c)], t = ineqV[r * N + c]; if (w && t) { if (t === 1 && !(v < w)) return false; if (t === 2 && !(v > w)) return false; } }
    if (r - 1 >= 0) { const w = grid[idx(N, r - 1, c)], t = ineqV[(r - 1) * N + c]; if (w && t) { if (t === 1 && !(w < v)) return false; if (t === 2 && !(w > v)) return false; } }
    return true;
  };
  const rec = (i) => {
    if (count >= limit || aborted) return;
    if (++nodes > maxNodes) { aborted = true; return; }
    if (i === N * N) { count++; if (!first) first = grid.slice(); return; }
    const r = (i / N) | 0, c = i % N;
    const cand = [];
    if (givens[i]) { if (!rowUsed[r].has(givens[i]) && !colUsed[c].has(givens[i])) cand.push(givens[i]); }
    else for (let v = 1; v <= N; v++) if (!rowUsed[r].has(v) && !colUsed[c].has(v)) cand.push(v);
    for (const v of cand) {
      grid[i] = v; rowUsed[r].add(v); colUsed[c].add(v);
      if (ineqOk(i)) rec(i + 1);
      rowUsed[r].delete(v); colUsed[c].delete(v); grid[i] = 0;
      if (count >= limit || aborted) return;
    }
  };
  rec(0);
  return { count, grid: first, aborted };
}

function shuffleArr(a, rng) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
function randomLatin(N, rng) {
  const grid = new Array(N * N).fill(0);
  const rowUsed = Array.from({ length: N }, () => new Set());
  const colUsed = Array.from({ length: N }, () => new Set());
  const rec = (i) => {
    if (i === N * N) return true;
    const r = (i / N) | 0, c = i % N;
    for (const v of shuffleArr([...Array(N).keys()].map(x => x + 1), rng)) {
      if (rowUsed[r].has(v) || colUsed[c].has(v)) continue;
      grid[i] = v; rowUsed[r].add(v); colUsed[c].add(v);
      if (rec(i + 1)) return true;
      rowUsed[r].delete(v); colUsed[c].delete(v); grid[i] = 0;
    }
    return false;
  };
  return rec(0) ? grid : null;
}
export function deriveIneq(N, grid) {
  const ineqH = new Array(N * (N - 1)).fill(0), ineqV = new Array((N - 1) * N).fill(0);
  for (let r = 0; r < N; r++) for (let c = 0; c + 1 < N; c++) { const a = grid[idx(N, r, c)], b = grid[idx(N, r, c + 1)]; ineqH[r * (N - 1) + c] = a < b ? 1 : 2; }
  for (let r = 0; r + 1 < N; r++) for (let c = 0; c < N; c++) { const a = grid[idx(N, r, c)], b = grid[idx(N, r + 1, c)]; ineqV[r * N + c] = a < b ? 1 : 2; }
  return { ineqH, ineqV };
}

export function generate(N, rng = Math.random, opts = {}) {
  const tries = opts.tries ?? 120;
  for (let t = 0; t < tries; t++) {
    const sol = randomLatin(N, rng);
    if (!sol) continue;
    const { ineqH, ineqV } = deriveIneq(N, sol);
    const givens = sol.slice();
    for (const i of shuffleArr([...Array(N * N).keys()], rng)) {
      if (!givens[i]) continue;
      const save = givens[i]; givens[i] = 0;
      const res = solve(N, givens, ineqH, ineqV, 2);
      if (res.aborted || res.count !== 1) givens[i] = save;
    }
    const res = solve(N, givens, ineqH, ineqV, 2);
    if (!res.aborted && res.count === 1) return { N, givens, ineqH, ineqV, solution: res.grid, attempts: t + 1 };
  }
  return null;
}

const keyBits = (grid) => bitsFrom(grid, 4);

export function encodeLink(N, givens, ineqH, ineqV, message, msgType = 0) {
  const res = solve(N, givens, ineqH, ineqV, 2);
  if (res.count !== 1 || res.aborted) throw new Error('Puzzle must have exactly one solution');
  const enc = lockMessage(message, msgType, keyBits(res.grid));
  const g = new BitSeq(); for (let i = 0; i < N * N; i++) g.appendNum(givens[i] | 0, 4);
  const h = new BitSeq(); for (const t of ineqH) h.appendNum(t, 2);
  const v = new BitSeq(); for (const t of ineqV) v.appendNum(t, 2);
  const len = 6 + 3 + 6 + 6 + N * N * 4 + ineqH.length * 2 + ineqV.length * 2 + 1 + enc.length();
  const gap = (6 - len % 6) % 6;
  const b = new BitSeq().appendNum(0, 6).appendNum(gap, 3).appendNum(0, gap).appendNum(N - 3, 6).appendNum(N - 3, 6);
  b.append(g.get()).append(h.get()).append(v.get()).appendNum(msgType, 1).append(enc.get());
  return b.getShuffled().toAlphas();
}

export function parseLink(id) {
  const rd = new BitSeq().appendAlphas(id).getUnshuffled().getReader();
  const version = 1 + rd.readNum(6);
  if (version !== 1) throw new Error('Unknown Futoshiki link version ' + version);
  rd.readNum(rd.readNum(3));
  const N = rd.readNum(6) + 3; rd.readNum(6);
  const givens = []; for (let i = 0; i < N * N; i++) givens.push(rd.readNum(4));
  const ineqH = []; for (let i = 0; i < N * (N - 1); i++) ineqH.push(rd.readNum(2));
  const ineqV = []; for (let i = 0; i < (N - 1) * N; i++) ineqV.push(rd.readNum(2));
  const msgType = rd.readNum(1);
  return { version, N, givens, ineqH, ineqV, msgType, enc: new BitSeq(rd.read()) };
}

export const decryptMessage = (enc, msgType, grid) => unlockMessage(enc, msgType, keyBits(grid));
