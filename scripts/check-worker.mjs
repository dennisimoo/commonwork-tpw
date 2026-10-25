import {spawn,execFileSync} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
const cwd=resolve(import.meta.dirname,'..'),dir=await mkdtemp(join(tmpdir(),'commonwork-d1-')),cli=resolve(cwd,'node_modules/wrangler/bin/wrangler.js');
const token='isolated-worker-setup-fixture',port=Number(process.env.TEST_PORT||4176),base=`http://127.0.0.1:${port}`;
let server,log='';
try{
 execFileSync(process.execPath,[cli,'d1','migrations','apply','commonwork-tpw','--local','--persist-to',dir],{cwd,stdio:'pipe',env:{...process.env,CI:'true'}});
 server=spawn(process.execPath,[cli,'dev','--ip','127.0.0.1','--port',String(port),'--persist-to',dir,'--var',`TPW_SETUP_TOKEN:${token}`,'--var','TEST_WORKSPACE:1'],{cwd,stdio:['ignore','pipe','pipe'],env:{...process.env,CI:'true'}});
 server.stdout.on('data',b=>log+=b);server.stderr.on('data',b=>log+=b);
 let ready=false;for(let i=0;i<100;i++){try{const r=await fetch(base+'/api/me');if(r.ok){ready=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,200));}
 assert.ok(ready,'Worker failed to start: '+log);
 const blocked=await fetch(base+'/api/auth/setup',{method:'POST',headers:{origin:base,'content-type':'application/json'},body:JSON.stringify({username:'unauthorized',password:'fixture-password-for-tests'})});assert.equal(blocked.status,403,'Hosted setup requires its separate secret.');
 execFileSync(process.execPath,['scripts/check-workspace.mjs'],{cwd,stdio:'inherit',env:{...process.env,TEST_BASE:base,TEST_SETUP_TOKEN:token}});
 assert.equal((await fetch(base+'/data/collective-impact.json')).status,403);
 assert.equal((await fetch(base+'/api/research/status')).status,401);
 const page=await fetch(base+'/');assert.equal(page.status,200);assert.match(await page.text(),/TPW/);
 console.log('PASS: real Worker + local D1 migrations, setup-code protection, account/invite/report flow, scoped data, protected research and assets.');
}finally{if(server){server.kill('SIGTERM');await new Promise(resolve=>server.once('exit',resolve));}await rm(dir,{recursive:true,force:true});}
