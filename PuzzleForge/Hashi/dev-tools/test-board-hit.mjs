// Hashi board hitTest regression: clicking ON the visible bridge line must produce the same
// action as clicking the gap beside it (the recorded 2026-10-06 defect). Position-based:
// hitTest(pt,phase,startAction,ev) no longer reads ev.target, so ev can be null here.
import { createHashiAdapter } from '../js/board.js';
import { solve } from '../js/hashi-logic.js';

let bad = 0;
const check = (name, ok) => { if (!ok) { bad++; console.log('FAIL', name); } };

const CS = 46;
const ring = [{ r: 0, c: 0, n: 2 }, { r: 0, c: 3, n: 2 }, { r: 3, c: 0, n: 2 }, { r: 3, c: 3, n: 2 }];
const sol = solve(4, 4, ring);
const edges = sol.edges;
const adapter = createHashiAdapter({
    W: 4, H: 4, islands: ring, edges, solution: sol.values,
    getChrome: () => ({ surface: '#fff', grid: '#ccc', node: '#eee', accent: '#0af', ink: '#000', accentInk: '#000', over: '#f00' }),
    getSurface: () => true, getGrid: () => true
});
const cx = s => s.c * CS + CS / 2, cy = s => s.r * CS + CS / 2;
const e0 = edges[0], A = ring[e0.a], B = ring[e0.b];
const mid = { x: (cx(A) + cx(B)) / 2, y: (cy(A) + cy(B)) / 2, button: 'left' };

// 1. mid-edge click (exactly on a drawn bridge) fires edge 0 — the defect was null here.
const a1 = adapter.hitTest(mid, 'down', null, null);
check('click on the bridge midpoint hits it', a1 !== null && a1.i === 0);

// 2. beside it (same hit area) still works: offset a little perpendicular... use a nearby point
const near = { x: mid.x, y: mid.y + 6, button: 'left' };
const a2 = adapter.hitTest(near, 'down', null, null);
check('click 6px off the line still hits edge 0', a2 !== null && a2.i === 0);

// 3. apply/unapply cycle still works and undo restores
adapter.apply(a1);
check('apply sets bridge to 1', adapter.encodeState()[0] === '1');
adapter.unapply(a1);
check('unapply clears it', adapter.encodeState()[0] === '0');

// 4. far away from any edge -> null (empty cell area), and islands count as not-edges only if far
const far = { x: 4 * CS - 4, y: 4 * CS - 4, button: 'left' };
const a3 = adapter.hitTest(far, 'down', null, null);
check('corner click far from edges is null', a3 === null);

// 5. non-down phases are ignored (drag does not paint bridges)
check('move phase returns null', adapter.hitTest(mid, 'move', null, null) === null);

// 6. crossing guard still blocks: build two crossing edges, fill one, second stays null
const cross = [{ r: 1, c: 0, n: 4 }, { r: 1, c: 2, n: 1 }, { r: 0, c: 1, n: 1 }, { r: 2, c: 1, n: 1 }];
const sol2 = solve(3, 3, cross);
if (sol2.count >= 0) {
    const ad2 = createHashiAdapter({
        W: 3, H: 3, islands: cross, edges: sol2.edges, solution: sol2.values,
        getChrome: () => ({}), getSurface: () => true, getGrid: () => true
    });
    const he = sol2.edges.findIndex(e => e.h), ve = sol2.edges.findIndex(e => !e.h);
    if (he >= 0 && ve >= 0 && sol2.edges[he].cross.includes(ve)) {
        const H1 = ring => ring; // noop
        const E1 = sol2.edges[he], A1 = cross[E1.a], B1 = cross[E1.b];
        const m1 = { x: (A1.c * CS + B1.c * CS) / 2 + CS / 2, y: (A1.r * CS + B1.r * CS) / 2 + CS / 2, button: 'left' };
        ad2.apply({ type: 'bridge', i: ve, from: 0, to: 1 });
        const blocked = ad2.hitTest(m1, 'down', null, null);
        check('crossing bridge is not placed (null or no-op)', blocked === null || (blocked.i === he && blocked.to === 0));
    }
}

console.log(bad ? `${bad} hit-test check(s) FAILED` : 'Hashi hit-test checks: all ok');
process.exit(bad ? 1 : 0);
