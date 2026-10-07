# notes/ — index

Sent to the owner for inclusion — these notes are public. Read this first: it says what to read for your task, and where each kind
of fact lives. Then read `AGENTS.md` in full.

## Read for your task

| If your task… | Read |
|---|---|
| any task, always | `AGENTS.md` in full |
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
| What exists now, and its limits? | `state.md` |
| Why is it built this way? | `decisions/` |
| What should be built next? | `backlog.md` |
| What do I run for this change? | `testing.md` |
| What happened, when, and by whom? | `history.md` |

## Documents

- `AGENTS.md` — the binding rules and invariants. Read in full.
- `state.md` — what exists right now, per component, with file paths and known limits.
- `testing.md` — what to run for a given change; the sandbox's real limits.
- `backlog.md` — every planned item as one line: status + pointer to its decision note.
- `history.md` — append-only log of the current generation. The 2026-10-04-and-earlier generation
  is in `archive/history-2026-10-05.md`.
- `decisions/` — one note per real design decision:
  - `0001-svg-board-migration.md` — one shared SVG board layer; `p5` removed.
- `archive/` — retired documents (`history-2026-10-05.md`, `overview-2026-10-05.md`,
  `svg-board-and-popout-2026-10-04.md`). Never required reading.

Cap: 7 top-level documents in `notes/` (currently 6 — one spare). `decisions/` and `archive/`
are exempt. Adding a document means merging, retiring, or asking the owner.

- 0002-puzzle-folder-layout.md — every puzzle lives under PuzzleForge/.
- 0003-shared-board-chrome.md — board colours come from the shared palettes.
- 0004-forge-test-mode.md — Test Mode lists fixed example links.
