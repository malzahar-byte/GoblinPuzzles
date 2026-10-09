// Futoshiki logic. No DOM. Latin square 1..N + adjacent inequalities (0 = none, 1 = '<', 2 = '>').
// ineqH[r*(N-1)+c] is between (r,c) and (r,c+1); ineqV[r*N+c] between (r,c) and (r+1,c).
// Player grid: 0 = empty, 1..N = value.
import { BitSeq } from '../../../shared/gdp-bitseq.js?v=13.0.7logic';
import { bitsFrom, lockMessage, unlockMessage } from '../../../shared/gdp-secret.js?v=13.0.7logic';
import { hash, charToNum, getRandomizer } from '../../../shared/gdp-math-utils.js?v=13.0.7logic';

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
  // Constraint-propagation backtracker over bitmask domains: mask[i] is the set of values still
  // possible in cell i. Before every branch the domains are reduced to a fixpoint —
  //   • a value that fits only one cell of a row or column is placed there,
  //   • an inequality drops any value with no partner value left on the other side —
  // then the most-constrained cell is branched on. The old fixed-order search needed up to
  // hundreds of thousands of nodes to prove uniqueness on a sparse board; the sign-first
  // generator asks that question dozens of times per board, so this was rewritten on
  // 2026-10-08. Signature, results and the "never guess on an abort" rule are unchanged.
  const bit = (v) => 1 << (v - 1);
  const FULL = (1 << N) - 1;
  const startMask = new Array(N * N).fill(FULL);
  for (let i = 0; i < N * N; i++) if (givens[i]) startMask[i] = bit(givens[i]);
  let count = 0, first = null, nodes = 0, aborted = false;

  const rowOf = (i) => (i / N) | 0;
  const colOf = (i) => i % N;

  // Place v in cell i: its row and column lose that value everywhere else.
  const place = (mask, i, v) => {
    const b = bit(v);
    mask[i] = b;
    const r = rowOf(i), c = colOf(i);
    for (let k = 0; k < N; k++) {
      const a = r * N + k;
      if (a !== i && (mask[a] & b)) { mask[a] &= ~b; if (!mask[a]) return false; }
      const d = k * N + c;
      if (d !== i && (mask[d] & b)) { mask[d] &= ~b; if (!mask[d]) return false; }
    }
    return true;
  };

  // Keep in mask[i] only the values that still have a partner in mask[j] for this inequality.
  // relation 1 = value(i) < value(j), 2 = value(i) > value(j).
  const prune = (mask, i, j, relation) => {
    const before = mask[i];
    let after = 0;
    for (let v = 1; v <= N; v++) {
      if (!(before & bit(v))) continue;
      let ok = false;
      for (let w = 1; w <= N && !ok; w++) {
        if (!(mask[j] & bit(w))) continue;
        ok = relation === 1 ? v < w : v > w;
      }
      if (ok) after |= bit(v);
    }
    if (after === before) return true;
    if (!after) return false;
    mask[i] = after;
    return true;
  };

  const popcount = (m) => { let n = 0; while (m) { m &= m - 1; n++; } return n; };

  const propagate = (mask) => {
    let changed = true;
    while (changed) {
      changed = false;
      for (let r = 0; r < N; r++) for (let v = 1; v <= N; v++) {
        const b = bit(v); let n = 0, spot = -1;
        for (let c = 0; c < N; c++) { const i = r * N + c; if (mask[i] & b) { n++; spot = i; } }
        if (n === 0) return false;
        if (n === 1 && mask[spot] !== b) { if (!place(mask, spot, v)) return false; changed = true; }
      }
      for (let c = 0; c < N; c++) for (let v = 1; v <= N; v++) {
        const b = bit(v); let n = 0, spot = -1;
        for (let r = 0; r < N; r++) { const i = r * N + c; if (mask[i] & b) { n++; spot = i; } }
        if (n === 0) return false;
        if (n === 1 && mask[spot] !== b) { if (!place(mask, spot, v)) return false; changed = true; }
      }
      for (let i = 0; i < N * N; i++) {
        const r = rowOf(i), c = colOf(i);
        const arcs = [];
        if (c + 1 < N && ineqH[r * (N - 1) + c]) arcs.push([i + 1, ineqH[r * (N - 1) + c]]);
        if (c - 1 >= 0 && ineqH[r * (N - 1) + c - 1]) arcs.push([i - 1, ineqH[r * (N - 1) + c - 1] === 1 ? 2 : 1]);
        if (r + 1 < N && ineqV[r * N + c]) arcs.push([i + N, ineqV[r * N + c]]);
        if (r - 1 >= 0 && ineqV[(r - 1) * N + c]) arcs.push([i - N, ineqV[(r - 1) * N + c] === 1 ? 2 : 1]);
        for (const [j, rel] of arcs) {
          if (!prune(mask, i, j, rel)) return false;
          if (mask[i] !== (mask[i] & mask[i])) return false; // unreachable guard
          if (popcount(mask[i]) === 1) {
            const v = Math.log2(mask[i]) + 1;
            if (mask[i] !== bit(v)) { if (!place(mask, i, v)) return false; changed = true; }
          }
          if (!prune(mask, j, i, rel === 1 ? 2 : 1)) return false;
        }
      }
    }
    return true;
  };

  const search = (mask) => {
    if (count >= limit || aborted) return;
    if (++nodes > maxNodes) { aborted = true; return; }
    if (!propagate(mask)) return;
    let best = -1, bestN = N + 1;
    for (let i = 0; i < N * N; i++) { const n = popcount(mask[i]); if (n > 1 && n < bestN) { bestN = n; best = i; } }
    if (best === -1) {
      count++;
      if (!first) first = mask.map((m) => Math.log2(m) + 1);
      return;
    }
    for (let v = 1; v <= N; v++) {
      if (!(mask[best] & bit(v))) continue;
      const copy = mask.slice();
      if (place(copy, best, v)) search(copy);
      if (count >= limit || aborted) return;
    }
  };

  search(startMask);
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

// The deductions a player makes by eye, applied to a fixpoint:
//   - a cell's candidates are the values its row and column do not already use, minus any value
//     a neighbouring inequality rules out;
//   - a cell with a single candidate is filled (naked single);
//   - a value that fits in only one cell of its row or column is filled there (hidden single).
// Returns true when the clues alone finish the grid this way. Uniqueness alone does not make a
// fair puzzle — a board that is unique but needs a guess is the "too hard" complaint the owner
// reported on 2026-10-08, so the generator only ships puzzles this can complete.
export function logicSolvable(N, givens, ineqH, ineqV) {
  const grid = givens.slice();
  const rowUsed = Array.from({ length: N }, () => new Set());
  const colUsed = Array.from({ length: N }, () => new Set());
  for (let i = 0; i < N * N; i++) if (grid[i]) { rowUsed[(i / N) | 0].add(grid[i]); colUsed[i % N].add(grid[i]); }

  const fits = (i, v) => {
    const r = (i / N) | 0, c = i % N;
    if (c + 1 < N) { const t = ineqH[r * (N - 1) + c], w = grid[idx(N, r, c + 1)]; if (t && w && ((t === 1 && !(v < w)) || (t === 2 && !(v > w)))) return false; }
    if (c - 1 >= 0) { const t = ineqH[r * (N - 1) + c - 1], w = grid[idx(N, r, c - 1)]; if (t && w && ((t === 1 && !(w < v)) || (t === 2 && !(w > v)))) return false; }
    if (r + 1 < N) { const t = ineqV[r * N + c], w = grid[idx(N, r + 1, c)]; if (t && w && ((t === 1 && !(v < w)) || (t === 2 && !(v > w)))) return false; }
    if (r - 1 >= 0) { const t = ineqV[(r - 1) * N + c], w = grid[idx(N, r - 1, c)]; if (t && w && ((t === 1 && !(w < v)) || (t === 2 && !(w > v)))) return false; }
    return true;
  };
  const candidates = (i) => {
    const r = (i / N) | 0, c = i % N, out = [];
    for (let v = 1; v <= N; v++) if (!rowUsed[r].has(v) && !colUsed[c].has(v) && fits(i, v)) out.push(v);
    return out;
  };
  const place = (i, v) => { grid[i] = v; rowUsed[(i / N) | 0].add(v); colUsed[i % N].add(v); };

  let progress = true;
  while (progress) {
    progress = false;
    for (let i = 0; i < N * N; i++) {
      if (grid[i]) continue;
      const cand = candidates(i);
      if (!cand.length) return false;
      if (cand.length === 1) { place(i, cand[0]); progress = true; }
    }
    for (let r = 0; r < N; r++) for (let v = 1; v <= N; v++) {
      if (rowUsed[r].has(v)) continue;
      let spot = -1, n = 0;
      for (let c = 0; c < N; c++) { const i = r * N + c; if (!grid[i] && candidates(i).includes(v)) { n++; spot = i; } }
      if (n === 0) return false;
      if (n === 1) { place(spot, v); progress = true; }
    }
    for (let c = 0; c < N; c++) for (let v = 1; v <= N; v++) {
      if (colUsed[c].has(v)) continue;
      let spot = -1, n = 0;
      for (let r = 0; r < N; r++) { const i = r * N + c; if (!grid[i] && candidates(i).includes(v)) { n++; spot = i; } }
      if (n === 0) return false;
      if (n === 1) { place(spot, v); progress = true; }
    }
  }
  return grid.every(v => v !== 0);
}

// Greedy clue budget for the generator's own uniqueness checks. A board that cannot be decided
// within these nodes is treated as "not unique yet" (the safe direction: it just gets more
// clues); the finished puzzle is re-verified with the full default budget.
const GEN_NODES = 25000;
// The dedupe pass is capped by SOLVES, not wall-clock time: generation must be deterministic for a
// given rng stream, because a seeded link rebuilds its board from its seed (invariant 1).
const GEN_DEDUPE_SOLVES = 64;

export function generate(N, rng = Math.random, opts = {}) {
  const tries = opts.tries ?? 120;
  for (let t = 0; t < tries; t++) {
    const sol = randomLatin(N, rng);
    if (!sol) continue;
    const full = deriveIneq(N, sol); // every comparison the solution implies
    const givens = new Array(N * N).fill(0);
    const ineqH = full.ineqH.map(() => 0), ineqV = full.ineqV.map(() => 0);

    // 1) Grow: add clues (signs and numbers together, in random order) until the puzzle has
    //    exactly one solution. Published Futoshiki is NOT one sign between every neighbouring
    //    pair — that is what deriving every comparison drew, and it is what the owner reported
    //    as looking wrong (2026-10-08).
    const slots = [];
    for (let i = 0; i < full.ineqH.length; i++) if (full.ineqH[i]) slots.push({ kind: 'h', i });
    for (let i = 0; i < full.ineqV.length; i++) if (full.ineqV[i]) slots.push({ kind: 'v', i });
    for (let i = 0; i < N * N; i++) slots.push({ kind: 'given', i });
    const apply = (s) => {
      if (s.kind === 'h') ineqH[s.i] = full.ineqH[s.i];
      else if (s.kind === 'v') ineqV[s.i] = full.ineqV[s.i];
      else givens[s.i] = sol[s.i];
    };
    const clear = (s) => {
      if (s.kind === 'h') ineqH[s.i] = 0;
      else if (s.kind === 'v') ineqV[s.i] = 0;
      else givens[s.i] = 0;
    };
    const isUnique = (maxNodes) => {
      const res = solve(N, givens, ineqH, ineqV, 2, maxNodes);
      return !res.aborted && res.count === 1;
    };

    const used = [];
    let unique = false;
    for (const s of shuffleArr(slots.slice(), rng)) {
      apply(s); used.push(s);
      if (isUnique(GEN_NODES)) { unique = true; break; }
    }
    if (!unique) continue;

    // 2) Dedupe: growing in random order stops at the first unique set, which usually holds
    //    redundant clues. Drop every clue the puzzle does not need, so neither the sign count
    //    nor the number count is inflated. The pass stops after a fixed number of solves, so the
    //    biggest boards still return promptly and the same seed always takes the same steps.
    {
      let left = GEN_DEDUPE_SOLVES;
      for (const s of shuffleArr(used.slice(), rng)) {
        if (left-- <= 0) break;
        clear(s);
        if (!isUnique(GEN_NODES)) apply(s);
      }
    }

    // 3) Verify with the full budget before shipping.
    const res = solve(N, givens, ineqH, ineqV, 2);
    if (!res.aborted && res.count === 1) return { N, givens, ineqH, ineqV, solution: res.grid, attempts: t + 1 };
  }
  return null;
}

const keyBits = (grid) => bitsFrom(grid, 4);

// ---- link ("the link is the save file"): message-seeded, version 2 ----
//
// The link stores the seed, never the board: the same message + size always gives the same puzzle
// and the same link, and parseLink rebuilds givens and signs from the seed. Only version 2 is
// read; there is no v1 decoder (invariant 2 — old versions are retired, not kept readable).
export const LINK_VERSION = 2;

export function seedFromMessage(message) {
  return hash(Array.from(message).map(charToNum)) & 0x7fffffff;
}

export function generateFromSeed(N, seed) {
  return generate(N, getRandomizer(seed), { tries: 120 });
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
  const res = solve(N, p.givens, p.ineqH, p.ineqV, 2);
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
  if (version !== LINK_VERSION) throw new Error('Unknown Futoshiki link version ' + version);
  rd.readNum(rd.readNum(3));
  const N = rd.readNum(6) + 3; rd.readNum(6);
  // Seeded link: givens and signs are rebuilt from the seed, never stored.
  const seed = rd.readNum(31);
  const msgType = rd.readNum(1);
  const enc = new BitSeq(rd.read());
  const p = generateFromSeed(N, seed);
  if (!p) throw new Error('Seeded Futoshiki link does not generate a puzzle');
  return { version, N, givens: p.givens, ineqH: p.ineqH, ineqV: p.ineqV, seed, msgType, enc };
}

export const decryptMessage = (enc, msgType, grid) => unlockMessage(enc, msgType, keyBits(grid));
