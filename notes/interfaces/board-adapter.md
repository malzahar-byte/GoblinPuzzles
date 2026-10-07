# Interface — the shared board shell

`shared/gdp-board.js` exports `mountBoard(container, adapter, opts)` and returns a board handle.
Rationale: `decisions/0001-svg-board-migration.md`. The shell never imports puzzle code.

## The shell owns

SVG root + `viewBox`, fit-to-holder, zoom (buttons, wheel, keys), scroll-bar panning, pointer
routing + capture, hover layer, drag painting (one drag = one undo step), the undo/redo stack, and
the keyboard shortcuts for those. Coordinates the shell passes to the adapter are **unzoomed board
pixels**.

## The adapter supplies

| Method | Contract |
|---|---|
| `world()` | `{ width, height }` in board pixels |
| `render(world)` | an SVG-markup string for the current state |
| `hitTest(pt, phase, startAction, ev)` | an action for a click/drag, or `null` |
| `apply(action)` / `unapply(action)` | mutate / undo the model |
| `isSolved()` | boolean; drives the solved notice |
| `hover(world, pt)` | optional; highlight SVG for a pointer position |
| `onSolved()` | optional; fires once, first time `isSolved()` is true |
| `encodeState()` / `decodeState(s)` / `hasAny()` / `reset()` | saved-progress support |

`pt` is `{ x, y, button }` with `button` in `'left' | 'right' | 'touch'`. `phase` is `'down'` or
`'move'`.

## Options

`onHistoryChange(undoCount, redoCount)`, `onChange()`, `onKey(ev)`, `onSolved()`, `minZoom`,
`maxZoom`, `zoomStep`. **`onSolved` may come from the adapter OR the options** — the shell takes
`adapter.onSolved || opts.onSolved`. Returning `null` from `hitTest` means "not my event, ignore".

## Rules

- **Hit-test by position, not by DOM target.** Compute the cell/edge from `pt` (as Akari,
  Skyscrapers, Binairo and Futoshiki do). Do not rely on `ev.target` — a drawn element drawn on
  top of a hit area can swallow the click (this is a known Hashi defect).
- The board box is the **only** scroller; `.gdp-board-wrap` must stay non-scrolling.
- A puzzle restored already solved starts locked, not just showing its message.
