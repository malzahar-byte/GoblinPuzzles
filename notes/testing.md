# Testing — what to run, when

Reference material. The rule it serves lives in `AGENTS.md` R5 (evidence) and R14 (done = the one
gate command).

## The gate

`node dev-tools/check-all.mjs` runs the fast checks below and prints a pass / fail / unrun table. Run
it when you finish, and report its result. A job that hits the per-job timeout is reported as
**unrun**, not failed — so state plainly which rows were unrun.

The two Pictogram sweeps (`test-image.mjs`, `test-roundtrip.mjs`) are **not run by the gate**: they
take minutes and cannot finish inside this sandbox's timeout.

Run them **only** when your change touches Pictogram's link format or its picture → puzzle pipeline:

```
node dev-tools/check-all.mjs --slow
```

Do **not** run them "just in case". They prove nothing about any other puzzle, they will report UNRUN,
and re-running them changes nothing. Most changes never touch Pictogram, so a permanently-unrun row
would only teach people to ignore the table. Their standing is recorded in `state.md`.

It covers logic, docs and wiring. It does **not** open a browser; UI behaviour still needs the
browser check below, run by hand.

## Kinds of check

1. **Puzzle Node tests** (`PuzzleForge/<Puzzle>/dev-tools/test-*.mjs`) — link encoding, solving,
   generation uniqueness. Fast, no browser, no network — except the two Pictogram sweeps, which are
   opt-in (see the gate above).
2. **`check-integration.mjs`** — a puzzle is wired into `shared/` correctly: no hardcoded settings
   keys, no broken relative imports, every page reaches `gdp-settings.js`/`gdp-theme.css`. Run it
   whenever you touch a puzzle's settings/theme wiring, add a puzzle, or move a folder.
3. **`check-docs.mjs`** — the `notes/` contract. Run it whenever you touch documentation.
4. **A real headless browser** (Playwright + headless Chromium — available in this sandbox, which
   also has internet) — the only way to check rendering, the settings dock, and real click/drag.
   Use it for any UI change; it is overkill for a pure logic change.
5. **`dev-tools/browser-checks/click-solve.mjs`** — the automatic "does each puzzle solve by
   clicking" gate. It opens one Test-Mode link per pointer puzzle, asks the page for a click plan
   through its `window.__gdpSolverClicks()` hook, dispatches real pointer events and checks the
   solved message appears. Faster to run than a hand pass and the right check after touching a
   `*-board.js` or a player page. Needs `PLAYWRIGHT_PATH` / `CHROMIUM_PATH` (see
   `browser-checks/README.md`); run it from the repo root:
   `node dev-tools/browser-checks/click-solve.mjs <repo-root-abs-path> [port]`.

## Which to run for a change

| You changed | Run |
|---|---|
| Nothing / reading code / answering a question | Nothing |
| Any documentation | `check-docs.mjs` |
| Settings/theme wiring, a folder move, a new puzzle | `check-integration.mjs` |
| Any puzzle's `*-logic.js` | that puzzle's `test-*.mjs` |
| `*-board.js`, `gdp-board.js`, page HTML/CSS, palette chrome, `gdp-fresh.js` | `click-solve.mjs` (solve → message), plus a hand pass for drag-paint, zoom, undo/redo, palette contrast and the `v13.0.0logic` label |
| `Pictogram/js/nonogram-model.js` | `Pictogram/dev-tools/test-nonogram-model.mjs` |
| Anything at all, when finishing | `check-all.mjs` |

## What has already been run on this baseline

A recorded result is a fact (`AGENTS.md` R4). If your change does not touch the code a check covers,
cite the line below instead of running it again. Add a line when you run something not here yet.

The v12 rows below are still valid where their code did not change. The v13_Logic rows are the
   runs made when Pictogram's Random mode moved to Nonogram, Hashi's hit area was fixed, the
   click-solve gate was added, and the build string became `13.0.0logic`.

| Check | Last run | Result |
|---|---|---|
| `check-docs.mjs` | 2026-10-07 (after the docs edits) | pass |
| `check-integration.mjs` | v12, 2026-10-06 | pass (65 files checked) |
| `Akari/test-akari.mjs` | v12 | pass (20 checks) |
| `Binairo/test-binairo.mjs` | v12 | pass |
| `Futoshiki/test-futoshiki.mjs` | v12 | pass (15 checks) |
| `Hashi/test-hashi.mjs` | v12 | pass (12 checks) |
| `Skyscrapers/test-skyscrapers.mjs` | v12 | pass (15 checks) |
| `Pictogram/test-secret.mjs` | v12 | pass |
| `Pictogram/test-image.mjs`, `test-roundtrip.mjs` | never in this sandbox | cannot finish here — do not re-run them to find out |
| Browser pass: six players render, settings dock opens, four pointer puzzles solve by clicks | v12, 2026-10-06 | pass |
| Hashi solve by real clicks | v12, 2026-10-06 | pass, except clicking exactly on a bridge (the recorded defect) |
| `check-all.mjs` | v13_Logic, 2026-10-08 | pass — 11 pass, 0 fail, 0 unrun (2 slow not run) |
| `Hashi/test-board-hit.mjs` | v13_Logic, 2026-10-08 | pass |
| `Pictogram/test-nonogram-model.mjs` | v13_Logic, 2026-10-08 | pass |
| `Nonogram/test-nonogram.mjs` | v13_Logic, 2026-10-08 | pass |
| `browser-checks/click-solve.mjs` — Pictogram, Hashi, Akari, Skyscrapers, Binairo, Futoshiki, Nonogram | v13_Logic, 2026-10-08 | pass — 7/7 solve by clicks, message shown, no page errors |
| Pictogram creator loads (picture-only, no mode radios); Nonogram creator builds a 6×6 link that round-trips and decrypts | v13_Logic, 2026-10-08 | pass, no page errors |

## Known sandbox limits

- Playwright + headless Chromium work; this sandbox has internet, so CDN Bootstrap loads. (An
  earlier sandbox had no internet and could not load it; re-confirm if the environment changes.)
- `dev-tools/browser-checks/smoke-player.mjs` is **stale** — it opens the old `/Pictogram/` path
  and throws. Do not rely on it; use `click-solve.mjs` instead.
- `click-solve.mjs` needs its Chromium shared libraries and fonts present; after a sandbox restore
  they can be missing. Set `PLAYWRIGHT_PATH` / `CHROMIUM_PATH` (see `browser-checks/README.md`),
  and if Chromium aborts on launch with a `libnss3.so`/font error, the libraries/fonts for this
  sandbox must be supplied again. It also needs a viewport tall enough for the board (the script
  sets 1600×1600) — a click outside the viewport is silently dropped.
- Both Pictogram sweeps **time out** in this sandbox: `test-roundtrip.mjs` produced no output at
  150 s; `test-image.mjs` prints progress and did not finish in 32 s. Neither is a product failure,
  and neither is run by the gate (`--slow` runs them). `test-secret.mjs` is fast and passes.
- What makes them slow is the uniqueness repair on noisy grids at the largest sizes: one 60×60 noisy
  case measured 23 s and ended unsolved (the sweep counts that as "skipped"), while the same size as
  a structured picture measured 17 ms.
- **Versioned URLs:** asset checks strip the `?v=` query. Current build string is
  `13.0.0logic` (bumped by owner direction for the v13_Logic round); normally only the combiner
  bumps it and re-points every `?v=` (`interfaces/assets-versioning.md`).
- No access to deploy, and the published site root 404s — the site is served from
  `…/GoblinPuzzles/PuzzleForge/`.
