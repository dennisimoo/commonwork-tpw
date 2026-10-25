import {defaultFields,validateFields,customValues,duplicateMatches} from '../public/report-fields.mjs';
import {randomBytes,randomUUID,scrypt as rawScrypt,timingSafeEqual,createHash} from 'node:crypto';
import {promisify} from 'node:util';
import {normalizeActivity,applyRanges,usesRanges,rangeFields} from '../public/impact-core.mjs';
import {normalizeSchedule} from '../public/schedule.mjs';
const scrypt=promisify(rawScrypt),hash=value=>createHash('sha256').update(value).digest('hex'),week=7*24*60*60*1000;
const fail=(status,message)=>{throw Object.assign(Error(message),{status});};
const json=(body,status=200,headers={})=>Response.json(body,{status,headers:{'cache-control':'no-store',...headers}});
const clean=(value,max=150)=>String(value??'').trim().slice(0,max);
export function createWorkspace(db,seed,options={}){
 const fields=async()=>{const row=await get("SELECT value FROM metadata WHERE key='report_fields'");return row?JSON.parse(row.value):defaultFields();};
 const now=()=>new Date().toISOString();
 const stmt=(sql,...args)=>db.prepare(sql).bind(...args);
 const get=(sql,...args)=>stmt(sql,...args).first();
 const all=async(sql,...args)=>(await stmt(sql,...args).all()).results;
 const run=(sql,...args)=>stmt(sql,...args).run();
 const guard=(condition,...args)=>stmt(`INSERT INTO mutation_guards(ok) SELECT CASE WHEN ${condition} THEN 1 ELSE NULL END`,...args);
 const batch=async statements=>{await db.batch([...statements,stmt('DELETE FROM mutation_guards')]);};
 const userFor=async request=>{const token=request.headers.get('cookie')?.split(';').map(s=>s.trim()).find(s=>s.startsWith('afterward_session='))?.slice('afterward_session='.length);if(!token)return null;return await get('SELECT u.id,u.username,u.display_name,u.role,u.organization_id,o.name organization FROM sessions s JOIN users u ON u.id=s.user_id LEFT JOIN organizations o ON o.id=u.organization_id WHERE s.token_hash=? AND s.expires>?',hash(token),Date.now())||null;};
 const requireUser=async request=>{const user=await userFor(request);if(!user)fail(401,'Sign in to continue.');return user;};
 const requireAdmin=async request=>{const user=await requireUser(request);if(user.role!=='admin')fail(403,'This action is for TPW administrators.');return user;};
 const scopedOrg=async (user,requested)=>{if(user.role!=='admin'){if(requested&&requested!==user.organization_id)fail(403,'You can access only your organization.');return user.organization_id;}if(requested&&!await get('SELECT id FROM organizations WHERE id=?',requested))fail(404,'Organization not found.');return requested||null;};
 const cookie=(token,url)=>`afterward_session=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${week/1000}${url.protocol==='https:'?'; Secure':''}`;
 const session=async (user,url)=>{const token=randomBytes(32).toString('hex');await run('DELETE FROM sessions WHERE expires<?',Date.now());await run('INSERT INTO sessions VALUES(?,?,?)',hash(token),user.id,Date.now()+week);return json({user},200,{'set-cookie':cookie(token,url)});};
 const credentials=body=>{const username=clean(body.username,80).toLowerCase(),password=body.password,displayName=clean(body.displayName,100);if(!/^[a-z0-9][a-z0-9._@+-]{2,79}$/.test(username))fail(400,'Use a username of 3–80 letters, numbers, dots or dashes.');if(typeof password!=='string'||password.length<12||password.length>128)fail(400,'Use a password between 12 and 128 characters.');return {username,password,displayName:displayName||username};};
 const passwordHash=async password=>{const salt=randomBytes(16).toString('hex'),derived=await scrypt(password,salt,32);return salt+':'+derived.toString('hex');};
 const verify=async(password,stored)=>{const [salt,digest]=stored.split(':');const actual=await scrypt(password,salt,32),expected=Buffer.from(digest,'hex');return actual.length===expected.length&&timingSafeEqual(actual,expected);};
 const throttle=async(key,request)=>{const time=Date.now(),window=time-10*60*1000,identity=hash((request.headers.get('cf-connecting-ip')||'local')+':'+key);const row=await get('INSERT INTO auth_attempts(key,attempts,window_start) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN window_start<? THEN 1 ELSE attempts+1 END,window_start=CASE WHEN window_start<? THEN excluded.window_start ELSE window_start END RETURNING attempts',identity,time,window,window);if(row.attempts>20)fail(429,'Too many attempts. Try again in ten minutes.');await run('DELETE FROM auth_attempts WHERE window_start<?',time-24*60*60*1000);};
 const reportsFor=async (orgId,onlySubmitted=false)=>(await all(`SELECT r.*,o.name organization,u.display_name updated_name FROM reports r JOIN organizations o ON o.id=r.organization_id LEFT JOIN users u ON u.id=r.updated_by WHERE 1=1 ${orgId?'AND r.organization_id=? ':''}${onlySubmitted?"AND r.published_payload IS NOT NULL ":''}ORDER BY r.updated_at DESC,r.id`,...(orgId?[orgId]:[]))).map(r=>({...JSON.parse(onlySubmitted?r.published_payload:r.payload),organization:r.organization,id:r.id,organization_id:r.organization_id,report_state:r.state,version:r.version,origin:r.origin,updated_at:r.updated_at,updated_by:r.updated_name||'Original workbook'}));
 const preview=async token=>{if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))fail(404,'This invitation is invalid or no longer available.');const invite=await get('SELECT i.*,o.name organization FROM invitations i JOIN organizations o ON o.id=i.organization_id WHERE i.token_hash=?',hash(token));if(!invite||invite.used_at||invite.revoked||invite.expires<Date.now())fail(410,'This invitation has expired or was already used. Ask TPW for a new link.');return invite;};
 async function handle(request){
  const url=new URL(request.url),route=url.pathname,method=request.method;
  try{
   if(!['GET','HEAD'].includes(method)){
    if(request.headers.get('origin')!==url.origin||request.headers.get('sec-fetch-site')==='cross-site')fail(403,'Use this workspace to make changes.');
    if(!request.headers.get('content-type')?.startsWith('application/json'))fail(415,'Send a JSON request.');
   }
   let body={};if(!['GET','HEAD'].includes(method)){const text=await request.text();if(text.length>1024*1024)fail(413,'Request is too large.');try{body=JSON.parse(text);}catch{fail(400,'The request must be valid JSON.');}if(!body||typeof body!=='object'||Array.isArray(body))fail(400,'Send a JSON object.');}
   if(route==='/api/demo'&&method==='GET'){
    const names=[...new Set(seed.records.map(r=>r.organization))];const organizations=await Promise.all(names.map(async name=>await get('SELECT id,name FROM organizations WHERE name=? COLLATE NOCASE',name)));
    return json({...seed,organizations,records:seed.records.map((r,index)=>({...r,id:'workbook-'+index,organization_id:organizations.find(o=>o.name===r.organization).id,report_state:r.status==='Completed'?'submitted':'draft',version:1,origin:'workbook'}))});
   }
   if(route==='/api/me'&&method==='GET')return json({testWorkspace:!!options.testWorkspace,setupTokenRequired:!!options.requireSetupToken,user:await userFor(request),setupRequired:!await get("SELECT id FROM users WHERE role='admin'")});
   if(route==='/api/auth/setup'&&method==='POST'){
    await throttle('setup',request);if(options.requireSetupToken&&(!options.setupToken||typeof body.setupToken!=='string'||hash(body.setupToken)!==hash(options.setupToken)))fail(403,'Enter the TPW setup code.');if(await get("SELECT id FROM users WHERE role='admin'"))fail(403,'The TPW administrator is already set up. Sign in instead.');const c=credentials(body),encoded=await passwordHash(c.password),id=randomUUID();
    await run('INSERT INTO users VALUES(?,?,?,?,?,?,?)',id,c.username,c.displayName,encoded,'admin',null,now());
    return await session(await get('SELECT id,username,display_name,role,organization_id FROM users WHERE id=?',id),url);
   }
   if(route==='/api/auth/login'&&method==='POST'){
    await throttle('login',request);const username=clean(body.username,80).toLowerCase(),password=body.password;if(typeof password!=='string'||password.length>128)fail(400,'Enter your username and password.');const user=await get('SELECT * FROM users WHERE username=? COLLATE NOCASE',username);
    const stored=user?.password_hash||'00000000000000000000000000000000:'+ '0'.repeat(64);const correct=await verify(password,stored);if(!user||!correct)fail(401,'Username or password is incorrect.');return await session({id:user.id,username:user.username,display_name:user.display_name,role:user.role,organization_id:user.organization_id},url);
   }
   if(route==='/api/auth/logout'&&method==='POST'){const token=request.headers.get('cookie')?.match(/(?:^|;\s*)afterward_session=([^;]+)/)?.[1];if(token)await run('DELETE FROM sessions WHERE token_hash=?',hash(token));return json({ok:true},200,{'set-cookie':cookie('',url).replace(`Max-Age=${week/1000}`,'Max-Age=0')});}
   if(route==='/api/invitations/preview'&&method==='POST'){await throttle('invite-preview',request);const invite=await preview(body.token);return json({organization:invite.organization,expires:new Date(invite.expires).toISOString()});}
   if(route==='/api/auth/join'&&method==='POST'){
    await throttle('join',request);await preview(body.token);const c=credentials(body),encoded=await passwordHash(c.password),id=randomUUID();
    const invite=await preview(body.token);if(await get('SELECT id FROM users WHERE username=? COLLATE NOCASE',c.username))fail(409,'That username is already taken.');
    await batch([guard('EXISTS(SELECT 1 FROM invitations WHERE token_hash=? AND used_at IS NULL AND revoked=0 AND expires>?)',hash(body.token),Date.now()),stmt('INSERT INTO users VALUES(?,?,?,?,?,?,?)',id,c.username,c.displayName,encoded,'member',invite.organization_id,now()),stmt('UPDATE invitations SET used_at=? WHERE token_hash=?',now(),hash(body.token))]);
    return await session(await get('SELECT id,username,display_name,role,organization_id FROM users WHERE id=?',id),url);
   }
   const user=await requireUser(request);
   if(route==='/api/fields'&&method==='GET')return json(await fields());
   if(route==='/api/fields'&&method==='PUT'){
    await requireAdmin(request);const previous=await fields();if(body.version!==previous.version)fail(409,'Fields changed in another window. Reload before editing.');
    let next;try{next={version:previous.version+1,fields:validateFields(body.fields,previous)};}catch(error){fail(400,error.message);}
    await batch([guard("COALESCE((SELECT json_extract(value,'$.version') FROM metadata WHERE key='report_fields'),0)=?",previous.version),stmt("INSERT INTO metadata(key,value) VALUES('report_fields',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",JSON.stringify(next))]);return json(next);
   }
   if(route==='/api/organizations'&&method==='GET'){
    await requireAdmin(request);return json({organizations:await all(`SELECT o.*,(SELECT COUNT(*) FROM users u WHERE u.organization_id=o.id) members,(SELECT COUNT(*) FROM reports r WHERE r.organization_id=o.id AND r.published_payload IS NOT NULL) submitted,(SELECT COUNT(*) FROM reports r WHERE r.organization_id=o.id AND r.state='draft') drafts,(SELECT COUNT(*) FROM invitations i WHERE i.organization_id=o.id AND i.used_at IS NULL AND i.revoked=0 AND i.expires>?) invitations FROM organizations o ORDER BY o.name`,Date.now())});
   }
   if(route==='/api/organizations'&&method==='POST'){await requireAdmin(request);const name=clean(body.name);if(name.length<2)fail(400,'Enter the nonprofit’s name.');if(await get('SELECT id FROM organizations WHERE name=? COLLATE NOCASE',name))fail(409,'This nonprofit already exists.');const id=randomUUID();await run('INSERT INTO organizations VALUES(?,?,?)',id,name,now());return json({organization:{id,name}},201);}
   if(route==='/api/invitations'&&method==='POST'){
    await requireAdmin(request);const orgId=await scopedOrg(user,body.organizationId);if(!orgId)fail(400,'Choose an organization.');const token=randomBytes(32).toString('hex'),expires=Date.now()+week;
    await batch([stmt('UPDATE invitations SET revoked=1 WHERE organization_id=? AND used_at IS NULL',orgId),stmt('INSERT INTO invitations VALUES(?,?,?,?,NULL,0)',hash(token),orgId,user.id,expires)]);return json({inviteUrl:url.origin+'/#join/'+token,expires:new Date(expires).toISOString()},201);
   }
   if(route==='/api/reports'&&method==='GET'){const orgId=await scopedOrg(user,url.searchParams.get('organizationId'));return json({records:await reportsFor(orgId),facilities:seed.facilities,organization:user.organization||null});}
   if(route==='/api/impact'&&method==='GET'){
    const orgId=await scopedOrg(user,url.searchParams.get('organizationId'));return json({source:{...seed.source,title:'Saved partner program reports + original TPW workbook',verification:'Submitted partner reports and imported workbook values; not independently verified.'},records:await reportsFor(orgId,true),facilities:seed.facilities,user});
   }
   if(route==='/api/reports/batch'&&method==='POST'){
    const orgId=await scopedOrg(user,body.organizationId);if(!orgId)fail(400,'Choose an organization for these reports.');if(!Array.isArray(body.records)||body.records.length<1||body.records.length>30)fail(400,'Save between 1 and 30 program records at a time.');if(!['draft','submit'].includes(body.intent))fail(400,'Choose save draft or submit.');
    const config=await fields();const org=await get('SELECT name FROM organizations WHERE id=?',orgId);
    const incoming=body.records.map((row,index)=>{if(!row||typeof row!=='object')fail(400,`Row ${index+1} is invalid.`);if(clean(row.program).length<1)fail(400,`Row ${index+1}: enter a program name.`);
     let record;try{row=applyRanges(row);record=normalizeActivity({organization:org.name,program:clean(row.program),facility:clean(row.facility)||'Not yet specified',yard:clean(row.yard,80),status:clean(row.status)||'Planned',start_date:row.start_date||null,end_date:row.end_date||null,program_hours:row.program_hours,participants:row.participants,completions:row.completions,notes:clean(row.notes,3000)});}catch(error){fail(400,`Row ${index+1}: ${error.message}`);}
     if(!['Planned','In Progress','Completed'].includes(record.status))fail(400,`Row ${index+1}: choose a valid schedule status.`);
     if(body.intent==='submit'&&record.status!=='Completed')fail(400,`Row ${index+1}: TPW currently accepts completed cycles only. Keep planned or running courses as drafts.`);
     if(body.intent==='submit'&&(!clean(row.facility)||row.facility==='Not yet specified'||!record.start_date||!record.end_date))fail(400,`Row ${index+1}: facility, start date and end date are required to submit. Save a draft if these are unknown.`);
     for(const key of rangeFields)record[key+'_range']=row[key+'_range'];record.data_basis=['reported','estimated','unknown'].includes(row.data_basis)?row.data_basis:'reported';if(record.data_basis==='estimated'&&!record.notes&&!usesRanges(record))fail(400,`Row ${index+1}: explain estimated counts in Notes.`);
     try{record.schedule=normalizeSchedule(row.schedule);}catch(error){fail(400,`Row ${index+1}: ${error.message}`);}
     if(body.intent==='submit'&&!seed.facilities.includes(record.facility))fail(400,`Row ${index+1}: choose a facility from TPW’s reference list.`);
     if(body.intent==='submit'&&[record.program_hours,record.participants,record.completions].some(v=>v==null)&&!record.notes)fail(400,`Row ${index+1}: explain unavailable course hours or counts in Notes, or save a draft.`);
     try{record.custom_fields=customValues(row,config,body.intent==='submit');}catch(error){fail(400,`Row ${index+1}: ${error.message}`);}
     if(row.id&&typeof row.id!=='string')fail(400,'Invalid report reference.');return {id:row.id||null,version:row.version,record};
    });
    if(new Set(incoming.filter(r=>r.id).map(r=>r.id)).size!==incoming.filter(r=>r.id).length)fail(400,'The same report appears more than once.');
    const existingRows=new Map((await all('SELECT * FROM reports WHERE organization_id=?',orgId)).map(row=>[row.id,row]));
    if(body.intent==='submit'){
     const matches=duplicateMatches(incoming.map(r=>({...r.record,id:r.id})),[...existingRows.values()].map(r=>({...JSON.parse(r.payload),id:r.id})));
     if(matches.length){const reason=typeof body.duplicateReview==='string'?clean(body.duplicateReview,1000):'';if(reason.length<10)return json({error:'Similar courses already exist. Review the matches and explain why these are separate courses before submitting.',code:'duplicates',matches},409);for(const row of incoming)row.record.duplicate_review=reason;}
    }
    const existingInputs=incoming.filter(row=>row.id),statements=[guard("COALESCE((SELECT json_extract(value,'$.version') FROM metadata WHERE key='report_fields'),0)=?",config.version)],savedIds=[];if(existingInputs.length)statements.push(guard(existingInputs.map(()=>"EXISTS(SELECT 1 FROM reports WHERE id=? AND organization_id=? AND version=?)").join(' AND '),...existingInputs.flatMap(row=>[row.id,orgId,row.version??-1])));
    for(const row of incoming){const existing=row.id?existingRows.get(row.id):null;if(row.id&&(!existing||existing.organization_id!==orgId))fail(403,'One of these reports belongs to another organization or no longer exists.');if(existing&&existing.version!==row.version)fail(409,'A report was changed in another window. Reload before editing it.');const id=row.id||randomUUID(),state=body.intent==='submit'?'submitted':'draft',version=existing?existing.version+1:1;

      const previous=existing?JSON.parse(existing.payload):{};const payload={...row.record,custom_fields:{...Object.fromEntries(Object.entries(previous.custom_fields||{}).filter(([id])=>config.fields.some(f=>f.id===id&&!f.active))),...row.record.custom_fields},...(previous.duplicate_review&&!row.record.duplicate_review?{duplicate_review:previous.duplicate_review}:{}),...(existing?.origin==='workbook'?{source_sheet:JSON.parse(existing.payload).source_sheet,source_row:JSON.parse(existing.payload).source_row}:{})};
      if(existing)statements.push(stmt('UPDATE reports SET payload=?,state=?,version=?,updated_at=?,updated_by=?,published_payload=? WHERE id=?',JSON.stringify(payload),state,version,now(),user.id,body.intent==='submit'?JSON.stringify(payload):existing.published_payload,id));else statements.push(stmt('INSERT INTO reports VALUES(?,?,?,?,?,?,?,?,?)',id,orgId,JSON.stringify(payload),state,version,'partner',now(),user.id,body.intent==='submit'?JSON.stringify(payload):null));
      savedIds.push(id);
     }statements.push(stmt(`INSERT INTO audit_events(actor_id,report_id,action,created_at) SELECT ?,id,?,? FROM reports WHERE id IN (${savedIds.map(()=>'?').join(',')})`,user.id,body.intent==='submit'?'submitted':'saved draft',now(),...savedIds));try{await batch(statements);}catch(error){if(/mutation_guards|NOT NULL constraint failed/i.test(error.message))fail(409,'A report was changed in another window. Reload before editing it.');throw error;}return json({records:await reportsFor(orgId),message:body.intent==='submit'?'Reports submitted to TPW.':'Drafts saved. Drafts do not enter coalition totals.'});
   }
   if(route==='/api/reports/audit'&&method==='GET'){const orgId=await scopedOrg(user,url.searchParams.get('organizationId'));return json({events:await all(`SELECT a.action,a.created_at,u.display_name,r.id report_id FROM audit_events a JOIN users u ON u.id=a.actor_id JOIN reports r ON r.id=a.report_id ${orgId?'WHERE r.organization_id=?':''} ORDER BY a.id DESC LIMIT 100`,...(orgId?[orgId]:[]))});}
   return json({error:'Endpoint not found.'},404);
  }catch(error){if(/UNIQUE constraint failed/i.test(error.message))return json({error:'This account or organization already exists.'},409);if(/mutation_guards|NOT NULL constraint failed/i.test(error.message))return json({error:'This invitation or report changed. Reload and try again.'},409);return json({error:error.status?error.message:'The workspace could not complete this request.'},error.status||500);}
 }
 return {handle,userFor};
}
