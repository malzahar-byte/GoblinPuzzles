# History — append-only, newest at the bottom

One line heading, a few bullets of what/why. This file holds the CURRENT generation only. The
previous generation is archived at `archive/gen-11/` (and earlier at `archive/history-2026-10-05.md`).
Append only; a correction is a new entry, never an edit.

## 2026-10-06 — Cloud_1 — v12: rebuild notes/rules for parallel agent hand-out

- Rebuilt `notes/` as a frozen baseline for handing one version to several agents: new `AGENTS.md`
  (invariants kept; rules rebuilt with the version-frozen and baseline-frozen rules; delivery +
  return format), thin `README.md` index, and `interfaces/` + `tracks/` as cap-exempt subfolders.
- Retired the DeepSeek-only delivery rule (old R14) and the hardcoded owner handle; capability is
  now recorded per session, not per agent family.
- Added `dev-tools/check-all.mjs` as the single gate, and archived the old generation to
  `archive/gen-11/`.
- Bumped `GDP_BUILD` and every `?v=` from `11.0.1` to `12.0.0`.
- Verified in a real browser (Playwright + headless Chromium): all six players render and open
  settings; Akari, Skyscrapers, Binairo and Futoshiki solve by clicks and reveal the message; the
  Forge lists 11 puzzles / 9 links. Found and recorded two defects: Hashi's click-on-bridge hit
  area, and the stale `smoke-player.mjs`. **Not run:** Pictogram roundtrip (times out, documented).

## 2026-10-07 — Cloud_1 — the gate stops running the Pictogram sweeps every time

- `check-all.mjs` no longer runs `Pictogram/test-image.mjs` or `Pictogram/test-roundtrip.mjs` in the
  default set. Both exceed the 30 s per-job timeout on every run, so the gate carried two permanent
  UNRUN rows and spent ~60 s producing them — noise, not signal. `--slow` still runs them.
- Their standing now lives in `state.md`/`testing.md` (measured: `test-roundtrip` gives no output at
  150 s; `test-image` runs past 32 s; the cost is the uniqueness repair on noisy grids at the
  largest sizes — 23 s for one 60×60 noisy case vs 17 ms for the same size structured).
- Signer of the 2026-10-06 entry above changed from `Buffy` to `Cloud_1` at the owner's request; no
  other part of that entry was altered.

## 2026-10-07 — Cloud_1 — R15: commit every finished change

- New rule after a session where hours of approved edits sat uncommitted and one broad revert erased
  them all: every agent commits after each finished, verified change — `git add -A && git commit` —
  so a mistake costs minutes, not hours.
- Track agents without GitHub access commit locally (plain folder: `git init` once); agents with
  push access also `git push` after every commit, so save points do not live on one machine.
- Undo is a correcting commit or `git revert`; never `reset --hard`, rebase or force-push. Commits
  change no files, so the version (R7) and baseline contracts (R8) stay frozen.

## 2026-10-08 — Cloud_Logic_1 — v13_Logic: Nonogram split, Hashi bridge fix, click-solve gate

- **Pictogram is picture-only.** The "Random" mode left Pictogram's creator (the mode radios are
  gone) and became its own puzzle, `PuzzleForge/Nonogram/`: `index.html` + `js/player.js` (auto-builds
  a 10×10 when no `id` is given), `creator.html` + `js/creator.js` (rows/cols 4–25 + secret → link),
  `js/util/settings.js` (own key `gdp-nonogram-settings`, progress prefix `gdp-nonogram:`). Nothing
  is duplicated: `js/nonogram-logic.js` re-exports Pictogram's model/generator/codec and
  `js/nonogram-board.js` re-exports Pictogram's adapter, so the link format stays Pictogram-v1 and a
  random-nonogram link opens in either player.
- **Hashi click-on-bridge fixed.** `Hashi/js/board.js` `hitTest` now measures the distance from the
  click point to each edge segment instead of reading `ev.target` — the old code lost any click that
  landed on the visible bridge line drawn over the transparent hit line. New Node test
  `Hashi/dev-tools/test-board-hit.mjs`.
- **"Does each puzzle solve by clicking" gate added:** `dev-tools/browser-checks/click-solve.mjs`
  (real headless Chromium, real pointer events) with a per-puzzle `window.__gdpSolverClicks()` hook.
  Pictogram, Hashi, Akari, Skyscrapers, Binairo, Futoshiki and Nonogram all pass.
- **Missing tests added:** `Pictogram/dev-tools/test-nonogram-model.mjs` (the model test the backlog
  asked for) and `Nonogram/dev-tools/test-nonogram.mjs`.
- **Rules review:** all six puzzles compared with the published rules. No rule is broken; the
  differences (Pictogram random density 40–80%, Futoshiki's all-signs generator, Hashi's silent
  illegal-click, the cosmetic "0" hint) are recorded in `backlog.md`.
- **Unreleased-puzzle research:** KenKen, Nurikabe, Slitherlink, Train Tracks, Crossword and Chained
  mode — best implementation and pitfalls — recorded in `backlog.md`.
- **Forge:** `index.html` gained a Nonogram entry and one Test-Mode link per playable puzzle.
- **Version:** `GDP_BUILD` and every `?v=` bumped `12.0.0` → `13.0.0logic`, by owner direction for
  this round (normally the combiner's job — see the two freezing rules in `AGENTS.md`).
- RAN: `node dev-tools/check-all.mjs` → 11 pass, 0 fail, 0 unrun (2 slow not run) —
  `dev-tools/browser-checks/click-solve.mjs` → 7/7 puzzles solve by clicking, no page errors —
  the Nonogram creator builds a 6×6 link that round-trips and decrypts. UNRUN: the two Pictogram
  sweeps (`test-image`, `test-roundtrip`), which cannot finish in this sandbox.

## 2026-10-08 — Cloud_Logic_1 — session recovery: local runner verified, TrainTracks WIP saved, R15 extended

- Pulled the owner's local test tool (`0657e23`): `Run-Local.cmd` + `dev-tools/local-runner.mjs` +
  `package.json` + `.gitignore`. Verified here by running the runner headless: it serves the Forge on
  127.0.0.1 with the heartbeat injection, `/__status` answers, the **Quick** job ran the real gate
  (12 pass / 0 fail / 0 unrun) and wrote `TEST-RESULTS.md` exactly as designed. The Windows-only
  parts (the `.cmd` double-click flow, driving the installed Chrome, the self-close on browser
  close) cannot be run in this sandbox and are unverified here.
- The 2026-10-08 work session ended mid-Train-Tracks with its logic module untracked. It is now
  committed and pushed as `139f84e` (WIP): the loop builder works, but the solver reports 0
  solutions on a valid loop, so `generate()` returns null; `__ttDbg2` debug hooks are still in the
  file. No board/player/creator/test/Forge entry yet; Crossword not started.
- **R15 extended** (owner request after the second lost session): long jobs must commit and push save
  points *while in flight*, not only when finished, and `state.md` carries a short **In flight**
  block updated at every save point (`notes/AGENTS.md` R15).
- Correction to the reviewer's report: Pictogram and Nonogram **do** run on the shared board shell
  (`shared/gdp-board.js` `mountBoard` + `createNonogramAdapter`) and on the shared palettes
  (`BOARD_STYLES` re-exports the shared `PALETTES`). What they still hand-wire is the **settings
  panel**: both pages predate `shared/gdp-settings-panel.js`, keep the old markup and the
  `boardSelect` id, and lack the "Show grid" toggle. Finishing that migration is on the list.

## 2026-10-08 — Cloud_Logic_1 — rules round: R16/R17, save points must reach the remote, docs catch-up

- Owner review after two sessions ended off-script. New **R16 (answer first, tools second)**: when the
  owner asks a question or for a report, answer from `notes/`, the reasoning already in the
  conversation and read-only inspection — no tests, installs or edits until the answer is delivered.
  New **R17 (test ownership)**: the agent runs the fast Node gate and the one test covering a touched
  logic file; every slow, browser or visual check is the owner's, through `Run-Local.cmd` (Quick /
  Full / Browser jobs). Never reinstall a browser or Chromium libraries to run a check.
- **R15 amended:** a commit is not a save point until it is on the remote (`cloud_git push`), because
  cloud sessions are rebuilt from GitHub — a local-only commit dies with the sandbox. **R2/R6:**
  research and reasoning go to `history.md`/`backlog.md`; a new top-level document is never the
  answer. **R4 broadened:** run nothing by default and nothing "just in case". **R6 relaxed:** a new
  puzzle folder copied from `shared/puzzle-template/` is the normal build flow.
- **Docs catch-up for the 2026-10-08 round** (the previous session's facts were not written down):
  `state.md` gained the second-round source note, the fixed reload/cropped-open defects, the shared
  settings panel (`shared/gdp-settings-panel.js`), the fairer generators, Skyscrapers' solve ticks, a
  Nurikabe section, the owner's local runner under `dev-tools/`, and 8 Test-Mode links;
  `testing.md` gained **Who runs what (R17)**, the runner's jobs, and the new recorded rows
  (click-solve 8/8 incl. Nurikabe; `Nurikabe/test-nurikabe.mjs`; the runner's Quick job);
  `backlog.md` marks Nurikabe done, Train Tracks doing, Crossword blocked on its lock question, and
  carries the owner-review round section.
- RAN: `node dev-tools/check-docs.mjs` → pass. Pushed to `main` (`620f310` rules, this commit docs).

## 2026-10-09 — Cloud_Logic — owner corrections: no backwards compatibility, per-commit build steps

- Owner correction, third attempt: **old links are not a distribution channel.** Invariant 2 is now
  "only the current version must work" — no legacy decoders, no "old links still decode" paths, no
  compatibility work unless the owner asks. The Akari v2 commit's v1 decode branch is removed in the
  next commit; Pictogram's dead legacy branches are cleaned when its settings panel is migrated.
- **R7 rewritten — every commit steps the version.** `dev-tools/bump-build.mjs` bumps
  `GDP_BUILD` one patch step and re-points every `?v=` (137 URLs, 36 files) in one pass; save
  points step it too, and only the owner calls a big version. The first stepped build is
  `13.0.1logic`.
- **Invariant 1 now includes message determinism:** same message + same options ⇒ same puzzle and
  same link, and `Math.random` is never part of generation. Akari is the first converted puzzle.
- **R16/R17 tightened for the owner:** R16 says answers must be read, reasoned and synthesized in
  the agent's own words, never a verbatim note; R17 says agent tests must be few, easy,
  deterministic and fail only for a real defect, with hard/slow/browser checks living in the
  owner's runner.
- **Runner report:** `TEST-RESULTS.md` now opens with the build it ran against (and sections keep
  their per-run `build …`), so a copied-back result always says which version produced it.
- RAN: `node dev-tools/check-all.mjs` → 12 pass, 0 fail, 0 unrun (2 slow Pictogram sweeps not run).
  Pushed to `main`.

## 2026-10-09 — Cloud_Logic — message-seeded links everywhere; Train Tracks shipped

- Owner direction: "same message ⇒ same puzzle" is a theme of the project, and old link versions
  are never a reason to keep code alive. All six board-storing puzzles moved to **link version 2**
  in six small commits: Akari (13.0.3logic), Hashi (13.0.4), Skyscrapers (13.0.5), Binairo
  (13.0.6), Futoshiki (13.0.7), Nurikabe (13.0.8). Each stores a message-derived seed, rebuilds
  its board inside `parseLink`, seeds its creator from the message (`encodeFromMessage`), deletes
  its v1 decoder *and* its board-storing encoder, and got a regenerated Forge Test-Mode link; the
  old v1 ids are asserted rejected in the tests. Two determinism fixes fell out of it: Futoshiki's
  generator dedupe cap is now a solve count instead of wall-clock time (a seed must always rebuild
  the same board), and for Train Tracks the same. Binairo's hand-solvability filter is unchanged.
- **Train Tracks shipped** (13.0.9, 13.0.10): the WIP solver was debugged. Both bugs were in the
  builder, not the search — (1) `randomLoop` inserted an "ear" cell adjacent to both ends of a loop
  edge, which no grid cell can be (adjacent cells share no common neighbour), so every generated
  loop was broken; the loop now grows by pushing one edge outward; (2) `piecesFromLoop` assumed
  every step went east or south and swapped sides on right-to-left/upward steps. Then the puzzle
  was finished end to end: seeded link v2 from the start, shared-shell board adapter (click cycle,
  locked givens, margin counts), player, creator, settings util, Node test, Forge entry and a
  click-solve entry.
- RAN: `node dev-tools/check-all.mjs` → 13 pass, 0 fail, 0 unrun (2 slow Pictogram sweeps not
  run); `node dev-tools/check-integration.mjs` → pass, 91 files. Pushed to `main`.

## 2026-10-09 — Cloud_Logic — one settings panel on every page; runner build stamp

- The last hand-wired settings panels are gone: **Pictogram, Nonogram and Hashi now call
  `shared/gdp-settings-panel.js`** like the other six player pages. Pictogram/Nonogram gained the
  missing "Show grid" toggle (the adapter's new `getGrid` hides the thin 1px cell lines, keeping
  the 5-cell separators and the frame) and a `grid: true` default; Hashi's background toggle moved
  from its own `board: 'panel'|'none'` pair to the standard `surface` flag, and its
  `clearProgressBtn` handler is the panel's `clearProgress` callback now.
- Also this round: `TEST-RESULTS.md` names the build it ran against (header + per-section), and
  `dev-tools/bump-build.mjs` steps `GDP_BUILD` and every `?v=` on each commit.
- RAN: `node dev-tools/check-all.mjs` → 13 pass, 0 fail, 0 unrun. Pushed to `main`.

## 2026-10-09 — Cloud_Cline_1 — owner bug-report round triaged read-only; no product code changed

- Read `notes/` in full (README, AGENTS, state, testing, backlog, history, `interfaces/`) plus the
  code the owner's 14-point bug report touches. No test was run and no product code was changed
  (R16/R4); the only non-notes edit is the R7 build step. The findings are filed one line each in
  `backlog.md` under "Owner bug report (2026-10-09)".
- Root causes found by reading, not by testing: **the board surface is the palette's first *cell*
  colour.** `chromeFrom()` in `shared/gdp-palettes.js` builds `surface` from `p.cells[0]`, and no
  file anywhere reads the palette's `bg`; in light theme Paper/Mono/Ocean/Candy land within a few
  RGB points of `--gdp-bg` (dark theme: Neon), so the board fill looks like the page — and because
  Nurikabe draws an island as "no fill", its first click looks like nothing happened.
- **Train Tracks' sparse look is the generator, not the renderer.** Parsed the Forge 6×6 example:
  `rowClue` is all hidden, `colClue` shows a single `2`, and 31 of 36 cells are free — the puzzle is
  unique-solvable (solve count 1), but it reads as unfinished. The margin-drawing code is fine.
- **Runner:** the 5 s page heartbeat is throttled to ~1/min once Chrome hides a tab for minutes, so
  the 20 s idle grace shuts the server down on a long tab-away; and `findChrome()` only finds Chrome
  in the standard install spots, otherwise Edge.
- **Two more, both small:** Nurikabe's "Create your own puzzle" points at its own `creator.html`
  where every other page points at `../index.html`; the Test-Mode order in `PuzzleForge/index.html`
  lists Nurikabe after Futoshiki while the puzzle grid lists it before Skyscrapers.
- **Confirmed by the owner's pasted results, not re-run:** gate 13 pass / 0 fail / 0 unrun (2 slow
  not run); Pictogram `test-image.mjs` 1 failure in the `photo` preset group; `test-roundtrip.mjs`
  187/187 v3 and 3/3 legacy v2; Browser job 9 puzzles solved by clicks, no page errors.
- **Refuted by inspection:** Nurikabe's Forge example has 13 clues and **exactly one** solution
  (solve limit 3 → 1), so the "multiple solutions" suspicion does not hold for that board; the
  sparse Futoshiki example (5 givens, 3 signs) is likewise unique.

## 2026-10-09 — Cloud_Cline_1 — correction to the entry above (R9)

- The entry above says "no file anywhere reads the palette's `bg`". That is wrong: Pictogram's
  `js/nonogram-board.js` (`render()`) draws `palette.bg` / `palette.solvedBg` as its backdrop. The
  accurate fact is that the board background has **two** sources — Pictogram/Nonogram use
  `palette.bg`, while the other eight puzzles use `resolveChrome().surface`, which `chromeFrom()`
  builds from `p.cells[0]`. The conclusion is unchanged (that surface is a cell colour, so it is
  near-invisible in several styles), and `backlog.md` was corrected in place in the same commit.

## 2026-10-09 — Cloud_Cline_1 — owner answers, round 2: directives recorded; notes on `main`

- **Owner directive: documentation save points must reach `main`,** not sit on a branch — the next
  agent has to be able to pick the notes up if this session breaks. The four triage commits were
  fast-forwarded from `cline/nk93c2s0` into `main` this round, and docs go to `main` from now on.
  (R15 already says push after every commit; whether `AGENTS.md` needs a sentence saying "docs-only
  commit → `main`" is a question for the owner.)
- The owner's answers are recorded as `approved` / `blocked` / `proposed` lines in `backlog.md`, new
  section "Owner direction (2026-10-09, second round)": styles are global (surface colour, a
  pre-filled "given" tint, and cell marks all belong to the shared layer); **Train Tracks must always
  show every row and column count** — the hide-a-clue policy is a defect, not a difficulty setting;
  **Futoshiki must target a clue density**, not a minimal clue set; **a generator's real bar is
  human-solvability** ("technically solvable mathematically and being designed and solvable for
  humans are different things"); "Create your own puzzle" always targets the Forge; Test Mode goes
  alphabetical with greyed placeholders so the order cannot drift; Hashi is to be migrated to the
  common shape (seed determinism, shared secret lock, shared chrome, standard page).
- Deferred by the owner: the Pictogram `test-image.mjs` `photo` failure waits until Pictogram is the
  puzzle being worked on, and the Pictogram/Nonogram codec-and-renderer divergence is to be
  *researched* in its own later step, not changed now.
- Standard rules were read rather than guessed, because the owner asked why this keeps getting lost:
  Simon Tatham's **Tracks** prints every row and column clue and offers right-click "no track here"
  marks plus a "this square has track" indicator; **Futoshiki** (Wikipedia) is a Latin square with
  inequality signs "between some of the squares" and optional given digits; **Nurikabe's** rules and
  its expectation of a unique solution match the page's own text. Conclusion recorded: uniqueness is
  necessary but not sufficient, and no generator currently checks human-solvability.
- The owner offered reference sites/implementations. Answer: not needed for the rules themselves;
  worth having for the *look* (which sides carry the Train Tracks counts, whether the loop variant
  has A/B endpoints) and for Futoshiki clue density — and worth asking whether any earlier round's
  generator research still exists somewhere, since this sandbox is a shallow clone and cannot see it.

## 2026-10-09 — Cloud_Cline_1 — owner answers, round 3: Nurikabe board verified, rules recorded

- **The owner's Nurikabe board is genuinely wrong, and the app was right to stay unsolved.** Evidence
  (read-only, the puzzle's own rule check): the 5×5 link `MSEoZ6zd7wlxHIoIiwg0ofu` has exactly one
  solution and the generator's solution grows both "2" islands downward into row 3 —
  `I S I S I / S S S S S / S I S I S / S I S I S / S S S S S`. The owner's board leaves row 3 all
  sea, so the two "2" islands are one cell each (size rule) and rows 3–4 make 2×2 sea blocks
  (no-2×2 rule). **The real defect is the missing feedback:** a filled board that breaks a rule
  never says *which* rule it breaks, so it reads as a broken app instead of a wrong answer.
- **The owner's reference points** are recorded in the new
  `decisions/0005-puzzle-rules-and-clue-policy.md`: `puzzlemadness.co.uk/traintracks` for the Train
  Tracks look (closed loop, every row/column count shown) and `futoshiki.com` for Futoshiki
  **difficulty tiers (Trivial / Easy / Tricky / Extreme)** — the owner likes that method, so clue
  density is a per-difficulty target, never a minimal set.
- **Rule changes the owner approved this round:** R15 now says notes/documentation commits go to
  `main`, not a side branch (a local-only doc is not a save point for the next session); R12 now says
  a puzzle's standard rules, clue policy, difficulty and generator approach belong in a `decisions/`
  note, which is cap-exempt; `README.md` lists `0005`.
- **New owner directive, the reason this note exists:** each agent runs in its own cloud sandbox and
  everything it reasons out dies with the session — so *logic* has to be committed, and generator
  quality has to be measurable on the owner's pc. Concrete shape: a Generator-QA job in
  `dev-tools/local-runner.mjs` that sweeps puzzles/sizes, prints clue density, deduction-solvability
  and timing, and writes it into `TEST-RESULTS.md`.
- **Runner:** drop the Chrome preference entirely — the owner's Edge opens every tab as its own
  window, so the runner should simply keep running until the Edge window is closed, and never treat
  a backgrounded/alt-tabbed tab as "browser gone".
- **Answer to the owner's doc question:** the notes went only into `notes/` — three files
  (`history.md`, `backlog.md`, `state.md`) plus this round's `AGENTS.md`, `README.md` and
  `decisions/0005`. Everything else in those commits is the R7 version step re-pointing `?v=`
  strings, which is why the diffs look like they touch 41 unrelated files.

## 2026-10-09 — Cloud_Cline_1 — correction (R9): the owner's Nurikabe board is the solution

- **I was wrong two entries up.** I read the owner's screenshot as leaving row 3 all sea and told him
  his board broke two rules. It does not. With the two row-3 cells set (islands at `(3,1)` and
  `(3,3)`), the board **is the generator's unique solution**: re-checked read-only with the puzzle's
  own rule check — `isSolved` → true, and the message decrypts to "Well done!". My "breaks the island
  size rule and the 2×2 rule" claim is withdrawn; it came from misreading the image, not from the code.
- **So the silence is the real bug.** Nothing else in the pipeline explains it: the shared shell fires
  `onSolved` the moment `adapter.isSolved()` first returns true, and the page then decrypts and shows
  the message. The one state that fits the screenshot is **a cell that was never clicked**: an unset
  cell and an island cell are drawn identically (both are just the board surface), so the player can
  believe the board is finished while cells are still unset — and with every cell unset the puzzle
  can never complete. That also explains the older "first click does nothing" report: click one turns
  unset → island, which paints nothing.
- **The rules themselves are not hallucinated.** The implementation matches standard Nurikabe
  (numbered cell = island of that size, one clue per island, islands never touch orthogonally, one
  connected sea with no 2×2 block; a unique solution is expected) and the page's own rules text says
  the same. The puzzle in question has exactly one solution and the check accepts it when filled.
- **Owner's two clarifications this round:** (1) the green/red "satisfied / broken" marking he pointed
  at in `puzzlemadness.co.uk/traintracks` is wanted as a **shared accessibility feature, on by default
  in every puzzle, with a settings toggle** — recorded with its design in `decisions/0005`; (2)
  "the game detects a correct solution" is not a new feature, it is the existing solved state plus the
  secret message.

## 2026-10-09 — Cloud_Cline_1 — Phase 0: runner fixed (Edge + backgrounded tabs), gate progress

- **Nurikabe correction #2 (owner):** it is a **two-state** puzzle — white (island) or black (sea),
  with white as the default — so the player only ever marks black. Reference: `puzzle-nurikabe.com`,
  "Left click on a square to make it black. Right click to mark with dot." Our board cycles
  unknown → island → sea, which invents a third state and draws an unset cell exactly like an island
  — that is why the owner's correct 5×5 board never registered as solved, and it is the same cause as
  his old "first click does nothing". Recorded in `decisions/0005` and queued as a `proposed` fix.
- **Runner reworked (`dev-tools/local-runner.mjs`).** `findBrowser()` prefers **Edge** (Chrome only as
  a fallback; `CHROMIUM_PATH` still wins) and the injected heartbeat now reports
  `document.hidden`, so the server can tell "backgrounded" from "closed": a hidden page gets a
  15-minute backstop, a visible one 45 seconds. Verified by running two instances side by side, one
  reporting visible and one hidden, both then silent for 57 s — the visible one exited with
  "Browser stopped responding", the hidden one kept serving. This is the owner's report ("if I tab
  away for a long time it stops") closed with evidence rather than a guess.
- **Gate progress (`dev-tools/check-all.mjs`):** it now prints `[k/n] <test> ...` as each job starts,
  so the owner's log pane shows movement instead of one silent minute. RAN: `node dev-tools/check-all.mjs`
  on this tree → **13 pass, 0 fail, 0 unrun** (2 slow Pictogram sweeps not run), progress lines shown.
  The runner itself was smoke-tested (`--no-open`, `/__status`, heartbeat injection, both
  `/__ping` states).

## 2026-10-09 — Cloud_Cline_1 — Phase 0 item 2: Generator QA, and its first numbers

- **`dev-tools/generator-qa.mjs` + a "Generator QA" button in the runner.** It sweeps each seeded
  puzzle and size through the same path a link takes (message → seed → board) and reports: seeds that
  produced a puzzle, clue density, unique solutions, the deduction-only check where a puzzle has one,
  and generation time. It is a measurement job, not a gate, and the table lands in
  `TEST-RESULTS.md` with the build stamp — the owner's point that measurements must survive a session.
  Verified end to end through the runner: `/__run?job=generator` → PASS (exit 0) → written to
  `TEST-RESULTS.md`.
- **First baseline (build `13.0.19logic`, 3 seeds per size; every case unique):**
  - Train Tracks publishes **3 of 12** row/column counts at 6×6, 4/16 at 8×8, 6/20 at 10×10 — the
    hide-the-clues defect, in numbers.
  - Futoshiki gives **5 clues (12%)** at 4×4, 9 (14%) at 5×5, 15 (16%) at 6×6, and its own deduction
    check passes **1/3 at 4×4, 0/3 at 5×5 and 0/3 at 6×6** — it ships puzzles that need guessing.
  - Binairo, the one generator with a hand-solvability filter, is **3/3 human** at 6, 8 and 10.
  - Nurikabe 6×6 gives 7 clue cells (19%); Akari 10×10 takes 2.2 s and Skyscrapers 8×8 3.5 s to
    generate — the slowest generators are now visible too.
- **Process lesson recorded in `decisions/0005`:** ask the owner for a reference link before reading
  the rules. Two rounds went into re-deriving Nurikabe until `puzzle-nurikabe.com` settled it (two
  states, not three), and Train Tracks' expected look came from his link. A rules text does not carry
  the interaction model or the expected look.
