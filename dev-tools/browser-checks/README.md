# Browser checks

Real-browser scripts, for UI behaviour that no Node test can cover (see `notes/testing.md`).
These are tooling, not private notes, so they're kept in the real repo under `dev-tools/`, unlike
`notes/` which isn't uploaded to GitHub.

Environment paths (Playwright module, Chromium binary) are read from environment variables with
fallbacks set to what this sandbox happens to use — **those fallbacks are not guaranteed to match
your environment.** If a script fails immediately on launch, that's almost certainly why; set
`PLAYWRIGHT_PATH` / `CHROMIUM_PATH` to your actual paths (`npm ls -g playwright`, and wherever
`npx playwright install` put its browser) rather than assuming the script is broken.

- `static-server.mjs` — tiny dependency-free static file server, `node static-server.mjs <root> <port>`.
- `p5stub.js` — kept only for re-running the creator page's historical p5 path without internet
  access. Pictogram's current player no longer loads p5; the smoke test's old cdnjs route is harmless
  but is no longer required for the player. It does NOT verify real canvas rendering.
- `smoke-player.mjs` — loads a Pictogram puzzle link in headless Chromium and checks: board size
  display, instructions text present, no page errors, and the settings-panel "Clear saved
  progress" button only clears progress-prefixed keys, not settings (confirms the 2026-10-04
  fix). Usage: `node smoke-player.mjs <repo-root-abs-path> <port> <puzzle-id>`.
- `../local-runner.mjs` — the local runner behind `Run-Local.cmd` at the folder root (the owner's
  Windows double-click). Serves the folder on `127.0.0.1`, opens Chrome, shows the Forge "Local
  tests" buttons, runs the quick / full / browser jobs and writes `TEST-RESULTS.md` at the folder
  root; it stops itself when the browser it opened is closed. The browser job needs
  `playwright-core` (one `npm install`, done by the .cmd) and a Chromium-based browser — Chrome or
  Edge, auto-detected, or `CHROMIUM_PATH`; the other jobs need nothing.
  Usage: `node dev-tools/local-runner.mjs [--port N] [--no-open]`.


Everything else that previously accumulated here (screenshots, raw captured output, several
near-duplicate exploratory variants of this same script) was removed 2026-10-04 — it was evidence
of past work already summarized in `notes/history.md`, not reusable tooling. If you need to run a
one-off check that isn't worth keeping, that's fine — just don't leave it in this folder.
