# 0006 — Palette roles and a contrast contract

**Why.** The ten palettes were written by successive agents, each inventing colour values as it went,
with no statement of what a palette has to *do*. The result is measurable: with the new
`dev-tools/check-palettes.mjs`, **37 of 200 palette/role/theme pairs are below a usable contrast** —
16 of them "muted ink on board" (candy 1.45:1, paper 2.02, mono 2.02, ocean 2.03 …), 5 "thin grid on
board" (neon 1.07, candy 1.10, classic-dark 1.37), 4 "mark colour on board" (ocean 4.02, candy 2.98),
4 "cell base vs board" (forest 5, sunset 8 — a Pictogram cell that cannot be told from the board),
4 "accent ink on accent", 2 "thick grid", 2 "accent on board". Those are not taste questions: a
player either sees the grid or does not.

## The decision

1. **Keep the palette model, give it a contract.** A palette is a complete set of roles for one
   visual theme; a role that is missing or invisible is a defect, not a style.
2. **One colour per role.** Today `excludedColor` is used for three different jobs — the mark drawn
   on an excluded cell, the hover highlight (`chromeFrom` returns it as `over`), and the nonogram
   "marked" state. They must be separate roles; a hover highlight is not an error colour.
3. **Every palette defines every role**, in every theme it supports (`both`, or `light` + `dark`).
4. **Thresholds are enforced by evidence, not opinion.** `dev-tools/check-palettes.mjs` measures every
   palette × theme and reports the worklist; the pairs marked *enforced* fail the gate today, and the
   whole contract is enforced (`--strict`) once the tuning pass lands with the new roles.
5. **Tune by walking lightness, preserving hue.** A failing value moves along its own lightness axis
   until it meets the threshold (deterministic, and the numbers are recorded). No palette is
   redesigned by taste. The owner still reviews the colours — but the contract is not per-palette
   negotiable, because that is exactly how invisible colours got in.

## The roles

| Role | Used for | Threshold on `surface` |
|---|---|---|
| `bg` → **surface** | the board itself | ≥ 12 distance from the page background (enforced) |
| `cells[0..3]` | an unfilled cell (checkerboard) | cell base ≥ 10 distance from surface |
| `text` → **ink** | numbers, clues, letters on the board | ratio ≥ 4.5 |
| `textMuted` | secondary labels, hint numbers | ratio ≥ 3 |
| `lineThin` → **grid** | the "show grid" lines | ratio ≥ 1.6 |
| `lineThick` | block separators, the frame | ratio ≥ 3 |
| `confirmedMix` → **accent** | a filled marker (lamp, sea, node, tower) | ratio ≥ 4.5 |
| `accentInk` | anything drawn on top of an accent | ratio ≥ 4.5 on accent |
| `excludedColor` | x / dot marks on an excluded cell | ratio ≥ 4.5 |
| `hover` | pointer highlight | ≥ 8 distance, composited over the surface |
| **`given`** (new) | a pre-filled cell, as a background wash | ≥ 10 distance from surface, and distinguishable from an accent marker |
| **`markCandidate`** (new) | the `(?)` pencil mark | ratio ≥ 4.5, and distinct from `given` |
| **`error`** (new) | a cell/line that breaks a rule (mistake highlighting) | ratio ≥ 4.5 |
| **`satisfied`** (new) | a row/column count that is met (green in the owner's reference) | ratio ≥ 3 |
| `solvedBg` | the solved background | ratio ≥ 1.6 against the page |

## Consequences for the work in flight

- The **given tint**, the **mark colours** and **mistake highlighting** (backlog, Phase 1 items 5/7)
  are what create the four new roles, so they and the tuning pass are one job: add the roles, tune every
  palette to the contract, then switch `check-palettes.mjs` to `--strict` and let the gate hold it.
- No puzzle may hardcode a colour for these roles; they come from `resolveChrome()`
  (`interfaces/palette-chrome.md`), which is what "styles are global" means in practice.
- The measured worklist is in the checker's output, not copied here, so it cannot go stale (R2).
