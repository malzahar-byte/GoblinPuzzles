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

- `proposed` — **Hashi hit area:** clicking exactly on an existing bridge does nothing (the visible
  line covers the hit area; `hitTest` keys off `ev.target`). Fix by hit-testing by position, like
  the other adapters, or drawing hit lines above the bridges. → `interfaces/board-adapter.md`.
- `proposed` — **Fix `browser-checks/smoke-player.mjs`** (stale `/Pictogram/` path). → `testing.md`.
- `proposed` — **A click-solve browser gate** (parameterised per puzzle; offline; fixed seeds) so a
  Hashi-class bug can be caught by a check rather than by a human. → `testing.md`.
- `proposed` — **Extend `check-docs.mjs`** with shape rules that can fail: `AGENTS.md` contains the
  `## Return report` block, and every `decisions/` entry in `README.md` is nested under `decisions/`.
- `proposed` — **A single puzzle registry** (status, size caps, live/WIP, Test-Mode links) consumed
  by `PuzzleForge/index.html` and checked by the gate, so status is not duplicated across four files.

## Wheel-zoom and shell features (proposed)

- `proposed` — **Wheel-zoom performance at 60×60** if slow on real hardware (~30 fps measured under
  software rendering). → `decisions/0001-svg-board-migration.md`.
- `proposed` — **Move timer, saved progress, solved-notice and pop-out into the shell.** → `decisions/0001`.

## Pictogram — proposed, not built

- `proposed` — **Random mode leaves Pictogram** and becomes its own puzzle (see the Nonogram line
  under "Other puzzles"). Pictogram keeps the picture way only.
- `proposed` — Replace "Random" mode with a small built-in puzzle gallery.
- `proposed` — A measured difficulty indicator (deduction-depth, not just grid size).
- `proposed` — A custom puzzle title shown to the player.
- `proposed` — Hint system: creator sets 0–10 hints; player spends one to reveal a correct cell.
- `proposed` — Survival/lives mode.
- `proposed` — Optional sound toggle (check licence per track).
- `proposed` — In-play "assist" overlay.
- `proposed` — **A test for what the player does** (`Pictogram/js/nonogram-model.js`, pure and
  DOM-free): clicking turns a cell black, right-click marks it, dragging paints, a hint number can
  be checked off, and the puzzle reports solved exactly when the runs match the numbers. Nothing
  tests this file today — every Pictogram test covers the picture→grid side instead. **The owner is
  not convinced this is worth doing**: no bug has come from this area yet, and it is unclear what it
  would catch. Kept as a possible item, not a plan.
- `proposed` — Automatic background removal (client-side), if manual masking is revisited.
- `rejected` — Dithering for image conversion.
- `rejected` — Custom-uploaded backdrops/marks (cannot fit in a URL).

## Hashi — draft

- `blocked` — Owner has not said the largest board size Hashi should support (currently 5–14).

## Other puzzles — proposed, in rough build order

- `proposed` — **Nonogram (split out of Pictogram's Random mode).** Same board shell and same
  message lock; it needs its own link format (today that is Pictogram's seed-based v1) and its own
  folder `PuzzleForge/Nonogram/`. Work for the logic track when a round starts.
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

- `approved` — **Test Mode examples**: owner pastes one real puzzle link per playable puzzle into
  `PuzzleForge/index.html` (`TEST_LINKS`). → `decisions/0004-forge-test-mode.md`.
