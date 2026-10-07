# 0003 — Board colours come from the shared palettes

**Status:** accepted (owner-directed 2026-10-05).

## Context
Hashi had a hardcoded `HASHI_STYLES` table; some styles made the board surface and islands the same colour.

## Decision
- Add `resolveChrome(paletteId, theme)` to `gdp-palettes.js` and derive board chrome from the palette.
- Every puzzle maps those colours to its own objects.
- Delete `PuzzleForge/Hashi/js/util/board-styles.js`.

## Consequences
- Existing cell-state palettes are untouched; chrome is additive.
- Contrast is derived from the palette rather than invented per puzzle.
