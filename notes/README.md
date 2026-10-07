# notes/ — index

Sent to the owner for inclusion — these notes are public. Read `AGENTS.md` in full first; that
file says what to do. This file says only **what to read for your task** and **where each kind of
fact lives**.

## Read for your task

| If your task… | Read |
|---|---|
| any task, always | `AGENTS.md` in full |
| your workstream | your sheet in `tracks/` |
| building against shared code | the matching file in `interfaces/` |
| touches a specific puzzle or shared component | the matching block in `state.md` |
| runs or claims a test | `testing.md` |
| relates to a design choice already made | the matching note in `decisions/` |
| picks up or proposes work | `backlog.md` |
| needs recent context | the last 3 entries of `history.md` |

Nothing else here is required reading. If a document isn't named for your task, it is reference.

## Where a fact lives (one home per fact)

| The question | Home |
|---|---|
| What must I do / not do? | `AGENTS.md` |
| What must shared code look like? | `interfaces/` |
| What exists now, and its limits? | `state.md` |
| Why is it built this way? | `decisions/` |
| What should be built next? | `backlog.md` |
| What do I run for this change? | `testing.md` |
| What happened, when, and by whom? | `history.md` |

## Documents

- `AGENTS.md` — the binding rules and invariants. Read in full.
- `interfaces/` — the frozen contracts every track builds against (board adapter, link codec,
  palette chrome, settings/progress, secret lock, asset versioning). Exempt from the cap.
- `tracks/` — one job sheet per workstream, plus `_template.md`. Ephemeral; nearly empty between
  rounds. Exempt from the cap.
- `state.md` — what exists right now, per component, with file paths and known limits.
- `testing.md` — what to run for a given change, and the sandbox's real limits.
- `backlog.md` — every planned item as one line: status + pointer.
- `history.md` — append-only log of the current generation.
- `decisions/` — one note per real design decision. Exempt from the cap.
  - `0001-svg-board-migration.md` — one shared SVG board layer; `p5` removed.
  - `0002-puzzle-folder-layout.md` — every puzzle lives under `PuzzleForge/`.
  - `0003-shared-board-chrome.md` — board colours come from the shared palettes.
  - `0004-forge-test-mode.md` — Test Mode lists fixed example links.
- `archive/` — retired documents and previous generations, including `gen-11/`. Never required
  reading.

Cap: 7 top-level `.md` files in `notes/` (currently 6 — one spare). `decisions/`, `interfaces/`,
`tracks/` and `archive/` are exempt.
