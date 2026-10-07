# Backlog

One line per item: **status** — what — pointer. Statuses: `approved`, `doing`, `proposed`,
`blocked`, `rejected`, `done`. Rationale never lives here; it lives in the decision note a line
points at. Don't start anything not marked `approved`.

## Approved

- `doing` — **v11: visible build label + bigger Fresh button; generic "Create your own puzzle" links; shared board chrome; Pictogram drawer fix; puzzle folders under `PuzzleForge/`; Binairo rewrite; Forge Test Mode; history archive.** Code + docs supplied; **applied; Node/integration checks pass; Pictogram roundtrip timed out; browser UI pass remains outstanding.** → `decisions/0002`, `decisions/0003`, `decisions/0004`.
- `done` — **v10: fresh-version delivery, attached settings dock, Hashi parity, new puzzles.**
  Docs/integration checks pass; Akari, Skyscrapers, Futoshiki and Hashi tests pass. Binairo's
  8×8 generator regression passes (8×8 in 9 ms) in v11.
  → `decisions/0001` (v10 addendum).
- `done` — **One shared SVG board layer in `shared/`; remove p5.** Stages a–c and the v9.1 bug
  fixes are implemented: solved callbacks resolve from adapter or mount options; the board is the
  only scroller; settings use a right-edge tab; Hashi draws optional board surface + grid.
  `check-docs.mjs` and `check-integration.mjs` exit clean, and a Chromium browser harness confirmed
  the solved-message path, single-scroller overflow, edge-tab CSS/markup, and Hashi surface/grid.
  → `decisions/0001-svg-board-migration.md`
- `proposed` — **Wheel-zoom performance at 60×60** if it feels slow on real hardware (~30 fps
  measured on software rendering). Fix inside the shell: CSS-transform scaling instead of resizing
  the SVG, less repaint work, hide detail when zoomed out. → `decisions/0001-svg-board-migration.md`
- `proposed` — **Move timer, saved progress, solved-notice and pop-out into the shell**, so every
  puzzle gets them instead of each page reimplementing them. → `decisions/0001-svg-board-migration.md`
- `done` — **Documentation system v8.** Split by type, one home per fact; `check-docs.mjs` added;
  stale pointers cleaned. → no decision note (process change, owner-directed).

## Pictogram — proposed, not built

- `proposed` — Replace "Random" mode with a small built-in puzzle gallery.
- `proposed` — A measured difficulty indicator (deduction-depth, not just grid size).
- `proposed` — A custom puzzle title shown to the player. (On-screen **grid size** is already
  done — see `state.md`.)
- `proposed` — Hint system: creator sets 0–10 hints; player spends one to reveal a random correct
  cell.
- `proposed` — Survival/lives mode: creator sets lives; a wrong cell costs one; 0 = game over.
- `proposed` — Optional sound toggle, a couple of short royalty-free tracks (check licence per
  track).
- `proposed` — In-play "assist" overlay (optional shortcuts, e.g. auto-marking cells implied by a
  zero clue). General assist *concepts* → `shared/`; each puzzle's actual assist rules are written
  per puzzle, since the logic genuinely differs.
- `proposed` — A Node test for `Pictogram/js/nonogram-model.js` (it is pure and DOM-free).
- `proposed` — Automatic background removal (client-side model), if manual image masking is ever
  revisited.
- `rejected` — Dithering for image conversion (scatters isolated-cell noise; makes nonograms
  uglier *and* harder, not just visually different).
- `rejected` — Custom-uploaded backdrops/marks: an uploaded image cannot fit in a shareable URL
  under the link-is-the-save-file architecture.

## Hashi — draft, open question

- `blocked` — Owner has not said the largest board size Hashi should support (currently 5–14).
- `done` — Hashi board styles. Replaced in v11 by shared palette chrome; the invented `board-styles.js` was deleted (see `decisions/0003`).
- `done` — Hashi saved progress, timer, save/load point and clear-saved-data (`gdp-hashi:`).
- `done` — Fresh-version button on the creator pages (Pictogram and Hashi).

## Other puzzles — proposed, in rough build order

- `done` — Akari (player + creator + logic + test). First puzzle built from scratch on the shell.
- `doing` — Skyscrapers: logic + test + player + creator; player page shipped broken, fixed in v11.0.1 (unverified). Board chrome from `resolveChrome()`.
- `doing` — Binairo: logic (row-pattern solver) + test + player + creator; player page shipped broken, fixed in v11.0.1 (unverified). Board chrome from `resolveChrome()`.
- `doing` — Futoshiki: logic (solver fixed) + test + player + creator; player page shipped broken, fixed in v11.0.1 (unverified). `proposed` — KenKen (cages + arithmetic): specced.
- `proposed` — Version the remaining unversioned local imports inside Pictogram creator and Hashi creator modules so their internal cache-busting edges match the v11 convention.
- `proposed` — Extract a shared link-header helper (5 codecs now repeat the framing; the thinker
  recommends it, but it is a `shared/` structural change so it needs owner approval — R6).
- `proposed` — Nurikabe (hardest to generate).
- `proposed` — Slitherlink (consult `decisions/0001`'s pzpr.js notes for input and rule checking).
- `proposed` — Crossword generator (the one puzzle where the creator supplies content: words and
  clues).
- `proposed` — Train Tracks.
- `proposed` — Chained mode (links several puzzles into one sequence) — built last.

## Separate, not part of this package

- `proposed` — Picture-to-Numberlink: the Pictogram approach applied to Piczle-style path puzzles.
  Harder project; not part of this repo's package.

## Housekeeping
- `approved` — **Test Mode examples**: owner pastes one real puzzle link per playable puzzle into `PuzzleForge/index.html` (`TEST_LINKS`). → `decisions/0004-forge-test-mode.md`

- `done` — `dev-tools/check-docs.mjs` false-positive stale-pointer hits from its own explanatory
  text and `notes/README.md`'s intentional cap sentence are excluded via the checker's `allowed`
  set; the checker now exits clean.
