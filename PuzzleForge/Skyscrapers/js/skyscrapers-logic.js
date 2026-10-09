// Skyscrapers logic. No DOM. Latin square 1..N; edge visibility clues (0 = no clue); optional
// givens. Player grid: 0 = empty, 1..N = tower height.
import { BitSeq } from '../../../shared/gdp-bitseq.js?v=13.0.9logic';
import { bitsFrom, lockMessage, unlockMessage } from '../../../shared/gdp-secret.js?v=13.0.9logic';
import { hash, charToNum, getRandomizer } from '../../../shared/gdp-math-utils.js?v=13.0.9logic';

export const ACTION_TYPE = { CELL: 0, LINE: 1 }; // LINE = a row/column tick (not part of the solution)
export const MAXN = 15; // 4-bit values
const idx = (N, r, c) => r * N + c;

function visibles(seq) { let m = 0, n = 0; for (const v of seq) if (v > m) { m = v; n++; } return n; }

export function isSolved(N, givens, clues, grid) {
  for (let i = 0; i < N * N; i++) { const v = grid[i]; if (v < 1 || v > N) return false; if (givens[i] && v !== givens[i]) return false; }
  for (let r = 0; r < N; r++) { const s = new Set(); for (let c = 0; c < N; c++) s.add(grid[idx(N, r, c)]); if (s.size !== N) return false; }
  for (let c = 0; c < N; c++) { const s = new Set(); for (let r = 0; r < N; r++) s.add(grid[idx(N, r, c)]); if (s.size !== N) return false; }
  for (let r = 0; r < N; r++) {
    const row = []; for (let c = 0; c < N; c++) row.push(grid[idx(N, r, c)]);
    if (clues.left[r] && visibles(row) !== clues.left[r]) return false;
    if (clues.right[r] && visibles(row.slice().reverse()) !== clues.right[r]) return false;
  }
  for (let c = 0; c < N; c++) {
    const col = []; for (let r = 0; r < N; r++) col.push(grid[idx(N, r, c)]);
    if (clues.top[c] && visibles(col) !== clues.top[c]) return false;
    if (clues.bottom[c] && visibles(col.slice().reverse()) !== clues.bottom[c]) return false;
  }
  return true;
}

export function solve(N, givens, clues, limit = 2, maxNodes = 400000) {
  const grid = new Array(N * N).fill(0);
  const rowUsed = Array.from({ length: N }, () => new Set());
  const colUsed = Array.from({ length: N }, () => new Set());
  let count = 0, first = null, nodes = 0, aborted = false;
  const rowOk = (r) => { const row = []; for (let c = 0; c < N; c++) row.push(grid[idx(N, r, c)]);
    if (clues.left[r] && visibles(row) !== clues.left[r]) return false;
    if (clues.right[r] && visibles(row.slice().reverse()) !== clues.right[r]) return false; return true; };
  const colOk = (c) => { const col = []; for (let r = 0; r < N; r++) col.push(grid[idx(N, r, c)]);
    if (clues.top[c] && visibles(col) !== clues.top[c]) return false;
    if (clues.bottom[c] && visibles(col.slice().reverse()) !== clues.bottom[c]) return false; return true; };
  const rec = (i) => {
    if (count >= limit || aborted) return;
    if (++nodes > maxNodes) { aborted = true; return; }
    if (i > 0 && i % N === 0 && !rowOk(i / N - 1)) return;
    if (i === N * N) { for (let c = 0; c < N; c++) if (!colOk(c)) return; count++; if (!first) first = grid.slice(); return; }
    const r = (i / N) | 0, c = i % N;
    const cand = givens[i] ? (rowUsed[r].has(givens[i]) || colUsed[c].has(givens[i]) ? [] : [givens[i]]) : [];
    if (!givens[i]) for (let v = 1; v <= N; v++) if (!rowUsed[r].has(v) && !colUsed[c].has(v)) cand.push(v);
    for (const v of cand) {
      grid[i] = v; rowUsed[r].add(v); colUsed[c].add(v);
      rec(i + 1);
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

export function deriveClues(N, grid) {
  const clues = { top: [], bottom: [], left: [], right: [] };
  for (let r = 0; r < N; r++) { const row = []; for (let c = 0; c < N; c++) row.push(grid[idx(N, r, c)]); clues.left.push(visibles(row)); clues.right.push(visibles(row.slice().reverse())); }
  for (let c = 0; c < N; c++) { const col = []; for (let r = 0; r < N; r++) col.push(grid[idx(N, r, c)]); clues.top.push(visibles(col)); clues.bottom.push(visibles(col.slice().reverse())); }
  return clues;
}

export function generate(N, rng = Math.random, opts = {}) {
  const tries = opts.tries ?? 120;
  for (let t = 0; t < tries; t++) {
    const sol = randomLatin(N, rng);
    if (!sol) continue;
    const clues = deriveClues(N, sol);
    const givens = sol.slice();
    for (const i of shuffleArr([...Array(N * N).keys()], rng)) {
      if (!givens[i]) continue;
      const save = givens[i]; givens[i] = 0;
      const res = solve(N, givens, clues, 2);
      if (res.aborted || res.count !== 1) givens[i] = save;
    }
    // A board with no numbers at all is still unique, but every line then needs a chain of
    // reasoning before the first digit appears, which is what the owner hit on the 4x4 test
    // board ("hard to solve for some reason", 2026-10-08). Keep a small floor of given numbers
    // so a player always has somewhere to start.
    const floor = opts.minGivens ?? Math.max(2, Math.round(N * N * 0.12));
    for (const i of shuffleArr([...Array(N * N).keys()], rng)) {
        if (givens.filter(Boolean).length >= floor) break;
        if (!givens[i]) givens[i] = sol[i];
    }

    const res = solve(N, givens, clues, 2);
    if (!res.aborted && res.count === 1) return { N, givens, clues, solution: res.grid, attempts: t + 1 };
  }
  return null;
}

const keyBits = (grid) => bitsFrom(grid, 4);

// ---- link ("the link is the save file"): message-seeded, version 2 ----
//
// The link stores the seed, never the board: the same message + size always gives the same puzzle
// and the same link, and parseLink rebuilds givens and clues from the seed. Only version 2 is
// read; there is no v1 decoder (invariant 2 — old versions are retired, not kept readable).
export const LINK_VERSION = 2;

export function seedFromMessage(message) {
  return hash(Array.from(message).map(charToNum)) & 0x7fffffff;
}

export function generateFromSeed(N, seed) {
  return generate(N, getRandomizer(seed), { tries: 240 });
}

// The message hash, advanced until it yields a unique puzzle — deterministic for the same input.
export function seedForMessage(N, message, tries = 4000) {
  let seed = seedFromMessage(message);
  for (let i = 0; i < tries; i++) {
    if (generateFromSeed(N, seed)) return seed;
    seed = (seed + 1) & 0x7fffffff;
  }
  return -1;
}

export function encodeSeededLink(N, seed, message, msgType = 0) {
  const p = generateFromSeed(N, seed);
  if (!p) throw new Error('No unique puzzle for this seed');
  const res = solve(N, p.givens, p.clues, 2);
  if (res.count !== 1 || res.aborted) throw new Error('Puzzle must have exactly one solution');
  const enc = lockMessage(message, msgType, keyBits(res.grid));
  const len = 6 + 3 + 6 + 6 + 31 + 1 + enc.length();
  const gap = (6 - len % 6) % 6;
  const b = new BitSeq().appendNum(LINK_VERSION - 1, 6).appendNum(gap, 3).appendNum(0, gap)
    .appendNum(N - 3, 6).appendNum(N - 3, 6)
    .appendNum(seed, 31).appendNum(msgType, 1).append(enc.get());
  return b.getShuffled().toAlphas();
}

// What a creator calls: message (+ size) -> the link, deterministically.
export function encodeFromMessage(N, message, msgType = 0) {
  const seed = seedForMessage(N, message);
  if (seed < 0) throw new Error('Could not seed a unique puzzle for this message at this size');
  return encodeSeededLink(N, seed, message, msgType);
}

export function parseLink(id) {
  const rd = new BitSeq().appendAlphas(id).getUnshuffled().getReader();
  const version = 1 + rd.readNum(6);
  if (version !== LINK_VERSION) throw new Error('Unknown Skyscrapers link version ' + version);
  rd.readNum(rd.readNum(3));
  const N = rd.readNum(6) + 3; rd.readNum(6); // second dim unused; keeps the header shape
  // Seeded link: givens and clues are rebuilt from the seed, never stored.
  const seed = rd.readNum(31);
  const msgType = rd.readNum(1);
  const enc = new BitSeq(rd.read());
  const p = generateFromSeed(N, seed);
  if (!p) throw new Error('Seeded Skyscrapers link does not generate a puzzle');
  return { version, N, givens: p.givens, clues: p.clues, seed, msgType, enc };
}

export const decryptMessage = (enc, msgType, grid) => unlockMessage(enc, msgType, keyBits(grid));
