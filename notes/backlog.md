# Backlog

One line per item: **status** — what — pointer. Statuses: `approved`, `doing`, `proposed`,
`blocked`, `rejected`, `done`. Rationale lives in the decision note a line points at, never here.
Don't start anything not marked `approved`.

## Approved

- `done` — **v12: docs/rules rebuild for parallel agents.** New `AGENTS.md` (invariants kept, rules
  rebuilt, delivery + return format), thin `README.md`, `interfaces/`, `tracks/`, archived
  `gen-11/`, the one gate command `check-all.mjs`, and `GDP_BUILD` bumped to `12.0.0`.
- `done` — **v11: visible build label + bigger Fresh button; shared board chrome; Pictogram drawer
  fix; puzzle folders under `PuzzleForge/`; Binairo rewrite; Forge Test Mode; history archive.**
  Browser pass 2026-10-06 confirms all six players render and the four pointer puzzles solve.
  → `decisions/0001`, `0002`, `0003`, `0004`.
- `done` — **v10: fresh-version delivery, attached settings dock, Hashi parity, new puzzles.**
  → `decisions/0001` addendum.
- `done` — **One shared SVG board layer in `shared/`; remove p5.** → `decisions/0001-svg-board-migration.md`.
- `done` — **Documentation system** (split by type, one home per fact, `check-docs.mjs`, the one
  gate command). — no decision note (process change, owner-directed).

## Open defects and gaps found 2026-10-06 (proposed)

- `done` — **Hashi hit area:** `hitTest` now hit-tests by position (distance to each edge
  segment), not `ev.target`; clicking exactly on a bridge works. Node test
  `Hashi/dev-tools/test-board-hit.mjs`; browser proof in `click-solve.mjs`. → `interfaces/board-adapter.md`.
- `proposed` — **Fix `browser-checks/smoke-player.mjs`** (stale `/Pictogram/` path). → `testing.md`.
- `done` — **A click-solve browser gate:** `dev-tools/browser-checks/click-solve.mjs` — one
  Test-Mode link per pointer puzzle, real pointer events, solved message checked. All six pass
  (2026-10-08). → `testing.md`.
- `proposed` — **Extend `check-docs.mjs`** with shape rules that can fail: `AGENTS.md` contains the
  `## Return report` block, and every `decisions/` entry in `README.md` is nested under `decisions/`.
- `proposed` — **A single puzzle registry** (status, size caps, live/WIP, Test-Mode links) consumed
  by `PuzzleForge/index.html` and checked by the gate, so status is not duplicated across four files.

## Wheel-zoom and shell features (proposed)

- `proposed` — **Wheel-zoom performance at 60×60** if slow on real hardware (~30 fps measured under
  software rendering). → `decisions/0001-svg-board-migration.md`.
- `proposed` — **Move timer, saved progress, solved-notice and pop-out into the shell.** → `decisions/0001`.

## Pictogram — proposed, not built

- `done` — **Random mode left Pictogram** for its own Nonogram puzzle (below); Pictogram is
  picture-only. → `state.md` "PuzzleForge/Nonogram/".
- `proposed` — Replace "Random" mode with a small built-in puzzle gallery.
- `proposed` — A measured difficulty indicator (deduction-depth, not just grid size).
- `proposed` — A custom puzzle title shown to the player.
- `proposed` — Hint system: creator sets 0–10 hints; player spends one to reveal a correct cell.
- `proposed` — Survival/lives mode.
- `proposed` — Optional sound toggle (check licence per track).
- `proposed` — In-play "assist" overlay.
- `done` — **A test for what the player does:** `Pictogram/dev-tools/test-nonogram-model.mjs`
  covers the model (marks, hints, solved check). (The owner was never convinced this was worth
  doing; it is done here as part of the Nonogram split, cheaply.)
- `proposed` — Automatic background removal (client-side), if manual masking is revisited.
- `rejected` — Dithering for image conversion.
- `rejected` — Custom-uploaded backdrops/marks (cannot fit in a URL).

## Hashi — draft

- `blocked` — Owner has not said the largest board size Hashi should support (currently 5–14).

## Other puzzles — proposed, in rough build order

- `done` — **Nonogram (split out of Pictogram's Random mode):** folder `PuzzleForge/Nonogram/`
  (player + creator + settings), re-using Pictogram's model/generator/codec by relative path; link
  format stays Pictogram's seed-based v1, so random-nonogram links open in either player. → `state.md`.
- `proposed` — KenKen (cages + arithmetic): specced.
- `proposed` — Version the remaining unversioned local imports inside the Pictogram and Hashi
  creator modules.
- `proposed` — Extract a shared link-header helper (5 codecs repeat the framing) — needs approval (R6).
- `proposed` — Nurikabe (hardest to generate).
- `proposed` — Slitherlink (consult `decisions/0001`'s pzpr.js notes).
- `proposed` — Crossword generator.
- `proposed` — Train Tracks.
- `proposed` — Chained mode.
- `proposed` — Picture-to-Numberlink (separate, harder project).

## Housekeeping

- `done` — **Test Mode examples:** `PuzzleForge/index.html` (`TEST_LINKS`) now has one link per
  playable puzzle (Pictogram, Nonogram, Hashi, Akari, Skyscrapers, Binairo, Futoshiki). The
  Skyscrapers/Binairo/Futoshiki/Nonogram links were generated for the click-solve gate; the owner
  may swap them. → `decisions/0004-forge-test-mode.md`.

## Rules review and unreleased-puzzle research (Cloud_Logic_1, 2026-10-08)

All six puzzles were reviewed against the commonly published rules. None breaks its own rules;
the differences are quality/polish, recorded here for later:

- `proposed` — **Pictogram/Nonogram random density is 40–80%** (`ratio = 0.4 + 0.4*rd()`), above the
  usual 50–60%; high density plus a uniform shuffle makes many tiny runs, harder hint rows, and is
  the main cost of the uniqueness repair (the slow Pictogram sweeps). Lower or bias the range when
  Nonogram's generation is next touched.
- `proposed` — **Futoshiki draws an inequality between every adjacent pair** (`deriveIneq`), so the
  board shows more signs than a human editor would. The puzzle stays unique, so this is polish: drop
  a sign while the remaining set is still unique.
- `proposed` — **Hashi silently ignores an illegal bridge click** (returns `null`). Add a brief
  shake/flash so a player knows the click was rejected.
- `proposed` — **Pictogram's empty hint line draws "0"**; cosmetic, keep unless a Nikoli-exact look
  is wanted.

Unreleased puzzles — best implementation and pitfalls, from the existing kit (pure logic file,
adapter, unique generator, BitSeq codec, shared secret lock):

- `proposed` — **KenKen:** N×N Latin square (Futoshiki's generator) plus cages with arithmetic. Cage
  link bloat is the risk — pack (target, op, cells) tightly. Multiplication/division cages make
  uniqueness hard without givens; keep no-given variants to N≤6.
- `proposed` — **Nurikabe:** hardest generator here. Generate sea-first (random spanning tree, place
  islands in the holes) or island-first then carve; enforce one connected sea and no 2×2 block.
  Uniqueness via a limit-2 backtracking solver; solver cost is the trap.
- `proposed` — **Slitherlink:** edge model like Hashi + a one-loop constraint + corner counts. Loop
  detection needs "exactly one cycle", not just union-find connectivity; URL size grows with W×H
  edges (4 bits/edge is fine).
- `proposed` — **Train Tracks:** per-cell orientation bitmask; build the path first, derive row/col
  counts, then strip cells while the solution stays unique — never strip on counts alone.
- `proposed` — **Crossword:** has no standard unique solution, so it does not fit invariant 4 as-is;
  decide how the message lock maps before building. A shared wordlist in a constant (no server) is
  the data-shape pitfall.
- `proposed` — **Chained mode:** a shell over several links (hash the chain into one URL, step N to
  advance); version the chain format so old chains keep decoding.
