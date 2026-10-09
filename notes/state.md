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

Source note for the v13_Logic third round (2026-10-09, owner corrections): the "old links keep
working forever" reading of invariant 2 was retired — only the current link version must work and
legacy decoders are removed; R7 now steps `GDP_BUILD` on every commit through
`dev-tools/bump-build.mjs` (save points included; a big version is the owner's call); invariant 1
now spells out "same message + options ⇒ same puzzle and same link"; R16 answers are read, reasoned
and written in the agent's own words; R17 agent tests must be few, easy, deterministic and fail
only for a real defect. Akari became the first message-seeded link (`LINK_VERSION = 2`).
`TEST-RESULTS.md` now names the build it ran on.

Source note for the v13_Logic second round (2026-10-08, owner review): the reload-renders-unsolved
defect and the board-opens-cropped defect were both fixed; every puzzle moved onto the one shared
settings panel; Binairo's rules text gained the three-in-a-row ban and its generator gained a
hand-solvability filter; Futoshiki's generator now emits as few signs as still keep the solution
unique; Skyscrapers gained clickable row/column solve ticks; Nurikabe shipped. Rules R16 (answer
first) and R17 (test ownership) were added, and R15 now requires a save point to reach the remote.
The owner's local runner (`Run-Local.cmd`) is the home of the hard/browser checks.

## In flight (save-point state — updated at every commit, cleared when the work lands)

- **Train Tracks** — `PuzzleForge/TrainTracks/js/traintracks-logic.js` only (WIP commit `139f84e`).
  The loop builder works; **`solve()` reports 0 solutions on a valid loop, so `generate()` returns
  null** — mid-debug, `__ttDbg2` hooks still in the file. No board/player/creator/test/Forge entry.
  Pick up at `solve()`.
- **Message-deterministic generation** — the theme, now invariant 1: same message + options ⇒ same
  puzzle and same link. Nonogram/Pictogram already derive their seed from the message; **Akari is
  converted** (link v2 stores the seed, board regenerated; `encodeFromMessage`). Hashi,
  Skyscrapers, Binairo, Futoshiki and Nurikabe still use `Math.random` and store the board in a v1
  link — convert them the same way (v2 only; no legacy decoders, invariant 2). Train Tracks is
  built seeded from the start. Plan in `backlog.md`.
- **Pictogram / Nonogram settings panel** — both still hand-wire the panel in `player.js` (old
  markup, `boardSelect` id, no "Show grid"). They are on the shared board shell and shared palettes;
  only this migration is missing. See `backlog.md`.
- **Crossword** — not started; blocked on one decision: it has no unique solution, so invariant 4
  cannot apply as-is. Options in `backlog.md`.

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
- `gdp-settings-panel.js` — `setupBoardSettingsPanel(opts)`: the one settings panel (themes, board
  style, board background, show grid, timer, clear progress). Six puzzle pages call it; only
  Pictogram and Nonogram still hand-wire their own markup (see the In-flight block).
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
- **Second round (2026-10-08):** Skyscrapers' rows and columns can be clicked to mark a line solved
  (like nonogram hint lines) and its generator no longer ships a puzzle below a given-count floor;
  Binairo's rules text now states the no-three-in-a-row ban and the generator rejects boards a human
  cannot start; Futoshiki's generator drops signs while the solution stays unique, so a board no
  longer shows a sign on every edge.
- **KenKen** specced, not built.

## PuzzleForge/Nurikabe/ — live (added 2026-10-08)

- `js/nurikabe-logic.js` (pure: sea-first generator, limit-2 uniqueness proof, link codec, secret),
  `js/nurikabe-board.js` (shared-shell adapter, position-based hit-test), player inlined in
  `index.html`, `creator.html`, `js/util/settings.js`, `dev-tools/test-nurikabe.mjs`. Caps:
  `MAX_SIZE` 12, `MAX_ISLAND` 15. Published rules implemented: a clue cell belongs to an island of
  exactly its number, one clue per island, islands never touch orthogonally, and the sea is one
  connected region with no 2×2 block.
- **Verified 2026-10-08:** renders, solves by clicking in the click-solve gate and reveals
  "Cloud Logic 1".

## PuzzleForge/ — landing page

`index.html` lists every puzzle with status, links the live and in-progress ones, and has a Test
Mode section with a ready example for every playable puzzle (Pictogram, Nonogram, Hashi, Akari,
Skyscrapers, Binairo, Futoshiki). 12 entries, 8 Test-Mode links (Pictogram, Nonogram, Hashi, Akari, Skyscrapers, Binairo,
Futoshiki, Nurikabe), all resolving (2026-10-08). **Site root caveat:** the published root `…/GoblinPuzzles/` 404s; the site is served
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
- **Owner's local runner (not part of a version):** `Run-Local.cmd` + `dev-tools/local-runner.mjs`
  + `package.json` + `.gitignore`. Double-clicking it serves the folder on `127.0.0.1`, opens the
  Forge in the owner's Chrome, adds a "Local tests" section with **Quick** (the gate), **Full** (the
  gate, then the two slow Pictogram sweeps with no timeout) and **Browser** (all 8 playable puzzles
  solved by real clicks) buttons, and writes `TEST-RESULTS.md` at the folder root. Its only
  dependency is `playwright-core` (no browser download) and it drives the installed Chrome/Edge; the
  window closes when the browser does. In-flight jobs are never interrupted. See `testing.md`.

## Site-wide known limits

- A restored agent sandbox has no browser tooling (Playwright and Chromium were gone after the last
  restore) and R17 says not to reinstall it for a check. The browser checks are the owner's, through
  `Run-Local.cmd`; their result comes back in `TEST-RESULTS.md`.
- No CI. The gate is run by whoever is finishing.
- The published site root 404s (see the Forge section).
