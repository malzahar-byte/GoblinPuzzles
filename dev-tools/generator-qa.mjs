#!/usr/bin/env node
// Generator QA — how good are the generators, measured, and kept (owner, 2026-10-09).
//
// Why this exists: every agent session is its own sandbox, and the numbers it measured die with it.
// So the sweep lives here, runs from the owner's pc (`Run-Local.cmd` -> "Generator QA", or by hand),
// and its table is written into TEST-RESULTS.md like every other job.
//
// For each puzzle and each size it seeds the puzzle the way the player gets it (message -> seed ->
// board, the same path the link uses) and reports:
//   ok      how many seeds produced a puzzle at all
//   clues   how much the generator gives away (the owner's "clue density" question)
//   unique  solve(..., 2) finds exactly one solution
//   human   the deduction-only check where the puzzle has one (`logicSolvable`)
//   ms      average generation time
//
// Usage: node dev-tools/generator-qa.mjs [--seeds N] [--only Name] [--size 8]
// Nothing here is a gate: it reports quality, it does not fail the build.
import path from 'path';
import { fileURLToPath } from 'url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const argVal = (flag, dflt) => {
    const i = argv.indexOf(flag);
    return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
};
const SEEDS = Math.max(1, Number(argVal('--seeds', 3)));
const ONLY = argVal('--only', '');
const MAX_SIZE = Number(argVal('--size', 0));      // 0 = each puzzle's own list
const PER_SIZE_BUDGET_MS = 25000;                   // stop a size that runs away; report the rest

const load = (rel) => import(path.join(ROOT, rel));
const fmt = (ms) => (ms >= 1000 ? (ms / 1000).toFixed(1) + 's' : Math.round(ms) + 'ms');
const pad = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);

// Each entry: `sizes` are the dimensions the puzzle's own API takes;
// `clue(p)` returns { label, got, of } — what the generator hands the player.
const PUZZLES = [
    {
        name: 'Akari',
        file: 'PuzzleForge/Akari/js/akari-logic.js',
        sizes: [[7, 7], [10, 10]],
        gen: (m, d, seed) => m.generateFromSeed(d[0], d[1], seed),
        clue: (p) => ({ label: 'clue numbers', got: p.nums.filter((n) => n > 0).length, of: p.R * p.C }),
        unique: (m, p) => m.solve(p.R, p.C, p.walls, p.nums, 2).count === 1,
        human: null
    },
    {
        name: 'Hashi',
        file: 'PuzzleForge/Hashi/js/hashi-logic.js',
        sizes: [[7, 7], [10, 10]],
        gen: (m, d, seed) => m.generateFromSeed(d[0], d[1], seed),
        clue: (p) => ({ label: 'islands', got: p.islands.length, of: p.W * p.H }),
        unique: (m, p) => m.solve(p.W, p.H, p.islands, 2).count === 1,
        human: null
    },
    {
        name: 'Skyscrapers',
        file: 'PuzzleForge/Skyscrapers/js/skyscrapers-logic.js',
        sizes: [[4], [6], [8]],
        gen: (m, d, seed) => m.generateFromSeed(d[0], seed),
        clue: (p) => ({ label: 'given cells', got: p.givens.filter(Boolean).length, of: p.N * p.N }),
        unique: (m, p) => m.solve(p.N, p.givens, p.clues, 2).count === 1,
        human: null
    },
    {
        name: 'Binairo',
        file: 'PuzzleForge/Binairo/js/binairo-logic.js',
        sizes: [[6], [8], [10]],
        gen: (m, d, seed) => m.generateFromSeed(d[0], seed),
        clue: (p) => ({ label: 'given cells', got: p.givens.filter((g) => g !== -1).length, of: p.N * p.N }),
        unique: (m, p) => m.solve(p.N, p.givens, 2).count === 1,
        human: (m, p) => m.logicSolvable(p.N, p.givens)
    },
    {
        name: 'Futoshiki',
        file: 'PuzzleForge/Futoshiki/js/futoshiki-logic.js',
        sizes: [[4], [5], [6]],
        gen: (m, d, seed) => m.generateFromSeed(d[0], seed),
        clue: (p) => ({
            label: 'givens + signs',
            got: p.givens.filter(Boolean).length + p.ineqH.filter(Boolean).length + p.ineqV.filter(Boolean).length,
            of: p.N * p.N + 2 * p.N * (p.N - 1)
        }),
        unique: (m, p) => m.solve(p.N, p.givens, p.ineqH, p.ineqV, 2).count === 1,
        human: (m, p) => m.logicSolvable(p.N, p.givens, p.ineqH, p.ineqV)
    },
    {
        name: 'Nurikabe',
        file: 'PuzzleForge/Nurikabe/js/nurikabe-logic.js',
        sizes: [[6, 6], [8, 8], [10, 10]],
        gen: (m, d, seed) => m.generateFromSeed(d[0], d[1], seed),
        clue: (p) => ({ label: 'clue cells', got: p.clues.filter((c) => c > 0).length, of: p.W * p.H }),
        unique: (m, p) => m.solve(p.W, p.H, p.clues, 2).count === 1,
        human: null
    },
    {
        name: 'TrainTracks',
        file: 'PuzzleForge/TrainTracks/js/traintracks-logic.js',
        sizes: [[6, 6], [8, 8], [10, 10]],
        gen: (m, d, seed) => m.generateFromSeed(d[0], d[1], seed),
        clue: (p) => ({
            // The owner's point: in the standard puzzle every row and column count is shown, so the
            // sweep reports how many of them the generator actually publishes.
            label: 'visible row/col counts',
            got: p.rowClue.filter((c) => c >= 0).length + p.colClue.filter((c) => c >= 0).length,
            of: p.W + p.H
        }),
        unique: (m, p) => m.solve(p.W, p.H, p.rowClue, p.colClue, p.givens, 2).count === 1,
        human: null
    }
];

console.log('Generator QA — ' + SEEDS + ' seeds per size, per puzzle');
console.log('(clues = what the generator hands the player; human = deduction-only check where the puzzle has one)');
console.log('');

const summary = [];
for (const spec of PUZZLES) {
    if (ONLY && ONLY.toLowerCase() !== spec.name.toLowerCase()) continue;
    const m = await load(spec.file);
    for (const d of spec.sizes) {
        if (MAX_SIZE && Math.max(...d) > MAX_SIZE) continue;
        const size = d.join('x');
        let ok = 0, unique = 0, humanOk = 0, humanKnown = 0, clueGot = 0, clueOf = 0, clueLabel = '', total = 0, skipped = 0;
        const started = Date.now();
        for (let i = 0; i < SEEDS; i++) {
            if (Date.now() - started > PER_SIZE_BUDGET_MS) { skipped = SEEDS - i; break; }
            const msg = 'QA ' + spec.name + ' ' + size + ' #' + i;
            const t0 = Date.now();
            let p = null, seed = -1;
            try {
                seed = m.seedForMessage(...d, msg);
                if (seed >= 0) p = spec.gen(m, d, seed);
            } catch (e) { p = null; }
            total += Date.now() - t0;
            if (!p) continue;
            ok++;
            try {
                const c = spec.clue(p);
                clueGot += c.got; clueOf += c.of; clueLabel = c.label;
            } catch (e) { /* a shape we did not expect: leave the clue column empty */ }
            try { if (spec.unique(m, p)) unique++; } catch (e) { /* counted as not unique */ }
            if (spec.human) {
                humanKnown++;
                try { if (spec.human(m, p)) humanOk++; } catch (e) { /* counted as not logic-solvable */ }
            }
        }
        const avg = ok ? fmt(total / ok) : '-';
        const density = clueOf ? Math.round((100 * clueGot) / clueOf) + '%' : 'n/a';
        const humanCol = spec.human ? humanOk + '/' + humanKnown : 'n/a';
        const avgClues = ok ? Math.round(clueGot / ok) : 0;
        console.log(
            pad(spec.name, 12) + pad(size, 7) +
            ' ok ' + padL(ok + '/' + SEEDS, 5) +
            '  ' + pad(clueLabel || 'clues', 24) + padL(avgClues, 4) + ' (' + padL(density, 4) + ')' +
            '  unique ' + padL(unique + '/' + ok, 5) +
            '  human ' + padL(humanCol, 5) +
            '  gen ' + padL(avg, 7) +
            (skipped ? '  (stopped after ' + ok + ')' : '')
        );
        summary.push({ name: spec.name, size, ok, seeds: SEEDS, unique, density, human: humanCol, avg });
    }
}

const weak = summary.filter((s) => s.ok < s.seeds || s.unique < s.ok);
console.log('');
console.log('puzzles measured: ' + summary.length +
    (weak.length ? '; needing attention: ' + weak.map((w) => w.name + ' ' + w.size).join(', ')
                 : '; every measured case generated a unique puzzle'));
console.log('note: "human" is n/a where the puzzle has no deduction-only check yet — decisions/0005 makes');
console.log('human-solvability the bar, so this is the column to fill in.');
process.exit(0);

