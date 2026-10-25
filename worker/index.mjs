import {createWorkspace} from '../server/workspace.mjs';
import {handleResearch} from '../server/research.mjs';
import seed from '../public/data/collective-impact.json';
import demo from '../public/data/demo-programs.json';
const handlers=new WeakMap();
function workspace(env){let value=handlers.get(env.DB);if(!value){value=createWorkspace(env.DB,seed,{demo,requireSetupToken:true,setupToken:env.TPW_SETUP_TOKEN,testWorkspace:env.TEST_WORKSPACE==='1'});handlers.set(env.DB,value);}return value;}
export default {
 async fetch(request,env){
  const url=new URL(request.url);let response;
  try{
   if(url.pathname==='/data/collective-impact.json')response=Response.json({error:'Use the reporting app or its demo.'},{status:403});
   else if(url.pathname.startsWith('/api/research')){const user=await workspace(env).userFor(request);response=user?await handleResearch(request,env):Response.json({error:'Sign in to use research.'},{status:401});}
   else if(url.pathname.startsWith('/api/'))response=await workspace(env).handle(request);
   else if(!['GET','HEAD'].includes(request.method))response=new Response('Method not allowed',{status:405});
   else response=await env.ASSETS.fetch(request);
  }catch{response=Response.json({error:'The app could not complete this request. Try again.'},{status:500});}
  const headers=new Headers(response.headers);
  headers.set('x-content-type-options','nosniff');headers.set('referrer-policy','no-referrer');headers.set('x-frame-options','DENY');
  headers.set('content-security-policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'");
  if(url.pathname.startsWith('/api/'))headers.set('cache-control','no-store');
  return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
 }
};
