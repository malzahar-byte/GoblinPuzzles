# Testing — what to run, when

Reference material, consult when relevant. The rule it serves lives in `AGENTS.md` (R4):
already-verified work doesn't need re-running; only test what your task actually touches.

## Different kinds of check, for different kinds of mistake

1. **Node logic tests** (`dev-tools/*.mjs` inside each puzzle) — check puzzle *logic*: link
   encoding, solving, generation. Fast, no browser, no network.
2. **`dev-tools/check-integration.mjs`** (repo root) — checks that a puzzle is actually *wired
   into `shared/` correctly*: no hardcoded settings keys, no broken relative imports, every page
   actually reaches `gdp-settings.js`/`gdp-theme.css`. This is NOT a logic test and doesn't touch
   a browser. Run it whenever you touch a puzzle's settings/theme wiring, or add a new puzzle.
   It's cheap (well under a second) and mechanical — it exists because this exact class of
   mistake (a hardcoded settings key duplicated across files) has happened more than once and
   wasn't caught by reading the code carefully. Run it, read the output, fix what it flags.
3. **A real headless browser** (Playwright is available — see below) — the only way to check
   actual page rendering, Bootstrap-dependent UI (the settings drawer, tooltips), and real click/
   drag interaction. Slower, more setup, and the current sandbox has no internet, so CDN-hosted
   Bootstrap/p5 don't load (see "known sandbox limits" below). Use it for UI changes; it's
   overkill for a pure logic change.
4. **`dev-tools/check-docs.mjs`** (repo root) — checks the `notes/` documentation contract:
   required documents exist, the 7-file cap holds, decision references and local links resolve,
   and no live pointer to a retired document remains. Run it whenever you touch documentation
   (R9/R10).

## Which to run for a given change (Pictogram)

| You changed | Run |
|---|---|
| Nothing / reading code / answering a question | Nothing |
| Any documentation change | `node dev-tools/check-docs.mjs` (plus `check-integration.mjs` if code wiring is also touched) |
| Link format, `nono-utils.js`, `id-parser.js` | `test-roundtrip.mjs`, `test-secret.mjs` |
| Secret-message handling specifically | `test-secret.mjs` |
| `image-to-grid.js` | `test-image.mjs` (flaky — see note below) |
| `puzzle-repair.js` or `line-solver.js` | `test-image.mjs`, `test-roundtrip.mjs`, `test-secret.mjs` (all three import these) |
| `shared/gdp-bitseq.js` or `shared/gdp-math-utils.js` | `test-roundtrip.mjs`, `test-secret.mjs` — these cover Pictogram's use. **For Hashi's use of either file, there is currently no Node test** (Hashi's `creator.html` uses `gdp-math-utils.js` directly in an inline script that `test-hashi.mjs` never touches) — a browser check is the only way to verify that side |
| Settings/theme wiring (any puzzle) | `node dev-tools/check-integration.mjs` from repo root |
| Page HTML/CSS, `shared/` theme/UI code, any puzzle's visual behaviour | No Node test covers this — real browser check |
| `shared/gdp-board.js`, `Pictogram/js/nonogram-board.js`, or Hashi `js/board.js` | No Node test — real browser check: clicks, drag-paint, hint click, zoom, undo/redo, **solve the puzzle → the message and solved styling appear**, and zoomed past the box **both scroll bars show at the board's edges** |
| `Pictogram/js/nonogram-model.js` | Pure and DOM-free — **no test yet**; a Node test is wanted (see `backlog.md`) |
| Any new puzzle's `*-logic.js` (Akari/Skyscrapers/Binairo/Futoshiki) | `node PuzzleForge/<Puzzle>/dev-tools/test-<name>.mjs` — generation uniqueness, solving, link round-trip, decrypt. **Binairo's test must now finish in seconds**; a timeout is a real regression. |
| `shared/gdp-palettes.js` (`resolveChrome`) or Hashi `js/board.js` | No Node test — browser check: switch through all 10 palettes in both themes; islands must never match the board surface. |
| `shared/gdp-fresh.js`, `.gdp-fresh-btn`, `#buildTag`, or a page's `?v=` strings | No Node test — browser check: the `v11.0.1` label shows on every page (including creator pages), and `↻ Fresh` reloads. |
| Puzzle folder moves (anything under `PuzzleForge/`) | `node dev-tools/check-integration.mjs` — it resolves every relative import, so a missed `../` shows up here first. |

`test-image.mjs` has one known-flaky case (a synthetic high-texture "photo" image at 60×60,
unseeded randomness in the repair step) — documented in the test file itself. A single failure
matching that description on a re-run is expected, not a regression; anything else is real.

`test-roundtrip.mjs` and `test-image.mjs` can each take several minutes on the largest grid
sizes — this is expected, not a hang.

## Hashi

`PuzzleForge/Hashi/dev-tools/test-hashi.mjs` covers `hashi-logic.js` (generation, solving,
link encoding). It does not cover anything in the HTML pages themselves (settings wiring, the
secret-character check using `CHAR_TO_NUM`) — browser-check those if you touch them.

Board rendering now goes through `shared/gdp-board.js` (adapter `PuzzleForge/Hashi/js/board.js`),
including the optional board surface and grid behind the islands; browser-check it if you touch
it.

## Known sandbox limits for browser checks (true as of 2026-10, re-confirm if it changes)

No internet access in the agent sandbox, so CDN-hosted resources don't load:
- **Bootstrap's CSS/JS** (from jsdelivr) — fails to load entirely. Anything depending on
  Bootstrap's own JS (the settings offcanvas opening, the collapse toggle) can't be observed
  actually working this way — you can confirm the markup matches Bootstrap's documented API and
  that your own logic behind it runs when triggered directly, but that's weaker than seeing it
  actually animate/open. Say so plainly if that's what you did, don't call it "verified."
- **p5.js** — no page loads it any more (Pictogram moved to the shared SVG board).
  `dev-tools/browser-checks/p5stub.js` is kept only for re-running the old p5 player from history;
  the current player needs no stub.
- Playwright + headless Chromium (`/opt/pw-browsers`) ARE available locally and work fine for
  everything that doesn't need those two CDN resources. Use `node --check` for quick JS syntax
  validation; it does not verify imports resolve — `check-integration.mjs` does that part.
- Scripts used for a one-off browser check should be saved somewhere reusable if there's any
  chance they're worth running again, not left to exist only in a sandbox and vanish. Short
  throwaway scripts for a single specific question are fine to discard.
- **Versioned URLs:** asset checks must strip the `?v=…` query (check-integration does). Current build string is `11.0.1`; bump it on every release and re-point every `?v=`. A
  cache-staleness fix can only be confirmed on a real deployment; the sandbox can't see Pages' cache.
- No access to deploy to or test against a real GitHub Pages site. Relative-path reasoning
  (`../shared/...` staying inside the published site because the repo root matches
  `GoblinPuzzles/`) is sound but has never been confirmed against an actual live deployment.

- The standalone SVG benchmark `dev-tools/browser-checks/nonogram-svg-board-test.html` is the
  owner's real-hardware performance test (measured ~30 fps wheel zoom at 60×60 under software
  rendering). It is not part of the app and is skipped by `check-integration.mjs`.