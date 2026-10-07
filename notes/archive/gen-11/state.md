# Current state

What exists right now, per component. This is the only place current facts and known limits live;
everything else points here. Not history, not plans (those are `history.md` / `backlog.md`).

Source note: written 2026-10-05. v9.1 and v10 were verified on the live repo. v11 is applied and
partially verified: `check-docs.mjs` and `check-integration.mjs` exit 0; Akari, Skyscrapers,
Futoshiki, Hashi and Binairo Node tests pass; changed v11 JS passes `node --check`; static checks
confirm all 13 current application pages have the v11 Fresh/build-label wiring. Pictogram's roundtrip Node test timed out in the sandbox; no assertion failure was produced. A real browser UI pass could
not complete in this sandbox, so v11 is **not fully verified**. Pictogram's earlier detail is the
project's record, not re-checked.

## shared/ — generic layer, reused by every puzzle

- `gdp-settings.js` — JSON-in-localStorage settings store; theme helpers; Auto → light → dark
  cycling button. Knows nothing about any puzzle.
- `gdp-palettes.js` — 10 named themes; generic "confirmed" / "excluded" cell states;
  `resolvePalette()`, `buildCellFill()`. A puzzle decides which of its own values map to those
  states.
- `resolveChrome(paletteId, theme)` derives BOARD colours (surface, grid, ink, node, accent,
  accentInk, over) from a palette, so a board's markers are guaranteed to differ from its surface.
  Puzzles map those to their own objects; no puzzle invents its own board colours.
- `gdp-theme.css` — page shell, panels, toolbar, offcanvas panel look, (i) info buttons,
  2-column and wide-page helpers. Also holds `--gdp-grid` colour, and three new pieces:
  `.gdp-settings-dock` (settings tab + slide-out panel as ONE fixed element, so the tab moves
  with the drawer), `.gdp-fresh-btn`, and the old detached `.gdp-edge-tab` removed.
- **`gdp-fresh.js`** — `GDP_BUILD` is `'11.0.1'`; `showBuildVersion()` renders it into an element
  (`#buildTag` by default), and `setupFreshButton(button, versionEl)` wires both the button and the
  label. The Fresh button is a large, accented control on every page, including creator pages.

- **`gdp-secret.js`** — shared XOR secret lock: `bitsFrom`, `lockMessage`, `unlockMessage`. The
  key is padded to exactly the message length (`BitSeq.getXOR` cycles a shorter key, which would
  corrupt the message). Used by the four new puzzles; Pictogram and Hashi keep their own codecs.
- `gdp-ui.js` wires `setupSettingsDock(dock)` (Escape/outside-click close it); no Bootstrap
  dependency for the dock.
- `gdp-bitseq.js`, `gdp-math-utils.js` — bit-level encode/decode, character set, seeded shuffle.
- **`gdp-board.js`** — the shared SVG board shell (`mountBoard`). Owns the SVG element,
  fit-to-holder, zoom (buttons, wheel, keys), scroll-bar panning, pointer routing + capture, drag
  painting (one drag = one undo step), undo/redo, the hover layer, and the keyboard shortcuts for
  those. A puzzle supplies a small adapter: `world()`, `render()`, `hitTest()`, `apply()`,
  `unapply()`, `isSolved()`, optional `hover()` and `onSolved()`. `onSolved` may be supplied by
  the adapter **or the mount options**; it fires once, and the board re-renders after it so a
  puzzle can change its own solved look. A puzzle restored already solved starts locked. The shell
  never imports puzzle code. Interface and rationale: `decisions/0001-svg-board-migration.md`.
- **`gdp-board.css`** — board shell styles (scroll container, `touch-action`, sizing). The board
  box is the **only** scroller; its page wrapper does not scroll, so both scroll bars appear
  together at the board's edges when it is zoomed past its box, and `scrollLeft`/`scrollTop` on the
  board root drive wheel-zoom anchoring.
- `puzzle-template/` — copyable `settings.js`, pre-paint snippet, README.
- **Limit:** the shell does not yet provide timer, saved progress, solved-notice or pop-out —
  those still live in each puzzle's page. See `backlog.md`.

## PuzzleForge/Pictogram/ — live, most complete

- Picture → nonogram pipeline: upload/paste/drag-drop, crop, fit-to-subject, 3 conversion presets
  (Silhouette / Line art / Photo), Sobel edge detection for Line art, background Web Worker
  solver that forces a single logic-solvable solution.
- Player: 60×60 max, compressed link format, versioned links (v1 legacy random, v2/v3
  picture-based), 10 themes, 5 board styles, X/dot marks, auto-fit zoom, undo/redo, save point,
  timer (pauses when the tab is unfocused), saved progress, settings panel, on-screen board size,
  secret message reveal.
- **Rendering: the shared SVG board shell.** `js/player.js` is now wire-up only (settings, timer,
  save points, toolbar, secret). The model is `js/nonogram-model.js` — pure, no DOM (grid, hint
  check-offs, move rules, solved check). The view is `js/nonogram-board.js` — the SVG adapter,
  drawing the same cell colours, X/dot marks, thin/thick lines, hint placement and hover highlight
  as the old p5 code. **p5.js is removed** from `index.html`; no page loads it any more.
- Files: `index.html`, `creator.html`, `js/player.js`, `js/nonogram-model.js`,
  `js/nonogram-board.js`, `js/util/*` (incl. `settings.js`, `board-styles.js`), `styles/`,
  `assets/`, `dev-tools/{test-roundtrip,test-secret,test-image}.mjs`.
- GPL-3.0, forked from RosimInc/sg-nonograms.
- **Limits:** wheel zoom at 60×60 measured ~30 fps under software rendering (real GPU unmeasured —
  owner to judge by feel). No Node test covers `nonogram-model.js` yet, though it is pure and one
  is possible. No Node coverage for the pages themselves.

## PuzzleForge/Hashi/ — draft, on the shared shell with parity features

- Random generation, 5–14 grid, plain-text secret only. Board SVG from `js/board.js` (adapter),
  mounted by `shared/gdp-board.js`; geometry, click cycling and the no-crossing rule unchanged.
- **v11:** board chrome comes from shared `resolveChrome()`; the invented `js/util/board-styles.js`
  is deleted. The surface/grid toggles, saved progress/timer/save point/clear-progress and full
  settings drawer remain. The style dropdown now lists the shared 10 palettes.
- Node test `dev-tools/test-hashi.mjs` covers `hashi-logic.js` only.
- **Limits:** largest size undecided by the owner.

## PuzzleForge/Akari/ — built (reference "puzzle kit")

- `js/akari-logic.js` (walls+clues, lamp/mark states, solved check, unique generator + solver,
  link codec, secret), `js/akari-board.js` (shell adapter), `js/player.js` is inlined in
  `index.html`, `creator.html`, `js/util/settings.js`, `dev-tools/test-akari.mjs`. Pattern the
  other new puzzles copy.

## PuzzleForge/Skyscrapers/, Binairo/, Futoshiki/ — logic + tests pass; pages under repair

- Each has `js/<name>-logic.js` (pure model, move rules, solved check, unique-solution generator,
  link codec), `dev-tools/test-<name>.mjs`, a player and creator, all on the shared `resolveChrome()`
  board chrome. Binairo uses row-pattern enumeration and its 8×8 regression completes quickly.
- Size caps: Skyscrapers 4–9, Futoshiki 4–8, Binairo even 6–12 (4-bit values cap Latin puzzles at
  N=15; these are generation limits, not format limits).
- **KenKen** specced (cages + arithmetic), not built.

- **Limit (v11.0.1):** the three player pages shipped broken — an unquoted `innerHTML=` line killed the page script (no board, dead settings). Fixed in v11.0.1, **unverified**. Re-test in a browser.

## PuzzleForge/ — landing page

- `index.html`: lists every puzzle with status, links the live ones, and has a Test Mode section
  with ready examples for Pictogram, Hashi and Akari. `js/util/settings.js`, theme-only. Every
  puzzle now lives under this folder.

## dev-tools/

- `check-integration.mjs` — code wiring: broken relative imports, a settings key defined twice or
  hardcoded outside its `settings.js`, pages not reaching `gdp-settings.js`/`gdp-theme.css`.
  `dev-tools/` files are exempt from the key-duplication check. Skips the standalone benchmark page
  `browser-checks/nonogram-svg-board-test.html`, which is not an application page.
- `check-docs.mjs` — documentation contract: required documents exist, the 7-file cap holds,
  decision references and local links resolve, and no live pointer to a retired document remains.
  Exits non-zero on failure.
- `browser-checks/` — `static-server.mjs`, `p5stub.js` (kept only for re-running the old p5 player
  from history), `smoke-player.mjs` (Playwright, real clicks, environment-variable paths),
  `README.md`, and `nonogram-svg-board-test.html` (standalone SVG benchmark; the owner's
  real-hardware performance test). Tooling, not notes.

## Site-wide known limits

- Agent sandbox has no internet: CDN Bootstrap does not load in browser checks; Playwright +
  headless Chromium are available. See `testing.md`.
- Never confirmed against a live GitHub Pages deployment.

- v11 applied: Pictogram is now under PuzzleForge; Skyscrapers, Binairo and Futoshiki have player/creator pages; Akari uses shared board chrome; build/cache tags are 11.0.1.
