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
