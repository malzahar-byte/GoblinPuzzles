# Goblin Does Puzzles — agent contract

This file binds every agent. It is deliberately short so that reading it in full is cheap. Read
`README.md` first (the index), then this in full, then only what the index names for your task.

## The product

Browser-based logic puzzle generators, hosted free on GitHub Pages, no backend. Pictogram
(picture → nonogram), Hashi, Akari, Skyscrapers, Binairo and Futoshiki all have pages; more are
planned. `PuzzleForge/index.html` lists every puzzle and links the ones marked live.

Owner handle: GoblinDoesStuff.

## Invariants — never broken, in any puzzle

1. **A puzzle's whole state lives in its URL.** No server, no database. Opening a link
   regenerates that exact puzzle.
2. **Link formats are versioned and never broken.** Old links keep working forever.
3. **Nothing too big for a URL is ever stored.** An uploaded image may shape a puzzle
   client-side; it never becomes part of the link.
4. **Every puzzle hides a message, XOR-locked against its own solution state.** So the solution
   must be a plain, checkable data structure, and a generator MUST guarantee exactly one
   solution — a second valid solution decrypts to garbage.
5. **One shared board layer, one drawing method.** Puzzles share styles and quality-of-life
   features. A puzzle supplies its content and its rules; it never brings its own renderer.
6. **A new puzzle starts from `shared/puzzle-template/`.** Copy it. Always.

## Where things go

```
GoblinPuzzles/                repo root
├── shared/                   generic code every puzzle reuses: gdp-settings.js, gdp-palettes.js,
│                             gdp-theme.css, gdp-ui.js, gdp-bitseq.js, gdp-math-utils.js,
│                             gdp-board.js + gdp-board.css (the shared SVG board shell),
│                             gdp-fresh.js, gdp-secret.js, puzzle-template/
├── dev-tools/                repo-wide tooling: check-integration.mjs, check-docs.mjs,
│                             browser-checks/
├── notes/                    documentation. Sent to the owner for inclusion; these files are public.
└── PuzzleForge/              landing page + every puzzle: Pictogram, Hashi, Akari, Skyscrapers,
                              Binairo, Futoshiki
```

Shared vs puzzle-specific, applied in order: **rename test** (rename every puzzle-specific word —
still sensible? it was generic), **what-does-it-know-about** (puzzle rules → puzzle; site
mechanics → shared), **dependency direction** (`shared/` never imports puzzle code),
**second-consumer** (don't extract on spec, unless waiting guarantees doing it twice).

## Rules

**R1 — Starting.** Read `README.md` (index), then this file in full. Then read only what the
index names for your task. Nothing else is required reading.

**R2 — Writing a fact.** If it already exists somewhere, write a pointer instead. If it exists
nowhere, pick the home by type: rule → here, current fact → `state.md`, decision → `decisions/`,
plan → `backlog.md`, event → `history.md`.

**R3 — Notice something outside your task.** File one `backlog.md` line. Don't fix it.
Unapproved is not the same as small — typos and one-line fixes included.

**R4 — Already verified means done.** Don't re-run it. `history.md` or `state.md` saying a check
passed is a fact. Re-run only if your change touches that code, or the owner asks.

**R5 — Reporting.** Give the file and line, the exact command you ran, its actual output, and what
was stubbed or untested. Never write "verified" without saying how, and if you couldn't test
something, say that plainly.

**R6 — Restructuring.** Want to rename, move, split, or "do it a better way"? File a `backlog.md`
line and wait for the owner. This project is shared; unapproved structure breaks other agents.

**R7 — Finishing.** Append one `history.md` entry: `## YYYY-MM-DD — Name — one line`, then ≤5
short bullets of what and why. No rationale essays (that's a decision note), no figures that
belong in `state.md`. Pick a name not already used in the file.

**R8 — Finding a wrong fact.** Fix it where it lives (`AGENTS.md`, `state.md`, `testing.md`, a
decision note). In `history.md`, append a correcting entry — never edit an old one. History is
append-only until the owner retires a generation to `archive/` (archive, not delete).

**R9 — Thinking you're done.** Run `node dev-tools/check-docs.mjs` and
`node dev-tools/check-integration.mjs`; get both clean. Update `state.md` if reality changed. Add
the history entry. Reply with: what changed / what I ran / what's left.

**R10 — Editing documentation.** The same gate as code applies (R9), and the same approval rule
as R6 applies to adding, moving, or retiring a document.

**R11 — Decision notes.** Write one when a reasonable person could have chosen otherwise *and* the
choice constrains future work — the test is "would a future agent re-argue this if the note
didn't exist?" Not for reversible details: cell sizes, library versions, wording, colours.

**R12 — Two documents disagreeing.** Precedence is `AGENTS.md` > `state.md` > `decisions/` >
`history.md`. Fix the loser in the same task, or file one backlog line.

**R13 — Documents.** At most 7 top-level files in `notes/`; `decisions/` and `archive/` are
exempt. Adding one means merging, retiring, or asking the owner.
`overview.md` was retired to `archive/` on 2026-10-05; no live pointer names it.

**R14 — Delivering file changes.** While the delivering agent is a DeepSeek agent, every reply that changes files uses this exact shape. An agent that can hand over a file or an archive directly is not bound by this rule and may answer however suits it.

## Each part looks exactly like this

`===== GoblinPuzzles — : PART n/N — `

One or more lines of prose: what this changes and why.

- Parts run in order, PART 1/N … PART N/N. Send the whole job; split into another reply only if a part won't fit — never cut inside a FILE: block.
- One fenced code block per part. Prose stays outside it.
- FILE: paths are full, from the repo root, with backslashes: `GoblinPuzzles\\notes\\README.md`
- `[ADD]` new file (full content) · `[EDIT]` exact old → new · `[REPLACE]` the whole file.
- The - lines must match the file character-for-character, spaces included. If you cannot reproduce them exactly, say so instead of guessing.
- No placeholders inside the block; owner-supplied values go outside it.
- The =====, title, Apply on top of:, MANIFEST and END PART lines are required.
