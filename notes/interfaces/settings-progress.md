# Interface — settings and saved progress

`shared/gdp-settings.js` is a JSON-in-localStorage store. Each puzzle has a thin
`js/util/settings.js` wrapper that adds `applyTheme`, `setupThemeButton`, `currentTheme` and
`PROGRESS_PREFIX`.

## Keys

- **Settings:** `gdp-<puzzle>-settings` (one JSON object per puzzle). Shared helpers read and write
  it; a settings key must be defined **once**, in that puzzle's `settings.js` — never hardcoded or
  duplicated elsewhere. `check-integration.mjs` enforces this.
- **Progress:** every saved-progress key starts with the puzzle's `PROGRESS_PREFIX`
  (`gdp-<puzzle>:`), so "Clear saved progress" can remove exactly those keys and keep settings.
  Save points and timer keys are `PROGRESS_PREFIX + id + suffix` (`#checkpoint`, `#time`).

## Rules

- "Clear saved progress" removes only `PROGRESS_PREFIX` keys, never settings.
- Settings and progress are separate namespaces; clearing one must not touch the other.
- `dev-tools/` files are exempt from the duplicate-key check.
