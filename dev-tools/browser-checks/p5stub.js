window.p5 = function(fn){
  const t = { RIGHT_ARROW:39, LEFT_ARROW:37, UP_ARROW:38, DOWN_ARROW:40, CONTROL:17, SHIFT:16, LEFT:'left', RIGHT:'right', CENTER:'center', SQUARE:'square', ROUND:'round', touches:[] };
  const p = new Proxy(t, { get(o,k){ if(k in o) return o[k]; if(k==='createCanvas') return ()=>({parent(){}, touchStarted(){}, elt: document.createElement('canvas')}); return ()=>undefined; }, set(o,k,v){ o[k]=v; return true; } });
  window.__p = p; fn(p); p.setup && p.setup();
};
