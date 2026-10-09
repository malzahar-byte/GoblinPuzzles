// Binairo / Takuzu logic. No DOM, no drawing — pure model, generator, solver, link codec.
//
// Board: N×N, N even. Every cell is 0 or 1. Rules:
//   - each row and column has exactly N/2 zeros and N/2 ones
//   - no three equal values in a row or column
//   - no two rows are identical, and no two columns are identical
// Player cell state: 0 empty, 1 = a zero, 2 = a one.
//
// Solver design (the fix for the old timeout): enumerate only BALANCED, no-horizontal-triple ROW
// patterns (34 at N=8, 84 at N=10, 208 at N=12), then place them row by row, pruning column
// balance and vertical triples as each row lands and rejecting duplicate rows immediately.
// Columns are completed only by the last row, so duplicate columns are checked there.
// An ABORTED search means "unknown" and is never treated as proof of uniqueness.
import { BitSeq } from '../../../shared/gdp-bitseq.js?v=13.0.24logic';
import { bitsFrom, lockMessage, unlockMessage } from '../../../shared/gdp-secret.js?v=13.0.24logic';
import { hash, charToNum, getRandomizer } from '../../../shared/gdp-math-utils.js?v=13.0.24logic';

export const CELL = { EMPTY: 0, ZERO: 1, ONE: 2 };

const patternCache = new Map();
function rowPatterns(N) {
    if (patternCache.has(N)) return patternCache.get(N);
    const half = N / 2, out = [], arr = [];
    const build = (ones, zeros) => {
        if (arr.length === N) { out.push(arr.slice()); return; }
        const n = arr.length;
        for (const bit of [0, 1]) {
            if (bit === 1 && ones === half) continue;
            if (bit === 0 && zeros === half) continue;
            if (n >= 2 && arr[n - 1] === bit && arr[n - 2] === bit) continue;
            arr.push(bit);
            build(ones + (bit === 1 ? 1 : 0), zeros + (bit === 0 ? 1 : 0));
            arr.pop();
        }
    };
    build(0, 0);
    patternCache.set(N, out);
    return out;
}

const sameRow = (a, b) => { for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true; };
function shuffled(a, rng) { for (let i = a.length - 1; i > 0; i--) { const j = (rng() * (i + 1)) | 0; const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

function defaultBudget(N) { return N <= 8 ? 25000 : N <= 10 ? 50000 : 100000; }

// Counts solutions up to `limit`. givens[i] is -1 (empty), 0 or 1, in row-major order.
// Returns { count, rows (first solution as N arrays of 0/1), aborted }.
export function solve(N, givens, limit = 2, maxNodes = 0) {
    const half = N / 2, patterns = rowPatterns(N);
    if (maxNodes <= 0) maxNodes = defaultBudget(N);
    const rows = new Array(N);
    const colOnes = new Array(N).fill(0);
    let count = 0, first = null, nodes = 0, aborted = false;

    const rowMatches = (r, p) => {
        const base = r * N;
        for (let c = 0; c < N; c++) { const g = givens[base + c]; if (g !== -1 && g !== p[c]) return false; }
        return true;
    };
    const columnsDistinct = () => {
        for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
            let same = true;
            for (let r = 0; r < N; r++) if (rows[r][i] !== rows[r][j]) { same = false; break; }
            if (same) return false;
        }
        return true;
    };

    const rec = (r) => {
        if (count >= limit || aborted) return;
        if (r === N) {
            if (!columnsDistinct()) return;
            count++;
            if (!first) first = rows.map(row => row.slice());
            return;
        }
        for (const p of patterns) {
            if (++nodes > maxNodes) { aborted = true; return; }
            if (!rowMatches(r, p)) continue;
            let ok = true;
            for (let c = 0; c < N; c++) {
                const ones = colOnes[c] + (p[c] === 1 ? 1 : 0);
                if (ones > half || ones < (r + 1) - half) { ok = false; break; }
                if (r >= 2 && rows[r - 1][c] === p[c] && rows[r - 2][c] === p[c]) { ok = false; break; }
            }
            if (!ok) continue;
            let dup = false;
            for (let rr = 0; rr < r; rr++) if (sameRow(rows[rr], p)) { dup = true; break; }
            if (dup) continue;
            rows[r] = p;
            for (let c = 0; c < N; c++) colOnes[c] += (p[c] === 1 ? 1 : 0);
            rec(r + 1);
            for (let c = 0; c < N; c++) colOnes[c] -= (p[c] === 1 ? 1 : 0);
            rows[r] = undefined;
            if (count >= limit || aborted) return;
        }
    };
    rec(0);
    return { count, rows: first, aborted };
}

function buildRandomGrid(N, rng) {
    const half = N / 2, patterns = rowPatterns(N);
    const rows = new Array(N), colOnes = new Array(N).fill(0);
    const rec = (r) => {
        if (r === N) {
            for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
                let same = true;
                for (let k = 0; k < N; k++) if (rows[k][i] !== rows[k][j]) { same = false; break; }
                if (same) return false;
            }
            return true;
        }
        for (const p of shuffled(patterns.slice(), rng)) {
            let ok = true;
            for (let c = 0; c < N; c++) {
                const ones = colOnes[c] + (p[c] === 1 ? 1 : 0);
                if (ones > half || ones < (r + 1) - half) { ok = false; break; }
                if (r >= 2 && rows[r - 1][c] === p[c] && rows[r - 2][c] === p[c]) { ok = false; break; }
            }
            if (!ok) continue;
            let dup = false;
            for (let rr = 0; rr < r; rr++) if (sameRow(rows[rr], p)) { dup = true; break; }
            if (dup) continue;
            rows[r] = p;
            for (let c = 0; c < N; c++) colOnes[c] += (p[c] === 1 ? 1 : 0);
            if (rec(r + 1)) return true;
            for (let c = 0; c < N; c++) colOnes[c] -= (p[c] === 1 ? 1 : 0);
            rows[r] = undefined;
        }
        return false;
    };
    return rec(0) ? rows.map(r => r.slice()) : null;
}

// The deductions a player actually makes, applied to a fixpoint:
//   1. in a line that already holds N/2 of one symbol, every empty cell is the other symbol;
//   2. two equal neighbours force the third cell of the run to be the opposite (XX_ / X_X / _XX);
//   3. no line may repeat another line once complete (only worth applying at the end).
// Returns true when the clues alone are enough to finish the grid this way. A puzzle can be
// unique and still need a guess; that is exactly what made our 6x6 boards feel impossible
// (owner report 2026-10-08), so the generator only ships clues this solver can complete.
export function logicSolvable(N, givens) {
    const half = N / 2;
    const g = givens.map(v => (v === -1 ? -1 : v));
    const at = (r, c) => g[r * N + c];
    const set = (i, v) => { if (g[i] === -1) { g[i] = v; return true; } return g[i] === v; };
    let progress = true;
    while (progress) {
        progress = false;
        for (let r = 0; r < N; r++) {
            let ones = 0, zeros = 0, empties = 0;
            for (let c = 0; c < N; c++) { const v = at(r, c); if (v === -1) empties++; else if (v === 1) ones++; else zeros++; }
            if (empties === 0) continue;
            const want = ones === half ? 0 : zeros === half ? 1 : -1;
            if (want === -1) continue;
            for (let c = 0; c < N; c++) if (at(r, c) === -1) { if (!set(r * N + c, want)) return false; progress = true; }
        }
        for (let c = 0; c < N; c++) {
            let ones = 0, zeros = 0, empties = 0;
            for (let r = 0; r < N; r++) { const v = at(r, c); if (v === -1) empties++; else if (v === 1) ones++; else zeros++; }
            if (empties === 0) continue;
            const want = ones === half ? 0 : zeros === half ? 1 : -1;
            if (want === -1) continue;
            for (let r = 0; r < N; r++) if (at(r, c) === -1) { if (!set(r * N + c, want)) return false; progress = true; }
        }
        // rule 2: two equal neighbours (either side of the empty cell) force the opposite value.
        // -2 is "off the board" and equals no value, so these comparisons are safe at the edges.
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
            if (at(r, c) !== -1) continue;
            const l = c > 0 ? at(r, c - 1) : -2, ll = c > 1 ? at(r, c - 2) : -2;
            const rr = c < N - 1 ? at(r, c + 1) : -2, rrr = c < N - 2 ? at(r, c + 2) : -2;
            const u = r > 0 ? at(r - 1, c) : -2, uu = r > 1 ? at(r - 2, c) : -2;
            const d = r < N - 1 ? at(r + 1, c) : -2, dd = r < N - 2 ? at(r + 2, c) : -2;
            let want = -1;
            if ((l === 0 && ll === 0) || (rr === 0 && rrr === 0) || (l === 0 && rr === 0)) want = 1;
            else if ((l === 1 && ll === 1) || (rr === 1 && rrr === 1) || (l === 1 && rr === 1)) want = 0;
            else if ((u === 0 && uu === 0) || (d === 0 && dd === 0) || (u === 0 && d === 0)) want = 1;
            else if ((u === 1 && uu === 1) || (d === 1 && dd === 1) || (u === 1 && d === 1)) want = 0;
            if (want === -1) continue;
            if (!set(r * N + c, want)) return false;
            progress = true;
        }
    }
    return g.every(v => v !== -1);
}

// Random puzzle with exactly one solution AND completable with the rules above, or null.
export function generate(N, rng = Math.random, opts = {}) {
    const attempts = opts.attempts ?? 3;
    for (let a = 0; a < attempts; a++) {
        const full = buildRandomGrid(N, rng);
        if (!full) continue;
        const givens = new Array(N * N);
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) givens[r * N + c] = full[r][c];
        const order = shuffled([...Array(N * N).keys()], rng);
        for (const i of order) {
            const saved = givens[i];
            givens[i] = -1;
            const res = solve(N, givens, 2);
            // unknown, non-unique, or no longer hand-solvable: keep the clue
            if (res.aborted || res.count !== 1 || !logicSolvable(N, givens)) givens[i] = saved;
        }
        const check = solve(N, givens, 1);
        if (!check.aborted && check.count === 1 && logicSolvable(N, givens)) return { N, givens, solution: check.rows.flat() };
    }
    return null;
}

// Player's solved check. cells: N*N array of CELL values.
export function isSolved(N, givens, cells) {
    const grid = [];
    for (let r = 0; r < N; r++) {
        const row = [];
        for (let c = 0; c < N; c++) {
            const v = cells[r * N + c];
            if (v === CELL.EMPTY) return false;
            row.push(v === CELL.ONE ? 1 : 0);
        }
        grid.push(row);
    }
    for (let i = 0; i < N * N; i++) if (givens[i] !== -1 && givens[i] !== grid[(i / N) | 0][i % N]) return false;
    const half = N / 2;
    for (let r = 0; r < N; r++) {
        let ones = 0;
        for (let c = 0; c < N; c++) {
            ones += grid[r][c];
            if (c >= 2 && grid[r][c] === grid[r][c - 1] && grid[r][c] === grid[r][c - 2]) return false;
        }
        if (ones !== half) return false;
    }
    for (let c = 0; c < N; c++) {
        let ones = 0;
        for (let r = 0; r < N; r++) {
            ones += grid[r][c];
            if (r >= 2 && grid[r][c] === grid[r - 1][c] && grid[r][c] === grid[r - 2][c]) return false;
        }
        if (ones !== half) return false;
    }
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
        let sameR = true, sameC = true;
        for (let k = 0; k < N; k++) { if (grid[i][k] !== grid[j][k]) sameR = false; if (grid[k][i] !== grid[k][j]) sameC = false; }
        if (sameR || sameC) return false;
    }
    return true;
}

// ---- link ("the link is the save file"): message-seeded, version 2 ----
//
// The link stores the seed, never the board: the same message + size always gives the same puzzle
// and the same link, and parseLink rebuilds the givens from the seed. Only version 2 is read;
// there is no v1 decoder (invariant 2 — old versions are retired, not kept readable).
const solutionKey = (solution) => bitsFrom(solution);
export const LINK_VERSION = 2;

export function seedFromMessage(message) {
    return hash(Array.from(message).map(charToNum)) & 0x7fffffff;
}

export function generateFromSeed(N, seed) {
    return generate(N, getRandomizer(seed), { attempts: 3 });
}

// The message hash, advanced until it yields a unique, hand-solvable puzzle.
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
    const res = solve(N, p.givens, 2);
    if (res.aborted || res.count !== 1) throw new Error('Puzzle must have exactly one solution');
    const enc = lockMessage(message, msgType, solutionKey(res.rows.flat()));
    const len = 6 + 3 + 6 + 31 + 1 + enc.length();
    const gap = (6 - len % 6) % 6;
    const b = new BitSeq().appendNum(LINK_VERSION - 1, 6).appendNum(gap, 3).appendNum(0, gap)
        .appendNum(N, 6).appendNum(seed, 31).appendNum(msgType, 1).append(enc.get());
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
    if (version !== LINK_VERSION) throw new Error('Unknown Binairo link version ' + version);
    rd.readNum(rd.readNum(3));
    const N = rd.readNum(6);
    // Seeded link: the givens are rebuilt from the seed, never stored.
    const seed = rd.readNum(31);
    const msgType = rd.readNum(1);
    const enc = new BitSeq(rd.read());
    const p = generateFromSeed(N, seed);
    if (!p) throw new Error('Seeded Binairo link does not generate a puzzle');
    return { version, N, givens: p.givens, seed, msgType, enc };
}
// cells: player's N*N CELL array.
export const decryptMessage = (enc, msgType, cells) =>
    unlockMessage(enc, msgType, bitsFrom(cells.map(c => c === CELL.ONE ? 1 : 0)));
