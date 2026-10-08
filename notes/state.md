# Current state

What exists right now, per component, with known limits. This is the only place current facts
live; everything else points here. **Stable interfaces are not restated here — they live in
`interfaces/`.**

Source note: written 2026-10-06 for the v12 rebuild. The code is v11.0.1's; v12 rebuilt `notes/`
and bumped `GDP_BUILD` to `12.0.0`. A real browser pass on 2026-10-06 (Playwright + headless
Chromium, network available) confirmed: the Forge lists 11 puzzles / 9 links, all live; all six
player pages render with no page errors and open the settings dock; and Akari, Skyscrapers,
Binairo and Futoshiki solve by clicking their solution and reveal the correct message. Pictogram's
roundtrip Node test times out in this sandbox (no assertion failure produced).

Source note for v13_Logic (Cloud_Logic_1, 2026-10-08): Pictogram's "Random" mode became the new
Nonogram puzzle (below); the Hashi click-on-bridge defect was fixed; a headless-browser click-solve
gate now covers all seven pointer puzzles (incl. Pictogram); and `GDP_BUILD` / every `?v=` is `13.0.0logic`. The
per-puzzle facts below are updated where they changed.

## In flight (save-point state — updated at every commit, cleared when the work lands)

- **Train Tracks** — `PuzzleForge/TrainTracks/js/traintracks-logic.js` only (WIP commit `139f84e`).
  The loop builder works; **the solver reports 0 solutions on a valid board, so `generate()`
  returns null** — mid-debug, `__ttDbg2` hooks still in the file. No board/player/creator/test/Forge
  entry. Pick up at `solve()`.
- **Crossword** — not started (no folder); research recorded in `backlog.md`.
- **Docs for the 2026-10-08 round** — `testing.md`/`history.md`/`backlog.md` and the per-puzzle
  sections below do not yet cover the reload/zoom fix, the shared settings panel, the fairer
  generators or Nurikabe.
- **Pictogram / Nonogram settings panel** — both still hand-wire the panel in `player.js` (old
  markup, `boardSelect` id, no "Show grid"). They are on the shared board shell and shared palettes;
  only this migration is missing. See `backlog.md`.

## shared/ — generic layer, reused by every puzzle

Interfaces for these live in `interfaces/`: board adapter, link codec, palette chrome,
settings/progress, secret lock, asset versioning.

- `gdp-settings.js` — JSON-in-localStorage settings store; theme helpers; Auto → light → dark
  cycling button. Knows nothing about any puzzle.
- `gdp-palettes.js` — 10 named themes; generic "confirmed" / "excluded" cell states;
  `resolvePalette()`, `buildCellFill()`, `resolveChrome()` (board chrome; see
  `interfaces/palette-chrome.md`).
- `gdp-theme.css` — page shell, panels, toolbar, offcanvas panel look, (i) info buttons, 2-column
  and wide-page helpers, `--gdp-grid`, the `.gdp-settings-dock` (tab + panel as ONE fixed
  element), and `.gdp-fresh-btn`.
- `gdp-fresh.js` — `GDP_BUILD`, `showBuildVersion()`, `setupFreshButton()`. The Fresh button is a
  large, accented control on every page, including creator pages.
- `gdp-secret.js` — shared XOR secret lock; see `interfaces/secret-lock.md`.
- `gdp-ui.js` — `setupSettingsDock(dock)` (Escape/outside-click close); no Bootstrap needed.
- `gdp-bitseq.js`, `gdp-math-utils.js` — bit-level encode/decode, character set, seeded shuffle.
- `gdp-board.js` + `gdp-board.css` — the shared SVG board shell; see
  `interfaces/board-adapter.md`. The board box is the only scroller.
- `puzzle-template/` — copyable `settings.js`, pre-paint snippet, README.
- **Limit:** the shell does not yet provide timer, saved progress, solved-notice or pop-out —
  those still live in each puzzle's page. See `backlog.md`.

## PuzzleForge/Pictogram/ — live, most complete

- Picture → nonogram pipeline: upload/paste/drag-drop, crop, fit-to-subject, 3 conversion presets,
  Sobel edge detection, background Web Worker solver that forces a single logic-solvable solution.
- Player: 60×60 max, compressed versioned links (v1/v2/v3), 10 themes, 5 board styles, X/dot
  marks, auto-fit zoom, undo/redo, save point, timer, saved progress, settings panel, secret
  message reveal.

- Rendering is the shared SVG board shell. `js/player.js` is wire-up; the model is
  `js/nonogram-model.js` (pure, no DOM); the view is `js/nonogram-board.js`. **p5 is removed.**
- **Picture-only since v13_Logic:** the "Random" mode was split out into `PuzzleForge/Nonogram/`
  (below); `creator.html` no longer offers a Random choice.
- **Limits:** wheel zoom at 60×60 ~30 fps under software rendering (real GPU unmeasured).
  `dev-tools/test-roundtrip.mjs` times out in this sandbox and is not run by the gate
  (`--slow` runs it). `nonogram-model.js` now has a Node test (`dev-tools/test-nonogram-model.mjs`).

## PuzzleForge/Nonogram/ — new in v13_Logic (split from Pictogram's Random mode)

- Random seed-based nonograms with a secret message; same SVG board, same message lock, same link
  format as Pictogram. Nothing is copied: `js/nonogram-logic.js` re-exports Pictogram's
  `nonogram-model.js`, `util/nono-utils.js` and `util/id-parser.js` by relative path, and
  `js/nonogram-board.js` re-exports Pictogram's adapter — so rules, look and link format cannot
  drift apart.
- `index.html` + `js/player.js` (auto-generates a 10×10 when no `id` is given), `creator.html` +
  `js/creator.js` (rows/cols 4–25 + secret → link), `js/util/settings.js` (own key
  `gdp-nonogram-settings`, progress prefix `gdp-nonogram:`), and `dev-tools/test-nonogram.mjs`.
- The link format is Pictogram's seed-based v1, so a random-nonogram link opens in either player.
- **Verified 2026-10-08:** renders, solves by clicking and reveals the message; the creator builds a
  working link (a 6×6 test id round-trips and decrypts to its secret).

## PuzzleForge/Hashi/ — draft, on the shared shell

- Random generation, 5–14 grid, plain-text secret. Board SVG from `js/board.js`, mounted by the
  shared shell. Board chrome from `resolveChrome()`.
- **Click-on-bridge fixed (v13_Logic, 2026-10-08):** `hitTest` now hit-tests by position (distance
  from the click point to each edge segment) instead of `ev.target.closest('[data-i]')` — the old
  code lost any click that landed on the visible bridge line sitting over the transparent hit line.
  Node test `dev-tools/test-board-hit.mjs` covers it, and the browser click-solve gate proves it
  end to end by clicking exact bridge midpoints.
- Node test `dev-tools/test-hashi.mjs` covers `hashi-logic.js`.

## PuzzleForge/Akari/ — built (reference "puzzle kit")

- `js/akari-logic.js` (walls + clues, lamp/mark states, unique generator + solver, link codec,
  secret), `js/akari-board.js` (shell adapter, position-based hit-test), `js/player.js` inlined in
  `index.html`, `creator.html`, `js/util/settings.js`, `dev-tools/test-akari.mjs`.
- Verified 2026-10-06: renders, settings dock opens, and solves by clicks → message revealed.

## PuzzleForge/Skyscrapers/, Binairo/, Futoshiki/ — live on the shared shell

- Each has `js/<name>-logic.js` (pure model, move rules, solved check, unique generator, link
  codec), `dev-tools/test-<name>.mjs`, a player and creator, all on `resolveChrome()` chrome and
  position-based hit-testing.
- Size caps: Skyscrapers 4–9, Futoshiki 4–8, Binairo even 6–12.
- **Verified 2026-10-06:** the three player pages render, open settings, and solve by clicks →
  message revealed. (Earlier "shipped broken / unverified" notes are superseded.)
- **KenKen** specced, not built.

## PuzzleForge/ — landing page

`index.html` lists every puzzle with status, links the live and in-progress ones, and has a Test
Mode section with a ready example for every playable puzzle (Pictogram, Nonogram, Hashi, Akari,
Skyscrapers, Binairo, Futoshiki). 12 boxes, 7 links, all resolving (v13_Logic, 2026-10-08). **Site root caveat:** the published root `…/GoblinPuzzles/` 404s; the site is served
from `…/GoblinPuzzles/PuzzleForge/`.

## dev-tools/

- `check-all.mjs` — the one gate command: runs `check-docs`, `check-integration` and the fast puzzle
  Node tests, prints a pass/fail/unrun table, exits non-zero on failure. `--slow` adds the two
  multi-minute Pictogram sweeps, which are not run by default.
- `check-integration.mjs` — code wiring: broken relative imports, a settings key defined twice or
  hardcoded outside its `settings.js`, pages not reaching `gdp-settings.js`/`gdp-theme.css`.
- `check-docs.mjs` — the notes contract: required docs, the top-level cap, `interfaces/` and
  `tracks/` present, decision references and local links resolve.
- `browser-checks/` — `static-server.mjs`, `p5stub.js`, `smoke-player.mjs`, `README.md`, the
  standalone SVG benchmark, and **`click-solve.mjs`** — the v13 click-solve gate: it opens one
  Test-Mode link per pointer puzzle, asks the page for a click plan via its
  `window.__gdpSolverClicks()` hook, dispatches real pointer events and checks the solved message
  appears. It needs `PLAYWRIGHT_PATH` / `CHROMIUM_PATH` (see `browser-checks/README.md`).
  `smoke-player.mjs` is still **stale** — it opens the old `/Pictogram/` path, which 404s.

## Site-wide known limits

- This agent sandbox has internet, so CDN Bootstrap loads; Playwright + headless Chromium are
  available. (An earlier sandbox had no internet and could not load Bootstrap.)
- No CI. The gate is run by whoever is finishing.
- The published site root 404s (see the Forge section).
