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
import { BitSeq } from '../../../shared/gdp-bitseq.js?v=13.0.0logic';
import { bitsFrom, lockMessage, unlockMessage } from '../../../shared/gdp-secret.js?v=13.0.0logic';

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

// Random puzzle with exactly one solution, or null.
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
            if (res.aborted || res.count !== 1) givens[i] = saved; // unknown or non-unique: keep it
        }
        const check = solve(N, givens, 1);
        if (!check.aborted && check.count === 1) return { N, givens, solution: check.rows.flat() };
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

// ---- link ("the link is the save file") — same framing as Akari, one dim, 2 bits per cell ----
const solutionKey = (solution) => bitsFrom(solution);
export function encodeLink(N, givens, message, msgType = 0) {
    const res = solve(N, givens, 2);
    if (res.aborted || res.count !== 1) throw new Error('Puzzle must have exactly one solution');
    const enc = lockMessage(message, msgType, solutionKey(res.rows.flat()));
    const payload = new BitSeq();
    for (let i = 0; i < N * N; i++) payload.appendNum(givens[i] < 0 ? 0 : givens[i] + 1, 2);
    const len = 6 + 3 + 6 + payload.length() + 1 + enc.length();
    const gap = (6 - len % 6) % 6;
    const b = new BitSeq().appendNum(0, 6).appendNum(gap, 3).appendNum(0, gap).appendNum(N, 6);
    b.append(payload.get()).appendNum(msgType, 1).append(enc.get());
    return b.getShuffled().toAlphas();
}
export function parseLink(id) {
    const rd = new BitSeq().appendAlphas(id).getUnshuffled().getReader();
    const version = 1 + rd.readNum(6);
    if (version !== 1) throw new Error('Unknown Binairo link version ' + version);
    rd.readNum(rd.readNum(3));
    const N = rd.readNum(6);
    const givens = new Array(N * N).fill(-1);
    for (let i = 0; i < N * N; i++) { const v = rd.readNum(2); givens[i] = v === 0 ? -1 : v - 1; }
    const msgType = rd.readNum(1);
    return { version, N, givens, msgType, enc: new BitSeq(rd.read()) };
}
// cells: player's N*N CELL array.
export const decryptMessage = (enc, msgType, cells) =>
    unlockMessage(enc, msgType, bitsFrom(cells.map(c => c === CELL.ONE ? 1 : 0)));
