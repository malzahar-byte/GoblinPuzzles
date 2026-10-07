# Puzzle template

Starting point for a new puzzle under `GoblinPuzzles/`. Copy, don't reinvent — this exists
because every puzzle so far has hand-written its own version of this and gotten at least one
detail wrong (a hardcoded settings key, a missing pre-paint step, a theme snippet that was never
added at all). See `notes/history.md` for the specific cases.

## What's here

- `settings.js` — copy to `<YourPuzzle>/js/util/settings.js`, fill in the three `<PUZZLE>`
  markers. This is the ONLY file allowed to contain your settings key as a string literal.
- `preboot-snippet.html` — copy this exact `<script>` tag into the `<head>` of every page your
  puzzle has (creator, player, any other page). Replace the key to match `settings.js` exactly.

## What you get for free by using these

- The settings store, light/dark/auto theme cycling, and all 10 named colour themes — all from
  `shared/`, none of it reimplemented.
- No flash-of-wrong-theme on load (the preboot snippet).
- A settings key that can't silently drift out of sync between your pages, because there's only
  one place it's written by hand.

## What you still have to build yourself

- Your puzzle's own logic, grid/board rendering, and link/encoding format.
- Your settings panel's extra fields (beyond theme) and the UI to edit them.
- If your puzzle has saved progress separate from settings: use `PROGRESS_PREFIX` the way
  Pictogram does (see `Pictogram/js/util/settings.js` and `Pictogram/js/player.js`'s
  `clearPictogramProgress`) so a "clear progress" action can't touch another puzzle's data.

## Before you call it done

Run `node dev-tools/check-integration.mjs` from the repo root. It checks the things listed above
mechanically — it does not replace reading `AGENTS.md`, but it catches the specific mistakes
this template exists to prevent.
