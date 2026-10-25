// Exa key is supplied by the server environment. Never return it to the client.
const recentRequests = new Map();
const json = (body,status=200) => new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json;charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'}});
function httpsURL(value){
  try {const u=new URL(String(value));return u.protocol==='https:'&&!u.username&&!u.password?u:null;}catch{return null;}
}
export function researchInput(body){
  if(!body||typeof body.fullName!=='string'||(body.approvedProfileUrl!=null&&typeof body.approvedProfileUrl!=='string'))throw Error('Provide a participant name and, optionally, an approved professional profile URL.');
  const fullName=body.fullName.trim();
  if(fullName.length<2||fullName.length>160||/[\u0000-\u001f]/.test(fullName))throw Error('The participant name must be between 2 and 160 characters.');
  const rawProfile=body.approvedProfileUrl?.trim()||'';
  const profile=rawProfile?httpsURL(rawProfile):null;
  if(rawProfile&&(!profile||rawProfile.length>2048||profile.hostname==='localhost'||/^[\d.:]+$/.test(profile.hostname)||profile.hostname.endsWith('.local')))throw Error('Use an approved public HTTPS professional profile.');
  return {fullName,profile};
}
export async function handleResearch(request,env,fetcher=fetch){
  const url=new URL(request.url);
  if(url.pathname==='/api/research/status')return json({available:!!env.EXA_API_KEY});
  if(request.method!=='POST')return json({error:'Use POST for research.'},405);
  if(request.headers.get('origin')&&request.headers.get('origin')!==url.origin)return json({error:'Research requests must come from this workspace.'},403);
  if(request.headers.get('sec-fetch-site')==='cross-site')return json({error:'Research requests must come from this workspace.'},403);
  if(!env.EXA_API_KEY)return json({error:'The server has no Exa key configured.'},503);
  if(!request.headers.get('content-type')?.includes('application/json'))return json({error:'Send a JSON request.'},415);
  let input;
  try{const text=await request.text();if(text.length>4096)return json({error:'Research request is too large.'},413);input=researchInput(JSON.parse(text));}
  catch(error){return json({error:error instanceof SyntaxError?'The request must contain valid JSON.':error.message},400);}
  // A small per-isolate throttle limits accidental repeated clicks on the private site.
  const identity=request.headers.get('oai-authenticated-user-id')||'private-owner',now=Date.now();
  const recent=(recentRequests.get(identity)||[]).filter(t=>t>now-60000);
  if(recent.length>=20)return json({error:'Please wait a minute before running more searches.'},429);
  recent.push(now);recentRequests.set(identity,recent);
  const query=`"${input.fullName.replaceAll('"',' ')}" professional employment career education biography ${input.profile?.href||''}`;
  try{
    const response=await fetcher('https://api.exa.ai/search',{method:'POST',headers:{'content-type':'application/json','x-api-key':env.EXA_API_KEY},body:JSON.stringify({query,type:'auto',numResults:6,contents:{highlights:true}}),signal:AbortSignal.timeout(25000)});
    if(!response.ok){const status=response.status;return json({error:status===402?'The configured Exa account has no available credits.':status===401?'Exa rejected the configured API key.':status===429?'Exa is rate limiting requests. Please try again shortly.':'Exa could not complete this search.'},status===401||status===402?503:status===429?429:502);}
    const result=await response.json();
    const results=(Array.isArray(result.results)?result.results:[]).slice(0,6).filter(r=>httpsURL(r.url)).map(r=>({title:String(r.title||'Untitled source').slice(0,300),url:httpsURL(r.url).href,publishedDate:typeof r.publishedDate==='string'?r.publishedDate:null,highlights:(Array.isArray(r.highlights)?r.highlights:[]).slice(0,3).map(t=>String(t).slice(0,1600))}));
    return json({results,retrievedAt:new Date().toISOString(),identityMatch:'unconfirmed'});
  }catch(error){return json({error:error.name==='TimeoutError'||error.name==='AbortError'?'Research timed out. Please try again.':'The research service could not be reached.'},502);}
}
