# Interface — asset versioning

`shared/gdp-fresh.js` exports `GDP_BUILD`, `showBuildVersion`, `setupFreshButton` and
`loadLatestVersion`.

## Contract

- `GDP_BUILD` is the single version string. `showBuildVersion()` renders it as `v<GDP_BUILD>` into
  `#buildTag`; `setupFreshButton(button, versionEl)` wires the `↻ Fresh` button and the label.
- **Every first-party CSS/JS URL carries `?v=<GDP_BUILD>`, including every local ES-module import
  edge** — a query on the entry module does not propagate, so each import needs its own.
- GitHub Pages caches aggressively, so a new build must be a new URL. Ctrl+Shift+R reloads the
  document, not the modules it imports.
- `loadLatestVersion()` clears app-owned caches (`gdp-*`) and any service worker, then reloads
  with a unique `_gdp` query. It cannot purge the CDN's copy; waiting ~10 minutes is the fallback.
- `check-integration.mjs` strips the `?v=` query when resolving imports.

## Rules

- **Every commit steps `GDP_BUILD`** by one patch step and re-points every `?v=` in the same pass:
  `node dev-tools/bump-build.mjs` before each commit, save points included (`AGENTS.md` R7).
- A build that needs a fresh load can rely on the `_gdp` reload without changing the build string.
