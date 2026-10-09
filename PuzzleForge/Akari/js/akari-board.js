// Akari adapter for the shared board shell. Board colours come from shared resolveChrome().
import { CELL, ACTION_TYPE, isSolved as ruleSolved } from './akari-logic.js?v=13.0.4logic';
const M = 6, CS = 40;
export function createAkariAdapter({ R, C, walls, nums, getGrid, getChrome, getSurface }) {
  const cells = new Array(R * C).fill(CELL.EMPTY);
  const cx = c => M + c * CS + CS / 2, cy = r => M + r * CS + CS / 2;
  function cellAt(pt) { const col=Math.floor((pt.x-M)/CS), row=Math.floor((pt.y-M)/CS); return col>=0&&col<C&&row>=0&&row<R?{row,col}:null; }
  function nextState(from, button) { if(button==='touch') return (from+1)%3; if(button==='right') return from===CELL.MARK?CELL.EMPTY:CELL.MARK; return from===CELL.LAMP?CELL.EMPTY:CELL.LAMP; }
  function litSet(){ const lit=new Uint8Array(R*C); for(let i=0;i<R*C;i++){if(cells[i]!==CELL.LAMP)continue;const r=(i/C)|0,c=i%C;lit[i]=1;const walk=(dr,dc)=>{let rr=r+dr,cc=c+dc;while(rr>=0&&cc>=0&&rr<R&&cc<C){const j=rr*C+cc;if(walls[j])break;lit[j]=1;rr+=dr;cc+=dc;}};walk(-1,0);walk(1,0);walk(0,-1);walk(0,1);}return lit; }
  return {
    world:()=>({width:C*CS+2*M,height:R*CS+2*M}),
    render(){ const lit=litSet(), chrome=getChrome?getChrome():null, surface=chrome?chrome.surface:'var(--gdp-panel)', ink=chrome?chrome.ink:'var(--gdp-fg)', accent=chrome?chrome.accent:'var(--gdp-accent)', accentInk=chrome?chrome.accentInk:'var(--gdp-fg)', grid=chrome?chrome.grid:'var(--gdp-grid)', over=chrome?chrome.over:'var(--gdp-muted)'; let out=(getSurface&&!getSurface())?'':`<rect x="0" y="0" width="100%" height="100%" fill="${surface}"/>`; for(let r=0;r<R;r++)for(let c=0;c<C;c++){const i=r*C+c;if(walls[i]){out+=`<rect x="${M+c*CS}" y="${M+r*CS}" width="${CS}" height="${CS}" fill="${ink}"/>`;if(nums[i]>=0)out+=`<text x="${cx(c)}" y="${cy(r)+6}" text-anchor="middle" font-size="18" font-weight="700" fill="${surface}">${nums[i]}</text>`;}else{if(lit[i])out+=`<rect x="${M+c*CS}" y="${M+r*CS}" width="${CS}" height="${CS}" fill="${accent}" opacity="0.22"/>`;if(cells[i]===CELL.LAMP)out+=`<circle cx="${cx(c)}" cy="${cy(r)}" r="${CS*.28}" fill="${accent}" stroke="${accentInk}" stroke-width="1.5"/>`;else if(cells[i]===CELL.MARK)out+=`<line x1="${cx(c)-6}" y1="${cy(r)-6}" x2="${cx(c)+6}" y2="${cy(r)+6}" stroke="${over}" stroke-width="2"/><line x1="${cx(c)-6}" y1="${cy(r)+6}" x2="${cx(c)+6}" y2="${cy(r)-6}" stroke="${over}" stroke-width="2"/>`;}}
      if(getGrid&&getGrid()){for(let c=0;c<=C;c++)out+=`<line x1="${M+c*CS}" y1="${M}" x2="${M+c*CS}" y2="${M+R*CS}" stroke="${grid}" stroke-width="1"/>`;for(let r=0;r<=R;r++)out+=`<line x1="${M}" y1="${M+r*CS}" x2="${M+C*CS}" y2="${M+r*CS}" stroke="${grid}" stroke-width="1"/>`;}
      return out; },
    hover(_w,pt){const cell=cellAt(pt);if(!cell)return'';const chrome=getChrome?getChrome():null;const h=chrome?chrome.over:'var(--gdp-muted)';return `<rect x="${M+cell.col*CS}" y="${M+cell.row*CS}" width="${CS}" height="${CS}" fill="${h}" opacity="0.18"/>`;},
    hitTest(pt,phase,gesture){const cell=cellAt(pt);if(phase==='down'){if(!cell)return null;const i=cell.row*C+cell.col;if(walls[i])return null;const to=nextState(cells[i],pt.button);return to===cells[i]?null:{type:ACTION_TYPE.CELL,i,from:cells[i],to};}if(!gesture||gesture.type!==ACTION_TYPE.CELL||!cell)return null;const i=cell.row*C+cell.col;if(walls[i])return null;if(pt.button==='touch')return cells[i]!==gesture.to?{type:ACTION_TYPE.CELL,i,from:cells[i],to:gesture.to}:null;return cells[i]===gesture.from?{type:ACTION_TYPE.CELL,i,from:cells[i],to:gesture.to}:null;},
    // Test hook (dev-tools/browser-checks/click-solve.mjs): board-pixel centre of each solution lamp.
    solverClicks(solution){ const out=[]; for(let i=0;i<R*C;i++) if(solution[i]) out.push({x:M+(i%C)*CS+CS/2,y:M+((i/C)|0)*CS+CS/2,button:'left'}); return out; },
    apply:a=>{cells[a.i]=a.to}, unapply:a=>{cells[a.i]=a.from}, isSolved:()=>ruleSolved(R,C,walls,nums,cells), encodeState:()=>cells.join(''), decodeState:s=>{for(let i=0;i<cells.length;i++)cells[i]=(s.charCodeAt(i)-48)||0}, hasAny:()=>cells.some(v=>v!==CELL.EMPTY), reset:()=>cells.fill(CELL.EMPTY), lamps:()=>cells.map(v=>v===CELL.LAMP?1:0)
  };
}
