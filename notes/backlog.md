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

## Owner direction (2026-10-09, second round) — triaged by Cloud_Cline_1

Statuses now follow the owner's answers: `approved` = the owner has told us to do it, `blocked` =
explicitly deferred, `proposed` = still a suggestion. Root causes and evidence are in the
2026-10-09 `history.md` entries. Do not start a `proposed` line.

### Standing directive — one style system for all nine puzzles

- `approved` — **Fix the board surface colour; styles are global.** The owner's repeated position is
  that board background, grid, ink, pre-filled tint and marks are shared, not per-puzzle. Surface is
  the visible symptom: Pictogram/Nonogram draw `palette.bg`, the other eight draw `chromeFrom()`'s
  `surface`, which is built from `p.cells[0]` (a *cell* colour) and is near-invisible in light
  Paper/Mono/Ocean/Candy and in dark Neon. Use one definition (the palette's `bg`) so the board
  background is visible on every puzzle in every style. Shared change, owner-approved. →
  `interfaces/palette-chrome.md`.
- `approved` — **Pre-filled cells are visually distinct from player values** on every puzzle
  (Futoshiki, Binairo, Skyscrapers, Nurikabe clue numbers and Train Tracks givens all share `ink`
  today): a per-style "given" colour in the shared palette/chrome. → `interfaces/palette-chrome.md`.
- `approved` — **Marks on cells, in one shared shape:** a greyed `(?)`-style candidate mark and an
  `x`-style "nothing here" mark, reached by left/right click as each puzzle's own cycle defines —
  the owner's "new thing for them". Proposal: keep it inside each `*-board.js` (no shell change)
  unless the owner wants it in the shell. → `interfaces/board-adapter.md` (note only).

### Generators must make puzzles for humans, not merely unique puzzles

- `approved` — **Train Tracks always shows every row and column count.** The generator currently
  hides any count it can (the Forge 6×6 has `rowClue` all -1 and one visible `2`), and the player
  page documents the policy ("A count that is not shown is a count you get for free"). In every
  standard Tracks implementation the row/column numbers are the clues and all of them are printed.
  Drop the hiding policy and that rules sentence, keep uniqueness, and give the Forge example a real
  clue set. → `PuzzleForge/TrainTracks/`.
- `approved` — **Futoshiki targets a clue density, not a minimal clue set.** The dedupe pass deletes
  every inequality sign that uniqueness does not need, leaving 5 givens + 3 signs on a 5×5. Standard
  Futoshiki shows signs between *some* pairs (plus optionally a few given digits), but published
  puzzles are much denser and are solved by deduction. Pick a density, then re-check uniqueness. →
  `PuzzleForge/Futoshiki/`.
- `approved` — **Human-solvable is a generator requirement.** The owner, 2026-10-09: "being
  technically solvable mathematically and being designed and solvable for humans are different
  things". A deduction-only check (no guessing, no brute force) should gate the generator, the way
  Binairo already rejects boards a human cannot start. One puzzle at a time. →
  `PuzzleForge/*/js/*-logic.js`.
- `blocked` — **Pictogram `test-image.mjs` `photo`-preset failure** (owner's Full run, build
  `13.0.11logic`): the owner says ignore it until Pictogram is the puzzle being worked on. Not a
  blocker for anything else. → `testing.md`.

### Small UI corrections (all approved)

- `approved` — **"Create your own puzzle" always targets the Forge** (`../index.html`) — the owner
  confirms that was always the intent. Nurikabe and Train Tracks currently open their own
  `creator.html`. Check all nine player pages. → the player pages.
- `approved` — **Test Mode alphabetical, with greyed-out placeholders** for the puzzles not built
  yet (Slitherlink, Crossword, Chained mode, …) so the order cannot drift as puzzles land; the
  puzzle grid and the test grid use the same order. → `PuzzleForge/index.html`.
- `approved` — **Futoshiki tests cover the smallest supported size too** (4×4; `test-futoshiki.mjs`
  hardcodes `N = 5`, the creator's range is 4–7). → `PuzzleForge/Futoshiki/dev-tools/`.
- `approved` — **Keep adding the newest hard checks to the owner's runner** in the same shape as
  `click-solve.mjs` and the Browser job (owner: "continue adding new tests up to date for me to run
  like that"). A new puzzle's checks land in `JOBS` in `dev-tools/local-runner.mjs`. →
  `notes/testing.md`.

### The owner's local runner — approved, with the concrete fix

- `approved` — **The runner must not die when the tab is in the background.** Cause: the injected
  heartbeat pings every 5 s, but Chrome throttles a tab hidden for minutes to about one ping a
  minute — past the 20 s idle grace — so the server shuts itself down. Fix: do not read "no ping" as
  "browser closed". Have the page report visibility (`visibilitychange` / `pagehide` beacons), keep
  the idle timer suspended while it is hidden, and keep a long grace as a backstop. Also print
  plainly which browser was found, so an Edge fallback is never a surprise. →
  `dev-tools/local-runner.mjs`.
- `approved` — **Gate progress output:** `check-all.mjs` prints nothing until its final table; add a
  `[k/n] <test>` line per job so the owner can watch it move. → `dev-tools/check-all.mjs`.
- `proposed` — **`click-solve.mjs` keeps its own copy of the nine Test-Mode links,** so a
  regenerated Forge link silently desyncs the Browser job; read them from one home. →
  `dev-tools/browser-checks/click-solve.mjs`.

### Research steps the owner set (not started)

- `proposed` — **Pictogram/Nonogram: why is that pair separate?** Own codec and own renderer while
  the other nine share one — the owner wants it researched before anything changes ("still weird to
  me and needs to be researched", later step, not now). → `PuzzleForge/Pictogram/`, `Nonogram/`.
- `approved` — **Migrate Hashi to the common shape:** message+size seed determinism, the shared
  secret lock, shared chrome, and the standard player page instead of `play.html` with its own
  `package.json` and hand-rolled plain-text XOR. → `PuzzleForge/Hashi/`.
- `approved` — **Docs save points reach `main`.** The owner: work that is only documentation "needed
  to be pushed to git main, so next agent could see and pick up your work". Whether R15 needs a
  sentence saying so is a question for the owner. → `AGENTS.md`.

### Refuted / no action

- Nurikabe's Forge example has 13 clues and exactly one solution (search limit 3 → 1), and the
  sparse Futoshiki example is unique too — the "wrong / multiple solutions" feeling is the invisible
  board surface (`approved` above), not a solver defect. If the owner still hits a board that really
  admits two solutions, the link is the evidence needed.

## Owner direction (2026-10-09, third round) — answers to the report

Logic, standard rules and clue policy now live in `decisions/0005-puzzle-rules-and-clue-policy.md`;
read that first. Statuses: `approved` = do it, `proposed` = still a suggestion.

- `approved` — **A filled-but-wrong board must say which rule it breaks.** Evidence: the owner's 5×5
  Nurikabe (`MSEoZ6zd7wlxHIoIiwg0ofu`) is correctly not solved — the two "2" islands are one cell
  and rows 3–4 form 2×2 sea blocks — but the page gives no reason, so it reads as a bug. Show the
  violated rule (highlight the offending region), at least when every cell is filled. →
  `PuzzleForge/Nurikabe/` then the other puzzles.
- `approved` — **A Generator-QA job in the owner's runner.** The owner's point: every agent is a
  fresh cloud sandbox, so generator research and sweeps die with the session — they must be
  committed and runnable from `Run-Local.cmd`. Sweep each puzzle/size, print clue density,
  deduction-only solvability and timing, and write it into `TEST-RESULTS.md`. →
  `dev-tools/local-runner.mjs`, `notes/testing.md`.
- `approved` — **Futoshiki difficulty tiers (Trivial / Easy / Tricky / Extreme)** the way
  `futoshiki.com` does it: clue density is a per-tier target, not "the fewest clues that stay
  unique". → `PuzzleForge/Futoshiki/`, `decisions/0005`.
- `approved` — **Train Tracks shows every row and column count** (owner: "I always saw all rows and
  columns state in number how many tracks there are"; reference `puzzlemadness.co.uk/traintracks`).
  → `decisions/0005`, `PuzzleForge/TrainTracks/`.
- `approved` — **Runner tracks Edge only.** The owner's Edge opens each tab as its own window; stop
  preferring Chrome, stop treating a backgrounded tab as "browser closed", and keep the server
  running until the Edge window is closed. → `dev-tools/local-runner.mjs`.
- `proposed` — **Train Tracks A/B endpoints** as an option (the family has both a closed loop and an
  A→B path); open question in `decisions/0005`.
- `done` — **Rules updated:** R15 now sends notes/documentation commits to `main`; R12 names
  `decisions/` as the home for a puzzle's rules, clue policy, difficulty and generator approach;
  `README.md` lists `decisions/0005`.

## Owner direction (2026-10-09, fourth round) — after the Nurikabe re-check

- `approved` — **Mistake highlighting, shared and on by default.** Owner: the green/red marking from
  `puzzlemadness.co.uk/traintracks` is "an accessibility/settings feature I want in most puzzles as an
  optional toggle, so the puzzle shows if a user's input broke some rule". Implement once in
  `shared/`, **enabled by default in every puzzle**, with a settings toggle (can be turned off by
  default later). The puzzle reports what is wrong (which cells/lines break a rule); the shared layer
  owns the colours and drawing. → `shared/`, `interfaces/`, then each `*-board.js`.
- `approved` — **An unset cell must not look like an island.** In Nurikabe today both are "no fill",
  so a player cannot see a cell they have not clicked and can believe a board is finished when it is
  not — which is exactly the owner's 5×5 report (his board *is* the solution once every cell is set).
  Give the unset state its own visible look (and audit the other puzzles for the same trap). →
  `PuzzleForge/*/js/*-board.js`.
- `withdrawn` — the earlier claim that the owner's 5×5 Nurikabe board broke two rules; withdrawn and
  corrected in `history.md` (2026-10-09, third entry) and `state.md`.

## Phase 0 — landed (2026-10-09, Cloud_Cline_1)

- `done` — **Runner: Edge, and it survives a backgrounded tab.** `findBrowser()` now prefers Edge
  (Chrome only as a fallback, `CHROMIUM_PATH` still wins); the injected heartbeat reports
  `document.hidden`, and a hidden page gets a 15-minute backstop instead of the 45-second one a
  visible page gets, so alt-tabbing no longer looks like a closed browser. Verified by running two
  instances side by side (one reporting visible, one hidden, both then silent for 57 s): the visible
  one exited, the hidden one stayed alive. → `dev-tools/local-runner.mjs`.
- `done` — **Gate progress:** `check-all.mjs` prints `[k/n] <test> ...` as each job starts, so the
  runner's log pane shows movement; run on this baseline → 13 pass, 0 fail, 0 unrun. →
  `dev-tools/check-all.mjs`.
- `approved` — **Nurikabe is TWO states (white default, black = sea), not three.** The owner:
  "It is only 2 states, black or white"; reference `puzzle-nurikabe.com` — "Left click on a square to
  make it black. Right click to mark with dot." Our cycle unknown → island → sea invents a third
  state, and an unset cell looks exactly like an island, which is why a correct board never
  registered as solved. Left click = black, right click = dot mark, solved check runs on the binary
  colouring. → `PuzzleForge/Nurikabe/js/nurikabe-board.js`, `decisions/0005`.
- `done` — the earlier "an unset cell must not look like an island" item is superseded by the
  two-state item above (with two states there is no unset state to show).

## Phase 0 item 2 — landed: Generator QA (2026-10-09, Cloud_Cline_1)

- `done` — **`dev-tools/generator-qa.mjs` + a "Generator QA" button in the runner.** Sweeps every
  seeded puzzle and size (message → seed → board, the path a link takes) and reports: seeds that
  produced a puzzle, clue density, unique solution, the deduction-only check where the puzzle has
  one (`logicSolvable`), and generation time. It is not a gate — it measures quality — and the table
  lands in `TEST-RESULTS.md` with the build stamp. Verified end to end through the runner
  (`/__run?job=generator` → PASS → `TEST-RESULTS.md`). → `dev-tools/generator-qa.mjs`,
  `dev-tools/local-runner.mjs`, `PuzzleForge/index.html`.
- **First baseline (build `13.0.19logic`, 3 seeds per size, all unique):** Train Tracks publishes
  **3 of 12** row/column counts at 6×6, 4 of 16 at 8×8, 6 of 20 at 10×10 — the hide-clues defect in
  numbers. Futoshiki gives **5 clues (12%)** at 4×4, 9 (14%) at 5×5, 15 (16%) at 6×6, and its own
  deduction check passes **1/3 at 4×4 and 0/3 at 5×5 and 6×6** — it ships puzzles that need guessing.
  Binairo (the one generator with a hand-solvability filter) is 3/3 human at every size. Nurikabe
  gives 7 clue cells (19%) at 6×6, Akari 10×10 takes 2.2 s, Skyscrapers 8×8 3.5 s.
- `approved` — **Fill in the `human` column for the other puzzles** (Akari, Hashi, Skyscrapers,
  Nurikabe, Train Tracks have no deduction-only check). Binairo's `logicSolvable` is the pattern.

## Phase 1 item 4 — landed: the board is visible in every style (2026-10-09)

- `done` — **Board surface comes from the palette's `bg`, and a check keeps it visible.**
  `chromeFrom()` used `p.cells[0]` (a *cell* colour) as the board surface, so the board was drawn in
  something indistinguishable from the page in several styles. Measured: with the old
  source **6 of 20 palette/theme pairs were within 12 RGB steps of `--gdp-bg`** (paper 8, ocean 6,
  contrast 11, candy 5, mono 4 in light; neon 3 in dark); moving to `bg` left a different six
  (classic-dark 8, forest-dark 5, candy-light 7, mono-light 9, neon-dark 10, contrast-light 11). `surface` now comes from
  the palette's `bg`, and seven `bg` values were tuned so **all 20 pairs pass**.
  `dev-tools/check-palettes.mjs` is in the gate, so a new palette that draws no board fails the build.
  → `shared/gdp-palettes.js`, `dev-tools/check-palettes.mjs`, `dev-tools/check-all.mjs`,
  `interfaces/palette-chrome.md`.
- `proposed` — the tuned `bg` colours are a look choice the owner may want to adjust (high contrast is
  now a very light blue-grey rather than pure white, candy/mono/paper slightly deeper). The numbers
  are in `check-palettes.mjs` output.
- `done` — Pictogram/Nonogram already drew `palette.bg`, so they inherit the same tuned colours and
  their board background becomes visible in light styles too.

## Palette contract (2026-10-09) — judged by evidence, not taste

- `done` — **`decisions/0006` + the measured contract.** The palettes were invented by agents with no
  statement of what they must do; measured with the extended `dev-tools/check-palettes.mjs`, **37 of
  200 palette/role/theme pairs are below a usable contrast** (16 muted-ink, 5 thin-grid, 4 mark colour,
  4 cell-base-vs-board, 4 accent-ink, 2 thick-grid, 2 accent). The decision: one colour per role (today
  `excludedColor` is the mark, the hover highlight *and* the nonogram marked state), every palette
  defines every role, thresholds are enforced by the checker, and failing values are tuned by walking
  lightness — never redesigned by taste.
- `approved` — **The tuning pass, together with the new roles** (`given`, `markCandidate`, `error`,
  `satisfied`): add them, tune every palette to the contract, then flip `check-palettes.mjs` to
  `--strict` so the gate holds it. This is the same job as Phase 1 items 5 and 7. →
  `shared/gdp-palettes.js`, `interfaces/palette-chrome.md`, `decisions/0006`.
