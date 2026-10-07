import http from 'http'; import fs from 'fs'; import path from 'path';
const root = process.argv[2]; const port = +process.argv[3];
const types = {'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.ico':'image/x-icon'};
http.createServer((req,res)=>{ const u = decodeURIComponent(req.url.split('?')[0]); const f = path.join(root,u);
  if(!f.startsWith(root)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){res.writeHead(404);res.end('nf');return;}
  res.writeHead(200,{'Content-Type':types[path.extname(f)]||'text/plain'}); fs.createReadStream(f).pipe(res);
}).listen(port);
