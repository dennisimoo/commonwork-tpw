import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {handleResearch} from '../server/research.mjs';
const root=resolve(import.meta.dirname,'../public'),port=Number(process.env.PORT||4173);
const types={'.html':'text/html;charset=utf-8','.css':'text/css;charset=utf-8','.mjs':'text/javascript;charset=utf-8','.json':'application/json;charset=utf-8','.csv':'text/csv;charset=utf-8','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
  try{
    const url=new URL(req.url,`http://localhost:${port}`);
    if(url.pathname.startsWith('/api/research')){
      const pool=process.env.EXA_API_KEY?null:JSON.parse(await readFile('/Users/dennis/exa_keys.json','utf8').catch(()=>'{}'));
      const body=[];for await(const chunk of req){body.push(chunk);if(body.reduce((n,b)=>n+b.length,0)>4096){res.writeHead(413);res.end('Request too large');return;}}
      const request=new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(body)}:{})});
      const response=await handleResearch(request,{EXA_API_KEY:process.env.EXA_API_KEY||pool?.active_key,OPENAI_API_KEY:process.env.OPENAI_API_KEY,OPENAI_MODEL:process.env.OPENAI_MODEL});res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
    }
    const path=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
    if(!path.startsWith(root+sep)){res.writeHead(403);res.end();return;}
    const bytes=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream','cache-control':'no-cache','x-content-type-options':'nosniff'});res.end(req.method==='HEAD'?undefined:bytes);
  }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Afterward research server ready at http://localhost:${port}`));
