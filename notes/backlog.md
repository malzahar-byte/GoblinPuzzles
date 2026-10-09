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
- `done` — **Nurikabe built.** Sea-first generator, limit-2 uniqueness proof, board/player/creator,
  test and Forge entry. → `state.md`.
- `proposed` — Slitherlink (consult `decisions/0001`'s pzpr.js notes).
- `blocked` — **Crossword generator:** blocked on the owner deciding how the message lock maps onto
  a puzzle that has no unique solution (invariant 4). Options: fixed word list with a stored
  solution; solution stored in the link; or drop the message. → `state.md` In flight.
- `doing` — **Train Tracks:** logic module only; the loop builder works, `solve()` returns 0
  solutions on a valid loop. → `state.md` In flight.
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
- `done` — **Futoshiki no longer draws an inequality between every adjacent pair** (`deriveIneq`), so the
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

## Owner review round (2026-10-08)

- `done` — **Reload renders the saved state** (board no longer appears unsolved until the first
  click) and **the board opens fitted** instead of cropped/zoomed-in. → `state.md`, `history.md`.
- `done` — **One settings panel everywhere:** `shared/gdp-settings-panel.js` (themes, board style,
  board background, show grid, timer, clear progress). Six pages call it. → `state.md`.
- `done` — **Skyscrapers:** clicking a row/column number marks that line solved (nonogram style);
  generator given a floor so a 4×4 is not a hard grid; the Skyscrapers Test-Mode link was replaced
  with an easier 4×4. → `state.md`.
- `done` — **Binairo:** rules text now states the no-three-in-a-row ban; the generator rejects
  boards a human cannot start. → `state.md`.
- `doing` — **Message-deterministic generation.** Nonogram/Pictogram already derive the seed from the
  message; Hashi, Akari, Skyscrapers, Binairo, Futoshiki and Nurikabe must do the same, with the link
  carrying the seed instead of the board (new link version; old links keep decoding). The owner
  confirmed this is a theme of the project, not a nicety. → `state.md` In flight.
- `doing` — **Pictogram/Nonogram migrate to `shared/gdp-settings-panel.js`** (both still hand-wire
  their panel markup and lack "Show grid"). → `state.md` In flight.
- `done` — **Rules R16 (answer first) and R17 (test ownership)** added; R15 now says a commit is not
  a save point until it reaches the remote, and research/reasoning lives in `history.md`/`backlog.md`
  instead of a new document. → `AGENTS.md`.
- `approved` — **Nurikabe, Train Tracks and Crossword after the two in-flight items** (owner
  direction for this mission; Crossword only once its lock question is answered).

## Owner corrections (2026-10-09)

- `done` — **Old links are not preserved.** The "old links keep working" reading had been denied
  repeatedly and is gone: invariant 2 now says only the current link version must work, legacy
  decoders and "still decoding" paths are removed, and no effort goes to backward compatibility.
  Akari's v1 decoder is first to go; its v2 link is the only format.
- `done` — **Every commit steps the build.** R7 rewritten: `node dev-tools/bump-build.mjs` steps
  `GDP_BUILD` one patch (`13.0.0logic` → `13.0.1logic`) and re-points all 137 `?v=` URLs; save
  points included. A big version (new number or round suffix) is the owner's call only.
- `done` — **Same message + options = same puzzle** is spelled out in invariant 1. Akari is the
  first converted puzzle (link v2 stores the seed, the board is regenerated from it); Hashi,
  Skyscrapers, Binairo, Futoshiki and Nurikabe follow, then Train Tracks is built seeded.
- `done` — **The runner report names the build it ran on** (header line plus per-section
  `build …`), and `dev-tools/local-runner.mjs` is documented as never rewriting files.
- `done` — **R16/R17 clarified:** answers are read, reasoned and written in the agent's own words
  (not a verbatim note); agent tests must be few, easy, deterministic and fail only for a real
  defect — hard, slow or browser checks go to the owner's runner.

## Owner bug report (2026-10-09) — triaged by Cloud_Cline_1, read-only, nothing fixed yet

Evidence for each line is the owner's report plus code reading; the root causes are in the
2026-10-09 `history.md` entry. Do not start any of these without the owner's go-ahead (R3), and the
two `shared/` ones need approval first (R6/R8).

- `proposed` — **Board surface is nearly invisible in several styles.** There are two different
  board backgrounds: Pictogram/Nonogram draw `palette.bg` (`js/nonogram-board.js`), while the other
  eight draw `resolveChrome().surface`, which `chromeFrom()` builds from `p.cells[0]` — a *cell*
  colour, not the palette's `bg`. Light-theme Paper/Mono/Ocean/Candy land within a few RGB points of
  `--gdp-bg` (dark theme: Neon), so "Show board background" shows nothing and the toggle looks
  dead. → `interfaces/palette-chrome.md`.
- `proposed` — **Nurikabe's first click looks like nothing happened.** An island is drawn as "no
  fill" — the board surface — so with the surface invisible nothing appears until the second click
  paints sea. Same root cause as the line above: give islands a drawn state of their own. →
  `PuzzleForge/Nurikabe/js/nurikabe-board.js`.
- `proposed` — **Futoshiki test size.** `test-futoshiki.mjs` hardcodes `N = 5`; the creator's range
  is 4–7 (`creator.html` clamps to it; `state.md` said 4–8 until this triage and was corrected), so
  the smallest supported size (4×4) should be covered as well. →
  `PuzzleForge/Futoshiki/dev-tools/test-futoshiki.mjs`.
- `proposed` — **Train Tracks hides too many clues to look like a puzzle.** The Forge 6×6 example
  has every row count hidden, one visible column count and 5 pre-filled cells; it is unique but
  near-empty. Give the generator a floor (a visible count per row/column, or a minimum count). →
  `PuzzleForge/TrainTracks/js/traintracks-logic.js`.
- `proposed` — **Pre-filled cells are not visually distinct.** Futoshiki, Binairo, Skyscrapers,
  Nurikabe clue numbers and Train Tracks givens are drawn with the same `ink` as player values.
  Wants a per-style "given" tint. → `interfaces/palette-chrome.md` (new key).
- `proposed` — **Pencil marks and a right-click cycle.** Futoshiki/Binairo/Skyscrapers right-click
  only clears (on an empty cell it does nothing) and Nurikabe cycles unknown → island → sea; the
  owner wants a greyed `(?)` mark track, and `x` for "no track here" in Train Tracks, on both
  buttons. A per-puzzle cell state, not a shell change. → the four `*-board.js` files.
- `proposed` — **Futoshiki test size.** `test-futoshiki.mjs` hardcodes `N = 5`; the supported range
  is 4–8, so the smallest supported size (4×4) should be covered as well. →
  `PuzzleForge/Futoshiki/dev-tools/test-futoshiki.mjs`.
- `proposed` — **Test-Mode order ≠ puzzle order** in `PuzzleForge/index.html`: the grid lists
  Nurikabe before Skyscrapers, `TEST_LINKS` puts it after Futoshiki. → `PuzzleForge/index.html`.
- `proposed` — **`click-solve.mjs` keeps its own copy of the nine Test-Mode links,** so a
  regenerated Forge link silently desyncs the Browser job. Read them from one home (see the "single
  puzzle registry" item above). → `dev-tools/browser-checks/click-solve.mjs`.
- `proposed` — **Runner opens Edge, and a long tab-away stops the server.** `findChrome()` only
  looks in the standard Chrome install spots (then Edge), and the page's 5 s heartbeat is throttled
  to ~1/min once the tab has been hidden for minutes — past the 20 s idle grace. →
  `dev-tools/local-runner.mjs`.
- `proposed` — **Gate progress.** `check-all.mjs` prints nothing until the final table; a `k/n`
  line per job (and the current test name) is wanted. → `dev-tools/check-all.mjs`.
- `proposed` — **Pictogram `test-image.mjs` fails one `photo`-preset case** (owner's Full run, build
  `13.0.11logic`). One investigation run, not a blind fix. → `testing.md`.

