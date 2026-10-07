# 0002 — Every puzzle lives under `PuzzleForge/`

**Status:** accepted (owner-directed 2026-10-05).

## Context
Puzzles had drifted into two layouts. The owner wants one rule: **all puzzles under `PuzzleForge/`**, so the Forge is the single place puzzles live and the root stays shared/tooling only.

## Decision
- Akari, Skyscrapers, Binairo, Futoshiki and Pictogram now live under `PuzzleForge/<Name>/`.
- **Pictogram moved last.** Its old top-level /Pictogram/ URLs are retired (nothing was public yet).
- A moved puzzle gains one `../` for every path that climbs out of its folder.

## Consequences
- `check-integration.mjs` is the safety net for the move.
- This reverses the earlier top-level-folder convention; the decision is recorded so it is not re-argued.
