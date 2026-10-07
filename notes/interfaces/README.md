# interfaces/ — the frozen contracts

These are the shared boundaries every track builds against. They are **frozen while a round is in
flight** (see `AGENTS.md` R8): do not edit them during a round — request a change instead. The
combiner applies interface changes at integration and bumps the version.

- `board-adapter.md` — `mountBoard(container, adapter, opts)` and the adapter shape.
- `link-codec.md` — `parseLink` / `encodeLink` framing, versioning, and the secret payload.
- `palette-chrome.md` — `resolveChrome()` output keys and how puzzles consume them.
- `settings-progress.md` — the settings store and the `PROGRESS_PREFIX` conventions.
- `secret-lock.md` — `shared/gdp-secret.js` and the padded XOR key.
- `assets-versioning.md` — `GDP_BUILD` and the `?v=` rule on every import edge.

A contract states the shape and the rules, not the implementation. If reality and a contract
disagree, the contract is wrong and must be fixed where it lives (R9), by the combiner.
