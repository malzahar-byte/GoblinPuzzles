// Goblin Does Puzzles — shared grid-puzzle colour palettes.
//
// Generic concepts usable by any grid-based logic puzzle, not just nonograms:
//   - a themed page/board background, and a "solved" background for a celebratory state
//   - a checkerboard set of base cell colours (for alternating blocks, like sudoku boxes)
//   - two cell STATES a puzzle can tint differently from an empty cell — "confirmed" (this
//     cell is definitely part of the solution) and "excluded" (definitely not), each with its
//     own colour-mix amount, plus a solid colour for whatever symbol marks an excluded cell
//   - text/muted-text colours for clue numbers or labels drawn on the board
//   - thin/thick grid line colours, and a hover-highlight colour
//
// A puzzle-specific module (e.g. Pictogram's js/util/board-styles.js) decides which of its own
// cell values map to "confirmed" / "excluded" and calls buildCellFill() to get a ready-to-draw
// lookup table. This file knows nothing about any single puzzle's rules.

export const PALETTES = {
    classic: { label: 'Classic (follows theme)',
        light: {
            bg: [225, 225, 225], solvedBg: [100, 200, 100],
            text: [0, 0, 0], textMuted: [150, 150, 150],
            cells: [[200, 255, 165], [200, 215, 165], [165, 255, 200], [165, 215, 200]],
            confirmedMix: [0, 0, 125], confirmedT: 0.9,
            excludedMix: [255, 255, 255], excludedT: 0.5, excludedColor: [160, 0, 0],
            lineThin: [0, 0, 0], lineThick: [0, 0, 0],
            hover: [0, 0, 0, 70]
        },
        dark: {
            bg: [44, 47, 56], solvedBg: [40, 110, 60],
            text: [235, 235, 235], textMuted: [110, 110, 118],
            cells: [[58, 64, 72], [52, 58, 66], [50, 68, 62], [44, 62, 56]],
            confirmedMix: [120, 180, 255], confirmedT: 0.92,
            excludedMix: [0, 0, 0], excludedT: 0.35, excludedColor: [255, 120, 120],
            lineThin: [20, 20, 24], lineThick: [190, 190, 196],
            hover: [255, 255, 255, 45]
        }
    },
    paper: { label: 'Paper', both: {
        bg: [238, 228, 204], solvedBg: [190, 215, 160],
        text: [60, 40, 25], textMuted: [175, 160, 140],
        cells: [[250, 244, 228], [244, 236, 214], [246, 240, 222], [240, 232, 208]],
        confirmedMix: [55, 38, 28], confirmedT: 0.93,
        excludedMix: [255, 255, 255], excludedT: 0.3, excludedColor: [160, 50, 30],
        lineThin: [190, 175, 150], lineThick: [90, 70, 50],
        hover: [90, 60, 20, 45] } },
    chalkboard: { label: 'Chalkboard', both: {
        bg: [34, 52, 44], solvedBg: [50, 100, 70],
        text: [235, 235, 220], textMuted: [110, 130, 120],
        cells: [[48, 72, 60], [42, 64, 53], [46, 70, 58], [40, 62, 51]],
        confirmedMix: [240, 240, 228], confirmedT: 0.93,
        excludedMix: [0, 0, 0], excludedT: 0.25, excludedColor: [255, 190, 120],
        lineThin: [90, 120, 105], lineThick: [220, 225, 210],
        hover: [255, 255, 255, 40] } },
    ocean: { label: 'Ocean', both: {
        bg: [214, 232, 246], solvedBg: [140, 210, 190],
        text: [10, 40, 80], textMuted: [140, 165, 190],
        cells: [[232, 244, 252], [220, 236, 248], [226, 242, 250], [214, 232, 246]],
        confirmedMix: [10, 50, 110], confirmedT: 0.93,
        excludedMix: [255, 255, 255], excludedT: 0.35, excludedColor: [200, 60, 60],
        lineThin: [150, 180, 210], lineThick: [20, 60, 110],
        hover: [0, 60, 120, 45] } },
    contrast: { label: 'High contrast', both: {
        bg: [222, 226, 234], solvedBg: [120, 220, 120],
        text: [0, 0, 0], textMuted: [150, 150, 150],
        cells: [[255, 255, 255], [238, 238, 238], [255, 255, 255], [238, 238, 238]],
        confirmedMix: [0, 0, 0], confirmedT: 1,
        excludedMix: [255, 255, 255], excludedT: 0, excludedColor: [200, 0, 0],
        lineThin: [120, 120, 120], lineThick: [0, 0, 0],
        hover: [0, 0, 0, 40] } },
    sunset: { label: 'Sunset', both: {
        bg: [255, 226, 199], solvedBg: [255, 183, 140],
        text: [92, 34, 46], textMuted: [196, 140, 120],
        cells: [[255, 236, 214], [255, 224, 196], [255, 219, 204], [255, 207, 186]],
        confirmedMix: [172, 40, 70], confirmedT: 0.88,
        excludedMix: [255, 255, 255], excludedT: 0.3, excludedColor: [140, 30, 60],
        lineThin: [230, 160, 120], lineThick: [160, 70, 60],
        hover: [172, 40, 70, 45] } },
    forest: { label: 'Forest', both: {
        bg: [36, 50, 40], solvedBg: [40, 90, 55],
        text: [222, 232, 214], textMuted: [120, 140, 120],
        cells: [[40, 58, 44], [34, 52, 40], [38, 56, 42], [32, 50, 38]],
        confirmedMix: [196, 212, 120], confirmedT: 0.9,
        excludedMix: [0, 0, 0], excludedT: 0.3, excludedColor: [230, 150, 90],
        lineThin: [60, 86, 64], lineThick: [150, 180, 130],
        hover: [196, 212, 120, 40] } },
    candy: { label: 'Candy', both: {
        bg: [244, 208, 236], solvedBg: [200, 235, 190],
        text: [90, 40, 90], textMuted: [210, 170, 205],
        cells: [[255, 244, 250], [250, 236, 246], [244, 238, 252], [238, 230, 250]],
        confirmedMix: [214, 70, 150], confirmedT: 0.85,
        excludedMix: [255, 255, 255], excludedT: 0.25, excludedColor: [120, 110, 220],
        lineThin: [236, 198, 224], lineThick: [196, 110, 170],
        hover: [214, 70, 150, 40] } },
    neon: { label: 'Neon', both: {
        bg: [34, 34, 56], solvedBg: [20, 70, 60],
        text: [120, 240, 255], textMuted: [90, 100, 120],
        cells: [[24, 24, 36], [20, 20, 30], [22, 22, 34], [18, 18, 28]],
        confirmedMix: [255, 50, 200], confirmedT: 0.95,
        excludedMix: [0, 0, 0], excludedT: 0.2, excludedColor: [80, 255, 180],
        lineThin: [40, 40, 56], lineThick: [120, 240, 255],
        hover: [255, 50, 200, 50] } },
    mono: { label: 'Mono (grayscale)', both: {
        bg: [224, 226, 231], solvedBg: [205, 205, 205],
        text: [0, 0, 0], textMuted: [160, 160, 160],
        cells: [[248, 248, 248], [238, 238, 238], [248, 248, 248], [238, 238, 238]],
        confirmedMix: [0, 0, 0], confirmedT: 1,
        excludedMix: [255, 255, 255], excludedT: 0, excludedColor: [90, 90, 90],
        lineThin: [150, 150, 150], lineThick: [0, 0, 0],
        hover: [0, 0, 0, 45] } }
};

// Resolves a palette id + current theme ('light'/'dark') to one concrete colour set.
export function resolvePalette(paletteId, theme) {
    const p = PALETTES[paletteId] || PALETTES.classic;
    return p.both || p[theme] || p.dark;
}

const mix = (a, b, t) => [0, 1, 2].map(i => Math.round(a[i] * (1 - t) + b[i] * t));

// Builds a [checkerIndex][state] -> [r,g,b] lookup. `states` lists the extra states in the
// order a puzzle wants them (state 0 is reserved for "no state", i.e. the plain cell colour).
// Each entry is {mix: [r,g,b], t: 0..1}.
//
// A cell that is not filled must still read as a cell, so each base is lifted away from the board
// background when the palette's own value is too close to it (forest and sunset were 5 and 8 steps
// away, which draws an invisible cell — decisions/0006).
export function buildCellFill(palette, states) {
    const bg = palette.bg || palette.cells[0];
    return palette.cells.map((base) => {
        const visible = asApart(base, bg, 10);
        return [visible, ...states.map((s) => mix(visible, s.mix, s.t))];
    });
}

// ---- Board chrome: every colour a puzzle's BOARD needs (not its cells). ----
//
// The palettes were written by agents in passing and several of their values drew things a player
// could not see. Rather than hand-tuning sixty numbers, every role that must be *visible* is derived
// here with its floor built in (decisions/0006): the value moves along its own lightness axis, hue
// untouched, until it clears the floor. `dev-tools/check-palettes.mjs` re-measures all of it, so the
// guarantee is checked rather than assumed.
const rgb = (c) => 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')';
const luminance = (c) => (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
const srgb = (s) => s.match(/rgb\((\d+),(\d+),(\d+)\)/).slice(1).map(Number);
const lin = (v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
const relLum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const contrast = (a, b) => { const x = relLum(a), y = relLum(b); const hi = Math.max(x, y), lo = Math.min(x, y); return (hi + 0.05) / (lo + 0.05); };
const distance = (a, b) => (Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2])) / 3;

// One lightness step (1/255) toward white or black — hue and saturation are preserved by scaling
// all three channels by the same amount.
const lighten = (c, step) => c.map(v => Math.min(255, Math.max(0, v + step)));
function walk(fg, bg, ok, direction) {
    const step = direction === 'lighter' ? 1 : -1;
    let c = fg;
    for (let i = 0; i < 255; i++) {
        if (ok(c)) return c;
        const next = lighten(c, step);
        if (next[0] === c[0] && next[1] === c[1] && next[2] === c[2]) break;   // hit black or white
        c = next;
    }
    return c;
}
// WCAG floors: 4.5 for text on the board, 3 for a graphic or a large label (1.4.11), 1.6 for the
// thin grid (a line, not text), 8-12 distance for "these two things must look different".
const asText = (fg, bg, min) => {
    if (contrast(fg, bg) >= min) return fg;
    // Move away from the board: darker if the board is light, lighter if the board is dark.
    return walk(fg, bg, c => contrast(c, bg) >= min, relLum(bg) > 0.5 ? 'darker' : 'lighter');
};
const asApart = (fg, bg, min) => (distance(fg, bg) >= min ? fg : walk(fg, bg, c => distance(c, bg) >= min, relLum(bg) > 0.5 ? 'darker' : 'lighter'));
const tint = (bg, fg, min) => {
    // A wash of `fg` over `bg`, just strong enough to read as a different state.
    for (let t = 0.06; t <= 0.5; t += 0.01) { const c = mix(bg, fg, t); if (distance(c, bg) >= min) return c; }
    return mix(bg, fg, 0.5);
};
const RED = { light: [176, 34, 46], dark: [255, 116, 116] };
const GREEN = { light: [24, 122, 60], dark: [124, 224, 152] };

function chromeFrom(p, theme) {
    // The board surface is the palette's own board background (`bg`), NOT a cell colour. It used to
    // be `cells[0]`, which made the board nearly invisible in several styles — the owner's "Show
    // board background does not work in many styles" (2026-10-09).
    const surface = p.bg || p.cells[0];
    const ink = asText(p.text, surface, 4.5);
    // The accent marker: it must stand off the board AND carry legible ink on top. Move it along its
    // own lightness away from the board, then pick black or white ink and keep moving until the pair
    // is legible — candy and neon used to draw 4.21 and 3.21 ink on their accents.
    const away = relLum(surface) > 0.5 ? 'darker' : 'lighter';
    const accentInkRaw = away === 'darker' ? [255, 255, 255] : [0, 0, 0];
    const accent = walk(p.confirmedMix, surface,
        (c) => contrast(c, surface) >= 3 && contrast(accentInkRaw, c) >= 4.5, away);
    const accentInk = accentInkRaw;
    const mark = asText(p.excludedColor, surface, 3);
    // The pointer highlight must be noticeable against the board; if the palette's is too close, pull
    // it toward the accent (still the palette's own family, no invented colour).
    const hoverFlat = srgb(rgb(mix(surface, p.hover.slice(0, 3), (p.hover[3] ?? 255) / 255)));
    const over = distance(hoverFlat, surface) >= 8 ? hoverFlat : mix(hoverFlat, accent, 0.45);
    return {
        surface: rgb(surface),
        grid: rgb(asText(p.lineThin, surface, 1.6)),          // "Show grid" must show a grid
        gridThick: rgb(asText(p.lineThick, surface, 3)),      // block separators / the frame
        ink: rgb(ink),
        muted: rgb(asText(p.textMuted, surface, 3)),
        node: rgb(mix(surface, ink, 0.16)),
        accent: rgb(accent),
        accentInk: rgb(accentInk),
        mark: rgb(mark),                                      // x / dot on an excluded cell
        markCandidate: rgb(asText(mix(surface, ink, 0.55), surface, 3)),   // the "(?)" pencil mark
        given: rgb(tint(surface, ink, 12)),                   // a pre-filled cell, as a wash
        error: rgb(asText(RED[theme] || RED.light, surface, 3)),          // breaks a rule
        satisfied: rgb(asText(GREEN[theme] || GREEN.light, surface, 3)),  // row/column count met
        over: rgb(over),
        solved: rgb(asText(p.solvedBg, surface, 1.6))
    };
}
export function resolveChrome(paletteId, theme) {
    const p = PALETTES[paletteId] || PALETTES.classic;
    return chromeFrom(p.both || p[theme] || p.dark, theme === 'dark' ? 'dark' : 'light');
}
