import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,sep,extname} from 'node:path';
import {handleResearch} from '../server/research.mjs';
import {createLocalWorkspace as createWorkspace} from '../server/local-database.mjs';
const project=resolve(import.meta.dirname,'..'),root=resolve(project,'public'),port=Number(process.env.PORT||4173);
const seed=JSON.parse(await readFile(resolve(root,'data/collective-impact.json'),'utf8'));
const workspace=createWorkspace(process.env.WORKSPACE_DB||resolve(project,'.local/workspace.sqlite'),seed,{testWorkspace:process.env.WORKSPACE_TEST_MODE==='1'});
const types={'.html':'text/html;charset=utf-8','.css':'text/css;charset=utf-8','.mjs':'text/javascript;charset=utf-8','.json':'application/json;charset=utf-8','.csv':'text/csv;charset=utf-8','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{
 try{
  const host=req.headers.host;if(![`localhost:${port}`,`127.0.0.1:${port}`].includes(host)){res.writeHead(403);res.end('Invalid local host.');return;}
  const url=new URL(req.url,`http://${host}`);
  if(url.pathname.startsWith('/api/')||url.pathname==='/data/collective-impact.json'){
   const body=[];let length=0;for await(const chunk of req){length+=chunk.length;if(length>1024*1024){res.writeHead(413);res.end('Request too large');return;}body.push(chunk);}
   const request=new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Buffer.concat(body)}:{})});let response;
   if(url.pathname==='/data/collective-impact.json')response=Response.json({error:'Use the signed-in dashboard to access program data.'},{status:403});
   else if(url.pathname.startsWith('/api/research')){
    if(!await workspace.userFor(request))response=Response.json({error:'Sign in to research.'},{status:401});
    else{const pool=process.env.EXA_API_KEY?null:JSON.parse(await readFile('/Users/dennis/exa_keys.json','utf8').catch(()=>'{}'));response=await handleResearch(request,{EXA_API_KEY:process.env.EXA_API_KEY||pool?.active_key,OPENAI_API_KEY:process.env.OPENAI_API_KEY,OPENAI_MODEL:process.env.OPENAI_MODEL});}
   }else response=await workspace.handle(request);
   res.writeHead(response.status,{...Object.fromEntries(response.headers),'cache-control':'no-store','x-content-type-options':'nosniff'});res.end(Buffer.from(await response.arrayBuffer()));return;
  }
  const path=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!path.startsWith(root+sep)){res.writeHead(403);res.end();return;}
  const bytes=await readFile(path);res.writeHead(200,{'content-type':types[extname(path)]||'application/octet-stream','cache-control':'no-cache','x-content-type-options':'nosniff','referrer-policy':'no-referrer','content-security-policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'"});res.end(req.method==='HEAD'?undefined:bytes);
 }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Commonwork ready at http://localhost:${port}`));
process.on('SIGTERM',()=>server.close(()=>{workspace.close();process.exit(0);}));
