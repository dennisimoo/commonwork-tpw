import {escapeHTML as esc, number, parseCSV, toCSV} from './core.mjs';
const fields=[['full_name','Full name',true],['organization','Organization',true],['participant_id','Participant reference',false],['program_name','Program',false],['approved_profile_url','Approved profile URL',false]];
let roster=[];
let generation=0;
let evidence=new WeakMap();
let researchResults=new WeakMap();
let dialogController;
export function validateProfileURL(value) {
  if(!String(value??'').trim()) return '';
  try {const url=new URL(String(value).trim());return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}
  catch {return null;}
}
const icon=name=>`<img src="assets/reference/${name}.svg" width="17" height="17" alt="">`;
const initials=name=>name.trim().split(/\s+/).slice(0,2).map(word=>Array.from(word)[0]??'').join('').toUpperCase();
export async function renderRoster({mount,openModal,download}) {
  const token=++generation;
  dialogController?.abort();
  let researchAvailable=false;
  let connectionText='Checking research connection…';
  let parsed=null;
  const state={query:'',organization:'',page:1};
  mount.innerHTML=`<div class="roster"><div class="roster-top"><div><h1>Participant roster</h1><p>Known participants, supplied by their program provider.</p></div><div class="roster-top-actions"><button data-action="template">${icon('link-03')}CSV template</button><button data-action="import">${icon('plus')}Import roster</button><button data-action="clear" ${roster.length?'':'hidden'}>Clear roster</button></div></div>
  <div class="roster-notice">Names come from provider enrollment records, never guesses from masked public datasets. Use an authorized roster without private contact information, government IDs or juvenile personal data. Optional participant references should be internal, non-government labels.</div>
  <input class="roster-file" type="file" accept=".csv,text/csv" aria-label="Choose authorized participant CSV" hidden>
  <div class="roster-message" role="status" aria-live="polite"></div><div class="roster-mapping"></div>
  <div class="roster-content"></div><div class="roster-bottom"><span>Browser tab memory only · disappears on reload</span><span>Research connection: <strong class="roster-research-status">Checking research connection…</strong></span></div></div>`;
  const root=mount.querySelector('.roster'), $=s=>root.querySelector(s);
  const current=()=>token===generation&&root.isConnected&&location.hash==='#participants';
  let visibleRows=[];
  function showMessage(text,error=false){$('.roster-message').textContent=text;$('.roster-message').classList.toggle('roster-error',error);}
  const formatDate=value=>{if(!value)return 'Date not provided';const date=new Date(value);return Number.isNaN(+date)?'Date not provided':date.toLocaleDateString('en-US',{year:'numeric',month:'short',day:'numeric'});};
  function sourcesMarkup(row){
    const response=researchResults.get(row), saved=evidence.get(row)||[];
    return `${saved.length?`<h3>Saved for review <span>${saved.length}</span></h3>${saved.map(source=>`<article class="roster-evidence"><span class="roster-review-status">Needs review · identity match unconfirmed</span><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title||'Public source')} ↗</a><small>Published: ${esc(formatDate(source.publishedDate))} · Retrieved: ${esc(formatDate(source.retrievedAt))}</small>${source.highlights.map(text=>`<p>${esc(text)}</p>`).join('')}</article>`).join('')}`:''}
    ${response?`<h3>Candidate public sources</h3><p class="roster-research-caution">Identity matches are unconfirmed. Review each original source before recording an outcome. No risk or prison outcome is inferred.</p>${response.results.length?response.results.map((source,index)=>`<article class="roster-evidence"><span class="roster-review-status">Identity match unconfirmed</span><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title||'Public source')} ↗</a><small>Published: ${esc(formatDate(source.publishedDate))} · Retrieved: ${esc(formatDate(response.retrievedAt))}</small>${source.highlights.map(text=>`<p>${esc(text)}</p>`).join('')}<button type="button" data-save-source="${index}" ${saved.some(item=>item.url===source.url)?'disabled':''}>${saved.some(item=>item.url===source.url)?'Saved · needs review':'Save for review'}</button></article>`).join(''):'<p>No matching public sources were returned. This does not establish an absence of milestones.</p>'}`:''}`;
  }
  function detail(row){return `<div class="roster-detail" data-roster-detail><span class="roster-eyebrow">PROVIDER-SUPPLIED PARTICIPANT</span><h2>${esc(row.full_name)}</h2><dl>${Object.entries(row).filter(([key])=>key!=='approved_profile_url').map(([key,value])=>`<div><dt>${esc(fields.find(([field])=>field===key)?.[1]??key)}</dt><dd>${esc(value||'Not provided')}</dd></div>`).join('')}</dl>${row.approved_profile_url?`<a href="${esc(row.approved_profile_url)}" target="_blank" rel="noopener noreferrer">Open approved profile ↗</a>`:'<p>No approved profile was supplied. Name-only results need careful identity review.</p>'}<p>A professional profile is a source to review. It does not establish program effects, current employment, prison status or risk.</p><section class="roster-research"><h3>Public professional updates</h3><p>Clicking “Find public updates” sends this participant’s name and any supplied approved professional profile URL to Exa to search public employment and education sources. Organization, program and participant references are not sent.</p><button type="button" data-roster-research data-approved-profile="${Boolean(row.approved_profile_url)}" ${researchAvailable?'':'disabled'}>Find public updates</button><p class="roster-connection">${esc(connectionText)}</p><div class="roster-research-message" role="status" aria-live="polite"></div><div class="roster-research-results">${sourcesMarkup(row)}</div></section></div>`;}
  function openDetail(row){
    dialogController?.abort();dialogController=new AbortController();
    const controller=dialogController;
    openModal(detail(row));
    const pane=document.querySelector('[data-roster-detail]');
    if(!pane)return;
    pane.closest('dialog')?.addEventListener('close',()=>controller.abort(),{once:true,signal:controller.signal});
    pane.addEventListener('click',async event=>{
      const save=event.target.closest('[data-save-source]');
      if(save){
        const response=researchResults.get(row), source=response?.results[Number(save.dataset.saveSource)];
        if(!source)return;
        const saved=evidence.get(row)||[];
        if(!saved.some(item=>item.url===source.url))evidence.set(row,[...saved,{...source,retrievedAt:response.retrievedAt,status:'Needs review'}]);
        pane.querySelector('.roster-research-results').innerHTML=sourcesMarkup(row);return;
      }
      const button=event.target.closest('[data-roster-research]');
      if(!button||button.disabled)return;
      const message=pane.querySelector('.roster-research-message');
      button.disabled=true;button.textContent='Searching public sources…';message.textContent='Searching public professional sources. Results require identity review.';
      try{
        const response=await fetch('/api/research',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({fullName:row.full_name,approvedProfileUrl:row.approved_profile_url}),signal:controller.signal});
        const result=await response.json().catch(()=>({error:'Research returned an unreadable response.'}));
        if(!current()||controller.signal.aborted||!pane.isConnected)return;
        if(!response.ok)throw Error(result.error||`Research request failed (HTTP ${response.status}).`);
        if(!Array.isArray(result.results))throw Error('Research returned an unexpected response. Please try again.');
        const candidates=result.results.filter(source=>source&&validateProfileURL(source.url)).map(source=>({title:String(source.title||'Public source'),url:validateProfileURL(source.url),publishedDate:source.publishedDate||null,highlights:Array.isArray(source.highlights)?source.highlights.filter(text=>typeof text==='string'):[]}));
        researchResults.set(row,{results:candidates,retrievedAt:result.retrievedAt||null});
        pane.querySelector('.roster-research-results').innerHTML=sourcesMarkup(row);
        message.textContent=candidates.length?`${number(candidates.length)} candidate sources found. Identity matches remain unconfirmed.`:'No matching public sources were returned.';
        message.classList.remove('roster-research-error');
      }catch(error){if(!controller.signal.aborted&&current()&&pane.isConnected){message.textContent=error.message;message.classList.add('roster-research-error');}}
      finally{if(!controller.signal.aborted&&current()&&pane.isConnected){button.disabled=!researchAvailable;button.textContent='Find public updates';}}
    },{signal:controller.signal});
  }
  fetch('/api/research/status').then(async response=>{if(!response.ok)throw Error(`HTTP ${response.status}`);return response.json();}).then(status=>{
    if(!current())return;researchAvailable=status.available===true;connectionText=researchAvailable?'Connected · Exa public professional search':'Not connected · research service is not configured';
    $('.roster-research-status').textContent=connectionText;
    const pane=document.querySelector('[data-roster-detail]');if(pane){pane.querySelector('.roster-connection').textContent=connectionText;pane.querySelector('[data-roster-research]').disabled=!researchAvailable;}
  }).catch(()=>{if(current()){$('.roster-research-status').textContent=connectionText='Not connected · research service could not be reached';const pane=document.querySelector('[data-roster-detail]');if(pane)pane.querySelector('.roster-connection').textContent=connectionText;}});
  function render(){
    $('[data-action="clear"]').hidden=!roster.length;
    if(!roster.length){$('.roster-content').innerHTML=`<div class="roster-empty"><span class="roster-empty-icon">${icon('users-01')}</span><h2>Add your participant roster</h2><p>Upload a CSV with a full name and organization for each participant. Program and approved profile links are optional.</p><button class="roster-primary" data-action="import">${icon('plus')}Choose CSV</button><button class="roster-text" data-action="template">Download header-only template</button><small>Up to 10 MB and 50,000 rows. You can map your existing columns after uploading.</small></div>`;return;}
    const q=state.query.trim().toLowerCase();
    visibleRows=roster.filter(row=>(!state.organization||row.organization===state.organization)&&(!q||Object.values(row).join(' ').toLowerCase().includes(q)));
    const pages=Math.max(1,Math.ceil(visibleRows.length/20));state.page=Math.min(state.page,pages);
    const start=(state.page-1)*20, currentRows=visibleRows.slice(start,start+20);
    const organizations=[...new Set(roster.map(row=>row.organization))].sort();
    const existingSearch=$('.roster-search input'),searchFocused=document.activeElement===existingSearch,searchPosition=existingSearch?.selectionStart;
    $('.roster-content').innerHTML=`<div class="roster-toolbar"><label class="roster-search">${icon('search-md')}<input type="search" aria-label="Search participants" placeholder="Search names, organizations, programs…" value="${esc(state.query)}"></label><label class="roster-org">${icon('icon-briefcase')}<select aria-label="Filter by organization"><option value="">All organizations</option>${organizations.map(org=>`<option ${state.organization===org?'selected':''} value="${esc(org)}">${esc(org)}</option>`).join('')}</select></label><button data-action="export">${icon('link-03')}Export full roster</button><button data-action="evidence-export">Export review evidence</button></div>
    <section class="roster-panel"><header><h2>Participants <span>${number(visibleRows.length)}</span></h2><small>Provider records · ${number(organizations.length)} organization${organizations.length===1?'':'s'}</small></header><div class="roster-table-scroll"><table><thead><tr><th>Participant</th><th>Organization</th><th>Program</th><th>Approved source</th><th>Actions</th></tr></thead><tbody>${currentRows.map(row=>{const index=roster.indexOf(row);return `<tr><td><button class="roster-name" data-detail="${index}"><span class="roster-avatar roster-color-${index%4}">${esc(initials(row.full_name))}</span><strong>${esc(row.full_name)}</strong></button></td><td>${esc(row.organization)}</td><td>${esc(row.program_name||'Not provided')}</td><td>${row.approved_profile_url?`<a class="roster-profile" href="${esc(row.approved_profile_url)}" target="_blank" rel="noopener noreferrer">Open approved profile ${icon('link-03')}</a>`:'<span class="roster-muted">Not provided</span>'}</td><td><button class="roster-view" data-detail="${index}">View details ${icon('chevron-right')}</button></td></tr>`;}).join('')||'<tr><td colspan="5" class="roster-no-results">No matching participants. Try another search or organization.</td></tr>'}</tbody></table></div><div class="roster-pagination"><span>${visibleRows.length?`${number(start+1)}–${number(Math.min(start+20,visibleRows.length))} of ${number(visibleRows.length)}`:'0'} participants</span><button data-action="prev" aria-label="Previous page" ${state.page===1?'disabled':''}>${icon('icon-chevron-left')}</button><span>${state.page} / ${pages}</span><button data-action="next" aria-label="Next page" ${state.page===pages?'disabled':''}>${icon('chevron-right')}</button></div></section>`;
    if(searchFocused){$('.roster-search input').focus();if(searchPosition!==null)$('.roster-search input').setSelectionRange(searchPosition,searchPosition);}
  }
  function mapping(){
    $('.roster-mapping').innerHTML=`<section class="roster-map-panel"><h2>Match your columns</h2><p>${number(parsed.rows.length)} rows found. Full name and organization are required. Map only appropriate provider records; unmapped extra fields are retained.</p><div class="roster-map-grid">${fields.map(([key,title,required])=>{const selected=parsed.headers.find(header=>header.toLowerCase().replaceAll(' ','_')===key);return `<label>${title}${required?' *':''}<select data-map="${key}"><option value="">${required?'Choose a column':'Not included'}</option>${parsed.headers.map(header=>`<option value="${esc(header)}" ${header===selected?'selected':''}>${esc(header)}</option>`).join('')}</select></label>`;}).join('')}</div><p class="roster-import-note">Import replaces the current roster. Do not include phone numbers, email addresses, government IDs or juvenile personal data in extra columns.</p><div class="roster-map-actions"><button class="roster-primary" data-action="confirm">Use these columns</button><button data-action="cancel">Cancel</button></div></section>`;
  }
  $('.roster-file').addEventListener('change',async event=>{
    const file=event.target.files[0];event.target.value='';if(!file)return;
    if(file.size>10*1024*1024){showMessage('Choose a CSV no larger than 10 MB.',true);return;}
    try{const text=await file.text();if(!current())return;parsed=parseCSV(text);
      const restricted=parsed.headers.filter(header=>/^(e_?mail(_address)?|phone(_number)?|mobile(_number)?|ssn|social_security(_number)?|cdcr(_number|_id)?|government(_id|_number)?|passport(_number)?|drivers?_?licen[cs]e(_number)?|date_of_birth|dob|birth_?date|home_address|street_address)$/i.test(header.trim().replace(/[\s-]+/g,'_')));
      if(restricted.length){parsed=null;showMessage('Remove private contact, government identifier or birth-date columns before importing this roster.',true);return;}
      showMessage('');mapping();}
    catch(error){if(current())showMessage(error.message,true);}
  });
  root.addEventListener('input',event=>{if(event.target.matches('.roster-search input')){state.query=event.target.value;state.page=1;render();}});
  root.addEventListener('change',event=>{if(event.target.matches('.roster-org select')){state.organization=event.target.value;state.page=1;render();}});
  root.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.detail!==undefined){openDetail(roster[Number(button.dataset.detail)]);return;}
    const action=button.dataset.action;
    if(action==='import')$('.roster-file').click();
    else if(action==='template')download('participant-roster-template.csv',toCSV([],fields.map(([key])=>key)));
    else if(action==='export')download('participant-roster.csv',toCSV(roster,[...new Set(roster.flatMap(row=>Object.keys(row)))]));
    else if(action==='evidence-export'){const saved=roster.flatMap(row=>(evidence.get(row)||[]).map(source=>({full_name:row.full_name,organization:row.organization,title:source.title,url:source.url,published_date:source.publishedDate||'',retrieved_at:source.retrievedAt||'',status:'Needs review',identity_match:'Unconfirmed',highlights:source.highlights.join(' | ')})));if(saved.length)download('participant-evidence-needs-review.csv',toCSV(saved));else showMessage('No public sources have been saved for review yet.');}
    else if(action==='clear'){dialogController?.abort();evidence=new WeakMap();researchResults=new WeakMap();roster=[];parsed=null;state.query='';state.organization='';state.page=1;$('.roster-mapping').innerHTML='';showMessage('Roster cleared from this browser tab.');render();}
    else if(action==='cancel'){parsed=null;$('.roster-mapping').innerHTML='';showMessage('Import cancelled.');}
    else if(action==='prev'||action==='next'){state.page+=action==='prev'?-1:1;render();}
    else if(action==='confirm'){
      const maps=Object.fromEntries([...root.querySelectorAll('[data-map]')].map(select=>[select.dataset.map,select.value]));
      if(!maps.full_name||!maps.organization){showMessage('Choose columns for full name and organization.',true);return;}
      const chosen=Object.values(maps).filter(Boolean);if(new Set(chosen).size!==chosen.length){showMessage('Choose a different source column for each mapped field.',true);return;}
      const imported=[];
      for(let index=0;index<parsed.rows.length;index++){
        const source=parsed.rows[index],row=Object.fromEntries(Object.entries(source).filter(([key])=>!chosen.includes(key)));
        for(const [key] of fields)row[key]=String(source[maps[key]]??'').trim();
        if(!row.full_name||!row.organization){showMessage(`Row ${index+2}: full name and organization cannot be blank.`,true);return;}
        const url=validateProfileURL(row.approved_profile_url);
        if(url===null){showMessage(`Row ${index+2}: approved profile must be a valid HTTPS URL without embedded credentials.`,true);return;}
        row.approved_profile_url=url;imported.push(row);
      }
      dialogController?.abort();evidence=new WeakMap();researchResults=new WeakMap();roster=imported;parsed=null;state.query='';state.organization='';state.page=1;$('.roster-mapping').innerHTML='';showMessage(`${number(roster.length)} participant records loaded in this browser tab.`);render();
    }
  });
  render();
}
