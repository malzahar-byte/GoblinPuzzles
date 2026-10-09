// Train Tracks logic. No DOM — pure model, generator, solver, link codec.
//
// The puzzle is one closed loop of track laid through some cells of the grid. A cell either is
// empty or holds a piece joining exactly two of its four sides; the numbers on the edges say how
// many cells of that row/column carry track. Every clue number may be hidden, and any cell may
// come pre-filled with a piece; the generator hides/removes everything it does not need, keeping
// the solution unique (AGENTS.md invariant 4: the message lock depends on it).
//
// A piece is a bitmask of the sides it joins: N=1, E=2, S=4, W=8. Legal pieces join exactly two
// sides, so there are six of them plus the empty cell.
import { BitSeq } from '../../../shared/gdp-bitseq.js?v=13.0.1logic';
import { bitsFrom, lockMessage, unlockMessage } from '../../../shared/gdp-secret.js?v=13.0.1logic';

export const DIR = { N: 1, E: 2, S: 4, W: 8 };
// index 0 = empty, 1..6 = the six pieces (NS, EW, NE, NW, SE, SW)
export const PIECES = [0, DIR.N | DIR.S, DIR.E | DIR.W, DIR.N | DIR.E, DIR.N | DIR.W, DIR.S | DIR.E, DIR.S | DIR.W];
export const ACTION_TYPE = { CELL: 0 };
export const UNKNOWN = 7;      // clue/link marker: "no pre-filled piece here"
export const MAX_SIDE = 12;

const idx = (W, r, c) => r * W + c;
const bitsOf = (x) => { let n = 0; while (x) { x &= x - 1; n++; } return n; };

export function neighbors(W, H, i) {
    const r = (i / W) | 0, c = i % W, out = [];
    if (r > 0) out.push([i - W, DIR.N, DIR.S]);
    if (c > 0) out.push([i - 1, DIR.W, DIR.E]);
    if (r + 1 < H) out.push([i + W, DIR.S, DIR.N]);
    if (c + 1 < W) out.push([i + 1, DIR.E, DIR.W]);
    return out;
}

// ---- the rule check on a filled board ----
// clues[i] is the row/column count, or -1 when hidden. pieces[i] is a PIECES entry.
export function isSolved(W, H, rowClue, colClue, givens, pieces) {
    const N = W * H;
    for (let i = 0; i < N; i++) {
        const p = pieces[i];
        if (p === undefined || p === null) return false;
        if (p !== 0 && bitsOf(p) !== 2) { return false; }
        if (givens[i] !== UNKNOWN && givens[i] !== p) { return false; }
        // every side a piece joins must be joined back by its neighbour
        for (const [j, mine, theirs] of neighbors(W, H, i)) {
            if ((p & mine) !== 0 && (pieces[j] & theirs) === 0) return false;
            if ((p & mine) === 0 && (pieces[j] & theirs) !== 0) return false;
        }
    }
    for (let r = 0; r < H; r++) {
        if (rowClue[r] >= 0) { let n = 0; for (let c = 0; c < W; c++) if (pieces[r * W + c]) n++; if (n !== rowClue[r]) return false; }
    }
    for (let c = 0; c < W; c++) {
        if (colClue[c] >= 0) { let n = 0; for (let r = 0; r < H; r++) if (pieces[r * W + c]) n++; if (n !== colClue[c]) return false; }
    }
    // exactly one loop: every track cell reachable from the first one
    let start = -1, track = 0;
    for (let i = 0; i < N; i++) if (pieces[i]) { track++; if (start < 0) start = i; }
    if (track === 0) return false;
    if (track < 4) return false; // the smallest loop is a 2x2 ring
    const vis = new Uint8Array(N); vis[start] = 1; const stack = [start]; let seen = 1;
    while (stack.length) {
        const i = stack.pop();
        for (const [j, mine, theirs] of neighbors(W, H, i)) {
            if ((pieces[i] & mine) === 0) continue;
            if (vis[j]) continue;
            vis[j] = 1; seen++; stack.push(j);
        }
    }
    return seen === track;
}

// ---- solver: counts solutions up to `limit`; an abort is "unknown", never proof ----
export function solve(W, H, rowClue, colClue, givens, limit = 2, maxNodes = 400000) {
    const N = W * H;
    const pieces = new Int8Array(N).fill(-1);
    const rowUsed = new Int16Array(H), colUsed = new Int16Array(W);
    // row/col cells already decided as track (for the "can still reach the clue" prune)
    const rowTrack = new Int16Array(H), colTrack = new Int16Array(W);
    const parent = new Int32Array(N);
    for (let k = 0; k < N; k++) parent[k] = k; // union-find over track cells (each cell is its own set)
    let count = 0, nodes = 0, aborted = false, first = null, closed = false, trackCount = 0;

    const find = (a) => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };

    const rowRoom = (r) => W - rowUsed[r];          // cells left in the row
    const colRoom = (c) => H - colUsed[c];

    const rec = (i) => {
        if (count >= limit || aborted) return;
        if (++nodes > maxNodes) { aborted = true; return; }
        if (i === N) {
            for (let r = 0; r < H; r++) if (rowClue[r] >= 0 && rowTrack[r] !== rowClue[r]) return;
            for (let c = 0; c < W; c++) if (colClue[c] >= 0 && colTrack[c] !== colClue[c]) return;
            if (!closed) return; // the loop never closed
            // one component?
            let root = -1;
            for (let k = 0; k < N; k++) if (pieces[k] > 0) { const rt = find(k); if (root < 0) root = rt; else if (rt !== root) return; }
            count++;
            if (!first) first = Array.from(pieces);
            return;
        }
        const r = (i / W) | 0, c = i % W;
        const up = r > 0 ? pieces[i - W] : -2;
        const left = c > 0 ? pieces[i - 1] : -2;
        for (let si = 0; si < PIECES.length; si++) {
            const p = PIECES[si];
            if (closed && p !== 0) continue;            // a closed loop may only add empty cells
            if (givens[i] !== UNKNOWN && givens[i] !== p) continue;
            // neighbour consistency for the already-decided sides
            if (p & DIR.N) { if (up < 0 || !(up & DIR.S)) continue; } else if (up >= 0 && (up & DIR.S)) continue;
            if (p & DIR.W) { if (left < 0 || !(left & DIR.E)) continue; } else if (left >= 0 && (left & DIR.E)) continue;
            if ((p & DIR.E) && c + 1 >= W) continue;
            if ((p & DIR.S) && r + 1 >= H) continue;
            const isTrack = p !== 0;
            if (isTrack) {
                rowTrack[r]++; colTrack[c]++;
                if (rowClue[r] >= 0 && rowTrack[r] > rowClue[r]) { rowTrack[r]--; colTrack[c]--; continue; }
                if (colClue[c] >= 0 && colTrack[c] > colClue[c]) { rowTrack[r]--; colTrack[c]--; continue; }
            }
            // can the visible clues still be met with the cells left?
            let fits = true;
            if (rowClue[r] >= 0 && rowTrack[r] + (W - c - 1) < rowClue[r]) fits = false;
            if (fits && colClue[c] >= 0 && colTrack[c] + (H - r - 1) < colClue[c]) fits = false;
            if (!fits) { if (isTrack) { rowTrack[r]--; colTrack[c]--; } continue; }
            rowUsed[r]++; colUsed[c]++; pieces[i] = p;
            let closedNow = closed;
            const linked = [];
            // union the piece with its decided neighbours, catching a closed loop
            for (const [j, mine] of [[i - W, DIR.N], [i - 1, DIR.W]]) {
                if (mine === DIR.N ? r === 0 : c === 0) continue;
                if ((p & mine) === 0) continue;
                const a = find(i), b = find(j);
                if (a === b) { closedNow = true; }            // this edge closes the cycle
                else { parent[a] = b; linked.push(a); }
            }
            const savedClosed = closed;
            closed = closedNow;
            rec(i + 1);
            closed = savedClosed;
            for (const a of linked) parent[a] = a;
            pieces[i] = -1;
            rowUsed[r]--; colUsed[c]--;
            if (isTrack) { rowTrack[r]--; colTrack[c]--; }
            if (count >= limit || aborted) return;
        }
    };
    for (let i = 0; i < N; i++) if (givens[i] !== UNKNOWN && givens[i] !== 0 && bitsOf(givens[i]) !== 2) return { count: 0, pieces: null, aborted: false };
    rec(0);
    return { count, pieces: first, aborted };
}

// ---- generator ----
function shuffle(a, rng) { for (let i = a.length - 1; i > 0; i--) { const j = (rng() * (i + 1)) | 0; const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

// A random single loop: start from a 2×2 ring and repeatedly push an "ear" — a cell that touches
// two neighbouring loop cells joins between them, so the ring stays one simple loop.
function randomLoop(W, H, rng, targetCells) {
    const N = W * H;
    let loop = null;
    for (let t = 0; t < 40 && !loop; t++) {
        const r0 = (rng() * (H - 1)) | 0, c0 = (rng() * (W - 1)) | 0;
        loop = [idx(W, r0, c0), idx(W, r0, c0 + 1), idx(W, r0 + 1, c0 + 1), idx(W, r0 + 1, c0)];
    }
    if (!loop) return null;
    const inLoop = new Uint8Array(N);
    for (const i of loop) inLoop[i] = 1;
    for (let step = 0; step < targetCells * 3; step++) {
        if (loop.length >= targetCells) break;
        const options = [];
        for (let k = 0; k < loop.length; k++) {
            const a = loop[k], b = loop[(k + 1) % loop.length];
            const ra = (a / W) | 0, ca = a % W, rb = (b / W) | 0, cb = b % W;
            // a cell that is orthogonally adjacent to both a and b (a corner "ear")
            if (ra === rb) { const r = ra - 1; if (r >= 0 && !inLoop[idx(W, r, ca)] && !inLoop[idx(W, r, cb)]) options.push({ k, cell: idx(W, r, ca) }); const r2 = ra + 1; if (r2 < H && !inLoop[idx(W, r2, ca)] && !inLoop[idx(W, r2, cb)]) options.push({ k, cell: idx(W, r2, ca) }); }
            else if (ca === cb) { const c1 = ca - 1; if (c1 >= 0 && !inLoop[idx(W, ra, c1)] && !inLoop[idx(W, rb, c1)]) options.push({ k, cell: idx(W, ra, c1) }); const c2 = ca + 1; if (c2 < W && !inLoop[idx(W, ra, c2)] && !inLoop[idx(W, rb, c2)]) options.push({ k, cell: idx(W, ra, c2) }); }
        }
        if (!options.length) break;
        const pick = options[(rng() * options.length) | 0];
        loop.splice(pick.k + 1, 0, pick.cell);
        inLoop[pick.cell] = 1;
    }
    if (loop.length < 4) return null;
    return loop;
}

function piecesFromLoop(W, H, loop) {
    const N = W * H;
    const pieces = new Array(N).fill(0);
    for (let k = 0; k < loop.length; k++) {
        const a = loop[k], b = loop[(k + 1) % loop.length];
        const ra = (a / W) | 0, ca = a % W, rb = (b / W) | 0, cb = b % W;
        if (ra === rb) { pieces[a] |= DIR.E; pieces[b] |= DIR.W; }
        else { pieces[a] |= DIR.S; pieces[b] |= DIR.N; }
    }
    return pieces;
}

export function deriveClues(W, H, pieces) {
    const rowClue = [], colClue = [];
    for (let r = 0; r < H; r++) { let n = 0; for (let c = 0; c < W; c++) if (pieces[r * W + c]) n++; rowClue.push(n); }
    for (let c = 0; c < W; c++) { let n = 0; for (let r = 0; r < H; r++) if (pieces[r * W + c]) n++; colClue.push(n); }
    return { rowClue, colClue };
}

export function generate(W, H, rng = Math.random, opts = {}) {
    const tries = opts.tries ?? 40;
    const N = W * H;
    for (let t = 0; t < tries; t++) {
        const target = Math.max(4, Math.round(N * (0.35 + rng() * 0.3)));
        const loop = randomLoop(W, H, rng, target);
        if (globalThis.__ttDbg2) console.log('t', t, 'target', target, 'loop', loop ? loop.length : null);
        if (!loop) continue;
        const solution = piecesFromLoop(W, H, loop);
        const { rowClue, colClue } = deriveClues(W, H, solution);
        // Start from every clue visible and every cell pre-filled, then hide/drop one clue at a
        // time while a limit-2 search still finds exactly one loop.
        const givens = solution.map(p => (p === 0 ? PIECES[0] : p));
        const unique = () => { const res = solve(W, H, rowClue, colClue, givens, 2, opts.maxNodes ?? 60000); if (globalThis.__ttDbg2) console.log('   unique?', res.count, 'aborted', res.aborted); return !res.aborted && res.count === 1; };
        if (!unique()) continue;
        const steps = [];
        for (let r = 0; r < H; r++) steps.push({ kind: 'row', i: r });
        for (let c = 0; c < W; c++) steps.push({ kind: 'col', i: c });
        for (let i = 0; i < N; i++) steps.push({ kind: 'cell', i });
        for (const s of shuffle(steps, rng)) {
            if (s.kind === 'row') { const save = rowClue[s.i]; rowClue[s.i] = -1; if (!unique()) rowClue[s.i] = save; }
            else if (s.kind === 'col') { const save = colClue[s.i]; colClue[s.i] = -1; if (!unique()) colClue[s.i] = save; }
            else { const save = givens[s.i]; givens[s.i] = UNKNOWN; if (!unique()) givens[s.i] = save; }
        }
        const res = solve(W, H, rowClue, colClue, givens, 2, 400000);
        if (globalThis.__ttDbg2) console.log('   after strip: count', res.count, 'aborted', res.aborted);
        if (res.aborted || res.count !== 1) continue;
        return { W, H, rowClue, colClue, givens, solution, attempts: t + 1 };
    }
    return null;
}

// ---- link codec: per cell a 3-bit piece code (0 empty, 1..6 piece, 7 unknown), then the clues
const PIECE_INDEX = (p) => PIECES.indexOf(p);
const keyBits = (solution) => bitsFrom(solution.map(p => (PIECE_INDEX(p) | 0)));

export function encodeLink(W, H, rowClue, colClue, givens, message, msgType = 0) {
    const res = solve(W, H, rowClue, colClue, givens, 2);
    if (res.aborted || res.count !== 1) throw new Error('Puzzle must have exactly one solution');
    const enc = lockMessage(message, msgType, keyBits(res.pieces));
    const g = new BitSeq();
    for (let i = 0; i < W * H; i++) g.appendNum(givens[i] === UNKNOWN ? 7 : PIECE_INDEX(givens[i]), 3);
    const rc = new BitSeq();
    for (let r = 0; r < H; r++) rc.appendNum(rowClue[r] < 0 ? W : rowClue[r], 5);
    for (let c = 0; c < W; c++) rc.appendNum(colClue[c] < 0 ? H : colClue[c], 5);
    const len = 6 + 3 + 6 + 6 + W * H * 3 + (W + H) * 5 + 1 + enc.length();
    const gap = (6 - len % 6) % 6;
    const b = new BitSeq().appendNum(0, 6).appendNum(gap, 3).appendNum(0, gap).appendNum(W - 3, 6).appendNum(H - 3, 6);
    b.append(g.get()).append(rc.get()).appendNum(msgType, 1).append(enc.get());
    return b.getShuffled().toAlphas();
}

export function parseLink(id) {
    const rd = new BitSeq().appendAlphas(id).getUnshuffled().getReader();
    const version = 1 + rd.readNum(6);
    if (version !== 1) throw new Error('Unknown Train Tracks link version ' + version);
    rd.readNum(rd.readNum(3));
    const W = rd.readNum(6) + 3, H = rd.readNum(6) + 3;
    if (W > MAX_SIDE || H > MAX_SIDE) throw new Error('Train Tracks link too large');
    const givens = [];
    for (let i = 0; i < W * H; i++) { const v = rd.readNum(3); givens.push(v === 7 ? UNKNOWN : PIECES[v]); }
    const rowClue = [];
    for (let r = 0; r < H; r++) { const v = rd.readNum(5); rowClue.push(v === W ? -1 : v); }
    const colClue = [];
    for (let c = 0; c < W; c++) { const v = rd.readNum(5); colClue.push(v === H ? -1 : v); }
    const msgType = rd.readNum(1);
    return { version, W, H, rowClue, colClue, givens, msgType, enc: new BitSeq(rd.read()) };
}

export const decryptMessage = (enc, msgType, pieces) =>
    unlockMessage(enc, msgType, bitsFrom(pieces.map(p => (PIECE_INDEX(p) | 0))));
