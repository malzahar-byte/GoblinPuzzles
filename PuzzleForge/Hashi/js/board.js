// Hashi adapter for the shared board shell. Board colours come from shared palette chrome.
const CS = 46, HIT = 24, R = 16;
export function createHashiAdapter({ W, H, islands, edges, solution, getChrome, getSurface, getGrid }) {
    const cx = s => s.c * CS + CS / 2, cy = s => s.r * CS + CS / 2, val = edges.map(() => 0);
    function backdrop(st) {
        let out = '';
        if (getSurface()) out += '<rect x="0" y="0" width="'+W*CS+'" height="'+H*CS+'" fill="'+st.surface+'"/>';
        if (getGrid()) { for (let c=0;c<=W;c++) out += '<line x1="'+c*CS+'" y1="0" x2="'+c*CS+'" y2="'+H*CS+'" stroke="'+st.grid+'" stroke-width="1"/>'; for (let r=0;r<=H;r++) out += '<line x1="0" y1="'+r*CS+'" x2="'+W*CS+'" y2="'+r*CS+'" stroke="'+st.grid+'" stroke-width="1"/>'; }
        return out;
    }
    return {
        world: () => ({width:W*CS,height:H*CS}),
        render() {
            const c=getChrome(), st={surface:c.surface,grid:c.grid,island:c.node,islandFull:c.accent,islandStroke:c.ink,bridge:c.ink,text:c.ink,textFull:c.accentInk,over:c.over};
            const total=islands.map(()=>0); edges.forEach((e,i)=>{total[e.a]+=val[i];total[e.b]+=val[i];});
            let hit='',bridges='',nodes='';
            edges.forEach((e,i)=>{const A=islands[e.a],B=islands[e.b]; hit+='<line data-i="'+i+'" x1="'+cx(A)+'" y1="'+cy(A)+'" x2="'+cx(B)+'" y2="'+cy(B)+'" stroke="transparent" stroke-width="'+HIT+'" pointer-events="stroke" style="cursor:pointer"/>'; const offs=val[i]===1?[0]:val[i]===2?[-4,4]:[]; for(const o of offs){const dx=e.h?0:o,dy=e.h?o:0;bridges+='<line x1="'+(cx(A)+dx)+'" y1="'+(cy(A)+dy)+'" x2="'+(cx(B)+dx)+'" y2="'+(cy(B)+dy)+'" stroke="'+st.bridge+'" stroke-width="2.5"/>';}});
            islands.forEach((s,k)=>{const full=total[k]===s.n,over=total[k]>s.n; nodes+='<circle cx="'+cx(s)+'" cy="'+cy(s)+'" r="'+R+'" fill="'+(full?st.islandFull:st.island)+'" stroke="'+(over?st.over:st.islandStroke)+'" stroke-width="2.5"/><text x="'+cx(s)+'" y="'+(cy(s)+5.5)+'" text-anchor="middle" font-size="16" font-weight="700" fill="'+(full?st.textFull:st.text)+'">'+s.n+'</text>';});
            return backdrop(st)+hit+bridges+nodes;
        },
        hitTest(pt,phase,startAction,ev){ if(phase!=='down') return null; const el=ev.target.closest&&ev.target.closest('[data-i]'); if(!el) return null; const i=Number(el.dataset.i), next=(val[i]+1)%3; if(next>0&&edges[i].cross.some(j=>val[j]>0)) return null; return {type:'bridge',i,from:val[i],to:next}; },
        apply:a=>{val[a.i]=a.to}, unapply:a=>{val[a.i]=a.from}, isSolved:()=>val.every((v,i)=>v===solution[i]), encodeState:()=>val.join(''), decodeState:s=>{for(let i=0;i<val.length;i++)val[i]=(s.charCodeAt(i)-48)||0}, hasAny:()=>val.some(v=>v>0), reset:()=>val.fill(0)
    };
}
