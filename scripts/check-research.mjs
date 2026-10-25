import assert from 'node:assert/strict';
import {handleResearch,researchInput,researchAgent} from '../server/research.mjs';
assert.throws(()=>researchInput({fullName:'Test Name',approvedProfileUrl:'javascript:alert(1)'}));
assert.throws(()=>researchInput({fullName:'Test Name',approvedProfileUrl:'https://localhost/'}));
assert.equal(researchInput({fullName:'Test Name'}).profile,null);
const request=(body,origin='https://example.com')=>new Request('https://example.com/api/research',{method:'POST',headers:{'content-type':'application/json',origin},body:JSON.stringify(body)});
const env={EXA_API_KEY:'exa-test-only',OPENAI_API_KEY:'openai-test-only'},input={fullName:'Test Name',approvedProfileUrl:'https://example.org/profile'};
assert.equal((await handleResearch(request(input),{})).status,503);
assert.equal((await handleResearch(request(input,'https://other.example'),env)).status,403);
let rounds=0,searches=0;
const result=await researchAgent(researchInput(input),env,async(url,options)=>{
 const body=JSON.parse(options.body);
 if(url==='https://api.exa.ai/search'){
  searches++;assert.match(body.query,/Test Name/);assert.equal(body.type,'fast');
  return Response.json({results:[{title:'Professional source',url:'https://example.org/profile',text:'A reported education milestone.'},{url:'javascript:alert(1)'}]});
 }
 assert.equal(url,'https://api.openai.com/v1/responses');assert.equal(body.store,false);
 rounds++;
 if(rounds===1)return Response.json({output:[{type:'function_call',name:'exa_search',call_id:'call_test',arguments:JSON.stringify({query:'education professional'})}]});
 assert.equal(body.input.at(-1).call_id,'call_test');
 return Response.json({output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({summary:'A public story.',identity_assessment:'Review required',milestones:[{label:'Education',detail:'Reported milestone',date:'2020',source_ids:[1]},{label:'Invented citation',detail:'Must be dropped',date:'2021',source_ids:[999]}],limitations:'No program effect established.'})}]}]});
});
assert.equal(rounds,2);assert.equal(searches,1);assert.equal(result.results.length,1);assert.equal(result.report.milestones.length,1);assert.equal(result.identityMatch,'unconfirmed');assert.equal(result.trace[0].tool,'exa_search');assert.ok(!JSON.stringify(result).includes('test-only'));
const failed=await handleResearch(request(input),env,async()=>new Response('',{status:401}));assert.equal(failed.status,502);assert.match((await failed.json()).error,/OpenAI rejected/);
console.log('PASS: real agent protocol, tool anchoring, citation allowlist, bounded search, origin boundary, explicit failures and secret-free responses.');
