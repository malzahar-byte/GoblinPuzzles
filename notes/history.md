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
