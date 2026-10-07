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
