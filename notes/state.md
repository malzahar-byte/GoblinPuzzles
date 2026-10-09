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

Source note for the v13_Logic fourth round (2026-10-09, owner direction "same message ⇒ same
puzzle"): **every pointer/track puzzle now derives its link from the message.** Akari, Hashi,
Skyscrapers, Binairo, Futoshiki and Nurikabe moved to link version 2 (the link stores the
message-derived seed, the board is rebuilt from it, `encodeFromMessage`) and their v1 decoders
were deleted — the same message + size gives the same puzzle and the same link. Train Tracks
shipped seeded from the start. Their Forge Test-Mode links were regenerated (the old v1 ids are
retired and rejected). `dev-tools/bump-build.mjs` steps `GDP_BUILD` on every commit and
`TEST-RESULTS.md` names the build it ran against.
`TEST-RESULTS.md` now names the build it ran on.

Source note for the v13_Logic second round (2026-10-08, owner review): the reload-renders-unsolved
defect and the board-opens-cropped defect were both fixed; every puzzle moved onto the one shared
settings panel; Binairo's rules text gained the three-in-a-row ban and its generator gained a
hand-solvability filter; Futoshiki's generator now emits as few signs as still keep the solution
unique; Skyscrapers gained clickable row/column solve ticks; Nurikabe shipped. Rules R16 (answer
first) and R17 (test ownership) were added, and R15 now requires a save point to reach the remote.
The owner's local runner (`Run-Local.cmd`) is the home of the hard/browser checks.

## In flight (save-point state — updated at every commit, cleared when the work lands)

- **Owner's runner jobs** — the new hard checks (Train Tracks in the Browser job, the seeded-link
  checks in Quick) must be confirmed by the owner's next `Run-Local` run; results come back in
  `TEST-RESULTS.md`.
- **Crossword** — not started; blocked on one decision: it has no unique solution, so invariant 4
  cannot apply as-is. Options in `backlog.md`.
- **Landed this round (cleared from In flight):** message-seeded links v2 for Akari, Hashi,
  Skyscrapers, Binairo, Futoshiki, Nurikabe (v1 decoders deleted, Forge links regenerated); Train
  Tracks shipped end to end (`PuzzleForge/TrainTracks/`); Pictogram, Nonogram **and** Hashi moved
  onto `shared/gdp-settings-panel.js` — every player page now uses the one panel. Pictogram and
  Nonogram gained the "Show grid" toggle (it hides the thin cell lines; the 5-cell lines and the
  frame stay) and a `grid: true` default; Hashi's background toggle moved from the odd
  `board: 'panel'|'none'` key to the standard `surface` flag.
- **Owner bug report + answers (2026-10-09, triaged read-only by Cloud_Cline_1)** — the owner's 14
  points and his replies are recorded in `backlog.md` ("Owner bug report (2026-10-09)" and the
  "Owner direction" sections after it), and everything they settled as design is in
  `decisions/0005-puzzle-rules-and-clue-policy.md`. Nothing is fixed yet. Owner-approved and
  waiting: one shared board background, a pre-filled "given" tint and mark colours; Train Tracks
  shows every row and column count; Futoshiki targets difficulty tiers instead of minimal clues;
  "Create your own puzzle" always goes to the Forge; Test Mode alphabetical with greyed
  placeholders; Hashi migrated to the common shape; the runner keeps running until Edge closes and
  gains a Generator-QA job. Deferred: the Pictogram `test-image.mjs` `photo` failure and the
  Pictogram/Nonogram divergence research. **Corrected later the same day (see `history.md`, third
  entry): with every cell set, the owner's own 5×5 board *is* the unique solution and passes the rule
  check — the page's silence is the bug, most likely because an unset cell looks exactly like an
  island (both are "no fill").** Nurikabe's Forge example is unique (13 clues), as recorded.


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
  style, board background, show grid, timer, clear progress). **All nine player pages call it**
  (2026-10-09): Pictogram, Nonogram and Hashi were the last hand-wired ones, and Pictogram/Nonogram
  were missing "Show grid" until then.
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
- **Link is message-seeded v2 (2026-10-09):** `encodeFromMessage(W, H, message)` stores the seed, so
  the same message + size gives the same puzzle and the same link; `parseLink` rebuilds the islands
  from the seed and rejects v1 ids (no legacy decoder). The Forge example is 5×5 "Well done!".
- **Settings panel (2026-10-09):** moved onto `shared/gdp-settings-panel.js` (`styles: PALETTES`,
  `styleKey: 'boardStyle'`); the background toggle now uses the standard `surface` flag instead of
  `board: 'panel'|'none'`, and "Show grid" keeps working through the adapter's `getGrid`.

## PuzzleForge/Akari/ — built (reference "puzzle kit")

- `js/akari-logic.js` (walls + clues, lamp/mark states, unique generator + solver, link codec,
  secret), `js/akari-board.js` (shell adapter, position-based hit-test), `js/player.js` inlined in
  `index.html`, `creator.html`, `js/util/settings.js`, `dev-tools/test-akari.mjs`.
- **Link is message-seeded v2 (2026-10-09):** `encodeFromMessage(R, C, message)`; the v1 decoder and
  the board-storing `encodeLink` are gone, and a v1 id is rejected in the test. Forge example:
  7×7 "Well done!".
- Verified 2026-10-06: renders, settings dock opens, and solves by clicks → message revealed.

## PuzzleForge/Skyscrapers/, Binairo/, Futoshiki/ — live on the shared shell

- Each has `js/<name>-logic.js` (pure model, move rules, solved check, unique generator, link
  codec), `dev-tools/test-<name>.mjs`, a player and creator, all on `resolveChrome()` chrome and
  position-based hit-testing.
- Size caps: Skyscrapers 4–9, Futoshiki 4–7, Binairo even 6–12 (the creators' own min/max; the
  Futoshiki line here said 4–8 until 2026-10-09, when the creator was checked — `creator.html`
  clamps to 4–7).
- **Verified 2026-10-06:** the three player pages render, open settings, and solve by clicks →
  message revealed. (Earlier "shipped broken / unverified" notes are superseded.)
- **Second round (2026-10-08):** Skyscrapers' rows and columns can be clicked to mark a line solved
  (like nonogram hint lines) and its generator no longer ships a puzzle below a given-count floor;
  Binairo's rules text now states the no-three-in-a-row ban and the generator rejects boards a human
  cannot start; Futoshiki's generator drops signs while the solution stays unique, so a board no
  longer shows a sign on every edge. **(Owner, 2026-10-09: that over-corrected — a clue set must
  target a density/difficulty tier, not the minimum; see `decisions/0005`.)**
- **Link is message-seeded v2 (2026-10-09, all three):** `encodeFromMessage`, seeds only in the
  link, v1 decoders deleted; Futoshiki's dedupe pass is capped by a solve count, not wall-clock
  time, so a seed always rebuilds the same board. Forge examples: Skyscrapers 4×4 "Nice work!",
  Binairo 6×6 "Nice work!", Futoshiki 5×5 "Nice work!".
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
- **Link is message-seeded v2 (2026-10-09):** `encodeFromMessage(W, H, message)`, v1 decoder
  deleted; Forge example 8×8 "Cloud Logic 1".

## PuzzleForge/TrainTracks/ — live (added 2026-10-09)

- `js/traintracks-logic.js` (pure: single-loop generator with a limit-2 uniqueness proof, rule
  check, solver, message-seeded link codec, secret), `js/traintracks-board.js` (shared-shell
  adapter: click cycles empty → straight → straight → the four corners → empty, right-click clears,
  pre-filled pieces are locked, row/column counts sit in the margins), player inlined in
  `index.html`, `creator.html`, `js/util/settings.js` (own key `gdp-traintracks-settings`,
  progress prefix `gdp-traintracks:`), `dev-tools/test-traintracks.mjs`. Cap: `MAX_SIDE` 12.
- **Generator bug fixed on the way in (2026-10-09):** the first loop builder inserted an "ear" no
  grid cell can have — two adjacent cells share no common neighbour — so every loop it built was
  broken and `solve()` returned 0 on a valid board. The loop is now grown by pushing one loop edge
  outward, and `piecesFromLoop` reads each side from the coordinates rather than from the loop
  order (a right-to-left step used to swap east and west). When several clues are dropped, a cell
  the puzzle pre-fills is locked in the board adapter.
- Link is message-seeded v2 from the start (`encodeFromMessage`); Forge example 6×6 "Well done!".

## PuzzleForge/ — landing page

`index.html` lists every puzzle with status, links the live and in-progress ones, and has a Test
Mode section with a ready example for every playable puzzle. 12 entries (checked 2026-10-09; this
line said 13 until then), 9 Test-Mode links
(Pictogram, Nonogram, Hashi, Akari, Skyscrapers, Binairo, Futoshiki, Nurikabe, Train Tracks) — the
pointer/track ones regenerated as message-seeded v2 on 2026-10-09, the last two still with their
own codecs. **Site root caveat:** the published root `…/GoblinPuzzles/` 404s; the site is served
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
  Forge in the owner's **Edge** (Chrome only as a fallback; `CHROMIUM_PATH` overrides), adds a
  "Local tests" section with **Quick** (the gate), **Full** (the gate, then the two slow Pictogram
  sweeps with no timeout) and **Browser** (all 9 playable puzzles solved by real clicks) buttons, and
  writes `TEST-RESULTS.md` at the folder root. Its only dependency is `playwright-core` (no browser
  download). The window closes when the browser window does — **alt-tabbing away is not a close**:
  the page reports its own visibility and a hidden page gets a 15-minute backstop instead of the
  45-second one a visible page gets (fixed 2026-10-09; before that a long tab-away killed the
  server, verified by running one visible and one hidden instance side by side). In-flight jobs are
  never interrupted. See `testing.md`.

## Site-wide known limits

- A restored agent sandbox has no browser tooling (Playwright and Chromium were gone after the last
  restore) and R17 says not to reinstall it for a check. The browser checks are the owner's, through
  `Run-Local.cmd`; their result comes back in `TEST-RESULTS.md`.
- No CI. The gate is run by whoever is finishing.
- The published site root 404s (see the Forge section).
