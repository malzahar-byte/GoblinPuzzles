# Claude_3 report: from "pop-out window" to "one shared board layer"

Written for the next agent. Date: 2026-10-04. Author: Claude_3. This is the only document Claude_3 was asked to produce; it is not part of `notes/` and has not been merged into `overview.md` or `history.md`. The owner decides what goes where.

## 1. Short version

- The owner asked whether a puzzle could pop out into a small always-on-top window (like video picture-in-picture) so people can solve while using other tabs. The answer is yes on desktop browsers (see section 7). That feature is a **by-product**.
- Working out *how* exposed the real issue: **Pictogram and Hashi are built in different ways**, so a pop-out would work easily for one and need extra work for the other. The root cause is the drawing method (p5 canvas vs SVG), not the puzzle.
- The owner's rule: puzzles must not be built from scratch each time. They share styles and quality-of-life (QOL) features, so they must share **one board layer and one drawing method**.
- Direction reached: **model/view split + one shared board layer in `shared/`, drawn as SVG, p5 removed.** The secret-message and link system does not change at all.
- One question is still open: whether SVG is smooth enough at the largest board (60x60). Test numbers are in section 5.

## 2. How the discovery went

1. **Pop-out idea.** Chrome/Edge/Firefox desktop have the *Document Picture-in-Picture* API: an always-on-top window that can hold any HTML, driven by the same page script. Our board element would be moved into it.
2. **First claim (later corrected):** Claude_3 said Pictogram was "harder" because of keyboard shortcuts and a made-up "paint-mode switch". Wrong on both. The owner pointed out that all puzzles use left/right click and dragging, so the difference had to be elsewhere.
3. **The real difference.** In `Pictogram/js/player.js` the sketch uses p5's sketch-level handlers (`p.mousePressed`, `p.mouseDragged`, `p.mouseReleased`, `p.keyPressed`). Hashi (`PuzzleForge/Hashi/play.html`) puts its click handler on the board element itself.
4. **Verified in the p5 file.** The owner uploaded `p5.js` v1.4.0 (4.2 MB, the exact file Pictogram loads from cdnjs). In that file:
   - All input handlers (mouse down/up/move, keys, touch, wheel, resize) are registered on the main page `window` (`_events` table around line 62797; registration loop around 63241 with a comment that a container element doesn't work for key events). A click inside a pop-out window never reaches the sketch unless it is forwarded or the handlers are attached to the canvas.
   - Dragging is not special: "mouse moved while a button is down", tracked by window-level press/release.
   - Mouse position is computed from `clientX` minus the canvas's own `getBoundingClientRect()` and corrected for CSS scaling (around lines 78170-78215), so forwarded events with the same coordinates would still land on the right cell.
   - The draw loop (around 63027-63069) is scheduled with the **main window's** `requestAnimationFrame` and Pictogram never stops it. Browsers pause animation frames in hidden tabs, which is exactly the pop-out use case.
   - Pictogram's file is the debug build (`p5.js`, not `p5.min.js`): the library itself prints a message saying so. Pictogram uses only **19 p5 functions**: `noStroke, fill, noFill, stroke, strokeWeight, strokeCap, rect, line, circle, text, textSize, textAlign, translate, scale, background, createCanvas, resizeCanvas, keyIsDown`, plus the input hooks above.
5. **Why p5 was probably used** (inference only, the upstream player is not in the zip): Pictogram was forked from RosimInc/sg-nonograms. p5 gives an easy "redraw the whole board from state" model, one script tag, built-in mouse buttons and scaling, and a canvas copes with huge grids. Claude_1's work is fine for a normal page. Nobody designed it for a second window.
6. **The owner's insight that changed the direction:** if all puzzles use shared styles and QOL, a mix of drawing methods is not acceptable. Claude_3 had briefly proposed letting each puzzle pick its own renderer (A/B/C options). That contradicted the owner's rule and was withdrawn.

## 3. Research findings

**pzpr.js (engine behind puzz.link).** MIT licence (sabo2/pzprjs and the active fork robx/pzprjs). 100+ puzzle types. Can draw as SVG or canvas, has player/editor/viewer modes, undo/redo, trial mode, a rule check (`puzzle.check()`), runs without a browser in Node, and exposes input as calls (`mouse.moveTo / lineTo / inputEnd`, `key.inputKeys`). Each puzzle type is a separate module providing: input handling, board model, rendering, link encoding, answer checks, tests. **Decision: reference only, not adopted.** Reasons: it needs a `make` build (agent sandboxes have no network), it has its own link format (we would need an adapter per puzzle to convert givens and read answers back as key bits), our puzzles (image-to-nonogram, crossword generator, chained mode) don't fit a pencil-puzzle editor, and we don't know where it attaches listeners or how far it can be restyled. Worth consulting when building Slitherlink/Nurikabe-type input and rule checks.

**SVG vs canvas (generic chart benchmarks, not our boards).** SVG is fine into the low thousands of elements; canvas stays flat at tens of thousands but loses accessibility and per-element events; canvas cost grows with pixel area (matters when zooming), SVG does not care about drawing size. Chart libraries often mix them with a size threshold. These are general guidance, which is why the owner asked for a real test.

**Background tabs.** Most browsers stop `requestAnimationFrame` in hidden tabs and throttle timers. SVG/DOM needs no draw loop, because the browser repaints it by itself in whichever window holds it. A canvas must be redrawn on change from the window that shows it.

**Document PiP facts.** Desktop only: Chrome/Edge 116+ (one source says 130), Firefox 151 (May 2026), not Safari, not mobile. One pop-out window per browser at a time. Opening needs a user click. Stylesheets must be copied into the new window. The window behaves like a blank same-origin window opened with `window.open`. Resizing from code needs a user gesture; the user can resize by hand within browser limits. Fullscreen is disabled inside it. It can steal keyboard focus. No source found on whether the opener tab's animation frames keep running while a pop-out is open, so the design must not depend on it.

## 4. Decision and why

1. **The secret system is independent of drawing.** Creator derives a key from the solution state; the player decrypts with the board's current state (`nono.decryptWithGrid(enc, msgType, grid)`; Hashi: `decryptMessage(enc, values)`). "Solved" in Pictogram is a rule check (`isSolved()` compares runs to the hints), then the grid state is the key. So any renderer works as long as the **state is a plain data structure** that gives the same bits for the solution and for the player's board, ignoring pencil marks (e.g. WHITE and EMPTY count the same). Puzzles must have a **unique** solution, otherwise a different valid answer decrypts to garbage. This invariant must survive the migration unchanged.
2. **Model / View split.** Model = state, moves, solved check, key bits, solver, generator, link codec (pure code, testable in Node, already how the logic is written). View = draws a state and turns pointer events into moves. Pictogram's `player.js` currently mixes both in one ~900-line file.
3. **Shared shell in `shared/`.** Holder, fit-to-window, wheel zoom, scroll-bar panning, drag painting, hover highlight, undo/redo, timer, save points, solved notice and message reveal, pop-out. A puzzle supplies only: what to show, and what a click or drag does.
4. **One drawing method: SVG,** because it fits every requirement we found: pop-out safe (no draw loop), themed by CSS variables, sharp at any zoom, plain text an agent can generate and test offline, no dependency, no build. For grids, do not use one element per cell: draw grid lines as two shapes, create a cell shape only when a cell is marked, and use **one hit area that computes the cell from the pointer position** (this also drives drag painting). If SVG ever proves too slow, the shared layer would switch renderer for **all** puzzles at once behind the same interface; individual puzzles never choose.
5. **p5 is removed** once Pictogram has moved to the shell. Staged plan: (a) build the shell with Hashi as the proving ground (it is still a draft), (b) separate Pictogram's model from its drawing, (c) replace the 19 p5 calls with the shell's SVG view, (d) delete p5 and its 4 MB debug build.
6. **Not changed by any of this:** link formats and versions, XOR-locked secret messages, unique-solution generation, SteamGifts handling, per-puzzle key prefix (`gdp-pictogram:`), the Forge landing page.

## 5. Test page and results

File: `nonogram-svg-board-test.html` (standalone, open in a browser; "Run benchmark" then "Copy results"). It draws a nonogram as SVG with fill/cross by left/right click, drag painting, wheel zoom, fit-to-window.

Measured by Claude_3 in headless Chromium 141 (software rendering, **no GPU, not the owner's computer**):

| Board | SVG elements | Build | Paint all cells | Zoom (avg per frame) | Single click on screen (median) |
|---|---|---|---|---|---|
| 15x15 | 41 | 2 ms | 16 ms | 16.7 ms | 16.7 ms |
| 30x30 | 163 | 7 ms | 30 ms | 18.2 ms | 16.6 ms |
| 45x45 | 348 | 6 ms | 68 ms | 23.4 ms | 16.7 ms |
| 60x60 | 578 | 10 ms | 177 ms | 33.5 ms | 18.8 ms |

Input checks passed with real mouse events (left/right click, left/right drag, clicking a filled cell clears it, wheel zoom, no page errors). One failure on the first run was a mistake in the test script (right-drag started with a left press), not in the page.

**Soft spot:** wheel zoom at 60x60 is about 30 fps in this software-rendered setup. Unknown whether a real GPU fixes it. Possible fixes to try inside the shared layer: scale with a CSS transform instead of resizing the SVG, limit repaint work, hide detail when zoomed out.

**The test page is not feature-complete.** The owner noticed it has no way to click a hint number to grey it out. That is a Pictogram feature the page simply doesn't have yet (see section 6). It also uses its own colours and has not been compared side by side with the current p5 look.

## 6. Features that must migrate (verified in `Pictogram/js/player.js` and `index.html`)

| Feature | How it works today | Needed in the new shared layer |
|---|---|---|
| Fill / mark cells | Left click toggles black, right click toggles white (cross). Touch taps cycle empty/black/white | Same, with pointer events (also covers touch) |
| Drag painting | `handleDragEvent` has rules based on the starting action's from/to values; drags only count over the board | Same rules, with pointer capture so a drag survives leaving the board |
| **Click a hint number to grey it out** | `TOGGLE_HOR_HINT` / `TOGGLE_VER_HINT`; dragging along one hint line toggles several | Hints need hit areas too (not only the grid) |
| Undo / redo | Batched: one drag = one undo step; buttons, Ctrl+Z / Ctrl+Y, arrow keys | Move into the shell as a general action stack |
| Hover row/column highlight | `drawPosHighlight` shades the hovered row and column including the hints | Two moving translucent rectangles (SVG) |
| Zoom | Buttons, +/- keys, arrow up/down, auto-fit on load | Keep, add wheel zoom; fit uses the holder's size, not the window |
| Timer | Counts only while `windowActive()` = tab visible **and focused** | **Must change:** playing in a pop-out would stop the timer. "Active" must include the pop-out window |
| Save point / load point / reset | Shift+S / Shift+L / Shift+R and buttons | Keep; keys stay secondary |
| Saved progress and clear | Prefixed keys `gdp-pictogram:...`, "Clear saved progress..." button with confirm | Keep; each puzzle gets its own prefix |
| Settings | Theme, board palette, empty-square mark style, show-timer checkbox | Keep, shared between puzzles |
| Board size display | `showBoardSize()` | Keep |
| Secret message | Plain text or SteamGifts link; box cleared before filling | Keep exactly; pop-out shows only a "Solved - open full page" notice |
| Keyboard shortcuts | Handled by p5 on the main window | Mouse-only in the pop-out (owner agreed); full keys on the page |

## 7. Pop-out feature (addendum), as agreed with the owner

- Pop-out holds **only the board**; no control strip (owner's decision). Mouse only: left/right click, drag painting, wheel zoom, scroll bars for panning.
- Fit-to-window uses the pop-out's size and refits when it is resized; the wheel zooms around the cursor; dragging is for painting, so panning is by scroll bars.
- On solve, the pop-out shows a "Solved - open full page to see your message" notice; clicking returns the board to the tab where the message is.
- Manual button only, shown only in supporting browsers. Desktop only. Progress and timer need no sync (same page script).
- Not built. No design decision is made about auto-opening on tab switch (extra browser permission rules).

## 8. Claude_3's mistakes and prejudices (so the next agent doesn't repeat them)

1. **Wrong belief about its own limits.** Claude_3 said it could not test browser behaviour in the sandbox, repeatedly, without checking. The sandbox has Playwright and a working headless Chromium 141 (`/opt/pw-browsers`; run with `NODE_PATH=$(npm root -g) node script.js`). Another agent had done headless-browser smoke tests earlier in the project and Claude_3 still did not try. The owner correctly suspected this. **Rule: try the tool once before saying it can't be done, and say what was actually attempted.**
2. **Treated a placeholder as a fact.** The 5-14 size range in the Hashi creator was Claude_3's own precaution, but it later argued "most boards are small" from it. Larger sizes were never attempted, so there was no "trouble generating bigger ones". Decisions must be tested at the largest sizes the owner actually wants. The owner has not yet said the largest Hashi size.
3. **Wrong estimate stated confidently.** Claude_3 estimated 4,500-7,000 SVG elements for a 60x60 board by assuming one element per cell. The real count with the design in section 4 is 578.
4. **Invented a feature.** The "paint-mode switch" does not exist in Pictogram. Claude_3 had not checked the code before describing it.
5. **Explained from memory, then admitted it.** Claude_3 described p5's listener behaviour from memory, then said it couldn't read p5, when it had web tools it never tried on the library file. The facts in section 2 now come from the actual file.
6. **Mis-framed how puzzles differ.** It said puzzles "differ in drawing method", then proposed per-puzzle renderers. The real differences are in *content* (cells + hints, islands + bridges, edges). Drawing should be shared.
7. **Guess presented as analysis.** A first A/B/C options table was shaped like research but was a guess. The research that followed (section 3) is what the decision rests on.
8. **Not logging corrections.** Several corrections were first given only in chat. Wrong numbers in its own `history.md` entries ("3 skipped cases", "5 hand-made solver cases") were corrected with later entries; the correct values are 5 and 3. A zip was briefly deleted before its replacement existed (nothing lost, logged).
9. **Over-long answers.** Claude_3 repeatedly overwrote and confused the owner. Answer the question asked, plainly.

## 9. Open items and what is not verified

- Is SVG smooth at 60x60 on a real computer with a GPU? Owner to run the test page and send the copied results.
- The zoom speed at large sizes may need a different scaling technique (see section 5).
- No canvas renderer or side-by-side comparison was built. It is only needed if SVG fails at 60x60.
- pzpr.js internals (where it attaches listeners, theming) were not read. Game-engine/scene-graph libraries were not evaluated.
- Whether browsers keep the opener tab's animation frames alive while a pop-out is open: unknown, avoided by design.
- Owner has not decided the largest Hashi board size; Hashi draft limits (5-14, plain-text secrets, no saved progress/timer/undo, synchronous creator) still stand.
- Shared helper files (`bitseq.js`, `math-utils.js`) are still copied between Pictogram and Hashi and should move into `shared/` (needs approval, noted earlier).
- Akari: not started. No notes, `overview.md` or `history.md` entries were written for this discussion.

## 10. Owner rules to keep following

All puzzles share styles and QOL; every puzzle gets a secret message using the same XOR-locked method; links stay versioned; do not restructure without approval; report problems with exact steps; record in `history.md` append-only; say what was stubbed or untested; keep answers short and plain.
