// Goblin Does Puzzles — shared SVG board shell.
//
// One board layer for every puzzle (notes/decisions/0001-svg-board-migration.md). The shell owns
// what every puzzle shares: the SVG element, fit-to-holder, zoom, scroll-bar panning, pointer
// events, hover highlighting, drag painting (one drag = one undo step), undo/redo and the
// keyboard shortcuts for those. A puzzle supplies an adapter — its board size, how it draws
// itself, and what a click or drag does. The shell never imports puzzle code.
//
// Adapter shape (all coordinates are unzoomed board pixels):
//
//   world()  -> { width, height }
//   render(world) -> string
//   hitTest(pt, phase, startAction, ev) -> action | null
//   apply(action) / unapply(action)
//   isSolved() -> boolean
//   onSolved()                  optional; called once, first time isSolved() is true
//   hover(world, pt) -> string  optional; hover-highlight SVG layer
//
// Options: onHistoryChange(undo, redo), onChange(), onKey(ev), onSolved(), min/maxZoom, zoomStep.
// onSolved may be supplied by the adapter or by the options — either works.
const NS = 'http://www.w3.org/2000/svg';
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function mountBoard(container, adapter, opts = {}) {
    const MIN_ZOOM = opts.minZoom ?? 0.2;
    const MAX_ZOOM = opts.maxZoom ?? 8;
    const ZOOM_STEP = opts.zoomStep ?? 1.2;
    const onSolved = adapter.onSolved || opts.onSolved;
    const world = adapter.world();

    const root = document.createElement('div');
    root.className = 'gdp-board';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'gdp-board-svg');
    svg.setAttribute('viewBox', `0 0 ${world.width} ${world.height}`);
    const content = document.createElementNS(NS, 'g');
    const hoverLayer = document.createElementNS(NS, 'g');
    hoverLayer.setAttribute('class', 'gdp-board-hover');
    svg.append(content, hoverLayer);
    root.append(svg);
    container.append(root);

    let zoom = 1;
    let ended = false;
    let gesture = null;
    let batch = [];
    const undoStack = [];
    const redoStack = [];

    function render() {
        content.innerHTML = adapter.render(world);
        notifyHistory();
    }
    function notifyHistory() { if (opts.onHistoryChange) opts.onHistoryChange(undoStack.length, redoStack.length); }

    function setZoom(z) {
        zoom = clamp(z, MIN_ZOOM, MAX_ZOOM);
        svg.setAttribute('width', Math.round(world.width * zoom));
        svg.setAttribute('height', Math.round(world.height * zoom));
    }
    function fit() {
        const avail = root.clientWidth || world.width;
        setZoom(avail / world.width);
    }
    function zoomIn() { setZoom(zoom * ZOOM_STEP); }
    function zoomOut() { setZoom(zoom / ZOOM_STEP); }

    function pointFrom(ev) {
        const r = svg.getBoundingClientRect();
        const scale = r.width / world.width;
        const button = ev.pointerType === 'touch' ? 'touch' : ev.button === 2 ? 'right' : 'left';
        return { x: (ev.clientX - r.left) / scale, y: (ev.clientY - r.top) / scale, button };
    }

    function finishGesture() {
        if (batch.length) { undoStack.push(batch); redoStack.length = 0; }
        batch = [];
        gesture = null;
        notifyHistory();
        if (opts.onChange) opts.onChange();
    }

    function act(action) {
        if (!action) return;
        adapter.apply(action);
        batch.push(action);
        render();
        if (opts.onChange) opts.onChange();
        if (!ended && adapter.isSolved()) {
            ended = true;
            finishGesture();
            if (onSolved) onSolved();
            render(); // re-render after the callback: a puzzle may change its own solved look
        }
    }

    svg.addEventListener('pointerdown', (ev) => {
        if (ended || (ev.button !== 0 && ev.button !== 2)) return;
        if (ev.pointerType === 'touch') ev.preventDefault();
        const action = adapter.hitTest(pointFrom(ev), 'down', null, ev);
        if (!action) return;
        gesture = action;
        if (svg.setPointerCapture) svg.setPointerCapture(ev.pointerId);
        act(action);
    });
    svg.addEventListener('pointermove', (ev) => {
        if (ended) return;
        const pt = pointFrom(ev);
        if (gesture && ev.buttons) act(adapter.hitTest(pt, 'move', gesture, ev));
        else if (adapter.hover) hoverLayer.innerHTML = adapter.hover(world, pt) || '';
    });
    svg.addEventListener('pointerup', finishGesture);
    svg.addEventListener('pointercancel', finishGesture);
    svg.addEventListener('pointerleave', () => { hoverLayer.innerHTML = ''; });
    svg.addEventListener('contextmenu', (ev) => ev.preventDefault());
    svg.addEventListener('wheel', (ev) => {
        ev.preventDefault();
        const r0 = svg.getBoundingClientRect();
        const boardX = (ev.clientX - r0.left) / (r0.width / world.width);
        const boardY = (ev.clientY - r0.top) / (r0.height / world.height);
        setZoom(zoom * (ev.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP));
        const r1 = svg.getBoundingClientRect();
        root.scrollLeft += boardX * (r1.width / world.width) - (ev.clientX - r1.left);
        root.scrollTop += boardY * (r1.height / world.height) - (ev.clientY - r1.top);
    }, { passive: false });

    function undo() {
        finishGesture();
        const group = undoStack.pop();
        if (!group) return;
        for (const a of group) adapter.unapply(a);
        redoStack.push(group);
        render();
        if (opts.onChange) opts.onChange();
    }
    function redo() {
        finishGesture();
        const group = redoStack.pop();
        if (!group) return;
        for (const a of group) adapter.apply(a);
        undoStack.push(group);
        render();
        if (opts.onChange) opts.onChange();
    }
    function clearHistory() {
        undoStack.length = 0;
        redoStack.length = 0;
        batch = [];
        gesture = null;
        ended = false;
        notifyHistory();
    }

    function onKey(ev) {
        if (ev.target && /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName)) return;
        const mod = ev.ctrlKey || ev.metaKey;
        if (mod && ev.key.toLowerCase() === 'z') { undo(); ev.preventDefault(); }
        else if (mod && ev.key.toLowerCase() === 'y') { redo(); ev.preventDefault(); }
        else if (ev.key === 'ArrowLeft') undo();
        else if (ev.key === 'ArrowRight') redo();
        else if (ev.key === 'ArrowUp' || ev.key === '+') zoomIn();
        else if (ev.key === 'ArrowDown' || ev.key === '-') zoomOut();
        else if (opts.onKey) opts.onKey(ev);
    }
    document.addEventListener('keydown', onKey);

    render();
    fit();
    // A puzzle restored already solved (saved progress) starts locked, not just with its message.
    if (adapter.isSolved()) ended = true;

    return {
        root, svg, render, fit, zoomIn, zoomOut, undo, redo, clearHistory,
        getZoom: () => zoom,
        isSolved: () => ended
    };
}
