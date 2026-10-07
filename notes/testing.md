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

## Which to run for a change

| You changed | Run |
|---|---|
| Nothing / reading code / answering a question | Nothing |
| Any documentation | `check-docs.mjs` |
| Settings/theme wiring, a folder move, a new puzzle | `check-integration.mjs` |
| Any puzzle's `*-logic.js` | that puzzle's `test-*.mjs` |
| `*-board.js`, `gdp-board.js`, page HTML/CSS, palette chrome, `gdp-fresh.js` | browser check: clicks, drag-paint, zoom, undo/redo, **solve → message + solved styling**, palette contrast, and the `v12.0.0` label on every page |
| `Pictogram/js/nonogram-model.js` | **no test yet** — a Node test is wanted (`backlog.md`) |
| Anything at all, when finishing | `check-all.mjs` |

## What has already been run on this baseline

A recorded result is a fact (`AGENTS.md` R4). If your change does not touch the code a check covers,
cite the line below instead of running it again. Add a line when you run something not here yet.

Since these runs the puzzle code has not changed — only `notes/` and `dev-tools/check-all.mjs`.

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

## Known sandbox limits

- Playwright + headless Chromium work; this sandbox has internet, so CDN Bootstrap loads. (An
  earlier sandbox had no internet and could not load it; re-confirm if the environment changes.)
- `dev-tools/browser-checks/smoke-player.mjs` is **stale** — it opens the old `/Pictogram/` path
  and throws. Do not rely on it; a fixed click-solve harness is `proposed` in `backlog.md`.
- Both Pictogram sweeps **time out** in this sandbox: `test-roundtrip.mjs` produced no output at
  150 s; `test-image.mjs` prints progress and did not finish in 32 s. Neither is a product failure,
  and neither is run by the gate (`--slow` runs them). `test-secret.mjs` is fast and passes.
- What makes them slow is the uniqueness repair on noisy grids at the largest sizes: one 60×60 noisy
  case measured 23 s and ended unsolved (the sweep counts that as "skipped"), while the same size as
  a structured picture measured 17 ms.
- **Versioned URLs:** asset checks strip the `?v=` query. Current build string is `12.0.0`; only
  the combiner bumps it and re-points every `?v=` (`interfaces/assets-versioning.md`).
- No access to deploy, and the published site root 404s — the site is served from
  `…/GoblinPuzzles/PuzzleForge/`.
