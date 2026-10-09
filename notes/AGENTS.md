# GoblinPuzzles — agent contract

Browser puzzle generators, free on GitHub Pages, no backend. Pictogram (picture → nonogram),
Hashi, Akari, Skyscrapers, Binairo and Futoshiki all have pages; more are planned.
`PuzzleForge/index.html` lists every puzzle and links the ones marked live.

**Owner handle:** read it from the git remote if you ever need it. Never hardcode a name — it
does not belong in these docs.

Read `README.md` first (the index), then this file in full, then only what the index names for
your task.

## Invariants — never broken, in any puzzle

1. **A puzzle's whole state lives in its URL.** No server, no database. Opening a link
   regenerates that exact puzzle. Generation is seeded from the secret message and the options:
   the same message + the same options always produce the same puzzle and the same link, so
   `Math.random` is never part of generation.
2. **Link formats are versioned; only the current version must work.** When a format changes,
   older links may stop opening. Links are examples, not a distribution channel: keep no legacy
   decoders, no "old links still work" paths, and spend no effort on backward compatibility
   unless the owner asks.
3. **Nothing too big for a URL is ever stored.** An uploaded image may shape a puzzle
   client-side; it never becomes part of the link.
4. **Every puzzle hides a message, XOR-locked against its own solution state.** So the solution
   must be a plain, checkable data structure, and a generator MUST guarantee exactly one
   solution — a second valid solution decrypts to garbage.
5. **One shared board layer, one drawing method.** Puzzles share styles and quality-of-life
   features. A puzzle supplies its content and its rules; it never brings its own renderer.
6. **A new puzzle starts from `shared/puzzle-template/`.** Copy it. Always.

## How work happens here

Agents may work in parallel, each starting from the same baseline commit. Shared contracts
(`notes/interfaces/`, the invariants, the rules) stay frozen while work is in flight (R8). Every
finished change is committed, pushed (R15) and steps the version (R7) — save points included. A
big version (a new number or suffix) is the owner's call; until then, keep stepping the patch.

Two consequences you must respect:

- **Every commit steps the version.** Run `node dev-tools/bump-build.mjs` before each commit; it
  bumps `GDP_BUILD` one patch step and re-points every `?v=` in the same pass (R7). Save points
  step it too — no commit ships an unchanged version.
- **You do not edit the baseline's shared contracts** (`notes/interfaces/`, the invariants, the
  rules) without the owner's approval. If you need one changed, request it; do not assume it
  changed.

## Rules

**R1 — Read this file first, then only what your job sheet names.** Nothing else is required
reading.

**R2 — One home per fact.** If a fact already lives somewhere, write a pointer, not a copy. Rule →
here; current fact → `state.md`; why → `decisions/`; plan → `backlog.md`; event → `history.md`;
interface → `interfaces/`.
Reasoning you produce — a research pass, a comparison with other implementations, an approach you
rejected — belongs in `history.md` (why this round) and `backlog.md` (what to reuse later). It is
never a new top-level document (R6).

**R3 — Stay in scope.** Do your job. Anything else you notice gets one line in your return's
`FOLLOW-UPS`, not a fix.

**R4 — Already-verified means done.** The record of what has already been run lives in
`testing.md` ("What has already been run on this baseline"). A recorded result is a fact. Re-run a
check only if your change touches the code it covers, or the owner asks — otherwise cite the
recorded result and say which line you relied on. Never re-run something unchanged "just in case".
Run nothing by default: answering a question, reading code, or a docs-only edit needs no test. The
slow, browser and visual checks belong to the owner (R17), not to you.

**R5 — Evidence, or say "unrun".** Name the check, run it, and report **pass / fail / unrun** plus
what it did **not** cover. Never write "verified" without saying how. Source that "looks right" is
not a result.

**R6 — Renames, moves, splits and new documents need the owner first.**
A new puzzle folder (`PuzzleForge/<Name>/`) copied from `shared/puzzle-template/` is the normal build
flow, not a move — no approval needed. Research and reasoning never need a new document either:
they go to `history.md` / `backlog.md` (R2).

**R7 — Every commit steps the version.** Run `node dev-tools/bump-build.mjs` before each commit:
`GDP_BUILD` moves one patch step (`13.0.0logic` → `13.0.1logic`) and every `?v=` is re-pointed in
the same pass. Even a save point steps it — no commit ships an unchanged version. Only the owner
calls a big version (`13.1.0logic` or a new round); until then keep stepping the patch.

**R8 — The baseline is frozen for the round.** The files in `notes/interfaces/` and the rules here
do not change while a round is in flight. A change is a request, not an edit.

**R9 — A wrong fact is fixed where it lives; history is append-only.** Never overwrite an old
history entry; add a correcting one.

**R10 — Write a decision note only when a future agent would re-argue the choice.** Not for
reversible details (cell sizes, wording, colours).

**R11 — Two documents disagreeing:** precedence is `AGENTS.md` > `state.md` > `decisions/` >
`history.md`. Fix the loser in the same task, or file one backlog line.

**R12 — At most 7 top-level `.md` files in `notes/`.** `decisions/`, `interfaces/`, `tracks/` and
`archive/` are exempt, so recording logic there never raises this question. A puzzle's standard
rules, clue policy, difficulty and generator approach belong in a `decisions/` note
(`decisions/0005-puzzle-rules-and-clue-policy.md`). Adding a top-level document means merging,
retiring, or asking the owner.

**R13 — Report capability per session, confirmed by trying once.** Never assume it from an agent's
name or family. "I could not do X" is only allowed after you tried X once and say what happened.

**R14 — Delivery and return.** See the two sections below.

**R15 — Commit every finished change; never leave work unsaved.**

- After each change you finish and verify, commit it:
  `git add -A && git commit -m "<one line: what changed>"`. A commit is a save point — with one,
  any mistake costs minutes, not hours.
- Your copy has no git history yet (a plain folder)? Run `git init` once, then commit as above.
- No GitHub access? Keep committing anyway — local commits are save points in your copy.
- Push access (the combiner, or an agent working with the live repo)? Push after every commit too,
  through the authenticated remote tool (`cloud_git push`), not a plain local `git push`.
  **A commit is not a save point until it is on the remote.** Cloud sessions are rebuilt from
  GitHub; a local-only commit is lost with the sandbox. Save points must never live on one machine.
  **Notes and documentation commits go to `main`, not to a side branch** — the next session has to
  be able to read the record even if this one ends mid-task (owner, 2026-10-09). Code changes may be
  prepared on a branch and fast-forwarded into `main` in the same session.
- **Long jobs leave save points in flight, not only at the end.** The moment a new piece of work
  exists and parses — a logic module before its board, a generator before its player — commit and
  push it; a `WIP:` prefix is fine (`git commit -m "WIP TrainTracks: logic module, solver mid-debug"`).
  A half-done module costs one fix after a crash; an uncommitted one costs the whole session.
- Keep a short **In flight** block at the top of `notes/state.md` from the first save point of a long
  job on: what is half-done and the exact place to pick it up. Update it at every save point, clear
  it when the work lands. The next session reads it first.
- To undo, never rewrite history — no `reset --hard`, no rebase, no force-push. Add a correcting
  commit or `git revert <sha>`.
- A save point also steps the version (R7). The baseline contracts stay frozen (R8).

**R16 — Answer first, tools second.** When the owner asks a question or for a report, the answer
comes from `notes/`, the reasoning already visible in this conversation, and read-only inspection
(`git status`, `git log`, `grep`, `sed`, `ls`) — no tests, no installs, no edits until the answer is
delivered. Answer in your own words: read, think and synthesize; never hand back a verbatim echo of
a note or a quote as the whole answer. "Check X" means look at X and report; fixing it is a separate instruction. Drifting off
the asked task is the most expensive failure this project has: it is the one thing the owner cannot
recover.

**R17 — Test ownership: cheap for the agent, hard for the owner's runner.** The agent's own tests must be few, easy and
essential: fast, deterministic (fixed seed — no clock, network or random), failing only for a real
defect, with no flaky failure mode. The agent runs the fast
Node gate (`node dev-tools/check-all.mjs`) when a change needs it, plus the one puzzle `test-*.mjs`
that covers a touched logic file. Everything slow, browser-based or visual belongs to the owner
through `Run-Local.cmd` (Quick / Full / Browser jobs in `dev-tools/local-runner.mjs`); results come
back in `TEST-RESULTS.md`. Concretely: never reinstall a browser or Chromium libraries to run a
check, never run a browser pass twice for the same change, never re-run a recorded check, and put a
new hard test in the owner's runner rather than in your own sandbox loop. `testing.md` holds the
split.

## Delivery format

Every reply that changes files uses this shape, one or more parts:

`===== GoblinPuzzles — : PART n/N — `

One or two lines of prose: what this changes and why.

- One fenced code block per part; prose stays outside it.
- `FILE:` full path from the repo root, with backslashes: `GoblinPuzzles\notes\README.md`.
- `[ADD]` new file (full content) · `[EDIT]` exact old → new · `[REPLACE]` whole file.
- No placeholders inside the block; owner-supplied values go outside it.
- If a `-` (old) line cannot be reproduced character-for-character, say so instead of guessing.

## Return report

Every track job ends with exactly this report. Keep it short. It is a record for the owner, the
combiner and the next agent — not a place to repeat results `testing.md` already holds. Cite those,
do not re-run them.

```
BASE: <the version you were handed>
JOB: <one line>
FILES: <paths you touched>
RAN: <exact command> -> <pass / fail / unrun + what it covered, or "see testing.md record">
UNVERIFIED: <what you did not test, and why>
FOLLOW-UPS: <one line each>
```
