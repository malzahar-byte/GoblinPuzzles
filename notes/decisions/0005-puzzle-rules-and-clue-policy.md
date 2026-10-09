# 0005 — Puzzle rules, shared styles and clue policy

**Why this note exists.** Every agent session is its own cloud sandbox: when a session ends, the
reasoning inside it is gone unless it is committed. The owner's words (2026-10-09): "all that testing
and generators are lost each time". Standard rules and the *expected look* of a puzzle have been
re-derived from scratch by successive agents, and generator policy has been guessed instead of
recorded. This note is the home for that. It is a `decisions/` note, which is cap-exempt (R12), so
recording logic here never raises the "new document" question (R6).

## The standing rule: styles are global

Appearance and generic behaviour are **one shared system for all puzzles** — not a per-puzzle
choice and not a thing to be re-decided:

- theme (light/dark/auto), board style palette, board background, grid, timer, clear-progress, the
  solved notice, and the mark/pre-filled **colours** come from `shared/`.
- a puzzle may add settings only where they are **unique to that puzzle's rules** (e.g. which tool a
  click selects), and must not fork a shared control or its colour source.
- consequences: `shared/gdp-palettes.js` + `gdp-settings-panel.js` + `interfaces/palette-chrome.md`
  are the single source; a board background that is invisible in some styles, or a puzzle that draws
  its own colour source (Pictogram/Nonogram today), is a defect — not a variation.

## Per-puzzle rules and expected clue policy

Re-read before touching a generator. "Unique" is the floor, never the bar — the owner's standard is
a puzzle a human solves by deduction (2026-10-09).

- **Train Tracks / Tracks** — one closed loop of track through cells of the grid; a piece joins
exactly two sides and must match its neighbour; **the row and column counts are the clues and every
one of them is shown**. Reference the owner gave: `puzzlemadness.co.uk/traintracks` (closed loop,
counts around the grid). Simon Tatham's *Tracks* is the same family with all counts printed and an
A→B path. Hiding counts (the old behaviour here) is a defect, not a difficulty setting.
- **Futoshiki** — Latin square of 1..N with inequality signs **between some** of the pairs, plus
optionally a few given digits; unique solution. Clue policy is **a density/balance, not a minimal
set**: the owner's reference is `futoshiki.com`, which ships **difficulty tiers (Trivial, Easy,
Tricky, Extreme)** that change how much is given. Generator must target a tier, and delete-to-minimal
(every sign that uniqueness does not need — today's behaviour) is wrong.
- **Nurikabe** — every numbered cell is an island of exactly that size, one clue per island, islands
never touch orthogonally, all other cells are sea, the sea is one connected region and contains no
2×2 block. A unique solution is expected (matches the standard puzzle). Two requirements recorded
2026-10-09 after the owner's 5×5 report: **an unset cell must look different from an island** (today
both are "no fill", so a player cannot see a cell they have not clicked), and **a board that breaks a
rule must say which rule it breaks**.
- **Akari / Skyscrapers / Binairo** — rules as printed on their pages (they are the standard
puzzles). Binairo already rejects boards a human cannot start, which is the pattern the others
should follow for human-solvability.
- **Hashi / Pictogram / Nonogram** — rules as printed; both are being re-examined (Hashi's migration
is approved; Pictogram/Nonogram's codec/renderer divergence is a research step).

## Mistake highlighting — shared, on by default (owner, 2026-10-09)

The owner's reference (`puzzlemadness.co.uk/traintracks`) marks a satisfied row/column count green and
a broken one red. He wants that **as a shared feature of nearly every puzzle**, not a per-puzzle
extra: implemented once in `shared/`, **enabled by default everywhere**, exposed as an optional
settings toggle so it can be turned off later. What the puzzle supplies is *what* is wrong (which
cells/lines break one of its rules); the shared layer owns the colours and the drawing, like every
other style decision. "The game detects a correct solution" is *not* this feature — that is the
existing solved state plus the secret message, already implemented and already tested by
`click-solve.mjs`.

## Marks

Every puzzle can have marks, and what a mark *means* is the puzzle's own logic (a candidate digit, a
cross meaning "no track here", a `?`). What is shared is the **colour**, taken from the selected
theme/style. So: mark behaviour lives in each `*-board.js`; mark colour lives in `shared/`.

## Evidence rules that follow

- A generator test must prove uniqueness **and** a deduction path; a board nobody can solve by logic
  is a failed generation even when the search says one solution.
- Quality numbers (clue density, solving time, deduction-only success) belong in the owner's runner
  so a sweep runs on his pc and lands in `TEST-RESULTS.md`, not in an agent's sandbox that dies.

## Open

- Exact Futoshiki density per difficulty tier, and its source.
- Whether Train Tracks ever gets endpoints (A/B) as an option.
- Which shared mark colours the palettes need (`(?)` candidate, `x` exclusion, pre-filled tint).
