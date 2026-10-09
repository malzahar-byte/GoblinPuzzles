# Interface — palette chrome

`shared/gdp-palettes.js` exports `PALETTES` (named themes) and `resolveChrome(paletteId, theme)`.

## Contract

`resolveChrome(paletteId, theme)` returns the board-chrome colours, derived from the palette so a
board's markers are guaranteed to differ from its surface:

```
{ surface, grid, gridThick, ink, muted, node, accent, accentInk,
  mark, markCandidate, given, error, satisfied, over, solved }
```

Every one of these is a *role*, not a suggestion: a puzzle draws its givens with `given`, its pencil
marks with `markCandidate` / `mark`, a rule it broke with `error`, a satisfied row or column count
with `satisfied`, and so on. Adding a role to a puzzle means adding it here first (decisions/0006).

- `surface` is the palette's own **`bg`** (the board background), never a cell colour: taking it
  from `cells[0]` made the board invisible in several styles (owner report, 2026-10-09).
- A puzzle **maps these to its own objects**; it never invents its own board colours
  (`decisions/0003-shared-board-chrome.md`).
- The palette is chosen by settings (`boardStyle`), the theme by the light/dark toggle.
- Cell-state palettes are separate and untouched; chrome is additive.

## Rules

- Switching through all palettes in both themes must never let an island / node match the board
  surface.
- **A board must be visible:** every palette in both themes must keep `surface` at least 12 steps
  (average per-channel distance) away from the page background `--gdp-bg`. `dev-tools/check-palettes.mjs`
  enforces it in the gate; a new palette that fails is a palette that draws no board.
- `resolveChrome` is the single source of board colours; a hardcoded per-puzzle colour table
  (e.g. the deleted Hashi `board-styles.js`) is not allowed.
- Every role must clear its floor, and the floors are enforced by `dev-tools/check-palettes.mjs`
  (16 checks × 10 palettes × 2 themes). The floors live in `decisions/0006`; the *guarantee* lives in
  `chromeFrom()`, so a new palette cannot introduce an invisible colour.
