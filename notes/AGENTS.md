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

## How work happens here

One version is handed out to every agent — call it the **baseline**. Agents work separately, each
on one job, each starting from that same baseline. Nothing in the baseline changes while the work
is in flight. When everyone is done, one agent (the **combiner**) merges the results and makes the
single next version. You are one track agent unless you are told you are the combiner.

Two consequences you must respect:

- **You do not change the version.** Leave `GDP_BUILD` and every `?v=` exactly as handed to you.
  Only the combiner bumps it, once, for the whole round.
- **You do not edit the baseline's shared contracts** (`notes/interfaces/`, the invariants, the
  rules). If you need one changed, request it; do not assume it changed.

## Rules

**R1 — Read this file first, then only what your job sheet names.** Nothing else is required
reading.

**R2 — One home per fact.** If a fact already lives somewhere, write a pointer, not a copy. Rule →
here; current fact → `state.md`; why → `decisions/`; plan → `backlog.md`; event → `history.md`;
interface → `interfaces/`.

**R3 — Stay in scope.** Do your job. Anything else you notice gets one line in your return's
`FOLLOW-UPS`, not a fix.

**R4 — Already-verified means done.** The record of what has already been run lives in
`testing.md` ("What has already been run on this baseline"). A recorded result is a fact. Re-run a
check only if your change touches the code it covers, or the owner asks — otherwise cite the
recorded result and say which line you relied on. Never re-run something unchanged "just in case".

**R5 — Evidence, or say "unrun".** Name the check, run it, and report **pass / fail / unrun** plus
what it did **not** cover. Never write "verified" without saying how. Source that "looks right" is
not a result.

**R6 — Renames, moves, splits and new documents need the owner first.**

**R7 — The version is frozen for the round.** Do not change `GDP_BUILD` or any `?v=`. Only the
combiner bumps it, once.

**R8 — The baseline is frozen for the round.** The files in `notes/interfaces/` and the rules here
do not change while a round is in flight. A change is a request, not an edit.

**R9 — A wrong fact is fixed where it lives; history is append-only.** Never overwrite an old
history entry; add a correcting one.

**R10 — Write a decision note only when a future agent would re-argue the choice.** Not for
reversible details (cell sizes, wording, colours).

**R11 — Two documents disagreeing:** precedence is `AGENTS.md` > `state.md` > `decisions/` >
`history.md`. Fix the loser in the same task, or file one backlog line.

**R12 — At most 7 top-level `.md` files in `notes/`.** `decisions/`, `interfaces/`, `tracks/` and
`archive/` are exempt. Adding a top-level document means merging, retiring, or asking the owner.

**R13 — Report capability per session, confirmed by trying once.** Never assume it from an agent's
name or family. "I could not do X" is only allowed after you tried X once and say what happened.

**R14 — Delivery and return.** See the two sections below.

**R15 — Commit every finished change; never leave work unsaved.**

- After each change you finish and verify, commit it:
  `git add -A && git commit -m "<one line: what changed>"`. A commit is a save point — with one,
  any mistake costs minutes, not hours.
- Your copy has no git history yet (a plain folder)? Run `git init` once, then commit as above.
- No GitHub access? Keep committing anyway — local commits are save points in your copy.
- Push access (the combiner, or an agent working with the live repo)? Push after every commit too:
  `git push`. Save points should not exist only on one machine.
- To undo, never rewrite history — no `reset --hard`, no rebase, no force-push. Add a correcting
  commit or `git revert <sha>`.
- A commit changes no files: the version stays frozen (R7) and the baseline contracts stay frozen
  (R8).

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
