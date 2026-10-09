// Nurikabe logic. No DOM, no drawing — pure model, generator, solver, link codec.
//
// Board: W×H cells. `clues[i]` is the size of the island whose clue sits at cell i (0 = no clue).
// Rules (the published ones):
//   - every clue cell belongs to an island of exactly `clue` cells, connected orthogonally;
//   - each island holds exactly one clue;
//   - islands never touch orthogonally (diagonal contact is fine);
//   - every non-island cell is "sea"; the sea is one connected region and holds no 2×2 block.
// Player cell state: 0 unknown, 1 island, 2 sea.
//
// The generator builds a solution first (random islands, then the sea), reads the clues off it,
// and ships the board only when a limit-2 search proves the clues have exactly one solution —
// the message lock depends on that (notes/AGENTS.md invariant 4).
import { BitSeq } from '../../../shared/gdp-bitseq.js?v=13.0.9logic';
import { bitsFrom, lockMessage, unlockMessage } from '../../../shared/gdp-secret.js?v=13.0.9logic';
import { hash, charToNum, getRandomizer } from '../../../shared/gdp-math-utils.js?v=13.0.9logic';

export const CELL = { UNKNOWN: 0, ISLAND: 1, SEA: 2 };
export const ACTION_TYPE = { CELL: 0 };
export const MAX_SIZE = 12;   // grid sides
export const MAX_ISLAND = 15; // 4 bits in the link

const idx = (W, r, c) => r * W + c;

export function neighbors(W, H, i) {
    const r = (i / W) | 0, c = i % W, out = [];
    if (r > 0) out.push(i - W);
    if (r < H - 1) out.push(i + W);
    if (c > 0) out.push(i - 1);
    if (c < W - 1) out.push(i + 1);
    return out;
}

// ---- rule check on a finished board ----
export function isSolved(W, H, clues, cells) {
    const N = W * H;
    for (let i = 0; i < N; i++) if (cells[i] === CELL.UNKNOWN) return false;
    // islands: size matches their clue, exactly one clue each, never touching
    const seen = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
        if (clues[i] <= 0 || cells[i] !== CELL.ISLAND) continue;
        const stack = [i]; seen[i] = 1;
        let size = 0, clueCells = 0;
        while (stack.length) {
            const j = stack.pop(); size++;
            if (clues[j] > 0) clueCells++;
            for (const k of neighbors(W, H, j)) {
                if (cells[k] === CELL.ISLAND) { if (seen[k]) continue; seen[k] = 1; stack.push(k); }
                else if (cells[k] !== CELL.SEA) return false;
            }
        }
        // Two islands that touch are one island here, so a second clue in the walk means they
        // were adjacent (illegal); a size that does not match its clue is illegal too.
        if (size !== clues[i] || clueCells !== 1) return false;
    }
    for (let i = 0; i < N; i++) if (cells[i] === CELL.ISLAND && !seen[i]) return false; // island with no clue
    for (let i = 0; i < N; i++) if (clues[i] > 0 && cells[i] !== CELL.ISLAND) return false;
    // sea: one connected region, no 2×2 block
    let seaStart = -1, seaCount = 0;
    for (let i = 0; i < N; i++) if (cells[i] === CELL.SEA) { seaCount++; if (seaStart < 0) seaStart = i; }
    if (seaCount) {
        const stack = [seaStart], vis = new Uint8Array(N); vis[seaStart] = 1;
        let n = 1;
        while (stack.length) {
            const j = stack.pop();
            for (const k of neighbors(W, H, j)) if (cells[k] === CELL.SEA && !vis[k]) { vis[k] = 1; n++; stack.push(k); }
        }
        if (n !== seaCount) return false;
        for (let r = 0; r + 1 < H; r++) for (let c = 0; c + 1 < W; c++) {
            if (cells[idx(W, r, c)] === CELL.SEA && cells[idx(W, r, c + 1)] === CELL.SEA
                && cells[idx(W, r + 1, c)] === CELL.SEA && cells[idx(W, r + 1, c + 1)] === CELL.SEA) return false;
        }
    }
    return true;
}

// ---- solver: counts solutions up to `limit` (an abort is "unknown", never proof) ----
// Depth-first over cells in row-major order. Island cells are grown from their clue, so an
// island cell always reaches its own clue through island cells; the sea is checked when the
// board is full (2×2 blocks are rejected as soon as one appears).
export function solve(W, H, clues, limit = 2, maxNodes = 400000) {
    const N = W * H;
    // 0 unknown, -1 sea, 1..groups island group id
    const state = new Int8Array(N);
    const groupSize = new Int16Array(N + 1);
    const groupClue = new Int16Array(N + 1);
    let groups = 0, count = 0, nodes = 0, aborted = false, first = null;

    const seaFits = (i) => {
        const r = (i / W) | 0, c = i % W;
        for (let dr = -1; dr <= 0; dr++) for (let dc = -1; dc <= 0; dc++) {
            const r0 = r + dr, c0 = c + dc;
            if (r0 < 0 || c0 < 0 || r0 + 1 >= H || c0 + 1 >= W) continue;
            let all = true;
            for (const [rr, cc] of [[r0, c0], [r0, c0 + 1], [r0 + 1, c0], [r0 + 1, c0 + 1]]) {
                const j = rr * W + cc;
                if (j !== i && state[j] !== -1) { all = false; break; }
            }
            if (all) return false;
        }
        return true;
    };
    const seaConnected = () => {
        let start = -1, total = 0;
        for (let i = 0; i < N; i++) if (state[i] === -1) { total++; if (start < 0) start = i; }
        if (total === 0) return true; // a board with no sea at all is legal only when nothing violates it
        const vis = new Uint8Array(N); vis[start] = 1; const stack = [start]; let n = 1;
        while (stack.length) {
            const j = stack.pop();
            for (const k of neighbors(W, H, j)) if (state[k] === -1 && !vis[k]) { vis[k] = 1; n++; stack.push(k); }
        }
        return n === total;
    };
    // can this cell be the start of a new island (a clue cell with no island neighbours)?
    const canStart = (i) => {
        for (const j of neighbors(W, H, i)) if (state[j] > 0) return false;
        return true;
    };
    const adjacentGroups = (i) => {
        const out = [];
        for (const j of neighbors(W, H, i)) if (state[j] > 0 && !out.includes(state[j])) out.push(state[j]);
        return out;
    };

    const rec = (i) => {
        if (count >= limit || aborted) return;
        if (++nodes > maxNodes) { aborted = true; return; }
        if (i === N) {
            for (let g = 1; g <= groups; g++) if (groupSize[g] !== groupClue[g]) return;
            if (!seaConnected()) return;
            count++;
            // The search works in group ids (1..G) and -1 for sea; everything outside this file
            // speaks CELL (ISLAND / SEA), so translate before handing the solution out.
            if (!first) first = Array.from(state, v => (v > 0 ? CELL.ISLAND : CELL.SEA));
            return;
        }
        const clue = clues[i];
        if (!clue) {
            // sea
            state[i] = -1;
            if (seaFits(i)) { rec(i + 1); state[i] = 0; if (count >= limit || aborted) return; }
            state[i] = 0;
        } else {
            // a clue cell must start its own island
            if (canStart(i)) {
                const g = ++groups;
                state[i] = g; groupSize[g] = 1; groupClue[g] = clue;
                rec(i + 1);
                groupSize[g] = 0; groupClue[g] = 0; groups--; state[i] = 0;
                if (count >= limit || aborted) return;
            }
            return;
        }
        // grow an existing island into i
        for (const g of adjacentGroups(i)) {
            if (groupSize[g] >= groupClue[g]) continue;
            let touchesOther = false;
            for (const j of neighbors(W, H, i)) if (state[j] > 0 && state[j] !== g) { touchesOther = true; break; }
            if (touchesOther) continue;
            state[i] = g; groupSize[g]++;
            rec(i + 1);
            groupSize[g]--; state[i] = 0;
            if (count >= limit || aborted) return;
        }
    };
    rec(0);
    return { count, state: first, aborted };
}

// ---- generator ----
function shuffle(a, rng) { for (let i = a.length - 1; i > 0; i--) { const j = (rng() * (i + 1)) | 0; const t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

// A random legal solution, built SEA-FIRST. Any connected set of cells with no 2×2 block can
// be the sea: the cells left over always form whole islands (two touching leftover cells would
// be one component), so the only thing left to do is read each island's size off the grid.
// Growing islands first does not work — sparse islands leave 2×2 sea holes, which is illegal.
function randomSolution(W, H, rng, maxIsland) {
    const N = W * H;
    const sea = new Uint8Array(N);
    const step = (cell) => {
        const r = (cell / W) | 0, c = cell % W;
        for (let dr = -1; dr <= 0; dr++) for (let dc = -1; dc <= 0; dc++) {
            const r0 = r + dr, c0 = c + dc;
            if (r0 < 0 || c0 < 0 || r0 + 1 >= H || c0 + 1 >= W) continue;
            let all = true;
            for (const [rr, cc] of [[r0, c0], [r0, c0 + 1], [r0 + 1, c0], [r0 + 1, c0 + 1]]) {
                const j = rr * W + cc;
                if (j !== cell && !sea[j]) { all = false; break; }
            }
            if (all) return false; // would complete a 2×2 block of sea
        }
        return true;
    };
    const seed = (rng() * N) | 0;
    sea[seed] = 1;
    const target = Math.round(N * (0.55 + rng() * 0.22));
    let placed = 1, stuck = 0;
    while (placed < target && stuck < 40) {
        const frontier = [];
        for (let i = 0; i < N; i++) if (sea[i]) for (const j of neighbors(W, H, i)) if (!sea[j]) frontier.push(j);
        if (!frontier.length) break;
        const pick = frontier[(rng() * frontier.length) | 0];
        if (step(pick)) { sea[pick] = 1; placed++; stuck = 0; } else stuck++;
    }
    const state = new Uint8Array(N);
    const clues = new Array(N).fill(0);
    const seen = new Uint8Array(N);
    let islands = 0, biggest = 0;
    for (let i = 0; i < N; i++) {
        state[i] = sea[i] ? CELL.SEA : CELL.ISLAND;
        if (sea[i] || seen[i]) continue;
        const stack = [i]; seen[i] = 1; const members = [];
        while (stack.length) {
            const j = stack.pop(); members.push(j);
            for (const k of neighbors(W, H, j)) if (!sea[k] && !seen[k]) { seen[k] = 1; stack.push(k); }
        }
        members.sort((a, b) => a - b);
        clues[members[0]] = members.length;
        biggest = Math.max(biggest, members.length);
        islands++;
    }
    if (islands < 2 || biggest > maxIsland) return null;
    if (!isSolved(W, H, clues, state)) return null;
    return { clues, state };
}

export function generate(W, H, rng = Math.random, opts = {}) {
    const tries = opts.tries ?? 200;
    const maxIsland = Math.min(MAX_ISLAND, opts.maxIsland ?? 5);
    for (let t = 0; t < tries; t++) {
        const sol = randomSolution(W, H, rng, maxIsland);
        if (!sol) continue;
        const res = solve(W, H, sol.clues, 2, opts.maxNodes ?? 200000);
        if (res.aborted || res.count !== 1) continue;
        return { W, H, clues: sol.clues, solution: sol.state, attempts: t + 1 };
    }
    return null;
}

// ---- link codec: message-seeded, version 2 ----
//
// The link stores the seed, never the board: the same message + size always gives the same puzzle
// and the same link, and parseLink rebuilds the clues from the seed. Only version 2 is read;
// there is no v1 decoder (invariant 2 — old versions are retired, not kept readable).
const keyBits = (solution) => bitsFrom(solution.map(v => v === CELL.ISLAND ? 1 : 0));

export const LINK_VERSION = 2;

export function seedFromMessage(message) {
    return hash(Array.from(message).map(charToNum)) & 0x7fffffff;
}

export function generateFromSeed(W, H, seed) {
    return generate(W, H, getRandomizer(seed), { tries: 400 });
}

// The message hash, advanced until it yields a unique puzzle — deterministic for the same input.
export function seedForMessage(W, H, message, tries = 4000) {
    let seed = seedFromMessage(message);
    for (let i = 0; i < tries; i++) {
        if (generateFromSeed(W, H, seed)) return seed;
        seed = (seed + 1) & 0x7fffffff;
    }
    return -1;
}

export function encodeSeededLink(W, H, seed, message, msgType = 0) {
    const p = generateFromSeed(W, H, seed);
    if (!p) throw new Error('No unique puzzle for this seed');
    const res = solve(W, H, p.clues, 2);
    if (res.aborted || res.count !== 1) throw new Error('Puzzle must have exactly one solution');
    const enc = lockMessage(message, msgType, keyBits(res.state));
    const len = 6 + 3 + 6 + 6 + 31 + 1 + enc.length();
    const gap = (6 - len % 6) % 6;
    const b = new BitSeq().appendNum(LINK_VERSION - 1, 6).appendNum(gap, 3).appendNum(0, gap)
        .appendNum(W - 3, 6).appendNum(H - 3, 6)
        .appendNum(seed, 31).appendNum(msgType, 1).append(enc.get());
    return b.getShuffled().toAlphas();
}

// What a creator calls: message (+ size) -> the link, deterministically.
export function encodeFromMessage(W, H, message, msgType = 0) {
    const seed = seedForMessage(W, H, message);
    if (seed < 0) throw new Error('Could not seed a unique puzzle for this message at this size');
    return encodeSeededLink(W, H, seed, message, msgType);
}

export function parseLink(id) {
    const rd = new BitSeq().appendAlphas(id).getUnshuffled().getReader();
    const version = 1 + rd.readNum(6);
    if (version !== LINK_VERSION) throw new Error('Unknown Nurikabe link version ' + version);
    rd.readNum(rd.readNum(3));
    const W = rd.readNum(6) + 3, H = rd.readNum(6) + 3;
    if (W > MAX_SIZE || H > MAX_SIZE) throw new Error('Nurikabe link too large');
    // Seeded link: the clues are rebuilt from the seed, never stored.
    const seed = rd.readNum(31);
    const msgType = rd.readNum(1);
    const enc = new BitSeq(rd.read());
    const p = generateFromSeed(W, H, seed);
    if (!p) throw new Error('Seeded Nurikabe link does not generate a puzzle');
    return { version, W, H, clues: p.clues, seed, msgType, enc };
}

export const decryptMessage = (enc, msgType, cells) =>
    unlockMessage(enc, msgType, bitsFrom(cells.map(c => c === CELL.ISLAND ? 1 : 0)));
