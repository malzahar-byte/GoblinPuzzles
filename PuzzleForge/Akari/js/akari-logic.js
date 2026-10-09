// Akari (Light Up) logic. No DOM, no drawing — pure model, generator, solver, link codec.
//
// Board: R*C cells. walls[i] = 1 if a black wall, else 0. nums[i] = a wall's clue (0..4 = how
// many lamps touch it orthogonally), or -1 for no clue / non-wall.
// Player cell state: 0 empty, 1 lamp, 2 mark (pencil). Marks are ignored by the solved check
// and by the secret key — exactly like Pictogram's WHITE/EMPTY, so the same bits come out for
// the solution and for the player's board.
//
// Rules: every white cell must be lit; no two lamps may see each other (same row/col, no wall
// between); every numbered wall must have exactly that many adjacent lamps.
import { BitSeq } from '../../../shared/gdp-bitseq.js?v=13.0.24logic';
import { bitsFrom, lockMessage, unlockMessage } from '../../../shared/gdp-secret.js?v=13.0.24logic';
import { hash, charToNum, getRandomizer } from '../../../shared/gdp-math-utils.js?v=13.0.24logic';

export const CELL = { EMPTY: 0, LAMP: 1, MARK: 2 };
export const ACTION_TYPE = { CELL: 0 };

const idx = (C, r, c) => r * C + c;

function neighbors(R, C, i) {
  const r = (i / C) | 0, c = i % C, out = [];
  if (r > 0) out.push(i - C);
  if (r < R - 1) out.push(i + C);
  if (c > 0) out.push(i - 1);
  if (c < C - 1) out.push(i + 1);
  return out;
}

// Cells lit by a lamp at i (i itself plus everything in 4 directions until a wall).
function litFrom(R, C, walls, i) {
  const r = (i / C) | 0, c = i % C, out = [i];
  const walk = (dr, dc) => {
    let rr = r + dr, cc = c + dc;
    while (rr >= 0 && cc >= 0 && rr < R && cc < C) {
      const j = rr * C + cc;
      if (walls[j]) break;
      out.push(j); rr += dr; cc += dc;
    }
  };
  walk(-1, 0); walk(1, 0); walk(0, -1); walk(0, 1);
  return out;
}

// The full rule check on a lamp array (walls are 0). Used by the solver and the player.
function ruleCheck(R, C, walls, nums, lamps) {
  const lit = new Uint8Array(R * C);
  for (let i = 0; i < R * C; i++) {
    if (lamps[i] && !walls[i]) for (const j of litFrom(R, C, walls, i)) lit[j] = 1;
  }
  for (let i = 0; i < R * C; i++) if (!walls[i] && !lit[i]) return false;
  for (let i = 0; i < R * C; i++) {
    if (!walls[i] || nums[i] < 0) continue;
    let c = 0; for (const j of neighbors(R, C, i)) if (lamps[j]) c++;
    if (c !== nums[i]) return false;
  }
  // no two lamps see each other
  for (let i = 0; i < R * C; i++) {
    if (!lamps[i]) continue;
    const r = (i / C) | 0, c = i % C;
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of dirs) {
      let rr = r + dr, cc = c + dc;
      while (rr >= 0 && cc >= 0 && rr < R && cc < C) {
        const j = rr * C + cc;
        if (walls[j]) break;
        if (lamps[j]) return false;
        rr += dr; cc += dc;
      }
    }
  }
  return true;
}

// Solved check for the player's board. Marks (2) count as empty.
export function isSolved(R, C, walls, nums, cells) {
  const lamps = new Array(R * C).fill(0);
  for (let i = 0; i < R * C; i++) if (!walls[i] && cells[i] === CELL.LAMP) lamps[i] = 1;
  return ruleCheck(R, C, walls, nums, lamps);
}

// Counts solutions, stops at `limit`. Returns { count, lamps (first solution), aborted }.
export function solve(R, C, walls, nums, limit = 2, maxNodes = 400000) {
  const n = R * C;
  const whites = [];
  for (let i = 0; i < n; i++) if (!walls[i]) whites.push(i);
  const vis = new Map();
  for (const i of whites) vis.set(i, litFrom(R, C, walls, i).filter(j => !walls[j]));
  const lamps = new Array(n).fill(0);
  let count = 0, first = null, nodes = 0, aborted = false;

  const numsOk = (exact) => {
    for (let i = 0; i < n; i++) {
      if (!walls[i] || nums[i] < 0) continue;
      let c = 0; for (const j of neighbors(R, C, i)) if (lamps[j]) c++;
      if (exact ? c !== nums[i] : c > nums[i]) return false;
    }
    return true;
  };
  const seenLamp = (i) => {
    for (const j of vis.get(i)) if (lamps[j]) return true;
    return false;
  };
  const litNow = () => {
    const lit = new Uint8Array(n);
    for (const i of whites) if (lamps[i]) for (const j of litFrom(R, C, walls, i)) lit[j] = 1;
    return lit;
  };

  const rec = () => {
    if (count >= limit || aborted) return;
    if (++nodes > maxNodes) { aborted = true; return; }
    const lit = litNow();
    let target = -1;
    for (const i of whites) if (!lit[i]) { target = i; break; }
    if (target === -1) { if (numsOk(true)) { count++; if (!first) first = lamps.slice(); } return; }
    // Any solution must light `target`; the lamp doing it is target itself or a cell that sees it.
    for (const i of vis.get(target)) {
      if (lamps[i]) continue;
      if (seenLamp(i)) continue;
      lamps[i] = 1;
      if (numsOk(false)) rec();
      lamps[i] = 0;
      if (count >= limit || aborted) return;
    }
  };
  rec();
  return { count, lamps: first, aborted };
}

// Random puzzle with exactly one solution, or null. rng() -> [0,1).
export function generate(R, C, rng = Math.random, opts = {}) {
  const wallChance = opts.wallChance ?? 0.24;
  const tries = opts.tries ?? 300;
  for (let t = 0; t < tries; t++) {
    const n = R * C;
    const walls = new Array(n).fill(0);
    for (let i = 0; i < n; i++) if (rng() < wallChance) walls[i] = 1;
    let white = 0; for (let i = 0; i < n; i++) if (!walls[i]) white++;
    if (white < n * 0.4) continue;
    const noNums = new Array(n).fill(-1);
    const r1 = solve(R, C, walls, noNums, 1); // any valid lamp config
    if (r1.aborted || !r1.lamps) continue;
    const nums = new Array(n).fill(-1);
    for (let i = 0; i < n; i++) if (walls[i]) {
      let c = 0; for (const j of neighbors(R, C, i)) if (r1.lamps[j]) c++;
      nums[i] = c;
    }
    const r2 = solve(R, C, walls, nums, 2);
    if (!r2.aborted && r2.count === 1) {
      return { R, C, walls, nums, solution: r2.lamps, attempts: t + 1 };
    }
  }
  return null;
}

// ---- link ("the link is the save file") ----
const solutionKey = (lamps) => bitsFrom(lamps);

// ---- message-seeded links (version 2) ----
//
// The theme of the project: the same message, size and options must produce the same puzzle and the
// same link. Nonogram gets that by hashing the message into its seed; Akari now does too. A
// version-2 link stores the seed only — the board is rebuilt from it — and the message stays
// XOR-locked against the solution that seed produces.
//
// Only this version is read: there is no v1 decoder (invariant 2 — old link versions are
// retired, never kept readable). If generate() is ever changed, seeded links stop reproducing;
// that is accepted, not a reason to freeze a copy of the old generator.
export const LINK_VERSION = 2;

// The options a seeded link is always built and rebuilt with: one value, used by both sides, so a
// link can never be encoded with one set and regenerated with another.
export const SEED_OPTS = { wallChance: 0.24, tries: 600 };

export function seedFromMessage(message) {
  return hash(Array.from(message).map(charToNum)) & 0x7fffffff;
}

export function generateFromSeed(R, C, seed, opts = SEED_OPTS) {
  return generate(R, C, getRandomizer(seed), opts);
}

// The message hash, advanced until it yields a unique puzzle — deterministic for the same input.
export function seedForMessage(R, C, message, tries = 4000) {
  let seed = seedFromMessage(message);
  for (let i = 0; i < tries; i++) {
    if (generateFromSeed(R, C, seed)) return seed;
    seed = (seed + 1) & 0x7fffffff;
  }
  return -1;
}

export function encodeSeededLink(R, C, seed, message, msgType = 0) {
  const p = generateFromSeed(R, C, seed);
  if (!p) throw new Error('No unique puzzle for this seed');
  const res = solve(R, C, p.walls, p.nums, 2);
  if (res.count !== 1 || res.aborted) throw new Error('Puzzle must have exactly one solution');
  const enc = lockMessage(message, msgType, solutionKey(res.lamps));
  const len = 6 + 3 + 6 + 6 + 31 + 1 + enc.length();
  const gap = (6 - len % 6) % 6;
  const b = new BitSeq().appendNum(LINK_VERSION - 1, 6).appendNum(gap, 3).appendNum(0, gap)
    .appendNum(R - 3, 6).appendNum(C - 3, 6)
    .appendNum(seed, 31).appendNum(msgType, 1).append(enc.get());
  return b.getShuffled().toAlphas();
}

// What a creator calls: message (+ size) -> the link, deterministically.
export function encodeFromMessage(R, C, message, msgType = 0) {
  const seed = seedForMessage(R, C, message);
  if (seed < 0) throw new Error('Could not seed a unique puzzle for this message at this size');
  return encodeSeededLink(R, C, seed, message, msgType);
}

export function parseLink(id) {
  const rd = new BitSeq().appendAlphas(id).getUnshuffled().getReader();
  const version = 1 + rd.readNum(6);
  if (version !== LINK_VERSION) throw new Error('Unknown Akari link version ' + version);
  rd.readNum(rd.readNum(3));
  const R = rd.readNum(6) + 3, C = rd.readNum(6) + 3;
  // Seeded link: the board is rebuilt from the seed, never stored.
  const seed = rd.readNum(31);
  const msgType = rd.readNum(1);
  const enc = new BitSeq(rd.read());
  const p = generateFromSeed(R, C, seed);
  if (!p) throw new Error('Seeded Akari link does not generate a puzzle');
  return { version, R, C, walls: p.walls, nums: p.nums, seed, msgType, enc };
}

// lamps: player's per-cell 0/1 (walls 0).
export const decryptMessage = (enc, msgType, lamps) => unlockMessage(enc, msgType, solutionKey(lamps));
