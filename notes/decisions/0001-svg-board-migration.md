# 0001 — One shared SVG board layer; p5 removed

**Status:** accepted (owner-approved 2026-10-04). **Supersedes:** the retired research document
`notes/archive/svg-board-and-popout-2026-10-04.md`, whose content moved here.

## Context

The owner asked whether a puzzle could pop out into a small always-on-top window (like video
picture-in-picture) so people can solve while using other tabs.

Working out how exposed the real problem: Pictogram (p5 canvas) and Hashi (hand-built inline SVG)
are drawn two incompatible ways. A pop-out would be easy for one and extra work for the other, and
the mix conflicts with the owner's rule that puzzles must not be rebuilt from scratch each time —
they share styles and quality-of-life features, so they must share one board layer and one
drawing method.

Why Pictogram's canvas is the blocker, from the actual p5 1.4.0 file the owner supplied (the exact
file Pictogram loads from cdnjs; 4.2 MB, debug build):

- All input handlers (mouse down/up/move, keys, touch, wheel, resize) are registered on the main
  page `window` (`_events` table ~line 62797, registration loop ~63241, with a comment that a
  container element does not work for key events). A click inside a pop-out window never reaches
  the sketch unless events are forwarded or handlers are attached to the canvas.
- Dragging is ordinary ("mouse moved while a button is down"), tracked by window-level
  press/release. Mouse position is `clientX` minus the canvas's own `getBoundingClientRect()`,
  corrected for CSS scaling (~78170–78215), so forwarded events with the same coordinates would
  still land on the right cell.
- The draw loop (~63027–63069) is scheduled on the **main window's** `requestAnimationFrame`, and
  Pictogram never stops it. Browsers pause animation frames in hidden tabs — exactly the pop-out
  case.
- Pictogram uses only 19 p5 functions: `noStroke, fill, noFill, stroke, strokeWeight, strokeCap,
  rect, line, circle, text, textSize, textAlign, translate, scale, background, createCanvas,
  resizeCanvas, keyIsDown`, plus the input hooks.

p5 was almost certainly chosen for convenience when Pictogram was forked — a whole-board redraw
from state, one script tag, built-in mouse buttons and scaling, a canvas that copes with huge
grids. Fine for a normal page; nobody designed it for a second window. (The upstream player is
not in the archive, so this is inference, not evidence.)

## Decision

1. **Model / view split.** Model = state, moves, solved check, solver, generator, link
   codec — pure code, testable in Node, which is already how the logic is written. View = draws a
   state and turns pointer input into moves.
2. **One shared board layer in `shared/`**, providing the holder, fit-to-window, wheel zoom,
   scroll-bar panning, drag painting, hover highlight, undo/redo, timer, save points, solved
   notice and message reveal, and pop-out. A puzzle supplies only what to show and what a click
   or drag does.
3. **SVG is the one drawing method**, for every puzzle. It needs no draw loop (so pop-out and
   hidden tabs are safe), is themed with CSS variables, stays sharp at any zoom, is plain text an
   agent can generate and test offline, and adds no dependency and no build. For grids: draw lines
   as two shapes, create a cell shape only when a cell is marked, and use **one hit area that
   computes the cell from the pointer position** (which also drives drag painting). If SVG ever
   proves too slow, the shared layer switches renderer for all puzzles at once behind the same
   interface — individual puzzles never choose.
4. **p5 is removed** once Pictogram has moved. Staged: (a) build the shell with Hashi as the
   proving ground (it is still a draft), (b) separate Pictogram's model from its drawing,
   (c) replace the 19 p5 calls with the shell's SVG view, (d) delete p5 and its 4 MB debug build.
5. **Not changed by any of this:** link formats and versions, XOR-locked secret messages,
   unique-solution generation, SteamGifts handling, per-puzzle key prefix, the Forge landing page.
   The secret system is independent of drawing: the creator derives a key from the solution state,
   the player decrypts with the board's current state, and "solved" is a rule check — so any
   renderer works as long as the state is a plain data structure giving the same bits for the
   solution and for the player's board, ignoring pencil marks (e.g. WHITE and EMPTY count the
   same).

## Consequences

- Every feature in the checklist (Appendix B) must survive the migration. Don't re-derive that
  list; read it.
- The timer's definition of "active" must change: today it counts only while the tab is visible
  **and focused**, which would stop it while playing in a pop-out.
- **Soft spot:** wheel zoom at 60×60 measured ~30 fps in software-rendered headless Chromium.
  Unknown whether a real GPU fixes it. Possible fixes inside the shared layer: scale with a CSS
  transform instead of resizing the SVG, limit repaint work, hide detail when zoomed out.
- No canvas renderer and no side-by-side visual comparison were built — only needed if SVG fails
  at 60×60.
- The migration is blocked on one owner action: run the test page on real hardware.

## Open questions

1. Is SVG smooth enough at 60×60 on a real computer with a GPU? Owner to run
   `nonogram-svg-board-test.html` and send the copied results.
2. The zoom technique at large sizes (see the soft spot above).
3. Whether browsers keep the opener tab's animation frames alive while a pop-out is open — unknown,
   and avoided by design.
4. The largest Hashi board size the owner wants. Hashi's draft limits stand until then.
5. pzpr.js internals (where it attaches listeners, how far it can be restyled) were not read.
   Game-engine and scene-graph libraries were not evaluated.

## Appendix A — how this was reached

1. Pop-out idea. Chrome/Edge/Firefox desktop have the *Document Picture-in-Picture* API: an
   always-on-top window holding arbitrary HTML, driven by the same page script. The board element
   would be moved into it.
2. First claim (later corrected): Pictogram was called "harder" because of keyboard shortcuts and
   an invented "paint-mode switch". Wrong on both — the owner pointed out every puzzle uses
   left/right click and dragging, so the difference had to be elsewhere.
3. The real difference, found in the code: `Pictogram/js/player.js` uses p5's sketch-level handlers
   (`p.mousePressed`, `p.mouseDragged`, `p.mouseReleased`, `p.keyPressed`); Hashi puts its click
   handler on the board element itself. Confirmed against the real p5 file (see Context).
4. The owner's insight that settled the direction: if all puzzles share styles and QOL, a mix of
   drawing methods is unacceptable. An earlier proposal to let each puzzle pick its own renderer
   contradicted that rule and was withdrawn.

**pzpr.js (the engine behind puzz.link) — evaluated, not adopted.** MIT licence (sabo2/pzprjs and
the active fork robx/pzprjs). 100+ puzzle types, SVG or canvas, player/editor/viewer modes,
undo/redo, trial mode, `puzzle.check()`, runs in Node without a browser, exposes input as calls
(`mouse.moveTo / lineTo / inputEnd`, `key.inputKeys`). Each puzzle type is a module providing
input handling, board model, rendering, link encoding, answer checks, tests. Rejected because: it
needs a `make` build (agent sandboxes have no network); it has its own link format, so every
puzzle would need an adapter converting givens and reading answers back as key bits; our puzzles
(image-to-nonogram, crossword generator, chained mode) don't fit a pencil-puzzle editor; and we
don't know where it attaches listeners or how far it can be restyled. **Worth consulting** when
building Slitherlink/Nurikabe-type input and rule checking.

**SVG vs canvas, generic chart benchmarks (not our boards).** SVG is fine into the low thousands
of elements; canvas stays flat at tens of thousands but loses accessibility and per-element
events; canvas cost grows with pixel area (matters when zooming), SVG does not care about drawing
size. Chart libraries often mix them with a size threshold. General guidance only — which is why a
real test was needed.

**Background tabs.** Most browsers stop `requestAnimationFrame` in hidden tabs and throttle
timers. SVG/DOM needs no draw loop, because the browser repaints it in whichever window holds it.
A canvas must be redrawn on change from the window that shows it.

**Document Picture-in-Picture facts.** Desktop only: Chrome/Edge 116+ (one source says 130),
Firefox 151 (May 2026), not Safari, not mobile. One pop-out window per browser at a time. Opening
needs a user click. Stylesheets must be copied into the new window. The window behaves like a
blank same-origin window opened with `window.open`. Resizing from code needs a user gesture; the
user can resize by hand within browser limits. Fullscreen is disabled inside it. It can steal
keyboard focus.

## Appendix B — features that must survive the migration

Verified in `Pictogram/js/player.js` and `index.html` at the time of writing.

| Feature | How it works today | Needed in the new shared layer |
|---|---|---|
| Fill / mark cells | Left click toggles black; right click toggles white (cross); touch taps cycle empty → black → white | Same, via pointer events (covers touch) |
| Drag painting | `handleDragEvent` rules based on the starting action's from/to values; drags only count over the board | Same rules, with pointer capture so a drag survives leaving the board |
| Click a hint number to grey it out | `TOGGLE_HOR_HINT` / `TOGGLE_VER_HINT`; dragging along one hint line toggles several | Hints need hit areas too, not only the grid |
| Undo / redo | Batched: one drag = one undo step; buttons, Ctrl+Z / Ctrl+Y, arrow keys | Move into the shell as a general action stack |
| Hover row/column highlight | `drawPosHighlight` shades the hovered row and column including hints | Two moving translucent rectangles |
| Zoom | Buttons, +/− keys, arrow up/down, auto-fit on load | Keep; add wheel zoom; fit to the holder, not the window |
| Timer | Counts only while `windowActive()` = tab visible **and focused** | **Must change:** "active" must include the pop-out window |
| Save / load / reset point | Shift+S / Shift+L / Shift+R and buttons | Keep; keyboard stays secondary |
| Saved progress + clear | Prefixed keys `gdp-pictogram:…`; "Clear saved progress…" with confirm | Keep; each puzzle keeps its own prefix |
| Settings | Theme, board palette, empty-square mark, show-timer | Keep, shared between puzzles |
| Board size display | `showBoardSize()` | Keep |
| Secret message | Plain text or SteamGifts link; box cleared before filling | Keep exactly; pop-out shows only a "solved — open full page" notice |
| Keyboard shortcuts | Handled by p5 on the main window | Mouse-only in the pop-out; full keys on the page |

## Appendix C — pop-out behaviour, as agreed with the owner

Not built. Holds only the board, no control strip. Mouse only: left/right click, drag painting,
wheel zoom, scroll bars for panning. Fit-to-window uses the pop-out's own size and refits when
resized; the wheel zooms around the cursor. On solve it shows "Solved — open full page to see your
message", and clicking returns the board to the tab holding the message. Manual button only, shown
only in supporting browsers. Desktop only. Progress and timer need no sync (same page script). No
decision made about auto-opening on tab switch.

## Appendix D — mistakes made while researching this

Kept because they are what several rules in `AGENTS.md` exist to prevent.

1. **Wrong belief about its own limits.** The researching agent said it could not test browser
   behaviour, repeatedly, without checking — while the sandbox had Playwright and headless
   Chromium. **Rule: try the tool once before saying it can't be done, and say what was actually
   attempted.** (R5)
2. **Treated a placeholder as a fact.** The 5–14 size range was its own precaution in the Hashi
   creator, but it later argued "most boards are small" from it. Larger sizes were never attempted,
   so there was no "trouble generating bigger ones". **Rule: test at the largest sizes the owner
   actually wants.**
3. **Wrong estimate stated confidently.** It estimated 4,500–7,000 SVG elements for a 60×60 board
   by assuming one element per cell. The real count with the design above is 578.
4. **Invented a feature.** The "paint-mode switch" does not exist in Pictogram. It had not read
   the code before describing it.
5. **Explained from memory, then admitted it.** It described p5's listener behaviour from memory,
   then claimed it couldn't read p5, while it had web tools it never tried on the library file.
   The Context section above now comes from the actual file.
6. **Mis-framed how puzzles differ.** It said puzzles "differ in drawing method" and proposed
   per-puzzle renderers. The real differences are in *content* (cells + hints, islands + bridges,
   edges); drawing is shared.
7. **Guess presented as analysis.** A first A/B/C options table was shaped like research but was a
   guess.
8. **Not logging corrections.** Several corrections were first given only in chat; wrong numbers
   in `history.md` ("3 skipped cases", "5 hand-made solver cases") were corrected by later
   entries. Correct values are 5 and 3. A zip was briefly deleted before its replacement existed
   (nothing lost). **Rule: R8.**
9. **Over-long answers.** It repeatedly overwrote and confused the owner. **Rule: answer the
   question asked, plainly.**

The owner rules it listed are now `AGENTS.md`'s invariants and rules — not restated here.

## Addendum (2026-10-04) — the shell interface, as built

`shared/gdp-board.js` exposes `mountBoard(container, adapter, opts)`. The shell owns everything
shared; the adapter supplies only what is puzzle-specific:

| The shell owns | The adapter supplies |
|---|---|
| SVG root + viewBox, fit-to-holder, zoom (buttons, wheel, keys), scroll-bar panning | `world()` — board size |
| Pointer routing + capture; position computed from the pointer | `render(world)` — puzzle SVG for the current state |
| One drag = one undo step; undo/redo stack + keyboard | `hitTest(pt, phase, gesture)` — what a click or drag means |
| Hover layer | `apply` / `unapply` — mutate and undo the model |
| Context-menu and selection suppression | `isSolved()`; optional `hover()`, `onSolved()` |

Why this shape: the differences between puzzles are in *content* (cells + hints vs islands +
bridges), not drawing, so the puzzle-side surface is deliberately tiny — size, draw, and
what-a-click-does. Drag rules that depend on how a gesture started stay in the adapter (`gesture`),
because only the puzzle knows them. The shell never imports puzzle code, so a second puzzle cannot
break the first.

Deliberately **not** in the shell yet (see `backlog.md`): timer, saved progress, solved-notice and
pop-out. They stay in each puzzle's page until a second puzzle needs them, so they are not built
on spec.


### v9.1 addendum — two corrections to the shell interface

- **`onSolved` is supplied by either side.** The first build had the shell call only
  `adapter.onSolved`, while both callers passed `onSolved` in the mount options — so neither
  puzzle's completion message fired. The shell now takes `adapter.onSolved || opts.onSolved`. Rule
  of thumb: a callback the shell *invokes* should be accepted wherever the puzzle finds it
  natural, and the board re-renders after the callback so the puzzle can change its solved look.
- **One scroller, always.** A scrolling page wrapper around a scrolling board box puts the
  board's vertical scroll bar off the right edge of the visible wrapper. The board box is now the
  only scroller, and `.gdp-board-wrap` must stay non-scrolling. Wheel-zoom anchoring keeps using
  `scrollLeft`/`scrollTop` on the board root.


## Addendum (v10, 2026-10-05) — asset versioning, settings dock, and the shared secret lock

- **Asset versioning.** Every first-party CSS/JS URL carries `?v=<GDP_BUILD>`, including every
  local ES-module import edge (a query on the entry module does not propagate). Ctrl+Shift+R
  reloads the document but not its imports, and Pages caches ~10 min, so a new build must be a new
  URL. `↻ Fresh` clears app-owned caches and reloads with a unique query, but cannot purge the
  CDN's copy. Every release must bump `GDP_BUILD`. `check-integration.mjs` strips the query.
- **Settings dock.** The trigger and panel are one fixed element so the tab slides with the drawer;
  this replaced a separate fixed button + offcanvas, which could not move together.
- **Shared secret lock.** `shared/gdp-secret.js` pads the XOR key to exactly the message length,
  because `BitSeq.getXOR` cycles a shorter key and would corrupt the message. New puzzles use it;
  Pictogram/Hashi keep their existing codecs (their published links are unaffected).
